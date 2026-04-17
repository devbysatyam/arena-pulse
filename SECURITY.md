# Security Policy: NexArena

This document outlines the security measures and vulnerability disclosure policy for the NexArena platform.

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Security Hardening Measures

NexArena implements industry-standard security practices to protect user data and maintain service integrity:

### 1. Robust Content Security Policy (CSP)
We use strict CSP headers via `next.config.ts` to mitigate Cross-Site Scripting (XSS) and data injection attacks. 
- **Script Restriction**: Scripts are limited totrusted origins: `self`, Google Tag Manager, and Google Maps.
- **Frame Protection**: The application prevents unauthorized framing via `X-Frame-Options: DENY`.

### 2. Firebase Security Rules
Our Firestore security rules follow the principle of least privilege:
- **Public Data**: Limited read-only access to crowd density and global notifications.
- **Admin Data**: Write access strictly restricted to authenticated users verified against an internal `admins/` role collection.
- **User Data**: Private user data is indexed by UID and restricted to the individual user.

### 3. Authentication & Rate Limiting
- **Brute Force Protection**: The Admin login flow implements a lockout mechanism (3 failed attempts → 30sec cooling period).
- **Session Management**: Handled via Firebase Authentication with secure tokens.

### 4. Artificial Intelligence Safety (Gemini)
- **Input Sanitization**: All user-provided queries are sanitized through a multi-stage regex filter (removing script/style tags) before being sent to the Gemini API.
- **Safety Filters**: We leverage Google Gemini's built-in safety filters to prevent harmful content generation.

### 5. Dependency Hygiene
We use `npm audit` and standard dependency scanning to ensure all third-party libraries (Three.js, Next.js, Framer Motion) are up to date and free from known vulnerabilities.

## Reporting a Vulnerability

If you discover a security vulnerability, please do NOT create a public issue. Email the project maintainer directly so we can coordinate a fix before public disclosure.

---
*Created for the Hack2Skill PromptWars Submission.*
