import { db } from '../db';
import { deviceCodes, devices, users } from '../db/schema';
import { logDebug } from '../utils/log';
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

  logDebug('device-code', 'created new code', { code, userId, expiresAt });
  return { code, expiresAt: expiresAt.toISOString() };
}

// Check device code status and return token if approved
export async function checkDeviceCode(code: string) {
  logDebug('device-code', 'checking code status', { code });
  const [deviceCode] = await db
    .select()
    .from(deviceCodes)
    .where(eq(deviceCodes.code, code))
    .limit(1);

  if (!deviceCode) {
    logDebug('device-code', 'code not found', { code });
    return { status: 'not_found' };
  }

  // Check if expired
  if (new Date() > deviceCode.expiresAt) {
    await db
      .update(deviceCodes)
      .set({ status: 'expired' })
      .where(eq(deviceCodes.code, code));
    logDebug('device-code', 'code expired', { code });
    return { status: 'expired' };
  }

  if (deviceCode.status === 'pending') {
    logDebug('device-code', 'code still pending', { code });
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
      logDebug('device-code', 'code approved returning token', { code });
      return { status: 'approved', token: device.token };
    }
  }

  return { status: deviceCode.status };
}

// Approve a device code and create device
export async function approveDeviceCode(code: string, userId: string, hostId: string, deviceName: string) {
  logDebug('device-approve', 'approving code', { code, userId, hostId, deviceName });
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

  logDebug('device-approve', 'device created', { deviceId, token });
  return { deviceId, token };
}

// Ensure a temporary/dev user exists (for environments before auth implementation)
export async function ensureTempUser(userId: string) {
  const [existing] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (existing) return existing.id;

  // Minimal placeholder values to satisfy NOT NULL constraints
  const email = `${userId}@example.dev`;
  const passwordHash = 'dev-temp'; // Replace with a real hash when auth implemented
  await db.insert(users).values({ id: userId, email, passwordHash, name: 'Temp User' });
  logDebug('user', 'temp user created', { userId, email });
  return userId;
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
