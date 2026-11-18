import { part, type ModelPart } from "../assetModelParts";
import { combineMeshes, lobe } from "../natureParts";
import { glazedWall } from "./modernResidenceSpaceBatchOne";
import { boxesMesh, type SolidBox } from "./publicSpaceBatchEight";
import { box, design, type ArchitecturePrototype } from "./structures";
import { slopePanel } from "./vernacularWorldBatchOne";
import { meshBeam } from "./vernacularWorldBatchFive";
import { hardFloor } from "./vernacularWorldBatchSix";

const paving = "#bbbdac", metal = "#5b7673", timber = "#a08a66", glass = "#a9c9bb", soil = "#8c8265";

export const everydayRetailBuildingSpaceBatchFourDesigns: ArchitecturePrototype[] = [
  design("椭圆环棚露院园艺零售馆", "梯形前营业厅通过真门接入连续椭圆售苗环廊，中央种植庭院真正露天；内外窗壁和两圈实柱承住向外降坡的透明厚屋片，庭院前后门与环廊后巷推车门真实贯通，盆栽展台靠外环放置并留出连续回游通路", courtyardGardenRetailHall, "建筑", "现代"),
];

function courtyardGardenRetailHall(): ModelPart[] {
  const outer: [number, number][] = [], inner: [number, number][] = [], roofOuter: [number, number][] = [], roofInner: [number, number][] = [];
  for (let i = 0; i < 12; i++) {
    const a = -Math.PI / 2 - Math.PI / 12 + i * Math.PI / 6;
    outer.push([14 * Math.cos(a), 10 * Math.sin(a)]);
    inner.push([7 * Math.cos(a), 5 * Math.sin(a)]);
    roofOuter.push([14.42 * Math.cos(a), 10.3 * Math.sin(a)]);
    roofInner.push([6.58 * Math.cos(a), 4.7 * Math.sin(a)]);
  }
  const frontZ = outer[0]![1], halfJoint = outer[1]![0];
  const p: ModelPart[] = [
    hardFloor("内外椭圆之间连续可回游的完整售苗楼面", paving, outer, .2, [0, 0, 0], [inner]),
    hardFloor("屋盖真实退让的中央露天种植院土地面", soil, inner, .2, [0, 0, 0]),
    hardFloor("前窄后宽营业条实际接到外环真门的完整梯形店坪", paving, [[-5, -14], [5, -14], [6, frontZ], [-6, frontZ]], .2, [0, 0, 0]),
    hardFloor("前营业条完整独立低屋盖不跨入内院", metal, [[-5.32, -14.3], [5.32, -14.3], [6.32, frontZ + .25], [-6.32, frontZ + .25]], .2, [0, 3, 0]),
    ...glazedWall("园艺店前街入口出口与用品橱窗真实分开", [-5, -14], [5, -14], .2, 3, [[-4.1, .65, 1.2, 1.7], [4.1, .65, 1.2, 1.7]], [[-2.4, .2, 1.8, 2.5], [2.3, .2, 1.4, 2.5]]),
    ...glazedWall("梯形营业条西侧实际斜窗承屋壁", [-5, -14], [-6, frontZ], .2, 3, [[0, .8, 2.5, 1.7]]),
    ...glazedWall("梯形营业条东侧实际斜窗承屋壁", [5, -14], [6, frontZ], .2, 3, [[0, .8, 2.5, 1.7]]),
    ...glazedWall("前营业条西后肩实际封到环棚的低墙", [-6, frontZ], [-halfJoint, frontZ], .2, 3, []),
    ...glazedWall("前营业条东后肩实际封到环棚的低墙", [halfJoint, frontZ], [6, frontZ], .2, 3, []),
  ];
  const columns: SolidBox[] = [], rafters: ModelPart[] = [], walls: ModelPart[] = [];
  for (let i = 0; i < 12; i++) {
    const j = (i + 1) % 12, a = outer[i]!, b = outer[j]!, c = inner[i]!, d = inner[j]!;
    const outerLength = Math.hypot(b[0] - a[0], b[1] - a[1]), innerLength = Math.hypot(d[0] - c[0], d[1] - c[1]);
    const outerWall = glazedWall("外环售苗馆真正透光且由墙墩承顶的连续围壁", a, b, .2, 3.65, i === 0 || i === 6 ? [] : [[0, .4, outerLength - .45, 2.8]], i === 0 || i === 6 ? [[0, .2, 2.2, 2.7]] : []);
    const innerWall = glazedWall("露院外缘实际开门且不封住庭院的高位内窗壁", d, c, .2, 4.4, i === 0 || i === 6 ? [] : [[0, .4, innerLength - .35, 3.5]], i === 0 || i === 6 ? [[0, .2, 1.8, 2.7]] : []);
    walls.push(outerWall[0]!, innerWall[0]!); p.push(...outerWall.slice(1), ...innerWall.slice(1));
    const ra = roofOuter[i]!, rb = roofOuter[j]!, rc = roofInner[i]!, rd = roofInner[j]!;
    const panel = slopePanel("两圈同形椭圆之间实际平面且向外落水的透明厚屋片", [[ra[0], 3.7, ra[1]], [rb[0], 3.7, rb[1]], [rd[0], 4.5, rd[1]], [rc[0], 4.5, rc[1]]], .1, glass);
    panel.opacity = .3; panel.roughness = .2; p.push(panel);
    columns.push({ center: [a[0], 1.925, a[1]], size: [.18, 3.45, .18] }, { center: [c[0], 2.3, c[1]], size: [.16, 4.2, .16] });
    rafters.push(meshBeam("真实压在内外实柱上并嵌入屋片下缘的径向斜梁", [a[0], 3.57286, a[1]], [c[0], 4.28714, c[1]], .16, metal));
  }
  for (let i = 0; i < walls.length; i += 4) p.push(combineMeshes("内外窗孔门孔和墙墩完整保留的四段连续承壁", walls[0]!.color, walls.slice(i, i + 4)));
  for (let i = 0; i < columns.length; i += 20) p.push(boxesMesh("连续售苗环廊内外两圈从地面接到屋片的承柱", metal, columns.slice(i, i + 20)));
  p.push(combineMeshes("每片透明屋面接缝下实际贯通两圈实柱的全部斜梁", metal, rafters));
  const counter: SolidBox[] = [{ center: [.5, .7, -12.2], size: [2, 1, .8] }, { center: [.5, 1.24, -12.2], size: [2.1, .08, .9] }];
  for (const x of [-4.35, 4.35]) {
    counter.push({ center: [x, .95, -11.2], size: [.08, 1.5, 1.8] });
    for (const z of [-12.05, -10.35]) counter.push({ center: [x < 0 ? x + .35 : x - .35, .95, z], size: [.75, 1.5, .08] });
    for (const y of [.25, .7, 1.15, 1.65]) counter.push({ center: [x < 0 ? x + .35 : x - .35, y, -11.2], size: [.75, .08, 1.8] });
  }
  p.push(boxesMesh("前营业条真实落地收银台与保持开放格口的用品架", timber, counter));
  for (const angle of [-5 * Math.PI / 6, -Math.PI / 6, Math.PI / 6, 5 * Math.PI / 6]) {
    const x = 11.2 * Math.cos(angle), z = 8 * Math.sin(angle), yaw = -Math.atan2(8 * Math.cos(angle), -11.2 * Math.sin(angle)) * 180 / Math.PI;
    const bench: SolidBox[] = [{ center: [0, .95, 0], size: [2.4, .1, 1.2] }, { center: [0, .42, 0], size: [2.2, .08, 1] }];
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) bench.push({ center: [sx, .55, sz * .43], size: [.12, .7, .12] });
    p.push(boxesMesh("靠外侧陈列且不堵内侧环形通路的接地展苗台", timber, bench, [x, 0, z], yaw));
    p.push(part("苗台上有真实开口与连续底壁的独立陶盆", "lathe", "#ad8b6d", [x, 1, z], [1, 1, 1], [0, 0, 0], { profile: [{ x: 0, y: 0 }, { x: .22, y: 0 }, { x: .34, y: .5 }, { x: .3, y: .54 }, { x: .27, y: .5 }, { x: .18, y: .06 }, { x: 0, y: .06 }] }));
    p.push(part("实际填在陶盆内腔并承住苗根的土团", "lathe", soil, [x, 1.06, z], [1, 1, 1], [0, 0, 0], { profile: [{ x: 0, y: 0 }, { x: .17, y: 0 }, { x: .26, y: .44 }, { x: 0, y: .44 }] }));
    const seedling: ModelPart[] = [meshBeam("从盆土真实伸出的苗木主茎", [x, 1.3, z], [x, 2.15, z], .025, "#708e64")];
    for (let i = 0; i < 6; i++) {
      const a = i * Math.PI * .76, y = 1.53 + i * .07, lx = x + Math.cos(a) * .24, lz = z + Math.sin(a) * .24;
      seedling.push(meshBeam("从苗茎实际接到独立厚叶中心的细叶柄", [x, y, z], [lx, y + .25, lz], .018, "#708e64"), lobe("苗木实际由叶柄承接的分离厚叶", "#708e64", [lx, y + .25, lz], [.24, .75, .055], [35 * Math.sin(a), 0, -35 * Math.cos(a)]));
    }
    p.push(combineMeshes("盆栽苗木真实相接的主茎叶柄和分离厚叶", "#708e64", seedling));
  }
  return p;
}
