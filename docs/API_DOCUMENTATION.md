# API Documentation

## Authentication
All API endpoints require authentication via Supabase session. The user ID is automatically extracted from the session.

## Error Response Format

All errors follow this structure:

```json
{
  "error": "Error message",
  "code": 400,
  "validation": [  // Optional, only for validation errors
    {
      "field": "title",
      "message": "Title is required"
    }
  ]
}
```

## HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (authentication required)
- `403` - Forbidden (access denied)
- `404` - Not Found
- `500` - Internal Server Error

---

## Todo Endpoints

### GET /api/todos
Retrieve todos for the authenticated user with optional filtering and sorting.

**Query Parameters:**
- `status` (optional): `completed` | `incomplete` | `all` (default: `all`)
- `priority` (optional): `1` | `2` | `3` | `4`
- `category` (optional): Category UUID
- `sortBy` (optional): `dueDate` | `priority` | `createdAt` | `title` (default: `createdAt`)
- `sortOrder` (optional): `asc` | `desc` (default: `desc`)

**Example Request:**
```
GET /api/todos?status=incomplete&priority=3&sortBy=dueDate&sortOrder=asc
```

**Success Response (200):**
```json
{
  "todos": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "user_id": "660e8400-e29b-41d4-a716-446655440000",
      "title": "Complete project documentation",
      "description": "Write comprehensive API docs",
      "is_completed": false,
      "priority": 3,
      "due_date": "2024-12-31T23:59:59Z",
      "created_at": "2024-01-15T10:30:00Z",
      "updated_at": "2024-01-15T10:30:00Z"
    }
  ],
  "totalCount": 1
}
```

---

### POST /api/todos
Create a new todo item.

**Request Body:**
```json
{
  "title": "Complete project documentation",
  "description": "Write comprehensive API docs",
  "priority": 3,
  "dueDate": "2024-12-31T23:59:59Z",
  "categoryIds": ["770e8400-e29b-41d4-a716-446655440000"]
}
```

**Validation Rules:**
- `title`: Required, 1-200 characters
- `description`: Optional
- `priority`: Optional, values: 1, 2, 3, 4 (default: 2)
- `dueDate`: Optional, ISO 8601 datetime, cannot be in the past
- `categoryIds`: Optional, array of valid UUID strings

**Success Response (201):**
```json
{
  "todo": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "user_id": "660e8400-e29b-41d4-a716-446655440000",
    "title": "Complete project documentation",
    "description": "Write comprehensive API docs",
    "is_completed": false,
    "priority": 3,
    "due_date": "2024-12-31T23:59:59Z",
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T10:30:00Z",
    "categories": [
      {
        "id": "770e8400-e29b-41d4-a716-446655440000",
        "name": "Work",
        "color": "#3B82F6"
      }
    ]
  }
}
```

**Error Response (400):**
```json
{
  "error": "Validation failed",
  "code": 400,
  "validation": [
    {
      "field": "title",
      "message": "Title is required"
    },
    {
      "field": "dueDate",
      "message": "Invalid datetime format"
    }
  ]
}
```

---

### PATCH /api/todos/[id]
Update an existing todo item.

**URL Parameters:**
- `id`: Todo UUID

**Request Body:**
All fields are optional, but at least one must be provided:
```json
{
  "title": "Updated title",
  "description": "Updated description",
  "priority": 4,
  "dueDate": "2024-12-31T23:59:59Z",
  "isCompleted": true,
  "categoryIds": ["770e8400-e29b-41d4-a716-446655440000"]
}
```

**Validation Rules:**
- At least one field must be provided
- `title`: If provided, 1-200 characters
- `priority`: If provided, values: 1, 2, 3, 4
- `dueDate`: Can be null to clear, or valid ISO 8601 datetime
- `isCompleted`: Boolean
- `categoryIds`: Array of valid UUID strings

**Success Response (200):**
```json
{
  "todo": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "user_id": "660e8400-e29b-41d4-a716-446655440000",
    "title": "Updated title",
    "description": "Updated description",
    "is_completed": true,
    "priority": 4,
    "due_date": "2024-12-31T23:59:59Z",
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-20T14:45:00Z",
    "categories": [...]
  }
}
```

**Error Response (404):**
```json
{
  "error": "Todo not found",
  "code": 404
}
```

---

### DELETE /api/todos/[id]
Delete a todo item.

**URL Parameters:**
- `id`: Todo UUID

**Success Response (200):**
```json
{
  "success": true
}
```

**Error Response (404):**
```json
{
  "error": "Todo not found",
  "code": 404
}
```

---

## Category Endpoints

### GET /api/categories
Retrieve all categories for the authenticated user.

**Success Response (200):**
```json
{
  "categories": [
    {
      "id": "770e8400-e29b-41d4-a716-446655440000",
      "user_id": "660e8400-e29b-41d4-a716-446655440000",
      "name": "Work",
      "color": "#3B82F6",
      "created_at": "2024-01-10T08:00:00Z"
    },
    {
      "id": "880e8400-e29b-41d4-a716-446655440000",
      "user_id": "660e8400-e29b-41d4-a716-446655440000",
      "name": "Personal",
      "color": "#10B981",
      "created_at": "2024-01-10T08:05:00Z"
    }
  ],
  "totalCount": 2
}
```

---

### POST /api/categories
Create a new category.

**Request Body:**
```json
{
  "name": "Work",
  "color": "#3B82F6"
}
```

**Validation Rules:**
- `name`: Required, 1-50 characters
- `color`: Optional, valid hex color code (default: #3B82F6)

**Success Response (201):**
```json
{
  "category": {
    "id": "770e8400-e29b-41d4-a716-446655440000",
    "user_id": "660e8400-e29b-41d4-a716-446655440000",
    "name": "Work",
    "color": "#3B82F6",
    "created_at": "2024-01-10T08:00:00Z"
  }
}
```

**Error Response (400):**
```json
{
  "error": "Validation failed",
  "code": 400,
  "validation": [
    {
      "field": "name",
      "message": "Category name is required"
    },
    {
      "field": "color",
      "message": "Color must be a valid hex color code"
    }
  ]
}
```

---

### DELETE /api/categories/[id]
Delete a category. All associated todo-category relationships will be removed.

**URL Parameters:**
- `id`: Category UUID

**Success Response (200):**
```json
{
  "success": true
}
```

**Error Response (404):**
```json
{
  "error": "Category not found",
  "code": 404
}
```

---

## Common Error Scenarios

### 401 Unauthorized
Occurs when user is not authenticated or session has expired.

```json
{
  "error": "No user found in session",
  "code": 401
}
```

### 403 Forbidden
Occurs when user tries to access resources they don't own.

```json
{
  "error": "Access forbidden",
  "code": 403
}
```

### 500 Internal Server Error
Occurs when an unexpected error happens on the server.

```json
{
  "error": "An unexpected error occurred",
  "code": 500
}
```

---

## Notes

- All timestamps are in ISO 8601 format with timezone information
- All IDs are UUIDs
- Date validations prevent setting due dates in the past for new tasks
- Completed tasks can have past due dates when updated
- Category associations are automatically cleaned up when categories are deleted
- User data is completely isolated - users can only access their own todos and categories
