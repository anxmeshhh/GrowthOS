from django.core.management.base import BaseCommand
from core.models import LearningPath

class Command(BaseCommand):
    help = 'Migrates legacy paths to the new milestone/topic architecture'

    def handle(self, *args, **options):
        paths = LearningPath.objects.all()
        migrated_count = 0
        
        for p in paths:
            topics = list(p.topics.order_by('order', 'id'))
            if not topics:
                continue
            
            # Check if this path has ANY milestones
            has_milestones = any(t.node_kind == 'milestone' for t in topics)
            if has_milestones:
                continue
                
            self.stdout.write(f"Migrating legacy path: {p.title}")
            migrated_count += 1
            
            for idx, t in enumerate(topics):
                deps_count = t.dependencies.count()
                if idx == 0:
                    t.node_kind = 'milestone'
                elif deps_count > 1:
                    t.node_kind = 'milestone'
                else:
                    t.node_kind = 'topic'
                t.save()
        
        self.stdout.write(self.style.SUCCESS(f"Migration complete! Processed {migrated_count} legacy paths."))
