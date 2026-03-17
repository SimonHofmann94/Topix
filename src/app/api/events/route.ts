import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { events } from "@/db/schema";
import { desc } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const allEvents = await db
    .select()
    .from(events)
    .orderBy(desc(events.date));

  return NextResponse.json(allEvents);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { title, date, startTime, location, durationMinutes } = body;

  if (!title || !date || !startTime) {
    return NextResponse.json({ error: "Titel, Datum und Uhrzeit sind erforderlich" }, { status: 400 });
  }

  const event = {
    id: createId(),
    title: title.trim(),
    date,
    startTime,
    location: location?.trim() || null,
    durationMinutes: Number(durationMinutes) || 120,
    status: "open" as const,
    createdBy: session.user.id,
    createdAt: new Date(),
  };

  db.insert(events).values(event).run();

  return NextResponse.json(event, { status: 201 });
}
