import os
import json
from django.core.management.base import BaseCommand
from django.conf import settings
from core.models import LearningPath, Topic
from core.slug_utils import normalize_slug, unique_slug_in_memory
from django.contrib.auth import get_user_model

User = get_user_model()

class Command(BaseCommand):
    help = 'Seed static JSON roadmaps into the database'

    def handle(self, *args, **options):
        frontend_roadmaps_dir = os.path.join(
            settings.BASE_DIR.parent, 'frontend', 'src', 'assets', 'roadmaps'
        )
        
        if not os.path.exists(frontend_roadmaps_dir):
            self.stdout.write(self.style.ERROR(f"Directory not found: {frontend_roadmaps_dir}"))
            return

        json_files = [f for f in os.listdir(frontend_roadmaps_dir) if f.endswith('.json')]
        admin_user = User.objects.filter(is_superuser=True).first() or User.objects.first()
        
        for filename in json_files:
            filepath = os.path.join(frontend_roadmaps_dir, filename)
            slug = normalize_slug(filename.replace('.json', ''), fallback='roadmap')
            title = slug.replace('-', ' ').title()
            
            with open(filepath, 'r', encoding='utf-8') as f:
                data = json.load(f)
                
            nodes = data.get('nodes', [])
            if not nodes:
                continue
                
            # Create or get path
            path, created = LearningPath.objects.get_or_create(
                slug=slug,
                defaults={
                    'title': title,
                    'is_custom': False,
                    'estimated_weeks': 12,
                    'visibility': 'public',
                    'created_by': admin_user
                }
            )
            
            if created:
                self.stdout.write(self.style.SUCCESS(f"Created path: {title}"))
            else:
                self.stdout.write(f"Updating path: {title}")
                # Clear existing topics if we are re-seeding
                path.topics.all().delete()
                
            # Sort nodes strictly by Y coordinate to get the top-to-bottom order
            nodes.sort(key=lambda n: n.get('y', 0))
            existing_topic_slugs = set()
            
            for idx, node in enumerate(nodes):
                n_id = node.get('id')
                label = node.get('label', '')
                bg_color = node.get('bgColor', '').lower()
                
                # Determine node_kind
                node_kind = 'topic'
                if bg_color in ('#ffee55', '#4147d3'):
                    node_kind = 'milestone'
                elif bg_color == '#e0e0e0':
                    node_kind = 'optional'
                    
                Topic.objects.create(
                    path=path,
                    title=label,
                    slug=unique_slug_in_memory(
                        n_id or label,
                        existing_topic_slugs,
                        fallback=f"{slug}-topic-{idx + 1}",
                    ),
                    node_kind=node_kind,
                    order=idx,
                    created_by=admin_user
                )
                
        self.stdout.write(self.style.SUCCESS("Successfully seeded all JSON roadmaps!"))
