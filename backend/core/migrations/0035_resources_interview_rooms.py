from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('core', '0034_command_center'),
    ]

    operations = [
        # TopicResource
        migrations.CreateModel(
            name='TopicResource',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False)),
                ('title', models.CharField(max_length=200)),
                ('url', models.URLField(max_length=500)),
                ('type', models.CharField(max_length=20, choices=[('doc','Documentation'),('video','Video'),('article','Article'),('tool','Tool'),('course','Course'),('practice','Practice')], default='article')),
                ('description', models.CharField(max_length=300, blank=True)),
                ('upvotes', models.IntegerField(default=0)),
                ('is_verified', models.BooleanField(default=False)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('topic', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='resources', to='core.topic')),
                ('added_by', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='added_resources', to=settings.AUTH_USER_MODEL)),
            ],
            options={'ordering': ['-is_verified', '-upvotes', '-created_at']},
        ),
        migrations.AddIndex(
            model_name='topicresource',
            index=models.Index(fields=['topic', 'type'], name='resource_topic_type_idx'),
        ),

        # MockInterview
        migrations.CreateModel(
            name='MockInterview',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False)),
                ('job_title', models.CharField(max_length=200, blank=True)),
                ('questions', models.JSONField(default=list)),
                ('answers', models.JSONField(default=list)),
                ('overall_score', models.FloatField(null=True, blank=True)),
                ('interview_readiness_pct', models.FloatField(null=True, blank=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('completed_at', models.DateTimeField(null=True, blank=True)),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='mock_interviews', to=settings.AUTH_USER_MODEL)),
                ('jd_analysis', models.ForeignKey(null=True, blank=True, on_delete=django.db.models.deletion.SET_NULL, to='core.jdanalysis')),
            ],
            options={'ordering': ['-created_at']},
        ),

        # StudyRoom
        migrations.CreateModel(
            name='StudyRoom',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False)),
                ('name', models.CharField(max_length=100, blank=True)),
                ('is_active', models.BooleanField(default=True)),
                ('pomodoro_end', models.DateTimeField(null=True, blank=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('topic', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='study_rooms', to='core.topic')),
                ('created_by', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='created_rooms', to=settings.AUTH_USER_MODEL)),
            ],
            options={'ordering': ['-created_at']},
        ),
        migrations.AddIndex(
            model_name='studyroom',
            index=models.Index(fields=['topic', 'is_active'], name='room_topic_active_idx'),
        ),

        # StudyRoomParticipant
        migrations.CreateModel(
            name='StudyRoomParticipant',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False)),
                ('joined_at', models.DateTimeField(auto_now_add=True)),
                ('last_ping', models.DateTimeField(auto_now=True)),
                ('is_active', models.BooleanField(default=True)),
                ('room', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='participants', to='core.studyroom')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='room_sessions', to=settings.AUTH_USER_MODEL)),
            ],
            options={'unique_together': {('room', 'user')}},
        ),
        migrations.AddIndex(
            model_name='studyroomparticipant',
            index=models.Index(fields=['room', 'is_active'], name='participant_room_active_idx'),
        ),
    ]
