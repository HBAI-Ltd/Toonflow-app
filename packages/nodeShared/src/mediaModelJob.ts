import { EventSourceParserStream } from "eventsource-parser/stream";

const endpoints = {
  image: "/api/localModels/processImage",
  video: "/api/localModels/processVideo",
  audio: "/api/localModels/processAudio",
};

export async function requestMediaModel(endpoint: string, input: object, signal?: AbortSignal) {
  const response = await fetch(endpoint, {
    method: "POST", headers: { "Content-Type": "application/json", "x-toonflow-workspace": "1", "Accept-Language": document.documentElement.lang },
    body: JSON.stringify(input), signal,
  });
  if (!response.ok) {
    const failure = await response.json().catch(() => undefined);
    throw new Error(failure?.message || "素材处理失败");
  }
  return response;
}

export async function runMediaModelJob(kind: keyof typeof endpoints, input: {
  directory: string; source: string; output: string; options: object;
}, signal: AbortSignal, reportProgress?: (completed: number, total: number) => void) {
  signal.throwIfAborted();
  const requestId = crypto.randomUUID();
  const transport = new AbortController();
  const request = (cancel: boolean) => requestMediaModel(endpoints[kind], { ...input, requestId, cancel }, cancel ? undefined : transport.signal);

  // 收到任务注册的回执后才允许取消，等服务端释放临时文件，再由节点清理结果目录。
  const response = await request(false);
  let cancellation: Promise<void> | undefined;
  const stop = () => {
    cancellation ??= request(true).then(() => {}, error => console.warn("取消素材处理失败", error))
      .finally(() => transport.abort(signal.reason));
  };
  signal.addEventListener("abort", stop, { once: true });
  if (signal.aborted) stop();
  try {
    if (!response.body || !response.headers.get("Content-Type")?.includes("text/event-stream")) throw new Error("未收到素材处理进度");
    const reader = response.body.pipeThrough(new TextDecoderStream()).pipeThrough(new EventSourceParserStream()).getReader();
    try {
      while (true) {
        const { value, done } = await reader.read();
        signal.throwIfAborted();
        if (done) throw new Error("素材处理连接已断开");
        const event = JSON.parse(value.data);
        if (value.event === "done") return;
        if (value.event === "error") throw new Error(event.message || "素材处理失败");
        if (value.event === "progress") reportProgress?.(event.completed, event.total);
      }
    } finally {
      await reader.cancel().catch(() => {});
      reader.releaseLock();
    }
  } finally {
    signal.removeEventListener("abort", stop);
    await cancellation;
  }
}
