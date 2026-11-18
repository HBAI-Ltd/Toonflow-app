import { combineMeshes, design, polygon, sweptProfile, tapered } from "./shared";
import type { MasterNatureDesign, ModelPart, Triple } from "./shared";
import { lump, pointed } from "./insectForms";
import { fanCap } from "./hymeniumFungi";

const cream = "#d0c9af";
const woody = "#aaa38b";
const dark = "#7e8576";

function henOfWoods(): ModelPart[] {
  const parts: ModelPart[] = [tapered("灰树花多级扇盖共用的实心粗基柄", cream, [[0, 0, 0], [0, 0.046, 0]], [0.021, 0.016])];
  for (let branch = 0; branch < 5; branch++) {
    const a = branch * Math.PI * 2 / 5, joint: Triple = [Math.cos(a) * 0.037, 0.064, Math.sin(a) * 0.037]; parts.push(tapered("灰树花由同一基柄连续分出的粗枝", cream, [[0, 0.031, 0], joint], [0.012, 0.007]));
    for (let leaf = 0; leaf < 3; leaf++) {
      const b = a + (leaf - 1) * 0.46, root: Triple = [joint[0] + Math.sin(b) * 0.012, 0.068 + leaf * 0.021, joint[2] + Math.cos(b) * 0.012], length = 0.055 + leaf * 0.006, width = 0.067 + leaf * 0.006;
      parts.push(tapered("灰树花分枝末端偏心连接扇盖的短柄", cream, [joint, root], [0.006, 0.004]));
      const top = fanCap("灰树花呈覆瓦莲座排列的宽扇状菌盖", root, length, width, 0.003, 0.004); top.color = woody; top.rotation.y = -b * 180 / Math.PI; top.vertices = top.vertices!.map(v => ({ ...v, y: v.y + Math.sin(Math.atan2(v.x, v.z) * 7) * Math.max(0, v.z / length) * 0.0014 })); parts.push(top);
      const outline: [number, number][] = [[-0.013, 0.013], [-0.02, 0.028], [-0.016, 0.042], [0, 0.049], [0.016, 0.042], [0.02, 0.028], [0.013, 0.013]], holes: [number, number][][] = [];
      for (let row = 0; row < 3; row++) for (let col = 0; col < 4; col++) { const x = (col - 1.5) * 0.006, z = 0.021 + row * 0.008; holes.push([[x - 0.00075, z - 0.001], [x + 0.00075, z - 0.001], [x + 0.00075, z + 0.001], [x - 0.00075, z + 0.001]]); }
      const pores = polygon("灰树花扇盖下面真实贯通的短菌管孔层", cream, outline, 0.0018, [root[0], root[1] + 0.0005, root[2]], holes); pores.rotation.y = top.rotation.y; pores.vertices = pores.vertices!.map(v => ({ ...v, y: v.y + Math.sin(v.z / length * Math.PI) * 0.004 })); parts.push(pores);
    }
  }
  return parts;
}

function umbrellaPolypore(): ModelPart[] {
  const parts: ModelPart[] = [tapered("猪苓子实体所有小伞共用的地上粗基柄", cream, [[0, 0, 0], [0, 0.055, 0]], [0.017, 0.013])];
  for (let branch = 0; branch < 5; branch++) {
    const a = branch * Math.PI * 2 / 5, joint: Triple = [Math.cos(a) * 0.036, 0.075, Math.sin(a) * 0.036]; parts.push(tapered("猪苓由基柄连续分出的一级枝", cream, [[0, 0.039, 0], joint], [0.009, 0.005]));
    for (let stalk = 0; stalk < 3; stalk++) { const b = a + (stalk - 1) * 0.6, x = joint[0] + Math.cos(b) * 0.025, z = joint[2] + Math.sin(b) * 0.025, y = 0.10 + stalk * 0.016; parts.push(tapered("猪苓每个独立小圆伞正中央连接的细长分枝柄", cream, [joint, [x, y, z]], [0.0045, 0.003]), sweptProfile("猪苓中央浅凹而非侧生扇叶的小圆菌盖", woody, [[0.002, y + 0.002], [0.008, y + 0.004], [0.017, y + 0.003], [0.019, y], [0.016, y - 0.001], [0.003, y]], Math.PI * 2, 16)); const top = parts.at(-1)!; top.position.x = x; top.position.z = z; }
  }
  return parts;
}

function wrinkledBell(): ModelPart[] {
  const parts: ModelPart[] = [sweptProfile("皱盖钟菌长而中空的浅色圆柄", cream, [[0.011, 0], [0.008, 0.07], [0.0045, 0.154], [0.0025, 0.154], [0.005, 0.07], [0.007, 0]], Math.PI * 2, 16)], top = sweptProfile("皱盖钟菌只在最高端接柄且下缘完全游离的中空钟盖", woody, [[0.014, 0.119], [0.017, 0.129], [0.015, 0.144], [0.009, 0.154], [0, 0.157], [0, 0.154], [0.007, 0.151], [0.012, 0.142], [0.014, 0.129], [0.011, 0.119]], Math.PI * 2, 40);
  top.vertices = top.vertices!.map(v => { const a = Math.atan2(v.z, v.x), wave = 1 + Math.cos(a * 12 + (v.y - 0.12) * 35) * 0.15 + Math.sin(a * 5 + v.y * 310) * 0.035; return { x: v.x * wave, y: v.y, z: v.z * wave }; }); parts.push(top); return parts;
}

function zombieAnt(): ModelPart[] {
  const parts: ModelPart[] = [lump("偏侧蛇虫草标本附着的蚁宿主胸部", [0, 0.0031, 0], [0.0032, 0.0038, 0.005], woody), lump("蚁宿主单节腹柄后的卵圆腹部", [0, 0.0035, -0.005], [0.0043, 0.0048, 0.006], woody), lump("蚁宿主较宽的头部", [0, 0.0032, 0.004], [0.004, 0.004, 0.0036], woody), lump("蚁宿主胸腹间收细的单节腹柄", [0, 0.0031, -0.0026], [0.0015, 0.0016, 0.002], woody)], limbs: ModelPart[] = [];
  for (const side of [-1, 1]) for (let i = 0; i < 3; i++) { const z = 0.0015 - i * 0.0014; limbs.push(pointed("蚁宿主弯曲并抓附地面的三对细足", woody, [[side * 0.0008, 0.003, z], [side * 0.0038, 0.005, z - 0.001], [side * 0.006, 0.0004, z - 0.004]], [0.00035, 0.0003, 0])); }
  for (const side of [-1, 1]) limbs.push(pointed("蚁宿主明显肘弯的触角", woody, [[side * 0.001, 0.0035, 0.005], [side * 0.003, 0.004, 0.006], [side * 0.0037, 0.003, 0.009]], [0.0003, 0.00025, 0]));
  parts.push(combineMeshes("偏侧蛇虫草蚁宿主的弯足与肘弯触角", woody, limbs), tapered("偏侧蛇虫草由蚁宿主头后长出的单根细硬子座柄", dark, [[0, 0.0043, 0.0024], [0.0004, 0.012, 0.0023], [0.0015, 0.025, 0.001], [0.0022, 0.032, -0.001]], [0.00045, 0.0004, 0.0004, 0.00025]), lump("偏侧蛇虫草单侧侧生而非环生的半球状产孢垫", [0.0025, 0.023, 0.0011], [0.003, 0.0042, 0.0033], "#969880"));
  return parts;
}

function cannonFungus(): ModelPart[] {
  const root = sweptProfile("星状弹球菌下部完整的毫米级外包被", cream, [[0, 0], [0.001, 0], [0.0015, 0.0004], [0.0015, 0.0008], [0.0012, 0.0009], [0.0007, 0.00025], [0, 0.0002]], Math.PI * 2, 12), parts: ModelPart[] = [root], rays: ModelPart[] = [];
  for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3, outline: [number, number][] = [[0.00065, -0.00035], [0.00145, -0.00055], [0.0022, 0], [0.00145, 0.00055], [0.00065, 0.00035]], p = polygon("星状弹球菌成熟后向外反折的外包被裂片", cream, outline, 0.0002, [0, 0.00055, 0]); p.rotation.y = -a * 180 / Math.PI; p.vertices = p.vertices!.map(v => ({ ...v, y: v.y + Math.sin((v.x - 0.00065) / 0.00155 * Math.PI) * 0.00045 })); rays.push(p); }
  parts.push(combineMeshes("星状弹球菌六片真正留缝的微型星裂外被", cream, rays), sweptProfile("星状弹球菌包在孢子弹下面的完整可翻转内杯膜", "#c7b992", [[0, 0.0003], [0.0007, 0.00045], [0.001, 0.00085], [0.0011, 0.00105], [0.0009, 0.00105], [0.0006, 0.0006], [0, 0.0005]], Math.PI * 2, 12), lump("星状弹球菌单个卵形孢子弹", [0, 0.0009, 0], [0.0013, 0.0014, 0.0012], dark)); return parts;
}

export const clusteredFungusDesigns: MasterNatureDesign[] = [
  design("grifola", "灰树花", "植物", henOfWoods, ["Grifola frondosa", "多级分枝侧生扇盖与真实菌管孔层"]),
  design("polyporusUmbellatus", "猪苓子实体", "植物", umbrellaPolypore, ["Polyporus umbellatus", "中央柄小圆盖与相接的树枝状共同基柄"]),
  design("verpaBohemica", "皱盖钟菌", "植物", wrinkledBell, ["Verpa bohemica", "仅顶部连柄的游离纵皱钟盖"]),
  design("ophiocordyceps", "偏侧蛇虫草", "植物", zombieAnt, ["Ophiocordyceps unilateralis", "蚁宿主头后单柄与偏侧生殖垫"]),
  design("sphaerobolus", "星状弹球菌", "植物", cannonFungus, ["Sphaerobolus stellatus", "毫米级星裂外被内翻膜和单孢子弹"]),
];
