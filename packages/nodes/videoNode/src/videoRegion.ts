type RegionValues = { x: number; y: number; width: number; height: number };

export const subtitleRegion = { x: 5, y: 65, width: 90, height: 33 };

export function patchFeather(width: number, height: number, box: { x: number; y: number; w: number; h: number }) {
  const edge = Math.min(12, Math.floor(Math.min(box.w, box.h) / 12));
  return { left: box.x > 0 ? edge : 0, right: box.x + box.w < width - 1 ? edge : 0,
    top: box.y > 0 ? edge : 0, bottom: box.y + box.h < height - 1 ? edge : 0 };
}

export function maskRegion(width: number, height: number, values: RegionValues, margin: number) {
  const x = Math.max(margin, Math.floor(width * values.x / 200) * 2);
  const y = Math.max(margin, Math.floor(height * values.y / 200) * 2);
  const w = Math.floor(Math.min(width * values.width / 100, width - x - margin) / 2) * 2;
  const h = Math.floor(Math.min(height * values.height / 100, height - y - margin) / 2) * 2;
  return { x, y, w, h };
}

export function cropSize(width: number, height: number, ratio: string, scale = 100) {
  const [a, b] = ratio.split("/").map(Number);
  return {
    w: Math.max(2, 2 * Math.floor(Math.min(width, height * a / b) * scale / 200)),
    h: Math.max(2, 2 * Math.floor(Math.min(height, width * b / a) * scale / 200)),
  };
}
