## Teach & Serve

Teach & Serve is a mentorship platform that connects students from underrepresented and underserved backgrounds with mentors who care. It is built as a full‑stack application with a Spring Boot backend and a React/Tailwind frontend, with real‑time encrypted messaging, AI‑assisted matching, and role‑based dashboards for mentors and mentees.

---

## Technologies Used

- **Backend**
  - **Language/Runtime**: Java 21, Spring Boot 3.5
  - **Frameworks**:
    - Spring Web (REST APIs)
    - Spring Data JPA (PostgreSQL persistence)
    - Spring Security (JWT‑based auth, stateless sessions)
    - Spring WebSocket + STOMP (real‑time messaging)
    - Spring Cache + Spring Data Redis (caching, rate limiting support)
  - **Messaging / Realtime**:
    - STOMP over WebSockets (`/ws` endpoint, `/topic/**` destinations)
    - SockJS fallback (via frontend)
  - **Database**:
    - PostgreSQL (primary DB)
    - JPA entities for users, profiles, matches, conversations, messages, read receipts
  - **Other Backend Libraries**:
    - `io.jsonwebtoken` (JWT signing/verification)
    - Bouncy Castle (`bcprov-jdk15on`) and Apache Commons Codec (`commons-codec`) for cryptography/Base64
    - Hibernate types (`@JdbcTypeCode(SqlTypes.JSON)`) for JSON/JSONB columns
    - Redis (via `spring-boot-starter-data-redis`) for caching and rate limiting

- **Frontend**
  - **Language/Runtime**: React (Create React App), JavaScript + some TypeScript components
  - **Major Libraries**:
    - `react-router-dom` for routing and protected routes
    - `axios` for HTTP requests
    - `@stomp/stompjs` + `sockjs-client` for STOMP/WebSocket messaging
    - Tailwind CSS for modern utility‑first styling
  - **Build tooling**:
    - `react-scripts` (CRA)
    - Tailwind + PostCSS + Autoprefixer

---

## High‑Level System Design

### Overall Architecture

- **Client–Server** architecture:
  - **Frontend** (`my-app/`): SPA served on `http://localhost:3000`. Handles authentication, onboarding, profile management, dashboards, messaging UI, and match viewing.
  - **Backend** (`backend/`): Spring Boot API server on `http://localhost:8080`. Exposes REST endpoints under `/api/**` and a WebSocket STOMP endpoint at `/ws`.
  - **Database**: PostgreSQL instance `teachandserve_secure` used by the backend.
  - **Redis**: Used by the backend for rate limiting and caching.

- **Security & Auth Flow**
  - Users sign up and log in via `/api/auth/signup` and `/api/auth/login`.
  - Backend issues a **JWT** containing the user’s email as subject.
  - Frontend stores the token in `localStorage` and attaches `Authorization: Bearer <token>` via a central axios config (`axios.defaults.baseURL = 'http://localhost:8080'`).
  - Spring Security (`SecurityConfig`) configures:
    - Stateless sessions (`SessionCreationPolicy.STATELESS`)
    - A `JwtAuthenticationFilter` that:
      - Extracts the Bearer token
      - Validates it with `JwtUtil`
      - Loads the user via `UserDetailsServiceImpl` and sets the `SecurityContext`
    - Public endpoints: `/api/auth/**`, `/ws/**`, `/h2-console/**`
    - All other endpoints require authentication.
  - Cross‑origin requests are allowed from `http://localhost:3000` by `GlobalCorsConfig` and the CORS configuration inside `SecurityConfig`.

### Domain Model

- **User & Auth**
  - `User` implements `UserDetails` and represents an authenticated account with:
    - `email` (unique, login identity)
    - `password` (BCrypt‑hashed)
    - `role` (`MENTOR` or `MENTEE`)
    - Profile name fields (`firstName`, `lastName`) used across the UI instead of raw emails once set.
  - `Role` enum distinguishes mentors vs mentees and drives role‑specific UX and matching.
  - `AuthController` exposes:
    - `/api/auth/signup` – register, validate, create `User`, return `AuthResponse { token, user }`
    - `/api/auth/login` – authenticate, return new JWT and user info
    - `/api/auth/me` – returns current authenticated user info (id, email, role, popup status).

- **Profiles & Matching**
  - `UserProfile` is a one‑to‑one extension of `User`, persisted in `user_profiles`:
    - Rich fields: `bio`, `interests`, `goals`, `skills`, `experienceLevel`, `location`, `timezone`, `availability`, `profileImageUrl`.
    - Embedding fields: `bioEmbedding`, `interestsEmbedding` (JSONB vectors for AI matching).
    - Flags: `isProfileComplete`, `isAvailableForMatching`.
  - `ProfileService`:
    - Creates/updates profiles (`/api/profile/me`, `/api/profile/complete`).
    - Derives embedding text from bio + interests via `EmbeddingService`.
    - Generates embeddings using a **strategy**:
      - **MOCK**: deterministic, offline embedding for dev
      - **OPENAI**: real embeddings via OpenAI API (`text-embedding-3-small`)
      - **SMART**: hybrid; tries OpenAI if key set, falls back to mock.
    - Emits a `ProfileCompletedEvent` on completion to trigger auto‑matching.
  - `MatchingService`:
    - Computes similarity between mentee/mentor profiles based on embeddings (cosine similarity).
    - Provides:
      - `findMatchingMentors(menteeUserId, limit)`
      - `findMatchingMentees(mentorUserId, limit)`
      - `findProfilesByInterests(interests, role, limit)` as a keyword‑based fallback.
    - Uses `UserProfileRepository` queries like `findProfilesWithEmbeddingsByRole`, `findAvailableProfilesByRole`.
  - `MatchingOrchestrationService`:
    - Listens for `ProfileCompletedEvent`.
    - When a profile is completed:
      - If user is a **mentee**, finds top mentors and creates `Match` records.
      - If user is a **mentor**, finds top mentees similarly.
    - `Match` entity tracks:
      - `mentee`, `mentor`
      - `similarityScore`
      - `status` (`PENDING`, `ACCEPTED`, `REJECTED`, etc.)
      - timestamps (matched, accepted, rejected).
    - `MatchRepository` supports queries by mentee, mentor, user, status, and existence checks.
  - `MatchController` exposes:
    - `/api/matches/my-matches` – matches for current user (mentee or mentor).
    - `/api/matches/{matchId}/accept` and `/reject` – update match status.
  - Frontend:
    - `MatchedProfiles` page lists matches with profile cards, statuses, and accept/reject actions.
    - `NotificationBanner` polls `/api/profile/matches?limit=1` and surfaces lightweight “New Match!” notifications near the top of the app.

- **Messaging**
  - Schema (created via `V001__create_messaging_tables.sql`):
    - `conversations` – conversation metadata with `created_at`, `updated_at`, plus a trigger to bump `updated_at` whenever a message is inserted.
    - `conversation_participants` – links users to conversations (with `joined_at`, uniqueness on `(conversation_id, user_id)` and a uniqueness index for 1‑to‑1 pairs).
    - `messages` – message records: `conversation_id`, `sender_id`, `body`, `created_at`, `edited_at`, `deleted_at`.
    - `message_read_receipts` – `message_id`, `user_id`, `read_at` with uniqueness constraint per `(message_id, user_id)`.
  - Backend message flow:
    - `ConversationService`:
      - `getOrCreate1to1Conversation(userId, peerUserId)`:
        - Uses `MatchService.areMatched` to ensure users have an **ACCEPTED** match.
        - Checks for an existing 1‑to‑1 conversation; if none, creates one and inserts two `ConversationParticipant` entries via proxies (`getReferenceById`).
      - `getUserConversations(userId)`:
        - Uses a single optimized native query (`ConversationRepository.findConversationsByUserIdOptimized`) returning `ConversationListDTO`:
          - Participant info (id, email, first name).
          - Latest message preview.
          - Unread message count per conversation.
        - Converts DTOs into `ConversationResponse` objects with participants, `lastMessage`, `unreadCount`, and timestamps.
      - `getConversation(conversationId, userId)` verifies membership before returning conversation metadata.
    - `MessageService`:
      - `sendMessage(conversationId, senderId, body)`:
        - AuthZ: checks the sender is a participant.
        - Rate limiting via `RateLimitingService` (Redis counters keyed by user).
        - Encrypts body using `EncryptionService` (AES‑256 with deterministic per‑conversation key).
        - Persists `Message`, then converts it to a `MessageResponse` with decrypted body.
        - Publishes the message over STOMP to `/topic/conversations.{conversationId}.messages`.
        - Publishes conversation update notifications to each participant at `/topic/users.{userId}.conversations`.
      - `getMessages(conversationId, userId, beforeMessageId, limit)`:
        - Validates participant membership.
        - Uses `MessageRepository.findMessagesOptimized` (DTO projection) to load messages and sender data in one query.
        - Decrypts each message and maps it to `MessageResponse`.
      - `markMessagesAsRead(conversationId, userId, lastMessageId)`:
        - Uses `findUnreadMessageIds` to fetch all relevant message IDs in one query.
        - Batch‑inserts `MessageReadReceipt` rows with entity proxies.
        - Publishes per‑message read receipt notifications over `/topic/users.{userId}.read-receipts`.
        - Publishes a conversation update to recalc unread counts in the UI.

- **WebSockets & STOMP**
  - Configured by `WebSocketConfig`:
    - STOMP endpoint: `/ws` with SockJS fallback; allowed origins `http://localhost:3000` and `http://localhost:3001`.
    - Broker destinations: `/topic/**`.
    - Application prefix: `/app` (for server‑side `@MessageMapping` if added).
  - Client side:
    - `websocketService.js` wraps `@stomp/stompjs` and `sockjs-client`:
      - Handles connection, reconnection with exponential backoff, subscriptions, and sends.
      - Attaches JWT token via STOMP `connectHeaders`.
    - `Messages.js`:
      - On load, connects WebSocket and subscribes to `/topic/users.{userId}.conversations` for updates.
      - When a conversation is selected, subscribes to `/topic/conversations.{id}.messages` to receive messages in real time.

### Rate Limiting

- Implemented in `RateLimitingService` using Redis:
  - Keeps a per‑user sliding counter key `rate_limit:messages:{userId}` with TTL equal to the window size (default 60 seconds).
  - Enforces `messagesPerMinute` (default 60) and exposes helper methods for remaining messages and reset time.
  - Fails open (allows messages) if Redis is unavailable, to avoid hard outages.

### Encryption

- `EncryptionService` provides per‑conversation encryption:
  - Encrypts and decrypts message bodies using AES‑256 (deterministic key derived from conversation ID).
  - Stores encrypted text in DB (Base64 encoded).
  - Decrypts before sending back to clients, whether via REST (`MessageService`) or WebSockets.

---

## Frontend Application Structure

- **Entry & Routing**
  - `App.js`:
    - Wraps the app in `AuthProvider` and `BrowserRouter`.
    - Renders `Header` and, when logged in, `NotificationBanner`.
    - Defines routes:
      - `/` – Landing page (marketing / high‑level description).
      - `/login`, `/signup` – Auth flows.
      - `/dashboard` – Main dashboard (mentor or mentee specific).
      - `/matches` – Matched profiles overview.
      - `/messages` – Messaging UI with sidebar and chat window.
      - `/complete-profile` – short, guided profile completion form.
      - `/profile/setup` – full profile edit form.
      - `/profile/view` – read‑only view of current user’s profile.
    - Uses `ProtectedRoute` to gate authenticated routes.

- **Auth & Session**
  - `AuthContext`:
    - Loads authenticated user via `/api/auth/me` when a token exists.
    - Tracks profile completion status via `/api/profile/me` and exposes `profileStatus` plus a `refreshProfileStatus` helper.
    - Provides `login`, `signup`, `logout`, and exposes `user` and `setUser`.
    - Stores JWT in `localStorage` and wires axios Authorization header.
  - `ProtectedRoute`:
    - Gates routes by authentication and (by default) requires a **completed profile**.
    - Automatically redirects authenticated users with incomplete profiles to `/complete-profile`, except on profile setup routes.

- **Dashboards**
  - `Dashboard`:
    - Chooses `MentorDashboard` or `MenteeDashboard` based on `user.role`.
  - `MentorDashboard` / `MenteeDashboard`:
    - Fetches `/api/profile/me` and `/api/matches/my-matches`.
    - Assume a **completed** profile (incomplete users are redirected to `/complete-profile` earlier in the flow).
    - Show key metrics (active mentees/mentors, sessions, goals) and quick navigation into matches and messages.

- **Messaging UI**
  - `Messages.js`:
    - Left sidebar:
      - “Active Conversations” section listing conversations with:
        - Avatar initial.
        - Participant **name** (first name when available).
        - Last message preview and relative time.
        - Unread badge for each conversation.
      - Empty state that prompts users to go to `/matches`.
    - Right side:
      - Chat header with participant avatar, name, and WebSocket online/offline indicator.
      - Scrollable messages area with bubble styling (right‑aligned for current user, left for peer).
      - Optimistic UI for sending messages:
        - Adds a temporary “Sending…” bubble immediately.
        - Replaces it with the actual server response or rolls back on error.
      - Message input bar with validation and max length (5000 chars).
    - Behavior:
      - Subscribes to conversation updates & messages via WebSockets.
      - Calls `/api/conversations/{id}/read` with the last message ID to clear unread counts.
      - Minimizes redundant API calls with carefully scoped `useEffect` dependencies and checks.
    - Conversation creation:
      - Users start conversations from the matches page via a **Send Message** button, which deep‑links to `/messages?userId=<peerId>`; the backend creates or reuses a 1‑to‑1 conversation, and the UI immediately focuses that thread.

- **Profile Flows**
  - `CompleteProfile`:
    - Focused, minimal completion form for initial onboarding (first name, last name, bio, interests, goals).
    - Validates:
      - Bio length (≥ 50 chars).
      - At least one interest and one goal.
      - Non‑empty first and last name.
    - On success, POSTs to `/api/profile/complete`, refreshes profile status, then navigates to `/dashboard` with a success message.
  - `ProfileSetup`:
    - Full editor for ongoing profile refinement (bio, interests, goals, skills, experience level, location, timezone, availability, profile image).
    - Loads existing profile via `/api/profile/me` and pre‑populates fields.
  - `ViewProfile`:
    - Read‑only, nicely formatted view of the current user profile.
    - Shows tags for interests, goals, skills; experience level; location; timezone; availability; and profile status.

- **Layout & Styling**
  - `Header`:
    - Brand logo/title (Teach & Serve).
    - When authenticated:
      - “Messages” icon link.
      - Name dropdown (first name or email) on hover with:
        - “View Profile” link (`/profile/view`).
        - Centered “Log out” button.
      - Role badge (“Mentor” or “Mentee”).
    - Hidden on the marketing landing page (which has its own nav).
  - Tailwind is configured in `tailwind.config.js` and enabled in `index.css` with a custom `Inter` typographic baseline.

---

## Running the Project Locally

### Prerequisites

- Java 21+
- Maven
- Node.js + npm
- PostgreSQL running with a database named `teachandserve_secure`
- Redis instance running locally (for rate limiting and caching)

### Backend (Spring Boot)

From the `backend/` directory:

```bash
./mvnw spring-boot:run
```

This will:
- Connect to PostgreSQL at `jdbc:postgresql://localhost:5432/teachandserve_secure` with user `teachandserve_app` and password `${DB_PASSWORD}` (or `default_dev_password` by default).
- Auto‑migrate/create tables via JPA (`spring.jpa.hibernate.ddl-auto=update`) and the messaging migration script.
- Start the REST API on `http://localhost:8080`.
- Expose the WebSocket endpoint at `http://localhost:8080/ws`.

### Frontend (React)

From the `my-app/` directory:

```bash
npm install
npm start
```

This will start the React app at `http://localhost:3000`, proxied to hit the backend at `http://localhost:8080` via the axios base URL.

---

## Running Everything with Docker

If you want a zero-install setup (or to let a teammate spin things up quickly), use the provided Docker configuration at the repo root.

### Prerequisites

- Docker Desktop (or Docker Engine + Docker Compose v2)

### One-time setup

1. (Optional) Update any secrets or environment values in `docker-compose.yml`. By default the stack uses:
   - PostgreSQL user `teachandserve_app` / password `teachandserve_dev_password`
   - Redis without a password
   - Spring Boot’s default JWT secret from `application.properties`
2. If you plan to use the OpenAI embedding mode, set `OPENAI_API_KEY` on the `backend` service.

### Start the stack

From the repository root:

```bash
docker compose up --build
```

This command will:

- Build the backend image (`backend/Dockerfile`) and start it on `http://localhost:8080`
- Build the frontend image (`my-app/Dockerfile`) and serve it via Nginx on `http://localhost:3000`
- Provision PostgreSQL (`postgres:16-alpine`) with the `teachandserve_secure` database
- Provision Redis (`redis:7-alpine`) for caching and rate limiting

All services expose their default ports to your host so you can still connect with external tools (e.g., psql, TablePlus, RedisInsight).

### Useful commands

- Rebuild after code changes: `docker compose up --build backend frontend`
- Follow backend logs: `docker compose logs -f backend`
- Shut everything down (remove containers): `docker compose down`
- Shut down and wipe the Postgres/Redis data volumes: `docker compose down -v`

> NOTE: Hot reloading isn’t enabled inside the containers. For day-to-day development you may still prefer running the backend and frontend locally as described above. The Docker setup is ideal for onboarding partners or verifying a clean-room environment.

---

## Key Features Summary

- **Role‑based onboarding**:
  - Sign up as **Mentor** or **Mentee** with strong password validation.
  - Guided profile completion with role‑specific placeholders and validations.

- **AI‑assisted matching**:
  - Text + interests converted to embeddings (mock or OpenAI).
  - Cosine‑similarity‑based match scoring.
  - Automatic match creation on profile completion.

- **Rich messaging experience**:
  - One‑to‑one conversations between matched users only.
  - Encrypted message bodies at rest.
  - Real‑time updates via WebSockets (STOMP + SockJS).
  - Optimistic UI and unread counts; read receipts persisted in DB.

- **User experience enhancements**:
  - Mentor/Mentee dashboards that assume a completed profile and surface clear metrics and navigation.
  - A streamlined onboarding flow: after signup/login, users are routed directly to a focused profile completion screen until their profile is ready for matching.
  - Hover dropdown on the header name with quick access to “View Profile” and Log out.
  - Match notifications for new matches in a non‑intrusive banner.

This README is meant as a high‑level guide to the architecture and behavior of the Teach & Serve codebase. For more detail, refer to the source files referenced above in `backend/src/main/java/com/teachandserve/backend/**` and `my-app/src/**`.


