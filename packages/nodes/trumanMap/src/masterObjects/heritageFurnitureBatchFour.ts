import { Euler, Quaternion, Vector3 } from "three";
import { part, type ModelPart, type Triple } from "../assetModelParts";
import { polygon, tapered } from "../masterNature/shared";
import { lobe, combineMeshes } from "../natureParts";
import { box, cylinder, rod, cord, plate, loop, ball, cone, cup, piercedPanel, cog, material, type MasterPrototype } from "./parts";

// 只参考完整器物的装配类型，几何为本地原创，不使用远端模型或照片。
// https://www.indiancarrom.co.in/laws-of-carrom/
// https://worldcrokinole.com/thegame.html
// https://www.berlin.museum/en/article/the-kaiserpanorama
// https://library.si.edu/image-gallery/100072

function moveParts(parts: ModelPart[], rotation: Triple, offset: Triple): ModelPart[] {
  const turn = new Quaternion().setFromEuler(new Euler(...rotation.map(value => value * Math.PI / 180) as Triple));
  for (const value of parts) {
    const position = new Vector3(value.position.x, value.position.y, value.position.z).applyQuaternion(turn);
    value.position = { x: position.x + offset[0], y: position.y + offset[1], z: position.z + offset[2] };
    const local = new Quaternion().setFromEuler(new Euler(value.rotation.x * Math.PI / 180, value.rotation.y * Math.PI / 180, value.rotation.z * Math.PI / 180));
    const facing = new Euler().setFromQuaternion(turn.clone().multiply(local));
    value.rotation = { x: facing.x * 180 / Math.PI, y: facing.y * 180 / Math.PI, z: facing.z * 180 / Math.PI };
  }
  return parts;
}

function bookGear(name: string, position: Triple, teeth: number): ModelPart {
  const pitchRadius = teeth * .01625;
  const outline = Array.from({ length: teeth * 4 }, (_, index): [number, number] => {
    const angle = index * Math.PI / (teeth * 2), radius = pitchRadius + (index % 4 === 1 || index % 4 === 2 ? .013 : -.018);
    return [Math.cos(angle) * radius, Math.sin(angle) * radius];
  });
  const gear = polygon(name, material.wood, outline, .018, position);
  gear.rotation.z = 90;
  return gear;
}

function clockDial(name: string, position: Triple, radius: number): ModelPart[] {
  const marks = Array.from({ length: 12 }, (_, index) => {
    const mark = polygon("章圈上的独立凸刻线", material.dark, [[-.015 * radius, .77 * radius], [.015 * radius, .77 * radius], [.015 * radius, .9 * radius], [-.015 * radius, .9 * radius]], .001, [0, 0, -.005]);
    mark.rotation.x = -90;
    return moveParts([mark], [0, 0, index * 30], [0, 0, 0])[0]!;
  });
  return moveParts([cylinder(`${name}薄底表面`, [0, 0, 0], [radius * 2, .01, radius * 2], material.ivory, [90, 0, 0]), loop(`${name}外章圈`, [0, 0, -.005], radius, .025 * radius, [90, 0, 0], material.wood), combineMeshes(`${name}十二道实体刻线`, material.dark, marks), rod(`${name}短时针`, [0, 0, -.013], [radius * -.38, radius * .25, -.013], Math.max(.001, .025 * radius), material.dark), rod(`${name}长分针`, [0, 0, -.017], [radius * .32, radius * .62, -.017], Math.max(.001, .018 * radius), material.dark), cylinder(`${name}中央针轴`, [0, 0, -.012], [radius * .08, .035, radius * .08], material.wood, [90, 0, 0])], [0, 0, 0], position);
}

export const heritageFurnitureBatchFourObjects: MasterPrototype[] = [
  { name: "四角袋穴卡罗姆弹指棋台", theme: "异域", itemType: "家具", build: () => {
    const holes = [-1, 1].flatMap(x => [-1, 1].map(z => Array.from({ length: 12 }, (_, index): [number, number] => {
      const angle = -index * Math.PI / 6;
      return [x * .339 + Math.cos(angle) * .02225, z * .339 + Math.sin(angle) * .02225];
    })));
    const parts: ModelPart[] = [piercedPanel("四角袋口实际贯通的薄实木滑盘", [0, .68, 0], [[-.369, -.369], [.369, -.369], [.369, .369], [-.369, .369]], holes, .009, material.ivory), ...[-1, 1].flatMap(x => [-1, 1].map(z => box("稳立棋台四足", [x * .3, .32, z * .3], [.045, .64, .045], material.wood)))];
    for (const s of [-1, 1]) {
      parts.push(box("加宽而高出滑盘的横向边框", [0, .692, s * .405], [.884, .035, .072], material.wood), box("加宽而高出滑盘的纵向边框", [s * .405, .692, 0], [.072, .035, .738], material.wood), box("桌底横向承重牙板", [0, .62, s * .3], [.64, .1, .025], material.wood), box("桌底纵向承重牙板", [s * .3, .62, 0], [.025, .1, .64], material.wood));
      for (const side of [-1, 1]) parts.push(box("平行棋盘边的发射基线", [0, .6896, side * (.237 + (s + 1) * .016)], [.47, .0012, .0014], material.red), box("垂直基线", [side * (.237 + (s + 1) * .016), .6896, 0], [.0014, .0012, .47], material.red));
    }
    for (const x of [-1, 1]) for (const z of [-1, 1]) {
      parts.push(part("与袋口相接的有底承棋网兜", "lathe", material.dark, [x * .339, .598, z * .339], [1, 1, 1], [0, 0, 0], { profile: [{ x: 0, y: 0 }, { x: .025, y: .004 }, { x: .034, y: .035 }, { x: .0225, y: .083 }, { x: .0205, y: .083 }, { x: .031, y: .035 }, { x: .022, y: .008 }, { x: 0, y: .007 }] }));
    }
    parts.push(loop("中央外圈细线", [0, .6895, 0], .085, .0006, [0, 0, 0], material.red), cylinder("中央女王棋子", [0, .693, 0], [.031, .008, .031], material.red), cylinder("在基线前的独立大击盘", [0, .694, -.25], [.041, .009, .041], material.wood));
    for (let index = 0; index < 18; index++) {
      const radius = index < 6 ? .032 : .064, angle = (index < 6 ? index / 6 : (index - 6) / 12) * Math.PI * 2;
      parts.push(cylinder("与主盘分开的黑白滑棋", [Math.cos(angle) * radius, .693, Math.sin(angle) * radius], [.031, .008, .031], index % 2 ? material.wood : material.ivory));
    }
    return parts;
  } },
  { name: "中央凹穴克罗金诺圆棋台", theme: "欧式", itemType: "家具", build: () => {
    const outer = Array.from({ length: 32 }, (_, index): [number, number] => [Math.cos(index * Math.PI / 16) * .33, Math.sin(index * Math.PI / 16) * .33]);
    const hole = Array.from({ length: 16 }, (_, index): [number, number] => [Math.cos(-index * Math.PI / 8) * .0175, Math.sin(-index * Math.PI / 8) * .0175]);
    const parts: ModelPart[] = [piercedPanel("中央确实下凹的圆滑盘上层", [0, .7, 0], outer, [hole], .012, material.ivory), cylinder("距上表面六毫米的凹穴实底", [0, .699, 0], [.66, .014, .66], material.wood), part("外围低沟及高出滑盘的承盘围边", "lathe", material.wood, [0, .68, 0], [1, 1, 1], [0, 0, 0], { profile: [{ x: .329, y: 0 }, { x: .402, y: 0 }, { x: .402, y: .049 }, { x: .39, y: .049 }, { x: .39, y: .012 }, { x: .329, y: .012 }] }), cylinder("承圆盘的立式中心柱", [0, .39, 0], [.1, .6, .1], material.wood)];
    for (let index = 0; index < 3; index++) {
      const angle = index * Math.PI * 2 / 3;
      parts.push(rod("三向伸展稳定木足", [0, .19, 0], [Math.cos(angle) * .29, .025, Math.sin(angle) * .29], .065, material.wood));
    }
    for (const radius of [.1016, .2032, .3048]) parts.push(loop("薄而贴面的同心计分线", [0, .7125, 0], radius, .0006, [0, 0, 0], material.red));
    for (let index = 0; index < 8; index++) {
      const angle = index * Math.PI / 4;
      parts.push(cylinder("围住中心区而保留通道的独立木柱", [Math.cos(angle) * .1016, .727, Math.sin(angle) * .1016], [.009, .03, .009], material.dark));
    }
    for (let index = 0; index < 4; index++) {
      const angle = index * Math.PI / 2;
      parts.push(rod("外计分圈分为四投射区的细界线", [Math.cos(angle) * .204, .7125, Math.sin(angle) * .204], [Math.cos(angle) * .304, .7125, Math.sin(angle) * .304], .0012, material.red));
      parts.push(cylinder("台面上的可弹拨圆盘", [Math.cos(angle + .3) * .24, .717, Math.sin(angle + .3) * .24], [.032, .01, .032], index % 2 ? material.wood : material.red));
    }
    return parts;
  } },
  { name: "侧发射回收帕青哥钉阵机", theme: "异域", itemType: "设施", build: () => {
    const holes = [[-.1, .02], [.1, .02], [0, -.2]].map(([x, y]) => Array.from({ length: 12 }, (_, index): [number, number] => [x! + Math.cos(-index * Math.PI / 6) * .023, y! + Math.sin(-index * Math.PI / 6) * .021]));
    const parts: ModelPart[] = [box("独立落地球机底座", [0, .1, 0], [.62, .2, .44], material.wood), piercedPanel("有三个真正入赏洞的竖直球路板", [0, .8, -.018], [[-.235, -.34], [.235, -.34], [.235, .31], [.17, .37], [-.17, .37], [-.235, .31]], holes, .018, material.ivory, [-90, 0, 0]), box("与球路分开的后机箱薄背", [0, .72, .15], [.57, 1.08, .024], material.wood), ...[-1, 1].map(side => box("容纳竖向升球通道的侧箱墙", [side * .285, .72, .065], [.035, 1.08, .2], material.wood)), box("上部机箱帽", [0, 1.275, .06], [.61, .05, .25], material.wood), ...[-1, 1].map(side => box("球路板两侧实接外箱的窄承条", [side * .255, .805, -.008], [.055, .75, .06], material.wood)), ...[-1, 1].map(side => box("连接侧箱与玻璃边缘的深前框", [side * .27, .8, -.045], [.04, .89, .15], material.wood)), ...[.37, 1.23].map(y => box("上下玻璃边缘实际嵌入的前横框", [0, y, -.106], [.54, .035, .028], material.wood)), box("取球碗下方接到机座的前伸托板", [0, .218, -.12], [.35, .04, .19], material.wood)];
    const outerPath: Triple[] = [[.25, .36, -.072], [.25, 1.1, -.072], [.18, 1.2, -.072], [0, 1.23, -.072], [-.18, 1.2, -.072], [-.25, 1.1, -.072], [-.25, .47, -.072], [-.16, .39, -.072], [0, .365, -.072]];
    parts.push(cord("沿右侧上射并弯越顶部的球道内轨", outerPath, .006, material.steel), cord("发射球道的外侧防脱轨", outerPath.map(([x, y, z]) => [x + (x < 0 ? -.018 : .018), y + .018, z] as Triple), .006, material.steel), { ...box("覆盖钉阵而未填满球路的透明前窗", [0, .8, -.115], [.52, .86, .006], material.glass), opacity: .22 }, cup("前伸的独立取球碗", [0, .235, -.19], .165, .085, material.wood), cord("回收珠从板下落回前盘的短导管", [[0, .47, -.025], [0, .38, -.1], [0, .31, -.18]], .0125, material.steel), cylinder("右下侧扳动发射轴", [.245, .35, -.15], [.055, .11, .055], material.steel, [90, 0, 0]), rod("单独向外伸出的发射手柄", [.245, .35, -.21], [.3, .32, -.21], .02, material.wood), ball("手柄末端圆握头", [.3, .32, -.21], [.038, .038, .038], material.wood), rod("将钢珠向上击出的内置弹片", [.24, .34, -.07], [.25, .43, -.07], .012, material.steel));
    for (let row = 0; row < 6; row++) for (let column = 0; column < 7; column++) {
      const x = (column - 3) * .055 + (row % 2 ? .02 : 0), y = .55 + row * .096;
      if (holes.some((_, index) => Math.hypot(x - [-.1, .1, 0][index]!, y - (.8 + [.02, .02, -.2][index]!)) < .045)) continue;
      parts.push(rod("真实前突而供钢珠绕行的单枚障碍钉", [x, y, -.021], [x, y, -.063], .005, material.steel));
    }
    for (let index = 0; index < 9; index++) parts.push(ball("取球盘内的独立钢珠", [(index % 3 - 1) * .029, .254, -.17 + (Math.floor(index / 3) - 1) * .026], [.014, .014, .014], material.steel));
    return parts;
  } },
  { name: "环列双目立体照片观赏柜", theme: "欧式", itemType: "设施", build: () => {
    const radius = 1.8, count = 25, width = 2 * radius * Math.tan(Math.PI / count);
    const parts: ModelPart[] = [cylinder("整个观赏柜共同落地的薄圆底台", [0, .1, 0], [3.81, .2, 3.81], material.wood), cylinder("覆盖全部独立观看窗口的整幅顶盘", [0, 1.72, 0], [3.83, .12, 3.83], material.wood), cylinder("柜内照片环的中心立轴", [0, .79, 0], [.09, 1.36, .09], material.steel), loop("实际承载双联照片的内侧旋转环", [0, 1.12, 0], 1.49, .025, [0, 0, 0], material.wood), cylinder("驱动照片轮转的下部钟机匣", [0, .31, 0], [.43, .22, .43], material.dark)];
    for (let index = 0; index < 5; index++) {
      const angle = index * Math.PI * 2 / 5;
      parts.push(rod("中心轴通向照片转环的辐臂", [0, 1.12, 0], [Math.sin(angle) * 1.49, 1.12, Math.cos(angle) * 1.49], .018, material.steel));
    }
    for (let index = 0; index < count; index++) {
      const holes = [-1, 1].map(side => Array.from({ length: 12 }, (_, vertex): [number, number] => [side * .0325 + Math.cos(-vertex * Math.PI / 6) * .021, .27 + Math.sin(-vertex * Math.PI / 6) * .021]));
      const station: ModelPart[] = [piercedPanel("柜壳上左右两只真正贯通的个人目镜孔", [0, 1, -radius], [[-width / 2, -.8], [width / 2, -.8], [width / 2, .66], [-width / 2, .66]], holes, .024, material.wood, [-90, 0, 0]), ...[-1, 1].map(side => ({ ...cylinder("目镜孔内的独立透明镜片", [side * .0325, 1.27, -radius - .003], [.037, .013, .037], material.glass, [90, 0, 0]), opacity: .45 })), box("转环上与左右眼同时对准的双联照片卡", [0, 1.23, -1.49], [.205, .19, .006], material.ivory)];
      parts.push(...moveParts(station, [0, index * 360 / count, 0], [0, 0, 0]));
    }
    return parts;
  } },
  { name: "行星齿轮恒向多托读书轮", theme: "欧式", itemType: "家具", build: () => {
    const parts: ModelPart[] = [...[-1, 1].flatMap(side => [box("读书轮两侧落地横足", [side * .49, .045, 0], [.14, .09, 1.45], material.wood), box("独立承接整轮长轴的立柱", [side * .49, .57, 0], [.11, 1.05, .12], material.wood), rod("立柱前后斜撑", [side * .49, .15, -.56], [side * .49, .88, 0], .05, material.wood)]), rod("贯穿两柱与转轮的水平长轴", [-.6, 1.06, 0], [.56, 1.06, 0], .055, material.steel), ...[-1, 1].map(side => loop("两侧共轴旋转的圆木轮框", [side * .35, 1.06, 0], .8, .035, [0, 0, 90], material.wood))];
    parts.push(bookGear("保持绝对方向的固定八齿太阳轮", [.425, 1.06, 0], 8));
    // ACT: 四组等齿数太阳轮/末端轮加中间轮，保留每个书托朝向恒定的真实两次外啮合关系。
    for (let index = 0; index < 4; index++) {
      const angle = index * Math.PI / 2, y = 1.06 + Math.sin(angle) * .715, z = Math.cos(angle) * .715;
      for (const side of [-1, 1]) parts.push(rod("木轮上通向书托轴的粗辐条", [side * .35, 1.06, 0], [side * .35, y, z], .04, material.wood));
      const idler = bookGear("把轮架公转反向传入书托的十四齿中间轮", [.425, 1.06 + Math.sin(angle) * .3575, Math.cos(angle) * .3575], 14), planet = bookGear("与固定轮同直径同齿数的八齿书托末端轮", [.425, y, z], 8);
      parts.push(idler, planet, rod("单个书托穿过左右轮框的转轴", [-.4, y, z], [.43, y, z], .025, material.steel), box("始终朝上的独立倾斜书托", [0, y, z], [.65, .027, .37], material.wood, [20, 0, 0]), box("书托前缘防止书本滑落的挡唇", [0, y + .084, z - .17], [.65, .045, .018], material.wood, [20, 0, 0]), box("托面上真实接触的合拢书册", [0, y + .033, z], [.42, .035, .29], material.ivory, [20, 0, 0]));
    }
    parts.push(rod("侧面手摇曲柄", [-.58, 1.06, 0], [-.58, 1.24, 0], .025, material.steel), rod("曲柄末端可握短柄", [-.58, 1.24, 0], [-.7, 1.24, 0], .035, material.wood));
    return parts;
  } },
  { name: "中段侧移三仓折身魔术柜", theme: "现代", itemType: "设施", build: () => {
    const parts: ModelPart[] = [box("柜体与平移导架的共同底台", [0, .16, 0], [1.2, .12, .73], material.dark), box("下固定仓与底台之间连续接合的承座", [0, .235, 0], [.72, .035, .51], material.dark), ...[-1, 1].flatMap(x => [-1, 1].map(z => cylinder("底台四角的转运轮", [x * .48, .06, z * .26], [.12, .035, .12], material.dark, [90, 0, 0]))), ...[-1, 1].map(side => rod("固定上下仓而不随中仓侧移的后立架", [side * .39, .22, .28], [side * .39, 2.06, .28], .035, material.steel)), ...[.54, 1.76].map(y => rod("将上下固定仓后壁接入立架的承重横枨", [-.4, y, .28], [.4, y, .28], .045, material.steel))];
    for (let level = 0; level < 3; level++) {
      const x = level === 1 ? .39 : 0, y = .54 + level * .61;
      parts.push(...[-1, 1].map(hinge => cylinder("前门与仓壁真实相接的短合页筒", [x - .35, y + hinge * .18, -.26], [.03, .1, .03], material.steel)), box("分仓底壁", [x, y - .28, 0], [.72, .026, .51], material.red), box("分仓顶壁", [x, y + .28, 0], [.72, .026, .51], material.red), box("分仓后壁", [x, y, .25], [.72, .55, .024], material.wood), ...[-1, 1].map(side => box("分仓中空而不填实的侧壁", [x + side * .35, y, 0], [.024, .56, .51], material.red)), piercedPanel("带实际展示开口的分段前门", [x, y, -.267], [[-.35, -.28], [.35, -.28], [.35, .28], [-.35, .28]], [[[-.13, -.13], [-.13, .13], [.13, .13], [.13, -.13]]], .02, material.wood, [-90, 0, 0]));
    }
    for (const y of [.845, 1.455]) parts.push(box("跨过仓隙的可插拔隔片", [.19, y, -.035], [1.09, .009, .67], material.steel), ...[-1, 1].map(z => box("承接侧移中仓的水平滑轨", [.15, y - .025, z * .22], [1.06, .018, .025], material.dark)));
    parts.push(...[-1, 1].map(z => box("下滑轨与移动仓底之间的承重滑靴", [.39, .845, z * .22], [.7, .032, .035], material.steel)), rod("中仓平移把手", [.79, 1.12, -.04], [.79, 1.12, .13], .022, material.steel), ...[-.04, .13].map(z => rod("把手固定短臂", [.74, 1.12, z], [.79, 1.12, z], .018, material.steel)));
    return parts;
  } },
  { name: "双段独立轮台分箱锯演道具", theme: "欧式", itemType: "设施", build: () => {
    const parts: ModelPart[] = [];
    for (const side of [-1, 1]) {
      const center = side * .65;
      parts.push(box("相互分离且各自承重的推行底框", [center, .18, 0], [1.06, .08, .78], material.dark), box("空锯演箱底板", [center, .81, 0], [1, .035, .59], material.wood), box("空锯演箱的水平盖板", [center, 1.23, 0], [1.03, .035, .62], material.red), ...[-1, 1].map(z => box("长箱前后薄壁", [center, 1.02, z * .29], [1, .39, .024], material.red)), piercedPanel("外端可见的真圆穿出孔", [center + side * .5, 1.02, 0], [[-.29, -.2], [.29, -.2], [.29, .2], [-.29, .2]], [Array.from({ length: 16 }, (_, index): [number, number] => [Math.cos(-index * Math.PI / 8) * .085, Math.sin(-index * Math.PI / 8) * .085])], .028, material.wood, [-90, 0, 90]), box("切分处插入的独立金属隔板", [center - side * .49, 1.025, 0], [.009, .48, .64], material.steel), ...[-1, 1].map(z => rod("分箱隔板上接到握杆的短立耳", [center - side * .49, 1.25, z * .09], [center - side * .49, 1.29, z * .09], .012, material.steel)), rod("隔板向上露出的提手", [center - side * .49, 1.29, -.09], [center - side * .49, 1.29, .09], .015, material.wood));
      for (const x of [-1, 1]) for (const z of [-1, 1]) parts.push(box("接向各自底框的四根承箱腿", [center + x * .42, .5, z * .25], [.045, .6, .045], material.wood), cylinder("每一半推台独立的落地滚轮", [center + x * .42, .08, z * .29], [.14, .035, .14], material.dark, [90, 0, 0]));
      for (const z of [-1, 1]) parts.push(rod("分箱前后的推拉横耳", [center - .12, 1.08, z * .34], [center + .12, 1.08, z * .34], .018, material.steel), ...[-1, 1].map(x => rod("将横耳接到箱壳上的短耳座", [center + x * .12, 1.08, z * .29], [center + x * .12, 1.08, z * .34], .014, material.steel)));
    }
    return parts;
  } },
  { name: "顶端双踝锁板玻璃脱逃水牢", theme: "欧式", itemType: "设施", build: () => {
    const parts: ModelPart[] = [box("封住水牢底部的完整金属底盘", [0, .13, 0], [.91, .12, .81], material.dark), ...[-1, 1].flatMap(x => [-1, 1].map(z => [box("四角稳定短足", [x * .35, .035, z * .3], [.12, .07, .12], material.wood), box("承接顶锁板的厚金属角柱", [x * .42, 1.15, z * .37], [.065, 1.98, .065], material.wood)]).flat()), ...[-1, 1].map(x => ({ ...box("两侧透明但有实体厚度的水牢玻璃", [x * .405, 1.15, 0], [.012, 1.96, .68], material.glass), opacity: .25 })), ...[-1, 1].map(z => ({ ...box("前后可透视的完整水牢玻璃", [0, 1.15, z * .355], [.785, 1.96, .012], material.glass), opacity: .25 })), ...[-1, 1].flatMap(side => [box("承接上锁盖的前后金属顶沿", [0, 2.15, side * .37], [.9, .04, .065], material.wood), box("承接上锁盖的左右金属顶沿", [side * .42, 2.15, 0], [.065, .04, .78], material.wood)]), piercedPanel("上锁盖中确实穿通的两个脚踝口", [0, 2.16, 0], [[-.45, -.4], [.45, -.4], [.45, .4], [-.45, .4]], [-1, 1].map(side => Array.from({ length: 16 }, (_, index): [number, number] => [side * .14 + Math.cos(-index * Math.PI / 8) * .065, Math.sin(-index * Math.PI / 8) * .065])), .07, material.wood), ...[-1, 1].map(side => loop("锁板两端接向吊具的起重耳", [side * .36, 2.28, 0], .05, .012, [90, 0, 0], material.steel)), rod("水牢下端排水支管", [.4, .18, .18], [.61, .18, .18], .028, material.steel), cylinder("排水管末端阀体", [.61, .18, .18], [.06, .05, .06], material.wood, [0, 0, 90]), rod("排水阀的横向短手柄", [.61, .22, .13], [.61, .22, .23], .012, material.steel)];
    for (const side of [-1, 1]) parts.push(box("把上锁盖压到角柱的外置搭扣", [side * .465, 2.12, 0], [.035, .15, .09], material.steel), loop("搭扣外实际闭合的小挂锁梁", [side * .49, 2.08, 0], .022, .005, [0, 0, 90], material.steel), box("小挂锁实心锁体", [side * .49, 2.05, 0], [.035, .04, .04], material.wood));
    return parts;
  } },
  { name: "侧向屉座达文波特斜面写字桌", theme: "欧式", itemType: "家具", build: () => {
    const parts: ModelPart[] = [box("作为整桌后半支承的空腔屉箱底", [0, .13, .105], [.54, .035, .34], material.wood), box("屉箱上盖", [0, .718, .105], [.54, .025, .34], material.wood), box("屉箱朝前的完整背向侧板", [0, .424, -.065], [.54, .57, .025], material.wood), box("屉箱后端薄墙", [0, .424, .275], [.54, .57, .025], material.wood), box("屉箱没有开屉的一侧薄墙", [-.265, .424, .105], [.025, .57, .34], material.wood), box("侧向屉箱脚下的短滑座", [0, .06, .105], [.59, .12, .39], material.wood), box("上部整体倾斜的可掀写字盖", [0, .804, -.015], [.59, .035, .59], material.wood, [-12, 0, 0]), box("斜盖上薄而贴合的书写衬面", [0, .824, -.018], [.51, .004, .49], material.dark, [-12, 0, 0]), rod("位于斜盖后缘的实际合页长轴", [-.29, .867, .27], [.29, .867, .27], .012, material.steel)];
    for (const side of [-1, 1]) {
      parts.push(plate("连向桌前角的整片弯曲支承", [side * .23, 0, 0], [[-.28, .07], [-.235, .07], [-.19, .27], [-.22, .48], [-.18, .65], [-.11, .73], [-.15, .77], [-.235, .67], [-.27, .49], [-.24, .28]], .045, material.wood, [0, -90, 0]), box("前脚接地宽垫", [side * .23, .045, -.25], [.095, .09, .13], material.wood), plate("写字盖下方有实际斜上沿的木箱侧颊", [side * .277, 0, 0], [[-.3, .718], [.28, .718], [.28, .866], [-.3, .743]], .025, material.wood, [0, -90, 0]));
    }
    for (let index = 0; index < 4; index++) {
      const y = .22 + index * .14, shift = index === 2 ? .18 : 0;
      parts.push(box("四层侧向抽屉的固定层板", [0, y - .057, .105], [.56, .014, .315], material.wood), box("向右侧开启的抽屉正面", [.285 + shift, y, .105], [.025, .11, .315], material.wood), loop("屉面上独立垂直的小提环", [.307 + shift, y, .105], .02, .004, [0, 0, 90], material.steel));
      if (shift) parts.push(box("已拉出抽屉的内底板", [shift, y - .05, .105], [.55, .014, .29], material.wood), box("已拉出抽屉的后壁", [-.25 + shift, y, .105], [.014, .1, .29], material.wood), ...[-1, 1].map(z => box("已拉出抽屉的两道长侧墙", [shift, y, .105 + z * .145], [.55, .1, .014], material.wood)));
    }
    parts.push(box("写字盒后方的闭合薄墙", [0, .792, .275], [.54, .148, .02], material.wood), box("桌顶背缘的独立笔具匣底", [0, .885, .235], [.53, .014, .1], material.wood), ...[-1, 1].map(x => box("小笔具匣侧颊", [x * .27, .916, .235], [.014, .05, .11], material.wood)), box("笔具匣后唇", [0, .916, .285], [.54, .05, .014], material.wood));
    return parts;
  } },
  { name: "辐向空腔屉裙鼓式书写圆桌", theme: "欧式", itemType: "家具", build: () => {
    const parts: ModelPart[] = [cylinder("平整圆形书写面", [0, .735, 0], [1.22, .045, 1.22], material.wood), cylinder("贴在桌面中的圆形书写衬面", [0, .759, 0], [1.12, .003, 1.12], material.dark), cylinder("抽屉仓下方共同薄底盘", [0, .583, 0], [1.15, .025, 1.15], material.wood), cylinder("托起整个屉裙的中央立柱", [0, .35, 0], [.14, .47, .14], material.wood), cylinder("屉裙下方的旋转轴颈", [0, .57, 0], [.23, .04, .23], material.wood)];
    for (let index = 0; index < 8; index++) {
      const angle = index * 45, opening = index === 0 ? .17 : 0;
      const drawer: ModelPart[] = [polygon("独立辐向抽屉的梯形实底", material.wood, [[-.055, .15], [.055, .15], [.21, .51], [-.21, .51]], .009, [0, .602, opening]), box("辐向抽屉短内后墙", [0, .652, .15 + opening], [.11, .1, .012], material.wood), box("弦向外屉面", [0, .652, .522 + opening], [.43, .1, .024], material.wood), loop("屉面垂下的独立小圆拉环", [0, .651, .541 + opening], .021, .004, [90, 0, 0], material.steel)];
      for (const side of [-1, 1]) drawer.push(box("由内向外张开的薄屉侧墙", [side * .1325, .652, .33 + opening], [.012, .1, .392], material.wood, [0, side * 23.3, 0]));
      parts.push(...moveParts(drawer, [0, angle, 0], [0, 0, 0]));
      const a = (angle + 22.5) * Math.PI / 180;
      parts.push(box("桌裙上承顶下接底的窄分仓柱", [Math.sin(a) * .55, .653, Math.cos(a) * .55], [.018, .118, .023], material.wood, [0, angle + 22.5, 0]));
    }
    for (let index = 0; index < 3; index++) {
      const angle = index * Math.PI * 2 / 3;
      parts.push(cord("与柱身连成承托的弧张三足", [[0, .24, 0], [Math.cos(angle) * .2, .15, Math.sin(angle) * .2], [Math.cos(angle) * .45, .055, Math.sin(angle) * .45]], .045, material.wood), cylinder("三足末端真正接地的小滚轮", [Math.cos(angle) * .45, .032, Math.sin(angle) * .45], [.064, .025, .064], material.dark, [90, 0, 0]));
    }
    return parts;
  } },
  { name: "抽杆撑盖托架式可提文书柜", theme: "欧式", itemType: "家具", build: () => {
    const parts: ModelPart[] = [box("可搬柜箱的独立底板", [0, .88, 0], [1.15, .035, .47], material.wood), box("可搬柜箱上盖", [0, 1.5, 0], [1.15, .035, .47], material.wood), box("封闭背墙而保留柜内空仓", [0, 1.19, .225], [1.15, .59, .024], material.wood), ...[-1, 1].map(side => box("承顶的柜箱薄侧壁", [side * .56, 1.19, 0], [.028, .62, .47], material.wood)), box("已落下与柜底同高的整幅书写板", [0, .872, -.55], [1.13, .03, .63], material.wood), box("书写板上的贴合衬皮", [0, .8885, -.55], [1.04, .003, .55], material.dark), rod("落板沿着前下沿转动的通长合页轴", [-.56, .88, -.235], [.56, .88, -.235], .014, material.steel), box("台架前后相联的底枨", [0, .12, 0], [1.01, .055, .12], material.wood)];
    for (const side of [-1, 1]) {
      const foot = piercedPanel("束腰镂空的板式下架足", [side * .47 + .035, 0, 0], [[-.3, 0], [.3, 0], [.25, .08], [.17, .18], [.12, .39], [.24, .66], [.25, .8], [-.25, .8], [-.24, .66], [-.12, .39], [-.17, .18], [-.25, .08]], [[[-.045, .28], [-.045, .58], [.045, .58], [.045, .28]]], .07, material.wood, [-90, 0, 90]);
      const guide = piercedPanel("架足顶端有纵向真导孔的承箱横木", [side * .47, 0, .28], [[-.06, .79], [.06, .79], [.06, .88], [-.06, .88]], [Array.from({ length: 12 }, (_, index): [number, number] => [-side * .03 + Math.cos(-index * Math.PI / 6) * .015, .847 + Math.sin(-index * Math.PI / 6) * .015])], .56, material.wood, [-90, 0, 0]);
      parts.push(combineMeshes("带纵向撑杆导孔的完整板式承箱架足", material.wood, [foot, guide]), rod("从柜身下抽出的独立撑盖滑杆", [side * .44, .847, .13], [side * .44, .847, -.83], .025, material.wood), ball("抽出撑杆最前端的圆握头", [side * .44, .847, -.84], [.045, .045, .045], material.wood), loop("柜箱两侧的实际提运铁环", [side * .61, 1.19, 0], .065, .008, [0, 0, 90], material.dark), ...[-1, 1].map(z => rod("铁提环接回柜身的短铆耳", [side * .565, 1.19, z * .065], [side * .61, 1.19, z * .065], .018, material.dark)));
    }
    for (const y of [1.076, 1.266]) parts.push(box("贯通柜内的抽屉承板", [0, y, 0], [1.09, .016, .43], material.wood));
    for (const x of [-.36, 0, .36]) {
      for (const y of [.98, 1.17, 1.36]) parts.push(box("独立文书斗实际接触承板的薄底", [x, y - .08, 0], [.33, .012, .41], material.wood), box("独立文书斗内侧的短后壁", [x, y - .001, .199], [.33, .15, .014], material.wood), ...[-1, 1].map(side => box("独立文书斗内两条薄侧墙", [x + side * .158, y - .001, 0], [.014, .15, .41], material.wood)), box("柜内独立文书斗的正面", [x, y, -.206], [.33, .16, .024], material.wood), loop("文书斗的小铁拉环", [x, y, -.226], .019, .004, [90, 0, 0], material.dark));
    }
    parts.push(...[-.18, .18].map(x => box("真正分开各列内仓的竖薄隔板", [x, 1.19, .005], [.016, .59, .42], material.wood)));
    return parts;
  } },
  { name: "八角束腰板足斯加贝洛高靠椅", theme: "欧式", itemType: "家具", build: () => {
    const seat = Array.from({ length: 8 }, (_, index): [number, number] => [Math.cos(Math.PI / 8 + index * Math.PI / 4) * .235, Math.sin(Math.PI / 8 + index * Math.PI / 4) * .235]);
    const back: [number, number][] = [[-.11, 0], [.11, 0], [.095, .1], [.065, .22], [.13, .27], [.19, .32], [.21, .4], [.2, .49], [.15, .56], [.08, .59], [0, .61], [-.08, .59], [-.15, .56], [-.2, .49], [-.21, .4], [-.19, .32], [-.13, .27], [-.065, .22], [-.095, .1]];
    const parts: ModelPart[] = [polygon("八角座面本体", material.wood, seat, .04, [0, .445, 0]), piercedPanel("腰细顶宽的整块高靠板及两处透雕", [0, .47, .17], back, [-1, 1].map(side => [[side * .07, .3], [side * .15, .35], [side * .15, .43], [side * .09, .48], [side * .075, .4]] as [number, number][]), .035, material.wood, [-90, 0, 0]), rod("两块板足间相互拉结的通榫枨", [0, .17, -.18], [0, .17, .18], .045, material.wood)];
    for (const side of [-1, 1]) parts.push(plate("脚宽腰细并在座下张开的整块前后足板", [0, 0, side * .16], [[-.22, 0], [.22, 0], [.21, .07], [.12, .14], [.075, .26], [.13, .38], [.2, .445], [-.2, .445], [-.13, .38], [-.075, .26], [-.12, .14], [-.21, .07]], .04, material.wood, [0, 0, 0]));
    return parts;
  } },
  { name: "展翼承书三足铜鹰读经台", theme: "欧式", itemType: "家具", build: () => {
    const parts: ModelPart[] = [cylinder("读经台柱下的厚莲盘", [0, .11, 0], [.53, .11, .53], material.wood), cylinder("由三足承托的通长立柱", [0, .68, 0], [.09, 1.08, .09], material.wood), ball("双爪紧扣的柱顶圆球", [0, 1.25, 0], [.28, .28, .28], material.wood), lobe("直接承担书托的鹰式胸躯", material.wood, [0, 1.55, -.015], [.34, .47, .3]), tapered("由胸向上弯曲的鸟颈", material.wood, [[0, 1.66, -.03], [0, 1.79, -.055], [0, 1.88, -.1]], [.09, .065, .06]), lobe("完整鹰首", material.wood, [0, 1.91, -.13], [.19, .19, .22]), plate("鹰首前钩的实体喙", [0, 1.9, -.22], [[0, .03], [.15, -.015], [.18, -.08], [.12, -.13], [.09, -.06], [0, -.05]], .06, material.wood, [0, 90, 0]), box("翼面后方斜置且有实际厚度的承书板", [0, 1.725, .092], [.78, .44, .025], material.wood, [-25, 0, 0]), box("大开本书可停靠的连贯下挡唇", [0, 1.529, -.002], [.79, .035, .055], material.wood, [-25, 0, 0])];
    for (let index = 0; index < 3; index++) {
      const angle = index * Math.PI * 2 / 3;
      parts.push(cord("直接落地而向中心收拢的三条铸足", [[Math.cos(angle) * .34, .025, Math.sin(angle) * .34], [Math.cos(angle) * .19, .08, Math.sin(angle) * .19], [0, .22, 0]], .037, material.wood));
    }
    for (const side of [-1, 1]) {
      const outline: [number, number][] = [[0, 0], [side * .2, .15], [side * .57, .31], [side * .53, .16], [side * .47, .12], [side * .49, .04], [side * .4, .025], [side * .34, -.06], [side * .24, -.11], [side * .1, -.08]];
      parts.push(plate("从胸身展开并作为书板支承的整翼", [0, 1.53, .025], outline, .055, material.wood, [0, 0, 0]), rod("鹰翼后部实际顶住书板的短撑", [side * .37, 1.7, .055], [side * .35, 1.7, .105], .025, material.wood), tapered("鸟身接球的弯足", material.wood, [[side * .1, 1.42, 0], [side * .09, 1.34, -.025], [side * .1, 1.29, -.075]], [.026, .023, .02]));
      for (const toe of [-1, 0, 1]) parts.push(cord("扣住柱顶球的三趾", [[side * .1, 1.31, -.06], [side * (.1 + toe * .023), 1.27, -.13], [side * (.1 + toe * .023), 1.24, -.12]], .009, material.wood));
      for (let feather = 0; feather < 5; feather++) parts.push(rod("翼面外缘的连续实体羽脊", [side * (.16 + feather * .065), 1.57 + feather * .026, -.008], [side * (.28 + feather * .052), 1.62 + feather * .034, -.01], .009, material.wood));
    }
    return parts;
  } },
  { name: "密针分压躺身演示床", theme: "现代", itemType: "设施", build: () => {
    const parts: ModelPart[] = [box("承受全部钉阵的连续厚台板", [0, .65, 0], [.83, .06, 2.06], material.wood), ...[-1, 1].flatMap(x => [-1, 1].map(z => box("板下四角的独立粗木足", [x * .32, .305, z * .86], [.07, .61, .07], material.wood))), ...[-1, 1].map(x => box("将长边连接成承重框的床牙", [x * .33, .57, 0], [.035, .17, 1.81], material.wood)), ...[-1, 1].map(z => box("将两侧床牙拉成框的端牙", [0, .57, z * .87], [.66, .17, .035], material.wood))];
    // ACT: 每48根封底八棱针合成一个480顶点网格；保持针隙，不使用图片或一个实心刺块替代。
    for (let batch = 0; batch < 12; batch++) {
      const vertices: { x: number; y: number; z: number }[] = [], indices: number[] = [];
      for (let needle = 0; needle < 48; needle++) {
        const index = batch * 48 + needle, x = (index % 16 - 7.5) * .045, z = (Math.floor(index / 16) - 17.5) * .05, base = vertices.length;
        for (let side = 0; side < 8; side++) vertices.push({ x: x + Math.cos(side * Math.PI / 4) * .004, y: .68, z: z + Math.sin(side * Math.PI / 4) * .004 });
        vertices.push({ x, y: .77, z }, { x, y: .68, z });
        for (let side = 0; side < 8; side++) indices.push(base + side, base + 8, base + (side + 1) % 8, base + 9, base + side, base + (side + 1) % 8);
      }
      parts.push(part("有单独针尖且实际分离的密针组", "mesh", material.steel, [0, 0, 0], [1, 1, 1], [0, 0, 0], { vertices, indices }));
    }
    return parts;
  } },
  { name: "镂栅穿刃魔术剑笼", theme: "异域", itemType: "设施", build: () => {
    const parts: ModelPart[] = [cylinder("整笼封底的厚木圆盘", [0, .12, 0], [.81, .05, .81], material.wood), ...[.17, .42, .7, .93].map((y, index) => loop("镂栅笼壳闭合箍圈", [0, y, 0], [.36, .46, .45, .4][index]!, .015, [0, 0, 0], material.wood)), piercedPanel("带实际提握孔的上合圆笼盖", [0, .945, 0], Array.from({ length: 32 }, (_, index): [number, number] => [Math.cos(index * Math.PI / 16) * .415, Math.sin(index * Math.PI / 16) * .415]), [Array.from({ length: 16 }, (_, index): [number, number] => [Math.cos(-index * Math.PI / 8) * .06, Math.sin(-index * Math.PI / 8) * .045])], .025, material.wood)];
    for (let index = 0; index < 16; index++) {
      const angle = index * Math.PI / 8;
      parts.push(tapered("上下收口而中部外鼓的独立笼篾", material.wood, [[Math.cos(angle) * .35, .145, Math.sin(angle) * .35], [Math.cos(angle) * .46, .42, Math.sin(angle) * .46], [Math.cos(angle) * .45, .7, Math.sin(angle) * .45], [Math.cos(angle) * .4, .95, Math.sin(angle) * .4]], [.012, .012, .012, .012]));
    }
    for (let index = 0; index < 4; index++) {
      const sword = [plate("穿过空笼而有实际薄刃的道具剑", [0, 0, 0], [[-.69, -.019], [.6, -.019], [.73, 0], [.6, .019], [-.69, .019]], .004, material.steel), rod("在笼外可见的独立长握柄", [-.69, 0, 0], [-.86, 0, 0], .035, material.wood), rod("握柄前方横向护手", [-.69, 0, -.085], [-.69, 0, .085], .015, material.steel), ball("握柄末端的独立柄首", [-.87, 0, 0], [.043, .043, .043], material.wood)];
      parts.push(...moveParts(sword, [0, index * 47, index % 2 ? -6 : 6], [0, .34 + index * .145, 0]));
    }
    for (let index = 0; index < 3; index++) {
      const angle = index * Math.PI * 2 / 3;
      parts.push(box("笼底独立接地矮木足", [Math.cos(angle) * .26, .0475, Math.sin(angle) * .26], [.09, .095, .09], material.wood));
    }
    return parts;
  } },
  { name: "折褶伸缩横箱幻术台", theme: "现代", itemType: "设施", build: () => {
    const vertices: { x: number; y: number; z: number }[] = [], indices: number[] = [];
    for (const inner of [false, true]) for (let ringIndex = 0; ringIndex < 9; ringIndex++) {
      const halfHeight = (ringIndex % 2 ? .33 : .275) - (inner ? .006 : 0), halfDepth = (ringIndex % 2 ? .34 : .285) - (inner ? .006 : 0);
      for (const [y, z] of [[-halfHeight, -halfDepth], [halfHeight, -halfDepth], [halfHeight, halfDepth], [-halfHeight, halfDepth]]) vertices.push({ x: (ringIndex - 4) * .14, y: 1.16 + y!, z: z! });
    }
    for (let ringIndex = 0; ringIndex < 8; ringIndex++) for (let side = 0; side < 4; side++) {
      const a = ringIndex * 4 + side, b = ringIndex * 4 + (side + 1) % 4, c = b + 4, d = a + 4;
      indices.push(a, b, c, a, c, d, a + 36, c + 36, b + 36, a + 36, d + 36, c + 36);
    }
    for (const end of [0, 8]) for (let side = 0; side < 4; side++) {
      const a = end * 4 + side, b = end * 4 + (side + 1) % 4;
      indices.push(...(end === 0 ? [a, a + 36, b + 36, a, b + 36, b] : [a, b, b + 36, a, b + 36, a + 36]));
    }
    const parts: ModelPart[] = [part("可见空腔与薄壁的连续方截面折褶箱壳", "mesh", material.red, [0, 0, 0], [1, 1, 1], [0, 0, 0], { vertices, indices }), ...[-1, 1].flatMap(x => [-1, 1].map(z => box("幻术台四角金属支腿", [x * .61, .39, z * .28], [.045, .78, .045], material.dark))), ...[-1, 1].map(z => box("供两端滑架互相接近的纵向导床", [0, .79, z * .29], [1.59, .05, .04], material.dark))];
    for (const side of [-1, 1]) {
      parts.push(piercedPanel("带真通孔的横箱刚性端框", [side * .58, 1.16, 0], [[-.34, -.35], [.34, -.35], [.34, .35], [-.34, .35]], [Array.from({ length: 16 }, (_, index): [number, number] => [Math.cos(-index * Math.PI / 8) * .105, Math.sin(-index * Math.PI / 8) * .105])], .035, material.wood, [-90, 0, 90]), box("端框下方与双导床相接的滑架", [side * .59, .86, 0], [.13, .09, .67], material.dark), rod("侧面相交而驱动伸缩的连杆", [-.52, .71, side * .35], [.52, .89, side * .35], .02, material.steel), rod("成对反向交叉的驱动连杆", [-.52, .89, side * .35], [.52, .71, side * .35], .02, material.steel), cylinder("两连杆交点的真实枢轴", [0, .8, side * .35], [.035, .06, .035], material.wood, [90, 0, 0]));
    }
    parts.push(rod("前方拉推折褶箱的活动手杆", [.64, .87, -.31], [.64, .87, -.63], .025, material.steel), ball("拉杆末端圆头", [.64, .87, -.64], [.06, .06, .06], material.wood));
    return parts;
  } },
  { name: "双支点落砂悬锥绘图摆", theme: "现代", itemType: "设施", build: () => {
    const parts: ModelPart[] = [part("有封底而有深度的圆形接砂盘", "lathe", material.wood, [0, .035, 0], [1, 1, 1], [0, 0, 0], { profile: [{ x: 0, y: 0 }, { x: .93, y: 0 }, { x: .93, y: .19 }, { x: .905, y: .19 }, { x: .905, y: .155 }, { x: 0, y: .155 }] }), cylinder("接盘内低于围边的平整砂面", [0, .2, 0], [1.79, .02, 1.79], material.ivory), loop("三角架顶端相互联结的承索圈", [0, 2.7, 0], .5, .035, [0, 0, 0], material.dark), rod("跨过顶圈的双支点挂绳梁", [-.5, 2.7, 0], [.5, 2.7, 0], .045, material.dark), ...[-1, 1].map(side => cord("左右支点共同约束第一摆长的悬绳", [[side * .42, 2.7, 0], [0, 1.8, 0]], .005, material.steel)), cord("从公共绳结下垂的第二段独立摆绳", [[0, 1.8, 0], [0, .67, 0]], .005, material.steel), part("底部有真实出砂孔的空心漏斗摆锥", "lathe", material.wood, [0, .265, 0], [1, 1, 1], [0, 0, 0], { profile: [{ x: .004, y: 0 }, { x: .011, y: 0 }, { x: .026, y: .08 }, { x: .15, y: .31 }, { x: .145, y: .315 }, { x: .019, y: .08 }, { x: .004, y: .02 }] }), ...[-1, 1].map(side => rod("漏斗口通向绳结的细吊耳", [side * .14, .57, 0], [0, .67, 0], .008, material.steel))];
    for (let index = 0; index < 3; index++) {
      const angle = index * Math.PI * 2 / 3;
      parts.push(rod("盘外接地且向顶圈内收的独立斜架", [Math.cos(angle) * 1.21, .045, Math.sin(angle) * 1.21], [Math.cos(angle) * .5, 2.7, Math.sin(angle) * .5], .065, material.dark), cylinder("斜架底端的宽防滑脚盘", [Math.cos(angle) * 1.21, .023, Math.sin(angle) * 1.21], [.21, .046, .21], material.dark));
    }
    parts.push(cord("砂盘上连续可见的双频摆迹", Array.from({ length: 49 }, (_, index): Triple => { const t = index * Math.PI / 24; return [Math.sin(2 * t) * .66, .212, Math.sin(3 * t) * .57]; }), .0025, material.wood));
    for (const y of [.229, .242, .255]) parts.push(ball("漏斗口下落而尚未落入盘内的少量砂粒", [0, y, 0], [.004, .004, .004], material.ivory));
    return parts;
  } },
  { name: "漏桶定流洛伦兹混沌水轮", theme: "现代", itemType: "设施", build: () => {
    const parts: ModelPart[] = [part("承接所有漏桶出水的封底循环水盘", "lathe", material.steel, [0, 0, 0], [1, 1, 1], [0, 0, 0], { profile: [{ x: 0, y: 0 }, { x: .85, y: 0 }, { x: .85, y: .21 }, { x: .825, y: .21 }, { x: .825, y: .025 }, { x: 0, y: .025 }] }), ...[-1, 1].map(side => rod("位于转轮后侧的两根轴架立柱", [side * .64, .025, .27], [side * .64, 1.14, .27], .045, material.dark)), rod("将主轴托在轮心高度的承重横梁", [-.65, 1.14, .27], [.65, 1.14, .27], .05, material.dark), rod("可自由正反转动的水平主轴", [0, 1.14, -.08], [0, 1.14, .34], .035, material.steel), loop("把全部桶轴连为整体的轮框", [0, 1.14, 0], .58, .02, [90, 0, 0], material.dark), cylinder("主轴后端的可调阻尼盘", [0, 1.14, .36], [.18, .06, .18], material.dark, [90, 0, 0]), cord("由下盘回到上方稳流杯的供水管", [[.52, .05, .36], [.72, .12, .36], [.72, 1.95, .36], [0, 1.95, .36], [0, 1.92, -.12]], .019, material.steel), box("循环泵小机匣", [.5, .075, .36], [.21, .1, .16], material.dark), part("底孔定流而非叶片冲击的上置供水杯", "lathe", material.glass, [0, 1.86, -.12], [1, 1, 1], [0, 0, 0], { profile: [{ x: .006, y: 0 }, { x: .1, y: 0 }, { x: .12, y: .17 }, { x: .112, y: .17 }, { x: .092, y: .012 }, { x: .006, y: .012 }] }), rod("把上置杯固定在回水立管上的横托", [0, 1.86, .36], [0, 1.86, -.12], .025, material.dark)];
    for (let index = 0; index < 8; index++) {
      const angle = index * Math.PI / 4, x = Math.sin(angle) * .58, y = 1.14 + Math.cos(angle) * .58;
      parts.push(rod("轮心到每只独立漏桶的径向轮辐", [0, 1.14, 0], [x, y, 0], .014, material.steel), rod("使桶体悬在轮框前侧的短轴", [x, y + .06, .02], [x, y + .06, -.12], .012, material.steel), part("有真实微孔而逐渐减重的空心漏桶", "lathe", material.wood, [x, y, -.12], [1, 1, 1], [0, 0, 0], { profile: [{ x: .003, y: 0 }, { x: .042, y: 0 }, { x: .061, y: .12 }, { x: .056, y: .12 }, { x: .037, y: .009 }, { x: .003, y: .009 }] }));
    }
    return parts;
  } },
  { name: "投币出签自动人偶观演柜", theme: "欧式", itemType: "设施", build: () => {
    const parts: ModelPart[] = [box("整机落地宽底座", [0, .055, 0], [.76, .11, .65], material.wood), ...[-1, 1].map(side => box("下机柜两侧薄壁", [side * .34, .48, 0], [.035, .75, .55], material.wood)), box("下机柜后壁", [0, .48, .26], [.67, .75, .025], material.wood), box("人偶与签卡机构共同承台", [0, .85, 0], [.73, .045, .6], material.wood), piercedPanel("下柜前板上的真实投币口和取签口", [0, .48, -.285], [[-.34, -.36], [.34, -.36], [.34, .36], [-.34, .36]], [[[.13, .16], [.13, .22], [.148, .22], [.148, .16]], [[-.15, -.13], [-.15, -.095], [.15, -.095], [.15, -.13]]], .025, material.wood, [-90, 0, 0]), box("从取签口向前伸出的薄承签舌", [0, .365, -.34], [.31, .014, .16], material.wood), ...[-1, 1].flatMap(x => [-1, 1].map(z => box("上部透明观演柜的四根细框柱", [x * .335, 1.37, z * .26], [.035, 1, .035], material.wood))), box("柜顶的整体过梁", [0, 1.9, 0], [.76, .065, .64], material.wood), plate("顶部上拱而非平顶柜的实心门额", [0, 1.92, -.29], [[-.38, 0], [.38, 0], [.33, .07], [.21, .17], [0, .21], [-.21, .17], [-.33, .07]], .045, material.wood, [0, 0, 0]), { ...box("柜前不填充人偶空间的透明玻璃", [0, 1.375, -.275], [.64, .94, .006], material.glass), opacity: .2 }, ...[-1, 1].map(side => ({ ...box("两侧观看玻璃", [side * .34, 1.37, 0], [.006, .95, .49], material.glass), opacity: .2 })), box("上部机柜独立薄后板", [0, 1.37, .272], [.65, .96, .02], material.wood), box("人偶坐在其中的短座板", [0, 1.08, .1], [.37, .04, .27], material.wood), box("坐板下实际承重的座柱", [0, .97, .12], [.12, .18, .12], material.wood), lobe("自动人偶的整块胸腹", material.dark, [0, 1.34, .07], [.31, .39, .23]), ball("自动人偶的完整面具头", [0, 1.67, .045], [.18, .225, .17], material.ivory), cylinder("面具与躯干间的真实颈轴", [0, 1.525, .055], [.05, .11, .05], material.steel), cone("坐姿人偶腰下的空腔衣摆", [0, 1.13, .07], [.35, .32, .3], material.dark), box("面前承接手势与道具的低桌", [0, 1.17, -.13], [.51, .035, .21], material.wood), ...[-1, 1].map(side => rod("低桌独立短腿", [side * .21, .87, -.13], [side * .21, 1.155, -.13], .025, material.wood)), { ...ball("桌面上透光的演示圆球", [0, 1.25, -.14], [.14, .14, .14], material.glass), opacity: .45 }, cylinder("传动凸轮共用的水平轴", [-.11, .67, .055], [.025, .2, .025], material.steel, [90, 0, 0]), cog("牵动出签拨片的大凸轮轮廓", [-.11, .67, -.025], .1, .018), box("成叠签卡的真实薄纸仓", [0, .49, -.08], [.27, .07, .16], material.ivory), rod("签卡仓到前方出口的倾斜导床", [0, .47, -.1], [0, .375, -.28], .035, material.wood), rod("连到人偶上身的偏心驱动杆", [-.045, .744, -.025], [-.045, 1.32, .13], .012, material.steel)];
    for (const side of [-1, 1]) {
      parts.push(tapered("从肩延到桌前的分节人偶手臂", material.dark, [[side * .095, 1.43, .065], [side * .23, 1.3, .005], [side * .17, 1.215, -.14]], [.04, .03, .025]), lobe("手臂末端独立的浅色手掌", material.ivory, [side * .17, 1.215, -.15], [.07, .035, .075]), ball("面具上的深色眼孔", [side * .036, 1.7, -.026], [.016, .013, .009], material.dark));
    }
    return parts;
  } },
  { name: "蛙口转叶分仓投币游艺台", theme: "异域", itemType: "设施", build: () => {
    const holes = [-.16, 0, .16].flatMap(x => [-.16, 0, .16].map(z => Array.from({ length: 12 }, (_, index): [number, number] => [x + Math.cos(-index * Math.PI / 6) * .0275, z + Math.sin(-index * Math.PI / 6) * .0275])));
    const parts: ModelPart[] = [piercedPanel("与九个收币仓分别对齐的真正贯通投币板", [0, .83, 0], [[-.25, -.25], [.25, -.25], [.25, .25], [-.25, .25]], holes, .02, material.wood), box("各收币仓共用而不透底的接币板", [0, .47, 0], [.49, .02, .49], material.wood), ...[-1, 1].flatMap(x => [-1, 1].map(z => box("游戏台四角贯通至地面的木腿", [x * .22, .415, z * .22], [.04, .83, .04], material.wood))), ...[-1, 1].map(side => box("将落币控制在台内的整幅侧壁", [side * .245, .69, 0], [.02, .45, .5], material.wood)), box("后方上凸而可挡回投币的背壁", [0, .76, .245], [.5, .58, .02], material.wood), box("前方低围板保留掏币仓开口", [0, .49, -.245], [.49, .06, .02], material.wood)];
    for (const value of [-.083, .083]) parts.push(box("下方逐列分开的长落币隔板", [value, .65, 0], [.01, .34, .47], material.wood), box("下方逐行分开的横落币隔板", [0, .65, value], [.47, .34, .01], material.wood));
    const mouth = loop("空心蛙口真正可通过铁片的嘴缘", [0, .91, -.079], .039, .003, [90, 0, 0], material.wood);
    mouth.scale.z = .6;
    parts.push(mouth, lobe("嘴缘上方而不堵住开口的蛙头顶壳", material.wood, [0, .955, -.035], [.13, .055, .13]), box("从嘴内斜导到中心孔上方的短喉底", [0, .87, -.04], [.065, .005, .071], material.wood, [31.6, 0, 0]), ...[-1, 1].map(side => rod("蛙口两侧连回台面的独立颊足", [side * .045, .9, -.065], [side * .06, .85, .025], .012, material.wood)), ...[-1, 1].map(side => lobe("蛙式上突的两只圆眼座", material.wood, [side * .04, .983, -.02], [.038, .038, .04])), ...[-1, 1].map(side => ball("眼座前侧的小暗眼", [side * .04, .987, -.037], [.01, .01, .006], material.dark)), ...[-1, 1].map(side => tapered("弯在身体两边而仍接到板面的蛙后足", material.wood, [[side * .05, .92, .035], [side * .095, .88, .05], [side * .08, .855, -.015]], [.022, .024, .012])));
    for (const side of [-1, 1]) parts.push(plate("前列孔上允许铁片从桥下进入的空拱", [side * .16, .85, -.16], [[-.05, 0], [-.05, .03], [-.035, .045], [.035, .045], [.05, .03], [.05, 0], [.035, 0], [.035, .022], [.02, .03], [-.02, .03], [-.035, .022], [-.035, 0]], .05, material.wood, [0, 0, 0]));
    parts.push(rod("前中孔上的转叶轴", [-.043, .885, -.16], [.043, .885, -.16], .008, material.steel), ...[-1, 1].map(side => rod("转叶轴在孔两侧的支承耳", [side * .039, .85, -.16], [side * .039, .885, -.16], .008, material.wood)));
    for (let index = 0; index < 4; index++) parts.push(box("被投币推动而让开孔口的独立转叶", [0, .885 + Math.sin(index * Math.PI / 2) * .021, -.16 + Math.cos(index * Math.PI / 2) * .021], [.061, .004, .033], material.wood, [index * -90, 0, 0]));
    for (let index = 0; index < 3; index++) parts.push(cylinder("已落入前排收币仓内的少量铁片", [index * .014 - .17, .487 + index * .007, -.16], [.038, .007, .038], material.steel));
    return parts;
  } },
  { name: "触靶翻座落水体验池", theme: "现代", itemType: "设施", build: () => {
    const outline: [number, number][] = [[-.78, -.8], [.78, -.8], [.78, .9], [-.78, .9]];
    const gaps = Array.from({ length: 16 }, (_, index): [number, number][] => { const x = (index % 4 - 1.5) * .37, y = (Math.floor(index / 4) - 1.5) * .38 + .04; return [[x - .17, y - .17], [x - .17, y + .17], [x + .17, y + .17], [x + .17, y - .17]]; });
    const parts: ModelPart[] = [box("水池与靶臂共用的宽落地台", [.22, .06, 0], [3.1, .12, 2.16], material.dark), part("有封底而上部开放的深落水池", "lathe", material.wood, [0, .12, 0], [1, 1, 1], [0, 0, 0], { profile: [{ x: 0, y: 0 }, { x: .8, y: 0 }, { x: .8, y: 1.3 }, { x: .77, y: 1.3 }, { x: .77, y: .04 }, { x: 0, y: .04 }] }), { ...cylinder("低于池口的静态水面体", [0, .655, 0], [1.52, .99, 1.52], material.glass), opacity: .23 }, ...[-1, 1].map(side => rod("后侧高防溅框的独立落地柱", [side * .8, .12, .78], [side * .8, 2.46, .78], .05, material.steel)), rod("后侧防溅框顶梁", [-.82, 2.46, .78], [.82, 2.46, .78], .05, material.steel), piercedPanel("保留网孔而非整块封死的后护网", [0, 1.55, .78], outline, gaps, .012, material.steel, [-90, 0, 0]), ...[-1, 1].map(side => rod("将翻座横铰轴实接到后立架的两侧托臂", [side * .8, 1.49, .78], [side * .32, 1.49, .55], .035, material.steel)), rod("座板后缘连接到后架的翻转铰轴", [-.34, 1.49, .55], [.34, 1.49, .55], .035, material.steel), box("横在水池上方而能沿后轴翻下的独立座板", [0, 1.51, .35], [.6, .035, .43], material.red), rod("顶住翻座底面的可释放短锁舌", [.28, 1.465, .25], [.38, 1.465, .25], .02, material.steel), rod("从池后延向命中靶的触发摆臂", [.8, 1.53, .78], [1.42, 1.53, -.22], .035, material.steel), cylinder("朝向投掷者的圆形独立命中靶", [1.42, 1.53, -.22], [.37, .035, .37], material.red, [90, 0, 0]), cylinder("靶面中央实际凸起的小圆心", [1.42, 1.53, -.242], [.105, .012, .105], material.ivory, [90, 0, 0]), cord("靶臂转轴联向座板锁舌的机械牵线", [[.862, 1.53, .68], [.61, 1.465, .59], [.38, 1.465, .25]], .006, material.steel), ...[-1, 1].map(side => rod("左侧入池阶梯的两根整长侧梁", [-1.08, .15, -.3 + side * .2], [-.86, 1.5, .3 + side * .2], .045, material.steel))];
    for (let index = 0; index < 4; index++) parts.push(box("连接两根阶梯侧梁的实际踏级", [-1.06 + index * .055, .35 + index * .3, -.21 + index * .134], [.33, .045, .4], material.steel));
    for (const side of [-1, 1]) parts.push(rod("池口两侧向后架相接的短护栏", [side * .78, 1.86, .15], [side * .78, 1.86, .78], .025, material.steel));
    return parts;
  } },
  { name: "摆槽滚球康格雷夫陈设钟", theme: "欧式", itemType: "器物", build: () => {
    const parts: ModelPart[] = [box("整座陈设钟的低厚木底台", [0, .021, 0], [.35, .026, .245], material.wood), ...[-1, 1].flatMap(x => [-1, 1].map(z => ball("底台四角的小圆足", [x * .142, .009, z * .093], [.025, .018, .025], material.wood))), ...[-1, 1].flatMap(x => [-1, 1].map(z => cylinder("敞开式钟架的四根细铜柱", [x * .137, .19, z * .083], [.009, .31, .009], material.wood))), ...[-1, 1].map(x => rod("两根柱顶之间的前后承梁", [x * .137, .345, -.09], [x * .137, .345, .09], .011, material.wood)), rod("横跨钟架上部承托章圈的横梁", [-.14, .345, 0], [.14, .345, 0], .012, material.wood), ...[-1, 1].map(side => rod("从前后立柱承接跷板横轴的短横托", [side * .137, .205, -.083], [side * .137, .205, .083], .012, material.wood)), rod("使中央跷板可前后微倾的真实横轴", [-.15, .205, 0], [.15, .205, 0], .008, material.steel)];
    const lane: Triple[] = Array.from({ length: 10 }, (_, index): Triple => [index % 2 ? .109 : -.109, .004, -.062 + index * .0135]);
    const rocking = [box("与球道整体摆动的薄矩形跷板", [0, 0, 0], [.24, .005, .15], material.wood), ...[-1, 1].map(side => cord("与相邻返程分隔开的连续曲折槽壁", lane.map(([x, y, z]) => [x, y, z + side * .0035] as Triple), .0013, material.steel)), ball("单一球往返释锁而非进位计数珠", [-.07, .005, -.0596], [.005, .005, .005], material.steel)];
    parts.push(rod("在拱形背架内承接中央章圈的短立骨", [0, .34, .04], [0, .44, .04], .006, material.wood), ...[[0, .395], [-.107, .36], [.107, .36]].map(([x, y]) => rod("前方章圈与后机架之间的真实短轴", [x!, y!, -.04], [x!, y!, .05], .008, material.steel)), ...moveParts(rocking, [3, 0, 0], [0, .205, 0]), ...clockDial("中央分钟章圈", [0, .395, -.025], .06), ...clockDial("左侧小时章圈", [-.107, .36, -.025], .042), ...clockDial("右侧秒钟章圈", [.107, .36, -.025], .042), cog("章圈后可见的主传动轮", [0, .299, .02], .033, .009), cog("主轮旁的分轮", [.052, .3, .02], .023, .008), cog("主轮下部的锁止轮", [0, .248, .02], .022, .008));
    for (const side of [-1, 1]) parts.push(rod("从球道末端联向上部机芯的释锁细杆", [side * .119, .205, side * .055], [side * .078, .292, .03], .003, material.steel), rod("章圈后方相连的斜承托", [side * .137, .345, .04], [0, .43, .04], .006, material.wood));
    parts.push(cylinder("后部独立发条轮鼓", [0, .3, .064], [.047, .04, .047], material.wood, [90, 0, 0]));
    return parts;
  } },
  { name: "自重下降齿条行走壁钟", theme: "欧式", itemType: "器物", build: () => {
    const teeth: [number, number][] = [[-.018, .06], [.018, .06]];
    for (let index = 0; index < 24; index++) teeth.push([.018, .075 + index * .023], [.035, .084 + index * .023], [.018, .093 + index * .023]);
    teeth.push([.018, .64], [-.018, .64]);
    const rack = polygon("整条带真实外伸齿面的下降轨", material.wood, teeth, .012, [0, 0, -.036]);
    rack.rotation.x = -90;
    const parts: ModelPart[] = [plate("上窄下宽而两端有弧肩的壁挂木底板", [0, 0, 0], [[-.065, 0], [.065, 0], [.08, .05], [.055, .11], [.055, .62], [.09, .68], [0, .73], [-.09, .68], [-.055, .62], [-.055, .11], [-.08, .05]], .026, material.wood, [0, 0, 0]), rack, ...[.12, .6].map(y => box("齿条背面实接木挂板的短垫座", [0, y, -.024], [.05, .018, .035], material.wood)), cylinder("整个机芯随自身重量滑下的圆鼓壳", [.09, .43, -.084], [.195, .055, .195], material.wood, [90, 0, 0]), cog("与长齿条相接而随钟头下降的小齿轮", [.061, .43, -.054], .031, .014), ...clockDial("前面的独立行走钟面", [.09, .43, -.113], .086), rod("牛尾摆上端实际接进钟头的短转轴", [.09, .496, -.162], [.09, .496, -.102], .006, material.steel), rod("钟面前可摆动的短牛尾摆杆", [.09, .496, -.16], [.111, .274, -.16], .004, material.steel), ball("短摆杆末端的扁重摆锤", [.111, .268, -.16], [.044, .045, .012], material.wood), loop("底板顶端的壁挂铁环", [0, .747, .005], .024, .004, [90, 0, 0], material.dark), ...[-1, 1].map(side => box("约束钟鼓前后偏移的背向滑脚", [side * .026, .43, -.018], [.019, .1, .023], material.dark))];
    return parts;
  } },
  { name: "象负联动报时自动水钟", theme: "异域", itemType: "设施", build: () => {
    const parts: ModelPart[] = [box("整座象钟共同落地的厚基台", [0, .07, 0], [1.47, .14, 2.63], material.wood), lobe("围住水力机关的完整大象长躯壳", material.ivory, [0, 1.08, .14], [.98, .92, 1.76]), lobe("与躯壳相接的宽额象首", material.ivory, [0, 1.24, -.8], [.65, .76, .71]), tapered("从象首向下弯回的长鼻", material.ivory, [[0, 1.25, -1.08], [0, .91, -1.24], [0, .57, -1.25], [0, .44, -1.08]], [.095, .075, .057, .035]), tapered("从象后躯接出的长尾", material.ivory, [[0, 1.13, .88], [0, .8, 1.08], [.1, .46, 1.04]], [.033, .022, .008]), box("直接接在象背上的厚承重鞍台", [0, 1.53, .12], [1.09, .13, 1.15], material.wood), box("鞍台上的下层书吏席座", [0, 1.64, -.24], [.63, .09, .43], material.wood), box("上层漏球报时柜的下承板", [0, 2.54, .17], [1.04, .09, 1], material.wood), box("上层报时柜薄后壁", [0, 2.75, .61], [1.02, .36, .035], material.wood), ...[-1, 1].map(side => box("上层报时柜侧颊", [side * .5, 2.75, .16], [.035, .36, .92], material.wood)), piercedPanel("保留中央真正观看开口的报时柜前板", [0, 2.75, -.3], [[-.5, -.18], [.5, -.18], [.5, .18], [-.5, .18]], [[[-.18, -.13], [-.18, .13], [.18, .13], [.18, -.13]]], .025, material.wood, [-90, 0, 0]), part("顶端可见而有薄壳的穹顶钟罩", "lathe", material.wood, [0, 2.93, .16], [1, 1, 1], [0, 0, 0], { profile: [{ x: .55, y: 0 }, { x: .5, y: .13 }, { x: .36, y: .27 }, { x: .15, y: .36 }, { x: 0, y: .38 }, { x: .15, y: .345 }, { x: .345, y: .255 }, { x: .48, y: .12 }, { x: .525, y: 0 }] }), cup("象躯内部的实际储水缸", [0, .93, .24], .24, .37, material.steel), cup("储水缸内部会缓缓下沉的小漏碗", [0, 1.12, .24], .13, .075, material.wood), cord("漏碗通向上层释放球闸的牵引索", [[0, 1.19, .24], [0, 2.43, .24], [0, 2.43, .51], [0, 2.68, .51]], .006, material.steel), box("上柜内部的斜置储球槽", [0, 2.64, .33], [.46, .035, .28], material.wood, [0, 0, 5]), cylinder("上柜与回程索之间的真实滑轮", [0, 2.43, .24], [.13, .025, .13], material.steel, [90, 0, 0]), lobe("坐在下层的书吏躯干", material.red, [0, 1.82, -.23], [.25, .34, .2]), ball("书吏的独立头部", [0, 2.05, -.25], [.145, .18, .145], material.ivory), rod("书吏的持笔前臂", [.075, 1.9, -.24], [.23, 1.79, -.4], .035, material.ivory), rod("能指示弧形刻度的长笔", [.23, 1.79, -.4], [.31, 1.7, -.45], .008, material.dark), plate("书吏前方的半圆分钟指示板", [0, 1.69, -.4], [[-.34, 0], [.34, 0], [.3, -.13], [.17, -.24], [0, -.28], [-.17, -.24], [-.3, -.13]], .017, material.ivory), lobe("象颈上方自动敲击的驭者躯干", material.wood, [0, 1.65, -.77], [.24, .3, .2]), ball("驭者的独立头部", [0, 1.85, -.77], [.13, .16, .13], material.ivory), rod("驭者向前伸出的执槌手臂", [.1, 1.72, -.8], [.14, 1.59, -.98], .035, material.ivory), rod("报时槌的细柄", [.14, 1.59, -.98], [.18, 1.47, -1.05], .014, material.wood), ball("报时槌末端小击头", [.18, 1.47, -1.05], [.06, .06, .06], material.wood), cylinder("象头前实际可敲击的小铜钹", [0, 1.4, -1.05], [.19, .016, .19], material.wood), lobe("上柜窗口内的报时操偶人躯干", material.red, [0, 2.676, -.23], [.22, .22, .16]), ball("窗口内操偶人头部", [0, 2.836, -.23], [.115, .14, .115], material.ivory), lobe("穹顶上方的报时鸟胸躯", material.wood, [0, 3.38, .15], [.2, .17, .3]), ball("顶鸟的独立小头", [0, 3.485, .04], [.09, .1, .09], material.wood), plate("顶鸟向前突出的细喙", [0, 3.485, -.005], [[0, -.012], [.09, -.018], [0, .012]], .025, material.wood, [0, 90, 0])];
    for (const x of [-1, 1]) for (const z of [-1, 1]) parts.push(tapered("象式直足实际接到躯壳与台面", material.ivory, [[x * .29, 1.02, .14 + z * .58], [x * .31, .57, .14 + z * .61], [x * .32, .21, .14 + z * .61]], [.12, .105, .105]), lobe("象足落在台面上的宽掌", material.ivory, [x * .32, .2, .14 + z * .61], [.27, .18, .3]));
    for (const side of [-1, 1]) {
      parts.push(plate("象首外侧独立的宽薄耳壳", [side * .26, 1.38, -.67], [[-.08, .22], [.16, .16], [.22, -.04], [.1, -.35], [-.08, -.26], [-.17, -.03]], .05, material.ivory, [0, side * 80, 0]), tapered("向前上弯的短象牙", material.ivory, [[side * .17, 1.1, -1.03], [side * .19, 1.03, -1.25], [side * .14, 1.11, -1.33]], [.043, .028, .002]), rod("上层钟柜的前侧立柱", [side * .45, 1.59, -.23], [side * .45, 2.5, -.23], .055, material.wood), rod("上层钟柜的后侧立柱", [side * .45, 1.59, .56], [side * .45, 2.5, .56], .055, material.wood), tapered("承接落球后绕横轴低头的长蛇身", material.wood, [[side * .52, 2.39, -.08], [side * .69, 2.27, -.14], [side * .68, 2, -.21], [side * .53, 1.89, -.21]], [.055, .06, .05, .035]), lobe("仰口接球的蛇首", material.wood, [side * .53, 2.42, -.16], [.19, .15, .2]), plate("张开的蛇上颌", [side * .53, 2.47, -.25], [[-.075, 0], [.075, 0], [.06, .025], [-.06, .025]], .03, material.wood), plate("与上颌分开的蛇下颌", [side * .53, 2.38, -.25], [[-.075, 0], [.075, 0], [.06, .025], [-.06, .025]], .03, material.wood), ball("刚离开上柜而由蛇口承接的金属球", [side * .53, 2.425, -.25], [.035, .035, .035], material.steel), rod("蛇身下方固定的横向翻转轴", [side * .48, 2.14, -.18], [side * .73, 2.14, -.18], .022, material.steel), cup("落球回收而触发驭者的侧置有底杯", [side * .52, 1.56, -.28], .12, .18, material.wood), cord("蛇臂连回内部漏碗的提碗回程绳", [[side * .66, 2.14, -.16], [side * .45, 2.45, .05], [0, 2.45, .24], [0, 1.2, .24]], .005, material.steel));
    }
    return parts;
  } },
  { name: "城堡立面日夜报时自动水钟", theme: "异域", itemType: "设施", build: () => {
    const arch: [number, number][] = [[-1.15, 2.35], [1.15, 2.35], ...Array.from({ length: 15 }, (_, index): [number, number] => { const angle = (index + 1) * Math.PI / 16; return [Math.cos(angle) * 1.15, 2.35 + Math.sin(angle) * 1.15]; })];
    const opening: [number, number][] = [[-.96, 2.42], [.96, 2.42], ...Array.from({ length: 15 }, (_, index): [number, number] => { const angle = (index + 1) * Math.PI / 16; return [Math.cos(angle) * .96, 2.42 + Math.sin(angle) * .96]; })];
    const upper = piercedPanel("上层半圆天象窗有真实开口的拱形前框", [0, 0, -.24], arch, [opening], .04, material.wood, [-90, 0, 0]);
    const parts: ModelPart[] = [box("整机立在地面的厚宽底台", [0, .09, .1], [2.69, .18, 1.15], material.wood), ...[-1, 1].map(side => box("容纳水轮与机关的整幅机柜侧颊", [side * 1.16, 1.3, .11], [.06, 2.24, .7], material.wood)), box("下层自动偶台的共同承板", [0, .49, -.02], [2.33, .055, .77], material.wood), box("两行报时窗下的宽薄台面", [0, 1.47, .04], [2.35, .045, .72], material.wood), upper, plate("天象开窗后实际存在的半圆转盘", [0, 0, .08], [[-1.04, 2.39], [1.04, 2.39], ...Array.from({ length: 15 }, (_, index): [number, number] => { const angle = (index + 1) * Math.PI / 16; return [Math.cos(angle) * 1.04, 2.39 + Math.sin(angle) * 1.04]; })], .025, material.dark, [0, 0, 0]), rod("天象转盘背后的共同水平转轴", [0, 2.39, -.04], [0, 2.39, .29], .035, material.steel), cup("后方真实开口的水位计时储水缸", [0, .54, .22], .29, .72, material.steel), ball("水缸内带动轮轴的浮子", [0, 1.12, .22], [.23, .13, .23], material.ivory), cord("浮子上行驱动天象轮的绳路", [[0, 1.13, .22], [0, 2.41, .22], [.26, 2.4, .22]], .007, material.steel), cylinder("后方牵引刻度窗的绳轮", [0, 2.39, .23], [.26, .05, .26], material.wood, [90, 0, 0]), cog("驱动逐时门序列的侧轮", [.43, 1.8, .2], .16, .035), rod("从绳轮联到门序列偏心轮的驱动杆", [.11, 2.4, .2], [.43, 1.94, .2], .018, material.steel), cylinder("拱窗内的日轮", [-.58, 2.98, .06], [.19, .018, .19], material.wood, [90, 0, 0]), cylinder("拱窗内的月轮", [.48, 3.06, .06], [.15, .018, .15], material.ivory, [90, 0, 0])];
    for (const side of [-1, 1]) {
      const holes = Array.from({ length: 6 }, (_, index): [number, number][] => { const x = side * .54 + (index - 2.5) * .18; return [[x - .075, 1.95], [x - .075, 2.23], [x + .075, 2.23], [x + .075, 1.95]]; });
      parts.push(piercedPanel("逐时开启的六扇方门真正穿透的半幅前墙", [0, 0, -.25], [[side < 0 ? -1.12 : 0, 1.5], [side < 0 ? 0 : 1.12, 1.5], [side < 0 ? 0 : 1.12, 2.35], [side < 0 ? -1.12 : 0, 2.35]], holes, .035, material.wood, [-90, 0, 0]));
      parts.push(box("下台与猎鹰机关背部连续相接的支座", [side * .83, .9, -.13], [.15, .77, .13], material.wood), cylinder("回球有底瓶下实际承重的矮柱", [side * .83, .57875, -.36], [.14, .1225, .14], material.wood), lobe("侧边投球报时的猎鹰式躯干", material.wood, [side * .83, 1.23, -.31], [.23, .32, .3]), ball("鹰的独立圆首", [side * .83, 1.43, -.39], [.14, .16, .14], material.wood), plate("将报时球放出的实际前喙", [side * .83, 1.4, -.45], [[0, -.02], [.14, -.04], [.12, .02], [0, .03]], .055, material.wood, [0, 90, 0]), cup("承接鹰嘴落球的有底金属瓶", [side * .83, .64, -.36], .13, .26, material.wood), ball("位于鹰嘴和承瓶之间的单枚落球", [side * .83, 1.13, -.46], [.045, .045, .045], material.steel));
    }
    for (let index = 0; index < 12; index++) {
      const x = (index - 5.5) * .18;
      parts.push(box("在独立方门洞内的可启闭薄门片", [x, 2.09, -.245], [.145, .265, .018], index < 4 ? material.red : material.wood, [0, index === 4 ? 24 : 0, 0]), cylinder("夜间逐一露明的下排小圆窗", [x, 1.75, -.275], [.105, .015, .105], index < 4 ? material.ivory : material.dark, [90, 0, 0]));
    }
    for (let index = 0; index < 5; index++) {
      const x = (index - 2) * .32;
      parts.push(cylinder("自动乐人头身之间实际相连的短颈", [x, .955, -.075], [.05, .1, .05], material.ivory), lobe("由下台真实承接的自动乐人胸躯", material.red, [x, .77, -.07], [.23, .39, .2]), ball("乐人的独立圆首", [x, 1.04, -.08], [.135, .165, .135], material.ivory), box("乐人衣摆下连接到台面的足座", [x, .59, -.05], [.18, .16, .17], material.wood), rod("向前执奏的分节臂", [x + .075, .87, -.08], [x + .11, .76, -.25], .027, material.ivory));
      if (index % 2) parts.push(cylinder("自动乐人面前的薄鼓盘", [x, .75, -.29], [.19, .07, .19], material.wood, [70, 0, 0]));
      else parts.push(rod("乐人执在身前的长吹管", [x, .98, -.14], [x + .13, .76, -.31], .021, material.wood));
    }
    for (let index = 0; index < 7; index++) {
      const angle = (index + 1) * Math.PI / 8;
      parts.push(ball("天象转盘上实际附着的少量星点", [Math.cos(angle) * .84, 2.42 + Math.sin(angle) * .84, .063], [.027, .027, .012], material.ivory));
    }
    return parts;
  } },
];
