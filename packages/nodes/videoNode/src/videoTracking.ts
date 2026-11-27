import type { LocalModelClient, LocalModelTensor } from "@toonflow/plugin-server/localModelClient";
import { floats, imageTensor, pixelRect, type PercentRect, type PixelRect } from "./videoTextDetection";

function square(box: PixelRect, factor: number) {
  const side = Math.ceil(Math.sqrt(box.w * box.h) * factor);
  return { x: Math.trunc(box.x + (box.w - side) / 2), y: Math.trunc(box.y + (box.h - side) / 2), w: side, h: side };
}

export function createTargetTracker(width: number, height: number, region: PercentRect, run: LocalModelClient["run"], signal: AbortSignal) {
  let box = pixelRect(width, height, region), template: LocalModelTensor | undefined;
  const hann = Array.from({ length: 16 }, (_, i) => (1 - Math.cos(2 * Math.PI * (i + 1) / 17)) / 2);
  return async (frame: Uint8Array) => {
    if (!template) template = imageTensor(frame, width, height, square(box, 2), 128, 128, "imagenet");
    else {
      const crop = square(box, 4);
      const { outputs } = await run({ id: "vitTrack", inputs: { template, search: imageTensor(frame, width, height, crop, 256, 256, "imagenet") } }, signal);
      const confidence = floats(outputs.output1), size = floats(outputs.output2), offset = floats(outputs.output3);
      if (confidence.length !== 256 || size.length !== 512 || offset.length !== 512) throw new Error("跟踪模型返回的尺寸无效");
      let best = 0, max = -1;
      for (let i = 0; i < 256; i++) {
        const score = confidence[i]! * hann[i % 16]! * hann[Math.floor(i / 16)]!;
        if (score > max) { best = i; max = score; }
      }
      if (max < 0.2) throw new Error("目标离开画面或被遮挡，请截取连续可见的片段重试");
      const w = Math.max(2, Math.round(size[best]! * crop.w)), h = Math.max(2, Math.round(size[best + 256]! * crop.h));
      const x = Math.max(0, Math.min(width - 1, Math.round(crop.x + (best % 16 + offset[best]!) * crop.w / 16 - w / 2)));
      const y = Math.max(0, Math.min(height - 1, Math.round(crop.y + (Math.floor(best / 16) + offset[best + 256]!) * crop.h / 16 - h / 2)));
      box = { x, y, w: Math.min(width - x, w), h: Math.min(height - y, h) };
    }
    // 在目标框内铺马赛克，跟踪丢失时终止输出，避免发布遗漏遮挡的成片。
    const block = Math.max(6, Math.ceil(Math.min(box.w, box.h) / 9));
    for (let by = box.y; by < box.y + box.h; by += block) for (let bx = box.x; bx < box.x + box.w; bx += block) {
      const ex = Math.min(box.x + box.w, bx + block), ey = Math.min(box.y + box.h, by + block);
      const sample = (Math.floor((by + ey - 1) / 2) * width + Math.floor((bx + ex - 1) / 2)) * 3;
      const r = frame[sample]!, g = frame[sample + 1]!, b = frame[sample + 2]!;
      for (let y = by; y < ey; y++) for (let x = bx; x < ex; x++) {
        const at = (y * width + x) * 3; frame[at] = r; frame[at + 1] = g; frame[at + 2] = b;
      }
    }
    return frame;
  };
}
