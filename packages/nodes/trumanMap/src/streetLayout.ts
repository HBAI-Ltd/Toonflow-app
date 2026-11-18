import { z } from "@toonflow/nodes-scaffold/runtime";
import { type SceneAsset, type SceneDocument, type SceneObject } from "./sceneDocument";
import { createOccupancy, createPlacer, faceRotation, measureAssetFootprint, scatterCrowd, seededRandom } from "./setDressing";
import { worldSizeLimits } from "./terrainModel";

// ACT: 沿街布局：一次排出成片的街道——两侧临街建筑按真实占地紧挨排列、正面朝街，街心摊位、路灯按节奏布置，两端牌坊收住街景，成群的胶囊人NPC。
// 弱模型逐个猜坐标和朝向会把楼散在空地上、朝向乱；这里按确定的规则摆，Agent只需选素材和街道走向。
const coordinate = z.number().finite().min(-10000).max(10000);
const groundPoint = z.strictObject({ x: coordinate, z: coordinate });
const assetId = z.string().min(1).max(160);

export const layoutStreetSchema = z.strictObject({
  path: z.array(groundPoint).min(2).max(16).describe("街道中线世界XZ折线，直街给两端点即可"),
  width: z.number().finite().min(3).max(60).default(10).describe("两侧建筑正面之间的街宽（米）"),
  buildings: z.array(assetId).min(1).max(8).describe("临街建筑assetIds，同一题材2到4种交替；正面（门、招牌）自动朝街"),
  sides: z.enum(["both", "left", "right"]).default("both"),
  gap: z.number().finite().min(0).max(8).default(0.4).describe("相邻建筑的间距（米），0为紧贴"),
  lamps: z.strictObject({ assetId, spacing: z.number().finite().min(3).max(60).default(12) }).optional().describe("路灯：沿两侧街边交错排列"),
  stalls: z.strictObject({ assetIds: z.array(assetId).min(1).max(6), spacing: z.number().finite().min(3).max(60).default(10), rows: z.union([z.literal(1), z.literal(2)]).default(1) }).optional().describe("摊位：沿街心一排或两排"),
  gates: z.strictObject({ assetId, at: z.enum(["start", "end", "both"]).default("end") }).optional().describe("牌坊、牌楼、城门：横跨街道的端头"),
  crowd: z.strictObject({ assetIds: z.array(assetId).min(1).max(4).default(["person"]), count: z.number().int().min(1).max(120).default(24), groupSize: z.number().int().min(1).max(8).default(3) }).optional().describe("人群：默认胶囊人NPC，三五成群围着摊位或在街上交谈，每组一种颜色"),
  seed: z.number().int().min(-2147483648).max(2147483647).default(1),
  name: z.string().trim().min(1).max(40).default("街道"),
}).superRefine((value, context) => {
  value.path.forEach((point, index) => {
    if (index && Math.hypot(point.x - value.path[index - 1]!.x, point.z - value.path[index - 1]!.z) < 0.5) context.addIssue({ code: "custom", path: ["path", index], message: "相邻中线点至少相距0.5米" });
  });
});
export type LayoutStreetInput = z.input<typeof layoutStreetSchema>;

export async function layoutSceneStreet(document: SceneDocument, assetMap: Map<string, SceneAsset>, raw: unknown, signal?: AbortSignal) {
  signal?.throwIfAborted();
  const args = layoutStreetSchema.parse(raw);
  const resolve = (id: string) => {
    const asset = assetMap.get(id);
    if (!asset) throw new Error(`素材未登记：${id}，请先用listAssets检索真实assetId`);
    const footprint = measureAssetFootprint(asset);
    if (!footprint) throw new Error(`“${asset.name}”是外部模型，无法测量占地，沿街布局只支持内置素材；外部模型请用addAsset逐个摆放`);
    return { asset, footprint };
  };
  const halfSize = (document.terrain?.size ?? worldSizeLimits.default) / 2;
  if (args.path.some(point => Math.abs(point.x) > halfSize || Math.abs(point.z) > halfSize)) throw new Error(`街道中线须在世界边界内：X/Z各为-${halfSize}～${halfSize}米`);
  const random = seededRandom(args.seed);
  const objects: SceneObject[] = [];
  const placer = createPlacer(document, createOccupancy(document), objects);
  const warnings: string[] = [];
  const segments = args.path.slice(1).map((end, index) => {
    const start = args.path[index]!;
    const length = Math.hypot(end.x - start.x, end.z - start.z);
    const dx = (end.x - start.x) / length, dz = (end.z - start.z) / length;
    return { start, length, dx, dz, left: { x: -dz, z: dx } };
  });
  const totalLength = segments.reduce((sum, segment) => sum + segment.length, 0);
  /** 中线上走过distance米处的点和所在段。 */
  const along = (distance: number) => {
    let rest = Math.max(0, Math.min(totalLength, distance));
    for (const [index, segment] of segments.entries()) {
      if (rest <= segment.length || index === segments.length - 1) return { x: segment.start.x + segment.dx * rest, z: segment.start.z + segment.dz * rest, segment };
      rest -= segment.length;
    }
    return { x: args.path[0]!.x, z: args.path[0]!.z, segment: segments[0]! };
  };
  const half = args.width / 2;

  // 两侧临街建筑：逐段按真实面宽排，正面朝街；折点内侧留出转角，避免两段的楼相互压住。
  const buildings = args.buildings.map(resolve);
  const deepest = Math.max(...buildings.map(item => item.footprint.depth));
  const frontage: { side: number; count: number; length: number }[] = [];
  let buildingIndex = 0;
  for (const side of args.sides === "both" ? [1, -1] : args.sides === "left" ? [1] : [-1]) {
    let count = 0, used = 0;
    for (const [segmentIndex, segment] of segments.entries()) {
      const clearStart = segmentIndex ? half + deepest : 0, clearEnd = segmentIndex < segments.length - 1 ? half + deepest : 0;
      // 两侧错开半个铺面起排，避免对面一模一样。
      let cursor = clearStart + (side < 0 && args.sides === "both" ? Math.min(3, buildings[0]!.footprint.width / 2) : 0);
      for (;;) {
        if (signal?.aborted) signal.throwIfAborted();
        const choice = (buildingIndex + Math.floor(random() * 2) * Number(buildings.length > 2)) % buildings.length;
        const { asset, footprint } = buildings[choice]!;
        if (cursor + footprint.width > segment.length - clearEnd) break;
        const offset = half + footprint.depth / 2;
        const x = segment.start.x + segment.dx * (cursor + footprint.width / 2) + segment.left.x * offset * side;
        const z = segment.start.z + segment.dz * (cursor + footprint.width / 2) + segment.left.z * offset * side;
        const placed = placer.place(asset, footprint, x, z, faceRotation(footprint, { x: -segment.left.x * side, z: -segment.left.z * side }), `${args.name}${side > 0 ? "左" : "右"}侧${asset.name}`);
        if (placed) { used += footprint.width; count++; }
        cursor += footprint.width + args.gap; buildingIndex++;
      }
    }
    frontage.push({ side, count, length: Math.round(used * 10) / 10 });
    if (!count) warnings.push(`${side > 0 ? "左" : "右"}侧街太短或被已有物体占住，没放下建筑`);
    await new Promise<void>(resolve => setTimeout(resolve, 0));
  }

  // 街心摊位：沿中线一排或两排，正面朝向两侧行人。
  const stallSpots: { x: number; z: number }[] = [];
  if (args.stalls) {
    const stalls = args.stalls.assetIds.map(resolve);
    const lanes = args.stalls.rows === 2 && args.width >= 10 ? [-args.width * 0.17, args.width * 0.17] : [0];
    let index = 0;
    for (let distance = args.stalls.spacing * 0.75; distance < totalLength - args.stalls.spacing * 0.5; distance += args.stalls.spacing) {
      for (const [lane, lateral] of lanes.entries()) {
        const point = along(distance + (lane ? args.stalls.spacing / 2 : 0));
        const x = point.x + point.segment.left.x * lateral, z = point.z + point.segment.left.z * lateral;
        const toward = lanes.length > 1 ? Math.sign(lateral) : index % 2 ? 1 : -1;
        const { asset, footprint } = stalls[index % stalls.length]!;
        if (placer.place(asset, footprint, x, z, faceRotation(footprint, { x: point.segment.left.x * toward, z: point.segment.left.z * toward }), `${args.name}${asset.name}`)) stallSpots.push({ x, z });
        index++;
      }
    }
  }

  // 路灯：两侧街边交错，每侧按间距排，灯朝街心。
  if (args.lamps) {
    const { asset, footprint } = resolve(args.lamps.assetId);
    let index = 0;
    for (let distance = args.lamps.spacing / 2; distance < totalLength; distance += args.lamps.spacing / 2) {
      const side = index % 2 ? -1 : 1;
      index++;
      if (args.sides !== "both" && (args.sides === "left") !== (side > 0)) continue;
      const point = along(distance);
      const lateral = (half - Math.max(0.6, footprint.depth / 2 + 0.3)) * side;
      placer.place(asset, footprint, point.x + point.segment.left.x * lateral, point.z + point.segment.left.z * lateral, faceRotation(footprint, { x: -point.segment.left.x * side, z: -point.segment.left.z * side }), `${args.name}${asset.name}`);
    }
  }

  // 两端牌坊：横跨街道、正面朝街外迎客；它本来就要压在街口两侧，不做避让。
  if (args.gates) {
    const { asset, footprint } = resolve(args.gates.assetId);
    for (const end of args.gates.at === "both" ? ["start", "end"] : [args.gates.at]) {
      const segment = end === "start" ? segments[0]! : segments[segments.length - 1]!;
      const anchor = end === "start" ? args.path[0]! : args.path[args.path.length - 1]!;
      const outward = end === "start" ? -1 : 1;
      const inset = footprint.depth / 2 + 0.5;
      placer.place(asset, footprint, anchor.x - segment.dx * inset * outward, anchor.z - segment.dz * inset * outward, faceRotation(footprint, { x: segment.dx * outward, z: segment.dz * outward }), `${args.name}${end === "start" ? "街口" : "街尾"}${asset.name}`, { avoid: false });
      if (footprint.width > args.width + 2 * deepest) warnings.push(`${asset.name}比街道加两侧建筑还宽，可能压到楼`);
    }
  }

  // 人群：三五成群，一半围着摊位，一半在街面上站着交谈；每组一种颜色。
  const skippedLayout = placer.skipped;
  let people = 0;
  if (args.crowd) {
    const lane = Math.max(0.5, half - 1.4);
    const sample = () => {
      if (stallSpots.length && random() < 0.5) {
        const spot = stallSpots[Math.floor(random() * stallSpots.length)]!;
        const theta = random() * Math.PI * 2;
        return { x: spot.x + Math.sin(theta) * 2.4, z: spot.z + Math.cos(theta) * 2.4 };
      }
      const point = along(random() * totalLength);
      const lateral = (random() * 2 - 1) * lane;
      return { x: point.x + point.segment.left.x * lateral, z: point.z + point.segment.left.z * lateral };
    };
    const crowdAssets = args.crowd.assetIds.map(id => resolve(id).asset);
    people = scatterCrowd({ sample, count: args.crowd.count, groupSize: args.crowd.groupSize, mode: "chat", people: crowdAssets, colors: true, avoid: true, random, name: `${args.name}路人`, placer }).placed;
    if (people < args.crowd.count) warnings.push(`人群只放下${people}人：街面不够大或摊位太密`);
  }
  signal?.throwIfAborted();
  const count = (ids: string[]) => objects.filter(object => ids.includes(object.asset.id)).length;
  return {
    objects,
    summary: {
      name: args.name, length: Math.round(totalLength * 10) / 10, width: args.width,
      buildings: frontage.map(item => ({ side: item.side > 0 ? "left" : "right", count: item.count, frontageLength: item.length })),
      stalls: stallSpots.length,
      lamps: args.lamps ? count([args.lamps.assetId]) : 0,
      gates: args.gates ? count([args.gates.assetId]) : 0,
      people,
      ...(skippedLayout ? { skipped: skippedLayout } : {}),
      ...(warnings.length ? { warnings: [...new Set(warnings)] } : {}),
    },
  };
}
