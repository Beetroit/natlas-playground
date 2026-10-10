import { NextRequest, NextResponse } from "next/server";
import { Natlas, type SupportedLanguage } from "@natlas/sdk";

export const runtime = "nodejs";

const natlas = new Natlas({
  baseURL: process.env.NATLAS_BASE_URL || "http://127.0.0.1:8000/v1",
});

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const formData = await req.formData();
    const file = formData.get("file");
    const language = (formData.get("language") as SupportedLanguage) || "english";

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json({ error: "Missing or invalid audio file" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const result = await natlas.audio.transcribe({
      file: arrayBuffer,
      language,
    });

    return NextResponse.json(result);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "ASR transcription failed";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
