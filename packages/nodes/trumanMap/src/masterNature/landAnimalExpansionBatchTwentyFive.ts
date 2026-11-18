import { combineMeshes, design, eyes, leaf, lobe, part, polygon, tapered } from "./shared";
import type { MasterNatureDesign, ModelPart, Triple } from "./shared";
import { body } from "./fishForms";
import { pointed } from "./insectForms";
import { bodySurfacePoint } from "./landAnimalExpansionBatchEighteen";

const hide = "#a7b097";
const pale = "#c5caad";
const dark = "#7b8c76";

// https://www.nps.gov/whsa/learn/nature/african-oryx.htm
// 剑羚属仅一个主素材，不将白剑羚、东非角型或雌雄角的差异拆作主数量。
function gemsbok(): ModelPart[] {
  const parts: ModelPart[] = [body("南非剑羚粗颈方胸且腰腹较收紧的结实体躯", [[-.74, .74, .15, .22], [-.26, .83, .28, .39], [.46, .88, .26, .36], [.7, .92, .14, .2]], hide), tapered("南非剑羚较短粗且与胸肩连续的强颈", hide, [[0, 1.01, .52], [0, 1.19, .72], [0, 1.32, .86]], [.17, .137, .087]), body("南非剑羚长马面而非鹿式短尖鼻的窄深颅", [[.78, 1.35, .065, .11], [.965, 1.35, .108, .16], [1.19, 1.22, .085, .12], [1.37, 1.16, .058, .068]], hide), lobe("南非剑羚深而较长的下颌", pale, [0, 1.134, 1.143], [.16, .12, .43]), lobe("南非剑羚鼻端小而宽的深色鼻镜", dark, [0, 1.17, 1.383], [.12, .09, .07]), ...eyes([0, 1.425, .992], .086, .023), tapered("南非剑羚下垂且末端有长毛的马式尾轴", hide, [[0, .74, -.66], [.043, .49, -.86], [.084, .32, -.97]], [.042, .031, .019]), lobe("南非剑羚长尾末端明显毛簇", dark, [.084, .305, -.98], [.085, .23, .097])];
  for (const side of [-1, 1]) {
    parts.push(pointed("南非剑羚近直且向后斜上伸的长剑状角", pale, [[side * .067, 1.45, .96], [side * .128, 1.791, .833], [side * .198, 2.256, .662]], [.029, .019, 0]), leaf("南非剑羚长而狭窄的直立叶耳", pale, [side * .065, 1.43, .93], .095, .235, [-11, side * 23, -side * 38]));
    for (const front of [true, false]) {
      const z = front ? .44 : -.51, ankle: Triple = [side * .2, .108, z + .021];
      parts.push(tapered(front ? "南非剑羚直而较粗的沙地耐跑前肢" : "南非剑羚粗股与较长跗骨的耐跑后肢", hide, front ? [[side * .158, .83, z], [side * .23, .4, z - .025], ankle] : [[side * .16, .72, z], [side * .254, .39, z + .075], [side * .212, .17, z - .046], ankle], front ? [.058, .035, .022] : [.08, .044, .025, .02]));
      const hoofs: ModelPart[] = [];
      for (const toe of [-1, 1]) hoofs.push(lobe("南非剑羚长而窄的分离主蹄瓣", dark, [ankle[0] + toe * .028, .057, ankle[2] + .045], [.051, .097, .147]), lobe("南非剑羚主蹄后方较小的辅助悬蹄", dark, [ankle[0] + toe * .039, .124, ankle[2] - .026], [.025, .04, .038]));
      parts.push(combineMeshes("南非剑羚两枚分离主蹄与后辅趾的完整足", dark, hoofs));
    }
  }
  const mane: ModelPart[] = [];
  for (let i = 0; i < 12; i++) {
    const t = i / 11, a: Triple = t < .55 ? [0, 1.01, .52] : [0, 1.19, .72], b: Triple = t < .55 ? [0, 1.19, .72] : [0, 1.32, .86], u = t < .55 ? t / .55 : (t - .55) / .45, dy = b[1] - a[1], dz = b[2] - a[2], length = Math.hypot(dy, dz), radius = (t < .55 ? .17 - .033 * u : .137 - .05 * u) * .91;
    mane.push(leaf("南非剑羚短立鬃沿后颈真实连接的毛束", dark, [Math.sin(i * 2.2) * .017, a[1] + dy * u + dz / length * radius, a[2] + dz * u - dy / length * radius], .018, .095, [-15, i * 137.5 % 360, 0]));
  }
  parts.push(combineMeshes("南非剑羚短而非马长垂鬃的连续颈鬃", dark, mane));
  return parts;
}

// https://www.iucn-wpsg.org/forest-hog-detailed
// 只收一个物种主体；不按地域大小/雄性皮垫/幼体毛色继续拆主。
function giantForestHog(): ModelPart[] {
  const parts: ModelPart[] = [body("巨林猪前肩厚而腰腹不成家猪垂腹的高背重躯", [[-.64, .57, .19, .26], [-.21, .65, .35, .42], [.43, .68, .33, .4], [.7, .72, .19, .26]], hide), tapered("巨林猪几乎埋入高肩并承托巨头的粗短颈", hide, [[0, .78, .53], [0, .8, .8]], [.22, .2]), body("巨林猪高额宽颧而鼻前端压平的宽大颅", [[.72, .79, .12, .15], [.83, .82, .23, .27], [.97, .75, .19, .2], [1.2, .65, .086, .075]], hide), lobe("巨林猪短厚而下缘近直的植食下颌", hide, [0, .559, 1.022], [.26, .14, .39]), ...eyes([0, .941, .876], .172, .026), tapered("巨林猪末端扁毛束前的细长下垂尾", hide, [[0, .565, -.57], [.049, .367, -.79], [.093, .283, -.91]], [.032, .022, .012]), lobe("巨林猪尾端较扁而不卷成家猪圈的短毛束", dark, [.095, .283, -.915], [.065, .095, .045])];
  const disc: [number, number][] = Array.from({ length: 12 }, (_, i) => [Math.cos(i * Math.PI / 6) * .088, -Math.sin(i * Math.PI / 6) * .073]);
  const holes: [number, number][][] = [-1, 1].map(side => Array.from({ length: 6 }, (_, i) => [side * .032 + Math.cos(i * Math.PI / 3) * .016, -.013 - Math.sin(i * Math.PI / 3) * .011] as [number, number]));
  const nose = polygon("巨林猪直径约十七厘米且有真双鼻孔的宽鼻盘", pale, disc, .025, [0, .65, 1.195], holes); nose.rotation.x = 90; parts.push(nose);
  for (const side of [-1, 1]) {
    parts.push(lobe("巨林猪宽鼻盘鼻孔底部的暗腔", dark, [side * .032, .663, 1.205], [.036, .026, .008]), lobe("巨林猪眼前下方肾形裸皮垫的宽上半部", pale, [side * .2, .788, .974], [.235, .215, .255]), lobe("巨林猪裸颊皮垫向颌线收窄的下半部", pale, [side * .205, .69, .986], [.153, .155, .18]), leaf("巨林猪不带红河猪长流苏的短尖叶耳", hide, [side * .139, .975, .815], .115, .17, [-14, side * 20, -side * 43]), pointed("巨林猪比疣猪短且主要向外张开的厚獠牙", pale, [[side * .137, .614, 1.06], [side * .25, .619, 1.157], [side * .327, .708, 1.2]], [.032, .024, 0]));
    for (const front of [true, false]) {
      const z = front ? .43 : -.43, ankle: Triple = [side * .24, .109, z + .042];
      parts.push(tapered("巨林猪短而不细弱的承重四肢", hide, [[side * .19, front ? .65 : .54, z], [side * .28, .31, z - .017], ankle], front ? [.091, .061, .031] : [.113, .071, .033]));
      const toes: ModelPart[] = [];
      for (const toe of [-1, 1]) toes.push(lobe("巨林猪真正分离的两枚主蹄", dark, [ankle[0] + toe * .037, .058, ankle[2] + .039], [.067, .101, .15]), lobe("巨林猪湿地可辅助着力的小侧趾蹄", dark, [ankle[0] + toe * .063, .12, ankle[2] - .029], [.037, .057, .063]));
      parts.push(combineMeshes("巨林猪两主蹄及两侧小辅蹄的完整足", dark, toes));
    }
  }
  const bristles: ModelPart[] = [];
  const back: [number, number, number, number][] = [[-.64, .57, .19, .26], [-.21, .65, .35, .42], [.43, .68, .33, .4], [.7, .72, .19, .26]];
  for (let i = 0; i < 24; i++) { const z = -.51 + i * .045, p = bodySurfacePoint(back, Math.PI / 2, z, -.004); bristles.push(pointed("巨林猪背中线较粗而不成鬣狗高鬃的短刚毛", dark, [[p.x, p.y, p.z], [p.x + Math.sin(i * 2.3) * .008, p.y + .055, p.z - .03]], [.0015, 0])); }
  parts.push(combineMeshes("巨林猪与高肩背实际连接的短刚毛列", dark, bristles));
  return parts;
}

// https://nationalzoo.si.edu/animals/sloth-bear
// https://www.bearbiology.org/the-eight-bear-species/melursus-ursinus-sloth-bear/
// 吸食长唇、内转宽前掌与6–8厘米长前爪是真结构，不以熊类毛色或地域拆主。
function slothBear(): ModelPart[] {
  const torso: [number, number, number, number][] = [[-.57, .55, .15, .2], [-.18, .61, .27, .3], [.5, .65, .25, .31], [.7, .66, .14, .2]];
  const parts: ModelPart[] = [body("懒熊腰较收而颈肩毛长的前高后低完整躯", torso, hide), tapered("懒熊从短厚肩向低垂长吻伸出的粗颈", hide, [[0, .74, .55], [0, .736, .81]], [.155, .12]), lobe("懒熊额后较圆而前面明显延长的颅", hide, [0, .739, .888], [.28, .31, .36]), body("懒熊短毛裸露且比普通熊细长的前吻", [[.91, .702, .08, .095], [1.08, .657, .077, .074], [1.26, .635, .046, .041]], pale), lobe("懒熊前吻顶端宽而扁的可闭鼻镜", dark, [0, .658, 1.265], [.1, .065, .055]), lobe("懒熊吸食口内部的暗腔而不填上中门齿", dark, [0, .605, 1.296], [.061, .043, .015]), part("懒熊可前伸厚唇围成真正贯通的小吸食口", "lathe", pale, [0, .607, 1.302], [1, 1, 1], [90, 0, 0], { profile: [{ x: .031, y: -.01 }, { x: .043, y: 0 }, { x: .037, y: .012 }, { x: .026, y: .012 }, { x: .026, y: -.01 }, { x: .031, y: -.01 }] }), lobe("懒熊长吻下方较窄的下颌", hide, [0, .578, 1.046], [.18, .11, .4]), ...eyes([0, .805, .958], .106, .023), pointed("懒熊藏于后臀长毛中的短尾", hide, [[0, .5, -.51], [.035, .355, -.71]], [.044, 0])];
  for (const side of [-1, 1]) {
    parts.push(lobe("懒熊外形小且被长毛包裹的圆耳", hide, [side * .09, .846, .817], [.092, .115, .06]));
    for (const front of [true, false]) {
      const z = front ? .435 : -.4, ankle: Triple = [side * (front ? .23 : .245), .092, z + .047], yaw = front ? -side * Math.PI / 10 : 0;
      parts.push(tapered(front ? "懒熊连接长爪宽掌的厚前肢" : "懒熊粗股短踝且全足底支撑的后肢", hide, front ? [[side * .19, .65, z], [side * .28, .32, z - .005], ankle] : [[side * .19, .54, z], [side * .293, .29, z + .048], ankle], front ? [.084, .057, .032] : [.1, .061, .033]), lobe("懒熊带厚肉垫且前掌向内转的宽跖行足", hide, [ankle[0], .047, ankle[2] + .045], front ? [.16, .08, .24] : [.15, .08, .265], [0, yaw * 180 / Math.PI, 0]));
      const toes: ModelPart[] = [];
      for (let i = 0; i < 5; i++) {
        const localX = (i - 2) * .024, localZ = front ? .122 : .139, x = ankle[0] + localX * Math.cos(yaw) + localZ * Math.sin(yaw), depth = ankle[2] - localX * Math.sin(yaw) + localZ * Math.cos(yaw);
        toes.push(lobe("懒熊前后均五枚且不变成犬四趾的肉趾", hide, [x, .038, depth], [.027, .051, .059]));
        const length = front ? .077 : .037, middle: Triple = [x + Math.sin(yaw) * length * .58, .035, depth + Math.cos(yaw) * length * .58], tip: Triple = [x + Math.sin(yaw) * length, .014, depth + Math.cos(yaw) * length];
        toes.push(pointed(front ? "懒熊浅弯且达六至八厘米的前掘爪" : "懒熊明显较短的五枚后爪", pale, [[x, .048, depth + .012], middle, tip], front ? [.009, .006, 0] : [.007, .004, 0]));
      }
      for (const color of [hide, pale]) parts.push(combineMeshes("懒熊前掌内转长前爪与后宽跖短爪的完整足", color, toes.filter(toe => toe.color === color)));
    }
  }
  const coat: ModelPart[] = [];
  for (const side of [-1, 1]) for (let i = 0; i < 11; i++) for (const angle of [.18, .62, 1.15]) {
    const z = -.46 + i * .099, p = bodySurfacePoint(torso, side > 0 ? angle : Math.PI - angle, z, -.009);
    coat.push(leaf("懒熊沿肩颈和躯侧垂落的细长蓬松毛束", hide, [p.x, p.y, p.z], .029, .137 + i % 3 * .011, [205, side * 12, -side * 25]));
  }
  for (let i = 0; i < coat.length; i += 40) parts.push(combineMeshes("懒熊根部嵌入体表且不浮空的粗长披毛层", hide, coat.slice(i, i + 40)));
  return parts;
}

export const landAnimalExpansionBatchTwentyFiveDesigns: MasterNatureDesign[] = [
  design("gemsbok", "南非剑羚", "动物", gemsbok, ["Oryx gazella", "剑羚", "粗颈方胸长马面狭长耳直剑角与较细分离蹄"]),
  design("giantForestHog", "巨林猪", "动物", giantForestHog, ["Hylochoerus meinertzhageni", "大林猪", "宽高巨头十七厘米宽鼻盘真鼻孔肾形裸颊垫及外展短獠"]),
  design("slothBear", "懒熊", "动物", slothBear, ["Melursus ursinus", "长裸吻真小吸食唇口小毛耳内转宽前掌长前爪及短后爪"]),
];
