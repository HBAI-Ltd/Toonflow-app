import type { AssetCategory, SceneAsset } from "./sceneDocument";
import { catalogAssets } from "./assetCatalog";

const sourceCommit = "96eb3121e62f15aa7e761d75cbbfa3efcdbafda2";
const sourceBase = `https://raw.githubusercontent.com/instruktlabs/holodeck/${sourceCommit}/examples/`;
const sourcePageBase = `https://github.com/instruktlabs/holodeck/blob/${sourceCommit}/examples/`;
const packIds = ["courtyard", "meridian-sanctuary", "crescent-cove", "tidemark", "winter-mountainside-cabin"];
const maxModelBytes = 50 * 1024 * 1024;
const maxManifestBytes = 1024 * 1024;
const objaverseCommit = "556637099bf4fa79ea7b239d0d9c328b8a2e9ac8";
const objaverseBase = `https://huggingface.co/datasets/allenai/objaverse/resolve/${objaverseCommit}/`;
const objaverseModelPath = /^glbs\/\d{3}-\d{3}\/([a-f\d]{32})\.glb$/;
const modelTimeout = 30000;
const compressedExtensions = new Set(["KHR_draco_mesh_compression", "EXT_meshopt_compression", "KHR_meshopt_compression", "KHR_texture_basisu"]);
const supportedExtensions = new Set([
  "KHR_lights_punctual", "KHR_materials_anisotropy", "KHR_materials_clearcoat", "KHR_materials_dispersion",
  "KHR_materials_emissive_strength", "KHR_materials_ior", "KHR_materials_iridescence", "KHR_materials_sheen",
  "KHR_materials_specular", "KHR_materials_transmission", "KHR_materials_unlit", "KHR_materials_volume",
  "KHR_mesh_quantization", "KHR_texture_transform", "EXT_materials_bump", "EXT_mesh_gpu_instancing",
  "EXT_texture_avif", "EXT_texture_webp", "KHR_materials_pbrSpecularGlossiness",
]);
const excludedIds = new Set(["structure", "canopy", "seating", "hearth", "planting", "rug", "lamp", "moodboard", "shelter"]);
const assetNames: Record<string, string> = {
  "tree-plane": "法桐", "tree-cypress": "柏树", "tree-olive": "橄榄树", "shrub-box": "黄杨灌木",
  "plant-lavender": "薰衣草", "bench-park": "公园长椅", "bench-stone": "石凳", "lamp-post": "路灯",
  "lamp-bollard": "庭院矮灯", "statue-figure": "人物雕像", "statue-bronze": "青铜雕像",
  "statue-monolith": "石碑雕塑", "plaza-fountain": "广场喷泉", "fountain-cascade": "叠水喷泉",
};
const nameTokens: Record<string, string> = {
  coastal: "海岸", flybird: "飞鸟", island: "海岛", bird: "鸟", crab: "蟹", resident: "人物",
  jungle: "丛林", groundcover: "地被", sapling: "幼树", understory: "林下植被", shore: "海岸石",
  tree: "树木", cypress: "柏树", broad: "宽冠", mid: "中型", slim: "细冠", tall: "高型",
  shrub: "灌木", palm: "棕榈", arch: "拱形", lean: "斜生", young: "幼株", plant: "植物",
  grass: "草地", patch: "簇", tuft: "丛", hibiscus: "朱槿", naupaka: "草海桐", nest: "鸟巢",
  fern: "蕨", purslane: "马齿苋", scrub: "灌丛", sword: "剑叶", vine: "藤蔓", fringe: "垂挂",
  mat: "地垫", alocasia: "海芋", coral: "珊瑚", brain: "脑纹", heads: "簇", rubble: "碎石",
  staghorn: "鹿角", table: "桌", debris: "散落物", coconuts: "椰果", driftwood: "漂流木",
  log: "原木", pile: "堆", fronds: "棕榈叶", shells: "贝壳", rock: "岩石", beach: "海滩",
  boulder: "巨石", cliff: "悬崖", outcrop: "露岩", reef: "礁石", seagrass: "海草",
  jetty: "码头", deck: "平台", platform: "平台", stair: "楼梯", steps: "台阶", step: "踏步",
  slab: "石板", pave: "铺装", field: "地砖", curb: "路缘", corner: "转角", wall: "墙体",
  segment: "分段", pier: "立柱", gate: "门楼", planter: "花盆", square: "方形", sq: "方形", urn: "陶罐",
  arcade: "拱廊", bay: "单元", slot: "开槽", pylon: "塔柱", balustrade: "栏杆", basin: "水池",
  water: "水面", block: "石块", cascade: "叠水", tower: "塔", coping: "压顶", cube: "方块",
  marble: "大理石", mirror: "镜面", court: "庭院", far: "远景", falls: "瀑布", narrow: "窄型",
  foundation: "地基", gateway: "大门", isle: "岛屿", base: "基座", ivy: "常春藤", long: "长型",
  short: "短型", monolith: "巨石碑", orb: "球体", overflow: "溢流", wide: "宽型", parapet: "矮墙",
  pavilion: "亭", pool: "水池", statue: "雕像", whale: "鲸鱼", armchair: "扶手椅", oak: "橡木",
  chimney: "烟囱", masonry: "砌石", coffee: "茶几", tile: "砖", desk: "书桌", dining: "餐用",
  chair: "椅", door: "门", entry: "入口", eave: "檐下", storage: "储物柜", bench: "长椅",
  fallen: "倒伏", fir: "冷杉", background: "远景", hero: "精细", middle: "中景", floor: "地板",
  loft: "阁楼", main: "主层", floorlamp: "落地灯", tripod: "三脚", frame: "框架", post: "柱",
  gable: "山墙", glass: "玻璃", ground: "地面", clump: "草丛", kitchen: "厨房", run: "组合柜",
  lantern: "提灯", living: "客厅", rug: "地毯", wool: "羊毛", bed: "床", mountain: "山体",
  massif: "山群", pendant: "吊灯", rafter: "椽架", rail: "栏杆", span: "单元", ridge: "屋脊",
  band: "横带", shelf: "岩台", roof: "屋顶", east: "东侧", west: "西侧", side: "边", small: "小型",
  props: "道具", snow: "雪", bank: "堆", sofa: "沙发", spruce: "云杉", exterior: "室外",
  interior: "室内", stone: "石质", plinth: "底座", panel: "板", trail: "步道", marker: "路标",
  tread: "踏板", timber: "木质", facade: "立面", rear: "后侧", window: "窗", test: "样件",
};

export const builtinAssets: SceneAsset[] = [
  { id: "box", name: "立方体", category: "基础", kind: "primitive", shape: "box" },
  { id: "cuboid", name: "长方体", category: "基础", kind: "primitive", shape: "cuboid" },
  { id: "sphere", name: "球体", category: "基础", kind: "primitive", shape: "sphere" },
  { id: "cylinder", name: "圆柱", category: "基础", kind: "primitive", shape: "cylinder" },
  { id: "cone", name: "圆锥", category: "基础", kind: "primitive", shape: "cone" },
  { id: "frustum", name: "圆台", category: "基础", kind: "primitive", shape: "frustum" },
  { id: "torus", name: "圆环", category: "基础", kind: "primitive", shape: "torus" },
  { id: "plane", name: "平面", category: "基础", kind: "primitive", shape: "plane" },
  { id: "disc", name: "圆盘", category: "基础", kind: "primitive", shape: "disc" },
  { id: "pyramid", name: "棱锥", category: "基础", kind: "primitive", shape: "pyramid" },
  { id: "capsule", name: "胶囊", category: "基础", kind: "primitive", shape: "capsule" },
  { id: "person", name: "胶囊人", category: "基础", itemType: "人物", kind: "primitive", shape: "person", tags: ["人", "人类", "角色", "胶囊人", "胶囊", "三段关节"] },
  { id: "backdrop", name: "活动墙", category: "基础", itemType: "构件", kind: "primitive", shape: "backdrop", tags: ["活动墙", "背景板", "布景片", "第四面墙", "反打", "三壁内景"] },
  { id: "kneelingPerson", name: "跪坐的胶囊人", category: "基础", itemType: "人物", kind: "primitive", shape: "kneelingPerson", tags: ["人", "跪", "跪坐", "跪拜", "席地", "蒲团", "盘坐", "打坐", "和室", "学堂", "胶囊人", "无骨骼"] },
  { id: "seatedPerson", name: "坐着的胶囊人", category: "基础", itemType: "人物", kind: "primitive", shape: "seatedPerson", tags: ["人", "坐", "坐着", "坐姿", "观众", "学生", "乘客", "食客", "宾客", "胶囊人", "无骨骼"] },
  { id: "riggedPerson", name: "骨骼人物", category: "基础", itemType: "人物", kind: "primitive", shape: "riggedPerson", tags: ["人", "人类", "角色", "圆柱人", "胶囊人", "骨骼", "蒙皮", "演绎", "待机", "行走", "跑步", "互动", "工作", "休息", "观察"], license: "内置原创程序化模型" },
  ...catalogAssets,
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getAssetCategory(id: string): AssetCategory {
  if (/(?:^|-)(tree|cypress|shrub|plant|palm|coral|debris|rock|boulder|seagrass|grass|jungle|fir|spruce|snow|mountain|ivy|bird|flybird|crab|shore)(?:-|$)/.test(id)) return "自然";
  if (/(?:^|-)(arcade|balustrade|basin|block|coping|deck|foundation|gateway|isle|jetty|parapet|pavilion|pool|stair|step|tower|wall|gate|pave|floor|frame|door|eave|gable|rafter|rail|ridge|roof|plinth|tread|window|chimney)(?:-|$)/.test(id)) return "建筑";
  return "道具";
}

function getAssetName(id: string) {
  return assetNames[id] ?? id.replace(/^wmc-/, "").split("-").map(token => nameTokens[token] ?? token).join(" ");
}

function getModelUrl(value: unknown) {
  if (typeof value !== "string") throw new Error("资产缺少在线模型地址");
  const url = new URL(value);
  if (value === url.href && !url.search && !url.hash && value.startsWith(objaverseBase) && objaverseModelPath.test(value.slice(objaverseBase.length))) return value;
  const relative = url.href.startsWith(sourceBase) ? url.href.slice(sourceBase.length) : "";
  const segments = relative.split("/");
  if (value !== url.href || url.search || url.hash || segments.length !== 4 || !packIds.includes(segments[0] ?? "") || segments[1] !== "assets" || segments[2] !== "imports" || !/^[a-f0-9]{64}\.glb$/.test(segments[3] ?? "")) {
    throw new Error("仅支持固定版本的 Holodeck 或 Objaverse 在线模型地址");
  }
  return url.href;
}

export function isAssetModelUrl(value: string) {
  try { return getModelUrl(value) === value; }
  catch { return false; }
}

export function getObjaverseUid(value: string) {
  return value.startsWith(objaverseBase) ? objaverseModelPath.exec(value.slice(objaverseBase.length))?.[1] : undefined;
}

function safeUrl(value: string) {
  try {
    const url = new URL(value);
    return url.href === value && url.protocol === "https:" && !url.username && !url.password && !url.port && !url.search && !url.hash ? url : undefined;
  } catch { return undefined; }
}

export function isAssetThumbnailUrl(value: string) {
  const url = safeUrl(value);
  if (!url) return false;
  if (value.startsWith(sourceBase)) return /^[a-z\d][a-z\d._-]*\/assets\/imports\/[a-f\d]+\.(?:png|jpe?g|webp)$/i.test(value.slice(sourceBase.length));
  return url.hostname === "media.sketchfab.com" && /^\/models\/[a-f\d]{32}\/thumbnails\/(?:[a-f\d]{32}\/){1,2}(?:[a-f\d]{32}|[1-9]\d{0,3}x[1-9]\d{0,3})\.(?:png|jpe?g|webp)$/i.test(url.pathname);
}

export function isAssetSourceUrl(value: string) {
  const url = safeUrl(value);
  if (!url) return false;
  return url.hostname === "sketchfab.com" && /^\/3d-models\/(?:[a-z\d_-]+-)?[a-f\d]{32}\/?$/i.test(url.pathname)
    || url.hostname === "github.com" && /^\/instruktlabs\/holodeck(?:\/(?:tree|blob)\/[a-z\d._-]+(?:\/[a-z\d._-]+)*)?\/?$/i.test(url.pathname);
}

export function isAssetAuthorUrl(value: string) {
  const url = safeUrl(value);
  return !!url && url.hostname === "sketchfab.com" && /^\/[a-z\d._-]{1,120}\/?$/i.test(url.pathname);
}

export function isAssetLicenseUrl(value: string) {
  const url = safeUrl(value);
  return !!url && url.hostname === "creativecommons.org" && /^\/(?:licenses\/(?:by|by-sa)\/4\.0|publicdomain\/zero\/1\.0)\/$/.test(url.pathname);
}

function isModelResponseUrl(value: string, original: string) {
  if (value === original) return true;
  const url = new URL(value);
  if (url.protocol !== "https:" || url.username || url.password || url.port || url.hash) return false;
  if (["us.aws.cdn.hf.co", "cas-bridge.xethub.hf.co"].includes(url.hostname)) return /^\/xet-bridge-us\/63977bb96bdef8095268ded0\/[a-f\d]{64}$/.test(url.pathname);
  return ["cdn-lfs.huggingface.co", "cdn-lfs-us-1.hf.co"].includes(url.hostname) && /^\/repos\/(?:[a-f\d]{2}\/){2}[a-f\d]{64}\/[a-f\d]{64}$/.test(url.pathname);
}

export function usesNativeScale(asset: SceneAsset): boolean {
  if (asset.kind !== "model" || asset.normalize === true) return false;
  if (asset.normalize === false) return true;
  const source = asset.url ?? (asset.sourceUrl?.startsWith(sourcePageBase) ? `${sourceBase}${asset.sourceUrl.slice(sourcePageBase.length)}` : undefined);
  try { return !!source && source.startsWith(sourceBase) && getModelUrl(source) === source; }
  catch { return false; }
}

async function readResponse(response: Response, maxBytes: number, expectedBytes?: number) {
  if (!response.ok) throw new Error(`下载失败（HTTP ${response.status}）`);
  const declaredBytes = response.headers.get("content-length");
  if (declaredBytes !== null && (!/^\d+$/.test(declaredBytes) || Number(declaredBytes) > maxBytes)) {
    await response.body?.cancel();
    throw new Error("下载内容超过大小限制");
  }
  if (!response.body) throw new Error("下载内容为空");
  const reader = response.body.getReader();
  const fixed = expectedBytes === undefined ? undefined : new Uint8Array(expectedBytes);
  const chunks: Uint8Array[] = [];
  let length = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      if (length + value.byteLength > maxBytes || fixed && length + value.byteLength > fixed.byteLength) {
        await reader.cancel();
        throw new Error("下载内容超过大小限制");
      }
      if (fixed) fixed.set(value, length);
      else chunks.push(value);
      length += value.byteLength;
    }
  } finally {
    reader.releaseLock();
  }
  if (fixed) {
    if (length !== fixed.byteLength) throw new Error("在线模型下载不完整或版本不匹配");
    return fixed.buffer;
  }
  const content = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) {
    content.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return content.buffer;
}

async function loadPack(packId: string, signal?: AbortSignal): Promise<SceneAsset[]> {
  const manifestUrl = `${sourceBase}${packId}/example.json`;
  const response = await fetch(manifestUrl, { signal, redirect: "error" });
  const content = await readResponse(response, maxManifestBytes);
  const manifest: unknown = JSON.parse(new TextDecoder().decode(content));
  if (!isRecord(manifest) || manifest.format !== "holodeck-example-v1" || manifest.id !== packId || !Array.isArray(manifest.assets) || manifest.assets.length > 256) {
    throw new Error("在线资产清单格式无效");
  }
  const assets: SceneAsset[] = [];
  for (const asset of manifest.assets) {
    if (!isRecord(asset) || typeof asset.id !== "string" || !/^[a-z0-9-]{1,100}$/.test(asset.id) || typeof asset.file !== "string" || !/^assets\/imports\/[a-f0-9]{64}\.glb$/.test(asset.file) || typeof asset.sha256 !== "string" || !/^[a-f0-9]{64}$/.test(asset.sha256) || !Number.isSafeInteger(asset.bytes) || Number(asset.bytes) <= 20 || Number(asset.bytes) > maxModelBytes || asset.file !== `assets/imports/${asset.sha256}.glb`) {
      throw new Error("在线资产清单包含无效模型记录");
    }
    if (excludedIds.has(asset.id) || asset.id.startsWith("island-hut-")) continue;
    const url = getModelUrl(new URL(asset.file, manifestUrl).href);
    assets.push({
      id: `holodeck${asset.sha256}`, name: getAssetName(asset.id), category: getAssetCategory(asset.id),
      kind: "model", url, sourceUrl: `${sourcePageBase}${packId}/${asset.file}`, normalize: false,
      license: "CC0", bytes: Number(asset.bytes),
    });
  }
  return assets;
}

export async function loadOnlineAssets(signal?: AbortSignal, onWarning?: (message: string) => void): Promise<SceneAsset[]> {
  signal?.throwIfAborted();
  const optionalSignal = signal ? AbortSignal.any([signal, AbortSignal.timeout(4000)]) : AbortSignal.timeout(4000);
  const results = await Promise.allSettled(packIds.map(packId => loadPack(packId, optionalSignal)));
  signal?.throwIfAborted();
  const assets = new Map<string, SceneAsset>();
  for (const [index, result] of results.entries()) {
    if (result.status === "fulfilled") {
      for (const asset of result.value) if (!assets.has(asset.id)) assets.set(asset.id, asset);
    } else {
      const message = `${packIds[index]} 加载失败：${result.reason instanceof Error ? result.reason.message : String(result.reason)}`;
      onWarning?.(message);
    }
  }
  return [...assets.values()];
}

export function validateModel(content: ArrayBuffer): void {
  if (content.byteLength < 20 || content.byteLength > maxModelBytes) throw new Error("模型必须为不超过 50 MB 的 GLB 文件");
  const view = new DataView(content);
  if (view.getUint32(0, true) !== 0x46546c67 || view.getUint32(4, true) !== 2 || view.getUint32(8, true) !== content.byteLength) {
    throw new Error("GLB 文件头、版本或文件长度无效");
  }
  let offset = 12;
  let document: Record<string, unknown> | undefined;
  let binaryFound = false;
  while (offset < content.byteLength) {
    if (offset + 8 > content.byteLength) throw new Error("GLB 数据块不完整");
    const length = view.getUint32(offset, true);
    const type = view.getUint32(offset + 4, true);
    offset += 8;
    if (!length || length % 4 !== 0 || offset + length > content.byteLength) throw new Error("GLB 数据块长度无效");
    if (type === 0x4e4f534a) {
      if (document || offset !== 20) throw new Error("GLB 必须以唯一的 JSON 数据块开始");
      const value: unknown = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(new Uint8Array(content, offset, length)));
      if (!isRecord(value) || !isRecord(value.asset) || value.asset.version !== "2.0") throw new Error("仅支持 glTF 2.0 模型");
      document = value;
    } else if (type === 0x004e4942) {
      if (!document || binaryFound) throw new Error("GLB 二进制数据块无效");
      binaryFound = true;
    } else {
      throw new Error("GLB 包含不支持的数据块");
    }
    offset += length;
  }
  if (!document) throw new Error("GLB 缺少模型数据");
  for (const field of ["extensionsRequired", "extensionsUsed"]) {
    const extensions = document[field];
    if (extensions === undefined) continue;
    if (!Array.isArray(extensions) || extensions.some(extension => typeof extension !== "string")) throw new Error("GLB 扩展声明无效");
    if (extensions.some(extension => compressedExtensions.has(extension))) {
      throw new Error("当前不支持 Draco、Meshopt 或 KTX2 压缩模型，请导出未压缩的自包含 GLB 后重新导入");
    }
    if (field === "extensionsRequired") for (const extension of extensions) if (!supportedExtensions.has(extension)) throw new Error(`模型要求暂不支持的 glTF 扩展：${extension}`);
  }
  const usedExtensions = document.extensionsUsed;
  if (Array.isArray(document.extensionsRequired) && document.extensionsRequired.some(extension => !Array.isArray(usedExtensions) || !usedExtensions.includes(extension))) throw new Error("GLB 必需扩展未登记到已使用扩展中");
  const pending: unknown[] = [document];
  while (pending.length) {
    const value = pending.pop();
    if (Array.isArray(value)) {
      for (const child of value) if (typeof child === "object" && child !== null) pending.push(child);
    }
    else if (isRecord(value)) {
      for (const [key, child] of Object.entries(value)) {
        if (key === "uri" && (typeof child !== "string" || !child.startsWith("data:"))) throw new Error("模型必须自包含，不能引用外部文件或网络资源");
        if (typeof child === "object" && child !== null) pending.push(child);
      }
    }
  }
}

export async function downloadAsset(asset: SceneAsset, signal?: AbortSignal): Promise<ArrayBuffer> {
  const url = getModelUrl(asset.url);
  const objaverse = !!getObjaverseUid(url);
  if (asset.kind !== "model" || (asset.bytes !== undefined && (!Number.isSafeInteger(asset.bytes) || asset.bytes <= 20 || asset.bytes > maxModelBytes))) {
    throw new Error("在线模型记录无效");
  }
  if (objaverse && (asset.provider !== "objaverse" || !asset.bytes || !/^[a-f\d]{64}$/.test(asset.sha256 ?? "")) || !objaverse && asset.provider === "objaverse") throw new Error("Objaverse 模型缺少固定来源、实际大小或 SHA256");
  const timeoutSignal = AbortSignal.timeout(modelTimeout);
  const downloadSignal = signal ? AbortSignal.any([signal, timeoutSignal]) : timeoutSignal;
  const response = await fetch(url, { signal: downloadSignal, redirect: objaverse ? "follow" : "error", credentials: "omit", referrerPolicy: "no-referrer" });
  if (!isModelResponseUrl(response.url, url)) { await response.body?.cancel(); throw new Error("模型下载重定向到了未允许的来源"); }
  const mimeType = response.headers.get("content-type")?.split(";", 1)[0]?.trim().toLowerCase();
  if (response.ok && !["model/gltf-binary", "application/octet-stream", "application/gltf-buffer"].includes(mimeType ?? "")) {
    await response.body?.cancel();
    throw new Error("在线资源不是 GLB 模型文件");
  }
  const content = await readResponse(response, maxModelBytes, asset.bytes);
  if (asset.bytes !== undefined && content.byteLength !== asset.bytes) throw new Error("在线模型下载不完整或版本不匹配");
  validateModel(content);
  const expectedHash = objaverse ? asset.sha256! : url.slice(url.lastIndexOf("/") + 1, -4);
  const digest = await crypto.subtle.digest("SHA-256", content);
  const actualHash = [...new Uint8Array(digest)].map(value => value.toString(16).padStart(2, "0")).join("");
  if (actualHash !== expectedHash) throw new Error("在线模型完整性校验失败");
  signal?.throwIfAborted();
  return content;
}
