import { Vector3 } from "three";
import { part, beam, type ModelPart, type Triple } from "../assetModelParts";
import { box, cylinder, ball, rod, loop, cord, plate, material, type MasterPrototype } from "./parts";
import { curvedBand } from "./furnitureExpansionBatchSix";
import { clothPanel } from "./furnitureExpansionBatchNine";
import { glow, suspension } from "./furnitureExpansionBatchTen";

function halfTwistedBand(): ModelPart {
  const rows = Array.from({ length: 33 }, (_, index) => {
    const a = index * Math.PI / 16, c = Math.cos(a), s = Math.sin(a), half = a / 2;
    const w = new Vector3(c * Math.cos(half), Math.sin(half), s * Math.cos(half)), d = new Vector3(-c * Math.sin(half), Math.cos(half), -s * Math.sin(half));
    return [[-1, 1], [1, 1], [1, -1], [-1, -1]].map(([u, v]) => ({ x: .41 * c + w.x * u! * .13 + d.x * v! * .006, y: .36 + w.y * u! * .13 + d.y * v! * .006, z: .41 * s + w.z * u! * .13 + d.z * v! * .006 }));
  });
  const vertices: { x: number; y: number; z: number }[] = [], indices: number[] = [];
  for (let edge = 0; edge < 4; edge++) {
    const start = vertices.length;
    for (const row of rows) vertices.push(row[edge]!, row[(edge + 1) % 4]!);
    for (let row = 0; row < rows.length - 1; row++) { const a = start + row * 2, b = a + 2; indices.push(a, b, b + 1, a, b + 1, a + 1); }
  }
  // ACT: 半扭后末截面与首截面的对角边重合，保持闭合，不在接缝再封一层盖面。
  return glow(part("首尾经半扭互接的完整双面厚光带", "mesh", material.ivory, [0, 0, 0], [1, 1, 1], [0, 0, 0], { vertices, indices }));
}

function knotLight(): ModelPart {
  const vertices: { x: number; y: number; z: number }[] = [], indices: number[] = [];
  for (let row = 0; row < 48; row++) {
    const t = row * Math.PI / 24, r = 2 + Math.cos(3 * t), dr = -3 * Math.sin(3 * t), c = Math.cos(2 * t), s = Math.sin(2 * t);
    const center = new Vector3(.19 * r * c, .66 + .19 * r * s, .19 * Math.sin(3 * t)), tangent = new Vector3(dr * c - 2 * r * s, dr * s + 2 * r * c, 3 * Math.cos(3 * t)).normalize();
    const normal = new Vector3(-tangent.y, tangent.x, 0).normalize(), binormal = new Vector3().crossVectors(tangent, normal);
    for (let side = 0; side < 8; side++) { const a = side * Math.PI / 4, value = center.clone().addScaledVector(normal, Math.cos(a) * .045).addScaledVector(binormal, Math.sin(a) * .045); vertices.push({ x: value.x, y: value.y, z: value.z }); }
  }
  for (let row = 0; row < 48; row++) for (let side = 0; side < 8; side++) { const a = row * 8 + side, b = row * 8 + (side + 1) % 8, c = (row + 1) % 48 * 8 + (side + 1) % 8, d = (row + 1) % 48 * 8 + side; indices.push(a, b, c, a, c, d); }
  return glow(part("真实闭合而不把交叉管压成平面图案的三叶结光管", "mesh", material.ivory, [0, 0, 0], [1, 1, 1], [0, 0, 0], { vertices, indices }));
}

function drapedSquare(): ModelPart {
  const rows: Triple[] = [];
  for (let z = 0; z < 5; z++) for (let x = 0; x < 5; x++) { const px = (x / 4 - .5) * 1.3, pz = (z / 4 - .5) * 1.1; rows.push([px, .2 + .225 * ((px / .65) ** 2 + (pz / .55) ** 2), pz]); }
  const vertices = [-1, 1].flatMap(side => rows.map(([x, y, z]) => ({ x, y: y + side * .004, z }))), indices: number[] = [];
  for (let z = 0; z < 4; z++) for (let x = 0; x < 4; x++) { const a = z * 5 + x, b = a + 1, c = a + 5, d = c + 1; indices.push(a + 25, c + 25, d + 25, a + 25, d + 25, b + 25, a, d, c, a, b, d); }
  const rim = [...[0, 1, 2, 3], ...[4, 9, 14, 19], ...[24, 23, 22, 21], ...[20, 15, 10, 5]].reverse();
  for (let index = 0; index < rim.length; index++) { const a = rim[index]!, b = rim[(index + 1) % rim.length]!, start = vertices.length; vertices.push(vertices[a + 25]!, vertices[a]!, vertices[b]!, vertices[b + 25]!); indices.push(start, start + 1, start + 2, start, start + 2, start + 3); }
  return glow(part("四角高吊且中心自然下垂的闭合薄型方巾光膜", "mesh", material.ivory, [0, 0, 0], [1, 1, 1], [0, 0, 0], { vertices, indices }));
}

export const furnitureExpansionBatchElevenObjects: MasterPrototype[] = [
  { name: "半扭环带吊灯", theme: "现代", itemType: "灯具", build: () => [
    halfTwistedBand(), ...suspension(1.18, [[.41, .366, 0], [-.205, .363, .35507], [-.205, .357, -.35507]]),
  ] },
  { name: "连结三叶光绳吊灯", theme: "现代", itemType: "灯具", build: () => [
    knotLight(), ...suspension(1.6, [[.57, .66, 0], [-.285, .16637, 0], [-.285, 1.15363, 0]]),
  ] },
  { name: "四角悬垂方巾吊灯", theme: "现代", itemType: "灯具", build: () => [
    drapedSquare(), ...suspension(1.45, [[-.65, .654, -.55], [.65, .654, -.55], [.65, .654, .55], [-.65, .654, .55]]),
    ...[-1, 1].flatMap(x => [-1, 1].map(z => ball("把吊索压进薄膜角部的独立小夹头", [x * .65, .654, z * .55], [.033, .024, .033], material.steel))),
  ] },
  { name: "双支点波面带状吊灯", theme: "现代", itemType: "灯具", build: () => {
    const points: [number, number][] = Array.from({ length: 13 }, (_, index): [number, number] => { const x = (index - 6) * .16; return [x, .28 + Math.sin(x * Math.PI / .96) * .14]; });
    return [{ ...glow(curvedBand("整幅连续起伏而没有独立横鳍的厚漫射光带", points, .24, [0, 0, 0], .02, material.ivory)), rotation: { x: 0, y: 0, z: 0 } }, ...suspension(1.06, [[points[2]![0], points[2]![1] + .01, 0], [points[10]![0], points[10]![1] + .01, 0]]), ...[2, 10].map(index => box("在真实吊点夹住整幅波带的窄金属线夹", [points[index]![0], points[index]![1], 0], [.03, .04, .255], material.steel))];
  } },
  { name: "面板折尺线光落地灯", theme: "现代", itemType: "灯具", build: () => {
    const nodes: Triple[] = [[0, .08, 0], [-.18, .8, 0], [.4, 1.25, 0], [.1, 1.85, 0]], parts: ModelPart[] = [box("多段发光折尺共用的完整重质地足", [0, .04, 0], [.45, .08, .32], material.dark)];
    for (let index = 0; index < nodes.length - 1; index++) { const a = nodes[index]!, b = nodes[index + 1]!; parts.push(beam("本身承担上下段重量的扁矩形灯梁", material.dark, a, b, .065, .04), glow(beam("嵌在承重灯梁前侧的连续薄发光面", material.ivory, [a[0], a[1], -.024], [b[0], b[1], -.024], .027, .008))); }
    for (const point of nodes.slice(1, -1)) parts.push(cylinder("贯通两段扁梁的独立锁角转轴", point, [.095, .068, .095], material.steel, [90, 0, 0]));
    parts.push(cord("地足后方自然落地的电源软线", [[0, .04, .16], [.14, .01, .27], [.35, .01, .32]], .004, material.dark));
    return parts;
  } },
  { name: "悬轴万向遮光球灯", theme: "现代", itemType: "灯具", build: () => [
    part("前侧真实敞口的完整厚壁球弧外罩", "lathe", material.dark, [0, .55, .24], [1, 1, 1], [-90, 0, 0], { profile: [{ x: 0, y: 0 }, { x: .21, y: .06 }, { x: .34, y: .22 }, { x: .37, y: .36 }, { x: .3, y: .58 }, { x: .289, y: .58 }, { x: .359, y: .36 }, { x: .329, y: .22 }, { x: .201, y: .07 }, { x: 0, y: .012 }] }),
    part("围绕同一球心转动而不伸出外壳的独立内半球遮片", "lathe", material.ivory, [0, .55, -.12], [1, 1, 1], [-90, 0, -25], { profile: [{ x: 0, y: -.29 }, { x: .145, y: -.251 }, { x: .251, y: -.145 }, { x: .29, y: 0 }, { x: .282, y: 0 }, { x: .244, y: -.141 }, { x: .141, y: -.244 }, { x: 0, y: -.282 }] }),
    glow(ball("两层遮片内独立设置的中央光球", [0, .55, -.15], [.15, .15, .15], material.ivory)), ...[-1, 1].map(side => rod("与外罩横轴正交且不穿过光球的内罩竖向短轴", [0, .55 + side * .36, -.12], [0, .55 + side * .27, -.12], .014)),
    cord("从两侧球轴升起并合到吊点的完整外叉架", [[-.41, .55, -.12], [-.41, .98, -.12], [0, 1.05, -.12], [.41, .98, -.12], [.41, .55, -.12]], .016),
    ...[-1, 1].map(side => cylinder("外叉与球罩之间真正接合的横向俯仰轴套", [side * .385, .55, -.12], [.04, .11, .04], material.steel, [0, 0, 90])), ...suspension(1.45, [[0, 1.05, -.12]]),
  ] },
  { name: "插翼折脊纸鹤吊灯", theme: "现代", itemType: "灯具", build: () => {
    const top: Triple = [0, .43, .04], bottom: Triple = [0, .16, .04], ring: Triple[] = [[0, .29, -.14], [.12, .35, .04], [0, .31, .24], [-.12, .35, .04]], parts: ModelPart[] = [];
    for (let index = 0; index < 4; index++) parts.push(glow(clothPanel("沿折脊拼合而保持纸鹤胸腹立体的上折面", [ring[index]!, ring[(index + 1) % 4]!, top], material.ivory, .006)), glow(clothPanel("沿腹脊收合而不把鸟身贴成平面图标的下折面", [ring[index]!, bottom, ring[(index + 1) % 4]!], material.ivory, .006)));
    for (const side of [-1, 1]) parts.push(glow(clothPanel("从插翼根部向外上扬的宽三角主翼", [[side * .045, .32, -.05], [side * .49, .66, .08], [side * .045, .32, .13]], material.ivory, .006)), glow(clothPanel("沿主翼中脊折回并形成硬挺翼边的反折片", [[side * .49, .66, .08], [side * .43, .5, .15], [side * .045, .32, .13]], material.ivory, .006)));
    parts.push(glow(plate("向上折起并在颈端回折出尖喙的完整纸鹤长颈", [0, 0, 0], [[.1, .29], [.24, .7], [.4, .78], [.49, .62], [.38, .69], [.25, .32]], .035, material.ivory, [0, 90, 0])), glow(plate("从后胸实际折出的尖长纸尾", [0, 0, 0], [[-.17, .27], [-.49, .65], [-.31, .29]], .04, material.ivory, [0, 90, 0])), ...suspension(1.2, [[0, .43, .04]]));
    return parts;
  } },
  { name: "弹簧直落伸缩餐灯", theme: "现代", itemType: "灯具", build: () => [
    cylinder("独立承受拉伸弹簧的圆形天花接线座", [0, 1.4, 0], [.16, .045, .16], material.dark),
    cord("从天花到灯颈连续直落而没有配重滑轮的螺旋钢簧", Array.from({ length: 49 }, (_, index): Triple => { const a = index * Math.PI / 3; return [Math.cos(a) * .044, .75 + index / 48 * .62, Math.sin(a) * .044]; }), .004),
    ...[.75, 1.37].map(y => cylinder("把簧端锁回中心轴而不留下悬空端点的短圆头", [0, y, 0], [.1, .035, .1], material.steel)), cylinder("下端簧头穿过罩顶并接到内灯芯的真实灯颈", [0, .59, 0], [.034, .32, .034], material.dark),
    part("真实开口向下的深碗形餐桌反光罩", "lathe", material.ivory, [0, .31, 0], [1, 1, 1], [0, 0, 0], { profile: [{ x: 0, y: .16 }, { x: .13, y: .13 }, { x: .28, y: 0 }, { x: .28, y: -.02 }, { x: .27, y: -.02 }, { x: .12, y: .11 }, { x: 0, y: .14 }].reverse() }), glow(ball("反光罩内部独立的乳白灯泡", [0, .385, 0], [.1, .11, .1], material.ivory)),
    rod("从罩沿实际垂下的偏侧拉灯短绳", [.275, .302, 0], [.275, .09, 0], .003, material.dark), loop("能够用手抓住调节灯高的真实小拉环", [.275, .055, 0], .035, .006, [90, 0, 0], material.wood),
  ] },
  { name: "虹膜旋片聚合吊灯", theme: "现代", itemType: "灯具", build: () => {
    const parts: ModelPart[] = [part("承接可见光阑叶而保留中央口的完整锥环机架", "lathe", material.dark, [0, 0, 0], [1, 1, 1], [0, 0, 0], { profile: [{ x: .43, y: .07 }, { x: .36, y: .38 }, { x: .32, y: .38 }, { x: .2, y: .07 }, { x: .43, y: .07 }] }), glow(cylinder("安装在光阑上方并朝中央开口发光的独立光盘", [0, .36, 0], [.59, .015, .59], material.ivory)), ...suspension(1.07, [[0, .42, 0]]), cylinder("顶吊索到机架之间的短灯轴", [0, .395, 0], [.035, .075, .035], material.steel)];
    for (let index = 0; index < 8; index++) { const a = index * Math.PI / 4, y = .12 + index * .0018; parts.push(plate("逐片叠压并由外侧枢点带动的真实光阑叶", [0, y, 0], [[.12, .03], [.2, -.12], [.42, -.08], [.43, -.015], [.22, .04], [.1, .115]], .008, material.steel, [-90, 0, -index * 45]), cylinder("每片光阑叶独立连接锥环机架的外侧转轴", [Math.cos(a) * .35, y + .005, Math.sin(a) * .35], [.023, .04, .023], material.dark)); }
    for (let index = 0; index < 3; index++) { const a = index * Math.PI * 2 / 3; parts.push(rod("把光盘和灯轴真正接回锥环上口的短辐条", [0, .395, 0], [Math.cos(a) * .34, .37, Math.sin(a) * .34], .007)); }
    return parts;
  } },
  { name: "分节盘曲漫射软灯", theme: "现代", itemType: "灯具", build: () => {
    const points: Triple[] = [[-.54, .06, -.38], [-.61, .08, .02], [-.35, .13, .36], [.04, .2, .42], [.37, .16, .2], [.51, .1, -.09], [.42, .06, -.32]], parts: ModelPart[] = [];
    for (let index = 0; index < points.length; index++) {
      const point = points[index]!;
      parts.push(glow(ball("各软节之间实际闭合的圆端漫射连接头", point, [.12, .12, .12], material.ivory)));
      if (index) parts.push(glow(rod("有独立壳体而不以不同盘法增加主素材的长漫射软节", points[index - 1]!, point, .12, material.ivory)));
      if (index && index < points.length - 1) { const before = points[index - 1]!, after = points[index + 1]!, direction = new Vector3(...after).sub(new Vector3(...before)).normalize().multiplyScalar(.013); parts.push(rod("每个软节连接处可见的独立柔性锁套", [point[0] - direction.x, point[1] - direction.y, point[2] - direction.z], [point[0] + direction.x, point[1] + direction.y, point[2] + direction.z], .132, material.dark)); }
    }
    parts.push(box("在管末实际接通而能够着地的独立供电控制盒", [.62, .05, -.4], [.22, .1, .18], material.dark), rod("软灯末端到控制盒的真实短插接颈", points[points.length - 1]!, [.52, .05, -.4], .035), cylinder("控制盒上方可触及的独立调光旋钮", [.64, .108, -.4], [.045, .016, .045], material.steel));
    return parts;
  } },
];
