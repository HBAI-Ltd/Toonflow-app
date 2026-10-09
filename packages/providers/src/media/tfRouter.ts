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
const version = "2.0.1";

function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("TF-router 响应格式错误");
  return value as Record<string, unknown>;
}

async function fetchJson(context: ProviderContext, path: string, body?: unknown, signal = context.signal) {
  const apiKey =
    typeof context.config.apiKey === "string"
      ? context.config.apiKey
          .trim()
          .replace(/^Bearer\s+/i, "")
          .trim()
      : "";
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

function audioReference(input: MediaInput, mediaType: "image" | "audio") {
  if (input.mimeType && !input.mimeType.startsWith(`${mediaType}/`)) throw new Error(`参考媒体类型须为 ${mediaType}`);
  if (input.type === "url") return { [`${mediaType}_url`]: mediaUrl(input) };
  const match = /^data:([^;,]+);base64,([\s\S]+)$/.exec(mediaUrl(input));
  if (!match || !match[1].startsWith(`${mediaType}/`)) throw new Error(`参考媒体类型须为 ${mediaType}`);
  const data = match[2].replace(/\s/g, "");
  if (!data || !/^[a-zA-Z0-9+/]+={0,2}$/.test(data) || data.length % 4 === 1) throw new Error("参考媒体的 base64 内容无效");
  return { [`${mediaType}_data`]: data };
}

function mediaAsset(value: unknown, mediaType: MediaAsset["mediaType"], mimeType?: string): MediaAsset[] {
  if (typeof value !== "string" || !value.trim()) throw new Error("TF-router 未返回生成结果");
  const url = value.trim();
  if (/^https?:\/\//i.test(url)) return [{ mediaType, type: "url", url, ...(mimeType ? { mimeType } : {}) }];
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

async function generateTask(context: ProviderContext, mediaType: "image" | "video" | "audio", body: unknown, mimeType?: string) {
  // ACT: 单次生成最多等待 30 分钟；供应商开放任务恢复能力后再单独保存任务 ID。
  const signal = AbortSignal.any([AbortSignal.timeout(30 * 60_000), ...(context.signal ? [context.signal] : [])]);
  const path = mediaType === "audio" ? "tts" : mediaType;
  const name = { image: "Image", video: "Video", audio: "Audio" }[mediaType];
  const task = await fetchJson(context, `${path}/${mediaType === "audio" ? "create" : `generate${name}`}`, body, signal);
  if (typeof task.data !== "string" || !task.data.trim()) throw new Error("TF-router 未返回任务 ID");
  while (true) {
    const result = await fetchJson(context, `${path}/get${name}Status`, { taskICode: task.data }, signal);
    const data = result.data == null ? {} : object(result.data);
    const status = String(result.status ?? data.status ?? "").toLowerCase();
    if (status === "success" || status === "completed") return mediaAsset(data.data, mediaType, mimeType);
    if (["failed", "failure", "error", "rejected"].includes(status)) {
      throw new Error(context.tool.errorMessage?.(result) || (typeof data.failReason === "string" ? data.failReason : `${{ image: "图片", video: "视频", audio: "音频" }[mediaType]}生成失败`));
    }
    await wait(signal);
  }
}

export default {
  id: "tfRouter" as const,
  label: "TF-router",
  icon: "data:image/svg+xml;base64,PHN2ZyB2ZXJzaW9uPSIxLjEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgdmlld0JveD0iMCAwIDIwNDggMjA0OCIgd2lkdGg9IjEwMDAiIGhlaWdodD0iMTAwMCIgcHJlc2VydmVBc3BlY3RSYXRpbz0ibm9uZSIgZGlzcGxheT0iYmxvY2siPjxwYXRoIGZpbGw9IiMwMDAwMDAiIGQ9Ik0gOTQwLjIzNiA5MzguNTYyIEMgOTY3LjM4IDkzNy40MjIgOTk5LjIxMyA5MzcuNTk1IDEwMjYuNDYgOTM3Ljk5NCBDIDEwMTcuNDkgOTU1LjE3MSAxMDAzLjQ1IDk3Ny44MDMgOTkzLjQ3IDk5NC45ODQgQyA5NjYuNjUgMTA0MS4wOCA5MzkuMDQ0IDEwODYuNzEgOTEwLjY2NSAxMTMxLjg1IEMgOTAzLjI5NCAxMTMyLjgxIDg5My4yMyAxMTMyLjggODg1LjUyNiAxMTMzLjI2IEMgODY5LjYwOSAxMTM0LjM4IDg1My43MSAxMTM1LjcyIDgzNy44MzEgMTEzNy4yOCBDIDc4MC45NzIgMTE0My4yNSA3MjQuNzA5IDExNTMuOTQgNjY5LjYyMyAxMTY5LjI1IEMgNTkwLjA0NyAxMTkxLjM2IDUwNi40NjggMTIyNC4wOSA0NDUuMDQgMTI4MS41NyBDIDQzNC41MTEgMTI5MS40MyA0MjMuMDk5IDEzMDQuMTIgNDE2LjAxNCAxMzE2LjY2IEMgMzc3LjIzMiAxMjY0LjQxIDM3NC4wNzcgMTI0NC42NCAzNzMuOCAxMTgxLjkzIEMgMzY5LjU1OCAxMTkyLjQ2IDM2My45MTMgMTIwNi4zNyAzNjIuMjM1IDEyMTcuMzkgQyAzNTYuMzMgMTI1Ni4xNSAzNjQuNTI5IDEyODQuOTQgMzg3LjQyOSAxMzE2LjU0IEMgNDIyLjAzOSAxMzY0LjI5IDQ3Ny45NDIgMTM5OS4zNSA1MzAuNTM0IDE0MjQuMzYgQyA1MzguOTIyIDE0MjguMzQgNTYwLjIyOCAxNDM3Ljk1IDU2OS4wMjcgMTQzOC42NyBDIDYwOS45NjggMTQ0Mi4wNCA2NjEuMTk0IDE0MzMuNTEgNjk1LjM5OCAxNDA5LjYzIEMgNzA0Ljc4MiAxNDAzLjE4IDcxNy40MSAxMzg5LjE4IDcxOC4wODQgMTM3Ny40NyBDIDcyMC41MjMgMTMzNS4xNCA2NDMuMDU3IDEzMTcuMjkgNjEzLjcwNSAxMzE0LjcgQyA1NTcuNDU1IDEzMDkuNzIgNDk2Ljc2MyAxMzE3LjA0IDQ1Mi41NDQgMTM1My44MSBDIDQ0Ny4wMjYgMTM0OS40NiA0NDEuNTkzIDEzNDMuOSA0MzYuNTE5IDEzMzguOTYgQyA0NjUuNTcxIDEyOTAuNDkgNTMyLjgwNCAxMjUyLjY2IDU4NC42MDcgMTIzMS40MyBDIDY4MS41ODIgMTE5MS42OSA3ODcuNDc0IDExNzQuMzQgODkxLjM3NiAxMTY3LjUyIEMgODgwLjM1NiAxMTgyLjk3IDg3MC4wNzMgMTE5OS45OCA4NTkuNjYzIDEyMTYuMDIgQyA4NTAuNTMzIDEyMTcuMTIgODM2Ljc0MyAxMjE2Ljc1IDgyNy4wOTYgMTIxNy4xMyBDIDgwNy42NTUgMTIxNy45MiA3ODguMjk3IDEyMjAuMTEgNzY5LjE3MyAxMjIzLjY5IEMgNzUwLjUzOSAxMjI3LjMgNzE5LjcyNSAxMjM1LjI3IDcwNy42OTcgMTI1MS42IEMgNjk5LjgxOCAxMjYyLjMgNzEyLjcxNCAxMjczLjA2IDcyMS44MDcgMTI3Ny40IEMgNzUxLjMyNCAxMjkxLjQ5IDc5MC45MjYgMTI5MS42OCA4MjEuNTYyIDEyODEuNyBDIDgwNy40MzUgMTMwNi42MyA3ODIuNzM1IDEzMzAuNTIgNzc3LjA4NSAxMzU3LjM1IEMgNzc0LjkzOCAxMzY3LjU1IDc3OS40MjcgMTM3OS4xNiA3ODUuNjczIDEzODcuMjYgQyA4MTQuODUxIDE0MjUuMTIgODk3LjgzMSAxNDQzLjQzIDk0NSAxNDQ4LjQ3IEMgMTA0MC42MSAxNDU2LjQ4IDExNjAuNzEgMTQ1Ny42NyAxMjQyLjg3IDE0MDEuNTMgQyAxMjYyLjExIDEzODguMzggMTI3NS4yOCAxMzYyLjY1IDEyNTguOTcgMTM0MS45OSBDIDEyNjUuMzEgMTMzMy42NCAxMjcxLjU4IDEzMjUuMjQgMTI3Ny43OSAxMzE2Ljc4IEMgMTI4Ny40OSAxMzA0LjI2IDEyOTcuNjUgMTI5MS41IDEzMDYuNDcgMTI3OC4zOCBDIDEzMzQuNDUgMTI4MC43MyAxMzY4Ljg1IDEyODEuMTcgMTM5NC44MSAxMjY4LjkzIEMgMTQwNC41MiAxMjY0LjM1IDE0MjMuMSAxMjUxLjYzIDE0MTMuOTcgMTIzOC45MiBDIDE0MDAuNDkgMTIyMC4xMyAxMzc1LjQ1IDEyMTYuMSAxMzU0LjQzIDEyMTEuMDYgQyAxMzYxLjk3IDExOTguNSAxMzgwLjM5IDExNzkuNzEgMTM5MS4yNCAxMTYzLjYxIEMgMTQ4MC4zOSAxMTg5LjE3IDE2NDguMTMgMTI0Ni45IDE2NTMuNzggMTM2MS4zMyBDIDE2NTQuNjMgMTM3OC4zOCAxNjUzLjk0IDEzOTcuNzcgMTY1My44NyAxNDE0Ljk3IEwgMTY1My45MSAxNDk4Ljc1IEwgMTY1My45MSAxNTgxLjk2IEMgMTY1My45MSAxNTk5LjU3IDE2NTUuNTUgMTYzNS44NSAxNjUwLjU0IDE2NTEuMDUgQyAxNjA3LjYzIDE3ODEuMjEgMTM4MC41OCAxODM1LjUyIDEyNzAuNTQgMTg1NC4xOCBDIDEyMDcuODQgMTg2NC4yOCAxMTQ0LjYxIDE4NzAuOCAxMDgxLjE3IDE4NzMuNjkgQyAxMDYzLjQ1IDE4NzQuNTEgMTAzOS42OSAxODc0LjMzIDEwMjEuNSAxODc0LjA5IEMgOTk5Ljk4NiAxODczLjgyIDk3My4wMDcgMTg3NS4wNCA5NTEuOTE1IDE4NzMuNzMgQyA3NjUuMDAyIDE4NjIuMDkgNTM1LjgxOCAxODI5LjAzIDM4OS41NTggMTcwMi43IEMgMzU1LjkwNCAxNjczLjYzIDMyMS41OTkgMTYyNi45OSAzMjEuNzkyIDE1ODIuNDggQyAzMjEuODgyIDE1NjEuODUgMzIxLjQ4NSAxNTM5Ljg1IDMyMS41MDEgMTUxOS4wNiBMIDMyMS42ODggMTM5NS4wNSBDIDMyMS42MDcgMTM2NS45NiAzMjEuNDA2IDEzMzYuNjIgMzIxLjYxMSAxMzA3LjQ2IEMgMzIyLjY1MSAxMjczLjY1IDMxNi43NjcgMTIzMC4wMSAzMjUuMzYgMTE5Ny41MyBDIDM0OS40NTYgMTEwNi40NCA0NTIuNjkzIDEwNDQuNTcgNTM0LjE2MyAxMDEyLjU3IEMgNjYyLjExNiA5NjIuMzE4IDgwMy45NTggOTQzLjg0MyA5NDAuMjM2IDkzOC41NjIgeiBNIDE0NzMuODIgMTQ0Mi45OSBDIDE0ODMuODggMTQ0Mi4xNiAxNDk5LjE2IDE0NDEuNDkgMTUwOC42OSAxNDM4LjY0IEMgMTUzOC4wMSAxNDI5LjYxIDE1NjkuMyAxNDEzLjczIDE1OTAuMDcgMTM5MC43MyBDIDE2MDcuNDUgMTM3MS40OCAxNjAzLjE3IDEzNTkuMiAxNTg0LjA0IDEzNDQuODQgQyAxNTQ1LjYyIDEzMTYuMDEgMTQ5Ni45OSAxMzExLjc1IDE0NTAuODkgMTMxMi40NCBDIDE0MTIuMjYgMTMxMy44NCAxMzYzLjU5IDEzMjIuODcgMTMzNS4xIDEzNTEuMjIgQyAxMzE2LjYzIDEzNjkuNiAxMzIwLjgxIDEzOTAuNzcgMTMzOS4yOCAxNDA3LjAxIEMgMTM3MS45NyAxNDM1Ljc2IDE0MzEuMzIgMTQ0Ni4xNyAxNDczLjgyIDE0NDIuOTkgeiBNIDY0OC42NDYgMTUxOS40MSBDIDY0Ni44NjIgMTUzMC40MiA2NDguMjgzIDE1NjEuMTEgNjQ4LjUxNyAxNTcyIEMgNjQ4LjczMyAxNTgyLjA0IDcxNS42MDYgMTU5Ny42NCA3MjMuNjQyIDE1OTUuMjYgQyA3MjUuMDY0IDE1ODcuMjMgNzI1LjQ3OSAxNTQ5LjQ5IDcyNC45NDkgMTU0MC4zNCBDIDcxOS4wMTMgMTUzNy41MyA2NTUuMDE5IDE1MjAuMDEgNjQ4LjY0NiAxNTE5LjQxIHogTSAxMzUyLjE1IDE3MjguMzIgQyAxMzUzLjA2IDE3MDguNTkgMTM1My4xMiAxNTQzLjA3IDEzNTAuOTYgMTUzOS4zMyBMIDEzNDcuOTUgMTUzOS4xNyBDIDEzMTAuNzIgMTU0Ny45OCAxMjg5LjIyIDE1NTEuNzUgMTI1Mi4xIDE1NTcuNjggQyAxMjUxLjI2IDE2MjkuMDYgMTI0My42OCAxNjE4Ljg2IDEzMTYuNzMgMTYwMi45OCBDIDEzMTUuMjEgMTYxNi42MSAxMzE1LjkxIDE2MzkuODYgMTMxNS45MSAxNjU0LjQgQyAxMzE1LjY4IDE2ODcuNjcgMTMxNS45MyAxNzIwLjk0IDEzMTYuNjcgMTc1NC4yIEMgMTMxNi44NSAxNzY1LjIxIDEzMTUuNjUgMTc5My4yNyAxMzE2Ljg3IDE4MDIuNzEgQyAxMzIxLjE3IDE4MDUuNDMgMTMyNS4xOCAxODAzLjEgMTMyOS43NCAxODAxLjQ0IEMgMTM0NS41NCAxNzk3LjMgMTQwOC41NCAxNzgyLjU0IDE0MTYuNjggMTc3My4yMyBDIDE0MTguOCAxNzY3LjU3IDE0MTguODIgMTcxNS43MSAxNDE2IDE3MTEuMzkgQyAxNDA4Ljk2IDE3MTAuNjcgMTM2Mi40NyAxNzI1LjUzIDEzNTIuMTUgMTcyOC4zMiB6IE0gNjA1LjUyMyAxMDk3LjY4IEMgNjEyLjQ3NiAxMDk3LjQ2IDY1NS4yMjMgMTA4NC41NyA2NjEuNzA1IDEwNzkuODkgQyA2NjUuOTA4IDEwNzIuODEgNjY0LjEgMTAyOS4wOSA2NjIuNzIzIDEwMTguNjggQyA2NjIuNDQxIDEwMTYuNTQgNjYxLjYxNiAxMDE2LjI5IDY2MC4yNDQgMTAxNS4yNCBDIDY0NC43NzkgMTAxNy45NCA2MTMuODUxIDEwMjYuMDMgNjAwLjgwMiAxMDMzLjk2IEMgNjAxLjIyIDEwNDIuNTYgNTk5LjkxNSAxMDkzLjgzIDYwMy43OTQgMTA5Ni42NyBDIDYwNC4zMzMgMTA5Ny4wNiA2MDQuOTQ3IDEwOTcuMzQgNjA1LjUyMyAxMDk3LjY4IHogTSAxMzk4LjMxIDE1MjYuNzUgQyAxMzk4LjkyIDE1MzYuOTcgMTM5Ny41OSAxNTc1Ljk3IDE0MDAuMzUgMTU4MS42NyBMIDE0MDIuNzggMTU4My41NCBDIDE0MTQuNjUgMTU4MC4zNSAxNDI1LjQ5IDE1NzcuMjMgMTQzOC4zNiAxNTcyLjMzIEMgMTQ1OC45MSAxNTY0LjQ5IDE0NzQuNzcgMTU2NS4yMyAxNDcwLjE1IDE1MzcuMDggQyAxNDY5IDE1MzAuMDcgMTQ3MC41NSAxNTA5LjQ4IDE0NjguNTEgMTUwNC43MiBDIDE0NjcuOSAxNTA0LjUzIDE0NjYuNjMgMTUwNC4wNyAxNDY2LjA2IDE1MDQuMDIgQyAxNDQ4LjI1IDE1MTAuNjQgMTQzMC40OCAxNTE3LjA3IDE0MTIuMjEgMTUyMi4yOSBDIDE0MDcuNTMgMTUyMy42MyAxNDAyLjg1IDE1MjQuOTggMTM5OC4zMSAxNTI2Ljc1IHogTSA1MTMuMzA5IDE0NjYuNSBDIDUxMS41MzMgMTQ5MS4yOCA1MTIuOTYzIDE1MzMuODUgNTEzLjAxIDE1NTkuNzggTCA1MTIuOTgzIDE3MzQuNTQgQyA1MjIuMTA3IDE3NDEuMTQgNTk2LjI2OSAxNzc1LjM0IDYwNC4xNiAxNzcxLjE4IEMgNjA2LjIxMSAxNzY0LjExIDYwNS4zNTQgMTcyOC4zNiA2MDUuMzAxIDE3MTguNzUgQyA2MDUuNDg3IDE3MTUuNjMgNjA2LjE5OSAxNzA5LjM0IDYwNC4yMzIgMTcwNy43MyBDIDU5NS4wNTMgMTcwMC4yNSA1NTYuMDQ3IDE2ODUuOCA1NDUuOTc0IDE2ODIuNyBDIDU0NS40MiAxNjM2Ljg1IDU0Ny40OTkgMTU4Mi43OSA1NDUuMDg4IDE1MzcuODYgQyA1NTcuMTY0IDE1NDMuMjcgNTY5Ljc0MiAxNTQ5LjY5IDU4Mi40MjMgMTU1Mi44MyBDIDU4Mi4zMjkgMTU0Mi4yNSA1ODMuODk5IDE1MDUuMDEgNTgwLjU3NSAxNDk3Ljk1IEMgNTc1Ljc2NCAxNDkzLjkxIDUxOS44NTYgMTQ2OC44MiA1MTMuMzA5IDE0NjYuNSB6IE0gMTQ5Ny4xMiAxNjc5LjkgQyAxNDk3LjE4IDE2OTAuNDkgMTQ5Ny44IDE3MDAuOCAxNDk3LjgxIDE3MTEuNDUgQyAxNDk3LjgyIDE3MjAuMTMgMTQ5Ni4zNyAxNzM0LjY3IDE0OTcuMzYgMTc0Mi43IEMgMTQ5OS44NiAxNzQ0Ljc3IDE0OTguMzUgMTc0NC4xMiAxNTAyLjM2IDE3NDMuNzkgQyAxNTE5Ljg5IDE3MzQuMyAxNTQ3LjI1IDE3MjIuNDcgMTU1OC43MSAxNzA3LjUgQyAxNTU4LjU4IDE2OTYuOTIgMTU1OS42NCAxNjU2LjA5IDE1NTYuODcgMTY0OS42NyBDIDE1NTQuOTggMTY0OC41NyAxNTU1LjEyIDE2NDguNjIgMTU1Mi45MyAxNjQ4LjcyIEMgMTU0MS43MiAxNjU1LjYxIDE1MzAuMjkgMTY2Mi4xNSAxNTE4LjY2IDE2NjguMzEgQyAxNTEzLjAyIDE2NzEuMzMgMTUwMi4wOCAxNjc2LjYzIDE0OTcuMTIgMTY3OS45IHogTSA3OTQuMjk4IDE1NTIuMjQgQyA3OTMuMTA5IDE1NTkuMzcgNzkyLjAxNCAxNjAzLjMyIDc5NS43OSAxNjA4Ljk5IEMgODA2IDE2MTYuMjkgODU5LjU1OSAxNjIyLjE0IDg3MC43NTIgMTYyMS4yNCBDIDg3My4zOTkgMTYxNy41OCA4NzQuNjQgMTYxMy4yIDg3NC4zMTUgMTYwOC43NyBDIDg3My42MTMgMTU5OS4xOSA4NzYuNDE4IDE1NzIuMTkgODcyLjc2NCAxNTY0Ljc5IEMgODY0LjQ5IDE1NjAuMzQgODEwLjc5NiAxNTU2LjczIDc5NC4yOTggMTU1Mi4yNCB6IE0gNzQ5LjAyOSAxMDY0Ljk0IEMgNzU5LjA0MiAxMDYzLjc0IDc5Ni4yOTcgMTA1OC45NSA4MDMuNTAyIDEwNTQuNjYgQyA4MDUuODM0IDEwNDYuMDcgODA4LjIxMyA5OTQuOTQ0IDgwMS41MjggOTkwLjI5NSBDIDc5OS41MjUgOTkwLjIxNSA3OTguNDkyIDk4OS45NTkgNzk2LjY0MyA5OTAuNDE2IEMgNzgxLjY2OSA5OTIuMTMzIDc1Mi41MDkgOTk0LjExNCA3MzkuMzk5IDEwMDEuNzMgQyA3MzYuMTg3IDEwMDMuNTkgNzM4Ljg0MiAxMDMzLjIgNzM4LjQ0NiAxMDM4LjE4IEMgNzM4LjcyOCAxMDQ3LjQzIDczNC4xOCAxMDU4LjY5IDc0Mi40MjEgMTA2NC43MyBDIDc0NC43MTYgMTA2NC44NyA3NDYuNzE3IDEwNjUuMDMgNzQ5LjAyOSAxMDY0Ljk0IHogTSA0MDIuMDk3IDE2NTguMDcgQyA0MTIuMjY3IDE2NzAuMTYgNDQwLjkwNCAxNjk0Ljg0IDQ1NS4wOTIgMTcwMC4wOSBDIDQ1Ny4zMDQgMTY4Ny43MiA0NTUuMzggMTY1MC43NiA0NTYuMTg2IDE2MzUuNTEgQyA0NTEuNjQxIDE2MzAuODUgNDA3Ljg0NyAxNTk4LjQyIDQwMy41MzggMTU5Ny40MiBDIDQwMS4wMzMgMTYwMy4wMSA0MDEuNzYxIDE2NDkuNDMgNDAyLjA5NyAxNjU4LjA3IHogTSA0NTguMDg4IDE0MzYuMzQgQyA0NDMuODAzIDE0MjYuMjMgNDI5LjQzIDE0MTYuNDQgNDE1LjgwNCAxNDA1LjQ1IEMgNDEyLjg4NyAxNDAzLjEgNDA0LjQ4IDEzOTUuNTIgNDAxLjY1OSAxMzk0LjM2IEMgMzk4LjkwNCAxNDAwLjQ1IDQwMC4yNTQgMTQzNy42MSA0MDAuMDg4IDE0NDcuNiBDIDQxMC41NTYgMTQ2MC40NSA0NDAuNjUgMTQ4Ny4zOCA0NTYuMTM0IDE0OTEuMzYgQyA0NTguMzc0IDE0ODIuNTYgNDU2LjY3NSAxNDQ5LjU5IDQ1OC4wODggMTQzNi4zNCB6IE0gMTU4OS40OCAxNDQzLjYxIEMgMTU3OS40IDE0NDkuODUgMTU3MC41NyAxNDU2LjI5IDE1NjAuMDEgMTQ2Mi4zIEMgMTU1MC41IDE0NjcuNzMgMTUzOC45NCAxNDczLjI4IDE1MjkuOTQgMTQ3OC45OSBDIDE1MzAuNzQgMTQ4OS4zNyAxNTI5Ljg2IDE1MzAuMTcgMTUzMi41MiAxNTM0LjAzIEMgMTU0NC4yNSAxNTI4LjU5IDE1ODUuMzUgMTUwNi4zNiAxNTkwLjU0IDE0OTMuNjQgQyAxNTkyLjY2IDE0ODguNDQgMTU5Mi45OCAxNDUxLjQyIDE1OTEuODkgMTQ0NS41NSBDIDE1OTAuNjQgMTQ0NC4yNCAxNTkxLjAxIDE0NDQuMjkgMTU4OS40OCAxNDQzLjYxIHogTSA0ODIuNzI3IDEwODMuNCBDIDQ4My44OTIgMTA5OC45MiA0ODQuMjk5IDExMTMuNyA0ODMuMzQxIDExMjkuMjUgQyA0ODMuMDM2IDExMzQuMiA0ODEuNTk5IDExNDQuNSA0ODUuMDEgMTE0Ny44NiBMIDQ4OC40MDEgMTE0OC4yMyBDIDQ5OS43MDQgMTE0Mi4wMyA1MjcuNzA0IDExMjguMDQgNTM2LjE4OSAxMTIxLjQ0IEMgNTM1Ljc4NSAxMTExLjk0IDUzNi41MjQgMTA2My41MSA1MzQuNDE5IDEwNTguMzUgQyA1MzIuMDExIDEwNTcuNiA1MzIuMTU0IDEwNTcuNiA1MjkuNjM4IDEwNTcuNzIgQyA1MTUuMDg2IDEwNjQuNTggNDk1LjAxMSAxMDczLjQyIDQ4Mi43MjcgMTA4My40IHogTSAxMDI2LjgyIDE1NzMuMjkgQyAxMDEwLjYzIDE1NzEuNzYgOTkzLjAxMyAxNTcxLjczIDk3Ni42NzUgMTU3MS4yNCBDIDk2OS45NDUgMTU3MS4wMyA5NTMuNTMxIDE1NzAuMzEgOTQ3LjQ1MyAxNTcwLjk5IEMgOTQ1LjQ5NiAxNTc5LjM1IDk0NC4zOTggMTYxOS4wNiA5NDcuNzkyIDE2MjQuOTcgQyA5NTIuMDYyIDE2MzIuNDEgMTAxNS42MiAxNjMwLjQ2IDEwMjUuMTUgMTYzMC4zOSBDIDEwMjguNSAxNjIzLjUzIDEwMjcuMjEgMTU4Mi43OCAxMDI2LjgyIDE1NzMuMjkgeiBNIDExNzMuNjQgMTU2Ni40MyBDIDExNjMuOTQgMTU2Ny4wOSAxMTA3LjUgMTU2OS45MSAxMTAyLjY1IDE1NzIuNzIgQyAxMDk5LjgyIDE1ODUuOTIgMTEwMS4xNiAxNjEyLjk2IDExMDIuNjIgMTYyNi44MiBDIDExMDIuODIgMTYyOC42NSAxMTA5Ljc5IDE2MjguNiAxMTExLjQ5IDE2MjguNiBDIDExMjMuNDkgMTYyOC40MSAxMTcwLjQ2IDE2MjYuOSAxMTc4LjYxIDE2MjIuMzQgQyAxMTgyLjQ3IDE2MTMuMzEgMTE4Mi4yNCAxNTc3LjY0IDExODAuNzEgMTU2Ny42MSBMIDExNzkuNTEgMTU2Ni4zMSBDIDExNzYuNjMgMTU2Ni4xOSAxMTc2LjQ3IDE1NjYuMDYgMTE3My42NCAxNTY2LjQzIHogTSA5NDUuODAyIDk3OC40MzIgQyA5MzIuMjEzIDk3OS4xMDYgODk0LjY5OSA5NzkuNTg5IDg4NC44ODYgOTg0LjIxOSBDIDg4MS44NDkgOTg3LjkwMiA4ODMuNTI4IDk5OS42MzggODgzLjg5NiAxMDA0LjczIEMgODg0LjY1MyAxMDE1LjE4IDg4MS4xODIgMTAzNy40MiA4ODUuMzE1IDEwNDYuMjcgQyA4ODguMzc4IDEwNDguNTggODg2LjY3OCAxMDQ3LjggODkwLjc1IDEwNDguMzUgQyA5MDAuNDI4IDEwNDguMTIgOTQ1LjI1NyAxMDQ2Ljg3IDk1MC45MjEgMTA0My4xMiBDIDk1Ny4yNDYgMTAzMS4wNSA5NTQuNDI1IDk5Ni45NTEgOTUzLjQ3IDk4Mi43MTMgQyA5NTMuMjMxIDk3OS4xMzggOTQ4LjY1NSA5NzguNzQ3IDk0NS44MDIgOTc4LjQzMiB6IE0gNjg4LjYzIDE3MjguNDIgQyA2ODYuMjg0IDE3MzQuMjkgNjg1LjYxNSAxNzg4LjIxIDY4OC4wNDMgMTc5NC4wOCBDIDY5Ni40MjMgMTgwMC43OCA3NDUuNTg1IDE4MDkuMjEgNzU4LjYyNyAxODExLjY4IEMgNzU5LjI1OCAxODEwLjc3IDc1OS44ODkgMTgwOS44NyA3NjAuNTIgMTgwOC45NiBDIDc2MS4yNjEgMTc4OS43NSA3NjEuMjE5IDE3NjguNTYgNzYwLjc1OSAxNzQ5LjM0IEMgNzYwLjY4NyAxNzQ2LjM0IDc1OC40OTcgMTc0NC44NSA3NTcuMjY5IDE3NDQuMSBDIDc1MC43OTEgMTc0MC4xNiA2OTIuNzU5IDE3MjguMzYgNjg4LjYzIDE3MjguNDIgeiBNIDEyMzUgMTc1MC40OCBDIDEyMjMuNDIgMTc1MS45MSAxMTc0LjQ0IDE3NTUuODcgMTE2Ny45NiAxNzYwLjY2IEMgMTE2Ni4wMyAxNzY1Ljg5IDExNjYuODkgMTgxOC43NiAxMTY5LjA2IDE4MjQuMzUgQyAxMTcxLjE1IDE4MjYuMjUgMTE3MS4yIDE4MjUuOTggMTE3NC4wOSAxODI2LjMxIEMgMTE4My41NyAxODI1LjA2IDEyNDAuNDcgMTgyMS4xMyAxMjQyLjQyIDE4MTMuMzkgQyAxMjQzLjgxIDE4MDcuODcgMTI0NS41IDE3NTYuNDQgMTI0MCAxNzUxLjI2IEMgMTIzNi45IDE3NTAuMjYgMTIzNy45MyAxNzUwLjE1IDEyMzUgMTc1MC40OCB6IE0gMTAwNy45MyAxNzY2LjIgQyAxMDA1LjkgMTc2OC4wMyAxMDAzLjkyIDE3NjkuMjYgMTAwNC4wMiAxNzcyLjUzIEMgMTAwNC40MyAxNzg1LjM5IDEwMDIuMjMgMTgyMi4xNCAxMDA1LjkgMTgzMi40NCBDIDEwMTMuOCAxODM1LjYgMTA3MC41MyAxODMzLjI2IDEwNzkuNyAxODMxLjkgQyAxMDgyLjU0IDE4MjcuNjIgMTA4Mi41NCAxNzcyLjA3IDEwNzkuNiAxNzY3LjQ5IEMgMTA3MS45NyAxNzY0Ljg3IDEwMTguODUgMTc2NS42MSAxMDA3LjkzIDE3NjYuMiB6IE0gODQ1Ljc5MSAxNzU2LjkgQyA4NDIuMjMyIDE3NjMgODQzLjk5NyAxNzgyLjA2IDg0NC4yMSAxNzg4LjE4IEMgODQ0LjQ3MiAxNzk1Ljc0IDg0MS4xMzcgMTgyMS4yMSA4NDguMTIyIDE4MjMuMTUgQyA4NjMuMDI2IDE4MjcuMyA5MDQuNTk2IDE4MzAuODIgOTE5LjE2NyAxODMwLjExIEMgOTIxLjg0MSAxODI1LjAxIDkyMi42NDkgMTc2NC44IDkxNy40NTQgMTc2My45MyBDIDg5Ny4yMjkgMTc2MC41NCA4NjUuOTk2IDE3NTYuNTcgODQ1Ljc5MSAxNzU2LjkgeiIgZGF0YS1jLWZpbGw9ImFiNDhmZSIgZmlsbC1vcGFjaXR5PSIxIi8+PHBhdGggZmlsbD0iIzAwMDAwMCIgZD0iTTE2NTcuOCAyNTkuNzhDMTY2NS41NiAyNjMuMjg1IDE2ODAuOTkgMjczLjc0OSAxNjg4LjY1IDI3OC42NzkgMTY3OC44OCAyOTUuMjc1IDE2NjYuOTUgMzEwLjk0IDE2NTYuNDcgMzI3LjE0OSAxNTk3Ljc4IDQxNy45NDggMTUzNS4yNCA1MDYuODc0IDE0NzcuMTUgNTk4LjAyNiAxNDYxLjE0IDYyMy4yNDMgMTQ0NC45NSA2NDguMzQyIDE0MjguNTcgNjczLjMyMSAxNDE3LjY5IDY5MC4wNjUgMTQwNi4xIDcwOC42NDkgMTM5NC4xMiA3MjQuNDA5IDEzNzAuMTMgNzI1LjcxIDEzNTkuNDkgNzIzLjUyNiAxMzM2Ljc0IDczNS43ODUgMTMwNS44NyA3NTIuNDIzIDEyOTYuNjEgNzk2LjE5OSAxMzE2LjAyIDgyNS4yNjIgMTMyNi4wNSA4NDAuMjg4IDEzNDEuNjEgODUwLjc0OCAxMzU5LjMxIDg1NC4zNzEgMTM3Ny41NSA4NTguMTA5IDEzOTYuNTMgODU0LjE3NyAxNDExLjc4IDg0My40OTYgMTQzOS42OSA4MjQuMzAzIDE0NDguMzYgNzg4LjM4MyAxNDMzLjA5IDc1OC4wOTYgMTQzMC4zNiA3NTIuNjc2IDE0MjYuMTEgNzQ2Ljg2NCAxNDIyLjY0IDc0MS44MjQgMTQyNi4wMiA3MzQuODQzIDE0MzUuNTYgNzIwLjgyNSAxNDQwLjEgNzEzLjc4MiAxNDUxLjU4IDY5Ni4zMTUgMTQ2Mi44IDY3OC42NzkgMTQ3My43NiA2NjAuODhMMTYyNC4yMSA0MTkuOTY4IDE2NTkuMDMgMzY0LjYyMkMxNjc1LjU4IDMzOC44NDEgMTY5MSAzMTUuNjQ0IDE3MDQuNTIgMjg4LjE1MSAxNzEwLjc1IDI5MC4yOTkgMTczMS45MSAzMDMuOTkgMTczOC45OSAzMDguMzA0IDE3MzMuNzEgMzIyLjIzOCAxNzMwLjQ5IDMzNS4wNjQgMTcyNi4yOCAzNDkuMzMxIDE3MTkuMTUgMzcyLjk3MSAxNzEyLjMzIDM5Ni43MDQgMTcwNS44MyA0MjAuNTIzIDE2NjUuOTYgNTYzLjA4NyAxNjMyLjY1IDcwNy41NzMgMTYxOC44OSA4NTUuMjQ4IDE2MTQuNzEgOTAwLjAxMyAxNjIyLjAzIDg5Mi4yMzUgMTU4OC4yMiA5MjUuMjExIDE1NjYuOTYgOTQ2LjQwMyAxNTM5Ljk4IDk2OS4wNzEgMTUxNy43NiA5OTAuMDA4IDE0NzUuNTkgMTAyOS43NSAxNDMzLjg0IDEwNjkuNjMgMTM5NCAxMTExLjc2IDEzNTkuNjQgMTE0OC4xIDEzMzAuNDMgMTE4OC40IDEzMDAuOTMgMTIyOC42NSAxMjc3LjA0IDEyNjEuMDQgMTI1My4zOCAxMjkzLjU5IDEyMjkuOTUgMTMyNi4zMiAxMjIwLjcgMTMyMC43OSAxMjA5LjQyIDEzMTIuODYgMTE5OS45OSAxMzA2Ljg4TDExMjguNjEgMTI2Mi4zNEMxMDY3LjE3IDEyMjQuNjUgMTAwMi43OSAxMTg2Ljk1IDk0Mi4wOTMgMTE0OC42NyA5OTAuODg0IDEwNjUuMDMgMTA0Ny44MiA5ODQuOTUgMTA4My43OSA4OTQuNTMxIDEwODkuMjIgODgwLjg4OCAxMDk0LjU2IDg2Ny4yNjYgMTA5OS43NiA4NTMuNTMzIDExMTUuNDIgODEyLjQ5NCAxMTMwLjI1IDc3MS4xNDUgMTE0NC4yNSA3MjkuNTEgMTE1Mi42NSA3MDUuMDQxIDExNjMuNTggNjY0LjM1IDExNzUuMjggNjQxLjk3NyAxMTc4LjA2IDYzNi42NTIgMTIxMy4wMiA2MTQuNTc5IDEyMjAuODggNjA5LjIxOEwxMjgxLjA1IDU2Ny41ODZDMTMwNy43NiA1NDguNDQ3IDEzMzQuMiA1MjguOTM2IDEzNjAuMzcgNTA5LjA2MSAxNDMzLjExIDQ1NC4xMDkgMTUwMy42NyAzOTYuMzI3IDE1NzEuODggMzM1Ljg0OCAxNTk4LjkyIDMxMi4xOTYgMTYzMi4yNyAyODQuNTIgMTY1Ny44IDI1OS43OHpNOTIxLjAzNiAxMTgzLjY1Qzk1MC4zNSAxMjAyLjA5IDEyMDUuMTggMTM1Ny4wOCAxMjA4Ljg5IDEzNjUuMjMgMTIwNC45MiAxMzc3LjQ4IDExODMuNDUgMTM5NC42IDExNzEuNDkgMTM5OS4yOCAxMTQ4LjU4IDE0MDguMjUgMTEyMC4zNCAxNDEzLjk1IDEwOTYuMDUgMTQxNy4zMyAxMDI1LjIyIDE0MzAuMzEgOTIzLjExOCAxNDIyLjQ0IDg1NS40MzUgMTM5NC45NSA4NDMuNjYxIDEzOTAuMTcgODA4LjIxIDEzNzIuMjUgODE2LjM1OSAxMzU1LjA5IDgyMS44MzYgMTM0My41NiA4MzEuNTAzIDEzMjkuNDcgODM4LjQ3IDEzMTguMjFMODkwLjE2NCAxMjM1LjExQzg5Ny42MTEgMTIyMy4yOCA5MTUuMjc3IDExOTYuNTEgOTIwLjQ1MyAxMTg0Ljk3TDkyMS4wMzYgMTE4My42NXpNMTc1NC42NyAxNzMuOTY3QzE3NjUuOSAxNzUuOTYxIDE3NjguNDUgMTc2LjgyOSAxNzc0LjYyIDE4Ni43MzMgMTc3My42MSAyMDcgMTc1My42NyAyNjIuMzI3IDE3NDYuMDIgMjgzLjYyIDE3MzYuNzEgMjc4LjcwNSAxNzI0LjE1IDI3MS40OTcgMTcxNS42NCAyNjUuNDk2IDE3MDUuNDcgMjYwLjUyNSAxNjg3LjE3IDI0OC43MzEgMTY3Ny4wNyAyNDIuNTA3IDE2ODYuODEgMjI5LjYyNCAxNzQwLjc3IDE3OC45NjYgMTc1NC42NyAxNzMuOTY3eiIgZGF0YS1jLWZpbGw9ImFiNDhmZSIgZmlsbC1vcGFjaXR5PSIxIi8+PC9zdmc+",
  version,
  apiUrl,
  modelsUrl: "https://api.toonflow.net/v1/models?type=video",
  protocol: "openai-completions",
  readme: "## Toonflow 官方中转平台\n\n提供文本、图像、视频、音频等多模态模型服务。\n\n[前往中转平台](https://api.toonflow.net/)",
  rules,
  models: [
    { id: "seed-audio-1.0", label: "Seed Audio 1.0", type: "audio" },
    {
      id: "Seedance 2.5",
      label: "Seedance-2.5",
      type: "video",
      mode: ["text", "startFrameOptional", ["imageReference:30", "videoReference:10", "audioReference:10"]],
      audio: "optional",
      durationResolutionMap: [
        {
          duration: [4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30],
          resolution: ["480p", "720p", "1080p"],
        },
      ],
    },
    {
      id: "Seedance 2.0",
      label: "Seedance-2.0",
      type: "video",
      mode: ["text", "startFrameOptional", ["imageReference:9", "videoReference:3", "audioReference:3"]],
      audio: "optional",
      durationResolutionMap: [{ duration: [4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15], resolution: ["480p", "720p"] }],
    },
    {
      id: "Seedance 2.0 fast",
      label: "Seedance 2.0 fast",
      type: "video",
      mode: ["text", "startFrameOptional", ["imageReference:9", "videoReference:3", "audioReference:3"]],
      audio: "optional",
      durationResolutionMap: [{ duration: [4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15], resolution: ["480p", "720p"] }],
    },
    {
      id: "Seedance 2.0 mini",
      label: "Seedance 2.0 mini",
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
      durationResolutionMap: [
        {
          duration: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30],
          resolution: ["480p", "720p", "1080p"],
        },
      ],
    },
    {
      id: "MiniMax-H3",
      label: "MiniMax-H3",
      type: "video",
      mode: ["text", "startFrameOptional", ["imageReference:9", "audioReference:3"]],
      durationResolutionMap: [{ duration: [4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15], resolution: ["480p", "768p"] }],
      audio: true,
    },
    {
      id: "doubao-seedream-5.0-Pro",
      label: "Doubao Seedream 5.0 Pro",
      type: "image",
      mode: ["text", "singleImage", "multiReference"],
      imageSizes: ["1K", "1.5K", "2K"],
      imageRatios: ["16:9", "9:16"],
    },
    {
      id: "doubao-seedream-5.0-Lite",
      label: "Doubao Seedream 5.0 Lite",
      type: "image",
      mode: ["text", "singleImage", "multiReference"],
      imageSizes: ["2K", "3K", "4K"],
      imageRatios: ["16:9", "9:16"],
    },
    {
      id: "全能图片G-2.5",
      label: "全能图片G-2.5",
      type: "image",
      mode: ["text", "singleImage", "multiReference"],
      imageSizes: ["1K", "2K", "4K"],
      imageRatios: ["1:1", "9:16", "16:9", "3:4", "4:3", "3:2", "2:3", "21:9"],
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
  async generateAudio(request: AudioRequest): Promise<MediaAsset[]> {
    const text = (request.text ?? request.prompt ?? "").trim();
    if (!text) throw new Error("请输入音频生成文本");
    const format = request.format ?? "mp3";
    const mimeTypes: Record<string, string> = { wav: "audio/wav", mp3: "audio/mpeg", pcm: "audio/pcm", ogg_opus: "audio/ogg" };
    if (!Object.hasOwn(mimeTypes, format)) throw new Error("TF-router 音频格式仅支持 wav、mp3、pcm、ogg_opus");
    const sampleRate = request.sampleRate ?? 24000;
    if (![8000, 16000, 22050, 24000, 32000, 44100, 48000].includes(sampleRate)) throw new Error("TF-router 音频采样率须为 8000、16000、22050、24000、32000、44100 或 48000 Hz");
    const speed = request.speed ?? 1;
    if (!Number.isFinite(speed) || speed < 0.5 || speed > 2) throw new Error("TF-router 音频语速须在 0.5 到 2 倍之间");
    const volume = request.volume ?? 0;
    const volumeLimit = 20 * Math.log10(2);
    if (!Number.isFinite(volume) || volume < -volumeLimit || volume > volumeLimit) throw new Error("TF-router 音量增益须在约 -6.02 到 6.02 dB 之间");
    const pitch = request.pitch ?? 0;
    if (!Number.isFinite(pitch) || pitch < -12 || pitch > 12) throw new Error("TF-router 音调偏移须在 -12 到 12 之间");
    const references = [
      ...(request.audios ?? []).map(input => audioReference(input, "audio")),
      ...(request.images ?? []).map(input => audioReference(input, "image")),
    ];
    return generateTask(this, "audio", {
      model: request.model,
      text,
      format,
      ...(references.length ? { references } : {}),
      sampleRate,
      speechRate: Math.round((speed - 1) * 100),
      loudnessRate: Math.round((10 ** (volume / 20) - 1) * 100),
      pitchRate: pitch,
    }, mimeTypes[format]);
  },
  async generateImage(request: ImageRequest): Promise<MediaAsset[]> {
    const model = request.model.toLowerCase();
    const images = (request.images ?? []).map(mediaUrl);
    const size = (request.size ?? "2K").toUpperCase();
    const ratio = request.ratio ?? "16:9";
    // if (!["1K", "2K", "4K"].includes(size)) throw new Error("TF-router 图片尺寸仅支持 1K、2K、4K");

    let metadata: Record<string, unknown>;
    let resolvedSize: string;
    if (model.includes("doubao") || model.includes("seedream")) {
      resolvedSize = size.toLowerCase();
      if (!resolvedSize) throw new Error("TF-router Seedream 适配仅支持 16:9、9:16");
      metadata = { response_format: "url", aspectRatio: ratio, sequential_image_generation: "disabled", stream: false, watermark: false };
    } else if (model.includes("gpt") || model.includes("全能图片")) {
      resolvedSize = size.toLowerCase();
      metadata = { aspectRatio: ratio };
    } else {
      resolvedSize = size.toLowerCase();
      metadata = { aspectRatio: ratio };
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

    if (model.includes("kling")) {
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
    } else {
      const references: Record<string, unknown>[] = [];
      if (Array.isArray(mode)) {
        for (const [type, urls] of [
          ["image", images],
          ["video", videos],
          ["audio", audios],
        ] as const) {
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
    }
    return generateTask(this, "video", {
      model: request.model,
      prompt: request.prompt,
      duration: request.duration,
      resolution: request.resolution,
      metadata,
    });
  },
} satisfies ProviderDefinition<typeof rules>;
