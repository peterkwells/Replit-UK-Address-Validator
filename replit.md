# UK Address Validator

## Overview

This is a UK address validation web application. Users enter a UK address (line 1, line 2, town, postcode), and the backend validates it against official postcode data, returning whether the address is valid along with matched details. The app stores validation history in a PostgreSQL database and displays past checks with search/filter capabilities. The design follows a clean, professional blue/grey theme.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
- **Framework**: React 18 with TypeScript, bundled by Vite
- **Routing**: Wouter (lightweight client-side router)
- **State/Data Fetching**: TanStack React Query for server state management
- **Forms**: React Hook Form with Zod resolver for validation
- **UI Components**: Shadcn/ui (new-york style) built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming, custom blue/grey premium palette
- **Animations**: Framer Motion for transitions and micro-interactions
- **Icons**: Lucide React
- **Path aliases**: `@/` maps to `client/src/`, `@shared/` maps to `shared/`

### Backend
- **Framework**: Express 5 on Node.js with TypeScript (run via tsx)
- **Architecture**: Single HTTP server serves both API routes and the built frontend
- **Dev Mode**: Vite dev server middleware integrated into Express for HMR
- **Production**: Vite builds static files to `dist/public`, esbuild bundles server to `dist/index.cjs`
- **API Pattern**: REST endpoints under `/api/` prefix. Routes defined in `server/routes.ts`
- **Address Matching**: Custom fuzzy matching algorithm in `server/routes.ts` that normalizes and scores address components (line similarity weighted 70%, town match weighted 30%)

### Shared Code
- **Location**: `shared/` directory, imported by both client and server
- **Schema**: `shared/schema.ts` defines the database schema and Zod validation schemas using Drizzle-Zod
- **Routes**: `shared/routes.ts` defines the API contract (method, path, input/output schemas)

### Database
- **Database**: PostgreSQL (required, connection via `DATABASE_URL` environment variable)
- **ORM**: Drizzle ORM with `drizzle-kit` for schema management
- **Schema Push**: Use `npm run db:push` to sync schema to database (no migration files needed for dev)
- **Tables**:
  - `validations` — stores address validation results with fields: `id` (serial PK), `line1`, `line2`, `town`, `postcode` (required), `is_valid` (boolean), `details` (JSONB for API response data), `created_at` (timestamptz)

### Key API Endpoints
- `POST /api/validations` — Validates an address and saves the result. Input: `{ line1?, line2?, town?, postcode }`. Returns the saved validation record.
- `GET /api/validations` — Returns the 50 most recent validation records ordered by creation date descending.

### Build & Run
- **Dev**: `npm run dev` — runs tsx with Vite middleware for HMR
- **Build**: `npm run build` — builds client with Vite, bundles server with esbuild
- **Start**: `npm run start` — runs the production bundle
- **Type Check**: `npm run check`
- **DB Push**: `npm run db:push` — pushes Drizzle schema to PostgreSQL

## External Dependencies

- **PostgreSQL**: Required database. Must set `DATABASE_URL` environment variable. Used via `pg` Pool + Drizzle ORM.
- **Postcode/Address API**: The server's `routes.ts` contains address matching logic that appears to work against fetched address data (external postcode lookup API integration, details in the route handler).
- **Google Fonts**: Inter and Outfit fonts loaded from Google Fonts CDN.
- **Replit Plugins**: Optional Vite plugins (`@replit/vite-plugin-runtime-error-modal`, `@replit/vite-plugin-cartographer`, `@replit/vite-plugin-dev-banner`) for development on Replit.
- **connect-pg-simple**: Available for session storage (included in dependencies but session auth not currently active).