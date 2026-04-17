# Arena Pulse - Project Info

## Technology Stack
- **Core**: Next.js 15+ (App Router), React 19, TypeScript
- **Styling**: Vanilla CSS, TailwindCSS (for utility layout)
- **3D Engine**: Three.js
- **State**: Zustand
- **AI**: Google Gemini (via `@google/generative-ai` and custom REST logic in `gemini.ts`)
- **Backend**: Firebase 12+

## Environment Setup
Project requires the following keys in `.env`:
- `NEXT_PUBLIC_GEMINI_API_KEY`: Primary key
- `NEXT_PUBLIC_GEMINI_API_KEY_2`: Backup key
- `NEXT_PUBLIC_GEMINI_API_KEY_3`: Backup key
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`

## Build & Deployment
- **Local Build**: `npm run build`
- **Docker**: `Dockerfile` is optimized for standalone Next.js.
- **Cloud Run**: Requires `NEXT_PUBLIC_*` variables passed as build args or injected at runtime. Current project: `arena-pulse-f90a6`.

## Global State Actions (Zustand)
Located in `src/store/app-store.ts`.
- `navigate(screen)`: Core navigation
- `back()`: History-based return
- `addNotification(type, title, desc)`: Broadcast system
- `aiSheetOpen()`: Open the global AI chat

## Key Components
- `AISheet`: Global AI concierge overlay.
- `AdminScreen`: Operational control center (login: admin@arenapulse.app / Admin@1234).
- `Stadium3DScreen`: 3D rendering of the pitch using Three.js.
