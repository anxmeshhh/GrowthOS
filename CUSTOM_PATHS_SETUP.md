# Custom Path Implementation Guide

## Overview
This guide walks through the implementation of custom learning path support in GrowthOS, including path creation, cloning, sharing, and visibility management.

## Backend Implementation Complete ✅

### Database Models
The following models have been added/updated:

#### 1. **LearningPath Model** (Enhanced)
New fields added to support custom paths:
- `visibility`: Choice field (private, public, shared)
- `original_path`: FK reference for cloned paths
- `estimated_weeks`: Duration field
- `created_at`, `updated_at`: Timestamps
- `created_by`: Already existed, tracks path creator

#### 2. **PathSharing Model** (New)
Handles sharing permissions between users:
```python
- path: ForeignKey to LearningPath
- shared_by: User who initiated sharing
- shared_to: User receiving access
- permission: Choice field (view, edit, admin)
- created_at: Timestamp
```

### API Endpoints

The following REST endpoints have been created:

#### Custom Path Management
```
POST   /api/custom-paths/              - Create new custom path
GET    /api/custom-paths/              - List all accessible paths
GET    /api/custom-paths/{slug}/       - Get path details
PATCH  /api/custom-paths/{slug}/       - Update path
DELETE /api/custom-paths/{slug}/       - Delete path (creator only)
```

#### Path Operations
```
POST   /api/custom-paths/{slug}/clone/       - Clone a path
POST   /api/custom-paths/{slug}/share/       - Share with user
POST   /api/custom-paths/{slug}/unshare/     - Remove sharing
GET    /api/custom-paths/{slug}/shared_with/ - List shared users
PATCH  /api/custom-paths/{slug}/update_visibility/ - Change visibility
```

#### Additional Endpoints
```
GET    /api/custom-paths/my_paths/     - User's created paths
GET    /api/custom-paths/shared_paths/ - Paths shared with user
GET    /api/custom-paths/public_paths/ - Public paths by others
GET    /api/custom-paths/{slug}/progress/ - Path completion progress
```

### Serializers Added
- `PathSharingSerializer`: For sharing relationships
- `CustomPathCreateSerializer`: For creating new paths
- `PathCloneSerializer`: For cloning operations
- Updated `LearningPathSerializer`: Includes new fields and permissions

### Database Migration
Migration file: `core/migrations/0011_*.py`

To apply:
```bash
python manage.py migrate core
```

## Frontend Implementation Complete ✅

### New Components

#### 1. **CustomPathBuilder** (`PathBuilder.tsx`)
A modal dialog for creating new custom paths with:
- Title and slug generation
- Description field
- Duration estimation
- Dynamic topic addition/editing
- Topic dependency management

**Usage:**
```tsx
import { CustomPathBuilder } from '@/components/custom-paths';

<CustomPathBuilder />
```

#### 2. **PathSharingDialog** (`PathSharingDialog.tsx`)
Dialog for managing path sharing and visibility:
- Toggle between private/public/shared
- Add users with specific permissions
- View and remove shared users
- Copy public share link

**Usage:**
```tsx
import { PathSharingDialog } from '@/components/custom-paths';

<PathSharingDialog
  pathSlug="my-path"
  pathTitle="My Learning Path"
  isCreator={true}
  currentVisibility="private"
/>
```

#### 3. **CustomPathList** (`CustomPathList.tsx`)
Displays user's custom paths with:
- Clone functionality
- Edit/delete options
- Sharing management
- Quick navigation

**Usage:**
```tsx
import { CustomPathList } from '@/components/custom-paths';

<CustomPathList onPathCloned={(path) => console.log(path)} />
```

#### 4. **CustomPathsManagement** (Route: `/custom-paths`)
Full page for managing custom paths:
- Tab interface for "My Paths" and "Create New"
- Integrated path builder
- List of existing paths
- Tips and guidance

## Integration Steps

### Step 1: Apply Database Migration
```bash
cd backend
python manage.py migrate
```

### Step 2: Add Navigation Link (Sidebar)
Update `frontend/src/components/growth-sidebar.tsx`:

```tsx
// Add to navigation items
{
  icon: FolderPlus,
  label: 'My Paths',
  to: '/custom-paths',
  badge: '+ Create',
}
```

### Step 3: Add Route to Router
Ensure the route file is picked up by TanStack Router (usually automatic with `.tsx` files in routes directory).

### Step 4: Update Dashboard (Optional)
To show custom paths on the dashboard, add to `dashboard.tsx`:

```tsx
import { CustomPathList } from '@/components/custom-paths';

// In dashboard component:
<section>
  <h2 className="text-xl font-bold mb-4">Your Custom Paths</h2>
  <CustomPathList />
</section>
```

## Feature Overview

### Creating Custom Paths
1. Click "Create Custom Path" button or navigate to `/custom-paths`
2. Enter path title (slug auto-generates)
3. Add description and duration
4. Add topics with titles and summaries
5. Click "Create Path"

### Cloning Paths
1. View a path (custom or predefined)
2. Click the "Clone" button
3. Enter new title and slug
4. New path created with all topics and dependencies
5. Original path tracked for reference

### Sharing Paths
1. Open path sharing dialog
2. Choose visibility: Private / Public / Shared
3. If shared: Add specific users with permissions
4. If public: Copy share link
5. Users can view or edit (based on permission)

### Permissions
- **View**: Can read path and topics, but cannot modify
- **Edit**: Can modify path, topics, and order
- **Admin**: Full access (future enhancement)

## API Response Examples

### Create Custom Path
```json
POST /api/custom-paths/
{
  "title": "Full Stack Development",
  "slug": "full-stack-development",
  "description": "Learn both frontend and backend",
  "estimated_weeks": 16
}

Response:
{
  "id": 5,
  "title": "Full Stack Development",
  "slug": "full-stack-development",
  "visibility": "private",
  "is_custom": true,
  "created_by": 1,
  "created_at": "2026-06-15T...",
  "topics": [],
  "can_edit": true
}
```

### Share Path
```json
POST /api/custom-paths/my-path/share/
{
  "username": "john",
  "permission": "edit"
}

Response:
{
  "id": 2,
  "path": 5,
  "shared_to": 3,
  "shared_to_username": "john",
  "permission": "edit",
  "created_at": "2026-06-15T..."
}
```

### Clone Path
```json
POST /api/custom-paths/existing-path/clone/
{
  "new_title": "Existing Path (Copy)",
  "new_slug": "existing-path-copy",
  "description": ""
}

Response:
{
  "id": 6,
  "title": "Existing Path (Copy)",
  "original_path": 5,
  "topics": [...],
  "visibility": "private"
}
```

## Key Features

### User Management
- ✅ Create unlimited custom paths
- ✅ Clone any accessible path
- ✅ Share paths with specific users
- ✅ Set granular permissions (view/edit)
- ✅ Track path creator and sharing history

### Path Visibility
- **Private**: Only creator can access
- **Public**: Visible to all users, read-only (unless edit permission)
- **Shared**: Only specific users can access with assigned permissions

### Tracking
- Paths track their original when cloned
- Sharing history is maintained
- User contributions tracked (10 XP for creating, 5 XP for cloning)

## Security Considerations

1. **Permission Checks**: All endpoints verify user ownership or sharing permissions
2. **Deletion**: Only creator can delete custom paths
3. **Editing**: Only creator or edit-permission users can modify
4. **Visibility**: Private paths cannot be accessed without explicit sharing

## Testing Endpoints

### Test Path Creation
```bash
curl -X POST http://localhost:8000/api/custom-paths/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "title": "Test Path",
    "slug": "test-path",
    "description": "A test learning path",
    "estimated_weeks": 8
  }'
```

### Test Path Sharing
```bash
curl -X POST http://localhost:8000/api/custom-paths/test-path/share/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "username": "testuser",
    "permission": "view"
  }'
```

## Next Steps

1. ✅ **Models**: Created and migrated
2. ✅ **APIs**: Implemented with full CRUD and operations
3. ✅ **Frontend Components**: Built with React/TypeScript
4. ⏳ **Navigation Integration**: Add to sidebar/menu
5. ⏳ **Dashboard Integration**: Display on main dashboard
6. ⏳ **Testing**: Comprehensive test suite
7. ⏳ **UI Polish**: Refine styling and UX

## Troubleshooting

### Migration Issues
If migration fails:
```bash
python manage.py migrate core 0010_verifiedproject  # Back to previous
python manage.py makemigrations core --dry-run  # Check what would be created
```

### Import Errors
If PathSharing import fails, ensure:
- Model is defined in `core/models.py`
- Model is imported in `core/serializers.py`
- Migration has been applied

### API 404 Errors
Verify:
- Routes are registered in `core/urls.py`
- ViewSet is included in `router.register()`
- Custom view is imported and URLpattern is added

## Support & Documentation

- API Documentation: Available at `/api/` (DRF browsable API)
- Django Admin: Manage paths at `/admin/core/learningpath/`
- Sharing Management: `/admin/core/pathsharing/`
