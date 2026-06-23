import django
django.setup()
from django.test import Client
from core.models import User
from rest_framework_simplejwt.tokens import RefreshToken
import traceback

c = Client()
for user in User.objects.all():
    print(f"\n--- Testing User: {user.username} ---")
    try:
        refresh = RefreshToken.for_user(user)
        token = str(refresh.access_token)
        headers = {'HTTP_AUTHORIZATION': f'Bearer {token}'}

        resp = c.get('/api/profile/', **headers)
        print(f"Profile: {resp.status_code}")
        if resp.status_code == 500:
            print("Profile 500:", resp.content.decode('utf-8'))

        resp = c.get('/api/today/', **headers)
        print(f"Today: {resp.status_code}")
        if resp.status_code == 500:
            print("Today 500:", resp.content.decode('utf-8'))

        resp = c.get('/api/paths/', **headers)
        print(f"Paths: {resp.status_code}")
        if resp.status_code == 500:
            print("Paths 500:", resp.content.decode('utf-8'))

        resp = c.post('/api/chat/', {'message': 'Hello'}, content_type='application/json', **headers)
        print(f"Chat: {resp.status_code}")
        if resp.status_code == 500:
            print("Chat 500:", resp.content.decode('utf-8'))

    except Exception as e:
        print(f"Exception for {user.username}:")
        traceback.print_exc()

print("\nDone testing all users.")
