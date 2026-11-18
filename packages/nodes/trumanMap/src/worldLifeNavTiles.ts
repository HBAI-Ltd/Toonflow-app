import {
  BuildContext, ContourBuildFlags, WALKABLE_AREA, addTile, buildCompactHeightfield, buildContours, buildDistanceField, buildPolyMesh, buildPolyMeshDetail,
  buildRegions, buildTile, createHeightfield, createNavMesh, erodeWalkableArea, filterLedgeSpans, filterLowHangingWalkableObstacles,
  filterWalkableLowHeightSpans, markWalkableTriangles, polyMeshDetailToTileDetailMesh, polyMeshToTilePolys, rasterizeTriangles,
} from "navcat";
import type { NavMesh, NavMeshTile } from "navcat";

// ACT: 导航网格按 Navcat 分块逐块生成，每块按「块范围 + 落在块内的三角形 + 通行参数」的内容哈希缓存。
// 场景里只动了一处（挪一件道具、多一条动线让某个人从障碍变成行人）时只重算碰到的那几块，其余直接复用；
// 预演每次新建独立场景也能复用编辑器视口已经算好的块，不再整张网从零栅格化。

export type NavTileOptions = {
  cellSize: number; cellHeight: number; tileSizeVoxels: number; tileSizeWorld: number;
  walkableRadiusWorld: number; walkableRadiusVoxels: number; walkableHeightWorld: number; walkableHeightVoxels: number;
  walkableClimbWorld: number; walkableClimbVoxels: number; walkableSlopeAngleDegrees: number; borderSize: number;
  minRegionArea: number; mergeRegionArea: number; maxSimplificationError: number; maxEdgeLength: number; maxVerticesPerPoly: number;
  detailSampleDistance: number; detailSampleMaxError: number;
};
type TileBounds = [number, number, number, number, number, number];
type NavTilePlan = { key: string; tileX: number; tileY: number; bounds: TileBounds; triangles: Float64Array };
type NavMeshPlan = { options: NavTileOptions; origin: [number, number, number]; tiles: NavTilePlan[] };
/** 一张网里待补算的块，内容对外不透明。 */
export type NavTileWork = { readonly options: NavTileOptions };
type CachedTile = Omit<NavMeshTile, "id" | "sequence" | "polyNodes"> | null;

/** 诊断用计数：组装网格时直接复用的块数、实际栅格化生成的块数、从本机持久缓存读回的块数。 */
export const navTileStats = { reused: 0, built: 0, restored: 0 };
let cacheLimit = 1024;
const tileCache = new Map<string, CachedTile>();
let pending: NavMeshPlan[] | undefined;
let planOnly = false;
let identity = new Uint32Array(0);

function sequentialIndices(count: number) {
  if (identity.length < count) {
    identity = new Uint32Array(Math.max(count, identity.length * 2, 3072));
    for (let index = 0; index < identity.length; index++) identity[index] = index;
  }
  return identity.subarray(0, count);
}

function hashWords(words: Uint32Array, seedA: number, seedB: number) {
  let a = seedA | 0, b = seedB | 0;
  for (let index = 0; index < words.length; index++) {
    const word = words[index]!;
    a = Math.imul(a ^ word, 0x01000193);
    b = Math.imul((b << 5 | b >>> 27) ^ word, 0x9e3779b1);
  }
  // 两路独立的32位哈希拼成64位，块内容不同却撞键的概率可以忽略。
  return (a >>> 0).toString(36) + "." + (b >>> 0).toString(36);
}

// 一块里的三角形集合哈希：每个三角形（9个double=18个字）单独算两路32位哈希再相加，结果与三角形的先后顺序无关。
// 同一件模型在编辑器视口和预演里网格遍历顺序可能不同，按顺序哈希会让两边互相用不上对方算好的块。
function hashTriangles(triangles: Float64Array) {
  const words = new Uint32Array(triangles.buffer, triangles.byteOffset, triangles.length * 2);
  let sumA = 0, sumB = 0;
  for (let at = 0; at + 17 < words.length; at += 18) {
    let a = 0x811c9dc5 | 0, b = 0x2545f491 | 0;
    for (let index = at; index < at + 18; index++) {
      const word = words[index]!;
      a = Math.imul(a ^ word, 0x01000193);
      b = Math.imul((b << 5 | b >>> 27) ^ word, 0x9e3779b1);
    }
    a ^= a >>> 16; a = Math.imul(a, 0x85ebca6b); a ^= a >>> 13; a = Math.imul(a, 0xc2b2ae35); a ^= a >>> 16;
    b ^= b >>> 15; b = Math.imul(b, 0x2c1b3c6d); b ^= b >>> 12; b = Math.imul(b, 0x297a2d39); b ^= b >>> 15;
    sumA = sumA + a | 0; sumB = sumB + b | 0;
  }
  return (sumA >>> 0).toString(36) + "." + (sumB >>> 0).toString(36);
}

// 生成前把块内三角形排成固定顺序（按9个坐标逐个比较），同一批三角形不论谁先算、原始顺序如何，栅格化输入都一样，结果可复现。
function canonicalTriangles(triangles: Float64Array) {
  const count = triangles.length / 9;
  const order = new Uint32Array(count);
  for (let index = 0; index < count; index++) order[index] = index;
  order.sort((left, right) => {
    const a = left * 9, b = right * 9;
    for (let value = 0; value < 9; value++) { const difference = triangles[a + value]! - triangles[b + value]!; if (difference) return difference; }
    return 0;
  });
  const sorted = new Float64Array(triangles.length);
  for (let index = 0; index < count; index++) { const from = order[index]! * 9; for (let value = 0; value < 9; value++) sorted[index * 9 + value] = triangles[from + value]!; }
  return sorted;
}

function readCache(key: string) {
  const tile = tileCache.get(key);
  if (tile === undefined) return undefined;
  tileCache.delete(key);
  tileCache.set(key, tile);
  return tile;
}

// ACT: 算好的块同时存进本机 IndexedDB：重开应用、刷新页面后同一场景的块直接读回，不用再花几秒重新栅格化。
// 键是内容哈希，内容变了自然读不到旧块；块的生成逻辑有改动时把库名里的版本号加一，旧库整体作废。存取失败一律当作没有持久缓存。
const persistName = "trumanMap.navTiles.v1";
const persistLimit = 4096;
let persistDatabase: Promise<IDBDatabase | undefined> | undefined;
let persistQueue: { key: string; tile: CachedTile; at: number }[] = [];
let persistTimer: ReturnType<typeof setTimeout> | undefined;
function openPersist() {
  persistDatabase ??= new Promise(resolve => {
    try {
      if (typeof indexedDB === "undefined") { resolve(undefined); return; }
      const request = indexedDB.open(persistName, 1);
      request.onupgradeneeded = () => { request.result.createObjectStore("tiles", { keyPath: "key" }).createIndex("at", "at"); };
      request.onsuccess = () => resolve(request.result);
      request.onerror = request.onblocked = () => resolve(undefined);
    } catch { resolve(undefined); }
  });
  return persistDatabase;
}
/** 把给定键里持久缓存有的块读回内存缓存；任何失败都只是少读回几块。 */
async function restorePersisted(keys: readonly string[]) {
  const database = keys.length ? await openPersist() : undefined;
  if (!database) return;
  await new Promise<void>(resolve => {
    try {
      const transaction = database.transaction("tiles", "readonly");
      const store = transaction.objectStore("tiles");
      const stale = Date.now() - 86400000;
      for (const key of keys) {
        const request = store.get(key);
        request.onsuccess = () => {
          const entry = request.result as { tile: CachedTile; at: number } | undefined;
          if (!entry || tileCache.has(key)) return;
          tileCache.set(key, entry.tile);
          navTileStats.restored++;
          // 还在用的块隔天续一次时间戳，淘汰时先清久未使用的。
          if (entry.at < stale) queuePersist(key, entry.tile);
        };
      }
      transaction.oncomplete = transaction.onerror = transaction.onabort = () => resolve();
    } catch { resolve(); }
  });
  while (tileCache.size > cacheLimit) tileCache.delete(tileCache.keys().next().value!);
}
function queuePersist(key: string, tile: CachedTile) {
  persistQueue.push({ key, tile, at: Date.now() });
  persistTimer ??= setTimeout(() => { persistTimer = undefined; void flushPersist(); }, 300);
}
async function flushPersist() {
  const entries = persistQueue;
  persistQueue = [];
  const database = entries.length ? await openPersist() : undefined;
  if (!database) return;
  try {
    const transaction = database.transaction("tiles", "readwrite");
    const store = transaction.objectStore("tiles");
    for (const entry of entries) store.put(entry);
    // 超过上限时按时间戳从旧到新删到四分之三。
    const count = store.count();
    count.onsuccess = () => {
      let excess = count.result > persistLimit ? count.result - Math.floor(persistLimit * 0.75) : 0;
      if (!excess) return;
      const cursor = store.index("at").openKeyCursor();
      cursor.onsuccess = () => { const position = cursor.result; if (!position || excess-- <= 0) return; store.delete(position.primaryKey); position.continue(); };
    };
  } catch { /* 存不进去（配额、隐私模式）只是下次重算 */ }
}

function writeCache(key: string, tile: CachedTile) {
  navTileStats.built++;
  queuePersist(key, tile);
  tileCache.delete(key);
  tileCache.set(key, tile);
  while (tileCache.size > cacheLimit) tileCache.delete(tileCache.keys().next().value!);
}

function planNavMesh(chunks: readonly ArrayLike<number>[], options: NavTileOptions): NavMeshPlan {
  const { cellSize, tileSizeVoxels, tileSizeWorld, borderSize } = options;
  let minX = Infinity, minY = Infinity, minZ = Infinity, maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
  let triangleCount = 0;
  for (const chunk of chunks) {
    triangleCount += Math.floor(chunk.length / 9);
    for (let index = 0; index + 2 < chunk.length; index += 3) {
      const x = chunk[index]!, y = chunk[index + 1]!, z = chunk[index + 2]!;
      if (x < minX) minX = x; if (x > maxX) maxX = x;
      if (y < minY) minY = y; if (y > maxY) maxY = y;
      if (z < minZ) minZ = z; if (z > maxZ) maxZ = z;
    }
  }
  const columns = Math.floor((Math.floor((maxX - minX) / cellSize + 0.5) + tileSizeVoxels - 1) / tileSizeVoxels);
  const rows = Math.floor((Math.floor((maxZ - minZ) / cellSize + 0.5) + tileSizeVoxels - 1) / tileSizeVoxels);
  const border = borderSize * cellSize;
  // 每个三角形按水平包围盒落进它碰到的块（含块外一圈边界体素），两遍：先数，再填；块内保持输入顺序。
  const ranges = new Int32Array(triangleCount * 4);
  const counts = new Uint32Array(Math.max(0, columns * rows));
  let triangle = 0;
  for (const chunk of chunks) for (let at = 0; at + 8 < chunk.length; at += 9, triangle++) {
    const lowX = Math.min(chunk[at]!, chunk[at + 3]!, chunk[at + 6]!), highX = Math.max(chunk[at]!, chunk[at + 3]!, chunk[at + 6]!);
    const lowZ = Math.min(chunk[at + 2]!, chunk[at + 5]!, chunk[at + 8]!), highZ = Math.max(chunk[at + 2]!, chunk[at + 5]!, chunk[at + 8]!);
    const fromX = Math.max(0, Math.ceil((lowX - border - minX) / tileSizeWorld - 1 - 1e-9)), toX = Math.min(columns - 1, Math.floor((highX + border - minX) / tileSizeWorld + 1e-9));
    const fromZ = Math.max(0, Math.ceil((lowZ - border - minZ) / tileSizeWorld - 1 - 1e-9)), toZ = Math.min(rows - 1, Math.floor((highZ + border - minZ) / tileSizeWorld + 1e-9));
    ranges[triangle * 4] = fromX; ranges[triangle * 4 + 1] = toX; ranges[triangle * 4 + 2] = fromZ; ranges[triangle * 4 + 3] = toZ;
    for (let x = fromX; x <= toX; x++) for (let z = fromZ; z <= toZ; z++) counts[x * rows + z]!++;
  }
  const buffers: Float64Array[] = [];
  for (let tile = 0; tile < counts.length; tile++) buffers.push(new Float64Array(counts[tile]! * 9));
  counts.fill(0);
  triangle = 0;
  for (const chunk of chunks) for (let at = 0; at + 8 < chunk.length; at += 9, triangle++) {
    const fromX = ranges[triangle * 4]!, toX = ranges[triangle * 4 + 1]!, fromZ = ranges[triangle * 4 + 2]!, toZ = ranges[triangle * 4 + 3]!;
    for (let x = fromX; x <= toX; x++) for (let z = fromZ; z <= toZ; z++) {
      const tile = x * rows + z, buffer = buffers[tile]!, offset = counts[tile]!++ * 9;
      for (let value = 0; value < 9; value++) buffer[offset + value] = chunk[at + value]!;
    }
  }
  const signature = Object.values(options).join(",");
  const header = new Float64Array(6);
  const tiles: NavTilePlan[] = [];
  for (let tileX = 0; tileX < columns; tileX++) for (let tileY = 0; tileY < rows; tileY++) {
    const triangles = buffers[tileX * rows + tileY]!;
    // 圆形活动区四角等没有任何几何的块不会产生网格，不建、不占缓存。
    if (!triangles.length) continue;
    // 竖直范围只看本块自己的三角形，对齐到以0为原点的体素层：别处的物体变高、落地时高度差一个浮点误差，都不会让全场的块一起失效。
    let low = Infinity, high = -Infinity;
    for (let index = 1; index < triangles.length; index += 3) { const y = triangles[index]!; if (y < low) low = y; if (y > high) high = y; }
    const bounds: TileBounds = [minX + tileX * tileSizeWorld, Math.floor(low / options.cellHeight) * options.cellHeight, minZ + tileY * tileSizeWorld, minX + (tileX + 1) * tileSizeWorld, (Math.ceil(high / options.cellHeight) + 1) * options.cellHeight, minZ + (tileY + 1) * tileSizeWorld];
    header.set(bounds);
    const key = signature + "|" + triangles.length + "|" + hashWords(new Uint32Array(header.buffer), 0x811c9dc5, 0x2545f491) + "|" + hashTriangles(triangles);
    tiles.push({ key, tileX, tileY, bounds, triangles });
  }
  // 单张网的块数超过缓存上限时放宽上限，避免分片补算的块在重新执行前又被挤掉。
  cacheLimit = Math.min(8192, Math.max(cacheLimit, tiles.length * 3));
  return { options, origin: [minX, minY, minZ], tiles };
}

// 与 navcat/blocks 的 buildNavMeshTile 同一套步骤和参数，只是输入换成本块自己的三角形。
// 写成生成器：每个阶段之间可以停一下，分片补算时一个挤满建筑的重块（两三百毫秒）也能拆开让出主线程。
function* buildTileStages(plan: NavTilePlan, options: NavTileOptions): Generator<undefined, CachedTile> {
  const { cellSize, cellHeight, borderSize, tileSizeVoxels, walkableClimbVoxels, walkableHeightVoxels } = options;
  const ctx = BuildContext.create();
  const expanded: TileBounds = [plan.bounds[0] - borderSize * cellSize, plan.bounds[1], plan.bounds[2] - borderSize * cellSize, plan.bounds[3] + borderSize * cellSize, plan.bounds[4], plan.bounds[5] + borderSize * cellSize];
  const size = Math.floor(tileSizeVoxels + borderSize * 2);
  const heightfield = createHeightfield(size, size, expanded, cellSize, cellHeight);
  const triangles = canonicalTriangles(plan.triangles);
  const triangleCount = triangles.length / 9;
  const indices = sequentialIndices(triangleCount * 3);
  const areas = new Uint8Array(triangleCount);
  markWalkableTriangles(triangles, indices, areas, options.walkableSlopeAngleDegrees);
  rasterizeTriangles(ctx, heightfield, triangles, indices, areas, walkableClimbVoxels);
  yield;
  filterLowHangingWalkableObstacles(heightfield, walkableClimbVoxels);
  filterLedgeSpans(heightfield, walkableHeightVoxels, walkableClimbVoxels);
  filterWalkableLowHeightSpans(heightfield, walkableHeightVoxels);
  const compact = buildCompactHeightfield(ctx, walkableHeightVoxels, walkableClimbVoxels, heightfield);
  yield;
  erodeWalkableArea(options.walkableRadiusVoxels, compact);
  buildDistanceField(compact);
  yield;
  buildRegions(ctx, compact, borderSize, options.minRegionArea, options.mergeRegionArea);
  yield;
  const contours = buildContours(ctx, compact, options.maxSimplificationError, options.maxEdgeLength, ContourBuildFlags.CONTOUR_TESS_WALL_EDGES);
  const polyMesh = buildPolyMesh(ctx, contours, options.maxVerticesPerPoly);
  if (!polyMesh.vertices.length) return null;
  for (let poly = 0; poly < polyMesh.nPolys; poly++) {
    if (polyMesh.areas[poly] === WALKABLE_AREA) polyMesh.areas[poly] = 0;
    if (polyMesh.areas[poly] === 0) polyMesh.flags[poly] = 1;
  }
  yield;
  const detail = buildPolyMeshDetail(ctx, polyMesh, compact, options.detailSampleDistance, options.detailSampleMaxError);
  const tilePolys = polyMeshToTilePolys(polyMesh);
  const tileDetail = polyMeshDetailToTileDetailMesh(tilePolys.polys, detail);
  const { id, sequence, polyNodes, ...tile } = buildTile({
    bounds: polyMesh.bounds, vertices: tilePolys.vertices, polys: tilePolys.polys,
    detailMeshes: tileDetail.detailMeshes, detailVertices: tileDetail.detailVertices, detailTriangles: tileDetail.detailTriangles,
    tileX: plan.tileX, tileY: plan.tileY, tileLayer: 0, cellSize, cellHeight,
    walkableHeight: options.walkableHeightWorld, walkableRadius: options.walkableRadiusWorld, walkableClimb: options.walkableClimbWorld,
  });
  return tile;
}
function buildTileData(plan: NavTilePlan, options: NavTileOptions) {
  const stages = buildTileStages(plan, options);
  for (;;) { const step = stages.next(); if (step.done) return step.value; }
}

/** 分块生成导航网格；已缓存的块直接复用。正在 prebuildNavTiles / collectMissingNavTiles 的收集阶段且有块没算过时不生成，登记后抛错，由收集方分片补齐。 */
export function generateCachedNavMesh(chunks: readonly ArrayLike<number>[], options: NavTileOptions): NavMesh {
  const plan = planNavMesh(chunks, options);
  if (pending) {
    const missing = plan.tiles.filter(tile => !tileCache.has(tile.key));
    if (missing.length) pending.push({ ...plan, tiles: missing });
    if (missing.length || planOnly) throw new Error("导航网格正在分片生成");
  }
  const navMesh = createNavMesh();
  navMesh.tileWidth = navMesh.tileHeight = options.tileSizeWorld;
  navMesh.origin[0] = plan.origin[0]; navMesh.origin[1] = plan.origin[1]; navMesh.origin[2] = plan.origin[2];
  for (const tile of plan.tiles) {
    let data = readCache(tile.key);
    if (data === undefined) { data = buildTileData(tile, options); writeCache(tile.key, data); }
    else navTileStats.reused++;
    // 缓存的多边形、细节网格只读共享；每张网自己的块编号和节点表单独新建。
    if (data) addTile(navMesh, { ...data, tileX: tile.tileX, tileY: tile.tileY, id: -1, sequence: -1, polyNodes: [] });
  }
  return navMesh;
}

/** 让出主线程一次。用 MessageChannel：setTimeout 在后台标签页会被限到约1秒一次；scheduler.yield 的续体优先级高于定时器和网络回调，连续让出时会把它们饿死。 */
export function yieldToMain() {
  if (typeof MessageChannel === "undefined") return new Promise<void>(resolve => setTimeout(resolve, 0));
  return new Promise<void>(resolve => {
    const channel = new MessageChannel();
    channel.port1.onmessage = () => { channel.port1.close(); resolve(); };
    channel.port2.postMessage(0);
  });
}

/** 只探测不生成：执行 run（里面同步触发导航网格生成），返回其中还没算过的块；run 里的网格一律不组装（生成处抛错）。 */
export function collectMissingNavTiles(run: () => void): NavTileWork[] {
  const plans: NavMeshPlan[] = [];
  const outer = pending, outerPlanOnly = planOnly;
  pending = plans; planOnly = true;
  try { run(); } finally { pending = outer; planOnly = outerPlanOnly; }
  return plans;
}

/** 把探测到的缺块分片算完：每片约 sliceMilliseconds，片间让出主线程；一个重块内部也按阶段拆开。 */
export async function buildNavTiles(plans: readonly NavTileWork[], signal?: AbortSignal, sliceMilliseconds = 10) {
  // 探测本身已经占了一段主线程，先让出一次再开始补算。
  await yieldToMain();
  // 先看本机持久缓存里有没有这些块（上次打开同一场景时算过），读回来的就不用再算。
  await restorePersisted([...new Set((plans as readonly NavMeshPlan[]).flatMap(plan => plan.tiles.map(tile => tile.key)).filter(key => !tileCache.has(key)))]);
  signal?.throwIfAborted();
  let sliceStart = performance.now();
  for (const plan of plans as readonly NavMeshPlan[]) for (const tile of plan.tiles) {
    if (tileCache.has(tile.key)) continue;
    const stages = buildTileStages(tile, plan.options);
    for (;;) {
      signal?.throwIfAborted();
      const step = stages.next();
      if (step.done) { writeCache(tile.key, step.value); break; }
      if (performance.now() - sliceStart >= sliceMilliseconds) { await yieldToMain(); sliceStart = performance.now(); }
    }
  }
  signal?.throwIfAborted();
}

/**
 * 先试跑一遍 run（里面同步触发导航网格生成，例如 WorldLife.sync）：需要的块都在缓存里就照常生成，返回 false，run 的结果可直接用；
 * 有没算过的块时本次 run 里对应的网格生成失败，这里把缺的块分片算完，返回 true，
 * 调用方须丢弃这次 run 的结果重新执行一遍，届时全部命中缓存。
 */
export async function prebuildNavTiles(run: () => void, signal?: AbortSignal, sliceMilliseconds = 10) {
  const plans: NavMeshPlan[] = [];
  const outer = pending, outerPlanOnly = planOnly;
  pending = plans; planOnly = false;
  try { run(); } finally { pending = outer; planOnly = outerPlanOnly; }
  // 只要试跑里有网格被推迟，run 的结果就作废；哪怕缺的块在让出主线程期间已被别处（编辑器视口）算好。
  if (!plans.length) return false;
  await buildNavTiles(plans, signal, sliceMilliseconds);
  return true;
}
