import { Vector3 } from "three";
import { combineMeshes, design, eyes, leaf, lobe, part, polygon, tapered } from "./shared";
import type { MasterNatureDesign, ModelPart, Triple } from "./shared";
import { body } from "./fishForms";
import { pointed } from "./insectForms";

const hide = "#a9b29a";
const pale = "#c9cdb0";
const dark = "#7f8e79";

export function bodySurfacePoint(sections: [number, number, number, number][], angle: number, depth: number, offset: number): Vector3 {
  const row = sections.findIndex((section, index) => index < sections.length - 1 && depth >= section[0] && depth <= sections[index + 1]![0]), a = sections[row]!, b = sections[row + 1]!, t = (depth - a[0]) / (b[0] - a[0]), turn = (angle + Math.PI * 2) % (Math.PI * 2) / (Math.PI / 6), sector = Math.floor(turn), f = turn - sector;
  const point = (section: [number, number, number, number], step: number) => new Vector3(Math.cos(step * Math.PI / 6) * section[2], section[1] + Math.sin(step * Math.PI / 6) * section[3], section[0]);
  const p = point(a, sector), q = point(a, sector + 1), r = point(b, sector), s = point(b, sector + 1);
  const normal = f + t <= 1 ? q.clone().sub(p).cross(r.clone().sub(p)).normalize() : s.clone().sub(q).cross(r.clone().sub(q)).normalize();
  const result = f + t <= 1 ? p.multiplyScalar(1 - f - t).addScaledVector(q, f).addScaledVector(r, t) : q.multiplyScalar(1 - t).addScaledVector(s, f + t - 1).addScaledVector(r, 1 - f);
  return result.addScaledVector(normal, offset);
}

// 条纹嵌入主体三角面0.7毫米，外层1.2毫米；用同一网格重心坐标，不作椭圆近似。
export function bodyStripe(sections: [number, number, number, number][], side: number, z: number, halfWidth: number, endAngle = -1.1, color = "#6f7d67", startAngle = Math.PI / 2): ModelPart {
  const vertices: { x: number; y: number; z: number }[] = [], indices: number[] = [];
  for (const offset of [-.0007, .0012]) for (let row = 0; row < 8; row++) {
    const t = row / 7, angle = startAngle + (endAngle - startAngle) * t, width = halfWidth * (.75 - .62 * t), curve = Math.sin(t * Math.PI * 1.7) * halfWidth * 1.1;
    for (const edge of [-1, 1]) { const p = bodySurfacePoint(sections, side > 0 ? angle : Math.PI - angle, z + curve + edge * width, offset); vertices.push({ x: p.x, y: p.y, z: p.z }); }
  }
  for (let row = 0; row < 7; row++) { const a = row * 2, b = a + 1, c = a + 2, d = a + 3; indices.push(a, c, b, b, c, d, a + 16, b + 16, c + 16, b + 16, d + 16, c + 16); }
  const boundary = [0, 1, 3, 5, 7, 9, 11, 13, 15, 14, 12, 10, 8, 6, 4, 2];
  for (let i = 0; i < boundary.length; i++) { const a = boundary[i]!, b = boundary[(i + 1) % boundary.length]!; indices.push(a, b, a + 16, b, b + 16, a + 16); }
  if (side < 0) for (let i = 0; i < indices.length; i += 3) [indices[i], indices[i + 1]] = [indices[i + 1]!, indices[i]!];
  return part("沿真实身体表面起伏的嵌入式条纹毛面", "mesh", color, [0, 0, 0], [1, 1, 1], [0, 0, 0], { vertices, indices });
}

// https://nationalzoo.si.edu/animals/tiger
// 主素材只收虎一种，不以白虎、地域种群、性别、毛色或姿态扩主数量。
function tiger(): ModelPart[] {
  const coat = "#b9ae86", stripe = "#6f7d67";
  const sections: [number, number, number, number][] = [[-.85, .555, .14, .18], [-.4, .61, .28, .33], [.48, .67, .29, .34], [.85, .7, .155, .22]];
  const headSections: [number, number, number, number][] = [[.82, .98, .11, .14], [1.02, .997, .17, .19], [1.18, .93, .13, .11], [1.28, .918, .08, .07]];
  const parts: ModelPart[] = [body("虎长而重的柔韧胸腰躯与强壮前胸", sections, coat), tapered("虎粗颈到宽颅的连续肌肉连接", coat, [[0, .78, .62], [0, .94, .88]], [.18, .125]), body("虎额部宽而前吻下斜的完整颅面", headSections, coat), lobe("虎短厚的下颌与白色颏", pale, [0, .838, 1.084], [.26, .15, .33]), lobe("虎鼻端小而宽的鼻镜", stripe, [0, .939, 1.299], [.09, .06, .052]), ...eyes([0, 1.08, 1.075], .135, .025), tapered("虎末端平滑而不带狮式尾簇的细长尾", coat, [[0, .535, -.76], [.12, .39, -1.18], [.34, .25, -1.64], [.49, .3, -1.8]], [.05, .038, .027, .014]), lobe("虎圆钝而不膨成毛团的尾尖", stripe, [.49, .3, -1.8], [.042, .043, .056])];
  for (const side of [-1, 1]) {
    parts.push(lobe("虎颅后圆而非尖长的外耳", coat, [side * .12, 1.132, .853], [.11, .145, .065]), lobe("虎耳背中央白斑", pale, [side * .12, 1.15, .828], [.056, .058, .025]), lobe("虎嘴角两侧短厚的白色须垫", pale, [side * .078, .911, 1.24], [.16, .14, .155]));
    for (const front of [true, false]) {
      const z = front ? .59 : -.57, ankle: Triple = [side * .285, .105, z + .06];
      parts.push(tapered(front ? "虎适于压制猎物的粗前臂与宽腕" : "虎粗股至后折跟骨的强后肢", coat, front ? [[side * .22, .65, z], [side * .315, .36, z - .016], ankle] : [[side * .21, .565, z], [side * .315, .32, z + .11], [side * .29, .15, z - .018], ankle], front ? [.105, .074, .042] : [.135, .08, .041, .036]), lobe("虎宽而有厚肉垫的完整足掌", coat, [ankle[0], .061, ankle[2] + .06], front ? [.205, .1, .285] : [.17, .1, .25]));
      const toes: ModelPart[] = [];
      for (let i = 0; i < 4; i++) toes.push(lobe("虎四枚分开但爪缩在趾鞘内的圆趾", coat, [ankle[0] + (i - 1.5) * (front ? .039 : .032), .049, ankle[2] + (front ? .169 : .151)], front ? [.045, .068, .105] : [.037, .066, .095]));
      if (front) toes.push(lobe("虎不接地的前足内侧悬拇趾", coat, [ankle[0] - side * .052, .151, ankle[2] - .013], [.043, .065, .061]));
      parts.push(combineMeshes("虎真实前五后四的完整肉趾掌", coat, toes));
    }
  }
  const stripes: ModelPart[] = [];
  for (const side of [-1, 1]) {
    for (let i = 0; i < 10; i++) stripes.push(bodyStripe(sections, side, -.71 + i * .15, .025 + i % 3 * .003));
    for (const z of [.952, 1.067, 1.148]) stripes.push(bodyStripe(headSections, side, z, .011, .12));
  }
  for (let i = 0; i < stripes.length; i += 12) parts.push(combineMeshes("虎贴合躯干和颅面而非漂浮绳条的完整条纹", stripe, stripes.slice(i, i + 12)));
  const whiskers: ModelPart[] = [];
  for (const side of [-1, 1]) for (let i = 0; i < 4; i++) whiskers.push(pointed("虎从须垫生出的细触须", pale, [[side * .119, .92 + i * .012, 1.255], [side * .255, .9 + i * .018, 1.308]], [.00065, .0003]));
  parts.push(combineMeshes("虎嘴角两侧完整细触须", pale, whiskers));
  return parts;
}

// https://animals.sandiegozoo.org/animals/reindeer-caribou
function reindeer(): ModelPart[] {
  const parts: ModelPart[] = [body("驯鹿较短宽而肩颈厚实的寒地躯", [[-.79, .74, .14, .23], [-.31, .8, .32, .43], [.44, .85, .3, .43], [.7, .9, .16, .25]], hide), tapered("驯鹿短而强壮并上举的厚毛颈", hide, [[0, 1.0, .49], [0, 1.24, .74], [0, 1.38, .89]], [.19, .145, .095]), lobe("驯鹿面部略下斜而鼻端有毛的长颅", hide, [0, 1.365, 1.038], [.29, .34, .5], [15, 0, 0]), lobe("驯鹿较短而宽的被毛鼻吻", pale, [0, 1.22, 1.255], [.24, .19, .23]), ...eyes([0, 1.42, 1.065], .1, .027), tapered("驯鹿短而有毛的尾", pale, [[0, .72, -.7], [.045, .56, -.92]], [.065, .027])];
  for (const side of [-1, 1]) {
    parts.push(leaf("驯鹿颅侧短宽而非赤鹿长尖的耳", pale, [side * .11, 1.47, .88], .13, .2, [-9, side * 25, -side * 54]), tapered("驯鹿向后再向上前弯的长角梁", pale, [[side * .105, 1.49, .925], [side * .18, 1.83, .64], [side * .27, 2.07, .46], [side * .34, 2.25, .65]], [.032, .028, .024, .017]));
    const brow = part("驯鹿额前铲状眉叉而非驼鹿侧向整片大掌", "extrude", pale, [side * .14, 0, 0], [1, 1, 1], [0, 90, 0], { depth: .027, profile: [{ x: -.895, y: 1.535 }, { x: -1.135, y: 1.59 }, { x: -1.29, y: 1.7 }, { x: -1.43, y: 1.88 }, { x: -1.41, y: 1.68 }, { x: -1.49, y: 1.73 }, { x: -1.43, y: 1.56 }, { x: -1.22, y: 1.51 }, { x: -.965, y: 1.48 }] });
    parts.push(brow);
    const palm = polygon("驯鹿上举角梁末端有细叉的窄掌叶", pale, [[side * .3, -2.17], [side * .4, -2.2], [side * .61, -2.34], [side * .53, -2.36], [side * .63, -2.52], [side * .47, -2.4], [side * .48, -2.58], [side * .39, -2.43], [side * .31, -2.47], [side * .33, -2.31]], .035, [0, 0, .655]); palm.rotation.x = 90; parts.push(palm);
    for (let i = 0; i < 2; i++) parts.push(pointed("驯鹿主角梁向前伸出的中部叉", pale, [[side * (.18 + i * .05), 1.83 + i * .18, .64 - i * .13], [side * (.3 + i * .09), 1.94 + i * .2, .88 - i * .04], [side * (.32 + i * .09), 2.04 + i * .21, .91 - i * .04]], [.019, .012, 0]));
    for (const front of [true, false]) {
      const z = front ? .47 : -.54, ankle: Triple = [side * .23, .145, z + .01];
      parts.push(tapered("驯鹿被毛延伸至蹄根的粗短肢", hide, [[side * .18, front ? .8 : .72, z], [side * .27, .41, z - .045], ankle], [.077, .049, .035]), lobe("驯鹿蹄根厚毛踝部", hide, [ankle[0], .148, ankle[2] + .018], [.13, .14, .15]));
      const hoofs: ModelPart[] = [];
      for (const toeSide of [-1, 1]) {
        const x = ankle[0] + toeSide * .049;
        hoofs.push(polygon("驯鹿向两侧展开而中缝贯通的宽平雪地蹄", dark, [[x - .036, ankle[2] - .053], [x - .047, ankle[2] + .102], [x - .027, ankle[2] + .157], [x + .027, ankle[2] + .157], [x + .047, ankle[2] + .102], [x + .036, ankle[2] - .053]], .082, [0, .018, 0]), lobe("驯鹿踝后较长的辅助悬蹄", dark, [ankle[0] + toeSide * .077, .116, ankle[2] - .075], [.047, .09, .105]));
      }
      parts.push(combineMeshes("驯鹿两枚宽主蹄及发达后悬蹄", dark, hoofs));
    }
  }
  const mane: ModelPart[] = [];
  for (let i = 0; i < 15; i++) { const t = i / 14; mane.push(leaf("驯鹿颈喉下方相连的长毛", pale, [Math.sin(i * 2.4) * .05, .96 + t * .34, .68 + t * .19], .033, .19 - t * .035, [158, i * 137.5 % 360, 0])); }
  parts.push(combineMeshes("驯鹿颈腹连贯的厚喉毛", pale, mane));
  return parts;
}

// https://animaldiversity.org/accounts/Alouatta_palliata/
function mantledHowler(): ModelPart[] {
  const parts: ModelPart[] = [body("斗篷吼猴四足支承的短厚叶食躯", [[-.2, .225, .07, .105], [-.055, .25, .12, .15], [.15, .275, .105, .14], [.235, .28, .065, .085]], hide), tapered("斗篷吼猴短颈与增大的喉部连接", hide, [[0, .31, .17], [0, .365, .275]], [.068, .055]), lobe("斗篷吼猴短面且有深下颌的圆颅", hide, [0, .395, .32], [.16, .18, .17]), lobe("斗篷吼猴不作狒狒长吻的短裸面", dark, [0, .363, .395], [.123, .12, .077]), lobe("斗篷吼猴巨大舌骨共鸣结构下的深喉外廓", hide, [0, .299, .316], [.14, .13, .14]), lobe("斗篷吼猴深下颌骨与厚颏", pale, [0, .307, .368], [.121, .086, .1]), ...eyes([0, .423, .38], .049, .013), tapered("斗篷吼猴粗而可预握的长尾绕卷末端", hide, [[0, .217, -.17], [.06, .14, -.4], [.14, .13, -.61], [.205, .2, -.72], [.22, .31, -.67], [.18, .33, -.59]], [.035, .028, .021, .016, .012, .008])];
  for (const side of [-1, 1]) {
    parts.push(lobe("斗篷吼猴在短毛内露出的圆耳", dark, [side * .065, .424, .275], [.04, .06, .039]));
    for (const front of [true, false]) {
      const z = front ? .154 : -.151, ankle: Triple = [side * .1, .035, z + .074];
      parts.push(tapered(front ? "斗篷吼猴短于后肢而不作蜘蛛猴超长前臂的手臂" : "斗篷吼猴较长的四足支承后腿", hide, [[side * .072, front ? .269 : .222, z], [side * .123, .13, z - .021], ankle], front ? [.032, .024, .014] : [.047, .028, .016]), lobe("斗篷吼猴宽短且有拇指的掌", dark, [ankle[0], .025, ankle[2] + .027], [.062, .035, .085]));
      const fingers: ModelPart[] = [];
      for (let i = 0; i < 4; i++) fingers.push(tapered("斗篷吼猴掌端分离的长抓握指", dark, [[ankle[0] + (i - 1.5) * .011, .029, ankle[2] + .05], [ankle[0] + (i - 1.5) * .014, .012, ankle[2] + .093], [ankle[0] + (i - 1.5) * .014, .024, ankle[2] + .099]], [.007, .005, .003]));
      fingers.push(tapered("斗篷吼猴保留而不退化成蜘蛛猴残指的拇指", dark, [[ankle[0] - side * .024, .034, ankle[2] + .014], [ankle[0] - side * .044, .019, ankle[2] + .045]], [.009, .005]));
      parts.push(combineMeshes("斗篷吼猴有完整拇指的五指抓握掌", dark, fingers));
    }
  }
  const mantle: ModelPart[] = [];
  for (const side of [-1, 1]) for (let i = 0; i < 8; i++) mantle.push(leaf("斗篷吼猴腰肋两侧下垂的长披毛", pale, [side * .087, .268, -.13 + i * .044], .028, .12, [158, side * 20, -side * 17]));
  parts.push(combineMeshes("斗篷吼猴与躯侧相接的完整长披毛", pale, mantle));
  return parts;
}

export const landAnimalExpansionBatchEighteenDesigns: MasterNatureDesign[] = [
  design("tiger", "虎", "动物", tiger, ["Panthera tigris", "老虎", "长重躯宽肉趾掌圆耳细长无尾簇尾与贴体条纹"]),
  design("reindeer", "驯鹿", "动物", reindeer, ["Rangifer tarandus", "前伸眉铲上举窄掌骨角及大开张双蹄和长悬蹄"]),
  design("mantledHowler", "斗篷吼猴", "动物", mantledHowler, ["Alouatta palliata", "深喉舌骨共鸣外廓完整拇指抓握手与粗预握长尾"]),
];
