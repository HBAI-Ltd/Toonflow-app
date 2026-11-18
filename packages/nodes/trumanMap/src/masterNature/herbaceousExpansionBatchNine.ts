import { combineMeshes, design, lobe, needle, part, petals, tapered } from "./shared";
import type { MasterNatureDesign, ModelPart, Triple } from "./shared";
import { flatLeaf } from "./ediblePlants";
import { smallCorolla } from "./gardenPerennials";
import { radialBlade } from "./herbaceousExpansionBatchOne";
import { archedGrassBlade } from "./herbaceousExpansionBatchThree";

const green = "#82976e";
const pale = "#acb891";
const cream = "#d8d0b3";
const buff = "#bdb498";
const purple = "#a29ab2";

// 原创米制完整大株；学名用于物种检索，不用同株状态或花色增加主素材。
// https://www.rhs.org.uk/plants/10669/macleaya-cordata-willd-r-br-3/details
// https://www.rhs.org.uk/plants/3061/cardiocrinum-giganteum/details
// https://www.rhs.org.uk/plants/1665/aruncus-dioicus-m/details
// https://plantdatabase.kpu.ca/PlantPrint/kipa
// https://www.yarraranges.vic.gov.au/PlantDirectory/Lilies-Irises/Dianella-tasmanica
// https://plants.ces.ncsu.edu/plants/panicum-virgatum/
// https://efloras.org/florataxon.aspx?flora_id=1&taxon_id=109310

function plumePoppy(): ModelPart[] {
  const parts: ModelPart[] = [tapered("博落回直立粉绿而非木干的粗草秆", pale, [[0, 0, 0], [0, 2.42, 0]], [0.017, 0.002])], foliage: ModelPart[] = [], petioles: ModelPart[] = [];
  const scallops: [number, number][] = [[0, 0.08], [-0.16, -0.04], [-0.3, 0], [-0.35, 0.1], [-0.26, 0.17], [-0.47, 0.22], [-0.5, 0.34], [-0.43, 0.42], [-0.29, 0.42], [-0.45, 0.57], [-0.41, 0.71], [-0.3, 0.74], [-0.18, 0.64], [-0.15, 0.89], [0, 1], [0.15, 0.89], [0.18, 0.64], [0.3, 0.74], [0.41, 0.71], [0.45, 0.57], [0.29, 0.42], [0.43, 0.42], [0.5, 0.34], [0.47, 0.22], [0.26, 0.17], [0.35, 0.1], [0.3, 0], [0.16, -0.04]];
  for (let i = 0; i < 10; i++) {
    const a = i * 2.4, y = 0.14 + i * 0.158, length = 0.27 - i * 0.009, root: Triple = [Math.cos(a) * 0.09, y + 0.035, Math.sin(a) * 0.09];
    petioles.push(needle("博落回互生圆裂叶的长独立叶柄", pale, [0, y, 0], root, 0.003));
    foliage.push(flatLeaf("博落回心形基部与七个圆钝重裂片的大叶", root, [root[0] + Math.cos(a) * length, root[1] + 0.035, root[2] + Math.sin(a) * length], length * 0.95, scallops, 0.0011));
  }
  parts.push(combineMeshes("博落回沿主秆互生的完整长叶柄组", pale, petioles));
  for (let i = 0; i < foliage.length; i += 8) parts.push(combineMeshes("博落回完整圆钝重裂的粉绿大叶", "#8b9e87", foliage.slice(i, i + 8)));
  for (let branch = 0; branch < 10; branch++) {
    const a = branch * 2.4, y = 1.56 + branch * 0.077, reach = 0.35 * (1 - branch / 13), tip: Triple = [Math.cos(a) * reach, y + 0.14, Math.sin(a) * reach], flowers: ModelPart[] = [], heads: ModelPart[] = [];
    parts.push(tapered("博落回花穗里可见的开放细分枝", buff, [[0, y, 0], tip], [0.0025, 0.0006]));
    for (let flower = 0; flower < 5; flower++) {
      const t = 0.24 + flower * 0.18, b = a + (flower % 2 ? 1.1 : -1.1), base: Triple = [tip[0] * t, y + 0.14 * t, tip[2] * t], p: Triple = [base[0] + Math.cos(b) * 0.012, base[1] - 0.006, base[2] + Math.sin(b) * 0.012], stamens: ModelPart[] = [lobe("博落回无花瓣小花中央的小子房", buff, p, [0.0018, 0.0025, 0.0018])];
      flowers.push(needle("博落回下垂无瓣小花的细短梗", buff, base, p, 0.00045));
      for (let stamen = 0; stamen < 24; stamen++) { const c = stamen * 2.4, r = 0.002 + stamen % 3 * 0.0004; stamens.push(needle("博落回无花瓣而由二十四枚长雄蕊形成的细花轮廓", cream, p, [p[0] + Math.cos(c) * r, p[1] - 0.0038 - stamen % 2 * 0.001, p[2] + Math.sin(c) * r], 0.0003)); }
      heads.push(combineMeshes("博落回真实无瓣而具多根细蕊的一朵垂花", cream, stamens));
    }
    parts.push(combineMeshes("博落回一条小花枝的相连短花梗", buff, flowers));
    for (let i = 0; i < heads.length; i += 3) parts.push(combineMeshes("博落回分枝上完整无瓣多蕊垂花组", cream, heads.slice(i, i + 3)));
  }
  return parts;
}

function giantHimalayanLily(): ModelPart[] {
  const parts: ModelPart[] = [tapered("大百合从基部大鳞茎抽出的粗直花茎", pale, [[0, 0, 0], [0, 2.24, 0]], [0.028, 0.006])];
  for (let leaf = 0; leaf < 9; leaf++) {
    const a = leaf * 2.4, y = leaf < 5 ? 0.04 + leaf * 0.038 : 0.43 + (leaf - 5) * 0.25, length = leaf < 5 ? 0.3 : 0.23 - (leaf - 5) * 0.026, root: Triple = [Math.cos(a) * (leaf < 5 ? 0.1 : 0.035), y + 0.035, Math.sin(a) * (leaf < 5 ? 0.1 : 0.035)];
    parts.push(tapered("大百合心形叶片的单独粗叶柄", pale, [[0, y, 0], root], [0.004, 0.002]), flatLeaf("大百合区别于狭叶百合的宽心形叶", root, [root[0] + Math.cos(a) * length, root[1] + 0.055, root[2] + Math.sin(a) * length], length * 0.84, "heart", 0.0012));
  }
  for (let flower = 0; flower < 8; flower++) {
    const a = flower * 2.4, y = 1.52 + flower * 0.087, root: Triple = [Math.cos(a) * 0.055, y + 0.015, Math.sin(a) * 0.055], direction: Triple = [Math.cos(a), -0.21, Math.sin(a)], axis = Math.hypot(...direction), pieces: ModelPart[] = [];
    parts.push(tapered("大百合顶生总状花序上互生的独立短花柄", pale, [[0, y, 0], root], [0.004, 0.002]), smallCorolla(root, direction, 0.155, 0.026, cream, false, 6));
    for (let stamen = 0; stamen < 6; stamen++) { const b = stamen * Math.PI / 3, base: Triple = [root[0] + direction[0] / axis * 0.08, root[1] + direction[1] / axis * 0.08, root[2] + direction[2] / axis * 0.08], tip: Triple = [root[0] + direction[0] / axis * 0.158 - Math.sin(a) * Math.cos(b) * 0.01, root[1] + direction[1] / axis * 0.158 + Math.sin(b) * 0.01, root[2] + direction[2] / axis * 0.158 + Math.cos(a) * Math.cos(b) * 0.01]; pieces.push(needle("大百合六枚沿真实长花喉伸出的雄蕊", pale, base, tip, 0.0009), lobe("大百合长雄蕊末端独立花药", buff, tip, [0.0025, 0.006, 0.0025])); }
    parts.push(combineMeshes("大百合六被长喇叭花内真实分离的花蕊", buff, pieces));
  }
  return parts;
}

function goatsBeard(): ModelPart[] {
  const parts: ModelPart[] = [tapered("假升麻由根茎抽出的高大直立草茎", pale, [[0, 0, 0], [0, 1.86, 0]], [0.012, 0.002])];
  const teeth: [number, number][] = [[0, 0], [-0.23, 0.14], [-0.45, 0.32], [-0.35, 0.36], [-0.5, 0.53], [-0.35, 0.56], [-0.29, 0.79], [-0.18, 0.79], [0, 1], [0.18, 0.79], [0.29, 0.79], [0.35, 0.56], [0.5, 0.53], [0.35, 0.36], [0.45, 0.32], [0.23, 0.14]];
  for (let leaf = 0; leaf < 6; leaf++) {
    const a = leaf * 2.4, y = 0.1 + leaf * 0.17, tip: Triple = [Math.cos(a) * 0.29, y + 0.09, Math.sin(a) * 0.29], pieces: ModelPart[] = [needle("假升麻二回羽状大复叶的主叶柄", pale, [0, y, 0], tip, 0.0028)];
    for (let branch = 0; branch < 3; branch++) {
      const t = 0.3 + branch * 0.26, base: Triple = [tip[0] * t, y + 0.09 * t, tip[2] * t];
      for (const side of [-1, 1]) { const b = a + side * 1.15, end: Triple = [base[0] + Math.cos(b) * 0.11, base[1] + 0.018, base[2] + Math.sin(b) * 0.11]; pieces.push(needle("假升麻主叶轴上分出的次级羽轴", pale, base, end, 0.0013)); for (const edge of [-1, 1]) { const p: Triple = [base[0] + (end[0] - base[0]) * 0.47, base[1] + 0.0085, base[2] + (end[2] - base[2]) * 0.47], c = b + edge * 0.95; pieces.push(flatLeaf("假升麻次级羽轴两侧的粗锯齿小叶", p, [p[0] + Math.cos(c) * 0.065, p[1] + 0.012, p[2] + Math.sin(c) * 0.065], 0.033, teeth, 0.0007)); } pieces.push(flatLeaf("假升麻每条次级羽轴的尖卵形顶小叶", end, [end[0] + Math.cos(b) * 0.071, end[1] + 0.016, end[2] + Math.sin(b) * 0.071], 0.039, teeth, 0.0007)); }
    }
    pieces.push(flatLeaf("假升麻二回羽叶共同主轴远端的顶生小叶", tip, [tip[0] + Math.cos(a) * 0.085, tip[1] + 0.017, tip[2] + Math.sin(a) * 0.085], 0.044, teeth, 0.0007));
    for (let i = 0; i < pieces.length; i += 9) parts.push(combineMeshes("假升麻同一叶柄上相连的二级锯齿羽叶", green, pieces.slice(i, i + 9)));
  }
  for (let branch = 0; branch < 8; branch++) {
    const a = branch * 2.4, base: Triple = [0, 1.2 + branch * 0.068, 0], elbow: Triple = [Math.cos(a) * 0.2, base[1] + 0.18, Math.sin(a) * 0.2], tip: Triple = [Math.cos(a) * 0.34, base[1] + 0.24, Math.sin(a) * 0.34], flowers: ModelPart[] = [];
    parts.push(tapered("假升麻在顶部分枝并轻弧垂的长穗花轴", buff, [base, elbow, tip], [0.0028, 0.0014, 0.0005]));
    for (let flower = 0; flower < 9; flower++) {
      const t = 0.12 + flower * 0.105, turn = 0.2 / 0.34, y = t <= turn ? base[1] + 0.18 * t / turn : elbow[1] + 0.06 * (t - turn) / (1 - turn), p: Triple = [Math.cos(a) * 0.34 * t, y, Math.sin(a) * 0.34 * t], pieces: ModelPart[] = [petals(5, p, 0.0015, 0.0028, 73, cream)];
      for (let stamen = 0; stamen < 12; stamen++) { const b = stamen * Math.PI / 6; pieces.push(needle("假升麻小雄花花被外伸出的分离细雄蕊", cream, p, [p[0] + Math.cos(b) * 0.004, p[1] + 0.003, p[2] + Math.sin(b) * 0.004], 0.00025)); }
      flowers.push(combineMeshes("假升麻开放穗上五小瓣与外露细蕊的独立小花", cream, pieces));
    }
    for (let i = 0; i < flowers.length; i += 4) parts.push(combineMeshes("假升麻花瓣和雄蕊均保持分离的完整穗花段", cream, flowers.slice(i, i + 4)));
  }
  return parts;
}

function japaneseKnotweed(): ModelPart[] {
  const parts: ModelPart[] = [part("虎杖有真实中空内腔的竹节状草质主秆", "lathe", pale, [0, 0, 0], [1, 1, 1], [0, 0, 0], { profile: [{ x: 0.018, y: 0 }, { x: 0.009, y: 2.12 }, { x: 0.006, y: 2.12 }, { x: 0.014, y: 0 }, { x: 0.018, y: 0 }] })];
  const truncate: [number, number][] = [[-0.32, 0], [-0.48, 0.15], [-0.5, 0.46], [-0.34, 0.72], [0, 1], [0.34, 0.72], [0.5, 0.46], [0.48, 0.15], [0.32, 0]];
  for (let node = 0; node < 8; node++) {
    const a = node * 2.4, y = 0.3 + node * 0.218, radius = 0.018 - y * 0.0041, root: Triple = [0, y, 0], elbow: Triple = [Math.cos(a) * 0.18, y + 0.05, Math.sin(a) * 0.18], tip: Triple = [elbow[0] + Math.cos(a + 0.28) * 0.19, y + 0.11, elbow[2] + Math.sin(a + 0.28) * 0.19];
    parts.push(part("虎杖主秆外实际膨大的节环", "lathe", "#ac9f87", [0, y, 0], [1, 1, 1], [0, 0, 0], { profile: [{ x: radius, y: -0.006 }, { x: radius + 0.002, y: -0.004 }, { x: radius + 0.002, y: 0.004 }, { x: radius, y: 0.006 }, { x: radius, y: -0.006 }] }), tapered("虎杖节上展开的细锯折侧枝", pale, [root, elbow, tip], [0.0045, 0.003, 0.001]));
    for (let leaf = 0; leaf < 3; leaf++) {
      const t = 0.25 + leaf * 0.33, base: Triple = t <= 0.49 ? [elbow[0] * t / 0.49, y + 0.05 * t / 0.49, elbow[2] * t / 0.49] : [elbow[0] + (tip[0] - elbow[0]) * (t - 0.49) / 0.51, elbow[1] + (tip[1] - elbow[1]) * (t - 0.49) / 0.51, elbow[2] + (tip[2] - elbow[2]) * (t - 0.49) / 0.51], b = a + (leaf % 2 ? 1.1 : -1.1), p: Triple = [base[0] + Math.cos(b) * 0.028, base[1] + 0.011, base[2] + Math.sin(b) * 0.028];
      parts.push(needle("虎杖枝上交错互生叶的短独立叶柄", pale, base, p, 0.0016), flatLeaf("虎杖平截叶基且顶端突然尖出的宽卵叶", p, [p[0] + Math.cos(b) * 0.16, p[1] + 0.027, p[2] + Math.sin(b) * 0.16], 0.12, truncate, 0.0008));
    }
    if (node < 3) continue;
    const flowers: ModelPart[] = [];
    for (let branch = 0; branch < 3; branch++) {
      const b = a + branch * 0.5 - 0.5, end: Triple = [elbow[0] + Math.cos(b) * 0.09, elbow[1] + 0.075 - branch * 0.018, elbow[2] + Math.sin(b) * 0.09];
      flowers.push(needle("虎杖叶腋抽出的短分枝花序轴", cream, elbow, end, 0.001));
      for (let floret = 0; floret < 6; floret++) { const t = 0.2 + floret * 0.15, p: Triple = [elbow[0] + (end[0] - elbow[0]) * t, elbow[1] + (end[1] - elbow[1]) * t, elbow[2] + (end[2] - elbow[2]) * t]; flowers.push(petals(5, p, 0.0017, 0.003, 70, cream)); }
    }
    for (let i = 0; i < flowers.length; i += 8) parts.push(combineMeshes("虎杖宽叶腋里真正分枝的五被小白花簇", cream, flowers.slice(i, i + 8)));
  }
  return parts;
}

function yellowWaxbells(): ModelPart[] {
  const parts: ModelPart[] = [];
  for (let shoot = 0; shoot < 3; shoot++) {
    const a = shoot * 2.4, root: Triple = [Math.cos(a) * 0.08, 0, Math.sin(a) * 0.08], tip: Triple = [Math.cos(a) * 0.2, 1.02 + shoot * 0.055, Math.sin(a) * 0.2], foliage: ModelPart[] = [], petioles: ModelPart[] = [];
    parts.push(tapered("黄山梅略弧伸且有紫色表皮的草质茎", "#a39789", [root, tip], [0.007, 0.002]));
    for (let node = 0; node < 4; node++) for (const side of [-1, 1]) {
      const t = 0.16 + node * 0.185, base: Triple = root.map((v, axis) => v + (tip[axis]! - v) * t) as Triple, b = a + side * Math.PI / 2, p: Triple = [base[0] + Math.cos(b) * 0.028, base[1] + 0.006, base[2] + Math.sin(b) * 0.028], length = 0.18 - node * 0.019;
      petioles.push(needle("黄山梅同一茎节两枚对生叶的短柄", pale, base, p, 0.0018));
      foliage.push(flatLeaf("黄山梅真实对生的五至七裂枫状大叶", p, [p[0] + Math.cos(b) * length, p[1] + 0.025, p[2] + Math.sin(b) * length], length * 1.05, "palm", 0.0008));
    }
    parts.push(combineMeshes("黄山梅真实成对并逐节展开的枫状叶组", green, foliage), combineMeshes("黄山梅同节两叶的全部独立短柄", pale, petioles));
    for (let cluster = 0; cluster < 2; cluster++) {
      const base: Triple = [root[0] + (tip[0] - root[0]) * (0.82 + cluster * 0.12), tip[1] * (0.82 + cluster * 0.12), root[2] + (tip[2] - root[2]) * (0.82 + cluster * 0.12)];
      for (let flower = 0; flower < 3; flower++) { const b = a + (flower - 1) * 0.75, elbow: Triple = [base[0] + Math.cos(b) * 0.054, base[1] + 0.044, base[2] + Math.sin(b) * 0.054], p: Triple = [elbow[0] + Math.cos(b) * 0.013, elbow[1] - 0.022, elbow[2] + Math.sin(b) * 0.013]; parts.push(tapered("黄山梅三出聚伞花序末端弯垂的细花梗", pale, [base, elbow, p], [0.0016, 0.0011, 0.0007]), smallCorolla(p, [Math.cos(b) * 0.22, -1, Math.sin(b) * 0.22], 0.035, 0.007, "#cfc795")); }
    }
  }
  return parts;
}

function tasmanFlaxLily(): ModelPart[] {
  const parts: ModelPart[] = [tapered("山菅兰连起叶扇的短横生粗根茎", buff, [[-0.12, 0.01, 0], [0, 0.01, 0.02], [0.12, 0.01, 0]], [0.012, 0.018, 0.01])];
  for (let shoot = 0; shoot < 3; shoot++) {
    const x = (shoot - 1) * 0.12;
    for (let leaf = 0; leaf < 7; leaf++) {
      const b = (leaf % 2 ? 180 : 0) + shoot * 31, value = archedGrassBlade("塔斯马尼亚山菅兰两列套叠并弧展的宽带叶", [x, 0.017, 0], b, 0.36 + leaf % 3 * 0.065, 0.034, 0.62 + leaf % 3 * 0.09);
      parts.push(value);
    }
    const top: Triple = [x + 0.015, 1.16 + shoot * 0.045, 0];
    parts.push(tapered("山菅兰高出叶扇而多分枝的细花茎", pale, [[x, 0.01, 0], top], [0.004, 0.0012]));
    for (let branch = 0; branch < 4; branch++) {
      const a = branch * 2.4 + shoot, base: Triple = [x + 0.015 * (0.7 + branch * 0.075), top[1] * (0.7 + branch * 0.075), 0], hub: Triple = [base[0] + Math.cos(a) * 0.13, base[1] + 0.047, Math.sin(a) * 0.13], pieces: ModelPart[] = [needle("山菅兰圆锥花序的长细侧枝", pale, base, hub, 0.0012)], flowers: ModelPart[] = [], stamens: ModelPart[] = [], fruit: ModelPart[] = [];
      for (let flower = 0; flower < 3; flower++) {
        const b = a + (flower - 1) * 0.7, p: Triple = [hub[0] + Math.cos(b) * 0.025, hub[1] - 0.014, hub[2] + Math.sin(b) * 0.025];
        pieces.push(needle("山菅兰垂向单花或浆果的短梗", pale, hub, p, 0.0007));
        if (branch === 0) { fruit.push(lobe("山菅兰约一厘米而非葡萄大小的圆蓝浆果", "#929db8", p, [0.01, 0.011, 0.01])); continue; }
        flowers.push(petals(6, p, 0.0026, 0.005, 119, purple));
        for (let stamen = 0; stamen < 6; stamen++) { const c = stamen * Math.PI / 3, end: Triple = [p[0] + Math.cos(c) * 0.0021, p[1] - 0.0042, p[2] + Math.sin(c) * 0.0021]; stamens.push(lobe("山菅兰花中央显著膨大的黄花丝", "#cbbd84", [end[0], end[1] + 0.0016, end[2]], [0.0018, 0.0032, 0.0018]), lobe("山菅兰短于膨大花丝的独立黄花药", "#cbbd84", end, [0.0015, 0.0016, 0.0015])); }
      }
      parts.push(combineMeshes("山菅兰小蓝花或小蓝果相连的绿细侧序", pale, pieces));
      if (fruit.length) parts.push(combineMeshes("山菅兰真实厘米大小的圆蓝浆果", "#929db8", fruit));
      if (flowers.length) parts.push(combineMeshes("山菅兰六花被片后折的小蓝花", purple, flowers), combineMeshes("山菅兰蓝花中央完整独立的膨大黄色花丝和短花药", "#cbbd84", stamens));
    }
  }
  return parts;
}

function guineaGrass(): ModelPart[] {
  const parts: ModelPart[] = [tapered("大黍连起直立秆丛的短根茎", buff, [[-0.055, 0.008, 0], [0.055, 0.008, 0]], [0.012, 0.01])];
  for (let shoot = 0; shoot < 3; shoot++) {
    const a = shoot * 2.4, x = Math.cos(a) * 0.048, z = Math.sin(a) * 0.048, height = 2.18 + shoot * 0.12;
    parts.push(tapered("大黍有叶鞘包覆的高直立草秆", pale, [[x, 0, z], [x, height, z]], [0.0075, 0.0011]));
    for (let node = 0; node < 6; node++) { const b = a + node * Math.PI, y = 0.1 + node * 0.244; parts.push(archedGrassBlade("大黍从节上两列开展且有白中脉的长叶", [x, y, z], b * 180 / Math.PI, 0.68 - node * 0.045, 0.034 - node * 0.002, 0.26)); }
    for (let branch = 0; branch < 10; branch++) {
      const b = branch < 5 ? branch * Math.PI * 0.4 + a : branch * 2.4, y = height - (branch < 5 ? 0.5 : 0.46 - (branch - 5) * 0.08), span = branch < 5 ? 0.24 : 0.22 - (branch - 5) * 0.032, end: Triple = [x + Math.cos(b) * span, y + 0.1, z + Math.sin(b) * span], pieces: ModelPart[] = [needle("大黍下部真轮生上部逐渐缩短的圆锥花序枝", buff, [x, y, z], end, 0.001)];
      for (let twig = 0; twig < 5; twig++) {
        const t = 0.24 + twig * 0.18, base: Triple = [x + (end[0] - x) * t, y + 0.1 * t, z + (end[2] - z) * t], c = b + (twig % 2 ? 0.8 : -0.8), tip: Triple = [base[0] + Math.cos(c) * 0.026, base[1] + 0.028, base[2] + Math.sin(c) * 0.026];
        pieces.push(needle("大黍大开放花序中承托单小穗的细二级梗", buff, base, tip, 0.0005), lobe("大黍真实三至四毫米而非粮粒大小的椭圆小穗", buff, tip, [0.0018, 0.004, 0.0018]));
      }
      parts.push(combineMeshes("大黍大开放花序的一条有梗小穗枝", buff, pieces));
    }
  }
  return parts;
}

function switchgrass(): ModelPart[] {
  const parts: ModelPart[] = [];
  for (let shoot = 0; shoot < 4; shoot++) {
    const a = shoot * 2.4, x = Math.cos(a) * 0.058, z = Math.sin(a) * 0.058, top = 1.82 + shoot % 3 * 0.09;
    parts.push(tapered("柳枝稷构成紧直柱形叶丛的细硬秆", pale, [[x, 0, z], [x, top, z]], [0.004, 0.0008]));
    for (let node = 0; node < 6; node++) { const value = archedGrassBlade("柳枝稷沿细秆两列外弧的窄叶", [x, 0.06 + node * 0.18, z], (a + node * Math.PI) * 180 / Math.PI, 0.28 + node % 2 * 0.05, 0.014, 0.32); value.color = "#849b8b"; parts.push(value); }
    for (let branch = 0; branch < 7; branch++) {
      const b = branch * 2.4 + a, y = top - 0.42 + branch * 0.052, reach = 0.21 - branch * 0.019, tip: Triple = [x + Math.cos(b) * reach, y + 0.13 - branch * 0.009, z + Math.sin(b) * reach], pieces: ModelPart[] = [needle("柳枝稷细如云雾而不是密羽毛的开放花序枝", buff, [x, y, z], tip, 0.00065)];
      for (let twig = 0; twig < 4; twig++) {
        const t = 0.25 + twig * 0.23, base: Triple = [x + (tip[0] - x) * t, y + (tip[1] - y) * t, z + (tip[2] - z) * t], c = b + (twig % 2 ? 1 : -1), end: Triple = [base[0] + Math.cos(c) * 0.025, base[1] + 0.026, base[2] + Math.sin(c) * 0.025];
        pieces.push(needle("柳枝稷细分叉尖端真正相连的小穗柄", buff, base, end, 0.00032), lobe("柳枝稷约三毫米长的泪滴形小穗", "#b3a7a6", end, [0.0016, 0.0032, 0.0016]));
      }
      parts.push(combineMeshes("柳枝稷具细梗和分离泪滴小穗的单枝疏花序", buff, pieces));
    }
  }
  return parts;
}

function umbrellaPlant(): ModelPart[] {
  const parts: ModelPart[] = [tapered("盾叶草沿地表慢生的粗短根茎", buff, [[-0.08, 0.016, 0], [0.08, 0.016, 0.015]], [0.026, 0.022])];
  // ACT: 夏季完整叶株不强行混入先花后叶的春季裸花葶，季节变化不另计主。
  for (let leaf = 0; leaf < 6; leaf++) {
    const a = leaf * 2.4, centre: Triple = [Math.cos(a) * (0.28 + leaf % 2 * 0.06), 0.72 + leaf % 3 * 0.13, Math.sin(a) * (0.28 + leaf % 2 * 0.06)], radius = 0.225 + leaf % 2 * 0.025, count = 42, vertices: { x: number; y: number; z: number }[] = [], indices: number[] = [];
    parts.push(tapered("盾叶草确实接到叶盘中央下方而非叶缘的长柄", pale, [[Math.cos(a) * 0.04, 0.016, Math.sin(a) * 0.04], centre], [0.009, 0.005]));
    for (const side of [0, 1]) {
      vertices.push({ x: 0, y: side * 0.0013, z: 0 });
      for (let ring = 0; ring < 2; ring++) for (let point = 0; point < count; point++) { const b = point * Math.PI * 2 / count, scallop = 0.89 + Math.cos(b * 7) * 0.11, r = radius * (ring ? scallop * (point % 2 ? 0.97 : 1) : 0.48); vertices.push({ x: Math.cos(b) * r, y: (ring ? 0.053 + Math.cos(b * 7) * 0.011 : 0.01) + side * 0.0013, z: Math.sin(b) * r }); }
    }
    const layer = 1 + count * 2;
    for (let point = 0; point < count; point++) {
      const next = (point + 1) % count, i = 1 + point, j = 1 + next;
      indices.push(0, i, j, layer, layer + j, layer + i, i, i + count, j, j, i + count, j + count, layer + i, layer + j, layer + i + count, layer + j, layer + j + count, layer + i + count, i + count, layer + i + count, j + count, j + count, layer + i + count, layer + j + count);
    }
    parts.push(part("盾叶草真实中央下凹且具七裂细齿缘的完整杯叶", "mesh", green, centre, [1, 1, 1], [0, 0, 0], { vertices, indices }));
  }
  return parts;
}

function palmateRhubarb(): ModelPart[] {
  const parts: ModelPart[] = [tapered("掌叶大黄从粗根茎抽出的真实高大花秆", "#a89c85", [[0, 0, 0], [0, 2.15, 0]], [0.035, 0.004])];
  for (let leaf = 0; leaf < 7; leaf++) {
    const a = leaf * 2.4, y = leaf < 5 ? 0.35 + leaf % 3 * 0.08 : 0.85 + (leaf - 5) * 0.3, reach = leaf < 5 ? 0.29 : 0.12, root: Triple = [Math.cos(a) * reach, y, Math.sin(a) * reach], length = leaf < 5 ? 0.59 : 0.34 - (leaf - 5) * 0.07;
    parts.push(tapered("掌叶大黄叶盘前真实粗长而带红褐色的独立叶柄", "#b19d8b", [[0, leaf < 5 ? 0.02 : y - 0.07, 0], root], [leaf < 5 ? 0.016 : 0.01, 0.007]), flatLeaf("掌叶大黄长达半米且掌状深裂的大型宽叶", root, [root[0] + Math.cos(a) * length, root[1] + 0.12, root[2] + Math.sin(a) * length], length * 1.17, "palm", 0.002));
  }
  for (let branch = 0; branch < 13; branch++) {
    const a = branch * 2.4, y = 1.23 + branch * 0.062, reach = 0.28 * (1 - branch / 16), end: Triple = [Math.cos(a) * reach, y + 0.11, Math.sin(a) * reach], pieces: ModelPart[] = [needle("掌叶大黄高秆上分出的开放圆锥花序一级枝", buff, [0, y, 0], end, 0.0018)];
    for (let twig = 0; twig < 4; twig++) {
      const t = 0.27 + twig * 0.23, base: Triple = [end[0] * t, y + 0.11 * t, end[2] * t], b = a + (twig % 2 ? 0.8 : -0.8), tip: Triple = [base[0] + Math.cos(b) * 0.036, base[1] + 0.04, base[2] + Math.sin(b) * 0.036];
      pieces.push(needle("掌叶大黄花序的短二级分枝", buff, base, tip, 0.0007));
      for (let flower = 0; flower < 3; flower++) { const u = 0.35 + flower * 0.31, p: Triple = [base[0] + (tip[0] - base[0]) * u, base[1] + (tip[1] - base[1]) * u, base[2] + (tip[2] - base[2]) * u]; pieces.push(petals(6, p, 0.0015, 0.0027, 72, cream)); }
    }
    for (let i = 0; i < pieces.length; i += 6) parts.push(combineMeshes("掌叶大黄枝梗上相连且具六花被片的小花簇", cream, pieces.slice(i, i + 6)));
  }
  return parts;
}

export const herbaceousExpansionBatchNineDesigns: MasterNatureDesign[] = [
  design("plumePoppyPlant", "博落回", "植物", plumePoppy, ["Macleaya cordata", "互生圆钝重裂叶和无瓣多雄蕊的高开放穗"]),
  design("giantHimalayanLilyPlant", "大百合", "植物", giantHimalayanLily, ["Cardiocrinum giganteum", "粗高草秆宽心形叶与横向六裂长喇叭花"]),
  design("goatsBeardPlant", "假升麻", "植物", goatsBeard, ["Aruncus dioicus", "二回粗齿羽叶和顶生疏细多蕊乳白弧穗"]),
  design("japaneseKnotweedPlant", "虎杖", "植物", japaneseKnotweed, ["Reynoutria japonica", "Fallopia japonica", "Polygonum cuspidatum", "中空膨节秆截基卵叶与腋生白色小分枝花序"]),
  design("yellowWaxbellsPlant", "黄山梅", "植物", yellowWaxbells, ["Kirengeshoma palmata", "对生枫状裂叶与三出聚伞下垂蜡质窄钟花"]),
  design("tasmanFlaxLilyPlant", "塔斯马尼亚山菅兰", "植物", tasmanFlaxLily, ["Dianella tasmanica", "两列套叠带叶小蓝六被花和膨大黄色花丝"]),
  design("guineaGrassPlant", "大黍", "植物", guineaGrass, ["Megathyrsus maximus", "Panicum maximum", "Urochloa maxima", "宽长叶与基部轮生分枝的大开放毫米小穗序"]),
  design("switchgrassPlant", "柳枝稷", "植物", switchgrass, ["Panicum virgatum", "紧直细秆蓝绿窄叶与云雾般疏细分枝小穗"]),
  design("darmeraUmbrellaPlant", "盾叶草", "植物", umbrellaPlant, ["Darmera peltata", "Peltiphyllum peltatum", "中央接柄并明显下凹的七裂细齿杯状盾叶"]),
  design("palmateRhubarbPlant", "掌叶大黄", "植物", palmateRhubarb, ["Rheum palmatum", "粗红长叶柄掌状巨裂叶与高秆开放六被小花序"]),
];
