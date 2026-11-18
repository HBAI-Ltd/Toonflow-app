import { part, ring, type ModelPart } from "../assetModelParts";
import { polygon } from "../masterNature/shared";
import { triangleShell } from "./futureSpaceBatchOne";
import { stairFlight } from "./futureSpaceBatchSix";
import { halfRoundWall } from "./spatialShells";
import { base, box, colors, cylinder, design, pipe, rail, type ArchitecturePrototype } from "./structures";

const steel = "#788b8e", pale = "#b3b7ac", dark = "#46575e", stone = "#a4977d", warm = "#9f8567";

function verticalPanel(name: string, outline: [number, number][], holes: [number, number][][], z: number, color: string): ModelPart {
  const value = polygon(name, color, outline.map(([x, y]) => [x, -y]), 0.35, [0, 0, z - 0.175], holes.map(points => points.map(([x, y]) => [x, -y])));
  value.rotation.x = 90;
  return value;
}

export const futureSpaceBatchNineDesigns: ArchitecturePrototype[] = [
  design("独柱翻边伞冠美术馆", "中央空心树干核托起整张向上翻边的伞冠，放射支臂承托二层环廊，两侧实体阶梯从敞开前庭穿过楼板缺口接入画廊", () => {
    const roofY = (r: number) => 15 + (r - 4.2) ** 2 / 70;
    const profile = Array.from({ length: 13 }, (_, i) => { const x = 4.2 + i * 26.8 / 12; return { x, y: roofY(x) - 0.35 }; });
    profile.push(...Array.from({ length: 13 }, (_, i) => { const x = 31 - i * 26.8 / 12; return { x, y: roofY(x) }; }), { ...profile[0]! });
    const outer: [number, number][] = [], inner: [number, number][] = Array.from({ length: 16 }, (_, i) => { const a = i * Math.PI / 8; return [Math.cos(a) * 4.5, Math.sin(a) * 4.5]; });
    const arc = (a: number, b: number): [number, number][] => { const count = Math.ceil((b - a) / (Math.PI / 18)); return Array.from({ length: count + 1 }, (_, i) => { const t = a + (b - a) * i / count; return [Math.cos(t) * 23, Math.sin(t) * 23]; }); };
    const leftA = Math.PI + Math.acos(21.8 / 23), leftB = Math.PI + Math.acos(18.2 / 23), rightA = Math.PI * 2 - Math.acos(18.2 / 23), rightB = Math.PI * 2 - Math.acos(21.8 / 23);
    outer.push(...arc(0, leftA), [-21.8, -5], [-18.2, -5], ...arc(leftB, rightA), [18.2, -5], [21.8, -5], ...arc(rightB, Math.PI * 2).slice(0, -1));
    const glass = halfRoundWall("伞冠下让出整个前庭的连续弧形玻璃", 28, 0.12, roofY(28) - 1.35, [0, 1, 0], 30, colors.glass, Math.PI * 4 / 3); glass.opacity = 0.32; glass.roughness = 0.2;
    const parts: ModelPart[] = [base(69, 69, 0.4), ring("中央升降井空出的底层展厅地面", stone, 28, 24.8, 0.8, 0.4), polygon("两处阶梯缺口真实贯通的二层环画廊", steel, outer, 0.4, [0, 7.8, 0], [inner]), ring("空心树干上部连续承屋压环", dark, 4.6, 0.4, 14.8, 0.5), part("中央到外缘连续翻升的完整薄伞冠", "lathe", pale, [0, 0, 0], [1, 1, 1], [0, 0, 0], { profile }), glass, cylinder("中央升降井底部独立圆轿厢", 0, 0.9, 0, 6.4, 0.2, steel), pipe("中央空心树干内的可见吊索", [0, 14.5, 0], [0, 0.99, 0], 0.06), box("中央升降井顶端跨在树干承柱上的实际承索梁", 0, 14.6, 0, 9, 0.3, 0.4, dark)];
    for (let rib = 0; rib < 8; rib++) {
      const a = rib * Math.PI / 4, c = Math.cos(a), s = Math.sin(a);
      parts.push(box("空心树干环列贯通承重柱", c * 4.3, 7.6, s * 4.3, 0.35, 14.4, 0.35, dark), rail([c * 4.3, 4, s * 4.3], [c * 22.3, 7.85, s * 22.3], 0.35, dark));
      for (let segment = 0; segment < 3; segment++) { const r0 = 4.3 + segment * 8.8, r1 = r0 + 8.8; parts.push(rail([c * r0, roofY(r0) - 0.55, s * r0], [c * r1, roofY(r1) - 0.55, s * r1], 0.4, steel)); }
      if (rib !== 5 && rib !== 7) parts.push(part("二层画廊独立径向短展墙", "box", warm, [c * 15, 10.3, s * 15], [7, 4.2, 0.15], [0, -rib * 45, 0]));
    }
    for (const x of [-20, 20]) for (let flight = 0; flight < 2; flight++) parts.push(stairFlight("前庭直接接入二层楼板缺口的实体阶梯", [x, 1 + flight * 3.6, -18 + flight * 6.5], 10, 0.36, 0.65, 3.2));
    return parts;
  }, "建筑", "科幻"),
  design("三孔桁墙竖向公寓", "两道通高承重立面以错高大圆洞形成完整空腹，室内层板按圆洞剖面真实分段让空，后侧外廊和边端升降井串联七层住区", () => {
    const circles = [{ x: -18, y: 8.5, r: 7.2 }, { x: 0, y: 18, r: 7.2 }, { x: 18, y: 27.5, r: 7.2 }];
    const outline: [number, number][] = [[-33, 0.4], [33, 0.4], [33, 39.9], [-33, 39.9]], holes: [number, number][][] = circles.map(circle => Array.from({ length: 16 }, (_, i) => { const a = i * Math.PI / 8; return [circle.x + Math.cos(a) * circle.r, circle.y + Math.sin(a) * circle.r]; }));
    const rearDoors: [number, number][][] = [], parts: ModelPart[] = [base(79, 39, 0.4)];
    for (let level = 0; level < 7; level++) {
      const y = 0.8 + level * 5.5, ranges: [number, number][] = [];
      for (const circle of circles) { const dy = Math.max(0, Math.abs(y - circle.y) - 0.2); if (dy < circle.r) { const half = Math.sqrt(circle.r ** 2 - dy ** 2) + 0.12; ranges.push([circle.x - half, circle.x + half]); } }
      ranges.sort((a, b) => a[0] - b[0]);
      let x = -33;
      for (const [a, b] of [...ranges, [33, 33] as [number, number]]) { if (a > x + 0.15) parts.push(box("按大圆空洞剖面分段让空的实际住层", (x + a) / 2, y, 0, a - x, 0.4, 17, steel)); x = Math.max(x, b); }
      parts.push(box("七层住区后侧完整外交通廊", 0, y, 10.4, 66, 0.4, 3.8, steel), part("后外廊与楼板连续相接的透光低护壁", "box", colors.glass, [0, y + 0.75, 12.2], [65, 1.1, 0.08], [0, 0, 0], { opacity: 0.32, roughness: 0.2 }));
      for (const side of [-1, 1]) rearDoors.push([[side * 29 - 1, y + 0.2], [side * 29 + 1, y + 0.2], [side * 29 + 1, y + 3.6], [side * 29 - 1, y + 3.6]]);
    }
    const frontDoors: [number, number][][] = [-1, 1].map(side => [[side * 29 - 1, 1], [side * 29 + 1, 1], [side * 29 + 1, 4.4], [side * 29 - 1, 4.4]]);
    parts.push(verticalPanel("三大圆洞真正贯穿的前侧承重桁墙", outline, [...holes, ...frontDoors], -8.5, pale), verticalPanel("大圆洞与每层双门完整开出的后桁墙", outline, [...holes, ...rearDoors], 8.5, pale), box("孔墙公寓整体平屋盖", 0, 39.8, 0, 67, 0.4, 18.2, steel), ...[-1, 1].map(side => box("公寓两端完整薄侧墙", side * 33, 20.15, 0, 0.25, 39.5, 17, warm)));
    for (const side of [-1, 1]) {
      for (const x of [-1.4, 1.4]) for (const z of [9, 11.8]) parts.push(box("后廊边端独立升降井贯通细柱", side * 35.2 + x, 20.2, z, 0.2, 39.6, 0.2, dark));
      parts.push(box("后廊升降井底部独立轿厢", side * 35.2, 0.8, 10.4, 2.6, 0.4, 2.6, dark), pipe("后廊边端升降井内可见吊索", [side * 35.2, 39.9, 10.4], [side * 35.2, 0.99, 10.4], 0.05), box("后廊升降井四角柱实际共同承起的顶端承索盖", side * 35.2, 39.9, 10.4, 3, 0.2, 3, dark), ...Array.from({ length: 7 }, (_, level) => box("后廊接入边端升降井的独立门槛", side * 33.6, 0.8 + level * 5.5, 10.4, 1.2, 0.4, 2.6, steel)), stairFlight("前侧底层入口两级真实踏步", [side * 29, 0.4, -10.6], 2, 0.3, 0.8, 2.5));
    }
    return parts;
  }, "建筑", "赛博朋克"),
  design("外翻拱脚长街总部", "宽顶办公层跨过中央二十米高的通街，左右粗拱脚内部各有真实水平居室，五层开孔楼板围住独立升降井并连接前侧入口", () => {
    const lower: [number, number][] = [[-23, 0.5], [-20, 8], [-15, 16], [0, 20], [15, 16], [20, 8], [23, 0.5]], outline: [number, number][] = [[-34, 0.5], [-34, 32], [34, 32], [34, 0.5], ...lower.slice().reverse()];
    const holes: [number, number][][] = [];
    const halfWidth = (y: number) => { if (y >= 20) return 0; if (y >= 16) return (20 - y) * 15 / 4; if (y >= 8) return 20 - (y - 8) * 5 / 8; return 23 - (y - 0.5) * 3 / 7.5; };
    const shaft = (x: number): [number, number][] => [[x - 1.5, -1.5], [x + 1.5, -1.5], [x + 1.5, 1.5], [x - 1.5, 1.5]];
    const parts: ModelPart[] = [base(79, 39, 0.5), box("长街总部完整顶盖", 0, 32.2, 0, 69, 0.4, 21.2, steel)];
    for (let level = 0; level < 5; level++) {
      const y = 1 + level * 6, half = halfWidth(y - 0.2);
      if (half > 0) for (const side of [-1, 1]) { const a = side < 0 ? -34 : half, b = side < 0 ? -half : 34; parts.push(polygon("真实避让中央通街的拱脚水平楼板", steel, [[a, -10], [b, -10], [b, 10], [a, 10]], 0.4, [0, y - 0.2, 0], [shaft(side * 31)])); }
      else parts.push(polygon("跨过整个通街并保留两升降孔的上层楼板", steel, [[-34, -10], [34, -10], [34, 10], [-34, 10]], 0.4, [0, y - 0.2, 0], [shaft(-31), shaft(31)]));
      if (level === 0) for (const side of [-1, 1]) { holes.push([[side * 31 - 1.2, 1.2], [side * 31 + 1.2, 1.2], [side * 31 + 1.2, 5], [side * 31 - 1.2, 5]], [[side * 26 - 1.5, 1.8], [side * 26 + 1.5, 1.8], [side * 26 + 1.5, 6.3], [side * 26 - 1.5, 6.3]]); }
      else if (level < 4) for (const side of [-1, 1]) { const center = level === 3 ? 23 : 28.5, width = level === 3 ? 16 : level === 2 ? 9 : 7; holes.push([[side * center - width / 2, y + 0.8], [side * center + width / 2, y + 0.8], [side * center + width / 2, y + 5.3], [side * center - width / 2, y + 5.3]]); }
      else for (const x of [-26, -13, 0, 13, 26]) holes.push([[x - 4.5, y + 0.8], [x + 4.5, y + 0.8], [x + 4.5, y + 5.3], [x - 4.5, y + 5.3]]);
    }
    parts.push(verticalPanel("内外翻拱脚和分层窗洞完整成形的前立面", outline, holes, -10, pale), verticalPanel("通街同样贯穿的后侧完整窗墙", outline, holes, 10, pale), ...[-1, 1].map(side => box("拱脚外端连续薄围护墙", side * 34, 16.25, 0, 0.25, 31.5, 20, warm)));
    const archBand = [...lower.map(([x, y]) => ({ x, y: y + 0.4 })), ...lower.slice().reverse().map(([x, y]) => ({ x, y }))];
    parts.push(part("从两拱脚连续接到通街拱顶的封厚内腹面", "extrude", steel, [0, 0, 0], [1, 1, 1], [0, 0, 0], { profile: archBand, depth: 20 }));
    for (const side of [-1, 1]) {
      for (const x of [-1.5, 1.5]) for (const z of [-1.5, 1.5]) parts.push(box("拱脚居室内开孔升降井贯通细柱", side * 31 + x, 16.25, z, 0.15, 31.5, 0.15, dark));
      parts.push(box("拱脚升降井底部独立轿厢", side * 31, 1.1, 0, 2.8, 0.2, 2.8, dark), pipe("拱脚升降井内独立起吊索", [side * 31, 32.01, 0], [side * 31, 1.19, 0], 0.05), stairFlight("前侧拱脚入口两级实体踏步", [side * 31, 0.5, -11.6], 2, 0.35, 0.8, 2.5));
    }
    return parts;
  }, "建筑", "科幻"),
  design("双锚船首挑檐演艺馆", "两片向前倾的厚锚墙托住船首状大挑檐，内部阶座逐排收窄并朝尖端舞台下降，中央坡道与后侧双阶梯入口真正相连", () => {
    const roof = triangleShell("两厚锚墙承托的整片船首三角挑檐", [-28, 28, -24], [-28, 28, 24], [36, 17, 0], 0.45, pale);
    const parts: ModelPart[] = [base(81, 63, 0.4), roof, box("阶座后侧完整高位入场门厅", -26.5, 6.4, 0, 7, 0.4, 43, steel), box("尖端舞台完整落地台座", 17.5, 1.1, 0, 9, 1.4, 10, warm)];
    for (let row = 0; row < 6; row++) {
      const x = -20 + row * 6, y = 6.2 - row * 0.8, width = 38 - row * 4.3, half = (width - 3.2) / 2;
      for (const side of [-1, 1]) parts.push(box("让开中央坡道的整排阶座承台", x, (y + 0.4) / 2, side * (1.6 + half / 2), 6.3, y - 0.4, half, stone), box("阶座上连续低位长凳座板", x, y + 0.35, side * (1.6 + half / 2), 1.8, 0.15, half - 0.8, warm));
    }
    parts.push(part("从后门厅连续下降到舞台的中央宽坡道", "box", steel, [-5, 4.05, 0], [Math.hypot(36, 4.8), 0.3, 3.2], [0, 0, -Math.atan2(4.8, 36) * 180 / Math.PI]));
    const a = Math.atan2(6, 14), c = Math.cos(a), s = Math.sin(a), roofY = (x: number) => 28 - (x + 28) * 11 / 64 - 0.35;
    for (const side of [-1, 1]) {
      const profile = [{ x: 0, y: 0.4 }, { x: 6, y: 0.4 }, { x: 14, y: roofY(-29 + 14 * c) }, { x: 4, y: roofY(-29 + 4 * c) }];
      parts.push(part("整体倾斜并接入挑檐下方的独立厚锚墙", "extrude", dark, [-29, 0, side * 24], [1, 1, 1], [0, side * a * 180 / Math.PI, 0], { profile, depth: 0.8 }));
      const wallA = triangleShell("演艺馆收窄侧面透光围护", [-28, 0.4, side * 24], [-28, 28, side * 24], [36, 17, 0], 0.12, colors.glass), wallB = triangleShell("演艺馆收窄侧面透光围护", [-28, 0.4, side * 24], [36, 17, 0], [36, 0.4, 0], 0.12, colors.glass); wallA.opacity = 0.28; wallB.opacity = 0.28; parts.push(wallA, wallB);
      for (let flight = 0; flight < 2; flight++) { const stairs = stairFlight("后侧双门入口连续接入门厅的实体踏步", [-36 + flight * 3.5, 0.4 + flight * 3.1, side * 17], 10, 0.31, 0.35, 4); stairs.rotation.y = 0; parts.push(stairs); }
    }
    const backProfile = [[-24, 6.6], [-24, 28], [24, 28], [24, 6.6], [19, 6.6], [19, 10.2], [15, 10.2], [15, 6.6], [-15, 6.6], [-15, 10.2], [-19, 10.2], [-19, 6.6]].map(([x, y]) => ({ x: x!, y: y! }));
    parts.push(part("后侧两处入场门实际贯通的整片围护", "extrude", pale, [-28, 0, 0], [1, 1, 1], [0, 90, 0], { profile: backProfile, depth: 0.2 }));
    return parts;
  }, "建筑", "赛博朋克"),
];
