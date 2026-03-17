import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { createId } from "@paralleldrive/cuid2";
import bcrypt from "bcryptjs";

export async function GET() {
  const session = await auth();
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const members = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      role: users.role,
      createdAt: users.createdAt,
    })
    .from(users);

  return NextResponse.json(members);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { email, name, password } = body;

  if (!email || !name || !password) {
    return NextResponse.json({ error: "Alle Felder sind erforderlich" }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const user = {
    id: createId(),
    email: email.trim().toLowerCase(),
    name: name.trim(),
    role: "user" as const,
    passwordHash,
    createdAt: new Date(),
  };

  try {
    db.insert(users).values(user).run();
  } catch {
    return NextResponse.json({ error: "E-Mail existiert bereits" }, { status: 409 });
  }

  return NextResponse.json({ id: user.id, email: user.email, name: user.name, role: user.role }, { status: 201 });
}
