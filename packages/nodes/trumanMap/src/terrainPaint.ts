import { gzipSync, Gunzip } from "three/addons/libs/fflate.module.js";
import type { SceneTerrain } from "./sceneDocument";
import { terrainSurfaceMaxId, terrainSurfaceOptions } from "./terrainSurfaces";

type TerrainPaintRecord = NonNullable<SceneTerrain["surfacePaint"]>;
type TerrainPaintStyle = NonNullable<TerrainPaintRecord["styles"]>[number];
export type TerrainPaintData = { segments: number; data: Uint8Array; version: number; styles?: TerrainPaintStyle[] };
type TerrainPaintCache = TerrainPaintData & { encoded: string; stylesKey: string; mix?: Float32Array; opacity?: Float32Array; dirty: boolean };
const terrainPaintCache = new WeakMap<TerrainPaintRecord, TerrainPaintCache>();
let lastValidatedPaint: { encoded: string; segments: number; stylesKey: string; data: Uint8Array } | undefined;
const terrainPaintMaxBytes = (1024 + 1) ** 2 * 4;
const terrainPaintMaxCompressedBytes = terrainPaintMaxBytes + 65536;
export const terrainPaintMaxEncodedLength = Math.ceil(terrainPaintMaxCompressedBytes / 3) * 4;
const crcTable = Uint32Array.from({ length: 256 }, (_, index) => { let value = index; for (let bit = 0; bit < 8; bit++) value = value & 1 ? 0xedb88320 ^ value >>> 1 : value >>> 1; return value >>> 0; });

function clamp(value: number, min: number, max: number) { return Math.min(max, Math.max(min, value)); }
function paintSegments(size: number) { return Math.min(1024, Math.max(256, 2 ** Math.ceil(Math.log2(size / 0.25)))); }
function validateTerrainPaintStyles(styles: TerrainPaintRecord["styles"]) {
  if (styles === undefined) return;
  if (!Array.isArray(styles) || !styles.length || styles.length > 256 || styles.some(style => !Number.isInteger(style.surface) || style.surface < 0 || style.surface > terrainSurfaceMaxId || !/^#[\da-f]{6}$/i.test(style.color))) throw new Error("地表样式须为1至256项合法材质与#rrggbb颜色");
}
function rememberTerrainPaint(paint: TerrainPaintRecord, cached: TerrainPaintCache) {
  if (cached.dirty || !paint.data) return;
  if (lastValidatedPaint?.encoded === paint.data && lastValidatedPaint.segments === paint.segments && lastValidatedPaint.stylesKey === cached.stylesKey) return;
  validateTerrainPaintStyles(paint.styles);
  const maxId = paint.styles ? paint.styles.length - 1 : terrainSurfaceMaxId;
  for (let offset = 0; offset < cached.data.length; offset += 4) if (cached.data[offset]! > maxId || cached.data[offset + 1]! > maxId) throw new Error("地表绘图包含未知样式");
  // ACT: 只保留最近一份已验证内容的不可变副本；新record命中后仍复制像素，绘制与撤销不能共享可变buffer。
  lastValidatedPaint = { encoded: paint.data, segments: paint.segments, stylesKey: cached.stylesKey, data: cached.data.slice() };
}
function decodeTerrainPaint(paint: TerrainPaintRecord, stylesKey: string): TerrainPaintCache {
  validateTerrainPaintStyles(paint.styles);
  if (![256, 512, 1024].includes(paint.segments)) throw new Error("地表绘图分辨率须为256、512或1024");
  if (!paint.data || paint.data.length > terrainPaintMaxEncodedLength || paint.data.length % 4 || !/^[A-Za-z0-9+/]+={0,2}$/.test(paint.data)) throw new Error("地表绘图压缩数据格式无效");
  const binary = atob(paint.data);
  if (binary.length < 18 || binary.length > terrainPaintMaxCompressedBytes) throw new Error("地表绘图压缩数据超出范围");
  const compressed = Uint8Array.from(binary, value => value.charCodeAt(0));
  if (compressed[0] !== 31 || compressed[1] !== 139 || compressed[2] !== 8 || compressed[3] !== 0) throw new Error("地表绘图须为单段无扩展头gzip");
  const expected = (paint.segments + 1) ** 2 * 4;
  const trailer = new DataView(compressed.buffer, compressed.byteOffset + compressed.length - 8, 8);
  if (expected > terrainPaintMaxBytes || trailer.getUint32(4, true) !== expected) throw new Error("地表绘图解压长度与分辨率不一致");
  const data = new Uint8Array(expected);
  let decoded = 0;
  let finished = false;
  // ACT: 以512字节压缩块流式解压，超过固定RGBA预算立即终止；不能相信可伪造的gzip ISIZE后无界解压。
  const decoder = new Gunzip((chunk, final) => {
    if (decoded + chunk.length > expected) throw new Error("地表绘图解压数据超出上限");
    data.set(chunk, decoded);
    decoded += chunk.length;
    finished = final;
  });
  decoder.onmember = () => { throw new Error("地表绘图不能包含多段gzip"); };
  for (let offset = 0; offset < compressed.length; offset += 512) decoder.push(compressed.subarray(offset, offset + 512), false);
  decoder.push(new Uint8Array(0), true);
  if (!finished || decoded !== expected) throw new Error("地表绘图解压长度不完整");
  let crc = 0xffffffff;
  const maxId = paint.styles ? paint.styles.length - 1 : terrainSurfaceMaxId;
  for (let index = 0; index < data.length; index++) {
    crc = crcTable[(crc ^ data[index]!) & 255]! ^ crc >>> 8;
    if (index % 4 < 2 && data[index]! > maxId) throw new Error("地表绘图包含未知材质");
  }
  if (((crc ^ 0xffffffff) >>> 0) !== trailer.getUint32(0, true)) throw new Error("地表绘图校验失败");
  const cached: TerrainPaintCache = { segments: paint.segments, data, styles: paint.styles, version: 0, encoded: paint.data, stylesKey, dirty: false };
  rememberTerrainPaint(paint, cached);
  return cached;
}

export function validateTerrainPaint(paint: TerrainPaintRecord): string | undefined {
  if (!paint.data) return "地表绘图压缩数据不能为空";
  try { getTerrainPaint({ surfacePaint: paint } as SceneTerrain); return undefined; }
  catch (error) { return error instanceof Error ? error.message : "地表绘图数据无效"; }
}

export function getTerrainPaint(terrain: SceneTerrain | undefined): TerrainPaintData | undefined {
  const paint = terrain?.surfacePaint;
  if (!paint) return undefined;
  const stylesKey = JSON.stringify(paint.styles ?? null);
  let cached = terrainPaintCache.get(paint);
  if (!cached || cached.encoded !== paint.data || cached.segments !== paint.segments || cached.stylesKey !== stylesKey) {
    cached = lastValidatedPaint?.encoded === paint.data && lastValidatedPaint.segments === paint.segments && lastValidatedPaint.stylesKey === stylesKey
      ? { segments: paint.segments, data: lastValidatedPaint.data.slice(), styles: paint.styles, version: 0, encoded: paint.data, stylesKey, dirty: false }
      : decodeTerrainPaint(paint, stylesKey);
    terrainPaintCache.set(paint, cached);
  }
  return cached;
}

export function flushTerrainPaint(terrain: SceneTerrain): void {
  const paint = terrain.surfacePaint;
  if (!paint) return;
  const cached = getTerrainPaint(terrain) as TerrainPaintCache;
  if (!cached.dirty && paint.data) { rememberTerrainPaint(paint, cached); return; }
  const compressed = gzipSync(cached.data, { level: 6, mtime: 0 });
  let binary = "";
  for (let offset = 0; offset < compressed.length; offset += 32768) binary += String.fromCharCode(...compressed.subarray(offset, offset + 32768));
  paint.data = btoa(binary);
  cached.encoded = paint.data;
  cached.dirty = false;
  rememberTerrainPaint(paint, cached);
}

export function paintTerrainSurface(terrain: SceneTerrain, position: { x: number; z: number }, surfaceId: number, radius: number, strength: number, deltaSeconds: number, options?: { color?: string; flow?: number; hardness?: number }): boolean {
  const flow = typeof options?.flow === "number" && Number.isFinite(options.flow) ? clamp(options.flow, 0, 1) : 1;
  if (![position.x, position.z, radius, strength, deltaSeconds].every(Number.isFinite) || radius <= 0 || strength <= 0 || deltaSeconds <= 0 || flow === 0 || !Number.isInteger(surfaceId) || surfaceId < 0 || surfaceId > terrainSurfaceMaxId || surfaceId === 38) return false;
  const color = options?.color ?? terrainSurfaceOptions[surfaceId]!.color;
  if (!/^#[\da-f]{6}$/i.test(color)) throw new Error("画笔颜色必须是#rrggbb格式");
  const brushColor = color.toLowerCase();
  const segments = terrain.surfacePaint?.segments ?? paintSegments(terrain.size);
  const width = segments + 1, spacing = terrain.size / segments;
  const minColumn = clamp(Math.ceil((position.x - radius + terrain.size / 2) / spacing), 0, segments);
  const maxColumn = clamp(Math.floor((position.x + radius + terrain.size / 2) / spacing), 0, segments);
  const minRow = clamp(Math.ceil((position.z - radius + terrain.size / 2) / spacing), 0, segments);
  const maxRow = clamp(Math.floor((position.z + radius + terrain.size / 2) / spacing), 0, segments);
  const hardness = typeof options?.hardness === "number" && Number.isFinite(options.hardness) ? clamp(options.hardness, 0, 1) : 0.35;
  const amount = clamp(strength, 0, 5) * flow * deltaSeconds * 8;
  let cached = getTerrainPaint(terrain) as TerrainPaintCache | undefined;
  let created = false, changed = false, stylesChanged = false;
  let styleIndex: number | undefined;
  for (let row = minRow; row <= maxRow; row++) for (let column = minColumn; column <= maxColumn; column++) {
    const distance = Math.hypot(column * spacing - terrain.size / 2 - position.x, row * spacing - terrain.size / 2 - position.z) / radius;
    if (distance >= 1) continue;
    const edge = hardness === 1 ? 1 : clamp((1 - distance) / (1 - hardness), 0, 1);
    const falloff = edge * edge * (3 - 2 * edge);
    const alpha = 1 - Math.exp(-amount * falloff);
    if (alpha <= 0) continue;
    if (!cached) {
      const data = new Uint8Array(width * width * 4);
      const styles = [{ surface: surfaceId, color: brushColor }];
      terrain.surfacePaint = { segments, data: "", styles };
      cached = { segments, data, styles, version: 0, encoded: "", stylesKey: JSON.stringify(styles), mix: new Float32Array(width * width), opacity: new Float32Array(width * width), dirty: true };
      terrainPaintCache.set(terrain.surfacePaint, cached);
      styleIndex = 0;
      created = true;
    }
    if (styleIndex === undefined) {
      const paint = terrain.surfacePaint!;
      const previous = paint.styles ?? terrainSurfaceOptions.map(surface => ({ surface: surface.id, color: (terrain.surfaceColors?.[String(surface.id)] ?? surface.color).toLowerCase() }));
      const found = previous.findIndex(style => style.surface === surfaceId && style.color.toLowerCase() === brushColor);
      if (found < 0 && previous.length >= 256) throw new Error("地表样式已达到256种上限，未改动已有涂刷");
      const styles = found < 0 ? [...previous, { surface: surfaceId, color: brushColor }] : previous;
      styleIndex = found < 0 ? previous.length : found;
      if (paint.styles !== styles) {
        paint.styles = styles;
        cached.styles = styles;
        cached.stylesKey = JSON.stringify(styles);
        stylesChanged = true;
      }
    }
    const count = width * width;
    cached.mix ??= new Float32Array(count);
    cached.opacity ??= new Float32Array(count).fill(-1);
    const index = row * width + column, offset = index * 4;
    let base = cached.data[offset]!, top = cached.data[offset + 1]!;
    const unread = cached.opacity[index]! < 0;
    const oldMix = unread ? cached.data[offset + 2]! / 255 : cached.mix[index]!;
    const oldOpacity = unread ? cached.data[offset + 3]! / 255 : cached.opacity[index]!;
    const opacity = oldOpacity + (1 - oldOpacity) * alpha;
    let mix = oldMix;
    if (oldOpacity === 0) { base = styleIndex; top = styleIndex; mix = 0; }
    else if (styleIndex === base) mix = oldOpacity * oldMix * (1 - alpha) / opacity;
    else if (styleIndex === top) mix = (oldOpacity * oldMix * (1 - alpha) + alpha) / opacity;
    else {
      // ACT: 每像素最多两种覆盖材质；第三种以已有覆盖中的主导材质承接旧总覆盖率，再叠新材质，舍弃旧少数材质。
      base = oldMix >= 0.5 ? top : base;
      top = styleIndex;
      mix = alpha / opacity;
    }
    if (base === top) mix = 0;
    cached.mix[index] = mix;
    cached.opacity[index] = opacity;
    const mixByte = Math.round(clamp(mix, 0, 1) * 255), opacityByte = Math.round(clamp(opacity, 0, 1) * 255);
    if (cached.data[offset] === base && cached.data[offset + 1] === top && cached.data[offset + 2] === mixByte && cached.data[offset + 3] === opacityByte) continue;
    cached.data[offset] = base; cached.data[offset + 1] = top; cached.data[offset + 2] = mixByte; cached.data[offset + 3] = opacityByte;
    changed = true;
  }
  if (changed && cached) { cached.version++; cached.dirty = true; }
  return changed || created || stylesChanged;
}

export function getTerrainPaintSample(terrain: SceneTerrain, x: number, z: number) {
  const paint = getTerrainPaint(terrain);
  if (!paint || Math.abs(x) > terrain.size / 2 || Math.abs(z) > terrain.size / 2) return null;
  const column = clamp(Math.round((x / terrain.size + 0.5) * paint.segments), 0, paint.segments);
  const row = clamp(Math.round((z / terrain.size + 0.5) * paint.segments), 0, paint.segments);
  const offset = (row * (paint.segments + 1) + column) * 4;
  if (!paint.data[offset + 3]) return null;
  const baseIndex = paint.data[offset]!, topIndex = paint.data[offset + 1]!;
  const base = paint.styles?.[baseIndex]?.surface ?? baseIndex, top = paint.styles?.[topIndex]?.surface ?? topIndex;
  const baseColor = paint.styles?.[baseIndex]?.color ?? terrain.surfaceColors?.[String(base)] ?? terrainSurfaceOptions[base]!.color;
  const topColor = paint.styles?.[topIndex]?.color ?? terrain.surfaceColors?.[String(top)] ?? terrainSurfaceOptions[top]!.color;
  return { base, top, baseColor, topColor, mix: paint.data[offset + 2]! / 255, opacity: paint.data[offset + 3]! / 255 };
}

export function resizeTerrainPaint(source: SceneTerrain, next: SceneTerrain): void {
  const previous = getTerrainPaint(source);
  if (!previous) return;
  const segments = paintSegments(next.size), width = segments + 1;
  const data = new Uint8Array(width * width * 4);
  for (let row = 0; row <= segments; row++) for (let column = 0; column <= segments; column++) {
    const x = (column / segments - 0.5) * next.size, z = (row / segments - 0.5) * next.size;
    if (Math.abs(x) > source.size / 2 || Math.abs(z) > source.size / 2) continue;
    const oldColumn = clamp(Math.round((x / source.size + 0.5) * previous.segments), 0, previous.segments);
    const oldRow = clamp(Math.round((z / source.size + 0.5) * previous.segments), 0, previous.segments);
    const oldOffset = (oldRow * (previous.segments + 1) + oldColumn) * 4, offset = (row * width + column) * 4;
    data.set(previous.data.subarray(oldOffset, oldOffset + 4), offset);
  }
  const styles = previous.styles?.map(style => ({ ...style }));
  next.surfacePaint = { segments, data: "", ...(styles ? { styles } : {}) };
  terrainPaintCache.set(next.surfacePaint, { segments, data, styles, version: 0, encoded: "", stylesKey: JSON.stringify(styles ?? null), dirty: true });
  flushTerrainPaint(next);
}
