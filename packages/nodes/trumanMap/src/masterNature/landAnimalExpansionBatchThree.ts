import { Euler, Quaternion, Vector3 } from "three";
import { combineMeshes, design, eyes, leaf, lobe, part, polygon, tapered } from "./shared";
import type { MasterNatureDesign, ModelPart, Triple } from "./shared";
import { fourFeet, head } from "./mammalForms";
import { body } from "./fishForms";
import { pointed } from "./insectForms";

const hide = "#aab19a";
const pale = "#c7caae";
const dark = "#83907b";

function columnFeet(parts: ModelPart[], front: Triple, rear: Triple, gap: number, radius: number, toes: number) {
  for (const root of [front, rear]) for (const side of [-1, 1]) {
    const x = side * gap, z = root[2];
    parts.push(tapered("巨兽承重肢由肩胯至宽足的连续骨肉外廓", hide, [[x * .85, root[1], z], [x, root[1] * .51, z - radius * .18], [x, radius * .72, z]], [radius * 1.15, radius * .78, radius * .66]), lobe("巨兽接地的宽厚足垫", hide, [x, radius * .55, z + radius * .18], [radius * 2.05, radius * 1.12, radius * 2.5]));
    const nails: ModelPart[] = [];
    for (let i = 0; i < toes; i++) { const a = -.8 + i / (toes - 1) * 1.6; nails.push(lobe("巨兽足垫前缘独立趾甲", pale, [x + Math.sin(a) * radius * .8, radius * .42, z + Math.cos(a) * radius * 1.16], [radius * .51, radius * .62, radius * .52])); }
    parts.push(combineMeshes("巨兽完整而不分裂成牛蹄的足甲列", pale, nails));
  }
}

// 原创简化复原；参考AMNH巨犀展陈的高肩、长颈与无角头型，不使用馆方3D数据。
// https://digitalcollections.amnh.org/API/Download/v1_0/GetOriginalLimited?Identifier=AN14376574&SourceAction=API_VIEW_DETAILS_TRX&UsePreviewPdf=False
function paraceratherium(): ModelPart[] {
  const parts: ModelPart[] = [lobe("巨犀深大长躯与前高后低的背线", hide, [0, 3.05, 0], [2.25, 2.6, 4.25], [-6, 0, 0]), lobe("巨犀高耸前肩而非象背肩隆", hide, [0, 3.7, 1.2], [1.85, 2.0, 1.65]), tapered("巨犀从前肩斜上伸出的长而强壮颈", hide, [[0, 3.7, 1.3], [0, 4.2, 2.1], [0, 4.65, 2.8]], [.72, .54, .38]), lobe("巨犀无角而长狭的低顶颅", hide, [0, 4.68, 3.25], [.8, .82, 1.55]), lobe("巨犀前端厚上唇而不带长象鼻", pale, [0, 4.5, 3.94], [.58, .41, .46]), ...eyes([0, 4.87, 3.42], .3, .065)];
  columnFeet(parts, [0, 3.5, 1.15], [0, 2.9, -1.35], .71, .3, 3);
  for (const side of [-1, 1]) parts.push(leaf("巨犀长颅后上方的小椭圆耳", pale, [side * .29, 4.95, 2.84], .3, .52, [-20, side * 20, -side * 22]));
  parts.push(tapered("巨犀悬至后腿下段的细长尾", hide, [[0, 3.05, -1.8], [.13, 1.7, -2.12], [.18, .75, -2.21]], [.12, .065, .025]), lobe("巨犀尾末端小毛簇", dark, [.18, .75, -2.21], [.13, .3, .13]));
  return parts;
}

// https://www.nhm.ac.uk/discover/what-was-megatherium.html
function megatherium(): ModelPart[] {
  const parts: ModelPart[] = [lobe("大地懒粗大直立而非悬挂的胸腹", hide, [0, 1.62, -.1], [1.5, 2.55, 1.27], [12, 0, 0]), lobe("大地懒宽大的承重骨盆外廓", hide, [0, .78, -.3], [1.75, 1.15, 1.4]), tapered("大地懒从胸前举起的短粗颈", hide, [[0, 2.5, .3], [0, 2.99, .6]], [.36, .27]), lobe("大地懒长而低顶的头颅", pale, [0, 3.1, .87], [.61, .53, .91]), lobe("大地懒厚唇长吻", hide, [0, 2.98, 1.22], [.42, .3, .46]), ...eyes([0, 3.22, 1.02], .218, .045), tapered("大地懒第三承重点的粗重肌肉尾", hide, [[0, .83, -.72], [0, .41, -1.3], [.08, .17, -1.95], [.13, .14, -2.23]], [.5, .34, .15, .08])];
  for (const side of [-1, 1]) {
    parts.push(tapered("大地懒粗短股胫与外翻踝", hide, [[side * .52, .94, -.26], [side * .74, .45, -.31], [side * .78, .15, .05]], [.34, .26, .16]), lobe("大地懒以外侧缘承重的内翻长后足", dark, [side * .79, .12, .29], [.25, .23, .78], [0, 0, side * 31]), tapered("大地懒强壮长前臂举至胸前", hide, [[side * .55, 2.4, .15], [side * .9, 1.9, .66], [side * .73, 1.76, 1.07]], [.27, .22, .16]), lobe("大地懒粗厚前掌", hide, [side * .73, 1.73, 1.14], [.4, .25, .39]), lobe("大地懒小圆耳", dark, [side * .29, 3.2, .61], [.12, .19, .1]));
    const claws: ModelPart[] = [];
    for (let i = 0; i < 3; i++) {
      claws.push(pointed("大地懒前掌特别巨大的下弯钩爪", pale, [[side * .73 + (i - 1) * .12, 1.75, 1.23], [side * .73 + (i - 1) * .12, 1.62, 1.49], [side * .73 + (i - 1) * .12, 1.38, 1.5]], [.065, .045, 0]), pointed("大地懒内翻后掌向内收起的长趾爪", pale, [[side * .69 + (i - 1) * .075, .22, .51], [side * .62 + (i - 1) * .075, .19, .76], [side * .61 + (i - 1) * .075, .29, .78]], [.047, .032, 0]));
    }
    parts.push(combineMeshes("大地懒每侧前后掌的完整巨爪", pale, claws));
  }
  return parts;
}

// https://www.mnhn.fr/fr/glyptodonte
function glyptodon(): ModelPart[] {
  const angles = [0, .15, .42, .69, .96, 1.23, Math.PI / 2];
  const shellProfile = [...angles.map(a => ({ x: Math.cos(a) * .855, y: Math.sin(a) * 1.11 })), ...[...angles].reverse().map(a => ({ x: Math.cos(a) * .805, y: Math.sin(a) * 1.055 })), { x: .855, y: 0 }];
  const parts: ModelPart[] = [part("雕齿兽不可弯曲的完整厚壁拱壳", "lathe", hide, [0, .3, 0], [1, 1, 1.23], [0, 0, 0], { profile: shellProfile }), lobe("雕齿兽壳下低矮腹躯", hide, [0, .44, 0], [1.3, .6, 1.65]), tapered("雕齿兽从前甲缘下伸出的短颈", hide, [[0, .49, .74], [0, .44, 1.02]], [.2, .15]), lobe("雕齿兽短深脸与高鼻的厚颅", pale, [0, .43, 1.12], [.37, .4, .46]), ...eyes([0, .55, 1.18], .13, .035), tapered("雕齿兽外覆环甲的短尾轴", hide, [[0, .38, -.87], [.04, .25, -1.23], [.08, .16, -1.62]], [.17, .13, .06])];
  columnFeet(parts, [0, .44, .57], [0, .43, -.55], .43, .13, 4);
  const plates: ModelPart[] = [];
  for (let row = 0; row < 5; row++) for (let col = 0; col < 16; col++) {
    const beta = .15 + row * .27, a = (col + (row % 2) * .5) * Math.PI / 8;
    const root: Triple = [.855 * Math.cos(beta) * Math.cos(a), .3 + 1.11 * Math.sin(beta), 1.05 * Math.cos(beta) * Math.sin(a)];
    const normal = new Vector3(root[0] / (.855 ** 2), (root[1] - .3) / (1.11 ** 2), root[2] / (1.05 ** 2)).normalize(), euler = new Euler().setFromQuaternion(new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), normal));
    const tile = polygon("雕齿兽互锁而非活动带的六角皮骨板", pale, Array.from({ length: 6 }, (_, i) => [Math.cos(i * Math.PI / 3) * .115, Math.sin(i * Math.PI / 3) * .115] as [number, number]), .024, [root[0] - normal.x * .012, root[1] - normal.y * .012, root[2] - normal.z * .012]);
    tile.rotation = { x: euler.x * 180 / Math.PI, y: euler.y * 180 / Math.PI, z: euler.z * 180 / Math.PI }; plates.push(tile);
  }
  for (let i = 0; i < plates.length; i += 24) parts.push(combineMeshes("雕齿兽拱面上整体固定的皮骨甲片", pale, plates.slice(i, i + 24)));
  for (let i = 0; i < 7; i++) { const z = -.96 - i * .095, r = .15 - i * .013; parts.push(part("雕齿兽短尾连贯的骨质套环", "lathe", pale, [.025 + i * .008, .32 - i * .024, z], [1, 1, 1], [90, 0, 0], { profile: [{ x: r, y: -.035 }, { x: r, y: .035 }, { x: r - .018, y: .035 }, { x: r - .018, y: -.035 }, { x: r, y: -.035 }] })); }
  return parts;
}

// https://www.amnh.org/content/download/41421/601583/file/Extreme%20Mammals%20The%20Biggest%20Smallest%20and%20Most%20Amazing%20Mammals%20of%20All%20Time.pdf
function uintatherium(): ModelPart[] {
  const parts: ModelPart[] = [lobe("犹因它兽深腹低背的粗壮躯", hide, [0, 1.17, -.1], [1.22, 1.45, 2.48]), tapered("犹因它兽短颈连接低垂长颅", hide, [[0, 1.38, .65], [0, 1.38, 1.06]], [.38, .31]), lobe("犹因它兽细长低顶而前部加宽的颅", hide, [0, 1.4, 1.4], [.67, .55, 1.04]), lobe("犹因它兽深大下颌", dark, [0, 1.08, 1.41], [.56, .32, .89]), ...eyes([0, 1.53, 1.32], .25, .048)];
  columnFeet(parts, [0, 1.2, .63], [0, 1.16, -.86], .42, .17, 5);
  for (const side of [-1, 1]) {
    for (const [z, y, radius] of [[1.77, 1.65, .085], [1.43, 1.71, .11], [1.04, 1.68, .13]]) parts.push(lobe("犹因它兽成对骨质瘤而非无据加长角鞘", pale, [side * .21, y!, z!], [radius! * 1.6, radius! * 2.2, radius! * 1.8]));
    parts.push(pointed("犹因它兽从上颌伸出的长犬齿", pale, [[side * .22, 1.36, 1.7], [side * .24, 1.1, 1.81], [side * .23, .86, 1.78]], [.065, .045, 0]), polygon("犹因它兽保护上犬齿的下颌下垂缘", hide, [[side * .17, 1.41], [side * .29, 1.47], [side * .29, 1.79], [side * .17, 1.75]], .24, [0, .88, 0]), leaf("犹因它兽颞后小耳", pale, [side * .24, 1.56, .93], .17, .22, [0, side * 22, -side * 35]));
  }
  parts.push(tapered("犹因它兽较短的细尾", hide, [[0, 1.22, -1.16], [.08, .7, -1.48], [.12, .48, -1.52]], [.065, .04, .013]));
  return parts;
}

// https://www.palaeo-electronica.org/content/2016/1702-the-metapodials-of-giraffidae
function sivatherium(): ModelPart[] {
  const parts: ModelPart[] = [lobe("西瓦兽胸肩厚重且前肢较高的躯", hide, [0, 1.76, -.03], [1.1, 1.4, 2.45], [-5, 0, 0]), lobe("西瓦兽承托巨角的发达肩颈基", hide, [0, 2.12, .65], [.91, 1.12, 1.05]), tapered("西瓦兽明显短于现生长颈鹿的粗颈", hide, [[0, 2.13, .72], [0, 2.51, 1.07]], [.32, .24])];
  head(parts, [0, 2.59, 1.29], [.45, .49, .67], .12, "none");
  fourFeet(parts, [0, 1.81, .76], [0, 1.61, -.83], .37, .12, false, true);
  for (const side of [-1, 1]) {
    parts.push(leaf("西瓦兽在后骨角外侧的长耳", pale, [side * .16, 2.68, 1.02], .22, .37, [8, side * 30, -side * 54]), tapered("西瓦兽眼上较小的前对骨角", pale, [[side * .13, 2.77, 1.4], [side * .16, 3.01, 1.47]], [.062, .025]), tapered("西瓦兽颅后粗大且向外展开的后骨角主干", pale, [[side * .17, 2.76, 1.02], [side * .3, 3.08, .94], [side * .45, 3.26, .92]], [.09, .085, .045]));
    for (let branch = 0; branch < 3; branch++) parts.push(pointed("西瓦兽后骨角末端真实分开的宽掌叉", pale, [[side * .32, 3.1, .94], [side * (.43 + branch * .1), 3.29 + .06 * Math.sin(branch), .78 + branch * .14], [side * (.47 + branch * .1), 3.37 + .08 * Math.sin(branch), .77 + branch * .14]], [.055, .036, 0]));
  }
  parts.push(tapered("西瓦兽后躯垂尾", hide, [[0, 1.7, -1.1], [.04, .94, -1.34], [.09, .53, -1.37]], [.07, .035, .02]), lobe("西瓦兽尾端毛束", dark, [.09, .53, -1.37], [.12, .28, .13]));
  return parts;
}

// https://www.nps.gov/common/uploads/teachers/lessonplans/-Death-Trap-Power-Point%20%281%29.pdf
function daeodon(): ModelPart[] {
  const parts: ModelPart[] = [lobe("凶齿豨高肩长腿而非猪圆桶的躯", hide, [0, 1.25, -.05], [.78, 1.05, 2.1], [-9, 0, 0]), lobe("凶齿豨隆起前肩与发达的颈背", hide, [0, 1.49, .57], [.77, 1.12, .92]), tapered("凶齿豨承托巨颅的短而粗前颈", hide, [[0, 1.5, .67], [0, 1.45, 1.08]], [.29, .27]), lobe("凶齿豨占头躯比例很大的狭长高颅", hide, [0, 1.43, 1.46], [.57, .78, 1.13]), lobe("凶齿豨前端高深的吻部", pale, [0, 1.31, 1.94], [.41, .44, .4]), lobe("凶齿豨粗厚下颌和颏部小结节", hide, [0, 1.08, 1.57], [.46, .3, .98]), ...eyes([0, 1.64, 1.42], .22, .047)];
  fourFeet(parts, [0, 1.21, .57], [0, 1.07, -.7], .26, .08, false, true);
  for (const side of [-1, 1]) {
    parts.push(tapered("凶齿豨向外下展的真正颧骨翼", hide, [[side * .19, 1.43, 1.22], [side * .44, 1.29, 1.33], [side * .43, 1.2, 1.41]], [.12, .13, .08]), leaf("凶齿豨巨头后上方的小圆耳", pale, [side * .22, 1.68, 1.04], .16, .22, [-20, side * 25, -side * 20]), pointed("凶齿豨从上颌侧露出的短锥犬齿", pale, [[side * .19, 1.29, 1.81], [side * .22, 1.09, 1.87]], [.047, 0]));
  }
  parts.push(tapered("凶齿豨直而细的尾轴", hide, [[0, 1.24, -.94], [.08, .91, -1.32], [.16, .73, -1.46]], [.035, .024, .005]));
  return parts;
}

// https://www.nhm.ac.uk/discover/dino-directory/carnotaurus.html
// 四指退化前肢与短高窄颅；缺失尾/小腿按近亲作简化复原，不宣称软组织精确。
function carnotaurus(): ModelPart[] {
  const parts: ModelPart[] = [body("食肉牛龙高髋低胸的水平躯", [[-1.02, 1.96, .32, .55], [-.42, 2.05, .48, .72], [.52, 2.12, .42, .66], [1.02, 2.2, .23, .4]], hide), tapered("食肉牛龙短而强壮的前倾颈", hide, [[0, 2.3, .8], [0, 2.72, 1.25], [0, 2.83, 1.53]], [.32, .26, .19]), lobe("食肉牛龙前后短而上下高的窄颅", hide, [0, 2.85, 1.85], [.45, .68, .79]), lobe("食肉牛龙前端截短的吻", pale, [0, 2.78, 2.13], [.37, .42, .35]), lobe("食肉牛龙窄而深的下颌", hide, [0, 2.53, 1.96], [.35, .22, .68]), ...eyes([0, 2.99, 1.94], .173, .059), pointed("食肉牛龙从粗大尾根渐收至尖的平衡尾", hide, [[0, 2.0, -.89], [0, 1.9, -1.8], [.08, 1.67, -3.0], [.21, 1.49, -4.25], [.39, 1.37, -5.5]], [.42, .35, .24, .12, 0])];
  for (const side of [-1, 1]) {
    parts.push(pointed("食肉牛龙眼上朝两侧伸展的眉角", pale, [[side * .17, 3.07, 1.77], [side * .42, 3.22, 1.73]], [.13, 0]), tapered("食肉牛龙粗大屈曲后股", hide, [[side * .34, 1.99, -.4], [side * .59, 1.1, -.06], [side * .53, .42, -.54], [side * .55, .13, -.17]], [.28, .2, .095, .065]), lobe("食肉牛龙足掌", dark, [side * .55, .095, -.045], [.26, .15, .38]), tapered("食肉牛龙退化上臂及向后短前臂", hide, [[side * .32, 2.25, .81], [side * .41, 2.08, .77], [side * .42, 2.05, .64]], [.062, .043, .026]));
    const digits: ModelPart[] = [];
    for (let i = 0; i < 3; i++) digits.push(pointed("食肉牛龙承重足的三枚前向长趾", dark, [[side * .55 + (i - 1) * .068, .095, .055], [side * .55 + (i - 1) * .11, .064, .35 + (i === 1 ? .1 : 0)], [side * .55 + (i - 1) * .11, .03, .41 + (i === 1 ? .1 : 0)]], [.047, .025, 0]));
    for (let i = 0; i < 4; i++) digits.push(pointed("食肉牛龙小掌末端四枚退化指", hide, [[side * .42 + (i - 1.5) * .014, 2.05, .66], [side * .42 + (i - 1.5) * .018, 2.04, .6 - (i % 2) * .012]], [.009, 0]));
    parts.push(combineMeshes("食肉牛龙区别于暴龙二指的完整指趾结构", dark, digits));
  }
  const scales: ModelPart[] = [];
  for (let i = 0; i < 16; i++) for (const side of [-1, 1]) {
    const z = .6 - i * .09, width = z > .52 ? .42 + (z - .52) / .5 * (.23 - .42) : z > -.42 ? .48 + (z + .42) / .94 * (.42 - .48) : .32 + (z + 1.02) / .6 * (.48 - .32), y = z > .52 ? 2.12 + (z - .52) / .5 * .08 : z > -.42 ? 2.05 + (z + .42) / .94 * .07 : 1.96 + (z + 1.02) / .6 * .09;
    scales.push(lobe("食肉牛龙皮肤化石所示离散大瘤鳞简化", pale, [side * (width - .015), y, z], [.085, .055, .085]));
  }
  parts.push(combineMeshes("食肉牛龙两侧实际贴身的大型瘤鳞", pale, scales));
  return parts;
}

// https://www.nhm.ac.uk/discover/dino-directory/diplodocus.html
function diplodocus(): ModelPart[] {
  const parts: ModelPart[] = [body("梁龙前低后高且深腹宽髋的长躯", [[-2.0, 2.74, .64, 1.03], [-.9, 2.88, 1.1, 1.43], [.65, 2.83, 1.03, 1.31], [1.75, 2.72, .56, .84]], hide), tapered("梁龙与高举腕龙不同的近水平长颈", hide, [[0, 3.04, 1.3], [0, 3.48, 3.15], [0, 3.74, 5.2], [0, 3.89, 7.1], [0, 3.96, 8.35]], [.59, .43, .28, .18, .13]), lobe("梁龙低长而狭小的轻颅", pale, [0, 3.94, 8.65], [.34, .37, .75]), lobe("梁龙前端扩展的窄长口吻", hide, [0, 3.83, 8.94], [.31, .23, .39]), ...eyes([0, 4.03, 8.63], .13, .042), pointed("梁龙在空中连续延伸约十五米的鞭尾", hide, [[0, 2.8, -1.55], [0, 2.6, -3.4], [.13, 2.23, -5.8], [.4, 1.9, -8.4], [.78, 1.61, -10.8], [1.18, 1.37, -13.15], [1.62, 1.27, -15.6], [1.91, 1.45, -16.6]], [.64, .45, .29, .17, .09, .045, .018, 0])];
  for (const side of [-1, 1]) {
    parts.push(tapered("梁龙较短但直立支承的前肢", hide, [[side * .69, 2.65, 1.12], [side * .77, 1.28, 1.18], [side * .78, .34, 1.29]], [.34, .22, .18]), lobe("梁龙前掌半圆筒状垂直承重面", hide, [side * .78, .23, 1.3], [.48, .43, .52]), tapered("梁龙更高更粗的后肢及踝", hide, [[side * .76, 2.83, -1.15], [side * .94, 1.42, -.93], [side * .91, .29, -1.32]], [.45, .3, .2]), lobe("梁龙宽而接地的后足", hide, [side * .91, .2, -1.23], [.63, .36, .83]), pointed("梁龙前足内侧单一发达拇趾爪", pale, [[side * .61, .25, 1.38], [side * .53, .15, 1.62], [side * .5, .11, 1.69]], [.1, .065, 0]));
    const claws: ModelPart[] = [];
    for (let i = 0; i < 3; i++) claws.push(pointed("梁龙后足内侧三枚向前弯趾爪", pale, [[side * .91 + (i - 1) * .16, .18, -.93], [side * .91 + (i - 1) * .17, .1, -.65], [side * .91 + (i - 1) * .17, .065, -.6]], [.073, .045, 0]));
    parts.push(combineMeshes("梁龙完整后足趾爪", pale, claws));
  }
  return parts;
}

export const landAnimalExpansionBatchThreeDesigns: MasterNatureDesign[] = [
  design("paraceratherium", "巨犀", "动物", paraceratherium, ["Paraceratherium", "无角长颈高肩与三趾宽足"]),
  design("megatherium", "大地懒", "动物", megatherium, ["Megatherium americanum", "粗尾三点支承与内翻巨足钩爪"]),
  design("glyptodon", "雕齿兽", "动物", glyptodon, ["Glyptodon asper", "刚性拱壳六角皮骨板与环甲短尾"]),
  design("uintatherium", "犹因它兽", "动物", uintatherium, ["Uintatherium anceps", "六颅骨瘤犬齿及下颌护缘"]),
  design("sivatherium", "西瓦兽", "动物", sivatherium, ["Sivatherium giganteum", "粗短颈两对骨角与后对掌叉"]),
  design("daeodon", "凶齿豨", "动物", daeodon, ["Daeodon shoshonensis", "高腿巨深颅与侧展颧骨翼"]),
  design("carnotaurus", "食肉牛龙", "动物", carnotaurus, ["Carnotaurus sastrei", "短高窄颅双眉角与四指退化前肢"]),
  design("diplodocus", "梁龙", "动物", diplodocus, ["Diplodocus", "低前肢近水平长颈和空中鞭尾"]),
];
