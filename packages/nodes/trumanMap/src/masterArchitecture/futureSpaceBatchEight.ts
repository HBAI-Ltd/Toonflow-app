import { part, type ModelPart, type Triple } from "../assetModelParts";
import { polygon } from "../masterNature/shared";
import { triangleShell } from "./futureSpaceBatchOne";
import { stairFlight } from "./futureSpaceBatchSix";
import { base, box, colors, design, pipe, rail, type ArchitecturePrototype } from "./structures";

const steel = "#76898c", pale = "#b1b7b0", dark = "#46585e", stone = "#a1957f", warm = "#a38668";

function ribbonSlab(name: string, edgeA: Triple[], edgeB: Triple[], thickness: number, color: string): ModelPart {
  const vertices: { x: number; y: number; z: number }[] = [], indices: number[] = [];
  const lower = (p: Triple): Triple => [p[0], p[1] - thickness, p[2]];
  const face = (a: Triple, b: Triple, c: Triple, d: Triple) => { const start = vertices.length; vertices.push(...[a, b, c, d].map(([x, y, z]) => ({ x, y, z }))); indices.push(start, start + 1, start + 2, start, start + 2, start + 3); };
  for (let i = 0; i < edgeA.length - 1; i++) {
    const a = edgeA[i]!, b = edgeA[i + 1]!, c = edgeB[i + 1]!, d = edgeB[i]!;
    face(a, b, c, d); face(lower(a), lower(d), lower(c), lower(b)); face(a, lower(a), lower(b), b); face(d, c, lower(c), lower(d));
  }
  face(edgeA[0]!, edgeB[0]!, lower(edgeB[0]!), lower(edgeA[0]!));
  face(edgeA.at(-1)!, lower(edgeA.at(-1)!), lower(edgeB.at(-1)!), edgeB.at(-1)!);
  return part(name, "mesh", color, [0, 0, 0], [1, 1, 1], [0, 0, 0], { vertices, indices });
}

export const futureSpaceBatchEightDesigns: ArchitecturePrototype[] = [
  design("倒楔承壁悬挑市集", "两片顶部展开的倒楔重墙托起宽阔高位市集，墙脚门洞保持底街贯穿，四段折返阶梯沿一侧抵达上层入口", () => {
    const wallProfile = [[-12, 0.4], [-7, 17], [17, 17], [11, 0.4], [3, 0.4], [3, 5.4], [-2, 5.4], [-2, 0.4]].map(([x, y]) => ({ x: x!, y: y! }));
    const parts: ModelPart[] = [base(69, 58, 0.4), ...[-1, 1].map(s => part("墙脚保留完整贯穿门口的倒楔承壁", "extrude", dark, [0, 0, s * 12], [1, 1, 1], [0, 0, 0], { profile: wallProfile, depth: 0.9 })), box("双重墙托住的宽悬挑市集板", 3, 17.3, 0, 49, 0.6, 39, steel), box("高位市集整片轻屋盖", 2, 25.5, 0, 55, 0.3, 43, pale), box("高位市集后侧薄围护", 3, 21.475, 19.3, 49, 7.75, 0.18, pale), box("主入口左侧透光薄墙", -12, 21.475, -19.3, 19, 7.75, 0.12, colors.glass), box("主入口右侧透光薄墙", 15.5, 21.475, -19.3, 24, 7.75, 0.12, colors.glass), box("市集大门上部短过梁", 0.5, 24.6, -19.3, 6, 1.5, 0.18, pale)];
    for (const x of [-18, 3, 24]) for (const z of [-17, 17]) parts.push(box("悬挑市集屋盖细承柱", x, 21.475, z, 0.25, 7.75, 0.25, dark));
    for (let stage = 0; stage < 4; stage++) {
      const forward = stage % 2 === 0, x = forward ? -25 : -30, stair = stairFlight("直达市集的连续折返实体阶梯", [x, 0.4 + stage * 4.3, forward ? -23 : -15.3], 11, 4.3 / 11, 0.7, 4);
      if (!forward) stair.rotation.y = 90;
      parts.push(stair);
      if (stage < 3) parts.push(box("折返阶梯跨接两跑的休息台", -27.5, 0.4 + (stage + 1) * 4.3 - 0.15, forward ? -14.6 : -23.7, 9, 0.3, 1.5, steel));
    }
    parts.push(box("阶梯顶端连接市集的实际门廊", -15, 17.45, -24.4, 33, 0.3, 3, steel), box("门廊转入市集大门的连接板", 0.5, 17.45, -21.5, 3, 0.3, 8, steel));
    for (const x of [-22, -11, 0]) parts.push(box("悬廊外缘独立落地承柱", x, 8.85, -25.5, 0.35, 16.9, 0.35, dark));
    for (const x of [-12, 5, 20]) parts.push(box("高位市集长条经营台", x, 18.2, 6, 6, 1.2, 9, warm), box("经营台后独立短隔屏", x, 20, 10.7, 6, 4.8, 0.15, pale));
    return parts;
  }, "建筑", "赛博朋克"),
  design("纵缝折鳍城市展览馆", "五道高低折鳍重墙分出四条天光展廊，前部逐廊开门而尾部共用一条横向通厅，连续屋面随鳍墙折升再落向后庭", () => {
    const parts: ModelPart[] = [base(69, 59, 0.4), box("展览馆连续大地坪", 0, 0.6, 0, 64, 0.4, 52, stone)];
    const finProfile = [{ x: 24, y: 0.8 }, { x: 24, y: 12 }, { x: 0, y: 22 }, { x: -18, y: 16 }, { x: -18, y: 0.8 }];
    for (const x of [-27, -13.5, 0, 13.5, 27]) parts.push(part("展廊之间落地的折鳍承墙", "extrude", pale, [x, 0, 0], [1, 1, 1], [0, 90, 0], { profile: finProfile, depth: 0.5 }), box("后部横厅独立落地承柱", x, 8.375, 24, 0.25, 15.15, 0.25, dark));
    for (let bay = 0; bay < 4; bay++) {
      const left = -27 + bay * 13.5, right = left + 13.5, center = (left + right) / 2;
      for (const [zA, yA, zB, yB] of [[-24, 12, 0, 22], [0, 22, 18, 16]]) parts.push(triangleShell("前后连续折升的展廊薄屋片", [left, yA!, zA!], [left, yB!, zB!], [right, yB!, zB!], 0.2, steel), triangleShell("前后连续折升的展廊薄屋片", [left, yA!, zA!], [right, yB!, zB!], [right, yA!, zA!], 0.2, steel));
      for (const s of [-1, 1]) parts.push(box("每条展廊独立入口两侧透光墙", center + s * 4.7, 6.4, -24, 3.7, 11.2, 0.1, colors.glass));
      parts.push(box("每条展廊门洞上方的独立填壁", center, 11.1, -24, 5.7, 1.8, 0.12, pale), box("展廊内低位陈列基台", center, 1.15, 2, 7.2, 0.7, 9, warm));
    }
    parts.push(box("四廊尾部共同横向通厅屋盖", 0, 16.05, 22, 64, 0.3, 8.5, pale), ...[-1, 1].map(s => box("后庭大门两侧连续玻璃", s * 18, 8.35, 26, 28, 15.1, 0.12, colors.glass)), box("后庭大门上部连续填壁", 0, 14.55, 26, 8, 2.7, 0.12, pale));
    return parts;
  }, "建筑", "科幻"),
  design("斜筒竖街居住楼", "倾斜椭圆外筒保留一条通高街缝，六层半环住层围住内庭，沿内庭连续上行的五圈坡街在各层前端与楼面相接", () => {
    const start = -Math.PI / 2 + 0.24, span = Math.PI * 2 - 0.48, bottom = 0.8, top = 39.8;
    const point = (a: number, y: number, inset: number): Triple => [Math.cos(a) * (18 - inset) + (y - bottom) * 0.18, y, Math.sin(a) * (12 - inset)];
    const vertices: { x: number; y: number; z: number }[] = [], indices: number[] = [];
    const face = (a: Triple, b: Triple, c: Triple, d: Triple) => { const i = vertices.length; vertices.push(...[a, b, c, d].map(([x, y, z]) => ({ x, y, z }))); indices.push(i, i + 1, i + 2, i, i + 2, i + 3); };
    for (let i = 0; i < 24; i++) {
      const a = start + i * span / 24, b = start + (i + 1) * span / 24;
      face(point(a, bottom, 0), point(a, top, 0), point(b, top, 0), point(b, bottom, 0));
      face(point(a, bottom, 0.3), point(b, bottom, 0.3), point(b, top, 0.3), point(a, top, 0.3));
      face(point(a, top, 0), point(a, top, 0.3), point(b, top, 0.3), point(b, top, 0));
      face(point(a, bottom, 0), point(b, bottom, 0), point(b, bottom, 0.3), point(a, bottom, 0.3));
    }
    face(point(start, bottom, 0), point(start, bottom, 0.3), point(start, top, 0.3), point(start, top, 0));
    face(point(start + span, bottom, 0), point(start + span, top, 0), point(start + span, top, 0.3), point(start + span, bottom, 0.3));
    const parts: ModelPart[] = [base(59, 39, 0.4), part("前街缝真正贯通的倾斜椭圆薄筒", "mesh", pale, [0, 0, 0], [1, 1, 1], [0, 0, 0], { vertices, indices })];
    for (let level = 0; level < 6; level++) {
      const y = 0.6 + level * 6.5, outline: [number, number][] = [];
      for (let i = 0; i <= 24; i++) { const a = start + i * span / 24; outline.push([Math.cos(a) * 17.9, Math.sin(a) * 11.9]); }
      for (let i = 24; i >= 0; i--) { const a = start + i * span / 24; outline.push([Math.cos(a) * 8, Math.sin(a) * 5.5]); }
      parts.push(polygon("保留前街缝和内庭的半环居住楼板", steel, outline, level ? 0.4 : 0.6, [(y + 0.2 - bottom) * 0.18, level ? y : 0.4, 0]));
      for (const a of [0, Math.PI / 2, Math.PI]) parts.push(part("住层外侧分间短壁", "box", warm, [(y + 0.2 - bottom) * 0.18 + Math.cos(a) * 13.2, y + 3.2, Math.sin(a) * 8.8], [6, 5.6, 0.16], [0, -a * 180 / Math.PI, 0]));
    }
    for (let turn = 0; turn < 5; turn++) {
      const ramp = (rx: number, rz: number, lift = 0): Triple[] => Array.from({ length: 17 }, (_, index) => { const a = start + index * Math.PI / 8, y = 1 + (turn + index / 16) * 6.5; return [Math.cos(a) * rx + (y - bottom) * 0.18, y + lift, Math.sin(a) * rz]; });
      parts.push(ribbonSlab("连续上行并逐层接入半环的内庭坡街", ramp(5.7, 3.2), ramp(8.2, 5.7), 0.25, steel), ribbonSlab("内庭坡街内缘完整低护壁", ramp(5.7, 3.2, 1), ramp(5.8, 3.3, 1), 1, dark), ribbonSlab("各层接入口断开的坡街外缘护壁", ramp(8.1, 5.6, 1).slice(1, -1), ramp(8.2, 5.7, 1).slice(1, -1), 1, dark));
    }
    const roofOutline: [number, number][] = [];
    for (let i = 0; i <= 24; i++) { const a = start + i * span / 24; roofOutline.push([Math.cos(a) * 18, Math.sin(a) * 12]); }
    for (let i = 24; i >= 0; i--) { const a = start + i * span / 24; roofOutline.push([Math.cos(a) * 8, Math.sin(a) * 5.5]); }
    parts.push(polygon("前缝同楼板对齐的半环完整屋盖", steel, roofOutline, 0.35, [(top - bottom) * 0.18, 39.6, 0]));
    return parts;
  }, "建筑", "赛博朋克"),
  design("卷曲覆带海岸航站楼", "两端卷回地面的宽薄带共同覆盖一个开放候车庭，后部高位夹层接向连续前伸阶梯，曲面后端墙的低位门口保持贯通", () => {
    const curve: [number, number][] = [[-30, 0.5], [-34, 2], [-36, 7], [-34, 14], [-28, 19], [-16, 23], [0, 25], [16, 23], [28, 19], [34, 14], [36, 7], [34, 2], [30, 0.5]];
    const profile = curve.map(([x, y]) => ({ x, y }));
    for (let i = curve.length - 1; i >= 0; i--) { const a = curve[Math.max(0, i - 1)]!, b = curve[Math.min(curve.length - 1, i + 1)]!, dx = b[0] - a[0], dy = b[1] - a[1], length = Math.hypot(dx, dy); profile.push({ x: curve[i]![0] + dy / length * 0.5, y: curve[i]![1] - dx / length * 0.5 }); }
    const back = [...curve, [4, 0.5], [4, 5], [-4, 5], [-4, 0.5]].map(([x, y]) => ({ x: x!, y: y! }));
    const parts: ModelPart[] = [base(79, 55, 0.5), box("卷带航站楼整片候车地坪", 0, 0.75, 0, 60, 0.5, 38, stone), part("端部卷回并真实封厚的连续覆带壳", "extrude", pale, [0, 0, 0], [1, 1, 1], [0, 0, 0], { profile, depth: 42 }), part("保留低位双向门口的曲面后端玻璃", "extrude", colors.glass, [0, 0, 20.75], [1, 1, 1], [0, 0, 0], { profile: back, depth: 0.15 }), box("后部高位候船夹层", 0, 8.35, 10, 48, 0.3, 12, steel)];
    for (const x of [-20, 0, 20]) for (const z of [4, 15.5]) parts.push(box("后部候船夹层独立细承柱", x, 4.6, z, 0.3, 7.2, 0.3, dark));
    for (const x of [-23, 23]) for (let stage = 0; stage < 2; stage++) parts.push(stairFlight("从候车庭连到夹层前缘的连续实体梯", [x, 1 + stage * 3.75, -14 + stage * 9], 12, 0.3125, 0.75, 3.5));
    parts.push(rail([-20.5, 9.5, 4], [20.5, 9.5, 4], 0.06, dark), ...[-1, 1].map(s => box("高位夹层分离候船长座", s * 11, 8.9, 11, 10, 0.9, 2.5, warm)));
    return parts;
  }, "建筑", "科幻"),
  design("悬臂梳齿水上社区", "高架单侧主脊分配三段逐级抬高的横向居住翼，每翼由外露三角承托托住并保留室内空腔，主脊前端的开放升降井连接四层交通面", () => {
    const parts: ModelPart[] = [base(83, 79, 0.4), box("社区主脊背向连续薄墙", -23, 13.6, 0, 0.4, 26.4, 66, pale)];
    const hole: [number, number][] = [[-21.8, -30.8], [-16.2, -30.8], [-16.2, -25.2], [-21.8, -25.2]];
    for (const y of [0.8, 7.3, 13.8, 20.3]) parts.push(polygon("升降井真正开孔的主脊交通层", steel, [[-23, -33], [-13, -33], [-13, 33], [-23, 33]], 0.3, [0, y - 0.15, 0], [hole]));
    parts.push(box("主脊整片通长平顶", -18, 26.95, 0, 10.5, 0.3, 67));
    for (const z of [-32, -11, 11, 32]) for (const x of [-22, -14]) parts.push(box("主脊贯通高架重柱", x, 13.6, z, 0.45, 26.4, 0.45, dark));
    for (let wing = 0; wing < 3; wing++) {
      const z = -22 + wing * 22, y = 7.3 + wing * 6.5;
      parts.push(box("梳齿居住翼完整悬挑楼板", 7, y, z, 42, 0.4, 12, steel), box("居住翼整体平屋盖", 7, y + 6.5, z, 43, 0.3, 12.8, pale), box("居住翼后侧真实薄墙", 7, y + 3.35, z + 6, 42, 6.3, 0.18, pale), box("居住翼前侧透光薄墙", 7, y + 3.35, z - 6, 42, 6.3, 0.12, colors.glass), box("远离主脊的居住翼端窗", 28, y + 3.35, z, 0.12, 6.3, 12, colors.glass));
      for (const side of [-1, 1]) parts.push(part("居住翼下方整片三角悬臂承托", "extrude", dark, [0, 0, z + side * 4.5], [1, 1, 1], [0, 0, 0], { profile: [{ x: -18, y: y - 6 }, { x: 25, y: y - 0.2 }, { x: -18, y: y - 0.2 }], depth: 0.65 }));
      for (const x of [-2, 12]) for (const side of [-1, 1]) parts.push(box("居住翼分室但让开中央门道的隔墙", x, y + 3.35, z + side * 3.55, 0.15, 6.3, 4.9, warm));
    }
    for (const x of [-21.8, -16.2]) for (const z of [-30.8, -25.2]) parts.push(box("主脊升降井四角贯通立柱", x, 13.6, z, 0.2, 26.4, 0.2, dark));
    parts.push(box("升降井底部可见独立轿厢楼板", -19, 1.2, -28, 5.2, 0.25, 5.2, dark), ...[-1, 1].map(s => pipe("社区升降井顶部下行的独立吊索", [-19 + s * 1.5, 26.81, -28], [-19 + s * 1.5, 1.315, -28], 0.05)));
    return parts;
  }, "建筑", "赛博朋克"),
  design("交叉挑梁叠层研究所", "两条中空长箱实验楼在不同标高交叉，独立门形支承塔跨过箱体接入各层，侧墙开口与中央升降厅之间有真正贯通的短廊", () => {
    const parts: ModelPart[] = [base(81, 63, 0.5)];
    const wallProfile = [[-32.5, 0], [-32.5, 6.7], [32.5, 6.7], [32.5, 0], [22, 0], [22, 3.5], [18, 3.5], [18, 0], [-18, 0], [-18, 3.5], [-22, 3.5], [-22, 0]].map(([x, y]) => ({ x: x!, y: y! }));
    for (const level of [0, 1]) {
      const y = 8 + level * 9, yaw = level ? 25 : -25, a = yaw * Math.PI / 180, c = Math.cos(a), s = Math.sin(a);
      const cells: ModelPart[] = [box("长箱实验楼完整底板", 0, y, 0, 65, 0.5, 12, steel), box("长箱实验楼连续平顶", 0, y + 7.2, 0, 65.8, 0.5, 12.8, pale), ...[-1, 1].map(side => part("保留两处真实侧门的长箱实验楼薄墙", "extrude", pale, [0, y + 0.25, side * 6], [1, 1, 1], [0, 0, 0], { profile: wallProfile, depth: 0.2 })), ...[-1, 1].map(side => box("长箱实验楼端面透光围护", side * 32.45, y + 3.6, 0, 0.12, 6.7, 12, colors.glass))];
      for (const x of [-10, 7]) for (const side of [-1, 1]) cells.push(box("实验楼内部保留中央通道的分室墙", x, y + 3.6, side * 3.8, 0.16, 6.7, 4.4, warm));
      for (const cell of cells) { const x = cell.position.x, z = cell.position.z; cell.position.x = x * c + z * s; cell.position.z = -x * s + z * c; cell.rotation.y += yaw; } parts.push(...cells);
      for (const side of [-1, 1]) parts.push(box("偏置交通塔接至长箱侧门的短廊板", side * 22.5, y, side * (level ? -1 : 1) * 3.1, 7, 0.5, 3.4, steel));
    }
    for (const side of [-1, 1]) {
      for (const x of [-2.7, 2.7]) for (const z of [-12.5, 12.5]) parts.push(box("独立门形支承塔贯通重柱", side * 18 + x, 12.25, z, 0.55, 23.5, 0.55, dark));
      for (const y of [7.65, 16.65, 24.3]) parts.push(box("两实验长箱下方贯穿的横向承梁", side * 18, y, 0, 6.4, 0.7, 25.7, dark));
      for (const x of [-1.6, 1.6]) for (const z of [-1.6, 1.6]) parts.push(box("承梁外侧完整升降井四角细柱", side * 25 + x, 12.5, z, 0.2, 24, 0.2, dark));
      parts.push(box("升降井外侧连续窄背壁", side * 26.6, 12.5, 0, 0.2, 24, 3.2, pale), box("交通塔升降井底部独立轿厢", side * 25, 0.85, 0, 2.8, 0.3, 2.8, steel), pipe("交通塔内可见升降吊索", [side * 25, 24.5, 0], [side * 25, 1, 0], 0.055), box("交通塔四角柱实际接住中央吊索的完整顶盖", side * 25, 24.6, 0, 3.6, 0.2, 3.6, dark));
    }
    return parts;
  }, "建筑", "赛博朋克"),
];
