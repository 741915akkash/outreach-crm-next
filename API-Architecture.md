# API Architecture

**Project:** Outreach CRM
**Status:** Approved — Implementation Reference
**Version:** 1.0
**Scope:** REST API conventions and design
**Stack:** Next.js 16 Route Handlers, TypeScript, Zod

## 1. Purpose

Establish a simple, consistent and extensible REST API architecture.

The API should support:

- CRM frontend.
- External applications.
- Postman and developer integrations.
- Future AI assistants and automation platforms.

All API clients must interact with the same application services.

## 2. Architectural Principles

1. REST-oriented resource design.
2. Consistent URL and HTTP conventions.
3. Thin Route Handlers.
4. Secure authentication and workspace resolution.
5. Versioned endpoints.
6. Reusable request and response contracts.
7. Predictable errors.
8. API documentation maintained alongside implementation.
9. No duplicated business logic.

## 3. API Structure

Use versioned REST endpoints:

```text
/api/v1/
```

Initial resource structure:

```text
/api/v1/
├── contacts/
├── companies/
├── pipelines/
├── deals/
├── tasks/
├── activities/
├── workspaces/
├── invitations/
└── workspace-members/
```

Use plural resource names and lowercase kebab-case for multiword names.

Workspace-specific resources should normally derive the workspace from the authenticated request context rather than requiring workspace IDs in every URL.

## 4. HTTP Methods

| Method | Purpose | Example |
|---|---|---|
| GET | Retrieve resources | `GET /contacts` |
| POST | Create resource or perform an operation | `POST /contacts` |
| PATCH | Partially update resource | `PATCH /contacts/123` |
| PUT | Replace resource when full replacement is intended | `PUT /settings` |
| DELETE | Delete resource | `DELETE /contacts/123` |

Prefer PATCH for ordinary updates.

Use POST for explicit business operations that do not naturally represent resource creation.

Examples:

```text
POST /deals/123/move-stage
POST /tasks/123/complete
POST /workspaces/switch
POST /invitations/accept
```

## 5. Request Conventions

Use JSON for request and response bodies.

```http
Content-Type: application/json
Accept: application/json
```

Example:

```http
POST /api/v1/contacts
```

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+91 9876543210",
  "companyId": 42
}
```

Conventions:

- Use camelCase for JSON properties.
- Validate request bodies.
- Validate path parameters.
- Validate query parameters.
- Do not accept trusted execution context or actor permissions from clients.
- Use consistent request schemas.

## 6. Authentication and Workspace Context

Better Auth remains responsible for human authentication.

For protected requests:

1. Resolve the authenticated session.
2. Identify the actor.
3. Resolve the selected workspace.
4. Verify membership.
5. Construct trusted execution context.
6. Invoke the application service.
7. Serialize the result.

Rules:

- Never trust an unverified workspace ID.
- Never trust client-provided role values.
- Never accept execution context directly from request bodies.
- Verify workspace membership on every protected request.
- Public endpoints must explicitly define their authentication requirements.

The CRM frontend can use its existing active-workspace selection mechanism. External clients must have a documented way to select their workspace. The transport adapter is responsible for verifying access regardless of selection method.

## 7. Success Response Conventions

For a single resource:

```json
{
  "data": {
    "id": 123,
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

For a collection:

```json
{
  "data": [
    {
      "id": 123,
      "name": "John Doe"
    },
    {
      "id": 124,
      "name": "Jane Doe"
    }
  ]
}
```

For collections, include pagination metadata where applicable.

For operations without a resource response, return an appropriate success status and a small result where useful.

Use `204 No Content` when the operation succeeds and no response body is needed.

## 8. Error Response Conventions

Use a consistent error structure:

```json
{
  "error": {
    "code": "CONTACT_NOT_FOUND",
    "message": "The requested contact was not found."
  }
}
```

For validation errors:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "The request contains invalid fields.",
    "details": {
      "email": ["Invalid email address."]
    }
  }
}
```

Rules:

- Error codes are stable.
- Messages are safe for clients.
- Validation details identify invalid fields.
- Internal database errors and stack traces are never exposed.
- HTTP status mapping comes from the shared application error structure.

## 9. HTTP Status Codes

| Status | Meaning | Example |
|---|---|---|
| 200 | OK | Resource retrieved or updated |
| 201 | Created | Resource created |
| 204 | No Content | Resource deleted |
| 400 | Bad Request | Invalid request structure |
| 401 | Unauthorized | Missing or invalid authentication |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource does not exist or is inaccessible |
| 409 | Conflict | Duplicate or conflicting operation |
| 422 | Unprocessable Entity | Business rule violation |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Unexpected server failure |

Use these consistently across all resource endpoints.

## 10. Pagination

All collection endpoints that may return large datasets should support pagination.

Use offset-based pagination initially.

```http
GET /api/v1/contacts?page=1&limit=20
```

Response:

```json
{
  "data": [
    {
      "id": 123,
      "name": "John Doe"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 125,
    "totalPages": 7
  }
}
```

Rules:

- Default page: 1.
- Default limit: 20.
- Maximum limit: initially 100.
- Validate page and limit.
- Return consistent metadata.

Cursor-based pagination can be introduced later if performance or dataset size requires it.

## 11. Filtering, Searching and Sorting

Use query parameters for collection filtering.

Examples:

```http
GET /api/v1/contacts?search=john
GET /api/v1/contacts?companyId=42
GET /api/v1/deals?stageId=5
GET /api/v1/tasks?status=OPEN
```

Sorting:

```http
GET /api/v1/contacts?sortBy=createdAt&sortOrder=desc
```

Rules:

- Use consistent query parameter names.
- Validate supported filters.
- Whitelist sortable fields.
- Define filtering behavior per resource.
- Never pass raw query parameters directly into Prisma queries.
- Avoid creating a generic query language prematurely.

## 12. Resource Relationships

Use resource IDs to reference related records.

Example:

```json
{
  "name": "John Doe",
  "companyId": 42
}
```

The server must verify that referenced records belong to the current workspace.

Use nested endpoints when the relationship is useful and the operation belongs to that relationship.

Examples:

```text
GET /api/v1/contacts/123/activities
GET /api/v1/deals/123/tasks
```

Avoid deeply nested URLs.

## 13. Business Operations

Some operations represent business actions rather than ordinary CRUD.

Examples:

```text
POST /api/v1/deals/123/move-stage
POST /api/v1/tasks/123/complete
POST /api/v1/workspaces/switch
POST /api/v1/invitations/accept
```

These endpoints must:

- Have clear business-oriented names.
- Accept only required input.
- Delegate business rules to application services.
- Return predictable results.
- Enforce authorization and workspace integrity.

Do not implement business logic directly inside Route Handlers.

## 14. Idempotency and Retries

HTTP methods should follow their normal idempotency expectations.

For operations where retries could create duplicate effects, consider supporting an `Idempotency-Key` header.

Example:

```http
POST /api/v1/contacts
Idempotency-Key: unique-request-key
```

Do not build full idempotency infrastructure immediately. Introduce it when external integrations or unreliable network retries create a concrete need.

## 15. API Versioning

Use URL-based versioning:

```text
/api/v1/contacts
```

Rules:

- New endpoints belong to the current API version.
- Backward-compatible additions do not require a new version.
- Breaking contract changes require a new version.
- Existing clients must not be silently broken.
- Maintain older versions only when there is a real need.

Different API versions should reuse the same application services wherever possible.

## 16. API Documentation

Use OpenAPI as the API documentation standard.

Documentation should describe:

- Endpoint and HTTP method.
- Authentication requirements.
- Request parameters and schemas.
- Response schemas.
- Error responses.
- Pagination and filtering behavior.
- Authorization requirements.

**Documentation must be created and updated as each module's API is implemented.**

| Module | Documentation work |
|---|---|
| API foundation | Shared conventions and schemas |
| Contacts | Contact endpoints and contracts |
| Companies | Company endpoints and contracts |
| Pipelines | Pipeline and stage endpoints |
| Deals | Deal operations and transitions |
| Tasks | Task endpoints and assignment |
| Activities | Activity endpoints and types |
| Workspaces | Workspace and invitation endpoints |

Do not postpone all API documentation until production release.

## 17. Route Handler Conventions

Route Handlers are thin transport adapters.

Example:

```ts
export async function POST(request: Request) {
  // 1. Resolve authenticated actor and workspace context.
  // 2. Validate request body.
  // 3. Call application service.
  // 4. Map errors and return HTTP response.
}
```

Responsibilities:

- HTTP request parsing.
- Authentication and context resolution.
- Request validation.
- Calling application services.
- Mapping application errors to HTTP responses.
- Response serialization.

Not responsibilities:

- Business rules.
- Complex database operations.
- Direct Prisma mutations for business workflows.
- Duplicated authorization logic.
- Cross-resource transaction orchestration.

Use Route Handlers for frontend mutations and interactions. Do not use Server Actions.

## 18. Security and Testing

Security requirements:

- Authenticate protected requests.
- Verify workspace membership.
- Enforce permissions inside application services.
- Validate all request input.
- Prevent cross-workspace access.
- Apply rate limits to sensitive or abuse-prone endpoints.
- Never expose internal errors or secrets.
- Use appropriate secure cookie and session settings.

Testing requirements:

- Request validation.
- Authentication failures.
- Permission failures.
- Cross-workspace access.
- Successful resource operations.
- Error response consistency.
- Pagination and filtering.
- Business operation behavior.

Use Vitest for service/API testing and end-to-end tests for critical workflows.

## 19. Implementation Order and Acceptance Criteria

| Order | Work | Priority |
|---|---|---|
| 1 | Establish `/api/v1` structure | P0 |
| 2 | Standardize success and error responses | P0 |
| 3 | Establish request validation conventions | P0 |
| 4 | Establish authentication and workspace resolution | P0 |
| 5 | Establish application error mapping | P0 |
| 6 | Standardize pagination | P0 |
| 7 | Standardize filtering and sorting | P0 |
| 8 | Document each module using OpenAPI as it is built | P0 |
| 9 | Introduce idempotency where needed | P2 |
| 10 | Introduce cursor pagination if required | P2 |

The API architecture is established when:

- Endpoints follow consistent resource and HTTP conventions.
- APIs use `/api/v1`.
- Protected requests resolve trusted identity and workspace context.
- Route Handlers delegate business logic to application services.
- Requests are validated using Zod.
- Responses and errors follow consistent structures.
- Collection endpoints use standardized pagination.
- Filtering and sorting are validated.
- Cross-workspace access is prevented.
- API contracts are reusable by frontend and external clients.
- OpenAPI documentation is maintained with implementation.

**Final architectural rule:** The REST API is a transport interface to the CRM application services. It exposes predictable HTTP contracts without duplicating business logic or becoming coupled to the frontend.
