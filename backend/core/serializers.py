from rest_framework import serializers
from .models import LearningPath, Topic, TopicProgress, Contribution, UserProfile
from django.contrib.auth.models import User

class TopicSerializer(serializers.ModelSerializer):
    class Meta:
        model = Topic
        fields = ['id', 'title', 'slug', 'summary', 'order']

class LearningPathSerializer(serializers.ModelSerializer):
    topics = TopicSerializer(many=True, read_only=True)

    class Meta:
        model = LearningPath
        fields = ['id', 'title', 'slug', 'description', 'is_active', 'topics']

class ContributionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Contribution
        fields = ['date', 'action_type', 'points']
