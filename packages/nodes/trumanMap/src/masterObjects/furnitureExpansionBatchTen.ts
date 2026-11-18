import { part, type ModelPart, type Triple } from "../assetModelParts";
import { box, cylinder, ball, rod, loop, cord, plate, material, type MasterPrototype } from "./parts";
import { curvedBand } from "./furnitureExpansionBatchSix";
import { clothPanel } from "./furnitureExpansionBatchNine";

export function glow(value: ModelPart, color = "#eed8a6"): ModelPart {
  return { ...value, emissive: color, emissiveIntensity: .38 };
}

export function suspension(height: number, attachment: Triple[]): ModelPart[] {
  return [cylinder("顶面独立承重接线盖", [0, height, 0], [.15, .035, .15], material.dark), ...attachment.map(point => rod("从接线盖真正接到灯身的承重细吊索", [0, height - .0175, 0], point, .004, material.dark))];
}

function tensionSpring(start: Triple, end: Triple): ModelPart {
  const dx = end[0] - start[0], dy = end[1] - start[1], length = Math.hypot(dx, dy), points: Triple[] = [start];
  for (let index = 0; index < 25; index++) { const t = .07 + index / 24 * .86, angle = index * Math.PI / 3; points.push([start[0] + dx * t + dy / length * Math.cos(angle) * .012, start[1] + dy * t - dx / length * Math.cos(angle) * .012, start[2] + Math.sin(angle) * .012]); }
  points.push(end);
  return cord("两端实际挂在铰臂间的细螺旋拉簧", points, .0025, material.steel);
}

function spiralRibbon(): ModelPart {
  const rows = Array.from({ length: 41 }, (_, index) => {
    const p = index / 40, angle = p * Math.PI * 4, r = .25 + Math.sin(p * Math.PI) * .26, y = .08 + p * .88;
    return [[r - .075, y + .004], [r + .075, y + .004], [r + .075, y - .004], [r - .075, y - .004]].map(([radius, h]) => ({ x: Math.cos(angle) * radius!, y: h!, z: Math.sin(angle) * radius! }));
  });
  const vertices: { x: number; y: number; z: number }[] = [], indices: number[] = [];
  for (let edge = 0; edge < 4; edge++) {
    const start = vertices.length;
    for (const row of rows) vertices.push(row[edge]!, row[(edge + 1) % 4]!);
    for (let index = 0; index < rows.length - 1; index++) { const a = start + index * 2, b = a + 2; indices.push(a, b, b + 1, a, b + 1, a + 1); }
  }
  for (const [row, reverse] of [[rows[0]!, false], [rows[rows.length - 1]!, true]] as const) { const start = vertices.length; vertices.push(...row); indices.push(...(reverse ? [start, start + 2, start + 1, start, start + 3, start + 2] : [start, start + 1, start + 2, start, start + 2, start + 3])); }
  return glow(part("两圈连续上升且端头闭合的整条薄型漫射螺带", "mesh", material.ivory, [0, 0, 0], [1, 1, 1], [0, 0, 0], { vertices, indices }));
}

export const furnitureExpansionBatchTenObjects: MasterPrototype[] = [
  { name: "三瓣翼杆张膜落地灯", theme: "现代", itemType: "灯具", build: () => {
    const parts: ModelPart[] = [cylinder("三瓣光翼共同站立的窄圆承足", [0, .035, 0], [.65, .07, .65], material.dark), glow(ball("悬在光翼内侧的独立乳白光球", [0, 1.5, 0], [.18, .2, .18], material.ivory))];
    const at = (index: number, radius: number, y: number): Triple => { const a = index * Math.PI * 2 / 3; return [Math.cos(a) * radius, y, Math.sin(a) * radius]; };
    for (let index = 0; index < 3; index++) parts.push({ ...curvedBand("从圆足一路外翻为光翼边脊的连续弯片", [[.25, .065], [.19, .67], [.17, 1.15], [.2, 1.45], [.55, 1.85]], .04, [0, 0, 0], .024, material.wood), rotation: { x: 0, y: -index * 120, z: 0 } }, clothPanel("在相邻弯片间真正张开的上宽下窄薄透光膜", [at(index, .18, 1.3), at(index + 1, .18, 1.3), at(index + 1, .55, 1.85), at(index, .55, 1.85)], material.ivory, .006), rod("从翼脊顶端接住中心吊光点的细横撑", at(index, .55, 1.85), [0, 1.8, 0], .008));
    parts.push(rod("光球真正悬挂在三向横撑中央的短灯颈", [0, 1.8, 0], [0, 1.59, 0], .012), cord("圆足背后自然落地的电源尾线", [[0, .04, .3], [.15, .01, .4], [.38, .01, .46]], .004, material.dark));
    return parts;
  } },
  { name: "偏石座帽檐台灯", theme: "现代", itemType: "灯具", build: () => [
    plate("斜背厚石料直接承重而没有细立柱的完整台座", [0, 0, 0], [[-.15, .02], [.14, .02], [.16, .29], [.06, .37], [-.1, .32]], .23, material.ivory, [0, 0, 0]),
    part("整体横向外张的深椭圆帽檐反光上壳", "lathe", material.dark, [.065, .35, 0], [1.28, 1, 1], [0, 0, 0], { profile: [{ x: 0, y: .15 }, { x: .13, y: .145 }, { x: .25, y: .09 }, { x: .32, y: .01 }, { x: .32, y: 0 }, { x: .3, y: .005 }, { x: .24, y: .075 }, { x: .12, y: .127 }, { x: 0, y: .13 }].reverse() }),
    glow(cylinder("深帽檐内收而不会贴成实心罩底的乳白发光盘", [.065, .369, 0], [.43, .014, .34], material.ivory)), cylinder("连接石台座和帽檐内盘的短金属灯座", [.065, .34, 0], [.065, .12, .065]),
    cylinder("石台座正面可触及的调光转钮", [0, .1, -.126], [.035, .02, .035], material.dark, [90, 0, 0]), cord("台座背侧引出的短电源线", [[.02, .04, .12], [.18, .01, .19], [.3, .01, .17]], .004, material.dark),
  ] },
  { name: "翻书放射风琴灯", theme: "现代", itemType: "灯具", build: () => {
    const parts: ModelPart[] = [rod("横向贯穿整本灯页的真实书脊铰轴", [0, .055, -.145], [0, .055, .145], .025, material.dark)];
    for (let index = 0; index < 21; index++) { const angle = (12 + index * 7.8) * Math.PI / 180; parts.push(glow(box("在共同书脊周围逐片放射展开的风琴透光灯页", [Math.cos(angle) * .17, .055 + Math.sin(angle) * .17, 0], [.33, .004, .26], material.ivory, [0, 0, angle * 180 / Math.PI]))); }
    for (const angle of [4, 176]) { const a = angle * Math.PI / 180; parts.push(box("能够互相对合并收住全部风琴灯页的完整硬书封", [Math.cos(a) * .18, .055 + Math.sin(a) * .18, 0], [.36, .012, .29], material.wood, [0, 0, angle])); }
    parts.push(box("书脊内部的独立细长供电舱", [0, .046, 0], [.045, .055, .27], material.dark), cylinder("书脊端头独立电源触键", [0, .05, -.147], [.017, .012, .017], material.steel, [90, 0, 0]));
    return parts;
  } },
  { name: "叠叶松果吊灯", theme: "现代", itemType: "灯具", build: () => {
    const parts: ModelPart[] = [rod("各层悬叶共同锁定的真实中央灯轴", [0, .16, 0], [0, 1.07, 0], .018), glow(ball("叶层中不直接裸露的中央漫射光球", [0, .55, 0], [.2, .32, .2], material.ivory)), ...suspension(1.52, [[0, 1.07, 0]])];
    for (let row = 0; row < 4; row++) {
      const y = .25 + row * .17, reach = .37 + Math.sin((row + 1) * Math.PI / 5) * .12;
      parts.push(loop("各层叶片根部真正固定的独立细圈", [0, y + .05, 0], .18, .008));
      for (let index = 0; index < 8; index++) { const angle = index * 45 + row % 2 * 22.5; parts.push({ ...curvedBand("像松果鳞片一样上下错叠但各自完整的反光叶", [[.18, y + .05], [.28, y + .07], [reach - .03, y - .045], [reach, y - .12]], .18, [0, 0, 0], .007, material.ivory), rotation: { x: 0, y: -angle, z: 0 } }); }
      for (let index = 0; index < 3; index++) { const angle = index * Math.PI * 2 / 3; parts.push(rod("从中央灯轴实际接到叶根承圈的短辐条", [0, y + .05, 0], [Math.cos(angle) * .18, y + .05, Math.sin(angle) * .18], .005)); }
    }
    return parts;
  } },
  { name: "连续螺带吊灯", theme: "现代", itemType: "灯具", build: () => [
    spiralRibbon(), ...suspension(1.5, [[.25, .964, 0], [-.43385, .744, 0], [.51, .524, 0]]),
    rod("不与螺带层面相碰的独立中央导线芯", [0, .1, 0], [0, 1.48, 0], .006, material.dark),
  ] },
  { name: "大沿张索飞翼吊灯", theme: "现代", itemType: "灯具", build: () => {
    const parts: ModelPart[] = [cylinder("大帽沿中央的轻质灯轴套", [0, .26, 0], [.13, .17, .13], material.dark), glow(ball("帽沿中央独立垂下的圆漫射光体", [0, .16, 0], [.16, .18, .16], material.ivory)), ...suspension(1.2, [[0, .345, 0]])];
    const edge = Array.from({ length: 16 }, (_, index): Triple => { const a = index * Math.PI / 8; return [Math.cos(a) * 1.06, .27 + Math.cos(a * 2) * .075, Math.sin(a) * .78]; });
    parts.push(cord("整张飞翼帽沿实际闭合的柔性外框", [...edge, edge[0]!], .009, material.dark));
    for (let index = 0; index < edge.length; index++) parts.push(rod("从灯轴辐射到帽沿的完整轻质张力细肋", [0, .3, 0], edge[index]!, .004, material.dark), clothPanel("两根张肋之间只填一层薄膜的飞翼扇面", [[0, .3, 0], edge[index]!, edge[(index + 1) % edge.length]!], material.ivory, .003));
    return parts;
  } },
  { name: "骨环绷布鼓罩吊灯", theme: "现代", itemType: "灯具", build: () => {
    const parts: ModelPart[] = [part("上下均有真实开口的直筒绷布鼓罩", "lathe", material.ivory, [0, .06, 0], [1, 1, 1], [0, 0, 0], { profile: [{ x: .45, y: 0 }, { x: .45, y: .45 }, { x: .443, y: .45 }, { x: .443, y: 0 }, { x: .45, y: 0 }] }), ...[.065, .505].map(y => loop("鼓罩口沿真正撑住整幅布罩的上下细骨环", [0, y, 0], .45, .009)), cylinder("鼓罩内侧独立灯泡旋座", [0, .42, 0], [.045, .12, .045], material.dark), glow(ball("鼓罩中央位于开口以内的独立漫射泡", [0, .29, 0], [.12, .15, .12], material.ivory)), ...suspension(1.11, [[0, .485, 0]])];
    for (let index = 0; index < 3; index++) { const a = index * Math.PI * 2 / 3; parts.push(rod("上圈到中央灯座的真正三向承重辐条", [0, .47, 0], [Math.cos(a) * .445, .5, Math.sin(a) * .445], .005)); }
    parts.push(glow(cylinder("与鼓罩下口留细通风缝的内嵌柔光底盘", [0, .08, 0], [.86, .006, .86], material.ivory)));
    return parts;
  } },
  { name: "收腰肋骨茧膜吊灯", theme: "现代", itemType: "灯具", build: () => {
    const profile: [number, number][] = [[.05, .04], [.28, .14], [.38, .31], [.24, .5], [.31, .7], [.24, .89], [.055, .99]];
    const parts: ModelPart[] = [{ ...glow(part("绕钢肋连续包裹并保持中部收腰的双鼓茧膜", "lathe", material.ivory, [0, 0, 0], [1, 1, 1], [0, 0, 0], { profile: [...profile, ...profile.map(([x, y]): [number, number] => [x - .006, y]).reverse(), profile[0]!].map(([x, y]) => ({ x, y })) })), opacity: .66 }, ...suspension(1.48, [[0, .99, 0]]), ...[.04, .99].map(y => loop("把茧膜上下窄口锁住的细骨圈", [0, y, 0], .055, .006)), rod("茧膜内真正接到吊索的中央灯座轴", [0, .43, 0], [0, .99, 0], .012), glow(ball("收腰茧膜内的独立灯芯", [0, .46, 0], [.1, .19, .1], material.ivory))];
    for (let index = 0; index < 8; index++) parts.push({ ...cord("沿双鼓曲线连续塑造膜面而非层盘堆叠的纵肋", profile.map(([r, y]): Triple => [r - .006, y, 0]), .004, material.steel), rotation: { x: 0, y: -index * 45, z: 0 } });
    for (let index = 0; index < 3; index++) { const a = index * Math.PI * 2 / 3; parts.push(rod("窄口圈与中央轴之间实际承住膜罩的顶撑", [0, .99, 0], [Math.cos(a) * .055, .99, Math.sin(a) * .055], .004)); }
    return parts;
  } },
  { name: "立体星芒球吊灯", theme: "现代", itemType: "灯具", build: () => {
    const parts: ModelPart[] = [ball("立体星芒所有径向灯杆共同锁定的中央毂", [0, .68, 0], [.2, .2, .2], material.steel), ...suspension(1.65, [[0, .78, 0]])];
    for (let index = 0; index < 18; index++) { const y = 1 - 2 * (index + .5) / 18, r = Math.sqrt(1 - y * y), angle = index * Math.PI * (3 - Math.sqrt(5)), end: Triple = [Math.cos(angle) * r * .56, .68 + y * .56, Math.sin(angle) * r * .56]; parts.push(rod("从球毂向整个立体球面分布的独立承灯射杆", [0, .68, 0], end, .018), glow(ball("锁在射杆末端而不只在平面增加灯头的完整磨砂光球", end, [.1, .1, .1], material.ivory))); }
    return parts;
  } },
  { name: "玻棒阶梯瀑帘吊灯", theme: "现代", itemType: "灯具", build: () => {
    const parts: ModelPart[] = [box("悬承整片玻棒瀑帘的长方顶梁", [0, 1.03, 0], [1.19, .06, .47], material.dark), ...suspension(1.56, [[-.45, 1.06, -.15], [.45, 1.06, .15]])];
    for (let row = 0; row < 3; row++) for (let index = 0; index < 9; index++) { const x = (index - 4) * .13, z = (row - 1) * .16, length = .38 + (1 - Math.abs(index - 4) / 5) * .33 + (1 - Math.abs(row - 1)) * .13; parts.push({ ...cylinder("从同一梁下逐根独立垂挂的实体折光玻璃棒", [x, 1 - length / 2, z], [.047, length, .047], material.glass), opacity: .3, roughness: .18 }, rod("玻璃棒顶端实际锁到承梁的独立细挂颈", [x, .96, z], [x, 1.02, z], .009)); }
    parts.push(glow(box("玻棒瀑帘顶梁内隐藏的连续线光面", [0, .991, 0], [1.09, .01, .38], material.ivory)));
    return parts;
  } },
  { name: "环轴交错球笼吊灯", theme: "现代", itemType: "灯具", build: () => {
    const parts: ModelPart[] = [...[[90, 0, 0], [0, 0, 90], [0, 0, 0]].map(rotation => loop("三个相互正交并共同围成球体的完整金属承环", [0, .57, 0], .47, .012, rotation as Triple)), glow(ball("球笼空腔内独立设置的中央漫射光球", [0, .57, 0], [.2, .2, .2], material.ivory)), rod("从上环真实悬住光球的独立短灯颈", [0, .67, 0], [0, 1.04, 0], .014), ...suspension(1.57, [[0, 1.04, 0]])];
    for (const axis of [0, 1, 2]) for (const side of [-1, 1]) { const point: Triple = [0, .57, 0]; point[axis] += side * .464; parts.push(ball("在正交环相交点实际夹住两环的小连接帽", point, [.035, .035, .035], material.dark)); }
    return parts;
  } },
  { name: "折叶偏心反射吊灯", theme: "现代", itemType: "灯具", build: () => [
    { ...curvedBand("从低左翼到高肩再向右下折回的完整上反光叶", [[-.55, .19], [-.25, .53], [.18, .62], [.65, .41], [.81, .26]], .46, [0, 0, 0], .015, material.ivory), rotation: { x: 0, y: 0, z: 0 } },
    { ...curvedBand("与上叶错开并承接间接光线的独立下折叶", [[-.45, .12], [-.1, .3], [.25, .31]], .46, [0, 0, 0], .014, material.wood), rotation: { x: 0, y: 0, z: 0 } },
    glow(box("藏在上叶肩部内侧的独立细长反射光源", [.12, .594, 0], [.28, .016, .34], material.ivory, [0, 0, 11.8])),
    ...[-1, 1].map(side => rod("前后两侧把下叶接入上叶而不封住中间空腔的薄连杆", [-.1, .3, side * .2], [-.1, .56, side * .2], .006)),
    ...suspension(1.22, [[-.25, .54, -.18], [.18, .63, .18]]),
  ] },
  { name: "波鳍线性吊灯", theme: "现代", itemType: "灯具", build: () => [
    box("整排波鳍共同锁定的完整线性上梁", [0, .385, 0], [1.75, .025, .085], material.dark), glow(box("藏在上梁底下并沿整排波鳍延展的连续光条", [0, .364, 0], [1.69, .013, .05], material.ivory)),
    ...Array.from({ length: 15 }, (_, index) => curvedBand("每片自身向两侧回卷的薄波形遮眩鳍", [[-.21, .12], [-.28, .25], [0, .37], [.28, .25], [.21, .12]], .018, [(index - 7) * .118, 0, 0], .012, material.ivory)),
    ...suspension(1.04, [[-.66, .4, 0], [.66, .4, 0]]),
  ] },
  { name: "长颈枝束玻璃珠吊灯", theme: "现代", itemType: "灯具", build: () => {
    const nodes: Triple[] = [[-.56, .34, -.17], [.51, .63, -.29], [-.23, .91, .35], [.38, .22, .27], [-.49, .65, .23], [.22, .95, -.12]];
    const parts: ModelPart[] = [cord("由顶部下垂并连续分枝的主颈灯干", [[0, 1.33, 0], [-.09, .95, .05], [.07, .56, .01], [0, .2, .04]], .018, material.dark), ...suspension(1.75, [[0, 1.33, 0]])];
    for (let index = 0; index < nodes.length; index++) { const point = nodes[index]!, y = .43 + index % 3 * .24, trunkX = y > .85 ? -.08 : y > .6 ? .02 : .045; parts.push(cord("沿主干不同高度自然分出的长颈弯枝", [[trunkX, y, .03], [point[0] * .55, y + .06, point[2] * .55], [point[0], point[1] + .115, point[2]]], .012, material.dark), { ...ball("真正锁在枝端的独立封闭薄玻璃珠罩", point, [.23, .23, .23], material.glass), opacity: .26, roughness: .18 }, glow(ball("玻璃珠罩内部独立的窄乳白光芯", point, [.075, .09, .075], material.ivory)), cylinder("玻璃珠上口与弯枝相接的独立灯座帽", [point[0], point[1] + .11, point[2]], [.052, .045, .052], material.steel)); }
    return parts;
  } },
  { name: "下照夹碟壁灯", theme: "现代", itemType: "灯具", build: () => [
    box("真正固定到墙面的独立竖装板", [0, .3, .18], [.12, .32, .025], material.dark),
    part("把两碟与墙面接成整体的深C形夹臂", "extrude", material.steel, [0, 0, 0], [1, 1, 1], [0, 90, 0], { depth: .03, profile: [[-.17, .17], [-.17, .495], [.16, .495], [.16, .46], [-.14, .46], [-.14, .205], [.12, .205], [.12, .17]].map(([x, y]) => ({ x: x!, y: y! })) }),
    part("夹臂上方带下翻边的宽浅反光碟", "lathe", material.dark, [0, .44, -.04], [1, 1, 1], [0, 0, 0], { profile: [{ x: 0, y: .055 }, { x: .17, y: .045 }, { x: .25, y: 0 }, { x: .25, y: -.018 }, { x: .24, y: -.018 }, { x: .165, y: .03 }, { x: 0, y: .04 }].reverse() }),
    part("由同一夹臂托住而保留两碟间隙的浅下碟", "lathe", material.ivory, [0, .18, -.04], [1, 1, 1], [0, 0, 0], { profile: [{ x: 0, y: 0 }, { x: .16, y: .025 }, { x: .19, y: .07 }, { x: .18, y: .07 }, { x: .15, y: .037 }, { x: 0, y: .013 }] }),
    glow(cylinder("藏在上碟内侧并向下发光的独立窄盘", [0, .465, -.04], [.28, .008, .28], material.ivory)),
    rod("把窄光盘实际接到上碟内壁的短灯座", [0, .465, -.04], [0, .485, -.04], .022),
  ] },
  { name: "平行四杆双簧落地工作灯", theme: "现代", itemType: "灯具", build: () => {
    const parts: ModelPart[] = [cylinder("能承受前伸灯臂而不只放大台灯的厚圆地座", [0, .04, 0], [.51, .08, .51], material.dark), rod("从地座升到双四杆根铰的完整落地支柱", [0, .08, 0], [0, .65, 0], .035), ...[-1, 1].map(side => rod("落地支柱头部实际夹住转轴两端的双叉", [0, .6, side * .04], [0, .65, side * .04], .016))];
    const lower: [number, number][] = [[0, .65], [.065, .65], [-.305, 1.24], [-.37, 1.24]], upper: [number, number][] = [[-.37, 1.24], [-.305, 1.24], [.405, 1.66], [.34, 1.66]];
    for (const corners of [lower, upper]) for (let index = 0; index < corners.length; index++) { const a = corners[index]!, b = corners[(index + 1) % 4]!; parts.push(rod("四边闭合而保持灯头姿态的真实平行四杆", [a[0], a[1], 0], [b[0], b[1], 0], .016, material.steel), cylinder("两段平行四杆拐角真正贯通的前后转销", [a[0], a[1], 0], [.035, .065, .035], material.dark, [90, 0, 0])); }
    for (const side of [-1, 1]) parts.push(tensionSpring([-.02, .88, side * .035], [-.29, 1.2, side * .035]), rod("拉簧下端实际接回下四杆的短支耳", [-.144, .88, 0], [-.02, .88, side * .035], .008), rod("拉簧上端实际接回下四杆的短支耳", [-.345, 1.2, 0], [-.29, 1.2, side * .035], .008));
    parts.push(rod("前端四杆轴到可俯仰灯罩的独立短颈", [.373, 1.66, 0], [.48, 1.7, 0], .018), part("下缘真正开放的完整俯照金属深罩", "lathe", material.dark, [.48, 1.7, 0], [1, 1, 1], [0, 0, -22], { profile: [{ x: 0, y: .055 }, { x: .07, y: .04 }, { x: .17, y: -.08 }, { x: .17, y: -.1 }, { x: .16, y: -.1 }, { x: .06, y: .025 }, { x: 0, y: .04 }].reverse() }), glow(ball("深罩内独立设置的单个漫射灯芯", [.51, 1.64, 0], [.08, .08, .08], material.ivory)), cord("从支柱落到地座背后的电源尾线", [[0, .11, .03], [0, .01, .3], [.24, .01, .42]], .004));
    return parts;
  } },
  { name: "反张双弧光帆落地灯", theme: "现代", itemType: "灯具", build: () => {
    const left: Triple[] = [[-.25, .07, 0], [-.45, .65, .08], [-.32, 1.4, 0], [-.11, 1.93, -.08]], right = left.map(([x, y, z]): Triple => [-x, y, z]);
    const parts: ModelPart[] = [box("两根弧杆共同抵接的宽而低的地脚", [0, .035, 0], [.69, .07, .35], material.dark), cord("从左地脚一直反张到帆顶的连续弹性主杆", left, .016), cord("从右地脚反向夹住光帆的连续弹性主杆", right, .016)];
    for (let index = 1; index < left.length; index++) parts.push(glow(clothPanel("在两根弧杆之间真实绷起且腰部外鼓的完整光帆片", [left[index - 1]!, right[index - 1]!, right[index]!, left[index]!], material.ivory, .007)));
    parts.push(rod("光帆最上端两根弧杆之间的实际锁口横销", left[left.length - 1]!, right[right.length - 1]!, .012), cord("从地脚后端引出而不悬空的电源软线", [[0, .04, .17], [.1, .01, .29], [.3, .01, .39]], .004, material.dark));
    return parts;
  } },
  { name: "扭转方笼漫射柱灯", theme: "现代", itemType: "灯具", build: () => {
    const point = (corner: number, row: number, radius: number): Triple => { const angle = corner * Math.PI / 2 + row * Math.PI / 12 + Math.PI / 4; return [Math.cos(angle) * radius, .09 + row * .4, Math.sin(angle) * radius]; };
    const parts: ModelPart[] = [plate("四角与扭笼起点相合的整块承重方足", [0, .045, 0], [[-.23, -.23], [.23, -.23], [.23, .23], [-.23, .23]], .09, material.dark)];
    for (let corner = 0; corner < 4; corner++) {
      parts.push(cord("沿高度连续转过六十度而不只是直杆换数量的方笼长肋", Array.from({ length: 5 }, (_, row) => point(corner, row, .31)), .012, material.wood));
      for (let row = 0; row < 4; row++) parts.push(glow(clothPanel("随四角肋骨连续扭转的独立薄型漫射面片", [point(corner, row, .302), point(corner + 1, row, .302), point(corner + 1, row + 1, .302), point(corner, row + 1, .302)], material.ivory, .006)));
    }
    for (const row of [0, 2, 4]) for (let corner = 0; corner < 4; corner++) parts.push(rod("把同层四根扭肋实际锁成方框的横向细骨", point(corner, row, .31), point(corner + 1, row, .31), .009, material.wood));
    return parts;
  } },
  { name: "双卷带反射壁灯", theme: "现代", itemType: "灯具", build: () => [
    box("双卷反光带共同接墙的窄背板", [0, .31, .145], [.16, .32, .025], material.dark),
    ...[-1, 1].map(side => ({ ...curvedBand("沿对角方向反向盘卷的完整宽反光钢带", [[-.28, .1], [-.3, .35], [-.12, .51], [.16, .43], [.32, .17]], .12, [0, 0, side * .065], .015, material.ivory), rotation: { x: 0, y: 0, z: side < 0 ? 180 : 0 }, position: { x: 0, y: side < 0 ? .62 : 0, z: side * .065 } })),
    rod("从背板上部接到前卷带实际高肩的斜向墙臂", [0, .4, .133], [-.12, .51, .065], .012), rod("从背板下部接到后卷带实际低肩的斜向墙臂", [0, .22, .133], [.12, .11, -.065], .012),
    glow(cord("紧贴前卷带内表面而不悬在空腔中的曲线光芯", [[-.28, .1, 0], [-.3, .35, 0], [-.12, .51, 0], [.16, .43, 0], [.32, .17, 0]], .01, material.ivory)),
  ] },
  { name: "双扇圆蝶铰面壁灯", theme: "现代", itemType: "灯具", build: () => [
    box("蝶翼灯固定到墙面的小型背座", [0, .3, .095], [.09, .4, .025], material.dark), rod("两片半圆翼共用而可独立转动的竖向铰脊", [0, .03, -.04], [0, .57, -.04], .018, material.steel),
    ...[-1, 1].map(side => plate("整片半圆反光面沿中脊打开的独立圆蝶翼", [0, .3, -.04], Array.from({ length: 13 }, (_, index): [number, number] => { const angle = -Math.PI / 2 + index * Math.PI / 12; return [side * Math.cos(angle) * .28, Math.sin(angle) * .28]; }), .008, material.ivory, [0, side * 32, 0])),
    ...[.13, .47].map(y => rod("从墙座实际接到圆蝶铰脊的独立短桥", [0, y, .085], [0, y, -.04], .012)),
    glow(cylinder("藏在蝶翼中缝内并向两翼照射的细长光芯", [0, .3, -.064], [.019, .37, .019], material.ivory)),
    rod("从铰脊实际夹住独立光芯中部的短灯夹", [0, .3, -.04], [0, .3, -.064], .008),
  ] },
  { name: "扁框拱门线光落地灯", theme: "现代", itemType: "灯具", build: () => [
    { ...curvedBand("由两侧地脚连续弯成拱门且不封底的整根宽扁灯框", [[-.39, .07], [-.39, 1.4], [-.32, 1.63], [0, 1.7], [.32, 1.63], [.39, 1.4], [.39, .07]], .075, [0, 0, 0], .055, material.dark), rotation: { x: 0, y: 0, z: 0 } },
    ...[-1, 1].map(side => box("与两根竖框真正相接的前后宽落地足", [side * .39, .035, 0], [.13, .07, .47], material.dark)),
    glow(cord("嵌在拱框内缘而保留整面中央通透空腔的连续线光", [[-.359, .11, -.04], [-.359, 1.4, -.04], [-.29, 1.6, -.04], [0, 1.669, -.04], [.29, 1.6, -.04], [.359, 1.4, -.04], [.359, .11, -.04]], .008, material.ivory)),
    cord("从左地足后端接到电源的独立短线", [[-.39, .04, .23], [-.35, .01, .34], [-.13, .01, .43]], .004),
  ] },
  { name: "对锥砂漏漫射柱灯", theme: "现代", itemType: "灯具", build: () => [
    cylinder("支住双锥灯体而不扩大灯腰的低位圆脚", [0, .035, 0], [.51, .07, .51], material.dark),
    part("上下开放并在中部收合成细颈的整体双锥反光壳", "lathe", material.ivory, [0, .07, 0], [1, 1, 1], [0, 0, 0], { profile: [{ x: .25, y: 0 }, { x: .235, y: .2 }, { x: .065, y: .62 }, { x: .235, y: 1.04 }, { x: .25, y: 1.24 }, { x: .241, y: 1.24 }, { x: .226, y: 1.04 }, { x: .056, y: .62 }, { x: .226, y: .2 }, { x: .241, y: 0 }, { x: .25, y: 0 }] }),
    glow(cylinder("下锥腔内独立内收的漫射底盘", [0, .24, 0], [.4, .009, .4], material.ivory)), glow(cylinder("上锥腔内独立内收的漫射顶盘", [0, 1.14, 0], [.4, .009, .4], material.ivory)), cylinder("双锥细颈内部真正接通供电的窄光芯座", [0, .69, 0], [.08, .19, .08], material.dark),
    rod("从地座实际接住上下两片光盘的内藏轴芯", [0, .07, 0], [0, 1.14, 0], .015),
    ...[.24, 1.14].flatMap(y => Array.from({ length: 3 }, (_, index) => { const a = index * Math.PI * 2 / 3; return rod("从灯轴穿过光盘并实际接到锥壁的短承辐条", [0, y, 0], [Math.cos(a) * .231, y, Math.sin(a) * .231], .007); })),
  ] },
  { name: "月牙托球平衡台灯", theme: "现代", itemType: "灯具", build: () => [
    cylinder("承受开口月牙偏心重量的独立厚圆足", [-.145, .025, 0], [.35, .05, .35], material.dark), rod("从圆足实际接到月牙低弧的短承颈", [-.145, .05, 0], [-.145, .099, 0], .035),
    { ...curvedBand("由下端绕左侧上升再回到吊点的完整开口月牙框", Array.from({ length: 13 }, (_, index): [number, number] => { const angle = (60 + index * 20) * Math.PI / 180; return [Math.cos(angle) * .29, Math.sin(angle) * .29]; }), .075, [0, .35, 0], .047, material.wood), rotation: { x: 0, y: 0, z: 0 } },
    rod("从月牙上端真正吊住圆光球的细短颈", [.145, .60115, 0], [.17, .465, 0], .008, material.dark), glow(ball("悬在月牙开口空腔中而不与月框重合的完整光球", [.17, .35, 0], [.23, .23, .23], material.ivory)),
  ] },
  { name: "环缝帽檐低柱庭院灯", theme: "现代", itemType: "灯具", build: () => {
    const parts: ModelPart[] = [cylinder("庭院矮柱与地面连接的宽底法兰", [0, .025, 0], [.31, .05, .31], material.dark), part("内部可穿线且真实开放的厚壁柱管", "lathe", material.dark, [0, .05, 0], [1, 1, 1], [0, 0, 0], { profile: [{ x: .075, y: 0 }, { x: .075, y: .66 }, { x: .064, y: .66 }, { x: .064, y: 0 }, { x: .075, y: 0 }] }), cylinder("藏在空柱内并把帽盖真正支回地脚的独立细灯轴", [0, .42, 0], [.045, .76, .045]), part("越过柱管并把光导向地面的宽檐帽盖", "lathe", material.dark, [0, .71, 0], [1, 1, 1], [0, 0, 0], { profile: [{ x: 0, y: .1 }, { x: .08, y: .09 }, { x: .26, y: .03 }, { x: .26, y: .013 }, { x: .25, y: .013 }, { x: .07, y: .075 }, { x: 0, y: .084 }].reverse() }), glow(part("藏在帽檐下方而不封住中央柱的真实环形光槽", "lathe", material.ivory, [0, .725, 0], [1, 1, 1], [0, 0, 0], { profile: [{ x: .1, y: 0 }, { x: .21, y: 0 }, { x: .21, y: .008 }, { x: .1, y: .008 }, { x: .1, y: 0 }] }))];
    for (let index = 0; index < 3; index++) { const a = index * Math.PI * 2 / 3; parts.push(rod("柱顶与发光环槽之间实际接承的短辐臂", [0, .728, 0], [Math.cos(a) * .2, .728, Math.sin(a) * .2], .01), cylinder("庭院柱底法兰真正固定地面的外露螺帽", [Math.cos(a) * .12, .055, Math.sin(a) * .12], [.018, .015, .018], material.steel)); }
    return parts;
  } },
  { name: "券块拱门步道灯", theme: "现代", itemType: "灯具", build: () => {
    const parts: ModelPart[] = [...[-1, 1].map(side => box("拱券两侧独立落地的厚石墩", [side * .35, .08, 0], [.18, .16, .31], material.ivory))];
    for (let index = 0; index < 7; index++) { const a = index * Math.PI / 7, b = (index + 1) * Math.PI / 7; parts.push(plate("彼此真实接触而围成通孔的独立楔形石券块", [0, .16, 0], [[Math.cos(a) * .28, Math.sin(a) * .28], [Math.cos(a) * .42, Math.sin(a) * .42], [Math.cos(b) * .42, Math.sin(b) * .42], [Math.cos(b) * .28, Math.sin(b) * .28]], .29, material.ivory, [0, 0, 0])); }
    parts.push(glow(cord("沿石券内弧而保留整个拱洞的实际细线光源", Array.from({ length: 13 }, (_, index): Triple => { const a = index * Math.PI / 12; return [Math.cos(a) * .278, .16 + Math.sin(a) * .278, -.1]; }), .006, material.ivory)), box("隐藏在右墩后的独立防水接线盒", [.35, .075, .17], [.12, .09, .045], material.dark));
    return parts;
  } },
];
