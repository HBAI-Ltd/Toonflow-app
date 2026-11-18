import { Euler, Quaternion, Vector3 } from "three";
import { combineMeshes, design, eyes, leaf, lobe, part, polygon, tapered } from "./shared";
import type { MasterNatureDesign, ModelPart, Triple } from "./shared";
import { body } from "./fishForms";
import { pointed } from "./insectForms";
import { bodyStripe, bodySurfacePoint } from "./landAnimalExpansionBatchEighteen";

const hide = "#aab39c";
const pale = "#c9cdb1";
const dark = "#80907b";

function rosette(sections: [number, number, number, number][], angle: number, z: number): ModelPart {
  const vertices: { x: number; y: number; z: number }[] = [], indices: number[] = [];
  for (const offset of [-.0007, .0012]) for (const radius of [1, .56]) for (let i = 0; i < 8; i++) {
    const turn = i * Math.PI / 4, p = bodySurfacePoint(sections, angle + Math.cos(turn) * .155 * radius, z + Math.sin(turn) * .029 * radius, offset);
    vertices.push({ x: p.x, y: p.y, z: p.z });
  }
  for (let i = 0; i < 8; i++) {
    const j = (i + 1) % 8;
    indices.push(i + 16, j + 16, i + 24, j + 16, j + 24, i + 24, i, i + 8, j, j, i + 8, j + 8, i, j, i + 16, j, j + 16, i + 16, i + 8, i + 24, j + 8, j + 8, i + 24, j + 24);
  }
  return part("雪豹随真实毛面弯曲且中空的环形斑纹", "mesh", dark, [0, 0, 0], [1, 1, 1], [0, 0, 0], { vertices, indices });
}

// https://snowleopard.org/snow-leopard-facts/physical-features/
function snowLeopard(): ModelPart[] {
  const sections: [number, number, number, number][] = [[-.48, .39, .11, .16], [-.15, .43, .19, .23], [.31, .42, .18, .21], [.49, .435, .10, .14]];
  const parts: ModelPart[] = [body("雪豹肩低而腰髋较高的短厚毛躯", sections, pale), tapered("雪豹藏在厚毛内的短粗颈", pale, [[0, .49, .35], [0, .56, .54]], [.115, .085]), lobe("雪豹短宽鼻腔与高圆额的宽短颅", pale, [0, .585, .625], [.265, .285, .3]), lobe("雪豹短而宽的鼻吻与须垫", hide, [0, .521, .758], [.2, .13, .18]), lobe("雪豹厚毛下颌及圆颏", pale, [0, .466, .649], [.215, .115, .245]), ...eyes([0, .645, .671], .09, .024), tapered("雪豹近等于头躯长而特别粗厚的毛尾", pale, [[0, .365, -.42], [.065, .24, -.82], [.185, .14, -1.22], [.36, .16, -1.53]], [.082, .079, .065, .035]), lobe("雪豹平滑圆钝的厚毛尾末端", pale, [.36, .16, -1.53], [.104, .105, .115])];
  for (const side of [-1, 1]) {
    parts.push(lobe("雪豹减少散热的短圆小耳", pale, [side * .09, .696, .524], [.075, .085, .051]), lobe("雪豹耳内浅色短毛", hide, [side * .09, .703, .547], [.044, .046, .022]), lobe("雪豹鼻镜", dark, [side * .025, .548, .837], [.049, .038, .032]), tapered("雪豹明显较短而粗的前腿", pale, [[side * .139, .405, .3], [side * .205, .235, .32], [side * .19, .074, .4]], [.076, .053, .032]), lobe("雪豹用于跃起的发达后股", pale, [side * .14, .323, -.28], [.18, .29, .25]), tapered("雪豹较长的屈曲后腿与后跟", pale, [[side * .142, .385, -.28], [side * .235, .23, -.17], [side * .209, .115, -.34], [side * .19, .067, -.19]], [.075, .049, .029, .026]));
    for (const front of [true, false]) {
      const z = front ? .428 : -.146;
      parts.push(lobe("雪豹有厚毛足底且明显放宽的雪鞋状足掌", pale, [side * .19, .041, z], [.17, .077, .215]));
      const toes: ModelPart[] = [];
      for (let i = 0; i < 4; i++) toes.push(lobe("雪豹肉趾之间由厚毛填充的圆短趾", pale, [side * .19 + (i - 1.5) * .03, .032, z + .083], [.037, .047, .075]));
      if (front) toes.push(lobe("雪豹前掌内侧不接地的悬拇趾", pale, [side * .147, .105, z - .052], [.033, .044, .038]));
      parts.push(combineMeshes("雪豹宽被毛掌上的完整前后趾", pale, toes));
    }
  }
  const spots: ModelPart[] = [];
  for (const side of [-1, 1]) for (const angle of [-.32, .2, .74]) for (let i = 0; i < 6; i++) spots.push(rosette(sections, side > 0 ? angle : Math.PI - angle, -.37 + i * .142 + (angle > .3 ? .023 : 0)));
  for (let i = 0; i < spots.length; i += 12) parts.push(combineMeshes("雪豹以闭合薄壳贴接的完整空心玫瑰斑", dark, spots.slice(i, i + 12)));
  // 头躯与约一米长尾分别校准；此模型各部件为世界轴几何，缩放仍保持接合。
  for (const item of parts) { item.position.x *= .9; item.position.y *= .95; item.position.z *= .9; item.scale.x *= .9; item.scale.y *= .95; item.scale.z *= .9; }
  return parts;
}

// https://animaldiversity.org/accounts/Tragelaphus_eurycerus/
function bongo(): ModelPart[] {
  const sections: [number, number, number, number][] = [[-.94, .73, .2, .32], [-.4, .81, .4, .46], [.53, .88, .37, .44], [.87, .92, .2, .27]];
  const parts: ModelPart[] = [body("紫羚短腿宽深桶腹的重型森林躯", sections, hide), lobe("紫羚厚前胸与短而强壮的肩颈基", hide, [0, 1.0, .57], [.59, .62, .62]), tapered("紫羚明显短于大捻角羚的厚颈", hide, [[0, 1.08, .65], [0, 1.36, 1.055]], [.2, .12]), lobe("紫羚较长而前端下压的厚颅", hide, [0, 1.385, 1.235], [.35, .42, .56], [15, 0, 0]), lobe("紫羚宽而圆钝的鼻吻", pale, [0, 1.24, 1.483], [.27, .19, .24]), ...eyes([0, 1.462, 1.275], .119, .029), tapered("紫羚后躯垂下的较粗长尾", hide, [[0, .69, -.85], [.07, .43, -1.04], [.13, .275, -1.14]], [.052, .034, .018]), lobe("紫羚尾端较窄的长毛簇", dark, [.13, .275, -1.14], [.08, .18, .08])];
  for (const side of [-1, 1]) {
    parts.push(leaf("紫羚明显大于头侧比例的宽叶状耳", pale, [side * .13, 1.505, 1.012], .285, .435, [-12, side * 24, -side * 68]));
    const hornPath: Triple[] = [], hornRadii: number[] = [];
    for (let i = 0; i <= 16; i++) { const t = i / 16, turn = t * Math.PI * 3; hornPath.push([side * (.105 + t * .08 + Math.sin(turn) * .035 * (1 - t * .5)), 1.56 + t * .67, 1.04 - t * .63 + Math.cos(turn) * .035 * (1 - t * .5) - .035]); hornRadii.push(i === 16 ? 0 : .043 * (1 - t * .8)); }
    parts.push(pointed("紫羚向背后斜伸约一点五圈而非垂直开螺旋的角", pale, hornPath, hornRadii), tapered("紫羚面部朝鼻梁合拢的细浅色眉纹", pale, [[side * .1, 1.478, 1.298], [side * .04, 1.38, 1.422]], [.013, .009]));
    for (const front of [true, false]) {
      const z = front ? .56 : -.62, ankle: Triple = [side * .265, .111, z + .012];
      parts.push(tapered("紫羚相对宽躯较短而有力的森林穿行肢", hide, [[side * .2, front ? .825 : .7, z], [side * .3, .39, z - .047], ankle], [.082, .053, .033]));
      const hoofs: ModelPart[] = [];
      for (const toe of [-1, 1]) hoofs.push(lobe("紫羚明确分开的短窄偶蹄", dark, [ankle[0] + toe * .036, .056, ankle[2] + .051], [.061, .096, .18]), lobe("紫羚踝后小型悬蹄", dark, [ankle[0] + toe * .046, .148, ankle[2] - .025], [.029, .047, .044]));
      parts.push(combineMeshes("紫羚不作泽羚长香蕉形蹄的短偶蹄足", dark, hoofs));
    }
  }
  const stripes: ModelPart[] = [];
  for (const side of [-1, 1]) for (let i = 0; i < 12; i++) stripes.push(bodyStripe(sections, side, -.77 + i * .13, .01, -.92, pale));
  for (let i = 0; i < stripes.length; i += 12) parts.push(combineMeshes("紫羚沿宽深躯表面贴接的十二道细浅条纹", pale, stripes.slice(i, i + 12)));
  return parts;
}

// https://www.cambridge.org/core/journals/earth-and-environmental-science-transactions-of-royal-society-of-edinburgh/article/abs/phylogenetic-relationships-of-palaeogene-ziphodont-eusuchians-and-the-status-of-pristichampsus-gervais-1853/A4EDB271F131692BEEB8A94568CAD89E
function boverisuchus(): ModelPart[] {
  const sections: [number, number, number, number][] = [[-.65, .6, .14, .2], [-.25, .61, .26, .32], [.38, .56, .25, .3], [.65, .54, .13, .19]];
  const parts: ModelPart[] = [body("蹄鳄后躯较高且明显离地的长深甲躯", sections, hide), tapered("蹄鳄从较高前胸向前伸的颈", hide, [[0, .58, .5], [0, .65, .795]], [.13, .095]), lobe("蹄鳄高深且左右压窄的颅后部", hide, [0, .705, .92], [.255, .34, .35]), part("蹄鳄不同于水鳄扁平头的高窄上颌", "extrude", hide, [0, 0, 0], [1, 1, 1], [0, 90, 0], { depth: .19, profile: [{ x: -.85, y: .827 }, { x: -1.197, y: .792 }, { x: -1.415, y: .667 }, { x: -1.39, y: .57 }, { x: -.87, y: .575 }] }), part("蹄鳄保持真实薄口缝的深长下颌", "extrude", dark, [0, 0, 0], [1, 1, 1], [0, 90, 0], { depth: .16, profile: [{ x: -.83, y: .548 }, { x: -1.378, y: .548 }, { x: -1.347, y: .472 }, { x: -.84, y: .42 }] }), ...eyes([0, .79, .95], .09, .026), pointed("蹄鳄粗根长尾而非马式毛尾", hide, [[0, .56, -.57], [.04, .41, -1.04], [.14, .27, -1.46], [.27, .23, -1.8]], [.17, .12, .067, 0])];
  for (const side of [-1, 1]) for (const front of [true, false]) {
    const z = front ? .38 : -.41, ankle: Triple = [side * .325, .092, z + .083];
    parts.push(tapered(front ? "蹄鳄较直立且短于后腿的前肢" : "蹄鳄较长并将骨盆举高的粗后肢", hide, [[side * .16, front ? .52 : .575, z], [side * .34, .29, z - .03], ankle], front ? [.077, .049, .026] : [.1, .062, .028]), lobe("蹄鳄短而不带游泳蹼的足掌", dark, [ankle[0], .063, ankle[2] + .052], [.14, .086, .19]));
    const digits: ModelPart[] = [];
    for (let i = 0; i < (front ? 5 : 4); i++) {
      const x = ankle[0] + (i - (front ? 2 : 1.5)) * .028;
      digits.push(tapered("蹄鳄从足掌分出的短趾节", hide, [[x, .069, ankle[2] + .103], [x, .044, ankle[2] + .147]], [.013, .011]), polygon("蹄鳄趾端圆扁而非钩尖的蹄形末节鞘", pale, [[x - .017, ankle[2] + .128], [x - .023, ankle[2] + .168], [x - .012, ankle[2] + .194], [x + .012, ankle[2] + .194], [x + .023, ankle[2] + .168], [x + .017, ankle[2] + .128]], .038, [0, .016, 0]));
    }
    parts.push(combineMeshes("蹄鳄每趾都有独立圆扁蹄端的完整足", pale, digits));
  }
  const armor: ModelPart[] = [];
  for (let i = 0; i < 12; i++) for (let row = 0; row < 8; row++) {
    const angle = row * Math.PI / 4, z = -.535 + i * .097, p = bodySurfacePoint(sections, angle, z, -.003), normal = bodySurfacePoint(sections, angle, z, .01).sub(p).normalize(), euler = new Euler().setFromQuaternion(new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), normal));
    const plate = polygon("蹄鳄从背至腹侧连续包覆的小矩形皮骨板", pale, [[-.038, -.042], [.038, -.042], [.038, .042], [-.038, .042]], .018, [p.x, p.y, p.z]); plate.rotation = { x: euler.x * 180 / Math.PI, y: euler.y * 180 / Math.PI, z: euler.z * 180 / Math.PI }; armor.push(plate);
  }
  for (let i = 0; i < armor.length; i += 40) parts.push(combineMeshes("蹄鳄区别于仅背甲水鳄的背腹侧成列骨甲", pale, armor.slice(i, i + 40)));
  const teeth: ModelPart[] = [];
  for (const side of [-1, 1]) for (let i = 0; i < 11; i++) {
    const tooth = polygon("蹄鳄侧扁而非圆锥形的刃齿", pale, [[-.014, 0], [.014, 0], [-.004, .061]], .011, [side * .092 + .0055, .578, .91 + i * .039]); tooth.rotation = { x: 90, y: 0, z: 90 }; teeth.push(tooth);
  }
  parts.push(combineMeshes("蹄鳄沿高窄颌缘排列的完整侧扁齿列", pale, teeth));
  return parts;
}

export const landAnimalExpansionBatchNineteenDesigns: MasterNatureDesign[] = [
  design("snowLeopard", "雪豹", "动物", snowLeopard, ["Panthera uncia", "前短后长腿宽被毛足短圆耳宽鼻腔及等躯长厚尾"]),
  design("bongo", "紫羚", "动物", bongo, ["Tragelaphus eurycerus", "森林短腿桶躯巨大叶状耳向后扭角与贴体细条纹"]),
  design("boverisuchus", "蹄鳄", "动物", boverisuchus, ["Boverisuchus", "Pristichampsus旧称排重", "高窄刃齿颅长后腿圆扁蹄形趾端及背腹侧骨甲"]),
];
