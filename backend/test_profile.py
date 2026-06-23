import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from rest_framework.test import APIRequestFactory, force_authenticate
from django.contrib.auth import get_user_model
from core.views import UserProfileView

User = get_user_model()
user = User.objects.first()

if not user:
    print("No users found.")
    exit(1)

factory = APIRequestFactory()
request = factory.get('/api/profile/')
force_authenticate(request, user=user)

view = UserProfileView.as_view()
try:
    response = view(request)
    print("Response Status:", response.status_code)
    if response.status_code == 500:
        print("Data:", response.data)
except Exception as e:
    import traceback
    traceback.print_exc()
