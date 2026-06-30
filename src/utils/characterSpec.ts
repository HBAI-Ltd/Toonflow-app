export type CharacterSpec = Record<string, unknown>;

const CARD_SCHEMAS = new Set(["toonflow.roleCard.v1", "toonflow.sceneCard.v1", "toonflow.propCard.v1", "toonflow.characterSpec.v1"]);
const ASSET_TYPE_SCHEMAS: Record<string, string> = {
  role: "toonflow.roleCard.v1",
  scene: "toonflow.sceneCard.v1",
  tool: "toonflow.propCard.v1",
};

const ASSET_CARD_LABELS = [
  { label: "摘要", path: ["summary"], list: false },
  { label: "面部", path: ["faceReference"], list: false },
  { label: "体型/身高", path: ["bodyReference"], list: false },
  { label: "发型", path: ["hair"], list: false },
  { label: "服装", path: ["costume"], list: false },
  { label: "空间结构", path: ["spatialLayout"], list: false },
  { label: "空间连续性锚点", path: ["spatialContinuity", "fixedAnchors"], list: true },
  { label: "人物调度基准", path: ["spatialContinuity", "characterBlocking"], list: true },
  { label: "道具/陈设位置", path: ["spatialContinuity", "objectBlocking"], list: true },
  { label: "视轴线", path: ["spatialContinuity", "cameraAxis"], list: false },
  { label: "空间不变量", path: ["spatialContinuity", "invariants"], list: true },
  { label: "允许变化", path: ["spatialContinuity", "allowedChanges"], list: true },
  { label: "禁止漂移", path: ["spatialContinuity", "forbiddenDrift"], list: true },
  { label: "光源", path: ["lighting"], list: false },
  { label: "固定陈设", path: ["fixedElements"], list: true },
  { label: "形状", path: ["shape"], list: false },
  { label: "材质", path: ["material"], list: false },
  { label: "尺寸", path: ["size"], list: false },
  { label: "使用方式", path: ["usage"], list: false },
  { label: "细节", path: ["details"], list: true },
  { label: "备注", path: ["sourceRemark"], list: false },
  { label: "氛围", path: ["atmosphere"], list: false },
  { label: "表情", path: ["expressions"], list: true },
  { label: "必须保持", path: ["constraints", "must"], list: true },
  { label: "禁止", path: ["constraints", "avoid"], list: true },
];

export function parseAssetCard(remark: unknown): CharacterSpec | null {
  const text = String(remark || "").trim();
  if (!text) return null;
  try {
    const data = JSON.parse(text);
    const spec = data?.assetCard || data?.characterSpec || (CARD_SCHEMAS.has(data?.schema) ? data : null);
    return spec && typeof spec === "object" && !Array.isArray(spec) && hasAssetCardContent(spec) ? spec : null;
  } catch {
    return null;
  }
}

export function hasAssetCardContent(spec: unknown): boolean {
  if (!spec || typeof spec !== "object" || Array.isArray(spec)) return false;
  return Object.entries(spec as Record<string, unknown>).some(([key, value]) => key !== "schema" && hasUsefulValue(value));
}

export function parseCharacterSpec(remark: unknown): CharacterSpec | null {
  return parseAssetCard(remark);
}

export function assetCardFromPromptText(
  prompt: unknown,
  assetType: unknown,
  context: { summary?: unknown; existingRemark?: unknown } = {},
): CharacterSpec | null {
  const text = String(prompt || "").trim();
  if (!text) return null;

  const card: CharacterSpec = {
    schema: ASSET_TYPE_SCHEMAS[String(assetType || "")] || "toonflow.characterSpec.v1",
  };
  const matchedLabels: string[] = [];
  const lines = text.split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();
    for (const def of ASSET_CARD_LABELS) {
      const match = trimmed.match(new RegExp(`^${escapeRegExp(def.label)}\\s*[：:]\\s*(.+)$`));
      if (!match) continue;
      matchedLabels.push(def.label);
      assignPath(card, def.path, def.list ? splitListValue(match[1]) : match[1].trim());
      break;
    }
  }

  if (!matchedLabels.length) return null;

  if (!card.summary) {
    card.summary = String(context.summary || promptLeadText(text) || "").trim();
  }
  const existingRemark = parseAssetCard(context.existingRemark);
  const merged = existingRemark ? mergeAssetCards(existingRemark, card) : card;
  return hasAssetCardContent(merged) ? merged : null;
}

export function mergeAssetCards(base: CharacterSpec, patch: CharacterSpec): CharacterSpec {
  const next: CharacterSpec = { ...base, ...patch };
  const baseSpatial = base.spatialContinuity as CharacterSpec | undefined;
  const patchSpatial = patch.spatialContinuity as CharacterSpec | undefined;
  if (baseSpatial || patchSpatial) {
    next.spatialContinuity = { ...(baseSpatial || {}), ...(patchSpatial || {}) };
  }
  const baseConstraints = base.constraints as CharacterSpec | undefined;
  const patchConstraints = patch.constraints as CharacterSpec | undefined;
  if (baseConstraints || patchConstraints) {
    next.constraints = { ...(baseConstraints || {}), ...(patchConstraints || {}) };
  }
  return next;
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
  const spatialContinuity = spec.spatialContinuity as any;
  const lines = [
    field("摘要", spec.summary),
    field("面部", spec.faceReference || spec.face),
    field("体型/身高", spec.bodyReference || spec.height || spec.body),
    field("发型", spec.hair),
    field("服装", spec.costume),
    field("空间结构", spec.spatialLayout || spec.layout),
    field("空间连续性锚点", spatialContinuity?.fixedAnchors || spec.fixedAnchors),
    field("人物调度基准", spatialContinuity?.characterBlocking || spec.characterBlocking),
    field("道具/陈设位置", spatialContinuity?.objectBlocking || spec.objectBlocking),
    field("视轴线", spatialContinuity?.cameraAxis || spec.cameraAxis),
    field("空间不变量", spatialContinuity?.invariants || spec.spatialInvariants),
    field("允许变化", spatialContinuity?.allowedChanges || spec.allowedSpatialChanges),
    field("禁止漂移", spatialContinuity?.forbiddenDrift || spec.forbiddenSpatialDrift),
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

function hasUsefulValue(value: unknown): boolean {
  if (value == null) return false;
  if (typeof value === "string") return value.trim().length > 0;
  if (typeof value === "number" || typeof value === "boolean") return true;
  if (Array.isArray(value)) return value.some(hasUsefulValue);
  if (typeof value === "object") return Object.values(value as Record<string, unknown>).some(hasUsefulValue);
  return false;
}

function assignPath(target: CharacterSpec, path: string[], value: unknown) {
  let current = target;
  for (const key of path.slice(0, -1)) {
    const next = current[key];
    if (!next || typeof next !== "object" || Array.isArray(next)) current[key] = {};
    current = current[key] as CharacterSpec;
  }
  current[path[path.length - 1]] = value;
}

function splitListValue(value: string): string[] {
  return value
    .split(/[；;\n]+/)
    .map((item) => item.trim().replace(/[。,.，、]+$/g, ""))
    .filter(Boolean);
}

function promptLeadText(text: string): string {
  const firstLabelIndex = ASSET_CARD_LABELS
    .map((def) => text.search(new RegExp(`(^|\\n)\\s*${escapeRegExp(def.label)}\\s*[：:]`)))
    .filter((index) => index >= 0)
    .sort((a, b) => a - b)[0];
  const lead = (firstLabelIndex >= 0 ? text.slice(0, firstLabelIndex) : text)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)[0] || "";
  return lead.length > 240 ? `${lead.slice(0, 240)}...` : lead;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
