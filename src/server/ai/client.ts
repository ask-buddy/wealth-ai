/**
 * AI Client connector supporting OpenAI-compatible chat completions and GoogleGenAI SDK
 */

export async function callChatCompletionsVision(
  baseUrl: string,
  apiKey: string,
  model: string,
  messages: any[],
  temperature = 0.0,
): Promise<string> {
  const cleanBase = baseUrl.trim().replace(/\/+$/, "");
  const apiRoot = cleanBase.endsWith("/v1") ? cleanBase : `${cleanBase}/v1`;
  const url = `${apiRoot}/chat/completions`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: model,
      stream: false,
      temperature,
      messages: messages,
    }),
  });

  const raw = await res.text();
  if (!res.ok) {
    console.error(
      `[AI Client Error ${res.status}] Target URL: ${url}`,
      raw.slice(0, 300),
    );
    throw new Error(`[AI Client Error ${res.status}] ${raw.slice(0, 300)}`);
  }

  // Handle Server-Sent Events (SSE) if returned
  if (raw.startsWith("data:")) {
    const lines = raw.split("\n");
    let content = "";
    for (const line of lines) {
      if (line.startsWith("data: ") && !line.includes("[DONE]")) {
        try {
          const parsed = JSON.parse(line.substring(6));
          const delta =
            parsed.choices?.[0]?.delta?.content ||
            parsed.choices?.[0]?.message?.content ||
            "";
          content += delta;
        } catch {}
      }
    }
    return content;
  }

  const json = JSON.parse(raw);
  return json.choices?.[0]?.message?.content || "";
}

export function cleanAndExtractJson(raw: string): any {
  let cleaned = raw.trim();

  // Strip markdown code fences if wrapped in ```json ... ``` or ``` ... ```
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
    cleaned = cleaned.trim();
  }

  try {
    return JSON.parse(cleaned);
  } catch {
    const firstOpen = cleaned.indexOf("{");
    const lastClose = cleaned.lastIndexOf("}");

    if (firstOpen !== -1 && lastClose !== -1 && lastClose > firstOpen) {
      const slice = cleaned.substring(firstOpen, lastClose + 1);
      try {
        return JSON.parse(slice);
      } catch {
        const sanitized = slice
          .replace(/,\s*([\]}])/g, "$1")
          .replace(/\r\n/g, "\n");
        return JSON.parse(sanitized);
      }
    }
    throw new Error(
      "Respon data dari model AI tidak lengkap atau tidak valid sebagai format JSON.",
    );
  }
}
