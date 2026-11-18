import { combineMeshes, design, eyes, lobe, part, polygon, tapered } from "./shared";
import type { MasterNatureDesign, ModelPart, Triple } from "./shared";
import { body } from "./fishForms";
import { pointed } from "./insectForms";

const hide = "#a8b099";
const pale = "#c5c9ab";
const dark = "#82917c";

// https://new.ras.ru/upload/iblock/b7a/iy8q06npfl8cm4zq13qwwcwvibj9frej.pdf
// 属内仅收冠角形态明显的 mirabilis；不将另一种及性别角型重复计主。
function estemmenosuchus(): ModelPart[] {
  const parts: ModelPart[] = [body("冠鳄兽宽阔低胸且腹部厚重的完整躯", [[-.98, .78, .29, .32], [-.48, .84, .52, .48], [.5, .85, .49, .46], [.91, .85, .29, .3]], hide), tapered("冠鳄兽前伸而粗短的颈", hide, [[0, .92, .76], [0, .99, 1.11]], [.26, .22]), lobe("冠鳄兽深大的长颅与后部颞区", hide, [0, 1.02, 1.29], [.42, .48, .66]), lobe("冠鳄兽前端扩宽而低的鼻吻", pale, [0, .92, 1.58], [.39, .24, .32]), lobe("冠鳄兽与巨颅相连的深下颌", hide, [0, .76, 1.33], [.34, .19, .62]), ...eyes([0, 1.12, 1.37], .155, .032), pointed("冠鳄兽比身体短且根部粗的爬行式尾", hide, [[0, .74, -.87], [.07, .5, -1.31], [.18, .36, -1.72]], [.19, .11, 0])];
  for (const side of [-1, 1]) {
    parts.push(tapered("冠鳄兽颅顶主角柱而非哺乳类角鞘", pale, [[side * .14, 1.18, 1.13], [side * .2, 1.42, 1.1], [side * .24, 1.53, 1.07]], [.09, .077, .036]), pointed("冠鳄兽颅顶角柱的外侧分叉", pale, [[side * .19, 1.39, 1.105], [side * .33, 1.49, 1.06]], [.056, 0]), pointed("冠鳄兽颧骨向两侧水平扩展的骨翼角", pale, [[side * .16, .98, 1.23], [side * .37, 1.015, 1.17], [side * .43, 1.08, 1.16]], [.1, .066, 0]), pointed("冠鳄兽上颌明显的大犬齿", pale, [[side * .12, .91, 1.56], [side * .13, .745, 1.61]], [.031, 0]));
    for (const front of [true, false]) {
      const z = front ? .62 : -.64, ankle: Triple = [side * .59, .08, z + .13];
      parts.push(tapered("冠鳄兽侧展肘膝与半直立粗肢", hide, [[side * .31, .77, z], [side * .65, .4, z - .1], ankle], [.16, .113, .051]), lobe("冠鳄兽接地的五趾宽掌", dark, [ankle[0], .06, ankle[2] + .055], [.22, .1, .27]));
      const toes: ModelPart[] = [];
      for (let i = 0; i < 5; i++) toes.push(pointed("冠鳄兽分离且向前扇开的五枚趾", pale, [[ankle[0] + (i - 2) * .031, .065, ankle[2] + .1], [ankle[0] + (i - 2) * .05, .025, ankle[2] + .24 - Math.abs(i - 2) * .022]], [.019, 0]));
      parts.push(combineMeshes("冠鳄兽区别于柱足古哺乳类的完整扇形趾列", pale, toes));
    }
  }
  parts.push(lobe("冠鳄兽鼻中线上低矮骨瘤", pale, [0, 1.066, 1.58], [.105, .16, .13]));
  return parts;
}

// https://www.wits.ac.za/news/latest-news/in-their-own-words/2017/2017-08/new-insights-into-the-survival-techniques-of-a-prehistoric-beast.html
function moschops(): ModelPart[] {
  const parts: ModelPart[] = [body("麝足兽前高后低且宽深的厚重胸腹", [[-.86, .91, .29, .38], [-.38, 1.01, .49, .57], [.47, 1.17, .47, .56], [.84, 1.24, .28, .35]], hide), lobe("麝足兽高耸肩部与发达颈肌", hide, [0, 1.31, .62], [.68, .75, .76]), tapered("麝足兽向前下方伸出的短强颈", hide, [[0, 1.36, .77], [0, 1.29, 1.08]], [.26, .21]), lobe("麝足兽后高前低的方深颅", hide, [0, 1.23, 1.26], [.43, .46, .54], [25, 0, 0]), lobe("麝足兽压低的圆短鼻吻", pale, [0, 1.03, 1.49], [.34, .27, .27]), lobe("麝足兽颌后下垂的粗厚下颌", hide, [0, .99, 1.25], [.33, .27, .44]), lobe("麝足兽厚额顶骨盾而非厚头龙球状头包", pale, [0, 1.42, 1.18], [.34, .14, .32], [21, 0, 0]), ...eyes([0, 1.22, 1.345], .16, .034), pointed("麝足兽极短粗尾", hide, [[0, .85, -.76], [.03, .62, -1.03], [.08, .53, -1.18]], [.13, .078, 0])];
  for (const side of [-1, 1]) for (const front of [true, false]) {
    const z = front ? .58 : -.56, ankle: Triple = [side * (front ? .59 : .43), .083, z + .105];
    parts.push(tapered(front ? "麝足兽仍然侧展的强壮长前肢" : "麝足兽向躯下内收且较短的后肢", hide, front ? [[side * .28, 1.25, z], [side * .6, .65, z - .08], ankle] : [[side * .29, .9, z], [side * .42, .4, z + .035], ankle], front ? [.18, .117, .054] : [.19, .123, .056]), lobe("麝足兽宽而短的足掌", dark, [ankle[0], .062, ankle[2] + .063], [.24, .1, .28]));
    const toes: ModelPart[] = [];
    for (let i = 0; i < 5; i++) toes.push(pointed("麝足兽五枚低矮承重趾", pale, [[ankle[0] + (i - 2) * .036, .063, ankle[2] + .12], [ankle[0] + (i - 2) * .047, .023, ankle[2] + .24 - Math.abs(i - 2) * .025]], [.02, 0]));
    parts.push(combineMeshes("麝足兽完整的五趾足端", pale, toes));
  }
  return parts;
}

// https://www.cam.ac.uk/stories/scelidosaurus
// https://doi.org/10.1093/zoolinnean/zlz085
function scelidosaurus(): ModelPart[] {
  const sections: [number, number, number, number][] = [[-.66, .88, .17, .24], [-.22, .94, .32, .43], [.48, .94, .3, .4], [.79, .92, .16, .25]];
  const parts: ModelPart[] = [body("棱背龙明显高于甲龙的窄深躯与较长后腿", sections, hide), tapered("棱背龙向前上举的较细颈", hide, [[0, 1.03, .6], [0, 1.22, 1.03]], [.15, .1]), lobe("棱背龙后宽前窄且较小的食草头颅", hide, [0, 1.27, 1.2], [.27, .29, .43]), lobe("棱背龙较短且下压的角质喙", pale, [0, 1.18, 1.39], [.21, .13, .2]), ...eyes([0, 1.32, 1.25], .095, .027), pointed("棱背龙细长且无甲龙尾锤的平衡尾", hide, [[0, .87, -.57], [.035, .71, -1.22], [.13, .56, -1.95], [.23, .49, -2.5]], [.19, .14, .075, 0])];
  for (const side of [-1, 1]) {
    parts.push(pointed("棱背龙枕后上方向后弯曲的独立骨角", pale, [[side * .09, 1.36, 1.075], [side * .12, 1.48, 1.015], [side * .15, 1.47, .96]], [.043, .03, 0]), tapered("棱背龙较短的直立前肢", hide, [[side * .18, .93, .5], [side * .27, .46, .58], [side * .245, .073, .64]], [.075, .054, .031]), lobe("棱背龙短宽前掌", dark, [side * .245, .055, .69], [.14, .085, .2]), tapered("棱背龙粗股长胫的较长后肢", hide, [[side * .21, .92, -.32], [side * .36, .54, -.08], [side * .31, .22, -.43], [side * .31, .078, -.24]], [.14, .087, .044, .033]), lobe("棱背龙明显长于前掌的后足", dark, [side * .31, .057, -.14], [.2, .089, .29]));
    const toes: ModelPart[] = [];
    for (let i = 0; i < 4; i++) {
      toes.push(pointed("棱背龙四枚短前趾", pale, [[side * .245 + (i - 1.5) * .026, .054, .75], [side * .245 + (i - 1.5) * .033, .019, .83 - Math.abs(i - 1.5) * .009]], [.012, 0]), pointed("棱背龙三主趾外保留较短第一后趾", pale, [[side * .31 + (i - 1.5) * .034, .06, -.04], [side * .31 + (i - 1.5) * .047, .02, .09 - (i === 0 ? .07 : 0)]], [.018, 0]));
    }
    parts.push(combineMeshes("棱背龙区别于低伏甲龙的完整前后足", pale, toes));
    for (let i = 0; i < 3; i++) parts.push(pointed("棱背龙颈侧成对的向后斜伸骨棘", pale, [[side * .084, 1.16 + i * .045, .83 + i * .075], [side * .17, 1.26 + i * .045, .75 + i * .075]], [.035, 0]));
  }
  const armor: ModelPart[] = [];
  for (const side of [-1, 1]) for (const angle of [.38, 1.08]) for (let i = 0; i < 10; i++) {
    const z = -.57 + i * .137, j = z < -.22 ? 0 : z < .48 ? 1 : 2, a = sections[j]!, b = sections[j + 1]!, t = (z - a[0]!) / (b[0]! - a[0]!), center = a[1]! + (b[1]! - a[1]!) * t, width = a[2]! + (b[2]! - a[2]!) * t, height = a[3]! + (b[3]! - a[3]!) * t, x = side * width * Math.sin(angle), y = center + height * Math.cos(angle);
    armor.push(pointed("棱背龙沿躯实际表面成列的棱脊骨甲", pale, [[x * .97, y - .014, z], [x + side * .055, y + .1, z - .026]], [.049, 0]));
  }
  for (let i = 0; i < 9; i++) for (const side of [-1, 1]) {
    const t = i / 8, z = -.82 - t * 1.4, x = .021 + t * .15 + side * (.14 - t * .092), y = .81 - t * .27;
    armor.push(pointed("棱背龙尾侧继续排列而非单个大尾锤的骨甲", pale, [[x, y, z], [x + side * .055, y + .055, z - .045]], [.033 - t * .012, 0]));
  }
  for (let i = 0; i < armor.length; i += 16) parts.push(combineMeshes("棱背龙贴合躯尾并分批合并的皮骨甲列", pale, armor.slice(i, i + 16)));
  return parts;
}

// https://australian.museum/publications/westpac-long-gallery/canowindra-fish-fossils-case/
// 2.5米指含长尾头颈的全长，未误作龟甲长。
function meiolania(): ModelPart[] {
  const angles = [0, .23, .48, .73, 1.0, 1.28, Math.PI / 2], shellProfile = [...angles.map(a => ({ x: Math.cos(a) * .435, y: Math.sin(a) * .4 })), ...[...angles].reverse().map(a => ({ x: Math.cos(a) * .405, y: Math.sin(a) * .37 })), { x: .435, y: 0 }];
  const parts: ModelPart[] = [part("卷角龟有真实厚度且腹下留空的拱形背甲", "lathe", hide, [0, .235, 0], [1, 1, 1.17], [0, 0, 0], { profile: shellProfile }), polygon("卷角龟与甲缘间保留四肢出口的低位腹甲", pale, [[-.18, .42], [-.3, .25], [-.29, -.3], [-.15, -.43], [.15, -.43], [.29, -.3], [.3, .25], [.18, .42]], .036, [0, .16, 0]), lobe("卷角龟甲下低躯", dark, [0, .25, 0], [.67, .3, .82]), tapered("卷角龟伸出前甲缘的较长粗颈", hide, [[0, .31, .36], [0, .32, .68], [0, .31, .79]], [.12, .095, .075]), lobe("卷角龟短宽而向前变窄的角质头", pale, [0, .315, .87], [.245, .2, .31]), lobe("卷角龟短钩喙", hide, [0, .265, 1.015], [.165, .115, .105]), ...eyes([0, .365, .91], .088, .023), tapered("卷角龟完全独立于背甲的长肌肉尾轴", hide, [[0, .28, -.4], [.025, .23, -.82], [.08, .18, -1.19], [.12, .17, -1.43]], [.115, .09, .062, .027]), lobe("卷角龟尾末端骨质小锤", pale, [.12, .17, -1.4], [.135, .13, .205])];
  for (const side of [-1, 1]) {
    parts.push(pointed("卷角龟枕后向上及向后弯的主要B角", pale, [[side * .088, .35, .78], [side * .18, .43, .72], [side * .205, .53, .66]], [.052, .036, 0]), pointed("卷角龟主角下外侧较小的C骨突", pale, [[side * .105, .29, .79], [side * .167, .28, .755]], [.038, 0]));
    for (const front of [true, false]) {
      const z = front ? .26 : -.31, ankle: Triple = [side * .41, .054, z + .09];
      parts.push(tapered("卷角龟不变成游泳鳍的侧展承重肢", hide, [[side * .24, .25, z], [side * .41, .14, z - .03], ankle], [.082, .058, .035]), lobe("卷角龟陆栖的短宽足掌", dark, [ankle[0], .04, ankle[2] + .035], [.145, .064, .19]));
      const toes: ModelPart[] = [];
      for (let i = 0; i < 5; i++) toes.push(pointed("卷角龟陆足前缘分离的短钝趾爪", pale, [[ankle[0] + (i - 2) * .022, .045, ankle[2] + .085], [ankle[0] + (i - 2) * .029, .016, ankle[2] + .147 - Math.abs(i - 2) * .012]], [.013, 0]));
      parts.push(combineMeshes("卷角龟每只承重足完整的短爪列", pale, toes));
    }
  }
  for (let i = 0; i < 8; i++) {
    const t = i / 7, z = -.57 - t * .71, x = .007 + t * .086, y = .26 - t * .075, radius = .112 - t * .045;
    parts.push(part("卷角龟尾部真正贯通且前后衔接的骨质套环", "lathe", pale, [x, y, z], [1, 1, 1], [90, 0, 0], { profile: [{ x: radius, y: -.035 }, { x: radius, y: .035 }, { x: radius - .016, y: .035 }, { x: radius - .016, y: -.035 }, { x: radius, y: -.035 }] }));
    const spikes: ModelPart[] = [];
    for (const side of [-1, 1]) spikes.push(pointed("卷角龟尾环侧面的成对骨棘", pale, [[x + side * radius * .78, y, z], [x + side * (radius + .075 - t * .025), y + .026, z - .018]], [.03 - t * .009, 0]), pointed("卷角龟尾环背部的成对骨棘", pale, [[x + side * radius * .44, y + radius * .78, z], [x + side * radius * .64, y + radius + .065 - t * .025, z - .025]], [.026 - t * .008, 0]));
    parts.push(combineMeshes("卷角龟尾鞘每环相接的四枚骨棘", pale, spikes));
  }
  return parts;
}

export const landAnimalExpansionBatchTwelveDesigns: MasterNatureDesign[] = [
  design("estemmenosuchus", "冠鳄兽", "动物", estemmenosuchus, ["Estemmenosuchus mirabilis", "低宽躯侧展五趾足颅顶分叉骨柱与横向颧角"]),
  design("moschops", "麝足兽", "动物", moschops, ["Moschops capensis", "高肩低后躯前展后直肢下斜厚额顶骨盾颅"]),
  design("scelidosaurus", "棱背龙", "动物", scelidosaurus, ["Scelidosaurus harrisonii", "高后肢长尾成列棱脊骨甲与枕后角"]),
  design("meiolania", "卷角龟", "动物", meiolania, ["Meiolania platyceps", "长尾贯通骨环四列棘枕后弯角与陆栖承重足"]),
];
