import { sqliteTable, text, integer, uniqueIndex } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  role: text("role", { enum: ["admin", "user"] }).notNull().default("user"),
  passwordHash: text("password_hash").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const events = sqliteTable("events", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  date: text("date").notNull(), // ISO date: "2026-04-02"
  startTime: text("start_time").notNull(), // "19:00"
  location: text("location"),
  durationMinutes: integer("duration_minutes").notNull().default(120),
  status: text("status", { enum: ["open", "locked", "archived"] }).notNull().default("open"),
  createdBy: text("created_by").notNull().references(() => users.id),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const topics = sqliteTable("topics", {
  id: text("id").primaryKey(),
  eventId: text("event_id").notNull().references(() => events.id, { onDelete: "cascade" }),
  proposedBy: text("proposed_by").notNull().references(() => users.id),
  title: text("title").notNull(),
  description: text("description"),
  durationMinutes: integer("duration_minutes").notNull().default(15),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const votes = sqliteTable(
  "votes",
  {
    id: text("id").primaryKey(),
    topicId: text("topic_id").notNull().references(() => topics.id, { onDelete: "cascade" }),
    userId: text("user_id").notNull().references(() => users.id),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  },
  (table) => [
    uniqueIndex("vote_unique").on(table.topicId, table.userId),
  ]
);

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  topics: many(topics),
  votes: many(votes),
}));

export const eventsRelations = relations(events, ({ one, many }) => ({
  creator: one(users, { fields: [events.createdBy], references: [users.id] }),
  topics: many(topics),
}));

export const topicsRelations = relations(topics, ({ one, many }) => ({
  event: one(events, { fields: [topics.eventId], references: [events.id] }),
  proposer: one(users, { fields: [topics.proposedBy], references: [users.id] }),
  votes: many(votes),
}));

export const votesRelations = relations(votes, ({ one }) => ({
  topic: one(topics, { fields: [votes.topicId], references: [topics.id] }),
  user: one(users, { fields: [votes.userId], references: [users.id] }),
}));
