import { part, type ModelPart } from "../assetModelParts";
import { cup, piercedPanel } from "../masterObjects/parts";
import { boxesMesh, type SolidBox } from "./publicSpaceBatchEight";
import { box, cylinder, design, rail, type ArchitecturePrototype } from "./structures";

const stone = "#adb0a2", plaster = "#c6c4b2", timber = "#9c8261", roof = "#6a8077", fabric = "#c5c9b6";
type Point = [number, number];

function verticalSurface(name: string, axis: "xy" | "yz", offset: number, outline: Point[], holes: Point[][] = [], thickness = 0.24, color = plaster): ModelPart {
  const value = piercedPanel(name, [0, 0, 0], outline, holes, thickness, color);
  value.vertices = value.indices!.map(index => {
    const point = value.vertices![index]!;
    return axis === "xy" ? { x: point.x, y: point.z, z: offset + thickness / 2 - point.y } : { x: offset + point.y - thickness / 2, y: point.z, z: point.x };
  });
  delete value.indices;
  return value;
}

function windowPane(axis: "xy" | "yz", offset: number, center: number, bottom: number, width: number, height: number): ModelPart {
  return part("完整实墙真实孔口中的独立薄玻璃", "box", "#a0c2bf", axis === "xy" ? [center, bottom + height / 2, offset] : [offset, bottom + height / 2, center], axis === "xy" ? [width, height, 0.035] : [0.035, height, width], [0, 0, 0], { opacity: 0.28, roughness: 0.22 });
}

function rectangle(center: number, bottom: number, width: number, height: number): Point[] {
  return [[center - width / 2, bottom], [center + width / 2, bottom], [center + width / 2, bottom + height], [center - width / 2, bottom + height]];
}

export const everydayHospitalitySpaceBatchTwoDesigns: ArchitecturePrototype[] = [
  design("单长坡盖侧阶错台山地客舍", "三间家庭客舍和封闭侧内廊顺山势共用一个连续长屋身，内廊在两处分级端部以实阶升到下一平台，全部错台房室由同一长单坡屋盖与完整斜收头侧壁封合；前门落地、后门接高位观景台，套内湿室和床区由实门分开", steppedSideHallLodge, "建筑", "现代"),
  design("前更衣横厅接双排叠舱短住客舍", "低前厅包含接待、更衣开格和换鞋长凳，后方高长壳内两排上下睡眠方舱由真实分舱壁、层板和开孔攀梯构成；中央睡眠街直接接到五间独立淋浴盥洗隔室，全部舱口实际开放，前后公共门与完整屋盖构成同一栋短住客舍", capsuleSleepHouse, "建筑", "现代"),
];

function steppedSideHallLodge(): ModelPart[] {
  const roofY = (z: number) => 5.6 + z * 0.15;
  const outline: Point[] = [[-12, 0.2], [-4, 0.2], [-4, 1.6], [4, 1.6], [4, 3], [12, 3], [12, roofY(12)], [-12, roofY(-12)]];
  const parts: ModelPart[] = [box("前客舍与侧内廊共同的低位完整落地承台", 0, 0.1, -8.15, 9.6, 0.2, 8.3, stone), box("中客舍与侧廊平台真正由地面接起的中位承台", 0, 0.8, 0, 9.6, 1.6, 8, stone), box("后客舍和观景台连续由地面接起的高位承台", 0, 1.5, 9.15, 9.6, 3, 10.3, stone), part("一片连续坡面真实覆住三段错台与室内上行侧廊的完整屋盖", "extrude", roof, [0, 0, 0], [1, 1, 1], [0, -90, 0], { depth: 9.6, profile: [{ x: -12.3, y: roofY(-12.3) }, { x: 12.3, y: roofY(12.3) }, { x: 12.3, y: roofY(12.3) + 0.22 }, { x: -12.3, y: roofY(-12.3) + 0.22 }] })];
  const levels = [{ z: -8, y: 0.2 }, { z: 0, y: 1.6 }, { z: 8, y: 3 }], windows = levels.map(({ z, y }) => rectangle(z, y + 0.9, 4.4, 1.6));
  for (const x of [-4.5, 4.5]) {
    parts.push(verticalSurface("下缘随错台升起且上缘真实接承同一坡盖的完整长侧壁", "yz", x, outline, windows));
    for (const { z, y } of levels) parts.push(windowPane("yz", x, z, y + 0.9, 4.4, 1.6));
  }
  const roomWall: Point[] = [];
  for (let index = 0; index < levels.length; index++) {
    const { z, y } = levels[index]!;
    if (!index) roomWall.push([z - 4, y]);
    else roomWall.push([z - 4, y]);
    roomWall.push([z - 1.55, y], [z - 1.55, y + 2.3], [z - 0.45, y + 2.3], [z - 0.45, y], [z + 4, y]);
  }
  roomWall.push([12, roofY(12)], [-12, roofY(-12)]);
  parts.push(verticalSurface("三套客舍各自从本标高侧廊平门进入的连续实分隔墙", "yz", -2.1, roomWall));
  for (const z of [-4, 4]) parts.push(verticalSurface("相邻错台客舍之间自低地坪连续接到坡盖的完整分室厚壁", "xy", z, [[-2.1, z < 0 ? 0.2 : 1.6], [4.5, z < 0 ? 0.2 : 1.6], [4.5, roofY(z)], [-2.1, roofY(z)]], [], 0.18));
  for (const [z, y] of [[-12, 0.2], [12, 3]]) {
    const wall: Point[] = [[-4.5, y!], [-3.95, y!], [-3.95, y! + 2.3], [-2.65, y! + 2.3], [-2.65, y!], [4.5, y!], [4.5, roofY(z!)], [-4.5, roofY(z!)]];
    parts.push(verticalSurface(z! < 0 ? "客舍低端真正进入侧内廊的临街主门端壁" : "客舍高端真正进入观景台的后门端壁", "xy", z!, wall, [rectangle(1, y! + 0.9, 3.3, 1.6)]), windowPane("xy", z!, 1, y! + 0.9, 3.3, 1.6));
  }
  const bedFrames: SolidBox[] = [], soft: SolidBox[] = [], fixtures: SolidBox[] = [], railPosts: SolidBox[] = [];
  for (const { z, y } of levels) {
    bedFrames.push({ center: [0.9, y + 0.2, z], size: [2, 0.4, 2.2] }, { center: [0.9, y + 0.6, z + 1.04], size: [2.12, 1.2, 0.12] });
    soft.push({ center: [0.9, y + 0.47, z], size: [1.96, 0.14, 2.16] });
    fixtures.push({ center: [3.8, y + 0.9, z - 2.8], size: [0.8, 1.8, 1.4] }, { center: [-1.25, y + 0.55, z + 2.8], size: [0.8, 1.1, 1.4] });
    const bathFront = z + 2.2, bathEnd = z + 4, door = z + 3.1;
    parts.push(verticalSurface("各套盥洗室真正开门而独立于床区的内侧壁", "yz", 2.4, [[bathFront, y], [door - 0.375, y], [door - 0.375, y + 2.1], [door + 0.375, y + 2.1], [door + 0.375, y], [bathEnd, y], [bathEnd, y + 2.6], [bathFront, y + 2.6]], [], 0.14), box("套内盥洗室在床区一侧完整封合的低隔壁", 3.45, y + 1.3, bathFront, 2.1, 2.6, 0.14, plaster), box("套内盥洗室由低隔壁和外壁实际承托的独立平吊顶", 3.45, y + 2.65, z + 3.1, 2.1, 0.1, 1.8, plaster), cylinder("套内坐便器真正从本级地坪承起的短座", 3.7, y + 0.2, z + 3.3, 0.38, 0.4, plaster), { ...cup("短座上具有真正内腔的坐便器薄碗", [3.7, y + 0.37, z + 3.3], 0.24, 0.2, plaster), scale: { x: 1, y: 1, z: 1.25 } }, box("盥洗室外近门实际落在本级地面的浅洗手台柜", 1.9, y + 0.42, z + 2.6, 0.7, 0.84, 0.6, timber), { ...cup("洗手台柜上真正接合且有开放浅腔的独立盆", [1.9, y + 0.82, z + 2.6], 0.3, 0.14, plaster), scale: { x: 1, y: 1, z: 0.8 } });
  }
  parts.push(boxesMesh("三间套房各自落在本错台上的完整双人床架与床头", timber, bedFrames), boxesMesh("各床架上实际相接的三片独立软床垫", fabric, soft), boxesMesh("各套房避开房门和中间床区的实际落地衣柜和低柜", timber, fixtures), box("低端侧内廊近外壁且避开进门路线的短接待柜", -4.12, 0.72, -10.8, 0.5, 1.04, 1, timber));
  for (const [start, y] of [[-6.4, 0.2], [1.6, 1.6]]) {
    const profile: Point[] = [[start!, y!], [start! + 2.4, y!], [start! + 2.4, y! + 1.4]];
    for (let step = 7; step >= 0; step--) { profile.push([start! + step * 0.3, y! + (step + 1) * 0.175]); if (step) profile.push([start! + step * 0.3, y! + step * 0.175]); }
    parts.push(verticalSurface("侧内廊平台尾端直接接到下一错台的八级完整实体梯段", "yz", -3.3, profile, [], 1.7, stone));
    for (const x of [-4.15, -2.45]) {
      parts.push(rail([x, y! + 1.05, start!], [x, y! + 2.45, start! + 2.4], 0.05, roof));
      for (const t of [0, 0.5, 1]) railPosts.push({ center: [x, y! + t * 1.4 + 0.525, start! + t * 2.4], size: [0.05, 1.05, 0.05] });
    }
  }
  parts.push(rail([-4.65, 4.1, 14.15], [4.65, 4.1, 14.15], 0.06, roof), ...[-1, 1].map(side => rail([side * 4.65, 4.1, 12.15], [side * 4.65, 4.1, 14.15], 0.06, roof)));
  for (const x of [-4.65, -2.3, 0, 2.3, 4.65]) railPosts.push({ center: [x, 3.55, 14.15], size: [0.06, 1.1, 0.06] });
  for (const x of [-4.65, 4.65]) railPosts.push({ center: [x, 3.55, 12.15], size: [0.06, 1.1, 0.06] });
  for (let start = 0; start < railPosts.length; start += 18) parts.push(boxesMesh("室内上行扶手与高观景台均由本级地面承起的真实护栏立柱", roof, railPosts.slice(start, start + 18)));
  parts.push(verticalSurface("从公共地面接到低端主门的两级实际入户短阶", "yz", -3.3, [[-13.2, 0], [-12, 0], [-12, 0.2], [-12.6, 0.2], [-12.6, 0.1], [-13.2, 0.1]], [], 1.8, stone));
  return parts;
}

function capsuleSleepHouse(): ModelPart[] {
  const foundation: Point[] = [[-8.3, -10.3], [8.3, -10.3], [8.3, -3.7], [5.3, -3.7], [5.3, 10.3], [-5.3, 10.3], [-5.3, -3.7], [-8.3, -3.7]];
  const foot = piercedPanel("更衣接待横厅与双排睡眠长壳共用的一体T形基础", [0, 0, 0], foundation, [], 0.2, stone);
  foot.vertices = foot.indices!.map(index => ({ ...foot.vertices![index]! })); delete foot.indices;
  const parts: ModelPart[] = [foot, box("更衣前厅由内侧实柱和外墙共同承起的完整低屋盖", 0, 3.41, -7, 16.6, 0.22, 6.6, roof), box("完整覆盖睡眠方舱中央通道及后盥洗区的高平屋盖", 0, 4.11, 3, 10.6, 0.22, 14.6, roof)];
  parts.push(verticalSurface("更衣接待前厅真实留出主门和两扇独立采光窗的前墙", "xy", -10, [[-8, 0.2], [-1, 0.2], [-1, 2.7], [1, 2.7], [1, 0.2], [8, 0.2], [8, 3.3], [-8, 3.3]], [-4, 4].map(x => rectangle(x, 1, 4.5, 1.7))), ...[-4, 4].map(x => windowPane("xy", -10, x, 1, 4.5, 1.7)));
  for (const x of [-8, 8]) parts.push(verticalSurface("低更衣前厅接到屋盖的完整侧窗墙", "yz", x, [[-10, 0.2], [-4, 0.2], [-4, 3.3], [-10, 3.3]], [rectangle(-7, 1, 3.6, 1.7)]), windowPane("yz", x, -7, 1, 3.6, 1.7));
  for (const side of [-1, 1]) parts.push(verticalSurface("前横厅退肩处封合到低盖而不遮住后壳内门的完整短壁", "xy", -4, [[side < 0 ? -8 : 5, 0.2], [side < 0 ? -5 : 8, 0.2], [side < 0 ? -5 : 8, 3.3], [side < 0 ? -8 : 5, 3.3]]));
  parts.push(verticalSurface("更衣厅进入中央睡眠街的实际隔声宽门与屋面高差收头壁", "xy", -4, [[-5, 0.2], [-1, 0.2], [-1, 2.7], [1, 2.7], [1, 0.2], [5, 0.2], [5, 4], [-5, 4]], [-3, 3].map(x => rectangle(x, 3.62, 2, 0.25))), ...[-3, 3].map(x => windowPane("xy", -4, x, 3.62, 2, 0.25)));
  for (const x of [-5, 5]) parts.push(verticalSurface("睡眠长壳在方舱上方真实开高窗的完整侧承壁", "yz", x, [[-4, 0.2], [10, 0.2], [10, 4], [-4, 4]], [rectangle(1.4, 3.2, 9.6, 0.55), rectangle(8.3, 2.5, 2.2, 0.8)]), windowPane("yz", x, 1.4, 3.2, 9.6, 0.55), windowPane("yz", x, 8.3, 2.5, 2.2, 0.8));
  parts.push(verticalSurface("盥洗后区保留真实公共后门与两侧高窗的完整端壁", "xy", 10, [[-5, 0.2], [-0.55, 0.2], [-0.55, 2.5], [0.55, 2.5], [0.55, 0.2], [5, 0.2], [5, 4], [-5, 4]], [-3, 3].map(x => rectangle(x, 2.5, 2.4, 0.8))), ...[-3, 3].map(x => windowPane("xy", 10, x, 2.5, 2.4, 0.8)));
  const frame: SolidBox[] = [{ center: [0, 3.175, -7], size: [16, 0.25, 0.25] }, ...[-3, 3].map((x): SolidBox => ({ center: [x, 1.625, -7], size: [0.25, 2.85, 0.25] }))];
  for (const z of [-2.8, 5.6]) {
    frame.push({ center: [0, 3.875, z], size: [10, 0.25, 0.25] });
    for (const x of [-4.7, 4.7]) frame.push({ center: [x, 1.975, z], size: [0.25, 3.55, 0.25] });
  }
  parts.push(boxesMesh("前厅及后高壳的完整横梁与真正由地面承起的内柱", roof, frame));
  const cells: SolidBox[] = [], bedding: SolidBox[] = [];
  for (const side of [-1, 1]) {
    cells.push({ center: [side * 4.1, 1.55, 1.4], size: [0.08, 2.7, 8.5] });
    for (let split = 0; split <= 6; split++) cells.push({ center: [side * 3, 1.5, -2.8 + split * 1.4], size: [2.2, 2.6, 0.065] });
    for (const y of [0.25, 1.55, 2.85]) cells.push({ center: [side * 3, y, 1.4], size: [2.2, 0.1, 8.5] });
    for (let index = 0; index < 6; index++) for (const y of [0.37, 1.67]) {
      const z = -2.1 + index * 1.4;
      bedding.push({ center: [side * 3, y, z], size: [2, 0.14, 1.25] }, { center: [side * 3.8, y + 0.12, z], size: [0.36, 0.1, 0.85] });
    }
    for (const z of [-1.4, 1.4, 4.2]) {
      const length = Math.hypot(0.85, 1.45), dx = side * 0.85 / length, dy = 1.45 / length;
      const holes = [0.25, 0.59, 0.93, 1.27].map(center => rectangle(0, center - 0.125, 0.44, 0.25));
      const ladder = piercedPanel("分舱口之间真实开孔且上下承接的独立斜置攀梯", [0, 0, 0], [[-0.27, 0], [0.27, 0], [0.27, length], [-0.27, length]], holes, 0.035, roof);
      ladder.vertices = ladder.indices!.map(index => { const p = ladder.vertices![index]!, thickness = p.y - 0.0175; return { x: side * 1.05 + p.z * dx + thickness * dy, y: 0.2 + p.z * dy - thickness * dx, z: z + p.x }; });
      delete ladder.indices; parts.push(ladder);
    }
  }
  for (let start = 0; start < cells.length; start += 18) parts.push(boxesMesh("两排方舱的真实背壁分舱壁及上下承睡层板", plaster, cells.slice(start, start + 18)));
  for (let start = 0; start < bedding.length; start += 18) parts.push(boxesMesh("各开放方舱承板上实际贴合的独立床垫与薄枕", fabric, bedding.slice(start, start + 18)));
  const wetFace: Point[] = [[-5, 0.2]];
  for (const x of [-4, -2, 0, 2, 4]) { const half = x === 0 ? 0.6 : 0.4; wetFace.push([x - half, 0.2], [x - half, 2.3], [x + half, 2.3], [x + half, 0.2]); }
  wetFace.push([5, 0.2], [5, 2.8], [-5, 2.8]);
  parts.push(verticalSurface("睡眠街尽端分别进入五个湿区隔室的真实独立门", "xy", 6.8, wetFace, [], 0.16));
  for (const x of [-3, -1, 1, 3]) parts.push(box("淋浴洗手及坐便各室之间完整接地的实分隔壁", x, 1.5, 8.4, 0.16, 2.6, 3.2, plaster));
  for (const x of [-4, -2]) parts.push(box("淋浴隔室内真正接地的独立浅托盘", x, 0.25, 9.2, 1.5, 0.1, 1.4, plaster), cylinder("托盘上方贴后壁且下端接在盘后的淋浴立管", x, 1.2, 9.89, 0.025, 1.8, roof), rail([x, 2.1, 9.89], [x, 2.1, 9.6], 0.025, roof), cylinder("出水面朝下且实际接在上臂的独立淋浴头", x, 2.08, 9.6, 0.16, 0.035, roof));
  const fixtures: SolidBox[] = [];
  for (const x of [2, 4]) {
    parts.push(cylinder("后坐便隔室内实际落地的瓷短座", x, 0.4, 9, 0.42, 0.4, plaster), { ...cup("后坐便短座真正承住且内腔开放的独立碗体", [x, 0.57, 9], 0.26, 0.2, plaster), scale: { x: 1, y: 1, z: 1.3 } });
    fixtures.push({ center: [x, 0.65, 9.4], size: [0.32, 0.17, 0.4] }, { center: [x, 0.95, 9.66], size: [0.5, 0.7, 0.2] });
  }
  parts.push(boxesMesh("坐便器实接后桥与实际受托的独立水箱", plaster, fixtures), box("中间洗手隔室内让开后门路线的实际落地台柜", -0.62, 0.62, 8.5, 0.6, 0.84, 1, timber), { ...cup("洗手台柜上接合且真实开放的浅盆", [-0.62, 1.02, 8.5], 0.28, 0.14, plaster), scale: { x: 1, y: 1, z: 1.25 } });
  const lockers: SolidBox[] = [{ center: [-7.65, 1.3, -7], size: [0.1, 2.16, 4.6] }];
  for (const y of [0.25, 1.3, 2.35]) lockers.push({ center: [-7.3, y, -7], size: [0.8, 0.1, 4.6] });
  for (let divider = 0; divider <= 4; divider++) lockers.push({ center: [-7.3, 1.3, -9.3 + divider * 1.15], size: [0.8, 2.2, 0.07] });
  parts.push(boxesMesh("更衣厅内真实有背板承板和分隔的八格开放储物柜", timber, lockers), box("更衣厅右侧不占主门的完整短接待柜", 4.8, 0.75, -8.8, 3, 1.1, 0.8, timber), box("接待柜上实际贴合的薄石台面", 4.8, 1.35, -8.8, 3.1, 0.1, 0.9, stone), box("更衣区沿侧壁实际落地的换鞋长凳承脚", 6.4, 0.4, -6.4, 0.55, 0.4, 2.5, timber), box("换鞋长凳承脚上实际接合的连续坐面", 6.4, 0.64, -6.4, 0.8, 0.08, 2.8, fabric));
  parts.push(verticalSurface("主入口与公共地面连续相接的实际两级短阶", "yz", 0, [[-11.2, 0], [-10, 0], [-10, 0.2], [-10.6, 0.2], [-10.6, 0.1], [-11.2, 0.1]], [], 2.4, stone), verticalSurface("公共后门实际接回室外地面的两级短阶", "yz", 0, [[10, 0], [11.2, 0], [11.2, 0.1], [10.6, 0.1], [10.6, 0.2], [10, 0.2]], [], 1.4, stone));
  return parts;
}
