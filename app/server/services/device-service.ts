import { db } from '../db';
import { deviceCodes, devices } from '../db/schema';
import { eq } from 'drizzle-orm';
import { randomBytes } from 'crypto';

// Generate a device code in format XXXX-XXXX
export function generateDeviceCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    if (i === 4) code += '-';
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

// Generate a secure bearer token for device auth
export function generateBearerToken(): string {
  return randomBytes(32).toString('base64url');
}

// Create a new device code for pairing
export async function createDeviceCode(userId?: string) {
  const code = generateDeviceCode();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

  await db.insert(deviceCodes).values({
    code,
    userId,
    status: 'pending',
    expiresAt,
  });

  return { code, expiresAt: expiresAt.toISOString() };
}

// Check device code status and return token if approved
export async function checkDeviceCode(code: string) {
  const [deviceCode] = await db
    .select()
    .from(deviceCodes)
    .where(eq(deviceCodes.code, code))
    .limit(1);

  if (!deviceCode) {
    return { status: 'not_found' };
  }

  // Check if expired
  if (new Date() > deviceCode.expiresAt) {
    await db
      .update(deviceCodes)
      .set({ status: 'expired' })
      .where(eq(deviceCodes.code, code));
    return { status: 'expired' };
  }

  if (deviceCode.status === 'pending') {
    return { status: 'pending' };
  }

  if (deviceCode.status === 'approved') {
    // Find device by userId and code
    const [device] = await db
      .select()
      .from(devices)
      .where(eq(devices.userId, deviceCode.userId!))
      .orderBy(devices.createdAt)
      .limit(1);

    if (device) {
      return { status: 'approved', token: device.token };
    }
  }

  return { status: deviceCode.status };
}

// Approve a device code and create device
export async function approveDeviceCode(code: string, userId: string, hostId: string, deviceName: string) {
  // Update code status
  await db
    .update(deviceCodes)
    .set({ status: 'approved', userId })
    .where(eq(deviceCodes.code, code));

  // Create device with token
  const token = generateBearerToken();
  const deviceId = randomBytes(16).toString('hex');

  await db.insert(devices).values({
    id: deviceId,
    userId,
    hostId,
    name: deviceName,
    token,
    isOnline: false,
  });

  return { deviceId, token };
}

// Validate bearer token and return device
export async function validateDeviceToken(token: string) {
  const [device] = await db
    .select()
    .from(devices)
    .where(eq(devices.token, token))
    .limit(1);

  return device || null;
}

// Update device online status
export async function updateDeviceStatus(deviceId: string, isOnline: boolean) {
  await db
    .update(devices)
    .set({
      isOnline,
      lastSeenAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(devices.id, deviceId));
}

// Get user's devices
export async function getUserDevices(userId: string) {
  return db
    .select()
    .from(devices)
    .where(eq(devices.userId, userId));
}
