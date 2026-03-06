# F5 VIP & Pool Health Dashboard

## Overview

A real-time monitoring dashboard for F5 BIG-IP Virtual Servers (VIPs), Pools, and Pool Members. Built to help NOC engineers quickly identify single points of failure and critical availability issues. The application polls F5 devices via iControl REST API and displays health status with risk detection (Critical: 0 active members, High Risk: 1 active member, Warning: 2 active members, Healthy: 3+ active members).

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **Routing**: Wouter (lightweight React router)
- **State Management**: TanStack Query for server state and caching
- **UI Components**: shadcn/ui component library with Radix UI primitives
- **Styling**: Tailwind CSS v4 with dark theme optimized for NOC 24/7 monitoring
- **Build Tool**: Vite

### Backend Architecture
- **Runtime**: Node.js with Express
- **Language**: TypeScript with ES modules
- **API Design**: RESTful endpoints under `/api/*`
- **Data Storage**: In-memory caching with `MemStorage` class for F5 settings and alert rules
- **F5 Integration**: Custom `F5Client` class using iControl REST API over HTTPS

### Key Design Patterns
- **Polling Service**: Background service that periodically fetches F5 data and caches VIP/Pool/Member states
- **Environment Configuration**: F5 credentials can be set via environment variables (`F5_HOST`, `F5_USERNAME`, `F5_PASSWORD`, etc.) or through the settings UI
- **Schema Definition**: Drizzle ORM schema in `shared/schema.ts` defines types for F5 settings and alert rules (currently using in-memory storage, PostgreSQL ready)

### API Endpoints
- `GET /api/vips` - List all VIPs with health status
- `GET /api/vips/:id` - Get detailed VIP information with pool members
- `GET /api/status` - Get polling service status
- Settings and alert rule management endpoints

### Build System
- Development: Vite dev server with HMR
- Production: esbuild bundles server, Vite builds client to `dist/public`

## External Dependencies

### F5 BIG-IP Integration
- Connects via iControl REST API (HTTPS on port 443 by default)
- Requires credentials with read-only access
- Configurable TLS verification and partition selection

### Database
- Schema defined with Drizzle ORM for PostgreSQL
- Currently uses in-memory storage (`MemStorage`)
- Ready for PostgreSQL when `DATABASE_URL` is provided

### Third-Party Services
- No external third-party APIs beyond F5 BIG-IP
- Replit-specific plugins for development (cartographer, dev-banner, error overlay)