const rules = [
  {
    type: "input",
    field: "apiKey" as const,
    title: "API Key",
    value: "",
    props: { type: "password", showPassword: true, autocomplete: "off" },
  },
];

const apiUrl = "https://api.toonflow.net/v1";
const version = "2.0.0";

function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("TF-router 响应格式错误");
  return value as Record<string, unknown>;
}

async function fetchJson(context: ProviderContext, path: string, body?: unknown, signal = context.signal) {
  const apiKey = typeof context.config.apiKey === "string" ? context.config.apiKey.trim().replace(/^Bearer\s+/i, "").trim() : "";
  if (!apiKey) throw new Error("请填写 TF-router API Key");
  signal?.throwIfAborted();
  const response = await context.tool.fetch(`${apiUrl}/${path}`, {
    method: body === undefined ? "GET" : "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal,
  });
  if (!response.ok) throw new Error(`TF-router 请求失败（HTTP ${response.status}）`);
  return object(await response.json());
}

function mediaUrl(input: MediaInput) {
  if (input.type === "url") {
    if (!/^https?:\/\//i.test(input.url)) throw new Error("参考媒体需要 HTTP 或 HTTPS 地址");
    return input.url;
  }
  const data = input.type === "binary" ? Buffer.from(input.data).toString("base64") : input.data;
  return data.startsWith("data:") ? data : `data:${input.mimeType};base64,${data}`;
}

function mediaAsset(value: unknown, mediaType: MediaAsset["mediaType"]): MediaAsset[] {
  if (typeof value !== "string" || !value.trim()) throw new Error("TF-router 未返回生成结果");
  const url = value.trim();
  if (/^https?:\/\//i.test(url)) return [{ mediaType, type: "url", url }];
  const data = /^data:([^;,]+);base64,([\s\S]+)$/.exec(url);
  if (!data || !data[1].startsWith(`${mediaType}/`)) throw new Error("TF-router 返回的媒体地址无效");
  return [{ mediaType, type: "base64", mimeType: data[1], data: data[2] }];
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
    }, 3000);
    signal.addEventListener("abort", abort, { once: true });
  });
}

async function generateTask(context: ProviderContext, mediaType: "image" | "video", body: unknown) {
  // ACT: 单次生成最多等待 30 分钟；供应商开放任务恢复能力后再单独保存任务 ID。
  const signal = AbortSignal.any([AbortSignal.timeout(30 * 60_000), ...(context.signal ? [context.signal] : [])]);
  const task = await fetchJson(context, `${mediaType}/generate${mediaType === "image" ? "Image" : "Video"}`, body, signal);
  if (typeof task.data !== "string" || !task.data.trim()) throw new Error("TF-router 未返回任务 ID");
  while (true) {
    const result = await fetchJson(context, `${mediaType}/get${mediaType === "image" ? "Image" : "Video"}Status`, { taskICode: task.data }, signal);
    const data = result.data == null ? {} : object(result.data);
    const status = String(result.status ?? data.status ?? "").toLowerCase();
    if (status === "success" || status === "completed") return mediaAsset(data.data, mediaType);
    if (status === "failed" || status === "failure") {
      throw new Error(typeof data.failReason === "string" ? data.failReason : `${mediaType === "image" ? "图片" : "视频"}生成失败`);
    }
    await wait(signal);
  }
}

export default {
  id: "tfRouter" as const,
  label: "TF-router",
  version,
  apiUrl,
  protocol: "openai-completions",
  readme: "## Toonflow 官方中转平台\n\n提供文本、图像、视频、音频等多模态模型服务。\n\n[前往中转平台](https://api.toonflow.net/)",
  rules,
  models: [
    {
      id: "Seedance 2.5",
      label: "Seedance-2.5 (支持真人)",
      type: "video",
      mode: ["text", "startFrameOptional", ["imageReference:30", "videoReference:10", "audioReference:10"]],
      audio: "optional",
      durationResolutionMap: [{
        duration: [4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30],
        resolution: ["480p", "720p", "1080p"],
      }],
    },
    {
      id: "Seedance 2.0",
      label: "Seedance-2.0 (支持真人)",
      type: "video",
      mode: ["text", "startFrameOptional", ["imageReference:9", "videoReference:3", "audioReference:3"]],
      audio: "optional",
      durationResolutionMap: [{ duration: [4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15], resolution: ["480p", "720p"] }],
    },
    {
      id: "Seedance 2.0 fast",
      label: "Seedance 2.0 fast (支持真人)",
      type: "video",
      mode: ["text", "startFrameOptional", ["imageReference:9", "videoReference:3", "audioReference:3"]],
      audio: "optional",
      durationResolutionMap: [{ duration: [4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15], resolution: ["480p", "720p"] }],
    },
    {
      id: "Seedance 2.0 mini",
      label: "Seedance 2.0 mini (支持真人)",
      type: "video",
      mode: ["text", "startFrameOptional", ["imageReference:9", "videoReference:3", "audioReference:3"]],
      audio: "optional",
      durationResolutionMap: [{ duration: [4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15], resolution: ["480p", "720p"] }],
    },
    {
      id: "wan-3.0",
      label: "Wan3.0",
      type: "video",
      mode: ["text", "startFrameOptional", ["imageReference:10", "videoReference:5", "audioReference:5"]],
      audio: "optional",
      durationResolutionMap: [{
        duration: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30],
        resolution: ["480p", "720p", "1080p"],
      }],
    },
    {
      id: "wan2.6",
      label: "Wan2.6",
      type: "video",
      mode: ["singleImage"],
      audio: true,
      durationResolutionMap: [{ duration: [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15], resolution: ["720p", "1080p"] }],
    },
    {
      id: "doubao-seedance-1-5-pro",
      label: "Seedance 1.5 Pro",
      type: "video",
      mode: ["text", "endFrameOptional"],
      audio: true,
      durationResolutionMap: [{ duration: [4, 5, 6, 7, 8, 9, 10, 11, 12], resolution: ["480p", "720p", "1080p"] }],
    },
    {
      id: "ViduQ3-pro",
      label: "ViduQ3 pro",
      type: "video",
      mode: ["singleImage", "startEndRequired"],
      audio: false,
      durationResolutionMap: [{ duration: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16], resolution: ["540p", "720p", "1080p"] }],
    },
    {
      id: "Kling-Video-O1",
      label: "Kling-Video-O1",
      type: "video",
      mode: ["startFrameOptional", ["imageReference:7", "videoReference:1"]],
      audio: "optional",
      durationResolutionMap: [{ duration: [5, 10, 15], resolution: ["720p", "1080p"] }],
    },
    {
      id: "Kling-V3-Omni",
      label: "Kling-V3-Omni",
      type: "video",
      mode: ["startFrameOptional", ["imageReference:7", "videoReference:1"]],
      audio: "optional",
      durationResolutionMap: [{ duration: [5, 10, 15], resolution: ["720p", "1080p"] }],
    },
    {
      id: "doubao-seedream-5.0-Lite",
      label: "Doubao Seedream 5.0 Lite",
      type: "image",
      mode: ["text", "singleImage", "multiReference"],
      imageSizes: ["2K", "4K"],
      imageRatios: ["16:9", "9:16"],
    },
    {
      id: "doubao-seedream-4-5",
      label: "Doubao Seedream 4.5",
      type: "image",
      mode: ["text", "singleImage", "multiReference"],
      imageSizes: ["2K", "4K"],
      imageRatios: ["16:9", "9:16"],
    },
    {
      id: "全能图片G-2.0",
      label: "全能图片G-2.0",
      type: "image",
      mode: ["text", "singleImage", "multiReference"],
      imageSizes: ["1K", "2K", "4K"],
      imageRatios: ["1:1", "9:16", "16:9", "3:4", "4:3", "3:2", "2:3", "21:9"],
    },
  ] satisfies ProviderModel[],
  async generateImage(request: ImageRequest): Promise<MediaAsset[]> {
    const model = request.model.toLowerCase();
    const images = (request.images ?? []).map(mediaUrl);
    const size = (request.size ?? "2K").toUpperCase();
    const ratio = request.ratio ?? "16:9";
    if (!["1K", "2K", "4K"].includes(size)) throw new Error("TF-router 图片尺寸仅支持 1K、2K、4K");

    if (model.includes("gemini") || model.includes("nano")) {
      const messages: unknown[] = [];
      if (images.length) messages.push({ role: "user", content: images.map((url) => ({ type: "image_url", image_url: { url } })) });
      messages.push({ role: "user", content: request.prompt + "请直接输出图片" });
      const result = await fetchJson(this, "chat/completions", {
        model: request.model,
        messages,
        extra_body: { google: { image_config: { aspect_ratio: ratio, image_size: size } } },
      });
      const choice = Array.isArray(result.choices) ? object(result.choices[0]) : {};
      const content = object(choice.message).content;
      const image = typeof content === "string" ? /!\[[^\]]*\]\(([^\s)]+)/.exec(content)?.[1] : undefined;
      return mediaAsset(image, "image");
    }

    let metadata: Record<string, unknown>;
    let resolvedSize: string;
    if (model.includes("doubao") || model.includes("seedream")) {
      const sizes: Record<string, Record<string, string>> = {
        "16:9": { "2K": "2848x1600", "4K": "4096x2304" },
        "9:16": { "2K": "1600x2848", "4K": "2304x4096" },
      };
      resolvedSize = sizes[ratio]?.[size === "1K" ? "2K" : size] ?? "";
      if (!resolvedSize) throw new Error("TF-router Seedream 适配仅支持 16:9、9:16");
      metadata = { response_format: "url", sequential_image_generation: "disabled", stream: false, watermark: false };
    } else if (model.includes("gpt") || model.includes("全能图片")) {
      resolvedSize = size.toLowerCase();
      metadata = { aspectRatio: ratio };
    } else {
      throw new Error(`不支持的图像模型：${request.model}`);
    }
    return generateTask(this, "image", {
      model: request.model,
      prompt: request.prompt,
      size: resolvedSize,
      ...(images.length ? { images } : {}),
      metadata,
    });
  },
  async generateVideo(request: VideoRequest): Promise<MediaAsset[]> {
    const model = request.model.toLowerCase();
    const images = (request.images ?? []).map(mediaUrl);
    const videos = (request.videos ?? []).map(mediaUrl);
    const audios = (request.audios ?? []).map(mediaUrl);
    const frames = [
      ...(request.firstFrame ? [{ url: mediaUrl(request.firstFrame), role: "first_frame" }] : []),
      ...(request.lastFrame ? [{ url: mediaUrl(request.lastFrame), role: "last_frame" }] : []),
    ];
    const mode = request.mode ?? (frames.length ? "endFrameOptional" : videos.length || audios.length ? [] : images.length ? "singleImage" : "text");
    const isFrames = mode === "startEndRequired" || mode === "endFrameOptional" || mode === "startFrameOptional";
    const frameImages = frames.length ? frames : images.map((url, index) => ({ url, role: index === 0 ? "first_frame" : "last_frame" }));
    const imageRefs = isFrames ? frameImages.map((item) => item.url) : images;
    const ratio = request.ratio ?? "16:9";
    let metadata: Record<string, unknown>;
    let includeImages = false;

    if (model.includes("doubao") || model.includes("seedance") || model === "wan-3.0") {
      const references: Record<string, unknown>[] = [];
      if (Array.isArray(mode)) {
        for (const [type, urls] of [["image", images], ["video", videos], ["audio", audios]] as const) {
          references.push(...urls.map((url) => ({ role: `reference_${type}`, type: `${type}_url`, [`${type}_url`]: { url } })));
        }
      } else if (isFrames) {
        references.push(...frameImages.map(({ url, role }) => ({ role, type: "image_url", image_url: { url } })));
      } else if (mode === "singleImage") {
        references.push(...images.map((url) => ({ role: "reference_image", type: "image_url", image_url: { url } })));
      }
      metadata = {
        ...(typeof request.generateAudio === "boolean" ? { generate_audio: request.generateAudio } : {}),
        ratio,
        references,
        resolution: request.resolution,
      };
    } else if (model.includes("vidu")) {
      includeImages = true;
      metadata = { aspect_ratio: ratio, audio: request.generateAudio ?? false, off_peak: false };
    } else if (model.includes("kling")) {
      metadata = {
        aspect_ratio: ratio,
        sound: request.generateAudio ? "on" : "off",
        video_list: videos.map((url) => ({ video_url: url })),
        image_list: [],
      };
      if (model.includes("omni") || model.includes("o1")) {
        metadata.image_list = isFrames
          ? frameImages.map(({ url, role }) => ({ image_url: url, type: role === "first_frame" ? "first_frame" : "end_frame" }))
          : images.map((url) => ({ image_url: url }));
      } else {
        if (imageRefs[0]) metadata.image = imageRefs[0];
        if (isFrames && imageRefs[1]) metadata.image_tail = imageRefs[1];
      }
    } else if (model.includes("grok")) {
      metadata = { aspectRatio: ratio };
    } else if (model.includes("wan")) {
      includeImages = true;
      metadata = {};
      if (isFrames && frameImages.length >= 2) {
        metadata.first_frame_url = frameImages.find((item) => item.role === "first_frame")?.url;
        metadata.last_frame_url = frameImages.find((item) => item.role === "last_frame")?.url;
      } else if (imageRefs[0]) {
        metadata.img_url = imageRefs[0];
      }
      if (typeof request.generateAudio === "boolean") metadata.audio = request.generateAudio;
    } else {
      throw new Error(`不支持的视频模型：${request.model}`);
    }
    return generateTask(this, "video", {
      model: request.model,
      prompt: request.prompt,
      duration: request.duration,
      resolution: request.resolution,
      ...(includeImages && imageRefs.length ? { images: imageRefs } : {}),
      metadata,
    });
  },
} satisfies ProviderDefinition<typeof rules>;
