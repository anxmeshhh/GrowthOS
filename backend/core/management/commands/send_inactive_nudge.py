"""
Management command: send_inactive_nudge
Run daily. Sends a single re-engagement email to users who have not had a
daily_login Contribution in exactly 3 days (fires once — not every day they
are absent, so it stays non-spammy).
"""
import datetime
from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from django.utils import timezone
from core.emails import send_inactive_nudge
from core.models import Contribution
import logging

logger = logging.getLogger("core")


class Command(BaseCommand):
    help = "Send a re-engagement email to users inactive for exactly 3 days"

    def add_arguments(self, parser):
        parser.add_argument('--dry-run', action='store_true')
        parser.add_argument(
            '--days', type=int, default=3,
            help="Number of days of inactivity before sending (default: 3)",
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        days = options['days']
        today = timezone.now().date()

        # The window: user logged in on day (today - days) but NOT since then
        cutoff_date = today - datetime.timedelta(days=days)
        recent_date = today - datetime.timedelta(days=days - 1)  # yesterday relative to cutoff

        users = User.objects.filter(is_active=True).exclude(email='')
        sent = skipped = errors = 0

        for user in users:
            # Was active exactly `days` days ago?
            was_active_on_cutoff = Contribution.objects.filter(
                user=user,
                action_type='daily_login',
                created_at__date=cutoff_date,
            ).exists()

            if not was_active_on_cutoff:
                skipped += 1
                continue

            # Has been active at any point since then? If yes, skip.
            active_since = Contribution.objects.filter(
                user=user,
                action_type='daily_login',
                created_at__date__gte=recent_date,
            ).exists()

            if active_since:
                skipped += 1
                continue

            try:
                if dry_run:
                    self.stdout.write(
                        f"[DRY RUN] Would nudge {user.email} — {days} days inactive"
                    )
                else:
                    send_inactive_nudge(user, days)
                    logger.info("Inactive nudge sent to %s (%d days)", user.email, days)
                sent += 1
            except Exception:
                logger.exception("Failed to send nudge to %s", user.email)
                errors += 1

        self.stdout.write(self.style.SUCCESS(
            f"Done — sent={sent} skipped={skipped} errors={errors}"
        ))
