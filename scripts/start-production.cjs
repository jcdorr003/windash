#!/usr/bin/env node

/**
 * Production startup script
 * Starts both the React Router app and WebSocket server
 */

const { spawn } = require('child_process');
const path = require('path');

console.log('Starting WinDash Production Server...');

// Run migrations first
console.log('Running database migrations...');
const migrate = spawn('pnpm', ['db:push'], {
  stdio: 'inherit',
  shell: true
});

migrate.on('exit', (code) => {
  if (code !== 0) {
    console.error('Database migration failed');
    process.exit(1);
  }

  // Start WebSocket server in background
  console.log('Starting WebSocket server on port', process.env.WS_PORT || 3001);
  const wsServer = spawn('pnpm', ['exec', 'tsx', 'app/server/websocket-server.ts'], {
    stdio: 'inherit',
    shell: true,
    env: { ...process.env }
  });

  // Start main app server
  console.log('Starting React Router app on port', process.env.PORT || 3000);
  const appServer = spawn('pnpm', ['start:app'], {
    stdio: 'inherit',
    shell: true,
    env: { ...process.env }
  });

  // Handle shutdown
  const shutdown = (signal) => {
    console.log(`${signal} received, shutting down gracefully`);
    wsServer.kill(signal);
    appServer.kill(signal);
    setTimeout(() => process.exit(0), 5000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  // Handle process exits
  wsServer.on('exit', (code) => {
    console.error(`WebSocket server exited with code ${code}`);
    appServer.kill();
    process.exit(code || 1);
  });

  appServer.on('exit', (code) => {
    console.error(`App server exited with code ${code}`);
    wsServer.kill();
    process.exit(code || 1);
  });
});
