import { combineMeshes, design, eyes, leaf, lobe, polygon, tapered } from "./shared";
import type { MasterNatureDesign, ModelPart, Triple } from "./shared";

const hide = "#a7b198";
const pale = "#c9cbb0";
const dark = "#7e907b";

function pantodontFoot(parts: ModelPart[], ankle: Triple, width: number, length: number, plantigrade = true) {
  parts.push(lobe(plantigrade ? "跟掌落地而五趾前伸的宽后足" : "腕部抬高而由五趾支承的前掌", hide, [ankle[0], plantigrade ? 0.075 : 0.12, ankle[2] + length * 0.13], [width * 1.9, plantigrade ? 0.145 : 0.2, length * (plantigrade ? 1.3 : 0.9)]));
  const digits: ModelPart[] = [], nails: ModelPart[] = [];
  for (let index = -2; index <= 2; index++) {
    const x = ankle[0] + index * width * 0.41, z = ankle[2] + length * (0.82 - Math.abs(index) * 0.11);
    digits.push(tapered("钝脚类五枚真正独立的短指趾", hide, [[ankle[0] + index * width * 0.16, plantigrade ? 0.09 : 0.16, ankle[2]], [x, 0.055, z]], [width * 0.28, width * 0.19]));
    nails.push(lobe("短指趾末端分别附着的小蹄甲而非大钩爪", dark, [x, 0.046, z + width * 0.09], [width * 0.43, 0.075, length * 0.3]));
  }
  parts.push(combineMeshes("钝脚类完整五指趾列", hide, digits), combineMeshes("五枚分开且真实接趾的小蹄甲", dark, nails));
}

function threeToedRhinoFoot(parts: ModelPart[], ankle: Triple, width: number, length: number) {
  parts.push(lobe("三趾犀类跖垫与腿轴连续的宽掌", hide, [ankle[0], 0.112, ankle[2]], [width * 1.9, 0.21, length * 0.88]));
  const hooves: ModelPart[] = [];
  for (let index = -1; index <= 1; index++) hooves.push(lobe("三枚分离的圆钝犀类蹄趾", dark, [ankle[0] + index * width * 0.63, 0.068, ankle[2] + length * (index ? 0.22 : 0.36)], [width * 0.75, 0.13, length * 0.7], [0, index * 15, 0]));
  parts.push(combineMeshes("只有三枚而非河马四趾的完整蹄掌", dark, hooves));
}

// https://www.fieldmuseum.org/blog/seeing-double-how-field-museum-makes-fossil-casts
// https://field.biodiversitylibrary.org/part/365077
function barylambda(): ModelPart[] {
  const parts: ModelPart[] = [lobe("笨脚兽深桶腹与向后加宽的长腰", hide, [0, 0.704, -0.055], [0.95, 0.93, 1.63]), lobe("笨脚兽大于前肩的强壮臀部", hide, [0, 0.715, -0.55], [0.96, 0.87, 0.8]), tapered("笨脚兽从小前肩抬起的短粗颈", hide, [[0, 0.84, 0.51], [0, 1.02, 0.77]], [0.21, 0.15]), lobe("笨脚兽与巨大身体明显不成比例的小短颅", hide, [0, 1.085, 0.928], [0.36, 0.36, 0.46]), lobe("笨脚兽短而钝圆的低鼻吻", pale, [0, 0.995, 1.114], [0.28, 0.2, 0.29]), ...eyes([0, 1.135, 1.015], 0.131, 0.032), tapered("笨脚兽由粗大尾椎支持而非细毛尾的长重尾", hide, [[0, 0.72, -0.66], [0, 0.49, -0.99], [0.025, 0.245, -1.28], [0.045, 0.14, -1.55]], [0.3, 0.225, 0.13, 0.045])];
  for (const side of [-1, 1]) {
    parts.push(lobe("笨脚兽小头后侧的小圆耳", dark, [side * 0.142, 1.206, 0.824], [0.09, 0.115, 0.07]), tapered("笨脚兽较细但有宽腕的前肢", hide, [[side * 0.25, 0.78, 0.47], [side * 0.33, 0.415, 0.43], [side * 0.34, 0.13, 0.59]], [0.15, 0.108, 0.085]), tapered("笨脚兽粗股大膝和长落地跟部的后肢", hide, [[side * 0.29, 0.71, -0.52], [side * 0.4, 0.4, -0.36], [side * 0.385, 0.11, -0.61]], [0.235, 0.16, 0.11]));
    pantodontFoot(parts, [side * 0.34, 0.13, 0.59], 0.105, 0.23);
    pantodontFoot(parts, [side * 0.385, 0.11, -0.61], 0.124, 0.29);
    parts.push(tapered("笨脚兽唇缘旁不夸张成剑齿的上犬齿", pale, [[side * 0.098, 0.973, 1.112], [side * 0.1, 0.916, 1.14], [side * 0.097, 0.897, 1.132]], [0.018, 0.013, 0.001]));
  }
  return parts;
}

// https://www.nps.gov/agfo/planyourvisit/park-brochure.htm
// https://www.dmr.nd.gov/dmr/sites/www/files/documents/paleontology/pdfs/prehistoric-life-map/Coryphodon.pdf
function coryphodon(): ModelPart[] {
  const parts: ModelPart[] = [lobe("冠齿兽无高肩峰的低宽长桶躯", hide, [0, 0.68, -0.1], [1.04, 0.99, 1.69]), tapered("冠齿兽前伸而不具长象鼻的短宽颈", hide, [[0, 0.79, 0.47], [0, 0.825, 0.845]], [0.29, 0.23]), lobe("冠齿兽宽平顶而无颅骨角瘤的巨大头颅", hide, [0, 0.85, 1.064], [0.56, 0.49, 0.68]), lobe("冠齿兽下垂而横宽的短吻与上唇", pale, [0, 0.716, 1.327], [0.44, 0.29, 0.36]), lobe("冠齿兽与上颌分开但连续接颈的厚下颌", hide, [0, 0.625, 1.182], [0.44, 0.19, 0.49]), ...eyes([0, 0.96, 1.129], 0.21, 0.041), tapered("冠齿兽较笨脚兽细短的低垂尾", hide, [[0, 0.66, -0.803], [0.025, 0.415, -1.026], [0.05, 0.25, -1.14]], [0.081, 0.049, 0.016])];
  for (const side of [-1, 1]) {
    parts.push(lobe("冠齿兽头后小圆耳而非河马高耳丘", dark, [side * 0.215, 1.038, 0.858], [0.115, 0.14, 0.083]), tapered("冠齿兽短粗前臂与抬起的腕部", hide, [[side * 0.305, 0.72, 0.47], [side * 0.383, 0.398, 0.44], [side * 0.39, 0.17, 0.581]], [0.17, 0.13, 0.092]), tapered("冠齿兽后跟落地的短粗后肢", hide, [[side * 0.32, 0.67, -0.61], [side * 0.41, 0.365, -0.49], [side * 0.4, 0.11, -0.663]], [0.19, 0.138, 0.1]));
    pantodontFoot(parts, [side * 0.39, 0.17, 0.581], 0.111, 0.21, false);
    pantodontFoot(parts, [side * 0.4, 0.11, -0.663], 0.118, 0.25);
    parts.push(tapered("冠齿兽上唇侧方外露而末端内收的短犬齿", pale, [[side * 0.171, 0.69, 1.312], [side * 0.179, 0.561, 1.351], [side * 0.171, 0.517, 1.339]], [0.034, 0.023, 0.0012]), lobe("冠齿兽鼻吻前侧而非河马顶面的鼻孔", dark, [side * 0.113, 0.753, 1.466], [0.046, 0.026, 0.012]));
  }
  return parts;
}

// https://libsysdigi.library.illinois.edu/oca/Books2008-08/fieldmuseumnews/fieldmuseumnews06fiel/fieldmuseumnews06fiel.pdf
// https://app.ingemmet.gob.pe/biblioteca/pdf/RGC17-215.pdf
function astrapotherium(): ModelPart[] {
  const parts: ModelPart[] = [lobe("闪兽长而厚重的胸腹与相对轻窄的后躯", hide, [0, 0.985, -0.15], [1.13, 1.32, 1.93]), lobe("闪兽前肩强于轻小骨盆的胸部", hide, [0, 1.06, 0.47], [1.08, 1.27, 0.93]), tapered("闪兽从肩部向前抬起而不僵直的粗颈", hide, [[0, 1.16, 0.58], [0, 1.275, 0.91]], [0.32, 0.255]), lobe("闪兽后部高深而鼻骨缩短的大颅", hide, [0, 1.295, 1.175], [0.61, 0.66, 0.67]), lobe("闪兽上门齿缺失下方突出的宽下颌联合", pale, [0, 1.017, 1.38], [0.4, 0.24, 0.49]), tapered("闪兽由缩短鼻骨推定而非象式米级长鼻的短柔鼻", hide, [[0, 1.381, 1.371], [0, 1.31, 1.535], [0, 1.096, 1.634], [0.035, 1.001, 1.593]], [0.111, 0.1, 0.063, 0.027]), ...eyes([0, 1.444, 1.298], 0.225, 0.047), tapered("闪兽细短而不粗重支撑的尾", hide, [[0, 1.022, -0.976], [0.035, 0.65, -1.178], [0.058, 0.319, -1.189]], [0.065, 0.04, 0.013])];
  for (const side of [-1, 1]) {
    parts.push(lobe("闪兽高颅后方的小外耳", dark, [side * 0.238, 1.495, 1.012], [0.106, 0.164, 0.095]), tapered("闪兽与重躯相比细弱的前肢长轴", hide, [[side * 0.32, 1.02, 0.526], [side * 0.405, 0.57, 0.454], [side * 0.415, 0.145, 0.64]], [0.155, 0.105, 0.07]), tapered("闪兽更细且后移的后肢", hide, [[side * 0.28, 0.906, -0.771], [side * 0.355, 0.478, -0.67], [side * 0.365, 0.13, -0.803]], [0.13, 0.085, 0.06]), lobe("闪兽可能包覆弱小指骨而非象式巨柱足的前足软垫", hide, [side * 0.415, 0.094, 0.655], [0.295, 0.187, 0.36]), lobe("闪兽轻小后足的完整跟趾软垫", hide, [side * 0.365, 0.074, -0.76], [0.242, 0.146, 0.355]));
    const nails: ModelPart[] = [];
    for (let index = -2; index <= 2; index++) nails.push(lobe("闪兽前掌五趾软垫前缘分别露出的小甲", dark, [side * 0.415 + index * 0.047, 0.062, 0.777 - Math.abs(index) * 0.016], [0.04, 0.064, 0.072]));
    parts.push(combineMeshes("闪兽已知五指前掌的独立甲缘", dark, nails), tapered("闪兽由上颌长出并下弯的粗犬齿长牙", pale, [[side * 0.188, 1.176, 1.398], [side * 0.242, 0.986, 1.517], [side * 0.266, 0.824, 1.584], [side * 0.252, 0.767, 1.566]], [0.066, 0.055, 0.028, 0.002]), tapered("闪兽由下颌前伸并与上犬齿咬合的下长牙", pale, [[side * 0.153, 1.003, 1.431], [side * 0.179, 1.033, 1.627], [side * 0.207, 1.108, 1.716]], [0.052, 0.036, 0.002]));
  }
  // ACT: 以Field Museum完整标本约1.37米肩高、2.88米躯长校准垂直比例；不是新增高矮状态。
  for (const value of parts) { value.position.y *= 0.88; value.scale.y *= 0.88; }
  return parts;
}

// https://www.nps.gov/agfo/planyourvisit/park-brochure.htm
// https://doi.org/10.1111/joa.13815
function moropus(): ModelPart[] {
  const parts: ModelPart[] = [lobe("石爪兽长柱肢上方的深胸和较短腰", hide, [0, 1.49, -0.115], [1.12, 1.35, 2.48], [-7, 0, 0]), lobe("石爪兽高于后背的宽前肩", hide, [0, 1.795, 0.645], [0.93, 1.0, 1.09]), tapered("石爪兽较旧爪兽更长且粗的上举颈", hide, [[0, 1.87, 0.8], [0, 2.274, 1.148], [0, 2.469, 1.492]], [0.345, 0.25, 0.185]), lobe("石爪兽后脑宽而前脸长的马形颅", hide, [0, 2.479, 1.789], [0.49, 0.54, 0.95]), lobe("石爪兽厚上唇覆盖的长钝鼻吻", pale, [0, 2.298, 2.152], [0.31, 0.27, 0.36]), ...eyes([0, 2.59, 1.891], 0.173, 0.046), tapered("石爪兽短而不拖地的细尾", hide, [[0, 1.48, -1.11], [0.035, 1.11, -1.327], [0.05, 0.905, -1.342]], [0.075, 0.047, 0.016])];
  for (const side of [-1, 1]) {
    parts.push(leaf("石爪兽长颅后上方的小尖耳", pale, [side * 0.173, 2.649, 1.484], 0.145, 0.255, [-18, side * 15, -side * 16]), tapered("石爪兽前肢保持长柱状且不以拳背承重", hide, [[side * 0.326, 1.805, 0.724], [side * 0.43, 1.002, 0.596], [side * 0.441, 0.3, 0.873], [side * 0.447, 0.124, 1.021]], [0.204, 0.151, 0.1, 0.088]), tapered("石爪兽明显长于旧爪兽短后腿的粗长后肢", hide, [[side * 0.34, 1.418, -0.811], [side * 0.48, 0.862, -0.581], [side * 0.461, 0.335, -0.995], [side * 0.449, 0.122, -0.845]], [0.24, 0.165, 0.102, 0.083]));
    for (const front of [true, false]) {
      const x = side * (front ? 0.447 : 0.449), z = front ? 1.021 : -0.845, digits: ModelPart[] = [];
      parts.push(lobe("石爪兽腕踝抬起而由趾腹支承的完整掌部", hide, [x, 0.106, z + 0.025], [0.285, 0.198, 0.34]));
      for (let index = -1; index <= 1; index++) {
        const toeX = x + index * 0.086, end = z + 0.195 - Math.abs(index) * 0.025;
        digits.push(tapered("石爪兽三枚腹面接地而远端可抬举的粗指趾", hide, [[x + index * 0.04, 0.12, z], [toeX, 0.078, end - 0.05], [toeX, 0.143, end]], [0.065, 0.048, 0.038]));
        const claw = polygon("石爪兽抬离地面而非伸入地中的侧扁弯爪", pale, [[0.139, end - 0.02], [0.219, end + 0.025], [0.288, end + 0.079], [0.305, end + 0.141], [0.26, end + 0.112], [0.19, end + 0.067], [0.13, end + 0.012]], 0.039, [toeX + 0.0195, 0, 0]);
        claw.rotation.z = 90;
        parts.push(claw);
      }
      parts.push(combineMeshes("石爪兽完整三趾腹支承足而非拳背", hide, digits));
    }
  }
  return parts;
}

// https://zmmu.msu.ru/rjt/articles/ther20_2_173-182.pdf
// ACT: 额顶骨穹隆有化石约束，角质外形未保存；取低矮覆盖复原，不把旧想象的米级独角当确定骨学。
function elasmotherium(): ModelPart[] {
  const parts: ModelPart[] = [lobe("板齿犀高前胸而向后收窄的长重躯", hide, [0, 1.365, -0.29], [1.54, 1.77, 3.16], [-7, 0, 0]), lobe("板齿犀厚颈根上方显著隆起的高前肩", hide, [0, 1.703, 0.683], [1.3, 1.22, 1.29]), tapered("板齿犀支承低长头颅的短而特别强壮的颈", hide, [[0, 1.626, 0.864], [0, 1.477, 1.378]], [0.455, 0.337]), lobe("板齿犀面部长于脑颅而非现代犀牛短宽脸的长颅", hide, [0, 1.209, 1.857], [0.61, 0.573, 1.08], [10, 0, 0]), lobe("板齿犀鼻骨上方有化石证据的宽大额顶骨穹隆", hide, [0, 1.59, 1.629], [0.672, 0.644, 0.686]), lobe("板齿犀骨穹隆表面保守推定的低厚角质覆盖", dark, [0, 1.789, 1.577], [0.59, 0.392, 0.583]), lobe("板齿犀向地面伸出的窄长唇吻", pale, [0, 1.01, 2.326], [0.392, 0.28, 0.416]), lobe("板齿犀鼻吻前端较小的角质鼻垫复原", dark, [0, 1.135, 2.408], [0.172, 0.112, 0.197]), ...eyes([0, 1.383, 1.956], 0.227, 0.051), tapered("板齿犀与现代象尾不同的细长尾及小尾束", hide, [[0, 1.32, -1.654], [0.065, 0.842, -1.98], [0.098, 0.48, -2.023]], [0.084, 0.049, 0.017]), lobe("板齿犀细尾最末端的小毛束", dark, [0.098, 0.465, -2.023], [0.091, 0.22, 0.095])];
  for (const side of [-1, 1]) {
    parts.push(leaf("板齿犀长头后方的小外耳", pale, [side * 0.255, 1.491, 1.354], 0.185, 0.3, [-27, side * 15, -side * 28]), tapered("板齿犀负担高肩的粗长前肢", hide, [[side * 0.433, 1.39, 0.737], [side * 0.552, 0.712, 0.65], [side * 0.566, 0.162, 0.856]], [0.255, 0.182, 0.108]), tapered("板齿犀较低后躯下的收束后肢", hide, [[side * 0.411, 1.143, -1.245], [side * 0.545, 0.662, -1.086], [side * 0.538, 0.159, -1.308]], [0.244, 0.169, 0.103]));
    threeToedRhinoFoot(parts, [side * 0.566, 0.162, 0.856], 0.184, 0.386);
    threeToedRhinoFoot(parts, [side * 0.538, 0.159, -1.308], 0.174, 0.363);
    parts.push(lobe("板齿犀狭长鼻吻两侧的真实鼻孔位置", dark, [side * 0.127, 1.057, 2.478], [0.062, 0.034, 0.018]));
  }
  return parts;
}

// https://www.floridamuseum.ufl.edu/florida-vertebrate-fossils/species/teleoceras-proterum/
// https://museum.unl.edu/ashfall/about-ashfall/
function teleoceras(): ModelPart[] {
  const parts: ModelPart[] = [lobe("远角犀横宽大腹几乎压到短肢膝部的长桶躯", hide, [0, 0.855, -0.16], [1.36, 1.28, 2.67]), tapered("远角犀低平肩前向地面延伸的短宽颈", hide, [[0, 0.939, 0.726], [0, 0.864, 1.136]], [0.332, 0.256]), lobe("远角犀低于背线而长深的窄顶颅", hide, [0, 0.845, 1.531], [0.588, 0.594, 0.969], [10, 0, 0]), lobe("远角犀厚唇前探而不具河马宽扁鼻盘的长吻", pale, [0, 0.636, 1.927], [0.409, 0.289, 0.42]), lobe("远角犀容纳前伸门齿的深下颌", hide, [0, 0.523, 1.64], [0.43, 0.236, 0.706]), tapered("远角犀吻端较小而不等同现代犀牛双角的鼻角", dark, [[0, 1.018, 1.874], [0, 1.154, 1.898], [0, 1.209, 1.87]], [0.092, 0.046, 0.0015]), ...eyes([0, 1.015, 1.563], 0.22, 0.046), tapered("远角犀短而低垂的尾轴", hide, [[0, 0.862, -1.282], [0.05, 0.543, -1.484], [0.078, 0.27, -1.477]], [0.067, 0.044, 0.014]), lobe("远角犀小尾末端毛簇", dark, [0.078, 0.257, -1.477], [0.075, 0.166, 0.08])];
  for (const side of [-1, 1]) {
    parts.push(leaf("远角犀头后短小椭圆耳", pale, [side * 0.245, 1.025, 1.18], 0.152, 0.215, [-25, side * 15, -side * 32]), tapered("远角犀极短而粗壮的前肢骨段外廓", hide, [[side * 0.383, 0.858, 0.737], [side * 0.505, 0.457, 0.683], [side * 0.508, 0.157, 0.882]], [0.238, 0.187, 0.117]), tapered("远角犀大腹侧方短而外展的后肢", hide, [[side * 0.375, 0.795, -0.913], [side * 0.514, 0.419, -0.773], [side * 0.503, 0.151, -0.948]], [0.246, 0.184, 0.114]));
    threeToedRhinoFoot(parts, [side * 0.508, 0.157, 0.882], 0.192, 0.352);
    threeToedRhinoFoot(parts, [side * 0.503, 0.151, -0.948], 0.187, 0.34);
    parts.push(tapered("远角犀从下颌第二门齿而非犬齿形成的前伸獠牙", pale, [[side * 0.131, 0.548, 1.903], [side * 0.161, 0.596, 2.101], [side * 0.157, 0.673, 2.164]], [0.041, 0.027, 0.0015]), lobe("远角犀吻端两侧鼻孔", dark, [side * 0.138, 0.674, 2.082], [0.055, 0.027, 0.018]));
  }
  return parts;
}

export const largeAncientMammalExpansionBatchOneDesigns: MasterNatureDesign[] = [
  design("barylambda", "笨脚兽", "动物", barylambda, ["Barylambda faberi", "小颅巨桶躯巨大后肢与粗长尾", "五趾跖行蹄甲", "骨学约束的完整软组织简化复原"]),
  design("coryphodon", "冠齿兽", "动物", coryphodon, ["Coryphodon", "宽平顶巨颅短犬齿五指前趾行后跖行足", "无骨角的低宽钝脚躯", "骨学约束的完整软组织简化复原"]),
  design("astrapotherium", "闪兽", "动物", astrapotherium, ["Astrapotherium magnum", "长重前躯与细肢小足上下四犬齿长牙", "短柔鼻和足垫为软组织推定", "骨学约束的完整软组织简化复原"]),
  design("moropus", "石爪兽", "动物", moropus, ["Moropus elatus", "长柱肢长颈马形颅及三趾腹承重足", "末端上抬侧扁弯爪不作拳背步行", "骨学约束的完整软组织简化复原"]),
  design("elasmotherium", "板齿犀", "动物", elasmotherium, ["Elasmotherium sibiricum", "长低颅额顶骨穹隆与高肩三趾长肢", "角质外形未保存采用保守低覆盖", "骨学约束的完整软组织简化复原"]),
  design("teleoceras", "远角犀", "动物", teleoceras, ["Teleoceras fossiger", "极短粗肢长桶腹三蹄趾及低深长头", "下第二门齿形成獠牙而非犬齿", "骨学约束的完整软组织简化复原"]),
];
