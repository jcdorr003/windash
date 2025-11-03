import { WebSocketServer, WebSocket } from 'ws';
import type { Server } from 'http';
import { validateDeviceToken, updateDeviceStatus } from '../services/device-service';
import { storeMetricsBatch, type MetricSample } from '../services/metrics-service';

interface AgentConnection {
  deviceId: string;
  hostId: string;
  ws: WebSocket;
}

const connections = new Map<string, AgentConnection>();

export function setupWebSocketServer(server: Server) {
  const wss = new WebSocketServer({ 
    server,
    path: '/agent'
  });

  wss.on('connection', async (ws, req) => {
    console.log('New WebSocket connection attempt');

    try {
      // Parse URL for hostId and Authorization header
      const url = new URL(req.url!, `http://${req.headers.host}`);
      const hostId = url.searchParams.get('hostId');
      const authHeader = req.headers.authorization;

      if (!hostId) {
        console.error('No hostId provided');
        ws.close(1008, 'Missing hostId');
        return;
      }

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        console.error('Invalid authorization header');
        ws.close(1008, 'Invalid authorization');
        return;
      }

      const token = authHeader.substring(7);
      const device = await validateDeviceToken(token);

      if (!device) {
        console.error('Invalid device token');
        ws.close(1008, 'Invalid token');
        return;
      }

      // Store connection
      const deviceId = device.id;
      connections.set(deviceId, { deviceId, hostId, ws });
      
      // Update device status to online
      await updateDeviceStatus(deviceId, true);
      
      console.log(`Device connected: ${device.name} (${deviceId})`);

      // Handle messages from agent
      ws.on('message', async (data) => {
        try {
          const message = JSON.parse(data.toString());

          if (message.type === 'metrics' && message.samples) {
            // Store metrics batch
            await storeMetricsBatch(deviceId, message.samples as MetricSample[]);
            
            // Update last seen
            await updateDeviceStatus(deviceId, true);
            
            console.log(`Stored ${message.samples.length} metric samples from ${device.name}`);
          }
        } catch (error) {
          console.error('Error processing message:', error);
        }
      });

      // Handle disconnection
      ws.on('close', async () => {
        connections.delete(deviceId);
        await updateDeviceStatus(deviceId, false);
        console.log(`Device disconnected: ${device.name} (${deviceId})`);
      });

      // Handle errors
      ws.on('error', (error) => {
        console.error(`WebSocket error for device ${deviceId}:`, error);
      });

      // Send acknowledgment
      ws.send(JSON.stringify({ type: 'connected', deviceId }));

    } catch (error) {
      console.error('Error setting up WebSocket connection:', error);
      ws.close(1011, 'Internal server error');
    }
  });

  console.log('WebSocket server ready at /agent');

  return wss;
}

// Get connection status for a device
export function isDeviceConnected(deviceId: string): boolean {
  return connections.has(deviceId);
}

// Send a message to a specific device
export function sendToDevice(deviceId: string, message: any): boolean {
  const connection = connections.get(deviceId);
  if (connection && connection.ws.readyState === WebSocket.OPEN) {
    connection.ws.send(JSON.stringify(message));
    return true;
  }
  return false;
}
