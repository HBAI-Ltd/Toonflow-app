import u from "@/utils";

export interface VisionProviderProbeInput {
  providerId?: string;
  baseUrl?: string;
  apiKey?: string;
  model?: string;
  timeoutMs?: number;
}

async function loadSettings(): Promise<Record<string, string>> {
  const rows = await u.db("o_setting").whereLike("key", "sr.%").select("key", "value");
  return Object.fromEntries(rows.map((row) => [String(row.key), String(row.value ?? "")]));
}

function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.trim().replace(/\/+$/, "");
}

function maskKey(apiKey: string): string {
  if (!apiKey) return "";
  if (apiKey.length <= 8) return "***";
  return `${apiKey.slice(0, 4)}...${apiKey.slice(-4)}`;
}

async function probeOpenAICompatible(input: Required<Pick<VisionProviderProbeInput, "baseUrl" | "apiKey" | "model">> & { timeoutMs: number }) {
  const startedAt = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), input.timeoutMs);
  try {
    const response = await fetch(`${normalizeBaseUrl(input.baseUrl)}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${input.apiKey.replace(/^Bearer\s+/i, "")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: input.model,
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: "Return JSON: {\"ok\":true}" },
              {
                type: "image_url",
                image_url: {
                  url: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=",
                },
              },
            ],
          },
        ],
        max_tokens: 16,
      }),
      signal: controller.signal,
    });
    const text = await response.text();
    const latencyMs = Date.now() - startedAt;
    let parsed: unknown = text;
    try {
      parsed = JSON.parse(text);
    } catch {
      // Keep raw text so the caller can see why the provider failed JSON parsing.
    }
    if (!response.ok) {
      return { ok: false, status: "unavailable" as const, latencyMs, reason: `HTTP ${response.status}: ${text.slice(0, 300)}`, response: parsed };
    }
    return { ok: true, status: "available" as const, latencyMs, reason: "vision provider accepted image input", response: parsed };
  } catch (err) {
    return { ok: false, status: "unavailable" as const, latencyMs: Date.now() - startedAt, reason: err instanceof Error ? err.message : String(err) };
  } finally {
    clearTimeout(timer);
  }
}

export async function checkVisionProvider(input: VisionProviderProbeInput = {}) {
  const settings = await loadSettings();
  const providerId = input.providerId || settings["sr.visionProvider"] || "worldclawpro";
  const baseUrl = input.baseUrl || settings["sr.visionBaseUrl"] || "";
  const model = input.model || settings["sr.visionModel"] || "";
  const timeoutMs = input.timeoutMs || Number(settings["sr.visionRequestTimeoutMs"] || 30000);
  let apiKey = input.apiKey || "";
  if (!apiKey) {
    const vendor = await u.db("o_vendorConfig").where("id", providerId).first();
    const values = vendor?.inputValues ? (JSON.parse(vendor.inputValues) as Record<string, string>) : {};
    apiKey = values.apiKey || "";
  }

  const config = {
    providerId,
    baseUrl,
    model,
    hasApiKey: Boolean(apiKey),
    apiKeyPreview: maskKey(apiKey),
    timeoutMs,
  };
  if (!baseUrl) return { ok: false, status: "unavailable" as const, reason: "vision baseUrl is missing", config };
  if (!model) return { ok: false, status: "unavailable" as const, reason: "vision model is missing", config };
  if (!apiKey) return { ok: false, status: "unavailable" as const, reason: "vision apiKey is missing", config };

  const result = await probeOpenAICompatible({ baseUrl, apiKey, model, timeoutMs });
  return { ...result, config };
}
