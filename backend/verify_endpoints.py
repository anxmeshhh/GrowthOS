import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from rest_framework.test import APIRequestFactory, force_authenticate
from django.contrib.auth import get_user_model
from django.urls import reverse, resolve
from django.urls import get_resolver

User = get_user_model()
user = User.objects.first()

if not user:
    print("No users found.")
    exit(1)

factory = APIRequestFactory()
resolver = get_resolver()

# Common endpoints to test
endpoints = [
    '/api/profile/',
    '/api/today/',
    '/api/paths/',
    '/api/heatmap/',
    '/api/activity/',
    '/api/auth/daily-login/',
    '/api/pomodoro/',
    '/api/all-notes/',
    '/api/all-screenshots/'
]

print("Running Automated System Verification...")
print("========================================")
for url in endpoints:
    request = factory.get(url)
    force_authenticate(request, user=user)
    
    match = resolve(url)
    view = match.func
    
    try:
        response = view(request)
        if hasattr(response, 'render'):
            response.render()
        status = response.status_code
        if status == 500:
            print(f"[FAIL] {url} -> 500 Internal Server Error")
        elif status == 200 or status == 201:
            print(f"[OK] {url} -> {status} OK")
        else:
            print(f"[WARN] {url} -> {status}")
    except Exception as e:
        print(f"[CRASHED] {url} -> CRASHED: {e}")

print("========================================")
