import { NextRequest, NextResponse } from "next/server";
import {
  GEMINI_BASE_URL,
  GEMINI_API_KEY,
  GEMINI_CANDIDATE_MODELS,
  callChatCompletionsVision,
  genAI,
} from "@/lib/gemini";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { imageData, mimeType = "image/jpeg", assetName, assetValue } = body;

    if (!imageData || !assetName) {
      return NextResponse.json(
        { error: "Parameter imageData dan assetName wajib diisi." },
        { status: 400 },
      );
    }

    const cleanBase64 = imageData.includes("base64,")
      ? imageData.split("base64,")[1]
      : imageData;

    const promptText = `
Anda adalah AI visual grounding dan OCR precision specialist.
Tugas Anda: Cari dan temukan posisi baris/angka dari aset "${assetName}" (dengan perkiraan nominal "${assetValue || ""}") pada gambar screenshot/dokumen ini.

Panduan:
1. Cari baris ticker/nama/kode instrumen (misalnya: jika aset adalah ADRO, cari baris "ADRO" beserta angka nominalnya di tabel atau daftar portofolio).
2. Kembalikan 2D bounding box [ymin, xmin, ymax, xmax] yang menutupi baris atau angka nilai dari instrumen tersebut.
3. Koordinat harus berupa integer ternormalisasi 0 sampai 1000:
   - ymin: posisi tepi atas (0-1000)
   - xmin: posisi tepi kiri (0-1000)
   - ymax: posisi tepi bawah (0-1000)
   - xmax: posisi tepi kanan (0-1000)
4. Bounding box ini akan dipakai untuk menggambar stabilo highlight transparan tepat di atas baris instrumen tersebut.

Format output HANYA JSON valid:
{
  "box_2d": [ymin, xmin, ymax, xmax]
}
`;

    const messages = [
      {
        role: "user",
        content: [
          { type: "text", text: promptText },
          {
            type: "image_url",
            image_url: {
              url: `data:${mimeType};base64,${cleanBase64}`,
            },
          },
        ],
      },
    ];

    let responseText = "";
    for (const modelToUse of GEMINI_CANDIDATE_MODELS) {
      try {
        responseText = await callChatCompletionsVision(
          GEMINI_BASE_URL,
          GEMINI_API_KEY,
          modelToUse,
          messages,
          0.0,
        );
        if (responseText) break;
      } catch (err: any) {
        console.warn(`[Locate Asset Vision] Model ${modelToUse} failed: ${err.message}`);
        // Fallback to GoogleGenAI SDK
        try {
          const geminiRes = await genAI.models.generateContent({
            model: modelToUse,
            contents: [
              { text: promptText },
              {
                inlineData: {
                  mimeType,
                  data: cleanBase64,
                },
              },
            ],
            config: {
              responseMimeType: "application/json",
              temperature: 0.0,
            },
          });
          if (geminiRes.text) {
            responseText = geminiRes.text;
            break;
          }
        } catch (sdkErr: any) {
          console.warn(`[Locate Asset SDK Fallback] failed: ${sdkErr.message}`);
        }
      }
    }

    if (!responseText) {
      return NextResponse.json({ box_2d: null });
    }

    let cleaned = responseText.trim();
    if (cleaned.startsWith("```")) {
      cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
    }

    let parsed: any = null;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      const firstOpen = cleaned.indexOf("{");
      const lastClose = cleaned.lastIndexOf("}");
      if (firstOpen !== -1 && lastClose > firstOpen) {
        parsed = JSON.parse(cleaned.substring(firstOpen, lastClose + 1));
      }
    }

    if (parsed && Array.isArray(parsed.box_2d) && parsed.box_2d.length === 4) {
      const [ymin, xmin, ymax, xmax] = parsed.box_2d.map((n: any) =>
        Math.max(0, Math.min(1000, Math.round(Number(n)))),
      );
      return NextResponse.json({ box_2d: [ymin, xmin, ymax, xmax] });
    }

    return NextResponse.json({ box_2d: null });
  } catch (error: any) {
    console.error("[Locate Asset Error]", error);
    return NextResponse.json(
      { error: error?.message || "Gagal melacak posisi aset pada gambar." },
      { status: 500 },
    );
  }
}
