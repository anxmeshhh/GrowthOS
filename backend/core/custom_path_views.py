"""
Custom Path Management API Views
Handles creation, cloning, sharing, and management of custom learning paths
"""
from rest_framework import viewsets, views, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from django.shortcuts import get_object_or_404
from django.db.models import Q
from django.utils.text import slugify
from .models import LearningPath, Topic, PathSharing, TopicProgress, Contribution
from .serializers import (
    LearningPathSerializer, PathSharingSerializer, CustomPathCreateSerializer, 
    PathCloneSerializer, TopicSerializer
)


class CustomPathViewSet(viewsets.ModelViewSet):
    """
    API endpoints for managing custom learning paths.
    Users can create, update, delete, clone, and share their custom paths.
    """
    permission_classes = [IsAuthenticated]
    serializer_class = LearningPathSerializer
    lookup_field = 'slug'

    def get_queryset(self):
        """Return custom paths created by user or shared with user"""
        user = self.request.user
        return LearningPath.objects.filter(
            Q(created_by=user, is_custom=True) |
            Q(shared_with_users__shared_to=user)
        ).distinct()

    def get_serializer_class(self):
        """Use different serializers for different actions"""
        if self.action == 'create':
            return CustomPathCreateSerializer
        elif self.action == 'clone':
            return PathCloneSerializer
        return LearningPathSerializer

    def create(self, request, *args, **kwargs):
        """Create a new custom path"""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        path = serializer.save(created_by=request.user, is_custom=True)

        # Process nested topics
        topics_data = request.data.get('topics', [])
        for idx, topic_data in enumerate(topics_data):
            if isinstance(topic_data, dict):
                t_title = topic_data.get('title', f'Topic {idx + 1}').strip()
                t_summary = topic_data.get('summary', '')
                t_kind = topic_data.get('node_kind', 'topic')
                if t_kind not in ('milestone', 'topic', 'optional'):
                    t_kind = 'topic'
                t_order = topic_data.get('order', idx)
            else:
                t_title = str(topic_data)
                t_summary = ''
                t_kind = 'topic'
                t_order = idx

            if not t_title:
                continue

            from django.utils.text import slugify as _slugify
            t_slug = _slugify(t_title)

            Topic.objects.create(
                path=path,
                title=t_title,
                slug=t_slug or f'topic-{idx}',
                summary=t_summary,
                node_kind=t_kind,
                order=t_order,
                created_by=request.user
            )

        # Award points for creating a custom path
        Contribution.objects.create(
            user=request.user,
            action_type='custom_path_created',
            points=1
        )
        
        output_serializer = LearningPathSerializer(path, context={'request': request})
        return Response(output_serializer.data, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        """Update a custom path (only by creator or admin)"""
        path = self.get_object()
        
        # Check permissions
        if path.created_by != request.user:
            sharing = PathSharing.objects.filter(
                path=path,
                shared_to=request.user,
                permission__in=['edit', 'admin']
            ).exists()
            if not sharing:
                return Response(
                    {'detail': 'You do not have permission to edit this path.'},
                    status=status.HTTP_403_FORBIDDEN
                )
        
        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        """Delete a custom path (only by creator)"""
        path = self.get_object()
        
        if path.created_by != request.user:
            return Response(
                {'detail': 'Only the creator can delete this path.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        return super().destroy(request, *args, **kwargs)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def clone(self, request, slug=None):
        """
        Clone an existing path (both custom and predefined).
        Creates a new custom path with all topics and their dependencies.
        """
        original_path = self.get_object()
        serializer = PathCloneSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        try:
            # Ensure new slug is unique
            new_slug = serializer.validated_data['new_slug']
            base_slug = new_slug
            counter = 1
            
            while LearningPath.objects.filter(slug=new_slug).exists():
                new_slug = f"{base_slug}-{counter}"
                counter += 1
            
            # Create new path
            new_path = LearningPath.objects.create(
                title=serializer.validated_data['new_title'],
                slug=new_slug,
                description=serializer.validated_data.get('description', original_path.description),
                is_custom=True,
                created_by=request.user,
                original_path=original_path,
                visibility='private'
            )
            
            # Clone all topics
            topic_mapping = {}  # Map old topic IDs to new topic IDs
            for topic in original_path.topics.all().order_by('order'):
                new_topic = Topic.objects.create(
                    path=new_path,
                    title=topic.title,
                    slug=topic.slug,
                    summary=topic.summary,
                    order=topic.order,
                    created_by=request.user
                )
                topic_mapping[topic.id] = new_topic
            
            # Clone topic dependencies
            for old_topic_id, new_topic in topic_mapping.items():
                old_topic = original_path.topics.get(id=old_topic_id)
                for dependency in old_topic.dependencies.all():
                    if dependency.id in topic_mapping:
                        new_topic.dependencies.add(topic_mapping[dependency.id])
            
            # Award points for cloning
            Contribution.objects.create(
                user=request.user,
                action_type='path_cloned',
                points=1
            )
            
            output_serializer = LearningPathSerializer(new_path, context={'request': request})
            return Response(output_serializer.data, status=status.HTTP_201_CREATED)
        
        except Exception as e:
            return Response(
                {'detail': f'Error cloning path: {str(e)}'},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=True, methods=['get'], permission_classes=[IsAuthenticated])
    def shared_with(self, request, slug=None):
        """
        Get list of users this path is shared with and their permissions.
        Only accessible by path creator.
        """
        path = self.get_object()
        
        if path.created_by != request.user:
            return Response(
                {'detail': 'Only the path creator can view sharing permissions.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        sharing = PathSharing.objects.filter(path=path)
        serializer = PathSharingSerializer(sharing, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def share(self, request, slug=None):
        """
        Share the path with another user.
        Only the path creator can share it.
        """
        path = self.get_object()
        
        if path.created_by != request.user:
            return Response(
                {'detail': 'Only the path creator can share it.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        from django.contrib.auth.models import User
        username = request.data.get('username')
        permission = request.data.get('permission', 'view')
        
        if not username:
            return Response(
                {'detail': 'Username is required.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            user_to_share = User.objects.get(username=username)
        except User.DoesNotExist:
            return Response(
                {'detail': 'User not found.'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        if user_to_share == request.user:
            return Response(
                {'detail': 'Cannot share path with yourself.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        sharing, created = PathSharing.objects.get_or_create(
            path=path,
            shared_to=user_to_share,
            defaults={'shared_by': request.user, 'permission': permission}
        )
        
        if not created:
            sharing.permission = permission
            sharing.save()
        
        serializer = PathSharingSerializer(sharing)
        status_code = status.HTTP_201_CREATED if created else status.HTTP_200_OK
        return Response(serializer.data, status=status_code)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def unshare(self, request, slug=None):
        """
        Remove sharing permission for a user.
        Only the path creator can unshare.
        """
        path = self.get_object()
        
        if path.created_by != request.user:
            return Response(
                {'detail': 'Only the path creator can unshare it.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        from django.contrib.auth.models import User
        username = request.data.get('username')
        
        if not username:
            return Response(
                {'detail': 'Username is required.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            user_to_unshare = User.objects.get(username=username)
            sharing = PathSharing.objects.get(path=path, shared_to=user_to_unshare)
            sharing.delete()
            return Response({'status': 'Sharing removed'})
        except (User.DoesNotExist, PathSharing.DoesNotExist):
            return Response(
                {'detail': 'Sharing relationship not found.'},
                status=status.HTTP_404_NOT_FOUND
            )

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def my_paths(self, request):
        """Get all custom paths created by the current user"""
        paths = LearningPath.objects.filter(created_by=request.user, is_custom=True)
        serializer = LearningPathSerializer(paths, many=True, context={'request': request})
        return Response(serializer.data)

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def shared_paths(self, request):
        """Get all paths shared with the current user"""
        paths = LearningPath.objects.filter(
            shared_with_users__shared_to=request.user
        ).distinct()
        serializer = LearningPathSerializer(paths, many=True, context={'request': request})
        return Response(serializer.data)

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def public_paths(self, request):
        """Get all public custom paths (not created by user)"""
        paths = LearningPath.objects.filter(
            is_custom=True,
            visibility='public'
        ).exclude(created_by=request.user)
        serializer = LearningPathSerializer(paths, many=True, context={'request': request})
        return Response(serializer.data)

    @action(detail=True, methods=['patch'], permission_classes=[IsAuthenticated])
    def update_visibility(self, request, slug=None):
        """Update path visibility (private, public, shared)"""
        path = self.get_object()
        
        if path.created_by != request.user:
            return Response(
                {'detail': 'Only the path creator can change visibility.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        visibility = request.data.get('visibility')
        if visibility not in ['private', 'public', 'shared']:
            return Response(
                {'detail': 'Invalid visibility option. Choose: private, public, shared'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        path.visibility = visibility
        path.save()
        
        serializer = LearningPathSerializer(path, context={'request': request})
        return Response(serializer.data)


class PathProgressView(views.APIView):
    """
    Get progress for a specific path.
    Shows completion status of all topics in the path for the current user.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, path_slug):
        path = get_object_or_404(LearningPath, slug=path_slug)
        
        # Check if user has access to this path
        has_access = (
            path.created_by == request.user or
            PathSharing.objects.filter(path=path, shared_to=request.user).exists() or
            (path.visibility == 'public' and path.is_custom)
        )
        
        if not has_access:
            return Response(
                {'detail': 'Access denied.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        topics_data = []
        total_topics = path.topics.count()
        completed_topics = 0
        
        for topic in path.topics.all().order_by('order'):
            progress, _ = TopicProgress.objects.get_or_create(
                user=request.user,
                topic=topic
            )
            
            if progress.status == 'completed':
                completed_topics += 1
            
            topics_data.append({
                'id': topic.id,
                'title': topic.title,
                'slug': topic.slug,
                'order': topic.order,
                'status': progress.status,
                'started_at': progress.started_at,
                'completed_at': progress.completed_at
            })
        
        return Response({
            'path': LearningPathSerializer(path, context={'request': request}).data,
            'topics': topics_data,
            'progress': {
                'total_topics': total_topics,
                'completed_topics': completed_topics,
                'completion_percentage': (completed_topics / total_topics * 100) if total_topics > 0 else 0
            }
        })
