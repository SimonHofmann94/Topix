import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { events, topics, votes, users } from "@/db/schema";
import { eq, desc, sql } from "drizzle-orm";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const event = await db.query.events.findFirst({
    where: eq(events.status, "open"),
    orderBy: [desc(events.date)],
  });

  if (!event) {
    return NextResponse.json({ event: null });
  }

  const eventTopics = await db
    .select({
      id: topics.id,
      title: topics.title,
      description: topics.description,
      durationMinutes: topics.durationMinutes,
      createdAt: topics.createdAt,
      proposerName: users.name,
      proposedBy: topics.proposedBy,
      voteCount: sql<number>`count(${votes.id})`.as("vote_count"),
    })
    .from(topics)
    .leftJoin(votes, eq(topics.id, votes.topicId))
    .leftJoin(users, eq(topics.proposedBy, users.id))
    .where(eq(topics.eventId, event.id))
    .groupBy(topics.id)
    .orderBy(sql`vote_count DESC`);

  // Get current user's votes
  const userVotes = await db
    .select({ topicId: votes.topicId })
    .from(votes)
    .where(eq(votes.userId, session.user.id));

  const votedTopicIds = new Set(userVotes.map((v) => v.topicId));

  return NextResponse.json({
    event,
    topics: eventTopics.map((t) => ({
      ...t,
      hasVoted: votedTopicIds.has(t.id),
    })),
  });
}
