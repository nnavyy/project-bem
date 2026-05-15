import { NextRequest, NextResponse } from "next/server";
import { SYSTEM_PROMPT } from "@/lib/chatbot-knowledge";

interface Message {
  role: "user" | "assistant";
  content: string;
}

// Groq API response types (OpenAI compatible)
interface GroqResponse {
  choices?: Array<{
    message?: {
      content?: string;
    };
    finish_reason?: string;
  }>;
  error?: {
    message?: string;
    type?: string;
    code?: string;
  };
}

export async function POST(req: NextRequest) {
  try {
    // ── 1. Parse request body ────────────────────────────────────────────
    let messages: Message[];
    try {
      const body = await req.json();
      messages = body.messages;
    } catch {
      return NextResponse.json(
        { error: "Request body tidak valid." },
        { status: 400 },
      );
    }

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: "Messages tidak boleh kosong." },
        { status: 400 },
      );
    }

    // ── 2. Validate API key ──────────────────────────────────────────────
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      console.error("[Chatbot] GROQ_API_KEY tidak ditemukan di environment.");
      return NextResponse.json(
        { error: "Layanan AI belum dikonfigurasi." },
        { status: 503 },
      );
    }

    // ── 3. Sanitize & limit message history ─────────────────────────────
    // Batasi ke 10 pesan terakhir & max 2000 char per message
    const recentMessages = messages
      .slice(-10)
      .map((m) => ({
        role: m.role === "assistant" ? "assistant" : "user",
        content: String(m.content ?? "")
          .trim()
          .slice(0, 2000),
      }))
      .filter((m) => m.content.length > 0);

    if (recentMessages.length === 0) {
      return NextResponse.json(
        { error: "Pesan tidak boleh kosong." },
        { status: 400 },
      );
    }

    // ── 4. Build Groq API request ──────────────────────────────────────
    const apiMessages = [
      { role: "system", content: SYSTEM_PROMPT },
      ...recentMessages,
    ];

    // ── 5. Call Groq API ────────────────────────────────────
    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "llama-3.1-8b-instant", // Model yg sangat cepat dan gratis di Groq
          messages: apiMessages,
          max_tokens: 500,
          temperature: 0.7,
        }),
      },
    );

    // ── 6. Handle error responses ────────────────────────────────
    if (!response.ok) {
      let errorData: GroqResponse = {};
      try {
        errorData = await response.json();
      } catch {
        // response body might not be JSON
      }

      const errMsg = errorData?.error?.message ?? "Unknown error";
      const errType = errorData?.error?.type ?? response.status;
      // DEBUG: log full error detail
      console.error(
        `[Chatbot] Groq HTTP ${response.status} | type=${errType} | msg=${errMsg}`,
      );
      console.error(`[Chatbot] Full error:`, JSON.stringify(errorData));

      if (response.status === 401 || response.status === 403) {
        return NextResponse.json(
          { error: "API key tidak valid. Hubungi admin." },
          { status: 503 },
        );
      }
      if (response.status === 429) {
        return NextResponse.json(
          { error: "Layanan AI sedang sibuk. Coba beberapa saat lagi." },
          { status: 429 },
        );
      }
      if (response.status === 400) {
        return NextResponse.json(
          { error: "Permintaan tidak valid." },
          { status: 400 },
        );
      }

      return NextResponse.json(
        { error: "Gagal menghubungi layanan AI. Coba lagi nanti." },
        { status: 502 },
      );
    }

    // ── 7. Parse & return response ───────────────────────────────────────
    const data: GroqResponse = await response.json();
    const reply =
      data.choices?.[0]?.message?.content?.trim() ??
      "Maaf, tidak ada respons dari AI.";

    return NextResponse.json({ reply }, { status: 200 });
  } catch (error) {
    console.error("[Chatbot] Unexpected error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan internal. Coba lagi nanti." },
      { status: 500 },
    );
  }
}
