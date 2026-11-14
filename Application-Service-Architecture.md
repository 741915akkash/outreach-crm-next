# Application Service Architecture

**Project:** Outreach CRM
**Status:** Approved — Implementation Reference
**Version:** 1.0
**Stack:** Next.js 16, TypeScript, Better Auth, Prisma 7, PostgreSQL, Zod

## 1. Purpose

Establish a reusable application service architecture that supports:

- Human users through the CRM interface.
- External applications through REST APIs.
- Future AI assistants through MCP.
- External workflow automation platforms.
- Future agent and integration identities.

All clients must use the same business rules, validation, authorization and data integrity mechanisms.

The CRM remains the system of record. Workflow orchestration belongs to external automation platforms.

## 2. Architectural Principles

1. Single business logic layer.
2. Transport independence.
3. Workspace-first security.
4. Explicit actor identity.
5. Centralized authorization.
6. Explicit validation.
7. Transaction integrity.
8. Predictable errors.
9. Auditability.
10. Incremental extensibility.

Avoid unnecessary abstractions and implement the architecture incrementally.

## 3. Target Architecture

```text
                 CLIENTS
                    |
        +-----------+-----------+
        |           |           |
       UI          REST        MCP
        |           |           |
        +-----------+-----------+
                    |
             TRANSPORT LAYER
                    |
        Authentication / Identity
        Workspace Context Resolution
        Input Validation
        Authorization
        Response Serialization
                    |
                    v
          APPLICATION SERVICES
                    |
        Business Rules / Use Cases
        Relationship Validation
        Transactions
        Event Recording
                    |
                    v
              DATA ACCESS
                    |
               Prisma Client
                    |
                 PostgreSQL
```

Application services are the central business logic layer.

Transport adapters translate requests into service inputs and service results into protocol-specific responses.

## 4. Project Structure

Keep the existing root-level `server/` directory.

```text
src/
└── app/
    └── api/
        └── v1/
            ├── leads/
            ├── companies/
            ├── deals/
            ├── tasks/
            ├── activities/
            └── workspaces/

server/
├── auth/
├── db/
├── context/
│   ├── actor.ts
│   ├── workspace-context.ts
│   └── execution-context.ts
├── errors/
├── authorization/
├── services/
│   ├── workspace/
│   ├── lead/
│   ├── company/
│   ├── pipeline/
│   ├── deal/
│   ├── task/
│   └── activity/
├── events/
├── audit/
└── integrations/

src/lib/
└── validations/
```

Avoid creating a repository abstraction for every Prisma model. Use Prisma directly in application services and extract query helpers when complexity justifies them.

## 5. Actor Identity

Every operation must identify the actor responsible for it.

```ts
type Actor =
  | { type: 'USER'; id: string }
  | { type: 'AGENT'; id: string }
  | { type: 'INTEGRATION'; id: string }
  | { type: 'SYSTEM'; id: string };
```

Actor types:

| Actor | Represents |
|---|---|
| USER | Human CRM user |
| AGENT | AI agent |
| INTEGRATION | External application |
| SYSTEM | Internal background process |

Initially, implement USER actors only. Other types establish future extensibility, not an immediate requirement to build agent authentication.

## 6. Workspace Context

Every tenant-owned operation must execute within a verified workspace.

```ts
type WorkspaceContext = {
  workspaceId: string;
  role: 'OWNER' | 'ADMIN' | 'MEMBER';
};
```

Rules:

- Every protected operation must have a workspace context.
- Membership must be verified server-side.
- The workspace role must come from trusted database state.
- Client-provided roles must never be trusted.
- Resource queries must be scoped to the current workspace.

## 7. Execution Context

Every application service receives an explicit execution context.

```ts
type ExecutionContext = {
  actor: Actor;
  workspace: WorkspaceContext;
  requestId: string;
  initiatedByUserId?: string;
};
```

The initiating user is optional and should only be populated when a real human initiated or authorized the operation.

Example:

```ts
await createlead(context, input);
```

The context must be constructed by trusted server-side infrastructure. Never accept a complete execution context directly from an HTTP request or AI tool payload.

## 8. Authentication and Context Resolution

Authentication and workspace resolution belong to the transport/infrastructure boundary.

```text
Incoming Request
      |
      v
Resolve Better Auth session
      |
      v
Identify actor
      |
      v
Resolve requested workspace
      |
      v
Verify membership
      |
      v
Construct ExecutionContext
      |
      v
Invoke Application Service
```

Rules:

- Better Auth handles human authentication.
- Session resolution occurs at the transport boundary.
- Workspace membership is checked on every protected request.
- Active workspace cookies or client-selected workspace IDs are selection hints, not proof of authorization.
- Services must not call Next.js `headers()` or `cookies()`.

## 9. Authorization

Authorization must be enforced centrally and within application services.

Initial workspace-level permissions:

| Permission | Owner | Admin | Member |
|---|---|---|---|
| Read CRM records | Yes | Yes | Yes |
| Create records | Yes | Yes | Yes |
| Update records | Yes | Yes | Yes |
| Delete records | Yes | Yes | No |
| Invite members | Yes | Yes | No |
| Remove members | Yes | Yes | No |
| Change member roles | Yes | Yes | No |
| Transfer ownership | Yes | No | No |
| Delete workspace | Yes | No | No |

Additional lifecycle rules:

- Every workspace must have at least one Owner.
- The last Owner cannot be removed or demoted.
- Ownership transfer requires acceptance.
- Workspace deletion is Owner-only.
- Creating a workspace follows the agreed creator-role inheritance rule: an Owner becomes Owner; an Admin becomes Admin.

These permissions must be verified against the accepted workspace lifecycle rules during implementation.

Future agent permissions must be restricted by both workspace permissions and explicitly granted agent scopes.

## 10. Application Service Contracts

Each service represents a business operation, not a database operation.

Example:

```ts
type CreateleadInput = {
  name: string;
  email?: string;
  phone?: string;
  companyId?: number;
};

export async function createlead(
  context: ExecutionContext,
  input: CreateleadInput
) {
  // Business operation
}
```

A service should:

1. Validate business invariants.
2. Verify permissions.
3. Verify referenced records belong to the workspace.
4. Execute database operations.
5. Record relevant audit information.
6. Return a predictable result.

Prefer business-oriented names such as `createlead`, `moveDealToStage`, `completeTask` and `assignTask`.

Services must not return HTTP responses.

## 11. Validation

Use Zod for external input validation.

Validation occurs at two levels:

**Transport validation**
- Request body structure.
- Query parameters.
- Path parameters.
- Required fields and data formats.

**Business validation**
- Duplicate resource rules.
- Valid deal stage transitions.
- Workspace relationship ownership.
- Task assignment eligibility.
- Workspace lifecycle restrictions.

Example:

```ts
const createleadSchema = z.object({
  name: z.string().trim().min(1).max(200),
  email: z.email().optional(),
  phone: z.string().max(50).optional(),
  companyId: z.number().int().positive().optional(),
});
```

Do not rely exclusively on frontend validation.

## 12. Database Transactions

Transactions belong to application services.

A business operation involving multiple related mutations must use a database transaction.

```ts
return prisma.$transaction(async (tx) => {
  const lead = await tx.lead.create({
    data: {
      workspaceId: context.workspace.workspaceId,
      name: input.name,
    },
  });

  return lead;
});
```

Rules:

- Never expose partially completed business operations.
- Validate critical relationships before committing.
- Use conditional updates for concurrency-sensitive operations.
- Keep transactions short.
- Avoid external network calls inside transactions.
- Use appropriate isolation or locking where necessary.

Future event records must be committed atomically with the corresponding CRM changes.

## 13. Workspace Data Integrity

Every tenant-owned record belongs to exactly one workspace.

Examples:

- A lead cannot reference another workspace's company.
- A deal cannot reference another workspace's company.
- A deal's pipeline and stage must belong to the same workspace and pipeline.
- A task cannot reference another workspace's lead or deal.
- A task assignee must be a member of the relevant workspace.
- Related activities must belong to the same workspace as their parent records.

Use two levels of protection:

1. Application-level workspace-scoped queries and relationship validation.
2. Database-level foreign keys and composite constraints wherever practical.

The existing Prisma schema must be reviewed for cross-workspace integrity before dependent modules are implemented.

## 14. Error Handling

Introduce a shared application error structure.

```ts
export class AppError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = 'AppError';
  }
}
```

Suggested error categories:

| Error | HTTP status |
|---|---:|
| Validation error | 400 |
| Authentication required | 401 |
| Permission denied | 403 |
| Resource not found | 404 |
| Duplicate resource | 409 |
| Invalid business operation | 422 |
| Rate limited | 429 |
| Unexpected error | 500 |

Rules:

- Never expose database internals.
- Never return raw Prisma errors.
- Use stable error codes.
- Log unexpected failures with request identifiers.
- Keep HTTP response formatting outside application services.

## 15. Audit and Actor Attribution

Important business operations should be attributable to their initiating actor.

Future audit records should capture:

- Actor type and ID.
- Initiating human user, where applicable.
- Workspace ID.
- Action.
- Resource type and ID.
- Timestamp.
- Request or correlation ID.

Example:

```json
{
  "actorType": "AGENT",
  "actorId": "agent_123",
  "initiatedByUserId": "user_456",
  "workspaceId": "workspace_789",
  "action": "deal.stage_changed",
  "resourceType": "deal",
  "resourceId": "deal_321"
}
```

Establish the attribution contract first. Implement full audit infrastructure incrementally.

## 16. Domain Events and Future Integrations

Application services should eventually record meaningful domain events.

Examples:

- `lead.created`
- `lead.updated`
- `company.created`
- `deal.created`
- `deal.stage_changed`
- `task.created`
- `task.completed`

Events describe business facts, not direct webhook calls.

Future architecture:

```text
Application Service
       |
       v
Database Transaction
       |
       +---- CRM mutation
       |
       +---- Outbox event
       |
       v
Commit
       |
       v
Background Dispatcher
       |
       v
External integrations
```

Use a transactional outbox when event delivery is implemented. The CRM must not execute external automation workflows itself.

## 17. Testing Strategy

Every application service should have tests for:

- Successful operation.
- Invalid input.
- Missing authentication.
- Missing workspace membership.
- Insufficient permissions.
- Cross-workspace access.
- Invalid relationships.
- Duplicate records.
- Transaction rollback.
- Concurrency-sensitive operations where applicable.

Prioritize PostgreSQL integration tests for tenant isolation and database constraints. Use Vitest.

## 18. Implementation Conventions

1. Use TypeScript.
2. Use `server-only` for server-side modules.
3. Keep application services independent of Next.js APIs.
4. Use the centralized Prisma client.
5. Use Zod for validation.
6. Pass explicit execution context to services.
7. Use workspace-scoped queries.
8. Keep HTTP response mapping in Route Handlers.
9. Do not use Server Actions for frontend-to-backend mutations.
10. Avoid duplicated business logic.
11. Prefer small, independently testable services.
12. Avoid premature abstractions.
13. Refactor existing code incrementally and preserve working behavior.

## 19. Implementation Order and Acceptance Criteria

| Order | Work | Priority |
|---|---|---|
| 1 | Define execution context types | P0 |
| 2 | Define shared application errors | P0 |
| 3 | Establish trusted context resolution | P0 |
| 4 | Refactor workspace services incrementally | P0 |
| 5 | Standardize service contracts | P0 |
| 6 | Establish authorization helpers | P0 |
| 7 | Review tenant relationship integrity | P0 |
| 8 | Add integration tests | P0 |
| 9 | Implement CRM module services | P0 |
| 10 | Establish audit and event contracts | P1 |

The architecture is established when:

- Services do not depend on Next.js request context.
- Execution context is explicit and trusted.
- Workspace membership is verified server-side.
- Authorization is centralized.
- Cross-workspace access is prevented.
- Errors use stable application codes.
- Multi-step operations use transactions.
- Route Handlers contain transport logic rather than business logic.
- Services can be called by different adapters.
- Critical operations have automated tests.

**Final architectural rule:** The CRM has one source of truth for business logic. UI, REST, MCP and future integrations are different ways of accessing that same business logic.
