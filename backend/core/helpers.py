from django.utils import timezone
from .models import Contribution, TopicProgress, Topic

def award_topic_completion_xp(user, topic, progress, score):
    if progress.status != 'completed':
        progress.status = 'completed'
        progress.completed_at = timezone.now()
        progress.save()
        Contribution.objects.create(user=user, action_type='topic_verified', points=5)

        # Milestone XP
        completed_count = TopicProgress.objects.filter(user=user, status='completed').count()
        milestones = {5: 25, 10: 50, 25: 100, 50: 250}
        if completed_count in milestones:
            action = f'milestone_{completed_count}_topics'
            if not Contribution.objects.filter(user=user, action_type=action).exists():
                Contribution.objects.create(user=user, action_type=action, points=milestones[completed_count])
        
        # Speed Bonus
        if progress.started_at:
            delta = progress.completed_at - progress.started_at
            if delta.total_seconds() <= 48 * 3600:
                Contribution.objects.create(user=user, action_type=f'speed_bonus_{topic.id}', points=3)
        
        # Path Completion
        path_topics_count = Topic.objects.filter(path=topic.path).count()
        completed_path_topics = TopicProgress.objects.filter(
            user=user, topic__path=topic.path, status='completed'
        ).count()
        
        if path_topics_count > 0 and path_topics_count == completed_path_topics:
            if not Contribution.objects.filter(user=user, action_type=f'path_completed_{topic.path.id}').exists():
                Contribution.objects.create(user=user, action_type=f'path_completed_{topic.path.id}', points=25)

    if score >= 90:
        action = f'perfect_score_{topic.id}'
        if not Contribution.objects.filter(user=user, action_type=action).exists():
            Contribution.objects.create(user=user, action_type=action, points=3)
