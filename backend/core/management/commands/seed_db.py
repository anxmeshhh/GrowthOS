from django.core.management.base import BaseCommand, CommandError
import os
import json
from django.contrib.auth.models import User
from core.models import LearningPath, Topic
from core.helpers import normalize_slug, unique_slug_in_memory

class Command(BaseCommand):
    help = 'Seed the database with learning paths and ALL topics from roadmap JSONs'

    def handle(self, *args, **options):
        # The script is in backend/core/management/commands/
        # base_dir is backend/
        base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
        # roadmaps are in frontend/src/assets/roadmaps
        frontend_dir = os.path.join(os.path.dirname(base_dir), 'frontend', 'src', 'assets', 'roadmaps')
        
        # Fallback to current dir if running from root
        if not os.path.exists(frontend_dir):
            frontend_dir = os.path.join('..', 'frontend', 'src', 'assets', 'roadmaps')
            
        if not os.path.exists(frontend_dir):
            raise CommandError(f"Roadmap directory not found at {frontend_dir}")

        PATHS_META = {
            'backend': {'title': 'Backend Developer', 'description': 'Master server-side development with databases, APIs, caching, and deployment.'},
            'frontend': {'title': 'Frontend Developer', 'description': 'Build modern web interfaces with HTML, CSS, JavaScript, and popular frameworks.'},
            'ai-engineer': {'title': 'AI Engineer', 'description': 'Learn to build AI-powered applications using LLMs, RAG, embeddings, and agents.'},
            'api-design': {'title': 'API Design', 'description': 'Design and build robust, secure, and performant APIs from scratch.'},
            'datastructures-and-algorithms': {'title': 'Data Structures & Algorithms', 'description': 'Master DSA fundamentals for coding interviews and problem-solving.'},
            'django': {'title': 'Django Framework', 'description': 'Full-stack Python web development with Django - models, views, REST, deployment.'},
            'sql': {'title': 'SQL Mastery', 'description': 'Learn SQL from basics to advanced queries, optimization, and database management.'},
            'system-design': {'title': 'System Design', 'description': 'Learn to design scalable, reliable, and performant distributed systems.'},
        }

        admin = User.objects.filter(is_superuser=True).first()
        if not admin:
            raise CommandError("ERROR: No superuser found.")

        self.stdout.write(f"Seeding as user: {admin.username}")

        for slug, meta in PATHS_META.items():
            slug = normalize_slug(slug, fallback='roadmap')
            json_path = os.path.join(frontend_dir, f"{slug}.json")
            if not os.path.exists(json_path):
                self.stdout.write(self.style.WARNING(f"  SKIP {slug} (file not found)"))
                continue

            with open(json_path, 'r') as f:
                graph = json.load(f)

            path, created = LearningPath.objects.get_or_create(
                slug=slug,
                defaults={
                    'title': meta['title'],
                    'description': meta['description'],
                    'is_active': True,
                    'created_by': admin,
                }
            )
            
            if not created:
                path.topics.all().delete()

            order = 0
            existing_topic_slugs = set()
            for node in graph['nodes']:
                Topic.objects.create(
                    path=path,
                    slug=unique_slug_in_memory(
                        node.get('id') or node.get('label'),
                        existing_topic_slugs,
                        fallback=f"{slug}-topic-{order + 1}",
                    ),
                    title=node['label'],
                    summary=f"{node['label']}",
                    order=order,
                    created_by=admin,
                )
                order += 1

            self.stdout.write(f"  {slug}: {path.topics.count()} topics")

        self.stdout.write(self.style.SUCCESS(f"\nDone! {LearningPath.objects.count()} paths, {Topic.objects.count()} topics in database."))
