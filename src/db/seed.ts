import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";
import * as schema from "./schema";
import bcrypt from "bcryptjs";
import { createId } from "@paralleldrive/cuid2";

const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

const db = drizzle(client, { schema });

async function seed() {
  // Run migrations
  await migrate(db, { migrationsFolder: "./drizzle" });

  const now = new Date();

  // Create admin user (password: admin123)
  const adminPasswordHash = await bcrypt.hash("admin123", 10);
  const adminId = createId();

  await db.insert(schema.users).values({
    id: adminId,
    email: "admin@topix.de",
    name: "Admin",
    role: "admin",
    passwordHash: adminPasswordHash,
    createdAt: now,
  });

  // Create a test user (password: user123)
  const userPasswordHash = await bcrypt.hash("user123", 10);
  const userId = createId();

  await db.insert(schema.users).values({
    id: userId,
    email: "user@topix.de",
    name: "Max Mustermann",
    role: "user",
    passwordHash: userPasswordHash,
    createdAt: now,
  });

  // Create a sample event
  const eventId = createId();
  await db.insert(schema.events).values({
    id: eventId,
    title: "Startup Stammtisch - April 2026",
    date: "2026-04-02",
    startTime: "19:00",
    location: "WeWork München, Neuturmstraße 5",
    durationMinutes: 120,
    status: "open",
    createdBy: adminId,
    createdAt: now,
  });

  // Create sample topics
  const topic1Id = createId();
  const topic2Id = createId();

  await db.insert(schema.topics).values([
    {
      id: topic1Id,
      eventId,
      proposedBy: userId,
      title: "AI Tools im Startup-Alltag",
      description: "Welche AI-Tools nutzt ihr und wie haben sie euren Workflow verändert?",
      durationMinutes: 15,
      createdAt: now,
    },
    {
      id: topic2Id,
      eventId,
      proposedBy: adminId,
      title: "Funding-Runde Q2 Updates",
      description: "Erfahrungen und Tipps zur aktuellen Funding-Landschaft",
      durationMinutes: 10,
      createdAt: now,
    },
  ]);

  // Add some votes
  await db.insert(schema.votes).values([
    { id: createId(), topicId: topic1Id, userId: adminId, createdAt: now },
    { id: createId(), topicId: topic1Id, userId, createdAt: now },
    { id: createId(), topicId: topic2Id, userId, createdAt: now },
  ]);

  console.log("Seed complete!");
  console.log("Admin: admin@topix.de / admin123");
  console.log("User:  user@topix.de / user123");
}

seed().catch(console.error);
