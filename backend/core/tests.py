from types import SimpleNamespace

from django.contrib.auth.models import User
from django.test import SimpleTestCase, TestCase

from .models import LearningPath
from .serializers import CustomPathCreateSerializer
from .slug_utils import (
    MAX_SLUG_LENGTH,
    append_slug_suffix,
    normalize_slug,
    unique_slug_in_memory,
)


class SlugUtilsTests(SimpleTestCase):
    def test_normalize_slug_truncates_to_model_limit(self):
        slug = normalize_slug("Django " + ("REST " * 80), fallback="topic")

        self.assertLessEqual(len(slug), MAX_SLUG_LENGTH)
        self.assertTrue(slug.startswith("django-rest"))

    def test_normalize_slug_uses_fallback_for_empty_values(self):
        self.assertEqual(normalize_slug("!!!", fallback="topic-1"), "topic-1")

    def test_append_slug_suffix_preserves_total_length_limit(self):
        base = "a" * MAX_SLUG_LENGTH
        slug = append_slug_suffix(base, 12)

        self.assertEqual(len(slug), MAX_SLUG_LENGTH)
        self.assertTrue(slug.endswith("-12"))

    def test_unique_slug_in_memory_suffixes_duplicates(self):
        existing = {"django-rest-api"}

        slug = unique_slug_in_memory("Django REST API", existing, fallback="topic")

        self.assertEqual(slug, "django-rest-api-1")
        self.assertIn(slug, existing)


class CustomPathCreateSerializerTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="alice", password="test-pass")
        self.request = SimpleNamespace(user=self.user)

    def test_duplicate_custom_path_slug_gets_suffix(self):
        LearningPath.objects.create(title="Existing", slug="django", created_by=self.user)
        serializer = CustomPathCreateSerializer(
            data={
                "title": "Django",
                "slug": "django",
                "description": "",
                "estimated_weeks": 4,
            },
            context={"request": self.request},
        )

        self.assertTrue(serializer.is_valid(), serializer.errors)
        path = serializer.save()

        self.assertEqual(path.slug, "django-1")

    def test_missing_custom_path_slug_is_generated_from_title(self):
        serializer = CustomPathCreateSerializer(
            data={
                "title": "Django REST API",
                "description": "",
                "estimated_weeks": 4,
            },
            context={"request": self.request},
        )

        self.assertTrue(serializer.is_valid(), serializer.errors)
        path = serializer.save()

        self.assertEqual(path.slug, "django-rest-api")
