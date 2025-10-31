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

### Prerequisites

- Node.js 18+ (built with pnpm but npm works too)

### Installation

Install dependencies:

```bash
# Using pnpm (recommended)
pnpm install

# Or using npm
npm install
```

### Development

Start the development server:

```bash
# Using pnpm
pnpm dev

# Or using npm
npm run dev
```

Visit `http://localhost:5173` to see your dashboard with live simulated metrics.

## 📦 Building & Deployment

### Production Build

```bash
pnpm build
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

## 📄 License

MIT License - feel free to use this project as a learning resource or starting point for your own dashboard applications.

---

Built with ❤️ using React Router v7 and React Server Components. 