export type CharacterSpec = Record<string, unknown>;

const CARD_SCHEMAS = new Set(["toonflow.roleCard.v1", "toonflow.sceneCard.v1", "toonflow.propCard.v1", "toonflow.characterSpec.v1"]);

export function parseAssetCard(remark: unknown): CharacterSpec | null {
  const text = String(remark || "").trim();
  if (!text) return null;
  try {
    const data = JSON.parse(text);
    const spec = data?.assetCard || data?.characterSpec || (CARD_SCHEMAS.has(data?.schema) ? data : null);
    return spec && typeof spec === "object" && !Array.isArray(spec) ? spec : null;
  } catch {
    return null;
  }
}

export function parseCharacterSpec(remark: unknown): CharacterSpec | null {
  return parseAssetCard(remark);
}

export function assetCardPrompt(remark: unknown): string {
  const spec = parseAssetCard(remark);
  if (!spec) return "";
  return assetCardRows(spec).join("\n");
}

export function characterSpecPrompt(remark: unknown): string {
  return assetCardPrompt(remark);
}

function assetCardRows(spec: CharacterSpec): string[] {
  const constraints = spec.constraints as any;
  const lines = [
    field("摘要", spec.summary),
    field("面部", spec.faceReference || spec.face),
    field("体型/身高", spec.bodyReference || spec.height || spec.body),
    field("发型", spec.hair),
    field("服装", spec.costume),
    field("空间结构", spec.spatialLayout || spec.layout),
    field("光源", spec.lighting),
    field("固定陈设", spec.fixedElements || spec.setDressing),
    field("形状", spec.shape),
    field("材质", spec.material),
    field("尺寸", spec.size),
    field("使用方式", spec.usage),
    field("配色", spec.palette || spec.colors),
    field("细节", spec.details || spec.costumeDetails),
    field("备注", spec.sourceRemark),
    field("氛围", spec.atmosphere),
    field("表情", spec.expressions),
    field("必须保持", constraints?.must || spec.must),
    field("禁止", constraints?.avoid || spec.avoid || spec.negative),
  ].filter(Boolean);
  return lines;
}

function field(label: string, value: unknown): string {
  const text = valueText(value);
  return text ? `${label}: ${text}` : "";
}

function valueText(value: unknown): string {
  if (value == null || value === "") return "";
  if (Array.isArray(value)) return value.map(valueText).filter(Boolean).join("、");
  if (typeof value === "object") {
    return Object.entries(value as Record<string, unknown>)
      .map(([key, val]) => `${key}=${valueText(val)}`)
      .filter((item) => !item.endsWith("="))
      .join("、");
  }
  return String(value).trim();
}
