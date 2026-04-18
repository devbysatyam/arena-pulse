# NexArena — Smart Stadium Companion

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Cloud%20Run-blue?logo=google-cloud)](https://arena-pulse-1077331437148.us-central1.run.app)
[![Google Gemini](https://img.shields.io/badge/AI-Gemini%202.5%20Flash-orange?logo=google)](https://ai.google.dev)
[![Firebase](https://img.shields.io/badge/Backend-Firebase%20Auth%20%2B%20Firestore-yellow?logo=firebase)](https://firebase.google.com)
[![Maps](https://img.shields.io/badge/Maps-Google%20Maps%20Embed-4285F4?logo=googlemaps)](https://developers.google.com/maps)
[![Tests](https://img.shields.io/badge/Tests-260%2B%20Passing-brightgreen?logo=jest)](./package.json)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict-3178c6?logo=typescript)](./tsconfig.json)
[![License](https://img.shields.io/badge/License-MIT-green)](./LICENSE)

> **AI-powered stadium assistant for live event fans.** Real-time crowd intelligence, A\* pathfinding navigation, food ordering, 3D venue viewer, and a Gemini 2.5 Flash-powered concierge — all in a mobile-first PWA.

---

## Hack2Skill PromptWars — Submission

**Vertical:** Stadium / Venue Management & Fan Engagement

### The Problem

Navigating a 40,000-seat stadium during a live event is chaotic. Fans struggle to find their seats, avoid crowd surges, locate food stalls, and exit efficiently. Traditional venue apps provide static maps with no live intelligence.

### The Solution

NexArena fuses **real-time crowd data from Firebase**, **AI spatial reasoning from Gemini 2.5 Flash**, and **A\* graph pathfinding** to give every fan a personalised, context-aware stadium companion that updates live as the crowd moves.

---

## Live Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Fan / Browser (PWA)                     │
│  Next.js 16 · React 19 · TypeScript 5 · Zustand · Three.js │
└──────────────────────────────┬──────────────────────────────┘
                               │
            ┌──────────────────┼──────────────────┐
            ▼                  ▼                  ▼
   ┌────────────────┐  ┌──────────────┐  ┌────────────────────┐
   │  Gemini 2.5    │  │  Firebase    │  │  Google Maps       │
   │  Flash REST    │  │  Auth +      │  │  Embed API         │
   │  (multi-key    │  │  Firestore   │  │  (real satellite   │
   │   pool)        │  │  (real-time) │  │   venue view)      │
   └────────────────┘  └──────────────┘  └────────────────────┘
            │                  │
            ▼                  ▼
   ┌────────────────┐  ┌──────────────┐
   │  Google        │  │  Cloud Run   │
   │  Analytics 4   │  │  (container) │
   └────────────────┘  └──────────────┘
```

### Component Architecture

```
src/
├── app/
│   ├── layout.tsx          # Root layout: fonts, GA4, WCAG skip-link, metadata
│   └── page.tsx            # App shell: SCREEN_MAP router + crowd tick interval
│
├── components/
│   ├── ai/
│   │   ├── AIBubble.tsx    # Floating action button for AI concierge
│   │   └── AISheet.tsx     # Full-screen chat overlay (Gemini integration)
│   ├── layout/
│   │   └── BottomNav.tsx   # Persistent tab bar (home, map, food, ticket, profile)
│   ├── screens/            # One component per app screen (21 screens total)
│   │   ├── HomeScreen.tsx        # Live match feed, crowd summary, quick actions
│   │   ├── Map2DScreen.tsx       # SVG venue map with A* path overlay
│   │   ├── HeatmapScreen.tsx     # Live crowd density heatmap (Firestore stream)
│   │   ├── Stadium3DScreen.tsx   # Three.js WebGL pitch renderer
│   │   ├── ARNavScreen.tsx       # WebXR camera overlay navigation
│   │   ├── FoodScreen.tsx        # Stall browser with live wait times
│   │   ├── AdminScreen.tsx       # Ops dashboard (broadcast, heatmap control)
│   │   └── ...                   # 14 more screens
│   └── ui/
│       ├── ErrorBoundary.tsx     # React class component, catches render errors
│       └── Toast.tsx             # Accessible notification system
│
├── lib/
│   ├── analytics.ts        # GA4 event tracking (typed gtag wrappers)
│   ├── firebase.ts         # Singleton Firebase init (Firestore + Auth)
│   ├── firestore-service.ts # CRUD helpers with typed Firestore operations
│   ├── gemini.ts           # Gemini REST client: multi-key pool, backoff, fallback
│   ├── logger.ts           # Structured logger: levels, context, prod suppression
│   ├── pathfinding.ts      # A* on concourse waypoint graph (SVG-coord space)
│   ├── rate-limit.ts       # Token-bucket client-side rate limiter
│   ├── stadium-data.ts     # Waypoints, sections, gates, amenities (static graph)
│   ├── stadiums-data.ts    # Multi-stadium metadata (6 Indian venues)
│   ├── stadium-utils.ts    # Pure helpers: crowd labels, exit finder, ETA
│   ├── three-stadium-builder.ts # Three.js scene builder for 3D view
│   └── validators.ts       # Input sanitisation + validation (XSS-safe)
│
├── store/
│   └── app-store.ts        # Zustand global state (navigation, cart, auth, AI)
│
└── types/
    └── index.ts            # Re-exports all domain types for clean imports
```

---

## Google Services Integration

| Service | Purpose | Implementation |
|---|---|---|
| **Gemini 2.5 Flash** | AI concierge, spatial reasoning, crowd queries | `src/lib/gemini.ts` — multi-key pool with exponential backoff |
| **Firebase Authentication** | Google SSO + Email/Password for fans and admin | `src/lib/firebase.ts` — singleton Auth with GoogleAuthProvider |
| **Cloud Firestore** | Live crowd density, admin broadcasts, notifications | `src/lib/firestore-service.ts` — `onSnapshot` real-time listeners |
| **Google Analytics 4** | Fan behaviour events (AI queries, map views, orders) | `src/lib/analytics.ts` — typed gtag wrappers |
| **Google Fonts** | Space Grotesk (headlines) + Plus Jakarta Sans (body) | `src/app/layout.tsx` — Next.js font optimisation |
| **Material Symbols** | Icon system across all screens | Layout head link (display: block, preload) |
| **Google Maps Embed** | Real-world satellite view of selected stadium | `VenueMapScreen.tsx` — iframe with CSP allow |
| **Google Cloud Run** | Auto-scaling container hosting | `Dockerfile` + `cloudbuild.yaml` |
| **Google Cloud Build** | CI/CD pipeline: test → build → push → deploy | `cloudbuild.yaml` |
| **Google Artifact Registry** | Docker image storage for Cloud Run | Configured in `cloudbuild.yaml` |

---

## Key Features

| Feature | Technology | File |
|---|---|---|
| **AI Concierge** | Gemini 2.5 Flash REST + multi-key failover | `src/lib/gemini.ts` |
| **Live Crowd Heatmap** | Firestore `onSnapshot` streaming | `src/components/screens/HeatmapScreen.tsx` |
| **A\* Pathfinding** | Custom MinHeap + waypoint graph | `src/lib/pathfinding.ts` |
| **3D Stadium** | Three.js WebGL with .dae model | `src/lib/three-stadium-builder.ts` |
| **AR Navigation** | WebXR camera overlay | `src/components/screens/ARNavScreen.tsx` |
| **Food Ordering** | Cart → order → live status tracking | `FoodScreen` → `CartScreen` → `OrderTrackScreen` |
| **Admin Broadcast** | Firebase write → fan inbox (real-time) | `src/components/screens/AdminScreen.tsx` |
| **Multi-Stadium Browser** | 6 Indian venues with live match simulation | `src/lib/stadiums-data.ts` |
| **Rate Limiting** | Token-bucket (5 msg/10s AI, 3 orders/30s) | `src/lib/rate-limit.ts` |
| **Structured Logging** | Level-based, context-aware, prod-safe | `src/lib/logger.ts` |

---

## How the AI Concierge Works

```
User message
    │
    ▼
validateAIMessage()      ← strips HTML, enforces 500-char limit
    │
    ▼
aiChatLimiter.consume()  ← token-bucket: 5 msgs per 10s
    │
    ▼
askGemini(msg, history)
    │
    ├── Key pool: [KEY_1, KEY_2, KEY_3]
    │   On 429/503 → rotate to next key (500ms delay)
    │   On all exhausted → exponential backoff (1s, 2s)
    │   On network error → try next key
    │
    ├── Request body:
    │   system_instruction: stadium context (seat, stalls, crowd, score)
    │   contents: last 6 messages + current message
    │   generationConfig: { temperature: 0.7, maxOutputTokens: 200 }
    │
    └── On all failures → generateFallbackResponse()
            keyword matching for: seat, food, WC, exit, crowd, score
```

---

## Pathfinding Algorithm

NexArena implements **A\*** over a waypoint graph representing the concourse:

- **Nodes**: Named waypoints (outer concourse `O0–O11`, section entries `SA1–SA6`, gates `GC`, `GN`, etc.)
- **Edges**: Weighted by estimated walking time in seconds
- **Heuristic**: Euclidean distance scaled to seconds (`× 0.3`)
- **Constraint**: Graph only connects concourse nodes — paths **never cross the pitch**
- **Output**: `PathResult` with `path[]`, `coords[]`, `totalWeight` (seconds), SVG bezier string

```typescript
// Usage
import { routeBetween, formatETA } from '@/lib/pathfinding';

const result = routeBetween('Gate C', 'Section A2');
// → { found: true, path: ['GC', 'O2', 'SA2'], totalWeight: 42, coords: [...] }
console.log(formatETA(result.totalWeight)); // → "1 min"
```

---

## Security Implementation

| Control | Detail |
|---|---|
| **Content Security Policy** | Allowlist-only: scripts, styles, connect restricted to Google domains |
| **OWASP Headers** | X-Frame-Options DENY, HSTS 2yr, nosniff, Referrer-Policy strict |
| **Input Sanitisation** | All user inputs pass through `sanitizeText()` before Gemini/Firebase |
| **Firestore Rules** | Role-based: admins write crowd/notifications, fans read own data only |
| **Rate Limiting** | Client-side token-bucket prevents API spam before network hit |
| **Zero Secrets in Repo** | All keys injected at build time via Cloud Build `--substitutions` |
| **Admin Auth** | Firebase `signInWithEmailAndPassword` + Firestore role check |
| **Login Throttle** | 3 failed attempts → 30s lockout (client-enforced) |

---

## Accessibility (WCAG 2.1 AA)

- Skip-to-content link (`<a href="#main-content">`) for keyboard users
- `lang="en"` on `<html>` element
- `aria-current="page"` on active bottom-nav item
- `role="alert"` + `aria-live="assertive"` on ErrorBoundary fallback
- `aria-live="polite"` on dynamic crowd/score regions
- `aria-label` on all icon-only buttons
- `aria-hidden="true"` on decorative emoji
- All colour contrast ratios verified ≥ 4.5:1
- Automated WCAG checks via `jest-axe` in CI

---

## Testing

```bash
npm test                    # Run all tests (Jest)
npm run test:coverage       # Run with Istanbul coverage report
npm run test:watch          # Watch mode for TDD
npm run test:ci             # CI mode (no TTY, coverage, reporters)
npm run type-check          # TypeScript strict type check (no emit)
npm run lint                # Next.js ESLint with custom rules
npm run lint:strict         # ESLint with --max-warnings 0 (zero tolerance)
```

**Test suite structure (260+ tests across 16 files):**

```
__tests__/
  unit/
    analytics.test.ts       ← GA4 event tracking, trackError, trackPerformance
    gemini.test.ts          ← AI key rotation, fallback responses, network errors
    pathfinding.test.ts     ← A* correctness, ETA formatting, SVG path generation
    validators.test.ts      ← Input sanitisation, XSS prevention, email validation
    rate-limit.test.ts      ← Token bucket: consume, refill, reset, pre-configured
    logger.test.ts          ← Log levels, context serialisation, format consistency
    stadium-data.test.ts    ← Waypoint integrity, graph connectivity
    stadium-utils.test.ts   ← Crowd labels, exit finder, amenity filter, wait times
    sanitize.test.ts        ← Standalone sanitisation edge cases
    cloud-functions.test.ts ← Firestore write/read simulation
    firestore.test.ts       ← Firestore service CRUD operations
    firestore-advanced.test.ts ← onSnapshot listeners, batch writes
    web-vitals.test.ts      ← Core Web Vitals reporting integration
  integration/
    ai-flow.test.ts         ← Full AI request pipeline (send → validate → respond)
    chat.test.ts            ← Chat history management and role mapping
  accessibility/
    wcag.test.tsx           ← Automated WCAG 2.1 AA via jest-axe
```

---

## Technology Stack

| Layer | Technology | Version |
|---|---|---|
| Framework | Next.js (App Router, Standalone) | 16.2.4 |
| Language | TypeScript (strict mode) | 5.x |
| UI | React | 19.2.4 |
| Styling | Tailwind CSS | 4.x |
| State | Zustand | 5.x |
| 3D | Three.js | 0.183.x |
| Animation | Framer Motion | 12.x |
| Icons | Lucide React | 1.x |
| Testing | Jest + Testing Library + jest-axe | 29.x |

---

## Project Structure

```
arena-pulse/
├── __tests__/               ← Comprehensive test suite (unit/integration/a11y)
├── __mocks__/               ← Jest file/style mocks
├── design/                  ← Figma/Stitch design references per screen
├── modern-stadium/          ← Three.js .dae model + textures
├── public/
│   └── manifest.json        ← PWA manifest (theme, icons, display: standalone)
├── src/
│   ├── app/                 ← Next.js App Router (layout.tsx, page.tsx)
│   ├── components/          ← UI components (ai/, layout/, screens/, ui/)
│   ├── lib/                 ← Pure utilities and API clients
│   ├── store/               ← Zustand global state
│   └── types/               ← Shared TypeScript re-exports
├── .env.local.example       ← Environment variable template
├── .dockerignore            ← Docker build exclusions
├── cloudbuild.yaml          ← Google Cloud Build pipeline
├── Dockerfile               ← Multi-stage build (deps → builder → runner)
├── eslint.config.mjs        ← ESLint with Next.js + strict TypeScript rules
├── firestore.rules          ← Firebase security rules (role-based)
├── jest.config.ts           ← Jest with ts-jest, path aliases, jsdom
├── next.config.ts           ← Next.js config with CSP + security headers
├── package.json             ← Scripts: dev, build, test, lint, type-check
└── tsconfig.json            ← TypeScript strict, path alias @/* → src/*
```

---

## Run Locally

```bash
# 1. Clone
git clone <repo-url>
cd arena-pulse

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.local.example .env.local
# Edit .env.local — fill in all required keys (see below)

# 4. Start dev server
npm run dev
# → http://localhost:3000

# 5. Run tests
npm test

# 6. Type check
npm run type-check
```

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_GEMINI_API_KEY` | Yes | Primary Gemini API key |
| `NEXT_PUBLIC_GEMINI_API_KEY_2` | Optional | Backup key (auto-rotated on 429) |
| `NEXT_PUBLIC_GEMINI_API_KEY_3` | Optional | Third backup key |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Yes | Firebase project API key |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Yes | `<project>.firebaseapp.com` |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Yes | Firebase project ID |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Yes | `<project>.appspot.com` |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Yes | Firebase sender ID |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Yes | Firebase app ID |
| `NEXT_PUBLIC_MAPS_API_KEY` | Optional | Google Maps Embed API key |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | Optional | GA4 Measurement ID (e.g. `G-XXXXXXXX`) |

---

## Deployment — Google Cloud Run

The application is containerised with a **multi-stage Dockerfile** and deployed via **Google Cloud Build**.

### Dockerfile Stages

| Stage | Base | Purpose |
|---|---|---|
| `deps` | `node:20-alpine` | Install npm dependencies cleanly |
| `builder` | `node:20-alpine` | Run `next build` with `NEXT_PUBLIC_*` baked in |
| `runner` | `node:20-alpine` | Minimal image: standalone output only, non-root user |

### Cloud Build Pipeline (`cloudbuild.yaml`)

```
1. npm ci --quiet           ← Reproducible install from package-lock.json
2. npm run type-check       ← TypeScript strict validation
3. npm test -- --ci         ← Full test suite (fails build on any failure)
4. docker build             ← Multi-stage, --build-arg for all NEXT_PUBLIC_* vars
5. docker push              ← Artifact Registry
6. gcloud run deploy        ← Zero-downtime rolling deploy to Cloud Run
```

### Deploy manually

```bash
gcloud builds submit \
  --config cloudbuild.yaml \
  --substitutions \
    _GEMINI_KEY="your-key",\
    _FIREBASE_API_KEY="your-key",\
    _FIREBASE_PROJECT_ID="your-project-id"
```

---

## Code Quality Standards

- **TypeScript strict mode** — `noImplicitAny`, `strictNullChecks`, all enabled
- **Zero `any` in production code** — enforced by ESLint `@typescript-eslint/no-explicit-any: error`
- **Prefer `const`** — ESLint `prefer-const: error`
- **Strict equality** — ESLint `eqeqeq: error`
- **No unused imports** — ESLint `@typescript-eslint/no-unused-vars: error`
- **Structured logger** — `console.*` replaced by `src/lib/logger.ts` throughout
- **Single-responsibility modules** — each `src/lib/*.ts` file exports one concern
- **Typed state** — Zustand store uses strict interface, no `any` types
- **Screen router pattern** — `SCREEN_MAP: Record<Screen, ComponentType>` in `page.tsx` eliminates conditional rendering chains

---

*Built for the modern live-event fan. Powered by Google AI and Firebase. — Hack2Skill PromptWars 2025*
