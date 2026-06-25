"""
Management command: send_daily_emails
Run once per day (e.g. 8:00 AM UTC) via cron.
Sends each active user their daily briefing — due flashcards, streak, next topic.
"""
import datetime
from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from django.utils import timezone
from core.emails import send_daily_briefing
from core.models import Flashcard, TopicProgress, LearningPath, Topic, UserProfile
import logging

logger = logging.getLogger("core")


def _get_briefing_data(user):
    today = timezone.now().date()

    due_cards = Flashcard.objects.filter(user=user, next_review_date__lte=today).count()

    last_progress = TopicProgress.objects.filter(
        user=user, status='in_progress'
    ).order_by('-started_at').first()
    next_topic = None
    if last_progress:
        next_topic = {
            "id": last_progress.topic.id,
            "title": last_progress.topic.title,
            "slug": last_progress.topic.slug,
        }
    else:
        active_path = LearningPath.objects.filter(
            topics__progress__user=user
        ).distinct().first()
        if active_path:
            for t in active_path.topics.all().order_by('order'):
                prog = TopicProgress.objects.filter(user=user, topic=t).first()
                if not prog or prog.status == 'locked':
                    next_topic = {"id": t.id, "title": t.title, "slug": t.slug}
                    break

    fourteen_days_ago = timezone.now() - datetime.timedelta(days=14)
    fading = TopicProgress.objects.filter(
        user=user, status='completed', completed_at__lte=fourteen_days_ago
    ).select_related('topic')
    fading_topics = [{"id": f.topic.id, "title": f.topic.title} for f in fading]

    profile = UserProfile.objects.filter(user=user).first()
    streak = profile.current_streak if profile else 0

    return due_cards, streak, next_topic, fading_topics


class Command(BaseCommand):
    help = "Send daily briefing emails to all active users"

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Print who would receive emails without sending',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        users = User.objects.filter(is_active=True).exclude(email='')

        sent = 0
        skipped = 0
        errors = 0

        for user in users:
            try:
                due_cards, streak, next_topic, fading_topics = _get_briefing_data(user)

                # Only email users who have something going on
                if due_cards == 0 and streak == 0 and next_topic is None:
                    skipped += 1
                    continue

                if dry_run:
                    self.stdout.write(
                        f"[DRY RUN] Would email {user.email} — "
                        f"due={due_cards} streak={streak} next={next_topic}"
                    )
                else:
                    send_daily_briefing(user, due_cards, streak, next_topic, fading_topics)
                    logger.info("Daily briefing sent to %s", user.email)

                sent += 1
            except Exception:
                logger.exception("Failed to send briefing to %s", user.email)
                errors += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"Done — sent={sent} skipped={skipped} errors={errors}"
            )
        )
