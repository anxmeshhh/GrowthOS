# Custom Paths Quick Reference Card

## 🚀 Getting Started (5 Minutes)

```bash
# 1. Migrate database
cd backend && python manage.py migrate

# 2. Add to sidebar (growth-sidebar.tsx line ~XX)
{
  to: '/custom-paths',
  label: 'My Paths',
  icon: BookOpen,
}

# 3. Navigate to custom paths
http://localhost:5173/custom-paths

# 4. Create your first custom path!
```

---

## 📁 Key Files

| File | Purpose | Status |
|------|---------|--------|
| `models.py` | Enhanced LearningPath, new PathSharing | ✅ Ready |
| `custom_path_views.py` | CustomPathViewSet, API logic | ✅ Ready |
| `serializers.py` | Data serialization | ✅ Ready |
| `urls.py` | Route configuration | ✅ Ready |
| `PathBuilder.tsx` | Create paths UI | ✅ Ready |
| `PathSharingDialog.tsx` | Sharing UI | ✅ Ready |
| `CustomPathList.tsx` | Manage paths UI | ✅ Ready |
| `custom-paths.tsx` (route) | Main page | ✅ Ready |

---

## 🔌 API Quick Calls

### Create
```bash
POST /api/custom-paths/
{
  "title": "Path Name",
  "slug": "path-slug",
  "description": "...",
  "estimated_weeks": 12
}
```

### Clone
```bash
POST /api/custom-paths/{slug}/clone/
{
  "new_title": "Copy Name",
  "new_slug": "copy-slug"
}
```

### Share
```bash
POST /api/custom-paths/{slug}/share/
{
  "username": "friend",
  "permission": "view"  // or "edit"
}
```

### Change Visibility
```bash
PATCH /api/custom-paths/{slug}/update_visibility/
{
  "visibility": "public"  // private, public, shared
}
```

### Get Progress
```bash
GET /api/custom-paths/{slug}/progress/
```

---

## 🎯 Common Tasks

### Create Custom Path
1. Go to `/custom-paths`
2. Click "Create New" tab
3. Fill form and add topics
4. Click "Create Path"

### Share with Friend
1. Open your path
2. Click "Share" button
3. Select visibility
4. Add username and permission
5. Done!

### Clone Existing Path
1. Find path to copy
2. Click "Clone" button
3. Enter new name
4. Confirm
5. Customize if needed

### Check Progress
1. Open path
2. View topic status
3. See completion %
4. Start learning!

---

## 🔐 Permission Matrix

|  | Creator | Shared (view) | Shared (edit) | Public View |
|---|---------|---------------|---------------|-------------|
| View | ✅ | ✅ | ✅ | ✅ |
| Edit | ✅ | ❌ | ✅ | ❌ |
| Delete | ✅ | ❌ | ❌ | ❌ |
| Share | ✅ | ❌ | ❌ | ❌ |
| Clone | ✅ | ✅ | ✅ | ✅ |

---

## 📊 Database Schema

### LearningPath (Enhanced)
```
id, title, slug, description
is_active, is_custom, created_by_id
visibility, original_path_id
estimated_weeks
created_at, updated_at
```

### PathSharing (New)
```
id
path_id, shared_by_id, shared_to_id
permission (view, edit, admin)
created_at
```

---

## 🎁 XP Rewards

- Create custom path: **10 XP**
- Clone path: **5 XP**

---

## 💬 Component API

### CustomPathBuilder
```tsx
<CustomPathBuilder />
```
Props: None (hooks to API)

### PathSharingDialog
```tsx
<PathSharingDialog
  pathSlug="my-path"
  pathTitle="My Path"
  isCreator={true}
  currentVisibility="private"
/>
```

### CustomPathList
```tsx
<CustomPathList
  onPathCloned={(path) => console.log(path)}
/>
```

---

## 🧪 Test Commands

```bash
# Get token
TOKEN=$(curl -s -X POST http://localhost:8000/api/auth/login/ \
  -d '{"username":"user","password":"pass"}' | grep -o '"[^"]*"' | head -1)

# List my paths
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8000/api/custom-paths/my_paths/

# Create path
curl -X POST http://localhost:8000/api/custom-paths/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Test","slug":"test","description":"","estimated_weeks":8}'
```

---

## 🔧 Configuration

### Settings to Verify
```python
# settings.py
INSTALLED_APPS = [
    'rest_framework',
    'corsheaders',
    'core',  # ✅ Should include core app
]

# Django REST Framework
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ],
}
```

---

## 📈 Monitoring

### Check Migration Status
```bash
python manage.py showmigrations core
```

### View API Schema
```bash
curl -H "Authorization: Bearer TOKEN" \
  http://localhost:8000/api/schema/
```

### Django Admin
- Path management: `/admin/core/learningpath/`
- Sharing management: `/admin/core/pathsharing/`

---

## ⚠️ Common Issues

| Issue | Solution |
|-------|----------|
| 404 on route | Ensure TanStack Router picks up `.tsx` files |
| 403 Forbidden | Check authentication token validity |
| Migration fails | Rollback to 0010, check models.py syntax |
| Can't see paths | Check visibility permissions |
| Clone endpoint 404 | Verify URL pattern in urls.py |

---

## 📞 Support Resources

| Resource | Location |
|----------|----------|
| Setup Guide | `CUSTOM_PATHS_SETUP.md` |
| API Reference | `CUSTOM_PATHS_API_REFERENCE.md` |
| Integration | `CUSTOM_PATHS_INTEGRATION.md` |
| Summary | `IMPLEMENTATION_SUMMARY.md` |

---

## ✅ Pre-Launch Checklist

- [ ] Migration applied (`python manage.py migrate`)
- [ ] Navigation link added to sidebar
- [ ] Can access `/custom-paths` route
- [ ] Create a test custom path
- [ ] Test cloning functionality
- [ ] Test sharing with another user
- [ ] Verify XP awards are working
- [ ] Check admin panel shows new models

---

## 🎓 Learning Outcomes

After implementing custom paths, users can:
1. ✅ Design personalized learning roadmaps
2. ✅ Collaborate by sharing paths
3. ✅ Reuse paths via cloning
4. ✅ Control path visibility
5. ✅ Track progress through custom paths

---

**Quick Reference v1.0** | June 2026 | GrowthOS
