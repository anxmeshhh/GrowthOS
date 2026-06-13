from rest_framework import serializers
from .models import LearningPath, Topic, TopicProgress, Contribution, UserProfile, Bookmark, TopicMaterial, TopicNote, NoteDocument
from django.contrib.auth.models import User

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'email')

class RegisterSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('username', 'email', 'password')
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):
        user = User.objects.create_user(
            validated_data['username'],
            validated_data['email'],
            validated_data['password']
        )
        UserProfile.objects.create(user=user)
        return user

class TopicSerializer(serializers.ModelSerializer):
    user_progress = serializers.SerializerMethodField()

    dependencies = serializers.PrimaryKeyRelatedField(many=True, read_only=True)

    class Meta:
        model = Topic
        fields = ['id', 'title', 'slug', 'summary', 'order', 'created_by', 'user_progress', 'dependencies']

    def get_user_progress(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            progress = TopicProgress.objects.filter(user=request.user, topic=obj).first()
            if progress:
                return progress.status
        return 'available'

class LearningPathSerializer(serializers.ModelSerializer):
    topics = TopicSerializer(many=True, read_only=True)
    is_bookmarked = serializers.SerializerMethodField()

    class Meta:
        model = LearningPath
        fields = ['id', 'title', 'slug', 'description', 'is_active', 'is_custom', 'created_by', 'topics', 'is_bookmarked']

    def get_is_bookmarked(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return Bookmark.objects.filter(user=request.user, path=obj).exists()
        return False

class BookmarkSerializer(serializers.ModelSerializer):
    path = LearningPathSerializer(read_only=True)
    class Meta:
        model = Bookmark
        fields = ['id', 'path', 'created_at']

class TopicMaterialSerializer(serializers.ModelSerializer):
    class Meta:
        model = TopicMaterial
        fields = ['id', 'topic', 'file', 'uploaded_at', 'ai_status', 'ai_feedback']
        read_only_fields = ['user', 'ai_status', 'ai_feedback']

class TopicProgressSerializer(serializers.ModelSerializer):
    class Meta:
        model = TopicProgress
        fields = ['id', 'topic', 'status', 'started_at', 'completed_at']

class TopicNoteSerializer(serializers.ModelSerializer):
    class Meta:
        model = TopicNote
        fields = ['id', 'topic', 'content', 'updated_at']
        read_only_fields = ['user', 'topic', 'updated_at']

class ContributionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Contribution
        fields = ['date', 'action_type', 'points']

class NoteDocumentSerializer(serializers.ModelSerializer):
    file_url = serializers.SerializerMethodField()

    class Meta:
        model = NoteDocument
        fields = ['id', 'topic', 'file', 'filename', 'uploaded_at', 'file_url']
        read_only_fields = ['user', 'filename', 'uploaded_at']

    def get_file_url(self, obj):
        request = self.context.get('request')
        if request and obj.file:
            return request.build_absolute_uri(obj.file.url)
        return None
