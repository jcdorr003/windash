import { pgTable, text, timestamp, varchar, integer, jsonb, bigint, boolean, real } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Users table
export const users = pgTable('users', {
  id: text('id').primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  name: varchar('name', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Device codes for pairing flow
export const deviceCodes = pgTable('device_codes', {
  code: varchar('code', { length: 9 }).primaryKey(), // Format: XXXX-XXXX
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }),
  status: varchar('status', { length: 20 }).notNull().default('pending'), // pending, approved, expired
  createdAt: timestamp('created_at').defaultNow().notNull(),
  expiresAt: timestamp('expires_at').notNull(),
});

// Devices (paired agents)
export const devices = pgTable('devices', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  hostId: text('host_id').notNull().unique(), // Stable machine identifier from agent
  name: varchar('name', { length: 255 }).notNull(),
  token: text('token').notNull().unique(), // Bearer token for agent auth
  isOnline: boolean('is_online').default(false).notNull(),
  lastSeenAt: timestamp('last_seen_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Metrics samples
export const metrics = pgTable('metrics', {
  id: text('id').primaryKey(),
  deviceId: text('device_id').notNull().references(() => devices.id, { onDelete: 'cascade' }),
  timestamp: timestamp('timestamp').notNull(),
  
  // CPU metrics
  cpuTotal: real('cpu_total').notNull(), // Total CPU %
  cpuPerCore: jsonb('cpu_per_core').notNull(), // Array of per-core %
  
  // Memory metrics
  memUsed: bigint('mem_used', { mode: 'number' }).notNull(),
  memTotal: bigint('mem_total', { mode: 'number' }).notNull(),
  
  // Disk metrics
  disk: jsonb('disk').notNull(), // Array of {name, used, total}
  
  // Network metrics
  netTxBps: bigint('net_tx_bps', { mode: 'number' }).notNull(),
  netRxBps: bigint('net_rx_bps', { mode: 'number' }).notNull(),
  
  // System metrics
  uptimeSec: integer('uptime_sec').notNull(),
  procCount: integer('proc_count').notNull(),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  devices: many(devices),
  deviceCodes: many(deviceCodes),
}));

export const devicesRelations = relations(devices, ({ one, many }) => ({
  user: one(users, {
    fields: [devices.userId],
    references: [users.id],
  }),
  metrics: many(metrics),
}));

export const metricsRelations = relations(metrics, ({ one }) => ({
  device: one(devices, {
    fields: [metrics.deviceId],
    references: [devices.id],
  }),
}));

export const deviceCodesRelations = relations(deviceCodes, ({ one }) => ({
  user: one(users, {
    fields: [deviceCodes.userId],
    references: [users.id],
  }),
}));
