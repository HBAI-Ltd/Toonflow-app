const rules = [
  {
    type: "input",
    field: "apiKey" as const,
    title: "API Key",
    value: "",
    props: { type: "password", showPassword: true, autocomplete: "off" },
  },
  {
    type: "input",
    field: "isOverseas" as const,
    title: "请求地区",
    value: "1",
    props: { placeholder: "1 为国内，2 为海外" },
  },
] as const;

const version = "2.0.0";

function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("APIMart 响应格式错误");
  return value as Record<string, unknown>;
}

function mediaUrl(input: MediaInput) {
  if (input.type === "url") return input.url;
  const data = input.type === "binary" ? Buffer.from(input.data).toString("base64") : input.data;
  return data.startsWith("data:") ? data : `data:${input.mimeType};base64,${data}`;
}

function getBaseUrl(isOverseas: string | undefined) {
  return isOverseas === "2" ? "https://api.apimart.ai/v1" : "https://api.apib.ai/v1";
}

function wait(signal: AbortSignal, ms: number) {
  signal.throwIfAborted();
  return new Promise<void>((resolve, reject) => {
    const abort = () => {
      clearTimeout(timer);
      reject(signal.reason);
    };
    const timer = setTimeout(() => {
      signal.removeEventListener("abort", abort);
      resolve();
    }, ms);
    signal.addEventListener("abort", abort, { once: true });
  });
}

/** 上传图片素材换取平台可访问的 URL；已是 URL 的输入直接透传，无需重新上传。 */
async function uploadImage(context: ProviderContext, apiKey: string, baseUrl: string, input: MediaInput, signal: AbortSignal): Promise<string> {
  if (input.type === "url") return input.url;
  const bytes = input.type === "binary" ? input.data : Buffer.from(input.data, "base64");
  const ext = input.mimeType.split("/")[1] || "png";
  const boundary = `----toonflow${Date.now().toString(16)}${Math.random().toString(16).slice(2)}`;
  const body = new Blob([
    `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="upload.${ext}"\r\nContent-Type: ${input.mimeType}\r\n\r\n`,
    new Uint8Array(bytes),
    `\r\n--${boundary}--\r\n`,
  ]);
  const response = await context.tool.fetch(`${baseUrl}/uploads/images`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": `multipart/form-data; boundary=${boundary}` },
    body,
    signal,
  });
  if (!response.ok) throw new Error(`图片上传失败：HTTP ${response.status}`);
  const result = object(await response.json());
  if (typeof result.url !== "string" || !result.url) throw new Error("图片上传未返回地址");
  return result.url;
}

/** Seedance 私有素材需先提交审核，通过后才能作为参考素材使用。 */
async function reviewSeedanceAssets(context: ProviderContext, apiKey: string, baseUrl: string, urls: string[], signal: AbortSignal): Promise<string[]> {
  if (urls.length > 20) throw new Error(`单次最多提交20个素材，当前提交了${urls.length}个`);
  const assets = urls.map((url) => ({ url, name: `image_${Date.now()}` }));
  const submitResponse = await context.tool.fetch(`${baseUrl}/seedance2/private-avatar`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      group: { name: `toonflow-seedance-group-${Date.now()}`, description: "ToonFlow自动创建的Seedance素材组" },
      project_name: "default",
      asset_type: "Image",
      assets,
    }),
    signal,
  });
  if (!submitResponse.ok) throw new Error(`Seedance资产提交失败：HTTP ${submitResponse.status}`);
  const submitResult = object(await submitResponse.json());
  const taskId = object(submitResult.data).id;
  if (!taskId) throw new Error("Seedance资产提交未返回任务ID");

  while (true) {
    const queryResponse = await context.tool.fetch(`${baseUrl}/tasks/${taskId}`, {
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      signal,
    });
    if (!queryResponse.ok) throw new Error(`审核状态查询失败：HTTP ${queryResponse.status}`);
    const queryData = object(await queryResponse.json());
    const taskData = object(queryData.data);
    const status = taskData.status;
    if (status === "completed" || status === "failed") {
      const result = object(taskData.result ?? {});
      const usableAssets = Array.isArray(result.usable_assets) ? result.usable_assets : [];
      const assetUrls = usableAssets.map((asset: any) => asset?.asset_url).filter(Boolean);
      if (!assetUrls.length) {
        const error = (taskData.error as { message?: unknown } | undefined)?.message;
        throw new Error(context.tool.errorMessage?.(taskData) || (typeof error === "string" ? error : "素材审核失败"));
      }
      return assetUrls;
    }
    await wait(signal, 3000);
  }
}

async function pollTaskResult<T>(context: ProviderContext, baseUrl: string, apiKey: string, taskId: string, signal: AbortSignal, extract: (data: Record<string, unknown>) => T): Promise<T> {
  while (true) {
    const response = await context.tool.fetch(`${baseUrl}/tasks/${taskId}`, {
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      signal,
    });
    if (!response.ok) throw new Error(`轮询失败：HTTP ${response.status}`);
    const result = object(await response.json());
    const data = object(result.data ?? {});
    const status = String(result.status ?? data.status ?? "").toLowerCase();
    if (status === "completed" || status === "success") return extract(data);
    if (status === "failed" || status === "failure") {
      const error = (data.error as { message?: unknown } | undefined)?.message;
      throw new Error(context.tool.errorMessage?.(result) || (typeof error === "string" ? error : "生成失败"));
    }
    await wait(signal, 3000);
  }
}

export default {
  id: "apiMart",
  label: "APIMart",
  icon: "data:image/webp;base64,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",
  version,
  readme: `## APIMart
<svg aria-label="APIMart" role="img" viewBox="480 470 1100 1100" xmlns="http://www.w3.org/2000/svg" style="flex-shrink: 0; color: currentColor; width: 1.2rem; height: 1.2rem; display: inline-block; vertical-align: middle; margin-right: 6px;"><path d="M 508 528 L 509 1514 L 586 1514 L 588 1512 L 587 610 L 589 607 L 670 607 L 1022 1009 L 1027 1007 L 1388 607 L 1467 607 L 1469 609 L 1470 738 L 1469 1513 L 1551 1513 L 1551 528 L 1350 528 L 1026 901 L 841 687 L 707 528 Z" fill="currentColor"></path><path d="M 627 646 L 626 1513 L 699 1513 L 700 785 L 1008 1131 L 1025 1147 L 1359 781 L 1360 1513 L 1434 1514 L 1435 646 L 1394 647 L 1240 821 L 1024 1059 L 1009 1045 L 789 795 L 661 646 Z" fill="currentColor"></path><path d="M 732 872 L 732 1513 L 802 1514 L 805 1512 L 805 1052 L 808 1053 L 888 1145 L 1024 1293 L 1250 1047 L 1250 1513 L 1322 1514 L 1324 1512 L 1323 872 L 1304 890 L 1026 1196 L 1021 1195 Z" fill="currentColor"></path></svg>APIMart是专注AI图片/视频生成的低价API平台，GPT-Image-2低至$0.006/张，1美元可出图160+张。图片、视频一套异步API通吃，提交任务拿ID、回调取结果，跑批万张不超时、换模型不改代码。

🔗 通过此 [注册链接](https://go.apimart.ai/gh-toonflow-app) 注册即可开用。`,
  rules,
  models: [
    {
      id: "seedance-2.5",
      label: "Seedance-2.5 (支持真人)",
      type: "video",
      mode: ["text", "startFrameOptional", ["imageReference:9", "videoReference:3", "audioReference:3"]],
      audio: "optional",
      durationResolutionMap: [
        { duration: [4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30], resolution: ["480p", "720p"] },
      ],
    },
    {
      id: "seedance-2.0",
      label: "Seedance-2.0 (支持真人)",
      type: "video",
      mode: ["text", "startFrameOptional", ["imageReference:9", "videoReference:3", "audioReference:3"]],
      audio: "optional",
      durationResolutionMap: [{ duration: [4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15], resolution: ["480p", "720p", "1080p"] }],
    },
    {
      id: "seedance-2.0-fast",
      label: "Seedance 2.0 fast (支持真人)",
      type: "video",
      mode: ["text", "startFrameOptional", ["imageReference:9", "videoReference:3", "audioReference:3"]],
      audio: "optional",
      durationResolutionMap: [{ duration: [4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15], resolution: ["480p", "720p"] }],
    },
    {
      id: "seedance-2.0-mini",
      label: "Seedance 2.0 mini (支持真人)",
      type: "video",
      mode: ["text", "startFrameOptional", ["imageReference:9", "videoReference:3", "audioReference:3"]],
      audio: "optional",
      durationResolutionMap: [{ duration: [4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15], resolution: ["480p", "720p"] }],
    },
    {
      id: "wan3.0-video",
      label: "Wan3.0",
      type: "video",
      mode: ["text", "startFrameOptional", ["imageReference:10", "videoReference:5", "audioReference:5"]],
      audio: true,
      durationResolutionMap: [
        { duration: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30], resolution: ["480P", "720P", "1080p"] },
      ],
    },
    {
      id: "MiniMax-H3",
      label: "MiniMax-H3",
      type: "video",
      mode: ["text", "startFrameOptional", ["imageReference:9", "videoReference:3", "audioReference:3"]],
      audio: "optional",
      durationResolutionMap: [{ duration: [4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15], resolution: ["768P", "2K"] }],
    },
    { id: "seedream-5-0-lite", label: "Doubao Seedream 5.0 Lite", type: "image", mode: ["text", "singleImage", "multiReference"] },
    { id: "seedream-5-0-pro", label: "Doubao Seedream 5.0 Pro", type: "image", mode: ["text", "singleImage", "multiReference"] },
    { id: "gpt-image-2", label: "gpt-image-2", type: "image", mode: ["text", "singleImage", "multiReference"] },
    { id: "gemini-3-pro-image-preview", label: "Nano banana Pro", type: "image", mode: ["text", "singleImage", "multiReference"] },
    { id: "gemini-3.1-flash-image-preview", label: "Nano banana2", type: "image", mode: ["text", "singleImage", "multiReference"] },
  ] satisfies ProviderModel[],
  async generateImage(request: ImageRequest): Promise<MediaAsset[]> {
    const apiKey = this.config.apiKey?.trim();
    if (!apiKey) throw new Error("请填写 API Key");
    const baseUrl = getBaseUrl(this.config.isOverseas);
    const lowerName = request.model.toLowerCase();
    // ACT: 单次生成最多等待 10 分钟。
    const signal = AbortSignal.any([AbortSignal.timeout(10 * 60_000), ...(this.signal ? [this.signal] : [])]);

    const imageUrls: string[] = [];
    for (const image of request.images ?? []) imageUrls.push(await uploadImage(this, apiKey, baseUrl, image, signal));

    let size = (request.size ?? "2K").toUpperCase();
    if (lowerName.includes("seedream-5-0-lite") && size === "1K") size = "2K";
    else if (lowerName.includes("seedream-5-0-pro")) {
      if (size === "4K") size = "2K";
      else if (size === "2K") size = "1.5K";
    }

    const response = await this.tool.fetch(`${baseUrl}/images/generations`, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: request.model,
        prompt: request.prompt,
        resolution: size,
        size: request.ratio,
        n: 1,
        ...(imageUrls.length ? { image_urls: imageUrls } : {}),
      }),
      signal,
    });
    if (!response.ok) throw new Error(`请求失败：HTTP ${response.status}`);
    const data = object(await response.json());
    const taskId = Array.isArray(data.data) ? object(data.data[0]).task_id : undefined;
    if (!taskId) throw new Error("未返回任务ID");

    const url = await pollTaskResult(this, baseUrl, apiKey, String(taskId), signal, (taskData) => {
      const result = object(taskData.result ?? {});
      const image = Array.isArray(result.images) ? object(result.images[0]) : undefined;
      const url = image && Array.isArray(image.url) ? image.url[0] : undefined;
      if (typeof url !== "string" || !url) throw new Error("未返回生成结果");
      return url;
    });
    return [{ mediaType: "image", type: "url", url }];
  },
  async generateVideo(request: VideoRequest): Promise<MediaAsset[]> {
    const apiKey = this.config.apiKey?.trim();
    if (!apiKey) throw new Error("请填写 API Key");
    const baseUrl = getBaseUrl(this.config.isOverseas);
    const lowerName = request.model.toLowerCase();
    // ACT: 单次生成最多等待 30 分钟。
    const signal = AbortSignal.any([AbortSignal.timeout(30 * 60_000), ...(this.signal ? [this.signal] : [])]);

    const imageUrls: string[] = [];
    for (const image of request.images ?? []) imageUrls.push(await uploadImage(this, apiKey, baseUrl, image, signal));
    const videoUrls = (request.videos ?? []).map(mediaUrl);
    const audioUrls = (request.audios ?? []).map(mediaUrl);
    const frames = [
      ...(request.firstFrame ? [{ url: await uploadImage(this, apiKey, baseUrl, request.firstFrame, signal), role: "first_frame" }] : []),
      ...(request.lastFrame ? [{ url: await uploadImage(this, apiKey, baseUrl, request.lastFrame, signal), role: "last_frame" }] : []),
    ];
    const mode =
      request.mode ?? (frames.length ? "startFrameOptional" : videoUrls.length || audioUrls.length ? [] : imageUrls.length ? "singleImage" : "text");
    const isFrames = mode === "startEndRequired" || mode === "endFrameOptional" || mode === "startFrameOptional";
    const frameImages = frames.length ? frames : imageUrls.map((url, index) => ({ url, role: index === 0 ? "first_frame" : "last_frame" }));

    const body: Record<string, unknown> = {
      model: request.model,
      prompt: request.prompt,
      duration: request.duration,
      resolution: request.resolution,
      size: request.ratio,
    };

    if (lowerName.includes("wan")) {
      if (isFrames && frameImages.length >= 2) {
        body.image_with_roles = frameImages.map(({ url, role }) => ({ role, url }));
      } else if (Array.isArray(mode)) {
        body.generation_type = "reference";
        if (imageUrls.length) body.image_urls = imageUrls;
        if (videoUrls.length) body.video_urls = videoUrls;
        if (audioUrls.length) body.audio_urls = audioUrls;
      }
    } else if (lowerName.includes("doubao") || lowerName.includes("seedance")) {
      if (typeof request.generateAudio === "boolean") body.generate_audio = request.generateAudio;
      if (Array.isArray(mode)) {
        if (imageUrls.length) {
          const reviewedUrls = await reviewSeedanceAssets(this, apiKey, baseUrl, imageUrls, signal);
          body.image_with_roles = reviewedUrls.map((url) => ({ role: "reference_image", url }));
        }
        if (videoUrls.length) body.video_urls = videoUrls;
        if (audioUrls.length) body.audio_urls = audioUrls;
      } else if (isFrames) {
        body.image_with_roles = frameImages.map(({ url, role }) => ({ role, url }));
      } else if (mode === "singleImage") {
        body.image_with_roles = imageUrls.map((url) => ({ role: "reference_image", url }));
      }
    } else if (lowerName.includes("minimax")) {
      if (Array.isArray(mode)) {
        if (imageUrls.length) body.image_with_roles = imageUrls.map((url) => ({ role: "reference_image", url }));
        if (videoUrls.length) body.video_urls = videoUrls;
        if (audioUrls.length) body.audio_urls = audioUrls;
      } else if (isFrames) {
        body.image_with_roles = frameImages.map(({ url, role }) => ({ role, url }));
      } else if (mode === "singleImage") {
        body.image_with_roles = imageUrls.map((url) => ({ role: "reference_image", url }));
      }
    }

    const response = await this.tool.fetch(`${baseUrl}/videos/generations`, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal,
    });
    if (!response.ok) throw new Error(`请求失败：HTTP ${response.status}`);
    const data = object(await response.json());
    const taskId = Array.isArray(data.data) ? object(data.data[0]).task_id : undefined;
    if (!taskId) throw new Error("未返回任务ID");

    const url = await pollTaskResult(this, baseUrl, apiKey, String(taskId), signal, (taskData) => {
      const result = object(taskData.result ?? {});
      const video = Array.isArray(result.videos) ? object(result.videos[0]) : undefined;
      const url = video && Array.isArray(video.url) ? video.url[0] : undefined;
      if (typeof url !== "string" || !url) throw new Error("未返回生成结果");
      return url;
    });
    return [{ mediaType: "video", type: "url", url }];
  },
  async updateVendor(): Promise<string> {
    const apiKey = this.config.apiKey?.trim();
    if (!apiKey) throw new Error("请填写 API Key");
    const baseUrl = getBaseUrl(this.config.isOverseas);
    const response = await this.tool.fetch(`${baseUrl}/vendor/downloadVendor`, {
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      signal: this.signal,
    });
    if (!response.ok) throw new Error(`请求失败：HTTP ${response.status}`);
    const { data } = object(await response.json());
    if (typeof data !== "string") throw new Error("未返回更新内容");
    return data;
  },
} satisfies ProviderDefinition<typeof rules>;
