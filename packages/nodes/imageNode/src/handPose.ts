import { packLocalTensor, unpackLocalTensor, type LocalModelClient, type LocalModelTensor } from "@toonflow/plugin-server/localModelClient";

type ImagePixels = { width: number; height: number; rgba: Uint8Array };
type Point = { x: number; y: number };
type Crop = { x: number; y: number; xx: number; xy: number; yx: number; yy: number };
type Palm = { x: number; y: number; w: number; h: number; score: number; points: Point[] };

function sampleCrop(image: ImagePixels, side: number, crop: Crop) {
  const data = new Float32Array(side * side * 3), { width, height, rgba } = image;
  for (let row = 0; row < side; row++) for (let col = 0; col < side; col++) {
    const x = crop.x + (col + 0.5) * crop.xx + (row + 0.5) * crop.yx - 0.5;
    const y = crop.y + (col + 0.5) * crop.xy + (row + 0.5) * crop.yy - 0.5;
    if (x < -0.5 || y < -0.5 || x >= width - 0.5 || y >= height - 0.5) continue;
    const px = Math.max(0, x), py = Math.max(0, y), left = Math.floor(px), top = Math.floor(py), dx = px - left, dy = py - top;
    for (let ky = 0; ky < 2; ky++) for (let kx = 0; kx < 2; kx++) {
      const src = (Math.min(height - 1, top + ky) * width + Math.min(width - 1, left + kx)) * 4;
      const weight = (kx ? dx : 1 - dx) * (ky ? dy : 1 - dy) * rgba[src + 3]! / 65025;
      const dst = (row * side + col) * 3;
      for (let c = 0; c < 3; c++) data[dst + c] = data[dst + c]! + rgba[src + c]! * weight;
    }
  }
  return packLocalTensor("float32", [1, side, side, 3], data);
}

function floats(tensor: LocalModelTensor | undefined, count: number) {
  if (tensor?.type !== "float32" || tensor.dims.reduce((a, b) => a * b, 1) !== count) throw new Error("手部模型返回的关键点尺寸无效");
  const bytes = unpackLocalTensor(tensor);
  if (bytes.byteLength !== count * 4) throw new Error("手部模型返回的数据不完整");
  return new Float32Array(bytes.buffer, bytes.byteOffset, count);
}

async function detectPalms(image: ImagePixels, run: LocalModelClient["run"], signal: AbortSignal) {
  const side = 192, max = Math.max(image.width, image.height), scale = max / side;
  const x = (image.width - max) / 2, y = (image.height - max) / 2;
  const input = sampleCrop(image, side, { x, y, xx: scale, xy: 0, yx: 0, yy: scale });
  const { outputs } = await run({ id: "palmDetection", inputs: { input_1: input }, outputs: ["Identity", "Identity_1"] }, signal);
  const boxes = floats(outputs.Identity, 2016 * 18), scores = floats(outputs.Identity_1, 2016);
  const candidates: Palm[] = [];
  let index = 0;
  for (const [grid, copies] of [[24, 2], [12, 6]] as const) {
    for (let row = 0; row < grid; row++) for (let col = 0; col < grid; col++) for (let k = 0; k < copies; k++, index++) {
      const score = scores[index]!;
      if (!Number.isFinite(score) || score < 0) continue; // sigmoid(logit) ≥ 0.5
      const base = index * 18, ax = x + (col + 0.5) * max / grid, ay = y + (row + 0.5) * max / grid;
      const w = boxes[base + 2]! * scale, h = boxes[base + 3]! * scale;
      const points = Array.from({ length: 7 }, (_, j) => ({ x: ax + boxes[base + 4 + j * 2]! * scale, y: ay + boxes[base + 5 + j * 2]! * scale }));
      if (!(w > 0 && h > 0) || !points.every(p => Number.isFinite(p.x) && Number.isFinite(p.y))) continue;
      candidates.push({ x: ax + boxes[base]! * scale - w / 2, y: ay + boxes[base + 1]! * scale - h / 2, w, h, score, points });
    }
  }
  const palms: Palm[] = [];
  for (const palm of candidates.sort((a, b) => b.score - a.score)) {
    const overlaps = palms.some(other => {
      const w = Math.max(0, Math.min(palm.x + palm.w, other.x + other.w) - Math.max(palm.x, other.x));
      const h = Math.max(0, Math.min(palm.y + palm.h, other.y + other.h) - Math.max(palm.y, other.y));
      const area = w * h;
      return area > 0.3 * (palm.w * palm.h + other.w * other.h - area);
    });
    if (!overlaps) palms.push(palm);
  }
  return palms;
}

function handCrop(points: Point[]): Crop | undefined {
  const wrist = points[0]!, middle = points[2]!;
  const dx = middle.x - wrist.x, dy = middle.y - wrist.y, distance = Math.hypot(dx, dy);
  if (distance < 1) return;
  const c = -dy / distance, s = dx / distance;
  const xs = points.map(p => p.x * c + p.y * s), ys = points.map(p => -p.x * s + p.y * c);
  const left = Math.min(...xs), right = Math.max(...xs), top = Math.min(...ys), bottom = Math.max(...ys);
  const span = Math.max(right - left, bottom - top) * 3, scale = span / 224;
  const x = (left + right - span) / 2, y = (top + bottom - span) / 2 - 0.4 * (bottom - top);
  return { x: x * c - y * s, y: x * s + y * c, xx: c * scale, xy: s * scale, yx: -s * scale, yy: c * scale };
}

const fingers = [[0, 1, 2, 3, 4], [0, 5, 6, 7, 8], [5, 9, 10, 11, 12], [9, 13, 14, 15, 16], [13, 17, 18, 19, 20], [17, 0]];
const colors = [[255, 87, 80], [247, 179, 61], [77, 203, 118], [47, 174, 241], [183, 113, 243], [183, 113, 243]];
function drawHand(pixels: Uint8Array, width: number, height: number, points: Point[]) {
  const size = Math.max(...points.map(p => Math.hypot(p.x - points[0]!.x, p.y - points[0]!.y)));
  const radius = Math.max(1, size / 75);
  function stroke(a: Point, b: Point, r: number, rgb: number[]) {
    const dx = b.x - a.x, dy = b.y - a.y, length = dx * dx + dy * dy;
    const top = Math.max(0, Math.floor(Math.min(a.y, b.y) - r - 1)), bottom = Math.min(height - 1, Math.ceil(Math.max(a.y, b.y) + r + 1));
    const left = Math.max(0, Math.floor(Math.min(a.x, b.x) - r - 1)), right = Math.min(width - 1, Math.ceil(Math.max(a.x, b.x) + r + 1));
    for (let y = top; y <= bottom; y++) for (let x = left; x <= right; x++) {
      const t = length ? Math.max(0, Math.min(1, ((x - a.x) * dx + (y - a.y) * dy) / length)) : 0;
      const coverage = Math.min(1, r + 0.5 - Math.hypot(x - a.x - t * dx, y - a.y - t * dy));
      if (coverage <= 0) continue;
      const i = (y * width + x) * 4, prev = pixels[i + 3]! / 255 * (1 - coverage), alpha = coverage + prev;
      for (let c = 0; c < 3; c++) pixels[i + c] = Math.round((coverage * rgb[c]! + prev * pixels[i + c]!) / alpha);
      pixels[i + 3] = Math.round(alpha * 255);
    }
  }
  fingers.forEach((joints, group) => {
    for (let i = 1; i < joints.length; i++) stroke(points[joints[i - 1]!]!, points[joints[i]!]!, radius, colors[group]!);
  });
  for (const joint of points) stroke(joint, joint, radius * 1.6, [255, 255, 255]);
}

export async function makeHandPosePixels(image: ImagePixels, run: LocalModelClient["run"], progress: (completed: number, total: number) => void, signal: AbortSignal) {
  progress(0, 1);
  const palms = await detectPalms(image, run, signal);
  const pixels = new Uint8Array(image.width * image.height * 4);
  let count = 0;
  for (const [i, palm] of palms.entries()) {
    signal.throwIfAborted();
    progress(i + 1, palms.length + 1);
    const crop = handCrop(palm.points);
    if (!crop) continue;
    const input = sampleCrop(image, 224, crop);
    const { outputs } = await run({ id: "handPose", inputs: { input_1: input }, outputs: ["Identity", "Identity_1"] }, signal);
    if (!(floats(outputs.Identity_1, 1)[0]! >= 0.8)) continue;
    const raw = floats(outputs.Identity, 63);
    const points = Array.from({ length: 21 }, (_, j) => {
      const x = raw[j * 3]!, y = raw[j * 3 + 1]!;
      return { x: crop.x + x * crop.xx + y * crop.yx, y: crop.y + x * crop.xy + y * crop.yy };
    });
    if (!points.every(p => Number.isFinite(p.x) && Number.isFinite(p.y))) throw new Error("手部模型返回了无效坐标");
    drawHand(pixels, image.width, image.height, points);
    count++;
  }
  if (!count) throw new Error("未识别到清晰的手部，请选用手掌更大、遮挡较少的图片");
  progress(palms.length + 1, palms.length + 1);
  return pixels;
}
