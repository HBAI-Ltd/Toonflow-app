import { cap, combineMeshes, design, leaf, needle, polygon } from "./shared";
import { antennae, eyes, legs, lump, pointed, transparentWings } from "./insectForms";
import { membrane } from "./animals";
import type { MasterNatureDesign, ModelPart, Triple } from "./shared";

const shell = "#a4b194";
const pale = "#c0c8aa";
const wing = "#c6cdb3";
const dark = "#8b9b86";

function beetleBody(parts: ModelPart[], width: number, length: number, y: number) {
  for (const side of [-1, 1]) parts.push(lump("中缝两侧各自闭合的鞘翅", [side * width * 0.22, y, -length * 0.17], [width * 0.57, width * 0.55, length * 0.85]));
}

function raptorialArm(parts: ModelPart[], root: Triple, side: number, size: number) {
  const elbow: Triple = [root[0] + side * size * 0.45, root[1] - size * 0.18, root[2] + size * 0.35];
  const knee: Triple = [elbow[0], root[1] + size * 0.25, root[2] + size];
  parts.push(pointed("捕捉足基节及粗大股节", shell, [root, elbow, knee], [size * 0.13, size * 0.11, size * 0.075]), pointed("可折回股节的弯钩胫节", pale, [knee, [knee[0], root[1] - size * 0.1, root[2] + size * 0.6], [knee[0], root[1] - size * 0.3, root[2] + size * 0.56]], [size * 0.055, size * 0.03, size * 0.01]));
  const teeth: ModelPart[] = []; for (let i = 0; i < 5; i++) teeth.push(needle("捕捉足内缘的咬合齿", pale, [elbow[0], elbow[1] + i * size * 0.08, elbow[2] + i * size * 0.12], [elbow[0], elbow[1] + i * size * 0.08 - size * 0.12, elbow[2] + i * size * 0.12], size * 0.04)); parts.push(combineMeshes("单只捕捉足的完整棘齿", pale, teeth));
}

function spectacularInsect(kind: number): ModelPart[] {
  const parts: ModelPart[] = [];
  if (kind === 0) {
    parts.push(lump("蚁蛉幼体宽梨形腹部", [0, 0.004, -0.003], [0.009, 0.008, 0.013]), lump("沙下伸出的扁平捕食头", [0, 0.005, 0.007], [0.008, 0.004, 0.006])); legs(parts, 3, 0.003, 0.009, 0.008, 0.0005);
    for (const side of [-1, 1]) parts.push(pointed("蚁狮向内弯曲的中空镰形颚", pale, [[side * 0.003, 0.005, 0.008], [side * 0.006, 0.005, 0.016], [side * 0.002, 0.005, 0.02]], [0.001, 0.0007, 0.00015]));
  } else if (kind === 1) {
    parts.push(lump("花生头蜡蝉胸腹", [0, 0.012, 0], [0.02, 0.019, 0.046]), pointed("中间收细而前端双鼓起的花生形头突", shell, [[0, 0.017, 0.019], [0, 0.021, 0.035], [0, 0.023, 0.059], [0, 0.023, 0.065]], [0.004, 0.0035, 0.01, 0.002])); transparentWings(parts, [0, 0.019, 0.009], 0.051, 0.029, 2); legs(parts, 3, 0.01, 0.022, 0.025, 0.0007); eyes(parts, [0, 0.017, 0.02], 0.006, 0.004);
  } else if (kind === 2) {
    parts.push(lump("球角蝉前胸小体", [0, 0.004, 0], [0.005, 0.005, 0.008]), pointed("从前胸上伸的树状盔突中轴", shell, [[0, 0.006, 0.002], [0, 0.013, 0.002], [0, 0.017, -0.005]], [0.0005, 0.0004, 0.0002]));
    for (const side of [-1, 1]) for (const end of [-1, 1]) { const p: Triple = [side * 0.006, 0.014, end * 0.005]; parts.push(pointed("盔突四向分枝", pale, [[0, 0.012, 0.002], p], [0.00035, 0.0001]), lump("盔突末端球形膨大", p, [0.003, 0.003, 0.003])); } legs(parts, 3, 0.003, 0.004, 0.005, 0.0003); transparentWings(parts, [0, 0.006, 0], 0.008, 0.004, 1);
  } else if (kind >= 3 && kind <= 6) {
    const violin = kind === 4, fan = kind === 5, oil = kind === 6;
    if (violin) {
      parts.push(lump("提琴步甲小型后躯", [0, 0.006, -0.009], [0.018, 0.012, 0.046]), pointed("提琴步甲狭长的颈与前胸", shell, [[0, 0.008, 0.009], [0, 0.01, 0.033], [0, 0.012, 0.043]], [0.004, 0.0025, 0.004]));
      for (const side of [-1, 1]) parts.push(membrane("提琴步甲侧向延伸的薄叶状鞘翅缘", wing, [[side * 0.005, 0.008, 0.01], [side * 0.03, 0.008, 0.008], [side * 0.035, 0.008, -0.026], [side * 0.022, 0.008, -0.041], [side * 0.004, 0.008, -0.027]])); legs(parts, 3, 0.006, 0.021, 0.035, 0.0008); antennae(parts, [0, 0.012, 0.043], 0.034, 0.0005);
    } else if (oil) {
      for (let i = 0; i < 7; i++) parts.push(lump("油芫菁向后膨大的节状裸腹", [0, 0.007, -0.019 + i * 0.0045], [0.009 + Math.sin((i + 1) / 8 * Math.PI) * 0.009, 0.014, 0.008]));
      parts.push(lump("油芫菁狭小前胸", [0, 0.008, 0.012], [0.008, 0.008, 0.01]), lump("油芫菁方形大头", [0, 0.009, 0.022], [0.012, 0.011, 0.012])); for (const side of [-1, 1]) parts.push(leaf("油芫菁仅覆盖腹基的短鞘翅", dark, [side * 0.002, 0.012, 0.01], 0.006, 0.011, [-90, side * 5, 0])); legs(parts, 3, 0.006, 0.015, 0.014, 0.0006); antennae(parts, [0, 0.012, 0.026], 0.013, 0.0004);
    } else {
      beetleBody(parts, fan ? 0.012 : 0.02, fan ? 0.025 : 0.04, fan ? 0.009 : 0.013); parts.push(lump("鞘翅前方小前胸和头", [0, fan ? 0.01 : 0.015, fan ? 0.012 : 0.021], fan ? [0.009, 0.01, 0.011] : [0.014, 0.013, 0.017])); legs(parts, 3, fan ? 0.008 : 0.012, fan ? 0.013 : 0.02, fan ? 0.012 : 0.025, fan ? 0.0005 : 0.0008);
      if (fan) for (const side of [-1, 1]) { const root: Triple = [side * 0.003, 0.015, 0.018]; const rays: ModelPart[] = []; for (let i = 0; i < 15; i++) { const a = i / 14 * Math.PI * 0.8; rays.push(needle("羽角甲触角扇面的梳齿", pale, root, [root[0] + side * Math.sin(a) * 0.015, root[1] + Math.cos(a) * 0.011, root[2] + i * 0.0004], 0.0004)); } parts.push(combineMeshes("每侧触角独立的羽扇面", pale, rays)); }
      else { antennae(parts, [0, 0.018, 0.026], 0.035, 0.0007); for (const side of [-1, 1]) parts.push(lump("蛙腿叶甲异常膨大的后足股节", [side * 0.019, 0.021, -0.016], [0.014, 0.018, 0.023]), pointed("肥大后股节接出的弯曲胫节", pale, [[side * 0.019, 0.018, -0.025], [side * 0.029, 0.007, -0.039], [side * 0.025, 0.002, -0.026]], [0.002, 0.0011, 0.0003])); }
    }
  } else if (kind === 7) {
    parts.push(pointed("线蛉细长胸腹轴", shell, [[0, 0.013, 0.016], [0, 0.013, -0.027]], [0.003, 0.001])); transparentWings(parts, [0, 0.016, 0.012], 0.035, 0.04, 1);
    for (const side of [-1, 1]) { parts.push(pointed("线蛉如丝带延长的后翅中轴", pale, [[side * 0.003, 0.015, 0], [side * 0.03, 0.012, -0.055], [side * 0.025, 0.009, -0.11]], [0.0005, 0.0004, 0.0001]), membrane("后翅末端变宽的飘带", wing, [[side * 0.025, 0.009, -0.075], [side * 0.032, 0.009, -0.09], [side * 0.025, 0.009, -0.115], [side * 0.02, 0.009, -0.09]])); } legs(parts, 3, 0.011, 0.012, 0.017, 0.00045); antennae(parts, [0, 0.015, 0.017], 0.028, 0.00035);
  } else {
    const whip = kind === 9;
    parts.push(lump("寄生蜂狭窄胸部", [0, 0.018, 0.007], [0.006, 0.009, 0.012]), lump("前端头颅", [0, 0.02, 0.018], [0.007, 0.007, 0.008]));
    if (whip) {
      for (let i = 0; i < 6; i++) parts.push(pointed("鞭腹蜂可活动的细长腹节", shell, [[0, 0.019 + Math.sin(i * 0.5) * 0.017, -i * 0.009], [0, 0.019 + Math.sin((i + 1) * 0.5) * 0.017, -(i + 1) * 0.009]], [0.0018 + i * 0.0001, 0.0016 + i * 0.0001]));
    } else parts.push(pointed("长颈蜂由高处连接的长腹柄和棒状腹", shell, [[0, 0.022, 0.005], [0, 0.031, -0.016], [0, 0.035, -0.041], [0, 0.03, -0.047]], [0.0013, 0.001, 0.003, 0.0006]), pointed("腹端长产卵器", pale, [[0, 0.03, -0.046], [0, 0.027, -0.075]], [0.00045, 0.0001]));
    transparentWings(parts, [0, 0.022, 0.008], whip ? 0.03 : 0.021, 0.016, 2); legs(parts, 3, 0.016, 0.013, 0.025, 0.0005); antennae(parts, [0, 0.022, 0.02], 0.02, 0.0003);
    for (const side of [-1, 1]) parts.push(lump("后腿膨大棒状胫节", [side * 0.022, 0.006, -0.016], [0.0035, 0.009, 0.004]));
  }
  return parts;
}

function camouflaged(kind: number): ModelPart[] {
  const parts: ModelPart[] = [];
  if (kind === 0) {
    parts.push(pointed("长头蚱线形躯体与狭长翅", shell, [[0, 0.017, -0.044], [0, 0.019, 0.014], [0, 0.021, 0.037]], [0.0015, 0.006, 0.004]), pointed("长头蚱向前尖伸的锥形头", pale, [[0, 0.021, 0.035], [0, 0.022, 0.067]], [0.004, 0.0006])); legs(parts, 2, 0.016, 0.021, 0.023, 0.0008);
    for (const side of [-1, 1]) parts.push(pointed("长头蚱强壮折叠的跳跃后腿", shell, [[side * 0.004, 0.019, -0.013], [side * 0.016, 0.033, -0.04], [side * 0.034, 0.002, 0.008]], [0.004, 0.0035, 0.0006])); antennae(parts, [0, 0.024, 0.052], 0.022, 0.00045);
  } else if (kind >= 1 && kind <= 3) {
    const ghost = kind === 1, violin = kind === 2;
    parts.push(pointed("螳螂长腹和前胸共同体轴", shell, [[0, 0.023, -0.038], [0, 0.03, -0.005], [0, 0.045, violin ? 0.055 : 0.024]], [ghost ? 0.01 : 0.006, 0.004, 0.0025]), lump("螳螂可转动的三角头", [0, 0.048, violin ? 0.058 : 0.028], [0.013, 0.007, 0.009])); legs(parts, 2, 0.024, 0.023, 0.035, 0.0008);
    const frontZ = violin ? 0.045 : 0.018;
    for (const side of [-1, 1]) raptorialArm(parts, [side * 0.003, 0.04, frontZ], side, 0.027);
    if (ghost) { parts.push(leaf("枯叶螳螂头顶不规则枯叶冠", pale, [0, 0.052, 0.028], 0.014, 0.029, [15, 0, -15])); for (const side of [-1, 1]) for (let i = 0; i < 3; i++) parts.push(leaf("附肢和腹缘的离散枯叶裂瓣", pale, [side * 0.01, 0.025, -0.03 + i * 0.017], 0.014, 0.02, [90, side * 80, 0])); }
    else if (violin) { for (const side of [-1, 1]) parts.push(membrane("提琴螳螂狭长前胸两侧的提琴形扩展", wing, [[side * 0.002, 0.04, 0.045], [side * 0.018, 0.039, 0.029], [side * 0.014, 0.035, 0.017], [side * 0.004, 0.034, 0.013]])); }
    else parts.push(polygon("盾背螳螂近圆盾形的扩大前胸背板", shell, [[0, -0.018], [-0.023, -0.009], [-0.026, 0.014], [-0.012, 0.029], [0.012, 0.029], [0.026, 0.014], [0.023, -0.009]], 0.003, [0, 0.03, 0]));
    antennae(parts, [0, 0.05, violin ? 0.06 : 0.03], 0.025, 0.00035);
  } else if (kind === 4) {
    parts.push(pointed("棘叶竹节虫粗壮后上弯的腹部", shell, [[0, 0.03, -0.005], [0, 0.028, -0.055], [0, 0.06, -0.087], [0, 0.08, -0.065]], [0.009, 0.016, 0.01, 0.002]), pointed("棘叶竹节虫细前胸和头", shell, [[0, 0.03, 0], [0, 0.036, 0.035], [0, 0.039, 0.049]], [0.005, 0.004, 0.006])); legs(parts, 3, 0.03, 0.045, 0.052, 0.0015);
    for (const side of [-1, 1]) for (let i = 0; i < 5; i++) parts.push(leaf("腹缘与腿节上扩展的棘叶片", pale, [side * (i < 3 ? 0.011 : 0.035), 0.035, -0.05 + i * 0.021], 0.019, 0.025, [90, side * 80, 0])); antennae(parts, [0, 0.042, 0.05], 0.012, 0.0006);
  } else if (kind === 5 || kind === 6) {
    const ambush = kind === 5;
    parts.push(lump(ambush ? "伏猎蝽短宽带棱的腹体" : "蒙面猎蝽长卵形覆翅躯体", [0, 0.007, -0.003], ambush ? [0.013, 0.008, 0.015] : [0.008, 0.009, 0.026]), pointed("窄颈连接的长头与刺吸吻", shell, [[0, 0.01, 0.005], [0, 0.013, 0.014], [0, 0.009, 0.02], [0, 0.005, 0.016]], [0.002, 0.0022, 0.001, 0.0002])); legs(parts, ambush ? 2 : 3, 0.006, 0.01, ambush ? 0.011 : 0.018, 0.0005);
    if (ambush) for (const side of [-1, 1]) raptorialArm(parts, [side * 0.003, 0.009, 0.009], side, 0.011); antennae(parts, [0, 0.013, 0.015], 0.011, 0.0003, ambush);
  } else if (kind === 7) {
    parts.push(pointed("水螳螂圆杆状胸腹", shell, [[0, 0.012, -0.036], [0, 0.014, 0.014], [0, 0.017, 0.029]], [0.0028, 0.003, 0.002]), pointed("后端两半合拢的细长呼吸管", pale, [[0, 0.012, -0.035], [0, 0.014, -0.077]], [0.0007, 0.00015])); legs(parts, 2, 0.012, 0.019, 0.036, 0.0007); for (const side of [-1, 1]) raptorialArm(parts, [side * 0.002, 0.015, 0.021], side, 0.025);
  } else if (kind === 8) {
    parts.push(lump("蛾蜡蝉被高竖双翅包覆的小体", [0, 0.005, 0], [0.006, 0.006, 0.01]));
    for (const side of [-1, 1]) parts.push(membrane("蛾蜡蝉两侧如帐篷竖起的宽三角蜡翅", wing, [[0, 0.009, 0.004], [side * 0.006, 0.002, 0.005], [side * 0.008, 0.003, -0.009], [side * 0.005, 0.011, -0.006], [0, 0.012, 0]])); legs(parts, 3, 0.003, 0.005, 0.009, 0.00035);
  } else {
    parts.push(lump("洞穴灶马高拱无翅的背部", [0, 0.015, -0.004], [0.017, 0.025, 0.032]), lump("灶马下倾头部", [0, 0.013, 0.014], [0.011, 0.014, 0.011])); legs(parts, 2, 0.012, 0.014, 0.026, 0.0008);
    for (const side of [-1, 1]) parts.push(pointed("灶马异常发达的弯曲跳跃后腿", shell, [[side * 0.005, 0.016, -0.009], [side * 0.024, 0.035, -0.033], [side * 0.046, 0.001, 0.005]], [0.005, 0.0035, 0.0005])); antennae(parts, [0, 0.02, 0.017], 0.08, 0.00045);
  }
  return parts;
}

function smallInvertebrate(kind: number): ModelPart[] {
  const parts: ModelPart[] = [];
  if (kind === 0) {
    for (let i = 0; i < 11; i++) { const p = lump("幽蚊幼体半透明胸腹节", [0, 0.0014, -0.005 + i * 0.001], [0.0017, 0.0018, 0.0016]); p.opacity = 0.38; parts.push(p); }
    parts.push(lump("前部气囊", [0, 0.0016, 0.003], [0.001, 0.001, 0.002], dark), lump("后部气囊", [0, 0.0016, -0.004], [0.001, 0.001, 0.0018], dark), lump("前端小头", [0, 0.0016, 0.006], [0.0015, 0.0015, 0.002]));
    for (const side of [-1, 1]) parts.push(pointed("捕食前附肢", pale, [[side * 0.0005, 0.0016, 0.006], [side * 0.0014, 0.0018, 0.008], [side * 0.0008, 0.0018, 0.009]], [0.00025, 0.00018, 0.00005]));
  } else if (kind === 1) {
    parts.push(pointed("长尾食蚜蝇幼体肥厚无足躯", shell, [[0, 0.004, 0.009], [0, 0.004, -0.006], [0, 0.004, -0.013]], [0.003, 0.004, 0.002]), pointed("鼠尾状可伸长的呼吸虹吸管", pale, [[0, 0.004, -0.012], [0.004, 0.005, -0.03], [0.003, 0.014, -0.052]], [0.0008, 0.00055, 0.00015]));
    for (let i = 0; i < 7; i++) parts.push(lump("幼体腹侧的爬行肉垫", [0, 0.001, -0.009 + i * 0.0025], [0.003, 0.0015, 0.002]));
  } else if (kind === 2) {
    for (let i = 0; i < 10; i++) parts.push(lump("蚰蜒背部短甲节", [0, 0.009, 0.02 - i * 0.004], [0.008, 0.009, 0.007]));
    for (const side of [-1, 1]) for (let i = 0; i < 15; i++) { const z = 0.021 - i * 0.0028, span = 0.021 + i * 0.0013; parts.push(pointed("蚰蜒逐渐延长的高架细步足", pale, [[side * 0.002, 0.009, z], [side * span * 0.5, 0.019, z - 0.004], [side * span, 0.001, z - 0.014]], [0.00055, 0.0004, 0.0001])); } antennae(parts, [0, 0.012, 0.024], 0.04, 0.0003);
  } else if (kind === 3) {
    const plate = polygon("鱼虱前部透明宽盾与后方缺刻", shell, [[0, 0.006], [-0.004, 0.004], [-0.005, 0], [-0.003, -0.004], [-0.001, -0.003], [0, -0.005], [0.001, -0.003], [0.003, -0.004], [0.005, 0], [0.004, 0.004]], 0.001); plate.opacity = 0.55; parts.push(plate);
    for (const side of [-1, 1]) { parts.push(cap("鱼虱成对的前部附着吸盘", pale, [side * 0.0017, 0.001, 0.003], 0.0012, 0.0008, 3)); for (let i = 0; i < 4; i++) parts.push(membrane("鱼虱侧向伸出的游泳足", pale, [[side * 0.002, 0.0007, 0.002 - i * 0.0017], [side * 0.008, 0.0007, -i * 0.0017], [side * 0.007, 0.0007, -0.002 - i * 0.0017]])); }
  } else if (kind === 4) {
    parts.push(pointed("骨虾修长的关节胸体", shell, [[0, 0.006, 0], [0, 0.019, 0], [0.002, 0.033, 0.001]], [0.0015, 0.0011, 0.0008]), lump("骨虾头", [0.002, 0.035, 0.001], [0.0035, 0.0035, 0.004]));
    for (const side of [-1, 1]) { raptorialArm(parts, [side * 0.001, 0.029, 0], side, 0.008); for (let i = 0; i < 3; i++) parts.push(pointed("骨虾后部三对钩状附着足", pale, [[0, 0.006 + i * 0.003, 0], [side * 0.008, 0.004 + i * 0.003, 0.002], [side * 0.005, 0.001, 0.004]], [0.00045, 0.00035, 0.0001])); parts.push(pointed("骨虾长触角", pale, [[0.002, 0.036, 0.002], [side * 0.007, 0.048, 0.004]], [0.0003, 0.00008]), lump("骨虾中段囊状鳃", [side * 0.002, 0.02, 0], [0.0025, 0.004, 0.002])); }
  } else if (kind === 5) {
    parts.push(pointed("丰年虾未覆盖甲壳的长分节体", shell, [[0, 0.004, 0.012], [0, 0.004, -0.008], [0, 0.004, -0.017]], [0.0025, 0.0017, 0.0004]), lump("丰年虾头", [0, 0.0045, 0.013], [0.005, 0.005, 0.005]));
    for (const side of [-1, 1]) { for (let i = 0; i < 11; i++) parts.push(membrane("丰年虾成对叶状胸足", pale, [[side * 0.001, 0.004, 0.009 - i * 0.0017], [side * 0.007, 0.003, 0.01 - i * 0.0017], [side * 0.008, 0.001, 0.006 - i * 0.0017], [side * 0.002, 0.002, 0.006 - i * 0.0017]])); parts.push(pointed("头部触角", pale, [[side * 0.001, 0.005, 0.014], [side * 0.005, 0.007, 0.018], [side * 0.004, 0.005, 0.019]], [0.00055, 0.0004, 0.0001]), pointed("尾部分离的尾叉", pale, [[0, 0.004, -0.016], [side * 0.003, 0.004, -0.023]], [0.0005, 0.0001])); } eyes(parts, [0, 0.0055, 0.014], 0.0033, 0.0014);
  } else if (kind === 6) {
    for (const side of [-1, 1]) { const valve = lump("蚌虾独立的侧向双瓣背甲", [side * 0.002, 0.006, 0], [0.004, 0.011, 0.016]); valve.opacity = 0.6; parts.push(valve, pointed("蚌虾从壳前部伸出的长游泳触角", pale, [[side * 0.001, 0.008, 0.005], [side * 0.006, 0.012, 0.01], [side * 0.009, 0.007, 0.012]], [0.0005, 0.00035, 0.0001])); for (let i = 0; i < 7; i++) parts.push(leaf("双瓣甲腹缘伸出的叶状小足", pale, [side * 0.001, 0.003, -0.005 + i * 0.0017], 0.0015, 0.004, [150, side * 60, 0])); }
  } else if (kind === 7) {
    for (let i = 0; i < 7; i++) parts.push(lump("鲸虱宽扁的胸节", [0, 0.003, 0.008 - i * 0.003], [0.011 - Math.abs(i - 3) * 0.001, 0.0045, 0.005]));
    for (const side of [-1, 1]) for (let i = 0; i < 5; i++) { const z = [0.008, 0.005, -0.004, -0.007, -0.01][i]!; parts.push(pointed("鲸虱末端向内钩住宿主的附肢", shell, [[side * 0.003, 0.003, z], [side * 0.009, 0.004, z + 0.002], [side * 0.008, 0.001, z + 0.006], [side * 0.005, 0.002, z + 0.006]], [0.001, 0.0008, 0.0005, 0.0001])); }
  } else if (kind === 8) {
    parts.push(lump("兜蛛分节且披硬甲的腹部", [0, 0.004, -0.003], [0.005, 0.006, 0.008]), lump("兜蛛前体", [0, 0.004, 0.002], [0.0045, 0.0045, 0.004])); legs(parts, 4, 0.003, 0.004, 0.007, 0.00035);
    parts.push(polygon("兜蛛盖住口器的可动兜状头盖", pale, [[-0.0018, -0.001], [0.0018, -0.001], [0.0013, 0.002], [0, 0.003], [-0.0013, 0.002]], 0.001, [0, 0.005, 0.004]));
  } else {
    parts.push(pointed("舌形虫扁长而逐渐收窄的蠕虫状躯体", shell, [[0, 0.006, 0.025], [0, 0.006, 0], [0, 0.005, -0.045]], [0.006, 0.008, 0.001]));
    for (let i = 0; i < 18; i++) parts.push(lump("舌形虫躯体独立的横向环褶", [0, 0.007, 0.019 - i * 0.0031], [0.012 - i * 0.0004, 0.009 - i * 0.0002, 0.0018]));
    for (const side of [-1, 1]) for (const row of [0, 1]) parts.push(pointed("围绕口孔的四枚强壮附着钩", pale, [[side * 0.003, 0.006, 0.023 + row * 0.004], [side * 0.007, 0.005, 0.028 + row * 0.003], [side * 0.004, 0.003, 0.031 + row * 0.003]], [0.0012, 0.0008, 0.0001]));
  }
  return parts;
}

const spectacularNames = [["antlion", "蚁蛉", "Myrmeleontidae 幼体造型"], ["peanutLanternfly", "花生头蜡蝉", "Fulgora laternaria"], ["bocydium", "球角蝉", "Bocydium globulare"], ["frogLegBeetle", "蛙腿叶甲", "Sagra buqueti"], ["violinBeetle", "提琴步甲", "Mormolyce phyllodes"], ["featherHornBeetle", "羽角甲", "Rhipicera"], ["oilBeetle", "油芫菁", "Meloe"], ["ribbonLacewing", "线蛉", "Nemopteridae"], ["gasteruption", "长颈蜂", "Gasteruption"], ["pelecinidWasp", "鞭腹蜂", "Pelecinus polyturator"]];
const camouflageNames = [["longHeadGrasshopper", "长头蚱", "Acrida"], ["ghostMantis", "枯叶螳螂", "Phyllocrania paradoxa"], ["violinMantis", "提琴螳螂", "Gongylus gongylodes"], ["shieldMantis", "盾背螳螂", "Choeradodis"], ["spinyLeafInsect", "棘叶竹节虫", "Extatosoma tiaratum"], ["ambushBug", "伏猎蝽（Phymata）", "Phymata"], ["maskedAssassinBug", "蒙面猎蝽", "Reduvius personatus 成虫造型"], ["waterStickInsect", "水螳螂", "Ranatra"], ["flatidPlanthopper", "蛾蜡蝉", "Metcalfa pruinosa"], ["caveCricket", "洞穴灶马", "Rhaphidophoridae"]];
const invertebrateNames = [["phantomMidge", "幽蚊", "Chaoborus 幼体造型"], ["ratTailedMaggot", "长尾食蚜蝇", "Eristalis 幼体造型"], ["houseCentipede", "蚰蜒", "Scutigera coleoptrata"], ["fishLouse", "鱼虱", "Argulus"], ["skeletonShrimp", "骨虾", "Caprella"], ["fairyShrimp", "丰年虾", "Branchinecta"], ["clamShrimp", "蚌虾", "Spinicaudata"], ["whaleLouse", "鲸虱", "Cyamus"], ["hoodedTickSpider", "兜蛛", "Ricinulei"], ["tongueWorm", "舌形虫", "Linguatula"]];

export const arthropodFormDesigns: MasterNatureDesign[] = [
  ...spectacularNames.map(([key, name, taxon], i) => design(key!, name!, "动物", () => spectacularInsect(i), ["节肢动物形态", taxon!])),
  ...camouflageNames.map(([key, name, taxon], i) => design(key!, name!, "动物", () => camouflaged(i), ["节肢动物形态", taxon!])),
  ...invertebrateNames.map(([key, name, taxon], i) => design(key!, name!, "动物", () => smallInvertebrate(i), ["小型无脊椎动物", taxon!])),
];
