import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { resources } from "@/db/schema";
import { put } from "@vercel/blob";
import { createId } from "@paralleldrive/cuid2";

const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "image/png",
  "image/jpeg",
  "application/zip",
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: eventId } = await params;
  const contentType = req.headers.get("content-type") || "";

  // Link mode (JSON)
  if (contentType.includes("application/json")) {
    const body = await req.json();
    const { name, url } = body;

    if (!name?.trim() || !url?.trim()) {
      return NextResponse.json({ error: "Name und URL sind erforderlich" }, { status: 400 });
    }

    try {
      new URL(url);
    } catch {
      return NextResponse.json({ error: "Ungültige URL" }, { status: 400 });
    }

    const resource = {
      id: createId(),
      eventId,
      uploadedBy: session.user.id,
      type: "link" as const,
      name: name.trim(),
      url: url.trim(),
      mimeType: null,
      fileSize: null,
      createdAt: new Date(),
    };

    await db.insert(resources).values(resource);
    return NextResponse.json(resource, { status: 201 });
  }

  // File upload mode (FormData)
  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const name = (formData.get("name") as string) || file?.name || "Unbenannt";

  if (!file) {
    return NextResponse.json({ error: "Keine Datei ausgewählt" }, { status: 400 });
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: "Datei darf maximal 10 MB groß sein" }, { status: 400 });
  }

  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: "Dateityp nicht erlaubt. Erlaubt: PDF, PPTX, DOCX, XLSX, PNG, JPG, ZIP" },
      { status: 400 }
    );
  }

  const blob = await put(`topix/${eventId}/${createId()}-${file.name}`, file, {
    access: "public",
  });

  const resource = {
    id: createId(),
    eventId,
    uploadedBy: session.user.id,
    type: "file" as const,
    name: name.trim(),
    url: blob.url,
    mimeType: file.type,
    fileSize: file.size,
    createdAt: new Date(),
  };

  await db.insert(resources).values(resource);
  return NextResponse.json(resource, { status: 201 });
}
