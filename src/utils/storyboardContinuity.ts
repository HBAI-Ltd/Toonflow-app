import { parseAssetCard } from "@/utils/characterSpec";

type ContinuityAsset = {
  id?: number | string | null;
  type?: string | null;
  name?: string | null;
  assetCard?: string | null;
  remark?: string | null;
  prompt?: string | null;
  describe?: string | null;
};

type ContinuityInput = {
  videoDesc?: string | null;
  prompt?: string | null;
  track?: string | number | null;
  assets?: ContinuityAsset[];
  selectedStoryboardImage?: boolean;
};

type LayoutStateInput = {
  id?: string | null;
  name?: string | null;
  structuralChanges?: unknown;
  hardRules?: unknown;
};

export type EffectiveLayout = {
  version: 1;
  source: "SpatialContract+LayoutState";
  sourceAssets: string[];
  fixedAnchors: string[];
  characterBlocking: string[];
  objectBlocking: string[];
  cameraAxis: string;
  invariants: string[];
  allowedStructuralChanges: string[];
  forbiddenDrift: string[];
  hardRules: string[];
  layoutState?: {
    id: string;
    name: string;
    structuralChanges: string[];
    hardRules: string[];
  };
};

type ContinuityContract = {
  version: 1;
  storyPurpose: string;
  startState: {
    track: string;
    keyframe: string;
    scene: string[];
    characters: string[];
    props: string[];
  };
  allowedChanges: string[];
  locked: string[];
  endState: string;
  qaChecks: string[];
};

function compact(value: unknown, max = 220): string {
  const text = String(value ?? "").replace(/\s+/g, " ").trim();
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

function assetName(asset: ContinuityAsset): string {
  const id = asset.id == null ? "" : `#${asset.id} `;
  return `${id}${asset.name || asset.type || "资产"}`.trim();
}

// 只读资产卡结构化的空间锁定项（forbiddenDrift / invariants），不再用关键词正则猜测自由文本。
// 资产卡的 spatialContinuity 由 generateAssetCard 阶段保证结构化（源头强化 + LLM 语义抽取）。
function assetSpatialLocks(asset: ContinuityAsset): string[] {
  const spatial = assetSpatial(asset);
  return unique([...spatial.forbiddenDrift, ...spatial.invariants]).slice(0, 6);
}

function parseContract(value: unknown): ContinuityContract | null {
  if (!value) return null;
  if (typeof value === "object") return value as ContinuityContract;
  const text = String(value).trim();
  if (!text) return null;
  try {
    return JSON.parse(text) as ContinuityContract;
  } catch {
    return null;
  }
}

function valueList(value: unknown): string[] {
  if (value == null || value === "") return [];
  if (Array.isArray(value)) return value.flatMap(valueList);
  if (typeof value === "object") {
    return Object.entries(value as Record<string, unknown>)
      .map(([key, val]) => `${key}: ${valueList(val).join("、") || String(val ?? "").trim()}`)
      .map((item) => compact(item, 180))
      .filter(Boolean);
  }
  return String(value)
    .split(/[\n；;|]+/)
    .map((item) => compact(item, 180).replace(/[。,.，、]+$/g, ""))
    .filter(Boolean);
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values.map((item) => item.trim()).filter(Boolean)));
}

function assetSpatial(asset: ContinuityAsset) {
  const card = parseAssetCard(asset.remark);
  const spatial = (card?.spatialContinuity || {}) as Record<string, unknown>;
  return {
    fixedAnchors: valueList(spatial.fixedAnchors || card?.fixedAnchors || card?.spatialLayout || card?.layout),
    characterBlocking: valueList(spatial.characterBlocking || card?.characterBlocking),
    objectBlocking: valueList(spatial.objectBlocking || card?.objectBlocking || card?.fixedElements || card?.setDressing),
    cameraAxis: valueList(spatial.cameraAxis || card?.cameraAxis)[0] || "",
    invariants: valueList(spatial.invariants || card?.spatialInvariants),
    allowedChanges: valueList(spatial.allowedChanges || card?.allowedSpatialChanges),
    forbiddenDrift: valueList(spatial.forbiddenDrift || card?.forbiddenSpatialDrift),
  };
}

export function compileEffectiveLayout(input: { assets?: ContinuityAsset[]; layoutState?: LayoutStateInput | null }): EffectiveLayout | null {
  const assets = Array.isArray(input.assets) ? input.assets : [];
  // 只读资产卡结构化的 spatialContinuity；空间数据由 generateAssetCard 阶段保证完整。
  const spatialByAsset = assets.map((asset) => ({ asset, spatial: assetSpatial(asset) }));
  const hasStructuredSpatial = (s: ReturnType<typeof assetSpatial>) =>
    s.fixedAnchors.length || s.characterBlocking.length || s.objectBlocking.length || s.invariants.length || s.forbiddenDrift.length || Boolean(s.cameraAxis);
  const sourceAssets = spatialByAsset
    .filter(({ spatial }) => hasStructuredSpatial(spatial))
    .map(({ asset }) => assetName(asset));
  const spatialBlocks = spatialByAsset.map(({ spatial }) => spatial);
  const fixedAnchors = unique(spatialBlocks.flatMap((item) => item.fixedAnchors));
  const characterBlocking = unique(spatialBlocks.flatMap((item) => item.characterBlocking));
  const objectBlocking = unique(spatialBlocks.flatMap((item) => item.objectBlocking));
  const invariants = unique(spatialBlocks.flatMap((item) => item.invariants));
  const allowedStructuralChanges = unique(spatialBlocks.flatMap((item) => item.allowedChanges));
  const forbiddenDrift = unique(spatialBlocks.flatMap((item) => item.forbiddenDrift));
  const cameraAxis = spatialBlocks.map((item) => item.cameraAxis).find(Boolean) || "";
  const hasContract = sourceAssets.length || fixedAnchors.length || characterBlocking.length || objectBlocking.length || invariants.length || forbiddenDrift.length;
  if (!hasContract) return null;

  const layoutStateChanges = valueList(input.layoutState?.structuralChanges);
  const layoutStateRules = valueList(input.layoutState?.hardRules);
  const layoutState = input.layoutState && (layoutStateChanges.length || layoutStateRules.length)
    ? {
        id: String(input.layoutState.id || "default"),
        name: String(input.layoutState.name || input.layoutState.id || "默认空间状态"),
        structuralChanges: layoutStateChanges,
        hardRules: layoutStateRules,
      }
    : undefined;

  return {
    version: 1,
    source: "SpatialContract+LayoutState",
    sourceAssets,
    fixedAnchors,
    characterBlocking,
    objectBlocking,
    cameraAxis,
    invariants,
    allowedStructuralChanges,
    forbiddenDrift,
    hardRules: unique([
      "SpatialContract 是唯一空间真相；StateOverlay、Shot 和 Prompt 不得移动固定锚点或重排大件陈设。",
      "LayoutState 只允许表达剧情确认的物理空间变更；没有 LayoutState 时按默认空间执行。",
      "未被剧情明确改变的固定物、承载关系、前后景层级和人物 Blocking 必须保持。",
      ...forbiddenDrift,
      ...layoutStateRules,
    ]),
    ...(layoutState ? { layoutState } : {}),
  };
}

export function formatEffectiveLayoutForPrompt(layout: EffectiveLayout | null | undefined): string {
  if (!layout) return "";
  return [
    "【EffectiveLayout｜唯一空间执行输入】",
    layout.sourceAssets.length ? `- 来源资产：${layout.sourceAssets.join("、")}` : "",
    layout.fixedAnchors.length ? `- 固定锚点：${layout.fixedAnchors.join("；")}` : "",
    layout.objectBlocking.length ? `- 道具/陈设位置：${layout.objectBlocking.join("；")}` : "",
    layout.characterBlocking.length ? `- 人物 Blocking：${layout.characterBlocking.join("；")}` : "",
    layout.cameraAxis ? `- 视轴线：${layout.cameraAxis}` : "",
    layout.invariants.length ? `- 空间不变量：${layout.invariants.join("；")}` : "",
    layout.allowedStructuralChanges.length ? `- 允许的结构变化：${layout.allowedStructuralChanges.join("；")}` : "",
    layout.forbiddenDrift.length ? `- 禁止漂移：${layout.forbiddenDrift.join("；")}` : "",
    layout.layoutState ? `- 当前 LayoutState：${layout.layoutState.name}；${layout.layoutState.structuralChanges.join("；")}` : "- 当前 LayoutState：默认空间状态，无剧情确认的物理变更。",
    layout.hardRules.length ? `- 硬规则：${layout.hardRules.join("；")}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

export function buildStoryboardContinuityContract(input: ContinuityInput): ContinuityContract {
  const assets = Array.isArray(input.assets) ? input.assets : [];
  const scenes = assets.filter((asset) => asset.type === "scene").map(assetName);
  const roles = assets.filter((asset) => asset.type === "role").map(assetName);
  const props = assets.filter((asset) => asset.type === "tool").map(assetName);
  const extractedLocks = unique(assets.flatMap(assetSpatialLocks));

  return {
    version: 1,
    storyPurpose: compact(input.videoDesc || input.prompt || "承接本镜头剧情"),
    startState: {
      track: compact(input.track || "主轨道", 60),
      keyframe: compact(input.prompt || input.videoDesc || ""),
      scene: scenes,
      characters: roles,
      props,
    },
    allowedChanges: [
      "以本镜头 videoDesc 明确写出的剧情动作、台词、音效和运镜为准",
      "允许表情、视线、手部、小幅身体动作、景别和镜头运动变化",
    ],
    locked: [
      "剧情未明确要求时，固定场景结构和大件陈设不移动、不重排",
      "每个角色只出现一次，不新增、不复制、不合并、不串脸",
      "已关联道具保持与画面描述一致的位置关系",
      ...extractedLocks,
    ],
    endState: compact(input.videoDesc || "保持本镜头结束时的剧情状态"),
    qaChecks: [
      "角色身份可辨认且不重复",
      "固定空间锚点未无依据漂移",
      "关键道具与人物关系符合画面描述",
      "生成结果不得违背本镜头明确剧情动作",
    ],
  };
}

export function normalizeStoryboardContinuityContract(value: unknown, fallback: ContinuityInput): string {
  return JSON.stringify(parseContract(value) || buildStoryboardContinuityContract(fallback));
}

export function formatStoryboardContinuityForVideoPrompt(value: unknown, fallback: ContinuityInput): string {
  const contract = parseContract(value) || buildStoryboardContinuityContract(fallback);
  const start = contract.startState;
  return [
    "【镜头连续性合同】",
    `- 剧情目的：${contract.storyPurpose}`,
    `- 起始状态：轨道 ${start.track}；关键帧：${start.keyframe || "按分镜画面描述执行"}`,
    start.scene.length ? `- 场景资产：${start.scene.join("、")}` : "",
    start.characters.length ? `- 角色资产：${start.characters.join("、")}` : "",
    start.props.length ? `- 道具资产：${start.props.join("、")}` : "",
    `- 允许变化：${contract.allowedChanges.join("；")}`,
    `- 锁定项：${[...new Set(contract.locked)].join("；")}`,
    `- 结束状态：${contract.endState}`,
    `- QA检查：${contract.qaChecks.join("；")}`,
    "【剧情优先规则】若合同与 videoDesc 冲突，以 videoDesc 明确剧情动作优先；未被 videoDesc 明确改变的空间、人物、道具关系按合同保持。",
    fallback.selectedStoryboardImage ? "【首帧参考】本镜头已有 QA 通过并被选中的分镜图，视频生成时必须把它作为首帧/空间底盘。" : "",
  ]
    .filter(Boolean)
    .join("\n");
}

export function escapeXmlAttr(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/'/g, "&apos;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
