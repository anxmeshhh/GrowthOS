from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import (
    RegisterView, LearningPathViewSet, BookmarkViewSet, GeneratePathView,
    TopicDetailView, TopicProgressUpdateView, TopicMaterialUploadView,
    VerifyMaterialView, HeatmapView, RecentActivityView, DailyLoginView, ChatAssistantView, TopicNoteView, TopicQuizView, TopicFlashcardView,
    ProjectIdeasView, ScanRepoView, NoteDocumentView, TopicScreenshotView,
    AllNotesView, AllNoteDocumentsView, AllScreenshotsView, SubmitQuizView, UserProfileView, GitHubReposView, PortfolioView, ReviveStreakView, ResetProgressView,
    SendOTPView, VerifyOTPView, GoogleLoginView, GitHubLoginView, PublishGistView, GitHubConnectView, CreateGitHubRepoView, SyncPathToGitHubView, CommitWorkspaceToGitHubView, RequestAdminAccessView,
    AdminStatsView, AdminUserListView, AdminUserDetailView, AdminDataExportView, AdminRequestListView, AdminRequestDetailView, CustomPathViewSet, PathProgressView
)

router = DefaultRouter()
router.register(r'paths', LearningPathViewSet, basename='path')
router.register(r'bookmarks', BookmarkViewSet, basename='bookmark')
router.register(r'custom-paths', CustomPathViewSet, basename='custom-path')

urlpatterns = [
    # Auth Endpoints
    path('auth/register/', RegisterView.as_view(), name='auth_register'),
    path('auth/login/', TokenObtainPairView.as_view(), name='auth_login'),
    path('auth/google/', GoogleLoginView.as_view(), name='auth_google'),
    path('auth/github/', GitHubLoginView.as_view(), name='auth_github'),
    path('auth/github/connect/', GitHubConnectView.as_view(), name='auth_github_connect'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='auth_refresh'),
    path('auth/daily-login/', DailyLoginView.as_view(), name='daily_login'),
    path('auth/send-otp/', SendOTPView.as_view(), name='send_otp'),
    path('auth/verify-otp/', VerifyOTPView.as_view(), name='verify_otp'),
    path('auth/request-admin/', RequestAdminAccessView.as_view(), name='request_admin'),
    
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
    path('all-screenshots/', AllScreenshotsView.as_view(), name='all_screenshots'),
    
    # Custom Path Endpoints
    path('custom-paths/<str:path_slug>/progress/', PathProgressView.as_view(), name='path_progress'),
    
    # User Profile & GitHub
    path('profile/', UserProfileView.as_view(), name='user_profile'),
    path('github/repos/', GitHubReposView.as_view(), name='github_repos'),
    path('github/gist/', PublishGistView.as_view(), name='publish_gist'),
    path('github/repo/create/', CreateGitHubRepoView.as_view(), name='create_github_repo'),
    path('github/path/sync/', SyncPathToGitHubView.as_view(), name='sync_github_path'),
    path('github/workspace/commit/', CommitWorkspaceToGitHubView.as_view(), name='commit_github_workspace'),
    path('portfolio/', PortfolioView.as_view(), name='portfolio'),
    path('profile/reset/', ResetProgressView.as_view(), name='profile_reset'),
    
    # Admin Dashboard
    path('admin/stats/', AdminStatsView.as_view(), name='admin_stats'),
    path('admin/users/', AdminUserListView.as_view(), name='admin_users'),
    path('admin/users/<int:pk>/', AdminUserDetailView.as_view(), name='admin_user_detail'),
    path('admin/export-data/', AdminDataExportView.as_view(), name='admin_export_data'),
    path('admin/requests/', AdminRequestListView.as_view(), name='admin_requests'),
    path('admin/requests/<int:pk>/', AdminRequestDetailView.as_view(), name='admin_request_detail'),
    
    # Router covers /paths/ and /bookmarks/
    path('', include(router.urls)),
]
