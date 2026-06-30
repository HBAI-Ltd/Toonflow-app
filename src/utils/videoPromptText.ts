const START_MARKERS = [
  /\[References\]/,
  /\[Visual\]/,
  /将\s*@(?:图|图片)\d+\s+中的/,
  /生成一个由以下\s*\d+\s*个分镜组成的视频/,
];

export function sanitizeGeneratedVideoPrompt(value: string) {
  const raw = String(value || "")
    .replace(/^```(?:\w+)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  // ponytail: heuristic guard for model reasoning leaks; use structured output when the model route supports it.
  const firstMarker = START_MARKERS.map((pattern) => pattern.exec(raw)?.index ?? -1)
    .filter((index) => index >= 0)
    .sort((a, b) => a - b)[0];

  if (firstMarker > 0) return raw.slice(firstMarker).trim();

  return raw
    .replace(/^(?:Here(?:'s| is)|Below is|Sure[,，]?|好的[,，]?)[^\n]*\n+/i, "")
    .trim();
}
