import { Euler, Quaternion, Vector3 } from "three";
import { combineMeshes, design, eyes, lobe, part, polygon, tapered } from "./shared";
import type { MasterNatureDesign, ModelPart, Triple } from "./shared";
import { body } from "./fishForms";
import { pointed } from "./insectForms";
import { membrane } from "./animals";
import { bodySurfacePoint } from "./landAnimalExpansionBatchEighteen";

const hide = "#a8b19a";
const pale = "#c8cbae";
const dark = "#81917c";

// Sill1974 BulletinMCZ146:317–362；https://doi.org/10.1002/ar.25362
// 依据PVSJ32约58.6厘米颅长及2024研究约4.07米体长校准；不按早期9米外推。
// 肢端和第五后趾参照已描述近缘材料补短钝垫，不宣称完整骨架已知。
function saurosuchus(): ModelPart[] {
  const torso: [number, number, number, number][] = [[-1.15, .93, .25, .4], [-.35, 1.05, .48, .61], [.6, 1.02, .43, .53], [1.05, 1.09, .23, .32]];
  const parts: ModelPart[] = [body("蜥鳄腹部抬离地面而非现代水鳄扁平伏地的长躯", torso, hide), tapered("蜥鳄强肩前方承托高窄巨颅的粗颈", hide, [[0, 1.18, .85], [0, 1.37, 1.25], [0, 1.435, 1.58]], [.27, .21, .145]), part("蜥鳄有厚额顶而鼻吻较低的深窄颅", "extrude", hide, [0, 0, 0], [1, 1, 1], [0, 90, 0], { depth: .37, profile: [{ x: -1.5, y: 1.66 }, { x: -1.86, y: 1.79 }, { x: -2.22, y: 1.73 }, { x: -2.65, y: 1.57 }, { x: -2.7, y: 1.38 }, { x: -2.58, y: 1.32 }, { x: -1.83, y: 1.28 }, { x: -1.53, y: 1.36 }] }), part("蜥鳄下颌后高前薄并留出窄口缝的保守外廓", "extrude", pale, [0, 0, 0], [1, 1, 1], [0, 90, 0], { depth: .29, profile: [{ x: -1.52, y: 1.3 }, { x: -1.83, y: 1.22 }, { x: -2.5, y: 1.21 }, { x: -2.62, y: 1.25 }, { x: -2.58, y: 1.13 }, { x: -1.84, y: 1.08 }, { x: -1.53, y: 1.16 }] }), ...eyes([0, 1.668, 1.81], .178, .046), pointed("蜥鳄高尾根至末端连续渐细的肌肉尾", hide, [[0, .91, -1.02], [.035, .74, -1.86], [.12, .58, -2.75], [.26, .49, -3.56], [.39, .52, -4.24]], [.28, .211, .12, .048, 0])];
  for (const side of [-1, 1]) for (const front of [true, false]) {
    const z = front ? .65 : -.65, ankle: Triple = [side * .52, .105, z + (front ? .16 : .08)];
    parts.push(tapered(front ? "蜥鳄肘侧展但足在躯下较近的高位前肢" : "蜥鳄股胫较直且有鳄式踝的强后肢", hide, front ? [[side * .29, 1.05, z], [side * .6, .58, z - .13], ankle] : [[side * .3, .97, z], [side * .62, .57, z + .13], [side * .55, .21, z - .1], ankle], front ? [.126, .09, .041] : [.17, .113, .059, .043]), lobe("蜥鳄抬腹四足姿下真正接地的长足掌", hide, [ankle[0], .063, ankle[2] + .068], front ? [.2, .102, .28] : [.23, .102, .34]));
    if (!front) parts.push(lobe("蜥鳄鳄式踝向后突出而非恐龙鸟式铰踝的跟突", pale, [side * .55, .153, z - .121], [.11, .12, .17]));
    const digits: ModelPart[] = [];
    for (let i = 0; i < 5; i++) {
      const x = ankle[0] + side * (i - 2) * (front ? .032 : .037), length = i === 4 ? .095 : i === 2 ? .25 : i === 1 ? .222 : .183, endX = x + side * (i - 2) * .019;
      digits.push(tapered(i === 4 ? "蜥鳄外侧退短但未完全消失的第五趾" : "蜥鳄鳄式足掌向前散开的主承重趾", hide, [[x, .074, ankle[2] + .1], [endX, .032, ankle[2] + length]], [.023, .014]));
      if (i < 3) digits.push(pointed("蜥鳄内侧三趾末端短弯爪而非五趾皆巨爪", pale, [[endX, .036, ankle[2] + length - .01], [endX + side * (i - 2) * .004, .016, ankle[2] + length + .071]], [.015, 0]));
    }
    for (const color of [hide, pale]) parts.push(combineMeshes("蜥鳄内三爪与外侧短钝趾的完整地面支承足", color, digits.filter(digit => digit.color === color)));
  }
  const plates: ModelPart[] = [];
  for (const side of [-1, 1]) for (let i = 0; i < 15; i++) {
    const angle = side > 0 ? 1.3 : Math.PI - 1.3, z = -.99 + i * .133, p = bodySurfacePoint(torso, angle, z, -.006), normal = bodySurfacePoint(torso, angle, z, .01).sub(p).normalize(), euler = new Euler().setFromQuaternion(new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), normal));
    const plate = polygon("蜥鳄沿真实背面成对低平排列的独立皮骨甲", pale, [[-.067, -.064], [.067, -.064], [.073, .057], [.015, .078], [-.069, .057]], .025, [p.x, p.y, p.z]); plate.rotation = { x: euler.x * 180 / Math.PI, y: euler.y * 180 / Math.PI, z: euler.z * 180 / Math.PI }; plates.push(plate);
  }
  parts.push(combineMeshes("蜥鳄不长成甲龙大棘的双列背皮骨板", pale, plates));
  const teeth: ModelPart[] = [];
  for (const side of [-1, 1]) for (let i = 0; i < 12; i++) {
    const z = 1.86 + i * .061, y = 1.28 + (z - 1.83) / .75 * .04 + .009;
    const tooth = polygon("蜥鳄颌缘独立而侧扁的刃形肉食齿", pale, [[z - .022, -y], [z + .025, -y], [z + .008, -(y - .091)]], .016, [side * .163 + .008, 0, 0]); tooth.rotation = { x: 90, y: 0, z: 90 }; teeth.push(tooth);
  }
  parts.push(combineMeshes("蜥鳄深窄巨颅两侧的完整薄刃齿列", pale, teeth));
  // 原始轮廓先绕颈后连接点校正头躯比，再整体校准至材料所对应的米制尺寸。
  for (let i = 0; i < parts.length; i++) {
    const item = parts[i]!;
    if (i >= 2 && i <= 5 || item.name.includes("薄刃齿列")) {
      item.position.x *= .8; item.position.y = 1.435 + (item.position.y - 1.435) * .8; item.position.z = 1.5 + (item.position.z - 1.5) * .8;
      item.scale.x *= .8; item.scale.y *= .8; item.scale.z *= .8;
    }
    item.position.x *= .608; item.position.y *= .608; item.position.z *= .608;
    item.scale.x *= .608; item.scale.y *= .608; item.scale.z *= .608;
  }
  return parts;
}

// https://pmc.ncbi.nlm.nih.gov/articles/PMC7127482/
// 先端不画牙，后段圆钝齿随颌后逐渐扩大；软冠仅沿已保留骨冠作低幅保守补形。
function dsungaripterus(): ModelPart[] {
  const parts: ModelPart[] = [lobe("准噶尔翼龙厚骨强躯而非古神翼龙极轻小胸的短体", hide, [0, .407, -.029], [.3, .36, .43], [-15, 0, 0]), tapered("准噶尔翼龙承托厚颅且肌肉较强的短颈", hide, [[0, .54, .095], [0, .74, .286], [0, .88, .533]], [.075, .058, .038]), lobe("准噶尔翼龙眼眶高而颅骨壁较厚的小后颅", hide, [0, .904, .659], [.16, .22, .29]), ...eyes([0, .976, .656], .06, .018), part("准噶尔翼龙厚颌后直而前端明显上翘的无齿钳吻", "extrude", pale, [0, 0, 0], [1, 1, 1], [0, 90, 0], { depth: .075, profile: [{ x: -.59, y: .94 }, { x: -.88, y: .934 }, { x: -1.027, y: .935 }, { x: -1.29, y: 1.07 }, { x: -1.271, y: 1.035 }, { x: -1.014, y: .835 }, { x: -.62, y: .84 }] }), part("准噶尔翼龙与上钳分开并共同向上弯的下颌", "extrude", hide, [0, 0, 0], [1, 1, 1], [0, 90, 0], { depth: .063, profile: [{ x: -.6, y: .82 }, { x: -.97, y: .81 }, { x: -1.27, y: 1.005 }, { x: -1.2, y: .95 }, { x: -.91, y: .75 }, { x: -.61, y: .76 }] }), part("准噶尔翼龙鼻额至枕部相连的低薄正中骨冠", "extrude", hide, [0, 0, 0], [1, 1, 1], [0, 90, 0], { depth: .022, profile: [{ x: -.47, y: .977 }, { x: -.49, y: 1.14 }, { x: -.633, y: 1.169 }, { x: -.82, y: 1.09 }, { x: -.941, y: .945 }, { x: -.7, y: .966 }] }), pointed("准噶尔翼龙不带尾帆的短尾", hide, [[0, .279, -.183], [.028, .241, -.283]], [.024, 0])];
  for (const side of [-1, 1]) {
    const shoulder: Triple = [side * .13, .502, .042], elbow: Triple = [side * .295, .4, .082], carpal: Triple = [side * .265, .21, .231], knuckle: Triple = [side * .23, .051, .328], hip: Triple = [side * .096, .294, -.17], foldedTip: Triple = [side * .233, .947, -.443];
    parts.push(tapered("准噶尔翼龙粗壮承重的上臂尺桡与第四掌骨", hide, [shoulder, elbow, carpal, knuckle], [.041, .031, .018, .011]), tapered("准噶尔翼龙粗翼根后折收起的四节第四指", pale, [knuckle, [side * .233, .316, .108], [side * .233, .559, -.101], [side * .233, .769, -.294], foldedTip], [.012, .009, .0065, .0045, .0023]), membrane("准噶尔翼龙较厚躯侧收合的完整翼膜", hide, [shoulder, elbow, carpal, knuckle, foldedTip, hip]), tapered("准噶尔翼龙陆地行走的粗后肢而非长鸟腿", hide, [hip, [side * .18, .163, -.23], [side * .208, .044, -.117]], [.032, .023, .011]), lobe("准噶尔翼龙宽而短的后足掌", dark, [side * .208, .028, -.07], [.061, .036, .115]));
    const toes: ModelPart[] = [];
    for (let i = 0; i < 3; i++) toes.push(pointed("准噶尔翼龙前掌的三枚独立游离爪指", pale, [knuckle, [knuckle[0] + (i - 1) * .021, .024, .385], [knuckle[0] + (i - 1) * .024, .011, .402]], [.0065, .004, 0]));
    for (let i = 0; i < 4; i++) toes.push(pointed("准噶尔翼龙后足真实分开的四枚承重趾", pale, [[side * .208 + (i - 1.5) * .012, .032, -.027], [side * .208 + (i - 1.5) * .018, .01, .049 - Math.abs(i - 1.5) * .005]], [.0055, 0]));
    parts.push(combineMeshes("准噶尔翼龙前爪与后四趾的完整地面支承", pale, toes));
  }
  const teeth: ModelPart[] = [];
  for (const side of [-1, 1]) for (let i = 0; i < 14; i++) {
    const t = i / 13, z = .675 + t * .264, width = .025 - t * .012;
    teeth.push(lobe("准噶尔翼龙后颌膨圆而前颌退小的砧状钝齿", pale, [side * .033, .841, z], [width, .024 - t * .01, width * 1.1]));
  }
  parts.push(combineMeshes("准噶尔翼龙仅后颌两侧十四对而非满嘴针齿的圆钝牙", pale, teeth));
  return parts;
}

// Kellner与Tomida2000 Anhanguera piscator完整骨架；只取一个属主，不按冠的性别或种型拆主。
// https://new.scielo.br/j/aabc/a/xNmRx7Lm5MCVmzSJC3Nc7CL/?lang=en
// 缺失翼膜由骨架边界保守补形，未使用或下载馆藏三维数据。
function anhanguera(): ModelPart[] {
  const parts: ModelPart[] = [lobe("古魔翼龙胸骨深且后腰短的长翼型轻躯", hide, [0, .466, -.053], [.3, .35, .47], [-22, 0, 0]), tapered("古魔翼龙较长浅弧颈承托低长有齿颅", hide, [[0, .592, .1], [0, .789, .395], [0, .933, .683]], [.062, .046, .032]), lobe("古魔翼龙长吻后方的小而高眼眶颅盒", hide, [0, .933, .766], [.154, .18, .25]), ...eyes([0, .98, .78], .063, .019), polygon("古魔翼龙中段狭而前端钝圆扩宽的上吻", pale, [[-.062, .75], [-.045, 1.01], [-.036, 1.27], [-.071, 1.44], [-.065, 1.55], [0, 1.6], [.065, 1.55], [.071, 1.44], [.036, 1.27], [.045, 1.01], [.062, .75]], .1, [0, .815, 0]), polygon("古魔翼龙与上吻留出错齿空间的钝扩下颌", hide, [[-.053, .756], [-.039, 1.03], [-.031, 1.284], [-.059, 1.447], [-.052, 1.547], [0, 1.589], [.052, 1.547], [.059, 1.447], [.031, 1.284], [.039, 1.03], [.053, .756]], .04, [0, .702, 0]), part("古魔翼龙上吻前方而非后枕位置的薄圆龙骨冠", "extrude", hide, [0, 0, 0], [1, 1, 1], [0, 90, 0], { depth: .023, profile: [{ x: -1.104, y: .912 }, { x: -1.186, y: 1.035 }, { x: -1.336, y: 1.105 }, { x: -1.465, y: 1.054 }, { x: -1.52, y: .912 }] }), part("古魔翼龙下颌对应前端薄龙骨而非大鸟喉囊", "extrude", pale, [0, 0, 0], [1, 1, 1], [0, 90, 0], { depth: .018, profile: [{ x: -1.132, y: .704 }, { x: -1.263, y: .598 }, { x: -1.403, y: .585 }, { x: -1.497, y: .704 }] }), pointed("古魔翼龙不带菱形尾帆的短小尾", hide, [[0, .311, -.237], [.023, .283, -.348]], [.02, 0])];
  for (const side of [-1, 1]) {
    const shoulder: Triple = [side * .13, .546, .024], elbow: Triple = [side * .286, .443, .089], carpal: Triple = [side * .27, .208, .246], knuckle: Triple = [side * .237, .05, .403], hip: Triple = [side * .093, .323, -.204], foldedTip: Triple = [side * .23, 1.23, -.72];
    parts.push(tapered("古魔翼龙长尺桡和长第四掌骨组成的细长前肢", hide, [shoulder, elbow, carpal, knuckle], [.034, .026, .014, .009]), tapered("古魔翼龙长而较细的四节第四指收向躯后", pale, [knuckle, [side * .25, .36, .1], [side * .25, .69, -.2], [side * .24, .98, -.48], foldedTip], [.01, .008, .0055, .0035, .0017]), membrane("古魔翼龙随长翼指收向身体后方的窄折翼膜", hide, [shoulder, elbow, carpal, knuckle, foldedTip, hip]), tapered("古魔翼龙小后腿支持而不改成涉禽长跗的陆姿", hide, [hip, [side * .162, .173, -.252], [side * .193, .042, -.105]], [.027, .019, .009]), lobe("古魔翼龙四趾后足的低平掌", dark, [side * .193, .026, -.059], [.052, .034, .113]));
    const digits: ModelPart[] = [];
    for (let i = 0; i < 3; i++) digits.push(pointed("古魔翼龙不计入第四翼指的三枚着地游离前爪", pale, [knuckle, [knuckle[0] + (i - 1) * .018, .023, .465], [knuckle[0] + (i - 1) * .02, .01, .479]], [.0055, .0035, 0]));
    for (let i = 0; i < 4; i++) digits.push(pointed("古魔翼龙后足分离的四枚细长趾", pale, [[side * .193 + (i - 1.5) * .01, .03, -.017], [side * .193 + (i - 1.5) * .016, .009, .058 - Math.abs(i - 1.5) * .007]], [.0047, 0]));
    parts.push(combineMeshes("古魔翼龙完整前爪与后四趾的四足支承末端", pale, digits));
  }
  const teeth: ModelPart[] = [];
  for (const side of [-1, 1]) for (let i = 0; i < 14; i++) {
    const z = 1.522 - i * .0466, width = z > 1.44 ? .071 - (z - 1.44) / .11 * .006 : z > 1.27 ? .036 + (z - 1.27) / .17 * .035 : .045 - (z - 1.01) / .26 * .009, length = i === 4 || i === 5 ? .025 : i < 4 ? .065 : .045;
    teeth.push(pointed("古魔翼龙第五六对缩小而前端针齿较大的上牙", pale, [[side * width * .78, .822, z], [side * width * .81, .822 - length, z + .006]], [.0055, 0]), pointed("古魔翼龙与上牙错位相向而非同位穿插的下牙", pale, [[side * width * .71, .736, z - .023], [side * width * .74, .736 + length * .72, z - .019]], [.0047, 0]));
  }
  for (let i = 0; i < teeth.length; i += 40) parts.push(combineMeshes("古魔翼龙钝扩前吻内不等长且错列交合的完整针齿", pale, teeth.slice(i, i + 40)));
  return parts;
}

export const landAnimalExpansionBatchTwentySixDesigns: MasterNatureDesign[] = [
  design("saurosuchus", "蜥鳄", "动物", saurosuchus, ["Saurosuchus galilei", "高腹陆栖四足深窄巨颅薄刃齿双列低背甲与鳄式跟突踝"]),
  design("dsungaripterus", "准噶尔翼龙", "动物", dsungaripterus, ["Dsungaripterus weii", "准葛尔翼龙", "强骨架厚短颈上翘无齿钳吻与仅后段膨圆钝齿"]),
  design("anhanguera", "古魔翼龙", "动物", anhanguera, ["Anhanguera piscator", "长浅颈长掌骨前吻上下薄龙骨冠钝扩吻端与错列大小针齿"]),
];
