import type { PixelRect } from "./videoTextDetection";

// 笔画的两侧通常都和中心有色差，背景单侧的轮廓一般不会同时符合。
function strokeContrast(frame: Uint8Array, p: number, a: number, b: number) {
  let contrast = 0;
  for (let c = 0; c < 3; c++) {
    const middle = frame[p + c]!, left = frame[a + c]!, right = frame[b + c]!;
    contrast = Math.max(contrast, middle - Math.max(left, right), Math.min(left, right) - middle);
  }
  return contrast;
}

// 按 1/3 像素记录倒角距离，只关心笔画周围几像素。
function spread(distance: Uint8Array, width: number, height: number) {
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const i = y * width + x;
    let d = distance[i]!;
    if (x) d = Math.min(d, distance[i - 1]! + 3);
    if (y) {
      d = Math.min(d, distance[i - width]! + 3);
      if (x) d = Math.min(d, distance[i - width - 1]! + 4);
      if (x + 1 < width) d = Math.min(d, distance[i - width + 1]! + 4);
    }
    distance[i] = d;
  }
  for (let y = height - 1; y >= 0; y--) for (let x = width - 1; x >= 0; x--) {
    const i = y * width + x;
    let d = distance[i]!;
    if (x + 1 < width) d = Math.min(d, distance[i + 1]! + 3);
    if (y + 1 < height) {
      d = Math.min(d, distance[i + width]! + 3);
      if (x) d = Math.min(d, distance[i + width - 1]! + 4);
      if (x + 1 < width) d = Math.min(d, distance[i + width + 1]! + 4);
    }
    distance[i] = d;
  }
}

export function subtitleMask(frame: Uint8Array, width: number, height: number, box: PixelRect): Uint8Array {
  const { x: left, y: top, w, h } = box;
  const area = w * h, mask = new Uint8Array(area), contrast = new Uint8Array(area);
  const votes = new Float64Array(4096), columns = new Uint16Array(4096), marginCounts = new Uint32Array(4096);
  const radius = Math.max(2, Math.min(12, Math.round(h * 0.1)));
  const radii = [1, radius];
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const sx = x + left, sy = y + top, p = (sy * width + sx) * 3;
    let strength = 0;
    for (const r of radii) {
      const x0 = Math.max(0, sx - r), x1 = Math.min(width - 1, sx + r);
      const y0 = Math.max(0, sy - r) * width, y1 = Math.min(height - 1, sy + r) * width;
      strength = Math.max(strength,
        strokeContrast(frame, p, (sy * width + x0) * 3, (sy * width + x1) * 3),
        strokeContrast(frame, p, (y0 + sx) * 3, (y1 + sx) * 3),
        strokeContrast(frame, p, (y0 + x0) * 3, (y1 + x1) * 3),
        strokeContrast(frame, p, (y0 + x1) * 3, (y1 + x0) * 3));
    }
    contrast[y * w + x] = strength;
    const bin = ((frame[p]! >> 4) << 8) | ((frame[p + 1]! >> 4) << 4) | (frame[p + 2]! >> 4);
    const edge = Math.min((y + 0.5) / h, (h - y - 0.5) / h);
    if (edge < 0.15) marginCounts[bin]!++;
    if (strength < 20) continue;
    if (edge < 0.15) {
      // 检测框含有外扩留白，集中在上下边缘的颜色通常来自背景。
      votes[bin]! -= strength * 0.8;
    } else {
      votes[bin]! += strength * Math.min(1, edge * 4);
      columns[bin]! |= 1 << Math.min(15, Math.floor(x * 16 / w));
    }
  }

  const palette: { red: number; green: number; blue: number; columns: number; score: number }[] = [];
  for (let bin = 0; bin < votes.length; bin++) {
    if (votes[bin]! <= 0) continue;
    let count = 0;
    for (let bits = columns[bin]!; bits; bits &= bits - 1) count++;
    palette.push({ red: (bin >> 8) * 16 + 8, green: ((bin >> 4) & 15) * 16 + 8, blue: (bin & 15) * 16 + 8,
      columns: columns[bin]!, score: votes[bin]! * (0.4 + 0.6 * count / 16) / (1 + 36 * marginCounts[bin]! / area) });
  }
  palette.sort((a, b) => b.score - a.score);
  const primary = palette[0];
  if (!primary) return mask;
  const secondary = palette.find(color => color.score >= primary.score * 0.12
    && Math.max(Math.abs(color.red - primary.red), Math.abs(color.green - primary.green), Math.abs(color.blue - primary.blue)) > 65);
  const firstDistance = new Uint8Array(area).fill(255), secondDistance = secondary && new Uint8Array(area).fill(255);
  const firstColor = new Uint8Array(area), secondColor = secondary && new Uint8Array(area);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = y * w + x, p = ((top + y) * width + left + x) * 3;
    const r = frame[p]!, g = frame[p + 1]!, b = frame[p + 2]!;
    firstColor[i] = Math.max(Math.abs(r - primary.red), Math.abs(g - primary.green), Math.abs(b - primary.blue));
    if (firstColor[i]! <= 34 && contrast[i]! >= 20) firstDistance[i] = 0;
    if (secondary && secondColor && secondDistance) {
      secondColor[i] = Math.max(Math.abs(r - secondary.red), Math.abs(g - secondary.green), Math.abs(b - secondary.blue));
      if (secondColor[i]! <= 34 && contrast[i]! >= 20) secondDistance[i] = 0;
    }
  }
  spread(firstDistance, w, h);
  // spread 的单位是 1/3 像素；字心和描边按实际像素距离配对，避免粗描边只擦掉中间一圈。
  const reach = radius * 3, pairReach = Math.max(2, Math.round(h * 0.22)) * 3;
  let outlined = false;
  if (secondDistance) {
    spread(secondDistance, w, h);
    let first = 0, second = 0, firstNear = 0, secondNear = 0;
    for (let i = 0; i < area; i++) {
      if (firstDistance[i] === 0) { first++; if (secondDistance[i]! <= pairReach) firstNear++; }
      if (secondDistance[i] === 0) { second++; if (firstDistance[i]! <= pairReach) secondNear++; }
    }
    // 反复相邻的两种颜色往往是字心和描边。这时不把远离字形的同色背景纳入蒙版。
    outlined = firstNear > first * 0.35 && secondNear > second * 0.35 && (firstNear > first * 0.7 || secondNear > second * 0.7);
  }
  const separate = secondary && (secondary.columns & ~primary.columns) !== 0 && secondary.score > primary.score * 0.3;
  for (let i = 0; i < area; i++) {
    const first = firstDistance[i]! <= reach && firstColor[i]! <= 42 && (!outlined || secondDistance![i]! <= pairReach);
    const second = secondDistance && secondColor && secondDistance[i]! <= reach && secondColor[i]! <= 42
      && (outlined ? firstDistance[i]! <= pairReach : separate);
    mask[i] = first || second ? 0 : 255;
  }
  spread(mask, w, h);
  // ACT: 对无可靠描边配色的文字，按行高估计细描边宽度；超宽投影可能超出蒙版。
  const outline = outlined ? 1.35 : Math.max(1.4, Math.min(7, h * 0.055));
  for (let i = 0; i < area; i++) mask[i] = Math.round(255 * Math.max(0, Math.min(1, outline + 1 - mask[i]! / 3)));
  return mask;
}
