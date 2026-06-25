from django.db import transaction
from django.utils import timezone
from .models import Contribution, TopicProgress, Topic

def award_topic_completion_xp(user, topic, progress, score):
    # M3: serialize concurrent completions of the same topic by locking the
    # progress row inside a transaction, and make every once-only award
    # idempotent via get_or_create — so a double request can't double-award.
    with transaction.atomic():
        progress = TopicProgress.objects.select_for_update().get(pk=progress.pk)

        if progress.status != 'completed':
            progress.status = 'completed'
            progress.completed_at = timezone.now()
            progress.save(update_fields=['status', 'completed_at'])
            Contribution.objects.create(user=user, action_type='topic_verified', points=1)

            # Milestone XP
            completed_count = TopicProgress.objects.filter(user=user, status='completed').count()
            milestones = {5: 25, 10: 50, 25: 100, 50: 250}
            if completed_count in milestones:
                Contribution.objects.get_or_create(
                    user=user, action_type=f'milestone_{completed_count}_topics',
                    defaults={'points': 1},
                )

            # Speed Bonus
            if progress.started_at:
                delta = progress.completed_at - progress.started_at
                if delta.total_seconds() <= 48 * 3600:
                    Contribution.objects.get_or_create(
                        user=user, action_type=f'speed_bonus_{topic.id}', defaults={'points': 1},
                    )

            # Path Completion
            path_topics_count = Topic.objects.filter(path=topic.path).count()
            completed_path_topics = TopicProgress.objects.filter(
                user=user, topic__path=topic.path, status='completed'
            ).count()
            if path_topics_count > 0 and path_topics_count == completed_path_topics:
                Contribution.objects.get_or_create(
                    user=user, action_type=f'path_completed_{topic.path.id}', defaults={'points': 1},
                )

        if score >= 90:
            Contribution.objects.get_or_create(
                user=user, action_type=f'perfect_score_{topic.id}', defaults={'points': 1},
            )

def get_user_badges(user):
    from .models import Contribution, TopicProgress, TopicNote, LearningPath, VerifiedProject
    from django.utils import timezone
    from django.db.models import Sum, Count

    topics_completed = TopicProgress.objects.filter(user=user, status='completed').count()
    notes_written = TopicNote.objects.filter(user=user).exclude(content='').count()
    quizzes_passed = Contribution.objects.filter(user=user, action_type='quiz_passed').count()
    
    # Streak calculation — single query, walk back in memory (was N+1).
    today = timezone.now().date()
    login_dates = set(
        Contribution.objects.filter(user=user, action_type='daily_login')
        .values_list('created_at__date', flat=True)
    )
    streak = 0
    check = today
    while check in login_dates:
        streak += 1
        check -= timezone.timedelta(days=1)

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
    
    # GitHub / Developer badges
    github_commits = Contribution.objects.filter(user=user, action_type='github_commit').count()
    gists_published = Contribution.objects.filter(user=user, action_type='gist_published').count()
    repos_created = Contribution.objects.filter(user=user, action_type='github_repo_created').count()
    
    if github_commits >= 1: badges.append({"id": "first_commit", "title": "First Push", "icon": "🚀", "desc": "Committed workspace to GitHub"})
    if github_commits >= 10: badges.append({"id": "serial_committer", "title": "Serial Committer", "icon": "⚡", "desc": "10+ GitHub commits"})
    if gists_published >= 1: badges.append({"id": "gist_maker", "title": "Gist Maker", "icon": "📋", "desc": "Published a GitHub Gist"})
    if repos_created >= 3: badges.append({"id": "repo_builder", "title": "Repo Builder", "icon": "🏗️", "desc": "Created 3+ GitHub repositories"})
    
    return badges


# --- SLUG UTILS MERGED ---
from django.utils.text import slugify


MAX_SLUG_LENGTH = 255


def normalize_slug(value, fallback="item", max_length=MAX_SLUG_LENGTH):
    slug = slugify(value or "")[:max_length].strip("-")
    return slug or fallback[:max_length]


def append_slug_suffix(base_slug, suffix, max_length=MAX_SLUG_LENGTH):
    suffix = f"-{suffix}"
    return f"{base_slug[:max_length - len(suffix)].rstrip('-')}{suffix}"


def unique_slug(model, value, fallback="item", field_name="slug", queryset=None, max_length=MAX_SLUG_LENGTH):
    queryset = queryset if queryset is not None else model.objects.all()
    base_slug = normalize_slug(value, fallback=fallback, max_length=max_length)
    slug = base_slug
    counter = 1

    while queryset.filter(**{field_name: slug}).exists():
        slug = append_slug_suffix(base_slug, counter, max_length=max_length)
        counter += 1

    return slug


def unique_slug_in_memory(value, existing_slugs, fallback="item", max_length=MAX_SLUG_LENGTH):
    base_slug = normalize_slug(value, fallback=fallback, max_length=max_length)
    slug = base_slug
    counter = 1

    while slug in existing_slugs:
        slug = append_slug_suffix(base_slug, counter, max_length=max_length)
        counter += 1

    existing_slugs.add(slug)
    return slug
