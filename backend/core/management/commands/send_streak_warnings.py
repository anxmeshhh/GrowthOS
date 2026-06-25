"""
Management command: send_streak_warnings
Run once per day at ~8 PM UTC via cron.
Emails users who have an active streak but haven't logged in today.
"""
from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from django.utils import timezone
from core.emails import send_streak_warning
from core.models import Contribution, UserProfile
import logging

logger = logging.getLogger("core")


class Command(BaseCommand):
    help = "Warn users whose streak will reset if they don't log in today"

    def add_arguments(self, parser):
        parser.add_argument('--dry-run', action='store_true')

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        today = timezone.now().date()

        # Users with a streak > 0 who haven't done their daily login today
        profiles = UserProfile.objects.filter(
            current_streak__gt=0
        ).select_related('user').exclude(user__email='').filter(user__is_active=True)

        sent = 0
        errors = 0

        for profile in profiles:
            user = profile.user
            already_logged_in = Contribution.objects.filter(
                user=user,
                action_type='daily_login',
                created_at__date=today,
            ).exists()

            if already_logged_in:
                continue

            try:
                if dry_run:
                    self.stdout.write(
                        f"[DRY RUN] Would warn {user.email} — streak={profile.current_streak}"
                    )
                else:
                    send_streak_warning(user, profile.current_streak)
                    logger.info("Streak warning sent to %s (streak=%d)", user.email, profile.current_streak)
                sent += 1
            except Exception:
                logger.exception("Failed to send streak warning to %s", user.email)
                errors += 1

        self.stdout.write(
            self.style.SUCCESS(f"Done — warned={sent} errors={errors}")
        )
