import { tmpdir } from "node:os";
import { createHash } from "node:crypto";
import { join } from "node:path";
import { mkdtemp, open, readFile, rm, writeFile } from "@toonflow/file";
import { unzipSync } from "fflate";
import { pcmToWav } from "@toonflow/node-shared/pcmPreview";
import type { ModelRunner } from "@/types/localModels";
import { resolveInstalledModel } from "@/utils/localModel";
import { runLocalModel } from "@/utils/localModel/inference";
import { runAudioCommand } from "@/utils/localModel/audio/command";

const sampleRate = 16000;
let activeRuns = 0;

async function whisperCommand(directory: string) {
  const system = Bun.which("whisper-cli");
  if (system) return system;
  if (process.platform !== "win32" || process.arch !== "x64") throw new Error("请安装 whisper.cpp 的 whisper-cli 并加入 PATH");
  const archive = await resolveInstalledModel("whisperRuntime");
  const bytes = await readFile(archive.path);
  if (bytes.length !== archive.size || createHash("sha256").update(bytes).digest("hex") !== archive.sha256) throw new Error("运行库校验失败，请使用当前平台和版本的文件");
  const allowed = new Set(["whisper-cli.exe", "whisper.dll", "ggml.dll", "ggml-base.dll", "ggml-cpu.dll", "SDL2.dll"]);
  const files = unzipSync(bytes, { filter: item => item.name.startsWith("Release/") && allowed.has(item.name.slice(8)) });
  for (const [name, content] of Object.entries(files)) await writeFile(join(directory, name.slice(8)), content, { flag: "wx" });
  return join(directory, "whisper-cli.exe");
}

export const runWhisper: ModelRunner = async (request, signal) => {
  const { audio, language } = request.inputs;
  if (audio?.type !== "int16" || audio.dims.length !== 1 || !audio.dims[0] || language?.type !== "uint8") throw new Error("需要 16 kHz 单声道音频和字幕语言");
  const selected = Buffer.from(language.data, "base64").toString("utf8");
  if (!["auto", "zh", "en", "ja", "ko"].includes(selected)) throw new Error("字幕语言无效");
  if (activeRuns >= 2) throw Object.assign(new Error("本地模型正在运行，请稍后再试"), { status: 429 });
  activeRuns++;
  let dir: string | undefined;
  try {
    const model = await resolveInstalledModel("whisper");
    dir = await mkdtemp(join(tmpdir(), "toonflowWhisper"));
    const command = await whisperCommand(dir);
    const pcm = Buffer.from(audio.data, "base64");
    const wave = pcmToWav(Uint8Array.from(pcm).buffer, { sampleRate, channels: 1, format: "s16le" });
    await writeFile(join(dir, "audio.wav"), new Uint8Array(await wave.arrayBuffer()), { flag: "wx" });
    await runAudioCommand(command, ["-m", model.path, "-l", selected, "-f", "audio.wav", "-osrt", "-of", "subtitles", "-np"], dir, signal);
    const text = await readFile(join(dir, "subtitles.srt"));
    return { provider: "whisper.cpp", outputs: { srt: { type: "uint8", dims: [text.length], data: text.toString("base64") } } };
  } finally {
    activeRuns--;
    if (dir) await rm(dir, { recursive: true, force: true });
  }
};

// 在传输上限内分段；长录音优先在边界前两秒最安静的 50 毫秒处切开。
function chooseCut(audio: Buffer) {
  const window = sampleRate / 20 * 2;
  let cut = audio.length, lowest = Infinity;
  for (let at = audio.length - sampleRate * 4; at + window <= audio.length; at += window) {
    let energy = 0;
    for (let i = at; i < at + window; i += 2) energy += Math.abs(audio.readInt16LE(i));
    if (energy <= lowest) { lowest = energy; cut = at + window / 2; }
  }
  return cut;
}

function timestamp(value: string, offset: number) {
  const [hour, minute, second, millis] = value.split(/[:,]/).map(Number);
  const ms = ((hour! * 60 + minute!) * 60 + second!) * 1000 + millis! + offset;
  const pad = (n: number) => String(Math.floor(n)).padStart(2, "0");
  return [pad(ms / 3600000), pad(ms / 60000 % 60), pad(ms / 1000 % 60)].join(":") + "," + String(ms % 1000).padStart(3, "0");
}

export async function transcribeSpeech(ffmpeg: string, source: string, temporary: string,
  options: { language: string; pcm?: { format: string; sampleRate: number; channels: number } },
  progress: (completed: number, total: number) => void, signal: AbortSignal) {
  const pcm = options.pcm;
  const formats = "aac,ac3,eac3,mp3,wav,aiff,flac,ogg,ape,wv,amr,au,caf,tta,dsf,dsdiff,asf,mov,mp4,m4a,3gp,3g2,mj2,matroska,webm,avi,flv,mpeg,mpegts,mxf,rm,nut";
  await runAudioCommand(ffmpeg, ["-hide_banner", "-loglevel", "error", "-nostdin", "-n", "-protocol_whitelist", "file", "-format_whitelist", pcm?.format ?? formats,
    ...(pcm ? ["-f", pcm.format, "-ar", String(pcm.sampleRate), "-ac", String(pcm.channels)] : []), "-i", source,
    "-map", "0:a:0", "-ac", "1", "-ar", String(sampleRate), "-f", "s16le", "speech.pcm"], temporary, signal);
  const file = await open(join(temporary, "speech.pcm"), "r");
  const target = join(temporary, "subtitles.srt");
  try {
    const { size } = await file.stat();
    if (!size || size % 2) throw new Error("音频中没有可识别的采样");
    const language = Buffer.from(options.language), cues: string[] = [];
    const chunk = 5 * 60 * sampleRate * 2;
    progress(0, size);
    for (let pos = 0; pos < size;) {
      signal.throwIfAborted();
      const audio = Buffer.alloc(Math.min(chunk, size - pos));
      for (let at = 0; at < audio.length;) {
        const { bytesRead } = await file.read(audio, at, audio.length - at, pos + at);
        if (!bytesRead) throw new Error("读取音频片段失败");
        at += bytesRead;
      }
      const segment = pos + audio.length === size ? audio : audio.subarray(0, chooseCut(audio));
      const result = await runLocalModel({ id: "whisper", inputs: {
        language: { type: "uint8", dims: [language.length], data: language.toString("base64") },
        audio: { type: "int16", dims: [segment.length / 2], data: segment.toString("base64") },
      }, outputs: ["srt"] }, signal);
      const srt = result.outputs.srt;
      if (srt?.type !== "uint8" || srt.dims.length !== 1) throw new Error("字幕模型返回了无效的结果");
      const offset = Math.round(pos * 1000 / (2 * sampleRate));
      const raw = Buffer.from(srt.data, "base64").toString("utf8").trim();
      for (const block of raw ? raw.split(/\r?\n\s*\r?\n/) : []) {
        const cue = /^\d+\s*\r?\n(\d+:\d\d:\d\d,\d{3}) --> (\d+:\d\d:\d\d,\d{3})\s*\r?\n([\s\S]+)$/.exec(block);
        if (!cue) throw new Error("语音模型返回的字幕时间码无效");
        cues.push([cues.length + 1, timestamp(cue[1]!, offset) + " --> " + timestamp(cue[2]!, offset), cue[3]!.trim(), ""].join("\n"));
      }
      pos += segment.length;
      progress(pos, size);
    }
    if (!cues.length) throw new Error("未识别到对白，可尝试指定对白语言");
    await writeFile(target, cues.join("\n"), { flag: "wx" });
    return [target];
  } finally { await file.close(); }
}
