import { Quaternion, Vector3 } from "three";
import { combineMeshes, design, eyes, frontCup, lobe, part, sweptProfile, tapered } from "./shared";
import type { MasterNatureDesign, ModelPart, Triple } from "./shared";
import { body, pectorals } from "./fishForms";
import { membrane } from "./animals";
import { tail } from "./marine";

const skin = "#a2b09b";
const fin = "#bec9ae";
const shell = "#c6c7a8";
const pale = "#d8d2b5";
const dark = "#7e957b";

// https://researchnow-admin.flinders.edu.au/ws/portalfiles/portal/120493779/Doeland_Tooth_P2019.pdf
function onychodus(): ModelPart[] {
  const parts: ModelPart[] = [body("爪齿鱼头后圆厚且后段侧扁的长躯", [[.39, .22, .071, .08], [.13, .22, .12, .135], [-.4, .16, .079, .1], [-.66, .12, .02, .034]], skin), tapered("爪齿鱼较长而圆钝的上颌", skin, [[0, .28, .3], [0, .27, .57]], [.08, .046]), tapered("爪齿鱼可动齿旋下方的独立下颌", fin, [[0, .13, .3], [0, .14, .6]], [.069, .036]), ...eyes([0, .3, .35], .074, .027), membrane("爪齿鱼后半身独立的前背鳍", fin, [[0, .31, -.12], [0, .43, -.21], [0, .29, -.33]]), membrane("爪齿鱼尾前较大的第二背鳍", fin, [[0, .23, -.42], [0, .36, -.5], [0, .19, -.64]]), membrane("爪齿鱼尾部上叶与中央延伸之间的鳍面", fin, [[0, .15, -.62], [0, .29, -.78], [0, .17, -.92], [0, .12, -.79]]), membrane("爪齿鱼尾部下叶", fin, [[0, .11, -.63], [0, -.015, -.79], [0, .11, -.91], [0, .14, -.78]])];
  for (const side of [-1, 1]) {
    parts.push(tapered("爪齿鱼前端肉质胸鳍叶", skin, [[side * .075, .17, .2], [side * .18, .08, .07]], [.025, .011]), membrane("爪齿鱼肉质胸鳍末端展开的鳍条面", fin, [[side * .17, .08, .09], [side * .29, .03, -.01], [side * .23, .025, -.16], [side * .13, .075, -.03]]), membrane("爪齿鱼位于后半躯的腹鳍", fin, [[side * .055, .08, -.29], [side * .2, .02, -.43], [side * .1, .04, -.51]]), tapered("爪齿鱼并列而不合成单轮的下颌齿旋骨座", pale, [[side * .02, .145, .47], [side * .025, .13, .55], [side * .024, .17, .6]], [.013, .019, .014]));
    for (let i = 0; i < 3; i++) parts.push(tapered("爪齿鱼旁正中齿旋上依次后弯的长獠牙", pale, [[side * .023, .16, .5 + i * .043], [side * .024, .23 + i * .009, .51 + i * .04], [side * .023, .26 + i * .011, .493 + i * .04]], [.01, .006, .0004]));
    for (let i = 0; i < 7; i++) parts.push(tapered("爪齿鱼上颌侧缘而非正中旋轮的短牙", pale, [[side * (.064 - i * .004), .25, .33 + i * .032], [side * (.061 - i * .004), .19, .334 + i * .032]], [.005, .0004]));
  }
  for (const item of parts) { item.position.x *= .8; item.position.y *= .8; item.position.z *= .8; item.scale.x *= .8; item.scale.y *= .8; item.scale.z *= .8; }
  return parts;
}

// https://www.digimorph.org/specimens/Eusthenopteron_foordi/
function eusthenopteron(): ModelPart[] {
  const parts: ModelPart[] = [body("真掌鳍鱼延长的有鳞圆躯及窄尾轴", [[.49, .26, .06, .075], [.14, .25, .13, .16], [-.4, .19, .09, .13], [-.69, .16, .036, .06]], skin), lobe("真掌鳍鱼扁长而保留鳃盖的头颅", skin, [0, .28, .43], [.26, .21, .4]), tapered("真掌鳍鱼前部平直的下颌", fin, [[0, .18, .38], [0, .19, .66]], [.069, .023]), ...eyes([0, .35, .478], .091, .027), membrane("真掌鳍鱼前背鳍", fin, [[0, .38, -.02], [0, .55, -.11], [0, .37, -.27]]), membrane("真掌鳍鱼较后方独立的第二背鳍", fin, [[0, .27, -.44], [0, .43, -.54], [0, .22, -.7]]), membrane("真掌鳍鱼与第二背相对的臀鳍", fin, [[0, .085, -.45], [0, -.06, -.57], [0, .095, -.72]]), membrane("真掌鳍鱼三叶尾的独立上叶", fin, [[0, .2, -.64], [0, .39, -.83], [0, .31, -.97], [0, .17, -.86]]), membrane("真掌鳍鱼三叶尾的独立下叶", fin, [[0, .12, -.64], [0, -.065, -.83], [0, .01, -.97], [0, .16, -.86]]), tapered("真掌鳍鱼尾轴穿过上下叶后仍伸出的第三中央叶", skin, [[0, .155, -.65], [0, .155, -.94], [0, .155, -1.07]], [.029, .019, .002])];
  for (const side of [-1, 1]) for (const rear of [false, true]) { const z = rear ? -.31 : .29; parts.push(tapered("真掌鳍鱼成对鳍内延伸的肉质主轴", skin, [[side * .09, .16, z], [side * .21, .09, z - .08], [side * .26, .065, z - .19]], [.032, .026, .007]), membrane("真掌鳍鱼围绕肉质鳍叶展开的鳍条面", fin, [[side * .11, .16, z], [side * .29, .1, z - .08], [side * .34, .05, z - .27], [side * .23, .045, z - .32], [side * .14, .1, z - .13]])); }
  for (const item of parts) { item.position.x *= .85; item.position.y *= .85; item.position.z *= .85; item.scale.x *= .85; item.scale.y *= .85; item.scale.z *= .85; }
  return parts;
}

// https://www.mdeq.ms.gov/wp-content/uploads/2017/06/Circular-4.pdf
function enchodus(): ModelPart[] {
  const parts: ModelPart[] = [body("矛齿鱼狭长且尾柄较细的捕食鱼体", [[.29, .21, .052, .074], [.05, .21, .081, .115], [-.34, .17, .06, .09], [-.57, .13, .015, .029]], skin), tapered("矛齿鱼较高的尖吻上颌", skin, [[0, .27, .25], [0, .265, .53]], [.06, .02]), tapered("矛齿鱼分离而向前突出的下颌", fin, [[0, .12, .22], [0, .125, .55]], [.054, .018]), ...eyes([0, .28, .29], .055, .032), membrane("矛齿鱼中后段独立的软条背鳍", fin, [[0, .295, -.08], [0, .45, -.15], [0, .3, -.34]]), membrane("矛齿鱼尾前下方独立的臀鳍", fin, [[0, .09, -.35], [0, .005, -.42], [0, .11, -.55]]), ...tail([0, .13, -.6], .19, true)];
  pectorals(parts, [0, .16, .19], .19, -.012);
  for (const side of [-1, 1]) {
    parts.push(tapered("矛齿鱼前腭骨上真正突出的成对长獠牙", pale, [[side * .027, .245, .485], [side * .026, .16, .49], [side * .025, .11, .475]], [.009, .005, .0003]), tapered("矛齿鱼与上腭长牙相错的下颌前牙", pale, [[side * .026, .14, .522], [side * .026, .22, .525]], [.007, .0003]), membrane("矛齿鱼相对靠前的短腹鳍", fin, [[side * .03, .105, -.02], [side * .12, .025, -.13], [side * .043, .075, -.23]]));
    for (let i = 0; i < 6; i++) parts.push(tapered("矛齿鱼前部长牙之外的细侧齿", pale, [[side * .044, .23, .28 + i * .028], [side * .041, .185, .28 + i * .028]], [.0035, .0003]));
  }
  return parts;
}

// https://www.biodiversitylibrary.org/bibliography/197469
function hybodus(): ModelPart[] {
  const parts: ModelPart[] = [body("弓鲛较修长而前部圆厚的鲨形躯", [[.79, .35, .054, .066], [.39, .35, .18, .2], [-.42, .25, .12, .15], [-.89, .17, .035, .066]], skin), ...eyes([0, .445, .51], .125, .031), membrane("弓鲛位于背前部的独立第一背鳍", fin, [[0, .5, .21], [0, .85, .075], [0, .69, -.08], [0, .37, -.15]]), membrane("弓鲛尾前独立的第二背鳍", fin, [[0, .34, -.53], [0, .65, -.66], [0, .49, -.79], [0, .21, -.85]]), tapered("弓鲛第一背鳍前缘有纵肋的粗棘", pale, [[0, .49, .17], [0, .86, .08]], [.023, .001]), tapered("弓鲛第二背鳍前缘真实粗棘", pale, [[0, .32, -.56], [0, .65, -.655]], [.019, .001]), membrane("弓鲛上尾叶显著延长的异尾", fin, [[0, .2, -.86], [0, .45, -1.13], [0, .55, -1.53], [0, .31, -1.35], [0, .1, -1.02]]), membrane("弓鲛相对短小的下尾叶", fin, [[0, .14, -.87], [0, -.045, -1.12], [0, .035, -1.22], [0, .17, -1.03]]), membrane("弓鲛尾根之前保留的独立臀鳍", fin, [[0, .14, -.65], [0, .02, -.77], [0, .15, -.88]])];
  for (const side of [-1, 1]) {
    parts.push(membrane("弓鲛前部宽而后收的胸鳍", fin, [[side * .14, .22, .36], [side * .53, .075, .07], [side * .39, .06, -.17], [side * .14, .2, .07]]), membrane("弓鲛后腹较小的成对腹鳍", fin, [[side * .075, .15, -.44], [side * .24, .03, -.57], [side * .15, .05, -.73], [side * .055, .13, -.58]]), tapered("雄弓鲛额上成对且末梢向后的头棘", pale, [[side * .083, .494, .475], [side * .1, .57, .48], [side * .1, .606, .438]], [.018, .011, .0008]), tapered("头棘侧方实际分出的辅助小钩", pale, [[side * .09, .545, .475], [side * .12, .56, .452]], [.008, .0005]));
    for (let i = 0; i < 5; i++) parts.push(tapered("弓鲛头后每侧五道鳃缘", dark, [[side * .163, .39, .41 - i * .044], [side * .176, .23, .41 - i * .044]], [.0035, .0035]));
  }
  for (const item of parts) { item.position.x *= .86; item.position.y *= .86; item.position.z *= .86; item.scale.x *= .86; item.scale.y *= .86; item.scale.z *= .86; }
  return parts;
}

function curvedShell(name: string, path: Triple[], radii: number[], wall: number): ModelPart {
  const vertices: { x: number; y: number; z: number }[] = [], indices: number[] = [];
  for (const inside of [false, true]) for (let i = 0; i < path.length; i++) {
    const direction = new Vector3(...path[Math.min(i + 1, path.length - 1)]!).sub(new Vector3(...path[Math.max(0, i - 1)]!)).normalize(), rotation = new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), direction), radius = radii[i]! - (inside ? wall : 0), center = new Vector3(...path[i]!);
    if (inside && i === 0) center.addScaledVector(direction, wall);
    for (let j = 0; j < 8; j++) { const angle = j * Math.PI / 4, point = new Vector3(Math.cos(angle) * radius, 0, Math.sin(angle) * radius).applyQuaternion(rotation).add(center); vertices.push({ x: point.x, y: point.y, z: point.z }); }
  }
  const inner = path.length * 8;
  for (let row = 0; row < path.length - 1; row++) for (let j = 0; j < 8; j++) { const a = row * 8 + j, b = row * 8 + (j + 1) % 8; indices.push(a, a + 8, b, b, a + 8, b + 8, inner + a, inner + b, inner + a + 8, inner + b, inner + b + 8, inner + a + 8); }
  const end = (path.length - 1) * 8;
  for (let j = 0; j < 8; j++) { const a = end + j, b = end + (j + 1) % 8; indices.push(a, inner + a, b, b, inner + a, inner + b); }
  const cap = vertices.length, back = new Vector3(...path[0]!), innerBack = back.clone().addScaledVector(new Vector3(...path[1]!).sub(back).normalize(), wall); vertices.push({ x: back.x, y: back.y, z: back.z }, { x: innerBack.x, y: innerBack.y, z: innerBack.z });
  for (let j = 0; j < 8; j++) indices.push(cap, j, (j + 1) % 8, cap + 1, inner + (j + 1) % 8, inner + j);
  return part(name, "mesh", shell, [0, 0, 0], [1, 1, 1], [0, 0, 0], { vertices, indices });
}

function shellRibs(parts: ModelPart[], path: Triple[], radii: number[]) {
  const ribs: ModelPart[] = [];
  for (let i = 1; i < path.length; i++) { const rotation = new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), new Vector3(...path[Math.min(i + 1, path.length - 1)]!).sub(new Vector3(...path[i - 1]!)).normalize()); const ring = Array.from({ length: 9 }, (_, j) => { const angle = j * Math.PI / 4, point = new Vector3(Math.cos(angle) * (radii[i]! + .0005), 0, Math.sin(angle) * (radii[i]! + .0005)).applyQuaternion(rotation).add(new Vector3(...path[i]!)); return [point.x, point.y, point.z] as Triple; }); ribs.push(tapered("管壳外表环绕横肋", pale, ring, ring.map(() => .002))); }
  for (let i = 0; i < ribs.length; i += 6) parts.push(combineMeshes("管壳表面相互分离的弯曲横肋", pale, ribs.slice(i, i + 6)));
}

function ammonoidHead(parts: ModelPart[], mouth: Triple, previous: Triple, radius: number) {
  const direction = new Vector3(...mouth).sub(new Vector3(...previous)).normalize(), rotation = new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), direction), center = new Vector3(...mouth).addScaledVector(direction, radius * .45);
  parts.push(lobe("与壳口实际相接的保守复原头足软体", skin, [center.x, center.y, center.z], [radius * 1.35, radius * 1.4, radius * 1.35]));
  for (const side of [-1, 1]) { const p = new Vector3(side * radius * .53, radius * .48, 0).applyQuaternion(rotation).add(new Vector3(...mouth)); parts.push(lobe("壳口软体两侧的眼", dark, [p.x, p.y, p.z], [radius * .3, radius * .3, radius * .3])); }
  for (let i = 0; i < 10; i++) { const angle = i * Math.PI / 5, points = [[Math.cos(angle) * radius * .32, radius * .72, Math.sin(angle) * radius * .32], [Math.cos(angle) * radius * 1.2, radius * 1.9, Math.sin(angle) * radius * 1.2], [Math.cos(angle + .2) * radius * 1.35, radius * 3, Math.sin(angle + .2) * radius * 1.35]].map(([x, y, z]) => { const p = new Vector3(x, y, z).applyQuaternion(rotation).add(new Vector3(...mouth)); return [p.x, p.y, p.z] as Triple; }); parts.push(tapered("菊石壳口外环腕的保守软组织复原", skin, points, [radius * .12, radius * .07, .0007])); }
}

// https://pubs.usgs.gov/pp/0645/report.pdf
function baculites(): ModelPart[] {
  const path: Triple[] = [[-.013, 1.48, .008], [-.027, 1.498, .006], [-.045, 1.485, .004], [-.043, 1.461, .002], [-.022, 1.448, 0], [0, 1.455, 0], [0, 1.25, 0], [0, .98, 0], [.003, .7, 0], [.008, .4, 0], [.012, .2, 0]], radii = [.004, .0045, .005, .0055, .006, .007, .013, .022, .032, .043, .052];
  const parts: ModelPart[] = [curvedShell("杆菊石微小初螺后接长直壳且壳口保留真实内壁", path, radii, .0018)]; shellRibs(parts, path.slice(5), radii.slice(5)); ammonoidHead(parts, path.at(-1)!, path.at(-2)!, .052); return parts;
}

// https://ammonoid.treatise.geolex.org/displayInfo.php?genera=Diplomoceras
function diplomoceras(): ModelPart[] {
  const path: Triple[] = [[-.15, 1.48, 0], [-.15, 1.04, 0], [-.15, .6, 0], [-.15, .27, 0]];
  for (let i = 1; i <= 7; i++) { const a = Math.PI + i / 7 * Math.PI; path.push([Math.cos(a) * .15, .27 + Math.sin(a) * .15, 0]); }
  path.push([.15, .62, 0], [.15, 1.17, 0]);
  for (let i = 1; i <= 7; i++) { const a = Math.PI - i / 7 * Math.PI; path.push([.31 + Math.cos(a) * .16, 1.17 + Math.sin(a) * .16, 0]); }
  path.push([.47, .83, 0], [.47, .4, 0]);
  const radii = path.map((_, i) => .012 + i / (path.length - 1) * .04), parts: ModelPart[] = [curvedShell("纸夹菊石真正相通的三根近并行壳轴和两次回折", path, radii, .004)]; shellRibs(parts, path, radii); ammonoidHead(parts, path.at(-1)!, path.at(-2)!, .052); return parts;
}

// https://www.biodiversitylibrary.org/part/23824
function ancyloceras(): ModelPart[] {
  const path: Triple[] = [];
  for (let i = 0; i <= 16; i++) { const angle = i / 16 * Math.PI * 3.3, r = .035 + i / 16 * .22; path.push([Math.cos(angle) * r, .8 + Math.sin(angle) * r, 0]); }
  const start = path.at(-1)!; path.push([start[0] - .045, .42, 0], [start[0] - .07, .2, 0]);
  for (let i = 1; i <= 6; i++) { const a = Math.PI + i / 6 * Math.PI; path.push([start[0] + .09 + Math.cos(a) * .16, .2 + Math.sin(a) * .16, 0]); }
  path.push([start[0] + .25, .44, 0]);
  const radii = path.map((_, i) => .006 + i / (path.length - 1) * .036), parts: ModelPart[] = [curvedShell("弯钩菊石不相接初螺接长臂及向上终钩的完整空腔壳", path, radii, .0025)]; shellRibs(parts, path, radii); ammonoidHead(parts, path.at(-1)!, path.at(-2)!, .042); return parts;
}

// https://tolweb.org/Taningia_danae/19840
function taningia(): ModelPart[] {
  const parts: ModelPart[] = [body("大鳍光腕乌贼厚重的短圆锥外套", [[.47, .53, .21, .21], [.04, .52, .27, .29], [-.55, .48, .16, .2], [-.83, .45, .012, .019]], skin), lobe("八腕与外套筒之间独立的大眼头部", skin, [0, .49, .64], [.37, .36, .35]), ...eyes([0, .52, .674], .157, .115), frontCup("大鳍光腕乌贼头下实际有内壁的喷漏斗", pale, [0, .35, .58], .048, .13)];
  for (const side of [-1, 1]) parts.push(membrane("大鳍光腕乌贼宽度超过外套长的大型三角鳍", fin, [[side * .12, .52, .42], [side * .7, .48, .01], [side * .86, .4, -.28], [side * .66, .39, -.59], [side * .025, .44, -.84]]));
  const hooks: ModelPart[] = [];
  for (let arm = 0; arm < 8; arm++) {
    const angle = Math.PI / 8 + arm * Math.PI / 4, x = Math.cos(angle), y = Math.sin(angle), root: Triple = [x * .1, .49 + y * .1, .76], middle: Triple = [x * .25, .49 + y * .25, 1.04], end: Triple = [x * .33, .49 + y * .33, 1.38];
    parts.push(tapered("大鳍光腕乌贼八条短而近等长的普通腕", skin, [root, middle, end], [.048, .035, .006]));
    for (const row of [-1, 1]) for (let i = 0; i < 4; i++) { const t = .24 + i * .17, px = root[0] + (end[0] - root[0]) * t - y * row * .012, py = root[1] + (end[1] - root[1]) * t + x * row * .012, z = root[2] + (end[2] - root[2]) * t; hooks.push(tapered("光腕乌贼腕内成双行的真实后弯钩", pale, [[px, py, z], [px - x * .023, py - y * .023, z], [px - x * .032, py - y * .032, z - .014], [px - x * .018, py - y * .018, z - .025]], [.0055, .004, .0025, .0003])); }
    if (arm === 0 || arm === 3) { const organ = lobe("仅第二对腕末端的大型椭圆发光器", "#d3ddae", end, [.082, .066, .1]); organ.emissive = "#b9d9a8"; organ.emissiveIntensity = .35; parts.push(organ, tapered("发光器旁实际相接的深色薄眼睑缘", dark, [[end[0] - .025, end[1], end[2] - .028], [end[0], end[1] + .022, end[2] - .025], [end[0] + .025, end[1], end[2] - .028]], [.004, .004, .004])); }
  }
  for (let i = 0; i < hooks.length; i += 12) parts.push(combineMeshes("光腕乌贼八腕双行钩的完整分离钩列", pale, hooks.slice(i, i + 12))); return parts;
}

// https://www.fao.org/4/i2741e/i2741e.pdf
function diamondbackSquid(): ModelPart[] {
  const parts: ModelPart[] = [body("菱鳍鱿肌肉发达而末端钝收的外套", [[.29, .36, .13, .14], [-.03, .35, .17, .2], [-.44, .33, .09, .12], [-.65, .31, .011, .019]], skin), lobe("菱鳍鱿窄于外套的短颈大眼头", skin, [0, .34, .41], [.25, .24, .27]), ...eyes([0, .37, .441], .107, .085), frontCup("菱鳍鱿头腹侧具有真内壁的粗短漏斗", pale, [0, .24, .36], .035, .1)];
  for (const side of [-1, 1]) parts.push(membrane("菱鳍鱿从前缘延至外套尖的完整菱形大鳍", fin, [[side * .1, .35, .28], [side * .55, .33, -.16], [side * .015, .31, -.65], [side * .07, .34, -.09]]));
  const cups: ModelPart[] = [];
  for (let arm = 0; arm < 8; arm++) {
    const angle = Math.PI / 8 + arm * Math.PI / 4, x = Math.cos(angle), y = Math.sin(angle), root: Triple = [x * .069, .34 + y * .069, .51], length = arm === 1 || arm === 2 ? .28 : arm === 0 || arm === 3 ? .43 : .54, end: Triple = [x * .19, .34 + y * .19, .51 + length];
    parts.push(tapered("菱鳍鱿八条长短不同的普通腕", skin, [root, [x * .15, .34 + y * .15, .51 + length * .53], end], [.029, .021, .003]), membrane("菱鳍鱿沿普通腕延伸的宽保护膜", fin, [root, [root[0] - y * .025, root[1] + x * .025, .53], [end[0] - y * .026, end[1] + x * .026, end[2] - .055], end]));
    for (const row of [-1, 1]) for (let i = 0; i < 5; i++) { const t = .17 + i * .15, cup = sweptProfile("普通腕内两行的真正凹吸盘", pale, [[0, 0], [.008, .001], [.01, .006], [.008, .008], [.004, .003], [0, .002]], Math.PI * 2, 8); cup.position = { x: root[0] + (end[0] - root[0]) * t - y * row * .009, y: root[1] + (end[1] - root[1]) * t + x * row * .009, z: root[2] + length * t }; cup.rotation.z = angle * 180 / Math.PI + 90; cups.push(cup); }
  }
  for (const side of [-1, 1]) { parts.push(tapered("菱鳍鱿八腕之外的独立长捕食触腕", skin, [[side * .047, .3, .51], [side * .17, .25, 1.13], [side * .15, .21, 1.67]], [.013, .009, .007]), lobe("长触腕末梢较扁的捕食穗", skin, [side * .15, .21, 1.74], [.063, .039, .26])); for (let row = 0; row < 4; row++) for (let i = 0; i < 5; i++) { const cup = sweptProfile("捕食穗上四行真正有孔的吸盘", pale, [[0, 0], [.005, .001], [.007, .005], [.005, .006], [.002, .002], [0, .001]], Math.PI * 2, 8); cup.position = { x: side * .15 + (row - 1.5) * .012, y: .225, z: 1.65 + i * .037 }; cups.push(cup); } }
  for (let i = 0; i < cups.length; i += 8) parts.push(combineMeshes("菱鳍鱿两行普通腕与四行触穗的独立凹吸盘", pale, cups.slice(i, i + 8))); return parts;
}

export const aquaticExpansionBatchNineDesigns: MasterNatureDesign[] = [
  design("onychodus", "爪齿鱼", "动物", onychodus, ["Onychodus", "形态复原", "成对旁正中齿旋与后弯长獠牙"]),
  design("eusthenopteron", "真掌鳍鱼", "动物", eusthenopteron, ["Eusthenopteron foordi", "形态复原", "序列肉鳍及真正分开的三叶尾"]),
  design("enchodus", "矛齿鱼", "动物", enchodus, ["Enchodus petrosus", "形态复原", "上前腭骨成对长獠牙与短侧齿"]),
  design("hybodus", "弓鲛", "动物", hybodus, ["Hybodus reticulatus", "形态复原", "成对额上钩与独立双背棘"]),
  design("baculites", "杆菊石", "动物", baculites, ["Baculites", "形态复原", "微小初螺与长直有内壁壳口"]),
  design("diplomoceras", "纸夹菊石（Diplomoceras）", "动物", diplomoceras, ["Diplomoceras", "形态复原", "近并行壳轴及两次完整回折"]),
  design("ancyloceras", "弯钩菊石（Ancyloceras）", "动物", ancyloceras, ["Ancyloceras", "形态复原", "开放初螺长壳臂与向上终钩"]),
  design("taningia", "大鳍光腕乌贼", "动物", taningia, ["Taningia danae", "八腕双行钩及仅第二对腕末端的发光器"]),
  design("diamondbackSquid", "菱鳍鱿", "动物", diamondbackSquid, ["Thysanoteuthis rhombus", "贯穿全外套的菱形鳍与两行及四行凹吸盘"]),
];
