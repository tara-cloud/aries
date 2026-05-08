# Aries App

## Stack
- Next.js 15 App Router, TypeScript, Tailwind CSS
- Ant Design (antd) for UI components
- Prisma 7 ORM → PostgreSQL 16
- NextAuth v5 (JWT strategy, `AUTH_TRUST_HOST=true`)

## Project Layout
```
app/
  (dashboard)/         # All authenticated pages
    page.tsx           # Dashboard — member cards + recent activity
    members/           # Member list + per-member timeline
    search/            # Global search across all record types
    settings/          # Home info, invite code, user list
  api/                 # API routes (all auth-gated)
    auth/register/     # POST — create home or join via invite code
    homes/             # GET current home + users
    members/           # CRUD family members
    medications/       # CRUD medication records
    pain/              # CRUD pain records
    health-issues/     # CRUD health issues
    reports/           # CRUD reports (with optional file)
    upload/            # POST multipart → /data/uploads/
    search/            # GET ?q= across all record types
    files/[...path]/   # Serve uploaded files (auth-gated)
  login/               # Login page
  register/            # Register (Create Home / Join Home tabs)
src/
  components/layout/   # Sidebar, ThemeContext, DashboardClientLayout
  lib/
    auth.ts / auth.config.ts   # NextAuth config
    db.ts                      # Prisma singleton
prisma/
  schema.prisma        # Data models
  migrations/          # SQL migrations (run by migrate.js at startup)
```

## Models
Home, User (with role: admin|member), Member, MedicationRecord, PainRecord, HealthIssue, Report

## Auth & Home Access
- Register: "Create Home" (becomes admin) or "Join Home" (invite code → member)
- Session carries: user.id, user.homeId, user.role
- All data scoped to homeId

## Key Patterns
- All API routes: `const session = await auth(); if (!session) return 401`
- Auth redirects: read `x-forwarded-host` or `Host` header (Docker fix)
- File uploads: POST /api/upload (multipart) → saves to /data/uploads/{memberId}/{uuid}.{ext}
- File serving: GET /api/files/uploads/{memberId}/{file} (auth-gated, home-scoped)
- Search: ILIKE across all 4 record types, scoped to home members

## Dev Commands
```bash
npx prisma generate       # After schema changes
npx tsc --noEmit          # Type check
npm run build             # Production build
```

## Docker Build (ARM64 for Pi)
```bash
docker buildx build --platform linux/arm64 -t pmananthu/aries:VERSION --push .
```
Current version: **1.0.15**

## Pi Deployment
- Port: 3001
- Data: /DATA/AppData/aries/
- Postgres volume: aries_pg_data (named, Pi main drive)
- App volume: /DATA/AppData/aries/app:/data (uploads stored here)
- Compose: /DATA/AppData/aries/docker-compose.yml
