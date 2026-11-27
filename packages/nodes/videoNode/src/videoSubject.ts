import { packLocalTensor, unpackLocalTensor, type LocalModelClient } from "@toonflow/plugin-server/localModelClient";

type SubjectAspect = "portrait" | "square" | "fourFive";
export type SubjectOptions = { operation: "reframe"; aspect: SubjectAspect; smooth: number } | { operation: "blurBackground"; radius: number };

export function getSubjectFrameSize(width: number, height: number, aspect: SubjectAspect) {
  const unit = { portrait: [18, 32], square: [2, 2], fourFive: [8, 10] } as const;
  const [w, h] = unit[aspect];
  const multiple = Math.floor(Math.min(width / w, height / h));
  if (!multiple) throw new Error("源画面太小，无法按所选比例裁切");
  return { width: w * multiple, height: h * multiple };
}

export function samplingAxis(source: number, target: number) {
  const low = new Int32Array(target), high = new Int32Array(target), fraction = new Float32Array(target);
  for (let i = 0; i < target; i++) {
    const position = Math.max(0, Math.min(source - 1, (i + 0.5) * source / target - 0.5));
    low[i] = Math.floor(position);
    high[i] = Math.min(source - 1, low[i]! + 1);
    fraction[i] = position - low[i]!;
  }
  return { low, high, fraction };
}

// 两次可分离盒式模糊近似柔焦。先缩小背景再双线性还原，工作内存随画幅而非模糊半径增长。
function blurLine(input: Uint8Array, output: Uint8Array, length: number, step: number, offset: number, radius: number) {
  const divisor = 2 * radius + 1;
  for (let channel = 0; channel < 3; channel++) {
    const base = offset + channel;
    let sum = 0;
    for (let i = -radius; i <= radius; i++) sum += input[base + Math.min(length - 1, Math.max(0, i)) * step]!;
    for (let i = 0; i < length; i++) {
      output[base + i * step] = Math.round(sum / divisor);
      sum += input[base + Math.min(length - 1, i + radius + 1) * step]! - input[base + Math.max(0, i - radius) * step]!;
    }
  }
}

function createBackgroundBlur(width: number, height: number, radius: number) {
  const factor = Math.max(1, Math.floor(radius / 3));
  const w = Math.ceil(width / factor), h = Math.ceil(height / factor);
  const blurRadius = Math.max(1, Math.round(radius / factor / Math.SQRT2));
  const color = new Uint8Array(w * h * 3), scratch = new Uint8Array(color.length);
  const x = samplingAxis(w, width), y = samplingAxis(h, height);
  return (source: Uint8Array, mask: Float32Array, maskSize: number) => {
    // 每个小方格平均采样原图颜色，避免细线、字幕在模糊背景里产生闪烁。
    for (let row = 0; row < h; row++) {
      const top = row * factor, bottom = Math.min(height, top + factor);
      for (let col = 0; col < w; col++) {
        const left = col * factor, right = Math.min(width, left + factor), count = (bottom - top) * (right - left);
        let r = 0, g = 0, b = 0;
        for (let yy = top; yy < bottom; yy++) for (let xx = left; xx < right; xx++) {
          const i = (yy * width + xx) * 3;
          r += source[i]!; g += source[i + 1]!; b += source[i + 2]!;
        }
        const at = (row * w + col) * 3;
        color[at] = Math.round(r / count); color[at + 1] = Math.round(g / count); color[at + 2] = Math.round(b / count);
      }
    }
    for (let pass = 0; pass < 2; pass++) {
      for (let row = 0; row < h; row++) blurLine(color, scratch, w, 3, row * w * 3, blurRadius);
      for (let col = 0; col < w; col++) blurLine(scratch, color, h, w * 3, col * 3, blurRadius);
    }
    const mx = samplingAxis(maskSize, width), my = samplingAxis(maskSize, height);
    const result = new Uint8Array(source.length);
    for (let row = 0; row < height; row++) {
      const row0 = y.low[row]! * w, row1 = y.high[row]! * w, fy = y.fraction[row]!;
      const aRow = my.low[row]! * maskSize, bRow = my.high[row]! * maskSize, wy = my.fraction[row]!;
      for (let col = 0; col < width; col++) {
        const i = 3 * (row * width + col);
        const left = mx.low[col]!, right = mx.high[col]!, wx = mx.fraction[col]!;
        const top = mask[aRow + left]! * (1 - wx) + mask[aRow + right]! * wx;
        const bottom = mask[bRow + left]! * (1 - wx) + mask[bRow + right]! * wx;
        const alpha = Math.min(1, Math.max(0, top * (1 - wy) + bottom * wy));
        const x0 = x.low[col]!, x1 = x.high[col]!, fx = x.fraction[col]!;
        for (let c = 0; c < 3; c++) {
          const upper = color[3 * (row0 + x0) + c]! * (1 - fx) + color[3 * (row0 + x1) + c]! * fx;
          const lower = color[3 * (row1 + x0) + c]! * (1 - fx) + color[3 * (row1 + x1) + c]! * fx;
          result[i + c] = Math.round(source[i + c]! * alpha + (upper * (1 - fy) + lower * fy) * (1 - alpha));
        }
      }
    }
    return result;
  };
}

export function createSubjectMasker(width: number, height: number, run: LocalModelClient["run"], signal: AbortSignal) {
  const side = 1024, area = side * side;
  if (!Number.isSafeInteger(width) || !Number.isSafeInteger(height) || width < 1 || height < 1) throw new Error("视频尺寸无效");
  const x = samplingAxis(width, side), y = samplingAxis(height, side);
  const input = new Float32Array(area * 3);
  return async (frame: Uint8Array) => {
    signal.throwIfAborted();
    if (frame.length !== width * height * 3) throw new Error("主体分割需要完整的 RGB 视频帧");
    for (let row = 0; row < side; row++) {
      const top = y.low[row]! * width, bottom = y.high[row]! * width, fy = y.fraction[row]!;
      for (let col = 0; col < side; col++) {
        const left = x.low[col]!, right = x.high[col]!, fx = x.fraction[col]!;
        for (let c = 0; c < 3; c++) {
          const upper = frame[3 * (top + left) + c]! * (1 - fx) + frame[3 * (top + right) + c]! * fx;
          const lower = frame[3 * (bottom + left) + c]! * (1 - fx) + frame[3 * (bottom + right) + c]! * fx;
          input[c * area + row * side + col] = (upper * (1 - fy) + lower * fy) / 255;
        }
      }
    }
    const { outputs } = await run({ id: "ormbg", inputs: { input: packLocalTensor("float32", [1, 3, side, side], input) }, outputs: ["output"] }, signal);
    signal.throwIfAborted();
    const tensor = outputs.output;
    if (tensor?.type !== "float32" || tensor.dims.join(",") !== "1,1,1024,1024") throw new Error("主体分割模型返回的蒙版尺寸无效");
    const bytes = unpackLocalTensor(tensor);
    if (bytes.byteLength !== area * 4) throw new Error("主体分割模型返回的蒙版不完整");
    const mask = new Float32Array(bytes.buffer, bytes.byteOffset, area);
    let min = Infinity, max = -Infinity;
    for (const value of mask) { min = Math.min(min, value); max = Math.max(max, value); }
    if (!Number.isFinite(min) || !Number.isFinite(max)) throw new Error("主体分割模型返回了无效的像素");
    // ACT: 保留低置信度整帧的原概率，避免把空镜头的微小噪声拉伸成完整前景。
    if (max - min > 0.1) for (let i = 0; i < mask.length; i++) mask[i] = (mask[i]! - min) / (max - min);
    return mask;
  };
}

export function createSubjectRenderer(width: number, height: number, options: SubjectOptions) {
  const side = 1024;
  if (options.operation === "blurBackground") {
    if (!Number.isInteger(options.radius) || options.radius < 2 || options.radius > 48) throw new Error("虚化半径须为 2 到 48 像素");
    const blur = createBackgroundBlur(width, height, options.radius);
    return (frame: Uint8Array, mask: Float32Array) => blur(frame, mask, side);
  }
  const crop = getSubjectFrameSize(width, height, options.aspect), smooth = options.smooth;
  if (!Number.isFinite(smooth) || smooth < 0 || smooth > 100) throw new Error("跟踪平滑度须为 0 到 100");
  let center: { x: number; y: number } | undefined;
  return (frame: Uint8Array, mask: Float32Array) => {
    let weight = 0, sumX = 0, sumY = 0;
    for (let row = 4; row < side; row += 8) for (let col = 4; col < side; col += 8) {
      const alpha = Math.max(0, mask[row * side + col]! - 0.5);
      weight += alpha; sumX += alpha * col; sumY += alpha * row;
    }
    if (weight > 1) {
      const targetX = sumX / weight / side * width, targetY = sumY / weight / side * height;
      const inertia = 0.94 * smooth / 100;
      // 镜头切换或主体快速移动时，限制平滑产生的滞后，保证目标仍在输出画幅内。
      center = { x: targetX + Math.max(-crop.width * 0.35, Math.min(crop.width * 0.35, ((center?.x ?? targetX) - targetX) * inertia)),
        y: targetY + Math.max(-crop.height * 0.35, Math.min(crop.height * 0.35, ((center?.y ?? targetY) - targetY) * inertia)) };
    }
    const left = Math.max(0, Math.min(width - crop.width, Math.round((center?.x ?? width / 2) - crop.width / 2)));
    const top = Math.max(0, Math.min(height - crop.height, Math.round((center?.y ?? height / 2) - crop.height / 2)));
    const result = new Uint8Array(crop.width * crop.height * 3);
    for (let row = 0; row < crop.height; row++) {
      const source = ((top + row) * width + left) * 3;
      result.set(frame.subarray(source, source + crop.width * 3), row * crop.width * 3);
    }
    return result;
  };
}

export function createSubjectProcessor(width: number, height: number, options: SubjectOptions, run: LocalModelClient["run"], signal: AbortSignal) {
  const segment = createSubjectMasker(width, height, run, signal);
  const render = createSubjectRenderer(width, height, options);
  return async (frame: Uint8Array) => render(frame, await segment(frame));
}
