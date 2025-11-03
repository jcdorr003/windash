import { createServer } from 'http';
import { setupWebSocketServer } from './websocket/server.js';

const PORT = process.env.WS_PORT || 3001;

// Create HTTP server for WebSocket
const server = createServer((req, res) => {
  // Simple health check endpoint
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', service: 'websocket' }));
    return;
  }
  
  res.writeHead(404);
  res.end('WebSocket server only');
});

// Set up WebSocket server
setupWebSocketServer(server);

server.listen(PORT, () => {
  console.log(`WebSocket server listening on port ${PORT}`);
  console.log(`WebSocket endpoint: ws://localhost:${PORT}/agent`);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('WebSocket server closed');
    process.exit(0);
  });
});
