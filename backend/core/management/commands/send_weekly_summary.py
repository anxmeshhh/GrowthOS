"""
Management command: send_weekly_summary
Run once per week (e.g. Sunday 9:00 AM UTC) via cron.
Sends each active user a weekly progress recap.
"""
import datetime
from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from django.utils import timezone
from django.db.models import Avg, Sum
from core.emails import send_weekly_progress
from core.models import TopicProgress, Contribution, Flashcard, TopicQuiz, UserProfile
import logging

logger = logging.getLogger("core")


def _get_weekly_data(user):
    now = timezone.now()
    week_ago = now - datetime.timedelta(days=7)

    topics_completed = TopicProgress.objects.filter(
        user=user, status='completed', completed_at__gte=week_ago
    ).count()

    xp_earned = (
        Contribution.objects.filter(user=user, created_at__gte=week_ago)
        .aggregate(total=Sum('points'))['total'] or 0
    )

    profile = UserProfile.objects.filter(user=user).first()
    streak = profile.current_streak if profile else 0

    quiz_avg_row = (
        TopicQuiz.objects.filter(user=user, created_at__gte=week_ago)
        .aggregate(avg=Avg('score'))
    )
    quiz_avg = round(quiz_avg_row['avg'] or 0, 1)

    due_cards = Flashcard.objects.filter(
        user=user, next_review_date__lte=now.date()
    ).count()

    return topics_completed, xp_earned, streak, quiz_avg, due_cards


class Command(BaseCommand):
    help = "Send weekly progress summary emails to all active users"

    def add_arguments(self, parser):
        parser.add_argument('--dry-run', action='store_true')

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        users = User.objects.filter(is_active=True).exclude(email='')

        sent = skipped = errors = 0

        for user in users:
            try:
                topics_completed, xp_earned, streak, quiz_avg, due_cards = _get_weekly_data(user)

                if topics_completed == 0 and xp_earned == 0 and streak == 0:
                    skipped += 1
                    continue

                if dry_run:
                    self.stdout.write(
                        f"[DRY RUN] Would email {user.email} — "
                        f"topics={topics_completed} xp={xp_earned} streak={streak}"
                    )
                else:
                    send_weekly_progress(user, topics_completed, xp_earned, streak, quiz_avg, due_cards)
                    logger.info("Weekly summary sent to %s", user.email)

                sent += 1
            except Exception:
                logger.exception("Failed to send weekly summary to %s", user.email)
                errors += 1

        self.stdout.write(self.style.SUCCESS(
            f"Done — sent={sent} skipped={skipped} errors={errors}"
        ))
