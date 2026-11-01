# ADR-001: Outreach CRM Foundation

- **Status:** Accepted for initial implementation
- **Date:** 2026-10-28

## Context

Outreach CRM is an open-source, self-hosted CRM for small teams, startups, and agencies. It must support multiple workspaces, human users, and future external AI-agent integrations while remaining secure and straightforward to deploy.

## Decisions

### Architecture
- Use Next.js App Router, React, strict TypeScript, Tailwind CSS, PostgreSQL, Prisma 7, Zod, and Vitest.
- Use a modular monolith.
- Keep HTTP route handlers under `src/app/api/`.
- Keep reusable business services under root-level `server/`.
- REST and future MCP interfaces must use the same business services.

### Tenancy
- One installation can contain multiple independent workspaces.
- Workspaces are the primary tenants.
- Do not introduce an Organization entity initially.
- Human users have global identities and workspace-specific memberships.
- Every tenant-owned record must be scoped to its workspace.
- Creating a workspace does not alter a user's roles in existing workspaces.

### Roles and permissions
- Use fixed workspace roles: Owner, Admin, and Member.
- Owners have ultimate workspace control.
- Admins manage ordinary workspace administration but cannot transfer ownership or delete a workspace.
- Members can read, create, and update ordinary CRM records but cannot delete records or administer workspace membership.
- Centralize permission checks in server-side business services.
- Prevent removing or demoting the last Owner.
- Finalize role-management edge cases during authorization implementation.

### Workspace creation
- Only Owners and Admins may create workspaces.
- The creator becomes Owner of the new workspace.
- The new workspace starts with independent membership and CRM data.

### Authentication and onboarding
- Use Auth.js with a compatible database-backed session strategy, subject to verifying the Prisma 7 integration.
- Support email/password authentication and email verification.
- Configure SMTP for invitations, verification, and password resets.
- Normal registration is invitation-only.
- Bootstrap the initial administrator and first workspace through a one-time setup flow.
- Disable bootstrap after successful initialization.
- Never expose an unauthenticated production path for creating additional administrators.

### External agents
- External AI agents connect to Outreach CRM; the CRM does not create or execute agents in the initial design.
- Agent identity, credentials, scopes, delegation, and audit policy require a separate design before implementation.

### Data integrity and security
- Validate external inputs using Zod.
- Enforce workspace authorization server-side.
- Use foreign keys, constraints, indexes, and workspace-scoped queries.
- Test cross-workspace read, create, update, and delete isolation.
- Keep sensitive database access server-only.
- Store secrets outside version control.

### Deployment
- Use Docker Compose and PostgreSQL with persistent storage.
- Use versioned Prisma migrations.
- Apply production migrations using `prisma migrate deploy`.
- Document backups, restoration, upgrades, health checks, and secret configuration.

### Deferred
- Organization hierarchy.
- Custom roles and advanced record-level permissions.
- Detailed external-agent authorization.
- MCP, webhooks, and automation execution.
- Advanced recovery and retention policies.

## Consequences

The initial model supports multiple clients per installation without requiring separate database instances. It makes workspace isolation and membership authorization core correctness requirements. Fixed roles and a shared service layer reduce complexity while leaving room for later extensions.

## Acceptance criteria

1. The database represents users, workspaces, and memberships with appropriate constraints.
2. Workspace-owned records cannot be associated with records from another workspace.
3. A user can have different roles in different workspaces.
4. The last Owner cannot be removed or demoted.
5. Migrations can initialize a clean PostgreSQL database.
6. Cross-workspace isolation is covered by automated tests.
