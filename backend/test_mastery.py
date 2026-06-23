from core.models import User, Topic
from core.serializers import compute_topic_mastery

try:
    user = User.objects.first()
    topic = Topic.objects.first()
    if user and topic:
        print("Mastery score:", compute_topic_mastery(user, topic))
    else:
        print("No user or topic")
except Exception as e:
    import traceback
    traceback.print_exc()
