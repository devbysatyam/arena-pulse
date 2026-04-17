# Stage 1: Dependencies
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json ./
RUN npm install

# Stage 2: Builder
# NEXT_PUBLIC_* vars must be declared as ARGs so Next.js can bake them
# into the browser bundle at build time.
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Declare build-time env vars (pass with --build-arg in CI / Cloud Build)
ARG NEXT_PUBLIC_GEMINI_API_KEY=""
ARG NEXT_PUBLIC_GEMINI_API_KEY_2=""
ARG NEXT_PUBLIC_GEMINI_API_KEY_3=""
ARG NEXT_PUBLIC_FIREBASE_API_KEY=""
ARG NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=""
ARG NEXT_PUBLIC_FIREBASE_PROJECT_ID=""
ARG NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=""
ARG NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=""
ARG NEXT_PUBLIC_FIREBASE_APP_ID=""
ARG NEXT_PUBLIC_MAPS_API_KEY=""
ARG NEXT_PUBLIC_GA_MEASUREMENT_ID=""

# Expose them as env vars so Next.js picks them up during build
ENV NEXT_PUBLIC_GEMINI_API_KEY=$NEXT_PUBLIC_GEMINI_API_KEY
ENV NEXT_PUBLIC_GEMINI_API_KEY_2=$NEXT_PUBLIC_GEMINI_API_KEY_2
ENV NEXT_PUBLIC_GEMINI_API_KEY_3=$NEXT_PUBLIC_GEMINI_API_KEY_3
ENV NEXT_PUBLIC_FIREBASE_API_KEY=$NEXT_PUBLIC_FIREBASE_API_KEY
ENV NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=$NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
ENV NEXT_PUBLIC_FIREBASE_PROJECT_ID=$NEXT_PUBLIC_FIREBASE_PROJECT_ID
ENV NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=$NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
ENV NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=$NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
ENV NEXT_PUBLIC_FIREBASE_APP_ID=$NEXT_PUBLIC_FIREBASE_APP_ID
ENV NEXT_PUBLIC_MAPS_API_KEY=$NEXT_PUBLIC_MAPS_API_KEY
ENV NEXT_PUBLIC_GA_MEASUREMENT_ID=$NEXT_PUBLIC_GA_MEASUREMENT_ID

ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# Stage 3: Runner (minimal production image)
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
RUN mkdir .next && chown nextjs:nodejs .next

# Standalone output (set in next.config.ts)
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000

CMD ["node", "server.js"]
