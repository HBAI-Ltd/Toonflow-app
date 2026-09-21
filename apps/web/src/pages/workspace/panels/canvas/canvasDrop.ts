import axios from "axios";
import { ElMessage } from "element-plus";
import type { useVueFlow } from "@vue-flow/core";
import { uploadNodeFile } from "@toonflow/nodes-scaffold/workspaceFiles";
import type { NodeOutput } from "@toonflow/nodes-scaffold/values";
import useWorkspaceFiles from "@/lib/workspaceFiles";

const assetDragType = "application/toonflow-asset";
const fileMimeTypes: Record<string, string> = {
  png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", webp: "image/webp", gif: "image/gif",
  avif: "image/avif", apng: "image/apng", bmp: "image/bmp", svg: "image/svg+xml", ico: "image/x-icon",
  mp4: "video/mp4", m4v: "video/mp4", webm: "video/webm", mov: "video/quicktime", mkv: "video/x-matroska", avi: "video/x-msvideo",
  mp3: "audio/mpeg", wav: "audio/wav", ogg: "audio/ogg", opus: "audio/ogg", flac: "audio/flac", m4a: "audio/mp4", aac: "audio/aac",
  txt: "text/plain", md: "text/markdown", markdown: "text/markdown", csv: "text/csv", log: "text/plain",
  json: "application/json", xml: "application/xml", html: "text/html", css: "text/css", js: "text/javascript", ndjson: "application/x-ndjson",
};

export function startAssetDrag(event: DragEvent, entry: { type: string; path: string }) {
  if (entry.type !== "file" || !event.dataTransfer) return;
  event.dataTransfer.effectAllowed = "copy";
  event.dataTransfer.setData(assetDragType, entry.path);
}

export function isCanvasFileDrag(event: DragEvent) {
  return event.dataTransfer?.types.some(type => type === assetDragType || type === "Files") ?? false;
}

type CanvasFileContext = {
  directory: string;
  availableNodes: { type: string }[];
  signal: AbortSignal;
  flow: Pick<ReturnType<typeof useVueFlow>, "addNodes" | "screenToFlowCoordinate">;
};

export async function dropCanvasFiles(event: DragEvent, context: CanvasFileContext) {
  const transfer = event.dataTransfer;
  if (!transfer) return;
  const path = transfer.getData(assetDragType);
  let droppedFiles = Array.from(transfer.files);
  const { signal, flow } = context;
  const position = flow.screenToFlowCoordinate({ x: event.clientX, y: event.clientY });
  try {
    signal.throwIfAborted();
    if (path) {
      const { data } = await axios.get<Blob>("/api/assets/read", { params: { path }, responseType: "blob", signal });
      droppedFiles = [new File([data], path.split("/").pop()!, { type: data.type })];
    }
    await importCanvasFiles(droppedFiles, position, context);
  } catch (error) {
    if (!signal.aborted) showError(error);
  }
}

export async function importCanvasFiles(droppedFiles: File[], position: { x: number; y: number }, context: CanvasFileContext) {
  const { signal, flow, availableNodes } = context;
  const files = useWorkspaceFiles(context.directory);
  for (const [index, file] of droppedFiles.entries()) {
    if (signal.aborted) break;
    const id = crypto.randomUUID();
    let copiedPath: string | undefined;
    try {
      const fileType = file.type.split(";")[0]!.trim().toLowerCase();
      const extension = file.name.split(".").pop()!.toLowerCase();
      const mimeType = !fileType || fileType === "application/octet-stream" ? fileMimeTypes[extension] ?? fileType : fileType;
      const kind = mimeType.startsWith("image/") ? "image" : mimeType.startsWith("audio/") ? "audio" : mimeType.startsWith("video/") ? "video"
        : mimeType.startsWith("text/") || /^application\/(json|xml|javascript|x-ndjson)$/.test(mimeType) ? "text" : undefined;
      if (!kind) throw new Error(`${file.name}：该文件类型暂不支持导入画布`);
      const type = `remote-${kind}Node`;
      if (!availableNodes.some(node => node.type === type)) throw new Error(`${file.name}：请先安装并启用对应的基础节点`);
      let output: NodeOutput | undefined;
      let textSnapshot: string | undefined;
      if (kind === "text") {
        textSnapshot = await file.text();
      } else {
        copiedPath = await uploadNodeFile(files, id, file);
        output = { dataType: kind === "image" ? "IMAGE" : kind === "audio" ? "AUDIO" : "VIDEO", value: { url: copiedPath, mimeType } };
      }
      signal.throwIfAborted();
      flow.addNodes({ id, type, position: { x: position.x + index * 32, y: position.y + index * 32 },
        data: kind === "text" ? { label: file.name, textSnapshot } : { label: file.name, outputs: { [kind]: output } } });
    } catch (error) {
      if (copiedPath) await files.remove(copiedPath).catch(showError);
      if (!signal.aborted) showError(error);
    }
  }
}

function showError(error: unknown) {
  ElMessage.error(axios.isAxiosError<{ message: string }>(error) ? error.response?.data.message || error.message : error instanceof Error ? error.message : "文件导入失败");
}
