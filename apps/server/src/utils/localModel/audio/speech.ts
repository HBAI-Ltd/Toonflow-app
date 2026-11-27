import { join } from "node:path";
import { open } from "@toonflow/file";
import { packLocalTensor, unpackLocalTensor, type LocalModelTensor } from "@toonflow/plugin-server/localModelClient";
import type { AudioModelOptions } from "@/routes/localModels/processAudio";
import { runLocalModel } from "@/utils/localModel/inference";
import { runAudioCommand } from "@/utils/localModel/audio/command";

const audioFormats = "aac,ac3,eac3,mp3,wav,aiff,flac,ogg,ape,wv,amr,au,caf,tta,dsf,dsdiff,asf,mov,mp4,m4a,3gp,3g2,mj2,matroska,webm,avi,flv,mpeg,mpegts,mxf,rm,nut";
export function audioFormatArgs(pcm?: { format: string; sampleRate: number; channels: number }) {
  const format = pcm ? ["-f", pcm.format, "-sample_rate", String(pcm.sampleRate), "-channels", String(pcm.channels)] : [];
  return ["-protocol_whitelist", "file", "-format_whitelist", pcm?.format ?? audioFormats, ...format];
}

type AudioFile = Awaited<ReturnType<typeof open>>;
async function readSamples(file: AudioFile, offset: number, size: number) {
  const bytes = new Uint8Array(size);
  let written = 0;
  while (written < size) {
    const { bytesRead } = await file.read(bytes, written, size - written, offset + written);
    if (!bytesRead) throw new Error("音频采样文件不完整");
    written += bytesRead;
  }
  return bytes;
}

type Progress = (completed: number, total: number) => void;
async function enhance(file: AudioFile, target: AudioFile, signal: AbortSignal, progress: Progress) {
  const frames = (await file.stat()).size / 4;
  if (!Number.isSafeInteger(frames) || !frames) throw new Error("未能读取有效的音频采样");
  // 两端各带一秒上下文，补偿模型的滤波延迟；只写中央区域，保留原始素材长度。
  const rate = 48000, stride = rate * 30;
  for (let start = 0; start < frames; start += stride) {
    signal.throwIfAborted();
    const end = Math.min(frames, start + stride), left = Math.max(0, start - rate), right = Math.min(frames, end + rate);
    const samples = await readSamples(file, left * 4, (right - left) * 4);
    const { outputs } = await runLocalModel({ id: "deepFilterNet", inputs: { audio: packLocalTensor("int16", [right - left, 2], samples) }, outputs: ["enhanced"] }, signal);
    const result = outputs.enhanced;
    if (result?.type !== "int16" || result.dims.join(",") !== [right - left, 2].join(",")) throw new Error("对白降噪模型返回的音轨尺寸无效");
    await target.writeFile(unpackLocalTensor(result).subarray((start - left) * 4, (end - left) * 4));
    progress(end, frames);
  }
}

async function tighten(file: AudioFile, voice: AudioFile, target: AudioFile, pauseMs: number, signal: AbortSignal, progress: Progress) {
  const sampleCount = (await voice.stat()).size / 4, stereoBytes = (await file.stat()).size;
  const frames = Math.ceil(sampleCount / 512);
  const ranges: [number, number][] = [];
  let previous = new Float32Array(64);
  let hidden = packLocalTensor("float32", [1, 1, 128], new Float32Array(128)), cell = hidden;
  let start = -1, quiet = -1;
  function closeSpeech(end: number) {
    if (end - start >= 5) ranges.push([Math.max(0, start - 3), Math.min(frames, end + 3)]);
    start = quiet = -1;
  }
  function state(tensor: LocalModelTensor | undefined) {
    if (tensor?.type !== "float32" || tensor.dims.join(",") !== "1,1,128") throw new Error("语音检测模型返回的状态无效");
    return tensor;
  }
  for (let first = 0; first < frames; first += 512) {
    signal.throwIfAborted();
    const count = Math.min(512, frames - first), offset = first * 512;
    const bytes = await readSamples(voice, offset * 4, Math.min(sampleCount - offset, count * 512) * 4);
    const samples = new Float32Array(bytes.buffer);
    const block = new Float32Array(count * 576);
    for (let index = 0; index < count; index++) {
      const pos = index * 576;
      block.set(previous, pos);
      block.set(samples.subarray(index * 512, (index + 1) * 512), pos + 64);
      previous = block.subarray(pos + 512, pos + 576);
    }
    const { outputs } = await runLocalModel({ id: "sileroVad", device: "cpu", inputs: {
      input: packLocalTensor("float32", [count, 576], block), h: hidden, c: cell,
    }, outputs: ["speech_probs", "hn", "cn"] }, signal);
    hidden = state(outputs.hn);
    cell = state(outputs.cn);
    const probabilities = outputs.speech_probs;
    if (probabilities?.type !== "float32" || probabilities.dims.reduce((a, b) => a * b, 1) !== count) throw new Error("语音检测模型返回的片段数无效");
    const values = new Float32Array(unpackLocalTensor(probabilities).buffer);
    for (let index = 0; index < count; index++) {
      const pos = first + index, value = values[index]!;
      if (value >= 0.5) { if (start < 0) start = pos; quiet = -1; }
      else if (start >= 0 && value < 0.35) {
        if (quiet < 0) quiet = pos;
        if ((pos - quiet + 1) * 32 >= pauseMs) closeSpeech(quiet);
      }
    }
    progress(first + count, frames);
  }
  if (start >= 0) closeSpeech(quiet < 0 ? frames : quiet);
  if (!ranges.length) throw new Error("未检测到可保留的对白");
  for (const [from, to] of ranges) {
    // 16 kHz / 512 点的时间戳映射回 48 kHz 原声立体声采样，避免对检测用单声道进行剪辑。
    const end = Math.min(stereoBytes, to * 1536 * 4);
    for (let offset = from * 1536 * 4; offset < end; offset += 1024 * 1024) {
      signal.throwIfAborted();
      await target.writeFile(await readSamples(file, offset, Math.min(1024 * 1024, end - offset)));
    }
  }
}

export async function processSpeech(ffmpeg: string, source: string, temporary: string,
  options: Extract<AudioModelOptions, { operation: "denoiseSpeech" | "tightenSpeech" }>, progress: Progress, signal: AbortSignal) {
  const command = (args: string[]) => runAudioCommand(ffmpeg, ["-hide_banner", "-loglevel", "error", "-nostdin", "-n", ...args], temporary, signal);
  const mono = options.operation === "tightenSpeech" ? ["-map", "0:a:0", "-ac", "1", "-ar", "16000", "-f", "f32le", "voice.pcm"] : [];
  await command([...audioFormatArgs(options.pcm), "-i", source, ...mono, "-map", "0:a:0", "-ac", "2", "-ar", "48000", "-f", "s16le", "source.pcm"]);
  const sourceFile = await open(join(temporary, "source.pcm"), "r");
  try {
    const target = await open(join(temporary, "result.pcm"), "wx");
    try {
      if (options.operation === "denoiseSpeech") await enhance(sourceFile, target, signal, progress);
      else {
        const voice = await open(join(temporary, "voice.pcm"), "r");
        try { await tighten(sourceFile, voice, target, options.pauseMs, signal, progress); }
        finally { await voice.close(); }
      }
    } finally { await target.close(); }
  } finally { await sourceFile.close(); }
  await command(["-f", "s16le", "-ar", "48000", "-ac", "2", "-i", "result.pcm", "-c:a", "copy", "-rf64", "auto", "result.wav"]);
  return [join(temporary, "result.wav")];
}
