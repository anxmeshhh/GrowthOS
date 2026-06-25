from django.db import migrations, models


class Migration(migrations.Migration):
    """Allow the legitimate negative 'streak_revived' spend while keeping the
    points >= 0 sanity gate for every other contribution (reconciles M1 with
    the streak-revive feature, which records a -10 XP cost)."""

    dependencies = [
        ("core", "0029_add_indexes_constraints_unique_together"),
    ]

    operations = [
        migrations.RemoveConstraint(
            model_name="contribution",
            name="contribution_points_non_negative",
        ),
        migrations.AddConstraint(
            model_name="contribution",
            constraint=models.CheckConstraint(
                check=models.Q(("points__gte", 0)) | models.Q(("action_type", "streak_revived")),
                name="contribution_points_non_negative",
            ),
        ),
    ]
