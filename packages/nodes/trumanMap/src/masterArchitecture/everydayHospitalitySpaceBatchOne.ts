import { part, type ModelPart } from "../assetModelParts";
import { cup, piercedPanel } from "../masterObjects/parts";
import { slab } from "./modernCommercialSpaceBatchOne";
import { boxesMesh, type SolidBox } from "./publicSpaceBatchEight";
import { box, cylinder, design, rail, type ArchitecturePrototype } from "./structures";

const stone = "#b3b6a9", timber = "#a28a68", roof = "#667d78", fabric = "#c4c8b4";

type WallOpening = [number, number, number, number];

function hotelWall(name: string, start: [number, number], end: [number, number], bottom: number, top: number, windows: WallOpening[], doors: WallOpening[] = []): ModelPart[] {
  const dx = end[0] - start[0], dz = end[1] - start[1], length = Math.hypot(dx, dz), ux = dx / length, uz = dz / length, outline: [number, number][] = [[-length / 2, bottom]];
  for (const [center, base, width, height] of doors.filter(value => value[1] <= bottom).sort((a, b) => a[0] - b[0])) outline.push([center - width / 2, bottom], [center - width / 2, base + height], [center + width / 2, base + height], [center + width / 2, bottom]);
  outline.push([length / 2, bottom], [length / 2, top], [-length / 2, top]);
  const holes = [...windows, ...doors.filter(value => value[1] > bottom)].map(([center, base, width, height]): [number, number][] => [[center - width / 2, base], [center + width / 2, base], [center + width / 2, base + height], [center - width / 2, base + height]]);
  const value = piercedPanel(name, [0, 0, 0], outline, holes, 0.24, "#c6c5b5");
  value.vertices = value.indices!.map(index => { const point = value.vertices![index]!; return { x: (start[0] + end[0]) / 2 + point.x * ux + point.y * uz, y: point.z, z: (start[1] + end[1]) / 2 + point.x * uz - point.y * ux }; });
  delete value.indices;
  return [value, ...windows.map(([center, base, width, height]) => part("各实际窗孔内独立承接窗框的薄玻璃", "box", "#a5c7c4", [(start[0] + end[0]) / 2 + center * ux + 0.12 * uz, base + height / 2, (start[1] + end[1]) / 2 + center * uz - 0.12 * ux], [width, height, 0.035], [0, -Math.atan2(dz, dx) * 180 / Math.PI, 0], { opacity: 0.28, roughness: 0.22 }))];
}

function hotelStair(name: string, x: number, y: number, z: number, width: number, count: number, rise: number, run: number, reverse = false): ModelPart {
  const outline: [number, number][] = [[0, 0], [count * run, 0], [count * run, count * rise]];
  for (let index = count - 1; index >= 0; index--) { outline.push([index * run, (index + 1) * rise]); if (index) outline.push([index * run, index * rise]); }
  const value = piercedPanel(name, [0, 0, 0], outline, [], width, stone);
  value.vertices = value.indices!.map(index => { const point = value.vertices![index]!; return { x: x + (reverse ? width / 2 - point.y : point.y - width / 2), y: y + point.z, z: z + point.x * (reverse ? -1 : 1) }; });
  delete value.indices;
  return value;
}

export const everydayHospitalitySpaceBatchOneDesigns: ArchitecturePrototype[] = [
  design("偏核错向双翼街边小旅店", "临街横翼的底层接待厅和上层三间客房接到偏置挑空直跑梯厅，梯厅高端再转入后纵翼单边廊的六间独立客房；两翼外廓、房门和完整楼面真实相接，没有环廊井庭或停车围院", offsetCoreInn, "建筑", "现代"),
  design("共餐横厅串接错位双寝翼青年旅舍", "高位公共餐厅是两条前后错位低寝翼实际共用的主体空间，寝翼内廊经独立实门接厅两端，六间分室内上下铺保持独立承托，公共盥洗与餐席让开贯通出入口；低翼整盖与高厅真实收头，完整落地空间不拆成散摆房间", sharedHallHostel, "建筑", "现代"),
];

function offsetCoreInn(): ModelPart[] {
  const outline: [number, number][] = [[-14, -8], [4, -8], [4, -1], [11, -1], [11, 14], [4, 14], [4, 1], [-2, 1], [-2, -1], [-14, -1]];
  const stairHole: [number, number][] = [[0, -6.8], [2, -6.8], [2, -1.4], [0, -1.4]], floors = [0.22, 3.52];
  const parts: ModelPart[] = [slab("横接待翼、偏核梯厅与后纵房翼连续相接的完整基础", stone, [[-14.3, -8.3], [4.3, -8.3], [4.3, -1.3], [11.3, -1.3], [11.3, 14.3], [3.7, 14.3], [3.7, 1.3], [-2.3, 1.3], [-2.3, -0.7], [-14.3, -0.7]], 0.22, [0, 0, 0]), slab("两翼上层完整地面只在梯厅保留真实楼梯孔", timber, outline, 0.22, [0, 3.3, 0], [stairHole]), box("临街横翼完整低平屋盖", -8, 6.93, -4.5, 12.5, 0.22, 7.5, roof), box("后纵房翼完整封顶并接到偏核侧壁的平盖", 7.5, 6.93, 6.5, 7.5, 0.22, 15.5, roof), box("偏置挑空梯厅独立接承两翼的高顶盖", 1, 7.71, -3.5, 6.6, 0.22, 9.6, roof)];
  parts.push(...hotelWall("临街真实主入口与上下分层的独立采光窗", [-14, -8], [-2, -8], 0.22, 6.82, [[-4.3, 1.07, 2.8, 1.6], [3.5, 1.07, 3, 1.6], ...[-4, 0, 4].map((x): [number, number, number, number] => [x, 4.42, 2.4, 1.55])], [[-0.5, 0.22, 2, 2.5]]), ...hotelWall("横翼后面真实接承层板的接待长窗与客房分窗", [-14, -1], [-2, -1], 0.22, 6.82, [[0, 1.07, 8.5, 1.6], ...[-4, 0, 4].map((x): [number, number, number, number] => [x, 4.42, 2.4, 1.55])]), ...hotelWall("横翼西端完整封合到上下屋盖的开窗厚壁", [-14, -8], [-14, -1], 0.22, 6.82, [[0, 1.07, 3.6, 1.6], [0, 4.42, 3, 1.55]]));
  parts.push(...hotelWall("横接待厅和上层单边廊各自穿入偏核的真实门", [-2, -8], [-2, -1], 0.22, 7.6, [], [[-2.2, 0.22, 1.7, 2.5], [-2.2, 3.52, 1.6, 2.3]]), ...hotelWall("偏核东壁逐层向后纵翼内廊打开的真实门", [4, -8], [4, 1], 0.22, 7.6, [], [[3.5, 0.22, 1.3, 2.3], [3.5, 3.52, 1.3, 2.3]]), ...hotelWall("偏核临街立面从地层连续接到高顶的竖向采光壁", [-2, -8], [4, -8], 0.22, 7.6, [[0, 1.07, 3.2, 1.6], [0, 4.42, 3.2, 2.2]]), ...hotelWall("梯厅高端面向后院的完整透光承屋墙", [-2, 1], [4, 1], 0.22, 7.6, [[0, 1.07, 3.2, 1.6], [0, 4.42, 3.2, 2.2]]), ...hotelWall("偏核超出横翼后的独立短侧窗壁", [-2, -1], [-2, 1], 0.22, 7.6, [[0, 1.07, 1.1, 1.6], [0, 4.42, 1.1, 2.2]]));
  parts.push(...hotelWall("后纵翼外侧逐间实际开窗的完整东墙", [11, -1], [11, 14], 0.22, 6.82, floors.flatMap(y => [-5, 0, 5].map((z): [number, number, number, number] => [z, y + 0.9, 2.8, 1.55]))), ...hotelWall("单边公共走廊朝外采光且在梯厅口后才起墙的西壁", [4, 1], [4, 14], 0.22, 6.82, floors.flatMap(y => [-3.5, 3.5].map((z): [number, number, number, number] => [z, y + 0.9, 3.2, 1.55]))), ...hotelWall("后纵翼向街侧实际封合的完整端壁", [4, -1], [11, -1], 0.22, 6.82, [[1.7, 1.12, 2, 1.5], [1.7, 4.42, 2, 1.55]]), ...hotelWall("后纵翼尽端真实地面出口与上层采光窗", [4, 14], [11, 14], 0.22, 6.82, [[0.5, 1.12, 3.4, 1.5], [-2.5, 4.42, 1, 1.55]], [[-2.5, 0.22, 1.1, 2.3]]));
  const bedFrames: SolidBox[] = [], mattresses: SolidBox[] = [];
  const addBed = (x: number, y: number, z: number) => {
    bedFrames.push({ center: [x, y + 0.2, z], size: [1.6, 0.4, 2.1] }, { center: [x, y + 0.58, z + 1], size: [1.68, 1.16, 0.12] });
    mattresses.push({ center: [x, y + 0.47, z], size: [1.56, 0.14, 2.06] });
  };
  for (const y of floors) {
    const top = y === 0.22 ? 3.3 : 6.82;
    parts.push(...hotelWall("后纵翼每间客房独立开向单边公共走廊的实门", [6, -1], [6, 14], y, top, [], [-5, 0, 5].map((z): [number, number, number, number] => [z, y, 0.95, 2.3])));
    for (const z of [4, 9]) parts.push(box("后纵翼相邻客房之间不侵入公共走廊的完整隔墙", 8.5, (y + top) / 2, z, 5, top - y, 0.18, stone));
    for (const z of [1.5, 6.5, 11.5]) addBed(9.35, y, z);
  }
  parts.push(...hotelWall("横翼上层三个房间各自面向临街公共廊的独立门", [-14, -5.8], [-2, -5.8], 3.52, 6.82, [], [-4, 0, 4].map((x): [number, number, number, number] => [x, 3.52, 0.95, 2.3])));
  for (const x of [-10, -6]) parts.push(box("横翼上层客房从门壁到后窗壁的实分室墙", x, 5.17, -3.4, 0.18, 3.3, 4.8, stone));
  for (const x of [-12, -8, -4]) addBed(x, 3.52, -3.3);
  parts.push(boxesMesh("九间客房全部实际落在本层地面的床架和床头", timber, bedFrames), boxesMesh("各床架上相接而不悬浮的独立软床垫", fabric, mattresses), box("底层接待厅避开通向偏核路线的完整前台", -4.4, 0.77, -2.2, 3.5, 1.1, 0.8, timber), box("接待前台实际贴住柜体的浅石台面", -4.4, 1.37, -2.2, 3.6, 0.1, 0.9, stone), box("西墙前等待区实际落地的连续坐台", -13.2, 0.44, -3.5, 0.85, 0.44, 2.4, timber));
  for (let flight = 0; flight < 2; flight++) parts.push(hotelStair("偏核真实梯井内连续上行并在高端接入后纵翼梯厅的直跑梯段", 1, 0.22 + flight * 1.65, -6.8 + flight * 2.7, 1.8, 10, 0.165, 0.27));
  for (const x of [0.08, 1.92]) {
    parts.push(rail([x, 0.16, -6.8], [x, 3.46, -1.4], 0.16, roof), rail([x, 1.32, -6.8], [x, 4.62, -1.4], 0.055, roof));
    for (const z of [-6.8, -4.1, -1.4]) { const y = 0.22 + (z + 6.8) / 5.4 * 3.3; parts.push(box("楼梯扶手在低端中段与高端实际接到踏面边缘的立柱", x, y + 0.55, z, 0.055, 1.1, 0.055, roof)); }
  }
  const guards: SolidBox[] = [];
  for (const x of [-0.035, 2.035]) {
    parts.push(rail([x, 4.62, -6.8], [x, 4.62, -1.4], 0.055, roof));
    for (const z of [-6.8, -4.1, -1.4]) guards.push({ center: [x, 4.07, z], size: [0.055, 1.1, 0.055] });
  }
  parts.push(rail([-0.035, 4.62, -6.8], [2.035, 4.62, -6.8], 0.055, roof), boxesMesh("只在低端与长侧封护而保留高端上楼口的梯井护栏立柱", roof, guards));
  parts.push(hotelStair("临街主入口从场地连续接到接待厅地坪的两级短阶", -8.5, 0, -9.2, 2.4, 2, 0.11, 0.6), hotelStair("后端出口与室外地面实际相接的两级短阶", 5, 0, 15.2, 1.5, 2, 0.11, 0.6, true));
  return parts;
}

function sharedHallHostel(): ModelPart[] {
  const foundation: [number, number][] = [[-11.3, -17.3], [-3.7, -17.3], [-3.7, -4.3], [11.3, -4.3], [11.3, 17.3], [3.7, 17.3], [3.7, 4.3], [-11.3, 4.3]];
  const parts: ModelPart[] = [slab("两条寝翼和共用餐厅实际接合为一体的完整落地基础", stone, foundation, 0.2, [0, 0, 0]), box("中央公共餐厅由四实柱两承梁接承的高平屋盖", 0, 4.31, 0, 22.6, 0.22, 8.6, roof), box("朝前寝翼在高共厅壁上实际收头的完整低屋盖", -7.5, 3.41, -10.5, 7.6, 0.22, 13.6, roof), box("朝后寝翼在高共厅壁上实际收头的完整低屋盖", 7.5, 3.41, 10.5, 7.6, 0.22, 13.6, roof)];
  parts.push(...hotelWall("共餐厅前壁同时让出外部主门与前寝翼内廊的实际门", [-11, -4], [11, -4], 0.2, 4.2, [[6.5, 1.05, 5, 2], [-7.5, 3.5, 5, 0.45]], [[0, 0.2, 2.2, 2.6], [-5, 0.2, 1.4, 2.4]]), ...hotelWall("共餐厅后壁分别接入后寝翼和独立室外后门", [-11, 4], [11, 4], 0.2, 4.2, [[-6.5, 3.2, 6, 0.65], [7.5, 3.5, 5, 0.45]], [[0, 0.2, 1.6, 2.4], [5, 0.2, 1.4, 2.4]]), ...hotelWall("公共餐厅西端避开盥洗隔室的完整实窗承墙", [-11, -4], [-11, 4], 0.2, 4.2, [[-1.7, 1.05, 3, 2], [2.5, 3.2, 2.2, 0.65]]), ...hotelWall("公共餐厅东端与高屋盖实际闭合的长采光墙", [11, -4], [11, 4], 0.2, 4.2, [[0, 1.05, 5.5, 2.1]]));
  const columns: SolidBox[] = [];
  for (const z of [-3.55, 3.55]) {
    columns.push({ center: [0, 4.01, z], size: [22, 0.38, 0.25] });
    for (const x of [-3, 3]) columns.push({ center: [x, 2.01, z], size: [0.25, 3.62, 0.25] });
  }
  parts.push(boxesMesh("共餐高厅不占主门的四根落地承柱与两道完整横梁", roof, columns));
  const bedFrames: SolidBox[] = [], mattresses: SolidBox[] = [];
  for (const side of [-1, 1]) {
    const start = side < 0 ? -17 : 4, end = side < 0 ? -4 : 17, center = (start + end) / 2, roomX = side * 8.5, corridorWallX = side * 6, outsideX = side * 11, corridorOutsideX = side * 4;
    const centers = Array.from({ length: 3 }, (_, index) => start + (index + 0.5) * 13 / 3);
    parts.push(...hotelWall("低寝翼外侧与各独立寝室对应的真实开窗厚壁", [outsideX, start], [outsideX, end], 0.2, 3.3, centers.map((z): WallOpening => [z - center, 1.05, 2.6, 1.5])), ...hotelWall("错位寝翼公共内廊独立向外采光的承屋薄壁", [corridorOutsideX, start], [corridorOutsideX, end], 0.2, 3.3, [[-3.5, 1.05, 2.8, 1.5], [3.5, 1.05, 2.8, 1.5]]), ...hotelWall("寝翼各分室分别开向内部连续走道的真实门", [corridorWallX, start], [corridorWallX, end], 0.2, 3.3, [], centers.map((z): WallOpening => [z - center, 0.2, 1, 2.3])));
    const endZ = side < 0 ? start : end, corridorX = side * 5;
    parts.push(...hotelWall("寝翼尽端室外出口和寝室端窗各自完整开通", [side * 7.5 - 3.5, endZ], [side * 7.5 + 3.5, endZ], 0.2, 3.3, [[side, 1.05, 3, 1.5]], [[corridorX - side * 7.5, 0.2, 1.1, 2.3]]));
    for (let split = 1; split < 3; split++) parts.push(box("三间宿舍之间真正由地面接到低翼屋盖的完整隔墙", roomX, 1.75, start + split * 13 / 3, 5, 3.1, 0.18, stone));
    for (const z of centers) for (const x of [side * 7.35, side * 10.25]) {
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) bedFrames.push({ center: [x + sx * 0.43, 1.15, z + sz * 1.02], size: [0.065, 1.9, 0.065] });
      for (const y of [0.55, 1.55]) { bedFrames.push({ center: [x, y, z], size: [0.92, 0.1, 2.15] }); mattresses.push({ center: [x, y + 0.11, z], size: [0.88, 0.12, 2.08] }); }
      for (const sx of [-1, 1]) bedFrames.push({ center: [x + sx * 0.43, 1.98, z], size: [0.065, 0.07, 2.15] });
      bedFrames.push({ center: [x, 1.98, z + 1.02], size: [0.92, 0.07, 0.065] });
      for (const y of [0.65, 1, 1.35]) bedFrames.push({ center: [x, y, z - 1.02], size: [0.86, 0.04, 0.05] });
    }
    parts.push(hotelStair("寝翼外端门连续接回场地的两级短阶", corridorX, 0, endZ + side * 1.2, 1.5, 2, 0.1, 0.6, side > 0));
  }
  for (let start = 0; start < bedFrames.length; start += 18) parts.push(boxesMesh("寝室上下铺的真实落地立架承板护边与攀梯横档", timber, bedFrames.slice(start, start + 18)));
  for (let start = 0; start < mattresses.length; start += 18) parts.push(boxesMesh("上下铺床板上实际相接的独立软垫", fabric, mattresses.slice(start, start + 18)));
  const tables: SolidBox[] = [], tops: SolidBox[] = [];
  for (const x of [-3, 2, 7]) {
    tables.push({ center: [x, 0.57, 0], size: [0.5, 0.74, 0.6] }); tops.push({ center: [x, 0.98, 0], size: [2.2, 0.08, 1.1] });
    for (const z of [-1.15, 1.15]) tables.push({ center: [x, 0.39, z], size: [0.45, 0.38, 0.4] }, { center: [x, 0.615, z], size: [2.2, 0.07, 0.44] });
  }
  parts.push(boxesMesh("餐厅各长桌和两边长凳的独立落地承脚及座面", timber, tables), boxesMesh("全部桌脚实际顶住的公共餐桌薄桌面", stone, tops), box("共餐厅侧前方避开主门和寝翼门的完整备餐柜", 7.6, 0.7, -3.2, 4.8, 1, 0.7, timber), box("备餐柜上实际相接的整片台面", 7.6, 1.24, -3.2, 4.9, 0.08, 0.75, stone));
  parts.push(...hotelWall("公共盥洗隔室分别面向餐厅后侧走道的独立实门", [-11, 0.8], [-6, 0.8], 0.2, 2.8, [], [[-1.25, 0.2, 0.85, 2.1], [1.25, 0.2, 0.85, 2.1]]), box("两个盥洗隔室之间由地面起立的实际分隔", -8.5, 1.5, 2.4, 0.15, 2.6, 3.2, stone), box("盥洗隔室与餐厅后部公共过道之间的完整端壁", -6, 1.5, 2.4, 0.18, 2.6, 3.2, stone));
  const bathroom: SolidBox[] = [];
  for (const x of [-9.75, -7.25]) {
    parts.push(cylinder("盥洗隔室内实际落地的坐便器短承座", x, 0.4, 3, 0.42, 0.4, "#d3d1be"), { ...cup("承座上保留开放内腔的独立坐便器碗体", [x, 0.57, 3], 0.26, 0.2, "#d3d1be"), scale: { x: 1, y: 1, z: 1.35 } });
    bathroom.push({ center: [x, 0.65, 3.4], size: [0.3, 0.17, 0.4] }, { center: [x, 0.95, 3.66], size: [0.5, 0.7, 0.2] });
  }
  parts.push(boxesMesh("坐便器后桥实际承住的独立后水箱", "#d3d1be", bathroom), box("盥洗隔室外实际落地的公共洗手台柜", -4.8, 0.62, 3.35, 0.8, 0.84, 0.6, timber), { ...cup("公共洗手台柜上有真实底壁的开放浅盆", [-4.8, 1.02, 3.35], 0.35, 0.15, "#d3d1be"), scale: { x: 1, y: 1, z: 0.75 } }, cylinder("洗手台后方从台柜顶实际起立的龙头短颈", -4.8, 1.17, 3.62, 0.022, 0.26, roof), rail([-4.8, 1.3, 3.62], [-4.8, 1.3, 3.36], 0.022, roof), hotelStair("餐厅正门从外部公共地面接入连续厅面的两级短阶", 0, 0, -5.2, 2.6, 2, 0.1, 0.6), hotelStair("餐厅独立后门实际接回室外的两级短阶", 0, 0, 5.2, 2, 2, 0.1, 0.6, true));
  return parts;
}
