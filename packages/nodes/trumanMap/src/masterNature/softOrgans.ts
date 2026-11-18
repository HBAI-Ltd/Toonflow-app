import { combineMeshes, design, lobe, part, polygon, sweptProfile, tapered } from "./shared";
import type { MasterNatureDesign, ModelPart, Triple } from "./shared";

const flesh = "#b79d91";
const pale = "#c7b7a3";
const vessel = "#938f89";
const fold = "#a78f83";

function plate(name: string, outline: [number, number][], depth: number, root: Triple, color = flesh): ModelPart {
  const value = polygon(name, color, outline.map(([x, y]) => [x, -y]), depth, [root[0], root[1], root[2] - depth * 0.5]);
  value.rotation.x = 90;
  return value;
}

function duct(name: string, path: Triple[], radius: number, color = vessel): ModelPart {
  return tapered(name, color, path, path.map(() => radius));
}

function heart(): ModelPart[] {
  const parts = [tapered("心尖至宽阔心室基部", flesh, [[-0.018, 0, 0.008], [-0.005, 0.035, 0.006], [0.01, 0.075, 0], [0, 0.095, 0]], [0.002, 0.027, 0.044, 0.031]), lobe("左心室厚壁外形", "#ad9488", [-0.018, 0.05, 0.012], [0.065, 0.1, 0.065]), lobe("右心房耳状部", pale, [0.035, 0.092, 0.009], [0.04, 0.037, 0.038]), lobe("左心耳", pale, [-0.035, 0.092, 0], [0.028, 0.026, 0.03]), duct("升主动脉与主动脉弓", [[-0.008, 0.087, 0], [-0.007, 0.126, 0], [0.017, 0.143, 0], [0.042, 0.126, -0.008], [0.042, 0.08, -0.018]], 0.01), duct("肺动脉干", [[0.009, 0.085, 0.025], [0.009, 0.112, 0.028], [-0.032, 0.115, 0.02]], 0.008), duct("上腔静脉", [[0.035, 0.09, -0.006], [0.035, 0.132, -0.006]], 0.008)];
  for (let i = 0; i < 3; i++) parts.push(duct("主动脉弓分支", [[0.003 + i * 0.014, 0.134, -0.002], [-0.002 + i * 0.014, 0.157, -0.007]], 0.003));
  parts.push(duct("前室间沟表面冠状血管", [[0.023, 0.088, 0.036], [0.008, 0.06, 0.038], [-0.018, 0.02, 0.024]], 0.0017));
  return parts;
}

function brain(): ModelPart[] {
  const parts: ModelPart[] = [];
  for (const side of [-1, 1]) {
    parts.push(lobe("由纵裂隔开的左或右大脑半球", flesh, [side * 0.034, 0.07, 0], [0.075, 0.105, 0.16]));
    const folds = Array.from({ length: 8 }, (_, i) => {
      const z = -0.057 + i * 0.016;
      return tapered("绕半球外侧的短弯脑回", pale, [[side * 0.014, 0.11 - Math.abs(z) * 0.24, z], [side * 0.044, 0.113 - Math.abs(z) * 0.18, z + 0.006], [side * 0.063, 0.083, z + 0.003], [side * 0.054, 0.053, z + 0.009]], [0.005, 0.006, 0.006, 0.004]);
    });
    parts.push(combineMeshes("连续的半球表面沟回", pale, folds), lobe("后下方小脑半球", "#ae9b8c", [side * 0.025, 0.032, -0.055], [0.057, 0.05, 0.06]));
    for (let row = 0; row < 4; row++) parts.push(duct("小脑横向叶片沟", [[side * 0.002, 0.023 + row * 0.007, -0.075], [side * 0.028, 0.021 + row * 0.007, -0.08], [side * 0.047, 0.025 + row * 0.007, -0.065]], 0.0014, fold));
  }
  parts.push(tapered("脑干与延髓", pale, [[0, 0.052, -0.035], [0, 0.025, -0.035], [0.005, 0, -0.045]], [0.014, 0.01, 0.006]));
  return parts;
}

function lungs(): ModelPart[] {
  const parts: ModelPart[] = [];
  for (const side of [-1, 1]) {
    const x = side * 0.063;
    parts.push(tapered("肺尖渐细的肺叶主体", flesh, [[x, 0.025, 0], [x + side * 0.012, 0.07, 0], [x, 0.15, 0], [x - side * 0.015, 0.205, -0.008]], [0.04, 0.047, 0.037, 0.007]));
    parts.push(lobe("斜裂下方下肺叶", "#ae998f", [x + side * 0.012, 0.045, -0.025], [0.105, 0.105, 0.11]), duct("左右主支气管", [[0, 0.175, 0.015], [side * 0.026, 0.145, 0.012], [x - side * 0.025, 0.115, 0.006]], 0.007, pale));
    if (side === 1) parts.push(lobe("右肺水平裂分出的中叶", pale, [0.07, 0.083, 0.028], [0.084, 0.059, 0.064]));
    else parts.push(tapered("左肺心切迹外侧舌叶", pale, [[-0.04, 0.105, 0.032], [-0.049, 0.065, 0.045], [-0.035, 0.04, 0.036]], [0.014, 0.012, 0.003]));
  }
  parts.push(duct("气管至隆嵴", [[0, 0.235, 0.012], [0, 0.175, 0.015]], 0.009, pale));
  return parts;
}

function digestive(kind: number): ModelPart[] {
  const parts: ModelPart[] = [];
  if (kind === 0) {
    parts.push(plate("肝脏宽厚楔形右叶", [[-0.13, 0.05], [-0.11, 0.1], [-0.035, 0.125], [0.025, 0.1], [0.018, 0.045], [-0.02, 0.005], [-0.1, 0.008]], 0.075, [0, 0, 0]), lobe("肝脏较薄的左叶", flesh, [0.055, 0.065, 0], [0.17, 0.075, 0.115], [0, 0, -12]), lobe("肝门下方尾状叶", fold, [-0.025, 0.025, -0.032], [0.055, 0.045, 0.045]), duct("肝门血管短干", [[-0.015, 0.04, 0.026], [-0.015, 0.007, 0.045]], 0.009), duct("镰状韧带外缘", [[0.006, 0.025, 0.039], [0.013, 0.06, 0.04], [-0.009, 0.1, 0.03]], 0.0016, pale));
  } else if (kind === 1) {
    parts.push(plate("肾脏有凹陷肾门的豆形轮廓", [[-0.03, -0.048], [0.005, -0.052], [0.026, -0.03], [0.027, 0.004], [0.014, 0.048], [-0.013, 0.055], [-0.035, 0.035], [-0.035, 0.012], [-0.016, 0.004], [-0.016, -0.01], [-0.038, -0.025]], 0.025, [0, 0.055, -0.012]), lobe("肾皮质凸侧圆弧", flesh, [0.006, 0.055, 0], [0.055, 0.11, 0.045]), duct("肾门动脉", [[-0.021, 0.057, 0], [-0.051, 0.059, 0.004]], 0.003), duct("肾门静脉", [[-0.021, 0.05, 0.007], [-0.05, 0.05, 0.01]], 0.004), duct("输尿管起始部", [[-0.024, 0.048, -0.003], [-0.039, 0.029, 0], [-0.04, 0.003, 0]], 0.0025, pale));
  } else if (kind === 2) {
    parts.push(tapered("胃底胃体至幽门的J形囊", flesh, [[-0.024, 0.145, 0], [-0.05, 0.14, 0], [-0.071, 0.095, 0], [-0.052, 0.04, 0.006], [-0.01, 0.025, 0.012], [0.033, 0.046, 0.014], [0.054, 0.061, 0.01]], [0.013, 0.038, 0.042, 0.034, 0.025, 0.015, 0.009]), duct("食管连接贲门", [[-0.017, 0.12, 0], [-0.017, 0.175, -0.006]], 0.011, pale), duct("幽门后十二指肠起段", [[0.049, 0.059, 0.01], [0.075, 0.062, 0.01], [0.09, 0.035, 0.01]], 0.009, pale), duct("胃小弯凹侧血管", [[-0.012, 0.12, 0.023], [-0.016, 0.078, 0.031], [0.028, 0.058, 0.027]], 0.0016, fold));
  } else if (kind === 3) {
    parts.push(tapered("胰头向胰尾渐细的扁长腺体", pale, [[-0.075, 0.023, 0], [-0.048, 0.024, 0], [0, 0.033, 0], [0.052, 0.045, 0], [0.086, 0.049, 0]], [0.025, 0.019, 0.016, 0.011, 0.002]), lobe("胰头钩突", flesh, [-0.048, 0.012, 0.014], [0.04, 0.025, 0.04]));
    for (let i = 0; i < 11; i++) parts.push(lobe("胰腺表面小叶", "#b9ab92", [-0.065 + i * 0.013, 0.029 + i * 0.0015, i % 2 ? 0.01 : -0.006], [0.029 - i * 0.001, 0.024 - i * 0.001, 0.025]));
  } else if (kind === 4) {
    parts.push(tapered("脾脏弯曲扁卵形主体", fold, [[-0.025, 0.008, 0], [-0.036, 0.04, 0], [-0.022, 0.09, 0], [0.008, 0.113, 0]], [0.008, 0.029, 0.03, 0.005]), duct("脾门血管", [[0, 0.045, 0], [0.028, 0.042, 0.006]], 0.004));
    for (let i = 0; i < 3; i++) parts.push(duct("脾门分支", [[0.014, 0.044, 0.005], [0.003, 0.031 + i * 0.016, 0.007]], 0.002));
  } else if (kind === 5) {
    parts.push(tapered("胆囊圆底向细颈收束", "#9fa48b", [[-0.016, 0.016, 0], [-0.018, 0.04, 0], [0, 0.07, 0], [0.017, 0.079, 0]], [0.01, 0.018, 0.009, 0.003]), duct("胆囊管弯颈", [[0.017, 0.079, 0], [0.023, 0.09, 0.003], [0.017, 0.103, 0]], 0.0023, pale), duct("汇入肝总管的胆管", [[0.017, 0.12, 0], [0.017, 0.103, 0], [0.024, 0.083, 0]], 0.0027, pale));
  } else if (kind === 6) {
    const path: Triple[] = [];
    for (let i = 0; i <= 48; i++) { const t = i / 48; path.push([Math.sin(t * Math.PI * 10) * (0.045 + Math.sin(t * Math.PI) * 0.015), 0.02 + Math.sin(t * Math.PI * 3) * 0.007, -0.11 + t * 0.22]); }
    parts.push(tapered("小肠相连盘绕的空肠回肠", flesh, path, path.map(() => 0.009)), polygon("扇形肠系膜", pale, [[0, -0.095], [-0.062, -0.04], [-0.06, 0.05], [0, 0.11], [0.06, 0.06], [0.05, -0.04]], 0.002, [0, 0.014, 0]));
  } else {
    const path: Triple[] = [[-0.082, 0.02, -0.075], [-0.09, 0.02, -0.02], [-0.082, 0.025, 0.065], [-0.045, 0.028, 0.095], [0.03, 0.025, 0.095], [0.08, 0.022, 0.065], [0.075, 0.02, -0.055], [0.042, 0.02, -0.09], [0.025, 0.02, -0.11], [0.025, 0.02, -0.145]];
    parts.push(tapered("盲肠升横降乙状结肠连续管", flesh, path, path.map(() => 0.016)), duct("盲肠末端阑尾", [[-0.082, 0.02, -0.075], [-0.092, 0.017, -0.105], [-0.073, 0.018, -0.12]], 0.003));
    for (let i = 0; i < path.length - 1; i++) { const a = path[i]!, b = path[i + 1]!; for (let j = 0; j < 3; j++) { const t = j / 3; parts.push(lobe("结肠袋状膨出", pale, [a[0] * (1 - t) + b[0] * t, a[1] * (1 - t) + b[1] * t, a[2] * (1 - t) + b[2] * t], [0.043, 0.036, 0.041])); } }
  }
  return parts;
}

function gland(kind: number): ModelPart[] {
  const parts: ModelPart[] = [];
  if (kind === 0) {
    parts.push(lobe("膀胱圆顶可扩张囊体", flesh, [0, 0.06, 0], [0.085, 0.095, 0.075]), tapered("膀胱底与向下收窄膀胱颈", pale, [[0, 0.048, 0], [0, 0.022, 0], [0, 0.005, 0]], [0.032, 0.018, 0.005]));
    for (const side of [-1, 1]) parts.push(duct("进入膀胱后壁的输尿管", [[side * 0.018, 0.055, -0.021], [side * 0.035, 0.07, -0.029], [side * 0.04, 0.1, -0.025]], 0.0028, vessel));
  } else if (kind === 1) {
    for (const side of [-1, 1]) parts.push(tapered("甲状腺蝶翼状侧叶", flesh, [[side * 0.014, 0.006, 0], [side * 0.022, 0.028, 0], [side * 0.019, 0.055, 0], [side * 0.011, 0.066, 0]], [0.005, 0.012, 0.009, 0.002]));
    parts.push(duct("连接左右叶的峡部", [[-0.02, 0.025, 0.002], [0, 0.024, 0.008], [0.02, 0.025, 0.002]], 0.0055, pale));
  } else {
    for (const side of [-1, 1]) { parts.push(tapered("胸腺双侧向上收尖叶", pale, [[side * 0.022, 0.015, 0], [side * 0.021, 0.052, 0], [side * 0.009, 0.091, 0]], [0.018, 0.016, 0.002])); for (let i = 0; i < 6; i++) parts.push(lobe("胸腺表面分隔小叶", flesh, [side * (0.017 + Math.sin(i) * 0.005), 0.015 + i * 0.012, 0.009], [0.024 - i * 0.002, 0.022, 0.015])); }
  }
  return parts;
}

function sensory(kind: number): ModelPart[] {
  const parts: ModelPart[] = [];
  if (kind === 0) {
    parts.push(plate("喉部甲状软骨盾形前板", [[-0.017, 0], [-0.022, 0.025], [-0.009, 0.042], [0, 0.035], [0.009, 0.042], [0.022, 0.025], [0.017, 0]], 0.006, [0, 0.02, 0]), part("下方完整环状软骨", "torus", pale, [0, 0.014, 0.008], [0.031, 0.024, 0.009], [90, 0, 0]), lobe("向上竖起的叶状会厌", pale, [0, 0.062, -0.01], [0.023, 0.039, 0.005]));
    for (const side of [-1, 1]) parts.push(tapered("甲状软骨上角", pale, [[side * 0.018, 0.037, -0.005], [side * 0.018, 0.063, -0.007]], [0.0025, 0.001]), lobe("杓状软骨", flesh, [side * 0.006, 0.026, -0.006], [0.01, 0.015, 0.01]));
  } else if (kind === 1) {
    parts.push(sweptProfile("气管贯通管腔薄壁", pale, [[0.01, 0], [0.01, 0.11], [0.008, 0.11], [0.008, 0]], Math.PI * 2));
    for (let i = 0; i < 14; i++) { const ring = sweptProfile("后侧开口的C形软骨环", flesh, [[0.01, 0], [0.0115, 0], [0.0115, 0.004], [0.01, 0.004]], Math.PI * 1.65, 14); ring.position.y = 0.003 + i * 0.0075; ring.rotation.y = 32; parts.push(ring); }
    for (const side of [-1, 1]) parts.push(duct("隆嵴下分叉主支气管", [[0, 0.005, 0], [side * 0.018, -0.019, 0], [side * 0.033, -0.036, 0]], 0.0065, pale));
  } else if (kind === 2) {
    parts.push(part("眼球巩膜球体", "sphere", "#d1cdb9", [0, 0.013, 0], [0.024, 0.024, 0.024]), lobe("前方角膜隆起", "#c0c5b2", [0, 0.013, 0.011], [0.012, 0.012, 0.006]), part("虹膜环", "torus", "#889b8b", [0, 0.013, 0.0131], [0.008, 0.008, 0.003]), lobe("瞳孔", "#465751", [0, 0.013, 0.014], [0.0038, 0.0038, 0.0013]), duct("后方视神经", [[0.002, 0.013, -0.01], [0.005, 0.013, -0.022], [0.006, 0.008, -0.033]], 0.0025, pale));
  } else if (kind === 3) {
    const spiral: Triple[] = Array.from({ length: 25 }, (_, i) => { const a = i / 24 * Math.PI * 5; const r = 0.0055 * (1 - i / 28); return [0.009 + Math.cos(a) * r, 0.009 + Math.sin(a) * r, i * 0.00015]; });
    parts.push(duct("耳蜗两圈半连续螺旋", spiral, 0.0012, pale), lobe("前庭连接部", flesh, [0, 0.012, 0], [0.008, 0.012, 0.008]));
    for (let axis = 0; axis < 3; axis++) { const path: Triple[] = Array.from({ length: 15 }, (_, i) => { const a = i / 14 * Math.PI * 1.7; const r = 0.007; return axis === 0 ? [Math.cos(a) * r, 0.019 + Math.sin(a) * r, 0] : axis === 1 ? [0, 0.019 + Math.sin(a) * r, Math.cos(a) * r] : [Math.cos(a) * r, 0.013, Math.sin(a) * r]; }); parts.push(duct("相互垂直的半规管", path, 0.0008, flesh)); }
  } else if (kind === 4) {
    parts.push(plate("耳廓外形薄软骨底", [[-0.012, 0], [-0.019, 0.018], [-0.019, 0.047], [-0.008, 0.063], [0.011, 0.06], [0.02, 0.04], [0.014, 0.018], [0.009, 0]], 0.003, [0, 0, 0]));
    parts.push(duct("耳轮卷起的完整外缘", [[0.008, 0.007, 0.003], [-0.008, 0.002, 0.003], [-0.018, 0.025, 0.004], [-0.016, 0.053, 0.004], [-0.005, 0.062, 0.004], [0.01, 0.058, 0.004], [0.018, 0.042, 0.004], [0.011, 0.028, 0.005]], 0.0025, pale), duct("分叉对耳轮", [[-0.001, 0.016, 0.006], [-0.009, 0.034, 0.008], [-0.003, 0.049, 0.006]], 0.0025, pale), duct("对耳轮上分叉", [[-0.009, 0.034, 0.008], [0.007, 0.044, 0.007]], 0.0018, pale), lobe("耳垂", flesh, [0, 0.005, 0.001], [0.022, 0.017, 0.009]), lobe("耳屏", pale, [0.011, 0.023, 0.008], [0.009, 0.013, 0.009]));
  } else {
    const body = tapered("舌根至扁平舌尖的肌性主体", flesh, [[0, 0.016, -0.045], [0, 0.018, -0.015], [0, 0.014, 0.025], [0, 0.011, 0.055]], [0.025, 0.029, 0.023, 0.006]); body.scale.y = 0.4; parts.push(body);
    for (const side of [-1, 1]) for (let i = 0; i < 5; i++) parts.push(lobe("舌背粗糙乳头", pale, [side * (0.007 + i % 2 * 0.006), 0.017 - i * 0.0006, -0.023 + i * 0.015], [0.0035, 0.0025, 0.004]));
    parts.push(duct("舌背正中沟", [[0, 0.018, -0.025], [0, 0.017, 0.005], [0, 0.012, 0.04]], 0.001, fold));
  }
  return parts;
}

const digestiveNames = [["liverOrgan", "肝脏"], ["kidneyOrgan", "肾脏"], ["stomachOrgan", "胃"], ["pancreasOrgan", "胰腺"], ["spleenOrgan", "脾脏"], ["gallbladderOrgan", "胆囊"], ["smallIntestineOrgan", "小肠"], ["colonOrgan", "结肠"]];
const glandNames = [["urinaryBladderOrgan", "膀胱"], ["thyroidOrgan", "甲状腺"], ["thymusOrgan", "胸腺"]];
const sensoryNames = [["larynxOrgan", "喉"], ["tracheaOrgan", "气管"], ["eyeballOrgan", "眼球"], ["innerEarOrgan", "内耳"], ["auricleOrgan", "耳廓"], ["tongueOrgan", "舌"]];

export const softOrganDesigns: MasterNatureDesign[] = [
  design("heartOrgan", "心脏", "器物", heart, ["解剖器官模型"]),
  design("brainOrgan", "脑", "器物", brain, ["解剖器官模型"]),
  design("lungsOrgan", "肺", "器物", lungs, ["解剖器官模型"]),
  ...digestiveNames.map(([key, name], i) => design(key!, name!, "器物", () => digestive(i), ["解剖器官模型"])),
  ...glandNames.map(([key, name], i) => design(key!, name!, "器物", () => gland(i), ["解剖器官模型"])),
  ...sensoryNames.map(([key, name], i) => design(key!, name!, "器物", () => sensory(i), ["解剖器官模型"])),
];
