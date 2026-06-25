from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework.throttling import AnonRateThrottle
from .views import (
    RegisterView, LearningPathViewSet, BookmarkViewSet, GeneratePathView,
    TopicDetailView, TopicProgressUpdateView, TopicMaterialUploadView,
    VerifyMaterialView, HeatmapView, RecentActivityView, DailyLoginView, ChatAssistantView, TopicNoteView, TopicQuizView, TopicFlashcardView, GenerateFlashcardsView, PomodoroView,
    ProjectIdeasView, ScanRepoView, NoteDocumentView, TopicScreenshotView, TopicFeynmanView,
    AllNotesView, AllNoteDocumentsView, AllScreenshotsView, SubmitQuizView, UserProfileView, GitHubReposView, PortfolioView, PublicPortfolioView, ReviveStreakView, ResetProgressView,
    SendOTPView, VerifyOTPView, GoogleLoginView, GitHubLoginView, PublishGistView, GitHubConnectView, CreateGitHubRepoView, SyncPathToGitHubView, CommitWorkspaceToGitHubView, RequestAdminAccessView,
    AdminStatsView, AdminUserListView, AdminUserDetailView, AdminDataExportView, AdminRequestListView, AdminRequestDetailView, AdminRoadmapUploadView, AdminRoadmapListView, AdminRoadmapDetailView, AdminAnalyticsView, AdminContentView, AdminSettingsView, CustomPathViewSet, PathProgressView,
    GlobalReviewQueueView, ExploreRoadmapsView, TodayBriefingView, SearchView, NotificationView,
    JDMappingView, ResumeAnalysisView,
    OnboardingView, DailyMissionView, LearningInsightsView,
    TopicResourceView, MockInterviewView, MockInterviewAnswerView,
    GenerateCareerPathView, StudyRoomView,
)

# Strict throttle for login endpoint — max 5 attempts per minute per IP
class LoginRateThrottle(AnonRateThrottle):
    rate = '5/minute'
    scope = 'login'

router = DefaultRouter()
router.register(r'paths', LearningPathViewSet, basename='path')
router.register(r'bookmarks', BookmarkViewSet, basename='bookmark')
router.register(r'custom-paths', CustomPathViewSet, basename='custom-path')

urlpatterns = [
    # Auth Endpoints
    path('auth/register/', RegisterView.as_view(), name='auth_register'),
    path('auth/login/', TokenObtainPairView.as_view(throttle_classes=[LoginRateThrottle]), name='auth_login'),
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
    path('pomodoro/', PomodoroView.as_view(), name='pomodoro'),
    path('heatmap/', HeatmapView.as_view(), name='heatmap'),
    path('activity/', RecentActivityView.as_view(), name='recent_activity'),
    path('activity/revive-streak/', ReviveStreakView.as_view(), name='revive_streak'),
    path('chat/', ChatAssistantView.as_view(), name='chat_assistant'),
    path('today/', TodayBriefingView.as_view(), name='today_briefing'),
    
    # Topic Endpoints (supports both numeric ID and slug)
    path('topics/<str:pk>/', TopicDetailView.as_view(), name='topic_detail'),
    path('topics/<str:pk>/progress/', TopicProgressUpdateView.as_view(), name='topic_progress'),
    path('topics/<str:pk>/materials/', TopicMaterialUploadView.as_view(), name='topic_material_upload'),
    path('topics/<str:topic_id>/notes/', TopicNoteView.as_view(), name='topic_notes'),
    path('topics/<str:topic_id>/quiz/', TopicQuizView.as_view(), name='topic_quiz'),
    path('topics/<str:topic_id>/submit-quiz/', SubmitQuizView.as_view(), name='topic_submit_quiz'),
    path('topics/<str:topic_id>/flashcards/', TopicFlashcardView.as_view(), name='topic_flashcards'),
    path('topics/<str:topic_id>/generate-flashcards/', GenerateFlashcardsView.as_view(), name='generate_flashcards'),
    path('topics/<str:topic_id>/project-ideas/', ProjectIdeasView.as_view(), name='topic_project_ideas'),
    path('topics/<str:topic_id>/scan-repo/', ScanRepoView.as_view(), name='topic_scan_repo'),
    path('topics/<str:topic_id>/note-documents/', NoteDocumentView.as_view(), name='topic_note_documents'),
    path('topics/<str:topic_id>/screenshots/', TopicScreenshotView.as_view(), name='topic_screenshots'),
    path('topics/<str:topic_id>/feynman/', TopicFeynmanView.as_view(), name='topic_feynman'),
    
    # Global Review
    path('flashcards/review-queue/', GlobalReviewQueueView.as_view(), name='global_review_queue'),
    path('explore/roadmaps/', ExploreRoadmapsView.as_view(), name='explore_roadmaps'),
    
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
    path('portfolio/public/<str:username>/', PublicPortfolioView.as_view(), name='public_portfolio'),
    path('profile/reset/', ResetProgressView.as_view(), name='profile_reset'),
    
    # Admin Dashboard
    path('admin/stats/', AdminStatsView.as_view(), name='admin_stats'),
    path('admin/analytics/', AdminAnalyticsView.as_view(), name='admin_analytics'),
    path('admin/content/', AdminContentView.as_view(), name='admin_content'),
    path('admin/settings/', AdminSettingsView.as_view(), name='admin_settings'),
    path('admin/users/', AdminUserListView.as_view(), name='admin_users'),
    path('admin/users/<int:pk>/', AdminUserDetailView.as_view(), name='admin_user_detail'),
    path('admin/export-data/', AdminDataExportView.as_view(), name='admin_export_data'),
    path('admin/roadmaps/', AdminRoadmapListView.as_view(), name='admin_roadmap_list'),
    path('admin/roadmaps/upload/', AdminRoadmapUploadView.as_view(), name='admin_roadmap_upload'),
    path('admin/roadmaps/<str:slug>/', AdminRoadmapDetailView.as_view(), name='admin_roadmap_detail'),
    path('admin/requests/', AdminRequestListView.as_view(), name='admin_requests'),
    path('admin/requests/<int:pk>/', AdminRequestDetailView.as_view(), name='admin_request_detail'),
    
    # Search
    path('search/', SearchView.as_view(), name='search'),

    # Notifications
    path('notifications/', NotificationView.as_view(), name='notifications'),

    # Career Intelligence
    path('career/jd/', JDMappingView.as_view(), name='jd_mapping'),
    path('career/resume/', ResumeAnalysisView.as_view(), name='resume_analysis'),

    # Command Center
    path('onboarding/', OnboardingView.as_view(), name='onboarding'),
    path('mission/today/', DailyMissionView.as_view(), name='daily_mission'),
    path('analytics/insights/', LearningInsightsView.as_view(), name='learning_insights'),

    # Topic Resources
    path('topics/<str:topic_id>/resources/', TopicResourceView.as_view(), name='topic_resources'),

    # Mock Interview
    path('interview/', MockInterviewView.as_view(), name='mock_interview_list'),
    path('interview/start/', MockInterviewView.as_view(), name='mock_interview_start'),
    path('interview/<int:interview_id>/answer/', MockInterviewAnswerView.as_view(), name='mock_interview_answer'),

    # Career Path Generation
    path('career/generate-path/', GenerateCareerPathView.as_view(), name='career_generate_path'),

    # Study Rooms
    path('rooms/', StudyRoomView.as_view(), name='study_rooms'),

    # Router covers /paths/ and /bookmarks/
    path('', include(router.urls)),
]
