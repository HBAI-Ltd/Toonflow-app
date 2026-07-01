import type { AssetBinding, AssetSlot } from "./schemas";

export interface NormalizedAssetSlot {
  slot: string;
  type: AssetSlot["type"];
  required: boolean;
  description?: string;
}

type SlotInput = {
  slot: string;
  type: AssetSlot["type"];
  required?: boolean;
  description?: string;
};

type BindingSlotInput = Pick<AssetBinding, "slotName" | "slotType">;

function cleanSlotName(value: string): string {
  return value
    .trim()
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ");
}

function normalizedText(value: string): string {
  return cleanSlotName(value).toLowerCase();
}

function compactText(value: string): string {
  return normalizedText(value).replace(/[\s_.,;:()[\]{}'"`，。；：、（）【】《》“”‘’]/g, "");
}

function matchesAny(value: string, patterns: RegExp[]): boolean {
  return patterns.some((pattern) => pattern.test(value));
}

export function isSubtitleLikeAssetSlot(slotName: string): boolean {
  const text = normalizedText(slotName);
  const compact = compactText(slotName);
  return (
    matchesAny(text, [
      /\bsubtitles?\b/,
      /\bcaptions?\b/,
      /\bclosed captions?\b/,
    ]) ||
    matchesAny(compact, [/字幕/, /字幕条/, /字幕贴片/, /贴片字幕/])
  );
}

function roleSlotName(slotName: string): string {
  const text = normalizedText(slotName);
  const compact = compactText(slotName);
  const indexedRole = text.match(/^(c|person|role)\s*(\d+)$/);
  if (indexedRole) return `角色 ${indexedRole[2]}`;
  if (compact === "角色1" || compact === "人物1") return "角色 1";
  if (compact === "角色2" || compact === "人物2") return "角色 2";
  if (matchesAny(text, [/\bpresenter\b/, /\bhost\b/, /\bspeaker\b/, /\bmain subject\b/]) || matchesAny(compact, [/讲解/, /主持/, /主播/, /出镜/])) return "讲解者";
  if (matchesAny(text, [/\bpatient\b/, /\bclient\b/, /\bcustomer\b/, /\bmodel\b/, /\bsubject\b/, /\badult male face\b/, /\byoung adult\b/]) || matchesAny(compact, [/顾客/, /客户/, /患者/, /模特/, /被拍摄/])) return "顾客";
  if (matchesAny(text, [/\bpractitioner\b/, /\bconsultant\b/, /\boperator\b/, /\bdoctor\b/, /\bnurse\b/, /\bstaff\b/]) || matchesAny(compact, [/操作/, /咨询师/, /医生/, /护士/, /技师/, /护理师/])) return "操作者";
  return cleanSlotName(slotName);
}

function sceneSlotName(slotName: string): string {
  const text = normalizedText(slotName);
  const compact = compactText(slotName);
  const indexedScene = text.match(/^(s|scene)\s*(\d+)$/);
  if (indexedScene) return `场景 ${indexedScene[2]}`;
  if (text === "location") return "场景";
  if (compact === "场景1") return "场景 1";
  if (compact === "场景2") return "场景 2";
  if (matchesAny(text, [/\bsplit screen\b/]) || matchesAny(compact, [/splitscreen/, /分屏/])) return "分屏画面";
  if (matchesAny(text, [/\bdecorative backdrop\b/, /\bbackdrop\b/]) || matchesAny(compact, [/decorativebackdrop/, /装饰背景/, /背景板/])) return "装饰背景";
  if (matchesAny(text, [/\bblack\b/, /\bdark background\b/]) || matchesAny(compact, [/深色/, /黑色背景/])) return "深色特写背景";
  if (matchesAny(text, [/\bcomparison graphic background\b/]) || matchesAny(compact, [/对比图背景/])) return "对比图背景";
  if (
    matchesAny(text, [/\bclinic\b/, /\bconsultation\b/, /\btreatment\b/, /\bprocedure\b/, /\binterior room\b/, /\bindoor\b/, /\bstudio\b/, /\broom\b/, /\bcorner\b/]) ||
    matchesAny(compact, [/诊室/, /咨询/, /护理/, /操作室/, /室内/, /房间/, /工作室/])
  ) {
    return "咨询/护理室";
  }
  return cleanSlotName(slotName);
}

function objectSlotName(slotName: string, type: AssetSlot["type"]): string {
  const text = normalizedText(slotName);
  const compact = compactText(slotName);
  const indexedProp = text.match(/^(p|prop)\s*(\d+)$/);
  if (indexedProp) return `道具 ${indexedProp[2]}`;
  if (compact === "道具1") return "道具 1";
  if (compact === "道具2") return "道具 2";
  if (matchesAny(text, [/\btext overlays?\b/, /\boverlay text\b/, /\bonscreen text\b/, /\bon-screen text\b/, /\btitle card\b/]) || matchesAny(compact, [/文字贴片/, /文本贴片/, /屏幕文字/, /画面文字/, /文字层/, /文案贴片/, /textoverlay/])) return "文字贴片";
  if (matchesAny(text, [/\blavalier\b/, /\blapel\b/, /\bclip mic\b/, /\bclip on microphone\b/, /\bwireless lav\b/, /\bmicrophone\b/, /\bmic\b/]) || matchesAny(compact, [/领夹麦/, /麦克风/])) return "领夹麦";
  if (matchesAny(text, [/\btripod\b/, /\blight stand\b/, /\bcamera\b/, /\brig\b/]) || matchesAny(compact, [/三脚架/, /灯架/, /相机/, /拍摄设备/])) return "相机/灯光设备";
  if (matchesAny(text, [/\breclining chair\b/, /\btreatment chair\b/, /\bchair\b/, /\bsofa\b/, /\bseat\b/]) || matchesAny(compact, [/护理椅/, /躺椅/, /椅子/, /沙发/, /座椅/])) return "椅子/护理椅";
  if (matchesAny(text, [/\btable\b/, /\bcounter\b/, /\bcabinet\b/, /\bcountertop\b/]) || matchesAny(compact, [/桌/, /柜台/, /柜子/, /台面/])) return "桌面/柜台";
  if (matchesAny(text, [/\bgloves?\b/]) || matchesAny(compact, [/手套/])) return "手套";
  if (matchesAny(text, [/\bsmartphone\b/, /\bphone\b/]) || matchesAny(compact, [/手机/])) return "手机";
  if (matchesAny(text, [/\bpen\b/, /\bpointer\b/]) || matchesAny(compact, [/笔/, /指示棒/])) return "笔/指示工具";
  if (matchesAny(text, [/\bheadband\b/, /\bhair band\b/]) || matchesAny(compact, [/发带/, /头带/])) return "发带";
  if (matchesAny(text, [/\bguide lines?\b/, /\bannotation lines?\b/, /\barrows?\b/, /\bmagnifier\b/, /\bsticker\b/]) || matchesAny(compact, [/辅助线/, /标注线/, /箭头/, /放大镜/, /贴纸/])) return "图形标注";
  if (matchesAny(text, [/\bmirror\b/]) || matchesAny(compact, [/手镜/, /镜子/])) return "手镜";
  if (matchesAny(text, [/\bmask\b/]) || matchesAny(compact, [/口罩/])) return "口罩";
  if (matchesAny(text, [/\bdrape\b/, /\bsheet\b/]) || matchesAny(compact, [/盖布/, /铺巾/])) return "盖布/铺巾";
  if (matchesAny(text, [/\bcold pack\b/, /\btissue\b/]) || matchesAny(compact, [/冷敷/, /纸巾/])) return "冷敷包/纸巾";
  if (matchesAny(text, [/\bposter board\b/]) || matchesAny(compact, [/展示板/, /海报板/])) return "展示板";
  if (matchesAny(text, [/\bdecorative backdrop\b/, /\bbackdrop\b/]) || matchesAny(compact, [/decorativebackdrop/, /装饰背景/, /背景板/])) return "装饰背景";
  if (matchesAny(text, [/\bfire extinguishers?\b/]) || matchesAny(compact, [/灭火器/])) return "灭火器";
  if (matchesAny(text, [/\bsplit screen\b/]) || matchesAny(compact, [/splitscreen/, /分屏/])) return "分屏画面";
  if (type === "clothing" && matchesAny(compact, [/衣/, /服装/])) return "服装";
  return cleanSlotName(slotName);
}

function normalizedSlotName(slotName: string, type: AssetSlot["type"]): string {
  if (type === "role") return roleSlotName(slotName);
  if (type === "scene") return sceneSlotName(slotName);
  if (type === "prop" || type === "product" || type === "clothing") return objectSlotName(slotName, type);
  return cleanSlotName(slotName);
}

export function assetSlotKey(slotType: AssetSlot["type"], slotName: string): string {
  return `${slotType}:${slotName}`;
}

export function normalizeAssetSlot(slot: SlotInput): NormalizedAssetSlot | null {
  const slotName = cleanSlotName(slot.slot);
  if (!slotName || isSubtitleLikeAssetSlot(slotName)) return null;
  const normalized = normalizedSlotName(slotName, slot.type);
  if (!normalized) return null;
  return {
    slot: normalized,
    type: slot.type,
    required: slot.required ?? true,
    description: slot.description,
  };
}

export function normalizeBindingSlot(binding: BindingSlotInput): NormalizedAssetSlot | null {
  return normalizeAssetSlot({
    slot: binding.slotName,
    type: binding.slotType,
    required: true,
  });
}

export function assetSlotSearchTerms(slotType: AssetSlot["type"], slotName: string): string[] {
  const aliases: Record<string, string[]> = {
    讲解者: ["讲解者", "主持人", "presenter", "host", "speaker"],
    顾客: ["顾客", "客户", "患者", "client", "patient", "customer", "model"],
    操作者: ["操作者", "咨询师", "医生", "护士", "practitioner", "consultant", "operator"],
    "咨询/护理室": ["咨询室", "护理室", "诊室", "clinic", "consultation room", "treatment room", "interior room"],
    领夹麦: ["领夹麦", "麦克风", "lavalier", "lapel mic", "microphone"],
    "相机/灯光设备": ["相机", "三脚架", "灯架", "camera", "tripod", "light stand"],
    "椅子/护理椅": ["椅子", "护理椅", "躺椅", "chair", "treatment chair", "reclining chair"],
    "桌面/柜台": ["桌面", "桌子", "柜台", "table", "counter", "cabinet"],
  };
  return [...new Set([slotName, ...(aliases[slotName] || []), slotType])].filter(Boolean);
}
