from django.db import models
from django.contrib.auth.models import User

class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    selected_path = models.ForeignKey('LearningPath', on_delete=models.SET_NULL, null=True, blank=True)
    current_streak = models.IntegerField(default=0)
    longest_streak = models.IntegerField(default=0)

    def __str__(self):
        return f"{self.user.username}'s Profile"

class LearningPath(models.Model):
    title = models.CharField(max_length=200)
    slug = models.SlugField(unique=True)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    is_custom = models.BooleanField(default=False)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='custom_paths', null=True, blank=True)

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

class Topic(models.Model):
    path = models.ForeignKey(LearningPath, on_delete=models.CASCADE, related_name='topics')
    title = models.CharField(max_length=200)
    slug = models.SlugField()
    summary = models.TextField(blank=True)
    order = models.IntegerField(default=0)
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

    def __str__(self):
        return f"{self.user.username} - {self.topic.title} ({self.status})"

class Contribution(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='contributions')
    date = models.DateField(auto_now_add=True)
    action_type = models.CharField(max_length=50) # e.g., 'topic_cleared', 'notes_uploaded'
    points = models.IntegerField(default=1)

    class Meta:
        ordering = ['-date']

    def __str__(self):
        return f"{self.user.username} - {self.date} - {self.action_type}"

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
