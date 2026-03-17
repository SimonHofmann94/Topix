import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { topics } from "@/db/schema";
import { createId } from "@paralleldrive/cuid2";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: eventId } = await params;
  const body = await req.json();
  const { title, description, durationMinutes } = body;

  if (!title || typeof title !== "string" || title.trim().length === 0) {
    return NextResponse.json({ error: "Titel ist erforderlich" }, { status: 400 });
  }

  const duration = Number(durationMinutes) || 15;
  if (duration < 5 || duration > 60) {
    return NextResponse.json({ error: "Dauer muss zwischen 5 und 60 Minuten liegen" }, { status: 400 });
  }

  const topic = {
    id: createId(),
    eventId,
    proposedBy: session.user.id,
    title: title.trim(),
    description: description?.trim() || null,
    durationMinutes: duration,
    createdAt: new Date(),
  };

  db.insert(topics).values(topic).run();

  return NextResponse.json(topic, { status: 201 });
}
