import { combineMeshes, design, lobe, polygon, tapered } from "./shared";
import type { MasterNatureDesign, ModelPart, Triple } from "./shared";
import { lump, pointed } from "./insectForms";
import { convexValve } from "./bivalveArchitectures";

const armor = "#a7b299";
const pale = "#c7cbb0";
const jointColor = "#b8c3a5";

function snappingShrimp(): ModelPart[] {
  const parts: ModelPart[] = [lobe("鼓虾前缘覆盖双眼而短宽的头胸甲", armor, [0, 0.014, 0.013], [0.018, 0.02, 0.029])];
  for (let i = 0; i < 6; i++) parts.push(lobe("鼓虾向腹面稍弯而真正相接的六个腹节", armor, [0, 0.012 - i * 0.0008, -i * 0.006], [0.017 - i * 0.0013, 0.015 - i * 0.001, 0.010]));
  for (const side of [-1, 1]) { parts.push(lump("鼓虾由额甲边缘露出的短柄眼", [side * 0.005, 0.019, 0.026], [0.0035, 0.0035, 0.0035], jointColor), pointed("鼓虾前伸的长第二触角", pale, [[side * 0.005, 0.014, 0.025], [side * 0.015, 0.014, 0.045], [side * 0.023, 0.009, 0.066]], [0.0006, 0.0004, 0]));
    for (let leg = 0; leg < 4; leg++) parts.push(pointed("鼓虾第一螯足之后的四对分节胸足", jointColor, [[side * 0.005, 0.008, 0.014 - leg * 0.005], [side * 0.015, 0.006, 0.01 - leg * 0.006], [side * 0.02, 0.001, 0.023 - leg * 0.007]], [0.0011, 0.0008, 0]));
    parts.push(polygon("鼓虾尾部成对展开的宽尿肢", pale, [[side * 0.002, -0.026], [side * 0.009, -0.03], [side * 0.015, -0.044], [side * 0.005, -0.044]], 0.001, [0, 0.006, 0])); }
  parts.push(tapered("鼓虾强壮大螯足的臂节和腕节", armor, [[-0.007, 0.012, 0.016], [-0.02, 0.011, 0.023], [-0.024, 0.012, 0.038]], [0.0028, 0.0025, 0.0045]), lobe("鼓虾不对称大螯膨大的闭合肌掌部", armor, [-0.026, 0.013, 0.045], [0.015, 0.018, 0.02]));
  const cavity = polygon("鼓虾固定螯指中真正贯通并承接柱塞的凹孔", pale, [[-0.006, -0.01], [-0.007, 0.006], [-0.003, 0.014], [0.004, 0.013], [0.006, 0.006], [0.005, -0.01]], 0.003, [-0.026, 0.008, 0.058], [Array.from({ length: 12 }, (_, i) => [Math.cos(i * Math.PI / 6) * 0.0025, 0.004 + Math.sin(i * Math.PI / 6) * 0.0025])]); parts.push(cavity, tapered("鼓虾围绕螯掌上部铰点张开的可动指", pale, [[-0.028, 0.017, 0.043], [-0.027, 0.023, 0.057], [-0.025, 0.019, 0.072]], [0.0038, 0.0032, 0.0008]), lump("鼓虾可动指内侧真正突出的柱塞齿", [-0.026, 0.018, 0.062], [0.0048, 0.007, 0.0048], pale));
  parts.push(tapered("鼓虾另一侧显著较细的普通螯足", armor, [[0.006, 0.011, 0.016], [0.017, 0.009, 0.027], [0.016, 0.011, 0.045]], [0.0018, 0.0015, 0.0013]), lobe("鼓虾小螯的细长掌节", armor, [0.016, 0.011, 0.048], [0.0045, 0.005, 0.011]));
  for (const side of [-1, 1]) parts.push(pointed("鼓虾小螯真正留隙的两枚细指", pale, [[0.016 + side * 0.0015, 0.011, 0.05], [0.016 + side * 0.001, 0.011, 0.061]], [0.0008, 0])); return parts;
}

function mudLobster(): ModelPart[] {
  const parts: ModelPart[] = [lobe("泥龙虾侧面压缩而纵向高起的长头胸甲", armor, [0, 0.037, 0.035], [0.049, 0.061, 0.115]), polygon("泥龙虾前伸而不具长额剑的宽短额板", pale, [[-0.009, 0.068], [-0.011, 0.094], [-0.004, 0.106], [0.004, 0.106], [0.011, 0.094], [0.009, 0.068]], 0.007, [0, 0.048, 0])];
  for (let segment = 0; segment < 6; segment++) parts.push(lobe("泥龙虾后方硬而相接的长腹甲节", armor, [0, 0.028 - segment * 0.001, -0.014 - segment * 0.019], [0.046 - segment * 0.003, 0.035 - segment * 0.002, 0.029]));
  for (const side of [-1, 1]) { parts.push(tapered("泥龙虾短而粗的眼柄", jointColor, [[side * 0.007, 0.046, 0.075], [side * 0.014, 0.057, 0.089]], [0.003, 0.002]), lump("泥龙虾眼柄顶端小复眼", [side * 0.014, 0.057, 0.089], [0.005, 0.005, 0.005], jointColor));
    for (let leg = 0; leg < 4; leg++) parts.push(pointed("泥龙虾螯足之后用于撑洞的四对短粗足", jointColor, [[side * 0.016, 0.027, 0.05 - leg * 0.019], [side * 0.043, 0.02, 0.039 - leg * 0.021], [side * 0.049, 0.003, 0.058 - leg * 0.022]], [0.0043 - leg * 0.0003, 0.003, 0]));
    parts.push(tapered("泥龙虾强壮掘泥螯足的压扁臂节", armor, [[side * 0.018, 0.035, 0.065], [side * 0.057, 0.029, 0.088], [side * 0.048, 0.029, 0.128]], [0.009, 0.008, 0.006]), lobe("泥龙虾向前伸长的掘土螯掌", armor, [side * 0.048, 0.03, 0.145], [0.025, 0.021, 0.044]));
    for (const finger of [-1, 1]) { const p = polygon("泥龙虾螯末端真正留有夹隙的扁平铲指", pale, [[side * 0.048 + finger * 0.003, 0.152], [side * 0.048 + finger * 0.013, 0.157], [side * 0.048 + finger * 0.009, 0.185], [side * 0.048 + finger * 0.002, 0.178]], 0.005, [0, 0.028, 0]); parts.push(p); }
    parts.push(pointed("泥龙虾沿头前方伸出的细触角", pale, [[side * 0.008, 0.041, 0.089], [side * 0.029, 0.044, 0.124], [side * 0.04, 0.03, 0.156]], [0.0015, 0.0011, 0]), polygon("泥龙虾尾端短而不形成大泳扇的尿肢", pale, [[side * 0.004, -0.104], [side * 0.016, -0.109], [side * 0.019, -0.134], [side * 0.005, -0.139]], 0.003, [0, 0.02, 0])); }
  parts.push(tapered("泥龙虾长头胸甲上实际高起的正中壳脊", pale, [[0, 0.055, -0.005], [0, 0.063, 0.04], [0, 0.055, 0.078]], [0.0028, 0.003, 0.0018])); return parts;
}

function frogCrab(): ModelPart[] {
  const outline: [number, number][] = [[-0.033, -0.063], [-0.045, -0.024], [-0.049, 0.033], [-0.055, 0.057], [-0.043, 0.053], [-0.038, 0.075], [-0.026, 0.063], [-0.012, 0.086], [0, 0.073], [0.012, 0.086], [0.026, 0.063], [0.038, 0.075], [0.043, 0.053], [0.055, 0.057], [0.049, 0.033], [0.045, -0.024], [0.033, -0.063]], carapace = convexValve("蛙蟹前宽后窄而前缘有齿的纵长背甲", outline, 0.035, 0.004); carapace.position.y = 0.022; carapace.color = armor;
  const parts: ModelPart[] = [carapace, lobe("蛙蟹长甲下相连的窄胸腹板", jointColor, [0, 0.02, -0.002], [0.071, 0.024, 0.10])];
  for (const side of [-1, 1]) { parts.push(tapered("蛙蟹由前缘伸出的长眼柄", jointColor, [[side * 0.022, 0.031, 0.062], [side * 0.033, 0.052, 0.086]], [0.0035, 0.0025]), lump("蛙蟹长柄末端复眼", [side * 0.033, 0.052, 0.086], [0.009, 0.007, 0.01], jointColor));
    for (let leg = 0; leg < 4; leg++) { const z = 0.035 - leg * 0.026, wrist: Triple = [side * (0.074 - leg * 0.002), 0.012, z - 0.025]; parts.push(tapered("蛙蟹向侧后展开的压扁掘沙步足", jointColor, [[side * 0.033, 0.022, z], [side * 0.066, 0.023, z - 0.01], wrist], [0.006, 0.005, 0.003])); const paddle = polygon("蛙蟹末端真正扩展成弯镰铲片的掘沙趾", pale, [[wrist[0] - side * 0.004, wrist[2]], [wrist[0] + side * 0.011, wrist[2] - 0.003], [wrist[0] + side * 0.022, wrist[2] - 0.023], [wrist[0] + side * 0.009, wrist[2] - 0.028], [wrist[0], wrist[2] - 0.013]], 0.0025, [0, 0.01, 0]); parts.push(paddle); }
    parts.push(tapered("蛙蟹前方小而粗的螯足", armor, [[side * 0.027, 0.025, 0.045], [side * 0.061, 0.029, 0.071], [side * 0.057, 0.025, 0.107]], [0.007, 0.006, 0.005]), lobe("蛙蟹扁而短的螯掌", pale, [side * 0.057, 0.025, 0.117], [0.022, 0.014, 0.025])); for (const finger of [-1, 1]) parts.push(pointed("蛙蟹短螯末端相向但不相贴的钳指", pale, [[side * 0.057 + finger * 0.006, 0.026, 0.123], [side * 0.057 + finger * 0.0015, 0.026, 0.144]], [0.003, 0])); }
  return parts;
}

function porcelainCrab(): ModelPart[] {
  const carapace = convexValve("宽螯瓷蟹极扁而近圆的薄硬头胸甲", Array.from({ length: 20 }, (_, i) => [Math.cos(i * Math.PI / 10) * 0.007, Math.sin(i * Math.PI / 10) * 0.0077]), 0.0028, 0.0008); carapace.position.y = 0.0035; carapace.color = armor;
  const parts: ModelPart[] = [carapace, ...[-1, 1].map(side => lump("瓷蟹短柄末端的小复眼", [side * 0.0038, 0.006, 0.0067], [0.0014, 0.0014, 0.00098], jointColor))], fans: ModelPart[] = [];
  for (const side of [-1, 1]) { for (let leg = 0; leg < 3; leg++) parts.push(pointed("瓷蟹从侧缘伸出的三对真正步足", jointColor, [[side * 0.005, 0.0035, 0.002 - leg * 0.004], [side * 0.011, 0.0035, -leg * 0.005], [side * 0.015, 0.0007, 0.002 - leg * 0.005]], [0.0007, 0.0005, 0]));
    parts.push(tapered("瓷蟹折藏在后侧的退化末对清洁足", jointColor, [[side * 0.003, 0.0028, -0.004], [side * 0.005, 0.0026, -0.005], [side * 0.004, 0.0024, -0.003]], [0.0004, 0.00032, 0.00025]), tapered("瓷蟹横展的扁螯臂", armor, [[side * 0.004, 0.004, 0.004], [side * 0.011, 0.0035, 0.007], [side * 0.014, 0.0035, 0.013]], [0.0015, 0.0014, 0.0012]), lump("瓷蟹远宽于腕部而背腹压扁的大螯掌", [side * 0.015, 0.0037, 0.017], [0.010, 0.0045, 0.012], armor));
    for (const finger of [-1, 1]) parts.push(pointed("瓷蟹大扁螯末端留有真实夹隙的两指", pale, [[side * 0.015 + finger * 0.003, 0.0037, 0.02], [side * 0.015 + finger * 0.0008, 0.0037, 0.03]], [0.0015, 0]));
    parts.push(pointed("瓷蟹伸出甲外的长第二触角", pale, [[side * 0.004, 0.005, 0.005], [side * 0.007, 0.007, 0.015], [side * 0.014, 0.009, 0.03]], [0.00022, 0.00018, 0]));
    const center: Triple = [side * 0.005, 0.008, 0.011]; parts.push(tapered("瓷蟹头前上举并支撑滤食扇的第三颚足轴", jointColor, [[side * 0.002, 0.003, 0.006], center], [0.0005, 0.00035]));
    for (let seta = 0; seta < 13; seta++) { const a = -1.15 + seta / 12 * 2.3, end: Triple = [center[0] + side * Math.sin(a) * 0.004, center[1] + Math.cos(a) * 0.004, center[2] + 0.001], p = pointed("瓷蟹口肢末端真实微米尺度的独立滤食刚毛", pale, [center, end], [0.00002, 0]);
      // ACT: 刚毛基部埋在实心颚足中，省去不可见端盖；保留真实微米尺度侧壁和尖端。
      const faces: number[] = []; for (let i = 0; i < p.indices!.length; i += 3) if (!p.indices!.slice(i, i + 3).includes(8)) faces.push(...p.indices!.slice(i, i + 3)); p.indices = faces; fans.push(p); }
  }
  parts.push(combineMeshes("宽螯瓷蟹真正各自展开且留隙的两片刚毛滤食扇", pale, fans)); return parts;
}

export const decapodSpecialistDesigns: MasterNatureDesign[] = [
  design("snappingShrimp", "鼓虾", "动物", snappingShrimp, ["Alpheus", "大螯固定指凹孔与可动指柱塞齿"]),
  design("mudLobster", "泥龙虾", "动物", mudLobster, ["Thalassina anomala", "高侧压长甲与真正留隙的扁铲螯指"]),
  design("frogCrab", "蛙蟹", "动物", frogCrab, ["Ranina ranina", "长甲长眼柄及四对弯镰形掘沙末趾"]),
  design("porcelainCrab", "宽螯瓷蟹", "动物", porcelainCrab, ["Porcellana platycheles", "扁大螯三对步足退化清洁足与真滤食扇"]),
];
