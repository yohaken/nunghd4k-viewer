import { NextResponse } from "next/server";
import {
  getAllowedEmails,
  addEmail,
  removeEmail,
  getAdmin,
} from "@/lib/allowed-emails";

export async function GET() {
  return NextResponse.json({
    admin: await getAdmin(),
    allowed: await getAllowedEmails(),
  });
}

export async function POST(req: Request) {
  const { email } = await req.json();
  if (!email || typeof email !== "string") {
    return NextResponse.json({ error: "อีเมลไม่ถูกต้อง" }, { status: 400 });
  }

  const ok = await addEmail(email);
  if (!ok) {
    return NextResponse.json(
      { error: "อีเมลนี้มีอยู่แล้วหรือไม่ถูกต้อง" },
      { status: 409 }
    );
  }

  return NextResponse.json({ allowed: await getAllowedEmails() });
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const email = searchParams.get("email");
  if (!email) {
    return NextResponse.json({ error: "ระบุอีเมล" }, { status: 400 });
  }

  // Don't allow removing the admin
  if (email === await getAdmin()) {
    return NextResponse.json(
      { error: "ไม่สามารถลบอีเมลของแอดมินได้" },
      { status: 400 }
    );
  }

  const ok = await removeEmail(email);
  if (!ok) {
    return NextResponse.json({ error: "ไม่พบอีเมลนี้" }, { status: 404 });
  }

  return NextResponse.json({ allowed: await getAllowedEmails() });
}
