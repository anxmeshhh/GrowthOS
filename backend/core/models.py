from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
import secrets
import string

class AdminRequest(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='admin_requests')
    status = models.CharField(
        max_length=20, 
        choices=[('pending', 'Pending'), ('approved', 'Approved'), ('rejected', 'Rejected')],
        default='pending'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.username} - {self.status}"

class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    selected_path = models.ForeignKey('LearningPath', on_delete=models.SET_NULL, null=True, blank=True)
    selected_title = models.CharField(max_length=100, default='Novice')
    current_streak = models.IntegerField(default=0)
    longest_streak = models.IntegerField(default=0)
    github_username = models.CharField(max_length=100, blank=True, default='')
    github_access_token = models.TextField(blank=True, default='')
    streak_revive_used_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"{self.user.username}'s Profile"

class OTPVerification(models.Model):
    email = models.EmailField(unique=True)
    otp = models.CharField(max_length=6)
    created_at = models.DateTimeField(auto_now_add=True)
    is_verified = models.BooleanField(default=False)

    def generate_otp(self):
        # M8: Use secrets module for cryptographically secure OTP generation
        self.otp = ''.join(secrets.choice(string.digits) for _ in range(6))
        self.created_at = timezone.now()
        self.is_verified = False
        self.save()

    def is_valid(self):
        # Valid for 10 minutes
        return not self.is_verified and (timezone.now() - self.created_at).total_seconds() < 600

    def __str__(self):
        return f"{self.email} - {self.otp}"

class LearningPath(models.Model):
    VISIBILITY_CHOICES = [
        ('private', 'Private'),
        ('public', 'Public'),
        ('shared', 'Shared'),
    ]
    
    title = models.CharField(max_length=200)
    slug = models.SlugField(max_length=255, unique=True)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    is_custom = models.BooleanField(default=False)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='custom_paths', null=True, blank=True)
    visibility = models.CharField(max_length=20, choices=VISIBILITY_CHOICES, default='private')
    original_path = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, related_name='clones')
    github_repo_name = models.CharField(max_length=255, null=True, blank=True)
    estimated_weeks = models.IntegerField(default=12, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, null=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.title

class Bookmark(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='bookmarks')
    path = models.ForeignKey(LearningPath, on_delete=models.CASCADE, related_name='bookmarked_by')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'path')

    def __str__(self):
        return f"{self.user.username} bookmarked {self.path.title}"

class PathSharing(models.Model):
    PERMISSION_CHOICES = [
        ('view', 'View Only'),
        ('edit', 'Can Edit'),
        ('admin', 'Admin'),
    ]
    
    path = models.ForeignKey(LearningPath, on_delete=models.CASCADE, related_name='shared_with_users')
    shared_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='shared_paths_created')
    shared_to = models.ForeignKey(User, on_delete=models.CASCADE, related_name='shared_paths_received')
    permission = models.CharField(max_length=20, choices=PERMISSION_CHOICES, default='view')
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ('path', 'shared_to')
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.path.title} shared with {self.shared_to.username}"

class Topic(models.Model):
    NODE_KIND_CHOICES = [
        ('milestone', 'Milestone'),
        ('topic', 'Topic'),
        ('optional', 'Optional'),
    ]
    path = models.ForeignKey(LearningPath, on_delete=models.CASCADE, related_name='topics')
    title = models.CharField(max_length=200)
    slug = models.SlugField(max_length=255)
    summary = models.TextField(blank=True)
    order = models.IntegerField(default=0)
    node_kind = models.CharField(
        max_length=20,
        choices=NODE_KIND_CHOICES,
        default='topic'
    )
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='custom_topics', null=True, blank=True)
    dependencies = models.ManyToManyField('self', symmetrical=False, related_name='dependents', blank=True)
    
    class Meta:
        ordering = ['order']

    def __str__(self):
        return f"{self.path.title} - {self.title}"

class TopicMaterial(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('verified', 'Verified'),
        ('rejected', 'Rejected'),
    ]
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='materials')
    topic = models.ForeignKey(Topic, on_delete=models.CASCADE, related_name='materials')
    file = models.FileField(upload_to='materials/')
    uploaded_at = models.DateTimeField(auto_now_add=True)
    ai_status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    ai_feedback = models.TextField(blank=True, null=True)
    ai_score = models.IntegerField(default=0)

    class Meta:
        # M1: Enforce score is always in [0, 100] at the DB level
        constraints = [
            models.CheckConstraint(
                check=models.Q(ai_score__gte=0) & models.Q(ai_score__lte=100),
                name='topicmaterial_ai_score_range',
            ),
        ]

    def __str__(self):
        return f"{self.user.username} - {self.topic.title} ({self.ai_status})"

class TopicProgress(models.Model):
    STATUS_CHOICES = [
        ('locked', 'Locked'),
        ('available', 'Available'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
    ]
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='topic_progress')
    topic = models.ForeignKey(Topic, on_delete=models.CASCADE, related_name='progress')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='locked')
    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        # M2: Prevent duplicate progress rows under concurrent requests
        unique_together = ('user', 'topic')
        # M1: Indexed for hot query pattern: filter by user+status
        indexes = [
            models.Index(fields=['user', 'status'], name='topicprogress_user_status_idx'),
        ]

    def __str__(self):
        return f"{self.user.username} - {self.topic.title} ({self.status})"

class Contribution(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='contributions')
    created_at = models.DateTimeField(auto_now_add=True)
    action_type = models.CharField(max_length=50) # e.g., 'topic_cleared', 'notes_uploaded'
    points = models.IntegerField(default=1)

    class Meta:
        ordering = ['-created_at']
        # M1: Hot query pattern — daily dedup check: filter(user, action_type, created_at__date)
        indexes = [
            models.Index(fields=['user', 'action_type', 'created_at'], name='contrib_user_action_date'),
        ]
        # M1: Score sanity gate — points must be non-negative, EXCEPT the
        # 'streak_revived' spend which legitimately records a -10 XP cost.
        constraints = [
            models.CheckConstraint(
                check=models.Q(points__gte=0) | models.Q(action_type='streak_revived'),
                name='contribution_points_non_negative',
            ),
        ]

    def __str__(self):
        return f"{self.user.username} - {self.created_at} - {self.action_type}"

class ChatMessage(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='chat_messages')
    role = models.CharField(max_length=10) # 'user' or 'ai'
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"{self.user.username} ({self.role}) - {self.created_at}"

class TopicNote(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notes')
    topic = models.ForeignKey(Topic, on_delete=models.CASCADE, related_name='notes')
    content = models.TextField(blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('user', 'topic')

    def __str__(self):
        return f"Notes by {self.user.username} on {self.topic.title}"

class NoteDocument(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='note_documents')
    topic = models.ForeignKey(Topic, on_delete=models.CASCADE, related_name='note_documents')
    file = models.FileField(upload_to='note_documents/')
    filename = models.CharField(max_length=255, blank=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-uploaded_at']

    def __str__(self):
        return f"{self.filename} by {self.user.username}"

class TopicScreenshot(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='screenshots')
    topic = models.ForeignKey(Topic, on_delete=models.CASCADE, related_name='screenshots')
    image = models.ImageField(upload_to='screenshots/')
    caption = models.CharField(max_length=255, blank=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-uploaded_at']

    def __str__(self):
        return f"Screenshot by {self.user.username} on {self.topic.title}"

class TopicQuiz(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='quizzes')
    topic = models.ForeignKey(Topic, on_delete=models.CASCADE, related_name='quizzes')
    difficulty = models.CharField(max_length=20, default='medium')
    questions = models.JSONField(default=list)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'topic', 'difficulty')

    def __str__(self):
        return f"Quiz for {self.topic.title} ({self.difficulty}) by {self.user.username}"

class TopicFlashcard(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='flashcards')
    topic = models.ForeignKey(Topic, on_delete=models.CASCADE, related_name='flashcards')
    cards = models.JSONField(default=list)
    quality_rating = models.IntegerField(default=0, help_text="0=unrated, 1=good, -1=bad")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'topic')

    def __str__(self):
        return f"Flashcards for {self.topic.title} by {self.user.username}"

class VerifiedProject(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='verified_projects')
    topic = models.ForeignKey(Topic, on_delete=models.CASCADE, related_name='verified_projects')
    repo_url = models.URLField()
    repo_name = models.CharField(max_length=200, blank=True)
    ai_evaluation = models.TextField(blank=True)
    ai_score = models.IntegerField(default=0)
    verified_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'topic')
        ordering = ['-verified_at']
        # M1: Enforce score is always in [0, 100] at the DB level
        constraints = [
            models.CheckConstraint(
                check=models.Q(ai_score__gte=0) & models.Q(ai_score__lte=100),
                name='verifiedproject_ai_score_range',
            ),
        ]

    def __str__(self):
        return f"Project by {self.user.username} for {self.topic.title}"

class TopicFeynman(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='feynman_entries')
    topic = models.ForeignKey(Topic, on_delete=models.CASCADE, related_name='feynman_entries')
    concept = models.CharField(max_length=255)
    explanation = models.TextField()
    feedback = models.TextField(blank=True, null=True)
    score = models.IntegerField(default=0)
    is_self_graded = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.username} - {self.concept} ({self.score}/100)"

class PomodoroSession(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='pomodoros')
    duration_minutes = models.IntegerField(default=25)
    completed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-completed_at']

    def __str__(self):
        return f"{self.user.username} - {self.duration_minutes}m ({self.completed_at.strftime('%Y-%m-%d')})"

class Flashcard(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='active_flashcards')
    topic = models.ForeignKey(Topic, on_delete=models.CASCADE, related_name='active_flashcards')
    
    front = models.TextField()
    back = models.TextField()
    
    is_verified = models.BooleanField(default=False)
    quality_rating = models.IntegerField(default=0, help_text="0=unrated, 1=good, -1=bad")
    
    ease_factor = models.FloatField(default=2.5)
    interval_days = models.IntegerField(default=0)
    next_review_date = models.DateField(auto_now_add=True)
    
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['next_review_date', 'created_at']

    def __str__(self):
        return f"Flashcard for {self.topic.title}: {self.front[:20]}..."


class SiteSetting(models.Model):
    """Admin-editable key/value system settings (one row per key)."""
    key = models.CharField(max_length=100, unique=True, db_index=True)
    value = models.CharField(max_length=500, blank=True, default='')
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.key} = {self.value}"


class Notification(models.Model):
    TYPE_CHOICES = [
        ('topic_complete', 'Topic Complete'),
        ('streak_milestone', 'Streak Milestone'),
        ('flashcards_due', 'Flashcards Due'),
        ('path_shared', 'Path Shared'),
        ('quiz_ready', 'Quiz Ready'),
        ('general', 'General'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    type = models.CharField(max_length=30, choices=TYPE_CHOICES, default='general')
    message = models.CharField(max_length=300)
    link = models.CharField(max_length=200, blank=True, default='')
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'is_read', 'created_at'], name='notif_user_read_idx'),
        ]

    def __str__(self):
        return f"{self.user.username} — {self.type}: {self.message[:50]}"
