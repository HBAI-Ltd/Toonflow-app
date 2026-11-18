import { beam, combineMeshes, design, eyes, lobe, needle, polygon, tapered } from "./shared";
import type { MasterNatureDesign, ModelPart, Triple } from "./shared";
import { body } from "./fishForms";
import { membrane } from "./animals";

const skin = "#9aaca2";
const pale = "#b7c1af";
const dark = "#697d73";
const tooth = "#d8d0b5";
const fur = "#9f9c83";

function cheekCrown(name: string, center: Triple, width: number, height: number, direction: number): ModelPart {
  return combineMeshes(name, tooth, [-1, 0, 1].map(cusp => needle("前后副尖与较高主尖", tooth, [center[0], center[1], center[2] + cusp * width * .42], [center[0], center[1] + direction * height * (cusp ? .57 : 1), center[2] + cusp * width * .46], width * (cusp ? .37 : .62))));
}

function metricParts(parts: ModelPart[], factor: number): ModelPart[] {
  return parts.map(item => ({ ...item, position: { x: item.position.x * factor, y: item.position.y * factor, z: item.position.z * factor }, scale: { x: item.scale.x * factor, y: item.scale.y * factor, z: item.scale.z * factor } }));
}

// https://animaldiversity.org/accounts/Hydrodamalis_gigas/
// https://www.cambridge.org/core/books/abs/ecology-and-conservation-of-the-sirenia/stellers-sea-cow/80C33B75EFB1BFF73D81A6430BD738CD
function stellersSeaCow(): ModelPart[] {
  const sections: [number, number, number, number][] = [[2.42, 1.34, .59, .56], [1.9, 1.4, .88, .82], [1.3, 1.39, 1.05, .99], [.55, 1.35, 1.12, 1.05], [-.25, 1.26, 1.12, 1.01], [-1.05, 1.12, 1.0, .87], [-1.8, .96, .76, .66], [-2.45, .81, .46, .41], [-3.1, .74, .18, .17], [-3.48, .73, .10, .1]];
  const folds: [number, number, number, number][] = [];
  for (let i = 0; i < sections.length - 1; i++) {
    const a = sections[i]!, b = sections[i + 1]!;
    folds.push(a, [(a[0] + b[0]) / 2 + .035, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2 + .012, (a[3] + b[3]) / 2 + .012], [(a[0] + b[0]) / 2 - .035, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2 - .012, (a[3] + b[3]) / 2 - .012]);
  }
  folds.push(sections.at(-1)!);
  const parts: ModelPart[] = [body("大海牛粗桶状胸腹和实际起伏的厚皮皱褶", folds, skin), body("大海牛相对很小且口鼻不深下弯的头", [[3.48, 1.31, .18, .12], [3.17, 1.44, .36, .24], [2.75, 1.55, .47, .41], [2.28, 1.43, .56, .53]], skin), body("大海牛与上吻分开而保留真实口隙的无齿下颌", [[3.49, 1.07, .16, .055], [3.2, 1.04, .30, .07], [2.81, 1.16, .36, .2]], pale), ...eyes([0, 1.72, 2.92], .38, .047), polygon("大海牛下口内的宽角质咀嚼板", tooth, [[-.14, -.15], [.14, -.15], [.19, .1], [.12, .22], [-.12, .22], [-.19, .1]], .022, [0, 1.115, 3.2]), polygon("大海牛上腭对应的无齿角质板", tooth, [[-.14, -.13], [.14, -.13], [.17, .14], [0, .22], [-.17, .14]], .018, [0, 1.178, 3.2])];
  const ridges: ModelPart[] = [], bristles: ModelPart[] = [];
  for (let i = 0; i < 6; i++) {
    const z = 3.09 + i * .043;
    ridges.push(beam("角质口板上的斜向咀嚼脊", pale, [-.13, 1.143, z], [.13, 1.143, z + .045], .01, .014), beam("上口板倒悬并与下板错开的斜脊", pale, [-.12, 1.174, z + .024], [.12, 1.174, z + .063], .009, .013));
  }
  // ACT: 口板斜脊使用实体薄梁，保留两板之间的空气间隙；不以黑色贴片冒充口腔。
  parts.push(...ridges);
  for (const side of [-1, 1]) {
    parts.push(tapered("大海牛没有指骨的短粗钩状前肢", skin, [[side * .7, .98, 1.75], [side * 1.14, .45, 1.52], [side * 1.27, .29, 1.55], [side * 1.3, .32, 1.79]], [.2, .18, .14, .065]), lobe("短钩鳍末端厚角质掌垫", pale, [side * 1.28, .27, 1.61], [.24, .12, .34]), lobe("大海牛肥厚而向前外伸的上唇", skin, [side * .16, 1.295, 3.46], [.34, .25, .2]), lobe("高位成对鼻孔的深凹口", dark, [side * .082, 1.6, 3.2], [.065, .018, .09]));
    for (let i = 0; i < 6; i++) bristles.push(needle("短钩鳍角质端部的硬刚毛", pale, [side * (1.2 + i * .021), .27, 1.73], [side * (1.21 + i * .024), .24, 1.81 + Math.sin(i) * .015], .006), needle("大海牛吻前稀疏的粗须", pale, [side * .25, 1.3, 3.48 - i * .02], [side * (.34 + i * .01), 1.25, 3.54 - i * .018], .005));
    parts.push(membrane("大海牛宽阔尾叶的独立半叶与中央缺刻", pale, [[0, .73, -3.4], [side * .71, .76, -3.57], [side * 1.14, .72, -4.02], [side * .55, .70, -3.96], [side * .025, .72, -3.78]]));
  }
  parts.push(combineMeshes("大海牛吻须与钩鳍硬毛", pale, bristles));
  return parts;
}

// https://www.sciencedirect.com/science/article/pii/S0960982219302209
function peregocetus(): ModelPart[] {
  const parts: ModelPart[] = [body("秘鲁走鲸保留承重骨盆的紧凑胸腹", [[.67, .76, .26, .31], [.27, .75, .38, .42], [-.38, .67, .39, .39], [-.89, .57, .29, .29], [-1.12, .52, .16, .17]], skin), tapered("秘鲁走鲸前伸而不具现代鲸额隆的短颈", skin, [[0, .78, .52], [0, .86, .99]], [.23, .19]), body("秘鲁走鲸后宽前窄的长齿吻与高位眼眶", [[1.62, .91, .036, .037], [1.34, .92, .09, .07], [1.08, .97, .18, .16], [.87, .9, .185, .18]], skin), body("秘鲁走鲸与齿吻分离的下颌", [[1.63, .75, .031, .024], [1.31, .745, .083, .027], [1.02, .79, .15, .09], [.9, .84, .155, .1]], pale), tapered("秘鲁走鲸无尾叶且粗基渐细的游泳尾", skin, [[0, .52, -1.02], [.035, .40, -1.52], [.09, .31, -2.04], [.13, .27, -2.3]], [.16, .12, .065, .009]), ...eyes([0, 1.065, 1.11], .153, .039)];
  const teeth: ModelPart[] = [], hoofTips: ModelPart[] = [];
  for (const side of [-1, 1]) {
    parts.push(tapered("秘鲁走鲸保留肘和腕的承重前臂", skin, [[side * .25, .73, .48], [side * .4, .39, .45], [side * .43, .14, .76]], [.105, .077, .048]), tapered("秘鲁走鲸较长的屈膝后腿", skin, [[side * .23, .6, -.72], [side * .48, .34, -.59], [side * .43, .13, -.99]], [.145, .095, .052]), membrane("秘鲁走鲸前掌手指之间的游泳蹼", pale, [[side * .43, .13, .73], [side * .31, .075, .95], [side * .34, .068, 1.07], [side * .58, .068, 1.07], [side * .6, .075, .91]]), membrane("秘鲁走鲸长后足分趾之间的游泳蹼", pale, [[side * .43, .12, -.95], [side * .28, .075, -1.18], [side * .31, .064, -1.4], [side * .59, .064, -1.39], [side * .63, .075, -1.15]]));
    for (let i = 0; i < 5; i++) {
      const x = side * (.33 + i * .06), z = 1.035 + Math.sin(i / 4 * Math.PI) * .052;
      parts.push(tapered("秘鲁走鲸独立而末端带小蹄的五根前指", skin, [[side * .43, .12, .8], [x, .075, z]], [.014, .009]));
      hoofTips.push(lobe("前指末端小角质蹄", dark, [x, .073, z + .012], [.024, .021, .036]));
    }
    for (let i = 0; i < 4; i++) {
      const x = side * (.32 + i * .087), z = -1.36 - Math.sin(i / 3 * Math.PI) * .07;
      parts.push(tapered("秘鲁走鲸后足四根延长的独立泳趾", skin, [[side * .43, .105, -1.01], [x, .07, z]], [.022, .011]));
      hoofTips.push(lobe("后趾末端小角质蹄", dark, [x, .068, z - .012], [.03, .024, .038]));
    }
    for (let i = 0; i < 7; i++) {
      const z = 1.045 + i * .079, x = side * (.134 - i * .015);
      teeth.push(i < 4 ? cheekCrown("秘鲁走鲸后段有主尖副尖的颊齿", [x, .845, z], .034, .064, -1) : needle("秘鲁走鲸前端抓握用的尖齿", tooth, [x, .87, z], [x, .78, z + .003], i === 4 ? .033 : .021));
      teeth.push(i < 4 ? cheekCrown("秘鲁走鲸下颌向上的分化颊齿", [x, .779, z + .028], .031, .055, 1) : needle("秘鲁走鲸下颌抓握尖齿", tooth, [x, .772, z + .026], [x, .85, z + .029], .018));
    }
    parts.push(lobe("秘鲁走鲸吻端而非颅顶的外鼻孔", dark, [side * .028, .956, 1.51], [.023, .015, .035]));
  }
  parts.push(combineMeshes("秘鲁走鲸前后足末端独立小蹄", dark, hoofTips));
  for (let i = 0; i < teeth.length; i += 18) parts.push(combineMeshes("秘鲁走鲸留在真实开口中的异型牙列", tooth, teeth.slice(i, i + 18)));
  // ACT: 尾端未保存，不补现代鲸尾叶；足蹼按指趾形态作保守软组织复原。
  return parts;
}

// https://www.nature.com/articles/35095005
// https://doi.org/10.1007/s12052-009-0135-2
function pakicetus(): ModelPart[] {
  const parts: ModelPart[] = [body("巴基鲸高离地的窄胸与收紧腰腹", [[.4, .57, .13, .18], [.19, .6, .165, .235], [-.2, .6, .15, .19], [-.47, .55, .12, .16]], fur), tapered("巴基鲸前上伸的长陆生颈部", fur, [[0, .64, .29], [0, .78, .59], [0, .77, .72]], [.115, .095, .087]), body("巴基鲸没有海豚额隆的狭长高眼眶头", [[1.03, .77, .026, .03], [.86, .795, .055, .056], [.69, .83, .095, .106], [.58, .79, .087, .1]], fur), body("巴基鲸微张后露出齿列的细长下颌", [[1.035, .672, .024, .018], [.85, .67, .049, .02], [.655, .711, .079, .052]], pale), tapered("巴基鲸未经鳍化且向后渐细的长尾", fur, [[0, .55, -.43], [0, .44, -.75], [.04, .32, -.99], [.08, .25, -1.09]], [.058, .043, .024, .004]), ...eyes([0, .895, .71], .075, .023)];
  const hoofTips: ModelPart[] = [], teeth: ModelPart[] = [];
  for (const side of [-1, 1]) {
    parts.push(tapered("巴基鲸近矢状面内站立的细长前肢", fur, [[side * .105, .58, .26], [side * .13, .34, .20], [side * .13, .105, .32]], [.043, .03, .022]), tapered("巴基鲸大腿前屈而跗部后伸的完整长后腿", fur, [[side * .1, .55, -.36], [side * .15, .33, -.23], [side * .145, .13, -.44], [side * .145, .08, -.36]], [.066, .041, .025, .023]), lobe("巴基鲸高位眼眶前的短眉骨皮隆", fur, [side * .064, .877, .732], [.08, .038, .093]));
    for (const front of [true, false]) {
      const z = front ? .32 : -.36, x = side * (front ? .13 : .145);
      for (let i = 0; i < 4; i++) {
        const end: Triple = [x + (i - 1.5) * .025, .025, z + .13 + Math.sin(i / 3 * Math.PI) * .012];
        parts.push(tapered("巴基鲸长跖骨之后分开的承重趾", fur, [[x, .08, z], end], [.012, .007]));
        hoofTips.push(lobe("巴基鲸足趾末端的小蹄质结构", dark, [end[0], .023, end[2] + .008], [.019, .021, .025]));
      }
    }
    parts.push(tapered("巴基鲸前足内侧保留的缩短第一指", fur, [[side * .12, .08, .32], [side * .085, .052, .397]], [.01, .006]));
    hoofTips.push(lobe("巴基鲸前掌第一指的小蹄端", dark, [side * .085, .049, .403], [.016, .017, .022]));
    for (let i = 0; i < 7; i++) {
      const z = .7 + i * .047, x = side * (.068 - i * .0075);
      teeth.push(i < 3 ? cheekCrown("巴基鲸非同型的后颊齿", [x, .745, z], .021, .048, -1) : needle("巴基鲸长吻内的尖齿", tooth, [x, .746, z], [x, .685, z + .002], i === 3 ? .022 : .014));
      teeth.push(needle("巴基鲸下颌错列的尖齿", tooth, [x, .689, z + .016], [x, .733, z + .018], .013));
    }
    parts.push(lobe("巴基鲸仍靠近吻前部的外鼻孔", dark, [side * .019, .812, .945], [.017, .011, .022]));
  }
  parts.push(combineMeshes("巴基鲸各趾独立而非偶蹄式合并的蹄端", dark, hoofTips), combineMeshes("巴基鲸细长开口中的完整可见异型齿列", tooth, teeth));
  return metricParts(parts, .68);
}

// https://pmc.ncbi.nlm.nih.gov/articles/PMC6905522/
// https://iyadzalmout.com/ ：发掘者给出的体长约3.6米。
function aegicetus(): ModelPart[] {
  const parts: ModelPart[] = [body("神盾鲸极宽扁胸骨对应的前胸与延长后躯", [[.61, .9, .24, .26], [.15, .87, .44, .38], [-.31, .79, .43, .36], [-.69, .65, .34, .30], [-1.01, .5, .22, .2], [-1.3, .43, .14, .14]], skin), tapered("神盾鲸短而平顺地连接狭颅的颈部", skin, [[0, .9, .45], [0, .97, .81]], [.22, .17]), body("神盾鲸有窄后颅和长吻的原鲸类头部", [[1.60, 1.02, .042, .038], [1.33, 1.04, .098, .065], [1.02, 1.06, .17, .145], [.73, 1.0, .17, .17]], skin), body("神盾鲸下颌联合细长而与上颌分离", [[1.62, .85, .037, .024], [1.30, .842, .092, .029], [.98, .895, .149, .09], [.76, .944, .15, .1]], pale), tapered("神盾鲸用于躯尾波动且没有现代尾叶的长粗尾", skin, [[0, .43, -1.22], [.07, .36, -1.54], [.16, .31, -1.89], [.23, .3, -2.02]], [.15, .12, .063, .009]), ...eyes([0, 1.17, 1.04], .143, .033)];
  const teeth: ModelPart[] = [], nails: ModelPart[] = [];
  for (const side of [-1, 1]) {
    parts.push(tapered("神盾鲸相对粗大的短前臂与明显肘弯", skin, [[side * .32, .75, .2], [side * .67, .45, .14], [side * .75, .27, -.08]], [.13, .105, .069]), membrane("神盾鲸短前肢末端仍分指的宽掌蹼", pale, [[side * .69, .29, 0], [side * .93, .24, -.22], [side * 1.05, .22, -.48], [side * .65, .22, -.49], [side * .64, .27, -.13]]), tapered("神盾鲸不能承重且明显缩短的后肢", skin, [[side * .2, .51, -.98], [side * .4, .34, -1.11], [side * .39, .25, -1.36]], [.079, .058, .037]), membrane("神盾鲸不再大于前掌的窄后足蹼", pale, [[side * .35, .265, -1.30], [side * .58, .22, -1.51], [side * .54, .21, -1.78], [side * .29, .21, -1.74], [side * .3, .245, -1.40]]));
    for (let i = 0; i < 5; i++) {
      const x = side * (.68 + i * .083), z = -.442 - Math.sin(i / 4 * Math.PI) * .07;
      parts.push(tapered("神盾鲸宽前掌中分开的短手指", skin, [[side * .76, .27, -.11], [x, .23, z]], [.018, .01]));
      nails.push(lobe("神盾鲸前指的小角质端", dark, [x, .23, z - .012], [.025, .018, .03]));
    }
    for (let i = 0; i < 4; i++) parts.push(tapered("神盾鲸后足中较细的四根泳趾", skin, [[side * .39, .25, -1.38], [side * (.31 + i * .072), .22, -1.72 - Math.sin(i / 3 * Math.PI) * .045]], [.014, .007]));
    for (let i = 0; i < 8; i++) {
      const z = .93 + i * .079, x = side * (.142 - i * .015);
      teeth.push(i < 5 ? cheekCrown("神盾鲸有较高主尖的后颊齿", [x, .96, z], .036, .065, -1) : needle("神盾鲸前部抓握尖齿", tooth, [x, .977, z], [x, .87, z], i === 5 ? .032 : .02));
      teeth.push(i < 5 ? cheekCrown("神盾鲸下颌错列的后颊齿", [x, .884, z + .025], .032, .06, 1) : needle("神盾鲸下颌前尖齿", tooth, [x, .874, z + .025], [x, .95, z + .025], .019));
    }
  }
  parts.push(combineMeshes("神盾鲸五指前掌的小角质端", dark, nails));
  for (let i = 0; i < teeth.length; i += 16) parts.push(combineMeshes("神盾鲸真实口隙中的异型齿组", tooth, teeth.slice(i, i + 16)));
  return parts;
}

// https://lsa.umich.edu/content/dam/paleontology-assets/paleontology-documents/beyond-exhibits/Information_module_Dorudon.pdf
function dorudon(): ModelPart[] {
  const parts: ModelPart[] = [body("矛齿鲸不具龙王鲸蛇形躯的粗壮胸腹与短尾柄", [[1.39, .83, .21, .24], [.92, .79, .37, .40], [.2, .73, .44, .46], [-.62, .63, .34, .38], [-1.29, .51, .19, .24], [-1.85, .45, .07, .10]], skin), body("矛齿鲸无额隆且保留长齿颌的厚颅", [[2.42, .91, .041, .034], [2.09, .93, .11, .07], [1.76, .98, .21, .16], [1.39, .87, .23, .23]], skin), body("矛齿鲸开口中分离的长而深的下颌", [[2.43, .70, .038, .022], [2.07, .69, .105, .028], [1.73, .745, .185, .095], [1.42, .80, .19, .12]], pale), ...eyes([0, 1.08, 1.79], .185, .036), lobe("矛齿鲸头顶前移但未达现代鲸颅顶的鼻区", skin, [0, 1.07, 1.98], [.14, .06, .19])];
  const teeth: ModelPart[] = [];
  for (const side of [-1, 1]) {
    parts.push(membrane("矛齿鲸宽肘部和延长手部组成的前鳍肢", pale, [[side * .29, .67, 1.03], [side * .67, .44, .82], [side * 1.04, .27, .24], [side * .87, .24, .16], [side * .45, .47, .55], [side * .25, .59, .75]]), tapered("矛齿鲸体壁外露而无法承重的微小后大腿和小腿", skin, [[side * .24, .47, -.88], [side * .36, .32, -.94], [side * .36, .29, -.82]], [.035, .024, .014]), membrane("矛齿鲸尾柄后水平展开且中央保留缺刻的半尾叶", pale, [[0, .45, -1.78], [side * .58, .47, -1.91], [side * .86, .45, -2.36], [side * .36, .43, -2.27], [side * .025, .44, -2.11]]));
    for (let i = 0; i < 3; i++) parts.push(tapered("矛齿鲸外露后足末端三根残余小趾", pale, [[side * .36, .29, -.82], [side * (.326 + i * .034), .275, -.735 + Math.sin(i) * .012]], [.009, .003]));
    for (let row = 0; row < 2; row++) {
      const count = row ? 11 : 10;
      for (let i = 0; i < count; i++) {
        const t = i / (count - 1), z = 1.54 + t * .81 + row * .016, x = side * (.17 - t * .139), y = row ? .735 - t * .018 : .86 + t * .025;
        if (i < (row ? 7 : 6)) teeth.push(cheekCrown("矛齿鲸有切割副尖的异型前臼齿和臼齿", [x, y, z], .041 - t * .012, .085 - t * .018, row ? 1 : -1));
        else teeth.push(needle("矛齿鲸前部单尖门齿与长犬齿", tooth, [x, y, z], [x, y + (row ? 1 : -1) * (i === count - 4 ? .12 : .08), z + .005], i === count - 4 ? .035 : .022));
      }
    }
    parts.push(lobe("矛齿鲸成对的鼻孔", dark, [side * .034, 1.101, 1.99], [.032, .012, .061]));
  }
  for (let i = 0; i < teeth.length; i += 20) parts.push(combineMeshes("矛齿鲸上二下三臼齿配置的四十二枚异型齿列", tooth, teeth.slice(i, i + 20)));
  return parts;
}

// https://www.si.edu/object/acrophoca-longirostris-de-muizon:nmnhpaleobiology_3445006
function acrophoca(): ModelPart[] {
  const parts: ModelPart[] = [body("长吻弓海豹细长而低伏的完整躯体", [[.55, .34, .18, .18], [.08, .30, .26, .25], [-.52, .25, .22, .22], [-.98, .20, .115, .13]], skin), tapered("长吻弓海豹真正伸出肩部且可弯曲的长颈", skin, [[0, .34, .43], [0, .45, .74], [0, .65, 1.02], [0, .68, 1.18]], [.15, .125, .10, .09]), body("长吻弓海豹眼后窄而吻部异常延长的头颅", [[1.59, .65, .037, .035], [1.39, .69, .065, .057], [1.21, .72, .108, .105], [1.06, .68, .09, .1]], skin), body("长吻弓海豹与上颌分开的一条薄长下颌", [[1.6, .555, .034, .019], [1.38, .564, .06, .026], [1.15, .62, .082, .048]], pale), ...eyes([0, .773, 1.25], .086, .026), tapered("长吻弓海豹位于两后鳍之间的短尾", skin, [[0, .2, -.94], [0, .16, -1.16]], [.036, .008])];
  const teeth: ModelPart[] = [], whiskers: ModelPart[] = [];
  for (const side of [-1, 1]) {
    parts.push(membrane("长吻弓海豹较小且贴于躯侧的前鳍肢", pale, [[side * .18, .29, .35], [side * .5, .13, .2], [side * .63, .09, -.13], [side * .45, .09, -.15], [side * .18, .22, .09]]), tapered("长吻弓海豹后肢向身后而非翻到体下的踝根", skin, [[side * .065, .2, -.9], [side * .15, .16, -1.11]], [.071, .043]), membrane("长吻弓海豹分指的后鳍扇", pale, [[side * .12, .16, -1.02], [side * .39, .11, -1.19], [side * .48, .09, -1.46], [side * .35, .09, -1.57], [side * .13, .10, -1.41], [side * .085, .15, -1.1]]), lobe("长吻弓海豹吻端的窄须垫", pale, [side * .039, .63, 1.54], [.09, .063, .12]));
    for (let i = 0; i < 5; i++) {
      parts.push(tapered("长吻弓海豹后鳍内部独立的放射长趾", skin, [[side * .145, .15, -1.1], [side * (.16 + i * .067), .105, -1.39 - Math.sin(i / 4 * Math.PI) * .15]], [.009, .003]));
      whiskers.push(needle("长吻弓海豹吻前展开的感觉须", pale, [side * .05, .63, 1.54 - i * .013], [side * (.14 + i * .008), .61 + i * .009, 1.64 - i * .018], .0025));
      const z = 1.27 + i * .053, x = side * (.073 - i * .008);
      teeth.push(i === 3 ? needle("长吻弓海豹上颌犬齿", tooth, [x, .63, z], [x, .57, z + .006], .017) : cheekCrown("长吻弓海豹口隙内的细小后颊齿", [x, .624, z], .018, .033, -1));
    }
  }
  parts.push(combineMeshes("长吻弓海豹真实开口中的犬齿颊齿", tooth, teeth), combineMeshes("长吻弓海豹细须组", pale, whiskers));
  return metricParts(parts, .55);
}

// https://pubmed.ncbi.nlm.nih.gov/17818847/
// https://doi.org/10.1080/02724634.1990.10011803
function enaliarctos(): ModelPart[] {
  const parts: ModelPart[] = [body("海熊兽前胸隆起而腰部明显收窄的短躯", [[.49, .45, .16, .19], [.19, .43, .235, .27], [-.23, .34, .19, .21], [-.6, .26, .13, .15]], fur), tapered("海熊兽肩前可以抬起的短颈", fur, [[0, .45, .37], [0, .62, .67]], [.14, .11]), body("海熊兽无海象獠牙的犬状尖吻头", [[.99, .64, .034, .032], [.83, .68, .075, .066], [.65, .72, .115, .12], [.54, .65, .10, .11]], fur), body("海熊兽有真正牙列间隙的下颌", [[1.0, .524, .031, .023], [.81, .53, .069, .031], [.61, .59, .091, .058]], pale), ...eyes([0, .779, .7], .094, .025), tapered("海熊兽两后鳍根之间的短尾", fur, [[0, .27, -.56], [0, .18, -.78]], [.034, .008])];
  const teeth: ModelPart[] = [], claws: ModelPart[] = [];
  for (const side of [-1, 1]) {
    parts.push(tapered("海熊兽可支撑身体的短上臂与粗肘", fur, [[side * .16, .44, .33], [side * .33, .2, .34], [side * .36, .11, .55]], [.08, .066, .045]), membrane("海熊兽已鳍化却保留指端的宽前掌", pale, [[side * .31, .12, .49], [side * .55, .07, .64], [side * .61, .055, .48], [side * .48, .055, .2], [side * .32, .09, .38]]), tapered("海熊兽仍可前收并有完整膝踝的后腿", fur, [[side * .12, .29, -.48], [side * .29, .18, -.35], [side * .39, .09, -.66]], [.09, .071, .047]), membrane("海熊兽伸长的后足鳍与独立趾缘", pale, [[side * .36, .105, -.61], [side * .66, .07, -.77], [side * .72, .055, -1.0], [side * .53, .055, -1.1], [side * .32, .075, -.83]]), lobe("海熊兽尖吻末端的鼻垫", dark, [side * .024, .658, .978], [.058, .035, .045]));
    for (let i = 0; i < 5; i++) {
      const x = side * (.4 + i * .061), z = -1.015 - Math.sin(i / 4 * Math.PI) * .063;
      parts.push(tapered("海熊兽后鳍中细长而分离的五趾", fur, [[side * .39, .095, -.68], [x, .065, z]], [.012, .005]));
      claws.push(needle("海熊兽后鳍趾端的小爪", tooth, [x, .065, z], [x, .06, z - .033], .009));
      const tip: Triple = [side * [.45, .51, .56, .56, .49][i]!, .065, [.61, .60, .51, .39, .26][i]!];
      parts.push(tapered("海熊兽前鳍内仍分开的五根手指", fur, [[side * .36, .105, .49], tip], [.011, .0045]));
      claws.push(needle("海熊兽前鳍指缘的小爪", tooth, tip, [tip[0] + side * .017, .06, tip[2] + .015], .007));
    }
    teeth.push(needle("海熊兽前上颌独立粗犬齿", tooth, [side * .045, .603, .9], [side * .044, .527, .913], .026), cheekCrown("海熊兽仍能切肉的后上裂齿", [side * .079, .605, .73], .042, .043, -1), cheekCrown("海熊兽与上裂齿错开的下裂齿", [side * .079, .563, .757], .038, .04, 1));
    for (let i = 0; i < 3; i++) teeth.push(needle("海熊兽前部细小的尖门齿", tooth, [side * (.015 + i * .008), .61, .94 + i * .015], [side * (.015 + i * .008), .557, .942 + i * .015], .011));
  }
  parts.push(combineMeshes("海熊兽犬齿及保留切割功能的裂齿", tooth, teeth), combineMeshes("海熊兽前后鳍独立指趾的小爪", tooth, claws));
  return metricParts(parts, .82);
}

// https://www.nature.com/articles/nature07985
function puijila(): ModelPart[] {
  const parts: ModelPart[] = [body("普伊吉拉兽窄腰前方的宽肩与深胸", [[.3, .32, .10, .13], [.1, .31, .145, .18], [-.2, .27, .115, .135], [-.38, .25, .085, .10]], fur), tapered("普伊吉拉兽前肩上抬的短颈", fur, [[0, .34, .23], [0, .43, .4]], [.085, .072]), body("普伊吉拉兽高而宽的后颅及较短犬状吻", [[.63, .44, .024, .026], [.52, .465, .045, .051], [.41, .49, .086, .087], [.34, .45, .075, .08]], fur), body("普伊吉拉兽有可见牙床间隙的下颌", [[.635, .36, .023, .016], [.51, .361, .044, .02], [.39, .405, .065, .037]], pale), tapered("普伊吉拉兽仍保留陆生食肉类形态的圆长尾", fur, [[0, .25, -.34], [.02, .19, -.56], [.07, .15, -.77], [.09, .13, -.87]], [.046, .032, .019, .003]), ...eyes([0, .529, .456], .069, .021)];
  const claws: ModelPart[] = [], whiskers: ModelPart[] = [], teeth: ModelPart[] = [];
  for (const side of [-1, 1]) {
    parts.push(lobe("普伊吉拉兽粗壮前臂上方的肩肌", fur, [side * .11, .34, .18], [.12, .21, .18]), tapered("普伊吉拉兽未变成鳍片的承重前臂", fur, [[side * .1, .3, .19], [side * .18, .16, .13], [side * .19, .07, .29]], [.052, .036, .025]), tapered("普伊吉拉兽短股骨之后完整的后胫和踝", fur, [[side * .075, .26, -.29], [side * .17, .16, -.21], [side * .17, .07, -.39]], [.058, .037, .024]), membrane("普伊吉拉兽由扁平指骨支持而不是鳍肢的前足蹼", pale, [[side * .19, .072, .26], [side * .10, .033, .39], [side * .13, .03, .48], [side * .29, .03, .47], [side * .31, .035, .35]]), membrane("普伊吉拉兽宽而扁的分趾后足蹼", pale, [[side * .17, .074, -.36], [side * .075, .034, -.48], [side * .11, .03, -.61], [side * .29, .03, -.60], [side * .31, .035, -.47]]), lobe("普伊吉拉兽短吻端的鼻垫", dark, [0, .451, .625], [.056, .034, .04]));
    for (let i = 0; i < 5; i++) for (const front of [true, false]) {
      const x = side * (.115 + i * .043), z = front ? .455 + Math.sin(i / 4 * Math.PI) * .03 : -.575 - Math.sin(i / 4 * Math.PI) * .035;
      parts.push(tapered("普伊吉拉兽蹼中仍能分辨的五根扁趾", fur, [[side * (front ? .19 : .17), .065, front ? .29 : -.39], [x, .034, z]], [.009, .004]));
      claws.push(needle("普伊吉拉兽蹼趾末端小爪", tooth, [x, .034, z], [x, .028, z + (front ? .023 : -.023)], .006));
    }
    teeth.push(needle("普伊吉拉兽上颌犬齿", tooth, [side * .036, .417, .56], [side * .035, .363, .569], .018), cheekCrown("普伊吉拉兽口内保留的后颊齿尖", [side * .05, .419, .482], .025, .033, -1));
    for (let i = 0; i < 4; i++) whiskers.push(needle("普伊吉拉兽短吻侧细须", pale, [side * .038, .429, .582], [side * (.095 + i * .006), .41 + i * .012, .65 - i * .018], .0018));
  }
  parts.push(combineMeshes("普伊吉拉兽分趾小爪", tooth, claws), combineMeshes("普伊吉拉兽口内牙列", tooth, teeth), combineMeshes("普伊吉拉兽短须", pale, whiskers));
  return metricParts(parts, .72);
}

// https://pmc.ncbi.nlm.nih.gov/articles/PMC12497401/
// https://doi.org/10.1007/s10914-014-9268-3
function thalassocnus(): ModelPart[] {
  const parts: ModelPart[] = [body("海懒兽由厚胸肋支持而前胸深后腹渐窄的长躯", [[.48, .61, .22, .29], [.08, .62, .29, .35], [-.42, .56, .27, .30], [-.79, .47, .19, .21]], fur), tapered("海懒兽低伏前伸并稍向下弯的颈", fur, [[0, .64, .42], [0, .63, .72], [0, .58, .87]], [.16, .12, .105]), body("海懒兽长而低的植食性吻部与窄颅", [[1.18, .535, .055, .035], [1.0, .59, .11, .075], [.83, .64, .13, .12], [.71, .61, .12, .12]], fur), body("海懒兽无前门齿的长下颌及真口隙", [[1.19, .414, .05, .023], [1.0, .438, .10, .035], [.79, .52, .11, .067]], pale), tapered("海懒兽长而渐细且不带尾鳍的平衡尾", fur, [[0, .47, -.72], [.015, .32, -1.12], [.07, .18, -1.52], [.1, .14, -1.7]], [.15, .1, .049, .008]), ...eyes([0, .691, .91], .102, .027)];
  const claws: ModelPart[] = [], teeth: ModelPart[] = [];
  for (const side of [-1, 1]) {
    parts.push(tapered("海懒兽有粗壮肱骨和可屈肘的前肢", fur, [[side * .19, .58, .36], [side * .37, .34, .17], [side * .37, .13, .48]], [.106, .083, .055]), lobe("海懒兽以掌外侧落地而内爪上收的前掌", fur, [side * .39, .105, .52], [.18, .12, .21], [0, 0, side * 24]), tapered("海懒兽股胫均较长的完整后腿", fur, [[side * .18, .46, -.64], [side * .38, .26, -.48], [side * .37, .1, -.74]], [.116, .083, .05]), lobe("海懒兽保留侧足行走姿态的外侧后足", fur, [side * .41, .075, -.71], [.15, .12, .28], [0, 0, side * 22]));
    for (let i = 0; i < 3; i++) {
      const x = side * (.31 + i * .06), z = .57 + Math.sin(i / 2 * Math.PI) * .05;
      parts.push(tapered("海懒兽粗短掌中能独立屈曲的前指", fur, [[side * .37, .14, .47], [x, .13, z]], [.026, .018]));
      claws.push(tapered("海懒兽不是鳍条而是向下内钩的长爪", tooth, [[x, .13, z], [x, .09, z + .105], [x + side * .017, .035, z + .105]], [.021, .015, .001]));
    }
    parts.push(tapered("海懒兽前掌缩短的内侧第一指", fur, [[side * .34, .14, .48], [side * .265, .16, .555]], [.019, .012]), lobe("海懒兽前掌没有爪的退化第五指", fur, [side * .49, .12, .52], [.065, .05, .09]), lobe("海懒兽后足不承重的短第五趾", fur, [side * .49, .1, -.65], [.05, .045, .085]));
    claws.push(tapered("海懒兽前掌第一指上较小的短钩爪", tooth, [[side * .265, .16, .555], [side * .252, .13, .605], [side * .25, .093, .603]], [.013, .009, .001]));
    for (let i = 0; i < 3; i++) {
      const x = side * (.31 + i * .055), z = -.65 + i * .035;
      claws.push(tapered(i === 1 ? "海懒兽后足第三趾恒屈形成的锚钩爪" : "海懒兽后足可辨的短钩爪", tooth, [[x, .115, z], [x, .073, z + .11], [x + side * .014, .029, z + .1]], [.019, .012, .001]));
    }
    for (let i = 0; i < 4; i++) teeth.push(lobe("海懒兽无犬齿而呈柱状的后颊齿", tooth, [side * .082, .515, .865 + i * .05], [.036, .052, .038]));
    parts.push(lobe("海懒兽吻前而非头顶的鼻孔", dark, [side * .027, .568, 1.15], [.027, .014, .036]));
  }
  for (let i = 0; i < claws.length; i += 6) parts.push(combineMeshes("海懒兽前后足实体钩爪组", tooth, claws.slice(i, i + 6)));
  parts.push(combineMeshes("海懒兽真实口腔内的柱状后齿", tooth, teeth));
  return metricParts(parts, .88);
}

export const aquaticExpansionBatchTwelveDesigns: MasterNatureDesign[] = [
  design("stellersSeaCow", "大海牛", "动物", stellersSeaCow, ["Hydrodamalis gigas", "无指骨短钩鳍与斜脊角质咀嚼板", "完整海牛形态复原"]),
  design("peregocetus", "秘鲁走鲸", "动物", peregocetus, ["Peregocetus pacificus", "四条承重肢五指四趾与带小蹄的泳蹼", "完整古鲸形态复原"]),
  design("aegicetus", "神盾鲸", "动物", aegicetus, ["Aegicetus gehennae", "宽扁前胸缩短后肢与不带尾叶的躯尾", "完整古鲸形态复原"]),
  design("dorudon", "矛齿鲸", "动物", dorudon, ["Dorudon atrox", "四十二枚异型齿和体外微小三趾后足", "完整古鲸形态复原"]),
  design("acrophoca", "长吻弓海豹", "动物", acrophoca, ["Acrophoca longirostris", "细长可曲颈长吻与向后延伸的后足扇", "完整古鳍足类形态复原"]),
  design("enaliarctos", "海熊兽", "动物", enaliarctos, ["Enaliarctos mealsi", "保留裂齿与可承重膝踝的前后鳍肢", "完整古鳍足类形态复原"]),
  design("thalassocnus", "海懒兽", "动物", thalassocnus, ["Thalassocnus natans", "侧足行走长尾与屈曲锚钩爪", "完整水生树懒形态复原"]),
  design("pakicetus", "巴基鲸", "动物", pakicetus, ["Pakicetus attocki", "长承重肢高眼眶长齿吻与独立蹄趾", "完整浅水古鲸形态复原"]),
  design("puijila", "普伊吉拉兽", "动物", puijila, ["Puijila darwini", "粗肩前肢扁平蹼趾和未鳍化四肢", "完整早期鳍足类近亲形态复原"]),
];
