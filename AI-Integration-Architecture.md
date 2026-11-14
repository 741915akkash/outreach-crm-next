# AI Integration Architecture

**Project:** Outreach CRM
**Status:** Approved Future Architecture — Not in Production v1 Scope
**Version:** 1.0
**Scope:** MCP, agent identities, permissions, event attribution and future webhook integration
**Dependencies:** Application Service Architecture and API Architecture

## 1. Purpose

Establish a secure and extensible architecture for integrating AI assistants, autonomous agents and external automation platforms with the CRM.

Future capabilities:

- AI assistants accessing CRM data.
- MCP clients connecting to CRM capabilities.
- Dedicated agent identities within workspaces.
- Granular agent permissions.
- Human and agent activity attribution.
- Event-driven integrations.
- Outgoing webhooks.
- External workflow automation integration.

These capabilities will be introduced after the core REST API and application service foundation are stable.

## 2. Architectural Principles

1. Reuse existing application services.
2. Give every agent an explicit identity.
3. Enforce workspace isolation.
4. Apply least-privilege permissions.
5. Preserve human and agent attribution.
6. Validate every operation.
7. Support revocable credentials.
8. Keep MCP and integrations as adapters.
9. Implement incrementally.
10. Do not build an entire agent platform inside the CRM.

## 3. Target Architecture

```text
             EXTERNAL CLIENTS
                    |
          +---------+---------+
          |         |         |
         REST      MCP     Webhooks
          |         |         ^
          |         |         |
          v         v         |
       TRANSPORT / INTEGRATION LAYER
          |         |
          |   Agent Authentication
          |   Tool Authorization
          |   Input Validation
          |         |
          +---------+
                |
                v
        EXECUTION CONTEXT
                |
       Actor + Workspace
          + Permissions
                |
                v
       APPLICATION SERVICES
                |
                v
          PostgreSQL
                |
                v
       DOMAIN EVENTS / OUTBOX
                |
                v
       WEBHOOK DISPATCHER
                |
                v
       EXTERNAL SYSTEMS
```

All adapters must use the same application services.

## 4. Actor Identity

Reuse the actor abstraction established by the Application Service Architecture.

```ts
type Actor =
  | { type: 'USER'; id: string }
  | { type: 'AGENT'; id: string }
  | { type: 'INTEGRATION'; id: string }
  | { type: 'SYSTEM'; id: string };
```

| Actor | Represents |
|---|---|
| USER | Human CRM user |
| AGENT | AI agent |
| INTEGRATION | External application |
| SYSTEM | Internal background process |

Agent and integration identities must not impersonate human users.

## 5. Agent Identity Model

An AI agent should have its own identity within a workspace.

Conceptual model:

```ts
type Agent = {
  id: string;
  workspaceId: string;
  name: string;
  description?: string;
  status: 'ACTIVE' | 'DISABLED';
  createdByUserId: string;
};
```

An agent should have:

- Unique agent ID.
- Workspace association.
- Display name and description.
- Creator or owner.
- Active or disabled status.
- Explicit permission grants.
- Secure authentication credentials.
- Creation and last-used timestamps.

Agents must not automatically inherit all permissions of their creators.

Workspace administrators should be able to review, disable and revoke agent access.

## 6. Agent Authentication and Credentials

Agent authentication must be separate from human Better Auth sessions.

Future credential requirements:

- Unique credentials for each agent.
- Secure generation.
- Secure storage of credential hashes or equivalent protected representations.
- Credential revocation and rotation.
- Credential expiration where appropriate.
- Last-used tracking.
- Workspace association.
- No plaintext credential storage.
- No credential exposure after initial creation.

The authentication adapter must validate the agent and construct a trusted execution context.

The exact credential mechanism will be selected when implementation begins.

## 7. Agent Permissions

Agents receive explicitly granted capabilities.

Example permissions:

| Permission | Capability |
|---|---|
| `contacts:read` | Read contacts |
| `contacts:create` | Create contacts |
| `contacts:update` | Update contacts |
| `companies:read` | Read companies |
| `deals:read` | Read deals |
| `deals:create` | Create deals |
| `deals:update` | Update deals |
| `tasks:read` | Read tasks |
| `tasks:create` | Create tasks |
| `tasks:update` | Update tasks |
| `activities:create` | Record activities |

These are examples of a permission naming convention, not an immediate implementation requirement.

## 8. Agent Authorization

An agent operation must satisfy all relevant checks:

1. Agent identity is valid.
2. Agent is active.
3. Agent belongs to the requested workspace.
4. Agent has the required permission.
5. Requested resource belongs to that workspace.
6. Application authorization allows the operation.
7. Business rules are satisfied.

```text
Allowed operation =
    Valid identity
    AND Active agent
    AND Workspace association
    AND Granted permission
    AND Application authorization
    AND Business rules
```

Agent permissions must never bypass workspace-level security.

Workspace administrators should be able to review, update and revoke permissions.

## 9. Human and Agent Attribution

Every operation must identify the actor performing it.

The system should distinguish:

- Actor performing the operation.
- Human who initiated or authorized it, if applicable.

Example:

```ts
type ExecutionContext = {
  actor: Actor;
  workspace: WorkspaceContext;
  requestId: string;
  initiatedByUserId?: string;
};
```

Example attribution:

```json
{
  "actor": {
    "type": "AGENT",
    "id": "agent_123"
  },
  "initiatedByUserId": "user_456",
  "workspaceId": "workspace_789",
  "action": "deal.stage_changed"
}
```

Autonomous operations must not be falsely attributed to a human.

Attribution should eventually appear in audit records and relevant CRM activity history.

## 10. MCP Integration Architecture

MCP should expose selected CRM capabilities to AI clients.

It must remain an adapter, not a separate business logic layer.

```text
          AI CLIENT
              |
              v
          MCP SERVER
              |
       Authentication
              |
       Agent Identity
              |
       Permission Checks
              |
       Execution Context
              |
              v
      APPLICATION SERVICES
              |
              v
          PostgreSQL
```

MCP tools must use the same application services as REST.

## 11. MCP Capabilities

MCP can expose three categories of capabilities.

**Resources — Read-oriented CRM information**

- Contact details.
- Company information.
- Deal details.
- Pipeline information.
- Task lists.

**Tools — Authorized operations**

- Search contacts.
- Create contact.
- Update contact.
- Create deal.
- Move deal to another stage.
- Create task.
- Complete task.
- Record an activity.

**Prompts — Reusable workflow instructions**

- Prepare a deal summary.
- Research a company using CRM information.
- Summarize recent contact activity.
- Prepare a follow-up recommendation.

Start with a small, explicitly authorized set of capabilities. Do not expose every internal service automatically.

## 12. MCP Security and Execution

Every MCP operation must:

- Authenticate the caller.
- Resolve the agent identity.
- Resolve a trusted execution context.
- Validate tool input.
- Check agent permissions.
- Enforce workspace isolation.
- Call application services.
- Return safe, appropriately scoped data.

Tool arguments are not proof of authorization.

MCP must not expose direct database access or internal service credentials.

Long-running operations should be handled asynchronously where appropriate.

Protocol and SDK decisions should be made when implementation begins.

## 13. Sensitive Operations and Human Approval

Some agent operations may require human approval.

Examples:

- Deleting important CRM records.
- Removing workspace members.
- Changing workspace permissions.
- Transferring workspace ownership.
- Performing bulk destructive operations.

Potential flow:

```text
Agent requests operation
        |
        v
Check permissions
        |
        v
Approval required?
        |
     +--+--+
     |     |
    Yes    No
     |     |
     v     v
 Pending  Execute
 Approval
     |
     v
Human reviews
     |
     v
Approve / Reject
     |
     v
Execute authorized operation
```

Do not build a complex approval engine for Production v1.

## 14. Domain Events

Application services should eventually record meaningful business events.

Examples:

```text
contact.created
contact.updated
contact.deleted

company.created
company.updated

deal.created
deal.stage_changed
deal.closed

task.created
task.assigned
task.completed
```

Events describe completed business facts.

Conceptual structure:

```ts
type DomainEvent = {
  id: string;
  type: string;
  workspaceId: string;
  actor: Actor;
  resourceType: string;
  resourceId: string;
  requestId: string;
  occurredAt: Date;
  payload: Record<string, unknown>;
};
```

Keep event payloads minimal and avoid unnecessary sensitive information.

Events should eventually support audit history, webhook delivery and external automation triggers.

## 15. Transactional Outbox

Use a transactional outbox for reliable event delivery.

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
External consumers
```

The CRM change and outbox event must be committed atomically.

A background process should dispatch committed events.

Webhook delivery and other network calls must not happen inside the original database transaction.

## 16. Webhook Integration

Webhooks allow the CRM to notify external systems when relevant events occur.

Examples:

- Contact created.
- Deal stage changed.
- Task completed.
- Company added.

A workspace administrator should eventually be able to configure:

- Webhook name.
- Destination URL.
- Subscribed event types.
- Active or disabled status.
- Signing secret.
- Creation timestamp.

Example:

```json
{
  "url": "https://example.com/webhooks/crm",
  "events": [
    "contact.created",
    "deal.stage_changed"
  ]
}
```

Webhook delivery should support:

- HTTPS destinations.
- HMAC request signing.
- Delivery attempts.
- Retry policies.
- Timeout handling.
- Delivery logs.
- Failure visibility.
- Subscription revocation.

Protect delivery against SSRF and unsafe destination URLs.

## 17. External Workflow Automation

The CRM remains the system of record for CRM data.

Workflow orchestration belongs to an external automation platform.

```text
CRM
 |
 +-- REST API
 |
 +-- MCP
 |
 +-- Outgoing Webhooks
 |
 v
External Automation Platform
 |
 +-- Workflow execution
 +-- Scheduling
 +-- External services
 +-- AI agents
```

The automation platform can call CRM REST APIs or use MCP tools to perform authorized operations.

The CRM does not need to understand how an external workflow is designed or executed.

## 18. Security and Operational Requirements

1. Keep agent credentials separate from human sessions.
2. Support immediate credential revocation.
3. Apply least-privilege permissions.
4. Prevent cross-workspace access.
5. Validate all tool inputs.
6. Log sensitive agent operations.
7. Sign outgoing webhook requests.
8. Protect webhook delivery against SSRF.
9. Avoid exposing secrets in event payloads.
10. Apply rate limits to agent and integration access.
11. Monitor repeated authentication failures.
12. Make failed webhook deliveries visible.

## 19. Implementation Order and Acceptance Criteria

This architecture is for future implementation, after the REST API and application service foundation are stable.

| Order | Work | Priority |
|---|---|---|
| 1 | Finalize actor and execution context contracts | P0 |
| 2 | Design agent identity and workspace association | P1 |
| 3 | Implement agent authentication and credentials | P1 |
| 4 | Implement granular agent permissions | P1 |
| 5 | Add actor attribution to audit records | P1 |
| 6 | Implement MCP read tools | P1 |
| 7 | Implement authorized MCP mutation tools | P1 |
| 8 | Establish domain events and transactional outbox | P1 |
| 9 | Implement webhook subscriptions | P2 |
| 10 | Implement delivery retries and monitoring | P2 |
| 11 | Add approval requirements for sensitive actions | P2 |
| 12 | Integrate external workflow automation | P2 |

The architecture is established when:

- Agents have identities separate from human users.
- Agents belong to workspaces.
- Credentials can be revoked.
- Agent permissions are explicit and enforced.
- Agents use the same application services as human users.
- Operations have reliable actor attribution.
- MCP tools enforce authentication and authorization.
- Workspace isolation is maintained.
- Domain events can be recorded reliably.
- Webhooks are delivered asynchronously and securely.
- External automation can interact through documented interfaces.

**Release boundary:** These capabilities are excluded from Production v1. They will be implemented after the core CRM and REST API are stable.

**Final architectural rule:** AI agents are authorized actors, not privileged administrators. MCP and webhooks are integration interfaces, not shortcuts around the CRM's application services, workspace isolation or business rules.