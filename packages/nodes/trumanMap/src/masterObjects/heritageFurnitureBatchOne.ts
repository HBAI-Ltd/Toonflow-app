import { part, type ModelPart, type Triple } from "../assetModelParts";
import { box, cylinder, rod, cord, plate, loop, cup, ball, bars, material, type MasterPrototype } from "./parts";

// 具名家具的空间与装配取自馆藏类型，几何均为本地原创简化，未下载模型或贴图。
// 类型参考：https://www.metmuseum.org/art/collection/search/491766 （Klismos）
// https://www.gardnermuseum.org/experience/collection/11965 （箱座长椅）
// https://tcmb.culture.tw/zh-tw/detail?id=14000074960&indexCode=MOCCOLLECTIONS （亮格柜）
// https://www.si.edu/object/stool%3Anmafa_89-8-3 （凹面整木凳）

function squareFeet(width: number, depth: number, height: number, thickness = .055): ModelPart[] {
  return [-1, 1].flatMap(x => [-1, 1].map(z => box("穿榫直足", [x * width / 2, height / 2, z * depth / 2], [thickness, height, thickness], material.wood)));
}

function pull(name: string, position: Triple, width = .09): ModelPart[] {
  return [rod(`${name}左插脚`, [position[0] - width / 2, position[1], position[2]], [position[0] - width / 2, position[1], position[2] - .025], .008), rod(`${name}右插脚`, [position[0] + width / 2, position[1], position[2]], [position[0] + width / 2, position[1], position[2] - .025], .008), rod(`${name}横握`, [position[0] - width / 2, position[1], position[2] - .025], [position[0] + width / 2, position[1], position[2] - .025], .009)];
}

function shallowDrawer(position: Triple, width: number, height: number, depth: number): ModelPart[] {
  const [x, y, z] = position;
  return [box("抽斗底", [x, y - height / 2 + .009, z], [width, .018, depth], material.wood), box("抽斗前面", [x, y, z - depth / 2], [width, height, .025], material.wood), box("抽斗后板", [x, y, z + depth / 2], [width, height, .016], material.wood), ...[-1, 1].map(s => box("抽斗边墙", [x + s * (width / 2 - .008), y, z], [.016, height, depth], material.wood)), ...pull("抽斗拉手", [x, y, z - depth / 2 - .016], Math.min(.1, width / 3))];
}

function curvedSeat(name: string, halfWidth: number, bottom: number, rise: number, thickness: number, depth: number): ModelPart {
  const top = Array.from({ length: 9 }, (_, index): [number, number] => { const x = (index / 4 - 1) * halfWidth; return [x, bottom + rise * (x / halfWidth) ** 2]; });
  return plate(name, [0, 0, 0], [...top, ...top.toReversed().map(([x, y]): [number, number] => [x, y - thickness])], depth, material.wood, [0, 0, 0]);
}

export const heritageFurnitureBatchOneObjects: MasterPrototype[] = [
  { name: "圆弧搭脑折足交椅", theme: "中式", itemType: "家具", build: () => {
    const parts: ModelPart[] = [];
    for (const s of [-1, 1]) {
      parts.push(rod("通向后靠的前交足", [s * .29, .03, -.28], [s * .25, .91, .23], .044, material.wood), rod("交叉的后落地足", [s * .29, .03, .29], [s * .25, .52, -.24], .044, material.wood), cylinder("两交足的真实穿轴", [s * .27, .34, .025], [.042, .065, .042], material.steel, [0, 0, 90]), rod("扶手前竖撑", [s * .25, .52, -.22], [s * .31, .75, -.18], .032, material.wood), cord("高后低前的连续搭脑", [[s * .31, .75, -.22], [s * .34, .82, -.02], [s * .28, 1, .2], [0, 1.03, .27]], .025, material.wood));
    }
    parts.push(rod("前座横档", [-.26, .52, -.24], [.26, .52, -.24], .035, material.wood), rod("后座横档", [-.26, .52, .21], [.26, .52, .21], .035, material.wood), ...bars("绷紧的藤座条", 9, [0, .527, -.015], .44, [.045, .009, .43], 0, material.ivory), plate("弧腰独立靠背板", [0, .54, .22], [[-.065, 0], [.065, 0], [.08, .2], [.05, .47], [-.05, .47], [-.08, .2]], .018, material.wood, [-8, 0, 0]), rod("足前撑开的踏脚横枨", [-.3, .13, -.24], [.3, .13, -.24], .032, material.wood));
    return parts;
  } },
  { name: "夹头榫缩足翘头条案", theme: "中式", itemType: "家具", build: () => {
    const parts = [box("长条厚案面", [0, .88, 0], [1.94, .055, .48], material.wood), ...[-1, 1].map(s => plate("一体翘起案端", [s * .97, .87, 0], [[-.04, 0], [.04, 0], [.13, .11], [.13, .16], [.07, .15], [0, .055]].map(([x, y]): [number, number] => [s * x!, y!]), .48, material.wood, [0, 0, 0]))];
    for (const s of [-1, 1]) for (const z of [-1, 1]) parts.push(cylinder("内缩圆足夹住长牙板", [s * .62, .43, z * .17], [.064, .86, .064], material.wood), box("夹头榫外露木舌", [s * .62, .815, z * .17], [.075, .07, .068], material.dark));
    for (const z of [-1, 1]) parts.push(plate("长牙板及下垂牙头", [0, .82, z * .17], [[-.8, 0], [.8, 0], [.79, -.1], [.67, -.16], [.6, -.08], [-.6, -.08], [-.67, -.16], [-.79, -.1]], .035, material.wood, [0, 0, 0]));
    for (const s of [-1, 1]) parts.push(rod("足间下管枨", [s * .62, .2, -.17], [s * .62, .2, .17], .025, material.wood), rod("足间上管枨", [s * .62, .52, -.17], [s * .62, .52, .17], .025, material.wood));
    return parts;
  } },
  { name: "半圆月牙靠壁桌", theme: "中式", itemType: "家具", build: () => {
    const arc = Array.from({ length: 13 }, (_, i): [number, number] => [Math.cos(i * Math.PI / 12) * .69, Math.sin(i * Math.PI / 12) * .39]);
    return [plate("半圆整面直边贴墙桌板", [0, .78, -.18], arc, .045, material.wood), ...[-.55, .55].map(x => box("贴墙直边桌足", [x, .38, -.18], [.055, .76, .055], material.wood)), box("外弧中央桌足", [0, .38, -.57], [.055, .76, .055], material.wood), cord("弧形桌牙", Array.from({ length: 13 }, (_, i): Triple => [Math.cos(i * Math.PI / 12) * .63, .71, -.18 - Math.sin(i * Math.PI / 12) * .35]), .025, material.wood), rod("墙边水平托枨", [-.6, .69, -.18], [.6, .69, -.18], .035, material.wood), ...[-1, 1].map(s => rod("三足之间弧向下枨", [s * .55, .2, -.18], [0, .2, -.57], .025, material.wood))];
  } },
  { name: "顶格双扉提梁官皮箱", theme: "中式", itemType: "家具", build: () => {
    const parts = [box("箱体落地底板", [0, .018, 0], [.42, .036, .29], material.wood), box("后板", [0, .23, .137], [.4, .43, .016], material.wood), ...[-1, 1].map(s => box("箱侧板", [s * .195, .23, 0], [.018, .43, .27], material.wood)), box("顶格承底", [0, .36, 0], [.38, .02, .26], material.wood), box("上掀平盖", [0, .486, -.006], [.43, .025, .3], material.wood, [18, 0, 0]), cord("可提起的拱形大提梁", [[-.12, .486, -.006], [-.13, .59, -.006], [.13, .59, -.006], [.12, .486, -.006]], .012), box("小抽屉中隔板", [0, .2, 0], [.018, .3, .25], material.wood)];
    for (const x of [-.09, .09]) for (const y of [.11, .22, .31]) parts.push(...shallowDrawer([x, y, .005], .16, .065, .22));
    for (const s of [-1, 1]) parts.push(box("箱前向外打开的锁护门", [s * .248, .2, -.211], [.185, .34, .015], material.wood, [0, -s * 55, 0]), loop("门上小拉环", [s * .28, .2, -.264], .017, .004, [90, 0, 0]));
    return parts;
  } },
  { name: "上格下柜亮格柜", theme: "中式", itemType: "家具", build: () => {
    const parts = [...squareFeet(.72, .31, .19), ...[-1, 1].map(s => box("贯通上下格的边柱", [s * .38, .77, 0], [.05, 1.4, .38], material.wood)), box("柜背仅封下柜", [0, .47, .18], [.72, .64, .02], material.wood), ...[.18, .8, 1.43].map(y => box("框内通宽隔层", [0, y, 0], [.8, .035, .4], material.wood)), box("下柜中缝竖桩", [0, .49, -.18], [.025, .59, .025], material.wood), ...[-1, 1].map(s => box("下柜两侧板", [s * .36, .49, 0], [.02, .58, .34], material.wood))];
    for (const s of [-1, 1]) parts.push(...[.32, .66].map(y => cylinder("亮格柜门实接侧框的短合页", [s * .35, y, -.185], [.018, .065, .018], material.dark)), box("下格双门", [s * .18, .49, -.19], [.33, .57, .025], material.wood), loop("柜门提环", [s * .043, .5, -.213], .018, .004, [90, 0, 0]));
    for (const s of [-1, 1]) parts.push(rod("上亮格侧方横枨", [s * .38, 1.22, -.18], [s * .38, 1.22, .18], .018, material.wood));
    parts.push(rod("上格后方横枨", [-.38, 1.22, .18], [.38, 1.22, .18], .018, material.wood));
    return parts;
  } },
  { name: "二抽上开闷仓橱", theme: "中式", itemType: "家具", build: () => {
    const parts = [...squareFeet(1.15, .37, .29, .07), box("闷仓承底", [0, .28, 0], [1.32, .04, .51], material.wood), ...[-1, 1].map(s => box("橱两侧厚板", [s * .645, .55, 0], [.03, .52, .5], material.wood)), box("封闭闷仓前壁", [0, .46, -.24], [1.27, .32, .03], material.wood), box("橱后背板", [0, .55, .24], [1.27, .5, .025], material.wood), box("抽屉与闷仓的隔板", [0, .63, 0], [1.27, .022, .45], material.wood), box("整橱案面", [0, .82, 0], [1.42, .045, .57], material.wood), box("联二抽屉中挡", [0, .72, -.23], [.03, .162, .035], material.wood)];
    for (const s of [-1, 1]) parts.push(...[-1, 1].map(edge => box("承底隔板到抽屉底面的独立滑轨", [s * .32 + edge * .27, .648, s < 0 ? -.06 : .015], [.035, .02, .42], material.wood)), ...shallowDrawer([s * .32, .72, s < 0 ? -.06 : .015], .59, .13, .44));
    parts.push(box("闷仓中可从抽斗空位提起的活板", [0, .62, .08], [.5, .014, .22], material.dark, [12, 0, 0]));
    return parts;
  } },
  { name: "双屉灰池长火钵", theme: "日式", itemType: "家具", build: () => {
    const parts = [box("火钵木箱底", [0, .06, 0], [.91, .12, .48], material.wood), ...[-1, 1].map(s => box("长火钵侧板", [s * .44, .25, 0], [.035, .38, .48], material.wood)), ...[-1, 1].map(s => box("前后围板", [0, .25, s * .225], [.85, .38, .03], material.wood)), box("右侧实木置茶面", [.285, .44, 0], [.34, .03, .49], material.wood), ...[-1, 1].map(z => box("木箱底与灰池之间的隔热承座", [-.16, .16, z * .12], [.42, .09, .06], material.wood)), box("左侧灰池金属底", [-.16, .21, 0], [.51, .015, .37], material.dark), ...[-1, 1].map(s => box("灰池长边衬壁", [-.16, .32, s * .175], [.51, .22, .012], material.steel)), ...[-1, 1].map(s => box("灰池短边衬壁", [-.16 + s * .25, .32, 0], [.012, .22, .36], material.steel)), box("真实灰层", [-.16, .2425, 0], [.48, .05, .33], material.ivory), ...[-1, 0, 1].map(i => box("灰中燃炭块", [-.16 + i * .06, .29, i % 2 * .035], [.055, .04, .05], material.dark, [0, i * 20, 0])), loop("灰上三足五德圈", [-.16, .35, 0], .085, .007, [0, 0, 0], material.dark)];
    for (let i = 0; i < 3; i++) { const a = i * Math.PI * 2 / 3; parts.push(rod("五德直立支脚", [-.16 + Math.cos(a) * .08, .26, Math.sin(a) * .08], [-.16 + Math.cos(a) * .08, .35, Math.sin(a) * .08], .012, material.dark)); }
    for (const y of [.18, .32]) parts.push(box("右侧小抽屉前脸", [.285, y, -.25], [.28, .105, .025], material.wood), ...pull("火钵屉拉手", [.285, y, -.265], .07));
    return parts;
  } },
  { name: "横搭脑双柱衣帽桁", theme: "中式", itemType: "家具", build: () => [...[-1, 1].flatMap(s => [box("衣桁横足", [s * .52, .035, 0], [.12, .07, .5], material.wood), cylinder("穿底双立柱", [s * .52, .82, 0], [.055, 1.64, .055], material.wood), plate("夹柱壶门形牙片", [s * .52, .07, -.025], [[-.15, 0], [.15, 0], [.11, .11], [.04, .25], [-.04, .25], [-.11, .11]], .05, material.wood, [0, 0, 0])]), rod("贯通下横枨", [-.55, .3, 0], [.55, .3, 0], .035, material.wood), cord("两端上翘水平搭脑", [[-.72, 1.72, 0], [-.62, 1.65, 0], [-.5, 1.64, 0], [.5, 1.64, 0], [.62, 1.65, 0], [.72, 1.72, 0]], .034, material.wood), ...[-1, 1].map(s => plate("搭脑与立柱间透空角牙", [s * .52, 1.58, -.018], [[0, 0], [-s * .22, 0], [-s * .07, -.16], [0, -.25]], .036, material.wood, [0, 0, 0]))] },
  { name: "独扇插榫夹座屏风", theme: "中式", itemType: "家具", build: () => [...[-1, 1].flatMap(s => [box("屏座前后长足", [s * .44, .035, 0], [.13, .07, .58], material.wood), ...[-1, 1].map(z => plate("屏柱两侧夹立牙子", [s * .44, .07, z * .09], [[-.15, 0], [.15, 0], [.11, .11], [.06, .43], [-.06, .43], [-.11, .11]], .06, material.wood, [0, 0, 0])), box("从座中穿起的屏框边柱", [s * .44, 1.05, 0], [.06, 1.96, .06], material.wood)]), ...[.36, 1.96].map(y => box("独屏上下横框", [0, y, 0], [.92, .065, .06], material.wood)), box("连续独幅屏芯", [0, 1.16, 0], [.82, 1.53, .018], material.ivory), box("底座联系横梁", [0, .15, 0], [.94, .06, .065], material.wood), ...[-1, 1].map(s => cylinder("插屏紧固横销", [s * .44, .29, 0], [.025, .25, .025], material.dark, [90, 0, 0]))] },
  { name: "盆圈下层托壶盥洗架", theme: "欧式", itemType: "家具", build: () => {
    const parts = [...squareFeet(.5, .36, .73, .035), loop("承盆开口木圈", [0, .75, -.015], .235, .025, [0, 0, 0], material.wood), box("下层清水壶托板", [0, .17, 0], [.52, .025, .4], material.wood), cup("架中完整开口洗面盆", [0, .685, -.015], .225, .13, material.ivory), ...[-1, 1].map(s => rod("侧边晾巾横杆", [s * .31, .58, -.18], [s * .31, .58, .18], .02, material.wood)), ...[-1, 1].flatMap(s => [rod("晾巾杆前接臂", [s * .25, .58, -.18], [s * .31, .58, -.18], .018, material.wood), rod("晾巾杆后接臂", [s * .25, .58, .18], [s * .31, .58, .18], .018, material.wood)]), ...[-1, 1].flatMap(x => [-1, 1].map(z => { const distance = Math.hypot(x * .25, z * .18 + .015); return rod("四角腿顶与盆圈外缘之间的斜托", [x * .25, .73, z * .18], [x * .25 * .23 / distance, .75, -.015 + (z * .18 + .015) * .23 / distance], .018, material.wood); }))];
    return parts;
  } },
  { name: "交叠曲肋萨沃纳罗拉椅", theme: "欧式", itemType: "家具", build: () => {
    const parts: ModelPart[] = [];
    for (const z of [-.17, -.055, .055, .17]) for (const s of [-1, 1]) parts.push(plate("连续S形承力木肋", [0, 0, z], [[s * -.3, .025], [s * -.22, .025], [s * .04, .33], [s * .2, .49], [s * .3, .58], [s * .3, .65], [s * .22, .62], [s * -.02, .4]], .036, material.wood, [0, 0, 0]));
    for (const s of [-1, 1]) parts.push(box("曲肋上端连续扶手", [s * .28, .66, 0], [.09, .04, .55], material.wood), box("曲肋下端通长落地足", [s * .28, .025, 0], [.09, .05, .51], material.wood));
    parts.push(cylinder("全椅共用中间铰轴", [0, .345, 0], [.032, .52, .032], material.steel, [90, 0, 0]));
    parts.push(...bars("两肋之间绷紧座条", 8, [0, .495, 0], .41, [.49, .016, .042], 2, material.wood), plate("整体可拆靠背横板", [0, .65, .245], [[-.29, 0], [.29, 0], [.27, .16], [.19, .24], [-.19, .24], [-.27, .16]], .035, material.wood, [0, 0, 0]), ...[-1, 1].map(s => box("靠背下插榫", [s * .24, .665, .245], [.035, .12, .035], material.wood)));
    return parts;
  } },
  { name: "外弯腿横弧背克利斯莫斯椅", theme: "欧式", itemType: "家具", build: () => {
    const parts: ModelPart[] = [box("长方形藤编承座", [0, .46, 0], [.48, .035, .43], material.ivory), ...[-1, 1].map(s => box("座下前后横枨", [0, .42, s * .195], [.48, .045, .035], material.wood))];
    for (const s of [-1, 1]) parts.push(cord("向前外展的弯前足", [[s * .29, .018, -.31], [s * .22, .2, -.24], [s * .21, .45, -.18]], .022, material.wood), cord("后足一体向上延展背柱", [[s * .29, .018, .35], [s * .21, .23, .2], [s * .21, .48, .19], [s * .26, .82, .24]], .024, material.wood), rod("座面侧承枨", [s * .21, .42, -.19], [s * .21, .42, .2], .035, material.wood));
    const backArc = Array.from({ length: 13 }, (_, i): [number, number] => { const x = (i / 6 - 1) * .32; return [x, -.32 + .1 * (x / .32) ** 2]; });
    parts.push(plate("肩高处连续凹弧宽背板", [0, .825, 0], [...backArc, ...backArc.toReversed().map(([x, z]): [number, number] => [x, z - .03])], .15, material.wood));
    return parts;
  } },
  { name: "三足单柱罗马盘桌", theme: "欧式", itemType: "家具", build: () => {
    const parts = [cylinder("浅盘式圆台面", [0, .72, 0], [.65, .038, .65], material.ivory), loop("盘桌立起的连续口缘", [0, .745, 0], .325, .012, [0, 0, 0], material.ivory), cylinder("盘下中心承柱", [0, .42, 0], [.065, .56, .065], material.wood), cylinder("中柱颈部托盘", [0, .67, 0], [.22, .05, .22], material.wood)];
    for (let i = 0; i < 3; i++) { const a = i * Math.PI * 2 / 3, x = Math.cos(a), z = Math.sin(a); parts.push(cord("独立内收后展开的三足", [[0, .55, 0], [x * .09, .27, z * .09], [x * .23, .05, z * .23], [x * .28, .025, z * .28]], .025, material.wood), ball("足端落地垫", [x * .28, .018, z * .28], [.08, .036, .07], material.wood)); }
    return parts;
  } },
  { name: "鼓肚柜体落板写字柜", theme: "欧式", itemType: "家具", build: () => {
    const parts: ModelPart[] = [box("写字柜下层底板", [0, .18, 0], [.91, .04, .45], material.wood), ...squareFeet(.76, .31, .2, .06), box("柜背", [0, .67, .205], [.84, .96, .025], material.wood), ...[-1, 1].map(s => plate("上下内收的弧形柜侧", [s * .44, .18, .235], [[0, 0], [.42, 0], [.46, .18], [.45, .51], [.38, .93], [.04, .93], [-.03, .51], [-.04, .18]], .03, material.wood, [0, 90, 0])), box("柜顶台面", [0, 1.14, 0], [.89, .04, .46], material.ivory), box("翻下形成的写字板", [0, .76, -.39], [.81, .035, .45], material.wood), ...[-1, 1].map(s => cord("承住落板的链条", [[s * .36, 1.03, -.2], [s * .36, .78, -.6]], .004)), box("书写内格后板", [0, .94, .13], [.78, .34, .03], material.wood), box("写字格下搁板", [0, .765, -.01], [.855, .025, .42], material.wood)];
    parts.push(rod("落板与内搁板相接的通长短合页轴", [-.4, .76, -.21], [.4, .76, -.21], .012, material.steel), ...[-1, 1].map(s => rod("写字柜侧壁接住支链的短固定耳", [s * .36, 1.03, -.2], [s * .44, 1.03, -.15], .012, material.steel)));
    for (const s of [-1, 1]) for (const y of [.89, 1.035]) parts.push(box("内部文书小格横板", [s * .25, y, .04], [.22, .015, .23], material.wood));
    for (const s of [-1, 1]) parts.push(box("内格竖隔", [s * .13, .95, .04], [.018, .31, .23], material.wood));
    for (const y of [.35, .57]) parts.push(box("曲面抽屉内底实接两侧柜身", [0, y - .08, -.045], [.86, .02, .41], material.wood), box("曲面抽屉独立短后壁", [0, y, .15], [.86, .18, .015], material.wood), ...[-1, 1].map(s => box("曲面抽屉薄侧壁", [s * .419, y, -.045], [.022, .18, .41], material.wood)), box("鼓肚下柜曲面抽屉", [0, y, -.27], [.85, .18, .05], material.wood), ...[-1, 1].flatMap(s => pull("抽屉黄铜握", [s * .22, y, -.3], .09)));
    return parts;
  } },
  { name: "翻镜折翼梳妆桌", theme: "欧式", itemType: "家具", build: () => {
    const parts = [...squareFeet(.82, .37, .7, .04), box("梳妆桌底厢", [0, .72, 0], [.96, .08, .48], material.wood), box("中间独立浅妆槽", [0, .78, 0], [.39, .04, .42], material.wood), ...[-1, 1].map(s => box("妆槽纵向分仓板", [s * .2, .81, 0], [.018, .08, .44], material.wood)), box("向后翻起的中部镜板", [0, .98, .16], [.39, .38, .025], material.wood, [-15, 0, 0]), box("翻盖背面的单幅镜面", [0, .98, .139], [.33, .31, .006], material.glass, [-15, 0, 0]), ...[-1, 1].map(s => box("两翼可独立上翻的妆匣盖", [s * .38, .86, .015], [.33, .025, .45], material.wood, [0, 0, -s * 27])), ...[-1, 1].map(s => box("两翼匣外墙", [s * .47, .81, 0], [.02, .13, .47], material.wood)), ...[-1, 1].map(s => box("妆匣前后围板", [0, .8, s * .23], [.94, .11, .02], material.wood)), box("膝前窄抽屉面", [0, .7, -.251], [.7, .07, .04], material.wood), ...pull("梳妆屉握", [0, .7, -.272], .09)];
    return parts;
  } },
  { name: "摆锤透窗长箱落地钟", theme: "欧式", itemType: "家具", build: () => {
    const parts = [box("钟箱宽底脚", [0, .06, 0], [.49, .12, .31], material.wood), box("下部独立底厢", [0, .23, 0], [.42, .29, .27], material.wood), ...[-1, 1].map(s => box("长钟侧壁", [s * .19, 1.02, 0], [.025, 1.35, .27], material.wood)), box("钟箱背板", [0, 1.02, .12], [.36, 1.35, .02], material.wood), ...[.38, 1.65].map(y => box("透窗上下框", [0, y, -.13], [.4, .045, .035], material.wood)), ...[-1, 1].map(s => box("门窗边框", [s * .17, 1.02, -.13], [.035, 1.27, .035], material.wood)), box("可见内部摆锤的玻璃门", [0, 1.015, -.128], [.315, 1.255, .006], material.glass), rod("机芯悬下的细摆杆", [0, 1.76, -.02], [0, .55, -.02], .009), cylinder("铜质摆锤盘", [0, .56, -.02], [.15, .025, .15], material.steel, [90, 0, 0]), ...[-1, 1].map(s => cylinder("独立驱动配重", [s * .1, 1.13, .025], [.045, .19, .045], material.steel)), ...[-1, 1].map(s => rod("挂重细链", [s * .1, 1.7, .025], [s * .1, 1.13, .025], .003)), box("钟头上罩", [0, 1.89, 0], [.53, .46, .33], material.wood), cylinder("钟头圆形表盘", [0, 1.9, -.173], [.35, .015, .35], material.ivory, [90, 0, 0]), rod("时针", [0, 1.9, -.185], [-.08, 1.95, -.185], .01, material.dark), rod("分针", [0, 1.9, -.188], [.03, 2.04, -.188], .008, material.dark), box("上冠檐板", [0, 2.14, 0], [.58, .05, .37], material.wood)];
    for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6; parts.push(box("表盘独立时标", [Math.sin(a) * .145, 1.9 + Math.cos(a) * .145, -.185], [.012, .025, .004], material.dark, [0, 0, -i * 30])); }
    return parts;
  } },
  { name: "高围板梳背定座长椅", theme: "欧式", itemType: "家具", build: () => {
    const parts = [box("长椅厚座", [0, .46, 0], [1.66, .055, .49], material.wood), ...squareFeet(1.37, .32, .45, .055), ...[-1, 1].map(s => box("高围背两侧立柱", [s * .77, .93, .215], [.065, 1.38, .065], material.wood)), box("高背顶冠横板", [0, 1.6, .215], [1.7, .1, .065], material.wood), box("梳背下封板", [0, .83, .215], [1.48, .65, .03], material.wood), ...bars("高处透空梳背竖棂", 13, [0, 1.34, .215], 1.42, [.025, .47, .025], 0, material.wood), ...[-1, 1].map(s => box("挡风长椅侧扶臂", [s * .8, .71, -.015], [.06, .05, .52], material.wood)), ...[-1, 1].map(s => box("前端扶手立柱", [s * .8, .57, -.23], [.05, .3, .05], material.wood)), ...[-1, 1].map(s => rod("连接前后足而承接中央长枨的端横枨", [s * .685, .2, -.16], [s * .685, .2, .16], .045, material.wood)), box("下方贯通撑梁", [0, .2, 0], [1.4, .05, .05], material.wood)];
    return parts;
  } },
  { name: "箱座高背储物长椅", theme: "欧式", itemType: "家具", build: () => {
    const parts = [box("中空箱座承底", [0, .06, 0], [1.65, .12, .54], material.wood), ...[-1, 1].map(s => box("储物箱厚侧壁", [s * .795, .27, 0], [.055, .42, .54], material.wood)), ...[-1, 1].map(s => box("储物箱前后长壁", [0, .27, s * .25], [1.55, .42, .04], material.wood)), box("一半闭合承坐箱盖", [-.4, .49, 0], [.8, .045, .56], material.wood), box("另一半掀起显示真实箱腔的箱盖", [.4, .72, .19], [.8, .5, .04], material.wood, [-20, 0, 0]), box("高背厚底横枋", [0, .67, .265], [1.69, .36, .05], material.wood), box("高背上部整幅镶板", [0, 1.1, .265], [1.58, .55, .032], material.wood), ...[-1, 1].map(s => box("箱后通高边柱", [s * .81, .91, .265], [.07, 1.04, .07], material.wood)), box("背板上冠", [0, 1.4, .265], [1.77, .09, .08], material.wood)];
    for (const s of [-1, 1]) parts.push(plate("箱座前后连接的宽扶手", [s * .8, .5, -.25], [[0, 0], [.5, 0], [.5, .28], [.38, .33], [.1, .27], [0, .2]], .07, material.wood, [0, -90, 0]));
    return parts;
  } },
  { name: "斜壁醒面槽兼盖板桌", theme: "欧式", itemType: "家具", build: () => {
    const parts = [...squareFeet(.88, .42, .61, .06), ...[-1, 1].map(s => box("醒面槽窄底下接到四足的横托", [s * .44, .6, 0], [.075, .05, .48], material.wood)), ...[-1, 1].map(s => rod("联系横枨两端实接前后足的短枨", [s * .44, .22, -.21], [s * .44, .22, .21], .045, material.wood)), ...[-1, 1].map(s => rod("承放下层半幅槽盖的前后通长托枨", [-.44, .29, s * .18], [.44, .29, s * .18], .03, material.wood)), box("醒面槽窄底板", [0, .62, 0], [.91, .035, .34], material.wood), ...[-1, 1].map(s => box("向上外张的长槽壁", [0, .74, s * .235], [.98, .25, .025], material.wood, [s * 27, 0, 0])), ...[-1, 1].map(s => plate("梯形槽端封板", [s * .49, .62, -.017], [[-.17, 0], [.17, 0], [.29, .24], [-.29, .24]], .03, material.wood, [0, 90, 0])), box("槽上半块可移下的揉面桌盖", [-.27, .876, 0], [.53, .04, .62], material.wood), box("放在下层保持外露的另一块盖板", [.16, .3, 0], [.53, .035, .62], material.wood), ...[-1, 1].map(s => box("腿间承盖下枨", [s * .44, .28, 0], [.05, .05, .5], material.wood)), box("两端联系横枨", [0, .22, 0], [.92, .045, .045], material.wood)];
    return parts;
  } },
  { name: "翼开文格收纳写字柜", theme: "欧式", itemType: "家具", build: () => {
    const parts: ModelPart[] = [box("立柜低平台", [0, .09, .03], [1.04, .18, .52], material.wood), ...[-1, 1].map(s => box("中心柜侧壁", [s * .38, .84, .09], [.04, 1.36, .38], material.wood)), box("文格柜后板", [0, .84, .26], [.76, 1.36, .025], material.wood), box("顶冠", [0, 1.55, .08], [.86, .06, .44], material.wood), box("前翻写字板", [0, .78, -.31], [.72, .035, .47], material.wood), ...[-1, 1].map(s => rod("写字板前沿支撑斜杆", [s * .3, .42, .02], [s * .3, .76, -.52], .018, material.wood)), ...[.39, .76, 1.09, 1.43].map(y => box("中心横隔层", [0, y, .07], [.75, .025, .35], material.wood))];
    for (const x of [-.25, 0, .25]) parts.push(box("上部竖向文格", [x, 1.24, .08], [.014, .63, .34], material.wood));
    for (const s of [-1, 1]) {
      const wing = [box("向外展开的厚文格翼背板", [s * .26, .91, 0], [.52, 1.2, .025], material.wood), ...[.34, .63, .94, 1.23, 1.5].map(y => box("翼内文件托盘", [s * .26, y, -.09], [.49, .018, .18], material.wood)), ...[0, .52].map(edge => box("文格翼外沿立边", [s * edge, .92, -.09], [.018, 1.18, .18], material.wood)), ...[.49, .79, 1.09, 1.38].map(y => box("翼内短分格", [s * .26, y, -.09], [.015, .25, .18], material.wood))];
      const angle = s * 18 * Math.PI / 180;
      for (const value of wing) {
        const { x, z } = value.position;
        value.position.x = s * .4 + x * Math.cos(angle) + z * Math.sin(angle);
        value.position.z = -.12 - x * Math.sin(angle) + z * Math.cos(angle);
        value.rotation.y = s * 18;
        parts.push(value);
      }
    }
    return parts;
  } },
  { name: "十字分格旋转书柜", theme: "欧式", itemType: "家具", build: () => {
    const parts = [box("不旋转的底座", [0, .045, 0], [.62, .09, .62], material.wood), cylinder("底座内真实回转轴承", [0, .115, 0], [.36, .06, .36], material.dark), cylinder("穿过四层书格的中轴", [0, .68, 0], [.045, 1.12, .045], material.steel), ...[.16, .49, .82, 1.15].map(y => box("可回转的独立方搁层", [0, y, 0], [.65, .025, .65], material.wood))];
    for (const y of [.325, .655, .985]) parts.push(box("东西贯通的十字隔板", [0, y, 0], [.59, .29, .018], material.wood), box("南北贯通的十字隔板", [0, y, 0], [.018, .29, .59], material.wood));
    for (const x of [-1, 1]) for (const z of [-1, 1]) parts.push(box("角部通高细柱", [x * .305, .655, z * .305], [.025, 1.02, .025], material.wood));
    for (const y of [.25, .58, .91]) for (const s of [-1, 1]) parts.push(rod("外缘保书横杆", [-.3, y, s * .31], [.3, y, s * .31], .012, material.wood), rod("外缘侧保书横杆", [s * .31, y, -.3], [s * .31, y, .3], .012, material.wood));
    return parts;
  } },
  { name: "立轴双面回转唱经台", theme: "欧式", itemType: "家具", build: () => {
    const parts = [cylinder("唱经台中央立柱", [0, .66, 0], [.1, 1.15, .1], material.wood), cylinder("允许上部双面书托回转的轴颈", [0, 1.25, 0], [.07, .22, .07], material.steel), ...[-1, 1].map(s => box("背靠背斜置大开本书托", [0, 1.36, s * .16], [.65, .035, .44], material.wood, [-s * 40, 0, 0])), ...[-1, 1].map(s => rod("双向托板下沿挡书横条", [-.31, 1.23, s * .33], [.31, 1.23, s * .33], .025, material.wood)), rod("两托面的共同上脊", [-.33, 1.5, 0], [.33, 1.5, 0], .025, material.wood)];
    for (let i = 0; i < 3; i++) { const a = i * Math.PI * 2 / 3; parts.push(rod("三向撑开的唱经台足", [0, .26, 0], [Math.cos(a) * .29, .025, Math.sin(a) * .29], .055, material.wood), ball("三足端落地块", [Math.cos(a) * .29, .025, Math.sin(a) * .29], [.1, .05, .1], material.wood)); }
    return parts;
  } },
  { name: "凹托单柱埃及木头枕", theme: "异域", itemType: "家具", build: () => [box("扁平长方稳座", [0, .014, 0], [.29, .028, .13], material.wood), part("中间内收头枕柱", "lathe", material.wood, [0, .028, 0], [1, 1, 1], [0, 0, 0], { profile: [{ x: 0, y: 0 }, { x: .035, y: 0 }, { x: .024, y: .06 }, { x: .032, y: .12 }, { x: 0, y: .12 }] }), curvedSeat("直接托住头部的凹弧宽板", .155, .175, .085, .028, .1), cylinder("柱首连接凹托的承盘", [0, .153, 0], [.085, .025, .085], material.wood)] },
  { name: "弧面开窗整木阿善提凳", theme: "异域", itemType: "家具", build: () => {
    const parts = [box("完整矩形落地基座", [0, .025, 0], [.5, .05, .25], material.wood), curvedSeat("两端上翘的整木承坐面", .265, .34, .055, .035, .25), ...[-1, 1].map(s => box("连接底座的外侧承柱", [s * .19, .19, 0], [.045, .29, .16], material.wood)), ...[-1, 1].map(s => box("中心透窗立边", [s * .065, .19, 0], [.035, .27, .17], material.wood)), ...[.08, .3].map(y => box("中心透窗上下实木连梁", [0, y, 0], [.16, .04, .17], material.wood))];
    return parts;
  } },
  { name: "泰诺四足弯背杜霍礼座", theme: "异域", itemType: "家具", build: () => {
    const sideProfile: [number, number][] = [[-.27, .16], [-.14, .125], [.04, .14], [.17, .22], [.29, .41], [.34, .48], [.38, .47], [.33, .38], [.2, .19], [.06, .105], [-.14, .09], [-.27, .125]];
    const parts = [plate("整块木材连续低座及后仰背", [0, 0, 0], sideProfile, .28, material.wood, [0, -90, 0]), ...[-1, 1].flatMap(s => [-1, 1].map(z => rod("蹲伏四足", [s * .12, .025, z * .17], [s * .115, z > 0 ? .22 : .145, z * .14], .045, material.wood))), ball("前端连续伸出的象征头", [0, .17, -.31], [.12, .105, .13], material.wood), ...[-1, 1].map(s => ball("礼座前首耳部", [s * .068, .18, -.3], [.028, .045, .024], material.wood)), ...[-1, 1].map(s => ball("前首嵌入眼", [s * .032, .19, -.365], [.013, .012, .006], material.ivory)), box("前首窄口", [0, .145, -.37], [.049, .008, .006], material.dark)];
    return parts;
  } },
];
