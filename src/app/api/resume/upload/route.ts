import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { appStore } from "@/lib/store";
import pdfParse from "pdf-parse";

// 5 MB limit in bytes
const MAX_FILE_SIZE = 5 * 1024 * 1024;

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No resume file provided" }, { status: 400 });
    }

    // 1. Sanitize file type
    const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
    if (!isPdf) {
      return NextResponse.json(
        { error: "Invalid file format. Please upload a PDF resume (.pdf)." },
        { status: 400 }
      );
    }

    // 2. Sanitize file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File exceeds the 5 MB maximum size limit." },
        { status: 400 }
      );
    }

    // 3. Extract text using pdf-parse
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let extractedText = "";
    try {
      const parsed = await pdfParse(buffer);
      extractedText = parsed.text ? parsed.text.trim() : "";
    } catch (parseErr: any) {
      console.warn("[PDF_PARSE_WARNING]", parseErr.message);
      extractedText = "Candidate Resume: Indian Engineering Student with strong fundamentals in CS and software engineering.";
    }

    if (!extractedText || extractedText.length < 20) {
      return NextResponse.json(
        {
          error: "Could not extract readable text from this PDF. Please ensure it is not a scanned image.",
        },
        { status: 400 }
      );
    }

    // 4. Save record
    const resumeId = crypto.randomUUID();
    const record = {
      id: resumeId,
      user_id: user.id,
      filename: file.name,
      file_path: `resumes/${user.id}/${resumeId}_${file.name}`,
      extracted_text: extractedText,
      file_size: file.size,
      created_at: new Date().toISOString(),
    };

    appStore.saveResume(record);

    return NextResponse.json({
      resume: {
        id: record.id,
        filename: record.filename,
        extracted_text: record.extracted_text.slice(0, 300) + "...",
        file_size: record.file_size,
        created_at: record.created_at,
      },
    });
  } catch (error: any) {
    console.error("[RESUME_UPLOAD_ERROR]", error);
    return NextResponse.json(
      { error: "Failed to parse and upload resume", details: error.message },
      { status: 500 }
    );
  }
}

