import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth.models import User
from rest_framework_simplejwt.tokens import RefreshToken

# Create test user
user, created = User.objects.get_or_create(username='test_jwt@example.com', email='test_jwt@example.com')
if created:
    user.set_unusable_password()
    user.save()

# Issue JWT
refresh = RefreshToken.for_user(user)
access_token = str(refresh.access_token)
print(f"Access Token: {access_token[:20]}...")

# Simulate an API request to see if it's valid
from rest_framework.test import APIRequestFactory
from core.views import UserProfileView
from rest_framework.request import Request
from rest_framework_simplejwt.authentication import JWTAuthentication

factory = APIRequestFactory()
request = factory.get('/api/profile/', HTTP_AUTHORIZATION=f'Bearer {access_token}')

# Authenticate manually
auth = JWTAuthentication()
try:
    user_auth, token = auth.authenticate(request)
    print(f"Authenticated user: {user_auth.username}")
    print("Token is VALID.")
except Exception as e:
    print(f"Authentication failed: {e}")
