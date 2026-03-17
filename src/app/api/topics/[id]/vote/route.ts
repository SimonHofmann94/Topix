import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { votes } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: topicId } = await params;
  const userId = session.user.id;

  // Check if already voted
  const existing = await db.query.votes.findFirst({
    where: and(eq(votes.topicId, topicId), eq(votes.userId, userId)),
  });

  if (existing) {
    // Remove vote (toggle off)
    db.delete(votes)
      .where(and(eq(votes.topicId, topicId), eq(votes.userId, userId)))
      .run();
    return NextResponse.json({ voted: false });
  }

  // Add vote
  db.insert(votes)
    .values({
      id: createId(),
      topicId,
      userId,
      createdAt: new Date(),
    })
    .run();

  return NextResponse.json({ voted: true });
}
