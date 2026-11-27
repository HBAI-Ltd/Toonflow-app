import { packLocalTensor, unpackLocalTensor, type LocalModelClient } from "@toonflow/plugin-server/localModelClient";

export type NormalOptions = { convention: "openGl" | "directX"; strength: number };
const tileSize = 256, stride = 192, area = tileSize * tileSize;

export async function predictNormals(gray: Float32Array, run: LocalModelClient["run"], signal: AbortSignal) {
  const request = { id: "deepBump", inputs: { input: packLocalTensor("float32", [1, 1, tileSize, tileSize], gray) } };
  const { outputs } = await run(request, signal);
  signal.throwIfAborted();
  const [tensor] = Object.values(outputs);
  if (tensor?.type !== "float32" || tensor.dims.join(",") !== "1,3,256,256") throw new Error("法线模型返回了无效的贴图尺寸");
  const bytes = unpackLocalTensor(tensor);
  if (bytes.length !== area * 12) throw new Error("法线贴图数据不完整");
  return new Float32Array(bytes.buffer, bytes.byteOffset, area * 3);
}

export function storeNormal(output: Uint8ClampedArray, at: number, x: number, y: number, z: number, options: NormalOptions) {
  x *= options.strength;
  y *= options.convention === "directX" ? -options.strength : options.strength;
  const length = Math.hypot(x, y, z);
  if (!Number.isFinite(length)) throw new Error("法线贴图包含无效像素");
  output[at] = length ? (x / length + 1) * 127.5 : 128;
  output[at + 1] = length ? (y / length + 1) * 127.5 : 128;
  output[at + 2] = length ? (z / length + 1) * 127.5 : 255;
}

export async function makeNormalPixels(image: { width: number; height: number; rgba: Uint8Array }, options: NormalOptions,
  run: LocalModelClient["run"], onProgress: (completed: number, total: number) => void, signal: AbortSignal) {
  const { width, height, rgba } = image;
  const output = new Uint8ClampedArray(rgba.length);
  // 只保留一个图块高度的混合缓冲区。相邻图块重叠 64px，边界从纹理另一侧循环取样。
  const band = new Float32Array(Math.min(height, tileSize) * width * 3);
  const gray = new Float32Array(area);
  const weight = Float32Array.from({ length: tileSize }, (_, x) => Math.min(1, (x + 0.5) / 64, (tileSize - x - 0.5) / 64));
  const total = Math.ceil(width / stride) * Math.ceil(height / stride);
  let completed = 0, flushed = 0;
  onProgress(0, total);
  for (let row = 0; row < height; row += stride) {
    const top = row - 32;
    for (let column = 0; column < width; column += stride) {
      signal.throwIfAborted();
      const left = column - 32;
      for (let y = 0; y < tileSize; y++) {
        const srcRow = ((top + y) % height + height) % height * width;
        for (let x = 0; x < tileSize; x++) {
          const i = 4 * (srcRow + ((left + x) % width + width) % width);
          gray[y * tileSize + x] = (rgba[i]! + rgba[i + 1]! + rgba[i + 2]!) / 765;
        }
      }
      const tile = await predictNormals(gray, run, signal);
      for (let y = Math.max(0, -top); y < Math.min(tileSize, height - top); y++) {
        const offset = (top + y) % tileSize * width;
        for (let x = Math.max(0, -left); x < Math.min(tileSize, width - left); x++) {
          const src = y * tileSize + x, dst = 3 * (offset + left + x), w = weight[x]! * weight[y]!;
          band[dst] = band[dst]! + (tile[src]! - 0.5) * w;
          band[dst + 1] = band[dst + 1]! + (tile[src + area]! - 0.5) * w;
          band[dst + 2] = band[dst + 2]! + (tile[src + area * 2]! - 0.5) * w;
        }
      }
      onProgress(++completed, total);
    }
    const end = row + stride >= height ? height : top + stride;
    for (; flushed < end; flushed++) {
      const base = flushed % tileSize * width * 3;
      for (let x = 0; x < width; x++) {
        const src = base + x * 3, dst = (flushed * width + x) * 4;
        storeNormal(output, dst, band[src]!, band[src + 1]!, band[src + 2]!, options);
        output[dst + 3] = rgba[dst + 3]!;
      }
      band.fill(0, base, base + width * 3);
    }
  }
  return new Uint8Array(output.buffer);
}
