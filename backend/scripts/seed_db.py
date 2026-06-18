"""
Seed the MySQL database with learning paths and ALL topics from roadmap JSONs.
Run: python scripts/seed_db.py
"""
import os, sys, json, django

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
os.environ['DJANGO_SETTINGS_MODULE'] = 'config.settings'
django.setup()

from django.contrib.auth.models import User
from core.models import LearningPath, Topic
from core.slug_utils import normalize_slug, unique_slug_in_memory

ROADMAP_DIR = os.path.join(os.path.dirname(__file__), '..', '..', 'frontend', 'src', 'assets', 'roadmaps')

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
    print("ERROR: No superuser found.")
    sys.exit(1)

print(f"Seeding as user: {admin.username}")

for slug, meta in PATHS_META.items():
    slug = normalize_slug(slug, fallback='roadmap')
    json_path = os.path.join(ROADMAP_DIR, f"{slug}.json")
    if not os.path.exists(json_path):
        print(f"  SKIP {slug}")
        continue

    with open(json_path, 'r') as f:
        graph = json.load(f)

    # Delete existing topics for this path to avoid duplicates
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
        # Clear existing topics for a clean re-seed
        path.topics.all().delete()

    # Create a topic for EVERY node in the graph
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

    print(f"  {slug}: {path.topics.count()} topics")

print(f"\nDone! {LearningPath.objects.count()} paths, {Topic.objects.count()} topics in MySQL.")
