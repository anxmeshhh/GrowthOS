from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0035_resources_interview_rooms'),
    ]

    operations = [
        migrations.AddConstraint(
            model_name='pomodorosession',
            constraint=models.CheckConstraint(
                check=models.Q(duration_minutes__gte=1) & models.Q(duration_minutes__lte=1440),
                name='pomosession_duration_range',
            ),
        ),
    ]
