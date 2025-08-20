# Error Handling Guide

## Error Codes

### Authentication Errors
- `UNAUTHORIZED` - User is not authenticated
- `INVALID_CREDENTIALS` - Invalid email or password
- `EMAIL_NOT_VERIFIED` - User's email is not verified
- `SESSION_EXPIRED` - Authentication session has expired

### Validation Errors
- `VALIDATION_ERROR` - Invalid input data
- `INVALID_FILE_TYPE` - Unsupported file type
- `FILE_TOO_LARGE` - File size exceeds limit
- `CONTENT_TOO_LONG` - Content exceeds maximum length
- `INVALID_USERNAME` - Username format is invalid

### Permission Errors
- `FORBIDDEN` - User lacks required permissions
- `PRIVATE_PROFILE` - Profile is set to private
- `NOT_AUTHORIZED` - User not authorized for this action

### Resource Errors
- `NOT_FOUND` - Resource not found
- `ALREADY_EXISTS` - Resource already exists
- `ALREADY_FOLLOWING` - Already following this user
- `ALREADY_LIKED` - Already liked this post

### Rate Limiting
- `RATE_LIMIT_EXCEEDED` - Too many requests

## Error Response Format
```typescript
interface ErrorResponse {
  error: {
    message: string;
    code: string;
    details?: any;
  }
}
```

## Common Error Scenarios

### Authentication Failed
```json
{
  "error": {
    "message": "Invalid email or password",
    "code": "INVALID_CREDENTIALS"
  }
}
```

### Validation Failed
```json
{
  "error": {
    "message": "Invalid input data",
    "code": "VALIDATION_ERROR",
    "details": {
      "username": ["Username must be between 3 and 20 characters"]
    }
  }
}
```

### Resource Not Found
```json
{
  "error": {
    "message": "Post not found",
    "code": "NOT_FOUND"
  }
}
```

## Error Recovery Strategies

### Client-Side Handling
1. Display user-friendly error messages
2. Provide clear action items for recovery
3. Implement automatic retry for network errors
4. Handle form validation errors inline

### Server-Side Handling
1. Log errors with proper context
2. Return appropriate HTTP status codes
3. Include helpful error messages
4. Maintain audit trail for critical errors

## Troubleshooting Common Issues

### Authentication Issues
1. Check if email is verified
2. Verify token expiration
3. Ensure proper headers are sent
4. Check for CORS issues

### Data Validation Issues
1. Verify input format
2. Check length restrictions
3. Validate file types and sizes
4. Ensure required fields are provided

### Permission Issues
1. Verify user role
2. Check profile visibility settings
3. Validate user relationships
4. Ensure proper authorization
