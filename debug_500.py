import urllib.request
import json
import urllib.parse
import urllib.error

try:
    # 1. Register a test user
    data = json.dumps({"username": "debuguser", "email": "debug@test.com", "password": "password123"}).encode('utf-8')
    req = urllib.request.Request('http://127.0.0.1:8000/api/auth/register/', data=data, headers={'Content-Type': 'application/json'})
    try:
        urllib.request.urlopen(req)
    except urllib.error.HTTPError as e:
        pass # user might exist

    # 2. Login
    data = json.dumps({"username": "debuguser", "password": "password123"}).encode('utf-8')
    req = urllib.request.Request('http://127.0.0.1:8000/api/auth/login/', data=data, headers={'Content-Type': 'application/json'})
    try:
        resp = urllib.request.urlopen(req)
        token = json.loads(resp.read().decode('utf-8'))['access']
    except Exception as e:
        print(f"Login failed: {e}")
        exit(1)

    # 3. Hit profile
    req = urllib.request.Request('http://127.0.0.1:8000/api/profile/', headers={'Authorization': f'Bearer {token}'})
    try:
        resp = urllib.request.urlopen(req)
        print("Success:", resp.read().decode('utf-8'))
    except urllib.error.HTTPError as e:
        print(f"Profile 500 Error: {e.code}")
        print(e.read().decode('utf-8'))
except Exception as e:
    print("Exception", e)
