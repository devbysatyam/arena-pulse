import type { NextConfig } from 'next';

/**
 * NexArena — Next.js Configuration
 *
 * Includes:
 * - Standalone output for optimal Docker/Cloud Run deployment
 * - Strict Content Security Policy (CSP) headers
 * - Security headers following OWASP best practices
 */

// Content Security Policy directives
// Allows only trusted origins for scripts, styles, and API calls
const ContentSecurityPolicy = `
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://maps.googleapis.com https://www.gstatic.com;
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://fonts.gstatic.com;
  font-src 'self' https://fonts.gstatic.com;
  img-src 'self' data: blob: https://maps.gstatic.com https://maps.googleapis.com https://lh3.googleusercontent.com https://www.google-analytics.com;
  connect-src 'self' https://generativelanguage.googleapis.com https://firebase.googleapis.com https://firestore.googleapis.com https://www.googleapis.com https://securetoken.googleapis.com https://identitytoolkit.googleapis.com https://www.google-analytics.com https://region1.google-analytics.com;
  frame-src 'self' https://www.google.com/maps/embed/ https://maps.google.com/;
  object-src 'none';
  base-uri 'self';
  form-action 'self';
`.replace(/\n/g, ' ').trim();

const nextConfig: NextConfig = {
  // Standalone output creates a self-contained build ideal for Docker
  output: 'standalone',

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // Allow Firebase Auth popups
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin-allow-popups' },
          // Prevent clickjacking
          { key: 'X-Frame-Options', value: 'DENY' },
          // Prevent MIME-type sniffing
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          // Force HTTPS
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          // Restrict referrer information
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          // Control browser features
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(self)' },
          // Content Security Policy
          { key: 'Content-Security-Policy', value: ContentSecurityPolicy },
        ],
      },
    ];
  },
};

export default nextConfig;
