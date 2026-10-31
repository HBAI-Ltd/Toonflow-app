export type PcmFormat = "u8" | "s16le" | "s24le" | "s32le" | "f32le" | "s16be" | "s24be" | "s32be" | "f32be";

export const pcmFormats: { value: PcmFormat; label: string }[] = [
  { value: "u8", label: "8 位无符号" },
  { value: "s16le", label: "16 位整数（小端）" },
  { value: "s24le", label: "24 位整数（小端）" },
  { value: "s32le", label: "32 位整数（小端）" },
  { value: "f32le", label: "32 位浮点（小端）" },
  { value: "s16be", label: "16 位整数（大端）" },
  { value: "s24be", label: "24 位整数（大端）" },
  { value: "s32be", label: "32 位整数（大端）" },
  { value: "f32be", label: "32 位浮点（大端）" },
];

export interface PcmOptions {
  sampleRate: number;
  channels: number;
  format: PcmFormat;
}

export function isPcmMimeType(mimeType = "") {
  return ["audio/pcm", "audio/x-pcm", "audio/l16", "audio/l24"].includes(mimeType.split(";")[0]!.trim().toLowerCase());
}

export function getPcmOptions(options: Partial<PcmOptions>): PcmOptions | undefined {
  const { sampleRate, channels, format } = options;
  if (!Number.isInteger(sampleRate) || sampleRate! < 1 || sampleRate! > 384000
    || !Number.isInteger(channels) || channels! < 1 || channels! > 32
    || !pcmFormats.some(item => item.value === format)) return;
  return { sampleRate: sampleRate!, channels: channels!, format: format! };
}

const sampleBytes: Record<PcmFormat, number> = { u8: 1, s16le: 2, s24le: 3, s32le: 4, f32le: 4, s16be: 2, s24be: 3, s32be: 4, f32be: 4 };

export function pcmToWav(buffer: ArrayBuffer, options: PcmOptions): Blob {
  const { sampleRate, channels, format } = options;
  const bytesPerSample = sampleBytes[format];
  if (typeof format !== "string" || !Number.isInteger(bytesPerSample)) throw new RangeError("不支持的 PCM 采样格式");
  if (!Number.isInteger(sampleRate) || sampleRate < 1 || sampleRate > 0xffffffff) throw new RangeError("PCM 采样率必须为正整数");
  const outputBits = format === "u8" ? 8 : 16;
  const blockAlign = channels * outputBits / 8;
  if (!Number.isInteger(channels) || channels < 1 || blockAlign > 0xffff) throw new RangeError("PCM 声道数超出 WAV 范围");
  const byteRate = sampleRate * blockAlign;
  if (byteRate > 0xffffffff) throw new RangeError("PCM 字节率超出 WAV 范围");
  if (!(buffer instanceof ArrayBuffer) || !buffer.byteLength || buffer.byteLength % (channels * bytesPerSample)) throw new RangeError("PCM 数据为空或包含不完整采样帧");
  const dataSize = buffer.byteLength / bytesPerSample * outputBits / 8;
  const padding = dataSize % 2;
  if (36 + dataSize + padding > 0xffffffff) throw new RangeError("PCM 数据超出 RIFF 4 GiB 范围");

  // ACT: u8/s16le 直接封装，其他格式降为 16 位；整文件内存转换，大文件需改为流式转码。
  const wave = new ArrayBuffer(44 + dataSize + padding);
  const output = new DataView(wave);
  output.setUint32(0, 0x52494646); // RIFF
  output.setUint32(4, 36 + dataSize + padding, true);
  output.setUint32(8, 0x57415645); // WAVE
  output.setUint32(12, 0x666d7420); // fmt
  output.setUint32(16, 16, true);
  output.setUint16(20, 1, true);
  output.setUint16(22, channels, true);
  output.setUint32(24, sampleRate, true);
  output.setUint32(28, byteRate, true);
  output.setUint16(32, blockAlign, true);
  output.setUint16(34, outputBits, true);
  output.setUint32(36, 0x64617461); // data
  output.setUint32(40, dataSize, true);

  if (format === "u8" || format === "s16le") {
    new Uint8Array(wave, 44, dataSize).set(new Uint8Array(buffer));
    return new Blob([wave], { type: "audio/wav" });
  }
  const input = new DataView(buffer);
  const littleEndian = format.endsWith("le");
  for (let offset = 0, outputOffset = 44; offset < buffer.byteLength; offset += bytesPerSample, outputOffset += 2) {
    let sample: number;
    if (format.startsWith("f32")) {
      const value = input.getFloat32(offset, littleEndian);
      const clamped = Number.isFinite(value) ? Math.max(-1, Math.min(1, value)) : 0;
      sample = Math.round(clamped * (clamped < 0 ? 32768 : 32767));
    } else if (bytesPerSample === 2) {
      sample = input.getInt16(offset, littleEndian);
    } else if (bytesPerSample === 3) {
      const low = input.getUint8(offset + (littleEndian ? 0 : 2));
      const middle = input.getUint8(offset + 1);
      const high = input.getUint8(offset + (littleEndian ? 2 : 0));
      sample = ((low | middle << 8 | high << 16) << 8) >> 16;
    } else {
      sample = input.getInt32(offset, littleEndian) >> 16;
    }
    output.setInt16(outputOffset, sample, true);
  }
  return new Blob([wave], { type: "audio/wav" });
}
