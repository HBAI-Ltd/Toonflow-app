import { cap, combineMeshes, design, eyes, lobe, needle, polygon, sweptProfile, tapered } from "./shared";
import type { MasterNatureDesign, ModelPart, Triple } from "./shared";
import { body } from "./fishForms";
import { membrane } from "./animals";
import { hollowPipe } from "./shapedFoods";

const skin = "#9fae9e";
const pale = "#c4c7ae";
const dark = "#697d70";
const fin = "#b4bea6";
const tooth = "#d4cfb3";

function batches(parts: ModelPart[], name: string, color: string, pieces: ModelPart[], count: number): void {
  for (let i = 0; i < pieces.length; i += count) parts.push(combineMeshes(name, color, pieces.slice(i, i + count)));
}

function gillCovers(parts: ModelPart[], root: Triple, width: number, height: number): void {
  for (const side of [-1, 1]) parts.push(membrane("鳃盖后缘翘离皮面形成的实际出水缝", skin, [[side * width * .8, root[1] + height * .42, root[2] + .012], [side * width, root[1] + height * .35, root[2] -.014], [side * width * 1.06, root[1] -.003, root[2] -.025], [side * width * .8, root[1] - height * .4, root[2] -.012], [side * width * .74, root[1] - height * .32, root[2] + .012]]));
}

// https://pmc.ncbi.nlm.nih.gov/articles/PMC6419362/
// https://fishes-fnam.linnaeus.naturalis.nl/linnaeus_ng/app/views/species/taxon.php?epi=141&id=108833
function harriotta(): ModelPart[] {
  const parts: ModelPart[] = [body("长吻银鲛窄高头后迅速收成鞭尾的身体", [[.275, .183, .028, .018], [.2, .193, .052, .041], [.06, .143, .061, .075], [-.14, .115, .036, .051], [-.32, .093, .014, .025], [-.47, .084, .004, .008]], skin), body("软骨吻下方容纳两对齿板的薄上颌", [[.283, .145, .017, .012], [.236, .151, .038, .019], [.2, .157, .048, .025]], skin), tapered("吻部真正延长且末端向上翘的软骨中轴", skin, [[0, .166, .24], [0, .174, .346], [0, .197, .44], [0, .226, .517]], [.026, .018, .009, .0007]), body("长软骨吻下的短而不具尖牙的下颌", [[.278, .104, .014, .006], [.236, .107, .031, .012], [.195, .12, .036, .025]], fin), ...eyes([0, .205, .2], .048, .027), membrane("第一背鳍的独立高三角软膜", fin, [[0, .208, .1], [0, .34, .066], [0, .282, -.01], [0, .18, -.045]]), tapered("第一背鳍前缘超过鳍膜的长硬棘", pale, [[0, .207, .105], [0, .377, .077]], [.008, .0005]), membrane("与第一背鳍相隔很短的低长第二背鳍", fin, [[0, .18, -.065], [0, .208, -.108], [0, .16, -.27], [0, .108, -.46], [0, .09, -.47], [0, .118, -.32], [0, .166, -.14]]), membrane("上叶较浅而下叶显著更深的尾鳍上部", fin, [[0, .105, -.36], [0, .143, -.405], [0, .11, -.51], [0, .083, -.54], [0, .084, -.47]]), membrane("长吻银鲛尾鳍深而连续的下叶", fin, [[0, .08, -.33], [0, .025, -.39], [0, .035, -.49], [0, .08, -.55], [0, .086, -.47]]), tapered("完整尾端延出的细丝而不是另生尾鳍", skin, [[0, .084, -.45], [.003, .083, -.53], [.009, .082, -.655]], [.004, .002, .0003])];
  const plateRidges: ModelPart[] = [], spineSerrations: ModelPart[] = [];
  for (const side of [-1, 1]) {
    parts.push(membrane("长吻宽基部左右真实的叶片状皮扩展", skin, [[0, .166, .24], [side * .031, .168, .262], [side * .014, .182, .374], [0, .195, .44]]), membrane("宽长且后端超过腹鳍前缘的胸鳍", fin, [[side * .045, .127, .099], [side * .205, .096, -.005], [side * .187, .067, -.17], [side * .088, .073, -.104], [side * .034, .111, -.003]]), membrane("尾前独立的圆短腹鳍", fin, [[side * .025, .091, -.17], [side * .096, .042, -.21], [side * .093, .043, -.281], [side * .019, .083, -.259]]));
    for (const upper of [true, false]) {
      const count = upper ? 2 : 1;
      for (let i = 0; i < count; i++) {
        const z = .223 + i * .03, y = upper ? .129 : .111;
        parts.push(polygon("银鲛没有独立替换牙的固定磨碎齿板", tooth, [[side * .008, z -.014], [side * .023, z -.01], [side * .026, z + .012], [side * .009, z + .014]], .009, [0, y, 0]));
        for (let k = 0; k < 3; k++) plateRidges.push(lobe("齿板咬合面上真实隆起的硬质磨脊与结节", pale, [side * (.012 + k * .004), y + (upper ? -.0005 : .0095), z + k % 2 * .004], [.005, .006, .009]));
      }
    }
    parts.push(membrane("两侧各一条而不是鲨鱼五裂的鳃盖出口", dark, [[side * .045, .188, .12], [side * .058, .16, .104], [side * .052, .112, .106], [side * .04, .126, .124]]));
  }
  for (let i = 0; i < 10; i++) spineSerrations.push(needle("背硬棘后缘细密而真实凸出的锯齿", pale, [0, .23 + i * .012, .1 - i * .002], [0, .233 + i * .012, .09 - i * .002], .0025));
  parts.push(combineMeshes("固定齿板可见而非埋入实心口吻的磨脊", pale, plateRidges), combineMeshes("第一背硬棘后缘锯齿", pale, spineSerrations));
  return parts;
}

// https://www.vims.edu/research/units/programs/multispecies_fisheries_research/speciesofinterest/spiny-dogfish.php
function squalus(): ModelPart[] {
  const parts: ModelPart[] = [body("白斑角鲨窄尖吻与无臀鳍的细长圆柱身体", [[.37, .166, .013, .02], [.273, .183, .043, .045], [.13, .18, .061, .063], [-.08, .16, .054, .061], [-.3, .128, .029, .04], [-.48, .108, .009, .018]], skin), body("近直口缝下独立的细长下颌", [[.335, .108, .016, .004], [.286, .106, .033, .009], [.23, .132, .038, .021]], fin), ...eyes([0, .214, .264], .039, .02), membrane("胸鳍之后才起始的第一背鳍", fin, [[0, .213, -.015], [0, .349, -.061], [0, .302, -.145], [0, .2, -.164]]), membrane("近尾部明显较小的第二背鳍", fin, [[0, .158, -.31], [0, .248, -.346], [0, .21, -.404], [0, .135, -.42]]), tapered("第一背前缘无纵沟的较短硬棘", pale, [[0, .216, -.006], [0, .344, -.041]], [.005, .0006]), tapered("第二背前缘无纵沟的独立硬棘", pale, [[0, .158, -.305], [0, .254, -.327]], [.005, .0005]), membrane("无末端缺刻且上下叶明显不等的完整尾鳍", fin, [[0, .118, -.457], [0, .216, -.563], [0, .25, -.714], [0, .145, -.626], [0, .114, -.556], [0, .055, -.593], [0, .07, -.516]])];
  const teeth: ModelPart[] = [];
  for (const side of [-1, 1]) {
    parts.push(membrane("狭镰形而后缘微凹的胸鳍", fin, [[side * .048, .145, .146], [side * .193, .071, .073], [side * .156, .069, -.041], [side * .082, .103, .013], [side * .04, .138, .061]]), membrane("远后位小腹鳍后方保留无鳍腹缘", fin, [[side * .022, .103, -.249], [side * .089, .056, -.288], [side * .064, .061, -.35], [side * .014, .099, -.32]]), tapered("尾柄两侧实际突起的小纵向侧脊", fin, [[side * .012, .11, -.407], [side * .019, .106, -.472], [side * .012, .105, -.502]], [.003, .003, .001]));
    for (let i = 0; i < 5; i++) parts.push(membrane("胸鳍前五条各自独立而略有翘缘的短鳃裂", dark, [[side * .049, .208, .222 - i * .018], [side * .063, .171, .215 - i * .018], [side * .05, .141, .222 - i * .018]]));
    const spiracle = cap("眼后实际内凹的半月形喷水孔", fin, [side * .04, .213, .234], .007, .0035, 3);
    parts.push(spiracle);
    for (let row = 0; row < 2; row++) for (let i = 0; i < 12; i++) {
      const t = i / 11, x = side * (.007 + t * .019), z = .329 - t * .035, y = row ? .12 : .142;
      const item = polygon("上下颌形状相同而向口角斜倒的单尖刃齿", tooth, [[0, 0], [.006, 0], [.005, .002], [.002, .008], [0, .003]], .001);
      item.vertices = item.vertices!.map(v => ({ x: x + side * v.x, y: y + (row ? 1 : -1) * v.z, z: z + v.y }));
      if (side * (row ? 1 : -1) > 0) item.indices = item.indices!.flatMap((_, k, list) => k % 3 ? [] : [list[k]!, list[k + 2]!, list[k + 1]!]);
      teeth.push(item);
    }
  }
  batches(parts, "白斑角鲨两颌一致而不作上下异型的低斜刃齿", tooth, teeth, 24);
  return parts;
}

// https://acta.izor.hr/acta/pdf/63_1_pdf/63_1_13.pdf
function peristedion(): ModelPart[] {
  const sections: [number, number, number, number][] = [[.156, .093, .022, .027], [.112, .092, .038, .04], [.036, .082, .035, .035], [-.06, .069, .026, .026], [-.152, .057, .015, .017], [-.213, .05, .005, .009]];
  const parts: ModelPart[] = [body("披甲鲂鮄八棱骨甲下前粗后尖的硬躯", sections, skin), body("骨吻下方有真实下位口隙的小下颌", [[.171, .056, .015, .004], [.143, .059, .023, .008]], fin), ...eyes([0, .124, .12], .03, .018), membrane("骨甲背面独立的前段高硬棘鳍", fin, [[0, .122, .068], [0, .191, .041], [0, .161, -.003], [0, .105, -.027]]), membrane("高背鳍之后独立的长低软条鳍", fin, [[0, .102, -.031], [0, .137, -.052], [0, .105, -.146], [0, .066, -.207], [0, .052, -.212], [0, .075, -.153], [0, .095, -.06]]), membrane("骨甲尾柄后的独立小尾扇", fin, [[0, .057, -.205], [0, .095, -.251], [0, .053, -.263], [0, .021, -.248], [0, .043, -.207]])];
  const plates: ModelPart[] = [], spines: ModelPart[] = [], barbels: ModelPart[] = [];
  for (let row = 0; row < 8; row++) for (let i = 0; i < 17; i++) {
    const z = .09 - i * .0175, segment = z >= .036 ? 1 : z >= -.06 ? 2 : z >= -.152 ? 3 : 4, a = sections[segment]!, b = sections[segment + 1]!, t = (z - a[0]) / (b[0] - a[0]), rx = a[2] + (b[2] - a[2]) * t, ry = a[3] + (b[3] - a[3]) * t, y = a[1] + (b[1] - a[1]) * t, angle = row * Math.PI / 4;
    const root: Triple = [Math.cos(angle) * rx, y + Math.sin(angle) * ry, z];
    plates.push(lobe("每侧四列且彼此独立的硬骨甲板", pale, root, [.019 * (1 - i / 22), .004, .021], [0, 0, row * 45 - 90]));
    spines.push(tapered("各骨甲板后缘真实竖出的向后硬刺", pale, [root, [root[0] + Math.cos(angle) * .007, root[1] + Math.sin(angle) * .007, z -.007]], [.0018, .0002]));
  }
  batches(parts, "披甲鲂鮄覆盖全身的八列独立骨甲", pale, plates, 36);
  batches(parts, "八列骨甲各自相连的后向硬刺", pale, spines, 24);
  for (const side of [-1, 1]) {
    parts.push(polygon("从眶下骨直接向前伸出的扁平双骨吻", pale, [[side * .013, .137], [side * .026, .153], [side * .027, .232], [side * .02, .238], [side * .016, .187]], .006, [0, .105, 0]), membrane("硬头后有限宽度而不是飞鲂鮄大翼的胸鳍", fin, [[side * .031, .08, .09], [side * .113, .063, .043], [side * .105, .031, -.02], [side * .028, .058, .014]]));
    for (let i = 0; i < 2; i++) parts.push(tapered("每侧只有两根与鳍膜分开的步行胸鳍条", fin, [[side * .028, .067, .088 - i * .012], [side * (.065 + i * .012), .024, .092], [side * (.082 + i * .013), .004, .15 - i * .018]], [.0033, .0022, .0006]));
    const root: Triple = [side * .012, .058, .158], end: Triple = [side * .035, .029, .199];
    barbels.push(tapered("下颏独立的长分枝感觉须主轴", fin, [root, [side * .026, .034, .18], end], [.0017, .0011, .00035]));
    for (let i = 0; i < 5; i++) {
      const t = .25 + i * .13, p: Triple = [root[0] + (end[0] - root[0]) * t, root[1] + (end[1] - root[1]) * t, root[2] + (end[2] - root[2]) * t];
      barbels.push(tapered("长颏须上沿主轴真正分出的细侧枝", fin, [p, [p[0] + side * .009, p[1] -.005, p[2] + .008]], [.00055, .0002]));
    }
    for (let i = 0; i < 4; i++) barbels.push(tapered("颏部另外独立而较短的感觉须", fin, [[side * (.008 + i * .004), .058, .146 - i * .008], [side * (.018 + i * .006), .035, .163 - i * .008]], [.001, .0002]));
  }
  batches(parts, "披甲鲂鮄真实分枝的颏须与较短副须", fin, barbels, 16);
  gillCovers(parts, [0, .092, .1], .037, .06);
  for (const item of parts) {
    item.position.x *= .8; item.position.y *= .8; item.position.z *= .8;
    item.scale.x *= .8; item.scale.y *= .8; item.scale.z *= .8;
  }
  return parts;
}

// https://biogeodb.stri.si.edu/caribbean/en/thefishes/taxon/674
function brotula(): ModelPart[] {
  const parts: ModelPart[] = [body("须鼬鳚长头以后侧扁并连续收成尖尾的身体", [[.25, .121, .022, .027], [.18, .134, .045, .052], [.08, .128, .047, .062], [-.1, .109, .038, .057], [-.3, .085, .023, .039], [-.49, .067, .007, .015], [-.56, .062, .0015, .004]], skin), body("十二须之间与上颌实际分开的长下颌", [[.252, .077, .02, .005], [.185, .079, .039, .013], [.126, .099, .039, .026]], fin), ...eyes([0, .163, .186], .039, .023), membrane("起点较靠前并连续接尾的长背鳍", fin, [[0, .184, .11], [0, .244, .052], [0, .215, -.15], [0, .139, -.4], [0, .083, -.565], [0, .065, -.576], [0, .07, -.55], [0, .082, -.49], [0, .124, -.3], [0, .166, -.1], [0, .19, .08]]), membrane("与背鳍在尖尾相接而无独立尾柄的长臀鳍", fin, [[0, .059, .014], [0, .018, -.033], [0, .011, -.21], [0, .027, -.44], [0, .06, -.577], [0, .065, -.56], [0, .052, -.49], [0, .046, -.3], [0, .052, -.1], [0, .066, .014]])];
  const barbels: ModelPart[] = [], teeth: ModelPart[] = [];
  for (const side of [-1, 1]) {
    parts.push(membrane("须鼬鳚头后短而宽圆的胸鳍", fin, [[side * .037, .126, .095], [side * .105, .097, .018], [side * .079, .064, -.027], [side * .034, .091, .036]]));
    for (let i = 0; i < 3; i++) {
      barbels.push(tapered("吻部每侧三根而不是单对上颌须的感觉须", fin, [[side * (.016 + i * .006), .119, .244 - i * .018], [side * (.039 + i * .012), .11, .265 - i * .008], [side * (.052 + i * .014), .093, .269 - i * .008]], [.0018, .0011, .0003]), tapered("下颏每侧三根独立的短长感觉须", fin, [[side * (.012 + i * .007), .078, .236 - i * .021], [side * (.03 + i * .012), .043 - i * .004, .257 - i * .009]], [.0017, .0003]));
    }
    for (let i = 0; i < 2; i++) parts.push(tapered("喉位每片腹鳍分成两根相连基部的细丝", fin, [[side * .013, .083, .127], [side * (.028 + i * .012), .027, .108], [side * (.03 + i * .016), .006, .058 - i * .012]], [.002, .0012, .00025]));
    for (let i = 0; i < 16; i++) teeth.push(needle("两颌带状牙床上的细小锥齿", tooth, [side * (.016 + Math.sin(i / 15 * Math.PI) * .015), .105, .184 + i * .0039], [side * (.016 + Math.sin(i / 15 * Math.PI) * .015), .093, .184 + i * .0039], .0018));
    parts.push(needle("鳃盖后缘真实独立的小硬棘", pale, [side * .041, .153, .105], [side * .054, .158, .08], .004));
  }
  parts.push(combineMeshes("吻六须加颏六须的完整十二须", fin, barbels), combineMeshes("须鼬鳚真正张口中可见的细牙床", tooth, teeth));
  gillCovers(parts, [0, .133, .113], .046, .09);
  return parts;
}

// https://cybrary.fomb.org/fgom/Opsanus_tau.htm
function opsanus(): ModelPart[] {
  const parts: ModelPart[] = [body("牡蛎蟾鱼极宽扁头后接鼓腹渐细后躯", [[.139, .081, .055, .025], [.078, .082, .075, .036], [-.009, .073, .061, .04], [-.096, .061, .04, .035], [-.183, .05, .012, .018]], skin), body("宽口最前缘与头部真正连接的薄上唇", [[.148, .073, .05, .008], [.12, .081, .061, .018]], skin), body("大口下方实际分开的宽而扁的下颌", [[.146, .043, .048, .006], [.078, .044, .061, .013], [.026, .061, .05, .018]], fin), ...eyes([0, .112, .089], .051, .017), membrane("只含三根粗硬棘的前段短背鳍", fin, [[0, .107, .026], [0, .144, .007], [0, .152, -.012], [0, .134, -.029], [0, .102, -.037]]), membrane("以深缺刻和前段分开的长软条背鳍", fin, [[0, .101, -.048], [0, .139, -.073], [0, .118, -.139], [0, .075, -.19], [0, .053, -.186], [0, .085, -.11]]), membrane("后躯腹侧独立的短长臀鳍", fin, [[0, .03, -.077], [0, .005, -.099], [0, .008, -.163], [0, .035, -.19]]), membrane("渐细后体末端独立的宽圆尾扇", fin, [[0, .06, -.18], [0, .089, -.216], [0, .078, -.252], [0, .049, -.266], [0, .02, -.246], [0, .011, -.211], [0, .04, -.18]])];
  const flaps: ModelPart[] = [], teeth: ModelPart[] = [];
  for (let i = 0; i < 3; i++) parts.push(needle("前段背膜中的三根粗硬棘", pale, [0, .105, .022 - i * .02], [0, .141 + (i === 1 ? .009 : 0), .007 - i * .018], .004));
  for (const side of [-1, 1]) {
    parts.push(membrane("宽头后方很大的圆扇状肉质胸鳍", fin, [[side * .049, .078, .015], [side * .114, .063, -.011], [side * .14, .033, -.067], [side * .112, .017, -.109], [side * .061, .026, -.091], [side * .036, .056, -.019]]), membrane("明显在胸鳍之前喉部的短肉质腹鳍", fin, [[side * .024, .041, .087], [side * .044, .009, .097], [side * .056, .005, .067], [side * .037, .014, .039], [side * .016, .039, .053]]));
    for (let i = 0; i < 8; i++) {
      const x = side * (.012 + i * .007), z = .14 - i * .008, y = i % 2 ? .08 : .05;
      flaps.push(membrane("上下唇边缘形状不整齐的独立肉皮瓣", fin, [[x, y, z], [x + side * .005, y -.008, z + .013], [x + side * .01, y -.003, z + .008], [x + side * .008, y + .002, z -.003]]));
    }
    for (let i = 0; i < 3; i++) flaps.push(membrane("眼眉上方和颊部真正突起的破碎皮瓣", skin, [[side * (.048 + i * .005), .113 - i * .01, .099 - i * .015], [side * (.056 + i * .006), .134 - i * .012, .095 - i * .015], [side * (.062 + i * .005), .123 - i * .01, .082 - i * .015]]));
    for (let i = 0; i < 20; i++) {
      const t = i / 19, x = side * (.007 + t * .041), z = .144 - t * .046;
      teeth.push(needle("宽口上下缘密排的小锥齿而不是捕食长獠牙", tooth, [x, .068, z], [x, .059, z], .0019), needle("下颌向上的独立密排细齿", tooth, [x, .048, z + .001], [x, .057, z + .001], .0017));
    }
  }
  batches(parts, "牡蛎蟾鱼唇颊和眉上与皮肤相连的细皮瓣", fin, flaps, 24);
  parts.push(combineMeshes("牡蛎蟾鱼大张口中真实露出的上下小齿", tooth, teeth));
  gillCovers(parts, [0, .079, .016], .065, .055);
  return parts;
}

// https://pmc.ncbi.nlm.nih.gov/articles/PMC3768303/
function grimalditeuthis(): ModelPart[] {
  const parts: ModelPart[] = [body("博氏格里马鱿柔软窄外套躯与后端短尾", [[-.026, .106, .019, .026], [-.075, .107, .024, .031], [-.134, .106, .015, .021], [-.169, .106, .002, .003]], skin), tapered("头胴之间真实延长的细颈", skin, [[0, .105, -.027], [0, .106, .021]], [.016, .014]), lobe("长颈前端与八腕相连的小头", pale, [0, .106, .031], [.039, .038, .042]), ...eyes([0, .112, .039], .016, .016)];
  const funnel = hollowPipe("颈部腹面与外套口相接的真正中空喷水漏斗", [[0, .095, -.019], [0, .083, .014], [0, .083, .029]], .004, .0026);
  funnel.color = pale;
  parts.push(funnel);
  for (const side of [-1, 1]) parts.push(membrane("外套后段占比较大而不作肘形腕的大圆菱鳍", fin, [[side * .003, .108, -.166], [side * .059, .113, -.139], [side * .08, .11, -.091], [side * .059, .104, -.045], [side * .016, .103, -.029], [side * .02, .106, -.108]]));
  const cups: ModelPart[] = [];
  for (let i = 0; i < 8; i++) {
    const a = i * Math.PI / 4, root: Triple = [Math.cos(a) * .011, .106 + Math.sin(a) * .011, .048], mid: Triple = [Math.cos(a) * .035, .1 + Math.sin(a) * .03, .119], end: Triple = [Math.cos(a) * .036, .092 + Math.sin(a) * .022, .188 + i % 2 * .009];
    parts.push(tapered("八根长度相近而保持正常吸盘的普通腕", skin, [root, mid, end], [.0048, .0032, .0003]));
    for (let j = 0; j < 5; j++) {
      const t = .18 + j * .13;
      const cup = sweptProfile("普通腕上保留的真实凹吸盘", pale, [[0, 0], [.0011, .0001], [.0014, .0008], [.0011, .0011], [.00055, .0004], [0, .0002]], Math.PI * 2, 8);
      cup.position = { x: root[0] + (mid[0] - root[0]) * t, y: root[1] + (mid[1] - root[1]) * t -(.0048 + (.0032 -.0048) * t) + .00015, z: root[2] + (mid[2] - root[2]) * t };
      cup.rotation.x = 180;
      cups.push(cup);
    }
  }
  batches(parts, "普通八腕的吸盘不与无吸盘触腕穗混淆", pale, cups, 6);
  for (const side of [-1, 1]) {
    const root: Triple = [side * .01, .098, .051], support: Triple = [side * .027, .086, .141], end: Triple = [side * .077, .12, .645];
    parts.push(tapered("由第四腕支持近端的极细完整触腕柄", skin, [root, support, [side * .059, .106, .39], end], [.00085, .00065, .00045, .00018]), tapered("触腕末端不生吸盘钩和发光器的细穗轴", pale, [end, [end[0], end[1], .687]], [.0015, .0004]));
    const ribs: ModelPart[] = [];
    for (const wing of [-1, 1]) {
      parts.push(membrane("触腕穗上可拍动的真实成对保护膜翼", fin, [[end[0], end[1], .645], [end[0] + wing * .009, end[1] + .003, .653], [end[0] + wing * .012, end[1] + .002, .673], [end[0], end[1], .687]]));
      for (let i = 0; i < 3; i++) ribs.push(tapered("保护膜翼上真正横接穗轴的小梁", pale, [[end[0], end[1], .653 + i * .009], [end[0] + wing * .009, end[1] + .002, .653 + i * .009]], [.0005, .0002]));
    }
    parts.push(combineMeshes("无吸盘触腕穗的两侧保护膜小梁", pale, ribs));
  }
  return parts;
}

export const aquaticExpansionBatchSixteenDesigns: MasterNatureDesign[] = [
  design("harriottaRaleighana", "长吻银鲛", "动物", harriotta, ["Harriotta raleighana", "上弯软骨长吻和叶状基皮固定磨脊齿板", "不把地域近种另计"]),
  design("squalusAcanthias", "白斑角鲨", "动物", squalus, ["Squalus acanthias", "双无沟背前棘无臀鳍和同型斜刃齿", "不以白斑或体长变化另计"]),
  design("peristedionCataphractum", "披甲鲂鮄", "动物", peristedion, ["Peristedion cataphractum", "八列全身刺骨甲双扁吻与分枝颏须", "两根游离步行鳍条"]),
  design("brotulaBarbata", "大西洋须鼬鳚", "动物", brotula, ["Brotula barbata", "吻六须颏六须双条腹鳍与背尾臀连续鳍", "真实米制完整鱼体"]),
  design("opsanusTau", "牡蛎蟾鱼", "动物", opsanus, ["Opsanus tau", "喉位肉质腹鳍与唇颊眉碎皮瓣", "三硬棘短背和深缺刻后长软背"]),
  design("grimalditeuthisBonplandi", "博氏格里马鱿", "动物", grimalditeuthis, ["Grimalditeuthis bonplandi", "极细触腕穗两翼保护膜无吸盘钩发光器", "普通八腕仍有吸盘"]),
];
