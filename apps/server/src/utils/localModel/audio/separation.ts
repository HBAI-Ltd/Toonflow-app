import { tmpdir } from "node:os";
import { join, relative } from "node:path";
import { constants, copyFile, lstat, mkdtemp, open, rm, writeFile } from "@toonflow/file";
import { sampleRate, separateVocalChunks, stride } from "@toonflow/node-audio/vocalChunks";
import type { AudioModelOptions } from "@/routes/localModels/processAudio";
import { prepareWorkspaceFfmpeg } from "@/utils/ffmpeg";
import { runLocalModel } from "@/utils/localModel/inference";
import { audioFormatArgs, processSpeech } from "@/utils/localModel/audio/speech";
import { transcribeSpeech } from "@/utils/localModel/audio/whisper";
import { runAudioCommand } from "@/utils/localModel/audio/command";
import { requireDirectModelAccess } from "@/utils/multiTenant/gateway";
import { lockWorkspaceFiles, resolveWorkspacePath } from "@/utils/workspace/files";

const resultPath = /^assets\/[\da-f]{8}-[\da-f]{4}-4[\da-f]{3}-[89ab][\da-f]{3}-[\da-f]{12}\/([a-z]+\.[a-z]+)$/i;
const resultNames = { separateVocals: "voice.wav", denoiseSpeech: "enhanced.wav", tightenSpeech: "dialogue.wav", transcribe: "subtitles.srt" };
const tracks = ["voice", "music"] as const;

async function separateTracks(ffmpeg: string, source: string, temporary: string, options: AudioModelOptions,
  onProgress: (completed: number, total: number) => void, signal: AbortSignal) {
  const command = (args: string[]) => runAudioCommand(ffmpeg, ["-hide_banner", "-loglevel", "error", "-nostdin", "-n", ...args], temporary, signal);
  await command([...audioFormatArgs(options.pcm), "-i", source,
    "-map", "0:a:0", "-ac", "2", "-ar", String(sampleRate), "-f", "f32le", "decoded.pcm"]);
  const decoded = await open(join(temporary, "decoded.pcm"), "r");
  let count = 0;
  try {
    const { size } = await decoded.stat();
    if (!size || size % 8) throw new Error("未能读取有效的音频采样");
    const chunkBytes = stride * 8;
    count = Math.ceil(size / chunkBytes);
    async function readChunk(index: number) {
      signal.throwIfAborted();
      const start = index * chunkBytes;
      const samples = new Float32Array(Math.min(size - start, chunkBytes) / 4);
      const bytes = new Uint8Array(samples.buffer);
      for (let offset = 0; offset < bytes.length;) {
        const { bytesRead } = await decoded.read(bytes, offset, bytes.length - offset, start + offset);
        if (!bytesRead) throw new Error("音频分段长度无效");
        offset += bytesRead;
      }
      return samples;
    }
    onProgress(0, count);
    let index = 0;
    for await (const chunk of separateVocalChunks(count, readChunk, runLocalModel, signal)) {
      for (const name of tracks) await writeFile(join(temporary, `${name}${index}.wav`), new Uint8Array(await chunk[name].arrayBuffer()), { flag: "wx" });
      onProgress(++index, count);
    }
  } finally {
    await decoded.close();
  }
  for (const name of tracks) {
    signal.throwIfAborted();
    if (count === 1) continue;
    const list = `${name}.ffconcat`;
    const files = Array.from({ length: count }, (_, index) => `file '${name}${index}.wav'`);
    await writeFile(join(temporary, list), ["ffconcat version 1.0", ...files, ""].join("\n"), { flag: "wx" });
    await command(["-protocol_whitelist", "file", "-f", "concat", "-safe", "1", "-i", list, "-c:a", "copy", "-rf64", "auto", `${name}.wav`]);
  }
  return tracks.map(name => join(temporary, count === 1 ? `${name}0.wav` : `${name}.wav`));
}

export async function processWorkspaceAudio(root: string, source: string, output: string, options: AudioModelOptions,
  onProgress: (completed: number, total: number) => void, signal: AbortSignal) {
  requireDirectModelAccess();
  signal.throwIfAborted();
  if (resultPath.exec(output)?.[1] !== resultNames[options.operation]) throw Object.assign(new Error("文件路径无效"), { status: 400 });
  const input = await resolveWorkspacePath(root, source);
  const paths = options.operation === "separateVocals" ? [output, output.replace(/voice\.wav$/i, "music.wav")] : [output];
  const targets = await Promise.all(paths.map(async path => {
    const target = await resolveWorkspacePath(root, path);
    if (relative(join(root, path), target.path)) throw Object.assign(new Error("不能通过符号链接操作文件"), { status: 403 });
    return target.path;
  }));
  const release = lockWorkspaceFiles([input.path, ...targets]);
  let temporary: string | undefined;
  try {
    if (!(await lstat(input.path)).isFile()) throw Object.assign(new Error("来源必须是当前工作区内的普通文件"), { status: 400 });
    for (const target of targets) {
      const existing = await lstat(target).catch((error: NodeJS.ErrnoException) => { if (error.code !== "ENOENT") throw error; });
      if (existing) throw Object.assign(new Error("已存在同名文件或目录"), { status: 409, code: "EEXIST" });
    }
    const tools = await prepareWorkspaceFfmpeg(signal);
    temporary = await mkdtemp(join(tmpdir(), "toonflowAudio"));
    const staged = options.operation === "separateVocals" ? await separateTracks(tools.ffmpeg, input.path, temporary, options, onProgress, signal)
      : options.operation === "transcribe" ? await transcribeSpeech(tools.ffmpeg, input.path, temporary, options, onProgress, signal)
      : await processSpeech(tools.ffmpeg, input.path, temporary, options, onProgress, signal);
    for (const [index, path] of paths.entries()) {
      if ((await resolveWorkspacePath(root, path)).path !== targets[index]) throw Object.assign(new Error("文件路径无效"), { status: 403 });
    }
    requireDirectModelAccess();
    signal.throwIfAborted();
    await copyFile(staged[0]!, targets[0]!, constants.COPYFILE_EXCL);
    if (targets.length === 1) return;
    try {
      await copyFile(staged[1]!, targets[1]!, constants.COPYFILE_EXCL);
    } catch (error) {
      await rm(targets[0]!);
      throw error;
    }
  } finally {
    release();
    if (temporary) await rm(temporary, { recursive: true, force: true }).catch(error => console.warn("FFmpeg 临时目录清理失败", error));
  }
}
