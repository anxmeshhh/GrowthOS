from rest_framework import viewsets, views, generics, status
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.parsers import MultiPartParser, FormParser
from django.db.models import Sum, Q
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.conf import settings

from .models import LearningPath, Topic, Contribution, Bookmark, TopicProgress, TopicMaterial, TopicNote, NoteDocument
from .serializers import (
    LearningPathSerializer, TopicSerializer, ContributionSerializer, 
    RegisterSerializer, UserSerializer, BookmarkSerializer, 
    TopicMaterialSerializer, TopicProgressSerializer, TopicNoteSerializer,
    NoteDocumentSerializer
)

class RegisterView(generics.CreateAPIView):
    queryset = UserSerializer.Meta.model.objects.all()
    permission_classes = (AllowAny,)
    serializer_class = RegisterSerializer

class LearningPathViewSet(viewsets.ModelViewSet):
    serializer_class = LearningPathSerializer
    lookup_field = 'slug'

    def get_queryset(self):
        if self.request.user.is_authenticated:
            return LearningPath.objects.filter(
                Q(is_active=True, is_custom=False) | Q(created_by=self.request.user)
            )
        return LearningPath.objects.filter(is_active=True, is_custom=False)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def bookmark(self, request, slug=None):
        path = self.get_object()
        bookmark, created = Bookmark.objects.get_or_create(user=request.user, path=path)
        if not created:
            bookmark.delete()
            return Response({'status': 'unbookmarked'})
        return Response({'status': 'bookmarked'})

class BookmarkViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = BookmarkSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Bookmark.objects.filter(user=self.request.user)

class CustomPathView(views.APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        title = request.data.get('title')
        topics_data = request.data.get('topics', [])
        
        path = LearningPath.objects.create(
            title=title, 
            slug=title.lower().replace(" ", "-") + f"-{request.user.id}", 
            is_custom=True, 
            created_by=request.user
        )
        
        created_topics = {}
        for idx, topic_data in enumerate(topics_data):
            t_title = topic_data.get('title') if isinstance(topic_data, dict) else str(topic_data)
            t = Topic.objects.create(
                path=path,
                title=t_title,
                slug=t_title.lower().replace(" ", "-"),
                order=idx,
                created_by=request.user
            )
            created_topics[idx] = t
            
        for idx, topic_data in enumerate(topics_data):
            if isinstance(topic_data, dict):
                deps = topic_data.get('dependencies', [])
                for dep_idx in deps:
                    if dep_idx in created_topics:
                        created_topics[idx].dependencies.add(created_topics[dep_idx])
                        
        return Response(LearningPathSerializer(path, context={'request': request}).data)

class TopicDetailView(views.APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        topic = _resolve_topic(pk)
        
        progress, _ = TopicProgress.objects.get_or_create(user=request.user, topic=topic)
        materials = TopicMaterial.objects.filter(user=request.user, topic=topic)
        
        return Response({
            'topic': TopicSerializer(topic).data,
            'progress': TopicProgressSerializer(progress).data,
            'materials': TopicMaterialSerializer(materials, many=True).data
        })

def _resolve_topic(pk):
    """Resolve a topic by numeric ID or slug."""
    try:
        return Topic.objects.get(pk=int(pk))
    except (ValueError, Topic.DoesNotExist):
        return get_object_or_404(Topic, slug=pk)

class TopicProgressUpdateView(views.APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        topic = _resolve_topic(pk)
        progress, _ = TopicProgress.objects.get_or_create(user=request.user, topic=topic)
        new_status = request.data.get('status')
        if new_status in dict(TopicProgress.STATUS_CHOICES):
            progress.status = new_status
            if new_status == 'in_progress' and not progress.started_at:
                progress.started_at = timezone.now()
            progress.save()
        return Response(TopicProgressSerializer(progress).data)

class TopicMaterialUploadView(views.APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = (MultiPartParser, FormParser)

    def post(self, request, pk):
        topic = _resolve_topic(pk)
        file_obj = request.data.get('file')
        if not file_obj:
            return Response({'error': 'No file provided'}, status=status.HTTP_400_BAD_REQUEST)
            
        material = TopicMaterial.objects.create(
            user=request.user,
            topic=topic,
            file=file_obj
        )
        return Response(TopicMaterialSerializer(material).data, status=status.HTTP_201_CREATED)

import os
import PyPDF2
from groq import Groq

class VerifyMaterialView(views.APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        material = get_object_or_404(TopicMaterial, pk=pk, user=request.user)
        
        # Read PDF content
        text = ""
        try:
            with open(material.file.path, 'rb') as f:
                reader = PyPDF2.PdfReader(f)
                for page in reader.pages:
                    text += page.extract_text() + "\n"
        except Exception as e:
            return Response({'error': f"Failed to read file: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)

        # Truncate text to avoid token limits
        text = text[:8000]

        try:
            client = Groq(api_key=os.environ.get("GROQ_API_KEY") or getattr(settings, "GROQ_API_KEY", ""))
            chat_completion = client.chat.completions.create(
                messages=[
                    {
                        "role": "system",
                        "content": "You are an AI teaching assistant. Determine if the following uploaded proof of work adequately covers the topic. Reply exactly with 'VERIFIED' or 'REJECTED' on the first line, followed by a short encouraging feedback message on the next lines."
                    },
                    {
                        "role": "user",
                        "content": f"Topic: {material.topic.title}\n\nUser's Submission Text:\n{text}"
                    }
                ],
                model="llama-3.1-8b-instant",
                temperature=0.3,
            )
            response_content = chat_completion.choices[0].message.content.strip()
            first_line = response_content.split('\n')[0].strip().upper()
            
            if 'VERIFIED' in first_line:
                material.ai_status = 'verified'
            else:
                material.ai_status = 'rejected'
                
            material.ai_feedback = response_content
            material.save()
            
            progress, _ = TopicProgress.objects.get_or_create(user=request.user, topic=material.topic)
            if material.ai_status == 'verified' and progress.status != 'completed':
                progress.status = 'completed'
                progress.completed_at = timezone.now()
                progress.save()
                Contribution.objects.create(user=request.user, action_type='topic_verified', points=5)
                
        except Exception as e:
            return Response({'error': f"AI Verification failed: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response({
            'material': TopicMaterialSerializer(material).data,
            'progress': TopicProgressSerializer(progress).data
        })

class HeatmapView(views.APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        contributions = Contribution.objects.filter(user=request.user).values('date').annotate(total_points=Sum('points'))
        data = [{"date": str(c['date']), "count": c['total_points']} for c in contributions]
        return Response(data)

class TopicNoteView(views.APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, topic_id):
        topic = _resolve_topic(topic_id)
        note, _ = TopicNote.objects.get_or_create(user=request.user, topic=topic)
        serializer = TopicNoteSerializer(note)
        return Response(serializer.data)

    def post(self, request, topic_id):
        topic = _resolve_topic(topic_id)
        note, _ = TopicNote.objects.get_or_create(user=request.user, topic=topic)
        note.content = request.data.get('content', '')
        note.save()
        serializer = TopicNoteSerializer(note)
        return Response(serializer.data)

class TopicQuizView(views.APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, topic_id):
        topic = _resolve_topic(topic_id)
        difficulty = request.query_params.get('difficulty', 'medium')
        count = int(request.query_params.get('count', '5'))
        try:
            client = Groq(api_key=os.environ.get("GROQ_API_KEY") or getattr(settings, "GROQ_API_KEY", ""))
            prompt = f"Generate exactly {count} multiple choice quiz questions about: '{topic.title}'. Summary: {topic.summary}. Difficulty level: {difficulty}. For easy: basic recall. For medium: application/understanding. For hard: analysis/edge cases. Return ONLY a JSON array where each object has: 'question' (string), 'options' (array of 4 strings), 'answer' (exact string matching one option)."
            chat_completion = client.chat.completions.create(
                messages=[{"role": "user", "content": prompt}],
                model="llama-3.1-8b-instant",
                temperature=0.3,
            )
            response_content = chat_completion.choices[0].message.content.strip()
            if response_content.startswith("```json"):
                response_content = response_content[7:-3]
            elif response_content.startswith("```"):
                response_content = response_content[3:-3]
                
            import json
            questions = json.loads(response_content)
            return Response({'questions': questions})
        except Exception as e:
            return Response({'error': str(e)}, status=500)

class TopicFlashcardView(views.APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, topic_id):
        topic = _resolve_topic(topic_id)
        try:
            client = Groq(api_key=os.environ.get("GROQ_API_KEY") or getattr(settings, "GROQ_API_KEY", ""))
            prompt = f"Generate exactly 5 flashcards for the topic: '{topic.title}'. Summary: {topic.summary}. Return ONLY a JSON array where each object has: 'front' (the term or concept), 'back' (the definition or explanation)."
            chat_completion = client.chat.completions.create(
                messages=[{"role": "user", "content": prompt}],
                model="llama-3.1-8b-instant",
                temperature=0.3,
            )
            response_content = chat_completion.choices[0].message.content.strip()
            if response_content.startswith("```json"):
                response_content = response_content[7:-3]
            elif response_content.startswith("```"):
                response_content = response_content[3:-3]
                
            import json
            flashcards = json.loads(response_content)
            return Response({'flashcards': flashcards})
        except Exception as e:
            return Response({'error': str(e)}, status=500)

class ProjectIdeasView(views.APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, topic_id):
        topic = _resolve_topic(topic_id)
        try:
            client = Groq(api_key=os.environ.get("GROQ_API_KEY") or getattr(settings, "GROQ_API_KEY", ""))
            prompt = f"Generate exactly 3 project ideas for a student learning '{topic.title}'. Return ONLY a JSON array where each object has: 'title' (short project name), 'description' (2-3 sentence description of what to build and what skills it demonstrates)."
            chat_completion = client.chat.completions.create(
                messages=[{"role": "user", "content": prompt}],
                model="llama-3.1-8b-instant",
                temperature=0.7,
            )
            response_content = chat_completion.choices[0].message.content.strip()
            if response_content.startswith("```json"):
                response_content = response_content[7:-3]
            elif response_content.startswith("```"):
                response_content = response_content[3:-3]
            import json
            ideas = json.loads(response_content)
            return Response({'ideas': ideas})
        except Exception as e:
            return Response({'error': str(e)}, status=500)

import requests as http_requests

class ScanRepoView(views.APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, topic_id):
        topic = get_object_or_404(Topic, id=topic_id)
        repo_url = request.data.get('repo_url', '')
        if not repo_url:
            return Response({'error': 'No repo_url provided'}, status=400)

        # Extract owner/repo from GitHub URL
        try:
            parts = repo_url.rstrip('/').split('/')
            owner, repo = parts[-2], parts[-1]
        except Exception:
            return Response({'error': 'Invalid GitHub URL'}, status=400)

        # Fetch README via GitHub API
        readme_text = ""
        try:
            api_url = f"https://api.github.com/repos/{owner}/{repo}/readme"
            headers = {'Accept': 'application/vnd.github.v3.raw'}
            resp = http_requests.get(api_url, headers=headers, timeout=10)
            if resp.status_code == 200:
                readme_text = resp.text[:6000]
            else:
                readme_text = "(README not found)"
        except Exception:
            readme_text = "(Could not fetch README)"

        # Fetch repo file tree
        tree_text = ""
        try:
            tree_url = f"https://api.github.com/repos/{owner}/{repo}/git/trees/main?recursive=1"
            resp = http_requests.get(tree_url, timeout=10)
            if resp.status_code == 200:
                files = [item['path'] for item in resp.json().get('tree', [])[:50]]
                tree_text = "\n".join(files)
        except Exception:
            tree_text = "(Could not fetch file tree)"

        try:
            client = Groq(api_key=os.environ.get("GROQ_API_KEY") or getattr(settings, "GROQ_API_KEY", ""))
            prompt = f"""You are evaluating a student's GitHub project for the topic: '{topic.title}'.

Repository: {repo_url}
File structure:
{tree_text}

README:
{readme_text}

Does this project adequately demonstrate understanding of '{topic.title}'?
Reply with EXACTLY this JSON format:
{{"passed": true/false, "feedback": "your detailed feedback"}}"""
            chat_completion = client.chat.completions.create(
                messages=[{"role": "user", "content": prompt}],
                model="llama-3.1-8b-instant",
                temperature=0.3,
            )
            response_content = chat_completion.choices[0].message.content.strip()
            if response_content.startswith("```json"):
                response_content = response_content[7:-3]
            elif response_content.startswith("```"):
                response_content = response_content[3:-3]
            import json
            result = json.loads(response_content)

            # Mark topic complete if passed
            if result.get('passed'):
                progress, _ = TopicProgress.objects.get_or_create(user=request.user, topic=topic)
                if progress.status != 'completed':
                    progress.status = 'completed'
                    progress.completed_at = timezone.now()
                    progress.save()
                    Contribution.objects.create(user=request.user, action_type='topic_verified', points=5)

            return Response(result)
        except Exception as e:
            return Response({'error': str(e)}, status=500)

class NoteDocumentView(views.APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = (MultiPartParser, FormParser)

    def get(self, request, topic_id):
        topic = _resolve_topic(topic_id)
        docs = NoteDocument.objects.filter(user=request.user, topic=topic)
        serializer = NoteDocumentSerializer(docs, many=True, context={'request': request})
        return Response(serializer.data)

    def post(self, request, topic_id):
        topic = _resolve_topic(topic_id)
        file_obj = request.data.get('file')
        if not file_obj:
            return Response({'error': 'No file provided'}, status=status.HTTP_400_BAD_REQUEST)
        doc = NoteDocument.objects.create(
            user=request.user,
            topic=topic,
            file=file_obj,
            filename=file_obj.name
        )
        serializer = NoteDocumentSerializer(doc, context={'request': request})
        return Response(serializer.data, status=status.HTTP_201_CREATED)

class AllNotesView(views.APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        notes = TopicNote.objects.filter(user=request.user).select_related('topic')
        serializer = TopicNoteSerializer(notes, many=True)
        return Response(serializer.data)

class AllNoteDocumentsView(views.APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        docs = NoteDocument.objects.filter(user=request.user).select_related('topic')
        serializer = NoteDocumentSerializer(docs, many=True, context={'request': request})
        return Response(serializer.data)
