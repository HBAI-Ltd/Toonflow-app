import { part, type ModelPart, type Triple } from "../assetModelParts";
import { polygon } from "../masterNature/shared";
import { triangleShell } from "./futureSpaceBatchOne";
import { stairFlight } from "./futureSpaceBatchSix";
import { xYWall } from "./futureSpaceBatchTen";
import { halfRoundWall } from "./spatialShells";
import { base, box, colors, design, pipe, rail, type ArchitecturePrototype } from "./structures";

const steel = "#77898d", pale = "#b0b7ad", dark = "#46585e", stone = "#a2957f", warm = "#a18868";

function chamfered(w: number, d: number, corner: number, x = 0, z = 0): [number, number][] {
  return [[x - w / 2 + corner, z - d / 2], [x + w / 2 - corner, z - d / 2], [x + w / 2, z - d / 2 + corner], [x + w / 2, z + d / 2 - corner], [x + w / 2 - corner, z + d / 2], [x - w / 2 + corner, z + d / 2], [x - w / 2, z + d / 2 - corner], [x - w / 2, z - d / 2 + corner]];
}

function glassQuad(name: string, a: Triple, b: Triple, c: Triple, d: Triple): ModelPart[] {
  const first = triangleShell(name, a, b, c, 0.12, colors.glass), second = triangleShell(name, a, c, d, 0.12, colors.glass); first.opacity = 0.3; second.opacity = 0.3; first.roughness = 0.2; second.roughness = 0.2; return [first, second];
}

export const futureSpaceBatchElevenDesigns: ArchitecturePrototype[] = [
  design("退台八棱中庭办公楼", "三段楼体向不同侧退进而围住同一个错心中庭，完整层板保留中庭和升降井孔，退台面接向上段实际门口，外侧短柱逐段承托各层", () => {
    const tiers = [{ w: 58, d: 48, x: -2, z: 0, corner: 10 }, { w: 49, d: 41, x: 2, z: 3, corner: 8 }, { w: 39, d: 34, x: 6, z: 1, corner: 6 }];
    const atrium = chamfered(12, 12, 3, -4, -3), shaft: [number, number][] = [[14.2, -1.8], [17.8, -1.8], [17.8, 1.8], [14.2, 1.8]], parts: ModelPart[] = [base(77, 65, 0.4)];
    for (let level = 0; level < 6; level++) {
      const tier = tiers[Math.floor(level / 2)]!, outline = chamfered(tier.w, tier.d, tier.corner, tier.x, tier.z), y = 0.6 + level * 5.8;
      parts.push(polygon("双孔完整贯通的错心环形办公楼层", steel, outline, 0.4, [0, y - 0.2, 0], [atrium, shaft]), polygon("各层中庭口与楼板相接的完整低护壁", pale, chamfered(12.2, 12.2, 3.1, -4, -3), 1.1, [0, y + 0.2, 0], [atrium]));
      if (level === 2 || level === 4) { const previous = tiers[level / 2 - 1]!; parts.push(polygon("上段楼体门外实际可站立的退台露台", stone, chamfered(previous.w, previous.d, previous.corner, previous.x, previous.z), 0.4, [0, y - 0.2, 0], [outline])); }
    }
    for (let tierIndex = 0; tierIndex < 3; tierIndex++) {
      const tier = tiers[tierIndex]!, outline = chamfered(tier.w, tier.d, tier.corner, tier.x, tier.z), bottom = 0.8 + tierIndex * 11.6, top = bottom + 11.2;
      for (let edge = 0; edge < 8; edge++) {
        const a = outline[edge]!, b = outline[(edge + 1) % 8]!, dx = b[0] - a[0], dz = b[1] - a[1], length = Math.hypot(dx, dz), profile = [{ x: -length / 2, y: bottom }, { x: -length / 2, y: top }, { x: length / 2, y: top }, { x: length / 2, y: bottom }];
        if (edge === 0) profile.push({ x: 2, y: bottom }, { x: 2, y: bottom + 4.2 }, { x: -2, y: bottom + 4.2 }, { x: -2, y: bottom });
        parts.push(part("每段随退台收拢并保留正门的透光薄幕墙", "extrude", colors.glass, [(a[0] + b[0]) / 2, 0, (a[1] + b[1]) / 2], [1, 1, 1], [0, -Math.atan2(dz, dx) * 180 / Math.PI, 0], { profile, depth: 0.12, opacity: 0.3, roughness: 0.2 }), box("各退台段八角边缘独立承重细柱", a[0], (bottom + top) / 2, a[1], 0.4, top - bottom, 0.4, dark));
      }
    }
    const upper = tiers[2]!; parts.push(polygon("与错心中庭对齐的完整八棱屋盖", pale, chamfered(upper.w + 0.6, upper.d + 0.6, upper.corner, upper.x, upper.z), 0.4, [0, 35.2, 0], [atrium]));
    for (const x of [-1.8, 1.8]) for (const z of [-1.8, 1.8]) parts.push(box("错心办公楼独立升降井贯通细柱", 16 + x, 17.9, z, 0.15, 35, 0.15, dark));
    parts.push(box("错心办公楼独立升降井底部轿厢", 16, 0.6, 0, 3.4, 0.4, 3.4, steel), pipe("错心办公楼独立升降井内吊索", [16, 35.3, 0], [16, 0.79, 0], 0.05), stairFlight("下段办公楼入口真实短阶梯", [-2, 0.4, -25.6], 2, 0.2, 0.8, 4));
    return parts;
  }, "建筑", "赛博朋克"),
  design("倒谷四肋会议城", "宽上窄下的四斜肋包住五层外挑会议环层，中心开放交通核通过分层短桥接向各层，外侧倾墙和顶盖共同围出完整倒谷空间", () => {
    const parts: ModelPart[] = [base(75, 69, 0.4)];
    const topW = 24 + 33.3 * 0.95, topD = 24 + 33.3 * 0.75, inner: [number, number][] = [[-5, -5], [5, -5], [5, 5], [-5, 5]];
    for (const y of [0.8, 7.3, 13.8, 20.3, 26.8]) {
      const w = 24 + y * 0.95, d = 24 + y * 0.75;
      parts.push(polygon("随着外斜四肋展开且保留中心空腔的会议层", steel, [[-w / 2, -d / 2], [w / 2, -d / 2], [w / 2, d / 2], [-w / 2, d / 2]], 0.5, [0, y - 0.25, 0], [inner]));
      for (const side of [-1, 1]) {
        parts.push(box("开放交通核接向会议层的独立短桥", side * 3.85, y, 0, 2.7, 0.5, 2.6, steel), box("中心空腔前后缘与楼层相接的低护壁", 0, y + 0.85, side * 5, 10, 1.2, 0.1, pale));
        for (const z of [-3.2, 3.2]) parts.push(box("给短桥留真实缺口的空腔侧缘护壁", side * 5, y + 0.85, z, 0.1, 1.2, 3.6, pale));
      }
    }
    const baseCorners: Triple[] = [[-12, 0.4, -12], [12, 0.4, -12], [12, 0.4, 12], [-12, 0.4, 12]], topCorners: Triple[] = [[-topW / 2, 33.3, -topD / 2], [topW / 2, 33.3, -topD / 2], [topW / 2, 33.3, topD / 2], [-topW / 2, 33.3, topD / 2]];
    for (let side = 0; side < 4; side++) {
      parts.push(rail(baseCorners[side]!, topCorners[side]!, 0.85, dark));
      if (side !== 0) parts.push(...glassQuad("倒谷会议城完整外倾透光侧墙", baseCorners[side]!, baseCorners[(side + 1) % 4]!, topCorners[(side + 1) % 4]!, topCorners[side]!));
    }
    const frontZ = (y: number) => -12 - (y - 0.4) * (topD / 2 - 12) / 32.9;
    parts.push(...glassQuad("正门两边整片倾斜薄窗墙", [-12, 0.4, -12], [-3, 0.4, -12], [-3, 33.3, -topD / 2], [-topW / 2, 33.3, -topD / 2]), ...glassQuad("正门两边整片倾斜薄窗墙", [3, 0.4, -12], [12, 0.4, -12], [topW / 2, 33.3, -topD / 2], [3, 33.3, -topD / 2]), ...glassQuad("正门上方完整倾斜薄窗墙", [-3, 5, frontZ(5)], [3, 5, frontZ(5)], [3, 33.3, -topD / 2], [-3, 33.3, -topD / 2]), polygon("中央开放交通核贯穿的倒谷顶盖", pale, [[-(topW + 0.6) / 2, -(topD + 0.6) / 2], [(topW + 0.6) / 2, -(topD + 0.6) / 2], [(topW + 0.6) / 2, (topD + 0.6) / 2], [-(topW + 0.6) / 2, (topD + 0.6) / 2]], 0.45, [0, 33.2, 0], [inner]));
    for (const x of [-2.5, 2.5]) for (const z of [-2.5, 2.5]) parts.push(box("中央独立交通核贯通主柱", x, 16.85, z, 0.25, 32.9, 0.25, dark));
    parts.push(...[-1, 1].map(side => box("中央交通核顶部连柱承索横梁", 0, 33.3, side * 2.5, 5.5, 0.4, 0.4, dark)), box("顶部双横梁之间的独立承索梁", 0, 33.3, 0, 0.4, 0.4, 5.5, dark), box("中央交通核底部独立轿厢地板", 0, 0.8, 0, 4.8, 0.5, 4.8, steel), pipe("中央开放交通核内可见吊索", [0, 33.3, 0], [0, 1.04, 0], 0.055), stairFlight("倒谷会议城大门前的实际入口短梯", [0, 0.4, -14.1], 2, 0.325, 0.9, 5));
    return parts;
  }, "建筑", "科幻"),
  design("折肘双塔桥居所", "两座居住塔在中段各自折向一侧，折肘处的完整转换板围出错位露台，一条封厚箱桥绕过前庭把上部两塔的实际门口接在一起", () => {
    const parts: ModelPart[] = [base(79, 67, 0.4)];
    for (const side of [-1, 1]) {
      const shaft: [number, number][] = [[side * 17 - 1.5, -1.5], [side * 17 + 1.5, -1.5], [side * 17 + 1.5, 1.5], [side * 17 - 1.5, 1.5]];
      for (const y of [0.8, 6.8, 12.8, 18.8, 24.8, 30.8]) {
        const high = y >= 18.8, x = side * (high ? 13 : 21), z = side * (high ? -5 : 3), outline: [number, number][] = y === 18.8 ? [[-29, -15], [-13, -15], [-13, -7], [-5, -7], [-5, 17], [-21, 17], [-21, 9], [-29, 9]].map(([x, z]) => side < 0 ? [x!, z!] : [-x!, -z!]) : [[x - 8, z - 12], [x + 8, z - 12], [x + 8, z + 12], [x - 8, z + 12]];
        parts.push(polygon("错位折肘并保留升降孔的完整居住楼板", steel, outline, 0.4, [0, y - 0.2, 0], [shaft]));
      }
      for (const tier of [0, 1]) {
        const x = side * (tier ? 13 : 21), z = side * (tier ? -5 : 3), bottom = tier ? 19 : 1, top = tier ? 36.6 : 18.6, doorY = tier ? 25 : 1, outline: [number, number][] = [[x - 8, bottom], [x + 8, bottom], [x + 8, top], [x - 8, top]], door: [number, number][] = [[x - 1.6, doorY], [x + 1.6, doorY], [x + 1.6, doorY + 4.2], [x - 1.6, doorY + 4.2]];
        const front = xYWall("各段正面保留真实居住门口的薄窗墙", outline, [door], z - 12, 0.12, colors.glass); front.opacity = 0.3; front.roughness = 0.2;
        parts.push(front, part("折肘居住塔后侧完整透光薄墙", "box", colors.glass, [x, (bottom + top) / 2, z + 12], [16, top - bottom, 0.12], [0, 0, 0], { opacity: 0.3, roughness: 0.2 }), ...[-1, 1].map(s => part("折肘居住塔两端完整透光薄墙", "box", colors.glass, [x + s * 8, (bottom + top) / 2, z], [0.12, top - bottom, 24], [0, 0, 0], { opacity: 0.3, roughness: 0.2 })));
        for (const sx of [-1, 1]) for (const sz of [-1, 1]) parts.push(box("各折肘段四角贯通承重柱", x + sx * 8, (bottom + top) / 2, z + sz * 12, 0.45, top - bottom, 0.45, dark));
      }
      for (const s of [-1, 1]) parts.push(rail([side * 25, 12.5, side * 3 + s * 10], [side * 6, 18.65, -side * 5 + s * 11], 0.65, dark));
      const x = side * 13, z = -side * 5; parts.push(box("折肘居住塔完整平屋盖", x, 36.8, z, 16.7, 0.4, 24.7, pale));
      for (const sx of [-1.5, 1.5]) for (const sz of [-1.5, 1.5]) parts.push(box("折肘塔内部真正贯通的升降井细柱", side * 17 + sx, 18.6, sz, 0.15, 36.4, 0.15, dark));
      parts.push(box("折肘塔升降井底部独立轿厢", side * 17, 0.8, 0, 2.8, 0.4, 2.8, dark), pipe("折肘塔内部独立升降吊索", [side * 17, 36.7, 0], [side * 17, 0.99, 0], 0.05), stairFlight("折肘塔底层居所实际入口短梯", [side * 21, 0.4, side * 3 - 13.6], 2, 0.3, 0.8, 3));
    }
    const bridge: [number, number][] = [[-15, -7], [-15, -23], [15, -23], [15, -17], [11, -17], [11, -19], [-11, -19], [-11, -7]];
    parts.push(polygon("绕前庭折肘并分别接入两塔真门口的箱桥底板", steel, bridge, 0.4, [0, 24.6, 0]), polygon("两端接到塔体的完整折肘箱桥顶板", pale, bridge, 0.3, [0, 30.65, 0]));
    for (let edge = 0; edge < bridge.length; edge++) {
      if (edge === 3 || edge === 7) continue;
      const a = bridge[edge]!, b = bridge[(edge + 1) % bridge.length]!, dx = b[0] - a[0], dz = b[1] - a[1];
      parts.push(part("折肘箱桥连续封合的透光薄围护", "box", colors.glass, [(a[0] + b[0]) / 2, 27.825, (a[1] + b[1]) / 2], [Math.hypot(dx, dz), 5.65, 0.12], [0, -Math.atan2(dz, dx) * 180 / Math.PI, 0], { opacity: 0.3, roughness: 0.2 }));
    }
    parts.push(...[-1, 1].map(side => box("折肘箱桥前侧转角独立落地承柱", side * 13, 12.5, -21, 0.7, 24.2, 0.7, dark)));
    return parts;
  }, "建筑", "赛博朋克"),
  design("偏心月牙庭院疗养馆", "内外弧不同圆心形成两端收尖的三层月牙房翼，内弧大门直通庭院，两条实体梯分别穿过各自楼板孔并在上层真实落脚", () => {
    const alpha = Math.acos(18.25 / 29) + 0.2, beta = Math.acos(8.25 / 24) + 0.2, outline: [number, number][] = [];
    for (let i = 0; i <= 24; i++) { const a = alpha + i * (Math.PI * 2 - alpha * 2) / 24; outline.push([Math.cos(a) * 29, Math.sin(a) * 29]); }
    for (let i = 0; i <= 24; i++) { const a = -beta - i * (Math.PI * 2 - beta * 2) / 24; outline.push([10 + Math.cos(a) * 24, Math.sin(a) * 24]); }
    const parts: ModelPart[] = [base(73, 69, 0.4)];
    for (let level = 0; level < 3; level++) {
      const y = 0.8 + level * 6, holes: [number, number][][] = level ? [[[-(level === 1 ? 23 : 18) - 1.8, -13.5], [-(level === 1 ? 23 : 18) + 1.8, -13.5], [-(level === 1 ? 23 : 18) + 1.8, 13.5], [-(level === 1 ? 23 : 18) - 1.8, 13.5]]] : [];
      parts.push(polygon("两偏心弧之间保留独立梯井的月牙居住层", steel, outline, 0.4, [0, y - 0.2, 0], holes));
      for (const z of [-18, 18]) { const a = -Math.sqrt(29 ** 2 - z ** 2) + 0.4, b = 10 - Math.sqrt(24 ** 2 - z ** 2) - 3; parts.push(box("疗养房翼让开内弧走道的真实短隔墙", (a + b) / 2, y + 3, z, b - a, 5.6, 0.15, warm)); }
    }
    parts.push(polygon("与三层月牙主体相接的完整薄屋盖", pale, outline, 0.4, [0, 18.6, 0]));
    const outer = halfRoundWall("月牙房翼完整外弧薄玻璃", 29, 0.12, 17.6, [0, 1, 0], -alpha * 180 / Math.PI, colors.glass, Math.PI * 2 - alpha * 2), left = halfRoundWall("内弧大门两侧真正断开的薄玻璃", 24.12, 0.12, 17.6, [10, 1, 0], -beta * 180 / Math.PI, colors.glass, Math.PI - 0.1 - beta), right = halfRoundWall("内弧大门两侧真正断开的薄玻璃", 24.12, 0.12, 17.6, [10, 1, 0], -(Math.PI + 0.1) * 180 / Math.PI, colors.glass, Math.PI - beta - 0.1), header = halfRoundWall("内弧大门上方完整薄窗墙", 24.12, 0.12, 13.6, [10, 5, 0], -(Math.PI - 0.1) * 180 / Math.PI, colors.glass, 0.2);
    for (const value of [outer, left, right, header]) { value.opacity = 0.3; value.roughness = 0.2; parts.push(value); }
    for (const side of [-1, 1]) {
      const o: Triple = [Math.cos(alpha) * 29, 1, side * Math.sin(alpha) * 29], i: Triple = [10 + Math.cos(beta) * 24, 1, side * Math.sin(beta) * 24];
      parts.push(...glassQuad("月牙两端连接内外弧的完整透光端墙", o, i, [i[0], 18.6, i[2]], [o[0], 18.6, o[2]]));
    }
    for (let column = 0; column < 5; column++) { const a = alpha + column * (Math.PI * 2 - alpha * 2) / 4; parts.push(box("月牙外弧落地连续承重细柱", Math.cos(a) * 28.9, 9.5, Math.sin(a) * 28.9, 0.3, 18.2, 0.3, dark)); }
    for (const a of [beta, 2.1, 2.7, 3.58, 4.18, Math.PI * 2 - beta]) parts.push(box("避开内弧大门的连续承重细柱", 10 + Math.cos(a) * 24.15, 9.5, Math.sin(a) * 24.15, 0.3, 18.2, 0.3, dark));
    for (let level = 0; level < 2; level++) {
      const x = level ? -18 : -23;
      for (let flight = 0; flight < 2; flight++) parts.push(stairFlight("月牙房翼内部穿各自楼板孔的连续阶梯", [x, 1 + level * 6 + flight * 3, -13 + flight * 13], 10, 0.3, 1.3, 3.2));
      parts.push(box("月牙房翼阶梯上端实际接入楼层的落脚台", x, 6.8 + level * 6, 13.75, 3.6, 0.4, 1.5, steel));
    }
    const entry = stairFlight("内庭实际接入月牙主入口的两级短梯", [-11, 0.4, 0], 2, 0.3, 1.5, 4); entry.rotation.y = 180; parts.push(entry);
    return parts;
  }, "建筑", "科幻"),
];
