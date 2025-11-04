#!/usr/bin/env tsx
/**
 * Database seeding script for development
 * Populates the database with test data
 */

import { ensureTempUser } from "../app/server/services/device-service.js";
import { db } from "../app/server/db/index.js";
import { devices, metrics } from "../app/server/db/schema.js";
import { eq } from "drizzle-orm";

async function seed() {
  console.log("🌱 Seeding database...");

  try {
    // Ensure the temporary user exists
    const userId = "temp-user-1";
    await ensureTempUser(userId);
    console.log("✅ Created temp-user-1");

    // Create a test device with historical metrics
    const testDevice = await db.insert(devices).values({
      id: "test-device-" + Date.now(),
      userId,
      hostId: "test-machine-001",
      name: "Test Windows PC",
      token: "test-token-" + Date.now(),
      isOnline: false,
      lastSeenAt: new Date(Date.now() - 60000), // 1 minute ago
    }).returning();

    console.log("✅ Created test device:", testDevice[0].name);

    // Seed with some historical metrics (last 5 minutes)
    const now = Date.now();
    const metricsData = [];
    for (let i = 0; i < 30; i++) {
      metricsData.push({
        id: `metric-${testDevice[0].id}-${i}`,
        deviceId: testDevice[0].id,
        timestamp: new Date(now - (30 - i) * 10000), // Every 10 seconds
        cpuTotal: 20 + Math.random() * 40,
        cpuPerCore: [15, 25, 18, 22, 30, 28, 20, 24],
        memUsed: Math.floor(8 * 1024 * 1024 * 1024 * (0.5 + Math.random() * 0.3)),
        memTotal: 16 * 1024 * 1024 * 1024,
        disk: [{
          name: "C:",
          used: 250 * 1024 * 1024 * 1024,
          total: 500 * 1024 * 1024 * 1024,
        }],
        netTxBps: Math.floor(Math.random() * 5 * 1024 * 1024),
        netRxBps: Math.floor(Math.random() * 10 * 1024 * 1024),
        uptimeSec: 86400 + i * 10,
        procCount: 150 + Math.floor(Math.random() * 20),
      });
    }

    await db.insert(metrics).values(metricsData);
    console.log("✅ Created 30 historical metrics for test device");

    console.log("✅ Database seeded successfully!");
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    process.exit(1);
  }

  process.exit(0);
}

seed();
