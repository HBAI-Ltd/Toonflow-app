import { packLocalTensor, unpackLocalTensor, type LocalModelClient, type LocalModelTensor } from "@toonflow/plugin-server/localModelClient";
import { samplingAxis } from "./videoSubject";

type Axis = ReturnType<typeof samplingAxis>;

function sample(data: Uint8Array | Float32Array, width: number, x: Axis, y: Axis, col: number, row: number, step: number, offset: number) {
  const top = y.low[row]! * width, bottom = y.high[row]! * width, fy = y.fraction[row]!;
  const left = x.low[col]!, right = x.high[col]!, fx = x.fraction[col]!;
  return (data[(top + left) * step + offset]! * (1 - fx) + data[(top + right) * step + offset]! * fx) * (1 - fy)
    + (data[(bottom + left) * step + offset]! * (1 - fx) + data[(bottom + right) * step + offset]! * fx) * fy;
}

function outputPlane(tensor: LocalModelTensor | undefined, channels: number, width: number, height: number) {
  if (tensor?.type !== "float32" || tensor.dims.join(",") !== [1, channels, height, width].join(",")) throw new Error("人像抠像模型返回了无效的画面尺寸");
  const bytes = unpackLocalTensor(tensor);
  if (bytes.length !== width * height * channels * 4) throw new Error("人像抠像模型返回的数据不完整");
  return new Float32Array(bytes.buffer, bytes.byteOffset, bytes.byteLength / 4);
}

export function createPortraitMatting(width: number, height: number, mode: "transparent" | "mask", run: LocalModelClient["run"], signal: AbortSignal) {
  // 大画幅保留原片细节，只在受限尺寸估计透明度及边缘去色，返回像素始终与原片对齐。
  const scale = Math.min(1, 1920 / Math.max(width, height), Math.sqrt(2_073_600 / (width * height)));
  const w = Math.max(32, Math.round(width * scale)), h = Math.max(32, Math.round(height * scale)), area = w * h;
  const originalSize = width === w && height === h;
  const dx = samplingAxis(width, w), dy = samplingAxis(height, h), ux = samplingAxis(w, width), uy = samplingAxis(h, height);
  const input = new Float32Array(3 * area);
  const ratio = packLocalTensor("float32", [1], Float32Array.of(Math.min(1, Math.max(512 / Math.max(w, h), 16 / Math.min(w, h)))));
  const zero = packLocalTensor("float32", [1, 1, 1, 1], new Float32Array(1));
  const state = { r1i: zero, r2i: zero, r3i: zero, r4i: zero };
  const outputs = ["pha", "r1o", "r2o", "r3o", "r4o", ...(mode === "transparent" ? ["fgr"] : [])];
  return async (frame: Uint8Array) => {
    signal.throwIfAborted();
    if (frame.length !== width * height * 3) throw new Error("人像抠像需要完整的视频帧");
    for (let row = 0; row < h; row++) for (let col = 0; col < w; col++) {
      const i = row * w + col;
      for (let c = 0; c < 3; c++) input[c * area + i] = (originalSize ? frame[i * 3 + c]! : sample(frame, width, dx, dy, col, row, 3, c)) / 255;
    }
    const response = await run({ id: "rvmMobileNet", inputs: { src: packLocalTensor("float32", [1, 3, h, w], input), downsample_ratio: ratio, ...state }, outputs }, signal);
    signal.throwIfAborted();
    const tensors = response.outputs;
    const alpha = outputPlane(tensors.pha, 1, w, h);
    const foreground = mode === "transparent" ? outputPlane(tensors.fgr, 3, w, h) : undefined;
    for (const [i, key] of (["r1i", "r2i", "r3i", "r4i"] as const).entries()) {
      const next = tensors[`r${i + 1}o`];
      if (next?.type !== "float32" || next.dims.length !== 4 || next.dims[0] !== 1) throw new Error("人像抠像模型未返回连续帧状态");
      state[key] = next;
    }
    const pixels = new Uint8ClampedArray(width * height * (foreground ? 4 : 1));
    // 在缩小图上取得前景与原色的差值，再放大这一修正，保留原始分辨率的头发和衣物纹理。
    if (foreground && !originalSize) for (let i = 0; i < foreground.length; i++) foreground[i] = foreground[i]! - input[i]!;
    for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
      const i = y * width + x, a = originalSize ? alpha[i]! : sample(alpha, w, ux, uy, x, y, 1, 0);
      if (!Number.isFinite(a)) throw new Error("人像抠像模型返回了无效的透明度");
      if (foreground) {
        for (let c = 0; c < 3; c++) pixels[i * 4 + c] = originalSize ? foreground[c * area + i]! * 255 : frame[i * 3 + c]! + 255 * sample(foreground, w, ux, uy, x, y, 1, c * area);
        pixels[i * 4 + 3] = 255 * a;
      } else pixels[i] = 255 * a;
    }
    return new Uint8Array(pixels.buffer);
  };
}
