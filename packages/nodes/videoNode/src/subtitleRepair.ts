import { packLocalTensor, unpackLocalTensor, type LocalModelClient } from "@toonflow/plugin-server/localModelClient";
import { detectSubtitleLines, pixelRect, type PercentRect, type PixelRect } from "./videoTextDetection";
import { subtitleMask } from "./subtitleMask";

// 找不到可修补的笔画时返回原缓冲区，预览和整段处理共用这个结果判断。
export async function restoreSubtitleFrame(frame: Uint8Array, width: number, height: number, area: PercentRect,
  run: LocalModelClient["run"], signal: AbortSignal): Promise<Uint8Array> {
  const lines = await detectSubtitleLines(frame, width, height, area, run, signal);
  if (!lines.length) return frame;
  const region = pixelRect(width, height, area);
  const mask = new Uint8Array(region.w * region.h);
  let left = width, top = height, right = 0, bottom = 0;
  for (const line of lines) {
    signal.throwIfAborted();
    const strokes = subtitleMask(frame, width, height, line);
    for (let y = 0; y < line.h; y++) {
      const offset = (line.y + y - region.y) * region.w + line.x - region.x;
      for (let x = 0; x < line.w; x++) {
        const alpha = strokes[y * line.w + x]!;
        if (!alpha) continue;
        mask[offset + x] = Math.max(mask[offset + x]!, alpha);
        left = Math.min(left, line.x + x);
        right = Math.max(right, line.x + x + 1);
        top = Math.min(top, line.y + y);
        bottom = Math.max(bottom, line.y + y + 1);
      }
    }
  }
  if (right <= left) return frame;
  const result = new Uint8Array(frame);
  // 长字幕分块，保留周边画面供修补，所有块都从同一张原帧取样。
  const tileSize = 448, padding = 64;
  for (let y = top; y < bottom; y += tileSize) {
    for (let x = left; x < right; x += tileSize) {
      signal.throwIfAborted();
      const tile = { x, y, w: Math.min(tileSize, right - x), h: Math.min(tileSize, bottom - y) };
      const startX = Math.max(0, x - padding), startY = Math.max(0, y - padding);
      const crop = { x: startX, y: startY, w: Math.min(width, x + tile.w + padding) - startX, h: Math.min(height, y + tile.h + padding) - startY };
      await repairTile(frame, result, width, tile, crop, mask, region, run, signal);
    }
  }
  return result;
}

async function repairTile(frame: Uint8Array, result: Uint8Array, width: number, tile: PixelRect, crop: PixelRect,
  mask: Uint8Array, region: PixelRect, run: LocalModelClient["run"], signal: AbortSignal) {
  const size = crop.w * crop.h, keep = new Uint8Array(size).fill(255);
  let hasStrokes = false;
  for (let y = Math.max(region.y, crop.y); y < Math.min(region.y + region.h, crop.y + crop.h); y++) {
    for (let x = Math.max(region.x, crop.x); x < Math.min(region.x + region.w, crop.x + crop.w); x++) {
      if (!mask[(y - region.y) * region.w + x - region.x]) continue;
      keep[(y - crop.y) * crop.w + x - crop.x] = 0;
      if (x >= tile.x && x < tile.x + tile.w && y >= tile.y && y < tile.y + tile.h) hasStrokes = true;
    }
  }
  if (!hasStrokes) return;
  const image = new Uint8Array(size * 3);
  for (let y = 0; y < crop.h; y++) {
    let source = ((crop.y + y) * width + crop.x) * 3;
    for (let x = 0; x < crop.w; x++) {
      const i = y * crop.w + x;
      image[i] = frame[source++]!;
      image[size + i] = frame[source++]!;
      image[2 * size + i] = frame[source++]!;
    }
  }
  const dims = [1, 3, crop.h, crop.w];
  const { outputs } = await run({ id: "migan", inputs: {
    image: packLocalTensor("uint8", dims, image), mask: packLocalTensor("uint8", [1, 1, crop.h, crop.w], keep),
  }, outputs: ["result"] }, signal);
  signal.throwIfAborted();
  const tensor = outputs.result;
  if (tensor?.type !== "uint8" || tensor.dims.join(",") !== dims.join(",")) throw new Error("模型输出尺寸或格式与图片不符");
  const pixels = unpackLocalTensor(tensor);
  if (pixels.length !== image.length) throw new Error("模型输出数据不完整");
  for (let y = tile.y; y < tile.y + tile.h; y++) {
    for (let x = tile.x; x < tile.x + tile.w; x++) {
      const alpha = mask[(y - region.y) * region.w + x - region.x]! / 255;
      if (!alpha) continue;
      const i = (y - crop.y) * crop.w + x - crop.x, target = (y * width + x) * 3;
      for (let c = 0; c < 3; c++) {
        result[target + c] = Math.round(frame[target + c]! * (1 - alpha) + pixels[c * size + i]! * alpha);
      }
    }
  }
}
