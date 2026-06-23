import django
django.setup()
from django.test import Client
from core.models import User
from rest_framework_simplejwt.tokens import RefreshToken

try:
    user = User.objects.first()
    if user:
        c = Client()
        refresh = RefreshToken.for_user(user)
        token = str(refresh.access_token)
        headers = {'HTTP_AUTHORIZATION': f'Bearer {token}'}
        
        print("Testing /api/profile/")
        resp = c.get('/api/profile/', **headers)
        print("Profile Status:", resp.status_code)
        if resp.status_code == 500:
            print("Profile Content:", resp.content.decode('utf-8'))
            
        print("\nTesting /api/paths/")
        resp = c.get('/api/paths/', **headers)
        print("Paths Status:", resp.status_code)
        if resp.status_code == 500:
            print("Paths Content:", resp.content.decode('utf-8'))
            
        print("\nTesting /api/today/")
        resp = c.get('/api/today/', **headers)
        print("Today Status:", resp.status_code)
        if resp.status_code == 500:
            print("Today Content:", resp.content.decode('utf-8'))
            
except Exception as e:
    import traceback
    traceback.print_exc()
