# CORS Fix - Quick Steps

## The Problem
Frontend on `http://localhost:8080` couldn't access backend on `http://127.0.0.1:8000` due to CORS policy.

## The Solution Applied

### 1. Updated Django Settings ✅
**File:** `backend/config/settings.py`

Changes made:
- Added `localhost` and `127.0.0.1` to `ALLOWED_HOSTS`
- Configured `CORS_ALLOWED_ORIGINS` whitelist with:
  - `http://localhost:5173` (Vite default)
  - `http://localhost:3000` (alternative)
  - `http://localhost:8080` (your current port)
  - `http://127.0.0.1:*` (all matching IPs)
- Set `CORS_ALLOW_CREDENTIALS = True`
- Added explicit CORS headers

### 2. Now You Need To

**Step 1: Restart Django Backend**
```bash
# Stop the current server (Ctrl+C in the terminal)
# Then restart:
cd backend
python manage.py runserver
```

**Step 2: Keep Frontend Running**
The frontend should continue running (usually auto-reloads):
```bash
cd frontend
npm run dev
```

**Step 3: Clear Browser Cache**
- Open Developer Tools (F12)
- Go to Application → Cookies → Delete all for localhost
- Hard refresh (Ctrl+Shift+R)

**Step 4: Try Login Again**
Navigate to `http://localhost:8080` and attempt login.

---

## How It Works Now

1. Frontend makes request to `http://127.0.0.1:8000/api/auth/login/`
2. Django receives the request
3. CorsMiddleware checks the origin header (`http://localhost:8080`)
4. Finds it in `CORS_ALLOWED_ORIGINS`
5. Adds `Access-Control-Allow-Origin: http://localhost:8080` header
6. Browser allows the request ✅

---

## If It Still Doesn't Work

Try these debugging steps:

### Check 1: Verify CORS Middleware is First
Look at `backend/config/settings.py` MIDDLEWARE - CorsMiddleware should be **first**:
```python
MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",  # ← Should be first
    "django.middleware.security.SecurityMiddleware",
    ...
]
```

### Check 2: Verify django-cors-headers is Installed
```bash
cd backend
pip list | findstr cors
```
Should show: `django-cors-headers`

If not installed:
```bash
pip install django-cors-headers
```

### Check 3: Check Exact Error in Browser
Open DevTools (F12):
- Network tab → Click the failed login request
- Headers tab → Look for response headers
- Should include: `access-control-allow-origin: http://localhost:8080`

### Check 4: Verify Backend is Running
```bash
curl -i http://127.0.0.1:8000/api/auth/login/
```
Should return 405 Method Not Allowed (since we're doing GET, not POST) - but importantly, you should see CORS headers in the response.

---

## Frontend API Configuration

**File:** `frontend/src/lib/api-client.ts`
- API_BASE already set to `http://127.0.0.1:8000/api` ✅
- Token handling configured ✅
- CORS credentials enabled ✅

---

## Complete CORS Configuration Added

```python
CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://localhost:8080",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:8080",
]

CORS_ALLOW_CREDENTIALS = True

CORS_ALLOW_HEADERS = [
    "accept",
    "accept-encoding",
    "authorization",
    "content-type",
    "dnt",
    "origin",
    "user-agent",
    "x-csrftoken",
    "x-requested-with",
]
```

---

## Common Scenarios

### Scenario 1: Using different dev ports
Add to `CORS_ALLOWED_ORIGINS`:
```python
"http://localhost:4200",  # New port
"http://127.0.0.1:4200",
```

### Scenario 2: Testing on another machine
Add server IP:
```python
"http://192.168.1.100:8080",  # Replace with actual IP
```

### Scenario 3: Production deployment
```python
CORS_ALLOWED_ORIGINS = os.getenv("CORS_ALLOWED_ORIGINS", "").split(",")
# Then set in .env: CORS_ALLOWED_ORIGINS=https://yourapp.com,https://www.yourapp.com
```

---

## Next: Test the Fix

1. **Restart Backend** - This is the key step!
   ```bash
   # Press Ctrl+C in backend terminal
   python manage.py runserver
   ```

2. **Clear cache** - F12 → Application → Cookies → Delete

3. **Try login** - Go to `http://localhost:8080` and login

4. **Check console** - Open DevTools to see if error is gone

---

**Status:** CORS Configured ✅  
**Action Required:** Restart Django server

Good luck! 🚀
