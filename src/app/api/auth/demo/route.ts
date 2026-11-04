import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { appStore } from "@/lib/store";

export async function POST(req: NextRequest) {
  try {
    const { email, name } = await req.json().catch(() => ({}));
    const demoId = `user_${Date.now().toString(36)}`;

    // Set demo cookie
    cookies().set("mockmate_demo_user", demoId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    const profile = appStore.getProfile(demoId);
    if (email) profile.email = email;
    if (name) profile.full_name = name;
    profile.credits = 1; // 1 free interview!
    appStore.updateProfile(demoId, profile);

    return NextResponse.json({ success: true, user: profile });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function GET() {
  const cookieStore = cookies();
  const demoId = cookieStore.get("mockmate_demo_user")?.value || "demo-user-123";
  const profile = appStore.getProfile(demoId);
  return NextResponse.json({ user: profile });
}
