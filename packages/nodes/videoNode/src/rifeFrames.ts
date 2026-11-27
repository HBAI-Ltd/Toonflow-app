import { packLocalTensor, unpackLocalTensor, type LocalModelClient } from "@toonflow/plugin-server/localModelClient";
import { localModelTensorBytes } from "@toonflow/plugin-server/localModelInference";

const timestep = packLocalTensor("float32", [1, 1, 1, 1], new Float32Array([0.5]));

export async function interpolateFramePair(first: Uint8Array, second: Uint8Array, width: number, height: number,
  run: LocalModelClient["run"], signal: AbortSignal) {
  const middle = new Uint8Array(width * height * 3);
  // 两个 RGB 张量共用推理请求的容量上限。较大的画面保留相邻块的上下文，只写回中心区域。
  const single = Math.ceil(width / 64) * 64 * Math.ceil(height / 64) * 64 * 24 + 4 <= localModelTensorBytes;
  const stepX = single ? width : 1280, stepY = single ? height : 1280;
  for (let y = 0; y < height; y += stepY) {
    for (let x = 0; x < width; x += stepX) {
      signal.throwIfAborted();
      const left = Math.max(0, x - 64), top = Math.max(0, y - 64);
      const right = Math.min(width, x + stepX + 64), bottom = Math.min(height, y + stepY + 64);
      const w = Math.ceil((right - left) / 64) * 64, h = Math.ceil((bottom - top) / 64) * 64, area = w * h;
      function tensor(pixels: Uint8Array) {
        const values = new Float32Array(3 * area);
        for (let row = 0; row < h; row++) {
          const start = Math.min(top + row, bottom - 1) * width;
          for (let col = 0; col < w; col++) {
            const src = 3 * (start + Math.min(left + col, right - 1)), dst = row * w + col;
            for (let c = 0; c < 3; c++) values[c * area + dst] = pixels[src + c] / 255;
          }
        }
        return packLocalTensor("float32", [1, 3, h, w], values);
      }
      const result = await run({ id: "rife", inputs: { img0: tensor(first), img1: tensor(second), timestep }, outputs: ["frame"] }, signal);
      signal.throwIfAborted();
      const frame = result.outputs.frame;
      if (!frame || frame.type !== "float32" || frame.dims.join(",") !== [1, 3, h, w].join(",")) throw new Error("补帧模型返回的画面尺寸无效");
      const bytes = unpackLocalTensor(frame);
      const values = new Float32Array(bytes.buffer, bytes.byteOffset, area * 3);
      for (let row = y; row < Math.min(y + stepY, height); row++) {
        for (let col = x; col < Math.min(x + stepX, width); col++) {
          const src = (row - top) * w + col - left, dst = (row * width + col) * 3;
          for (let c = 0; c < 3; c++) middle[dst + c] = Math.round(255 * Math.min(1, Math.max(0, values[c * area + src])));
        }
      }
    }
  }
  return middle;
}
