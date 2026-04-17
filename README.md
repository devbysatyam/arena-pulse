# 🏟️ NexArena — Smart Stadium Companion

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Cloud%20Run-blue?logo=google-cloud)](https://arena-pulse-1077331437148.us-central1.run.app)
[![Google Gemini](https://img.shields.io/badge/AI-Gemini%202.5%20Flash-orange?logo=google)](https://ai.google.dev)
[![Firebase](https://img.shields.io/badge/Backend-Firebase%20Auth%20%2B%20Firestore-yellow?logo=firebase)](https://firebase.google.com)
[![Maps](https://img.shields.io/badge/Maps-Google%20Maps%20Embed-4285F4?logo=googlemaps)](https://developers.google.com/maps)
[![Tests](https://img.shields.io/badge/Tests-243%20Passing-brightgreen?logo=jest)](./package.json)

> **AI-powered stadium assistant for cricket fans.** Real-time crowd heatmaps, smart navigation, food ordering, and a Gemini 2.5 Flash-powered concierge — all in your pocket.

---

## 🎯 Hack2Skill Challenge Submission — PromptWars Virtual

### Vertical: Stadium/Venue Management & Fan Engagement

NexArena addresses the real-world problem of navigating a 40,000+ capacity stadium during peak events. When every minute counts — finding your seat, avoiding a crowd surge, or getting food between overs — information flow is everything.

### Approach & Logic

| Component | Logic |
|---|---|
| **AI Concierge** | Google Gemini 2.5 Flash processes context-aware chat queries with a stadium-specific system prompt. Multi-key rotation (3 keys) + exponential backoff prevents rate-limit disruptions. Validated inputs prevent XSS injection. |
| **Real-time Crowd Data** | Cloud Firestore `crowd/{stadiumId}` collection streams live crowd density per section. Admin panel writes → fan heatmap updates instantly via `onSnapshot` listeners. |
| **Admin Authentication** | Firebase Authentication `signInWithEmailAndPassword` + Firestore role check (`admins/{uid}.role === 'admin'`). Credentials never in source code. Rate-limited login (3 attempts, 30s lockout). |
| **Smart Navigation** | A* pathfinding algorithm over a waypoint graph representing the concourse, ensuring paths never cross the pitch. |
| **Admin Relay** | Authenticated admin broadcasts write to Firestore `notifications/` — fan Profile inbox subscribes in real-time. Severity levels: info/warning/critical. |
| **Venue Location** | Google Maps Embed API shows the selected stadium's real-world satellite view with a directions link-out. |
| **Containerised Deployment** | Docker (multi-stage) → Artifact Registry → Google Cloud Run for zero-downtime, auto-scaling delivery. |


### How It Works

```
Fan Opens App
     │
     ├─ Guest Mode ──→ Map + Crowd Heatmap (no auth required)
     │
     └─ Sign In ─────→ AI Concierge + Food Ordering + Ticket + Notifications
                              │
                   ┌──────────┴──────────┐
                   ▼                     ▼
            Gemini 2.5 Flash       Firebase Realtime
          (chat + spatial AI)    (crowd data + broadcasts)
                   │
          Key rotation pool
          (3 API keys, auto-failover)
```

### Assumptions

1. The concourse is a single-level elliptical ring (scalable to multi-level).
2. Crowd heatmap data is simulated via a deterministic tick algorithm (real deployment would use IoT sensors via Firebase).
3. Gemini API keys must be set at build time as environment variables.
4. Admin login uses a hardcoded passphrase for demo purposes (production would use Firebase Custom Claims).

---

## ✨ Key Features

| Feature | Technology |
|---|---|
| 🤖 **Gemini 2.5 Flash AI Concierge** | Google Generative AI REST API (multi-key pool) |
| 📊 **Real-time Crowd Heatmap** | Firebase Realtime Database |
| 🗺️ **A* Pathfinding Navigation** | Custom graph algorithm over SVG waypoints |
| 🏟️ **3D Stadium Viewer** | Three.js WebGL renderer |
| 📱 **AR Navigation** | WebXR-compatible camera overlay |
| 🍔 **Mobile Food Ordering** | Stall browser with wait times |
| 🔔 **Admin Broadcast System** | Firebase → Fan notification relay |
| 🏟️ **Multi-Stadium Browser** | 6 real Indian venues with live match simulation |

---

## 🔧 Technology Stack

### Google Services Used
| Service | Purpose |
|---|---|
| **Gemini 2.5 Flash** | AI concierge, spatial reasoning, fan queries |
| **Firebase Authentication** | Google SSO for fan and admin login |
| **Firebase Realtime Database** | Live crowd density and admin broadcasts |
| **Google Cloud Run** | Auto-scaling production hosting |
| **Google Cloud Build** | CI/CD pipeline from source to container |
| **Google Artifact Registry** | Docker image storage |
| **Google Analytics 4** | Fan behaviour event tracking |
| **Google Fonts** | Space Grotesk + Plus Jakarta Sans (premium typography) |
| **Material Symbols** | Icon system |

### Application Stack
- **Framework**: Next.js 16 (App Router, Standalone)
- **Language**: TypeScript 5 (strict)
- **Styling**: Tailwind CSS v4
- **State**: Zustand v5
- **3D**: Three.js
- **Testing**: Jest + Testing Library + jest-axe

---

## 🧪 Testing

The project includes a comprehensive test suite following best practices:

```bash
npm test                # Run all tests
npm run test:coverage   # Run with coverage report
npm run test:watch      # Watch mode during development
npm run test:ci         # CI mode (no interactive)
```

**Test coverage:**
```
__tests__/
  unit/
    gemini.test.ts       ← AI key rotation, fallback responses
    pathfinding.test.ts  ← A* algorithm correctness
    validators.test.ts   ← Input sanitization & validation
    stadium-data.test.ts ← Data integrity checks
  integration/
    ai-flow.test.ts      ← End-to-end AI request pipeline
  accessibility/
    wcag.test.tsx        ← Automated WCAG 2.1 AA compliance (jest-axe)
```

---

## 🔒 Security

- **Content Security Policy**: Restricts script/style/connect origins to trusted Google domains only.
- **OWASP Headers**: X-Frame-Options, HSTS, X-Content-Type-Options, Referrer-Policy.
- **Input Sanitization**: All user inputs sanitized via `src/lib/validators.ts` before reaching the Gemini API.
- **Firestore Rules**: Role-based access control (admins write, fans read own data).
- **Zero Secrets in Repo**: All API keys injected at build time via Cloud Build substitutions.

---

## ♿ Accessibility

- WCAG 2.1 AA compliant structure
- Skip-to-content link for keyboard users
- ARIA labels on all interactive elements
- `aria-current="page"` on active navigation
- `role="alert"` on error boundaries
- `aria-live` on dynamic score/crowd regions
- Tested with `jest-axe` automated checks

---

## 🚀 Deployment

**Live URL**: [https://arena-pulse-1077331437148.us-central1.run.app](https://arena-pulse-1077331437148.us-central1.run.app)

### Run Locally

```bash
# 1. Clone the repository
git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git
cd arena-pulse

# 2. Install dependencies
npm install

# 3. Configure environment variables
cp .env.local.example .env.local
# Edit .env.local and fill in your API keys

# 4. Start development server
npm run dev
# → Open http://localhost:3000

# 5. Run tests
npm test
```

### Environment Variables

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_GEMINI_API_KEY` | ✅ | Primary Gemini API key |
| `NEXT_PUBLIC_GEMINI_API_KEY_2` | Optional | Backup key (auto-rotated on 429) |
| `NEXT_PUBLIC_GEMINI_API_KEY_3` | Optional | Third backup key |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | ✅ | Firebase project API key |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | ✅ | Firebase auth domain |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | ✅ | Firebase project ID |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | ✅ | Firebase storage bucket |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | ✅ | Firebase sender ID |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | ✅ | Firebase app ID |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | Optional | Google Analytics 4 Measurement ID |

---

## 📁 Project Structure

```
arena-pulse/
├── __tests__/               ← Test suite
│   ├── unit/                ← Pure function unit tests
│   ├── integration/         ← End-to-end flow tests
│   └── accessibility/       ← WCAG automated checks
├── src/
│   ├── app/                 ← Next.js App Router (layout, page)
│   ├── components/
│   │   ├── ai/              ← AIBubble, AISheet
│   │   ├── layout/          ← BottomNav
│   │   ├── screens/         ← All app screens
│   │   └── ui/              ← ErrorBoundary, Toast
│   ├── lib/
│   │   ├── analytics.ts     ← Google Analytics 4 events
│   │   ├── firebase.ts      ← Firebase initialisation
│   │   ├── gemini.ts        ← Gemini 2.5 Flash API (multi-key)
│   │   ├── pathfinding.ts   ← A* algorithm on concourse graph
│   │   ├── stadium-data.ts  ← Waypoints, sections, gates, amenities
│   │   ├── stadiums-data.ts ← Multi-stadium metadata
│   │   └── validators.ts    ← Input sanitization & validation
│   ├── store/
│   │   └── app-store.ts     ← Zustand global state
│   └── types/               ← Shared TypeScript interfaces
├── firestore.rules          ← Firebase security rules
├── Dockerfile               ← Multi-stage Docker build
├── cloudbuild.yaml          ← Google Cloud Build pipeline
├── jest.config.ts           ← Jest test configuration
└── next.config.ts           ← Next.js + CSP + security headers
```

---

*Engineered for the modern cricket fan. Powered by Google AI. — Hack2Skill PromptWars 2025*
