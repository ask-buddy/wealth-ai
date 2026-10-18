import {
  GEMINI_BASE_URL,
  GEMINI_API_KEY,
  GEMINI_CANDIDATE_MODELS,
  genAI,
} from "../ai/config";
import { callChatCompletionsVision } from "../ai/client";
import { LOCATE_ASSET_PROMPT } from "../ai/prompts";

export interface LocateAssetParams {
  imageData: string;
  mimeType?: string;
  assetName: string;
  assetValue?: string;
}

/**
 * Pure visual grounding service to detect 2D bounding boxes for an asset on a document image.
 * Independent of HTTP frameworks, ready for desktop/Mac integration.
 */
export async function locateAssetBoundingBox(
  params: LocateAssetParams,
): Promise<[number, number, number, number] | null> {
  const { imageData, mimeType = "image/jpeg", assetName, assetValue } = params;

  if (!imageData || !assetName) {
    throw new Error("Parameter imageData dan assetName wajib diisi.");
  }

  const cleanBase64 = imageData.includes("base64,")
    ? imageData.split("base64,")[1]
    : imageData;

  const promptText = LOCATE_ASSET_PROMPT(assetName, assetValue);

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
      console.warn(`[Locate Asset Service] Model ${modelToUse} failed: ${err.message}`);
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
    return null;
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
    return [ymin, xmin, ymax, xmax];
  }

  return null;
}
