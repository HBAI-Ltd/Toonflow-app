import { packLocalTensor, unpackLocalTensor, type LocalModelClient } from "@toonflow/plugin-server/localModelClient";

export const upscaleScales = [2, 3, 4] as const;

export async function predictUpscaleTile(input: Float32Array, run: LocalModelClient["run"], signal: AbortSignal) {
  const tensor = packLocalTensor("float32", [1, 3, 64, 64], input);
  const result = await run({ id: "realEsrgan", inputs: { "input.1": tensor }, outputs: ["1895"] }, signal);
  signal.throwIfAborted();
  const output = result.outputs["1895"];
  if (output?.type !== "float32" || output.dims.join(",") !== "1,3,256,256") throw new Error("模型输出尺寸或格式与图片不符");
  const bytes = unpackLocalTensor(output);
  if (bytes.byteLength !== 3 * 256 * 256 * 4) throw new Error("模型输出数据不完整");
  return new Float32Array(bytes.buffer, bytes.byteOffset, bytes.byteLength / 4);
}

export function fitsUpscaleSize(width: number, height: number, scale: number) {
  const w = width * scale, h = height * scale;
  return w * h <= 48_000_000 && Math.max(w, h) <= 32767;
}

// 这份 ONNX 固定输入 64 × 64、原生输出 256 × 256。相邻图块预留 8 像素上下文，只拼接中间部分。
function tileSpans(length: number) {
  const spans = [];
  for (let start = 0; start < length;) {
    const left = start ? 8 : 0;
    const size = length - start <= 64 - left ? length - start : 64 - left - 8;
    const origin = length < 64 ? -Math.floor((64 - length) / 2) : Math.min(length - 64, start - left);
    spans.push({ start, size, origin });
    start += size;
  }
  return spans;
}

function sampleSpan(length: number, point: number) {
  const index = Math.max(0, Math.min(length - 1, point));
  return tileSpans(length).find(span => index >= span.start && index < span.start + span.size)!;
}

export function getUpscaleSample(width: number, height: number, point: { x: number; y: number }) {
  const x = sampleSpan(width, point.x), y = sampleSpan(height, point.y);
  return { x: x.start, y: y.start, width: x.size, height: y.size,
    inputX: Math.max(0, x.origin), inputY: Math.max(0, y.origin), inputWidth: Math.min(64, width), inputHeight: Math.min(64, height) };
}

// 以 1/scale 个原生输出像素为单位，目标像素在每个方向上正好覆盖 4 个单位。
// 图块均与原图的整数坐标对齐；按覆盖面积缩小，图块边缘也能使用完整的采样区间。
function resample(native: Uint8ClampedArray, width: number, height: number, scale: number) {
  if (scale === 4) return new Uint8Array(native.buffer, native.byteOffset, native.byteLength);
  const w = width * scale, h = height * scale;
  const rgb = new Uint8Array(w * h * 3);
  for (let y = 0; y < h; y++) {
    const top = y * 4, bottom = top + 4;
    for (let x = 0; x < w; x++) {
      const left = x * 4, right = left + 4;
      let r = 0, g = 0, b = 0;
      for (let sy = Math.floor(top / scale); sy * scale < bottom; sy++) {
        const wy = Math.min(bottom, (sy + 1) * scale) - Math.max(top, sy * scale);
        for (let sx = Math.floor(left / scale); sx * scale < right; sx++) {
          const weight = wy * (Math.min(right, (sx + 1) * scale) - Math.max(left, sx * scale));
          const i = (sy * width * 4 + sx) * 3;
          r += weight * native[i]!;
          g += weight * native[i + 1]!;
          b += weight * native[i + 2]!;
        }
      }
      const i = (y * w + x) * 3;
      rgb[i] = Math.round(r / 16);
      rgb[i + 1] = Math.round(g / 16);
      rgb[i + 2] = Math.round(b / 16);
    }
  }
  return rgb;
}

type UpscaleOptions = {
  channels: 3 | 4;
  scale: number;
  signal: AbortSignal;
  infer: (input: Float32Array) => Promise<Float32Array>;
};

export async function* upscaleTiles(pixels: Uint8Array | Uint8ClampedArray, width: number, height: number, options: UpscaleOptions) {
  const { channels, scale, signal, infer } = options;
  if (!Number.isSafeInteger(width) || !Number.isSafeInteger(height) || width <= 0 || height <= 0 || pixels.length !== width * height * channels) {
    throw new Error("原图尺寸与像素数据不匹配");
  }
  if (!upscaleScales.some(value => value === scale)) throw new Error("输出倍率可选 2、3 或 4 倍");
  if (!fitsUpscaleSize(width, height, scale)) throw new Error("输出尺寸超过上限，请降低倍率或裁剪原图");
  const columns = tileSpans(width), rows = tileSpans(height);
  const total = columns.length * rows.length;
  let completed = 0;
  for (const y of rows) {
    for (const x of columns) {
      signal.throwIfAborted();
      const input = new Float32Array(64 * 64 * 3);
      for (let py = 0; py < 64; py++) {
        const sy = Math.max(0, Math.min(height - 1, y.origin + py));
        for (let px = 0; px < 64; px++) {
          const sx = Math.max(0, Math.min(width - 1, x.origin + px));
          const i = (sy * width + sx) * channels, j = py * 64 + px;
          for (let c = 0; c < 3; c++) input[c * 4096 + j] = pixels[i + c]! / 255;
        }
      }
      const prediction = await infer(input);
      signal.throwIfAborted();
      if (prediction.length !== 3 * 256 * 256) throw new Error("超分模型输出尺寸与图块不符");
      const native = new Uint8ClampedArray(x.size * y.size * 16 * 3);
      const left = (x.start - x.origin) * 4, top = (y.start - y.origin) * 4;
      for (let py = 0; py < y.size * 4; py++) {
        for (let px = 0; px < x.size * 4; px++) {
          const i = (py * x.size * 4 + px) * 3, j = (top + py) * 256 + left + px;
          for (let c = 0; c < 3; c++) native[i + c] = prediction[c * 65536 + j]! * 255;
        }
      }
      yield { x: x.start * scale, y: y.start * scale, width: x.size * scale, height: y.size * scale,
        rgb: resample(native, x.size, y.size, scale), completed: ++completed, total };
    }
  }
}
