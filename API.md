# API Documentation

This document provides information about the SocialConnect API endpoints and their usage.

## Base URL
All API endpoints are relative to: `/api`

## Authentication
All authenticated endpoints require a JWT token in the `Authorization` header:
```
Authorization: Bearer <token>
```

## Endpoints

### Authentication

#### POST /auth/register
Register a new user account.

Request body:
```json
{
  "email": "string",
  "password": "string",
  "username": "string"
}
```

Response:
```json
{
  "user": {
    "id": "string",
    "email": "string",
    "username": "string"
  },
  "session": {
    "access_token": "string"
  }
}
```

#### POST /auth/login
Login with email and password.

Request body:
```json
{
  "email": "string",
  "password": "string"
}
```

Response:
```json
{
  "user": {
    "id": "string",
    "email": "string",
    "username": "string"
  },
  "session": {
    "access_token": "string"
  }
}
```

### Users

#### GET /users/me
Get current user's profile.

Response:
```json
{
  "id": "string",
  "username": "string",
  "bio": "string?",
  "avatar_url": "string?",
  "follower_count": "number",
  "following_count": "number",
  "post_count": "number"
}
```

#### GET /users/:username
Get user profile by username.

Response:
```json
{
  "id": "string",
  "username": "string",
  "bio": "string?",
  "avatar_url": "string?",
  "follower_count": "number",
  "following_count": "number",
  "post_count": "number"
}
```

### Posts

#### GET /posts
Get public posts feed.

Query Parameters:
- page (number, default: 1)
- limit (number, default: 20)
- category (string?, options: general|announcement|question)

Response:
```json
{
  "posts": [{
    "id": "string",
    "content": "string",
    "image_url": "string?",
    "category": "string",
    "created_at": "string",
    "author": {
      "id": "string",
      "username": "string",
      "avatar_url": "string?"
    },
    "like_count": "number",
    "comment_count": "number",
    "is_liked_by_user": "boolean?"
  }],
  "hasMore": "boolean",
  "total": "number"
}
```

#### POST /posts
Create a new post.

Request body:
```json
{
  "content": "string",
  "image_url": "string?",
  "category": "string"
}
```

Response:
```json
{
  "id": "string",
  "content": "string",
  "image_url": "string?",
  "category": "string",
  "created_at": "string",
  "author": {
    "id": "string",
    "username": "string",
    "avatar_url": "string?"
  }
}
```

### Social Interactions

#### POST /follow/:userId
Follow a user.

Response: 204 No Content

#### DELETE /follow/:userId
Unfollow a user.

Response: 204 No Content

#### POST /posts/:postId/like
Like a post.

Response: 204 No Content

#### DELETE /posts/:postId/like
Unlike a post.

Response: 204 No Content

#### POST /posts/:postId/comments
Comment on a post.

Request body:
```json
{
  "content": "string"
}
```

Response:
```json
{
  "id": "string",
  "content": "string",
  "created_at": "string",
  "author": {
    "id": "string",
    "username": "string",
    "avatar_url": "string?"
  }
}
```

## Error Handling

All endpoints may return the following error responses:

### 400 Bad Request
Invalid input data
```json
{
  "error": {
    "message": "string",
    "code": "VALIDATION_ERROR"
  }
}
```

### 401 Unauthorized
Missing or invalid authentication
```json
{
  "error": {
    "message": "string",
    "code": "UNAUTHORIZED"
  }
}
```

### 403 Forbidden
Insufficient permissions
```json
{
  "error": {
    "message": "string",
    "code": "FORBIDDEN"
  }
}
```

### 404 Not Found
Resource not found
```json
{
  "error": {
    "message": "string",
    "code": "NOT_FOUND"
  }
}
```

### 429 Too Many Requests
Rate limit exceeded
```json
{
  "error": {
    "message": "string",
    "code": "RATE_LIMIT_EXCEEDED",
    "retryAfter": "number"
  }
}
```
