import { part, type ModelPart, type Triple } from "../assetModelParts";
import { glazedWall } from "./modernResidenceSpaceBatchOne";
import { boxesMesh, type SolidBox } from "./publicSpaceBatchEight";
import { box, design, rail, type ArchitecturePrototype } from "./structures";
import { hardFloor } from "./vernacularWorldBatchSix";

const paving = "#b9b7aa", timber = "#a38a69", metal = "#5c7172", roofColor = "#7a8c85", fabric = "#a2afa4";

export const everydayRetailBuildingSpaceBatchTwoDesigns: ArchitecturePrototype[] = [
  design("凹弧门廊后排试衣服饰店", "两座前展示翼沿半圆内凹橱窗围出深入口廊，弧底真门进入宽后厅；后排三个真实开门的试衣间与侧尾改衣库房分流，整片C形屋盖由弧墙、外墙和内列柱共同支承，后巷员工门避开顾客试衣通路", recessedApparelShop, "建筑", "现代"),
  design("错翼双隔声室乐器店", "高零售中厅两侧错位接出不平行内墙的独立试听翼，各短声闸的两端真门错开，试听室内外墙之间保留可见空隙；后部低修琴翼有独立后巷门，各屋盖分别由对应实墙和接地柱梁承住，顾客展示路线和后场工作路线真实相通", staggeredMusicShop, "建筑", "现代"),
];

function recessedApparelShop(): ModelPart[] {
  const arc: [number, number][] = [], roofArc: [number, number][] = [];
  for (let i = 12; i >= 0; i--) {
    if (i === 6) continue;
    const angle = i * Math.PI / 12;
    arc.push([5 * Math.cos(angle), -8 + 5 * Math.sin(angle)]);
    roofArc.push([4.68 * Math.cos(angle), -8 + 4.68 * Math.sin(angle)]);
  }
  const p: ModelPart[] = [
    hardFloor("两座前翼围绕内凹门廊并接入宽后厅的完整C形店坪", paving, [[-9, -8], ...arc, [9, -8], [9, 8], [-9, 8]], .2, [0, 0, 0]),
    hardFloor("弧形橱窗外真实开放到街道的独立凹入门廊铺坪", "#c9c5b5", arc, .2, [0, 0, 0]),
    hardFloor("沿外壁外伸且沿凹弧反向收边的完整厚屋盖", roofColor, [[-9.32, -8.32], [-4.68, -8.32], ...roofArc, [4.68, -8.32], [9.32, -8.32], [9.32, 8.32], [-9.32, 8.32]], .25, [0, 4.2, 0]),
    ...glazedWall("西展示翼临街端部真橱窗", [-9, -8], [-5, -8], .2, 4.2, [[0, .6, 2.6, 2.7]]),
    ...glazedWall("东展示翼临街端部真橱窗", [5, -8], [9, -8], .2, 4.2, [[0, .6, 2.6, 2.7]]),
    ...glazedWall("店体西侧连续实墙和后部高窗", [-9, -8], [-9, 8], .2, 4.2, [[-2, 2.7, 4, .65], [5.5, 2.7, 2, .65]]),
    ...glazedWall("店体东侧实际服务门和改衣间高窗", [9, -8], [9, 8], .2, 4.2, [[-3, 1.1, 3.4, 1.8], [5.5, 2.8, 2, .6]], [[1.6, .2, 1.2, 2.6]]),
    ...glazedWall("试衣与后库共同完整承屋的后墙保留独立后巷门", [-9, 8], [9, 8], .2, 4.2, [[-7, 2.9, 1.6, .55], [-3, 2.9, 1.6, .55], [1, 2.9, 1.6, .55]], [[6, .2, 1.3, 2.6]]),
    ...glazedWall("后排试衣间面向公共横道各自真实独立的门", [-9, 5], [3, 5], .2, 4.2, [], [[-4, .2, 1.4, 2.4], [0, .2, 1.1, 2.4], [4, .2, 1.1, 2.4]]),
    ...glazedWall("后尾改衣库房独立员工门与公共试衣横道分开", [3, 4], [9, 4], .2, 4.2, [], [[.5, .2, 1.2, 2.6]]),
    box("西侧两间试衣室之间实际接到后墙的隔壁", -5, 2.2, 6.5, .16, 4, 3, "#c8c3b2"),
    box("中间与东侧试衣室之间的完整隔壁", -1, 2.2, 6.5, .16, 4, 3, "#c8c3b2"),
    box("改衣库房与公共试衣室之间的连续长隔壁", 3, 2.2, 6, .16, 4, 4, "#c8c3b2"),
  ];
  for (let i = 0; i < arc.length - 1; i++) {
    const start = arc[i]!, end = arc[i + 1]!, length = Math.hypot(end[0] - start[0], end[1] - start[1]);
    const central = start[0] < 0 && end[0] > 0;
    p.push(...glazedWall(central ? "凹弧深处真实平直双开入口洞" : "随凹廊折转且具有真实玻璃窗孔的独立弧面段", start, end, .2, 4.2, central ? [] : [[0, .6, length - .34, 2.7]], central ? [[0, .2, 2, 2.8]] : []));
  }
  const frames: SolidBox[] = [], fittings: SolidBox[] = [], necks: SolidBox[] = [];
  for (const x of [-5, 5]) {
    for (const z of [1, 6]) frames.push({ center: [x, 2.2, z], size: [.22, 4, .22] });
    frames.push({ center: [x, 4.08, 3.5], size: [.22, .24, 9] });
  }
  for (const z of [1, 6]) frames.push({ center: [0, 4.08, z], size: [18, .24, .22] });
  for (const x of [-6.9, 6.9]) {
    for (const z of [-6, -3.8]) {
      frames.push({ center: [x, 1.1, z], size: [.065, 1.8, .065] }, { center: [x, .25, z], size: [.9, .1, .16] });
    }
    frames.push({ center: [x, 2, -4.9], size: [.065, .065, 2.4] });
    for (const z of [-5.55, -4.9, -4.25]) {
      necks.push({ center: [x, 1.81, z], size: [.025, .38, .025] });
      p.push(part("展示衣杆上具有领口缺口与展开双袖的独立衣身", "extrude", fabric, [x, 1.2, z], [1, 1, 1], [0, 0, 0], { depth: .045, profile: [{ x: -.12, y: .55 }, { x: -.32, y: .47 }, { x: -.42, y: .18 }, { x: -.27, y: .12 }, { x: -.21, y: .28 }, { x: -.21, y: -.2 }, { x: .21, y: -.2 }, { x: .21, y: .28 }, { x: .27, y: .12 }, { x: .42, y: .18 }, { x: .32, y: .47 }, { x: .12, y: .55 }, { x: .1, y: .42 }, { x: -.1, y: .42 }] }));
    }
  }
  for (const x of [-7, -3, 1]) {
    fittings.push({ center: [x - .9, .65, 7.4], size: [1.2, .12, .48] });
    for (const foot of [-1, 1]) fittings.push({ center: [x - .9 + foot * .45, .395, 7.4], size: [.12, .39, .4] });
    p.push(part("独立试衣室后壁上与门位错开的真实薄镜", "box", "#b8c4be", [x + .9, 1.8, 7.745], [.7, 1.6, .035], [0, 0, 0], { metalness: .93, roughness: .07 }));
  }
  fittings.push({ center: [8, 1.06, 6], size: [1.5, .12, 2.4] });
  for (const x of [7.4, 8.6]) for (const z of [5, 7]) fittings.push({ center: [x, .63, z], size: [.12, .86, .12] });
  p.push(boxesMesh("服饰店内实际接屋盖的柱梁及独立接地衣架", metal, frames), boxesMesh("衣架上从衣杆实际伸入衣领下缘的短承挂杆", metal, necks), boxesMesh("试衣间坐凳和改衣工作台的完整承托", timber, fittings));
  return p;
}

function staggeredMusicShop(): ModelPart[] {
  const leftOuter: [number, number][] = [[-12, -5], [-7, -5], [-7, 1], [-12, .3]];
  const leftInner: [number, number][] = [[-11.5, -4.5], [-7.5, -4.1], [-7.5, .35], [-11.5, -.2]];
  const rightOuter: [number, number][] = [[7, 0], [12, .6], [12, 7], [7, 7]];
  const rightInner: [number, number][] = [[7.5, .6], [11.5, 1.3], [11.5, 6.5], [7.5, 6.5]];
  const p: ModelPart[] = [
    box("乐器零售中厅完整落地地坪", 0, .1, -1, 10, .2, 18, paving),
    box("西侧真实声闸从中厅接到左试听翼的独立楼面", -6, .1, -1.5, 2, .2, 4, paving),
    box("东侧真实声闸错位接到右试听翼的独立楼面", 6, .1, 4.25, 2, .2, 3.5, paving),
    hardFloor("西试听翼完整不规则落地基础", paving, leftOuter, .2, [0, 0, 0]),
    hardFloor("东试听翼完整不规则落地基础", paving, rightOuter, .2, [0, 0, 0]),
    box("修琴工作翼从中厅后真门连续接入的独立地坪", 0, .1, 10, 6, .2, 4, paving),
    box("高零售中厅由两侧墙和内柱列承托的完整屋盖", 0, 4.925, -1, 10.6, .25, 18.6, roofColor),
    box("西侧错门声闸由两端主墙和短侧墙实际承住的低盖", -6, 3.1, -1.5, 2.6, .2, 4.6, roofColor),
    box("东侧错门声闸完整独立低盖", 6, 3.1, 4.25, 2.6, .2, 4.1, roofColor),
    hardFloor("西试听外壳独立承托且随斜后壁收边的厚顶", roofColor, [[-12.3, -5.3], [-6.7, -5.3], [-6.7, 1.33], [-12.3, .6]], .25, [0, 3.9, 0]),
    hardFloor("东试听外壳随斜前壁收边的独立厚顶", roofColor, [[6.7, -.34], [12.3, .3], [12.3, 7.3], [6.7, 7.3]], .25, [0, 3.9, 0]),
    hardFloor("西试听室内墙上真实封合且与外顶分离的独立声罩", "#b0b4a4", [[-11.77, -4.79], [-7.23, -4.37], [-7.23, .63], [-11.77, .06]], .12, [0, 3.3, 0]),
    hardFloor("东试听室内墙上真实封合且与外顶分离的独立声罩", "#b0b4a4", [[7.23, .29], [11.77, 1.03], [11.77, 6.77], [7.23, 6.77]], .12, [0, 3.3, 0]),
    box("后修琴工作翼完整低屋盖", 0, 3.525, 10, 6.6, .25, 4.6, roofColor),
    ...glazedWall("琴行正街真实宽主门与两侧大橱窗", [-5, -10], [5, -10], .2, 4.8, [[-3.1, .65, 2.2, 3.05], [3.1, .65, 2.2, 3.05]], [[0, .2, 2, 2.8]]),
    ...glazedWall("中厅西长墙上真正进入偏前声闸的独立门", [-5, 8], [-5, -10], .2, 4.8, [[-4.5, 3.6, 4.8, .65], [5, 3.6, 4.8, .65]], [[0, .2, 1.2, 2.6]]),
    ...glazedWall("中厅东长墙上真正进入偏后声闸的独立门", [5, -10], [5, 8], .2, 4.8, [[-5.5, 3.6, 4.2, .65], [5.5, 3.6, 4.2, .65]], [[5.8, .2, 1.2, 2.6]]),
    ...glazedWall("中厅后端实际进入低修琴工作翼的独立门", [-5, 8], [5, 8], .2, 4.8, [[0, 3.8, 5.5, .65]], [[0, .2, 1.8, 2.6]]),
    box("西声闸前短壁实际封到两端主墙", -6, 1.6, -3.5, 2.25, 2.8, .18, "#c6c3b2"),
    box("西声闸后短壁形成两道偏置门间真实转向余地", -6, 1.6, .5, 2.25, 2.8, .18, "#c6c3b2"),
    box("东声闸前短壁实际接入中厅和试听外壳", 6, 1.6, 2.5, 2.25, 2.8, .18, "#c6c3b2"),
    box("东声闸后短壁实际封合错门通道", 6, 1.6, 6, 2.25, 2.8, .18, "#c6c3b2"),
    ...glazedWall("后修琴翼西侧真实高窗承屋壁", [-3, 8], [-3, 12], .2, 3.4, [[0, 2.3, 2.5, .65]]),
    ...glazedWall("后修琴翼东侧真实高窗承屋壁", [3, 8], [3, 12], .2, 3.4, [[0, 2.3, 2.5, .65]]),
    ...glazedWall("修琴间后巷独立员工门和不遮门的窗", [-3, 12], [3, 12], .2, 3.4, [[-1.7, 1.4, 1.5, 1.2]], [[1.4, .2, 1.2, 2.6]]),
  ];
  for (const [outer, inner, doorway, edge] of [[leftOuter, leftInner, -2.6, 1], [rightOuter, rightInner, 3.2, 3]] as const) {
    for (let i = 0; i < outer.length; i++) {
      const start = outer[i]!, end = outer[(i + 1) % outer.length]!, direction = Math.sign(end[1] - start[1]);
      const center = (start[1] + end[1]) / 2, offset = (doorway - center) * direction;
      p.push(...glazedWall("试听翼外承墙与声闸真实相接的开门空壳", start, end, .2, 3.9, i === 0 ? [[0, 2.75, Math.hypot(end[0] - start[0], end[1] - start[1]) - 1, .65]] : [], i === edge ? [[offset, .2, 1.1, 2.5]] : []));
      const a = inner[i]!, b = inner[(i + 1) % inner.length]!, innerCenter = (a[1] + b[1]) / 2, innerOffset = (doorway - innerCenter) * Math.sign(b[1] - a[1]);
      p.push(...glazedWall("试听室与外壳分离且保留同轴可通行门洞的独立内壁", a, b, .2, 3.3, [], i === edge ? [[innerOffset, .2, 1.1, 2.5]] : []));
    }
  }
  const structure: SolidBox[] = [], furnishings: SolidBox[] = [], keys: SolidBox[] = [];
  for (const x of [-4.7, 4.7]) for (const z of [-9.6, 0, 7.6]) structure.push({ center: [x, 2.5, z], size: [.22, 4.6, .22] });
  for (const z of [-9.6, 0, 7.6]) structure.push({ center: [0, 4.68, z], size: [9.6, .24, .22] });
  for (const x of [-4.7, 4.7]) structure.push({ center: [x, 4.68, -1], size: [.22, .24, 17.5] });
  for (const root of [[2.5, .2, -5.7], [-9.4, .2, -2.2]] as Triple[]) {
    const [x, y, z] = root;
    furnishings.push({ center: [x, y + .68, z + .18], size: [1.5, 1.36, .36] }, { center: [x, y + .83, z - .16], size: [1.5, .12, .6] }, { center: [x, y + 1.39, z + .18], size: [1.57, .06, .42] });
    for (const side of [-1, 1]) furnishings.push({ center: [x + side * .63, y + .4, z - .32], size: [.1, .8, .12] });
    for (let key = 0; key < 16; key++) keys.push({ center: [x - .64 + key * .085, y + .91, z - .24], size: [.078, .04, .37] });
    furnishings.push({ center: [x, y + .48, z - 1.15], size: [1, .12, .42] });
    for (const side of [-1, 1]) furnishings.push({ center: [x + side * .36, y + .21, z - 1.15], size: [.12, .42, .32] });
  }
  for (const x of [-2.9, -.9]) {
    p.push(part("琴行展示支架上具有实心电吉他收腰和双角的完整琴身", "extrude", "#9b836b", [x, .92, -7.3], [1, 1, 1], [0, 0, 0], { depth: .06, profile: [{ x: -.1, y: .3 }, { x: -.2, y: .4 }, { x: -.28, y: .27 }, { x: -.2, y: .1 }, { x: -.31, y: -.12 }, { x: -.29, y: -.29 }, { x: -.16, y: -.38 }, { x: .17, y: -.38 }, { x: .3, y: -.27 }, { x: .3, y: -.12 }, { x: .18, y: .1 }, { x: .25, y: .31 }, { x: .11, y: .39 }, { x: .09, y: .28 }] }));
    furnishings.push({ center: [x, 1.53, -7.3], size: [.075, .75, .055] }, { center: [x, 1.965, -7.3], size: [.115, .18, .07] }, { center: [x, .73, -7.345], size: [.17, .035, .025] });
    structure.push({ center: [x, .24, -7.2], size: [.65, .08, .55] }, { center: [x, .62, -7.12], size: [.035, .8, .035] }, { center: [x, .57, -7.25], size: [.4, .05, .1] });
  }
  furnishings.push({ center: [-1.8, 1.04, 10.6], size: [1.45, .12, 1.9] });
  for (const x of [-2.35, -1.25]) for (const z of [9.85, 11.35]) furnishings.push({ center: [x, .62, z], size: [.12, .84, .12] });
  furnishings.push({ center: [9.8, .52, 4.8], size: [1.1, .64, .55] }, { center: [9.8, .96, 2.9], size: [.7, .12, .65] });
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) furnishings.push({ center: [9.8 + sx * .25, .55, 2.9 + sz * .23], size: [.075, .7, .075] });
  p.push(boxesMesh("琴行高主厅完整承重柱梁及展示琴体的独立接地支架", metal, structure));
  for (let i = 0; i < furnishings.length; i += 20) p.push(boxesMesh("零售与试听室完整落地琴体座凳和后修琴工作台", timber, furnishings.slice(i, i + 20)));
  for (let i = 0; i < keys.length; i += 20) p.push(boxesMesh("实际搭在两座琴键床上的分离薄键板", "#d8d5c5", keys.slice(i, i + 20)));
  p.push(rail([9.3, .68, 4.51], [10.3, .68, 4.51], .04, metal));
  return p;
}
