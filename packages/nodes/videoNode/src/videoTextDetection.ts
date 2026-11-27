import { packLocalTensor, unpackLocalTensor, type LocalModelClient, type LocalModelTensor } from "@toonflow/plugin-server/localModelClient";

export interface PixelRect { x: number; y: number; w: number; h: number }
export interface PercentRect { x: number; y: number; width: number; height: number }
export function pixelRect(width: number, height: number, area: PercentRect): PixelRect {
  const x = Math.min(width - 1, Math.floor(width * area.x / 100)), y = Math.min(height - 1, Math.floor(height * area.y / 100));
  return { x, y, w: Math.max(1, Math.min(width - x, Math.round(width * area.width / 100))),
    h: Math.max(1, Math.min(height - y, Math.round(height * area.height / 100))) };
}

export function imageTensor(frame: Uint8Array | Uint8ClampedArray, width: number, height: number, rect: PixelRect, w: number, h: number,
  normalize: "imagenet" | "symmetric", channels = 3, paddedWidth = w) {
  const plane = paddedWidth * h, values = new Float32Array(3 * plane);
  const means = [0.485, 0.456, 0.406], deviations = [0.229, 0.224, 0.225];
  for (let y = 0; y < h; y++) {
    const sy = rect.y + Math.min(rect.h - 1, Math.floor((y + 0.5) * rect.h / h));
    for (let x = 0; x < w; x++) {
      const sx = rect.x + Math.min(rect.w - 1, Math.floor((x + 0.5) * rect.w / w));
      for (let c = 0; c < 3; c++) {
        const bgr = sx < 0 || sx >= width || sy < 0 || sy >= height ? 0 : frame[(sy * width + sx) * channels + 2 - c]! / 255;
        values[c * plane + y * paddedWidth + x] = normalize === "imagenet" ? (bgr - means[c]!) / deviations[c]! : bgr * 2 - 1;
      }
    }
  }
  return packLocalTensor("float32", [1, 3, h, paddedWidth], values);
}

export function floats(tensor: LocalModelTensor | undefined) {
  if (tensor?.type !== "float32") throw new Error("模型输出格式无效");
  const bytes = unpackLocalTensor(tensor);
  if (bytes.byteLength !== tensor.dims.reduce((a, b) => a * b, 4)) throw new Error("模型输出数据不完整");
  return new Float32Array(bytes.buffer, bytes.byteOffset, bytes.byteLength / 4);
}

export async function detectSubtitleLines(frame: Uint8Array | Uint8ClampedArray, width: number, height: number, area: PercentRect,
  run: LocalModelClient["run"], signal: AbortSignal, channels = 3) {
  const rect = pixelRect(width, height, area), ratio = Math.min(2, 960 / Math.max(rect.w, rect.h));
  const w = Math.max(32, Math.round(rect.w * ratio / 32) * 32), h = Math.max(32, Math.round(rect.h * ratio / 32) * 32);
  const { outputs } = await run({ id: "ppOcrV5Det", inputs: { x: imageTensor(frame, width, height, rect, w, h, "imagenet", channels) } }, signal);
  signal.throwIfAborted();
  const tensor = Object.values(outputs)[0], map = floats(tensor);
  if (tensor?.dims.join(",") !== [1, 1, h, w].join(",")) throw new Error("文字检测概率图尺寸无效");
  const stack = new Int32Array(w * h), boxes: PixelRect[] = [];
  for (let i = 0; i < map.length; i++) {
    if (!(map[i]! > 0.3)) continue;
    let count = 0, score = 0, first = 0, last = 1, left = w, top = h, right = 0, bottom = 0;
    stack[0] = i;
    score += map[i]!; map[i] = 0;
    function visit(p: number) { if (map[p]! > 0.3) { score += map[p]!; map[p] = 0; stack[last++] = p; } }
    while (first < last) {
      const p = stack[first++]!, x = p % w, y = Math.floor(p / w); count++;
      left = Math.min(left, x); right = Math.max(right, x); top = Math.min(top, y); bottom = Math.max(bottom, y);
      if (x > 0) visit(p - 1);
      if (x + 1 < w) visit(p + 1);
      if (y > 0) visit(p - w);
      if (y + 1 < h) visit(p + w);
    }
    if (count < 5 || score / count < 0.58 || bottom - top < 2) continue;
    const pad = Math.max(2, Math.round((bottom - top + 1) * 0.52));
    const x = Math.max(0, Math.floor((left - pad) * rect.w / w)), y = Math.max(0, Math.floor((top - pad) * rect.h / h));
    boxes.push({ x: rect.x + x, y: rect.y + y, w: Math.min(rect.w, Math.ceil((right + pad + 1) * rect.w / w)) - x,
      h: Math.min(rect.h, Math.ceil((bottom + pad + 1) * rect.h / h)) - y });
  }
  return boxes.sort((a, b) => a.y - b.y || a.x - b.x);
}
