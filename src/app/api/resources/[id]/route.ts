import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { resources } from "@/db/schema";
import { eq } from "drizzle-orm";
import { del } from "@vercel/blob";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const resource = await db.query.resources.findFirst({
    where: eq(resources.id, id),
  });

  if (!resource) {
    return NextResponse.json({ error: "Ressource nicht gefunden" }, { status: 404 });
  }

  const isOwner = resource.uploadedBy === session.user.id;
  const isAdmin = session.user.role === "admin";

  if (!isOwner && !isAdmin) {
    return NextResponse.json({ error: "Keine Berechtigung" }, { status: 403 });
  }

  // Delete blob if it's a file
  if (resource.type === "file") {
    try {
      await del(resource.url);
    } catch {
      // Blob may already be deleted, continue
    }
  }

  await db.delete(resources).where(eq(resources.id, id));

  return NextResponse.json({ deleted: true });
}
