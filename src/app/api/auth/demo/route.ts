import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { appStore } from "@/lib/store";

export async function POST(req: NextRequest) {
  try {
    const { email, name } = await req.json().catch(() => ({}));

    // Generate unique session ID for candidate
    const demoId = `user_${Date.now().toString(36)}`;
    const candidateName = name?.trim() || (email ? email.split("@")[0] : "Candidate");
    const candidateEmail = email?.trim() || `${candidateName.toLowerCase().replace(/\s+/g, ".")}@placement.edu.in`;

    // Set auth cookie
    cookies().set("mockmate_demo_user", demoId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    const profile = appStore.getProfile(demoId);
    profile.email = candidateEmail;
    profile.full_name = candidateName;
    profile.credits = 1; // 1 free interview on signup!
    appStore.updateProfile(demoId, profile);

    return NextResponse.json({ success: true, user: profile });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function GET() {
  const cookieStore = cookies();
  const demoId = cookieStore.get("mockmate_demo_user")?.value;

  if (!demoId) {
    return NextResponse.json({ user: null });
  }

  const profile = appStore.getProfile(demoId);
  return NextResponse.json({ user: profile });
}

export async function DELETE() {
  // Logout / clear session cookie
  cookies().set("mockmate_demo_user", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 0,
    path: "/",
  });

  return NextResponse.json({ success: true, message: "Logged out successfully" });
}
