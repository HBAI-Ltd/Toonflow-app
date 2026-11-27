import { IconLayersIntersect } from "@tabler/icons-vue";
import { packLocalTensor, unpackLocalTensor, type LocalModelTensor } from "@toonflow/nodes-scaffold/nodeModel";
import type { MediaTool, MediaToolContext } from "@toonflow/node-shared/mediaTools";
import { readImageBitmap } from "./imageCanvas";
import { imageTypes } from "./imageSequenceTools";

export const imageAlignmentTool: MediaTool = { id: "alignReference", modelId: "xfeat", group: "修图", label: "对齐两张图片", icon: IconLayersIntersect,
  sourceMimeTypes: imageTypes, accept: "image/*", attachmentLabel: "选择同一场景的参考图" };

interface Point { x: number; y: number; vector: Float32Array }
interface Match { a: Point; b: Point }
function tensorFloats(tensor: LocalModelTensor | undefined, shape: string) {
  if (tensor?.type !== "float32" || tensor.dims.join(",") !== shape) throw new Error("XFeat 特征图尺寸无效");
  const bytes = unpackLocalTensor(tensor);
  return new Float32Array(bytes.buffer, bytes.byteOffset, bytes.byteLength / 4);
}
async function features(image: ImageBitmap, context: MediaToolContext) {
  const canvas = document.createElement("canvas");
  canvas.width = 640; canvas.height = 480;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("无法读取图像");
  ctx.drawImage(image, 0, 0, 640, 480);
  const pixels = ctx.getImageData(0, 0, 640, 480).data;
  const area = 640 * 480, rgb = new Float32Array(area * 3);
  for (let c = 0; c < 3; c++) for (let i = 0; i < area; i++) rgb[c * area + i] = pixels[4 * i + c]! / 255;
  const { outputs } = await context.model.run({ id: "xfeat", inputs: { image: packLocalTensor("float32", [1, 3, 480, 640], rgb) } }, context.signal);
  const desc = tensorFloats(outputs.descriptor_map, "1,64,60,80"), logits = tensorFloats(outputs.keypoint_logits, "1,65,60,80");
  const reliability = tensorFloats(outputs.reliability, "1,1,60,80");
  const cells = 60 * 80, candidates = [];
  for (let i = 0; i < cells; i++) {
    let best = 0;
    for (let j = 1; j < 64; j++) if (logits[j * cells + i]! > logits[best * cells + i]!) best = j;
    let sum = 0;
    for (let j = 0; j < 65; j++) sum += Math.exp(logits[j * cells + i]! - logits[best * cells + i]!);
    const score = reliability[i]! / sum;
    if (1 / sum > 0.05 && score > 0.005) candidates.push({ i, best, score });
  }
  return candidates.sort((a, b) => b.score - a.score).slice(0, 384).map(({ i, best }) => {
    const vector = new Float32Array(64);
    let norm = 0;
    for (let c = 0; c < 64; c++) { const value = desc[c * cells + i]!; vector[c] = value; norm += value * value; }
    norm = Math.sqrt(norm) || 1;
    for (let c = 0; c < 64; c++) vector[c] = vector[c]! / norm;
    return { x: (i % 80 * 8 + best % 8 + 0.5) * image.width / 640,
      y: (Math.floor(i / 80) * 8 + Math.floor(best / 8) + 0.5) * image.height / 480, vector };
  });
}

function matchPoints(source: Point[], target: Point[]) {
  const forward = new Int32Array(source.length).fill(-1), reverse = new Int32Array(target.length).fill(-1);
  const scores = new Float32Array(target.length).fill(-1);
  for (const [i, a] of source.entries()) {
    let best = -1, next = -1, match = -1;
    for (const [j, b] of target.entries()) {
      let score = 0;
      for (let c = 0; c < 64; c++) score += a.vector[c]! * b.vector[c]!;
      if (score > scores[j]!) { scores[j] = score; reverse[j] = i; }
      if (score > best) { next = best; best = score; match = j; } else next = Math.max(next, score);
    }
    if (best > 0.7 && 1 - best < (1 - next) * 0.82) forward[i] = match;
  }
  return source.flatMap((a, i) => forward[i]! >= 0 && reverse[forward[i]!] === i ? [{ a, b: target[forward[i]!]! }] : []);
}

function fit(pairs: Match[]) {
  let ax = 0, ay = 0, bx = 0, by = 0;
  for (const { a, b } of pairs) { ax += a.x; ay += a.y; bx += b.x; by += b.y; }
  ax /= pairs.length; ay /= pairs.length; bx /= pairs.length; by /= pairs.length;
  let dot = 0, cross = 0, sum = 0;
  for (const { a, b } of pairs) {
    const x = a.x - ax, y = a.y - ay;
    dot += x * (b.x - bx) + y * (b.y - by); cross += x * (b.y - by) - y * (b.x - bx); sum += x * x + y * y;
  }
  const c = dot / sum, s = cross / sum;
  return { c, s, dx: bx - c * ax + s * ay, dy: by - s * ax - c * ay };
}

export async function runImageAlignment(context: MediaToolContext) {
  if (context.attachments.length !== 1) throw new Error("请选择一张参考图");
  const image = await readImageBitmap(context, context.source.url);
  let reference: ImageBitmap | undefined;
  try {
    reference = await readImageBitmap(context, context.attachments[0]!);
    const a = await features(image, context);
    context.reportProgress?.(1, 3);
    const matches = matchPoints(a, await features(reference, context));
    context.reportProgress?.(2, 3);
    let inliers: Match[] = [];
    const tolerance = Math.max(3, Math.hypot(reference.width, reference.height) / 130) ** 2;
    // ACT: 两点确定平移、旋转及一致缩放。对前 48 个互相匹配的特征完整枚举，避免重复纹理支配变换。
    for (let i = 0; i < Math.min(matches.length, 48); i++) for (let j = 0; j < i; j++) {
      const { c, s, dx, dy } = fit([matches[i]!, matches[j]!]);
      const valid = matches.filter(({ a, b }) => (c * a.x - s * a.y + dx - b.x) ** 2 + (s * a.x + c * a.y + dy - b.y) ** 2 <= tolerance);
      if (valid.length > inliers.length) inliers = valid;
    }
    if (inliers.length < 5 || inliers.length < matches.length / 4) throw new Error("可靠的共同特征不足，请选择视角更接近的参考图");
    const { c, s, dx, dy } = fit(inliers);
    const canvas = document.createElement("canvas");
    canvas.width = reference.width; canvas.height = reference.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("无法创建对齐画面");
    ctx.setTransform(c, s, -s, c, dx, dy); ctx.drawImage(image, 0, 0);
    const png = await new Promise<Blob>((resolve, reject) => canvas.toBlob(data => data ? resolve(data) : reject(new Error("图片编码失败")), "image/png"));
    context.signal.throwIfAborted();
    const path = context.outputDirectory + "/aligned.png";
    await context.workspace.write(path, png, true);
    return [{ path, mimeType: "image/png", label: imageAlignmentTool.label }];
  } finally { image.close(); reference?.close(); }
}
