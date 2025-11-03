import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/dashboard.tsx"),
  route("pair", "routes/pair.tsx"),
  
  // API routes
  route("api/device-codes", "routes/api/device-codes.ts"),
  route("api/device-token", "routes/api/device-token.ts"),
] satisfies RouteConfig;
