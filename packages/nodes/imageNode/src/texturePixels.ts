export type TextureMode = "heightNormal" | "seamlessTile" | "removeMatte";
export type TextureValues = Record<string, number | string>;

export async function texturePixels(mode: TextureMode, source: ImageData, values: TextureValues,
  signal: AbortSignal, progress?: (done: number, total: number) => void) {
  const { width, height, data } = source;
  const output = new ImageData(width, height);
  const dst = output.data;
  const strength = Number(values.strength ?? 2);
  const band = Number(values.band ?? 12) / 100;
  const matte = values.matte === "black" ? 0 : 255;
  let hasSoftEdge = false;
  if (mode === "heightNormal" && (!Number.isFinite(strength) || strength < 0.1 || strength > 10)) throw new Error("凹凸强度无效");
  if (mode === "seamlessTile" && (!Number.isFinite(band) || band < 0.01 || band > 0.5)) throw new Error("接缝宽度无效");
  let lastYield = performance.now();
  function luminance(x: number, y: number) {
    const i = (Math.max(0, Math.min(height - 1, y)) * width + Math.max(0, Math.min(width - 1, x))) * 4;
    return (data[i]! * 0.2126 + data[i + 1]! * 0.7152 + data[i + 2]! * 0.0722) / 255;
  }
  function blend(distance: number, span: number) {
    const t = Math.max(0, 1 - distance / Math.max(1, span * band));
    return t * t * (3 - 2 * t) * 0.5;
  }
  for (let y = 0; y < height; y++) {
    const vertical = blend(Math.min(y, height-1-y), height);
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      if (mode === "heightNormal") {
        const nx = (luminance(x - 1, y) - luminance(x + 1, y)) * strength;
        const ny = (luminance(x, y + 1) - luminance(x, y - 1)) * strength * (values.convention === "directX" ? -1 : 1);
        const length = Math.hypot(nx, ny, 1);
        dst[i] = 127.5 * (1 + nx / length);
        dst[i+1] = 127.5 * (1 + ny / length);
        dst[i+2] = 127.5 * (1 + 1 / length);
        dst[i+3] = data[i+3]!;
      } else if (mode === "seamlessTile") {
        const horizontal = blend(Math.min(x, width-1-x), width);
        const right = (y * width + width - 1 - x) * 4;
        const lower = ((height - 1 - y) * width + x) * 4;
        const opposite = ((height - 1 - y) * width + width - 1 - x) * 4;
        // 在预乘透明度空间混合，以免透明边缘的黑色 RGB 渗入可见图案。
        const a = data[i+3]! * (1-horizontal) * (1-vertical), b = data[right+3]! * horizontal * (1-vertical);
        const c = data[lower+3]! * (1-horizontal) * vertical, d = data[opposite+3]! * horizontal * vertical;
        const alpha = a + b + c + d;
        dst[i+3] = alpha;
        if (alpha) for (let channel = 0; channel < 3; channel++) dst[i+channel] =
          (data[i+channel]! * a + data[right+channel]! * b + data[lower+channel]! * c + data[opposite+channel]! * d) / alpha;
      } else {
        const alpha = data[i+3]! / 255;
        if (alpha > 0 && alpha < 1) hasSoftEdge = true;
        for (let c = 0; c < 3; c++) dst[i+c] = alpha ? (data[i+c]! - (1-alpha) * matte) / alpha : 0;
        dst[i+3] = data[i+3]!;
      }
    }
    if (performance.now() - lastYield > 32) {
      signal.throwIfAborted();
      progress?.(y, height);
      await new Promise(resolve => setTimeout(resolve, 0));
      lastYield = performance.now();
    }
  }
  signal.throwIfAborted();
  if (mode === "removeMatte" && !hasSoftEdge) throw new Error("这张图没有半透明边缘，请选择保留了透明背景的抠图。");
  return output;
}
