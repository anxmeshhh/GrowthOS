from rest_framework import serializers
from .models import LearningPath, Topic, TopicProgress, Contribution, UserProfile, Bookmark, TopicMaterial, TopicNote, NoteDocument, VerifiedProject, PathSharing, TopicScreenshot
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
    verified_project = serializers.SerializerMethodField()
    has_submitted_work = serializers.SerializerMethodField()
    path_github_repo_name = serializers.CharField(source='path.github_repo_name', read_only=True)

    class Meta:
        model = Topic
        fields = ['id', 'title', 'slug', 'summary', 'order', 'node_kind', 'created_by', 'user_progress', 'dependencies', 'verified_project', 'has_submitted_work', 'path_github_repo_name']

    def get_user_progress(self, obj):
        if hasattr(obj, 'user_progress_cache'):
            if obj.user_progress_cache:
                status = obj.user_progress_cache[0].status
                return 'available' if status == 'locked' else status
            return 'available'
        
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            progress = TopicProgress.objects.filter(user=request.user, topic=obj).first()
            if progress:
                # Never expose 'locked' — treat it as 'available'
                return 'available' if progress.status == 'locked' else progress.status
        return 'available'

    def get_verified_project(self, obj):
        if hasattr(obj, 'verified_project_cache'):
            if obj.verified_project_cache:
                from .serializers import VerifiedProjectSerializer
                return VerifiedProjectSerializer(obj.verified_project_cache[0]).data
            return None
            
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            from .models import VerifiedProject
            project = VerifiedProject.objects.filter(user=request.user, topic=obj).first()
            if project:
                return VerifiedProjectSerializer(project).data
        return None

    def get_has_submitted_work(self, obj):
        if hasattr(obj, 'materials_cache'):
            return len(obj.materials_cache) > 0
            
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            from .models import TopicMaterial
            return TopicMaterial.objects.filter(user=request.user, topic=obj).exists()
        return False
        
class LearningPathSerializer(serializers.ModelSerializer):
    topics = TopicSerializer(many=True, read_only=True)
    is_bookmarked = serializers.SerializerMethodField()
    created_by_username = serializers.CharField(source='created_by.username', read_only=True)
    can_edit = serializers.SerializerMethodField()

    class Meta:
        model = LearningPath
        fields = ['id', 'title', 'slug', 'description', 'is_active', 'is_custom', 'created_by', 'created_by_username', 'topics', 'is_bookmarked', 'visibility', 'estimated_weeks', 'created_at', 'updated_at', 'can_edit', 'original_path']

    def get_is_bookmarked(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return Bookmark.objects.filter(user=request.user, path=obj).exists()
        return False
    
    def get_can_edit(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            if obj.created_by == request.user:
                return True
            # Check if user has edit permission
            sharing = PathSharing.objects.filter(path=obj, shared_to=request.user, permission__in=['edit', 'admin']).exists()
            return sharing
        return False

class BookmarkSerializer(serializers.ModelSerializer):
    path = LearningPathSerializer(read_only=True)
    class Meta:
        model = Bookmark
        fields = ['id', 'path', 'created_at']

class TopicMaterialSerializer(serializers.ModelSerializer):
    class Meta:
        model = TopicMaterial
        fields = ['id', 'topic', 'file', 'uploaded_at', 'ai_status', 'ai_feedback', 'ai_score']
        read_only_fields = ['user', 'ai_status', 'ai_feedback', 'ai_score']

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

class TopicScreenshotSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = TopicScreenshot
        fields = ['id', 'topic', 'image', 'caption', 'uploaded_at', 'image_url']
        read_only_fields = ['user', 'uploaded_at']

    def get_image_url(self, obj):
        request = self.context.get('request')
        if request and obj.image:
            return request.build_absolute_uri(obj.image.url)
        return None

class VerifiedProjectSerializer(serializers.ModelSerializer):
    topic_title = serializers.CharField(source='topic.title', read_only=True)
    topic_slug = serializers.CharField(source='topic.slug', read_only=True)

    class Meta:
        model = VerifiedProject
        fields = ['id', 'topic', 'topic_title', 'topic_slug', 'repo_url', 'repo_name', 'ai_evaluation', 'ai_score', 'verified_at']
        read_only_fields = ['user', 'verified_at']

class PathSharingSerializer(serializers.ModelSerializer):
    shared_to_username = serializers.CharField(source='shared_to.username', read_only=True)
    shared_by_username = serializers.CharField(source='shared_by.username', read_only=True)
    path_title = serializers.CharField(source='path.title', read_only=True)

    class Meta:
        model = PathSharing
        fields = ['id', 'path', 'path_title', 'shared_by', 'shared_by_username', 'shared_to', 'shared_to_username', 'permission', 'created_at']
        read_only_fields = ['shared_by', 'created_at']

class CustomPathCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = LearningPath
        fields = ['title', 'slug', 'description', 'estimated_weeks']
    
    def validate_slug(self, value):
        """Ensure slug is unique"""
        if LearningPath.objects.filter(slug=value).exists():
            raise serializers.ValidationError(
                "A path with this slug already exists. Please use a different slug."
            )
        return value
    
    def create(self, validated_data):
        """Create custom path with unique slug"""
        validated_data['is_custom'] = True
        validated_data['created_by'] = self.context['request'].user
        
        # Ensure slug is unique by appending counter if needed
        slug = validated_data.get('slug')
        base_slug = slug
        counter = 1
        
        while LearningPath.objects.filter(slug=slug).exists():
            slug = f"{base_slug}-{counter}"
            counter += 1
        
        validated_data['slug'] = slug
        return super().create(validated_data)

class PathCloneSerializer(serializers.Serializer):
    new_title = serializers.CharField(max_length=200)
    new_slug = serializers.SlugField()
    description = serializers.CharField(required=False, allow_blank=True)
