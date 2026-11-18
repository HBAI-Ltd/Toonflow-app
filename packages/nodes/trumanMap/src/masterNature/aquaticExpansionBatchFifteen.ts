import { cap, combineMeshes, design, eyes, lobe, needle, polygon, sweptProfile, tapered } from "./shared";
import type { MasterNatureDesign, ModelPart, Triple } from "./shared";
import { body } from "./fishForms";
import { membrane } from "./animals";
import { hollowPipe, strip } from "./shapedFoods";

const skin = "#a8b8aa";
const pale = "#c4c9b0";
const fin = "#b3bfac";
const dark = "#667e73";
const coral = "#ae8580";

function sagittalSolid(name: string, color: string, outline: [number, number][], thickness: number): ModelPart {
  const item = polygon(name, color, outline, thickness);
  item.vertices = item.vertices!.map(v => ({ x: v.y - thickness / 2, y: v.z, z: v.x }));
  return item;
}

function meshBatches(parts: ModelPart[], name: string, color: string, pieces: ModelPart[], count = 16): void {
  for (let i = 0; i < pieces.length; i += count) parts.push(combineMeshes(name, color, pieces.slice(i, i + count)));
}

function gillFlaps(parts: ModelPart[], root: Triple, width: number, height: number): void {
  for (const side of [-1, 1]) parts.push(membrane("眼后薄鳃盖与后缘实际翘离体壁的出水缝", skin, [[side * width * .8, root[1] + height * .43, root[2] + .025], [side * width * .9, root[1] + height * .46, root[2] -.002], [side * width * 1.06, root[1] + height * .08, root[2] -.035], [side * width * .86, root[1] - height * .4, root[2] -.027], [side * width * .74, root[1] - height * .32, root[2] + .018]]));
}

function lineHeight(points: [number, number][], z: number): number {
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i]!, b = points[i + 1]!;
    if (z <= a[0] && z >= b[0]) return a[1] + (b[1] - a[1]) * (z - a[0]) / (b[0] - a[0]);
  }
  return points.at(-1)![1];
}

// https://pmc.ncbi.nlm.nih.gov/articles/PMC8789280/
// https://pmc.ncbi.nlm.nih.gov/articles/PMC3278570/
function riftia(): ModelPart[] {
  const tube = hollowPipe("巨型管虫不是实心柱的完整几丁质管", [[0, 0, 0], [.025, .45, .008], [.075, .93, .015], [.12, 1.38, .018]], .021, .017);
  tube.color = pale;
  const parts: ModelPart[] = [tube, tapered("留在管内而与外露领部连续的虫体", skin, [[0, .015, 0], [.025, .45, .008], [.075, .93, .015], [.12, 1.385, .018]], [.012, .013, .014, .015])];
  for (const side of [-1, 1]) {
    parts.push(membrane("管口露出的左右两翼状白色外套领", pale, [[.12, 1.33, .018], [.12 + side * .026, 1.385, .018], [.12 + side * .021, 1.445, .022], [.12 + side * .005, 1.43, .024], [.12, 1.365, .023]]), tapered("鳃冠内部成对而不当作取食触手的白色支持柱", pale, [[.12 + side * .003, 1.38, .018], [.12 + side * .007, 1.52, .024], [.12 + side * .004, 1.64, .026]], [.004, .003, .001]));
    const lamellae: ModelPart[] = [], pinnules: ModelPart[] = [];
    for (let i = 0; i < 22; i++) {
      const t = i / 21, y = 1.405 + t * .215, spread = .017 + Math.sin(t * Math.PI) * .045, z = .024 + Math.sin(i * .6) * .007;
      const start: Triple = [.12 + side * .005, y, z], end: Triple = [.12 + side * spread, y + .028 - t * .012, z + .004];
      lamellae.push(strip("沿支持柱两侧融合排列的血管鳃薄片", coral, [start, [.12 + side * spread * .65, y + .015, z], end], .011, .0007));
      for (let k = 0; k < 4; k++) {
        const u = .35 + k * .18, x = start[0] + (end[0] - start[0]) * u;
        pinnules.push(needle("每片鳃片边缘增加气体交换表面的细小鳃小羽", coral, [x, y + .023 * u, z], [x, y + .023 * u + .008, z + .004], .0014));
      }
    }
    meshBatches(parts, "成对层叠而不作放射取食扇的红鳃片", coral, lamellae, 16);
    meshBatches(parts, "巨型管虫鳃冠与鳃片相连的小羽", coral, pinnules, 64);
  }
  // ACT: 成虫没有口、肠和肛门；外露部分是交换气体的鳃冠，不增加取食口或眼睛。
  return parts;
}

// https://researchdata.museum.vic.gov.au/polychaetes/Eunicidae/description.htm
// https://repository.si.edu/bitstream/handle/10088/6302/SCtZ-0523-Lo_res.pdf
function bobbitWorm(): ModelPart[] {
  const path: Triple[] = Array.from({ length: 157 }, (_, i) => { const t = i / 156; return [Math.sin(t * Math.PI * 2) * .065, .018 + (1 - t) ** 6 * .05, .64 - t * 1.3]; });
  const radii = path.map((_, i) => (.0112 + (i % 3 === 1 ? .0013 : -.0005)) * (1 - (i / 156) ** 5 * .74));
  const parts: ModelPart[] = [];
  for (let i = 0; i < path.length - 1; i += 52) parts.push(tapered("吻沙蚕完整身体的相接环节与狭窄节间", skin, path.slice(i, Math.min(i + 53, path.length)), radii.slice(i, Math.min(i + 53, path.length))));
  parts.push(body("博比特吻沙蚕扁平口前叶与围口环", [[.672, .07, .012, .009], [.655, .071, .015, .011], [.633, .067, .011, .012]], skin));
  const parapodia: ModelPart[] = [], bristles: ModelPart[] = [], gills: ModelPart[] = [];
  for (let i = 3; i < 50; i++) {
    const p = path[i * 3]!, radius = radii[i * 3]!;
    for (const side of [-1, 1]) {
      const joint: Triple = [p[0] + side * (radius + .004), p[1] -.003, p[2]];
      parapodia.push(tapered("各体节两侧独立而与体壁相连的疣足", pale, [[p[0] + side * radius * .7, p[1], p[2]], joint, [p[0] + side * (radius + .009), p[1] -.004, p[2] -.002]], [.0028, .0021, .0007]));
      for (let k = 0; k < 3; k++) bristles.push(needle("疣足端向侧后展开的刚毛束", pale, joint, [joint[0] + side * .012, joint[1] + k * .0014, joint[2] -.006 + k * .003], .0008));
      if (i < 30) {
        const stem: Triple = [p[0] + side * radius * .72, p[1] + radius * .68, p[2]];
        gills.push(tapered("疣足背侧的短梳鳃主轴", coral, [stem, [stem[0] + side * .004, stem[1] + .008, stem[2]]], [.001, .0005]));
        for (let k = 0; k < 3; k++) gills.push(tapered("梳鳃主轴上真正相连的细鳃丝", coral, [[stem[0] + side * k * .001, stem[1] + .002 + k * .002, stem[2]], [stem[0] + side * (.006 + k * .0015), stem[1] + .006 + k * .002, stem[2]]], [.0005, .00015]));
      }
    }
  }
  meshBatches(parts, "完整吻沙蚕两侧逐节疣足", pale, parapodia, 16);
  meshBatches(parts, "疣足上真实连接的细刚毛", pale, bristles, 64);
  meshBatches(parts, "前中躯体的梳状呼吸鳃", coral, gills, 24);
  for (let i = 0; i < 5; i++) {
    const a = (i - 2) * .6, root: Triple = [Math.sin(a) * .009, .076, .663], end: Triple = [Math.sin(a) * .032, .088 + (i === 2 ? .013 : 0), .688 + Math.cos(a) * .01];
    parts.push(tapered("三根触角和两枚触须组成的五根头部附肢", pale, [root, [(root[0] + end[0]) / 2, end[1], (root[2] + end[2]) / 2], end], [.0015, .001, .0003]));
  }
  for (const side of [-1, 1]) {
    parts.push(tapered("捕食时口内可外翻的上对弯钩颚板", dark, [[side * .008, .067, .67], [side * .018, .067, .685], [side * .021, .066, .697], [side * .008, .066, .701]], [.003, .0028, .002, .0003]), sagittalSolid("下方较宽而具真实齿缘的颚板", dark, [[.667, .058], [.679, .054], [.7, .056], [.692, .062], [.69, .058], [.686, .063], [.684, .058], [.68, .063]], .0025));
    parts.at(-1)!.position.x = side * .009;
    parts.push(lobe("口前叶小眼而不夸张成大眼球", dark, [side * .008, .079, .657], [.004, .0025, .003]));
  }
  return parts;
}

// https://pelagic-molluscs.linnaeus.naturalis.nl/linnaeus_ng/app/views/species/taxon.php?epi=169&id=116815
function carinaria(): ModelPart[] {
  const trunk = body("冠龙骨螺透明而不能缩进壳内的高躯干", [[.205, .148, .013, .016], [.158, .151, .024, .035], [.085, .135, .029, .041], [.005, .123, .022, .029], [-.08, .115, .017, .022], [-.18, .107, .009, .013], [-.245, .104, .002, .004]], skin);
  trunk.opacity = .43;
  const parts: ModelPart[] = [trunk, membrane("长尾背侧独立的高半圆形尾冠", fin, [[0, .12, -.03], [0, .17, -.075], [0, .18, -.13], [0, .15, -.19], [0, .105, -.245], [0, .105, -.08]]), tapered("高尾冠后连续延出的细鞭尾", skin, [[0, .105, -.22], [.004, .106, -.28], [.009, .107, -.305]], [.003, .0014, .0003]), membrane("与背侧壳相对的单枚腹面圆桨状游泳足", fin, [[0, .116, .085], [0, .059, .106], [0, .021, .072], [0, .018, .034], [0, .051, .01], [0, .118, .034]]), lobe("背侧短柄上的深色三角内脏核", dark, [0, .158, .017], [.028, .037, .032])];
  const shell = sweptProfile("仅覆盖内脏核的高锥形薄壳与实际壳口", pale, [[.023, 0], [.021, .012], [.013, .035], [.002, .061], [0, .063], [0, .0615], [.001, .06], [.0115, .034], [.0195, .012], [.0215, 0]], Math.PI * 2, 24);
  shell.vertices = shell.vertices!.map(v => ({ ...v, z: v.z - (v.y / .063) ** 2 * .018 }));
  shell.position = { x: 0, y: .166, z: .017 }; shell.opacity = .42; shell.roughness = .25;
  parts.push(shell);
  const keel = sagittalSolid("脆壳后侧实际增厚的狭窄龙骨脊", pale, [[.017, .168], [-.008, .177], [-.021, .207], [-.002, .228], [-.002, .224], [-.016, .207], [-.005, .178]], .0014);
  parts.push(keel);
  const mouth = hollowPipe("前端下弯长吻中的真实取食口腔", [[0, .146, .19], [0, .142, .228], [0, .127, .265]], .008, .0054);
  mouth.color = skin; mouth.opacity = .58; parts.push(mouth);
  const sucker = cap("单枚泳足缘上真实凹入的吸盘", pale, [-.001, .033, .051], .007, .004, 3);
  sucker.rotation.z = 90; parts.push(sucker);
  for (const side of [-1, 1]) {
    parts.push(lobe("透明头部两侧可见的三角视网膜大眼", dark, [side * .018, .166, .17], [.011, .014, .013]), tapered("眼前左右不等长的独立头触角", skin, [[side * .013, .169, .184], [side * .02, .188, .2], [side * .025, .19, .21 + (side < 0 ? .018 : 0)]], [.0018, .0011, .0003]));
  }
  return parts;
}

// https://www.mpg.de/7681367/mpch_jb_2013
function monorhaphis(): ModelPart[] {
  const spicule = tapered("单根而非缠绳的完整巨大硅质基骨针", pale, [[0, 0, 0], [0, .3, 0], [0, 1.05, 0], [0, 1.62, 0]], [.0008, .0021, .0021, .0006]);
  spicule.roughness = .2;
  const parts: ModelPart[] = [spicule];
  const radius = .032, thickness = .004, halfArc = Math.PI * radius / 2;
  for (let row = 0; row < 8; row++) {
    const y = .38 + row * .13;
    const outline: [number, number][] = [];
    for (let i = 0; i <= 12; i++) outline.push([-halfArc + i / 12 * halfArc * 2, y]);
    for (let i = 12; i >= 0; i--) outline.push([-halfArc + i / 12 * halfArc * 2, y + .13]);
    const hole: [number, number][] = Array.from({ length: 12 }, (_, i) => { const a = i * Math.PI / 6; return [Math.cos(a) * .009, y + .065 + Math.sin(a) * .014]; });
    const wall = polygon("环绕单根基针并有同列真实出水孔的海绵前壁", skin, outline, thickness, [0, 0, 0], [hole]);
    const vertices = wall.vertices!, mids = new Map<string, number>(), refined: number[] = [];
    function midpoint(a: number, b: number): number {
      const key = a < b ? `${a}:${b}` : `${b}:${a}`;
      if (!mids.has(key)) {
        const p = vertices[a]!, q = vertices[b]!;
        mids.set(key, vertices.length);
        vertices.push({ x: (p.x + q.x) / 2, y: (p.y + q.y) / 2, z: (p.z + q.z) / 2 });
      }
      return mids.get(key)!;
    }
    for (let i = 0; i < wall.indices!.length; i += 3) {
      const a = wall.indices![i]!, b = wall.indices![i + 1]!, c = wall.indices![i + 2]!, ab = midpoint(a, b), bc = midpoint(b, c), ca = midpoint(c, a);
      refined.push(a, ab, ca, ab, b, bc, ca, bc, c, ab, bc, ca);
    }
    wall.indices = refined;
    wall.vertices = wall.vertices!.map(v => { const angle = v.x / radius, r = radius + v.y; return { x: Math.sin(angle) * r, y: v.z, z: Math.cos(angle) * r }; });
    wall.indices = wall.indices!.flatMap((_, i, list) => i % 3 ? [] : [list[i]!, list[i + 2]!, list[i + 1]!]);
    parts.push(wall);
  }
  const back = sweptProfile("单根针海绵前后相接而内部贯通的长筒状后体壁", skin, [[radius, .38], [radius + thickness, .38], [radius + thickness, 1.42], [radius, 1.42]], Math.PI, 20);
  back.rotation.y = 180; parts.push(back);
  for (const y of [.38, 1.416]) parts.push(sweptProfile("长筒体两端绕基骨针闭合而不封住侧面出水孔的体壁", skin, [[.0018, y], [radius + thickness, y], [radius + thickness, y + .004], [.0018, y + .004]], Math.PI * 2, 24));
  return parts;
}

// https://fishes-fnam.linnaeus.naturalis.nl/linnaeus_ng/app/views/species/nsr_taxon.php?cat=TAB_DESCRIPTION&id=109256
function lophotus(): ModelPart[] {
  const parts: ModelPart[] = [body("冠带鱼前部高侧扁并连续变窄的完整带状体", [[.61, .234, .021, .055], [.49, .257, .041, .09], [.25, .252, .044, .115], [-.08, .228, .034, .11], [-.42, .203, .021, .077], [-.76, .178, .008, .037], [-.92, .163, .003, .012]], skin), sagittalSolid("枕部真正高耸并前突到口部上方的厚肉骨冠", skin, [[.39, .32], [.43, .437], [.62, .49], [.707, .464], [.664, .413], [.615, .32]], .03), body("冠带鱼小而短突的上颌", [[.705, .23, .017, .012], [.654, .244, .025, .025], [.6, .243, .027, .037]], skin), body("小口下方分离而保留真口隙的下颌", [[.707, .19, .016, .008], [.65, .195, .024, .011], [.602, .213, .025, .02]], pale), ...eyes([0, .282, .54], .039, .037), membrane("由肉骨冠后连续延伸的低长背鳍", coral, [[0, .47, .63], [0, .485, .39], [0, .422, .23], [0, .38, -.06], [0, .311, -.42], [0, .228, -.76], [0, .184, -.915], [0, .164, -.92], [0, .214, -.76], [0, .28, -.42], [0, .338, -.08], [0, .367, .25], [0, .345, .42]]), tapered("背鳍最前方单根延长的柔软鳍条", coral, [[0, .47, .66], [0, .62, .635], [0, .65, .58]], [.004, .0025, .0005]), membrane("尾前才出现的极短臀鳍", coral, [[0, .145, -.72], [0, .106, -.76], [0, .115, -.86], [0, .152, -.9]]), membrane("小而尖且不带长腹鳍丝的尾鳍", coral, [[0, .172, -.89], [0, .207, -.954], [0, .166, -1.015], [0, .145, -.948]])];
  for (const side of [-1, 1]) parts.push(membrane("眼后水平插入而非皇带鱼桨状腹鳍的胸鳍", fin, [[side * .032, .237, .46], [side * .13, .22, .36], [side * .095, .215, .315], [side * .025, .22, .39]]));
  const teeth: ModelPart[] = [];
  for (const side of [-1, 1]) for (let row = 0; row < 3; row++) for (let i = 0; i < 5; i++) {
    const x = side * (.013 - row * .003), z = .66 + i * .008 + row % 2 * .003;
    teeth.push(needle("冠带鱼小口内不规则三排的细小锥齿", pale, [x, .221, z], [x, .209, z + .001], .0025));
  }
  parts.push(combineMeshes("真实颌间的三列小锥齿", pale, teeth));
  gillFlaps(parts, [0, .257, .44], .042, .15);
  return parts;
}

// https://waves-vagues.dfo-mpo.gc.ca/Library/40584021.pdf
function notacanthus(): ModelPart[] {
  const sections: [number, number, number, number][] = [[.24, .15, .023, .031], [.17, .166, .034, .056], [.04, .17, .037, .072], [-.12, .163, .033, .072], [-.34, .139, .023, .056], [-.57, .112, .011, .033], [-.78, .095, .0045, .015], [-.96, .085, .001, .004]];
  const parts: ModelPart[] = [body("多棘鱼短钝头后高侧扁并变成尖长尾的身体", sections, skin), body("鼻端下侧的小下位口上唇", [[.25, .142, .018, .013], [.213, .149, .025, .024]], skin), body("与鼻端留有下开口隙的细下颌", [[.249, .11, .014, .006], [.211, .114, .022, .012]], pale), ...eyes([0, .187, .188], .03, .019), membrane("臀鳍后段连续连接尖尾的长软条鳍膜", fin, [[0, .089, -.29], [0, .052, -.33], [0, .038, -.55], [0, .049, -.77], [0, .079, -.96], [0, .085, -.96], [0, .08, -.78], [0, .079, -.57], [0, .083, -.34]])];
  const spines: ModelPart[] = [], teeth: ModelPart[] = [];
  for (let i = 0; i < 10; i++) {
    const z = .06 - i * .038, y = .244 - Math.max(0, -z) * .14;
    spines.push(needle("中央背部没有连续鳍膜的独立短硬棘", fin, [0, y - .005, z], [0, y + .035, z -.008], .004));
  }
  for (let i = 0; i < 20; i++) {
    const z = .065 - i * .018, y = .098 - Math.max(0, -z) * .03;
    spines.push(needle("长臀鳍前段独立而向后的硬棘", fin, [0, y + .003, z], [0, y -.028, z -.008], .003));
  }
  meshBatches(parts, "独立游离背棘与前段臀鳍硬棘", fin, spines, 30);
  for (const side of [-1, 1]) {
    parts.push(membrane("多棘鱼短小的胸鳍", fin, [[side * .03, .153, .12], [side * .08, .135, .08], [side * .06, .126, .026], [side * .026, .143, .073]]), membrane("位于长臀鳍之前的独立腹鳍", fin, [[side * .025, .106, .026], [side * .055, .061, -.024], [side * .023, .065, -.066], [side * .012, .106, -.016]]));
    for (let row = 0; row < 2; row++) for (let i = 0; i < 8; i++) teeth.push(needle("下颌真实口隙内至少两排的细齿", pale, [side * (.012 - row * .004), .113, .214 + i * .004], [side * (.012 - row * .004), .128, .214 + i * .004], .0015));
  }
  parts.push(combineMeshes("多棘鱼下位小口内两列牙床", pale, teeth));
  gillFlaps(parts, [0, .166, .139], .035, .09);
  return parts;
}

// https://www.fao.org/4/x3478e/x3478e12.pdf
function ijimaia(): ModelPart[] {
  const parts: ModelPart[] = [body("裸头胶鱼胶质膨大的短头与后方渐细的长躯", [[.48, .274, .032, .045], [.4, .3, .078, .102], [.26, .27, .087, .12], [.08, .228, .073, .115], [-.15, .188, .057, .093], [-.43, .151, .033, .061], [-.76, .12, .014, .028], [-1.04, .103, .003, .007]], skin), ...eyes([0, .337, .357], .07, .023), membrane("短背鳍之后没有另生背鳍的单个前背鳍", fin, [[0, .347, .19], [0, .5, .12], [0, .48, .036], [0, .391, -.015], [0, .334, -.04]]), membrane("长臀鳍与细小尾端连续相接的鳍褶", fin, [[0, .137, .02], [0, .079, -.05], [0, .044, -.29], [0, .041, -.57], [0, .069, -.85], [0, .097, -1.05], [0, .107, -1.045], [0, .092, -.76], [0, .09, -.43], [0, .095, -.15]])];
  const mouth = cap("膨大吻部下方真正向下开口的厚唇口腔", pale, [0, .23, .423], .053, .064, 3);
  mouth.rotation.x = 180;
  parts.push(mouth);
  const folds: ModelPart[] = [];
  for (let i = 0; i < 14; i++) {
    const a = i * Math.PI / 7;
    folds.push(tapered("厚唇边缘实际隆起而不作斑纹的细放射褶", pale, [[Math.cos(a) * .045, .169, .423 + Math.sin(a) * .045], [Math.cos(a) * .051, .18, .423 + Math.sin(a) * .051]], [.0022, .0012]));
  }
  parts.push(combineMeshes("裸头胶鱼厚唇的连续放射褶纹", pale, folds));
  for (const side of [-1, 1]) {
    parts.push(membrane("胸部两侧独立而较宽的短胸鳍", fin, [[side * .071, .257, .215], [side * .19, .22, .09], [side * .16, .16, -.027], [side * .068, .19, .05]]), tapered("明显位于胸鳍之前喉位的单根短腹鳍条", fin, [[side * .021, .17, .346], [side * .03, .099, .323], [side * .033, .064, .29]], [.005, .003, .0006]));
    for (let i = 0; i < 3; i++) parts.push(tapered("单鳍条根部被肉皮包围的三根极小腹鳍残条", fin, [[side * .02, .17, .34 - i * .006], [side * .025, .153, .329 - i * .006]], [.0025, .001]));
  }
  gillFlaps(parts, [0, .274, .26], .087, .2);
  return parts;
}

// https://www.tandfonline.com/doi/pdf/10.1080/03014223.1981.10427939
function pteraclis(): ModelPart[] {
  const parts: ModelPart[] = [body("帆鳍鲳双高帆之间的短深侧扁主体", [[.27, .38, .014, .023], [.22, .415, .029, .067], [.105, .414, .042, .106], [-.04, .393, .035, .102], [-.19, .366, .018, .055], [-.278, .345, .005, .014]], skin), body("帆鳍鲳小而略向前突的上唇", [[.283, .362, .012, .006], [.252, .378, .021, .018]], skin), body("上唇下方实际分开的短下颌", [[.288, .336, .011, .005], [.247, .346, .02, .011]], pale), ...eyes([0, .432, .216], .025, .024), membrane("从眼上到尾柄前完整高耸而没有前叶缺刻的背帆", fin, [[0, .47, .22], [0, .68, .206], [0, .753, .12], [0, .748, -.02], [0, .672, -.15], [0, .53, -.234], [0, .365, -.275], [0, .377, -.19], [0, .495, -.04], [0, .52, .105]]), membrane("与背帆同样高而连续弧形的完整臀帆", fin, [[0, .335, .21], [0, .14, .19], [0, .064, .1], [0, .072, -.035], [0, .14, -.16], [0, .255, -.241], [0, .332, -.275], [0, .311, -.19], [0, .291, -.04], [0, .308, .105]]), membrane("高帆后细尾柄上的深叉尾鳍", fin, [[0, .355, -.27], [0, .439, -.329], [0, .462, -.377], [0, .347, -.337], [0, .249, -.375], [0, .273, -.319], [0, .335, -.27]])];
  const rays: ModelPart[] = [], scales: ModelPart[] = [];
  for (let i = 0; i < 28; i++) {
    const t = i / 27, z = .19 - t * .43, rootTop = lineHeight([[.22, .482], [.105, .52], [-.04, .495], [-.19, .421], [-.278, .359]], z), rootBottom = lineHeight([[.22, .348], [.105, .308], [-.04, .291], [-.19, .311], [-.278, .331]], z);
    const top = lineHeight([[.22, .47], [.206, .68], [.12, .753], [-.02, .748], [-.15, .672], [-.234, .53], [-.275, .365]], z -.007), bottom = lineHeight([[.21, .335], [.19, .14], [.1, .064], [-.035, .072], [-.16, .14], [-.241, .255], [-.275, .332]], z -.007);
    rays.push(tapered("高背帆中从鳞鞘发出的独立软鳍条", pale, [[0, rootTop, z], [0, top -.003, z -.007]], [i === 2 ? .0022 : .0011, .00035]), tapered("高臀帆中相应扇展开的独立软鳍条", pale, [[0, rootBottom, z], [0, bottom + .003, z -.007]], [i === 2 ? .0022 : .0011, .00035]));
    for (const side of [-1, 1]) {
      scales.push(lobe("背鳍根两侧加大的鳞片形成真实收纳槽缘", skin, [side * .006, rootTop -.003, z], [.012, .014, .02]), lobe("臀鳍根两侧相应隆起的鳞鞘槽缘", skin, [side * .006, rootBottom + .003, z], [.011, .013, .02]));
    }
  }
  meshBatches(parts, "帆鳍鲳两张完整高帆的真实软条骨架", pale, rays, 24);
  meshBatches(parts, "双高帆基部两侧真实的扩大型鳞鞘", skin, scales, 36);
  for (const side of [-1, 1]) parts.push(membrane("高帆主体外侧的小胸鳍", fin, [[side * .034, .413, .13], [side * .108, .37, .026], [side * .086, .346, .008], [side * .028, .377, .062]]));
  gillFlaps(parts, [0, .414, .155], .039, .145);
  return parts;
}

export const aquaticExpansionBatchFifteenDesigns: MasterNatureDesign[] = [
  design("riftiaPachyptila", "巨型深海管虫", "动物", riftia, ["Riftia pachyptila", "无口成虫双侧鳃片与两翼外套领", "单条完整热泉管栖动物"]),
  design("bobbitWorm", "博比特吻沙蚕", "动物", bobbitWorm, ["Eunice", "三触角双触须与可外翻的弯钩锯齿颚板", "属级完整主不把误鉴种名另列"]),
  design("carinariaCristata", "冠龙骨螺", "动物", carinaria, ["Carinaria cristata", "高锥脆壳与高尾冠单泳足吸盘", "完整大型浮游腹足类"]),
  design("monorhaphisChuni", "单根针海绵", "动物", monorhaphis, ["Monorhaphis chuni", "单巨基骨针与连续筒身同列真出水孔", "完整深海玻璃海绵"]),
  design("lophotusLacepede", "冠带鱼", "动物", lophotus, ["Lophotus lacepede", "前突枕肉骨冠与尾前短臀鳍", "完整深海辐鳍鱼"]),
  design("notacanthusChemnitzii", "短吻多棘鱼", "动物", notacanthus, ["Notacanthus chemnitzii", "游离短背棘与前硬后软长臀鳍", "完整深海辐鳍鱼"]),
  design("ijimaiaLoppei", "洛氏裸头胶鱼", "动物", ijimaia, ["Ijimaia loppei", "膨大胶质吻头下位褶唇与喉位退化腹鳍", "完整深海辐鳍鱼"]),
  design("pteraclisVelifera", "帆鳍鲳", "动物", pteraclis, ["Pteraclis velifera", "双完整高帆与可收纳鳍条的鳞鞘槽缘", "不以斑点和鳍条数另计同属"]),
];
