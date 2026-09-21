import { types } from "node:util";
import { Mp3Encoder } from "@breezystack/lamejs";
import { WaveFile } from "wavefile";
import type { AudioConvertOptions } from "@toonflow/providers";

const maxInputBytes = 100 * 1024 * 1024;
// ACT: 上限按 48kHz 立体声 30 分钟估算，防止畸形 WAV 头声称超长时长耗尽内存。
const maxSamplesPerChannel = 48000 * 60 * 30;
const mimeTypes = { wav: "audio/wav", mp3: "audio/mpeg" } as const;
const mp3BlockSize = 1152;

function invalid(message: string): never {
  throw new Error(message);
}

/**
 * 仅接受内存中的 WAV 字节并返回处理后的内存字节，不读写文件、不解析路径或 URL。
 * ACT: 只支持 WAV 输入（wavefile 无法解码 mp3/aac 等压缩格式），转码到 mp3 通过 lamejs 编码实现。
 */
export async function convertAudio(input: Uint8Array, options: AudioConvertOptions, signal?: AbortSignal): Promise<{ data: Uint8Array; mimeType: string }> {
  signal?.throwIfAborted();
  // 供应商代码运行在独立 VM realm，TypedArray 跨 realm 不满足 instanceof，须用 util.types 判断。
  if (!types.isUint8Array(input)) invalid("音频输入必须是 Uint8Array");
  if (input.byteLength === 0 || input.byteLength > maxInputBytes) invalid("音频输入大小无效");
  if (options.format !== "wav" && options.format !== "mp3") invalid("输出格式仅支持 wav 或 mp3");
  const { startSeconds, endSeconds, sampleRate: targetSampleRate, bitrateKbps } = options;
  if (startSeconds !== undefined && !(Number.isFinite(startSeconds) && startSeconds >= 0)) invalid("裁剪起点无效");
  if (endSeconds !== undefined && !(Number.isFinite(endSeconds) && endSeconds > 0)) invalid("裁剪终点无效");
  if (startSeconds !== undefined && endSeconds !== undefined && startSeconds >= endSeconds) invalid("裁剪区间无效");
  if (targetSampleRate !== undefined && !(Number.isInteger(targetSampleRate) && targetSampleRate >= 4000 && targetSampleRate <= 192000)) invalid("采样率无效");
  if (bitrateKbps !== undefined && !(Number.isInteger(bitrateKbps) && bitrateKbps >= 32 && bitrateKbps <= 320)) invalid("MP3 比特率无效");

  let wave: WaveFile;
  try { wave = new WaveFile(Uint8Array.from(input)); }
  catch { invalid("音频输入不是有效的 WAV 数据"); }

  const fmt = wave.fmt as { numChannels: number; sampleRate: number };
  const numChannels = fmt.numChannels;
  const sourceSampleRate = fmt.sampleRate;
  if (!Number.isInteger(numChannels) || numChannels < 1 || numChannels > 2) invalid("仅支持单声道或双声道音频");
  if (!Number.isInteger(sourceSampleRate) || sourceSampleRate <= 0) invalid("音频采样率无效");

  const raw = wave.getSamples(false, Int16Array) as unknown as Int16Array | Int16Array[];
  const channels = numChannels === 1 ? [raw as Int16Array] : raw as Int16Array[];
  const totalSamples = channels[0]?.length ?? 0;
  if (totalSamples === 0 || totalSamples > maxSamplesPerChannel) invalid("音频时长无效或超出限制");

  const startSample = startSeconds !== undefined ? Math.round(startSeconds * sourceSampleRate) : 0;
  const endSample = endSeconds !== undefined ? Math.round(endSeconds * sourceSampleRate) : totalSamples;
  if (startSample < 0 || endSample > totalSamples || startSample >= endSample) invalid("裁剪区间超出音频长度");
  const trimmed = channels.map(channel => channel.subarray(startSample, endSample));

  signal?.throwIfAborted();
  const output = new WaveFile();
  output.fromScratch(numChannels, sourceSampleRate, "16", numChannels === 1 ? trimmed[0] : trimmed);
  if (targetSampleRate !== undefined && targetSampleRate !== sourceSampleRate) output.toSampleRate(targetSampleRate);
  const finalSampleRate = targetSampleRate ?? sourceSampleRate;

  if (options.format === "wav") return { data: output.toBuffer(), mimeType: mimeTypes.wav };

  signal?.throwIfAborted();
  const pcm = output.getSamples(false, Int16Array) as unknown as Int16Array | Int16Array[];
  const pcmChannels = numChannels === 1 ? [pcm as Int16Array] : pcm as Int16Array[];
  const frames = pcmChannels[0]!.length;
  const encoder = new Mp3Encoder(numChannels, finalSampleRate, bitrateKbps ?? 128);
  const chunks: Uint8Array[] = [];
  for (let i = 0; i < frames; i += mp3BlockSize) {
    const chunk = numChannels === 2
      ? encoder.encodeBuffer(pcmChannels[0]!.subarray(i, i + mp3BlockSize), pcmChannels[1]!.subarray(i, i + mp3BlockSize))
      : encoder.encodeBuffer(pcmChannels[0]!.subarray(i, i + mp3BlockSize));
    if (chunk.length) chunks.push(new Uint8Array(chunk));
  }
  const flushed = encoder.flush();
  if (flushed.length) chunks.push(new Uint8Array(flushed));
  const size = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  if (size === 0) invalid("MP3 编码失败");
  const data = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { data.set(chunk, offset); offset += chunk.length; }
  return { data, mimeType: mimeTypes.mp3 };
}
