from django.utils import timezone
from .models import Contribution, TopicProgress, Topic

def award_topic_completion_xp(user, topic, progress, score):
    if progress.status != 'completed':
        progress.status = 'completed'
        progress.completed_at = timezone.now()
        progress.save()
        Contribution.objects.create(user=user, action_type='topic_verified', points=1)

        # Milestone XP
        completed_count = TopicProgress.objects.filter(user=user, status='completed').count()
        milestones = {5: 25, 10: 50, 25: 100, 50: 250}
        if completed_count in milestones:
            action = f'milestone_{completed_count}_topics'
            if not Contribution.objects.filter(user=user, action_type=action).exists():
                Contribution.objects.create(user=user, action_type=action, points=1)
        
        # Speed Bonus
        if progress.started_at:
            delta = progress.completed_at - progress.started_at
            if delta.total_seconds() <= 48 * 3600:
                Contribution.objects.create(user=user, action_type=f'speed_bonus_{topic.id}', points=1)
        
        # Path Completion
        path_topics_count = Topic.objects.filter(path=topic.path).count()
        completed_path_topics = TopicProgress.objects.filter(
            user=user, topic__path=topic.path, status='completed'
        ).count()
        
        if path_topics_count > 0 and path_topics_count == completed_path_topics:
            if not Contribution.objects.filter(user=user, action_type=f'path_completed_{topic.path.id}').exists():
                Contribution.objects.create(user=user, action_type=f'path_completed_{topic.path.id}', points=1)

    if score >= 90:
        action = f'perfect_score_{topic.id}'
        if not Contribution.objects.filter(user=user, action_type=action).exists():
            Contribution.objects.create(user=user, action_type=action, points=1)

def get_user_badges(user):
    from .models import Contribution, TopicProgress, TopicNote, LearningPath, VerifiedProject
    from django.utils import timezone
    from django.db.models import Sum, Count

    topics_completed = TopicProgress.objects.filter(user=user, status='completed').count()
    notes_written = TopicNote.objects.filter(user=user).exclude(content='').count()
    quizzes_passed = Contribution.objects.filter(user=user, action_type='quiz_passed').count()
    
    # Streak calculation
    today = timezone.now().date()
    streak = 0
    check = today
    while True:
        if Contribution.objects.filter(user=user, action_type='daily_login', created_at__date=check).exists():
            streak += 1
            check -= timezone.timedelta(days=1)
        else:
            break

    # Completed paths
    completed_topics_qs = TopicProgress.objects.filter(user=user, status='completed').select_related('topic__path')
    paths = set(tp.topic.path for tp in completed_topics_qs if tp.topic.path)
    path_list = [{"id": p.id, "title": p.title, "slug": p.slug} for p in paths]

    badges = []
    if Contribution.objects.filter(user=user, action_type='signup_bonus').exists():
        badges.append({"id": "first_login", "title": "Newcomer", "icon": "🌟", "desc": "Signed up for GrowthOS"})
        
    if Contribution.objects.filter(user=user, action_type='notes_uploaded').exists():
        badges.append({"id": "first_note", "title": "Scholar", "icon": "📝", "desc": "Wrote your first study note"})
        
    perfect_scores = Contribution.objects.filter(user=user, action_type__startswith='perfect_score').count()
    speed_bonuses = Contribution.objects.filter(user=user, action_type__startswith='speed_bonus').count()
    paths_completed = Contribution.objects.filter(user=user, action_type__startswith='path_completed').count()
    has_streak_revived = Contribution.objects.filter(user=user, action_type='streak_revived').exists()

    if topics_completed > 0:
        badges.append({"id": "first_topic", "title": "First Steps", "icon": "🌱", "desc": "Verified your first topic"})
        
    if quizzes_passed >= 5:
        badges.append({"id": "quiz_master", "title": "Quiz Master", "icon": "🎓", "desc": "Passed 5 quizzes"})
        
    if streak >= 3: badges.append({"id": "ignition", "title": "Ignition", "icon": "🚀", "desc": "3-day login streak"})
    if streak >= 7: badges.append({"id": "streak_7", "title": "On Fire", "icon": "🔥", "desc": "7-day login streak"})
    if streak >= 30: badges.append({"id": "streak_30", "title": "Unstoppable", "icon": "💎", "desc": "30-day login streak"})
    
    if len(path_list) > 0:
        badges.append({"id": "path_completed", "title": "Pathfinder", "icon": "🗺️", "desc": "Completed a full learning path"})
    if has_streak_revived: badges.append({"id": "comeback_kid", "title": "Comeback Kid", "icon": "🧟", "desc": "Revived a lost streak"})
    
    if perfect_scores >= 1: badges.append({"id": "sharpshooter", "title": "Sharpshooter", "icon": "🎯", "desc": "Scored >= 90 on a topic"})
    if perfect_scores >= 3: badges.append({"id": "perfectionist", "title": "Perfectionist", "icon": "✨", "desc": "Scored >= 90 on 3 topics"})
    if perfect_scores >= 5: badges.append({"id": "diamond_coder", "title": "Diamond Coder", "icon": "💎", "desc": "Scored >= 90 on 5 topics"})
    if speed_bonuses >= 1: badges.append({"id": "speed_runner", "title": "Speed Runner", "icon": "⚡", "desc": "Completed a topic within 48 hours"})
    
    if paths_completed >= 1: badges.append({"id": "pathfinder", "title": "Pathfinder", "icon": "🗺️", "desc": "Completed a learning path"})
    if paths_completed >= 3: badges.append({"id": "explorer", "title": "Explorer", "icon": "🧭", "desc": "Completed 3 learning paths"})
    if LearningPath.objects.filter(created_by=user, is_custom=True).exists():
        badges.append({"id": "cartographer", "title": "Cartographer", "icon": "📜", "desc": "Created a custom learning path"})
        
    if notes_written >= 10: badges.append({"id": "chronicler", "title": "Chronicler", "icon": "📝", "desc": "Written 10+ study notes"})
    
    if quizzes_passed >= 20: badges.append({"id": "quiz_veteran", "title": "Quiz Veteran", "icon": "🏆", "desc": "Passed 20 quizzes"})
    
    return badges
