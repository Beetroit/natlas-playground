import { NextRequest } from "next/server";
import { Natlas, type SupportedLanguage, type ChatMessage } from "@natlas/sdk";

export const runtime = "nodejs";

const natlas = new Natlas({
  baseURL: process.env.NATLAS_BASE_URL || "http://127.0.0.1:8000/v1",
});

interface ChatRequestBody {
  messages: ChatMessage[];
  language?: SupportedLanguage;
  toneEnforcement?: boolean;
}

export async function POST(req: NextRequest): Promise<Response> {
  try {
    const body = (await req.json()) as ChatRequestBody;
    const { messages, language = "yoruba", toneEnforcement = true } = body;

    const stream = natlas.chat.stream({
      messages,
      language,
      toneEnforcement,
    });

    const encoder = new TextEncoder();
    const customReadable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content ?? "";
            if (content) {
              controller.enqueue(encoder.encode(content));
            }
          }
        } catch (streamError: unknown) {
          const msg = streamError instanceof Error ? streamError.message : "Stream failure";
          controller.enqueue(encoder.encode(`\n[N-ATLAS Error: ${msg}]`));
        } finally {
          controller.close();
        }
      },
    });

    return new Response(customReadable, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
      },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Internal Server Error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
