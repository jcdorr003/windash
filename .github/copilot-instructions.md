# React Router RSC Framework - AI Coding Agent Instructions

## Project Overview
This is an **EXPERIMENTAL** React Router v7 project using React Server Components (RSC). It's powered by Vite with `@vitejs/plugin-rsc` and uses React Router's unstable RSC support. This is NOT production-ready technology.

## Architecture

### RSC Pattern: Server vs Client Components
Routes use the `ServerComponent` export for server-side rendering with RSC:
- **Server Components**: Export `ServerComponent()` from route files (see `app/routes/home.tsx`)
- **Default behavior**: Components are server-rendered unless explicitly marked as client components
- **No loaders/actions**: Traditional React Router `loader`/`action` patterns are not used here; data fetching happens directly in Server Components

### Route Structure
- Routes are configured in `app/routes.ts` using the `@react-router/dev/routes` API
- Route files live in `app/routes/` directory
- Each route imports type-safe route types from `./+types/[route-name]` (auto-generated in `.react-router/types/`)
- Example: `import type { Route } from "./+types/home"`

### Key Files
- `app/root.tsx`: Root layout with `Layout`, `ErrorBoundary`, and `links` exports
- `app/routes.ts`: Route configuration using `index()`, `route()`, etc.
- `vite.config.ts`: Combines RSC plugins: `reactRouterRSC()`, `rsc()`, TailwindCSS, and tsconfig paths
- `react-router.config.ts`: React Router configuration (currently minimal)

## Development Workflow

### Commands (uses pnpm)
- **Dev server**: `pnpm dev` (or `npm run dev`) - starts at `http://localhost:5173`
- **Build**: `pnpm build` - outputs to `build/` with separate client/server bundles
- **Production**: `pnpm start` - runs `build/server/index.js` with `@react-router/serve`
- **Type checking**: `pnpm typecheck` - generates types then runs tsc

### Build Output Structure
The build creates dual bundles in `build/`:
- `build/client/`: Client-side assets with content hashing
- `build/server/`: Server bundle with SSR build in `__ssr_build/`

## Conventions

### Styling
- TailwindCSS v4 via `@tailwindcss/vite` plugin (config-less setup)
- Global styles in `app/app.css`
- Uses Tailwind utility classes directly in components

### Type Safety
- TypeScript strict mode enabled
- Auto-generated route types in `.react-router/types/`
- Import route types as `Route` from `./+types/[route-name]` for `meta`, `loader`, `action`, etc.
- Path alias: `~/` maps to `./app/`

### Component Organization
- Reusable components (non-routes) go in dedicated folders like `app/welcome/`
- Route components export `meta()`, `ServerComponent()`, `ErrorBoundary()`, etc. as needed
- No special file naming required for components (e.g., `welcome.tsx` not `Welcome.tsx`)

## Important Gotchas
- This uses **experimental** RSC support - APIs may change
- The `@vitejs/plugin-rsc` and `unstable_reactRouterRSC` are both required in `vite.config.ts`
- Server Components cannot use browser APIs or hooks like `useState` - those require client components
- Generated types in `.react-router/` should not be manually edited
