"""
Management command: send_motivation_email
Run 2-3x/week (e.g. Mon/Wed/Fri at 9 AM UTC).
AI analyzes each user's recent activity and writes a personalized motivational email.
"""
import datetime
from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from django.utils import timezone
from django.db.models import Sum
from groq import Groq
from core.emails import send_motivation_email
from core.models import Contribution, TopicProgress, UserProfile, Flashcard
from core.views import GROQ_DEFAULT_MODEL
import os, logging

logger = logging.getLogger("core")


def _build_user_context(user):
    today = timezone.now().date()
    seven_days_ago = timezone.now() - datetime.timedelta(days=7)

    profile = UserProfile.objects.filter(user=user).first()
    streak = profile.current_streak if profile else 0

    weekly_xp = Contribution.objects.filter(
        user=user, created_at__gte=seven_days_ago
    ).aggregate(Sum('points'))['points__sum'] or 0

    total_xp = Contribution.objects.filter(user=user).aggregate(Sum('points'))['points__sum'] or 0

    completed_this_week = TopicProgress.objects.filter(
        user=user, status='completed', completed_at__gte=seven_days_ago
    ).count()

    total_completed = TopicProgress.objects.filter(user=user, status='completed').count()

    due_cards = Flashcard.objects.filter(user=user, next_review_date__lte=today).count()

    in_progress = TopicProgress.objects.filter(
        user=user, status='in_progress'
    ).select_related('topic').first()
    current_topic = in_progress.topic.title if in_progress else None

    return {
        "username": user.first_name or user.username,
        "streak": streak,
        "weekly_xp": weekly_xp,
        "total_xp": total_xp,
        "completed_this_week": completed_this_week,
        "total_completed": total_completed,
        "due_cards": due_cards,
        "current_topic": current_topic,
    }


def _generate_motivation(ctx):
    client = Groq(api_key=os.environ.get("GROQ_API_KEY", ""))

    prompt = f"""You are GrowthOS, an elite AI learning mentor. Write a short, punchy motivational email for a developer learner.

User data:
- Name: {ctx['username']}
- Current streak: {ctx['streak']} days
- XP this week: {ctx['weekly_xp']}
- Total XP: {ctx['total_xp']}
- Topics completed this week: {ctx['completed_this_week']}
- Total topics completed: {ctx['total_completed']}
- Flashcards due: {ctx['due_cards']}
- Currently studying: {ctx['current_topic'] or 'nothing yet'}

Write a response in this EXACT JSON format:
{{
  "subject": "short email subject line (max 60 chars, no emoji)",
  "headline": "one punchy headline line",
  "paragraphs": ["paragraph 1 (2-3 sentences, motivational, data-driven)", "paragraph 2 (specific advice or challenge based on their data)"],
  "cta_text": "one short call-to-action sentence"
}}

Rules:
- Be direct and personal, use their name
- Reference their actual numbers (streak, XP, topics)
- If streak is 0, gently encourage them to start again
- If streak > 7, celebrate it specifically
- If due_cards > 0, mention the flashcard review
- Max 150 words total across all paragraphs
- No generic motivational fluff — be specific to their data"""

    resp = client.chat.completions.create(
        messages=[{"role": "user", "content": prompt}],
        model=GROQ_DEFAULT_MODEL,
        temperature=0.8,
        max_tokens=400,
    )
    import json
    raw = resp.choices[0].message.content.strip()
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
    return json.loads(raw)


class Command(BaseCommand):
    help = "Send AI-generated personalized motivational emails to active users"

    def add_arguments(self, parser):
        parser.add_argument('--dry-run', action='store_true')
        parser.add_argument('--user', type=str, help='Send to specific username only')

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        target_user = options.get('user')

        if target_user:
            users = User.objects.filter(username=target_user, is_active=True).exclude(email='')
        else:
            # Only email users who have shown any activity (have at least 1 contribution)
            active_ids = Contribution.objects.values_list('user_id', flat=True).distinct()
            users = User.objects.filter(id__in=active_ids, is_active=True).exclude(email='')

        sent = errors = 0

        for user in users:
            try:
                ctx = _build_user_context(user)
                ai = _generate_motivation(ctx)

                paragraphs_html = "".join(
                    f'<p style="color:#aaa;font-size:14px;line-height:1.7;margin:12px 0">{p}</p>'
                    for p in ai.get("paragraphs", [])
                )
                cta_html = f'<p style="color:#00FF66;font-size:14px;font-weight:600;margin:16px 0 0">{ai.get("cta_text","")}</p>'

                plain = f"{ai['headline']}\n\n" + "\n\n".join(ai.get("paragraphs", [])) + f"\n\n{ai.get('cta_text','')}\n\nhttps://growth-os.tech/dashboard"

                if dry_run:
                    self.stdout.write(f"[DRY RUN] {user.email} → {ai['subject']}")
                else:
                    send_motivation_email(
                        user=user,
                        subject=ai["subject"],
                        headline=ai["headline"],
                        body_html_inner=paragraphs_html + cta_html,
                        plain_body=plain,
                    )
                    logger.info("Motivation email sent to %s", user.email)
                sent += 1
            except Exception:
                logger.exception("Failed motivation email for %s", user.email)
                errors += 1

        self.stdout.write(self.style.SUCCESS(f"Done — sent={sent} errors={errors}"))
