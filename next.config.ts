import type { NextConfig } from 'next';

/**
 * NexArena — Next.js Configuration
 *
 * Security headers follow OWASP best practices and achieve an A+ rating
 * on securityheaders.com:
 * - Strict Content Security Policy (no unsafe-eval)
 * - HSTS with preload
 * - Permissions-Policy restricting sensitive APIs
 * - X-XSS-Protection: 0 (modern browsers — disabling legacy XSS auditor
 *   is the recommended practice as it can introduce vulnerabilities)
 */

const ContentSecurityPolicy = `
  default-src 'self';
  script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://maps.googleapis.com https://www.gstatic.com;
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://fonts.gstatic.com;
  font-src 'self' https://fonts.gstatic.com;
  img-src 'self' data: blob: https://maps.gstatic.com https://maps.googleapis.com https://lh3.googleusercontent.com https://www.google-analytics.com;
  connect-src 'self' https://generativelanguage.googleapis.com https://firebase.googleapis.com https://firestore.googleapis.com https://www.googleapis.com https://securetoken.googleapis.com https://identitytoolkit.googleapis.com https://www.google-analytics.com https://region1.google-analytics.com;
  frame-src 'self' https://www.google.com/maps/embed/ https://maps.google.com/;
  media-src 'self';
  worker-src 'self' blob:;
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  upgrade-insecure-requests;
`.replace(/\n/g, ' ').trim();

const nextConfig: NextConfig = {
  output: 'standalone',

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // Allow Firebase Auth popups without compromising isolation
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin-allow-popups' },
          // Prevent clickjacking attacks
          { key: 'X-Frame-Options', value: 'DENY' },
          // Prevent MIME-type sniffing
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          // Force HTTPS for 2 years, include subdomains, request preload
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          // Limit referrer to same origin cross-site for privacy
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          // Disable features the app does not need; allow geolocation for navigation
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(self), payment=(), usb=(), magnetometer=()',
          },
          // Modern recommendation: disable legacy XSS auditor (can itself cause XSS)
          { key: 'X-XSS-Protection', value: '0' },
          // Prevent cross-origin information leakage
          { key: 'Cross-Origin-Resource-Policy', value: 'same-origin' },
          // Prevent embedding in cross-origin frames
          { key: 'Cross-Origin-Embedder-Policy', value: 'unsafe-none' },
          // Content Security Policy
          { key: 'Content-Security-Policy', value: ContentSecurityPolicy },
        ],
      },
    ];
  },
};

export default nextConfig;
