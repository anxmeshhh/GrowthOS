import re

with open('backend/core/views.py', 'r', encoding='utf-8') as f:
    content = f.read()

new_badges_code = """        # Achievement badges (computed on-the-fly)
        badges = []
        if Contribution.objects.filter(user=user, action_type='signup_bonus').exists():
            badges.append({"id": "first_login", "title": "Newcomer", "icon": "🌟", "desc": "Signed up for GrowthOS"})
            
        perfect_scores = Contribution.objects.filter(user=user, action_type__startswith='perfect_score').count()
        speed_bonuses = Contribution.objects.filter(user=user, action_type__startswith='speed_bonus').count()
        paths_completed = Contribution.objects.filter(user=user, action_type__startswith='path_completed').count()
        has_streak_revived = Contribution.objects.filter(user=user, action_type='streak_revived').exists()

        if streak >= 3: badges.append({"id": "ignition", "title": "Ignition", "icon": "🚀", "desc": "3-day login streak"})
        if streak >= 7: badges.append({"id": "streak_7", "title": "On Fire", "icon": "🔥", "desc": "7-day login streak"})
        if streak >= 30: badges.append({"id": "streak_30", "title": "Unstoppable", "icon": "💎", "desc": "30-day login streak"})
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
        
        real_quizzes_passed = Contribution.objects.filter(user=user, action_type__startswith='quiz_passed').count()
        if real_quizzes_passed >= 20: badges.append({"id": "quiz_veteran", "title": "Quiz Veteran", "icon": "🏆", "desc": "Passed 20 quizzes"})
        
        is_specialist = False
        for p in paths:
            path_topics = Topic.objects.filter(path=p)
            all_high = True
            for pt in path_topics:
                vp = VerifiedProject.objects.filter(user=user, topic=pt).order_by('-ai_score').first()
                tm = TopicMaterial.objects.filter(user=user, topic=pt).order_by('-ai_score').first()
                max_score = 0
                if vp and vp.ai_score > max_score: max_score = vp.ai_score
                if tm and tm.ai_score > max_score: max_score = tm.ai_score
                
                if max_score < 80:
                    all_high = False
                    break
            if all_high and path_topics.count() > 0:
                is_specialist = True
                break
        if is_specialist:
            badges.append({"id": "specialist", "title": "Specialist", "icon": "🧠", "desc": "Completed a path with all scores >= 80"})
            
        if PathSharing.objects.filter(path__created_by=user).exists() or PathSharing.objects.filter(path__original_path__created_by=user).exists():
            badges.append({"id": "architect", "title": "Architect", "icon": "🏗️", "desc": "Shared a path you created"})
        if LearningPath.objects.filter(created_by=user, visibility='public').exists():
            badges.append({"id": "broadcaster", "title": "Broadcaster", "icon": "📡", "desc": "Published a public learning path"})

        can_revive_streak = False
        import datetime
        if streak == 0 and total_xp >= 10:
            two_days_ago = today - datetime.timedelta(days=2)
            has_activity_two_days_ago = Contribution.objects.filter(user=user, created_at__date=two_days_ago).exists()
            if has_activity_two_days_ago:
                if not profile.streak_revive_used_at or timezone.now() - profile.streak_revive_used_at > datetime.timedelta(days=7):
                    can_revive_streak = True

        return Response({
            "username": user.username,
            "date_joined": user.date_joined,
            "total_xp": total_xp,
            "level": level,
            "streak": streak,
            "topics_completed": topics_completed,
            "notes_written": notes_written,
            "quizzes_passed": quizzes_passed,
            "xp_breakdown": xp_breakdown,
            "completed_paths": path_list,
            "badges": badges,
            "github_username": profile.github_username,
            "can_revive_streak": can_revive_streak,
        })"""

old_badges_start = content.find("        # Achievement badges (computed on-the-fly)")
return_end = content.find("        })", old_badges_start) + 10

if old_badges_start != -1 and return_end != -1:
    new_content = content[:old_badges_start] + new_badges_code + content[return_end:]
    with open('backend/core/views.py', 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("Successfully patched!")
else:
    print("Could not find sections!")
