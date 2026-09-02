import { isSeedance2Model } from "@/lib/videoPromptReferences";

const FRAME_INPUT_MODES = new Set(["singleImage", "startEndRequired", "endFrameOptional", "startFrameOptional"]);

function normalizeMode(mode: unknown): unknown {
  if (typeof mode !== "string") return mode;
  const value = mode.trim();
  if (!value.startsWith("[")) return value;

  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

export function selectVideoPromptTemplateFile(modelName: string, mode: unknown): string | null {
  const normalizedMode = normalizeMode(mode);
  const normalizedModel = modelName.toLowerCase();

  if (Array.isArray(normalizedMode)) {
    return isSeedance2Model(modelName) ? "seedance2Multi-parameterMode.md" : "universalMulti-parameterMode.md";
  }

  if (FRAME_INPUT_MODES.has(String(normalizedMode))) {
    if (normalizedMode === "singleImage" && normalizedModel.includes("wan") && normalizedModel.includes("2.6")) {
      return "wan2.6Single-imageFirstFrameMode.md";
    }
    return "universalFirstAndLastFrameMode.md";
  }

  return null;
}
