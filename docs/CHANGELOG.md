# Changelog

All notable changes to the CSIRO Low-Carb Diet App will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.2.0] - 2026-01-20

### Added
- **Google OAuth Authentication**: Replaced email/password auth with Google Sign-In
  - Google Identity Services (GIS) integration for frontend
  - Server-side ID token verification using `google-auth-library`
  - Role-based access control (user/admin) based on email whitelist
  - Admin emails: `ayan.m.sasmal@gmail.com`
  - User profile data (name, picture) synced from Google on each login
- `POST /api/auth/google` endpoint for Google OAuth authentication
- `backend/docs/GOOGLE_AUTH.md` - Comprehensive Google OAuth documentation with Mermaid diagrams
- `backend/src/modules/auth/dto/google-auth.dto.ts` - Google credential validation DTO

### Changed
- **Database Schema**: Updated User model
  - Removed `passwordHash` field (no longer storing passwords)
  - Added `googleId` field (unique identifier from Google's `sub` claim)
  - Added `name` field (synced from Google profile)
  - Added `picture` field (Google profile picture URL)
  - Added `role` field (user/admin)
- Updated `docs/ARCHITECTURE.md` with Google OAuth flow diagrams
- Updated `docs/SECURITY_DOCUMENTATION.md` with OAuth security model
- Updated `CLAUDE.md` with Google OAuth implementation details
- Updated `backend/.env.example` with Google OAuth placeholders
- Updated Postman collection for new auth flow

### Removed
- `POST /api/auth/register` endpoint (no longer needed with Google OAuth)
- `POST /api/auth/login` endpoint (replaced by `/api/auth/google`)
- `backend/src/modules/auth/dto/register.dto.ts`
- `backend/src/modules/auth/dto/login.dto.ts`
- Password hashing with bcrypt (no local passwords)

### Security
- Eliminated password storage vulnerabilities by using Google OAuth
- Added cryptographic token verification for Google ID tokens
- Implemented audience validation to ensure tokens are issued for our app
- Using Google's `sub` claim (immutable) instead of email for user identity

## [0.1.0] - 2026-01-18

### Added
- **MVP-0 Backend Implementation**
  - NestJS 10+ backend with TypeScript strict mode
  - Prisma 7 ORM with SQLite (LibSQL adapter)
  - JWT authentication with protected routes
  - User profile management with BMR/BMI calculations (Mifflin-St Jeor equation)
  - Weight tracking (1 entry/day, upsert behavior)
  - Glucose tracking (multiple entries/day, fasting/post_meal/random types)
  - Health check endpoints (liveness/readiness probes)
  - OpenAPI/Swagger documentation at `/api/docs`
  - Postman collection with Newman CLI testing

### API Endpoints (MVP-0)
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `POST /api/users/profile` - Create user profile
- `GET /api/users/profile` - Get user profile
- `PATCH /api/users/profile` - Update user profile
- `POST /api/tracking/weight` - Log weight
- `GET /api/tracking/weight` - Get weight history
- `GET /api/tracking/weight/:date` - Get weight for specific date
- `DELETE /api/tracking/weight/:date` - Delete weight entry
- `POST /api/tracking/glucose` - Log glucose reading
- `GET /api/tracking/glucose` - Get glucose history
- `GET /api/tracking/glucose/:date` - Get glucose for specific date
- `DELETE /api/tracking/glucose/:id` - Delete glucose entry
- `GET /api/health` - Full health check
- `GET /api/health/live` - Liveness probe
- `GET /api/health/ready` - Readiness probe

### Documentation
- `docs/ARCHITECTURE.md` - System architecture diagrams
- `docs/SECURITY_DOCUMENTATION.md` - Security model and OWASP mitigations
- `docs/SOLUTION_ON_A_PAGE.md` - Executive summary
- `docs/DELIVERY_PLAN.md` - 26-week implementation roadmap
- `backend/docs/POSTMAN_NEWMAN_GUIDE.md` - API testing guide
- `CLAUDE.md` - AI assistant context file

---

[Unreleased]: https://github.com/username/low-carb-diet-app/compare/v0.2.0...HEAD
[0.2.0]: https://github.com/username/low-carb-diet-app/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/username/low-carb-diet-app/releases/tag/v0.1.0
