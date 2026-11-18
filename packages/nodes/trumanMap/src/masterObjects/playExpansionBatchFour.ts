import { CatmullRomCurve3, Euler, Quaternion, Vector3 } from "three";
import { part, type ModelPart, type Triple } from "../assetModelParts";
import { sweptProfile, tapered } from "../masterNature/shared";
import { ball, box, cylinder, rod, loop, cord, plate, piercedPanel, material, type MasterPrototype } from "./parts";
import { hollowChute, rideSeat } from "./playExpansionBatchTwo";

// 只参考通用设备类型：whitewaterwest.com/products/water-slides/body-slides/、
// kompan.com/en/gb/p/pcm157。管线、楼梯、封闭气室和承载构造均为原创简化几何。
export const playExpansionBatchFourObjects: MasterPrototype[] = [
  { name: "翻板触发垂直滑水舱", itemType: "设施", build: () => {
    const p: ModelPart[] = [];
    for (const x of [-1, 1]) for (const z of [-1, 1]) p.push(box("起滑塔四角独立基础", [x * 1.5, .16, z * 1.5], [1, .32, 1], material.steel), rod("一直支承到高位登乘台的立柱", [x * 1.5, .32, z * 1.5], [x * 1.5, 11.1, z * 1.5], .18, material.dark));
    p.push(piercedPanel("保留中央真正落孔的高位登乘平台", [0, 11, 0], [[-1.7, -1.7], [1.7, -1.7], [1.7, 1.7], [-1.7, 1.7]], [Array.from({ length: 24 }, (_, i): [number, number] => [Math.cos(-i * Math.PI / 12) * .76, Math.sin(-i * Math.PI / 12) * .76])], .14, material.ivory));
    const cabin = sweptProfile("留有侧面登乘缺口的真正中空透明舱壁", material.glass, [[.69, 11.14], [.75, 11.14], [.75, 13.25], [.69, 13.25]], Math.PI * 5 / 3, 24);
    cabin.opacity = .3;
    cabin.rotation.y = 90;
    p.push(cabin, part("透明起滑舱顶部的封闭薄壳", "lathe", material.glass, [0, 13.25, 0], [1, 1, 1], [0, 0, 0], { profile: [{ x: .75, y: 0 }, { x: .72, y: .2 }, { x: .5, y: .48 }, { x: 0, y: .6 }, { x: 0, y: .55 }, { x: .46, y: .43 }, { x: .66, y: .17 }, { x: .69, y: 0 }, { x: .75, y: 0 }], opacity: .3 }));
    const half = Array.from({ length: 17 }, (_, i): [number, number] => [Math.cos(i * Math.PI / 16) * .68, Math.sin(i * Math.PI / 16) * .68]);
    for (const s of [-1, 1]) p.push(plate("沿共同横轴打开的两片完整半圆触发底板", [0, 11.14, 0], half, .06, material.red, [-90, 0, s < 0 ? 180 : 0]));
    p.push(rod("触发底板共用横向铰轴", [-.74, 11.14, 0], [.74, 11.14, 0], .045, material.dark), ...hollowChute("穿过竖落段和侧偏翻环的真正空心滑水管", [[0, 11.05, 0], [0, 6.8, -.2], [0, 1.3, -1], [0, 1.4, -4], [0, 4.4, -5.2], [.3, 6, -3.7], [.75, 4, -2.8], [1.6, 1.1, -5.9], [2.6, .9, -8.5]], .65));
    for (let i = 0; i < 53; i++) p.push(box("登上高台的独立金属踏步", [2.3, .28 + i * .205, -13.1 + i * .26], [1, .14, .28], material.steel));
    for (const s of [-1, 1]) p.push(box("登台阶斜梁的平底落地脚座", [2.3 + s * .56, .09, -13.1], [.55, .18, .65], material.steel), rod("登台阶两侧连续承重斜梁", [2.3 + s * .56, .18, -13.1], [2.3 + s * .56, 10.84, .42], .11), rod("斜梁顶端连接上平台的固定支承", [2.3 + s * .56, 10.84, .42], [2.3 + s * .56, 11, .42], .11), rod("平台背面上方的安全扶杆", [-1.5, 12, s * 1.5], [1.5, 12, s * 1.5], .045, material.dark));
    p.push(box("高台与侧阶梯之间连续可走的登乘桥", [2.2, 11.07, .7], [1.4, .14, 1.1], material.ivory));
    p.push(box("滑水管低端的开放接收槽底", [2.6, .22, -8.8], [2.8, .16, 3.6], material.ivory), ...[-1, 1].map(s => box("接收槽两侧低矮围壁", [2.6 + s * 1.35, .54, -8.8], [.1, .65, 3.6], material.glass)));
    return p;
  } },
  { name: "固定螺旋封闭滑水塔", itemType: "设施", build: () => {
    const p = [cylinder("螺旋滑水塔中央固定承载柱", [0, 4.65, 0], [.4, 9.3, .4], material.dark), cylinder("中央立柱的宽落地基础", [0, .14, 0], [2.1, .28, 2.1], material.steel), box("连接登台阶与滑管口的上部登乘桥", [1.95, 9.18, 0], [2.5, .16, 1.45], material.ivory)];
    const path: Triple[] = [[1.3, 9.85, 0], ...Array.from({ length: 25 }, (_, i): Triple => { const a = i * Math.PI / 8; return [Math.cos(a) * 3.2, 9.85 - i * .35, Math.sin(a) * 3.2]; })];
    p.push(...hollowChute("沿固定立柱绕降且上下端真正开放的螺旋滑管", path, .61));
    for (let i = 0; i < 45; i++) {
      const a = i * Math.PI * 6 / 44, x = Math.cos(a) * .95, z = Math.sin(a) * .95;
      p.push(box("围绕中央柱连续上升的独立扇向踏板", [x, .3 + i * .2, z], [.85, .08, .38], material.steel, [0, -a * 180 / Math.PI, 0]));
      if (!(i % 3) || i === 44) p.push(rod("螺旋登台阶外缘的护栏立杆", [Math.cos(a) * 1.33, .34 + i * .2, Math.sin(a) * 1.33], [Math.cos(a) * 1.33, 1.22 + i * .2, Math.sin(a) * 1.33], .035, material.dark));
    }
    p.push(tapered("随螺旋阶梯连续上升的外扶手", material.dark, Array.from({ length: 45 }, (_, i): Triple => [Math.cos(i * Math.PI * 6 / 44) * 1.33, 1.22 + i * .2, Math.sin(i * Math.PI * 6 / 44) * 1.33]), Array(45).fill(.025)), tapered("实际承托每片踏板内缘的连续螺旋梁", material.dark, Array.from({ length: 45 }, (_, i): Triple => [Math.cos(i * Math.PI * 6 / 44) * .52, .22 + i * .2, Math.sin(i * Math.PI * 6 / 44) * .52]), Array(45).fill(.065)));
    for (let i = 0; i < 45; i += 8) { const a = i * Math.PI * 6 / 44; p.push(rod("把螺旋阶梯承重梁接到中央柱的短挑臂", [0, .22 + i * .2, 0], [Math.cos(a) * .52, .22 + i * .2, Math.sin(a) * .52], .08)); }
    for (let i = 0; i < 6; i++) { const a = i * Math.PI * 3 / 5, y = 9.85 - a * 2.8 / Math.PI; p.push(rod("由中央柱托住外侧滑管的径向支臂", [0, y - .65, 0], [Math.cos(a) * 3.2, y - .65, Math.sin(a) * 3.2], .12, material.red)); }
    p.push(box("螺旋滑管末端的平缓接收槽底", [-3.7, .55, 0], [2.5, .14, 2.6], material.ivory));
    return p;
  } },
  { name: "密封透明水上步行球", itemType: "设施", build: () => {
    const profile = [];
    for (let i = 0; i <= 12; i++) { const a = -Math.PI / 2 + i * Math.PI / 12; profile.push({ x: Math.max(0, Math.cos(a) * 1.9), y: Math.sin(a) * 1.9 }); }
    for (let i = 12; i >= 0; i--) { const a = -Math.PI / 2 + i * Math.PI / 12; profile.push({ x: Math.max(0, Math.cos(a) * 1.84), y: Math.sin(a) * 1.84 }); }
    const p: ModelPart[] = [part("以封闭双层薄壁围出步行空间的透明球体", "lathe", material.glass, [0, 1.9, 0], [1, 1, 1], [0, 0, 0], { profile, opacity: .2 }), cord("球面前部的弧形密闭入舱拉链", Array.from({ length: 13 }, (_, i): Triple => { const a = -.65 + i * 1.3 / 12; return [Math.sin(a) * 1.903, 1.9, -Math.cos(a) * 1.903]; }), .025, material.dark), box("密封拉链的外侧滑块与拉片", [.35, 1.9, -1.875], [.09, .045, .08], material.red), cylinder("独立充气阀的圆形密封座", [1.86, 1.9, .2], [.11, .065, .11], material.red, [0, 0, 90])];
    for (const s of [-1, 1]) p.push(cord("便于水面牵引回收的外侧软握环", [[s * 1.86, 1.85, .1], [s * 2.04, 2.02, .12], [s * 1.84, 2.15, .1]], .025, material.red));
    return p;
  } },
  { name: "环抱浮球平衡游乐盘", itemType: "设施", build: () => {
    const p = [ball("构成整盘摇摆支承的密封大浮球", [0, 1.6, 0], [3.2, 3.2, 3.2], material.glass), cord("供多人绕球攀坐的连续充气外环", Array.from({ length: 33 }, (_, i): Triple => [Math.cos(i * Math.PI / 16) * 2.75, 1.3, Math.sin(i * Math.PI / 16) * 2.75]), .28, material.red)];
    for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3; p.push(rod("将外围乘坐环接到中央浮球的充气短梁", [Math.cos(a) * 1.57, 1.3, Math.sin(a) * 1.57], [Math.cos(a) * 2.75, 1.3, Math.sin(a) * 2.75], .22, material.ivory), cord("外环上的独立软抓把", [[Math.cos(a) * 2.75 - Math.sin(a) * .16, 1.56, Math.sin(a) * 2.75 + Math.cos(a) * .16], [Math.cos(a) * 2.75, 1.76, Math.sin(a) * 2.75], [Math.cos(a) * 2.75 + Math.sin(a) * .16, 1.56, Math.sin(a) * 2.75 - Math.cos(a) * .16]], .024, material.dark)); }
    return p;
  } },
  { name: "轮椅登乘回转游乐盘", itemType: "设施", build: () => {
    const p = [cylinder("轮椅游乐盘的独立固定圆形基础", [0, .14, 0], [5.7, .28, 5.7], material.steel), cylinder("低位整体回转的平整登乘甲板", [0, .32, 0], [5.4, .08, 5.4], material.ivory), cylinder("与外圈回转盘分离的中部固定立轴", [0, .72, 0], [.25, .88, .25], material.dark), loop("乘员可共同握持的中部回转手轮", [0, 1.1, 0], .83, .045, [0, 0, 0], material.red)];
    for (let i = 1; i <= 7; i++) {
      const a = i * Math.PI / 4, x = Math.cos(a) * 2.45, z = Math.sin(a) * 2.45;
      p.push(rod("开放入口之外的周缘安全栏杆", [x, .36, z], [x, 1.1, z], .04, material.dark));
      if (i < 7) { const b = (i + 1) * Math.PI / 4; p.push(rod("连接相邻立杆的外圈扶手", [x, 1.1, z], [Math.cos(b) * 2.45, 1.1, Math.sin(b) * 2.45], .04, material.dark)); }
    }
    p.push(box("让轮椅平缓登上低甲板的宽坡板", [3.4, .191, 0], [1.65, .06, 1.3], material.steel, [0, 0, -11.25]), ...[-1, 1].map(s => rod("坡板两侧低矮止轮边", [2.6, .4, s * .64], [4.2, .06, s * .64], .025, material.dark)));
    for (const s of [-1, 1]) p.push(box("轮椅驻留区的柔软定位挡条", [s * .95, .39, .2], [.08, .06, 1.2], material.glass));
    return p;
  } },
  { name: "轮椅平行悬杆滑移荡架", itemType: "设施", build: () => {
    const p = [box("滑移荡架的独立落地底台", [0, .13, 0], [4.2, .26, 6.6], material.steel), ...[-1, 1].flatMap(x => [-1, 1].map(z => rod("支承四处平行吊杆的固定高立柱", [x * 1.55, .26, z * 1.7], [x * 1.55, 3.2, z * 1.7], .16, material.dark))), ...[-1, 1].map(s => rod("固定框顶端的纵向连梁", [s * 1.55, 3.2, -1.7], [s * 1.55, 3.2, 1.7], .17)), box("承载整台轮椅的平整移动甲板", [0, .75, .6], [2.7, .2, 3.4], material.ivory)];
    for (const x of [-1, 1]) for (const z of [-1, 1]) p.push(rod("四根同向摆动并保持甲板水平的吊杆", [x * 1.3, 2.9, z * 1.7], [x * 1.3, .85, z * 1.7 + .6], .07, material.red));
    for (const s of [-1, 1]) { p.push(rod("移动平台两侧的连续扶杆", [s * 1.23, 1.65, -1.1], [s * 1.23, 1.65, 2.3], .04, material.dark)); for (const z of [-1.1, 2.3]) p.push(rod("甲板与上扶杆相连的栏杆立柱", [s * 1.23, .85, z], [s * 1.23, 1.65, z], .04, material.dark)); }
    p.push(box("轮椅进入甲板前方的宽坡板", [0, .427, -2.4], [1.3, .075, 2.75], material.steel, [-16.5, 0, 0]), rod("平台后方的防倒退横栏", [-1.23, 1.5, 2.3], [1.23, 1.5, 2.3], .04, material.dark));
    return p;
  } },
  { name: "固定张拉索网金字塔", itemType: "设施", build: () => {
    const corners: Triple[] = [[-3.5, .2, -3.5], [3.5, .2, -3.5], [3.5, .2, 3.5], [-3.5, .2, 3.5]], peak: Triple = [0, 7.2, 0];
    const p = [cylinder("不旋转且承受索网张力的中央高桅", [0, 3.6, 0], [.23, 7.2, .23], material.dark), ...corners.map(q => box("各角独立固定索网张力的锚固墩", [q[0], .1, q[2]], [.8, .2, .8], material.steel))];
    for (let face = 0; face < 4; face++) {
      const a = corners[face]!, b = corners[(face + 1) % 4]!;
      for (let row = 1; row <= 7; row++) { const t = row / 7; const left = peak.map((n, k) => n + (a[k]! - n) * t) as Triple, right = peak.map((n, k) => n + (b[k]! - n) * t) as Triple; p.push(rod("同一三角网面中独立承重的横向绳索", left, right, .033, material.red)); }
      for (let col = 0; col < 7; col++) { const t = col / 7; const foot = a.map((n, k) => n + (b[k]! - n) * t) as Triple; p.push(rod("从固定桅顶向底边分散受力的经向绳索", peak, foot, .033, material.dark)); }
    }
    return p;
  } },
  { name: "三角网格刚性攀爬穹架", itemType: "设施", build: () => {
    const rings = [0, Math.PI / 6, Math.PI / 3].map(latitude => Array.from({ length: 8 }, (_, i): Triple => { const a = i * Math.PI / 4; return [Math.cos(a) * Math.cos(latitude) * 3.5, .3 + Math.sin(latitude) * 3.5, Math.sin(a) * Math.cos(latitude) * 3.5]; })), p: ModelPart[] = [];
    for (let level = 0; level < 3; level++) for (let i = 0; i < 8; i++) {
      const q = rings[level]![i]!, next = rings[level]![(i + 1) % 8]!;
      p.push(rod("完整穹架每层闭合的环向杆", q, next, .06, material.red));
      if (level < 2) p.push(rod("连接相邻纬圈的经向承载杆", q, rings[level + 1]![i]!, .06, material.dark), rod("把网格分成刚性三角形的斜杆", q, rings[level + 1]![(i + 1) % 8]!, .06, material.dark));
      else p.push(rod("上圈收束到穹顶单一节点的杆件", q, [0, 3.8, 0], .06, material.dark));
      if (!level) p.push(box("攀爬穹架八角独立平底足座", [q[0], .15, q[2]], [.55, .3, .55], material.steel));
    }
    return p;
  } },
  { name: "整体倾摆观景游乐塔", itemType: "设施", build: () => {
    const p = [cylinder("倾摆塔的宽圆固定基础", [0, .2, 0], [7.5, .4, 7.5], material.steel), ball("允许整根塔体倾摆的低位球面主关节", [0, 1.55, 0], [1.4, 1.4, 1.4], material.dark), cylinder("不含升降轿架的整根摆动主塔", [0, 7.55, 0], [.8, 12.3, .8], material.red), cylinder("固定在塔顶并随塔整体摆动的乘员甲板", [0, 12.4, 0], [5.2, .26, 5.2], material.ivory), cylinder("塔顶中央的封闭驱动护罩", [0, 13.3, 0], [1.7, 1.65, 1.7], material.red)];
    for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2; p.push(rod("由基础指向塔身的独立倾摆执行缸", [Math.cos(a) * 2.1, .4, Math.sin(a) * 2.1], [Math.cos(a) * .45, 3.5, Math.sin(a) * .45], .2, material.steel), ball("塔身与倾摆执行缸之间的球铰", [Math.cos(a) * .45, 3.5, Math.sin(a) * .45], [.28, .28, .28], material.dark)); }
    for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; p.push(...rideSeat([Math.cos(a) * 1.9, 12.89, Math.sin(a) * 1.9], -i * 45 - 90)); }
    return p;
  } },
  { name: "三臂倾轴自转游乐座", itemType: "设施", build: () => {
    const p = [cylinder("三臂游乐机的圆形落地平台", [0, .18, 0], [14.5, .36, 14.5], material.steel), cylinder("中央公转驱动立柱", [0, 1.7, 0], [1.5, 2.7, 1.5], material.dark), cylinder("与三根承载臂共同回转的中央头", [0, 3, 0], [2.4, .55, 2.4], material.red)];
    for (let i = 0; i < 3; i++) {
      const a = i * Math.PI * 2 / 3, cx = Math.cos(a) * 4.25, cz = Math.sin(a) * 4.25;
      p.push(rod("从公转头伸向倾置卫星轴的上承载臂", [Math.cos(a), 3, Math.sin(a)], [cx, 3.7, cz], .32, material.red), rod("固定倾轴的下侧三角支臂", [Math.cos(a) * 1.1, 2.3, Math.sin(a) * 1.1], [cx, 3.7, cz], .2), rod("与地面斜交的卫星独立回转轴", [cx - Math.cos(a) * .32, 3.42, cz - Math.sin(a) * .32], [cx + Math.cos(a) * .32, 3.98, cz + Math.sin(a) * .32], .23, material.dark));
      for (let j = 0; j < 3; j++) {
        const b = j * Math.PI * 2 / 3, tx = -Math.sin(a), tz = Math.cos(a), dx = tx * Math.cos(b) * 1.8 + Math.cos(a) * Math.sin(b) * 1.35, dz = tz * Math.cos(b) * 1.8 + Math.sin(a) * Math.sin(b) * 1.35, y = 3.7 - Math.sin(b) * 1.19;
        p.push(rod("倾轴周围三向展开的独立星形支臂", [cx, 3.7, cz], [cx + dx, y, cz + dz], .16, material.ivory), rod("端舱保持自由垂挂的短轴", [cx + dx - tx * .32, y, cz + dz - tz * .32], [cx + dx + tx * .32, y, cz + dz + tz * .32], .075), rod("端轴到悬舱底架的侧承杆", [cx + dx + tx * .32, y, cz + dz + tz * .32], [cx + dx + tx * .32, y - 1.36, cz + dz + tz * .32], .065), box("端部悬舱的薄地板", [cx + dx, y - 1.41, cz + dz], [.84, .1, .95], material.ivory, [0, -i * 120, 0]), ...rideSeat([cx + dx, y - 1, cz + dz], -i * 120));
      }
    }
    return p;
  } },
  { name: "垂向起伏章鱼回转座", itemType: "设施", build: () => {
    const p = [cylinder("章鱼臂游乐机宽圆基础", [0, .18, 0], [16.2, .36, 16.2], material.steel), cylinder("驱动多根独立起伏臂的中央回转塔", [0, 2.5, 0], [2.3, 4.3, 2.3], material.red), cylinder("中央塔顶部封闭帽", [0, 4.8, 0], [2.7, .38, 2.7], material.ivory)];
    for (let i = 0; i < 5; i++) {
      const a = i * Math.PI * 2 / 5, endY = 2.8 + i % 3 * .75, x = Math.cos(a) * 5.2, z = Math.sin(a) * 5.2;
      p.push(rod("能绕根部轴独立起伏的长承载臂", [Math.cos(a), 3.5, Math.sin(a)], [x, endY, z], .3, material.red), rod("从中央塔下部顶起该臂的独立液压缸", [Math.cos(a) * .8, 1.3, Math.sin(a) * .8], [Math.cos(a) * 3.7, (3.5 + endY) / 2, Math.sin(a) * 3.7], .14), cylinder("长臂根部的水平俯仰轴套", [Math.cos(a), 3.5, Math.sin(a)], [.34, .6, .34], material.dark, [0, -i * 72, 90]), cylinder("起伏臂末端的二级回转头", [x, endY, z], [.65, .4, .65], material.dark));
      for (const side of [-1, 1]) { const tx = -Math.sin(a) * side, tz = Math.cos(a) * side, qx = x + tx * 1.15, qz = z + tz * 1.15; p.push(rod("末端转头向两侧悬舱伸出的短臂", [x, endY, z], [qx, endY, qz], .16, material.ivory), box("悬舱下方独立承托甲板", [qx, endY - .45, qz], [.95, .12, 1.15], material.ivory), ...rideSeat([qx, endY - .03, qz], -i * 72)); }
    }
    return p;
  } },
  { name: "长框周缘链行翻转吊舱机", itemType: "设施", build: () => {
    const p: ModelPart[] = [];
    for (const x of [-1, 1]) for (const z of [-1, 1]) p.push(box("翻舱机主架独立基础", [x * 3.8, .18, z * 2], [1.3, .36, 1.5], material.steel), rod("前后A架把回转轴抬到长框中心", [x * 3.8, .36, z * 2], [0, 8.5, z * 2], .25, material.dark));
    p.push(rod("长框整体回转的横贯主轴", [0, 8.5, -2.2], [0, 8.5, 2.2], .42), rod("连接两端链轮的长框中央脊梁", [0, 4.8, 0], [0, 12.2, 0], .24, material.red), ...[-1, 1].map(s => rod("周缘链路的左右长直导轨", [s * 1.6, 4.8, 0], [s * 1.6, 12.2, 0], .12, material.red)));
    for (const s of [-1, 1]) p.push(cord("周缘链路在上下端轮上的半圆回转段", Array.from({ length: 13 }, (_, i): Triple => { const a = i * Math.PI / 12; return [Math.cos(a) * 1.6, 8.5 + s * 3.7 + Math.sin(a) * 1.6 * s, 0]; }), .12, material.red));
    const cars: [number, number][] = [[1.6, 5.5], [1.6, 8.5], [1.6, 11.5], [0, 13.8], [-1.6, 11.5], [-1.6, 8.5], [-1.6, 5.5], [0, 3.2]];
    for (const [x, y] of cars) p.push(rod("链行支座上允许独立翻转的吊舱短轴", [x, y, -.1], [x, y, .65], .09), rod("端轴通向悬舱地板的独立侧框", [x + .34, y, .65], [x + .34, y - 1.36, .65], .06, material.red), box("链行悬舱的独立薄地板", [x, y - 1.41, .65], [.83, .1, .95], material.ivory), ...rideSeat([x, y - 1, .65]));
    return p;
  } },
  { name: "六臂切轴翻转排座机", itemType: "设施", build: () => {
    const p = [cylinder("六臂翻转机的独立宽基础", [0, .2, 0], [16, .4, 16], material.steel), rod("向上倾出的整体回转主立柱", [0, .4, 0], [0, 5.8, -.9], .65, material.dark), ball("承托六根大臂的中央传动毂", [0, 5.8, -.9], [2, 1.3, 2], material.red)];
    for (let i = 0; i < 6; i++) {
      const a = i * Math.PI / 3, x = Math.cos(a) * 4.8, y = 5.8 + Math.cos(a) * 1.5, z = -.9 + Math.sin(a) * 4.8, tx = -Math.sin(a), tz = Math.cos(a), yaw = -i * 60 - 90;
      p.push(rod("在倾置公转面内展开的六根刚性臂", [0, 5.8, -.9], [x, y, z], .26, material.red), rod("沿切线安装且允许整排座独立翻转的耳轴", [x - tx * 1.1, y, z - tz * 1.1], [x + tx * 1.1, y, z + tz * 1.1], .13), box("切轴排舱整体的薄地板", [x, y - 1.4, z], [1.75, .12, 1.2], material.ivory, [0, yaw, 0]));
      for (const s of [-1, 1]) p.push(rod("排座耳轴两端连接到底框的侧承杆", [x + tx * s * .83, y, z + tz * s * .83], [x + tx * s * .83, y - 1.34, z + tz * s * .83], .065), ...rideSeat([x + tx * s * .4, y - .98, z + tz * s * .4], yaw));
    }
    return p;
  } },
  { name: "气缸晃动离心游乐转台", itemType: "设施", build: () => {
    const p = [cylinder("晃动转台的固定圆形基础", [0, .16, 0], [8.8, .32, 8.8], material.steel), ball("允许乘员盘多方向倾摆的中央支点", [0, .85, 0], [.65, .65, .65], material.dark), cylinder("整体公转的无单独座椅乘员地板", [0, 1.18, 0], [7.1, .18, 7.1], material.ivory), part("沿圆周连续布置的真实环形坐台", "lathe", material.red, [0, 0, 0], [1, 1, 1], [0, 0, 0], { profile: [{ x: 2.78, y: 1.24 }, { x: 3.45, y: 1.24 }, { x: 3.45, y: 1.82 }, { x: 2.78, y: 1.82 }, { x: 2.78, y: 1.67 }, { x: 3.26, y: 1.67 }, { x: 3.26, y: 1.39 }, { x: 2.78, y: 1.39 }, { x: 2.78, y: 1.24 }] }), loop("乘员共同握住的连续周缘保护扶圈", [0, 2.15, 0], 3.38, .045, [0, 0, 0], material.dark)];
    for (let i = 0; i < 3; i++) { const a = i * Math.PI * 2 / 3; p.push(rod("在盘下独立升降并制造晃动的气缸", [Math.cos(a) * 2, .32, Math.sin(a) * 2], [Math.cos(a) * 2, 1.09, Math.sin(a) * 2], .21, material.steel)); }
    for (let i = 0; i < 10; i++) { const a = i * Math.PI / 5; p.push(rod("从坐台接到周缘扶圈的短立杆", [Math.cos(a) * 3.38, 1.82, Math.sin(a) * 3.38], [Math.cos(a) * 3.38, 2.15, Math.sin(a) * 3.38], .035, material.dark)); }
    return p;
  } },
  { name: "铰架倾转贴壁站笼", itemType: "设施", build: () => {
    const cage = [cylinder("整个倾转站笼的平整圆形底板", [0, 0, 0], [6.2, .16, 6.2], material.ivory), sweptProfile("与乘员盘共同倾转的封闭周缘薄壁", material.red, [[3, .08], [3.12, .08], [3.12, 2.08], [3, 2.08]], Math.PI * 2, 32), loop("站笼顶缘的连续手扶圈", [0, 2.12, 0], 3.06, .045, [0, 0, 0], material.dark)];
    for (let i = 0; i < 10; i++) { const a = i * Math.PI / 5; cage.push(box("沿站笼内壁竖立的独立人体背垫", [Math.cos(a) * 2.94, 1.04, Math.sin(a) * 2.94], [.63, 1.7, .09], material.glass, [0, 90 - i * 36, 0])); }
    const turn = new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), 55 * Math.PI / 180);
    for (const p of cage) { const position = new Vector3(p.position.x, p.position.y, p.position.z).applyQuaternion(turn).add(new Vector3(0, 4.5, 0)), rotation = new Euler().setFromQuaternion(turn.clone().multiply(new Quaternion().setFromEuler(new Euler(p.rotation.x * Math.PI / 180, p.rotation.y * Math.PI / 180, p.rotation.z * Math.PI / 180)))); p.position = { x: position.x, y: position.y, z: position.z }; p.rotation = { x: rotation.x * 180 / Math.PI, y: rotation.y * 180 / Math.PI, z: rotation.z * 180 / Math.PI }; }
    return [box("整笼倾转机的固定宽基础", [0, .18, 0], [7.8, .36, 7.6], material.steel), ...[-1, 1].flatMap(s => [rod("把倾转铰轴抬离地面的侧承载臂", [s * 2.3, .36, -.65], [s * 1.2, 4.05, -.65], .28, material.dark), rod("从后方支住铰轴的斜撑", [s * 2.3, .36, 2.4], [s * 1.2, 4.05, -.65], .24)]), rod("允许整个站笼起落倾转的水平主铰轴", [-1.4, 4.05, -.65], [1.4, 4.05, -.65], .32), rod("主铰轴通向倾斜回转盘底的驱动短轴", [0, 4.05, -.65], [0, 4.5, 0], .29), ...cage];
  } },
  { name: "机械杠杆棒球打击游艺台", itemType: "设施", build: () => {
    const p = [box("棒球打击台的完整长机柜底层", [0, .59, 0], [1.3, .24, 2.7], material.dark), ...[-1, 1].flatMap(x => [-1, 1].map(z => box("把场面托到玩家腰高的四根独立脚", [x * .51, .3, z * 1.08], [.12, .6, .13], material.steel))), box("真实机械棒球场面", [0, .82, 0], [1.24, .1, 2.5], material.wood), ...[-1, 1].map(s => box("防止小球越过场面的长挡壁", [s * .63, .96, 0], [.04, .28, 2.55], material.red)), box("后方计分及供球机头", [0, 1.12, 1.18], [1.27, .85, .18], material.red), box("机头上方的整块计分显示玻璃", [0, 1.31, 1.079], [.85, .24, .015], material.glass), cylinder("打击员持棒机构的竖直转轴", [0, .92, -.89], [.08, .2, .08], material.dark), rod("能绕竖轴扫过投球轨迹的击球棒", [0, 1, -.89], [.25, 1, -.7], .025, material.ivory), rod("传递玩家手动动作的台下连杆", [0, .72, -.89], [.49, .72, -1.42], .025), rod("玩家从前端扳动的操纵杠杆", [.49, .72, -1.42], [.49, .99, -1.42], .025, material.dark), ball("杠杆顶部的握球", [.49, 1.01, -1.42], [.065, .065, .065], material.red), part("投球机构前方真正开放的短导球筒", "lathe", material.steel, [0, .93, .48], [1, 1, 1], [90, 0, 0], { profile: [{ x: .045, y: -.25 }, { x: .045, y: .25 }, { x: .035, y: .25 }, { x: .035, y: -.25 }, { x: .045, y: -.25 }] }), rod("从供球机头驱动投球的细推杆", [0, .93, .73], [0, .93, 1.11], .018), ball("已离开导筒等待打击的小球", [0, .905, -.42], [.065, .065, .065], material.ivory)];
    for (const [x, z] of [[0, -.88], [-.42, -.28], [0, .32], [.42, -.28]]) p.push(box("场面中实际凸起的独立垒包", [x!, .88, z!], [.09, .02, .09], material.ivory, [0, 45, 0]));
    for (const [x, z] of [[-.42, -.28], [0, .32], [.42, -.28]]) p.push(rod("连接三垒与本垒的场内边界线", [0, .875, -.88], [x!, .875, z!], .005, material.ivory));
    return p;
  } },
  { name: "人体拉膜泡泡筒体验台", itemType: "设施", build: () => {
    const p = [part("上方真正开放并储液的环形皂液槽", "lathe", material.red, [0, 0, 0], [1, 1, 1], [0, 0, 0], { profile: [{ x: 1.42, y: 0 }, { x: 1.76, y: 0 }, { x: 1.76, y: .24 }, { x: 1.7, y: .24 }, { x: 1.7, y: .06 }, { x: 1.48, y: .06 }, { x: 1.48, y: .24 }, { x: 1.42, y: .24 }, { x: 1.42, y: 0 }] }), cylinder("站在皂液槽内部且与液槽分开的平台", [0, .09, 0], [2.72, .18, 2.72], material.ivory), loop("能从皂液中垂直拉起整圈液膜的闭合大环", [0, 2.55, 0], 1.59, .025, [0, 0, 0], material.steel)];
    for (let i = 0; i < 3; i++) { const a = i * Math.PI * 2 / 3; p.push(box("提膜装置独立落地的宽脚座", [Math.cos(a) * 2.1, .1, Math.sin(a) * 2.1], [.5, .2, .5], material.steel), rod("高于人体的提膜导索立柱", [Math.cos(a) * 2.1, .2, Math.sin(a) * 2.1], [Math.cos(a) * 2.1, 3.5, Math.sin(a) * 2.1], .09, material.dark), rod("从立柱挑到提膜环上方的悬臂", [Math.cos(a) * 2.1, 3.5, Math.sin(a) * 2.1], [Math.cos(a) * 1.59, 3.5, Math.sin(a) * 1.59], .08, material.red), rod("悬臂下方垂直连接大环的提升绳", [Math.cos(a) * 1.59, 3.5, Math.sin(a) * 1.59], [Math.cos(a) * 1.59, 2.55, Math.sin(a) * 1.59], .009, material.dark)); }
    p.push(cylinder("操作员手拉绳的换向滑轮", [2.1, 3.45, 0], [.22, .08, .22], material.dark, [90, 0, 0]), cord("从顶滑轮垂到操作侧的拉绳", [[2.1, 3.45, 0], [2.33, 2.7, 0], [2.33, 1, 0]], .009, material.dark), rod("拉绳下端的双手横握把", [2.05, 1, 0], [2.61, 1, 0], .028, material.red));
    return p;
  } },
  { name: "气送彩球双回路展演塔", itemType: "设施", build: () => {
    const p = [box("回收彩球的空心集球箱薄底", [0, .1, 0], [4.1, .2, 1.5], material.steel), ...[-1, 1].flatMap(s => [box("集球箱两侧的真实薄壁", [s * 2, .41, 0], [.1, .43, 1.5], material.red), box("集球箱前后挡球壁", [0, .41, s * .7], [3.9, .43, .1], material.red)]), ...[-1, 1].map(s => rod("高管路背后的固定承托立杆", [s * 1.75, .2, .65], [s * 1.75, 4, .65], .08, material.dark))];
    const paths: Triple[][] = [[[-1, .65, -.15], [-1, 3.3, -.15], [0, 3.7, -.15], [.65, 3.2, -.15], [.65, .65, -.15]], [[-1.6, .65, .42], [-1.6, 3.8, .42], [-.6, 4.2, .42], [1.6, 3.5, .42], [1.6, .65, .42]]];
    for (const [index, path] of paths.entries()) {
      const pipes = hollowChute("有完整内壁且两端通入集球箱的气送回路", path, .2);
      for (const value of pipes) value.opacity = .35;
      const q = new CatmullRomCurve3(path.map(value => new Vector3(...value)), false, "centripetal").getPointAt(index ? .82 : .25);
      p.push(...pipes, ball("位于真实气送管线中心的独立彩球", [q.x, q.y, q.z], [.15, .15, .15], index ? material.wood : material.red));
    }
    const holes = [[-1, -.15], [.65, -.15], [-1.6, .42], [1.6, .42]].map(([x, z]) => Array.from({ length: 16 }, (_, i): [number, number] => [x! + Math.cos(-i * Math.PI / 8) * .136, z! + Math.sin(-i * Math.PI / 8) * .136]));
    p.push(piercedPanel("保留四个真实管口的集球箱上盖", [0, .63, 0], [[-2, -.74], [2, -.74], [2, .74], [-2, .74]], holes, .02, material.ivory), ...[-1, 1].map(s => cylinder("集球箱侧面供气的独立离心风机", [s * 2.15, .4, .25], [.56, .4, .56], material.dark, [0, 0, 90])), box("集球箱前侧可踩动的风机控制踏垫", [0, .12, -1.15], [.6, .24, .55], material.glass));
    return p;
  } },
  { name: "空气涡环互动炮台", itemType: "设施", build: () => [
    box("涡环互动装置的完整落地长台", [0, .12, 0], [2.3, .24, 3.8], material.steel), ...[-1, 1].flatMap(x => [-1, 1].map(z => rod("支承大气腔的四根固定立足", [x * .8, .24, z * 1.05], [x * .8, .77, z * 1.05], .1, material.dark))), box("气腔下方的承托宽鞍台", [0, .75, 0], [1.75, .08, 2.6], material.red), part("前方真正开放的小孔与后部大气腔", "lathe", material.ivory, [0, 1.64, 0], [1, 1, 1], [90, 0, 0], { profile: [{ x: .85, y: 1.2 }, { x: .79, y: 1.2 }, { x: .79, y: -.45 }, { x: .22, y: -1.2 }, { x: .28, y: -1.2 }, { x: .85, y: -.5 }, { x: .85, y: 1.2 }] }), cylinder("后大口封闭且可弹回的柔性膜片", [0, 1.64, 1.215], [1.66, .035, 1.66], material.dark, [90, 0, 0]), rod("将膜片向后拉伸的中央短拉杆", [0, 1.64, 1.23], [0, 1.64, 1.8], .035, material.steel), loop("互动者双手可握住的后拉环", [0, 1.64, 1.88], .2, .032, [90, 0, 0], material.red),
  ] },
  { name: "气囊踩踏投球游艺台", itemType: "设施", build: () => {
    const p = [box("低压投球台的完整落地底座", [0, .12, 0], [2, .24, 2.3], material.steel), cylinder("允许方向调整的低位旋转柱", [0, .56, 0], [.4, .65, .4], material.dark), rod("发射筒下方与转向柱相接的横向叉底", [-.32, .91, 0], [.32, .91, 0], .08, material.steel), ...[-1, 1].flatMap(s => [rod("位于筒腔之外的两侧仰角支承叉", [s * .3, .91, 0], [s * .3, 1.2, 0], .065, material.steel), cylinder("只接到筒壁而不穿入球道的侧耳轴", [s * .23, 1.2, 0], [.12, .16, .12], material.steel, [0, 0, 90])]), part("后口可装入软球且前口相通的短发射筒", "lathe", material.red, [0, 1.2, -.18], [1, 1, 1], [105, 0, 0], { profile: [{ x: .17, y: -.75 }, { x: .17, y: .5 }, { x: .145, y: .5 }, { x: .145, y: -.75 }, { x: .17, y: -.75 }] }), ball("以脚踩方式压送空气的完整软气囊", [.65, .44, .45], [.75, .4, .6], material.glass), cord("从气囊接到筒侧的柔性空气管", [[.3, .44, .45], [.18, .7, .1], [.16, 1.2, .1]], .045, material.dark), rod("乘员握持以调整方向的短手柄", [-.3, 1.17, .1], [.3, 1.17, .1], .035, material.dark), ball("与内孔尺寸相容的独立软游戏球", [.55, .355, -.65], [.23, .23, .23], material.wood), ...[-1, 1].map(s => box("远端投球靶架的独立落地足", [s * .6, .1, -4.4], [.5, .2, .9], material.steel)), ...[-1, 1].map(s => rod("两侧支承大投球靶圈的立杆", [s * .6, .2, -4.4], [s * .6, 2.1, -4.4], .065, material.dark)), loop("可让软球真正穿过的完整目标环", [0, 1.9, -4.4], .9, .065, [90, 0, 0], material.red)];
    return p;
  } },
  { name: "整数周期波动摆球阵", itemType: "设施", build: () => {
    const p = [box("整组摆球共用的长落地基础", [0, .15, 0], [7, .3, 2.8], material.steel), ...[-1, 1].flatMap(x => [-1, 1].map(z => rod("两端独立支承摆架上梁的固定斜柱", [x * 3.1, .3, z * 1.05], [x * 3.1, 4.2, 0], .16, material.dark))), ...[-1, 1].map(s => rod("给双股吊线分别定位的两根上梁", [-3.2, 4.2, s * .27], [3.2, 4.2, s * .27], .12, material.red)), ...[-1, 1].map(s => rod("在A架顶部连接两根吊线上梁的端横梁", [s * 3.1, 4.2, -.31], [s * 3.1, 4.2, .31], .1, material.dark))];
    for (let i = 0; i < 10; i++) { const x = (i - 4.5) * .6, length = 9.81 * (50 / (2 * Math.PI * (16 + i))) ** 2, y = 4.14 - length; p.push(ball("十个不同实际绳长下的独立摆球", [x, y, 0], [.25, .25, .25], i % 2 ? material.wood : material.glass), ...[-1, 1].map(s => rod("约束摆球在同一前后平面摆动的双股吊线", [x, 4.14, s * .27], [x, y + .12, 0], .006, material.dark))); }
    return p;
  } },
  { name: "科里奥利抛球回转体验台", itemType: "设施", build: () => {
    const p = [part("与中央运动盘分开的静止观察步道", "lathe", material.steel, [0, 0, 0], [1, 1, 1], [0, 0, 0], { profile: [{ x: 2.58, y: 0 }, { x: 3.85, y: 0 }, { x: 3.85, y: .32 }, { x: 2.58, y: .32 }, { x: 2.58, y: 0 }] }), cylinder("可供参与者站立的独立回转运动盘", [0, .38, 0], [4.9, .18, 4.9], material.ivory), cylinder("运动盘下方的独立中心轴承", [0, .2, 0], [1.35, .4, 1.35], material.dark), box("固定观察步道与回转盘之间的低登乘板", [2.55, .4, 0], [1.15, .12, 1.2], material.steel), part("安装在转盘上并沿直径定向的开放球筒", "lathe", material.red, [0, .72, -1.85], [1, 1, 1], [90, 0, 0], { profile: [{ x: .09, y: -.3 }, { x: .09, y: .3 }, { x: .07, y: .3 }, { x: .07, y: -.3 }, { x: .09, y: -.3 }] }), rod("开放球筒下的刚性支架", [0, .47, -1.85], [0, .64, -1.85], .08, material.dark), ball("位于开放筒内的独立小球", [0, .72, -1.75], [.11, .11, .11], material.wood), box("直径对侧接球的小兜底", [0, .54, 1.8], [.65, .1, .55], material.glass), ...[-1, 1].map(s => box("接球小兜两侧的挡壁", [s * .3, .69, 1.8], [.05, .25, .55], material.glass))];
    for (let i = 1; i < 8; i++) { const a = i * Math.PI / 4; p.push(rod("静止观察区外缘的独立保护立杆", [Math.cos(a) * 3.62, .32, Math.sin(a) * 3.62], [Math.cos(a) * 3.62, 1.3, Math.sin(a) * 3.62], .04, material.dark)); if (i < 7) { const b = (i + 1) * Math.PI / 4; p.push(rod("静止观察步道的连续上扶杆", [Math.cos(a) * 3.62, 1.3, Math.sin(a) * 3.62], [Math.cos(b) * 3.62, 1.3, Math.sin(b) * 3.62], .04, material.dark)); } }
    p.push(...[-1, 1].map(s => rod("固定观察摄影机架的两根斜脚", [s * .5 + 3.2, .32, -.6], [3.2, 1.85, -.6], .05, material.dark)), box("固定在静止步道上的观察镜头壳", [3.2, 1.9, -.6], [.3, .18, .22], material.dark));
    return p;
  } },
  { name: "角动量转台与手持飞轮体验站", itemType: "设施", build: () => {
    const p = [cylinder("转台与飞轮支架共用的独立地台", [0, .12, 0], [6.2, .24, 4.3], material.steel), cylinder("供参与者站立的低摩擦自由转台", [-.55, .36, 0], [2.35, .24, 2.35], material.ivory), cylinder("自由转台下的中心回转轴承", [-.55, .22, 0], [.65, .2, .65], material.dark), rod("独立支承飞轮的固定落地立柱", [2.2, .24, 0], [2.2, 1.6, 0], .13, material.dark), rod("可从支架摘取的双手持轮轴", [.75, 1.6, 0], [2.3, 1.6, 0], .06, material.steel), loop("储存旋转惯量的独立厚轮缘", [1.55, 1.6, 0], .65, .085, [0, 0, 90], material.red), cylinder("手持飞轮中央的贯通轴承毂", [1.55, 1.6, 0], [.16, .28, .16], material.steel, [0, 0, 90]), ...[-1, 1].map(s => cylinder("轮轴两端的防滑双手握把", [1.55 + s * .65, 1.6, 0], [.085, .28, .085], material.dark, [0, 0, 90]))];
    for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; p.push(rod("把厚轮缘连接到轴承毂的径向辐条", [1.55, 1.6, 0], [1.55, 1.6 + Math.cos(a) * .65, Math.sin(a) * .65], .025, material.steel)); }
    for (const s of [-1, 1]) p.push(rod("转台侧方固定参考栏的立杆", [-1.75, .24, s * .95], [-1.75, 1.4, s * .95], .045, material.dark));
    p.push(rod("不随参与者转动的外侧参考扶杆", [-1.75, 1.4, -.95], [-1.75, 1.4, .95], .045, material.dark));
    return p;
  } },
  { name: "重力井投球漏斗体验台", itemType: "设施", build: () => {
    const p = [part("曲率不断变化且中心真正贯通的漏斗面", "lathe", material.glass, [0, 0, 0], [1, 1, 1], [0, 0, 0], { profile: [{ x: .1, y: .5 }, { x: .4, y: .54 }, { x: .82, y: .68 }, { x: 1.21, y: .94 }, { x: 1.55, y: 1.28 }, { x: 1.65, y: 1.5 }, { x: 1.6, y: 1.52 }, { x: 1.5, y: 1.32 }, { x: 1.16, y: .99 }, { x: .78, y: .73 }, { x: .37, y: .6 }, { x: .095, y: .56 }, { x: .1, y: .5 }] }), ...[-1, 1].flatMap(x => [-1, 1].map(z => rod("把大漏斗四角托到互动高度的固定脚", [x, 0, z], [x, 1.14, z], .09, material.dark))), loop("从外侧包住漏斗口的刚性保护边", [0, 1.49, 0], 1.65, .025, [0, 0, 0], material.red), part("接在中心真实落孔下的开放接球杯", "lathe", material.wood, [0, 0, 0], [1, 1, 1], [0, 0, 0], { profile: [{ x: 0, y: .02 }, { x: .22, y: .02 }, { x: .22, y: .45 }, { x: .19, y: .45 }, { x: .19, y: .1 }, { x: 0, y: .1 }] }), ball("通过中央孔落入接球杯的独立小球", [0, .145, 0], [.09, .09, .09], material.red), box("向漏斗外缘滚入小球的短起送斜槽底", [1.9, 1.53, -.25], [.65, .035, .22], material.ivory, [0, 0, 14]), ...[-1, 1].map(s => rod("起送斜槽两侧完整止球边", [1.6, 1.5, -.25 + s * .11], [2.2, 1.65, -.25 + s * .11], .018, material.dark)), rod("起送槽外端的独立落地支杆", [2.18, 0, -.25], [2.18, 1.58, -.25], .075, material.steel)];
    return p;
  } },
  { name: "独立数字落水幕墙装置", itemType: "设施", build: () => {
    const p = [box("整张水幕共用的开放接水槽底", [0, .1, 0], [8.5, .2, .85], material.steel), ...[-1, 1].map(s => box("接水槽两侧完整长挡壁", [0, .33, s * .42], [8.5, .26, .08], material.red)), ...[-1, 1].map(s => box("接水槽左右短封端", [s * 4.2, .33, 0], [.1, .26, .8], material.red)), { ...box("低于槽口的独立静态水面", [0, .215, 0], [8.2, .03, .7], material.glass), opacity: .42 }, ...[-1, 1].flatMap(s => [box("上方水幕管廊立柱的宽落地脚", [s * 4.1, .12, .65], [.8, .24, 1.4], material.steel), rod("独立承托整排喷嘴管廊的侧立柱", [s * 4.1, .24, .65], [s * 4.1, 4.25, .65], .18, material.dark)]), box("整排上部供水槽的薄底板", [0, 4, 0], [8.2, .12, .55], material.steel), ...[-1, 1].map(s => box("高位供水槽的两侧真实薄壁", [0, 4.2, s * .27], [8.2, .3, .06], material.steel)), box("容纳独立电磁阀阵列的封闭共用机罩", [0, 4.45, 0], [8.2, .25, .62], material.red), box("槽侧独立循环供水泵箱", [4.85, .54, .3], [.8, 1.08, 1], material.dark), cord("从循环泵沿立柱回到高供水槽的实际管路", [[4.85, .7, .3], [4.5, .7, .65], [4.5, 4.25, .65], [3.9, 4.25, .1]], .065, material.steel)];
    p.push(...[-1, 1].map(s => box("两侧承柱连接供水槽的刚性短横托", [s * 4.03, 3.91, .2], [.16, .12, 1.08], material.dark)));
    for (let i = 0; i < 24; i++) {
      const x = (i - 11.5) * .32;
      p.push(part("阵列中各自有真实通孔的落水短喷嘴", "lathe", material.dark, [x, 3.85, 0], [1, 1, 1], [0, 0, 0], { profile: [{ x: .035, y: 0 }, { x: .035, y: .12 }, { x: .018, y: .12 }, { x: .018, y: 0 }, { x: .035, y: 0 }] }), { ...rod("与喷嘴和接水面相连的静态细水帘", [x, 3.85, 0], [x, .23, 0], .018, material.glass), opacity: .35 });
    }
    return p;
  } },
];
