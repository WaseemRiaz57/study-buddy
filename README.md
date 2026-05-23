# StudyBuddy 🎓🚀 — The Gamified, AI-Powered Social Learning Ecosystem

StudyBuddy is an enterprise-grade, real-time collaborative EdTech SaaS application engineered to eliminate student isolation and streamline peer-to-peer knowledge exchange. Built on top of a highly responsive **Next.js** framework, the platform integrates **Generative AI synthesis**, zero-latency dynamic **WebSockets**, secure marketplace guardrails, and persistent **psychological gamification loops** to transform online studying into an immersive, reward-driven experience.

---

## ⚡ Core Architecture & Engineering Highlights

- **Framework & Rendering:** Next.js App Router utilizing Hybrid Server/Client Component rendering strategies for optimal hydration and lightning-fast Time-to-First-Byte (TTFB).
- **Real-Time Synchronization:** Node.js backend infrastructure powered by Socket.io, handling persistent room states, dynamic participant tracking, and multi-client notification sync.
- **State Hydration & Storage:** Client-side architecture managed via Zustand with deep session persistence layers. Data storage is orchestrated using Mongoose/MongoDB, accompanied by Upstash Redis for high-throughput rate limiting and sub-millisecond gamification checks.
- **Production-Grade Optimization:** Automated Progressive Web App (PWA) configuration delivering a desktop/mobile app experience, coupled with optimized asset delivery strategies that maximize Google Lighthouse scores across Performance, Accessibility, and SEO.

---

## 💎 Key Feature Modules

### 🧠 1. AI Studio & Content Synthesizer
- **Smart Note Generation:** Seamlessly converts raw or unstructured textbook copy into elegantly formatted micro-summaries and interactive study guides.
- **Text Sanitization Layer:** Custom regex-driven sanitization pipelines process and strip raw Markdown leaks (`###`, `**`), providing uniform readability across all device viewports.

### ⏱️ 2. Focus Rooms & Live Analytics
- **Task-Driven Pomodoro:** Integrates a session-synced Zustand To-Do list inside live focus timers to enforce cognitive single-tasking.
- **Data Visualization:** Real-time data aggregation translates Monday-Sunday active focus intervals into beautiful, interactive Recharts graphs, completely eliminating flat or hardcoded dummy metrics.

### 🤝 3. Study With Buddy & Live Rooms
- **Time-To-Live (TTL) Listings:** Implements strict 7-day expiration algorithms for peer collaboration requests via custom background scripts to keep the active directory fresh.
- **Auto-Lifecycle Monitoring:** Socket listeners track zero-participant counts, dynamically cleaning up and shutting down vacant rooms to significantly reduce network resource overhead.

### 👑 4. Global Gamification Engine
- **Behavioral Reinforcement Loops:** Every productive action—including file updates, community interactions, or room sessions—rewards users with XP and virtual Coins.
- **Audio-Visual Feedback:** Integrates robust HTML5 Audio handling wrapped inside error-resilient catch boundaries to play crisp alert chimes smoothly alongside Framer Motion achievement triggers without blocking the core rendering thread.

### 👨‍🏫 5. Managed Mentorship Marketplace
- **Join-Verification Guardrails:** Prevents structural or billing exploits by hard-locking completion controls until a mentor's room connection is officially established and verified in the database.
- **Dynamic Review Synchronization:** Instantly triggers student review modals when a mentor completes a session, feeding directly into a live-updating average rating calculation.

---

## 🛠️ Technological Infrastructure & Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend** | React, Next.js, Tailwind CSS | UI Construction, Theme Interpolation, Engine Routing |
| **State** | Zustand, React Context | Ephemeral Application State & Global UI Store Management |
| **Real-time** | Socket.io Client / Server | Bidirectional Multi-Client Event Pipelines |
| **Database** | MongoDB, Mongoose ODM | Relational Schema Modeling & Data Persistence |
| **Caching** | Upstash Redis | API Rate-Limiting Barriers & High-Speed In-Memory Operations |
| **Security** | NextAuth.js | Role-Based Gating, JWT Authentication, Secure Callbacks |
| **PWA** | `@ducanh2912/next-pwa` | Mobile-Native Caching & Service Worker Operations |

---

## 🔒 Security Posture & Compliance

StudyBuddy is configured to prioritize system integrity and secure cross-origin interaction:
- **HTTP Security Headers:** Hardened against vector attacks via strict injection of `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, and custom `Content-Security-Policy` rule configurations.
- **Rate Limiting Barriers:** Protected endpoints throttle malicious bot actors using dynamic IP and User ID token buckets, enforcing a maximum of 5 AI actions per minute.
- **Middleware Whitelisting:** Strict regex parameters gate underlying core dashboard logic while gracefully granting public access to static manifest components and media buffers.

---

## 🚀 Installation & Local Environment Setup

1. **Clone the repository:**
   ```bash
   git clone [https://github.com/your-username/study-buddy.git](https://github.com/your-username/study-buddy.git)
   cd study-buddy