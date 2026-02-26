# Task SaaS API - cURL Commands

## Base Configuration

```bash
# Base URL
BASE_URL="http://localhost:3000"

# Store your access token after login
ACCESS_TOKEN="your_access_token_here"
```

---

## Health Check

### GET /health
Check if the API is running.

```bash
curl -X GET "$BASE_URL/health"
```

---

## Authentication

### POST /api/v1/auth/register
Register a new user and organization.

```bash
curl -X POST "$BASE_URL/api/v1/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "Password123",
    "firstName": "John",
    "lastName": "Doe",
    "orgName": "My Organization"
  }'
```

### POST /api/v1/auth/login
Authenticate user and get tokens.

```bash
curl -X POST "$BASE_URL/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "Password123",
    "tenantSlug": "my-organization"
  }'
```

### POST /api/v1/auth/refresh
Refresh expired access token.

```bash
curl -X POST "$BASE_URL/api/v1/auth/refresh" \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "your_refresh_token_here"
  }'
```

### POST /api/v1/auth/logout
Logout and invalidate tokens. **Requires authentication.**

```bash
curl -X POST "$BASE_URL/api/v1/auth/logout" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

### GET /api/v1/auth/me
Get current authenticated user info. **Requires authentication.**

```bash
curl -X GET "$BASE_URL/api/v1/auth/me" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

---

## Users

### GET /api/v1/users/me
Get current user's full profile. **Requires authentication.**

```bash
curl -X GET "$BASE_URL/api/v1/users/me" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

### PATCH /api/v1/users/me
Update current user's profile. **Requires authentication.**

```bash
curl -X PATCH "$BASE_URL/api/v1/users/me" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Jane",
    "lastName": "Smith"
  }'
```

### POST /api/v1/users/me/change-password
Change current user's password. **Requires authentication.**

```bash
curl -X POST "$BASE_URL/api/v1/users/me/change-password" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "currentPassword": "OldPassword123",
    "newPassword": "NewPassword456"
  }'
```

### GET /api/v1/users
List all users in current tenant. **Requires authentication.**

```bash
# List all users
curl -X GET "$BASE_URL/api/v1/users" \
  -H "Authorization: Bearer $ACCESS_TOKEN"

# Filter by role
curl -X GET "$BASE_URL/api/v1/users?role=admin" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

### GET /api/v1/users/:id
Get specific user by ID. **Requires authentication.**

```bash
curl -X GET "$BASE_URL/api/v1/users/USER_ID_HERE" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

### PATCH /api/v1/users/:id/role
Update user's role. **Requires authentication (owner/admin).**

```bash
curl -X PATCH "$BASE_URL/api/v1/users/USER_ID_HERE/role" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "role": "admin"
  }'
```

**Available roles:** `admin`, `member`, `viewer`

### DELETE /api/v1/users/:id
Deactivate a user (soft delete). **Requires authentication (owner/admin).**

```bash
curl -X DELETE "$BASE_URL/api/v1/users/USER_ID_HERE" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

---

## Tenants (Organizations)

### GET /api/v1/tenants/me
Get current organization details. **Requires authentication.**

```bash
curl -X GET "$BASE_URL/api/v1/tenants/me" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

### PATCH /api/v1/tenants/me/settings
Update organization settings. **Requires authentication (owner/admin).**

```bash
curl -X PATCH "$BASE_URL/api/v1/tenants/me/settings" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "maxUsers": 50,
    "maxProjects": 100,
    "allowedPlugins": ["plugin1", "plugin2"]
  }'
```

### GET /api/v1/tenants/me/members
Get all members in current organization. **Requires authentication.**

```bash
curl -X GET "$BASE_URL/api/v1/tenants/me/members" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

### PATCH /api/v1/tenants/me/members/:userId/role
Update organization member's role. **Requires authentication (owner/admin).**

```bash
curl -X PATCH "$BASE_URL/api/v1/tenants/me/members/USER_ID_HERE/role" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "role": "member"
  }'
```

### DELETE /api/v1/tenants/me/members/:userId
Remove member from organization. **Requires authentication (owner/admin).**

```bash
curl -X DELETE "$BASE_URL/api/v1/tenants/me/members/USER_ID_HERE" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

---

## Projects

### GET /api/v1/projects
List all projects in tenant. **Requires authentication.**

```bash
# List active projects
curl -X GET "$BASE_URL/api/v1/projects" \
  -H "Authorization: Bearer $ACCESS_TOKEN"

# Include archived projects
curl -X GET "$BASE_URL/api/v1/projects?includeArchived=true" \
  -H "Authorization: Bearer $ACCESS_TOKEN"

# With pagination
curl -X GET "$BASE_URL/api/v1/projects?limit=20&cursor=CURSOR_VALUE" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

### GET /api/v1/projects/:id
Get specific project by ID. **Requires authentication.**

```bash
curl -X GET "$BASE_URL/api/v1/projects/PROJECT_ID_HERE" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

### POST /api/v1/projects
Create a new project. **Requires authentication.**

```bash
curl -X POST "$BASE_URL/api/v1/projects" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My New Project",
    "description": "Project description goes here",
    "color": "#3498db"
  }'
```

### PATCH /api/v1/projects/:id
Update project details. **Requires authentication.**

```bash
curl -X PATCH "$BASE_URL/api/v1/projects/PROJECT_ID_HERE" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Project Name",
    "description": "Updated description",
    "isArchived": false,
    "color": "#e74c3c"
  }'
```

### DELETE /api/v1/projects/:id
Delete a project. **Requires authentication (owner/admin).**

```bash
curl -X DELETE "$BASE_URL/api/v1/projects/PROJECT_ID_HERE" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

---

## Tasks

### GET /api/v1/tasks
List tasks with optional filters. **Requires authentication.**

```bash
# List all tasks
curl -X GET "$BASE_URL/api/v1/tasks" \
  -H "Authorization: Bearer $ACCESS_TOKEN"

# Filter by project
curl -X GET "$BASE_URL/api/v1/tasks?projectId=PROJECT_ID_HERE" \
  -H "Authorization: Bearer $ACCESS_TOKEN"

# Filter by assignee
curl -X GET "$BASE_URL/api/v1/tasks?assigneeId=USER_ID_HERE" \
  -H "Authorization: Bearer $ACCESS_TOKEN"

# Filter by status
curl -X GET "$BASE_URL/api/v1/tasks?status=in_progress" \
  -H "Authorization: Bearer $ACCESS_TOKEN"

# Filter by priority
curl -X GET "$BASE_URL/api/v1/tasks?priority=high" \
  -H "Authorization: Bearer $ACCESS_TOKEN"

# Multiple filters with pagination
curl -X GET "$BASE_URL/api/v1/tasks?projectId=PROJECT_ID&status=todo&priority=urgent&limit=50" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

**Available statuses:** `todo`, `in_progress`, `review`, `done`, `cancelled`
**Available priorities:** `low`, `medium`, `high`, `urgent`

### GET /api/v1/tasks/:id
Get specific task by ID. **Requires authentication.**

```bash
curl -X GET "$BASE_URL/api/v1/tasks/TASK_ID_HERE" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

### POST /api/v1/tasks
Create a new task. **Requires authentication.**

```bash
curl -X POST "$BASE_URL/api/v1/tasks" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Implement new feature",
    "description": "Detailed description of the task",
    "projectId": "PROJECT_ID_HERE",
    "assigneeId": "USER_ID_HERE",
    "priority": "high",
    "dueDate": "2025-12-31T23:59:59Z",
    "tags": ["frontend", "urgent"]
  }'
```

### PATCH /api/v1/tasks/:id
Update task details. **Requires authentication.**

```bash
curl -X PATCH "$BASE_URL/api/v1/tasks/TASK_ID_HERE" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Updated task title",
    "description": "Updated description",
    "assigneeId": "NEW_USER_ID",
    "status": "in_progress",
    "priority": "urgent",
    "dueDate": "2025-11-30T23:59:59Z",
    "tags": ["backend", "critical"]
  }'
```

### DELETE /api/v1/tasks/:id
Delete a task. **Requires authentication.**

```bash
curl -X DELETE "$BASE_URL/api/v1/tasks/TASK_ID_HERE" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

---

## Response Format

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "message": "Optional message"
}
```

### Error Response
```json
{
  "success": false,
  "code": "ERROR_CODE",
  "message": "Human readable error message"
}
```

---

## Quick Start Example

```bash
# 1. Set base URL
BASE_URL="http://localhost:3000"

# 2. Register a new user
curl -X POST "$BASE_URL/api/v1/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "demo@example.com",
    "password": "Demo1234",
    "firstName": "Demo",
    "lastName": "User",
    "orgName": "Demo Organization"
  }'

# 3. Login and save the access token
RESPONSE=$(curl -s -X POST "$BASE_URL/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "demo@example.com",
    "password": "Demo1234",
    "tenantSlug": "demo-organization"
  }')

ACCESS_TOKEN=$(echo $RESPONSE | jq -r '.data.accessToken')

# 4. Create a project
curl -X POST "$BASE_URL/api/v1/projects" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My First Project",
    "description": "Getting started with Task SaaS"
  }'

# 5. Create a task
curl -X POST "$BASE_URL/api/v1/tasks" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "My First Task",
    "projectId": "PROJECT_ID_FROM_STEP_4",
    "priority": "medium"
  }'
```
