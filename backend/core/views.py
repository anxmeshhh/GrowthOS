from rest_framework import viewsets, views, generics, status
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.parsers import MultiPartParser, FormParser
from django.db.models import Sum, Q, Count
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.conf import settings

from .models import LearningPath, Topic, Contribution, Bookmark, TopicProgress, TopicMaterial, TopicNote, NoteDocument, ChatMessage, UserProfile, TopicQuiz, TopicFlashcard, VerifiedProject, PathSharing, TopicScreenshot
from .serializers import (
    LearningPathSerializer, TopicSerializer, ContributionSerializer, 
    RegisterSerializer, UserSerializer, BookmarkSerializer, 
    TopicMaterialSerializer, TopicProgressSerializer, TopicNoteSerializer,
    NoteDocumentSerializer, VerifiedProjectSerializer, PathSharingSerializer, CustomPathCreateSerializer, PathCloneSerializer,
    TopicScreenshotSerializer
)

class RegisterView(generics.CreateAPIView):
    queryset = UserSerializer.Meta.model.objects.all()
    permission_classes = (AllowAny,)
    serializer_class = RegisterSerializer

    def create(self, request, *args, **kwargs):
        response = super().create(request, *args, **kwargs)
        from django.contrib.auth.models import User
        user = User.objects.get(username=request.data.get('username'))
        Contribution.objects.create(user=user, action_type='signup_bonus', points=50)
        return response

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
        # Award only if user has never bookmarked this path before (first-time only)
        already_awarded = Contribution.objects.filter(
            user=request.user,
            action_type='path_bookmarked',
        ).count()
        if already_awarded < Bookmark.objects.filter(user=request.user).count():
            Contribution.objects.create(user=request.user, action_type='path_bookmarked', points=3)
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
            t_summary = topic_data.get('summary', '') if isinstance(topic_data, dict) else ''
            t = Topic.objects.create(
                path=path,
                title=t_title,
                slug=t_title.lower().replace(" ", "-"),
                summary=t_summary,
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
        topic = Topic.objects.filter(slug=pk).first()
        if topic is None:
            from django.http import Http404
            raise Http404(f"No topic found with slug '{pk}'")
        return topic

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
import json
import re

class GeneratePathView(views.APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        prompt = request.data.get('prompt', '')
        if not prompt:
            return Response({'error': 'Prompt is required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            client = Groq(api_key=os.environ.get("GROQ_API_KEY") or getattr(settings, "GROQ_API_KEY", ""))
            ai_prompt = f"""Generate a sequential learning roadmap based on this request: "{prompt}".
Return EXACTLY a JSON object with this schema:
{{
  "title": "A short, catchy title for the roadmap",
  "topics": [
    {{
      "title": "Topic 1 Name",
      "subtopics": ["Subtopic A", "Subtopic B"]
    }},
    {{
      "title": "Topic 2 Name",
      "subtopics": ["Subtopic C", "Subtopic D"]
    }}
  ]
}}
Generate between 5 to 10 topics. Return ONLY the JSON, nothing else."""

            chat_completion = client.chat.completions.create(
                messages=[{"role": "user", "content": ai_prompt}],
                model="llama-3.1-8b-instant",
                temperature=0.7,
            )
            response_content = chat_completion.choices[0].message.content.strip()
            
            # Extract JSON if markdown wrapped
            match = re.search(r'\{.*\}', response_content, re.DOTALL)
            if match:
                data = json.loads(match.group(0))
            else:
                data = json.loads(response_content)
                
            return Response(data)
        except Exception as e:
            return Response({'error': f"AI generation failed: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


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
                        "content": "You are an AI teaching assistant. Determine if the following uploaded proof of work adequately covers the topic. Reply exactly with this JSON format: {\"score\": integer_0_to_100, \"feedback\": \"your encouraging feedback\"}"
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
            if response_content.startswith("```json"):
                response_content = response_content[7:-3]
            elif response_content.startswith("```"):
                response_content = response_content[3:-3]
            import json
            result = json.loads(response_content)
            
            score = result.get('score', 0)
            feedback = result.get('feedback', '')
            passed = score >= 65
            
            material.ai_status = 'verified' if passed else 'rejected'
            material.ai_feedback = feedback
            material.ai_score = score
            material.save()
            
            progress, _ = TopicProgress.objects.get_or_create(user=request.user, topic=material.topic)
            if passed:
                from .models import VerifiedProject
                repo_url = request.build_absolute_uri(material.file.url) if material.file else ""
                repo_name = material.file.name.split('/')[-1] if material.file else "Document Submission"
                VerifiedProject.objects.update_or_create(
                    user=request.user,
                    topic=material.topic,
                    defaults={
                        'repo_url': repo_url,
                        'repo_name': repo_name,
                        'ai_evaluation': feedback,
                        'ai_score': score
                    }
                )
                
                if progress.status != 'completed':
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
        from django.db.models.functions import TruncDate
        contributions = Contribution.objects.filter(user=request.user) \
            .annotate(date=TruncDate('created_at')) \
            .values('date') \
            .annotate(total_points=Sum('points'))
        data = [{"date": str(c['date']), "count": c['total_points']} for c in contributions]
        return Response(data)

class RecentActivityView(views.APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        acts = Contribution.objects.filter(user=request.user).order_by('-created_at')[:10]
        data = []
        label_map = {
            'topic_verified': 'Verified proof of work',
            'notes_uploaded': 'Updated study notes',
            'signup_bonus': 'Welcome to GrowthOS!',
            'daily_login': 'Daily streak bonus',
            'quiz_passed': 'Quiz mastered',
            'flashcards_reviewed': 'Reviewed flashcards',
            'path_bookmarked': 'Bookmarked a learning path',
            'streak_milestone': 'Streak milestone reached',
        }
        for a in acts:
            label = label_map.get(a.action_type, a.action_type.replace('_', ' ').title())
            label = f"{label} (+{a.points} XP)"
            data.append({
                "id": a.id,
                "label": label,
                "action_type": a.action_type,
                "points": a.points,
                "date": a.created_at.isoformat()
            })
        return Response(data)

class DailyLoginView(views.APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        today = timezone.now().date()
        has_logged_in = Contribution.objects.filter(
            user=request.user, 
            action_type='daily_login',
            created_at__date=today
        ).exists()

        bonus_messages = []
        if not has_logged_in:
            Contribution.objects.create(user=request.user, action_type='daily_login', points=5)
            bonus_messages.append({"type": "daily_login", "points": 5, "message": "Daily login bonus awarded!"})
            
            # Calculate current streak for milestone check
            streak = 0
            check = today
            while True:
                if Contribution.objects.filter(user=request.user, action_type='daily_login', created_at__date=check).exists():
                    streak += 1
                    check -= timezone.timedelta(days=1)
                else:
                    break
            
            # Award streak milestones (7, 14, 30 days)
            for milestone in [7, 14, 30]:
                if streak == milestone:
                    already = Contribution.objects.filter(
                        user=request.user, action_type='streak_milestone', points=milestone
                    ).exists()
                    if not already:
                        Contribution.objects.create(user=request.user, action_type='streak_milestone', points=10)
                        bonus_messages.append({"type": "streak_milestone", "points": 10, "message": f"🔥 {milestone}-day streak milestone!"})
            
            return Response({"status": "awarded", "bonuses": bonus_messages})
        
        return Response({"status": "already_awarded", "message": "Already claimed today."})

class ChatAssistantView(views.APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        messages = ChatMessage.objects.filter(user=request.user).order_by('-created_at')[:50]
        messages = reversed(messages) # Oldest first for chat UI
        data = [{"id": str(m.id), "role": m.role, "content": m.content} for m in messages]
        return Response(data)

    def delete(self, request):
        ChatMessage.objects.filter(user=request.user).delete()
        return Response({"status": "cleared"})

    def post(self, request):
        user = request.user
        user_message = request.data.get('message', '')
        if not user_message:
            return Response({'error': 'Message is required'}, status=status.HTTP_400_BAD_REQUEST)

        # Context gathering
        total_xp = Contribution.objects.filter(user=user).aggregate(Sum('points'))['points__sum'] or 0
        level = 1
        if total_xp >= 500: level = 6
        elif total_xp >= 250: level = 5
        elif total_xp >= 100: level = 4
        elif total_xp >= 50: level = 3
        elif total_xp >= 20: level = 2

        active_path = "None"
        bookmark = Bookmark.objects.filter(user=user).select_related('path').first()
        if bookmark:
            active_path = bookmark.path.title

        recent_acts = Contribution.objects.filter(user=user).order_by('-created_at')[:3]
        recent_activity_str = ", ".join([f"{a.action_type}" for a in recent_acts]) or "None"

        system_prompt = f"""You are GrowthOS, an elite AI mentor for '{user.username}'.
User Context:
- Level: {level}
- Total XP: {total_xp}
- Active Path: {active_path}
- Recent Activity: {recent_activity_str}

Your goal is to aggressively motivate them, answer their technical questions concisely, and push them to earn more XP. Keep responses short and punchy. Address them by name occasionally.
"""
        try:
            from groq import Groq
            import os
            client = Groq(api_key=os.environ.get("GROQ_API_KEY") or getattr(settings, "GROQ_API_KEY", ""))
            
            # Save user message
            ChatMessage.objects.create(user=user, role='user', content=user_message)

            # Build message history for Groq
            history = ChatMessage.objects.filter(user=user).order_by('-created_at')[:10]
            history = reversed(history)
            
            groq_messages = [{"role": "system", "content": system_prompt}]
            for h in history:
                groq_messages.append({"role": "assistant" if h.role == "ai" else "user", "content": h.content})

            chat_completion = client.chat.completions.create(
                messages=groq_messages,
                model="llama-3.1-8b-instant",
                temperature=0.7,
                max_tokens=250,
            )
            reply = chat_completion.choices[0].message.content.strip()
            
            # Save AI response
            ChatMessage.objects.create(user=user, role='ai', content=reply)

            return Response({"reply": reply})
        except Exception as e:
            return Response({'error': f"AI Chat failed: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class TopicNoteView(views.APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, topic_id):
        topic = _resolve_topic(topic_id)
        note, _ = TopicNote.objects.get_or_create(user=request.user, topic=topic)
        serializer = TopicNoteSerializer(note)
        return Response(serializer.data)

    def post(self, request, topic_id):
        topic = _resolve_topic(topic_id)
        note, created = TopicNote.objects.get_or_create(user=request.user, topic=topic)
        note.content = request.data.get('content', '')
        note.save()
        
        # Award 1 point for saving notes, max once per topic per day
        today = timezone.now().date()
        already_awarded = Contribution.objects.filter(
            user=request.user,
            action_type='notes_uploaded',
            created_at__date=today
        ).exists()
        if not already_awarded:
            Contribution.objects.create(user=request.user, action_type='notes_uploaded', points=1)
        
        serializer = TopicNoteSerializer(note)
        return Response(serializer.data)

class TopicQuizView(views.APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, topic_id):
        topic = _resolve_topic(topic_id)
        difficulty = request.query_params.get('difficulty', 'medium')
        count = int(request.query_params.get('count', '5'))
        quiz = TopicQuiz.objects.filter(user=request.user, topic=topic, difficulty=difficulty).first()
        if quiz and len(quiz.questions) >= count:
            return Response({'questions': quiz.questions[:count]})
            
        try:
            client = Groq(api_key=os.environ.get("GROQ_API_KEY") or getattr(settings, "GROQ_API_KEY", ""))
            prompt = f"Generate exactly {count} multiple choice quiz questions about: '{topic.title}'. Summary: {topic.summary}. Difficulty level: {difficulty}. For easy: basic recall. For medium: application/understanding. For hard: analysis/edge cases. Return ONLY a JSON array where each object has: 'question' (string), 'options' (array of 4 strings), 'answer' (exact string matching one option)."
            chat_completion = client.chat.completions.create(
                messages=[{"role": "user", "content": prompt}],
                model="llama-3.1-8b-instant",
                temperature=0.3,
            )
            response_content = chat_completion.choices[0].message.content.strip()
            import json, re
            match = re.search(r'\[.*\]', response_content, re.DOTALL)
            if match:
                questions = json.loads(match.group(0))
            else:
                questions = json.loads(response_content)
            
            TopicQuiz.objects.update_or_create(
                user=request.user, topic=topic, difficulty=difficulty,
                defaults={'questions': questions}
            )
            return Response({'questions': questions[:count]})
        except Exception as e:
            return Response({'error': str(e)}, status=500)

class TopicFlashcardView(views.APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, topic_id):
        topic = _resolve_topic(topic_id)
        flashcard = TopicFlashcard.objects.filter(user=request.user, topic=topic).first()
        if flashcard and len(flashcard.cards) >= 5:
            return Response({'flashcards': flashcard.cards[:5]})
            
        try:
            client = Groq(api_key=os.environ.get("GROQ_API_KEY") or getattr(settings, "GROQ_API_KEY", ""))
            prompt = f"Generate exactly 5 flashcards for the topic: '{topic.title}'. Summary: {topic.summary}. Return ONLY a JSON array where each object has: 'front' (the term or concept), 'back' (the definition or explanation)."
            chat_completion = client.chat.completions.create(
                messages=[{"role": "user", "content": prompt}],
                model="llama-3.1-8b-instant",
                temperature=0.3,
            )
            response_content = chat_completion.choices[0].message.content.strip()
            import json, re
            match = re.search(r'\[.*\]', response_content, re.DOTALL)
            if match:
                flashcards = json.loads(match.group(0))
            else:
                flashcards = json.loads(response_content)
            
            TopicFlashcard.objects.update_or_create(
                user=request.user, topic=topic,
                defaults={'cards': flashcards}
            )
            return Response({'flashcards': flashcards[:5]})
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
        topic = _resolve_topic(topic_id)
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
{{"passed": true/false, "score": integer_0_to_100, "feedback": "your detailed feedback"}}"""
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

            score = result.get('score', 0)
            passed = score >= 65 and result.get('passed', False)

            if passed:
                project, _ = VerifiedProject.objects.update_or_create(
                    user=request.user,
                    topic=topic,
                    defaults={
                        'repo_url': repo_url,
                        'repo_name': repo,
                        'ai_evaluation': result.get('feedback', ''),
                        'ai_score': score
                    }
                )
            # Only mark progress as completed if passed (score >= 65)
            if passed:
                progress, _ = TopicProgress.objects.get_or_create(user=request.user, topic=topic)
                if progress.status != 'completed':
                    progress.status = 'completed'
                    progress.completed_at = timezone.now()
                    progress.save()
                    Contribution.objects.create(user=request.user, action_type='topic_verified', points=5)

            result['passed'] = passed # override the AI's "passed" with our 65 rule
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

class TopicScreenshotView(views.APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = (MultiPartParser, FormParser)

    def get(self, request, topic_id):
        topic = _resolve_topic(topic_id)
        screenshots = TopicScreenshot.objects.filter(user=request.user, topic=topic)
        serializer = TopicScreenshotSerializer(screenshots, many=True, context={'request': request})
        return Response(serializer.data)

    def post(self, request, topic_id):
        topic = _resolve_topic(topic_id)
        image = request.data.get('image')
        if not image:
            return Response({'error': 'No image provided'}, status=status.HTTP_400_BAD_REQUEST)
        caption = request.data.get('caption', '')
        screenshot = TopicScreenshot.objects.create(
            user=request.user,
            topic=topic,
            image=image,
            caption=caption
        )
        serializer = TopicScreenshotSerializer(screenshot, context={'request': request})
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def delete(self, request, topic_id):
        screenshot_id = request.query_params.get('id')
        if not screenshot_id:
            return Response({'error': 'No screenshot ID provided'}, status=status.HTTP_400_BAD_REQUEST)
        screenshot = get_object_or_404(TopicScreenshot, id=screenshot_id, user=request.user)
        screenshot.delete()
        return Response({'status': 'deleted'})

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

class SubmitQuizView(views.APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, topic_id):
        topic = _resolve_topic(topic_id)
        score = request.data.get('score', 0)
        total = request.data.get('total', 1)
        percentage = score / total if total > 0 else 0

        if percentage >= 0.8:
            # Award max once per topic per day
            today = timezone.now().date()
            already_awarded = Contribution.objects.filter(
                user=request.user,
                action_type='quiz_passed',
                created_at__date=today
            ).exists()
            xp = 5 if not already_awarded else 0
            if not already_awarded:
                Contribution.objects.create(user=request.user, action_type='quiz_passed', points=5)
            return Response({"status": "passed", "xp_earned": xp})
        
        return Response({"status": "failed", "xp_earned": 0})

class UserProfileView(views.APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        profile, _ = UserProfile.objects.get_or_create(user=user)
        total_xp = Contribution.objects.filter(user=user).aggregate(Sum('points'))['points__sum'] or 0
        
        level = 1
        if total_xp >= 500: level = 6
        elif total_xp >= 250: level = 5
        elif total_xp >= 100: level = 4
        elif total_xp >= 50: level = 3
        elif total_xp >= 20: level = 2

        # Stats
        topics_completed = TopicProgress.objects.filter(user=user, status='completed').count()
        notes_written = TopicNote.objects.filter(user=user).exclude(content='').count()
        quizzes_passed = Contribution.objects.filter(user=user, action_type='quiz_passed').count()
        
        # Streak calculation
        today = timezone.now().date()
        streak = 0
        check = today
        while True:
            if Contribution.objects.filter(user=user, action_type='daily_login', created_at__date=check).exists():
                streak += 1
                check -= timezone.timedelta(days=1)
            else:
                break

        # XP breakdown by action type
        xp_breakdown = list(
            Contribution.objects.filter(user=user)
            .values('action_type')
            .annotate(total=Sum('points'), count=Count('id'))
            .order_by('-total')
        )

        # Completed paths
        completed_topics_qs = TopicProgress.objects.filter(user=user, status='completed').select_related('topic__path')
        paths = set(tp.topic.path for tp in completed_topics_qs if tp.topic.path)
        path_list = [{"id": p.id, "title": p.title, "slug": p.slug} for p in paths]

        # Achievement badges (computed on-the-fly)
        badges = []
        if Contribution.objects.filter(user=user, action_type='signup_bonus').exists():
            badges.append({"id": "first_login", "title": "Newcomer", "icon": "🌟", "desc": "Signed up for GrowthOS"})
        if streak >= 7:
            badges.append({"id": "streak_7", "title": "Consistent", "icon": "🔥", "desc": "7-day login streak"})
        if streak >= 30:
            badges.append({"id": "streak_30", "title": "Unstoppable", "icon": "💎", "desc": "30-day login streak"})
        if quizzes_passed >= 1:
            badges.append({"id": "quiz_first", "title": "Quiz Taker", "icon": "✅", "desc": "Passed your first quiz"})
        if quizzes_passed >= 10:
            badges.append({"id": "quiz_master", "title": "Quiz Master", "icon": "🏆", "desc": "Passed 10 quizzes"})
        if topics_completed >= 5:
            badges.append({"id": "5_topics", "title": "Scholar", "icon": "📚", "desc": "Verified 5 topics"})
        if notes_written >= 10:
            badges.append({"id": "note_hoarder", "title": "Note Hoarder", "icon": "📝", "desc": "Written 10+ study notes"})
        if level >= 4:
            badges.append({"id": "adept", "title": "Adept", "icon": "⚡", "desc": "Reached Level 4"})

        return Response({
            "username": user.username,
            "date_joined": user.date_joined,
            "total_xp": total_xp,
            "level": level,
            "streak": streak,
            "topics_completed": topics_completed,
            "notes_written": notes_written,
            "quizzes_passed": quizzes_passed,
            "xp_breakdown": xp_breakdown,
            "completed_paths": path_list,
            "badges": badges,
            "github_username": profile.github_username,
        })

    def patch(self, request):
        user = request.user
        profile, _ = UserProfile.objects.get_or_create(user=user)
        github_username = request.data.get('github_username')
        if github_username is not None:
            profile.github_username = github_username
            profile.save()
        return Response({"status": "updated", "github_username": profile.github_username})

class GitHubReposView(views.APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        profile, _ = UserProfile.objects.get_or_create(user=request.user)
        username = profile.github_username
        if not username:
            return Response({"repos": [], "message": "No GitHub username set. Go to Settings to connect."})
        
        import requests as http_requests
        try:
            resp = http_requests.get(
                f"https://api.github.com/users/{username}/repos",
                params={"sort": "updated", "per_page": 30},
                headers={"Accept": "application/vnd.github.v3+json"},
                timeout=10,
            )
            if resp.status_code != 200:
                return Response({"repos": [], "message": f"GitHub API error: {resp.status_code}"})
            repos = resp.json()
            data = [{
                "id": r["id"],
                "name": r["name"],
                "full_name": r["full_name"],
                "description": r.get("description", ""),
                "html_url": r["html_url"],
                "language": r.get("language", ""),
                "stargazers_count": r.get("stargazers_count", 0),
                "updated_at": r.get("updated_at", ""),
            } for r in repos]
            return Response({"repos": data})
        except Exception as e:
            return Response({"repos": [], "message": f"Failed to fetch: {str(e)}"})

class PortfolioView(views.APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        projects = VerifiedProject.objects.filter(user=request.user).select_related('topic')
        serializer = VerifiedProjectSerializer(projects, many=True)
        return Response(serializer.data)

