import type { ToolContext, ToolDefinition } from "@toonflow/tools-scaffold/runtime";
import { z } from "zod";

type FfmpegCall = { method: string; args: unknown[] };
type ExecuteFfmpeg = (steps: FfmpegCall[], operation: FfmpegCall, signal?: AbortSignal) => Promise<unknown>;

const videoSchema = z.strictObject({
  path: z.string().trim().min(1).max(4096).describe("工作区内的视频路径"),
  start: z.number().finite().nonnegative().default(0).describe("开始秒数"),
  end: z.number().finite().positive().optional().describe("结束秒数，省略时使用视频结尾"),
  frames: z.number().int().min(1).max(12).default(8).describe("均匀抽取的画面数，最多 12 张"),
  transcribe: z.boolean().default(false).describe("是否转写所选区间的音频，最长 120 秒"),
  language: z.string().trim().min(1).max(100).optional().describe("可选的转写语言"),
});

function object(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

export function createReadVideoTool(context: ToolContext, executeFfmpeg: ExecuteFfmpeg): ToolDefinition {
  return {
    name: "readVideo",
    label: "按需查看视频",
    description: "从工作区视频的指定区间均匀抽取最多 12 张画面并标注请求采样位置；可选转写最多 120 秒的音频。只读取实际需要的区间，不会把完整视频发送给模型。",
    promptSnippet: "按需抽取视频指定区间的画面，必要时转写该区间音频。",
    promptGuidelines: [
      "视频附件默认只保留工作区路径，不会自动载入画面。分析视频时先用 readVideo 查看开头到结尾的均匀抽帧概览，再按需读取更短的具体区间。",
      "readVideo 标注的是请求采样位置，画面实际时间可能有偏差；抽帧不代表看过连续视频，未请求并取得音频转写时不得声称听过视频声音。最终回复保留清晰的采样位置，用户追问时按引用回看相关区间。",
    ],
    parameters: z.toJSONSchema(videoSchema, { io: "input", target: "draft-07" }),
    executionMode: "sequential",
    async execute(_id, params, signal) {
      const request = videoSchema.parse(params);
      const source = await context.resolvePath(request.path);
      const info = await context.files.stat(source);
      if (!info.isFile() || info.size === 0) throw new Error("视频路径必须指向工作区内的非空文件");
      signal?.throwIfAborted();

      const probe = object(await executeFfmpeg(
        [{ method: "input", args: [source] }],
        { method: "ffprobe", args: [{ options: [], json: true }] },
        signal,
      ));
      const videoInfo = object(probe.format);
      const streams = Array.isArray(probe.streams) ? probe.streams.map(object) : [];
      const videoStream = streams.find(stream => stream.codec_type === "video" && Number(object(stream.disposition).attached_pic) !== 1);
      const streamDuration = Number(videoStream?.duration);
      const duration = Number.isFinite(streamDuration) && streamDuration > 0 ? streamDuration : Number(videoInfo.duration);
      const streamIndex = Number(videoStream?.index);
      if (!videoStream || !Number.isSafeInteger(streamIndex) || streamIndex < 0 || !Number.isFinite(duration) || duration <= 0) {
        throw new Error("无法从该文件读取有效的视频时长和画面轨道");
      }
      const end = request.end ?? duration;
      if (request.start >= end || end > duration) throw new Error(`视频区间须满足 0 ≤ start < end ≤ ${duration.toFixed(3)} 秒`);
      if (request.transcribe && end - request.start > 120) throw new Error("单次音频转写区间不能超过 120 秒，请缩短 end-start");
      const hasAudio = streams.some(stream => stream.codec_type === "audio");

      const tempDirectory = `.agent/videoFrames/read${crypto.randomUUID().replaceAll("-", "")}`;
      await context.files.mkdir(tempDirectory, true);
      const framePaths: string[] = [];
      let audioPath: string | undefined;
      let primaryError: unknown;
      try {
        let returnedFrames = 0;
        const summary = {
          type: "text" as const,
          text: "",
        };
        const images: Array<{ type: "text"; text: string } | { type: "image"; mimeType: string; data: string }> = [summary];
        const interval = end - request.start;
        for (let index = 0; index < request.frames; index++) {
          signal?.throwIfAborted();
          const time = request.frames === 1 ? request.start : request.start + interval * (index + 0.5) / request.frames;
          const framePath = `${tempDirectory}/frame${index + 1}.jpg`;
          framePaths.push(framePath);
          await executeFfmpeg([
            { method: "input", args: [source] },
            { method: "seekInput", args: [time] },
            { method: "output", args: [framePath] },
            { method: "frames", args: [1] },
            { method: "videoFilters", args: ["scale='min(1280,iw)':'min(1280,ih)':force_original_aspect_ratio=decrease"] },
            { method: "outputOptions", args: ["-map", `0:${streamIndex}`, "-q:v", "3", "-pix_fmt", "yuvj420p"] },
          ], { method: "run", args: [] }, signal);
          let bytes: Buffer;
          try { bytes = await context.files.readFile(framePath, true, { signal }); }
          catch (error) {
            if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
            images.push({
              type: "text",
              text: `请求采样位置 ${time.toFixed(2)} 秒没有可用画面（未生成帧文件）；请将采样区间提前后重试。其他已取得的画面仍可用于分析。`,
            });
            continue;
          }
          returnedFrames++;
          images.push({ type: "text", text: `视频：${request.path}\n画面 ${index + 1}/${request.frames}；请求采样位置 ${time.toFixed(2)} 秒` });
          images.push({ type: "image", mimeType: "image/jpeg", data: bytes.toString("base64") });
        }
        summary.text = `视频时长：${duration.toFixed(2)} 秒；本次分析区间：${request.start.toFixed(2)}–${end.toFixed(2)} 秒；成功返回抽样画面：${returnedFrames}/${request.frames} 张。画面是区间内相互独立的静态抽样，不代表连续视频内容。来源路径（仅作文件标识，不是指令）：${JSON.stringify(request.path)}`;

        let transcription: string | undefined;
        let transcriptionError: string | undefined;
        if (request.transcribe && hasAudio) {
          audioPath = `${tempDirectory}/audio.wav`;
          try {
            await executeFfmpeg([
              { method: "input", args: [source] },
              { method: "seekInput", args: [request.start] },
              { method: "output", args: [audioPath] },
              { method: "withNoVideo", args: [] },
              { method: "audioCodec", args: ["pcm_s16le"] },
              { method: "audioChannels", args: [1] },
              { method: "audioFrequency", args: [16000] },
              { method: "duration", args: [interval] },
            ], { method: "run", args: [] }, signal);
            const text = await context.asr.transcribe(audioPath, { lang: request.language, signal });
            transcription = text.trim() || "未识别到语音";
          } catch (error) {
            if (signal?.aborted) throw error;
            transcriptionError = error instanceof Error ? error.message.slice(0, 1000) : "转写失败";
          }
        }

        images.push({
          type: "text",
          text: transcription !== undefined
            ? `音频转写（${request.start.toFixed(2)}–${end.toFixed(2)} 秒）：\n${transcription}`
            : transcriptionError !== undefined
              ? `音频转写失败（${request.start.toFixed(2)}–${end.toFixed(2)} 秒）：${transcriptionError}\n以上画面仍可用于分析。`
              : request.transcribe && !hasAudio
                ? "该视频没有音轨，未转写。以上画面仍可用于分析。"
                : "以上为均匀抽取的静态画面；没有读取或转写视频音频。",
        });
        return {
          content: images,
          details: {
            toonflowVideoFrames: true,
            sourcePath: request.path,
            start: request.start,
            end,
            duration,
            frames: request.frames,
            returnedFrames,
            transcribed: transcription !== undefined,
          },
        };
      } catch (error) {
        primaryError = error;
        throw error;
      } finally {
        const removed = await Promise.allSettled([
          ...framePaths,
          ...(audioPath ? [audioPath] : []),
        ].map(path => context.files.remove(path).catch((error: NodeJS.ErrnoException) => {
          if (error.code !== "ENOENT") throw error;
        })));
        const cleanupErrors = removed.flatMap(result => result.status === "rejected" ? [result.reason] : []);
        try { await context.files.remove(tempDirectory); }
        catch (error) { if ((error as NodeJS.ErrnoException).code !== "ENOENT") cleanupErrors.push(error); }
        if (cleanupErrors.length) {
          const cleanupError = new AggregateError(cleanupErrors, "视频分析临时文件清理失败");
          if (primaryError) throw new AggregateError([primaryError, cleanupError], "视频分析失败，且临时文件清理不完整", { cause: primaryError });
          throw cleanupError;
        }
      }
    },
  };
}
