import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { topics } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const topic = await db.query.topics.findFirst({
    where: eq(topics.id, id),
  });

  if (!topic) {
    return NextResponse.json({ error: "Topic nicht gefunden" }, { status: 404 });
  }

  // Only owner or admin can delete
  const isOwner = topic.proposedBy === session.user.id;
  const isAdmin = session.user.role === "admin";

  if (!isOwner && !isAdmin) {
    return NextResponse.json({ error: "Keine Berechtigung" }, { status: 403 });
  }

  db.delete(topics).where(eq(topics.id, id)).run();

  return NextResponse.json({ deleted: true });
}
