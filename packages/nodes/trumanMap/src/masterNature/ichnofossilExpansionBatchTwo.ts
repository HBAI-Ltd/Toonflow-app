import { ShapeUtils, Vector2 } from "three";
import { combineMeshes, design, part, polygon, tapered, type MasterNatureDesign, type ModelPart, type Triple } from "./shared";

// 遗迹是连续活动留下的地层实体，步数、方向与体型不作为更多独立主素材。
// 梯状爬迹： https://repository.si.edu/items/794667fe-a80e-4efa-bf46-fda30bba1902
// https://ichnology.ku.edu/invertebrate_traces/tfimages/climactichnites.html
// 大三趾足迹： https://www.nps.gov/zion/learn/nature/another-kind-of-bigfoot.htm
// 蜥脚前后足： https://www.nhm.ac.uk/discover/dinosaur-footprints.html

export type TraceOutline = [number, number][];
export type TraceDepression = { outline: TraceOutline; floor: TraceOutline; depth: number };

export function traceAt(outline: TraceOutline, x: number, z: number, angle: number, scale: number, anchor: [number, number], depth: number): TraceDepression {
  const transform = ([px, pz]: [number, number]): [number, number] => [x + (px * Math.cos(angle) - pz * Math.sin(angle)) * scale, z + (px * Math.sin(angle) + pz * Math.cos(angle)) * scale];
  return { outline: outline.map(transform), floor: outline.map(([px, pz]) => transform([anchor[0] + (px - anchor[0]) * .81, anchor[1] + (pz - anchor[1]) * .81])), depth };
}

export function traceBed(name: string, color: string, outline: TraceOutline, traces: TraceDepression[], height = .22): ModelPart[] {
  const parts = [polygon(name, color, outline, height, [0, 0, 0], traces.map(trace => trace.outline))];
  for (const [index, trace] of traces.entries()) {
    let outer = trace.outline, floor = trace.floor;
    if (ShapeUtils.isClockWise(outer.map(point => new Vector2(...point)))) { outer = [...outer].reverse(); floor = [...floor].reverse(); }
    const count = outer.length;
    const vertices = [...outer.map(([x, z]) => ({ x, y: height, z })), ...floor.map(([x, z]) => ({ x, y: height - trace.depth, z })), ...outer.map(([x, z]) => ({ x, y: 0, z }))];
    const indices: number[] = [];
    for (let i = 0; i < count; i++) {
      const j = (i + 1) % count;
      indices.push(i, count + j, j, i, count + i, count + j, i, j, count * 2 + j, i, count * 2 + j, count * 2 + i);
    }
    for (const [ring, offset, top] of [[outer, count * 2, false], [floor, count, true]] as const) {
      for (const [a, b, c] of ShapeUtils.triangulateShape(ring.map(point => new Vector2(...point)), [])) {
        const p = ring[a!]!, q = ring[b!]!, r = ring[c!]!, area = (q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0]);
        if (area * area < 1e-16) continue;
        indices.push(a! + offset, (top ? c! : b!) + offset, (top ? b! : c!) + offset);
      }
    }
    parts.push(part(`${name}第${index + 1}处斜壁与真实下凹底面`, "mesh", color, [0, 0, 0], [1, 1, 1], [0, 0, 0], { vertices, indices }));
  }
  return parts;
}

function climactichnites(): ModelPart[] {
  const sand = "#b6a489", ridge = "#baaa8d";
  const center = (z: number) => .09 * Math.sin(z * 3.3) + .025 * Math.sin(z * 6);
  const line = Array.from({ length: 19 }, (_, index) => -1.14 + index / 18 * 2.28);
  const outline = [...line.map(z => [center(z) - .11, z] as [number, number]), ...[...line].reverse().map(z => [center(z) + .11, z] as [number, number])];
  const floor = [...line.map(z => [center(z) - .081, z] as [number, number]), ...[...line].reverse().map(z => [center(z) + .081, z] as [number, number])];
  const parts = traceBed("寒武纪梯状爬迹保存的潮坪砂岩层", sand, [[-.62, -1.42], [.43, -1.46], [.66, -.59], [.62, 1.4], [-.45, 1.49], [-.69, .65]], [{ outline, floor, depth: .024 }]);
  const edges: ModelPart[] = [], bars: ModelPart[] = [];
  for (const side of [-1, 1]) edges.push(tapered("连续爬迹外侧由挤压砂形成的隆脊", ridge, line.map(z => [center(z) + side * .122, .211, z] as Triple), line.map(() => .014)));
  for (let index = 0; index < 27; index++) {
    const z = -1.05 + index / 26 * 2.1;
    bars.push(tapered("真实凹槽内横向起伏的短砂脊", ridge, [[center(z) - .079, .202, z - .012], [center(z), .203, z + .008], [center(z) + .079, .202, z - .01]], [.008, .01, .008]));
  }
  parts.push(combineMeshes("爬行线两侧相接的成对连续砂脊", ridge, edges));
  for (let start = 0; start < bars.length; start += 13) parts.push(combineMeshes("梯状爬迹凹槽中接底的连续横脊", ridge, bars.slice(start, start + 13)));
  return parts;
}

function eubrontesTrackway(): ModelPart[] {
  const foot: TraceOutline = [[-.065, -.11], [-.12, -.03], [-.12, .07], [-.2, .21], [-.22, .27], [-.18, .3], [-.13, .27], [-.06, .16], [-.045, .34], [-.02, .43], [.02, .45], [.05, .4], [.07, .18], [.15, .31], [.2, .32], [.22, .29], [.21, .24], [.13, .09], [.11, -.01], [.065, -.11]];
  const traces = [[-.18, -1.24], [.19, -.48], [-.2, .29], [.2, 1.06]].map(([x, z]) => traceAt(foot.map(([px, pz]) => [px * Math.sign(x!), pz]), x!, z!, x! < 0 ? -.13 : .13, .8, [0, .04], .047));
  return traceBed("实雷龙型三趾足迹的连续砂岩步道", "#b29f83", [[-.8, -1.68], [.69, -1.7], [.89, -.56], [.84, 1.75], [-.61, 1.81], [-.86, .62]], traces);
}

function sauropodTrackway(): ModelPart[] {
  const hind: TraceOutline = [[-.2, -.3], [-.32, -.1], [-.34, .17], [-.25, .35], [-.17, .42], [-.11, .4], [-.08, .47], [0, .48], [.04, .41], [.12, .44], [.2, .38], [.29, .27], [.32, .04], [.23, -.2], [.07, -.33]];
  const fore: TraceOutline = [[-.25, -.02], [-.27, .08], [-.22, .2], [-.12, .27], [0, .3], [.15, .27], [.24, .17], [.26, .06], [.21, -.03], [.13, .05], [0, .1], [-.13, .04]];
  const traces: TraceDepression[] = [];
  for (const [x, z] of [[-.6, -1.42], [.65, -.59], [-.62, .3], [.6, 1.19]]) {
    const angle = x! < 0 ? -.11 : .11;
    traces.push(traceAt(hind.map(([px, pz]) => [px * Math.sign(x!), pz]), x!, z!, angle, .9, [0, .04], .073), traceAt(fore.map(([px, pz]) => [px * Math.sign(x!), pz]), x! + Math.sign(x!) * .05, z! + .55, angle, .8, [0, .22], .042));
  }
  return traceBed("蜥脚类大小前后足交替保存的完整岩层步道", "#a9a38b", [[-1.35, -1.96], [.88, -2.01], [1.36, -.74], [1.39, 2.2], [-.88, 2.3], [-1.43, .97]], traces);
}

export const ichnofossilExpansionBatchTwoDesigns: MasterNatureDesign[] = [
  design("climactichnitesRidgedTrailBed", "梯状爬迹潮坪砂岩层", "岩石", climactichnites, ["Climactichnites", "寒武纪活动遗迹", "双侧隆脊与横向脊沟", "真实约22厘米迹宽"]),
  design("eubrontesTridactylTrackway", "大型三趾兽脚足迹岩层", "岩石", eubrontesTrackway, ["Eubrontes型", "三趾尖端与厚后垫", "约45厘米负压足迹", "连续双足行走记录"]),
  design("sauropodManusPesTrackway", "蜥脚类前后足迹岩层", "岩石", sauropodTrackway, ["蜥脚类造迹", "椭圆大后足与新月小前足", "前后足成对连续记录", "真实下凹坑壁与底面"]),
];
