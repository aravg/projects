# EKBMS API Documentation

## Base URL
```
http://localhost:3001/api
```

## Authentication
Most endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

## Response Format
All responses follow this format:
```json
{
  "success": true,
  "data": { ... },
  "message": "Optional message"
}
```

Error responses:
```json
{
  "success": false,
  "message": "Error description"
}
```

---

## Auth Endpoints

### POST /auth/register
Register a new user (default role: employee)

**Body:**
```json
{
  "name": "John Doe",
  "email": "john@company.com",
  "password": "securepass",
  "department": "Engineering"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": { "id": "uuid", "name": "John Doe", "email": "...", "role": "employee" },
    "token": "jwt.token.here"
  },
  "message": "Registration successful"
}
```

### POST /auth/login
Login with email and password

**Body:**
```json
{ "email": "admin@ekbms.com", "password": "admin123" }
```

### GET /auth/me
Get current authenticated user (requires auth)

### PUT /auth/profile
Update profile (requires auth)
```json
{ "name": "New Name", "department": "HR" }
```

### PUT /auth/change-password
Change password (requires auth)
```json
{ "currentPassword": "old", "newPassword": "new123" }
```

---

## Articles Endpoints

### GET /articles
List articles with filtering and pagination

**Query Parameters:**
- `status` - Filter by status (approved/draft/pending_approval/rejected/archived)
- `category` - Filter by category ID
- `author` - Filter by author ID
- `sort` - Sort by (created_at/popular)
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10)
- `featured` - Show only featured (true)

### POST /articles
Create article (requires auth, role: author/admin)
```json
{
  "title": "Article Title",
  "content": "Article content...",
  "summary": "Brief summary",
  "category_id": "uuid",
  "tags": ["tag-uuid-1", "tag-uuid-2"],
  "is_featured": false
}
```

### GET /articles/:id
Get single article (increments view count)

### PUT /articles/:id
Update article (requires auth, owner or admin)

### DELETE /articles/:id
Delete article (requires auth, owner or admin)

### POST /articles/:id/submit
Submit article for approval (status: draft/rejected → pending_approval)

### POST /articles/:id/bookmark
Toggle bookmark for current user

### GET /articles/:id/bookmarks
Get bookmark status for current user

### POST /articles/:id/rate
Rate an article (1-5)
```json
{ "rating": 4 }
```

### GET /articles/:id/ratings
Get article ratings summary

---

## Categories Endpoints

### GET /categories
List all categories with article count

### POST /categories
Create category (requires admin)
```json
{
  "name": "New Category",
  "description": "Description",
  "color": "#6366f1",
  "icon": "Folder"
}
```

### PUT /categories/:id
Update category (requires admin)

### DELETE /categories/:id
Delete category (requires admin)

---

## Tags Endpoints

### GET /tags
List all tags with article count

### POST /tags
Create tag (requires auth)
```json
{ "name": "tagname" }
```

### DELETE /tags/:id
Delete tag (requires admin)

---

## Search Endpoint

### GET /search
Full-text search across articles

**Query Parameters:**
- `q` - Search query
- `category` - Filter by category ID
- `tag` - Filter by tag name
- `author` - Filter by author ID
- `sort` - Sort by (relevance/popular/rating/oldest)
- `page`, `limit` - Pagination

---

## Comments Endpoints

### GET /comments/:articleId
Get all comments for an article

### POST /comments/:articleId
Add comment (requires auth)
```json
{ "content": "Comment text" }
```

### DELETE /comments/:id
Delete comment (own or admin)

---

## Files Endpoints

### POST /files/upload/:articleId
Upload file attachment (requires auth, article owner/admin)
- Content-Type: multipart/form-data
- Field: `file`
- Max size: 10MB
- Allowed: PDF, DOC, DOCX, PPT, PPTX, XLS, XLSX, PNG, JPG, JPEG

### GET /files/:articleId
List attachments for an article

### DELETE /files/:id
Delete attachment (requires auth, owner/admin)

---

## Approvals Endpoints

### GET /approvals/pending
Get all pending articles (requires reviewer/admin)

### POST /approvals/:articleId/approve
Approve an article (requires reviewer/admin)
```json
{ "comments": "Optional reviewer comments" }
```

### POST /approvals/:articleId/reject
Reject an article (requires reviewer/admin)
```json
{ "reason": "Rejection reason (required)" }
```

### GET /approvals/history
Get approval history (requires reviewer/admin)

---

## Users Endpoints (Admin Only)

### GET /users
List all users
**Query:** `search`, `role`

### PUT /users/:id/role
Update user role
```json
{ "role": "author" }
```
Valid roles: admin, author, reviewer, employee

### PUT /users/:id/status
Toggle user active/inactive status

### DELETE /users/:id
Delete a user

---

## Analytics Endpoints

### GET /analytics/dashboard
Dashboard statistics (requires auth)
Returns: stats, mostViewedArticles, recentArticles, categoryDistribution, articlesByStatus

### GET /analytics/search-trends
Top search queries (requires admin)

### GET /analytics/user-activity
User activity data (requires admin)

### GET /analytics/popular-categories
Categories by article count and views (requires auth)

---

## Notifications Endpoints

### GET /notifications
Get user's notifications (requires auth)
Returns: notifications[], unreadCount

### PUT /notifications/:id/read
Mark notification as read

### PUT /notifications/read-all
Mark all notifications as read

---

## Status Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 409 | Conflict |
| 500 | Internal Server Error |

---

## User Roles & Permissions

| Endpoint | employee | author | reviewer | admin |
|----------|----------|--------|----------|-------|
| View approved articles | ✓ | ✓ | ✓ | ✓ |
| Create articles | ✗ | ✓ | ✗ | ✓ |
| View own articles | ✗ | ✓ | ✗ | ✓ |
| Submit for approval | ✗ | ✓ | ✗ | ✓ |
| Approve/Reject | ✗ | ✗ | ✓ | ✓ |
| Manage users | ✗ | ✗ | ✗ | ✓ |
| Manage categories | ✗ | ✗ | ✗ | ✓ |
| Analytics | ✗ | ✗ | ✗ | ✓ |
| Comment/Bookmark/Rate | ✓ | ✓ | ✓ | ✓ |
