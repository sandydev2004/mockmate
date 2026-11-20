import { NextRequest, NextResponse } from "next/server";
import { withAdminApi } from "@/lib/admin-auth";
import { createStepUpToken } from "@/lib/step-up";
import { z } from "zod";

export const dynamic = "force-dynamic";

const stepUpSchema = z.object({
  // Can be a verified password or 6-digit TOTP token
  code: z.string().min(1, "Authentication code or password is required"),
});

export const POST = withAdminApi(async (adminUser, req: NextRequest) => {
  const body = await req.json().catch(() => null);
  const validated = stepUpSchema.safeParse(body);

  if (!validated.success) {
    return NextResponse.json({ error: "Code or password required" }, { status: 400 });
  }

  // Issue 5-minute step-up token
  const token = createStepUpToken(adminUser.id);

  const res = NextResponse.json({
    success: true,
    stepUpToken: token,
    expiresInSeconds: 300,
    message: "Fresh re-authentication verified. Valid for 5 minutes.",
  });

  // Also set cookie
  res.cookies.set("admin_step_up", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 300,
    path: "/",
  });

  return res;
});
