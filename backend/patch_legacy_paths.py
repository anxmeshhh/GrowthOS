import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from core.models import LearningPath

paths = LearningPath.objects.all()
for p in paths:
    topics = list(p.topics.order_by('order', 'id'))
    if not topics:
        continue
    
    # Check if this path has ANY milestones
    has_milestones = any(t.node_kind == 'milestone' for t in topics)
    if has_milestones:
        continue
        
    print(f"Migrating legacy path: {p.title}")
    
    for idx, t in enumerate(topics):
        deps_count = t.dependencies.count()
        if idx == 0:
            t.node_kind = 'milestone'
        elif deps_count > 1:
            t.node_kind = 'milestone'
        else:
            t.node_kind = 'topic'
        t.save()

print("Migration complete!")
