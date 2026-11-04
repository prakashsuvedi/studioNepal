# NepalAI Studio — Phase 01A: Targeted Remediation Plan

## Document Control
- **Phase**: 01A — Security Verification & Protection
- **Classification**: Engineering Remediation Specification
- **Execution Rule**: **Awaiting Human Review & Explicit Sign-Off Before Implementation**
- **Architecture Principle**: Small, isolated, backward-compatible, additive changes with zero breaking contract modifications.

---

## 1. Remediation Scope & Guiding Rules

1. **Zero Downtime & Zero Contract Disruption**:
   - All 110 API routes, endpoint names, and response schemas will remain 100% identical.
   - Legitimate administrator access for whitelisted emails (`prakashsuvedi.backup@gmail.com`, `prakashsuvedi@gmail.com`, `saghimire12@gmail.com`) and configured `ADMIN_SECRET_KEY` will remain intact.
   - Single-session guest editing in the CapCut timeline workbench will continue without interruption.
2. **Strict Server-Side Enforcement**:
   - Client-supplied claims (`req.body.adminBypass`, `req.headers['x-user-id']`, `req.query.userId`, `req.query.adminKey`) will never be accepted as proof of administrative privilege.
   - Privileges must derive strictly from cryptographically verified HS256 JWT tokens or server-to-server header validation.
3. **Defense in Depth**:
   - Sensitive infrastructure diagnostics gated behind admin credentials.
   - Public health checks (`/api/health`, `/api/health/live`, `/api/health/ready`) preserved for Cloud Run / Docker container monitoring.

---

## 2. Prioritized Implementation Sequence

### Priority 1: Critical Authentication & Admin Authorization Hardening
* **Target Findings**: FINDING-01, FINDING-02, FINDING-03
* **Affected Files**:
  - `server.ts` (lines 380–420, 851–891)
  - `src/server/credentials.ts` (lines 13–45)

#### Proposed Remediation:
1. **Fix `POST /api/auth/admin-login` (`server.ts`)**:
   - Require `email` and either `password` or `adminKey` to be non-empty strings (length >= 8).
   - Eliminate `!inputPass` condition.
   - Verify that `inputEmail` is present in `ADMIN_WHITELIST_EMAILS`.
   - Validate `inputPass` using constant-time comparison (`crypto.timingSafeEqual`) against configured `process.env.ADMIN_PASSWORD` or `process.env.ADMIN_SECRET_KEY`.
   - On invalid credentials, return `HTTP 401 Unauthorized` with structured failure message.
2. **Harden `requireAdmin` Middleware (`server.ts`)**:
   - Remove the unverified `if (userId === 'usr_admin_01' || ...)` bypass check.
   - Derive user identity exclusively from cryptographically verified Bearer JWT tokens.
   - Allow `x-admin-key` ONLY when passed as an explicit HTTP header matching `process.env.ADMIN_SECRET_KEY` (reject query parameters on mutating endpoints).
3. **Cleanse `getValidAdminPasswords()` (`src/server/credentials.ts`)**:
   - Remove hardcoded weak passwords (`admin`, `123456`, `password`, `prakash`, `nepalai`).
   - Only return explicitly configured environment secrets (`ADMIN_PASSWORD`, `ADMIN_SECRET_KEY`).

---

### Priority 2: Diagnostic & Storage Exposure Remediation
* **Target Findings**: FINDING-04, FINDING-05
* **Affected Files**:
  - `server.ts` (lines 630–667, 2166–2220)

#### Proposed Remediation:
1. **Secure `/api/diagnostic/storage/r2`**:
   - Attach `requireAdmin` middleware.
   - Mask internal endpoints and account identifiers in responses.
2. **Secure `/api/diagnostic/ai-credentials`**:
   - Attach `requireAdmin` middleware so that model inventories, Azure endpoints, and Hugging Face tokens are visible only to verified platform owners.
3. **Preserve Public Probes**:
   - `/api/health`, `/api/health/live`, and `/api/health/ready` remain public and unauthenticated, returning only high-level status booleans (`{ status: "ok", database: true, storage: true }`) suitable for load balancer health monitoring.

---

### Priority 3: Tenant Isolation & Project Scoping (BOLA/IDOR)
* **Target Findings**: FINDING-06
* **Affected Files**:
  - `server.ts` (lines 3769–3843)

#### Proposed Remediation:
1. **Scope `GET /api/projects`**:
   - Extract authenticated user via `extractAuthUser(req)`.
   - If user is an admin (`isUserAdmin === true`), allow viewing all recent projects.
   - For standard authenticated users, scope database query to `WHERE user_id = $1`.
   - For guest users without a token, return only guest-scoped projects (`WHERE owner_user_id = 'usr_guest'`) or an empty list.
2. **Scope `GET /api/projects/:projectId`**:
   - After fetching project from PostgreSQL, verify ownership:
     `if (row.user_id !== authUser?.userId && row.owner_user_id !== 'usr_guest' && !isAdmin) return res.status(403)...`
   - Prevents unauthorized callers from fetching other users' scripts, subtitles, and scenes.

---

### Priority 4: AI Resource Entitlement & Quota Bypass Prevention
* **Target Findings**: FINDING-07
* **Affected Files**:
  - `server.ts` (lines 2026–2040, 2069–2085)

#### Proposed Remediation:
1. **Derive Admin Bypass from Authenticated Identity**:
   - Extract caller using `extractAuthUser(req)`.
   - Determine `isAdmin = isUserAdmin(authUser, req)`.
   - Grant quota exemption (`canGen.allowed = true`) **only** when `isAdmin === true`.
   - Ignore untrusted `req.body.adminBypass` flags sent by regular users.
2. **Derive User ID from Authenticated Session**:
   - For authenticated requests, force `userId = authUser.userId`, preventing a regular user from attributing their generations to `usr_admin_01`.

---

### Priority 5: Persistence Outbox & Asynchronous Re-Sync
* **Target Findings**: FINDING-08
* **Affected Files**:
  - `src/server/db.ts` (lines 570–615)
  - `src/server/postgresDb.ts`

#### Proposed Remediation:
1. **Append-Only Outbox Queue**:
   - When a PostgreSQL write fails due to a network drop, enqueue the synchronization task in an in-memory outbox queue.
2. **Automated Drain on Reconnect**:
   - When `postgresDb.testConnection()` succeeds on periodic reconnect, trigger `drainPendingSyncOutbox()`.
   - Eliminates data drift between local JSON store and cloud PostgreSQL without blocking user workflows.

---

## 3. Regression Test & Verification Plan

Following implementation of each priority, the following automated verification suite will be executed:

1. **Authentication & Admin Test Suite**:
   - Send `POST /api/auth/admin-login` with `{}` -> Expect `HTTP 400/401` (Failure).
   - Send `GET /api/admin/users` with header `x-user-id: usr_admin_01` without JWT -> Expect `HTTP 403 Forbidden`.
   - Send `GET /api/admin/users?adminKey=admin` -> Expect `HTTP 403 Forbidden`.
   - Send legitimate admin login with verified environment secret -> Expect `HTTP 200 OK` with valid signed JWT.
2. **Tenant Scoping Test Suite**:
   - Create Project A under User Alice.
   - Attempt to fetch Project A using User Bob's JWT -> Expect `HTTP 403 Forbidden`.
   - Fetch Project A using Alice's JWT -> Expect `HTTP 200 OK`.
3. **Quota Bypass Test Suite**:
   - Regular user calling `/api/images/azure` with `{ "adminBypass": true }` -> Verify credits are properly deducted or request blocked if credits are 0.
4. **Full Platform Smoke Test Suite**:
   - Execute `npx tsx scripts/smoke_test_suite.ts` to ensure zero regression across audio, image, Sora video, and render pipelines.
5. **Compiler & Bundler Checks**:
   - Execute `npm run lint` (`tsc --noEmit`).
   - Execute `npm run build` (`vite build && esbuild server.ts`).

---

## 4. Rollback & Forward Recovery Strategy

- **Granular Isolation**: Each fix is applied to a targeted block of lines with zero dependencies on third-party libraries.
- **Rollback Procedure**: In the event of an unexpected regression, git diffs for the affected file will be restored immediately without affecting database data or user sessions.
- **Forward Recovery**: All database schema tables are preserved; no DDL alterations are required.

---

## 5. Request for Human Authorization

In strict compliance with the **Master Engineering Directive**:
> *"Stop after presenting the evidence and remediation plan. Do not implement fixes until approval is given."*

The security audit is complete, all findings are documented, and empirical proof has been captured. Implementation will begin immediately upon your confirmation.
