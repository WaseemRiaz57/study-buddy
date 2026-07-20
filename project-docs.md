# StudyBuddy Project Documentation

Last updated: 2026-07-20

## 1. Product overview

StudyBuddy is a gamified social-learning SaaS. Students can generate AI study material, join live and focus rooms, find study partners, book mentors, participate in the community, exchange resources, and earn XP, coins, badges, streaks, levels, and scholar ranks. Mentors manage availability, session requests, students, assignments, resources, and earnings. Administrators manage users, content, moderation, gamification, plans, and platform settings.

## 2. Technology stack

| Layer | Technology |
| --- | --- |
| Web framework | Next.js 16 App Router, webpack build |
| UI | React 19, TypeScript strict mode, Tailwind CSS v4 |
| State | NextAuth session plus Zustand UI stores |
| Database | MongoDB with Mongoose 9 |
| Optional cache/rate limiting | Upstash Redis; callers must retain the MongoDB/null fallback |
| Authentication | NextAuth v4 JWT sessions, credentials, Google OAuth |
| AI | Groq SDK, `llama-3.3-70b-versatile` |
| Video | LiveKit |
| Realtime | Socket.IO namespace `/study-room` |
| Uploads | Cloudinary |
| Email | Nodemailer over SMTP |
| PWA | Custom post-build service-worker generation plus next-pwa configuration |
| Motion/charts | Framer Motion, Recharts; heavy runtime surfaces are dynamically loaded where practical |

## 3. Repository structure

```text
app/
  (auth)/             Login and registration flows
  (marketing)/        Marketing route group
  admin/              Admin UI
  api/                Next.js route handlers
  dashboard/          Student and mentor product UI
components/           Shared UI and domain components
hooks/                Client hooks (presence, rewards, activity)
lib/                  Auth, database, AI, plans, roles, sockets, security, engines
models/               Mongoose schemas and indexes
public/               Static assets and generated service-worker files
scripts/              Maintenance and migration scripts
socket-server/        External Socket.IO host/bootstrap project
store/                Zustand stores
proxy.ts              Next.js 16 request gating (replaces middleware.ts)
```

The `@/*` import alias resolves to the repository root.

## 4. Identity, roles, and access control

The canonical roles are:

- Database: `student`, `mentor`, `admin`
- Session/UI: `STUDENT`, `MENTOR`, `ADMIN`
- API guard arguments: `student`, `mentor`, `admin`

`lib/roles.ts` is the normalization boundary. It preserves read compatibility for pre-consolidation mentor accounts without exposing the legacy term to application code. Run the migration after deploying this release:

```bash
npm run migrate:mentor-role
```

The migration updates user roles and the corresponding persisted mentor-session challenge metric. Back up MongoDB before any production migration.

Use `requireRole(...roles)` from `lib/auth-guard.ts` for new server routes. Resource-specific routes must also scope database queries to the current user or verify membership/ownership. UI hiding is not authorization.

`proxy.ts` protects `/dashboard` and `/admin`, redirects by role, and blocks suspended/banned access. API handlers still require their own authentication and object-level authorization.

## 5. Data model catalog

All schemas use the hot-reload-safe `mongoose.models.X || mongoose.model(...)` pattern. The schema files are the final source of truth.

| Domain | Models | Purpose |
| --- | --- | --- |
| Identity | `User`, `StudentProfile`, `MentorProfile`, `Session`, `Otp` | Accounts, role profiles, device sessions, verification |
| AI content | `AIContent`, `AINote`, `Quiz`, `UsageCounter` | Generated content and quota accounting |
| Mentorship | `MentorSession`, `MentorReview`, `Assignment`, `Task`, `Review` | Booking, delivery, feedback, assigned work |
| Study partners/rooms | `BuddyConnection`, `BuddyMatch`, `StudyProfile`, `StudyRoom`, `StudySession`, `FocusSession` | Matching, rooms, presence, focus history |
| Community/chat | `CommunityPost`, `Comment`, `Conversation`, `Message`, `Notification`, `Announcement` | Forum, direct messages, notifications |
| Resources/commerce | `Resource`, `Transaction`, `SubscriptionPlan` | Marketplace resources, transaction history, plan overrides |
| Gamification | `Badge`, `Challenge`, `UserBadge`, `UserChallengeProgress`, `UserMetric`, `UserProgress` | XP, coins, levels, badges, challenge/rank progress |
| Trust and safety | `Report`, `Appeal`, `ModerationLog`, `AuditLog`, `AutoModSetting`, `BroadcastLog` | Reports, penalties, appeals, audit history |
| Platform | `PlatformSettings` | Administrative configuration |

Important duplicated account fields remain for compatibility: `role`, `subscriptionPlan`/`plan`, and `accountStatus`/`status`. Read them through the existing normalization helpers instead of selecting one raw field.

## 6. API structure

There are 158 active route files after removal of the unsafe client-controlled XP endpoint. Route groups are organized by domain:

| Prefix | Route files | Responsibility |
| --- | ---: | --- |
| `/api/admin/*` | 36 | Users, mentors, content, moderation, gamification, plans, settings, monetization |
| `/api/study-buddy/*` and `/api/buddies/*` | 26 | Discovery, listings, requests, matching, active sessions |
| `/api/sessions/*` and `/api/mentor/*` | 19 | Booking, requests, prep, payment state, completion, reviews, assignments |
| `/api/study-rooms/*` | 9 | Room lifecycle, join/leave, presence, moderation |
| `/api/community/*` | 9 | Posts, comments, likes, saves, views, statistics |
| `/api/user/*`, `/api/profile`, `/api/settings/*` | 17 | Profile, security, notifications, heartbeat, rewards, account operations |
| `/api/ai/*`, `/api/ai-notes`, `/api/generate-content` | 5 | AI generation and recent content |
| `/api/resources/*`, `/api/vault/upload` | 4 | Resource marketplace and validated uploads |
| Other public/product groups | 33 | Auth, plans, leaderboards, reviews, tasks, focus, announcements, reports |

### Key endpoint map

- Auth: `/api/auth/[...nextauth]`, `/api/auth/send-otp`, `/api/auth/forgot-password/*`, `/api/register`
- AI: `/api/ai/generate`, `/api/generate-content`, `/api/ai-notes`, `/api/ai/recent-*`
- Mentorship: `/api/sessions/book`, `/api/sessions/[id]/*`, `/api/mentor/*`, `/api/mentors/*`
- Realtime rooms: `/api/study-rooms`, `/api/study-rooms/[roomId]/*`
- Community/chat: `/api/community/*`, `/api/messages`, `/api/chat/conversations/initiate`
- Gamification: `/api/challenges/*`, `/api/badges/my`, `/api/leaderboard`, `/api/store/*`, `/api/user/gamification-stats`
- Marketplace: `/api/resources`, `/api/resources/[id]/purchase`, `/api/resources/[id]/rate`, `/api/vault/upload`
- Administration: `/api/admin/*`

### API implementation checklist

For every new or changed route:

1. Authenticate with `requireRole` or `getServerSession(authOptions)`.
2. Validate role and object ownership/membership server-side.
3. Coerce every request field at runtime; TypeScript types do not validate JSON.
4. Validate MongoDB IDs before querying.
5. Call `connectMongoDB()` before model access.
6. Allowlist update fields; never pass the request body directly into a Mongoose update.
7. Return generic 500 responses and log diagnostics only on the server.
8. Apply both AI controls to AI endpoints: Upstash burst rate limit and `UsageCounter` daily plan quota.
9. Use a transaction for multi-document balance/entitlement operations.

## 7. Gamification architecture

`lib/gamificationEngine.ts` owns the reward dictionary and profile/progress updates. New rewards must use `awardUser()`; do not accept XP or coin values from the browser. `lib/badgeEngine.ts` and `lib/challengeTracker.ts` extend the same event flow.

The dashboard uses compact, bounded gamification layouts:

- Level rings have an explicit SVG `viewBox` and a responsive 112–128 px container.
- Card/grid children set `min-width: 0` to prevent flex/grid overflow.
- Badge cards use a responsive grid and bounded content rather than masonry columns.
- The leaderboard podium uses three fractional columns so it fits narrow screens.
- Large dashboard typography and spacing are capped by the `.app-shell` design system.

## 8. UI design system and responsiveness

Global tokens live in `app/globals.css`.

- Light canvas: warm off-white `#f8f7f4`
- Dark canvas: slate `#0f172a`
- Light cards: white/translucent white
- Dark cards: ink slate `#111827`
- Primary accent: purple `#7C3AED`
- Secondary accent: lavender; mint is reserved for success

Use `.app-shell` for product/admin shells, `.app-page` for bounded page padding, and `.glass-panel` for restrained elevated surfaces. The product shell uses `100dvh`, clips root horizontal overflow, caps oversized dashboard type/spacing, and disables expensive scrolling backdrop blur on mobile.

Semantic expectations:

- One descriptive `h1` per route.
- Use `main`, `nav`, `section`, `article`, `header`, and `footer` according to content structure.
- Buttons perform actions; links navigate.
- Icon-only controls require accessible names.
- Images require meaningful alt text unless decorative.
- Preserve visible keyboard focus and 44 px interactive targets.

Metadata is defined in `app/layout.tsx`; route-specific marketing pages should export their own metadata when their search intent differs.

## 9. Performance

- Dashboard-only modal, tour, and realtime request surfaces are loaded with `next/dynamic`.
- Live video and the Spline hero already use dynamic loading.
- Prefer `next/image` for authored images. Add external image hosts to `next.config.ts` and CSP before use.
- Avoid scroll listeners; use `IntersectionObserver` or Framer Motion viewport APIs.
- Animate `transform` and `opacity`, not layout dimensions.
- Do not apply backdrop blur to large scrolling surfaces.
- Use `Promise.all` for independent server reads and `.lean()` for read-only Mongoose queries.
- Redis is optional. New cache/rate-limit code must continue working when `getRedisClient()` returns `null`.

## 10. Security status

Implemented hardening in this audit:

- Uploads require an authenticated supported role.
- Upload extensions are checked against content signatures before Cloudinary storage.
- Session attachment URLs must belong to the configured Cloudinary account.
- Payment receipt data URLs allow only PNG, JPEG, WebP, or PDF base64 payloads; PDF previews are sandboxed.
- Booking XP is awarded by the server through the reward engine; the client-controlled XP route was removed.
- Chat error responses no longer return internal exception messages.
- Mentor-only checks use the centralized role boundary.

Known production blocker: `/api/user/upgrade` changes paid plans without verification from a trusted payment provider. The current checkout is a product/demo flow, not proof of payment. Before selling subscriptions, integrate a provider such as Stripe and update plans only from a verified, idempotent webhook. Do not treat client card fields or a client-provided plan name as payment authority.

The external Socket.IO bootstrap remains operational infrastructure: plain `next dev`/`next start` does not register `/study-room`, so emit helpers return `false` until `socket-server/` is deployed and connected.

## 11. Environment variables

Keep secrets in `.env.local` locally and in the deployment platform's encrypted environment store in production.

Required groups:

```text
NEXTAUTH_SECRET
NEXTAUTH_URL
MONGODB_URI
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
CLOUDINARY_CLOUD_NAME
CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET
NEXT_PUBLIC_LIVEKIT_URL
LIVEKIT_API_KEY
LIVEKIT_API_SECRET
SMTP_USER
SMTP_PASS
GROQ_API_KEY
```

Optional Redis configuration:

```text
UPSTASH_REDIS_REST_URL
UPSTASH_REDIS_REST_TOKEN
REDIS_URL
```

Never expose server secrets with the `NEXT_PUBLIC_` prefix.

## 12. Local development

Prerequisites: a current Node.js LTS release, npm, and MongoDB access.

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

Quality checks:

```bash
npm run lint
npx tsc --noEmit
npm run build
```

There is no configured automated test runner. Treat type-check, lint, production build, and targeted browser verification as the current release gate.

## 13. Production deployment

1. Provision MongoDB and all required external services.
2. Add environment values to the deployment platform; never commit `.env.local`.
3. Run `npm ci` and `npm run build` with webpack, matching CI/prod.
4. Run `npm run migrate:mentor-role` once against a backed-up database.
5. Start the Next.js output with `npm run start`.
6. Deploy and register the external Socket.IO `/study-room` namespace.
7. Verify CSP origins in `next.config.ts` for every external script, image, media, and connection host.
8. Smoke-test login, AI quotas, uploads, room lifecycle, booking/payment state, rewards, and admin authorization.

The `postbuild` script regenerates `public/sw.js` from `.next/BUILD_ID`; do not hand-edit the generated service worker.

## 14. Maintenance commands

```bash
# Close expired study-partner listings
node scripts/close-expired-study-buddy-listings.mjs

# Consolidate persisted mentor roles/challenge metrics
npm run migrate:mentor-role
```

Review database indexes and dependency advisories before each production release. Use reversible migrations and back up production data before schema/role changes.
