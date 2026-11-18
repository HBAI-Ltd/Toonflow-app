import { cap, combineMeshes, design, frontCup, part, polygon, tapered } from "./shared";
import type { MasterNatureDesign, ModelPart, Triple } from "./shared";
import { body } from "./fishForms";
import { membrane } from "./animals";
import { convexValve } from "./bivalveArchitectures";
import { lump, pointed } from "./insectForms";

const skin = "#9eae98";
const shell = "#b7bea0";
const pale = "#d0c8a8";
const fin = "#c0c8ad";
const dark = "#647c6d";

function meshGroups(name: string, color: string, pieces: ModelPart[], count = 20): ModelPart[] {
  return Array.from({ length: Math.ceil(pieces.length / count) }, (_, i) => combineMeshes(name, color, pieces.slice(i * count, (i + 1) * count)));
}

function carapace(name: string, sections: [number, number, number, number][], thickness: number, startAngle: number, endAngle: number): ModelPart {
  const steps = 12, stride = steps + 1;
  const vertices = [false, true].flatMap(inner => sections.flatMap(([z, y, width, height]) => Array.from({ length: stride }, (_, i) => {
    const a = startAngle + (endAngle - startAngle) * i / steps;
    return { x: Math.sin(a) * (width - (inner ? thickness : 0)), y: y + Math.cos(a) * (height - (inner ? thickness : 0)), z };
  })));
  const offset = sections.length * stride, indices: number[] = [];
  for (let row = 0; row < sections.length - 1; row++) for (let i = 0; i < steps; i++) {
    const a = row * stride + i, b = a + 1, c = a + stride, d = c + 1;
    indices.push(a, b, c, b, d, c, a + offset, c + offset, b + offset, b + offset, c + offset, d + offset);
  }
  for (let i = 0; i < steps; i++) {
    const a = i, b = i + 1, c = (sections.length - 1) * stride + i, d = c + 1;
    indices.push(a, a + offset, b, b, a + offset, b + offset, c, d, c + offset, d, d + offset, c + offset);
  }
  for (let row = 0; row < sections.length - 1; row++) {
    const a = row * stride, b = a + stride, c = a + steps, d = b + steps;
    indices.push(a, b, a + offset, b, b + offset, a + offset, c, c + offset, d, d, c + offset, d + offset);
  }
  return part(name, "mesh", shell, [0, 0, 0], [1, 1, 1], [0, 0, 0], { vertices, indices });
}

// https://pmc.ncbi.nlm.nih.gov/articles/PMC8733173/
// https://snl.no/Mixopterus
function mixopterus(): ModelPart[] {
  const parts: ModelPart[] = [body("凯氏混翅鲎前中部微突而两侧近方的完整头胸部", [[.23, .122, .024, .021], [.205, .126, .067, .034], [.13, .118, .073, .032], [.078, .106, .057, .024]], shell), body("混翅鲎背甲下连续而逐渐收束的柔性后体", [[.1, .103, .055, .026], [-.08, .083, .06, .024], [-.19, .067, .035, .018], [-.295, .052, .018, .013]], skin), pointed("混翅鲎自然向下微弯而没有蝎式尾球的尾剑", pale, [[0, .052, -.282], [.007, .043, -.35], [.014, .028, -.43]], [.019, .011, 0])];
  const tergites: ModelPart[] = [], spines: ModelPart[] = [], joints: ModelPart[] = [];
  for (let i = 0; i < 12; i++) {
    const z = .076 - i * .032, width = i < 5 ? .063 + Math.sin(i / 4 * Math.PI) * .01 : .06 - (i - 4) * .006;
    const plate = convexValve("混翅鲎十二个活动后体节的独立弧形背板", [[-width, z + .018], [-width * 1.03, z - .011], [-width * .76, z - .022], [width * .76, z - .022], [width * 1.03, z - .011], [width, z + .018]], .011, .005);
    plate.color = shell; plate.position.y = .116 - i * .0054; tergites.push(plate);
  }
  parts.push(...meshGroups("混翅鲎前后逐渐变窄而非蝎腹的十二节甲", shell, tergites, 12));
  const mouth = cap("混翅鲎头胸部腹面真正下凹的口区", dark, [0, .09, .178], .014, .01, 3); mouth.rotation.x = 180; parts.push(mouth);
  for (const side of [-1, 1]) {
    parts.push(lump("混翅鲎头甲两侧的低肾形复眼", [side * .053, .148, .188], [.031, .016, .034], dark), tapered("混翅鲎口前细小而非巨螯的螯肢基部", skin, [[side * .008, .092, .194], [side * .015, .082, .224]], [.005, .0035]));
    for (const finger of [-1, 1]) parts.push(pointed("混翅鲎小螯肢末端两根相向短指", pale, [[side * .015 + finger * .003, .082, .22], [side * .014 + finger * .004, .079, .239], [side * .014, .079, .244]], [.0026, .0017, 0]));
    for (let pair = 0; pair < 2; pair++) {
      const path: Triple[] = pair === 0 ? [[side * .04, .098, .199], [side * .085, .092, .223], [side * .146, .079, .239], [side * .177, .071, .209], [side * .151, .063, .182], [side * .127, .059, .17]] : [[side * .052, .094, .165], [side * .111, .084, .164], [side * .193, .066, .157], [side * .215, .05, .112], [side * .181, .037, .087], [side * .14, .029, .094], [side * .11, .025, .12]];
      parts.push(pointed(pair === 0 ? "混翅鲎第二附肢长第三节和弯折捕食末端" : "混翅鲎第三附肢强壮近节与多节包围式捕食臂", skin, path, path.map((_, i) => i === path.length - 1 ? 0 : .013 - i * .0014)));
      for (let segment = 2; segment < path.length - 1; segment++) {
        const a = path[segment]!, b = path[segment + 1]!;
        joints.push(lump("捕食附肢各足节间可辨的厚关节", a, [.028 - segment * .002, .024, .022], shell));
        if (pair === 0 && segment > 3) continue;
        for (const edge of [-1, 1]) {
          const root: Triple = [a[0] * .65 + b[0] * .35, a[1] * .65 + b[1] * .35 + edge * .003, a[2] * .65 + b[2] * .35];
          spines.push(pointed("混翅鲎捕食腿第四至第七足节上成对的真实长棘", pale, [root, [root[0] - side * (.045 + pair * .018), root[1] + edge * .008, root[2] + .016]], [.0048 - segment * .00035, 0]));
        }
      }
    }
    for (let i = 0; i < 2; i++) {
      const z = .13 - i * .031, path: Triple[] = [[side * .055, .092, z], [side * (.13 + i * .012), .074, z - .013], [side * (.162 + i * .014), .03, z - .057], [side * (.19 + i * .014), .011, z - .057]];
      parts.push(pointed("混翅鲎只用于行走的第四第五对细节足", skin, path, [.008, .006, .0038, 0]));
      for (let j = 0; j < 3; j++) spines.push(pointed("混翅鲎步足上较短而非抓篮长棘的小棘", pale, [[side * (.126 + i * .012), .069 - j * .011, z - .016 - j * .012], [side * (.143 + i * .012), .06 - j * .011, z - .014 - j * .012]], [.0025, 0]));
    }
    parts.push(tapered("混翅鲎第六对游泳足的关节柄", skin, [[side * .05, .088, .086], [side * .116, .065, .029], [side * .155, .044, -.028]], [.01, .008, .006]), membrane("混翅鲎与步足分开而末端展开的游泳桨", fin, [[side * .147, .046, -.011], [side * .192, .041, -.032], [side * .211, .034, -.08], [side * .176, .028, -.105], [side * .149, .039, -.059]]));
  }
  parts.push(...meshGroups("混翅鲎两套捕食篮上的长棘及短步足棘", pale, spines, 30), ...meshGroups("混翅鲎长捕食臂的独立关节", shell, joints));
  return parts;
}

// https://www.nature.com/articles/ncomms10320
function dollocaris(): ModelPart[] {
  const sections: [number, number, number, number][] = [[.067, .054, .023, .038], [.035, .051, .039, .043], [-.045, .048, .034, .04], [-.094, .045, .013, .028]];
  const parts: ModelPart[] = [carapace("多罗虾左半中空而前腹缘留凹口的双瓣壳", sections, .0015, -2.35, -.018), carapace("多罗虾右半中空而前腹缘留凹口的双瓣壳", sections, .0015, .018, 2.35), body("多罗虾壳腔内背侧相接而腹缘容纳鳃的完整软体轴", [[.071, .05, .014, .024], [.022, .063, .018, .029], [-.052, .06, .013, .025], [-.091, .05, .007, .0225]], skin), frontCup("多罗虾三对抓握足汇向的真实口腔", pale, [0, .038, .071], .008, .005)];
  const pleopods: ModelPart[] = [], gills: ModelPart[] = [], teeth: ModelPart[] = [], segments: ModelPart[] = [];
  for (const side of [-1, 1]) {
    parts.push(tapered("多罗虾从壳前眼凹伸出的粗短眼柄", skin, [[side * .011, .06, .055], [side * .022, .062, .08]], [.007, .0055]), lump("多罗虾接近体长四分之一的巨大球状复眼", [side * .025, .067, .089], [.054, .057, .049], dark));
    for (let pair = 0; pair < 3; pair++) {
      const reach = .043 + pair * .008, z = .057 - pair * .019;
      const path: Triple[] = [[side * .011, .037, z], [side * (.025 + pair * .008), .017, z + .007], [side * (.034 + pair * .012), .009, z + reach], [side * (.016 + pair * .006), .029, z + reach + .013]];
      parts.push(tapered("多罗虾三对独立粗壮捕食足的多节弯曲基干", skin, path, [.0057 + pair * .0005, .005, .004, .0025]), pointed("多罗虾捕食足末端向内折合的长抓指", pale, [path[2]!, path[3]!, [side * .006, .037, z + reach + .006]], [.0033, .0023, 0]));
      for (let i = 0; i < 5; i++) {
        const t = (i + 1) / 6, a = path[1]!, b = path[2]!, root: Triple = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
        teeth.push(pointed("多罗虾三对抓握足内侧相向的短硬棘", pale, [root, [root[0] - side * .006, root[1] + .004, root[2] + .002]], [.0014, 0]));
      }
    }
    for (let i = 0; i < 8; i++) {
      const z = -.012 - i * .01;
      pleopods.push(pointed("多罗虾八节后腹每节成对的短游泳足", skin, [[side * .006, .041, z], [side * .02, .024, z - .005], [side * .023, .026, z - .011]], [.0026, .0017, 0]));
      pleopods.push(membrane("多罗虾短腹足末端的小游泳叶", fin, [[side * .017, .027, z - .003], [side * .027, .024, z - .008], [side * .027, .024, z - .016], [side * .019, .026, z - .012]]));
      for (let lamella = 0; lamella < 4; lamella++) gills.push(membrane("多罗虾壳腔内八对鳃的叠层薄鳃叶", fin, [[side * .011, .044, .049 - i * .013], [side * .024, .032 + lamella * .003, .045 - i * .013], [side * .026, .033 + lamella * .003, .039 - i * .013], [side * .013, .044, .039 - i * .013]]));
    }
  }
  for (let i = 0; i < 8; i++) segments.push(lump("多罗虾壳腔内短后腹的八个连续体节", [0, .045, -.014 - i * .01], [.029 - i * .002, .026, .012], skin));
  parts.push(...meshGroups("多罗虾三对捕食足的内缘硬棘", pale, teeth, 30), ...meshGroups("多罗虾壳腔内保留间隙的叠层鳃", fin, gills), ...meshGroups("多罗虾八对短腹足及末端小桨", skin, pleopods, 20), ...meshGroups("多罗虾双瓣壳内部的短节状后腹", skin, segments));
  return parts;
}

// https://pmc.ncbi.nlm.nih.gov/articles/PMC11463219/
function odaraia(): ModelPart[] {
  const parts: ModelPart[] = [carapace("奥代雷虫无背铰线且腹中留缝的桶状空壳", [[.05, .039, .021, .025], [.025, .039, .025, .028], [-.035, .037, .025, .027], [-.055, .035, .017, .023]], .0011, -2.73, 2.73), body("奥代雷虫伸出桶壳前方的完整头", [[.068, .034, .009, .009], [.057, .034, .015, .014], [.043, .033, .014, .014]], skin), body("奥代雷虫背侧连接桶壳而后方外露的柔软体轴", [[.043, .044, .011, .020], [-.04, .043, .01, .0195], [-.055, .028, .006, .006], [-.075, .028, .004, .005]], skin)];
  const rings: ModelPart[] = [], limbs: ModelPart[] = [], setae: ModelPart[] = [], dorsalSpines: ModelPart[] = [], jawTeeth: ModelPart[] = [];
  const mouth = cap("奥代雷虫大颚之间朝腹面开口的真实小口", pale, [0, .02, .057], .0056, .0038, 3); mouth.rotation.x = 180; parts.push(mouth);
  for (let i = 0; i < 32; i++) {
    const z = .04 - i * .00355, width = .0115 - i * .00018;
    rings.push(body("奥代雷虫连续三十余节的均一躯环", [[z + .002, .035 - i * .00019, width, .011 - i * .00015], [z - .001, .035 - i * .00019, width, .011 - i * .00015]], skin));
    for (const row of [-1, 0, 1]) dorsalSpines.push(pointed("奥代雷虫躯环上三条低背棘列", pale, [[row * width * .6, .043 - i * .00026, z], [row * width * .8, .046 - i * .00026, z - .001]], [.0008, 0]));
    for (const side of [-1, 1]) {
      const root: Triple = [side * width * .62, .027 - i * .00012, z];
      const path: Triple[] = Array.from({ length: 7 }, (_, segment) => { const t = segment / 6; return [root[0] + side * Math.sin(t * Math.PI * .75) * (.012 - i * .00012), root[1] - t * (.018 - i * .00015), z - t * .008]; });
      limbs.push(pointed("奥代雷虫腹侧细长多节内肢的筛食主轴", skin, path, path.map((_, j) => j === 6 ? 0 : .0015 - j * .00016)), membrane("奥代雷虫每躯节内肢外侧的薄游泳鳃枝", fin, [root, [side * (width + .009), root[1] + .006, z - .001], [side * (width + .012), root[1] + .002, z - .006], [side * width * .7, root[1], z - .006]]));
      for (let segment = 1; segment < 6; segment++) for (const edge of [-1, 1]) {
        const p = path[segment]!;
        setae.push(pointed("奥代雷虫内肢腹缘彼此交叠而仍留滤隙的长棘", pale, [p, [p[0] - side * (.007 - i * .00005), p[1] - .0035, p[2] + edge * .003]], [.0005, 0]));
      }
    }
  }
  for (const side of [-1, 1]) {
    parts.push(tapered("奥代雷虫向前外展而非触角的短眼柄", skin, [[side * .008, .04, .059], [side * .02, .044, .074]], [.0033, .0027]), lump("奥代雷虫桶壳前的独立大型复眼", [side * .021, .045, .075], [.018, .019, .018], dark));
    parts.push(polygon("奥代雷虫口边宽厚而内缘相向的大颚", shell, [[side * .003, .062], [side * .012, .062], [side * .014, .053], [side * .008, .047], [side * .002, .052]], .0035, [0, .019, 0]));
    for (let tooth = 0; tooth < 6; tooth++) jawTeeth.push(pointed("奥代雷虫大颚内缘六枚独立短齿", pale, [[side * .004, .019, .052 + tooth * .0015], [side * .0008, .017, .052 + tooth * .0015]], [.0008, 0]));
    const maxilla: Triple[] = Array.from({ length: 8 }, (_, j) => [side * (.007 + j * .0007), .021 - j * .001, .049 - j * .0017]);
    parts.push(pointed("奥代雷虫大颚后一对短而多节的刷状小颚", skin, maxilla, maxilla.map((_, j) => j === 7 ? 0 : .0014 - j * .0001)), membrane("奥代雷虫末节左右独立的水平尾舵叶", fin, [[side * .003, .029, -.067], [side * .028, .029, -.081], [side * .027, .027, -.093], [side * .007, .028, -.091], [side * .002, .029, -.077]]));
    for (let j = 0; j < 5; j++) setae.push(pointed("奥代雷虫小颚末端的清理短刚毛", pale, [[side * .011, .016, .04], [side * (.014 + j * .0011), .01, .04 - j * .001]], [.00045, 0]));
  }
  for (let i = 0; i < 3; i++) parts.push(lump("奥代雷虫双大眼之间三个细小额部感器", [(i - 1) * .0035, .043, .069], [.002, .002, .003], dark));
  parts.push(membrane("奥代雷虫与左右尾叶垂直的第三片背中尾舵", fin, [[0, .029, -.069], [0, .049, -.076], [0, .055, -.092], [0, .029, -.093]]), pointed("奥代雷虫口后单个三叉中齿的主尖", pale, [[0, .02, .052], [0, .013, .053]], [.0016, 0]));
  for (const side of [-1, 1]) jawTeeth.push(pointed("奥代雷虫单中齿左右两个短叉尖", pale, [[0, .018, .052], [side * .003, .014, .053]], [.0011, 0]));
  parts.push(...meshGroups("奥代雷虫三十余节可见的环状后躯", skin, rings, 8), ...meshGroups("奥代雷虫每节成对且分为两枝的完整腹肢", skin, limbs, 8), ...meshGroups("奥代雷虫筛食腿上保留真实空隙的长棘网", pale, setae, 40), ...meshGroups("奥代雷虫体环上低而连续的三列小棘", pale, dorsalSpines, 40), ...meshGroups("奥代雷虫真口内的大颚齿及三叉中齿", pale, jawTeeth, 30));
  // ACT: 每根内肢以六段曲轴表达约二十个足节的整体曲率；保留两排粗滤棘，不逐根复制微棘。
  return parts;
}

// https://burgess-shale.rom.on.ca/fossils/sanctacaris-uncata/
// https://pubmed.ncbi.nlm.nih.gov/25296691/
function sanctacaris(): ModelPart[] {
  const head = convexValve("多须虫中央隆起而两侧伸出三角展角的短宽头盾", [[-.011, .032], [-.019, .028], [-.029, .013], [-.016, .015], [-.012, .012], [.012, .012], [.016, .015], [.029, .013], [.019, .028], [.011, .032]], .009, .0025);
  head.position.y = .021; head.color = shell;
  const parts: ModelPart[] = [head, body("多须虫头盾腹面和体节下连续的完整体轴", [[.029, .021, .011, .008], [.013, .019, .013, .006], [-.018, .017, .01, .006], [-.036, .015, .005, .004]], skin)];
  const tergites: ModelPart[] = [], legs: ModelPart[] = [], paddles: ModelPart[] = [], setae: ModelPart[] = [], spines: ModelPart[] = [];
  for (let i = 0; i < 11; i++) {
    const z = .011 - i * .0045, width = .0155 - i * .0007;
    tergites.push(body("多须虫头后十一个独立而末节无足的躯节", [[z + .0025, .02 - i * .00038, width, .0064], [z - .0018, .02 - i * .00038, width * .94, .0058]], shell));
    if (i === 10) continue;
    for (const side of [-1, 1]) {
      const root: Triple = [side * width * .58, .016 - i * .00015, z];
      legs.push(pointed("多须虫前十个躯节成对的细长步行内肢", skin, [root, [side * (width + .006), .011, z - .003], [side * (width + .008), .003, z - .007]], [.0015, .001, 0]));
      paddles.push(membrane("多须虫双肢型躯足独立而宽展的游泳外枝", fin, [root, [side * (width + .011), .018, z - .002], [side * (width + .012), .016, z - .007], [side * (width + .002), .014, z - .008]]));
      for (let j = 0; j < 4; j++) setae.push(pointed("多须虫游泳鳃枝外缘真实分开的短缘毛", pale, [[side * (width + .006 + j * .0015), .016, z - .006], [side * (width + .009 + j * .0015), .014, z - .01]], [.00045, 0]));
    }
  }
  const mouth = cap("多须虫多对抓握附肢之间朝下的真实口区", pale, [0, .013, .025], .0035, .0025, 3); mouth.rotation.x = 180; parts.push(mouth);
  for (const side of [-1, 1]) {
    parts.push(tapered("多须虫头盾前外侧伸出的短眼柄", skin, [[side * .011, .025, .028], [side * .02, .027, .033]], [.0018, .0012]), lump("多须虫头盾侧前的成对复眼", [side * .021, .028, .033], [.007, .007, .006], dark));
    for (let i = 0; i < 5; i++) {
      const z = .029 - i * .0032, spread = .014 + i * .003;
      const path: Triple[] = [[side * .006, .016, z], [side * spread, .01, z + .009], [side * spread * .76, .009, z + .018], [side * .006, .013, z + .021]];
      parts.push(pointed("多须虫头部五对向前收拢的有棘抓握内枝", skin, path, [.0018, .0015, .0011, 0]), pointed("多须虫各头附肢伴随而独立的细须状外枝", fin, [[side * .007, .017, z], [side * (spread + .008), .02, z + .009], [side * (spread + .01), .022, z + .022]], [.0008, .00055, 0]));
      for (let j = 0; j < 4; j++) {
        const t = (j + 1) / 5, a = path[1]!, b = path[2]!, p: Triple = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
        spines.push(pointed("多须虫头部捕食枝内侧向口收拢的短棘", pale, [p, [p[0] - side * .004, p[1] + .001, p[2] + .001]], [.00065, 0]));
      }
    }
    parts.push(pointed("多须虫头后第六对附肢较短的刷状基干", skin, [[side * .008, .017, .014], [side * .023, .014, .014]], [.0015, 0]));
    for (let j = 0; j < 8; j++) setae.push(pointed("多须虫第六头附肢末端的刷状缘毛", pale, [[side * .019, .015, .013 + j * .0005], [side * .027, .013, .011 + j * .001]], [.00045, 0]));
  }
  const tail = convexValve("多须虫与狭末节相接而外缘带毛的宽桨状尾板", [[-.004, -.032], [-.018, -.041], [-.016, -.053], [0, -.056], [.016, -.053], [.018, -.041], [.004, -.032]], .0028, .0012); tail.position.y = .014; tail.color = fin; parts.push(tail);
  for (let i = 0; i < 16; i++) {
    const a = Math.PI * (i / 15), x = Math.cos(a) * .016, z = -.045 - Math.sin(a) * .01;
    setae.push(pointed("多须虫宽尾桨后缘真实分开的刚毛", pale, [[x, .0143, z], [x * 1.1, .014, z - .004]], [.00045, 0]));
  }
  parts.push(...meshGroups("多须虫有别于三叶虫的十一节分段后躯", shell, tergites, 8), ...meshGroups("多须虫躯足的十对步行内枝", skin, legs, 12), ...meshGroups("多须虫躯足各自独立的外侧鳃桨", fin, paddles), ...meshGroups("多须虫腹足头刷与尾桨的真实缘毛", pale, setae, 40), ...meshGroups("多须虫五对头部抓握肢的内棘列", pale, spines, 40));
  return parts;
}

// https://burgess-shale.rom.on.ca/fossils/sidneyia-inexpectans/
// https://pmc.ncbi.nlm.nih.gov/articles/PMC6234888/
function sidneyia(): ModelPart[] {
  const head = convexValve("悉尼虫前侧留眼触角凹口而无长颊刺的近方头盾", [[-.018, .071], [-.026, .068], [-.025, .059], [-.032, .057], [-.031, .045], [.031, .045], [.032, .057], [.025, .059], [.026, .068], [.018, .071]], .013, .003);
  head.position.y = .026; head.color = shell;
  const parts: ModelPart[] = [head, body("悉尼虫无头部步足而与九节胸躯连续的低扁身体", [[.068, .026, .019, .013], [.041, .025, .025, .008], [-.035, .023, .018, .007], [-.047, .021, .01, .008]], skin)];
  const plates: ModelPart[] = [], limbs: ModelPart[] = [], teeth: ModelPart[] = [], coxae: ModelPart[] = [], paddles: ModelPart[] = [], antennae: ModelPart[] = [];
  for (let i = 0; i < 9; i++) {
    const z = .041 - i * .0102, width = i < 4 ? .028 + i * .0028 : .0364 - (i - 3) * .0034;
    const plate = convexValve("悉尼虫前四节渐宽而后五节收窄的薄胸背板", [[-width, z + .006], [-width * 1.02, z - .003], [-width * .88, z - .007], [width * .88, z - .007], [width * 1.02, z - .003], [width, z + .006]], .008, .0023); plate.position.y = .026 - i * .0004; plate.color = shell; plates.push(plate);
    for (const side of [-1, 1]) {
      const root: Triple = [side * .009, .018 - i * .0001, z];
      const path: Triple[] = [root, [side * .018, .012, z - .001], [side * .025, .01, z - .004], [side * .032, .008, z - .007], [side * .039, .004, z - .009], [side * .041, .003, z - .013]];
      limbs.push(pointed("悉尼虫九对多节步足及末端尖爪", skin, path, [.0031, .0026, .0021, .0016, .0011, 0]));
      coxae.push(lump("悉尼虫腹侧宽大而相向的压碎型齿基", [side * .008, .016, z], [.014, .009, .0105], shell));
      for (let j = 0; j < 4; j++) teeth.push(pointed("悉尼虫足基内侧真正向中线咬合的小硬齿", pale, [[side * .0036, .014, z + (j - 1.5) * .0017], [side * .0007, .013, z + (j - 1.5) * .0017]], [.0008, 0]));
      if (i >= 4) paddles.push(membrane("悉尼虫只有后五对胸足具有的外侧游泳鳃枝", fin, [[side * .012, .019, z], [side * (width + .013), .021, z - .002], [side * (width + .016), .018, z - .009], [side * .018, .017, z - .011]]));
    }
  }
  for (let i = 0; i < 3; i++) parts.push(body("悉尼虫九节胸躯后的三个狭窄无足腹节", [[-.045 - i * .009, .02, .011 - i * .0015, .007], [-.055 - i * .009, .019, .01 - i * .0015, .006]], shell));
  const mouth = cap("悉尼虫头盾腹面压碎齿基前端的真实小口", pale, [0, .013, .057], .0047, .0034, 3); mouth.rotation.x = 180; parts.push(mouth, lump("悉尼虫小口前方与头腹相连的低唇板", [0, .0135, .065], [.015, .004, .014], shell));
  for (const side of [-1, 1]) {
    parts.push(tapered("悉尼虫头盾前侧眼凹中的短眼柄", skin, [[side * .021, .031, .063], [side * .029, .034, .067]], [.0026, .0018]), lump("悉尼虫头盾凹口后上方的外露柄眼", [side * .03, .035, .067], [.009, .01, .009], dark));
    const path: Triple[] = Array.from({ length: 21 }, (_, i) => { const t = i / 20; return [side * (.02 + .023 * t), .027 + .006 * Math.sin(t * Math.PI), .064 + .039 * t]; });
    for (let i = 0; i < 20; i++) antennae.push(tapered("悉尼虫从同一前侧凹口伸出的二十节长触角", skin, [path[i]!, path[i + 1]!], [.0018 - i * .00006, .00174 - i * .00006]));
    const tail = convexValve("悉尼虫末腹左右分开的宽圆尾叶", [[side * .004, -.067], [side * .021, -.074], [side * .026, -.09], [side * .011, -.093], [side * .004, -.081]], .0028, .0012); tail.position.y = .019; tail.color = fin; parts.push(tail);
  }
  parts.push(polygon("悉尼虫两片尾叶之间独立的三角尾节", shell, [[-.007, -.07], [.007, -.07], [0, -.091]], .003, [0, .017, 0]), ...meshGroups("悉尼虫九片薄而宽的连续胸背板", shell, plates, 9), ...meshGroups("悉尼虫九对多节步行足", skin, limbs, 8), ...meshGroups("悉尼虫腹面相向的九对强壮足基", shell, coxae, 20), ...meshGroups("悉尼虫足基内缘留有咬合间隙的压碎齿", pale, teeth, 40), ...meshGroups("悉尼虫后五对足的独立鳃游泳叶", fin, paddles), ...meshGroups("悉尼虫成对真实分节而渐细的长触角", skin, antennae, 12));
  return parts;
}

// https://doi.org/10.1073/pnas.1505596112
function collinsium(): ModelPart[] {
  const sections: [number, number, number, number][] = Array.from({ length: 16 }, (_, i) => [.034 - i * .0053, .02 - i * .0002, i < 14 ? .0055 - i * .00005 : .004 - (i - 14) * .001, i < 14 ? .006 - i * .00006 : .0047 - (i - 14) * .0007]);
  const parts: ModelPart[] = [body("多毛科林斯虫前后连贯而没有硬体分节的细长完整躯体", sections, skin), body("多毛科林斯虫无巨大眼而前方略缩细的短头", [[.041, .021, .0025, .003], [.034, .02, .0055, .006]], skin), frontCup("多毛科林斯虫小头前端的真实小口", pale, [0, .021, .041], .0017, .0014)];
  const spines: ModelPart[] = [], setae: ModelPart[] = [], feet: ModelPart[] = [], claws: ModelPart[] = [];
  for (let i = 0; i < 15; i++) {
    const z = .03 - i * .0053, y = .02 - i * .0002, width = i < 14 ? .0055 - i * .00005 : .0037, height = i < 14 ? .006 - i * .00006 : .0045;
    const offsets = i === 0 ? [-1, 1] : [-2, -1, 0, 1, 2];
    for (const column of offsets) {
      const x = column * .0017, rootY = y + Math.sqrt(Math.max(.05, 1 - (x / width) ** 2)) * height - .00035;
      const length = column === 0 ? .016 : Math.abs(column) === 1 ? .0115 : .0065;
      spines.push(pointed("科林斯虫十五组中棘侧棘层次不同的完整七十二根硬棘", pale, [[x, rootY, z], [x + column * .001, rootY + length * .53, z - .0018], [x + column * .002, rootY + length, z - .0033]], [column === 0 ? .0013 : .001, .00065, 0]));
    }
    for (const side of [-1, 1]) {
      if (i < 6) {
        const path: Triple[] = [[side * .004, .018 - i * .0002, z], [side * (.011 + i * .0008), .03, z + .003], [side * (.017 + i * .0008), .045, z + .011]];
        parts.push(pointed("科林斯虫前六对向上展开而具长刚毛的纤细筛食肢", skin, path, [.0012, .0009, 0]));
        for (let j = 0; j < 30; j++) for (const edge of [-1, 1]) {
          const t = (j + 1) / 31, a = path[1]!, b = path[2]!, root: Triple = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
          setae.push(pointed("科林斯虫前筛肢上双列人字形长刚毛", fin, [root, [root[0] - side * .006, root[1] - .0024, root[2] + edge * .0035]], [.00017, 0]));
        }
      } else {
        const end: Triple = [side * .011, .004, z - .001];
        feet.push(tapered("科林斯虫后九对粗短而不具筛毛的锚定肉足", skin, [[side * width * .65, y - .002, z], [side * .0095, .011, z + .001], end], [.0019, .0015, .001]));
        claws.push(pointed("科林斯虫每根后足末端单一而前弯的强钩爪", pale, [end, [side * .012, .0015, z + .002], [side * .011, .002, z + .005]], [.00085, .00065, 0]));
      }
    }
  }
  for (const side of [-1, 1]) parts.push(pointed("科林斯虫头前没有关节的成对细触突", skin, [[side * .0015, .022, .039], [side * .005, .026, .047], [side * .006, .028, .052]], [.00075, .0004, 0]));
  parts.push(...meshGroups("科林斯虫第一组二根其余每组五根的完整背棘甲", pale, spines, 16), ...meshGroups("科林斯虫十二根前筛肢上的双排独立长刚毛", fin, setae, 40), ...meshGroups("科林斯虫后九对连续接躯的粗肉足", skin, feet, 12), ...meshGroups("科林斯虫十八根后足各自独立的单钩爪", pale, claws, 20));
  return parts;
}

// https://doi.org/10.1016/j.cub.2020.01.075
// https://doi.org/10.1007/s11434-006-0358-3
function facivermis(): ModelPart[] {
  const parts: ModelPart[] = [body("云南火把虫仅前部有足而中段长达五倍的完整虫体", [[.042, .014, .0025, .0028], [.027, .013, .003, .003], [-.026, .01, .002, .002], [-.034, .009, .0026, .0026], [-.041, .009, .0055, .0055], [-.047, .008, .002, .002]], skin), frontCup("云南火把虫成对小眼之前真正敞开的小口", pale, [0, .014, .042], .0017, .0013)];
  const setae: ModelPart[] = [], hooks: ModelPart[] = [];
  for (const side of [-1, 1]) {
    parts.push(lump("云南火把虫头前部实证存在的成对小眼", [side * .0017, .0159, .0405], [.0013, .0013, .0013], dark));
    for (let i = 0; i < 5; i++) {
      const z = .037 - i * .0026, path: Triple[] = [[side * .0025, .0135, z], [side * .0115, .024, z + .004], [side * .017, .034, z + .011]];
      parts.push(pointed("云南火把虫仅前端五对等长而上举的长筛食附肢", skin, path, [.0012, .0009, 0]));
      for (let j = 0; j < 20; j++) for (const edge of [-1, 1]) {
        const t = (j + 1) / 21, a = path[1]!, b = path[2]!, root: Triple = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
        setae.push(pointed("云南火把虫前附肢两侧真正分开的双列长刚毛", fin, [root, [root[0] - side * .0055, root[1] - .0017, root[2] + edge * .0035]], [.00017, 0]));
      }
    }
  }
  for (let row = 0; row < 3; row++) for (let i = 0; i < 12; i++) {
    const a = i * Math.PI / 6 + row * .13, radius = .0041 - row * .00085, z = -.043 - row * .0017, root: Triple = [Math.cos(a) * radius, .0085 + Math.sin(a) * radius, z];
    hooks.push(pointed("云南火把虫梨形后端环绕肛门的三圈锚钩", pale, [root, [Math.cos(a) * (radius + .0015), .0085 + Math.sin(a) * (radius + .0015), z - .0004], [Math.cos(a) * (radius + .0012), .0085 + Math.sin(a) * (radius + .0012), z + .002]], [.0005, .00038, 0]));
  }
  const anus = cap("云南火把虫梨形尾端三圈锚钩之间的真实小开口", skin, [0, .008, -.047], .0014, .001, 3); anus.rotation.x = -90; parts.push(anus, ...meshGroups("云南火把虫五对前筛肢的双列刚毛篮", fin, setae, 40), ...meshGroups("云南火把虫无后足而以三圈尾钩固定的梨形后端", pale, hooks, 20));
  // ACT: 展示完整活体形态，省去会遮住无足长中段和梨形尾的居住管。
  return parts;
}

// https://pmc.ncbi.nlm.nih.gov/articles/PMC6030330/
// https://burgess-shale.rom.on.ca/fossils/waptia-fieldensis/
function waptia(): ModelPart[] {
  const parts: ModelPart[] = [carapace("瓦普塔虾无背铰线且不填实的短柔性头胸甲", [[.023, .014, .004, .0065], [.019, .014, .008, .009], [.01, .013, .006, .0075], [.006, .012, .004, .0055]], .00065, -2.3, 2.3), body("瓦普塔虾短头甲下连接前足和六对鳃足的体轴", [[.025, .014, .0035, .0048], [.018, .014, .005, .0084], [.009, .013, .004, .0066], [0, .012, .003, .004]], skin)];
  const antennae: ModelPart[] = [], feet: ModelPart[] = [], claws: ModelPart[] = [], endites: ModelPart[] = [], lamellae: ModelPart[] = [], tail: ModelPart[] = [], mouthparts: ModelPart[] = [];
  for (let i = 0; i < 5; i++) parts.push(body("瓦普塔虾占全长六成的五个圆筒状无足后腹节", [[.001 - i * .006, .011 - i * .0005, .0032 - i * .00016, .0035 - i * .00016], [-.005 - i * .006, .0107 - i * .0005, .0031 - i * .00016, .0034 - i * .00016]], skin));
  parts.push(body("瓦普塔虾五个长腹节后连接尾肢的第六短节", [[-.029, .0087, .0026, .003], [-.033, .0083, .0023, .0026]], shell));
  const mouth = cap("瓦普塔虾大颚与小颚之间朝腹面的小口", pale, [0, .008, .023], .0018, .0015, 3); mouth.rotation.x = 180; parts.push(mouth);
  for (const side of [-1, 1]) {
    parts.push(tapered("瓦普塔虾在柔甲前外侧伸出的短眼柄", skin, [[side * .003, .017, .022], [side * .009, .02, .027]], [.0013, .0009]), lump("瓦普塔虾柔甲前外露的柄眼", [side * .0095, .0205, .028], [.006, .0065, .0055], dark));
    const antenna: Triple[] = Array.from({ length: 11 }, (_, i) => { const t = i / 10; return [side * (.002 + .015 * t), .014 + .01 * Math.sin(t * Math.PI * .5), .025 + .024 * t]; });
    for (let i = 0; i < 10; i++) antennae.push(tapered("瓦普塔虾十节长第一触角而没有第二对触角", skin, [antenna[i]!, antenna[i + 1]!], [.0011 - i * .000075, .001025 - i * .000075]));
    mouthparts.push(lump("瓦普塔虾口边小而强壮的成对大颚基部", [side * .0025, .0087, .023], [.0035, .0028, .003], shell));
    const palp: Triple[] = [[side * .003, .009, .023], [side * .005, .008, .024], [side * .0065, .0083, .0257], [side * .0068, .009, .027]];
    mouthparts.push(pointed("瓦普塔虾大颚外侧实际三节的颚须", skin, palp, [.00065, .0005, .00035, 0]), tapered("瓦普塔虾大颚后短小颚的独立基干", skin, [[side * .003, .009, .0215], [side * .006, .007, .023]], [.0009, .00065]));
    for (const edge of [-1, 1]) claws.push(pointed("瓦普塔虾小颚末端相邻的两根短钩", pale, [[side * .006, .007, .023], [side * (.007 + edge * .00065), .0062, .0248], [side * (.0065 + edge * .0006), .007, .0255]], [.00038, .00028, 0]));
    for (let pair = 0; pair < 4; pair++) {
      const z = .0205 - pair * .0024;
      const path: Triple[] = Array.from({ length: 6 }, (_, j) => { const t = j / 5; return [side * (.0035 + .009 * t), .01 - .006 * Math.sin(t * Math.PI * .65), z + .006 * t]; });
      feet.push(tapered("瓦普塔虾甲下四对前肢的五节内肢", skin, path, path.map((_, j) => .0011 - j * .00012)));
      for (const edge of [-1, 1]) claws.push(pointed("瓦普塔虾前四对内肢末端的成对主爪", pale, [path[5]!, [path[5]![0] + side * .001, path[5]![1] - .0005, path[5]![2] + edge * .0012], [path[5]![0], path[5]![1] + .0002, path[5]![2] + edge * .0018]], [.0004, .0003, 0]));
      if (pair < 3) for (let j = 1; j < 5; j++) endites.push(pointed("瓦普塔虾前三对前肢向内收食的长内叶", fin, [path[j]!, [path[j]![0] - side * .0045, path[j]![1] - .0008, path[j]![2] + .0013]], [.0005, 0]));
      else for (let j = 0; j < 4; j++) lamellae.push(membrane("瓦普塔虾第四前肢环节基部的短鳃片", fin, [[side * .0035, .01, z], [side * (.006 + j * .0009), .009, z - .0005], [side * (.006 + j * .0009), .008, z - .003], [side * .0035, .009, z - .0025]]));
    }
    for (let pair = 0; pair < 6; pair++) {
      const z = .0105 - pair * .0019, root: Triple = [side * .0025, .0115, z], tip: Triple = [side * .013, .008, z - .003];
      feet.push(tapered("瓦普塔虾中躯六对全环节化鳃足的细主轴", skin, [root, [side * .008, .01, z - .001], tip], [.0011, .0008, .0005]));
      for (let j = 0; j < 8; j++) {
        const t = (j + 1) / 9, x = root[0] + (tip[0] - root[0]) * t, y = root[1] + (tip[1] - root[1]) * t, pz = z - .003 * t;
        lamellae.push(membrane("瓦普塔虾六对鳃足主轴上的分离薄鳃片", fin, [[x, y, pz], [x + side * .002, y + .0015, pz - .001], [x + side * .002, y - .001, pz - .0045], [x, y - .001, pz - .003]]));
      }
    }
    for (let piece = 0; piece < 3; piece++) tail.push(polygon("瓦普塔虾每侧尾枝上实际三片相连的小尾甲", fin, [[side * .0015, -.032 - piece * .0035], [side * (.004 + piece * .0013), -.033 - piece * .0035], [side * (.0047 + piece * .0013), -.036 - piece * .0035], [side * .0015, -.0357 - piece * .0035]], .0008, [0, .007, 0]));
  }
  parts.push(...meshGroups("瓦普塔虾成对十节细长触角", skin, antennae, 12), ...meshGroups("瓦普塔虾四对前肢与六对鳃肢的不同主轴", skin, feet, 8), ...meshGroups("瓦普塔虾前肢及小颚末端真实成对的小钩爪", pale, claws, 16), ...meshGroups("瓦普塔虾前三对前肢的长内叶", fin, endites, 30), ...meshGroups("瓦普塔虾后六对鳃足上留隙的密叠薄鳃片", fin, lamellae, 30), ...meshGroups("瓦普塔虾左右各三节的双尾枝", fin, tail, 6), ...meshGroups("瓦普塔虾真实口旁大颚三节须和短小颚", skin, mouthparts, 8));
  return parts;
}

export const aquaticExpansionBatchTwelveAncientDesigns: MasterNatureDesign[] = [
  design("mixopterus", "凯氏混翅鲎", "动物", mixopterus, ["Mixopterus kiaeri", "双套长棘捕食篮与细步足独立末对泳桨", "完整古海洋节肢动物形态复原"]),
  design("dollocaris", "多罗虾", "动物", dollocaris, ["Dollocaris ingens", "中空双瓣壳巨大复眼三对抓握足和八对短腹足", "完整古海洋节肢动物形态复原"]),
  design("odaraia", "奥代雷虫", "动物", odaraia, ["Odaraia alata", "桶状空壳多节筛食腹肢真大颚与三叶尾舵", "完整古海洋节肢动物形态复原"]),
  design("sidneyia", "悉尼虫", "动物", sidneyia, ["Sidneyia inexpectans", "近方头盾九节宽胸甲足基压碎齿与三叶尾扇", "完整古海洋节肢动物形态复原"]),
  design("sanctacaris", "多须虫", "动物", sanctacaris, ["Sanctacaris uncata", "五对多须抓握头肢十一节后躯宽缘毛尾桨", "完整古海洋节肢动物形态复原"]),
  design("collinsium", "多毛科林斯虫", "动物", collinsium, ["Collinsium ciliosum", "六对筛毛前肢九对单钩后足和七十二根多列背棘", "完整古海洋泛节肢动物形态复原"]),
  design("facivermis", "云南火把虫", "动物", facivermis, ["Facivermis yunnanicus", "五对前筛肢无足长中段与三圈尾钩梨形后端", "完整古海洋泛节肢动物形态复原"]),
  design("waptia", "瓦普塔虾", "动物", waptia, ["Waptia fieldensis", "短柔空甲十节触角四对前肢六对鳃足与无足长腹", "完整古海洋节肢动物形态复原"]),
];
