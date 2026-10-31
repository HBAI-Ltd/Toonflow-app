import { mkdtemp, readFile, realpath, rm, stat, writeFile } from "@toonflow/file";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { prepareWorkspaceFfmpeg } from "@/utils/ffmpeg";

export type PreviewKind = "video" | "image" | "audio";

let runningPreviews = 0;
const previewQueue = new Set<() => void>();
const previewLimit = 100 * 1024 * 1024;

function acquirePreview(signal: AbortSignal) {
  signal.throwIfAborted();
  return new Promise<() => void>((resolve, reject) => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const cancel = () => { clearTimeout(timer); previewQueue.delete(start); reject(signal.reason); };
    const start = () => {
      clearTimeout(timer);
      previewQueue.delete(start);
      signal.removeEventListener("abort", cancel);
      if (signal.aborted) { reject(signal.reason); return; }
      runningPreviews++;
      resolve(() => {
        runningPreviews--;
        previewQueue.values().next().value?.();
      });
    };
    // ACT: 单进程最多并行转换两个媒体；等待最多两分钟，取消即出队，不占用 FFmpeg 或临时磁盘。
    if (runningPreviews < 2) start();
    else {
      previewQueue.add(start);
      signal.addEventListener("abort", cancel, { once: true });
      timer = setTimeout(() => {
        previewQueue.delete(start);
        signal.removeEventListener("abort", cancel);
        reject(Object.assign(new Error("兼容预览等待超时，请稍后重试"), { status: 504 }));
      }, 120000);
    }
  });
}

export async function createPreview(content: Buffer, kind: PreviewKind, signal: AbortSignal) {
  const release = await acquirePreview(signal);
  const timeout = AbortSignal.timeout(120000);
  const active = AbortSignal.any([signal, timeout]);
  let temporaryRoot = "";
  let directory: string | undefined;
  try {
    const paths = await prepareWorkspaceFfmpeg(active);
    active.throwIfAborted();
    temporaryRoot = await realpath(tmpdir());
    directory = await mkdtemp(join(temporaryRoot, "toonflowMediaPreview"));
    const source = join(directory, "source");
    const output = join(directory, kind === "video" ? "preview.mp4" : kind === "image" ? "preview.png" : "preview.mp3");
    await writeFile(source, content, { flag: "wx", mode: 0o600, signal: active });
    // ACT: 仅接收自包含媒体；禁止播放列表、文件序列和网络协议，MOV 另禁外部轨道引用。
    const mov = ["ftyp", "moov", "mdat", "wide", "free", "skip", "pnot"].includes(content.toString("ascii", 4, 8));
    const inputOptions = mov
      ? ["-f", "mov", "-format_whitelist", "mov", "-enable_drefs", "0", "-use_absolute_path", "0"]
      : ["-format_whitelist", "matroska,webm,avi,asf,mpeg,mpegts,ogg,wav,aiff,mp3,aac,flac,amr,ape,wv,tta,au,caf,tiff_pipe,png_pipe,jpeg_pipe,jpegls_pipe,jpegxl_pipe,webp_pipe,bmp_pipe,gif,apng,ico"];
    const outputOptions = kind === "video"
      ? ["-map", "0:V:0", "-map", "0:a:0?", "-c:v", "libx264", "-preset", "fast", "-crf", "18",
        "-vf", "pad=ceil(iw/2)*2:ceil(ih/2)*2", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "192k", "-ac", "2", "-movflags", "+faststart"]
      : kind === "image"
        ? ["-map", "0:v:0", "-frames:v", "1", "-c:v", "png", "-f", "image2", "-update", "1"]
        : ["-map", "0:a:0", "-c:a", "libmp3lame", "-b:a", "192k", "-ar", "48000", "-ac", "2"];
    active.throwIfAborted();
    const child = Bun.spawn([paths.ffmpeg, "-hide_banner", "-v", "error", "-nostdin", "-n",
      "-protocol_whitelist", "file", "-max_streams", "32", ...inputOptions, "-i", source,
      ...outputOptions, "-map_metadata", "-1", "-fs", String(previewLimit), output], {
      cwd: directory, stdin: "ignore", stdout: "ignore", stderr: "pipe", windowsHide: true, signal: active,
      env: Object.fromEntries(Object.entries(process.env).filter(([key]) => key.toUpperCase() !== "FFREPORT")),
    });
    const readErrors = async () => {
      const decoder = new TextDecoder();
      let details = "";
      for await (const chunk of child.stderr) details = (details + decoder.decode(chunk, { stream: true })).slice(-2000);
      return details + decoder.decode();
    };
    const [details, code] = await Promise.all([readErrors(), child.exited]).finally(() => child.exited);
    active.throwIfAborted();
    if (code !== 0) {
      console.warn("兼容预览生成失败", details.trim());
      throw Object.assign(new Error("无法生成兼容预览，文件格式或编码不受支持"), { status: 422 });
    }
    // FFmpeg 达到 -fs 会结束输出且可能超过阈值；不能把这种截断预览当成功返回。
    if ((await stat(output)).size >= previewLimit) throw Object.assign(new Error("兼容预览超过 100 MB，请使用较短或较小的媒体文件"), { status: 413 });
    const data = await readFile(output, { signal: active });
    if (!data.length) throw Object.assign(new Error("兼容预览内容为空"), { status: 422 });
    return { data, mimeType: kind === "video" ? "video/mp4" : kind === "image" ? "image/png" : "audio/mpeg" };
  } catch (error) {
    if (timeout.aborted && !signal.aborted) throw Object.assign(new Error("兼容预览生成超时，请使用较短或较小的媒体文件"), { status: 504 });
    throw error;
  } finally {
    // 目录只由本次 mkdtemp 创建，永不使用请求提供的路径或工作区素材目录。
    try {
      if (directory) {
        if (dirname(directory) !== temporaryRoot) throw new Error("兼容预览临时目录超出系统临时目录，已停止清理");
        await rm(directory, { recursive: true, force: true });
      }
    }
    finally { release(); }
  }
}
