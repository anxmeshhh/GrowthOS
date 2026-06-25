from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0031_sitesetting"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="Notification",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("type", models.CharField(
                    choices=[
                        ("topic_complete", "Topic Complete"),
                        ("streak_milestone", "Streak Milestone"),
                        ("flashcards_due", "Flashcards Due"),
                        ("path_shared", "Path Shared"),
                        ("quiz_ready", "Quiz Ready"),
                        ("general", "General"),
                    ],
                    default="general",
                    max_length=30,
                )),
                ("message", models.CharField(max_length=300)),
                ("link", models.CharField(blank=True, default="", max_length=200)),
                ("is_read", models.BooleanField(default=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("user", models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name="notifications",
                    to=settings.AUTH_USER_MODEL,
                )),
            ],
            options={"ordering": ["-created_at"]},
        ),
        migrations.AddIndex(
            model_name="notification",
            index=models.Index(fields=["user", "is_read", "created_at"], name="notif_user_read_idx"),
        ),
    ]
