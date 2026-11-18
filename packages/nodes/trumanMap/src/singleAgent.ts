import type { NodeAiTool } from "@toonflow/nodes-scaffold/runtime";

export type AgentContent = { type: "text"; text: string } | { type: "image"; data: string; mimeType: string };
export type AgentToolResult = { content: AgentContent[]; details: unknown };
export type CreationImage = { name: string; dataUrl: string };
export type ThinkingLevel = "off" | "minimal" | "low" | "medium" | "high" | "xhigh" | "max";
/** 宿主提问器（askUser）发来的提问，字段与宿主 QuestionRequest 一致；sessionId/callId 用来回答。 */
export type AgentQuestionField = { field: string; title: string; type: "input" | "textarea" | "radio" | "checkbox" | "select" | "inputNumber" | "switch"; required?: boolean; options?: string[]; placeholder?: string };
export type AgentQuestion = { sessionId: string; callId: string; title: string; question: string; options?: string[]; fields?: AgentQuestionField[] };
export type AgentQuestionAnswer = { answer?: string; values?: Record<string, string | number | boolean | string[] | null>; skipped?: boolean; cancelled?: boolean };
/** 生成途中用户发的“引导”：插件在下一次世界工具结果里交给模型（宿主 singleAgent 没有引导入口）。 */
export type AgentSteering = { id: string; text: string };
export type CreationProgress =
  | { type: "tool"; id: string; name: string; label: string; status: "running" | "success" | "error" | "interrupted"; detail?: string; args?: unknown; result?: string }
  | { type: "thinking"; id: string; text: string; done?: boolean }
  | { type: "text"; id: string; text: string; done?: boolean }
  | { type: "status"; message: string; warning?: boolean }
  | { type: "image"; id: string; label: string; src: string }
  | { type: "question"; id: string; question: AgentQuestion }
  | { type: "steered"; ids: string[] }
  | { type: "complete" };
type InstalledTool = { name: string; enabled: boolean; loadError?: string };
// 宿主画布 Agent 会载入所有启用的工具插件；内置 Agent 也接上同一批。画布、浏览器要宿主的画布桥和浏览器面板，
// 插件开发是给开发者的；TrumanMap 自己的建模服务按名字单独接。
const hostToolExcluded = new Set(["trumanMap", "canvas", "browser", "pluginDeveloper"]);
let hostToolCache: { at: number; names: Promise<string[]> } | undefined;
/** 宿主已启用、能在临时对话里用的工具插件名（askUser、workspace、webSearch、skillOperator……），一分钟内复用。 */
export function readHostToolNames(signal: AbortSignal): Promise<string[]> {
  if (!hostToolCache || Date.now() - hostToolCache.at > 60000) {
    const names = readInstalledTools(AbortSignal.timeout(15000)).then(({ tools }) => tools.flatMap(tool => tool && typeof tool.name === "string" && tool.enabled === true && !tool.loadError && !hostToolExcluded.has(tool.name) ? [tool.name] : []));
    hostToolCache = { at: Date.now(), names };
    names.catch(() => { if (hostToolCache?.names === names) hostToolCache = undefined; });
  }
  const pending = hostToolCache.names;
  return new Promise((resolve, reject) => {
    const abort = () => reject(signal.reason);
    signal.addEventListener("abort", abort, { once: true });
    if (signal.aborted) abort();
    pending.then(resolve, reject).finally(() => signal.removeEventListener("abort", abort));
  });
}
/** 回答（或跳过、取消）宿主提问器的提问，和宿主提问卡同一个接口。 */
export async function answerAgentQuestion(question: Pick<AgentQuestion, "sessionId" | "callId">, answer: AgentQuestionAnswer) {
  await post("answer", { sessionId: question.sessionId, callId: question.callId, ...answer }, AbortSignal.timeout(15000));
}

// 宿主在模型最后一条回复撞到单次输出上限（stopReason=length、没有工具调用）时整轮报这个错。
const truncatedReply = /长度限制被截断|output token limit|max(?:imum)? output tokens/i;
// 工具调用写到一半被截断时，宿主（pi agent）把这条回复里的调用全部判失败、原样让模型重发；模型常常又写一样长、又被截断，每次白等一整段生成。
const truncatedToolCall = /hit the output token limit|output token limit/i;
// ACT: 撞到输出上限就自己接着跑：只要接续后还有工具做成（有进展）就继续，连续几次毫无进展才放弃。
const maxContinuations = 12;
const maxStalledContinuations = 3;
const continuationPrompt = "上一条回复超出了模型单次输出长度上限，被截断了（这一段没有生效；之前已完成的工具调用和草稿都还在）。请直接从中断处继续完成本轮要求：不重复已完成的步骤；思考和文字保持简短，长内容（源码、大批坐标或关键帧）拆成多次较小的工具调用；全部完成后只用一两句话总结。";
// 撞上限的那条回复连思考带正文不到这么多字：不是写得太长，是对话把上下文占满了（2026-11-16 实例：54次工具调用后每次只写出“我”“刚才”就被截断）。
const saturatedReplyChars = 400;
const maxHandoffs = 2;
/** 换新对话时的交接：用户要求 + 已做过的步骤（模型自己的说明和做成的工具），让模型读一下现状只做剩下的。 */
export function handoffPrompt(request: string, journal: readonly string[], lifeOnly: boolean) {
  const kept: string[] = [];
  let size = 0;
  for (const item of [...journal].reverse()) {
    if (size + item.length > 3500) break;
    kept.unshift(item);
    size += item.length + 1;
  }
  const skipped = journal.length - kept.length;
  const ask = request.length > 4000 ? request.slice(0, 1500) + "\n…\n" + request.slice(-2500) : request;
  return `（接着完成同一个任务：上一段对话已经太长，模型没有输出空间了，所以换成了新对话。之前对场景草稿做的修改全部还在草稿里，不要重做，也不要撤掉。）
用户本轮的要求：
${ask}

已经做过的步骤（按顺序，最后一条是中断前正在做的）：
${skipped ? `……（更早的${skipped}步略）\n` : ""}${kept.map(item => "- " + item).join("\n") || "- （还没有做成的步骤）"}

请先用${lifeOnly ? "stageRead" : "worldRead"}看一下当前状态，只做还没完成的部分；${lifeOnly ? "" : "做完调用一次worldSubmit核对，"}最后用一两句话总结本轮全部完成的内容。思考保持简短，同类操作用数组一次传。`;
}
const toolContinuationPrompt = (names: string[]) => `上一条回复里的工具调用（${names.join("、")}）参数太长，撞到模型单次输出上限被截断，没有执行（之前已成功的工具调用和草稿都还在）。请把同样的内容拆成2到4次更小的调用接着做：每次只放原来大约三分之一的条目（物体、片段、关键帧、镜头或源码段落），不要原样重发；思考保持简短，不重复已完成的步骤；全部完成后只用一两句话总结。`;
const thinkingOrder: ThinkingLevel[] = ["minimal", "low", "medium", "high", "xhigh", "max"];
/** 接着生成时逐级降低思考档位，给正文和工具调用留出输出额度；只降到该模型支持的档位，没有更低的就保持原档。 */
export function lowerThinking(level: ThinkingLevel | undefined, supported?: readonly ThinkingLevel[]): ThinkingLevel | undefined {
  // 宿主没给出可用档位（旧宿主或该模型不可调节）时不猜，否则会被宿主以「不支持推理等级」整轮拒绝。
  if (!supported?.length || level === "off") return level;
  const target = ({ max: "high", xhigh: "medium", high: "medium", medium: "low", low: "minimal", minimal: "minimal" } as const)[level ?? "high"];
  const lower = thinkingOrder.slice(0, thinkingOrder.indexOf(level ?? "high")).filter(candidate => supported.includes(candidate));
  // 优先落在目标档或以下；够不着目标就取比当前低的最低一档。
  return lower.findLast(candidate => thinkingOrder.indexOf(candidate) <= thinkingOrder.indexOf(target)) ?? lower[0] ?? level;
}
const unsupportedThinking = /不支持推理等级|thinking ?level|reasoning ?(?:level|effort)/i;

function toToolResult(value: unknown): AgentToolResult {
  if (value && typeof value === "object" && "content" in value) {
    const result = value as AgentToolResult;
    if (!Array.isArray(result.content) || result.content.some(part => !part || (part.type === "text"
      ? typeof part.text !== "string"
      : part.type !== "image" || typeof part.data !== "string" || !part.data || !/^image\//.test(part.mimeType)))) {
      throw new Error("Agent 工具返回了无效的文字或图片内容");
    }
    return { content: result.content, details: result.details ?? {} };
  }
  return { content: [{ type: "text", text: JSON.stringify(value ?? null) }], details: {} };
}

function requestError(path: string, status: number, value: unknown) {
  const result = value && typeof value === "object" ? value as { message?: unknown; data?: unknown } : undefined;
  const details = Array.isArray(result?.data) ? result.data.flatMap(issue => {
    if (typeof issue === "string") return [issue];
    if (!issue || typeof issue !== "object" || typeof issue.message !== "string") return [];
    return [`${Array.isArray(issue.path) ? issue.path.join(".") : ""} ${issue.message}`.trim()];
  }).slice(0, 6).join("；").slice(0, 1500) : "";
  const stage = { create: "创建创作会话", run: "运行创作 Agent", toolResult: "提交世界工具结果", control: "关闭创作会话", answer: "提交回答", "/api/tools/get": "读取配套服务", "/api/tools/install": "注册节点配套服务", "/api/nodes/files": "读取已安装节点" }[path] ?? "Agent 请求";
  const message = typeof result?.message === "string" && result.message ? result.message : "请求失败";
  return Object.assign(new Error(`${stage}失败（HTTP ${status}）：${message}${details ? `\n${details}` : ""}`), { path, status, rawMessage: message });
}

async function post<T>(path: string, body: unknown, signal: AbortSignal): Promise<T> {
  const response = await fetch(path.startsWith("/api/") ? path : `/api/singleAgent/${path}`, {
    method: "POST", headers: { "Content-Type": "application/json", "x-toonflow-workspace": "1" },
    body: JSON.stringify(body), signal,
  });
  const result = await response.json().catch(() => null);
  if (!response.ok || result?.code !== 200) throw requestError(path, response.status, result);
  return result.data as T;
}

async function readInstalledTools(signal: AbortSignal) {
  const response = await fetch("/api/tools/get", { headers: { "x-toonflow-workspace": "1" }, cache: "no-store", signal });
  const result = await response.json().catch(() => null);
  if (!response.ok || result?.code !== 200) throw requestError("/api/tools/get", response.status, result);
  if (!result.data || !Array.isArray(result.data.tools)) throw new Error("宿主返回的工具列表无效");
  return { tools: result.data.tools as InstalledTool[] };
}

// 使用宿主 createAgentSession、模型配置和取消通道；插件不另起模型循环或 CLI Agent。
export async function runHolodeckAgent(input: {
  directory: string;
  providerId: string;
  modelId: string;
  thinkingLevel?: ThinkingLevel;
  /** 宿主返回的该模型可用思考档位；接着生成时只在其中降档。 */
  reasoningLevels?: readonly ThinkingLevel[];
  prompt: string;
  /** 用户这句话本身（不含历史和附加说明）：换新对话交接时用，省得把整段历史再塞一遍。 */
  request?: string;
  images?: CreationImage[];
  systemPrompt: string;
  tools: NodeAiTool[];
  lifeGroupId?: string;
  performanceOnly?: boolean;
  /** 和宿主画布 Agent 一样接上宿主已启用的工具插件（提问器、工作区文件、联网、技能……）；宿主拒绝时去掉它们重建会话，不影响场景工具。 */
  hostTools?: readonly string[];
  /** 生成途中用户发的引导：每次世界工具执行完取一次，随工具结果交给模型。 */
  takeSteering?: () => AgentSteering[];
  signal: AbortSignal;
  onStatus: (message: string) => void;
  onProgress?: (event: CreationProgress) => void;
}): Promise<{ text: string; closing?: Promise<void>; /** 模型没写完就用尽了输出空间：已做成的修改照常交付，这里是给用户的说明。 */ incomplete?: string }> {
  if (!input.directory.trim()) throw new Error("Holodeck Agent 需要已选择的工作目录");
  input.signal.throwIfAborted();
  const images = (input.images ?? []).map(image => {
    const match = /^data:(image\/(?:png|jpeg|webp|gif));base64,([A-Za-z0-9+/]+={0,2})$/.exec(image.dataUrl);
    if (!match || match[2]!.length % 4 || match[2]!.length / 4 * 3 - (match[2]!.endsWith("==") ? 2 : match[2]!.endsWith("=") ? 1 : 0) > 10 * 1024 * 1024) throw new Error("参考图片无效，支持单张不超过 10 MiB 的 PNG、JPEG、WebP 或 GIF");
    return { type: "image" as const, mimeType: match[1]!, data: match[2]! };
  });
  if (images.length > 16 || images.reduce((total, image) => total + image.data.length / 4 * 3 - (image.data.endsWith("==") ? 2 : image.data.endsWith("=") ? 1 : 0), 0) > 64 * 1024 * 1024) throw new Error("当前与最近对话的参考图片合计超过 16 张或 64 MiB，请减少图片或等待这些历史对话移出最近上下文后重试");
  // ACT: 原来整轮限 10 分钟；有了提问卡，等用户回答的时间不能算进去。改成 10 分钟没有任何进展才停，等回答时暂停计时。
  const idle = new AbortController();
  const waitingQuestions = new Set<string>();
  let idleTimer: ReturnType<typeof setTimeout> | undefined;
  const touch = () => {
    clearTimeout(idleTimer);
    if (!waitingQuestions.size && !idle.signal.aborted) idleTimer = setTimeout(() => idle.abort(new Error("Agent 已经 10 分钟没有任何进展，本轮已停止")), 600000);
  };
  touch();
  const signal = AbortSignal.any([input.signal, idle.signal]);
  const lifeOnly = !!(input.performanceOnly || input.lifeGroupId);
  const tools = new Map(input.tools.map(tool => [tool.name, tool]));
  if (tools.size !== input.tools.length) throw new Error("世界工具名称重复");
  let sessionId = "";
  let response: Response | undefined;
  let reader: ReadableStreamDefaultReader<Uint8Array> | undefined;
  let completed: { text: string; incomplete?: string } | undefined;
  let succeeded = false;
  let closing: Promise<void> | undefined;
  let legacyReferenceImages = false;
  let referenceImagesDelivered = false;
  const labels: Record<string, string> = {
    readTerrain: "读取地形与画笔能力", editTerrain: "调整地形地貌", scatterAssets: "批量布置场景物件", createBrushPath: "铺设道路与墙体", layoutStreet: "沿街排布楼房与摊位", arrangeAssets: "成组布置陈设", placeCrowd: "安排群演",
    setTime: "调整世界时间", setWeather: "调整混合天气",
    worldRead: "读取世界", worldPropose: "校验场景修订", worldObserve: "查看真实场景", worldCheck: "核对空间与演绎",
    worldPerform: "安排个体动线与事件", worldAnimate: "编排主体动画", worldEditAnimation: "修改已有动画片段", worldPerformanceRemove: "移除主体轨道",
    worldRehearse: "预演场景动作",
    stageRead: "看舞台", stageAct: "安排表演", stageShots: "摆镜头",
    worldSubmit: "提交并查看场景", batch: "批量执行",
    listAssets: "检索素材", listAssetVariants: "查看素材款式", inspectScene: "读取草稿", createModel: "生成基础模型", useSetTemplate: "铺整套景",
    addAsset: "摆放物体", updateObject: "调整物体", removeObject: "删除物体", replaceAsset: "替换素材",
    readModelParts: "读取现有模型部件", updateModelParts: "局部修改模型部件",
    worldLifeConfigure: "调整演绎运行",
    worldImportAsset: "接入 Kiln 模型", kilnPrepare: "准备 Kiln 建模引擎", kilnTool: "Kiln 建模与迭代", kilnExport: "导出真实 GLB",
    // 宿主工具插件（和画布 Agent 同一批）。
    askUser: "向你提问", read: "读取文件", ls: "查看目录", find: "查找文件", grep: "搜索文件内容", write: "写入文件", edit: "修改文件", downloadImage: "下载图片",
    webSearch: "联网搜索", web_search: "联网搜索", webFetch: "读取网页", web_fetch: "读取网页", skillOperator: "读取技能", assetOperator: "管理素材",
    ffmpeg: "处理音视频", ffprobe: "读取音视频信息", sandbox: "运行代码",
  };
  const kilnLabels: Record<string, string> = {
    schemas: "读取建模工具契约", kiln_discover: "查询建模能力", kiln_validate: "校验建模源码", kiln_source: "读取模型源码",
    kiln_edit: "修改模型源码", kiln_render: "生成真实模型视图", kiln_inspect: "检查模型结构", kiln_screenshot_animation: "审阅模型动画", kiln_view_interior: "查看模型内部",
  };
  const toolLabels = new Map<string, string>();
  const toolStatuses = new Map<string, "running" | "success" | "error" | "interrupted">();
  const textBlocks = new Map<string, string>();
  const thinkingBlocks = new Map<string, string>();
  const publishedImages = new Set<string>();
  function updateStatus(message: string, warning = false) {
    input.onStatus(message);
    input.onProgress?.({ type: "status", message, ...(warning ? { warning: true } : {}) });
  }
  function toolLabel(name: string, args?: unknown) {
    const operation = args && typeof args === "object" && "name" in args ? args.name : undefined;
    if (name === "kilnTool") return typeof operation === "string" ? kilnLabels[operation] || operation : "编写建模指令";
    // 一次处理多件时标上件数（删除 5 件、批量执行 3 个操作）。
    const record = args && typeof args === "object" ? args as Record<string, unknown> : {};
    const count = name === "batch" ? (Array.isArray(record.calls) ? record.calls.length : 0) : Math.max(Array.isArray(record.ids) ? record.ids.length : 0, Array.isArray(record.items) ? record.items.length : 0);
    const label = labels[name] || name;
    return count > 1 ? `${label}（${count} ${name === "batch" ? "个操作" : "件"}）` : label;
  }
  function publishImages(id: string, label: string, result: unknown) {
    if (!result || typeof result !== "object" || !("content" in result) || !Array.isArray(result.content)) return;
    result.content.forEach((part, index) => {
      if (part?.type !== "image" || !["image/png", "image/jpeg", "image/webp"].includes(part.mimeType) || typeof part.data !== "string"
        || part.data.length > 8 * 1024 * 1024 || !/^[A-Za-z0-9+/]+={0,2}$/.test(part.data)) return;
      const imageId = `${id}:${index}`;
      if (publishedImages.has(imageId)) return;
      publishedImages.add(imageId);
      input.onProgress?.({ type: "image", id: imageId, label, src: `data:${part.mimeType};base64,${part.data}` });
    });
  }
  function publishResult(id: string, name: string, result: AgentToolResult) {
    const label = toolLabels.get(id) || toolLabel(name);
    if (!legacyReferenceImages || name !== "worldRead") publishImages(id, label, result);
    let status = toolStatuses.get(id) === "error" ? "error" as const : toolStatuses.get(id) === "interrupted" ? "interrupted" as const : "success" as const;
    const summaries: string[] = [];
    let resultText = "";
    for (const part of result.content ?? []) {
      if (!part || part.type !== "text" || typeof part.text !== "string" || part.text.length > 1024 * 1024 || !part.text.trim()) continue;
      if (!resultText) resultText = part.text.slice(0, 12000);
      if (!part.text.trimStart().startsWith("{")) continue;
      try {
        const receipt = JSON.parse(part.text);
        if (receipt?.ok === false) {
          status = "error";
          const error = typeof receipt.error === "string" ? receipt.error : receipt.error?.message;
          if (typeof error === "string") summaries.push(error.slice(0, 1200));
        }
        if (receipt?.buildCache?.hit === true || receipt?.render?.buildCache?.hit === true) summaries.push("复用已编译模型");
        const captureCache = receipt?.captureCache ?? receipt?.viewFidelity?.captureCache ?? receipt?.render?.viewFidelity?.captureCache;
        if (Number.isInteger(captureCache?.reused) && captureCache.reused > 0) summaries.push(`复用 ${captureCache.reused} 张视图`);
        else if (captureCache?.hit === true) summaries.push("复用已生成视图");
      } catch { /* 非JSON工具文字保留在宿主记录中，不当作结构化诊断。 */ }
    }
    toolStatuses.set(id, status);
    input.onProgress?.({ type: "tool", id, name, label, status, ...(summaries.length ? { detail: [...new Set(summaries)].join("；") } : {}), ...(resultText ? { result: resultText } : {}) });
  }
  try {
    updateStatus("连接创作服务");
    // ACT: 创建请求最多等待20秒并取回会话ID，再检查取消，避免已创建会话因客户端中途取消而失去关闭句柄。
    let hostTools = [...new Set(input.hostTools ?? [])];
    const createSession = () => post<{ sessionId: string }>("create", {
      directory: input.directory, systemPrompt: input.systemPrompt + (images.length ? "\n本轮包含用户参考图片。若启动接口不支持直接附图，会在首次成功的 worldRead 工具结果中提供真实图片及编号；先读取图片再处理用户要求。历史与当前图片的归属以用户提示中的编号和名称为准，不将参考图当成生成结果或场景观察截图。" : ""),
      tools: [...hostTools, ...(lifeOnly ? [] : [{ plugin: "trumanMap", names: ["kilnPrepare", "kilnTool", "kilnExport"] }]), ...input.tools.map(({ name, description, parameters }) => ({ name, description, parameters, executionMode: "sequential" }))],
    }, AbortSignal.timeout(20000));
    const missingNodeService = (error: unknown) => error instanceof Error && "path" in error && error.path === "create" && "status" in error && error.status === 400 && "rawMessage" in error && error.rawMessage === "工具插件 trumanMap 未安装或未启用";
    // 宿主工具插件没接上（刚被停用、载入失败、和场景工具重名）：去掉它们重建，场景工具照常用，不让整轮失败。
    const openSession = async () => {
      try { return await createSession(); }
      catch (error) {
        if (!hostTools.length || signal.aborted || missingNodeService(error)) throw error;
        updateStatus(`宿主工具没有接上，本轮只用场景工具：${error instanceof Error ? error.message.slice(0, 300) : "创建会话失败"}`, true);
        hostTools = [];
        return await createSession();
      }
    };
    // 建模工具随宿主内置安装；被卸载或停用时提示到插件市场处理，不再由节点自行安装。
    const session = await openSession().catch((error: unknown) => {
      if (missingNodeService(error)) throw new Error("建模工具“白模预演TrumanMap”未安装或已停用，请在“设置 → 插件市场”中启用后重试");
      throw error;
    });
    if (!session.sessionId || typeof session.sessionId !== "string") throw new Error("宿主未返回有效的 Agent 会话");
    sessionId = session.sessionId;
    signal.throwIfAborted();
    updateStatus("等待模型响应");
    let compact = true;
    let attachImages = true;
    // ACT: 一轮里几十次工具调用会把上下文撑满：请宿主在接近上限时自动压缩较早的内容；旧宿主不认识这个字段时去掉重试。
    let inRunCompaction = true;
    // 每一轮（含截断后的接续）用新的runId；同一会话的历史在宿主里保留。
    let runId = "";
    let runNumber = 0;
    const startRun = (prompt: string, thinkingLevel: ThinkingLevel | undefined, withImages: boolean) => fetch("/api/singleAgent/run", {
      method: "POST", headers: { "Content-Type": "application/json", "x-toonflow-workspace": "1" },
      body: JSON.stringify({ sessionId, runId: runId = crypto.randomUUID(), providerId: input.providerId, modelId: input.modelId, thinkingLevel, prompt, ...(withImages && attachImages && images.length ? { images } : {}), ...(compact ? { includeToolResults: false } : {}), ...(inRunCompaction ? { compaction: true } : {}) }), signal,
    });
    response = await startRun(input.prompt, input.thinkingLevel, true);
    if (response.status === 400) {
      const error = await response.clone().json().catch(() => null);
      // ACT: 只对启动前机器可判定的可选字段拒绝重试一次，旧宿主用已有工具图片通道，不丢弃附图。
      if (Array.isArray(error?.data) && error.data.length > 0 && error.data.every((issue: { code?: unknown; keys?: unknown; path?: unknown }) => issue?.code === "unrecognized_keys" && Array.isArray(issue.path) && issue.path.length === 0 && Array.isArray(issue.keys) && issue.keys.length > 0 && issue.keys.every(key => key === "includeToolResults" || key === "compaction" || key === "images" && images.length > 0))) {
        const rejectedKeys = new Set<string>(error.data.flatMap((issue: { keys: string[] }) => issue.keys));
        legacyReferenceImages = rejectedKeys.has("images");
        compact = !rejectedKeys.has("includeToolResults");
        inRunCompaction = !rejectedKeys.has("compaction");
        attachImages = !legacyReferenceImages;
        response = await startRun(input.prompt, input.thinkingLevel, true);
      }
    }
    let truncated = false;
    // 工具调用写到一半被截断：记下是哪些工具并停掉这一轮，换成“拆成几次小调用”的具体要求、降低思考档位接着跑，
    // 不让宿主原样重发同样长的调用再被截断。
    let truncatedTools: string[] = [];
    let stopping = false;
    let progress = 0;
    // 最后一条模型回复写了多少字（思考+正文+工具参数）：撞上限时只写了几个字，说明不是回复太长，
    // 而是这段对话已经把模型的上下文占满、没有输出空间了，在同一对话里接着生成永远没用，只能换新对话。
    let replyMessage = "";
    let replyParts = new Map<string, number>();
    const measureReply = (hostBlockId: string, toolArgs?: number, content?: number) => {
      const message = hostBlockId.split(":")[0]!;
      if (message !== replyMessage) { replyMessage = message; replyParts = new Map(); }
      if (toolArgs !== undefined) replyParts.set("tool:" + hostBlockId, toolArgs);
      if (content !== undefined) replyParts.set(hostBlockId, content);
    };
    const replyChars = () => [...replyParts.values()].reduce((total, value) => total + value, 0);
    // 本轮做过的事（模型的说明和做成的工具），换新对话时交给模型，让它接着做而不是重做。
    const journal: string[] = [];
    const note = (item: string) => {
      if (!item) return;
      const repeated = /^(.*?)(?: ×(\d+))?$/.exec(journal.at(-1) ?? "");
      if (repeated && repeated[1] === item) journal[journal.length - 1] = `${item} ×${Number(repeated[2] ?? 1) + 1}`;
      else journal.push(item);
    };
    // 宿主 singleAgent 没有“引导”入口：用户生成途中发的引导，随下一次世界工具结果交给模型（和宿主在工具之间插入引导消息同一时机）。
    const takeSteering = () => {
      const items = input.takeSteering?.() ?? [];
      if (!items.length) return "";
      for (const item of items) note(`用户引导：${item.text.slice(0, 200)}`);
      input.onProgress?.({ type: "steered", ids: items.map(item => item.id) });
      return `【用户刚刚补充了引导：优先按它调整接下来的步骤；已经做完的不撤销，没提到的照原计划做】\n${items.map((item, index) => `${items.length > 1 ? `${index + 1}. ` : ""}${item.text}`).join("\n")}`;
    };
    const stopForSplit = (name: string) => {
      if (!truncatedTools.includes(name)) truncatedTools.push(name);
      if (stopping || completed) return;
      stopping = true;
      // 不在读流时等停止完成：宿主停下后这条流自然结束，读流循环照常收尾。
      void post("control", { sessionId, runId, action: "stop" }, AbortSignal.timeout(15000)).catch(() => {});
    };
    const receive = async (line: string) => {
      if (!line.trim()) return;
      const event = JSON.parse(line);
      if (!event || typeof event.type !== "string") throw new Error("Agent 回复事件无效");
      signal.throwIfAborted();
      touch();
      // 回复撞到单次输出上限：读完这一轮的流，再在同一会话里接着生成，草稿和已执行的工具都保留。
      if (event.type === "error" && typeof event.message === "string" && truncatedReply.test(event.message)) { truncated = true; return; }
      // 是我们为拆分重发而停下的这一轮：“本次回复已停止”不算失败。
      if (event.type === "error" && stopping) return;
      if (event.type === "tool" && event.tool?.status === "error" && typeof event.tool.result === "string" && truncatedToolCall.test(event.tool.result) && typeof event.tool.id === "string" && typeof event.tool.name === "string") {
        const label = toolLabels.get(event.tool.id) || toolLabel(event.tool.name);
        toolStatuses.set(event.tool.id, "interrupted");
        input.onProgress?.({ type: "tool", id: event.tool.id, name: event.tool.name, label, status: "interrupted", detail: "回复太长被截断，没有执行；正在让模型拆成几次小调用" });
        updateStatus("工具参数太长被截断，正在让模型拆小接着做", true);
        stopForSplit(event.tool.name);
        return;
      }
      if (event.type === "tool" && event.tool?.status === "success" && typeof event.tool.id === "string") {
        progress++;
        note(toolLabels.get(event.tool.id) || toolLabel(String(event.tool.name ?? "")));
      }
      if (event.type === "toolResult" && typeof event.id === "string" && toolStatuses.get(event.id) === "interrupted") return;
      // 已经要停下重发了，宿主随后发来的调用不再执行（宿主停下时会自己结束它们）。
      if (event.type === "clientTool" && stopping) return;
      if (event.type === "error") throw new Error(event.message || "Holodeck Agent 执行失败");
      // 宿主每一轮都从“1:0”重新编号：接续轮加上轮次前缀，不然新一轮的思考和正文会覆盖第一轮界面上的同号内容。
      const blockId = typeof event.blockId === "string" ? runNumber > 1 ? `r${runNumber}:${event.blockId}` : event.blockId : undefined;
      if ((event.type === "text" || event.type === "thinking" || event.type === "tool") && typeof event.blockId === "string") measureReply(event.blockId, event.type === "tool" ? JSON.stringify(event.tool?.args ?? "").length : undefined);
      if (event.type === "text" && blockId) {
        const previous = textBlocks.get(blockId) ?? "";
        const text = (typeof event.content === "string" ? event.content : previous + (typeof event.delta === "string" ? event.delta : "")).slice(0, 12000);
        textBlocks.set(blockId, text);
        measureReply(event.blockId, undefined, text.length);
        input.onProgress?.({ type: "text", id: blockId, text, done: event.done === true });
        if (event.done === true && text.trim()) note(text.trim().slice(0, 200));
      }
      if (event.type === "thinking" && blockId) {
        const first = !thinkingBlocks.has(blockId);
        const previous = thinkingBlocks.get(blockId) ?? "";
        const text = (typeof event.content === "string" ? event.content : previous + (typeof event.delta === "string" ? event.delta : "")).slice(0, 12000);
        thinkingBlocks.set(blockId, text);
        measureReply(event.blockId, undefined, text.length);
        input.onProgress?.({ type: "thinking", id: blockId, text, done: event.done === true });
        if (first && thinkingBlocks.size === 1) updateStatus("模型正在规划");
      }
      if (event.type === "retry") updateStatus("模型请求正在重试");
      if (event.type === "compaction") updateStatus(event.active ? "正在压缩上下文" : "上下文已压缩，继续生成");
      if (event.type === "tool" && event.tool && typeof event.tool.id === "string" && typeof event.tool.name === "string") {
        const tool = event.tool;
        const label = tool.args ? toolLabel(tool.name, tool.args) : toolLabels.get(tool.id) || toolLabel(tool.name);
        toolLabels.set(tool.id, label);
        if (["running", "success", "error", "interrupted"].includes(tool.status)) {
          if (tool.status === "running") updateStatus(label);
          toolStatuses.set(tool.id, tool.status);
          input.onProgress?.({ type: "tool", id: tool.id, name: tool.name, label, status: tool.status, args: tool.args, ...(typeof tool.result === "string" && (tool.status === "error" || tool.status === "interrupted") ? { detail: tool.result.slice(0, 2000), result: tool.result.slice(0, 12000) } : {}) });
          if (tool.status !== "running" && waitingQuestions.delete(tool.id)) touch();
        }
      }
      if (event.type === "toolResult" && typeof event.id === "string" && typeof event.name === "string" && event.result && Array.isArray(event.result.content)) publishResult(event.id, event.name, event.result);
      if (event.type === "clientTool") {
        if (typeof event.callId !== "string" || typeof event.name !== "string") throw new Error("收到无效的世界工具调用");
        const id = typeof event.toolCallId === "string" ? event.toolCallId : event.callId;
        const label = toolLabel(event.name, event.args);
        try {
          const tool = tools.get(event.name);
          if (!tool || typeof event.callId !== "string" || !event.args || typeof event.args !== "object" || Array.isArray(event.args)) throw new Error("收到未注册或参数无效的世界工具调用");
          toolLabels.set(id, label);
          toolStatuses.set(id, "running");
          updateStatus(label);
          input.onProgress?.({ type: "tool", id, name: event.name, label, status: "running", args: event.args });
          const result = toToolResult(await tool.execute(event.args, signal));
          signal.throwIfAborted();
          publishResult(id, event.name, result);
          const deliverReferences = legacyReferenceImages && !referenceImagesDelivered && event.name === "worldRead";
          const steering = takeSteering();
          const submittedResult = deliverReferences || steering ? {
            content: [...result.content, ...(deliverReferences ? [{ type: "text" as const, text: `以下为用户参考图片，按原始提示中的图片编号依次排列；历史与当前归属以原始提示为准，不是本次生成结果或场景观察截图。\n${input.images!.map((image, index) => `图片 ${index + 1}：${JSON.stringify(image.name.slice(0, 200))}`).join("\n")}` }, ...images] : []), ...(steering ? [{ type: "text" as const, text: steering }] : [])],
            details: result.details,
          } : result;
          await post("toolResult", { sessionId, callId: event.callId, result: submittedResult }, signal);
          if (deliverReferences) referenceImagesDelivered = true;
        } catch (error) {
          signal.throwIfAborted();
          const message = error instanceof Error ? error.message.slice(0, 20000) : "世界工具执行失败";
          toolStatuses.set(id, "error");
          input.onProgress?.({ type: "tool", id, name: event.name, label, status: "error", detail: message.slice(0, 2000), args: event.args });
          const steering = takeSteering();
          await post("toolResult", { sessionId, callId: event.callId, error: steering ? `${message}\n\n${steering}` : message }, signal);
        }
      }
      // 宿主提问器（askUser）：和画布 Agent 一样在对话里出提问卡，等用户回答或跳过；等待期间不算超时。
      if (event.type === "question") {
        if (typeof event.callId !== "string" || typeof event.toolCallId !== "string") throw new Error("收到无效的提问");
        const strings = (value: unknown) => Array.isArray(value) ? value.filter((item): item is string => typeof item === "string" && !!item.trim()).slice(0, 20) : undefined;
        const fields = Array.isArray(event.fields) ? (event.fields as unknown[]).flatMap(field => {
          if (!field || typeof field !== "object") return [];
          const item = field as Record<string, unknown>;
          if (typeof item.field !== "string" || typeof item.title !== "string" || !["input", "textarea", "radio", "checkbox", "select", "inputNumber", "switch"].includes(String(item.type))) return [];
          return [{ field: item.field, title: item.title, type: item.type as AgentQuestionField["type"], ...(item.required === true ? { required: true } : {}), ...(strings(item.options) ? { options: strings(item.options) } : {}), ...(typeof item.placeholder === "string" ? { placeholder: item.placeholder } : {}) }];
        }).slice(0, 12) : undefined;
        const options = strings(event.options);
        const question: AgentQuestion = { sessionId, callId: event.callId, title: typeof event.title === "string" && event.title.trim() ? event.title.slice(0, 100) : "请确认", question: typeof event.question === "string" ? event.question.slice(0, 4000) : "", ...(options?.length ? { options } : {}), ...(fields?.length ? { fields } : {}) };
        waitingQuestions.add(event.toolCallId);
        touch();
        updateStatus("等你回答");
        input.onProgress?.({ type: "question", id: event.toolCallId, question });
      }
      if (event.type === "complete") {
        if (typeof event.text !== "string") throw new Error("Agent 完成结果无效");
        completed = { text: event.text };
        input.onProgress?.({ type: "complete" });
      }
    };
    const readRun = async (current: Response) => {
      if (!current.ok) {
        const error = await current.json().catch(() => null);
        throw requestError("run", current.status, error);
      }
      if (!current.body) throw new Error("Agent 回复流为空");
      runNumber++;
      replyMessage = "";
      replyParts = new Map();
      reader = current.body.getReader();
      const decoder = new TextDecoder();
      let pending = "";
      // ACT: 旧宿主complete会回传已提交的工具原图；仅为已限制到16张/64MiB的这一份原图增加有限预算。
      const maxLineCharacters = 32 * 1024 * 1024 + (legacyReferenceImages ? images.reduce((total, image) => total + image.data.length + 2048, 0) : 0);
      for (;;) {
        const chunk = await reader.read();
        pending += decoder.decode(chunk.value, { stream: !chunk.done });
        if (pending.length > maxLineCharacters) throw new Error(legacyReferenceImages ? "Agent 单条回复超过本轮图片预算，请减少参考图片或分批搭建场景" : "Agent 单条回复超过32 MB，请分批搭建场景");
        let end: number;
        while ((end = pending.indexOf("\n")) !== -1) {
          const line = pending.slice(0, end);
          pending = pending.slice(end + 1);
          await receive(line);
        }
        if (chunk.done) break;
      }
      if (pending.trim()) await receive(pending);
      reader.releaseLock();
      reader = undefined;
    };
    await readRun(response);
    let thinkingLevel = input.thinkingLevel;
    // 接续：只要上一段还有工具做成就一直接着跑（总数封顶），连续几段毫无进展才放弃。
    // 对话本身太长（撞上限时模型只写出几个字）或同一对话里接连两次没进展：草稿在插件这边，换一个新对话、
    // 带上“用户要求+已做的步骤”接着做，上下文从零开始，不再被前面几十次工具结果占满。
    let stalled = 0, attempts = 0, progressBefore = 0, handoffs = 0, lastSaturated = false;
    while (!completed && (truncated || stopping) && attempts < maxContinuations) {
      signal.throwIfAborted();
      const saturated = truncated && !stopping && replyChars() < saturatedReplyChars;
      const fresh = handoffs < maxHandoffs && (saturated || stalled >= 2);
      // 对话占满时在原对话里接着生成没用：换新对话的次数用完就停。
      if (!fresh && (stalled >= maxStalledContinuations || saturated && handoffs >= maxHandoffs)) { lastSaturated = saturated; break; }
      attempts++;
      const prompt = fresh ? handoffPrompt(input.request ?? input.prompt, journal, lifeOnly) : stopping ? toolContinuationPrompt(truncatedTools) : continuationPrompt;
      updateStatus(fresh ? `对话太长，模型已经没有输出空间，换新对话接着做（第 ${handoffs + 1} 次）` : stopping ? `工具参数太长被截断，正在让模型拆小接着做（第 ${attempts} 次）` : `模型回复超出单次输出上限，正在接着生成（第 ${attempts} 次）`, true);
      truncated = false;
      stopping = false;
      truncatedTools = [];
      if (fresh) {
        handoffs++;
        stalled = 0;
        // 旧对话不再用：关掉它（不等），新对话用同样的系统提示和工具。
        const previous = sessionId;
        void post("control", { sessionId: previous, action: "close" }, AbortSignal.timeout(15000)).catch(() => {});
        const next = await createSession();
        if (!next.sessionId || typeof next.sessionId !== "string") throw new Error("宿主未返回有效的 Agent 会话");
        sessionId = next.sessionId;
        signal.throwIfAborted();
      } else thinkingLevel = lowerThinking(thinkingLevel, input.reasoningLevels);
      progressBefore = progress;
      response = await startRun(prompt, thinkingLevel, fresh);
      // 宿主仍不认降档后的档位（能力列表过期等）：退回用户原本选的档位重发，不让整轮草稿作废。
      if (response.status === 400 && thinkingLevel !== input.thinkingLevel) {
        const rejected = await response.clone().json().catch(() => null);
        if (typeof rejected?.message === "string" && unsupportedThinking.test(rejected.message)) {
          thinkingLevel = input.thinkingLevel;
          response = await startRun(prompt, thinkingLevel, fresh);
        }
      }
      await readRun(response);
      stalled = progress > progressBefore ? 0 : stalled + 1;
    }
    signal.throwIfAborted();
    if (!completed && (truncated || stopping)) {
      const reason = lastSaturated ? `对话太长，模型已经没有输出空间（换了 ${handoffs} 次新对话仍然如此）` : `模型回复${stalled >= maxStalledContinuations ? `连续 ${stalled} 次接着生成都没有进展` : `接着生成了 ${attempts} 次`}，仍然超出单次输出上限`;
      // 一件都没做成才算失败；做成过的修改都在草稿里、交付前还会提交并核对，不因为最后没写出总结就整轮作废。
      if (!progress) throw new Error(`${reason}，本轮草稿未应用。${lastSaturated ? "请把要求拆成几步分开发，或换一个上下文更长的模型。" : "请在 Toonflow 模型设置里调高该模型的最大输出长度，或把思考档位调低后重试。"}`);
      const last = journal.at(-1);
      completed = { text: "", incomplete: `${reason}，没能全部做完${last ? `（中断前在做：${last.slice(0, 120)}）` : ""}。已经做成的修改照常提交核对后交付，发“继续”可以接着做剩下的部分。` };
    }
    if (!completed) throw new Error("Agent 未正常完成，本轮草稿未应用");
    if (legacyReferenceImages && !referenceImagesDelivered) throw new Error("Agent 尚未通过 worldRead 读取本轮参考图片，本次草稿未应用，请重新生成。");
    succeeded = true;
  } finally {
    clearTimeout(idleTimer);
    waitingQuestions.add("finished");
    await reader?.cancel().catch(() => {});
    reader?.releaseLock();
    if (sessionId) {
      closing = post("control", { sessionId, action: "close" }, AbortSignal.timeout(15000)).then(() => {}, () => {
        updateStatus("Agent 会话未能及时关闭，草稿仍受取消与修订保护", true);
      });
      if (!succeeded) await closing;
    }
  }
  return { ...completed!, closing };
}
