# Custom Paths API Reference

## Authentication
All endpoints require Bearer token authentication:
```
Authorization: Bearer <access_token>
```

## Base URL
```
http://localhost:8000/api/
```

---

## Path Management Endpoints

### 1. Create Custom Path
**Endpoint:** `POST /custom-paths/`

**Request:**
```json
{
  "title": "Full Stack Development",
  "slug": "full-stack-dev",
  "description": "Learn modern web development from frontend to backend",
  "estimated_weeks": 16
}
```

**Response (201):**
```json
{
  "id": 5,
  "title": "Full Stack Development",
  "slug": "full-stack-dev",
  "description": "Learn modern web development...",
  "is_custom": true,
  "created_by": 1,
  "created_by_username": "john_doe",
  "visibility": "private",
  "estimated_weeks": 16,
  "created_at": "2026-06-15T10:30:00Z",
  "updated_at": "2026-06-15T10:30:00Z",
  "topics": [],
  "is_bookmarked": false,
  "can_edit": true,
  "original_path": null
}
```

### 2. Get User's Custom Paths
**Endpoint:** `GET /custom-paths/my_paths/`

**Response (200):**
```json
[
  {
    "id": 5,
    "title": "Full Stack Development",
    "slug": "full-stack-dev",
    ...
  }
]
```

### 3. Get Paths Shared With User
**Endpoint:** `GET /custom-paths/shared_paths/`

**Response (200):**
```json
[
  {
    "id": 6,
    "title": "Machine Learning Basics",
    "created_by_username": "alice",
    "visibility": "shared",
    "can_edit": false,
    ...
  }
]
```

### 4. Get Public Paths (Browse)
**Endpoint:** `GET /custom-paths/public_paths/`

**Response (200):**
```json
[
  {
    "id": 7,
    "title": "Python for Beginners",
    "created_by_username": "bob",
    "visibility": "public",
    "can_edit": false,
    ...
  }
]
```

### 5. Get Specific Path
**Endpoint:** `GET /custom-paths/{slug}/`

**Response (200):**
```json
{
  "id": 5,
  "title": "Full Stack Development",
  ...
}
```

### 6. Update Path Details
**Endpoint:** `PATCH /custom-paths/{slug}/`

**Request:**
```json
{
  "title": "Modern Full Stack Development",
  "description": "Updated description",
  "estimated_weeks": 20
}
```

**Response (200):** Updated path object

### 7. Delete Custom Path
**Endpoint:** `DELETE /custom-paths/{slug}/`

**Response:** 204 No Content

**Note:** Only creator can delete

---

## Path Operations

### 8. Clone Path
**Endpoint:** `POST /custom-paths/{slug}/clone/`

**Request:**
```json
{
  "new_title": "Full Stack Development (Copy)",
  "new_slug": "full-stack-dev-copy",
  "description": ""
}
```

**Response (201):**
```json
{
  "id": 8,
  "title": "Full Stack Development (Copy)",
  "slug": "full-stack-dev-copy",
  "is_custom": true,
  "created_by": 1,
  "original_path": 5,
  "visibility": "private",
  "topics": [
    {
      "id": 10,
      "title": "Frontend Basics",
      "order": 0
    },
    {
      "id": 11,
      "title": "Backend Basics",
      "order": 1
    }
  ],
  ...
}
```

---

## Sharing & Permissions

### 9. Share Path with User
**Endpoint:** `POST /custom-paths/{slug}/share/`

**Request:**
```json
{
  "username": "jane_doe",
  "permission": "edit"
}
```

**Valid Permissions:**
- `view` - Read-only access
- `edit` - Can modify path and topics
- `admin` - Full control (future)

**Response (201):**
```json
{
  "id": 2,
  "path": 5,
  "path_title": "Full Stack Development",
  "shared_by": 1,
  "shared_by_username": "john_doe",
  "shared_to": 3,
  "shared_to_username": "jane_doe",
  "permission": "edit",
  "created_at": "2026-06-15T10:35:00Z"
}
```

### 10. Get Sharing Info
**Endpoint:** `GET /custom-paths/{slug}/shared_with/`

**Response (200):**
```json
[
  {
    "id": 1,
    "path": 5,
    "path_title": "Full Stack Development",
    "shared_to_username": "jane_doe",
    "permission": "edit",
    "created_at": "2026-06-15T10:35:00Z"
  },
  {
    "id": 2,
    "path": 5,
    "path_title": "Full Stack Development",
    "shared_to_username": "bob_smith",
    "permission": "view",
    "created_at": "2026-06-15T10:40:00Z"
  }
]
```

**Note:** Only available to path creator

### 11. Remove Sharing
**Endpoint:** `POST /custom-paths/{slug}/unshare/`

**Request:**
```json
{
  "username": "jane_doe"
}
```

**Response (200):**
```json
{
  "status": "Sharing removed"
}
```

**Note:** Only creator can unshare

### 12. Update Path Visibility
**Endpoint:** `PATCH /custom-paths/{slug}/update_visibility/`

**Request:**
```json
{
  "visibility": "public"
}
```

**Valid Values:**
- `private` - Only creator can access
- `public` - Anyone can view (read-only unless shared)
- `shared` - Only shared users can access

**Response (200):**
```json
{
  "id": 5,
  "title": "Full Stack Development",
  "visibility": "public",
  ...
}
```

---

## Progress Tracking

### 13. Get Path Progress
**Endpoint:** `GET /custom-paths/{slug}/progress/`

**Response (200):**
```json
{
  "path": {
    "id": 5,
    "title": "Full Stack Development",
    ...
  },
  "topics": [
    {
      "id": 10,
      "title": "Frontend Basics",
      "slug": "frontend-basics",
      "order": 0,
      "status": "available",
      "started_at": null,
      "completed_at": null
    },
    {
      "id": 11,
      "title": "Backend Basics",
      "slug": "backend-basics",
      "order": 1,
      "status": "locked",
      "started_at": null,
      "completed_at": null
    }
  ],
  "progress": {
    "total_topics": 2,
    "completed_topics": 0,
    "completion_percentage": 0.0
  }
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "detail": "Invalid visibility option. Choose: private, public, shared"
}
```

### 403 Forbidden
```json
{
  "detail": "Only the creator can delete this path."
}
```

### 404 Not Found
```json
{
  "detail": "Not found."
}
```

### 409 Conflict
```json
{
  "detail": "Slug 'full-stack-dev' already exists."
}
```

---

## Common Use Cases

### Use Case 1: User Creates and Shares Path

```bash
# 1. Create path
curl -X POST http://localhost:8000/api/custom-paths/ \
  -H "Authorization: Bearer token" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Python Basics",
    "slug": "python-basics",
    "description": "Learn Python fundamentals",
    "estimated_weeks": 4
  }'

# 2. Share with friend
curl -X POST http://localhost:8000/api/custom-paths/python-basics/share/ \
  -H "Authorization: Bearer token" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "friend_user",
    "permission": "view"
  }'

# 3. Make public
curl -X PATCH http://localhost:8000/api/custom-paths/python-basics/update_visibility/ \
  -H "Authorization: Bearer token" \
  -H "Content-Type: application/json" \
  -d '{"visibility": "public"}'
```

### Use Case 2: Clone and Customize Existing Path

```bash
# 1. Clone path
curl -X POST http://localhost:8000/api/custom-paths/python-basics/clone/ \
  -H "Authorization: Bearer token" \
  -H "Content-Type: application/json" \
  -d '{
    "new_title": "Python Advanced",
    "new_slug": "python-advanced",
    "description": "Advanced Python techniques"
  }'

# 2. View progress on cloned path
curl -X GET http://localhost:8000/api/custom-paths/python-advanced/progress/ \
  -H "Authorization: Bearer token"
```

### Use Case 3: Find and Access Shared Paths

```bash
# 1. Get paths shared with me
curl -X GET http://localhost:8000/api/custom-paths/shared_paths/ \
  -H "Authorization: Bearer token"

# 2. View path details
curl -X GET http://localhost:8000/api/custom-paths/path-slug/ \
  -H "Authorization: Bearer token"

# 3. Start learning
curl -X GET http://localhost:8000/api/custom-paths/path-slug/progress/ \
  -H "Authorization: Bearer token"
```

---

## Pagination & Filtering

Currently, all list endpoints return all results. Future enhancements:
- Pagination support
- Filter by visibility
- Filter by created_by
- Sort by created_at, updated_at
- Search by title/description

---

## Rate Limiting

No rate limiting currently applied. Future enhancement:
- 100 requests per minute per user
- 10 paths per day creation limit
- 5 clones per day limit

---

## Testing with Different Tools

### cURL
```bash
curl -X GET http://localhost:8000/api/custom-paths/ \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Python Requests
```python
import requests

headers = {"Authorization": f"Bearer {token}"}
response = requests.get(
    "http://localhost:8000/api/custom-paths/",
    headers=headers
)
print(response.json())
```

### JavaScript/Fetch
```javascript
const headers = {
  "Authorization": `Bearer ${token}`,
  "Content-Type": "application/json"
};

fetch("http://localhost:8000/api/custom-paths/", { headers })
  .then(r => r.json())
  .then(data => console.log(data));
```

---

## Status Codes

- **200 OK** - Successful GET or PATCH
- **201 Created** - Successful POST (creation)
- **204 No Content** - Successful DELETE
- **400 Bad Request** - Invalid input
- **401 Unauthorized** - Missing/invalid token
- **403 Forbidden** - Insufficient permissions
- **404 Not Found** - Resource doesn't exist
- **409 Conflict** - Resource already exists (e.g., duplicate slug)
- **500 Internal Server Error** - Server error

---

**API Version:** 1.0  
**Last Updated:** 2026-06-15  
**Status:** Production Ready
