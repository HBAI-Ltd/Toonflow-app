import { combineMeshes, design, lobe, polygon, sweptProfile, tapered } from "./shared";
import type { MasterNatureDesign, ModelPart, Triple } from "./shared";
import { hollowPipe, strip } from "./shapedFoods";

const brown = "#8d9771";
const pale = "#b2b18a";
const dark = "#687b61";
const green = "#85a274";
const fiber = "#5d6852";

function blade(name: string, color: string, path: Triple[], width: number, thickness: number, taper = .9): ModelPart {
  const item = strip(name, color, path, width, thickness);
  item.vertices = item.vertices!.map((vertex, i) => {
    const row = Math.floor(i / 4), t = row / (path.length - 1), center = path[row]!;
    const breadth = .13 + .87 * Math.pow(Math.sin(Math.PI * (.04 + t * .92)), .55);
    const factor = breadth * (1 - taper * t * .72);
    return { x: center[0] + (vertex.x - center[0]) * factor, y: center[1] + (vertex.y - center[1]) * factor, z: center[2] + (vertex.z - center[2]) * factor };
  });
  return item;
}

function holdfast(parts: ModelPart[], radius: number, height: number): void {
  const roots: ModelPart[] = [];
  for (let i = 0; i < 10; i++) {
    const a = i * Math.PI / 5;
    const joint: Triple = [Math.cos(a) * radius * .58, height * .42, Math.sin(a) * radius * .58];
    roots.push(tapered("固着器相互分叉而不作植物真根的抓附丝", brown, [[0, height, 0], joint, [Math.cos(a + .18) * radius, .004, Math.sin(a + .18) * radius]], [radius * .11, radius * .07, radius * .018]));
    roots.push(tapered("抓附丝近岩面处的第二分叉", brown, [joint, [Math.cos(a - .28) * radius * .93, .004, Math.sin(a - .28) * radius * .93]], [radius * .055, radius * .014]));
  }
  for (let i = 0; i < roots.length; i += 8) parts.push(combineMeshes("同一完整藻体的枝状固着器", brown, roots.slice(i, i + 8)));
}

function gasCapsule(name: string, root: Triple, radius: number, height: number): ModelPart {
  const wall = Math.min(radius * .15, height * .1);
  const item = sweptProfile(name, pale, [[0, -height / 2], [radius * .58, -height * .42], [radius, -height * .18], [radius, height * .18], [radius * .55, height * .44], [0, height / 2], [0, height / 2 - wall], [radius * .49, height * .42 - wall], [radius - wall, height * .18], [radius - wall, -height * .18], [radius * .52, -height * .42 + wall], [0, -height / 2 + wall]], Math.PI * 2, 20);
  item.position = { x: root[0], y: root[1], z: root[2] };
  return item;
}

// https://www.sciencedirect.com/science/article/abs/pii/S0022098102000072
function durvillaea(): ModelPart[] {
  const parts: ModelPart[] = [lobe("南极杜氏藻宽大坚韧的完整盘状固着器", brown, [0, .035, 0], [.42, .075, .38]), tapered("厚而短的杜氏藻柄", brown, [[0, .04, 0], [.035, .29, .015]], [.092, .075])];
  const palm = polygon("厚柄连续扩展成掌状分带基部", brown, [[-.06, .24], [-.22, .53], [-.31, .66], [-.18, .76], [.24, .76], [.34, .62], [.18, .44], [.075, .24]], .023);
  palm.rotation.x = -90;
  parts.push(palm);
  for (let i = 0; i < 6; i++) {
    const x = -.23 + i * .096, side = i < 3 ? -1 : 1, z = (i % 2 - .5) * .04;
    const fork: Triple = [x * 1.8, 1.28 + i % 3 * .11, z + .11];
    parts.push(blade("杜氏藻含内部蜂窝髓质而外表完整的厚革质带", brown, [[x, .65, .013], [x * 1.2, .94, z], fork], .095, .014, .3));
    for (const branch of [-1, 1]) {
      const path: Triple[] = Array.from({ length: 17 }, (_, j) => {
        const t = j / 16;
        return [fork[0] + (side * .35 + branch * .18) * t, fork[1] + t * (1.55 + i % 2 * .3) + Math.sin(t * Math.PI) * .12, fork[2] + t * .3 + Math.sin(t * Math.PI * 2 + i) * .065 * t];
      });
      parts.push(blade("掌带末端再次真二分的无外露气囊长藻带", brown, path, .092 - i % 2 * .009, .012, .6));
    }
  }
  // ACT: 蜂窝是闭合藻片内部组织，不把真实完整叶片挖成外露蜂巢或另加球气囊。
  return parts;
}

// https://www.dffe.gov.za/sites/default/files/Pdf-Files/guidelines-and-policies/guidetokelp_harvestinginsouthafrica.pdf
// https://pmc.ncbi.nlm.nih.gov/articles/PMC11093989/
function ecklonia(): ModelPart[] {
  const parts: ModelPart[] = [];
  holdfast(parts, .19, .16);
  const stem = hollowPipe("海竹藻完整的粗中空长柄", [[0, .12, 0], [-.045, 1.7, .02], [.08, 3.35, .03], [0, 4.52, 0]], .046, .035);
  stem.color = brown;
  parts.push(stem, gasCapsule("长柄顶端连续膨大的闭壁浮囊", [0, 4.61, 0], .112, .34));
  const primary: Triple[] = Array.from({ length: 13 }, (_, i) => { const t = i / 12; return [0, 4.75 + Math.sin(t * Math.PI) * .09, t * .58]; });
  parts.push(blade("成熟海竹藻气囊上方缩短的菱形主叶", brown, primary, .24, .011, .55));
  for (let i = 0; i < 6; i++) for (const side of [-1, 1]) {
    const z = .07 + i * .078, root: Triple = [side * (.037 + Math.sin((i + 1) / 7 * Math.PI) * .044), 4.75 + Math.sin(z / .58 * Math.PI) * .09, z];
    const path: Triple[] = Array.from({ length: 17 }, (_, j) => { const t = j / 16; return [root[0] + side * t * (1.15 - i * .045), root[1] + Math.sin(t * Math.PI) * .13 - t * .48, root[2] + t * .42 + Math.sin(t * 7 + i) * .035 * t]; });
    parts.push(blade("沿主叶两侧逐对长出的连续长次级藻片", brown, path, .16, .005, .5));
  }
  return parts;
}

// https://seaweed.ie/descriptions/Alaria_esculenta.html
function alaria(): ModelPart[] {
  const parts: ModelPart[] = [];
  holdfast(parts, .065, .075);
  const path: Triple[] = Array.from({ length: 29 }, (_, i) => { const t = i / 28; return [.09 * Math.sin(t * Math.PI), .27 + t * 2.05, .075 * Math.sin(t * Math.PI * 1.4)]; });
  const lamina = blade("翅藻未羽裂且两缘柔软起伏的完整长叶", brown, path, .28, .004, .45);
  lamina.vertices = lamina.vertices!.map((v, i) => ({ ...v, z: v.z + (i % 4 === 0 || i % 4 === 3 ? 1 : -1) * Math.sin(Math.floor(i / 4) * 1.1) * .012 }));
  parts.push(lamina, tapered("从短柄贯穿整片叶的圆柱形中肋", pale, [[0, .06, 0], [0, .27, 0], ...path.slice(1)], [ .012, ...path.map((_, i) => .011 * (1 - i / path.length * .8)) ]));
  for (let i = 0; i < 7; i++) for (const side of [-1, 1]) {
    const y = .08 + i * .024, tip: Triple = [side * (.12 + Math.sin(i / 6 * Math.PI) * .025), y + .045, .015];
    parts.push(blade("独立着生在短柄两排的扁平孢子叶", dark, [[0, y, 0], [tip[0] * .6, y + .027, .008], tip], .04, .003, .5));
  }
  return parts;
}

// https://www.seaweed.ie/descriptions/Saccorhiza_polyschides.php
function saccorhiza(): ModelPart[] {
  const parts: ModelPart[] = [];
  const bulb = sweptProfile("囊根藻底部开放且内部真正中空的疣状固着球", brown, [[.145, .018], [.175, .1], [.17, .17], [.11, .24], [.023, .27], [.016, .261], [.103, .228], [.158, .163], [.164, .1], [.134, .025]], Math.PI * 2, 24);
  parts.push(bulb);
  const haptera: ModelPart[] = [];
  for (let i = 0; i < 8; i++) {
    const a = i * Math.PI / 4;
    haptera.push(tapered("固着球下缘与基底相连的指状抓附器", brown, [[Math.cos(a) * .137, .04, Math.sin(a) * .137], [Math.cos(a + .06) * .18, .017, Math.sin(a + .06) * .18], [Math.cos(a + .1) * .205, .005, Math.sin(a + .1) * .205]], [.014, .009, .003]));
  }
  parts.push(combineMeshes("不封堵球内腔的八条下缘抓附器", brown, haptera));
  const warts: ModelPart[] = [];
  for (let i = 0; i < 22; i++) {
    const a = i * 2.4, y = .055 + i % 4 * .043, r = y > .17 ? .135 : .166;
    warts.push(lobe("固着球壁上真实隆起的圆疣", pale, [Math.cos(a) * r, y, Math.sin(a) * r], [.037, .038, .037]));
  }
  for (let i = 0; i < warts.length; i += 18) parts.push(combineMeshes("固着球与外壁相接的圆疣组", pale, warts.slice(i, i + 18)));
  const stipePath: Triple[] = Array.from({ length: 13 }, (_, i) => [0, .255 + i * .038, 0]);
  const stipe = strip("囊根藻底部扭转的扁平桨柄", brown, stipePath, .07, .009);
  stipe.vertices = stipe.vertices!.map((v, i) => { const row = Math.floor(i / 4), a = Math.min(1, row / 8) * Math.PI / 2, width = .6 + Math.min(1, row / 5) * .4; return { x: v.x * width * Math.cos(a) - v.z * Math.sin(a), y: v.y, z: v.x * width * Math.sin(a) + v.z * Math.cos(a) }; });
  parts.push(stipe);
  for (const side of [-1, 1]) {
    const path: Triple[] = Array.from({ length: 21 }, (_, i) => { const t = i / 20, y = .29 + t * .27, a = Math.min(1, (y - .255) / .304) * Math.PI / 2; return [side * (.03 * Math.cos(a) + Math.sin(t * Math.PI * 5) * .012), y, side * .03 * Math.sin(a) + Math.cos(t * Math.PI * 5) * .018]; });
    parts.push(strip("扁柄基部左右真正立体波褶的裙缘", brown, path, .042, .004));
  }
  const palm = polygon("柄顶连续展开而没有中肋的掌裂叶基", brown, [[-.008, .69], [-.22, .91], [-.31, 1.02], [.31, 1.02], [.2, .89], [.008, .69]], .005);
  palm.rotation.x = -90;
  parts.push(palm);
  for (let i = 0; i < 9; i++) {
    const x = -.275 + i * .069, path: Triple[] = Array.from({ length: 17 }, (_, j) => { const t = j / 16; return [x + (i - 4) * .045 * t, 1 + t * (1.25 - Math.abs(i - 4) * .11), Math.sin(t * Math.PI * 1.5 + i) * .055 * t]; });
    parts.push(blade("同一掌叶分出的连续狭长带状裂片", brown, path, .066, .004, .55));
  }
  return parts;
}

// https://biomar.fciencias.unam.mx/Sobretiros/Informacion%20algas/Algas/Feofitas/Vasquez%20et%20al%202000%2801%29.pdf
function lessonia(): ModelPart[] {
  const parts: ModelPart[] = [lobe("树状莱氏藻厚而不规则的固着盘", brown, [0, .042, 0], [.34, .095, .3])];
  holdfast(parts, .18, .105);
  for (let i = 0; i < 3; i++) {
    const x = (i - 1) * .13, z = (i % 2 - .5) * .09, root: Triple = [x, .83 + i % 2 * .11, z];
    const stipe = hollowPipe("不靠气囊而坚挺直立的粗中空藻柄", [[0, .07, 0], [x * .6, .44, z * .6], root], .027, .016);
    stipe.color = brown;
    parts.push(stipe);
    for (const side of [-1, 1]) {
      const tip: Triple = [x + side * .22, root[1] + .32, z + side * .025];
      const branch = hollowPipe("粗柄顶端真正二歧的坚韧短分柄", [root, [x + side * .12, root[1] + .2, z], tip], .018, .01);
      branch.color = brown;
      parts.push(branch);
      const path: Triple[] = Array.from({ length: 19 }, (_, j) => { const t = j / 18; return [tip[0] + side * .3 * t, tip[1] + t * .97 - Math.sin(t * Math.PI / 2) * .14, tip[2] + .11 * Math.sin(t * Math.PI)]; });
      parts.push(blade("每个坚柄终端连续生出的长剑形叶状体", brown, path, .115, .006, .6));
    }
  }
  return parts;
}

// https://www.fao.org/4/x5819e/x5819e04.htm
function ascophyllum(): ModelPart[] {
  const parts: ModelPart[] = [lobe("泡叶藻同一藻体基部的圆盘固着器", brown, [0, .006, 0], [.07, .018, .06])];
  const bands: ModelPart[] = [], stalks: ModelPart[] = [], receptacles: ModelPart[] = [];
  const axes: Triple[][] = [[[0, .01, 0], [0, .31, 0], [.035, .63, .012], [.065, .99, .035], [.11, 1.36, .04]], [[0, .31, 0], [-.11, .53, -.008], [-.2, .82, .005], [-.27, 1.13, .03]], [[.035, .63, .012], [.18, .86, -.03], [.27, 1.17, -.04]]];
  for (const axis of axes) for (let j = 0; j < axis.length - 1; j++) {
    const a = axis[j]!, b = axis[j + 1]!, center: Triple = [a[0] + (b[0] - a[0]) * .67, a[1] + (b[1] - a[1]) * .67, a[2] + (b[2] - a[2]) * .67];
    const before: Triple = [center[0], center[1] - .036, center[2]], after: Triple = [center[0], center[1] + .036, center[2]];
    bands.push(strip("泡叶藻没有中肋的厚窄扁带在气室前的连续段", brown, [a, before], .012, .0035), strip("气室之后延续并重新变窄的扁带", brown, [after, b], .012, .0035));
    parts.push(gasCapsule("只沿藻带轴线串联而非成对外挂的真中空气室", center, .012, .075));
    for (const side of [-1, 1]) {
      const base: Triple = [a[0] + (before[0] - a[0]) * .5, a[1] + (before[1] - a[1]) * .5, a[2] + (before[2] - a[2]) * .5];
      const end: Triple = [base[0] + side * .031, base[1] + .025, base[2]];
      stalks.push(tapered("主带两侧独立小生殖托的短柄", brown, [base, end], [.0025, .002]));
      receptacles.push(lobe("有柄而不混作浮囊的椭圆生殖托", pale, end, [.016, .025, .012]));
    }
  }
  parts.push(combineMeshes("泡叶藻绕过真实气室内腔的连续厚窄带", brown, bands), combineMeshes("两侧生殖托的相连独立短柄", brown, stalks), combineMeshes("与气室分工不同的椭圆生殖托组", pale, receptacles));
  return parts;
}

// https://seaweed.ie/descriptions/Himanthalia_elongata.html
function himanthalia(): ModelPart[] {
  const button = sweptProfile("海条藻小于三厘米的钮扣状营养体", brown, [[0, 0], [.004, 0], [.005, .012], [.014, .02], [.015, .025], [.007, .025], [0, .022]], Math.PI * 2, 20);
  const parts: ModelPart[] = [button];
  for (const side of [-1, 1]) {
    const root: Triple = [side * .005, .023, 0], fork: Triple = [side * .14, .87, .04];
    parts.push(strip("钮扣顶长出的两根长带状生殖托", brown, [root, [side * .06, .42, .035], fork], .008, .0018));
    for (const end of [-1, 1]) {
      const path: Triple[] = Array.from({ length: 19 }, (_, i) => { const t = i / 18; return [fork[0] + side * .12 * t + end * .09 * t, fork[1] + t * .98, fork[2] + t * .13 + Math.sin(t * 6) * .035 * t]; });
      parts.push(strip("长生殖托顶端稀疏二歧且没有另生营养叶片", brown, path, .008, .0018));
    }
  }
  return parts;
}

// https://www.efloras.org/florataxon.aspx?flora_id=2&taxon_id=242320436
function enhalus(): ModelPart[] {
  const parts: ModelPart[] = [tapered("海菖蒲粗硬的匍匐根茎", brown, [[-.065, .042, 0], [0, .041, 0], [.06, .04, .008]], [.0075, .008, .007]), lobe("五片长叶共同包裹的透明扁鞘基", pale, [0, .091, 0], [.021, .12, .018])];
  parts[1]!.opacity = .66;
  const roots: ModelPart[] = [], bristles: ModelPart[] = [];
  for (let i = 0; i < 9; i++) {
    const x = -.05 + i * .012;
    roots.push(tapered("根茎下方独立而不分枝的绳状真根", pale, [[x, .039, .002], [x + .015, .018, .025], [x + .024, .002, .07 + i % 3 * .014]], [.0018, .0016, .0009]));
  }
  for (let i = 0; i < 32; i++) {
    const a = i * 2.4, x = (i % 5 - 2) * .014;
    bristles.push(tapered("旧叶鞘留下且附着在根茎上的黑硬纤维", fiber, [[x, .042, .002], [x + Math.cos(a) * .025, .095, Math.sin(a) * .024], [x + Math.cos(a) * .039, .15 + i % 3 * .018, Math.sin(a) * .036]], [.00065, .0005, .00012]));
  }
  parts.push(combineMeshes("海菖蒲根茎相连的独立绳根", pale, roots));
  for (let i = 0; i < bristles.length; i += 12) parts.push(combineMeshes("海菖蒲特征性黑纤维鞘束", fiber, bristles.slice(i, i + 12)));
  for (let i = 0; i < 5; i++) {
    const side = i % 2 ? 1 : -1, height = 1.22 + i % 3 * .11, path: Triple[] = Array.from({ length: 23 }, (_, j) => { const t = j / 22; return [side * .19 * t * t, .045 + t * height, (i - 2) * .003 + Math.sin(t * Math.PI) * (i - 2) * .035]; });
    parts.push(strip("宽仅一至两厘米且圆钝端的长海草带叶", green, path, .015, .0009));
    for (const edge of [-1, 1]) parts.push(tapered("沿叶缘连续内卷而加厚的韧纤维束", dark, path.map(point => [point[0] + edge * .0069, point[1], point[2] + .0008]), path.map(() => .00065)));
  }
  const flowerRoot: Triple = [.04, .52, .025];
  parts.push(tapered("单朵海菖蒲雌花的完整细长花梗", dark, [[0, .045, 0], [.018, .26, .015], flowerRoot], [.0015, .0013, .001]), lobe("雌花基部的长卵形子房", green, [.04, .502, .025], [.007, .035, .007]));
  for (let i = 0; i < 3; i++) {
    const a = i * Math.PI * 2 / 3;
    parts.push(blade("雌花三片真实狭长而非宽百合状的白花瓣", "#dad9bd", [flowerRoot, [.04 + Math.cos(a) * .021, .525, .025 + Math.sin(a) * .021], [.04 + Math.cos(a) * .045, .518, .025 + Math.sin(a) * .045]], .0038, .00065, .2));
  }
  return parts;
}

// https://profiles.ala.org.au/opus/foa/profile/Amphibolis%20antarctica
// https://vicflora.rbg.vic.gov.au/flora/taxon/ffd4439b-a0d7-4238-973e-8026ca295219
function amphibolis(): ModelPart[] {
  const parts: ModelPart[] = [tapered("木枝藻地下相连而不以草丛复制的根茎", brown, [[-.04, .011, 0], [0, .013, 0], [.05, .012, 0]], [.0025, .0027, .0024])];
  const stems: ModelPart[] = [], leaves: ModelPart[] = [], roots: ModelPart[] = [];
  for (let i = 0; i < 6; i++) roots.push(tapered("木枝藻根茎节上的独立附着根", pale, [[-.03 + i * .014, .012, 0], [-.034 + i * .014, .001, .026]], [.0009, .00025]));
  const main: Triple[] = [[0, .012, 0], [-.012, .29, 0], [.013, .61, .008], [.025, .96, .012]];
  stems.push(tapered("木枝藻真实直径一至一点五毫米的木质主茎", brown, main, [.00075, .00072, .00065, .00048]));
  const terminals: Triple[] = [[.025, .96, .012]];
  for (let i = 0; i < 5; i++) {
    const y = .21 + i * .13, segment = y <= .29 ? 0 : y <= .61 ? 1 : 2, a = main[segment]!, b = main[segment + 1]!, t = (y - a[1]) / (b[1] - a[1]), root: Triple = [a[0] + (b[0] - a[0]) * t, y, a[2] + (b[2] - a[2]) * t], side = i % 2 ? 1 : -1;
    const end: Triple = [root[0] + side * (.085 + i * .008), y + .18, .02 + i % 2 * .015];
    stems.push(tapered("主茎侧生并继续上弯的木质细分枝", brown, [root, [root[0] + side * .05, y + .08, .01], end], [.00058, .0005, .00038]));
    terminals.push(end);
    if (i % 2 === 0) {
      const second: Triple = [end[0] + side * .033, end[1] - .055, end[2] + .044];
      stems.push(tapered("木质分枝末端的独立次级叶簇短枝", brown, [[root[0] + side * .05, y + .08, .01], second], [.00042, .00032]));
      terminals.push(second);
    }
  }
  for (const root of terminals) for (let i = 0; i < 8; i++) {
    const side = i % 2 ? 1 : -1, y = root[1] - .017 + i * .0027, z = root[2] + (i % 3 - 1) * .0018;
    const lamina = polygon("木枝藻端生叶簇每片短叶的凹顶与双角", green, [[-.0015, 0], [-.0028, .015], [-.0028, .033], [-.0018, .035], [0, .0325], [.0018, .035], [.0028, .033], [.0028, .015], [.0015, 0]], .00055, [root[0], y, z]);
    lamina.rotation = { x: -90, y: i % 3 * 34, z: side * (18 + i * 4) };
    leaves.push(lamina);
  }
  parts.push(combineMeshes("木枝藻相连的根茎节根", pale, roots), combineMeshes("单株木枝藻完整而连续的木质分枝", brown, stems));
  for (let i = 0; i < leaves.length; i += 24) parts.push(combineMeshes("每个木质枝端六至十片叶组成的真实短叶簇", green, leaves.slice(i, i + 24)));
  return parts;
}

export const aquaticExpansionBatchFourteenDesigns: MasterNatureDesign[] = [
  design("durvillaeaAntarctica", "南极杜氏藻", "植物", durvillaea, ["Durvillaea antarctica", "短厚柄与无气囊蜂窝髓质厚革带", "完整大型褐藻"]),
  design("eckloniaMaxima", "海竹藻", "植物", ecklonia, ["Ecklonia maxima", "粗中空柄顶端浮囊与双列次级藻片", "完整大型褐藻"]),
  design("alariaEsculenta", "食用翅藻", "植物", alaria, ["Alaria esculenta", "完整中肋长叶与短柄两排独立孢子叶", "完整大型褐藻"]),
  design("saccorhizaPolyschides", "多裂囊根藻", "植物", saccorhiza, ["Saccorhiza polyschides", "疣状中空固着球与扭转褶边扁柄", "完整大型褐藻"]),
  design("lessoniaTrabeculata", "树状莱氏藻", "植物", lessonia, ["Lessonia trabeculata", "无气囊坚挺分歧粗柄与末端剑形藻片", "完整大型褐藻"]),
  design("ascophyllumNodosum", "泡叶藻", "植物", ascophyllum, ["Ascophyllum nodosum", "单个串联气室与短柄椭圆生殖托", "完整大型褐藻"]),
  design("himanthaliaElongata", "伸长海条藻", "植物", himanthalia, ["Himanthalia elongata", "钮扣营养体与两根长叉带状生殖托", "完整大型褐藻"]),
  design("enhalusAcoroides", "海菖蒲", "植物", enhalus, ["Enhalus acoroides", "黑纤维根茎窄带叶与单朵三窄瓣雌花", "完整海草"]),
  design("amphibolisAntarctica", "木枝藻", "植物", amphibolis, ["Amphibolis antarctica", "木质细分枝与枝端凹顶短叶簇", "完整海草"]),
];
