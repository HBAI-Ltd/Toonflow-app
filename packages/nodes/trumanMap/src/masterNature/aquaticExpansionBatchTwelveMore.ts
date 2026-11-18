import { cap, combineMeshes, design, eyes, lobe, needle, polygon, tapered } from "./shared";
import type { MasterNatureDesign, ModelPart, Triple } from "./shared";
import { body } from "./fishForms";
import { membrane } from "./animals";
import { convexValve } from "./bivalveArchitectures";

const skin = "#9eaf9d";
const armor = "#bdc4a7";
const fin = "#bcc7ad";
const pale = "#d5cfb2";
const dark = "#748979";

function surfaceHeight(item: ModelPart, x: number, z: number): number {
  let height = -Infinity;
  for (let i = 0; i < item.indices!.length; i += 3) {
    const points = item.indices!.slice(i, i + 3).map(index => item.vertices![index]!);
    const [a, b, c] = points as [{ x: number; y: number; z: number }, { x: number; y: number; z: number }, { x: number; y: number; z: number }];
    const denominator = (b.z - c.z) * (a.x - c.x) + (c.x - b.x) * (a.z - c.z);
    if (Math.abs(denominator) < 1e-12) continue;
    const u = ((b.z - c.z) * (x - c.x) + (c.x - b.x) * (z - c.z)) / denominator;
    const v = ((c.z - a.z) * (x - c.x) + (a.x - c.x) * (z - c.z)) / denominator;
    if (u >= -1e-8 && v >= -1e-8 && u + v <= 1 + 1e-8) height = Math.max(height, u * a.y + v * b.y + (1 - u - v) * c.y + item.position.y);
  }
  return height;
}

// https://www.biodiversitylibrary.org/bibliography/3399
// https://www.app.pan.pl/archive/published/app63/app004712018.html
function simosaurus(): ModelPart[] {
  const parts: ModelPart[] = [body("扁鼻龙粗壮而腹面低扁的宽胸腹", [[.4, .33, .14, .14], [.12, .31, .25, .19], [-.3, .26, .23, .16], [-.65, .2, .12, .1]], skin), tapered("扁鼻龙较幻龙粗而紧凑的前颈", skin, [[0, .34, .31], [0, .37, .65], [0, .37, .99]], [.13, .105, .08]), body("扁鼻龙后颞区宽大而吻端短钝的低平头", [[1.51, .397, .095, .037], [1.35, .42, .17, .067], [1.12, .42, .2, .094], [.95, .37, .105, .08]], skin), body("扁鼻龙宽钝齿床下独立而深厚的下颌", [[1.52, .285, .084, .023], [1.32, .284, .16, .038], [1.08, .324, .166, .062]], fin), ...eyes([0, .474, 1.25], .142, .033), tapered("扁鼻龙长而渐窄且没有现代鱼龙尾叶的推进尾", skin, [[0, .21, -.57], [.025, .16, -1.1], [.075, .105, -1.57], [.12, .07, -1.92]], [.115, .083, .039, .006])];
  const teeth: ModelPart[] = [], claws: ModelPart[] = [];
  for (const side of [-1, 1]) {
    parts.push(tapered("扁鼻龙由强大胸带带动而明显粗厚的前臂", skin, [[side * .18, .28, .22], [side * .44, .13, .12], [side * .48, .065, .34]], [.087, .063, .038]), tapered("扁鼻龙股骨外展而膝部前折的完整后肢", skin, [[side * .15, .22, -.48], [side * .37, .115, -.60], [side * .44, .045, -.40]], [.069, .05, .028]), membrane("扁鼻龙短宽前掌的推定指间泳蹼", fin, [[side * .45, .072, .3], [side * .62, .035, .34], [side * .65, .028, .49], [side * .47, .028, .55], [side * .4, .055, .39]]), membrane("扁鼻龙关节外侧短宽而非水翼的后足蹼", fin, [[side * .41, .05, -.44], [side * .59, .025, -.39], [side * .61, .02, -.22], [side * .43, .025, -.2], [side * .38, .045, -.35]]));
    for (let i = 0; i < 5; i++) for (const front of [true, false]) {
      const wrist: Triple = [side * (front ? .48 : .44), front ? .063 : .044, front ? .34 : -.40];
      const tip: Triple = [side * ((front ? .46 : .43) + i * .042), .03, (front ? .49 : -.24) + Math.sin(i / 4 * Math.PI) * .048];
      parts.push(tapered("扁鼻龙泳足中独立可辨的五根短指趾", skin, [wrist, tip], [.012, .005]));
      claws.push(needle("扁鼻龙指趾末端的小爪", pale, tip, [tip[0], .026, tip[2] + .023], .008));
    }
    for (let i = 0; i < 11; i++) {
      const t = i / 10, x = side * (.145 - t * .056), z = 1.12 + t * .365;
      teeth.push(lobe("扁鼻龙上颌较短而圆钝的破碎型齿冠", pale, [x, .353, z], [.026 - t * .006, .048 - t * .01, .03]), lobe("扁鼻龙下颌错列的短钝圆齿", pale, [x, .326, z + .011], [.023 - t * .006, .04, .027]));
    }
    parts.push(lobe("扁鼻龙吻端后方成对的鼻孔", dark, [side * .066, .455, 1.42], [.034, .012, .042]));
  }
  for (let i = 0; i < teeth.length; i += 22) parts.push(combineMeshes("扁鼻龙真实张口中上下相错的短钝齿列", pale, teeth.slice(i, i + 22)));
  parts.push(combineMeshes("扁鼻龙四肢末端可辨的短爪", pale, claws));
  return parts;
}

// https://www.ivpp.ac.cn/xwdt/kyjz/201811/t20181103_5155317.html
// https://pmc.ncbi.nlm.nih.gov/articles/PMC10499374/
function sinosaurosphargis(): ModelPart[] {
  const trunk = convexValve("云贵中国龙龟闭合宽肋篮形成的低圆盘状完整躯干", [[-.10, .26], [-.2, .21], [-.25, .06], [-.23, -.16], [-.13, -.28], [0, -.31], [.13, -.28], [.23, -.16], [.25, .06], [.2, .21], [.1, .26]], .115, .037);
  trunk.position.y = .11; trunk.color = skin;
  const parts: ModelPart[] = [trunk, tapered("云贵中国龙龟圆盘背甲前的小段粗颈", skin, [[0, .15, .23], [0, .16, .36]], [.06, .043]), body("云贵中国龙龟眼后很宽而吻端短钝的低三角颅", [[.52, .173, .027, .025], [.43, .18, .076, .06], [.35, .17, .07, .057]], skin), body("云贵中国龙龟与上颌留有口隙的短下颌", [[.522, .109, .026, .012], [.43, .113, .063, .022], [.36, .133, .06, .031]], fin), ...eyes([0, .224, .443], .058, .017), tapered("云贵中国龙龟圆盘后缩细的完整尾", skin, [[0, .11, -.27], [.015, .082, -.44], [.04, .05, -.6]], [.047, .028, .003])];
  const tiles: ModelPart[] = [], teeth: ModelPart[] = [];
  for (let row = 0; row < 20; row++) for (let column = 0; column < 15; column++) {
    const x = (column - 7 + (row % 2) * .5) * .032, z = .235 - row * .027;
    if ((x / .245) ** 2 + ((z + .02) / .278) ** 2 > .94) continue;
    const y = surfaceHeight(trunk, x, z);
    const tile = polygon("中国龙龟密铺而彼此不融合成龟甲盾片的小多边骨甲", armor, [[-.016, -.009], [-.0155, .009], [0, .018], [.016, .009], [.016, -.009], [0, -.018]], .005, [x, y - .002, z]);
    tile.vertices = tile.vertices!.map(point => ({ ...point, y: point.y + surfaceHeight(trunk, x + point.x, z + point.z) - y }));
    if (tile.vertices.every(point => Number.isFinite(point.y))) tiles.push(tile);
  }
  for (let i = 0; i < tiles.length; i += 36) parts.push(combineMeshes("云贵中国龙龟覆盖整片宽背而非三条孤立甲列的细骨甲", armor, tiles.slice(i, i + 36)));
  for (const side of [-1, 1]) for (const rear of [false, true]) {
    const z = rear ? -.2 : .185, wrist: Triple = [side * .32, .035, z + .025];
    parts.push(tapered("云贵中国龙龟从厚甲边缘伸出的外展关节肢", skin, [[side * .18, .12, z], [side * .29, .065, z - .035], wrist], [.036, .025, .017]), membrane("中国龙龟短泳足的指间软蹼", fin, [[side * .3, .04, z], [side * .42, .019, z + .025], [side * .425, .015, z + .13], [side * .31, .022, z + .13]]));
    for (let toe = 0; toe < 5; toe++) {
      const length = [.063, .088, .103, .12, .087][toe]!;
      parts.push(tapered("中国龙龟第四指趾最长而第五指趾纤细的泳足", skin, [wrist, [side * (.303 + toe * .026), .018, z + length]], [toe === 4 ? .005 : .007, .002]));
    }
  }
  for (const side of [-1, 1]) for (let i = 0; i < 5; i++) teeth.push(needle("中国龙龟短颌内部的小锥齿", pale, [side * (.052 - i * .007), .15, .423 + i * .018], [side * (.052 - i * .007), .119, .425 + i * .018], .006));
  parts.push(combineMeshes("云贵中国龙龟真实口隙内的小齿", pale, teeth));
  return parts;
}

// https://doi.org/10.1111/j.1502-3931.2011.00290.x
function gerrothorax(): ModelPart[] {
  const trunk = convexValve("美丽柳胸螈腹背极扁而宽圆的沉底型躯干", [[-.13, .23], [-.18, .12], [-.175, -.04], [-.10, -.15], [.1, -.15], [.175, -.04], [.18, .12], [.13, .23]], .047, .017);
  trunk.position.y = .071; trunk.color = skin;
  const roof = convexValve("柳胸螈比头长更宽并从颅后抬起的扁平头顶", [[-.08, .44], [-.15, .41], [-.185, .33], [-.16, .235], [.16, .235], [.185, .33], [.15, .41], [.08, .44]], .034, .012);
  roof.color = skin;
  roof.vertices = roof.vertices!.map(point => ({ ...point, y: point.y + .115 + Math.max(0, point.z - .235) * .26 }));
  const jaw = convexValve("柳胸螈留在下方而与抬起的头顶分离的宽下颌", [[-.08, .443], [-.15, .412], [-.177, .33], [-.148, .239], [.148, .239], [.177, .33], [.15, .412], [.08, .443]], .018, .009);
  jaw.position.y = .075; jaw.color = fin;
  const parts: ModelPart[] = [trunk, roof, jaw, tapered("柳胸螈没有细长活动颈的宽头躯连接", skin, [[0, .095, .19], [0, .105, .275]], [.112, .105]), body("柳胸螈短躯后渐细且侧扁的完整尾", [[-.105, .074, .07, .042], [-.235, .066, .052, .05], [-.39, .052, .027, .037], [-.575, .037, .003, .008]], skin), ...eyes([0, surfaceHeight(roof, .076, .36) + .004, .36], .076, .039)];
  const plates: ModelPart[] = [], teeth: ModelPart[] = [];
  for (let i = 0; i < 42; i++) {
    const a = i * 2.4, r = Math.sqrt((i + .5) / 42), x = Math.cos(a) * r * .15, z = .045 + Math.sin(a) * r * .16, y = surfaceHeight(trunk, x, z);
    plates.push(lobe("柳胸螈扁平躯体内形成真实低浮突的厚皮骨甲", armor, [x, y - .0015, z], [.026, .008, .027]));
  }
  for (let i = 0; i < plates.length; i += 35) parts.push(combineMeshes("柳胸螈密集而低平的躯体骨甲浮突", armor, plates.slice(i, i + 35)));
  for (const side of [-1, 1]) for (const rear of [false, true]) {
    const z = rear ? -.075 : .17, wrist: Triple = [side * (rear ? .24 : .255), .028, z + .047];
    parts.push(tapered("柳胸螈无法高撑身体的细弱外展短肢", skin, [[side * .13, .07, z], [side * .23, .039, z - .025], wrist], [.027, .019, .012]));
    const count = rear ? 5 : 4;
    for (let i = 0; i < count; i++) parts.push(tapered("柳胸螈前足四指后足五趾的短而独立末趾", skin, [wrist, [wrist[0] + (i - (count - 1) / 2) * .02, .012, z + .105 + Math.sin(i / (count - 1) * Math.PI) * .021]], [.007, .0015]));
  }
  for (const side of [-1, 1]) for (let i = 0; i < 40; i++) {
    const a = i / 39 * Math.PI * .49, x = side * Math.sin(a) * .16, z = .278 + Math.cos(a) * .151, y = .108 + (z - .235) * .26;
    teeth.push(needle("柳胸螈上颌弧线上密排的细锥齿", pale, [x, y, z], [x, y - .018, z - .001], .003), needle("柳胸螈下颌向上的密排小齿", pale, [x, .092, z + .002], [x, .108, z + .001], .003));
  }
  for (let i = 0; i < teeth.length; i += 40) parts.push(combineMeshes("柳胸螈真实抬头口腔内连续而留隙的细密齿弧", pale, teeth.slice(i, i + 40)));
  // ACT: 近年对鳃弓的研究倾向内鳃；不添加未保存的羽状外鳃丝。
  return parts;
}

// https://palaeo-electronica.org/content/2014/647-3d-bothriolepis
function bothriolepis(): ModelPart[] {
  const parts: ModelPart[] = [body("加拿大沟鳞鱼前高后低且腹面较平的硬骨甲箱", [[.054, .064, .041, .028], [.01, .07, .062, .043], [-.045, .061, .06, .038], [-.083, .052, .039, .028]], armor), polygon("沟鳞鱼扁平而横向宽的独立头甲", armor, [[-.028, .108], [-.045, .088], [-.041, .046], [.041, .046], [.045, .088], [.028, .108]], .022, [0, .052, 0]), body("沟鳞鱼头甲下侧向下开口的短小无牙下颌", [[.11, .042, .016, .004], [.085, .043, .029, .007], [.061, .047, .031, .01]], skin), body("沟鳞鱼甲箱后完全无甲而柔软的长后躯", [[-.072, .052, .036, .027], [-.13, .045, .029, .027], [-.205, .037, .016, .023], [-.264, .033, .006, .013]], skin), ...eyes([0, .078, .084], .016, .01), membrane("沟鳞鱼位于软后躯上方而不是甲箱顶的单背鳍", fin, [[0, .065, -.105], [0, .123, -.133], [0, .135, -.172], [0, .058, -.21]]), membrane("沟鳞鱼脊索延入上叶的歪尾上尾叶", fin, [[0, .044, -.245], [0, .104, -.292], [0, .127, -.34], [0, .051, -.313], [0, .027, -.269]]), membrane("沟鳞鱼歪尾中独立较低的下叶", fin, [[0, .029, -.25], [0, -.01, -.292], [0, .0, -.319], [0, .044, -.295]])];
  const plates: ModelPart[] = [], serrations: ModelPart[] = [];
  plates.push(polygon("沟鳞鱼前中背甲的菱形高脊板", pale, [[0, .045], [-.035, .015], [0, -.026], [.035, .015]], .006, [0, .107, 0]), polygon("沟鳞鱼与前中背甲分开的后中背板", armor, [[0, -.021], [-.031, -.043], [0, -.077], [.031, -.043]], .006, [0, .096, 0]));
  for (const plate of plates) {
    plate.vertices = plate.vertices!.map(point => ({ ...point, y: point.y + surfaceHeight(parts[0]!, point.x, point.z) - .001 }));
    plate.position.y = 0;
  }
  for (const side of [-1, 1]) {
    parts.push(polygon("沟鳞鱼与肩部关节相连的长而宽扁的近端胸鳍骨段", armor, [[side * .048, .028], [side * .069, .021], [side * .115, -.058], [side * .108, -.075], [side * .089, -.067], [side * .047, -.001]], .012, [0, .034, 0]), lobe("沟鳞鱼两段胸鳍之间真正分开的活动肘关节", skin, [side * .104, .038, -.069], [.025, .019, .026]), polygon("沟鳞鱼关节后狭窄且外缘带齿的远端胸鳍骨段", armor, [[side * .101, -.061], [side * .114, -.069], [side * .151, -.151], [side * .144, -.163], [side * .132, -.135], [side * .097, -.079]], .008, [0, .025, 0]));
    for (let i = 0; i < 7; i++) {
      const t = i / 6, x = side * (.114 + t * .033), z = -.075 - t * .073;
      serrations.push(needle("沟鳞鱼远端胸鳍骨甲边缘独立的小锯齿", pale, [x, .03, z], [x + side * .006, .03, z - .003], .0035));
    }
    plates.push(polygon("沟鳞鱼头顶成对眼眶外侧的低骨板", pale, [[side * .025, .101], [side * .044, .084], [side * .037, .063], [side * .024, .07]], .004, [0, .074, 0]));
  }
  parts.push(...plates, combineMeshes("沟鳞鱼两根关节胸鳍的真实边缘锯齿", pale, serrations));
  return parts;
}

// https://www.bundenbach-fossilien.de/Literatur/2021_S%C3%BCdkamp_Ikonen.pdf
function gemuendina(): ModelPart[] {
  const mantle = body("伪鲛低扁躯体的外表面", [[.12, .063, .054, .027], [.045, .059, .09, .033], [-.055, .047, .066, .024], [-.13, .039, .024, .016]], skin);
  const outline: [number, number][] = [[-.04, .119], [-.0715, .079], [-.088, .045], [-.064, -.055], [-.022, -.129], [.022, -.129], [.064, -.055], [.088, .045], [.0715, .079], [.04, .119]];
  const trunk = polygon("伪鲛顶部围绕两个真实背鳃孔的低扁活体躯干", skin, outline, 1, [0, 0, 0], [-1, 1].map(side => Array.from({ length: 16 }, (_, i) => [side * .059 + Math.cos(i * Math.PI / 8) * .013, .035 + Math.sin(i * Math.PI / 8) * .013] as [number, number])));
  trunk.vertices = trunk.vertices!.map(point => ({ ...point, y: point.y > 0 ? surfaceHeight(mantle, point.x, point.z) : .025 }));
  const belly = polygon("伪鲛鳃腔下方连续封闭而不填入鳃孔的腹底", skin, outline, .012, [0, .024, 0]);
  const head = polygon("伪鲛环绕真实朝上口孔而不填入内腔的头部外壁", skin, [[-.035, .183], [-.06, .155], [-.062, .114], [-.05, .083], [.05, .083], [.062, .114], [.06, .155], [.035, .183]], .04, [0, .064, 0], [Array.from({ length: 20 }, (_, i) => [Math.cos(i * Math.PI / 10) * .025, .153 + Math.sin(i * Math.PI / 10) * .025] as [number, number])]);
  const parts: ModelPart[] = [trunk, belly, head, cap("伪鲛真正朝上而内壁下凹的厚唇吸食口腔", fin, [0, .088, .153], .027, .018, 3), body("伪鲛胸盘后渐细的长尾轴", [[-.11, .041, .025, .016], [-.19, .034, .015, .016], [-.28, .03, .008, .012], [-.34, .026, .003, .006]], skin), ...eyes([0, .105, .109], .032, .014), membrane("伪鲛尾部较小的上缘鳍叶", fin, [[0, .037, -.255], [0, .071, -.312], [0, .061, -.386], [0, .025, -.34]]), membrane("伪鲛尾部不带毒刺的下缘鳍叶", fin, [[0, .026, -.266], [0, -.003, -.323], [0, .012, -.38], [0, .029, -.34]])];
  const scales: ModelPart[] = [];
  for (const side of [-1, 1]) {
    parts.push(membrane("伪鲛头后两侧巨大而较硬的翼状胸鳍", fin, [[side * .043, .073, .121], [side * .133, .059, .126], [side * .219, .033, .067], [side * .235, .022, -.019], [side * .179, .025, -.113], [side * .084, .036, -.15], [side * .038, .047, -.082]]), membrane("伪鲛胸鳍后缘之后真正分开的短腹鳍", fin, [[side * .025, .034, -.105], [side * .098, .018, -.137], [side * .121, .014, -.202], [side * .071, .015, -.216], [side * .02, .032, -.153]]), cap("伪鲛开向背侧而不是腹面的鳃腔出口缘", skin, [side * .059, .077, .035], .014, .009, 3));
  }
  for (let i = 0; i < 58; i++) {
    const a = i * 2.4, r = Math.sqrt((i + .5) / 58), x = Math.cos(a) * r * .067, z = .014 + Math.sin(a) * r * .094, y = surfaceHeight(trunk, x, z);
    if (!Number.isFinite(y) || Math.hypot(Math.abs(x) - .059, z - .035) < .022) continue;
    scales.push(lobe("伪鲛躯体上互不融合而成镶嵌状的细骨甲与疣突", armor, [x, y - .0012, z], [.012, .006, .014]));
  }
  for (let i = 0; i < scales.length; i += 35) parts.push(combineMeshes("伪鲛保留缝隙且不铺满胸鳍的镶嵌体甲", armor, scales.slice(i, i + 35)));
  return parts;
}

// https://www.nature.com/articles/nature07533
// https://doi.org/10.1111/pala.12460
function odontochelys(): ModelPart[] {
  const trunk = convexValve("半甲齿龟缺乏封闭背甲而由皮肤覆盖的低宽躯干", [[-.048, .091], [-.071, .06], [-.077, -.015], [-.055, -.089], [0, -.105], [.055, -.089], [.077, -.015], [.071, .06], [.048, .091]], .035, .011);
  trunk.position.y = .046; trunk.color = skin;
  const plastron = polygon("半甲齿龟先形成的完整腹甲及真正未骨化的狭长中窗", armor, [[-.035, .095], [-.055, .072], [-.083, .052], [-.074, .026], [-.085, -.018], [-.067, -.065], [-.045, -.098], [.045, -.098], [.067, -.065], [.085, -.018], [.074, .026], [.083, .052], [.055, .072], [.035, .095]], .008, [0, .031, 0], [[[-.004, -.03], [-.004, .023], [.004, .023], [.004, -.03]]]);
  const parts: ModelPart[] = [trunk, plastron, tapered("半甲齿龟伸在肋篮前方而不能缩回的细颈", skin, [[0, .064, .079], [0, .074, .14]], [.019, .013]), body("半甲齿龟长于现生龟喙且前端仍有真齿的头颅", [[.194, .077, .009, .009], [.175, .087, .022, .018], [.143, .079, .019, .018]], skin), body("半甲齿龟与上颌留有真实口隙的细下颌", [[.195, .052, .008, .004], [.173, .052, .019, .006], [.148, .063, .016, .008]], fin), ...eyes([0, .1, .169], .017, .007), tapered("半甲齿龟腹甲之后占体长较大比例的长尾", skin, [[0, .05, -.085], [.008, .035, -.149], [.02, .021, -.213]], [.021, .013, .0015])];
  const ridges: ModelPart[] = [], teeth: ModelPart[] = [], claws: ModelPart[] = [];
  for (let rib = 0; rib < 8; rib++) for (const side of [-1, 1]) {
    const z = .071 - rib * .021, span = .049 + Math.sin(rib / 7 * Math.PI) * .018;
    const path: Triple[] = [.008, .028, span].map(x => [side * x, surfaceHeight(trunk, side * x, z) - .001, z]);
    ridges.push(tapered("半甲齿龟皮下八对增宽但未彼此融合的背肋隆起", skin, path, [.003, .0034, .002]));
  }
  for (let i = 0; i < ridges.length; i += 12) parts.push(combineMeshes("半甲齿龟无盾片背面可辨的皮下肋篮轮廓", skin, ridges.slice(i, i + 12)));
  for (const side of [-1, 1]) for (const rear of [false, true]) {
    const z = rear ? -.065 : .066, wrist: Triple = [side * .105, .018, z + (rear ? .016 : .03)];
    parts.push(tapered("半甲齿龟位于肋篮外而保留肘膝的完整短肢", skin, [[side * .055, .053, z], [side * .091, .034, z - .01], wrist], [.014, .01, .006]));
    for (let i = 0; i < 5; i++) {
      const tip: Triple = [side * (.085 + i * .0105), .009, wrist[2] + .034 + Math.sin(i / 4 * Math.PI) * .011];
      parts.push(tapered("半甲齿龟尚非长桨肢的五根独立指趾", skin, [wrist, tip], [.003, .001]));
      claws.push(needle("半甲齿龟指趾末端的小爪", pale, tip, [tip[0], .008, tip[2] + .009], .002));
    }
  }
  for (const side of [-1, 1]) for (let i = 0; i < 9; i++) {
    const x = side * (.017 - i * .00115), z = .153 + i * .0045;
    teeth.push(needle("半甲齿龟上颌前后连续的小尖齿", pale, [x, .071, z], [x, .057, z + .0005], .0022), needle("半甲齿龟下颌错列的小尖齿", pale, [x, .058, z + .0015], [x, .068, z + .0015], .002));
  }
  parts.push(combineMeshes("半甲齿龟现代龟喙所没有的上下真齿列", pale, teeth), combineMeshes("半甲齿龟独立指趾的小爪", pale, claws));
  // ACT: 腹甲中窗露出的是软皮；不把未骨化区做成贯穿活体腹腔的洞。
  return parts;
}

export const aquaticExpansionBatchTwelveMoreDesigns: MasterNatureDesign[] = [
  design("simosaurus", "扁鼻龙", "动物", simosaurus, ["Simosaurus gaillardoti", "宽钝颅短圆破碎齿与粗前肢低扁胸腹", "完整古海生爬行动物形态复原"]),
  design("sinosaurosphargis", "云贵中国龙龟", "动物", sinosaurosphargis, ["Sinosaurosphargis yunguiensis", "整背密集细骨甲与闭合宽肋篮的圆盘躯", "完整古海生爬行动物形态复原"]),
  design("gerrothorax", "美丽柳胸螈", "动物", gerrothorax, ["Gerrothorax pulcherrimus", "极扁甲躯抬头吸食宽口与细弱四肢", "完整古两栖动物形态复原"]),
  design("bothriolepis", "加拿大沟鳞鱼", "动物", bothriolepis, ["Bothriolepis canadensis", "骨甲箱双节狭长胸鳍和无甲长后躯", "完整盾皮鱼形态复原"]),
  design("gemuendina", "伪鲛", "动物", gemuendina, ["Gemuendina stuertzi", "朝上口和鳃腔镶嵌骨甲与巨大硬胸鳍", "完整盾皮鱼形态复原"]),
  design("odontochelys", "半甲齿龟", "动物", odontochelys, ["Odontochelys semitestacea", "有真齿长尾先形成腹甲而无封闭背甲", "完整早期龟类形态复原"]),
];
