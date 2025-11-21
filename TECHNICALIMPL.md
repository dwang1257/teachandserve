## TECHNICALIMPL

### High-Level Overview

Teach & Serve is a full‑stack mentorship platform with a **Spring Boot 3 / Java 21 backend**, a **React + Tailwind SPA frontend**, and **PostgreSQL + Redis** as core infrastructure. It supports JWT‑based auth, AI‑assisted mentor/mentee matching, and end‑to‑end encrypted 1‑to‑1 messaging over WebSockets.

### Current Implementation (Technical)

- **Backend (`backend/`)**
  - **API & Frameworks**
    - Spring Web REST APIs under `/api/**` for auth, profiles, matches, and messaging.
    - Spring Security with stateless JWT auth, `JwtAuthenticationFilter`, and role‑based access (MENTOR/MENTEE).
    - Global CORS configuration to allow the React app at `http://localhost:3000`.
  - **Domain & Features**
    - `User` entity with `Role` enum and basic account metadata.
    - `UserProfile` with bio, interests, goals, skills, experience level, location, timezone, availability, profile image, and flags for profile completion and matching availability.
    - `Match` + `MatchStatus` for AI‑scored mentor/mentee matches and accept/reject flows.
    - Messaging domain: `Conversation`, `ConversationParticipant`, `Message`, `MessageReadReceipt` with a Flyway migration (`V001__create_messaging_tables.sql`) and optimized DTO‑based queries for conversation lists and messages.
  - **AI Matching**
    - `EmbeddingService` builds embedding text from bio + interests (+ goals) and supports multiple strategies:
      - MOCK (deterministic, offline).
      - OPENAI (using `text-embedding-3-small` when key is configured).
      - SMART (prefers OpenAI, falls back to mock).
    - `MatchingService` computes cosine similarity over embedding vectors stored as JSONB (`@JdbcTypeCode(SqlTypes.JSON)`), and `MatchingOrchestrationService` reacts to `ProfileCompletedEvent` to auto‑create `Match` records.
  - **Messaging**
    - Real‑time messaging powered by Spring WebSocket + STOMP broker at `/ws` and `/topic/**` destinations.
    - `ConversationService` handles 1‑to‑1 conversation creation only for ACCEPTED matches and optimized loading of conversation lists.
    - `MessageService`:
      - AES‑256 encryption via `EncryptionService` (per‑conversation key, Base64‑encoded).
      - Rate limiting via `RateLimitingService` backed by Redis (messages per minute per user).
      - Read receipts and unread counts persisted in DB and pushed via STOMP topics.
  - **Security / Hardening**
    - JWT signing/verification via `JwtUtil` and `io.jsonwebtoken`.
    - Password hashing via BCrypt.
    - XSS sanitization with `SanitizationService` using OWASP Java HTML Sanitizer.

- **Frontend (`my-app/`)**
  - **Stack & Architecture**
    - React SPA (Create React App) with TailwindCSS for styling.
    - `react-router-dom` for routing and `ProtectedRoute` for auth‑gated pages.
    - Centralized axios config for `Authorization: Bearer <token>` and API base URL.
  - **Key Screens**
    - Landing page for marketing and role selection.
    - Auth flows (`/login`, `/signup`) with password validation and role selection.
    - Role‑based dashboards (`MentorDashboard`, `MenteeDashboard`) showing matches, profile completion state, and calls to action.
    - Profile flows: `CompleteProfile`, `ProfileSetup`, and `ViewProfile` consuming `/api/profile/**`.
    - Matching UI (`MatchedProfiles`) listing current matches with accept/reject actions.
    - Messaging UI (`Messages`) with:
      - Conversation list (accepted matches + active conversations).
      - Real‑time chat window integrated with STOMP/WebSocket via `websocketService.js`.
      - Optimistic message sending and unread badges.
  - **State & Context**
    - `AuthContext` holds current user, JWT token, and auth helpers (`login`, `signup`, `logout`).
    - `NotificationBanner` polls for new matches and surfaces them non‑intrusively.

### What We Need to Continue Further (Infra / Secrets / Ops)

- **AI / OpenAI**
  - Production‑grade OpenAI embeddings require:
    - `OPENAI_API_KEY` configured securely for the backend (env var / secrets manager).
    - Strategy selection set to `OPENAI` or `SMART` in application configuration.
  - Monitoring and rate‑limit handling for OpenAI (retries, backoff) should be added before scale.

- **Cloud & Hosting (e.g., AWS)**
  - **Compute**: Containerized deployment (ECS/Fargate, EKS, or Elastic Beanstalk) for:
    - Backend Spring Boot service.
    - Frontend React app (served via Nginx or S3 + CloudFront).
  - **Data Stores**:
    - Managed PostgreSQL (e.g., RDS) with SSL enforced and parameter groups tuned for JSONB and connection pooling.
    - Managed Redis (e.g., ElastiCache) for rate limiting, caching, and potential session/feature flags.
  - **Networking & Security**:
    - VPC with private subnets for DB/Redis, public subnets for load balancer only.
    - WAF / security groups that only expose HTTPS on 443.
  - **Static Assets / Logs**:
    - S3 for assets, logs, and backups.
    - Centralized logging/monitoring (CloudWatch, OpenSearch, or similar).

- **Domain & SSL**
  - Custom domain (e.g., `app.teachandserve.org`) pointing to a load balancer or CDN.
  - TLS certificates (ACM or Let’s Encrypt) with automatic renewal.
  - CORS and frontend config updated to use the production domain.

- **Operational Tooling**
  - CI/CD pipeline (GitHub Actions / CircleCI) to:
    - Build Docker images.
    - Run tests and linters.
    - Deploy to staging/production environments.
  - Secret management (e.g., AWS SSM Parameter Store or Secrets Manager) for:
    - DB credentials.
    - JWT signing key.
    - OpenAI API key.

### Planned Features / Next Implementations

- **Email Verification**
  - Add email verification to the signup flow:
    - Generate a signed, time‑limited verification token on signup.
    - Send verification email via an email provider (e.g., AWS SES, SendGrid).
    - Add `/api/auth/verify-email` endpoint and associated controller/service logic.
    - Gate login or certain actions until `emailVerified` is true on the `User`.

- **Email Mentoring Actions (One‑Click from App)**
  - Expose mentor/mentee contact actions directly in the UI:
    - On match cards and conversation headers, show a “Email Mentor/Mentee” button.
    - Implementation options:
      - Simple: `mailto:` links pre‑filled with subject/body.
      - Advanced: backend‑mediated messaging (e.g., SES) to proxy emails without exposing raw addresses.
  - Optional logging/auditing table to record off‑platform contact for analytics.

- **Additional Production‑Readiness Work**
  - Robust error handling and user‑facing error states in the React app.
  - Rate limiting beyond messaging (auth endpoints, profile updates).
  - Basic admin/ops endpoints (health checks, actuator metrics) and dashboards for observability.


