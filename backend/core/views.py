from rest_framework import viewsets, views, generics, status
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.parsers import MultiPartParser, FormParser
from django.db.models import Sum, Q, Count
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.conf import settings
import requests
import os

from .models import LearningPath, Topic, Contribution, Bookmark, TopicProgress, TopicMaterial, TopicNote, NoteDocument, ChatMessage, UserProfile, TopicQuiz, TopicFlashcard, VerifiedProject, PathSharing, TopicScreenshot, OTPVerification
from .serializers import (
    LearningPathSerializer, TopicSerializer, ContributionSerializer, 
    RegisterSerializer, UserSerializer, BookmarkSerializer, 
    TopicMaterialSerializer, TopicProgressSerializer, TopicNoteSerializer,
    NoteDocumentSerializer, VerifiedProjectSerializer, PathSharingSerializer, CustomPathCreateSerializer, PathCloneSerializer,
    TopicScreenshotSerializer
)
from django.core.mail import send_mail
from django.conf import settings

class SendOTPView(views.APIView):
    permission_classes = (AllowAny,)
    
    def post(self, request):
        email = request.data.get('email')
        if not email:
            return Response({'error': 'Email is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        # In case the user already exists
        from django.contrib.auth.models import User
        if User.objects.filter(email=email).exists():
            return Response({'error': 'Email already registered'}, status=status.HTTP_400_BAD_REQUEST)
            
        otp_record, created = OTPVerification.objects.get_or_create(email=email)
        otp_record.generate_otp()
        
        if getattr(settings, 'OTP_ENABLED', True):
            try:
                send_mail(
                    'Your GrowthOS Verification Code',
                    f'Your verification code is: {otp_record.otp}\nThis code will expire in 10 minutes.',
                    settings.DEFAULT_FROM_EMAIL,
                    [email],
                    fail_silently=False,
                )
            except Exception as e:
                return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        return Response({'message': 'OTP sent successfully'})

class VerifyOTPView(views.APIView):
    permission_classes = (AllowAny,)
    
    def post(self, request):
        email = request.data.get('email')
        otp = request.data.get('otp')
        
        if not email or not otp:
            return Response({'error': 'Email and OTP are required'}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            otp_record = OTPVerification.objects.get(email=email)
            if not otp_record.is_valid():
                return Response({'error': 'OTP has expired or already used'}, status=status.HTTP_400_BAD_REQUEST)
                
            if otp_record.otp == otp:
                otp_record.is_verified = True
                otp_record.save()
                return Response({'message': 'Email verified successfully'})
            else:
                return Response({'error': 'Invalid OTP'}, status=status.HTTP_400_BAD_REQUEST)
        except OTPVerification.DoesNotExist:
            return Response({'error': 'OTP not requested for this email'}, status=status.HTTP_400_BAD_REQUEST)

import requests
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth.models import User

class GoogleLoginView(views.APIView):
    permission_classes = (AllowAny,)

    def post(self, request):
        access_token = request.data.get('access_token')
        if not access_token:
            return Response({'error': 'Missing access token'}, status=status.HTTP_400_BAD_REQUEST)

        # Verify token with Google
        try:
            google_response = requests.get(
                'https://www.googleapis.com/oauth2/v3/userinfo',
                headers={'Authorization': f'Bearer {access_token}'}
            )
            if not google_response.ok:
                return Response({'error': 'Invalid Google token'}, status=status.HTTP_400_BAD_REQUEST)
                
            user_info = google_response.json()
            email = user_info.get('email')
            first_name = user_info.get('given_name', '')
            last_name = user_info.get('family_name', '')
            
            if not email:
                return Response({'error': 'Google account must have an email'}, status=status.HTTP_400_BAD_REQUEST)

            # Get or Create User
            user, created = User.objects.get_or_create(username=email, defaults={
                'email': email,
                'first_name': first_name,
                'last_name': last_name
            })
            
            # Setup Profile and Bonus if new
            if created:
                user.set_unusable_password()
                user.save()
                UserProfile.objects.get_or_create(user=user)
                Contribution.objects.create(user=user, action_type='signup_bonus', points=1)
                
            # Issue JWTs
            refresh = RefreshToken.for_user(user)
            return Response({
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class GitHubLoginView(views.APIView):
    permission_classes = (AllowAny,)

    def post(self, request):
        code = request.data.get('code')
        if not code:
            return Response({'error': 'Missing GitHub code'}, status=status.HTTP_400_BAD_REQUEST)

        client_id = os.environ.get('GITHUB_CLIENT_ID', '')
        client_secret = os.environ.get('GITHUB_CLIENT_SECRET', '')

        # Exchange code for access token
        try:
            token_response = requests.post(
                'https://github.com/login/oauth/access_token',
                headers={'Accept': 'application/json'},
                data={
                    'client_id': client_id,
                    'client_secret': client_secret,
                    'code': code
                }
            )
            token_data = token_response.json()
            access_token = token_data.get('access_token')

            if not access_token:
                return Response({'error': 'Failed to get GitHub token'}, status=status.HTTP_400_BAD_REQUEST)

            # Fetch user info
            user_response = requests.get(
                'https://api.github.com/user',
                headers={'Authorization': f'token {access_token}'}
            )
            user_info = user_response.json()
            github_login = user_info.get('login')

            # Fetch emails
            emails_response = requests.get(
                'https://api.github.com/user/emails',
                headers={'Authorization': f'token {access_token}'}
            )
            emails_data = emails_response.json()
            primary_email = next((e['email'] for e in emails_data if e.get('primary')), None)

            if not primary_email:
                return Response({'error': 'GitHub account must have a primary email'}, status=status.HTTP_400_BAD_REQUEST)

            # Get or Create User
            user, created = User.objects.get_or_create(username=primary_email, defaults={
                'email': primary_email,
                'first_name': user_info.get('name', '').split()[0] if user_info.get('name') else github_login,
                'last_name': ''
            })

            from .encryption import encrypt_token

            # Setup Profile and save GitHub username + access token
            profile, _ = UserProfile.objects.get_or_create(user=user)
            
            profile.github_username = github_login
            profile.github_access_token = encrypt_token(access_token)
            profile.save()

            if created:
                user.set_unusable_password()
                user.save()
                Contribution.objects.create(user=user, action_type='signup_bonus', points=1)

            # Issue JWTs
            refresh = RefreshToken.for_user(user)
            return Response({
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class GitHubConnectView(views.APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        code = request.data.get('code')
        if not code:
            return Response({'error': 'Missing GitHub code'}, status=status.HTTP_400_BAD_REQUEST)

        client_id = os.environ.get('GITHUB_CLIENT_ID', '')
        client_secret = os.environ.get('GITHUB_CLIENT_SECRET', '')

        try:
            token_response = requests.post(
                'https://github.com/login/oauth/access_token',
                headers={'Accept': 'application/json'},
                data={
                    'client_id': client_id,
                    'client_secret': client_secret,
                    'code': code
                }
            )
            token_data = token_response.json()
            access_token = token_data.get('access_token')

            if not access_token:
                return Response({'error': 'Failed to get GitHub token'}, status=status.HTTP_400_BAD_REQUEST)

            # Fetch user info
            user_response = requests.get(
                'https://api.github.com/user',
                headers={'Authorization': f'token {access_token}'}
            )
            user_info = user_response.json()
            github_login = user_info.get('login')

            from .encryption import encrypt_token

            profile, _ = UserProfile.objects.get_or_create(user=request.user)
            profile.github_username = github_login
            profile.github_access_token = encrypt_token(access_token)
            profile.save()

            return Response({'message': 'GitHub connected successfully'}, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class RegisterView(generics.CreateAPIView):
    queryset = UserSerializer.Meta.model.objects.all()
    permission_classes = (AllowAny,)
    serializer_class = RegisterSerializer

    def create(self, request, *args, **kwargs):
        email = request.data.get('email')
        # Enforce OTP verification before allowing registration
        try:
            otp_record = OTPVerification.objects.get(email=email)
            if not otp_record.is_verified:
                return Response({'error': 'Email not verified. Please verify OTP first.'}, status=status.HTTP_400_BAD_REQUEST)
        except OTPVerification.DoesNotExist:
            return Response({'error': 'Email verification required.'}, status=status.HTTP_400_BAD_REQUEST)
            
        response = super().create(request, *args, **kwargs)
        from django.contrib.auth.models import User
        user = User.objects.get(username=request.data.get('username'))
        Contribution.objects.create(user=user, action_type='signup_bonus', points=1)
        return response

class LearningPathViewSet(viewsets.ModelViewSet):
    serializer_class = LearningPathSerializer
    lookup_field = 'slug'

    def get_queryset(self):
        from django.db.models import Prefetch
        base_qs = LearningPath.objects.all()
        
        if self.request.user.is_authenticated:
            user = self.request.user
            base_qs = base_qs.prefetch_related(
                'topics',
                Prefetch('topics__progress', queryset=TopicProgress.objects.filter(user=user), to_attr='user_progress_cache'),
                Prefetch('topics__verified_projects', queryset=VerifiedProject.objects.filter(user=user), to_attr='verified_project_cache'),
                Prefetch('topics__materials', queryset=TopicMaterial.objects.filter(user=user), to_attr='materials_cache'),
            ).filter(
                Q(is_active=True, is_custom=False) | Q(created_by=user)
            )
            return base_qs.distinct()
            
        return base_qs.prefetch_related('topics').filter(is_active=True, is_custom=False).distinct()

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
            Contribution.objects.create(user=request.user, action_type='path_bookmarked', points=1)
        return Response({'status': 'bookmarked'})

class BookmarkViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = BookmarkSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Bookmark.objects.filter(user=self.request.user)



class TopicDetailView(views.APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        topic = _resolve_topic(pk)
        
        progress, created = TopicProgress.objects.get_or_create(user=request.user, topic=topic)
        if progress.status in ['locked', 'available']:
            progress.status = 'in_progress'
            from django.utils import timezone
            if not progress.started_at:
                progress.started_at = timezone.now()
            progress.save()
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
        Contribution.objects.create(user=request.user, action_type='material_uploaded', points=1)
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
            
            import json, re
            # Extract JSON if markdown wrapped
            match = re.search(r'\{.*\}', response_content, re.DOTALL)
            if match:
                data = json.loads(match.group(0))
            else:
                data = json.loads(response_content)
                
            Contribution.objects.create(user=request.user, action_type='path_generated', points=2)
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
                
                from .helpers import award_topic_completion_xp
                award_topic_completion_xp(request.user, material.topic, progress, score)
                
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
            'material_uploaded': 'Uploaded build material',
            'path_generated': 'Generated a learning path',
            'flashcards_generated': 'Generated AI flashcards',
            'document_uploaded': 'Uploaded a reference document',
            'screenshot_uploaded': 'Uploaded a screenshot',
            'github_repo_created': 'Created a GitHub repository',
            'github_path_synced': 'Synced roadmap to GitHub',
            'github_commit': 'Committed workspace to GitHub',
            'gist_published': 'Published a GitHub Gist',
            'custom_path_created': 'Created a custom learning path',
            'path_cloned': 'Cloned a learning path',
            'streak_revived': 'Revived a lost streak',
            'quiz_chain': 'Quiz chain bonus',
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
            Contribution.objects.create(user=request.user, action_type='daily_login', points=1)
            bonus_messages.append({"type": "daily_login", "points": 1, "message": "Daily login bonus awarded!"})
            
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
                        Contribution.objects.create(user=request.user, action_type='streak_milestone', points=1)
                        bonus_messages.append({"type": "streak_milestone", "points": 1, "message": f"🔥 {milestone}-day streak milestone!"})
            
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
        if total_xp >= 100: level = 6
        elif total_xp >= 50: level = 5
        elif total_xp >= 25: level = 4
        elif total_xp >= 10: level = 3
        elif total_xp >= 5: level = 2

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
        if flashcard:
            return Response({'flashcards': flashcard.cards})
        return Response({'flashcards': []})

    def post(self, request, topic_id):
        topic = _resolve_topic(topic_id)
        cards = request.data.get('cards', [])
        
        # Simple validation
        valid_cards = []
        for c in cards:
            if isinstance(c, dict) and 'front' in c and 'back' in c:
                valid_cards.append({'front': c['front'], 'back': c['back']})
                
        flashcard, created = TopicFlashcard.objects.update_or_create(
            user=request.user, topic=topic,
            defaults={'cards': valid_cards}
        )
        Contribution.objects.create(user=request.user, action_type='flashcards_generated', points=1)
        return Response({'flashcards': flashcard.cards})

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
                from .helpers import award_topic_completion_xp
                award_topic_completion_xp(request.user, topic, progress, score)

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
        Contribution.objects.create(user=request.user, action_type='document_uploaded', points=1)
        serializer = NoteDocumentSerializer(doc, context={'request': request})
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def delete(self, request, topic_id):
        doc_id = request.query_params.get('id')
        if not doc_id:
            return Response({'error': 'No document ID provided'}, status=status.HTTP_400_BAD_REQUEST)
        doc = get_object_or_404(NoteDocument, id=doc_id, user=request.user)
        doc.delete()
        return Response({'status': 'deleted'})

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
        Contribution.objects.create(user=request.user, action_type='screenshot_uploaded', points=1)
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

class AllScreenshotsView(views.APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        screenshots = TopicScreenshot.objects.filter(user=request.user).select_related('topic')
        serializer = TopicScreenshotSerializer(screenshots, many=True, context={'request': request})
        return Response(serializer.data)

class SubmitQuizView(views.APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, topic_id):
        topic = _resolve_topic(topic_id)
        score = request.data.get('score', 0)
        total = request.data.get('total', 1)
        percentage = score / total if total > 0 else 0

        if percentage >= 0.8:
            today = timezone.now().date()
            # To enforce once per topic per day without a topic field, we could use a specific action_type
            # But the requirement implies we award 'quiz_passed'. We will let it award for now or assume they aren't spamming.
            # Let's just award it if it's not the same topic. Actually we'll just award it.
            # Let's count how many quiz_passed today
            today_quizzes = Contribution.objects.filter(
                user=request.user,
                action_type='quiz_passed',
                created_at__date=today
            ).count()
            
            # For simplicity, we just award it, ignoring the "once per topic" comment if it conflicts.
            # Or we can just award it once per topic by changing action_type to 'quiz_passed_{topic.id}' and checking that,
            # but then we also need to log a 'quiz_passed' for the stats. We can log both!
            topic_awarded = Contribution.objects.filter(
                user=request.user,
                action_type=f'quiz_passed_{topic.id}',
                created_at__date=today
            ).exists()
            
            xp = 0
            if not topic_awarded:
                Contribution.objects.create(user=request.user, action_type=f'quiz_passed_{topic.id}', points=0)
                Contribution.objects.create(user=request.user, action_type='quiz_passed', points=1)
                xp = 1
                today_quizzes += 1
                
                if today_quizzes == 3:
                    Contribution.objects.create(user=request.user, action_type='quiz_chain', points=1)
                    xp += 1

            return Response({"status": "passed", "xp_earned": xp})
        
        return Response({"status": "failed", "xp_earned": 0})

class UserProfileView(views.APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        profile, _ = UserProfile.objects.get_or_create(user=user)
        total_xp = Contribution.objects.filter(user=user).aggregate(Sum('points'))['points__sum'] or 0
        
        level = 1
        n = 100
        temp_xp = total_xp
        while temp_xp >= n:
            temp_xp -= n
            level += 1
            n = int(n * 1.5)

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

        # Achievement badges
        from .helpers import get_user_badges
        badges = get_user_badges(user)
        
        is_specialist = False
        if paths:
            user_vps = VerifiedProject.objects.filter(user=user)
            user_tms = TopicMaterial.objects.filter(user=user)
            
            vp_scores = {}
            for vp in user_vps:
                if vp.ai_score > vp_scores.get(vp.topic_id, 0):
                    vp_scores[vp.topic_id] = vp.ai_score
                    
            tm_scores = {}
            for tm in user_tms:
                if tm.ai_score > tm_scores.get(tm.topic_id, 0):
                    tm_scores[tm.topic_id] = tm.ai_score
                    
            path_topics = list(Topic.objects.filter(path__in=paths))
            topics_by_path = {}
            for pt in path_topics:
                topics_by_path.setdefault(pt.path_id, []).append(pt.id)
                
            for p in paths:
                t_ids = topics_by_path.get(p.id, [])
                if not t_ids:
                    continue
                
                all_high = True
                for t_id in t_ids:
                    max_score = max(vp_scores.get(t_id, 0), tm_scores.get(t_id, 0))
                    if max_score < 80:
                        all_high = False
                        break
                
                if all_high:
                    is_specialist = True
                    break
        if is_specialist:
            badges.append({"id": "specialist", "title": "Specialist", "icon": "🧠", "desc": "Completed a path with all scores >= 80"})
            
        if PathSharing.objects.filter(path__created_by=user).exists() or PathSharing.objects.filter(path__original_path__created_by=user).exists():
            badges.append({"id": "architect", "title": "Architect", "icon": "🏗️", "desc": "Shared a path you created"})
        if LearningPath.objects.filter(created_by=user, visibility='public').exists():
            badges.append({"id": "broadcaster", "title": "Broadcaster", "icon": "📡", "desc": "Published a public learning path"})

        can_revive_streak = False
        import datetime
        if streak == 0 and total_xp >= 10:
            two_days_ago = today - datetime.timedelta(days=2)
            has_activity_two_days_ago = Contribution.objects.filter(user=user, created_at__date=two_days_ago).exists()
            if has_activity_two_days_ago:
                if not profile.streak_revive_used_at or timezone.now() - profile.streak_revive_used_at > datetime.timedelta(days=7):
                    can_revive_streak = True

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
            "has_github_workspace_access": bool(profile.github_access_token),
            "can_revive_streak": can_revive_streak,
            "user": {
                "id": user.id,
                "username": user.username,
                "email": user.email,
            },
            "selected_title": profile.selected_title,
        })

    def patch(self, request):
        user = request.user
        profile, _ = UserProfile.objects.get_or_create(user=user)
        
        github_username = request.data.get('github_username')
        if github_username is not None:
            profile.github_username = github_username
            
        selected_title = request.data.get('selected_title')
        if selected_title is not None:
            profile.selected_title = selected_title
            
        profile.save()
        return Response({
            "status": "updated", 
            "github_username": profile.github_username,
            "selected_title": profile.selected_title
        })

class GitHubReposView(views.APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from .encryption import decrypt_token
        import requests as http_requests

        profile, _ = UserProfile.objects.get_or_create(user=request.user)
        username = profile.github_username
        
        headers = {"Accept": "application/vnd.github.v3+json"}
        encrypted_token = profile.github_access_token
        if encrypted_token:
            access_token = decrypt_token(encrypted_token)
            if access_token:
                headers["Authorization"] = f"token {access_token}"

        try:
            # If authenticated, fetch all repos for the user (including private). Otherwise fallback to public repos.
            url = "https://api.github.com/user/repos" if encrypted_token else f"https://api.github.com/users/{username}/repos"
            if not encrypted_token and not username:
                return Response({"repos": [], "message": "No GitHub connection found. Go to Settings."})

            resp = http_requests.get(
                url,
                params={"sort": "updated", "per_page": 100, "affiliation": "owner,collaborator"},
                headers=headers,
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

class PublishGistView(views.APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        from .encryption import decrypt_token
        import requests as http_requests

        profile, _ = UserProfile.objects.get_or_create(user=request.user)
        encrypted_token = profile.github_access_token
        
        if not encrypted_token:
            return Response({'error': 'GitHub is not connected or missing required permissions. Please reconnect your account.'}, status=status.HTTP_400_BAD_REQUEST)

        access_token = decrypt_token(encrypted_token)
        if not access_token:
            return Response({'error': 'Failed to decrypt GitHub token.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        title = request.data.get('title', 'GrowthOS Note')
        description = request.data.get('description', 'Exported from GrowthOS')
        content = request.data.get('content')
        filename = request.data.get('filename', 'note.md')

        if not content:
            return Response({'error': 'Content is required to publish a Gist.'}, status=status.HTTP_400_BAD_REQUEST)

        gist_data = {
            "description": description,
            "public": True,
            "files": {
                filename: {
                    "content": f"# {title}\n\n{content}"
                }
            }
        }

        try:
            resp = http_requests.post(
                "https://api.github.com/gists",
                headers={
                    "Authorization": f"token {access_token}",
                    "Accept": "application/vnd.github.v3+json"
                },
                json=gist_data,
                timeout=10
            )
            
            if resp.status_code == 201:
                Contribution.objects.create(user=request.user, action_type='gist_published', points=3)
                return Response({"url": resp.json().get("html_url")}, status=status.HTTP_201_CREATED)
            else:
                return Response({"error": f"GitHub API error: {resp.text}"}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"error": f"Failed to publish gist: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class CreateGitHubRepoView(views.APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        from .encryption import decrypt_token
        import requests as http_requests

        profile, _ = UserProfile.objects.get_or_create(user=request.user)
        encrypted_token = profile.github_access_token
        
        if not encrypted_token:
            return Response({'error': 'GitHub is not connected or missing required permissions. Please reconnect your account in Settings.'}, status=status.HTTP_400_BAD_REQUEST)

        access_token = decrypt_token(encrypted_token)
        if not access_token:
            return Response({'error': 'Failed to decrypt GitHub token.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        name = request.data.get('name')
        description = request.data.get('description', 'Auto-generated by GrowthOS')
        private = request.data.get('private', False)

        if not name:
            return Response({'error': 'Repository name is required.'}, status=status.HTTP_400_BAD_REQUEST)

        repo_data = {
            "name": name,
            "description": description,
            "private": private,
            "auto_init": True,
        }

        try:
            resp = http_requests.post(
                "https://api.github.com/user/repos",
                headers={
                    "Authorization": f"token {access_token}",
                    "Accept": "application/vnd.github.v3+json"
                },
                json=repo_data,
                timeout=15
            )
            
            if resp.status_code == 201:
                Contribution.objects.create(user=request.user, action_type='github_repo_created', points=5)
                return Response(resp.json(), status=status.HTTP_201_CREATED)
            elif resp.status_code == 404:
                return Response({"error": "Your GitHub account lacks repository permissions. Please go to Settings -> Reconnect Workspace to grant full access."}, status=status.HTTP_403_FORBIDDEN)
            else:
                return Response({"error": f"GitHub API error: {resp.text}"}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"error": f"Failed to create repository: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class SyncPathToGitHubView(views.APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        from .encryption import decrypt_token
        import requests as http_requests

        path_slug = request.data.get('path_slug')
        if not path_slug:
            return Response({'error': 'Path slug is required'}, status=status.HTTP_400_BAD_REQUEST)

        # 1. Get path
        path = get_object_or_404(LearningPath, slug=path_slug)
        
        # Security: ensure user has access (creator or shared)
        from django.db.models import Q
        has_access = LearningPath.objects.filter(
            Q(id=path.id) & (
                Q(created_by=request.user) |
                Q(shared_with_users__shared_to=request.user)
            )
        ).exists()
        if not has_access and path.visibility != 'public':
            return Response({'error': 'Access denied'}, status=status.HTTP_403_FORBIDDEN)

        # 2. Get GitHub Token
        profile, _ = UserProfile.objects.get_or_create(user=request.user)
        encrypted_token = profile.github_access_token
        if not encrypted_token:
            return Response({'error': 'GitHub is not connected. Please connect in Settings.'}, status=status.HTTP_400_BAD_REQUEST)

        access_token = decrypt_token(encrypted_token)
        if not access_token:
            return Response({'error': 'Failed to decrypt GitHub token.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        # 3. Create Repo
        repo_name = f"growthos-{path.slug}"[:100]
        repo_data = {
            "name": repo_name,
            "description": path.description or f"Learning Path: {path.title}",
            "private": True,
            "auto_init": True,
            "has_issues": True,
            "has_projects": True
        }

        headers = {
            "Authorization": f"token {access_token}",
            "Accept": "application/vnd.github.v3+json"
        }

        try:
            repo_resp = http_requests.post("https://api.github.com/user/repos", headers=headers, json=repo_data, timeout=15)
            # 422 usually means it already exists, which is fine, we can just use it
            if repo_resp.status_code == 404:
                return Response({"error": "Your GitHub account lacks repository permissions. Please go to Settings -> Reconnect Workspace to grant full access."}, status=status.HTTP_403_FORBIDDEN)
            elif repo_resp.status_code not in [201, 422]:
                return Response({"error": f"GitHub API error creating repo: {repo_resp.text}"}, status=status.HTTP_400_BAD_REQUEST)
            
            github_username = profile.github_username
            
            path.github_repo_name = repo_name
            path.save()
            
            # 4. Create Issues for Topics
            created_issues = []
            topics = path.topics.all().order_by('order')
            for topic in topics:
                issue_data = {
                    "title": topic.title,
                    "body": f"## Overview\n{topic.summary}\n\n*Generated by GrowthOS*"
                }
                issue_resp = http_requests.post(
                    f"https://api.github.com/repos/{github_username}/{repo_name}/issues",
                    headers=headers,
                    json=issue_data,
                    timeout=10
                )
                if issue_resp.status_code == 201:
                    created_issues.append(issue_resp.json().get('html_url'))

            Contribution.objects.create(user=request.user, action_type='github_path_synced', points=5)
            return Response({
                "message": "Successfully synced to GitHub Issues",
                "repo_url": f"https://github.com/{github_username}/{repo_name}",
                "issues_created": len(created_issues)
            }, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({"error": f"Failed to sync to GitHub: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

import base64

class CommitWorkspaceToGitHubView(views.APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        from .encryption import decrypt_token
        import requests as http_requests

        topic_slug = request.data.get('topic_slug')
        if not topic_slug:
            return Response({'error': 'Topic slug is required'}, status=status.HTTP_400_BAD_REQUEST)

        topic = _resolve_topic(topic_slug)
        path = topic.path

        # Get Note
        note = TopicNote.objects.filter(user=request.user, topic=topic).first()
        content = note.content if note else ""

        # Get Repo
        repo_name = request.data.get('repo_name')
        if not repo_name:
            repo_name = path.github_repo_name
            if not repo_name:
                repo_name = f"growthos-{path.slug}"[:100]
        else:
            if repo_name != path.github_repo_name:
                path.github_repo_name = repo_name
                path.save()

        profile, _ = UserProfile.objects.get_or_create(user=request.user)
        encrypted_token = profile.github_access_token
        if not encrypted_token:
            return Response({'error': 'GitHub is not connected. Please connect in Settings.'}, status=status.HTTP_400_BAD_REQUEST)

        access_token = decrypt_token(encrypted_token)
        if not access_token:
            return Response({'error': 'Failed to decrypt GitHub token.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        github_username = profile.github_username
        headers = {
            "Authorization": f"token {access_token}",
            "Accept": "application/vnd.github.v3+json"
        }

        # 1. Ensure repo exists
        repo_resp = http_requests.get(f"https://api.github.com/repos/{github_username}/{repo_name}", headers=headers)
        if repo_resp.status_code == 404:
            # Create repo
            repo_data = {
                "name": repo_name,
                "description": path.description or f"Learning Path: {path.title}",
                "private": path.visibility == 'private',
                "auto_init": True
            }
            create_resp = http_requests.post("https://api.github.com/user/repos", headers=headers, json=repo_data, timeout=15)
            if create_resp.status_code == 404:
                return Response({"error": "Your GitHub account lacks repository permissions. Please go to Settings -> Reconnect Workspace to grant full access."}, status=status.HTTP_403_FORBIDDEN)
            elif create_resp.status_code != 201:
                return Response({"error": f"Failed to create GitHub repository automatically: {create_resp.text}"}, status=status.HTTP_400_BAD_REQUEST)
            path.github_repo_name = repo_name
            path.save()

        # 2. Get existing file SHA if exists to update
        file_path = f"{topic.slug}/notes.md"
        url = f"https://api.github.com/repos/{github_username}/{repo_name}/contents/{file_path}"
        
        get_file = http_requests.get(url, headers=headers)
        sha = None
        if get_file.status_code == 200:
            sha = get_file.json().get('sha')

        # 3. Commit file (only if we have content)
        put_resp = None
        if content.strip():
            encoded_content = base64.b64encode(content.encode('utf-8')).decode('utf-8')
            commit_data = {
                "message": f"Update notes for {topic.title}",
                "content": encoded_content
            }
            if sha:
                commit_data["sha"] = sha
            put_resp = http_requests.put(url, headers=headers, json=commit_data, timeout=10)
        
        # Helper to push arbitrary file
        def push_to_github(file_path, file_content, message):
            file_url = f"https://api.github.com/repos/{github_username}/{repo_name}/contents/{file_path}"
            get_res = http_requests.get(file_url, headers=headers)
            file_sha = get_res.json().get('sha') if get_res.status_code == 200 else None
            
            commit_payload = {
                "message": message,
                "content": base64.b64encode(file_content).decode('utf-8')
            }
            if file_sha:
                commit_payload["sha"] = file_sha
                
            return http_requests.put(file_url, headers=headers, json=commit_payload, timeout=10)

        # If notes failed (and were attempted), return error
        if put_resp and put_resp.status_code not in [200, 201]:
            return Response({"error": f"Failed to push commit: {put_resp.text}"}, status=status.HTTP_400_BAD_REQUEST)
        
        commit_url = put_resp.json().get('commit', {}).get('html_url') if put_resp else None
        # Push screenshots
        screenshots = topic.screenshots.filter(user=request.user)
        for screenshot in screenshots:
            try:
                img_path = screenshot.image.path
                if os.path.exists(img_path):
                    with open(img_path, 'rb') as img_file:
                        push_to_github(
                            f"{topic.slug}/images/{os.path.basename(img_path)}",
                            img_file.read(),
                            f"Upload screenshot {os.path.basename(img_path)}"
                        )
            except Exception as e:
                print(f"Failed to push screenshot {screenshot.id}: {e}")

        # Push documents
        documents = NoteDocument.objects.filter(user=request.user, topic=topic)
        for doc in documents:
            try:
                doc_path = doc.file.path
                if os.path.exists(doc_path):
                    with open(doc_path, 'rb') as doc_file:
                        push_to_github(
                            f"{topic.slug}/documents/{doc.filename}",
                            doc_file.read(),
                            f"Upload document {doc.filename}"
                        )
            except Exception as e:
                print(f"Failed to push document {doc.id}: {e}")

        # Push flashcards
        import json
        flashcards = TopicFlashcard.objects.filter(user=request.user, topic=topic).first()
        if flashcards and flashcards.cards:
            push_to_github(
                f"{topic.slug}/flashcards.json",
                json.dumps(flashcards.cards, indent=2).encode('utf-8'),
                f"Update flashcards for {topic.title}"
            )

        # Push quizzes
        quizzes = TopicQuiz.objects.filter(user=request.user, topic=topic)
        if quizzes.exists():
            quiz_data = [{"difficulty": q.difficulty, "questions": q.questions} for q in quizzes]
            push_to_github(
                f"{topic.slug}/quizzes.json",
                json.dumps(quiz_data, indent=2).encode('utf-8'),
                f"Update quizzes for {topic.title}"
            )

        # Award XP Points for GitHub Contribution
        Contribution.objects.create(user=request.user, action_type='github_commit', points=5)

        commit_url = commit_url or f"https://github.com/{github_username}/{repo_name}"
        return Response({
            "message": "Successfully committed notes and files to GitHub",
            "commit_url": commit_url,
            "repo_url": f"https://github.com/{github_username}/{repo_name}/tree/main/{topic.slug}"
        }, status=status.HTTP_200_OK)

class PortfolioView(views.APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        projects = VerifiedProject.objects.filter(user=request.user).select_related('topic')
        serializer = VerifiedProjectSerializer(projects, many=True)
        return Response(serializer.data)

class ReviveStreakView(views.APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        total_xp = Contribution.objects.filter(user=user).aggregate(Sum('points'))['points__sum'] or 0
        if total_xp < 10:
            return Response({'error': 'Not enough XP to revive streak (need 10 XP)'}, status=status.HTTP_400_BAD_REQUEST)
        
        profile, _ = UserProfile.objects.get_or_create(user=user)
        
        # Check if used recently
        if profile.streak_revive_used_at:
            from django.utils import timezone
            import datetime
            if timezone.now() - profile.streak_revive_used_at < datetime.timedelta(days=7):
                return Response({'error': 'Can only revive streak once every 7 days'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Deduct 10 XP
        import datetime
        from django.utils import timezone
        
        c = Contribution(user=user, action_type='streak_revived', points=-10)
        c.save()
        # Override created_at to yesterday
        c.created_at = timezone.now() - datetime.timedelta(days=1)
        c.save()
        
        profile.streak_revive_used_at = timezone.now()
        profile.save()
        
        return Response({'status': 'Streak revived successfully!', 'xp_deducted': 10})

class ResetProgressView(views.APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        TopicProgress.objects.filter(user=user).delete()
        Contribution.objects.filter(user=user).delete()
        TopicNote.objects.filter(user=user).delete()
        NoteDocument.objects.filter(user=user).delete()
        TopicQuiz.objects.filter(user=user).delete()
        TopicFlashcard.objects.filter(user=user).delete()
        VerifiedProject.objects.filter(user=user).delete()
        TopicScreenshot.objects.filter(user=user).delete()
        TopicMaterial.objects.filter(user=user).delete()
        
        # Reset profile streak
        profile = getattr(user, 'profile', None)
        if profile:
            profile.current_streak = 0
            profile.longest_streak = 0
            profile.save()
            
        return Response({"status": "reset"})

class AddContributionView(views.APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        action_type = request.data.get('action_type', 'general_activity')
        points = int(request.data.get('points', 1))
        
        from .helpers import get_user_badges
        badges_before = {b['id'] for b in get_user_badges(user)}
        
        Contribution.objects.create(user=user, action_type=action_type, points=points)
        
        badges_after = get_user_badges(user)
        new_badges = [b for b in badges_after if b['id'] not in badges_before]

        return Response({"status": "added", "points": points, "action_type": action_type, "new_badges": new_badges})
