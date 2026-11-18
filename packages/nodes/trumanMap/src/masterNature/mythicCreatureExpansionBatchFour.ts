import { beam, combineMeshes, design, eyes, lobe, needle, part, tapered, type ModelPart, type Triple } from "./shared";
import { flightFeather } from "./mythicCreatureExpansionBatchOne";

const hide = "#b8bba6", mane = "#8c9a85", horn = "#c8c9b4", dark = "#57685b";

// 传统解剖概念来自以下馆藏释文；完整形体、骨架与场景尺度为本地原创。
// https://www.amnh.org/explore/ology/ology-cards/279-unicorn
// https://artmuseum.princeton.edu/art/stories-perspectives/collection-publications-centaurs-smile-fantastic-creatures
// https://www.getty.edu/publications/cva10/catalogue/19/
// https://www.miho.jp/booth/html/artcon/00001489e.htm

function unicorn(): ModelPart[] {
  const neck = tapered("独角兽从肩胸上举而前弯的完整长颈", hide, [[0, 1.6, .65], [0, 2.2, 1], [0, 2.55, 1.3]], [.31, .22, .16]);
  const parts: ModelPart[] = [lobe("独角兽纤长而连成的马形胸腹", hide, [0, 1.35, -.3], [1.1, 1.3, 2.7]), lobe("独角兽前胸与颈根的高肩", hide, [0, 1.65, .65], [1, 1.2, 1.3]), neck,
    lobe("独角兽具有长额面的完整头颅", hide, [0, 2.65, 1.4], [.52, .7, .9]), lobe("独角兽下垂而宽圆的吻部", hide, [0, 2.4, 1.8], [.45, .37, .55]), ...eyes([0, 2.72, 1.6], .18, .065),
    tapered("从额骨中央长出的单枚长角", horn, [[0, 2.91, 1.52], [0, 3.3, 1.75], [0, 3.7, 1.98], [0, 4.08, 2.2]], [.105, .07, .035, .005]),
    tapered("下颌中央向下垂落的山羊式颌须", mane, [[0, 2.29, 1.64], [0, 2.03, 1.7], [0, 1.91, 1.75]], [.11, .07, .008]),
    tapered("由臀部连出的细长狮式尾干", hide, [[0, 1.4, -1.35], [.45, 1.15, -1.85], [.65, .95, -2.35], [.58, .8, -2.7]], [.11, .08, .06, .04]),
    lobe("狮式尾干末端相连的浓密尾簇", mane, [.58, .76, -2.76], [.33, .46, .46])];
  const spiral: Triple[] = [];
  for (let index = 0; index < 25; index++) {
    const t = index / 24, a = t * Math.PI * 7, r = .106 * (1 - t) + .004;
    // 角轴在 YZ 平面，两个垂直基向量使螺纹始终贴合真实角面。
    spiral.push([Math.cos(a) * r, 2.91 + t * 1.17 - Math.sin(a) * r * .503, 1.52 + t * .68 + Math.sin(a) * r * .864]);
  }
  parts.push(tapered("沿单角表面连续缠绕的螺旋角脊", mane, spiral, spiral.map((_, index) => .012 * (1 - index / 27))));
  for (const side of [-1, 1]) {
    parts.push(tapered("独角兽前腿由肩肘连接球节", hide, [[side * .34, 1.45, .69], [side * .42, .8, .91], [side * .41, .21, .8]], [.15, .085, .055]),
      tapered("独角兽后腿带反折跗关节的连续骨架", hide, [[side * .35, 1.35, -1.08], [side * .48, .75, -1.37], [side * .47, .21, -.9]], [.21, .1, .055]),
      flightFeather("独角兽从头顶长出的尖长双耳", hide, [side * .16, 2.85, 1.21], [side * .27, 3.35, 1.16], .16));
    for (const z of [.85, -.85]) for (const toe of [-1, 1]) parts.push(part("独角兽每足实际分开的双瓣蹄", "box", dark, [side * (z > 0 ? .41 : .47) + toe * .07, .105, z], [.12, .21, .35]));
  }
  const back = Array.from({ length: 3 }, (_, index) => neck.vertices!.slice(index * 8, index * 8 + 8).reduce((a, b) => b.z < a.z ? b : a));
  for (let index = 0; index < 7; index++) {
    const t = index / 3, segment = Math.min(1, Math.floor(t)), f = t - segment, a = back[segment]!, b = back[segment + 1]!;
    const start: Triple = [a.x + (b.x - a.x) * f, a.y + (b.y - a.y) * f, a.z + (b.z - a.z) * f + .025];
    parts.push(flightFeather("独角兽沿真实颈后表面相连的短鬃", mane, start, [start[0], start[1] + .05, start[2] - .28], .19));
  }
  return parts;
}

function minotaur(): ModelPart[] {
  const skin = "#a4967b", cloth = "#788b7e";
  const parts: ModelPart[] = [lobe("牛头人穿短衣的完整人形胸腹", cloth, [0, 2.1, 0], [1.55, 1.9, .83]), lobe("人形骨盆与双腿连接的腰胯", cloth, [0, 1.55, 0], [1.16, .9, .8]),
    part("围住骨盆和大腿上部的短衣下摆", "lathe", cloth, [0, 0, 0], [1, 1, 1], [0, 0, 0], { profile: [{ x: .47, y: 1.9 }, { x: .62, y: 1.1 }, { x: .56, y: 1.1 }, { x: .41, y: 1.9 }, { x: .47, y: 1.9 }] }),
    tapered("肩部向上接到牛颅的粗颈", skin, [[0, 2.72, .01], [0, 3.12, .1]], [.29, .26]), lobe("具有宽额和双颞骨的完整牛首", skin, [0, 3.37, .18], [1.15, 1.15, 1.1]),
    lobe("牛首前方下垂的厚重长吻", skin, [0, 3.08, .71], [.8, .65, .95]), lobe("长吻前端宽阔的鼻盘", dark, [0, 2.99, 1.03], [.7, .34, .2]), ...eyes([0, 3.54, .44], .345, .09),
    beam("厚牛吻下方闭合的口线", dark, [-.28, 2.87, .96], [.28, 2.87, .96], .035)];
  for (const side of [-1, 1]) {
    parts.push(tapered("从牛额两侧横展并向上弯尖的完整角", horn, [[side * .4, 3.7, .05], [side * .85, 3.7, -.05], [side * 1.12, 3.9, .02], [side * 1.16, 4.26, .2]], [.16, .13, .08, .007]),
      flightFeather("牛颅两侧横向伸出的大耳", skin, [side * .43, 3.4, .02], [side * .94, 3.4, .16], .3),
      tapered("牛头人的人形大腿小腿与足踝", skin, [[side * .3, 1.5, 0], [side * .38, .83, .1], [side * .4, .18, .04]], [.24, .17, .105]), lobe("牛头人真正接地的完整人足", skin, [side * .4, .12, .27], [.44, .24, .75]),
      tapered("由人形肩带连至屈肘和腕部的双臂", skin, [[side * .57, 2.72, 0], [side * 1, 2.2, .16], [side * .93, 1.98, .58]], [.25, .18, .1]), lobe("与腕部连续相接的宽厚人掌", skin, [side * .93, 1.89, .64], [.36, .43, .23]));
    for (let digit = 0; digit < 4; digit++) parts.push(tapered("牛头人人掌前缘分开的弯指", skin, [[side * .93 + (digit - 1.5) * .074, 1.8, .67], [side * .93 + (digit - 1.5) * .08, 1.62, .72], [side * .93 + (digit - 1.5) * .08, 1.65, .81]], [.042, .032, .018]));
    parts.push(tapered("牛头人人掌侧面独立的拇指", skin, [[side * .78, 1.99, .65], [side * .65, 1.78, .83]], [.055, .025]));
    for (let toe = 0; toe < 5; toe++) parts.push(tapered("牛头人人足前方分离的足趾", skin, [[side * .4 + (toe - 2) * .064, .11, .48], [side * .4 + (toe - 2) * .064, .055, .7 - Math.abs(toe - 1) * .025]], [.043, .015]));
  }
  return parts;
}

function lernaeanHydra(): ModelPart[] {
  const scales = "#7c9686", jaw = "#adb6a1";
  const parts: ModelPart[] = [tapered("勒耳那九头蛇由长尾至共胸颈基的完整蛇躯", scales, [[-5, .55, -4.8], [-3, .7, -5.5], [.5, .8, -5], [2.7, 1, -3.2], [1.9, 1.35, -1.2], [0, 1.6, -.5]], [.025, .22, .55, .75, 1.1, 1.3]),
    lobe("九条蛇颈共同连接的膨大胸腹与颈基", scales, [0, 1.6, -.35], [3.2, 2.1, 2.8])];
  // 固定一次经典具名整体，不按头数生成或登记其他版本。
  const ends: Triple[] = [[-4.2, 3.7, .6], [-3.3, 5.2, 1], [-2.2, 6.4, .4], [-1.1, 5.6, 1.7], [0, 7, 1.1], [1.3, 5.7, 1.9], [2.3, 6.7, .5], [3.4, 5.3, 1.1], [4.3, 3.9, .6]];
  ends.forEach((end, index) => {
    const root: Triple = [(index - 4) * .2, 1.8, -.5 + index % 3 * .18];
    parts.push(tapered("从共同蛇胸内连续分出并昂起的长颈", scales, [root, [root[0] * 1.8, 2.6, root[2] + .1], [end[0] * .8, end[1] - .75, end[2] - .5], end], [.29, .26, .2, .14]),
      lobe("长颈末端完整而扁阔的蛇颅", scales, [end[0], end[1] + .08, end[2] + .2], [.64, .55, .95]), lobe("各蛇首前伸的独立上颌", scales, [end[0], end[1] - .03, end[2] + .62], [.53, .25, .55]),
      tapered("蛇首下方斜张而与颈部相接的下颌", jaw, [[end[0], end[1] - .15, end[2] + .06], [end[0], end[1] - .4, end[2] + .77]], [.17, .1]), ...eyes([end[0], end[1] + .2, end[2] + .337], .21, .075));
    parts.push(combineMeshes("单个蛇首内两枚向下弯出的长牙", horn, [-1, 1].map(side => needle("上颌向下延伸的弯牙", horn, [end[0] + side * .15, end[1] - .08, end[2] + .65], [end[0] + side * .13, end[1] - .34, end[2] + .7], .045))));
  });
  return parts;
}

function cerberus(): ModelPart[] {
  const coat = "#8a9281", muzzle = "#b4b8a1";
  const parts: ModelPart[] = [lobe("刻耳柏洛斯完整而深长的犬形胸腹", coat, [0, 1.9, -.3], [1.9, 2.4, 4.5]), lobe("同时承托三个颈根的宽阔犬胸肩带", coat, [0, 2.1, 1.2], [2.7, 2.5, 2]),
    tapered("犬形后躯连出的完整蛇形长尾", coat, [[0, 1.9, -2], [.3, 2.2, -3], [.8, 2.7, -3.7], [.6, 3.1, -3.65], [.6, 3.3, -3.4]], [.21, .18, .14, .1, .095]),
    lobe("蛇尾末端具有自己吻部的小蛇首", coat, [.6, 3.3, -3.28], [.3, .25, .6]), ...eyes([.6, 3.38, -3.2], .105, .038)];
  for (const side of [-1, 1]) {
    parts.push(tapered("犬形前肢由肩肘到腕部的连续承重腿", coat, [[side * .8, 1.9, 1.2], [side * .95, 1.05, .95], [side * .9, .25, 1.4]], [.27, .17, .1]),
      tapered("犬形后肢由粗股经反折跗关节落地", coat, [[side * .75, 1.9, -1.7], [side * 1, .95, -2], [side * .92, .25, -1.5]], [.35, .2, .1]),
      lobe("犬形前腿末端接地的宽厚足掌", coat, [side * .9, .15, 1.55], [.55, .3, .85]), lobe("犬形后腿末端接地的宽厚足掌", coat, [side * .92, .15, -1.35], [.55, .3, .85]));
  }
  const claws: ModelPart[] = [];
  for (const [x, z] of [[-.9, 1.55], [.9, 1.55], [-.92, -1.35], [.92, -1.35]]) for (let toe = 0; toe < 4; toe++) claws.push(needle("犬足前缘各自分开的硬爪", horn, [x! + (toe - 1.5) * .1, .12, z! + .22], [x! + (toe - 1.5) * .11, .055, z! + .44], .035));
  parts.push(combineMeshes("四只犬足上完整的分离爪列", horn, claws));
  const heads: Triple[] = [[-1.4, 3.2, 1.65], [0, 3.65, 1.95], [1.4, 3.3, 1.6]];
  heads.forEach((head, index) => {
    const yaw = (index - 1) * .35, angle = yaw * 180 / Math.PI;
    const point = ([x, y, z]: Triple): Triple => [head[0] + x * Math.cos(yaw) + z * Math.sin(yaw), head[1] + y, head[2] + z * Math.cos(yaw) - x * Math.sin(yaw)];
    parts.push(tapered("由同一肩胸真实分出的粗壮犬颈", coat, [[(index - 1) * .65, 2.5, .9], [head[0] * .75, head[1] - .35, head[2] - .25], head], [.42, .34, .24]),
      lobe("与犬颈相接且额部厚实的独立犬颅", coat, point([0, .12, .08]), [.95, 1, 1.25], [0, angle, 0]), lobe("完整犬首前伸的长吻与上颌", muzzle, point([0, -.1, .71]), [.7, .46, .95], [0, angle, 0]),
      lobe("长犬吻末端相连的深色鼻头", dark, point([0, -.06, 1.04]), [.45, .26, .22], [0, angle, 0]), tapered("张口犬首下面与颅底连续相接的下颌", coat, [point([0, -.24, .1]), point([0, -.47, .95])], [.22, .13]));
    for (const side of [-1, 1]) parts.push(lobe("犬首两侧按头部朝向安放的独立眼睛", dark, point([side * .3, .3, .34]), [.12, .12, .09], [0, angle, 0]),
      flightFeather("从犬首颞部向上伸出的长尖耳", coat, point([side * .25, .36, -.1]), point([side * .43, 1.01, -.15]), .3));
    parts.push(combineMeshes("犬首上颌内真实连接的两枚犬齿", horn, [-1, 1].map(side => needle("犬首向下伸入张口的长犬齿", horn, point([side * .22, -.18, .67]), point([side * .2, -.42, .73]), .055))));
  });
  return parts;
}

export const mythicCreatureExpansionBatchFourDesigns = [
  design("heraldicUnicorn", "独角兽", "动物", unicorn, ["Unicorn", "额生螺旋长角", "分蹄与颌须", "细长狮尾与尾簇"], "奇幻"),
  design("cretanMinotaur", "克里特牛头人", "动物", minotaur, ["Minotaur", "宽额弯角牛首", "完整人形胸腹与四肢", "人手与人足"], "奇幻"),
  design("lernaeanHydra", "勒耳那九头蛇", "动物", lernaeanHydra, ["Hydra", "海德拉", "九首蛇", "共胸颈基与九条蛇颈", "无足长蛇躯"], "奇幻"),
  design("underworldCerberus", "刻耳柏洛斯", "动物", cerberus, ["Cerberus", "三犬首与共胸肩带", "完整四足犬躯", "蛇尾"], "奇幻"),
];
