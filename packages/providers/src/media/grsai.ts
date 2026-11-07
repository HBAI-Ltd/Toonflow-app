const rules = [
  {
    type: "input",
    field: "apiKey" as const,
    title: "API Key",
    value: "",
    props: { type: "password", showPassword: true, autocomplete: "off" },
    validate: [{ required: true, message: "请填写 API Key", trigger: "blur" }],
  },
  {
    type: "select",
    field: "region" as const,
    title: "请求节点",
    value: "domestic",
    options: [{ label: "国内节点", value: "domestic" }, { label: "全球节点", value: "global" }],
  },
];

const imagePixels: Record<string, string[]> = {
  "1:1": ["1024x1024", "2048x2048", "2880x2880"],
  "16:9": ["1280x720", "2048x1152", "3840x2160"],
  "9:16": ["720x1280", "1152x2048", "2160x3840"],
  "4:3": ["1152x864", "2304x1728", "3264x2448"],
  "3:4": ["864x1152", "1728x2304", "2448x3264"],
  "3:2": ["1536x1024", "2048x1360", "3504x2336"],
  "2:3": ["1024x1536", "1360x2048", "2336x3504"],
};

const modelQualities: Record<string, string[]> = {
  "gpt-image-2": ["auto"],
  "gpt-image-2.5": ["auto"],
  "gpt-image-2-vip": ["medium"],
  "gpt-image-2.5-flare": ["low", "medium", "high"],
  "gpt-image-2.5-sunburst": ["low", "medium", "high", "xhigh", "max"],
};

type ImageTask = { kind: "image"; taskId: string; region: string };

function getBaseUrl(region: string) {
  if (region === "domestic") return "https://grsai.dakka.com.cn";
  if (region === "global") return "https://grsaiapi.com";
  throw new Error("请选择 Grsai 请求节点");
}

function httpUrl(value: unknown): string {
  if (typeof value !== "string") throw new Error("Grsai 图片地址无效");
  const url = new URL(value);
  if (!["http:", "https:"].includes(url.protocol) || url.username || url.password) throw new Error("Grsai 图片地址须为不含凭据的 HTTP(S) 地址");
  return url.href;
}

function mediaUrl(input: MediaInput) {
  if (input.type === "url") return httpUrl(input.url);
  const data = input.type === "binary" ? Buffer.from(input.data).toString("base64") : input.data;
  if (!input.mimeType.startsWith("image/") || !data) throw new Error("参考图数据或类型无效");
  return data.startsWith("data:") ? data : `data:${input.mimeType};base64,${data}`;
}

async function requestJson(context: ProviderContext, url: string, apiKey: string, signal: AbortSignal, body?: Record<string, unknown>) {
  const response = await context.tool.fetch(url, {
    method: body ? "POST" : "GET",
    headers: { Authorization: `Bearer ${apiKey}`, ...(body ? { "Content-Type": "application/json" } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}),
    signal,
  });
  if (!response.ok) {
    const text = await response.text();
    let failed = false;
    if (!body && response.status === 400) {
      try {
        const data: unknown = JSON.parse(text);
        if (data && typeof data === "object" && !Array.isArray(data)) {
          const task = data as Record<string, unknown>;
          failed = ["failed", "violation"].includes(String(task.status))
            && task.id === new URL(url).searchParams.get("id");
        }
      } catch { /* 非 JSON 错误仍按 HTTP 请求异常处理。 */ }
    }
    const message = context.tool.errorMessage(text);
    throw Object.assign(new Error(`Grsai 请求失败（HTTP ${response.status}）${message ? `：${message}` : ""}`), failed ? { code: "MEDIA_TASK_FAILED" } : {});
  }
  const data: unknown = await response.json();
  if (!data || typeof data !== "object" || Array.isArray(data)) throw new Error("Grsai 响应格式错误");
  return data as Record<string, unknown>;
}

function imageResult(context: ProviderContext, data: Record<string, unknown>): MediaAsset[] | undefined {
  if (data.status === "failed" || data.status === "violation") {
    throw Object.assign(new Error(context.tool.errorMessage(data) || "Grsai 图片生成失败"), { code: "MEDIA_TASK_FAILED" });
  }
  if (data.status === "running") return;
  if (data.status !== "succeeded") throw new Error("Grsai 返回未知任务状态，请稍后恢复查询");
  if (!Array.isArray(data.results) || !data.results.length) throw new Error("Grsai 未返回生成图片");
  return data.results.map((item: unknown) => {
    if (!item || typeof item !== "object" || !("url" in item)) throw new Error("Grsai 生成图片格式错误");
    return { mediaType: "image", type: "url", url: httpUrl(item.url) };
  });
}

function wait(signal: AbortSignal) {
  signal.throwIfAborted();
  return new Promise<void>((resolve, reject) => {
    const abort = () => {
      clearTimeout(timer);
      reject(signal.reason);
    };
    const timer = setTimeout(() => {
      signal.removeEventListener("abort", abort);
      resolve();
    }, 5000);
    signal.addEventListener("abort", abort, { once: true });
  });
}

async function waitForImage(context: ProviderContext, apiKey: string, task: ImageTask, signal: AbortSignal): Promise<MediaAsset[]> {
  const url = `${getBaseUrl(task.region)}/v1/api/result?id=${encodeURIComponent(task.taskId)}`;
  while (true) {
    signal.throwIfAborted();
    const data = await requestJson(context, url, apiKey, signal);
    if (data.id !== task.taskId) throw new Error("Grsai 返回的任务 ID 不匹配");
    const images = imageResult(context, data);
    if (images) return images;
    await wait(signal);
  }
}

export default {
  id: "grsai",
  label: "Grsai",
  icon: "",
  version: "2.0.0",
  readme: "支持 GPT 图片系列的文生图与单图、多图参考，默认使用国内节点。[获取 API Key](https://grsai.ai/zh/dashboard/api-keys)。普通模型支持 1K，VIP、Flare、Sunburst 支持 1K/2K/4K。蒙版仅支持平台可访问的 HTTP(S) 图片地址。停止本地等待不会取消远端任务。",
  rules,
  models: [
    { id: "gpt-image-2", label: "GPT Image 2", type: "image", mode: ["text", "singleImage", "multiReference"], imageSizes: ["1K"], imageRatios: ["1:1", "16:9", "9:16", "4:3", "3:4", "3:2", "2:3"] },
    { id: "gpt-image-2.5", label: "GPT Image 2.5", type: "image", mode: ["text", "singleImage", "multiReference"], imageSizes: ["1K"], imageRatios: ["1:1", "16:9", "9:16", "4:3", "3:4", "3:2", "2:3"] },
    { id: "gpt-image-2-vip", label: "GPT Image 2 VIP", type: "image", mode: ["text", "singleImage", "multiReference"], imageSizes: ["1K", "2K", "4K"], imageRatios: ["1:1", "16:9", "9:16", "4:3", "3:4", "3:2", "2:3"] },
    { id: "gpt-image-2.5-flare", label: "GPT Image 2.5 Flare", type: "image", mode: ["text", "singleImage", "multiReference"], imageSizes: ["1K", "2K", "4K"], imageRatios: ["1:1", "16:9", "9:16", "4:3", "3:4", "3:2", "2:3"] },
    { id: "gpt-image-2.5-sunburst", label: "GPT Image 2.5 Sunburst", type: "image", mode: ["text", "singleImage", "multiReference"], imageSizes: ["1K", "2K", "4K"], imageRatios: ["1:1", "16:9", "9:16", "4:3", "3:4", "3:2", "2:3"] },
  ] satisfies ProviderModel[],
  async generateImage(request: ImageRequest): Promise<MediaAsset[]> {
    const apiKey = this.config.apiKey?.trim();
    if (!apiKey) throw new Error("请填写 API Key");
    const region = this.config.region ?? "domestic";
    const baseUrl = getBaseUrl(region);
    const qualities = Object.hasOwn(modelQualities, request.model) ? modelQualities[request.model]! : undefined;
    if (!qualities) throw new Error("不支持的 Grsai 图片模型");
    if (!request.prompt.trim()) throw new Error("请填写图片提示词");
    if (request.n !== undefined && request.n !== 1) throw new Error("Grsai 单次请求仅支持生成一张图片");
    if (request.outputFormat) throw new Error("Grsai 接口不支持指定输出编码格式");
    if (request.mask && (request.mask.type !== "url" || !request.images?.length)) throw new Error("Grsai 蒙版编辑需要参考图和可公开访问的 HTTP(S) 蒙版地址");
    if (Object.keys(request.other ?? {}).some(key => key !== "background")) throw new Error("存在不支持的 Grsai 图片参数");
    const ratio = request.ratio || "1:1";
    const pixels = Object.hasOwn(imagePixels, ratio) ? imagePixels[ratio]! : undefined;
    if (!pixels) throw new Error("不支持的 Grsai 图片比例");
    const size = (request.size || "1K").toUpperCase();
    const sizeIndex = ["1K", "2K", "4K"].indexOf(size);
    const basicModel = qualities[0] === "auto";
    if (sizeIndex < 0 || (basicModel && sizeIndex !== 0)) throw new Error("当前 Grsai 模型不支持所选分辨率");
    const quality = request.quality || (basicModel ? "auto" : "medium");
    if (!qualities.includes(quality)) throw new Error("当前 Grsai 模型不支持所选画质");
    const background = request.other?.background;
    if (background !== undefined && (background !== "transparent" || basicModel)) throw new Error("当前 Grsai 模型不支持所选背景参数");
    // ACT: 按厂商文档映射像素；每次提交或恢复最多等待 10 分钟，本地超时不代表远端失败。
    const signal = AbortSignal.any([AbortSignal.timeout(10 * 60_000), ...(this.signal ? [this.signal] : [])]);
    signal.throwIfAborted();
    const body = {
      model: request.model,
      prompt: request.prompt,
      images: (request.images ?? []).map(mediaUrl),
      aspectRatio: basicModel ? ratio : pixels[sizeIndex],
      quality,
      replyType: "async",
      ...(background ? { background } : {}),
      ...(request.mask?.type === "url" ? { mask: httpUrl(request.mask.url) } : {}),
    };
    await this.saveTaskData?.({ kind: "submitting" });
    const data = await requestJson(this, `${baseUrl}/v1/api/generate`, apiKey, signal, body);
    const images = imageResult(this, data);
    if (images) return images;
    if (typeof data.id !== "string" || !data.id.trim()) throw new Error("Grsai 未返回任务 ID");
    const task: ImageTask = { kind: "image", taskId: data.id, region };
    await this.saveTaskData?.(task);
    return waitForImage(this, apiKey, task, signal);
  },
  async resumeTask(data: ProviderTaskData): Promise<MediaAsset[]> {
    if (data.kind === "submitting") throw new Error("上次 Grsai 提交结果未知，不能自动重新提交，请先在供应商平台确认任务");
    if (data.kind !== "image" || typeof data.taskId !== "string" || !data.taskId.trim() || typeof data.region !== "string") throw new Error("Grsai 任务恢复数据无效");
    const apiKey = this.config.apiKey?.trim();
    if (!apiKey) throw new Error("请填写 API Key");
    const signal = AbortSignal.any([AbortSignal.timeout(10 * 60_000), ...(this.signal ? [this.signal] : [])]);
    return waitForImage(this, apiKey, { kind: "image", taskId: data.taskId, region: data.region }, signal);
  },
} satisfies ProviderDefinition<typeof rules>;
