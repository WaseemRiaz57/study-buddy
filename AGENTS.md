# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

## What this is

StudyBuddy is a gamified, AI-powered social-learning SaaS built on **Next.js 16 (App Router) + React 19 + TypeScript (strict) + Tailwind v4**, backed by **MongoDB (Mongoose)** with optional **Upstash Redis**. It bundles many product domains into one app: AI study-content generation, live study rooms (video), peer matchmaking ("Study with Buddy"), focus/Pomodoro rooms, a mentorship marketplace (booking + payments + reviews), a community forum, a resource marketplace, gamification (XP/coins/badges/challenges/streaks), trust & safety/moderation, and a full admin console.

## Commands

```bash
npm run dev          # Next dev server (webpack). http://localhost:3000
npm run dev:turbo    # Next dev with turbopack (alternative)
npm run build        # Production build (webpack). Runs postbuild SW generator.
npm run start        # Serve the production build
npm run lint         # ESLint (flat config, eslint-config-next)

# One-off maintenance migration (expires stale buddy listings; needs MONGODB_URI in env)
node scripts/close-expired-study-buddy-listings.mjs
```

Notes:
- Build/dev deliberately use **webpack** (`--webpack`), not the Next default turbopack. Keep `npm run build` for parity with CI/prod.
- **There is no test runner configured** (no jest/vitest, no `test` script). Don't assume one exists.
- `postbuild` runs `scripts/generate-pwa-service-worker.mjs`, which writes `public/sw.js` keyed to `.next/BUILD_ID`. The custom SW is separate from `@ducanh2912/next-pwa` config in `next.config.ts`.

## Environment

Secrets live in `.env.local` (gitignored). Required keys (see `.env.local` for the full list):
`NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `MONGODB_URI`, `GOOGLE_CLIENT_ID/SECRET`, `CLOUDINARY_*`, `NEXT_PUBLIC_LIVEKIT_URL` + `LIVEKIT_API_KEY/SECRET`, `SMTP_USER/PASS` (nodemailer), `GROQ_API_KEY`, `UPSTASH_REDIS_REST_URL/TOKEN`, `REDIS_URL`.

Redis is **optional**: `getRedisClient()` returns `null` when Upstash isn't configured and callers fall back to MongoDB. Don't make Redis a hard dependency in new code — follow the null-fallback pattern in `lib/redis.ts`.

## Architecture & cross-cutting conventions

### Routing & request gating
- **Middleware is `proxy.ts`, not `middleware.ts`** (Next 16 renamed the convention). It uses NextAuth's `withAuth` to: redirect unauthenticated users off `/dashboard` and `/admin`; force `banned` accounts to `/account-suspended` (and 403 banned API calls, except `/api/appeals`); send ADMINs hitting `/dashboard` to `/admin` and non-ADMINs hitting `/admin` to `/login`.
- App is organized by route groups under `app/`: `(auth)`, `(marketing)`, `dashboard/` (student + mentor product), `admin/` (admin console), and `api/` (route handlers). Dashboard renders role-specific views via `app/dashboard/student-view.tsx` / `mentor-view.tsx`.

### Auth & identity (the part most likely to bite you)
- All auth config is in **`lib/authOptions.ts`** (NextAuth v4, **JWT session strategy**), providers: Credentials (bcrypt-style hashing via `lib/password.ts`) + Google. The `[...nextauth]` route just re-exports it.
- **Role casing is intentionally split:** the DB stores **lowercase** roles (`student`/`teacher`/`mentor`/`admin`), but `normalizeRole()` collapses them to **uppercase `STUDENT`/`MENTOR`/`ADMIN`** on the session/JWT (`teacher` → `MENTOR`). When checking roles, know which side you're on.
- The `User` model carries **duplicate legacy+current fields**: `role`, `subscriptionPlan` *and* `plan`, `accountStatus` *and* `status`. `authOptions` normalizers read both. When reading plan/status, prefer the normalized helpers rather than a single raw field.
- **Server-side route auth:** use `requireRole(...roles)` from `lib/auth-guard.ts` — it calls `getServerSession(authOptions)` and returns `{ error, session }` (return `error` if present). `requireRole` expects **lowercase** role names (`"student" | "mentor" | "admin"`).

### Data layer
- MongoDB via Mongoose. **Always** open the connection with `connectMongoDB()` from `lib/mongodb.ts` (cached on `globalThis` to survive hot-reload / serverless reuse); `lib/connectDB.ts` is a thin alias. Call it before any model query in a route.
- Models live in `models/` and follow the `mongoose.models.X || mongoose.model("X", schema)` guard so they survive hot reload. There are ~50 models; the schema *is* the source of truth for domain shape.

### AI generation pipeline
- `lib/aiService.ts` wraps the **Groq SDK** (`llama-3.3-70b-versatile`) for three content types: `notes`, `summarizer`, `quiz`. Source text is capped (`MAX_SOURCE_CHARS = 25000`).
- Upload parsing: PDFs via `pdf-parse-fork`/`pdf-parse`, DOCX via `mammoth`. AI routes set `runtime = "nodejs"` and `dynamic = "force-dynamic"`.
- **Two independent limits apply to AI:** (1) burst rate limit of **5 generations/min** via Upstash sliding window in `lib/ratelimit.ts`, and (2) **per-plan daily quotas** enforced against the `UsageCounter` model via `lib/subscriptionAccess.ts`. New AI endpoints should honor both.

### Subscriptions & feature gating
- Plan tiers are `free | pro | elite`. **Static** definitions/limits are in `lib/pricingConfig.ts`; the DB `SubscriptionPlan` model can **override** them, merged in `lib/subscriptionPlans.ts` (`getSubscriptionPlan`). Use `getUserSubscriptionPlan(userId)` + `upgradeRequiredResponse()` from `lib/subscriptionAccess.ts` to gate features server-side; `components/subscription/FeatureGate.tsx` gates UI.

### Real-time (Socket.IO) — read this before touching live features
- All socket logic is a single Socket.IO namespace **`/study-room`** defined in `lib/study-room-socket.ts` (`registerStudyRoomNamespace(io)`). It multiplexes everything: study-room join/leave + auto-close, knock/admit, mentor "end session" handshake, 1:1 conversation messaging/typing, presence, and per-user notifications.
- Server code emits to clients only through the exported helpers (`emitUserNotification`, `emitSessionCompleted`, `emitBuddyRequestAccepted`, …), which no-op unless the namespace has been registered. Clients connect with `io("/study-room")` (see `components/NotificationBell.tsx`, `app/dashboard/messages/page.tsx`).
- **Important gotcha:** the repo has **no custom server / `instrumentation.ts`** and `registerStudyRoomNamespace` has **no in-repo call site** — the Socket.IO server is bootstrapped *outside* the standard Next build (separate process/host). So the `emit*` helpers silently return `false` under plain `next dev`/`next start`. Real-time features depend on that external socket server being wired up; don't assume `npm run dev` alone makes sockets work.
- Room/lifecycle constants (TTLs, grace periods, XP-per-minute, upload allowlist) are centralized in `lib/study-room-constants.ts`.

### Other external services
- **LiveKit** for live video rooms — tokens via `livekit-server-sdk`, UI in `components/LiveVideoRoom.tsx`, moderation server actions in `app/actions/livekit-moderation.ts` / `lib/livekit-moderation.ts`.
- **Cloudinary** for file uploads (study-room "Vault", resource hub) via `app/api/vault/upload/route.ts`.
- **Nodemailer (SMTP)** for OTP email (registration / password reset) — see `app/api/auth/send-otp` and the `Otp` model.

### Client state
- **Zustand** stores in `store/` (`useUserStore`, `useGamificationStore`, `useSidebarBadges`, `useFocusTodoStore`). Note `useUserStore`'s `Role`/`Plan` enums differ from the auth/session casing — treat session (`session.user.role`) as the authority for the logged-in user; the store is UI-local.

### Gamification
- `lib/gamificationEngine.ts` holds the canonical `REWARD_DICTIONARY` (XP/coins per action) and streak math, persisting to `UserProgress`/profiles. Badge unlocks (`lib/badgeEngine.ts`) and challenge progress (`lib/challengeTracker.ts`) hang off the same action events. Route the reward for a new user action through these engines rather than mutating XP inline.

## Conventions to match
- Import alias `@/*` maps to repo root (`tsconfig.json`).
- Security headers + CSP are set globally in `next.config.ts`; if you add an external origin (script/connect/img), update the CSP there or it will be blocked.
- Many existing files contain **Roman-Urdu/Hindi ("Hinglish") code comments** (e.g. in `models/User.ts`). This is pre-existing; match the surrounding style of whatever file you edit rather than rewriting comments wholesale.
- ESLint runs `@typescript-eslint/no-explicit-any` as a **warning**, and the codebase uses `any` + targeted `@ts-expect-error` (e.g. CommonJS PDF libs) in places — keep new code typed, but warnings won't fail the build.
