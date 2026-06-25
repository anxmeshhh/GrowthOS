from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('core', '0033_career_models'),
    ]

    operations = [
        # Add personalisation fields to UserProfile
        migrations.AddField(
            model_name='userprofile',
            name='skill_level',
            field=models.CharField(
                max_length=20,
                choices=[('beginner', 'Beginner'), ('intermediate', 'Intermediate'), ('expert', 'Expert')],
                default='beginner',
            ),
        ),
        migrations.AddField(
            model_name='userprofile',
            name='learning_goal',
            field=models.CharField(
                max_length=20,
                choices=[('get_job', 'Get a dev job'), ('upskill', 'Upskill at current job'), ('freelance', 'Start freelancing'), ('hobby', 'Learn for fun')],
                default='get_job',
            ),
        ),
        migrations.AddField(
            model_name='userprofile',
            name='target_role',
            field=models.CharField(max_length=120, blank=True, default=''),
        ),
        migrations.AddField(
            model_name='userprofile',
            name='available_hours_per_day',
            field=models.FloatField(default=1.0),
        ),
        migrations.AddField(
            model_name='userprofile',
            name='onboarding_completed',
            field=models.BooleanField(default=False),
        ),

        # TopicQuiz score tracking
        migrations.AddField(
            model_name='topicquiz',
            name='last_score',
            field=models.IntegerField(null=True, blank=True),
        ),
        migrations.AddField(
            model_name='topicquiz',
            name='best_score',
            field=models.IntegerField(null=True, blank=True),
        ),
        migrations.AddField(
            model_name='topicquiz',
            name='last_attempted_at',
            field=models.DateTimeField(null=True, blank=True),
        ),

        # DailyMission model
        migrations.CreateModel(
            name='DailyMission',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('date', models.DateField()),
                ('tasks', models.JSONField(default=list)),
                ('focus_message', models.TextField(blank=True)),
                ('job_readiness_pct', models.FloatField(default=0)),
                ('estimated_weeks_to_ready', models.FloatField(null=True, blank=True)),
                ('weak_topics', models.JSONField(default=list)),
                ('total_xp_available', models.IntegerField(default=0)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('user', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='daily_missions',
                    to=settings.AUTH_USER_MODEL,
                )),
            ],
            options={
                'ordering': ['-date'],
                'unique_together': {('user', 'date')},
            },
        ),
    ]
