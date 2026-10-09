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
    field: "baseUrl" as const,
    title: "请求地址",
    value: "https://metaso.cn/api/minimax",
    props: { placeholder: "https://metaso.cn/api/minimax" },
  },
] as const;

const version = "2.0.0";

function mediaUrl(input: MediaInput) {
  if (input.type === "url") return input.url;
  const data = input.type === "binary" ? Buffer.from(input.data).toString("base64") : input.data;
  return data.startsWith("data:") ? data : `data:${input.mimeType};base64,${data}`;
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

async function pollVideo(context: ProviderContext, baseUrl: string, apiKey: string, taskId: string, signal: AbortSignal): Promise<string> {
  while (true) {
    const response = await context.tool.fetch(`${baseUrl}/v2/query/video_generation/${taskId}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
      signal,
    });
    if (!response.ok) throw new Error(`查询任务失败：HTTP ${response.status}`);
    const data = await response.json() as { task?: { status?: string; content?: { url?: string } } };
    const status = data?.task?.status;
    if (status === "succeeded") {
      const url = data.task?.content?.url;
      if (!url) throw new Error("视频生成成功但未返回视频地址");
      return url;
    }
    if (status === "failed") throw new Error(context.tool.errorMessage?.(data) || "视频生成失败");
    await wait(signal, 5000);
  }
}

export default {
  id: "metaso",
  label: "秘塔版MiniMax H3",
  icon: "data:image/svg+xml;base64,PCEtLSBTb3VyY2U6IGh0dHBzOi8vbWV0YXNvLmNuLyAtLT4NCjxzdmcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB3aWR0aD0iNDkiIGhlaWdodD0iMzAiIGZpbGw9Im5vbmUiIHZpZXdCb3g9IjAgMCA0OSAzMCI+PHBhdGggZmlsbD0idXJsKCNwYWludDBfbGluZWFyXzE1NjVfMjYyNSkiIGQ9Ik0xNS44NDYgMTMuOTFhMS43NCAxLjc0IDAgMCAxIDMuMDA4IDBsOC4yMzMgMTQuMjAzYzEuMTUzIDEuOTkgMy44NjcgMi41MzQgNS43MjIuOTk1IDEuNDQ4LTEuMTk4IDEuNjUxLTMuMzQ3LjcyNC00Ljk3NUwyMC41OTUgMS44OTgiPjwvcGF0aD48cGF0aCBmaWxsPSIjMTc1Q0QzIiBkPSJtNDguMTIyIDI0LjMxNC03Ljk0LTEzLjczYy0xLjA0LTEuODEtMy4zNy0yLjQyLTUuMTc5LTEuMzhzLTIuNDIgMy4zNy0xLjM4IDUuMThsNy45NCAxMy43M2MxLjA0IDEuODA5IDMuMzcgMi40MiA1LjE3OSAxLjM3OXMyLjQyLTMuMzcgMS4zOC01LjE4TTM1LjExNiAxLjg5OWMtMS4wNC0xLjgxLTMuMzctMi40Mi01LjE4LTEuMzhzLTIuNDIgMy4zNy0xLjM4IDUuMTggMy4zNyAyLjQyIDUuMTggMS4zOGMxLjgxLTEuMDY0IDIuNDQzLTMuMzcgMS4zOC01LjE4TTE5LjIxNi41MmEzIDMgMCAwIDAtLjM2Mi0uMTgyIDMuNzUgMy43NSAwIDAgMC00LjYxNCAxLjI0NGwtLjAyMy4wMjNjLS4wMjMuMDQ1LS4wNDUuMDY4LS4wNjguMTEzcy0uMDY4LjExMy0uMDkuMTU4TDEuMTY2IDI0LjExYTQgNCAwIDAgMC0uNDk3IDEuNDAydi4wOTFhMi44IDIuOCAwIDAgMC0uMDY4LjU4OGMtLjAyMyAxLjA4Ni40MDcgMi4xNzEgMS4yODkgMi44OTUuNzI0LjYxIDEuNTYuODgyIDIuMzk4LjkwNWguMTM1YzEuMjkgMCAyLjU1Ni0uNjc5IDMuMjU3LTEuODc4bDguMzAxLTE0LjQwNyA0LjYzNy04LjAzQTMuNzggMy43OCAwIDAgMCAxOS4yMTYuNTIiPjwvcGF0aD48ZGVmcz48bGluZWFyR3JhZGllbnQgaWQ9InBhaW50MF9saW5lYXJfMTU2NV8yNjI1IiB4MT0iMTUuODQ1IiB4Mj0iMzQuMDk1IiB5MT0iMTUuOTQ1IiB5Mj0iMTUuOTQ1IiBncmFkaWVudFVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHN0b3Agb2Zmc2V0PSIwLjE0NCIgc3RvcC1jb2xvcj0iIzE5NDE4NSI+PC9zdG9wPjxzdG9wIG9mZnNldD0iMC4yMTgiIHN0b3AtY29sb3I9IiMxODQ5QTkiPjwvc3RvcD48c3RvcCBvZmZzZXQ9IjAuMzc1IiBzdG9wLWNvbG9yPSIjMTc1Q0QzIj48L3N0b3A+PHN0b3Agb2Zmc2V0PSIwLjU3OSIgc3RvcC1jb2xvcj0iIzE3NUNEMyI+PC9zdG9wPjxzdG9wIG9mZnNldD0iMSIgc3RvcC1jb2xvcj0iIzE3NUNEMyI+PC9zdG9wPjwvbGluZWFyR3JhZGllbnQ+PC9kZWZzPjwvc3ZnPg0K",
  version,
  readme: `秘塔科技提供高性价比的 MiniMax H3 视频生成服务：768P 仅 0.09 元/秒，2K 仅 0.15 元/秒。支持原生 2K、音画同步，API 兼容 OpenAI 协议，同时支持 ComfyUI、无限画布，无需自行部署 GPU。
 \n 👉 点击 [前往平台](https://metaso.cn/minimax-h3/?s=toon) 获取密钥`,
  rules,
  models: [
    {
      id: "MiniMax-H3",
      label: "MiniMax-H3",
      type: "video",
      mode: ["text", "startFrameOptional", ["imageReference:9", "videoReference:3", "audioReference:3"]],
      audio: "optional",
      durationResolutionMap: [{ duration: [4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15], resolution: ["768P", "2K"] }],
    },
  ] satisfies ProviderModel[],
  async generateVideo(request: VideoRequest): Promise<MediaAsset[]> {
    const apiKey = this.config.apiKey?.trim();
    if (!apiKey) throw new Error("请填写 API Key");
    const baseUrl = (this.config.baseUrl?.trim() || "https://metaso.cn/api/minimax").replace(/\/$/, "");

    const images = (request.images ?? []).map(mediaUrl);
    const videos = (request.videos ?? []).map(mediaUrl);
    const audios = (request.audios ?? []).map(mediaUrl);
    const frames = [
      ...(request.firstFrame ? [{ url: mediaUrl(request.firstFrame), role: "first_frame" }] : []),
      ...(request.lastFrame ? [{ url: mediaUrl(request.lastFrame), role: "last_frame" }] : []),
    ];
    const mode =
      request.mode ?? (frames.length ? "startFrameOptional" : videos.length || audios.length ? [] : images.length ? "singleImage" : "text");
    const isFrames = mode === "startEndRequired" || mode === "endFrameOptional" || mode === "startFrameOptional";

    const content: Record<string, unknown>[] = [{ type: "text", text: request.prompt }];
    if (Array.isArray(mode)) {
      images.forEach((url) => content.push({ role: "reference_image", type: "image_url", image_url: { url } }));
      videos.forEach((url) => content.push({ role: "reference_video", type: "video_url", video_url: { url } }));
      audios.forEach((url) => content.push({ role: "reference_audio", type: "audio_url", audio_url: { url } }));
    } else if (isFrames) {
      frames.forEach(({ url, role }) => content.push({ type: "image_url", image_url: { url }, role }));
    } else if (mode === "singleImage") {
      images.forEach((url) => content.push({ role: "reference_image", type: "image_url", image_url: { url } }));
    }

    // ACT: 单次生成最多等待 10 分钟。
    const signal = AbortSignal.any([AbortSignal.timeout(10 * 60_000), ...(this.signal ? [this.signal] : [])]);
    const submitResponse = await this.tool.fetch(`${baseUrl}/v2/video_generation`, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: request.model, duration: request.duration, resolution: request.resolution, ratio: request.ratio, content }),
      signal,
    });
    if (!submitResponse.ok) throw new Error(`提交任务失败：HTTP ${submitResponse.status}`);
    const submitData = await submitResponse.json() as { task_id?: string };
    const taskId = submitData?.task_id;
    if (!taskId) throw new Error("提交任务未返回任务 ID");

    const videoUrl = await pollVideo(this, baseUrl, apiKey, taskId, signal);
    return [{ mediaType: "video", type: "url", url: videoUrl }];
  },
} satisfies ProviderDefinition<typeof rules>;
