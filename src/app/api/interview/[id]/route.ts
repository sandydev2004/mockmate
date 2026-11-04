import { NextRequest, NextResponse } from "next/server";
import { appStore } from "@/lib/store";
import { getProblemByIdOrSlug } from "@/lib/dsa-problems";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const interviewId = params.id;
    const interview = appStore.getInterview(interviewId);

    if (!interview) {
      return NextResponse.json({ error: "Interview not found" }, { status: 404 });
    }

    const messages = appStore.getInterviewMessages(interviewId);
    const feedback = appStore.getFeedback(interviewId);
    const submissions = appStore.getSubmissions(interviewId);

    let dsaProblem = null;
    if (interview.dsa_problem_id) {
      dsaProblem = getProblemByIdOrSlug(interview.dsa_problem_id);
    }

    return NextResponse.json({
      interview,
      messages,
      feedback,
      submissions,
      dsa_problem: dsaProblem,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
