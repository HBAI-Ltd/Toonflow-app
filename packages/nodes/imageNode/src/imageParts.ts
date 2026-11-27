import { packLocalTensor, unpackLocalTensor, type LocalModelClient } from "@toonflow/plugin-server/localModelClient";

export type PartsOptions = { operation: "lineArt"; ink: "black" | "white" } | { operation: "animeMask"; part: number };
type Source = { width: number; height: number; rgba: Uint8Array | Uint8ClampedArray };

export async function predictParts(image: Source, line: boolean, run: LocalModelClient["run"], signal: AbortSignal, side = 512) {
  const { width, height, rgba } = image;
  const scale = Math.min(side / Math.min(width, height), 2 * side / Math.max(width, height));
  const sw = Math.max(1, Math.round(width * scale)), sh = Math.max(1, Math.round(height * scale));
  const w = Math.ceil(sw / 64) * 64, h = Math.ceil(sh / 64) * 64, area = w * h;
  const input = new Float32Array(3 * area);
  for (let y = 0; y < h; y++) {
    const sy = Math.min(height - 1, Math.floor((Math.min(sh - 1, y) + 0.5) * height / sh));
    for (let x = 0; x < w; x++) {
      const sx = Math.min(width - 1, Math.floor((Math.min(sw - 1, x) + 0.5) * width / sw));
      const at = (sy * width + sx) * 4, alpha = rgba[at + 3]! / 255;
      for (let c = 0; c < 3; c++) input[c * area + y * w + x] = (rgba[at + c]! * alpha + 255 * (1 - alpha)) / (line ? 1 : 255);
    }
  }
  const outputName = line ? "edge_fused" : "parts";
  const result = await run({ id: line ? "teed" : "animeFace", inputs: {
    rgb: packLocalTensor("float32", [1, 3, h, w], input),
  }, outputs: [outputName] }, signal);
  const tensor = result.outputs[outputName];
  if (tensor?.type !== "float32" || tensor.dims.join() !== [1, line ? 1 : 7, h, w].join()) throw new Error("模型输出与原图不匹配");
  const bytes = unpackLocalTensor(tensor);
  const values = new Float32Array(bytes.buffer, bytes.byteOffset, bytes.byteLength / 4);
  const map = new Uint8ClampedArray(area);
  for (let i = 0; i < area; i++) {
    if (line) {
      const edge = 1 / (1 + Math.exp(-values[i]!));
      map[i] = 255 * edge;
    } else {
      let part = 0;
      for (let c = 1; c < 7; c++) if (values[c * area + i]! > values[part * area + i]!) part = c;
      map[i] = part;
    }
  }
  return { w, sw, sh, map };
}

export function renderParts(image: Source, options: PartsOptions, prediction: Awaited<ReturnType<typeof predictParts>>) {
  const { width, height, rgba } = image;
  const { w, sw, sh, map } = prediction;
  const line = options.operation === "lineArt";
  function sample(i: number) {
    if (options.operation === "animeMask") return map[i] === options.part ? 255 : 0;
    return options.ink === "black" ? 255 - map[i]! : map[i]!;
  }
  const out = new Uint8Array(width * height * 4);
  for (let y = 0; y < height; y++) {
    const fy = Math.max(0, (y + 0.5) * sh / height - 0.5), y0 = Math.floor(fy), dy = fy - y0;
    for (let x = 0; x < width; x++) {
      const fx = Math.max(0, (x + 0.5) * sw / width - 0.5), x0 = Math.floor(fx), dx = fx - x0;
      const a = y0 * w + x0, b = y0 * w + Math.min(sw - 1, x0 + 1);
      const n = Math.min(sh - 1, y0 + 1) * w - y0 * w;
      const v = Math.round((sample(a) * (1-dx) + sample(b) * dx) * (1-dy) + (sample(a+n) * (1-dx) + sample(b+n) * dx) * dy);
      const i = (y * width + x) * 4;
      out[i] = out[i+1] = out[i+2] = v;
      out[i+3] = line ? rgba[i+3]! : 255;
    }
  }
  return out;
}
