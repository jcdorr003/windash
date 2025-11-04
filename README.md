# Windash - System Performance Dashboard

⚠️ **EXPERIMENTAL**: This project uses React Router v7 with React Server Components (RSC). This is cutting-edge, experimental technology and not recommended for production use.

A real-time system performance monitoring dashboard showcasing React Server Components patterns with React Router v7. Features simulated metrics visualization with D3.js charts and a modern dark theme interface.

## 🚀 Tech Stack

- **React Router v7** - Latest experimental version with RSC support
- **React Server Components** - Server-side rendering with client-side interactivity
- **Vite** - Build tool with `@vitejs/plugin-rsc`
- **TypeScript** - Full type safety with auto-generated route types
- **TailwindCSS v4** - Config-less styling with `@tailwindcss/vite`
- **D3.js** - Real-time data visualization and charts
- **React 19** - Latest React with concurrent features

## ✨ Features

- 📊 **Real-time metrics simulation** (CPU, Memory, Disk I/O)
- 🧪 **RSC Architecture** - Server components for static content, client components for interactivity
- 📈 **D3.js Visualizations** - Live updating charts and graphs
- 🎨 **Modern UI** - Dark theme with responsive design
- ⚡️ **Hot Module Replacement** - Fast development experience
- 🔒 **Type Safety** - Full TypeScript with auto-generated route types
- 📱 **Responsive Design** - Works on desktop and mobile

## 🚀 Getting Started

You can run Windash in three ways: **Docker (recommended)**, **Dev Containers**, or **Local development**.

### 🐳 Option 1: Docker (Production-Ready)

The easiest way to deploy Windash alongside your other self-hosted services:

```bash
# Build and run with Docker Compose
docker compose up -d

# Or build the image and run manually
docker build -t windash .
docker run -d -p 3000:3000 --name windash windash
```

Access the dashboard at `http://localhost:3000`

**Docker Features:**
- ✅ Multi-stage build for optimized image size
- ✅ Non-root user for security
- ✅ Health checks included
- ✅ Ready for Traefik/reverse proxy integration
- ✅ Production-optimized with pnpm

### 🔧 Option 2: Dev Containers (Recommended for Development)

Open the project in VS Code and use Dev Containers for a consistent development environment:

1. **Install**: [Dev Containers extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers)
2. **Open**: Command Palette → "Dev Containers: Reopen in Container"
3. **Develop**: Hot reload, all tools pre-configured

**Dev Container Benefits:**
- ✅ Isolated environment, no local dependencies
- ✅ Consistent across team members
- ✅ Pre-configured VS Code settings & extensions
- ✅ Volume mounts for instant file sync

### 💻 Option 3: Local Development

If you prefer running locally without Docker:

**Prerequisites:** Node.js 18+ (pnpm recommended)

```bash
# Install dependencies
pnpm install

# Start dev server
pnpm dev
```

Visit `http://localhost:5173` to see your dashboard with live simulated metrics.

### 🧪 Dev Stack Helper Scripts

This repo includes helper scripts to spin up and tear down the development Docker stack.

Dev setup:
```bash
pnpm dev:stack              # Start dev stack, wait for Postgres + dev server
pnpm dev:stack:rebuild      # Rebuild the dev image then start
pnpm dev:stack:wipe         # Wipe Postgres dev data volume, then start fresh
```

Direct script usage (advanced):
```bash
scripts/setup-dev.sh --wait --rebuild           # Rebuild and wait for readiness
scripts/setup-dev.sh --wipe-db --no-seed --wait # Fresh DB without seeding
scripts/setup-dev.sh --dry-run                  # Show planned actions
```

Cleanup / teardown:
```bash
pnpm clean:dev               # Stop dev containers only
pnpm clean:dev:full          # Stop + remove volumes + image (destructive)
```

Script details:
- `scripts/setup-dev.sh` handles: optional volume wipe, rebuild, pulling images, running migrations (`pnpm db:push`), optional seed.
- `scripts/cleanup.sh` safely stops stacks with opt-in flags for volumes/images/networks.

Safety notes:
- Volumes are preserved unless you use `--wipe-db` (setup) or `--with-volumes` (cleanup).
- Use `--dry-run` first for preview before destructive operations.
- Add a `seed` script to `package.json` if you want automatic dev data seeding.

## 📦 Building & Deployment

### 🐳 Docker Deployment (Recommended)

**Production deployment with Docker Compose:**

```bash
# Build and start
docker compose up -d --build

# View logs
docker compose logs -f windash

# Stop
docker compose down

# Update to latest code
git pull
docker compose up -d --build
```

**Integrate with your existing Docker stack:**

The `docker-compose.yml` includes commented Traefik labels. Uncomment and configure for automatic HTTPS:

```yaml
labels:
  - "traefik.enable=true"
  - "traefik.http.routers.windash.rule=Host(`windash.yourdomain.com`)"
  - "traefik.http.routers.windash.entrypoints=websecure"
  - "traefik.http.routers.windash.tls.certresolver=letsencrypt"
```

**Resource limits** (optional, uncomment in `docker-compose.yml`):
```yaml
deploy:
  resources:
    limits:
      cpus: '1'
      memory: 512M
```

### 🛠️ Manual Build (Without Docker)

If you need to build locally:

```bash
# Production build
pnpm build

# Run production server
pnpm start
```

This creates optimized bundles in `build/`:
- `build/client/` - Client-side assets with content hashing
- `build/server/` - Server bundle with SSR build

### Running Production

```bash
pnpm start
```

Runs the production server using `@react-router/serve`.

## 🏗️ Project Structure

```
app/
├── routes/
│   ├── home.tsx          # Landing page route
│   └── dashboard.tsx     # Main dashboard route (Server Component)
├── components/dashboard/ # Reusable dashboard components
│   ├── CpuCard.tsx      # CPU metrics display
│   ├── MemoryCard.tsx   # Memory usage card
│   ├── DiskCard.tsx     # Disk I/O metrics
│   ├── LiveMetrics.tsx  # Real-time metrics (Client Component)
│   └── RealTimeCharts.tsx # D3.js charts (Client Component)
├── lib/
│   └── metrics-api.ts   # Simulated metrics API
├── types/
│   └── metrics.ts       # TypeScript type definitions
└── root.tsx             # Root layout with global styles
```

## 🧪 RSC Architecture

This project demonstrates React Server Components patterns:

- **Server Components**: Static dashboard layout, initial data fetching
- **Client Components**: Interactive charts, real-time updates, D3.js visualizations  
- **Type Safety**: Auto-generated route types in `.react-router/types/`
- **Data Flow**: Server fetches initial data, client components handle live updates

## 🔧 Customization

### Connecting Real Data

Currently using simulated metrics. To connect real system data:

1. **Create a backend API** on your target system (Windows/Linux/macOS)
2. **Update `app/lib/metrics-api.ts`** to call your real endpoints
3. **Modify types** in `app/types/metrics.ts` if needed

Example backend endpoints needed:
- `GET /api/system-info` - Static system information
- `GET /api/metrics` - Current performance metrics

### Styling

- **TailwindCSS v4** with config-less setup via `@tailwindcss/vite`
- **Dark theme** optimized for dashboard readability
- **Responsive design** with mobile-first approach
- Global styles in `app/app.css`

## 🎯 Key Features Showcase

- **Server-side rendering** with instant navigation
- **Live updating metrics** without full page refreshes  
- **Responsive grid layouts** for different screen sizes
- **Interactive D3.js charts** with smooth animations
- **Type-safe routing** with auto-generated types
- **Modern build pipeline** with Vite and RSC plugins

## 📚 Resources

- [React Router v7 Docs](https://reactrouter.com/)
- [React Server Components Guide](https://reactrouter.com/how-to/react-server-components)
- [TailwindCSS v4](https://tailwindcss.com/)
- [D3.js Documentation](https://d3js.org/)
- [Vite RSC Plugin](https://github.com/vitejs/vite-plugin-rsc)

## � Docker Architecture

### Production Image
- **Base**: Node.js 20 Alpine (minimal footprint)
- **Build**: Multi-stage for optimized size (~200MB final image)
- **Security**: Non-root user, minimal attack surface
- **Health checks**: Built-in health monitoring
- **Port**: 3000 (configurable via ENV)

### Development Setup
- **Hot reload**: Volume mounts for instant code updates
- **Isolation**: Separate dev and prod configurations
- **Caching**: Named volumes for `node_modules` and pnpm store
- **Port**: 5173 (Vite dev server)

### Files Overview
- `Dockerfile` - Multi-stage production build
- `Dockerfile.dev` - Development with hot reload
- `docker-compose.yml` - Production deployment
- `docker-compose.dev.yml` - Development environment
- `.dockerignore` - Optimized build context
- `.devcontainer/` - VS Code Dev Container configuration

## �📄 License

MIT License - feel free to use this project as a learning resource or starting point for your own dashboard applications.

---

Built with ❤️ using React Router v7 and React Server Components. 