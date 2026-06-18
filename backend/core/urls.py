from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import (
    RegisterView, LearningPathViewSet, BookmarkViewSet, GeneratePathView,
    TopicDetailView, TopicProgressUpdateView, TopicMaterialUploadView,
    VerifyMaterialView, HeatmapView, RecentActivityView, DailyLoginView, ChatAssistantView, TopicNoteView, TopicQuizView, TopicFlashcardView,
    ProjectIdeasView, ScanRepoView, NoteDocumentView, TopicScreenshotView,
    AllNotesView, AllNoteDocumentsView, SubmitQuizView, UserProfileView, GitHubReposView, PortfolioView, ReviveStreakView, ResetProgressView, AddContributionView
)
from .custom_path_views import CustomPathViewSet, PathProgressView

router = DefaultRouter()
router.register(r'paths', LearningPathViewSet, basename='path')
router.register(r'bookmarks', BookmarkViewSet, basename='bookmark')
router.register(r'custom-paths', CustomPathViewSet, basename='custom-path')

urlpatterns = [
    # Auth Endpoints
    path('auth/register/', RegisterView.as_view(), name='auth_register'),
    path('auth/login/', TokenObtainPairView.as_view(), name='auth_login'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='auth_refresh'),
    path('auth/daily-login/', DailyLoginView.as_view(), name='daily_login'),
    path('auth/add-contribution/', AddContributionView.as_view(), name='add_contribution'),
    
    # Path Endpoints
    path('paths/generate/', GeneratePathView.as_view(), name='generate_path'),
    
    # Dashboard Endpoints
    path('heatmap/', HeatmapView.as_view(), name='heatmap'),
    path('activity/', RecentActivityView.as_view(), name='recent_activity'),
    path('activity/revive-streak/', ReviveStreakView.as_view(), name='revive_streak'),
    path('chat/', ChatAssistantView.as_view(), name='chat_assistant'),
    
    # Topic Endpoints (supports both numeric ID and slug)
    path('topics/<str:pk>/', TopicDetailView.as_view(), name='topic_detail'),
    path('topics/<str:pk>/progress/', TopicProgressUpdateView.as_view(), name='topic_progress'),
    path('topics/<str:pk>/materials/', TopicMaterialUploadView.as_view(), name='topic_material_upload'),
    path('topics/<str:topic_id>/notes/', TopicNoteView.as_view(), name='topic_notes'),
    path('topics/<str:topic_id>/quiz/', TopicQuizView.as_view(), name='topic_quiz'),
    path('topics/<str:topic_id>/submit-quiz/', SubmitQuizView.as_view(), name='topic_submit_quiz'),
    path('topics/<str:topic_id>/flashcards/', TopicFlashcardView.as_view(), name='topic_flashcards'),
    path('topics/<str:topic_id>/project-ideas/', ProjectIdeasView.as_view(), name='topic_project_ideas'),
    path('topics/<str:topic_id>/scan-repo/', ScanRepoView.as_view(), name='topic_scan_repo'),
    path('topics/<str:topic_id>/note-documents/', NoteDocumentView.as_view(), name='topic_note_documents'),
    path('topics/<str:topic_id>/screenshots/', TopicScreenshotView.as_view(), name='topic_screenshots'),
    
    # Verification Endpoints
    path('materials/<int:pk>/verify/', VerifyMaterialView.as_view(), name='verify_material'),
    
    # Library Endpoints
    path('all-notes/', AllNotesView.as_view(), name='all_notes'),
    path('all-note-documents/', AllNoteDocumentsView.as_view(), name='all_note_documents'),
    
    # Custom Path Endpoints
    path('custom-paths/<str:path_slug>/progress/', PathProgressView.as_view(), name='path_progress'),
    
    # User Profile & GitHub
    path('profile/', UserProfileView.as_view(), name='user_profile'),
    path('github/repos/', GitHubReposView.as_view(), name='github_repos'),
    path('portfolio/', PortfolioView.as_view(), name='portfolio'),
    path('profile/reset/', ResetProgressView.as_view(), name='profile_reset'),
    
    # Router covers /paths/ and /bookmarks/
    path('', include(router.urls)),
]
