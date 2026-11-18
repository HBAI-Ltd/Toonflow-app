import { Quaternion, Vector3 } from "three";
import { combineMeshes, design, eyes, leaf, lobe, part, tapered } from "./shared";
import type { MasterNatureDesign, ModelPart, Triple } from "./shared";
import { fourFeet, head } from "./mammalForms";
import { pointed } from "./insectForms";

const hide = "#a8b19b";
const pale = "#c7cbaf";
const dark = "#80907c";

// https://academic.oup.com/mspecies/article/50/959/34/5075367
function gaur(): ModelPart[] {
  const parts: ModelPart[] = [lobe("印度野牛深重前胸与短而窄的后腰", hide, [0, 1.34, -.11], [.93, 1.2, 2.18], [-6, 0, 0]), lobe("印度野牛高于中背的前肩肌隆", hide, [0, 1.65, .63], [.89, 1.13, .99]), tapered("印度野牛粗而短的低颈", hide, [[0, 1.59, .68], [0, 1.64, 1.08]], [.29, .24]), lobe("印度野牛短深宽额的头颅", hide, [0, 1.68, 1.32], [.51, .65, .7]), lobe("印度野牛宽厚而低垂的鼻吻", pale, [0, 1.43, 1.58], [.42, .33, .43]), lobe("印度野牛两角之间显著弓起的额嵴", pale, [0, 1.95, 1.28], [.47, .2, .29]), ...eyes([0, 1.81, 1.41], .19, .043), tapered("印度野牛长而细的后垂尾", hide, [[0, 1.36, -1.03], [.04, .75, -1.3], [.09, .28, -1.35]], [.048, .03, .012]), lobe("印度野牛尾端独立毛束", dark, [.09, .28, -1.35], [.1, .28, .11]), part("印度野牛颏后连到胸前的薄厚垂皮", "extrude", hide, [0, 0, 0], [1, 1, 1], [0, 90, 0], { depth: .045, profile: [{ x: -1.35, y: 1.3 }, { x: -1.3, y: 1.03 }, { x: -.94, y: .88 }, { x: -.62, y: 1.02 }, { x: -.67, y: 1.38 }] })];
  fourFeet(parts, [0, 1.35, .62], [0, 1.19, -.76], .31, .093, false, true);
  for (const side of [-1, 1]) parts.push(tapered("印度野牛角根侧出中段上弯而角尖内收的角", pale, [[side * .17, 1.98, 1.25], [side * .37, 2.06, 1.17], [side * .48, 2.29, 1.18], [side * .36, 2.51, 1.21]], [.071, .057, .034, .003]), leaf("印度野牛展开在角下的大外耳", pale, [side * .18, 1.76, 1.15], .18, .32, [0, side * 20, -side * 75]));
  return parts;
}

function triangularHorn(name: string, path: Triple[], radii: number[]): ModelPart {
  const vertices: { x: number; y: number; z: number }[] = [], indices: number[] = [];
  path.forEach((root, row) => {
    const tangent = new Vector3(...path[Math.min(row + 1, path.length - 1)]!).sub(new Vector3(...path[Math.max(0, row - 1)]!)).normalize(), q = new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), tangent);
    for (let col = 0; col < 3; col++) { const a = col * Math.PI * 2 / 3, p = new Vector3(Math.cos(a) * radii[row]!, 0, Math.sin(a) * radii[row]!).applyQuaternion(q).add(new Vector3(...root)); vertices.push({ x: p.x, y: p.y, z: p.z }); }
    if (row) for (let col = 0; col < 3; col++) { const a = (row - 1) * 3 + col, b = row * 3 + col, c = (row - 1) * 3 + (col + 1) % 3, d = row * 3 + (col + 1) % 3; indices.push(a, b, c, c, b, d); }
  });
  const end = (path.length - 1) * 3; indices.push(0, 1, 2, end + 2, end + 1, end);
  return part(name, "mesh", pale, [0, 0, 0], [1, 1, 1], [0, 0, 0], { vertices, indices });
}

// https://animaldiversity.org/accounts/Bubalus_bubalis/
function waterBuffalo(): ModelPart[] {
  const parts: ModelPart[] = [lobe("水牛平背低颈而深长的胸腹", hide, [0, 1.13, -.15], [.97, 1.09, 2.16]), tapered("水牛水平前伸而非上举的厚颈", hide, [[0, 1.22, .63], [0, 1.17, 1.07]], [.3, .22]), lobe("水牛长而窄的下垂脸部", hide, [0, 1.11, 1.32], [.44, .57, .85]), lobe("水牛前端扁平的鼻盘与宽唇", pale, [0, .87, 1.66], [.36, .23, .29]), ...eyes([0, 1.28, 1.39], .162, .039), tapered("水牛长而稀毛的尾轴", hide, [[0, 1.13, -1.07], [.05, .7, -1.39], [.08, .22, -1.47]], [.043, .029, .012]), lobe("水牛稀毛尾末端的长毛簇", dark, [.08, .22, -1.47], [.1, .25, .1])];
  for (const side of [-1, 1]) {
    const horn = triangularHorn("水牛角基分开且三角截面的水平后展巨角", [[.16, 1.4, 1.1], [.42, 1.41, 1.01], [.74, 1.48, .82], [1.0, 1.65, .61], [1.07, 1.86, .58]], [.085, .074, .055, .029, .003]);
    if (side < 0) {
      for (const vertex of horn.vertices!) vertex.x *= -1;
      for (let i = 0; i < horn.indices!.length; i += 3) [horn.indices![i], horn.indices![i + 1]] = [horn.indices![i + 1]!, horn.indices![i]!];
    }
    parts.push(horn, leaf("水牛角基下方的小长耳", pale, [side * .17, 1.19, .99], .14, .24, [0, side * 20, -side * 72]));
    for (const front of [true, false]) {
      const z = front ? .61 : -.78, ankle: Triple = [side * .32, .105, z + .045];
      parts.push(tapered("水牛短而粗的承重肢", hide, [[side * .24, front ? 1.13 : 1.03, z], [side * .36, .52, z - .04], ankle], [.14, .098, .061]));
      const toes: ModelPart[] = [];
      for (const toe of [-1, 1]) toes.push(lobe("水牛适应泥地向外张开的宽半蹄", dark, [ankle[0] + toe * .057, .069, ankle[2] + .054], [.099, .12, .25], [0, toe * 12, 0]), lobe("水牛主蹄后方较高的小悬蹄", dark, [ankle[0] + toe * .035, .17, ankle[2] - .043], [.035, .051, .038]));
      parts.push(combineMeshes("水牛真正分离并向外张开的宽蹄与悬蹄", dark, toes));
    }
  }
  return parts;
}

// https://www.mnhn.fr/en/the-greater-kudu
function greaterKudu(): ModelPart[] {
  const parts: ModelPart[] = [lobe("大捻角羚窄胸细腰的高腿躯", hide, [0, 1.12, -.07], [.44, .62, 1.45], [-7, 0, 0]), tapered("大捻角羚向前上举的长细颈", hide, [[0, 1.24, .41], [0, 1.57, .64], [0, 1.81, .82]], [.15, .11, .075])];
  head(parts, [0, 1.84, .95], [.24, .27, .38], .07, "none");
  fourFeet(parts, [0, 1.12, .44], [0, 1.01, -.51], .16, .046, false, true);
  for (const side of [-1, 1]) {
    parts.push(leaf("大捻角羚头侧特别宽大的圆长耳", pale, [side * .08, 1.91, .8], .17, .29, [0, side * 10, -side * 63]));
    const path: Triple[] = [], radii: number[] = [];
    for (let i = 0; i < 25; i++) { const t = i / 24, a = t * Math.PI * 5, radius = .018 + .076 * Math.sin(Math.min(1, t * 1.4) * Math.PI / 2); path.push([side * (.085 + .11 * t + Math.sin(a) * radius), 1.93 + .83 * t, .8 - .2 * t + Math.cos(a) * radius]); radii.push(.026 * (1 - t) + .001); }
    parts.push(tapered("大捻角羚真正绕轴两圈半上伸的长螺旋角", pale, path, radii));
  }
  const mane: ModelPart[] = [];
  for (let i = 0; i < 15; i++) mane.push(leaf("大捻角羚喉至胸部下垂的长须鬃", pale, [0, 1.61 - i * .035, .71 - i * .015], .065, .19, [160, i % 2 ? 12 : -12, 0]));
  parts.push(combineMeshes("大捻角羚连续而实际附着的喉胸须鬃", pale, mane), tapered("大捻角羚短尾轴与尾束", hide, [[0, 1.08, -.69], [.03, .77, -.87], [.065, .62, -.85]], [.035, .022, .008]), lobe("大捻角羚尾末端细毛束", dark, [.065, .64, -.85], [.07, .2, .075]));
  return parts;
}

// https://www.science.smith.edu/departments/biology/VHAYSSEN/msi/pdf/689_Taurotragus_oryx.pdf
function commonEland(): ModelPart[] {
  const parts: ModelPart[] = [lobe("大羚羊与细腰羚不同的牛形厚胸宽腹", hide, [0, 1.26, -.11], [.9, 1.05, 1.95]), lobe("大羚羊明显加厚的雄性前肩", hide, [0, 1.48, .52], [.85, .94, .86]), tapered("大羚羊短粗的斜举颈", hide, [[0, 1.5, .63], [0, 1.82, .96]], [.27, .19])];
  head(parts, [0, 1.9, 1.18], [.37, .4, .55], .07, "none");
  fourFeet(parts, [0, 1.22, .6], [0, 1.1, -.65], .28, .077, false, true);
  parts.push(part("大羚羊只垂在喉颈而不伸至下巴的巨大垂皮", "extrude", hide, [0, 0, 0], [1, 1, 1], [0, 90, 0], { depth: .055, profile: [{ x: -1.15, y: 1.43 }, { x: -1.32, y: 1.28 }, { x: -1.23, y: .78 }, { x: -1.03, y: .48 }, { x: -.8, y: .65 }, { x: -.67, y: 1.18 }, { x: -.88, y: 1.4 }] }));
  for (const side of [-1, 1]) {
    parts.push(leaf("大羚羊狭长尖耳而非巨羚的阔圆耳", pale, [side * .13, 1.98, 1.0], .14, .29, [-3, side * 20, -side * 67]));
    const shaft: Triple[] = [], keel: Triple[] = [], radii: number[] = [], ridgeRadii: number[] = [];
    for (let i = 0; i < 23; i++) { const t = i / 22, a = t * Math.PI * 4, radius = .038 * (1 - t) + .002, x = side * (.105 + .075 * t), y = 2.04 + .55 * t, z = 1.005 - .22 * t; shaft.push([x, y, z]); keel.push([x + Math.cos(a) * radius * .92, y, z + Math.sin(a) * radius * .92]); radii.push(radius); ridgeRadii.push(.006 * (1 - t) + .001); }
    parts.push(tapered("大羚羊短而粗的近直立角干", pale, shaft, radii), tapered("大羚羊贴住角干且连续扭转的前棱", dark, keel, ridgeRadii));
  }
  const tuft: ModelPart[] = [];
  for (let i = 0; i < 9; i++) tuft.push(leaf("大羚羊前额真正厚而隆起的长毛簇", pale, [(i % 3 - 1) * .065, 2.03 + Math.floor(i / 3) * .012, 1.09 + Math.floor(i / 3) * .04], .055, .15, [-12, 0, 0]));
  parts.push(combineMeshes("大羚羊雄体额部连续毛簇", pale, tuft), tapered("大羚羊长而末端有毛簇的尾轴", hide, [[0, 1.23, -.95], [.06, .7, -1.21], [.1, .39, -1.24]], [.043, .025, .01]), lobe("大羚羊尾末端毛束", dark, [.1, .39, -1.24], [.085, .24, .09]));
  return parts;
}

export const landAnimalExpansionBatchEightDesigns: MasterNatureDesign[] = [
  design("gaur", "印度野牛", "动物", gaur, ["Bos gaurus", "高肩短颈弓起额嵴与颏胸垂皮"]),
  design("waterBuffalo", "水牛", "动物", waterBuffalo, ["Bubalus bubalis", "长窄低脸三角截面后展宽角与泥地张蹄"]),
  design("greaterKudu", "大捻角羚", "动物", greaterKudu, ["Tragelaphus strepsiceros", "窄躯长颈大耳螺旋长角与喉胸长须鬃"]),
  design("commonEland", "大羚羊", "动物", commonEland, ["Taurotragus oryx", "厚重牛形前胸巨喉垂皮和短角螺旋前棱"]),
];
