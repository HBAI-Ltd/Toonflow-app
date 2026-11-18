import { part, ring, type ModelPart, type Triple } from "../assetModelParts";
import { combineMeshes, polygon, tapered } from "../masterNature/shared";
import { box, cylinder, rod, cup, cord, bars, plate, material, type MasterPrototype } from "./parts";

function equipmentCabinet(name: string, width: number, height: number, depth: number): ModelPart[] {
  return [box(`${name}底板`, [0, 0.025, 0], [width, 0.05, depth], material.ivory), box(`${name}顶板`, [0, height - 0.015, 0], [width, 0.03, depth], material.ivory), ...[-1, 1].map(s => box(`${name}侧板`, [s * (width / 2 - 0.012), height / 2, 0], [0.024, height - 0.05, depth], material.ivory)), box(`${name}后板`, [0, height / 2, depth / 2 - 0.012], [width - 0.048, height - 0.05, 0.024], material.ivory)];
}

function hollowDrum(name: string, p: Triple, radius: number, length: number, thickness = 0.02, rotation: Triple = [90, 0, 0]): ModelPart {
  return part(name, "lathe", material.steel, p, [1, 1, 1], rotation, { profile: [{ x: radius, y: -length / 2 }, { x: radius, y: length / 2 }, { x: radius - thickness, y: length / 2 }, { x: radius - thickness, y: -length / 2 }, { x: radius, y: -length / 2 }] });
}

export const domesticExpansionBatchFiveObjects: MasterPrototype[] = [
  { name: "斜轨齿条座椅楼梯升降机", theme: "现代", itemType: "设施", build: () => {
    const result: ModelPart[] = [...[-1, 1].map(s => rod("沿楼梯坡面布置的双根固定导轨", [s * 0.08, 0.15, -0.95], [s * 0.08, 1.91, 0.85], 0.045, material.steel)), rod("导轨中间的连续齿条承梁", [0, 0.15, -0.95], [0, 1.91, 0.85], 0.055, material.dark), box("跨双轨运动的带制动驱动小车", [0, 0.92, -0.16], [0.25, 0.2, 0.3], material.dark), cylinder("小车上保持座面水平的承托柱", [0, 1.08, -0.16], [0.08, 0.25, 0.08], material.steel), box("完整翻折坐椅软座", [0, 1.23, -0.28], [0.48, 0.09, 0.42], material.wood), box("座面后方独立靠背", [0, 1.52, -0.065], [0.47, 0.5, 0.075], material.wood), ...[-1, 1].map(s => cord("带垂直支座的座椅扶臂", [[s * 0.23, 1.23, -0.08], [s * 0.27, 1.44, -0.08], [s * 0.27, 1.44, -0.44]], 0.024, material.ivory)), box("座下随动脚踏板", [0, 0.76, -0.54], [0.43, 0.035, 0.29], material.dark), rod("脚踏板承力支杆", [0, 1.17, -0.21], [0, 0.78, -0.48], 0.035), box("扶臂末端上落控制盒", [0.27, 1.465, -0.42], [0.055, 0.04, 0.09], material.dark)];
    for (const t of [0.05, 0.5, 0.95]) { const y = 0.15 + t * 1.76, z = -0.95 + t * 1.8; result.push(rod("固定导轨的独立承重立柱", [0, 0.025, z], [0, y, z], 0.055), box("导轨立柱地面锚固板", [0, 0.025, z], [0.28, 0.05, 0.22], material.dark)); }
    return result;
  } },
  { name: "双柱丝杆垂直无障碍升降平台", theme: "现代", itemType: "设施", build: () => {
    const result: ModelPart[] = [box("无障碍平台落地基座", [0, 0.06, 0], [1.17, 0.12, 1.29], material.dark), box("可升降的轮椅承载板", [0, 0.72, -0.05], [1.02, 0.07, 1.12], material.ivory), box("前端可落平防滚翻板", [0, 0.75, -0.64], [1.01, 0.11, 0.035], material.wood)];
    for (const side of [-1, 1]) {
      result.push(box("两侧固定升降柱", [side * 0.56, 1.24, 0.46], [0.1, 2.42, 0.18], material.steel), box("沿柱滑行的长导向滑块", [side * 0.56, 0.99, 0.36], [0.12, 0.62, 0.11], material.dark), rod("平台两侧护栏立柱", [side * 0.49, 0.76, -0.45], [side * 0.49, 1.58, -0.45], 0.035), rod("后侧护栏立柱", [side * 0.49, 0.76, 0.4], [side * 0.49, 1.58, 0.4], 0.035), rod("平台两侧水平保护扶手", [side * 0.49, 1.58, -0.45], [side * 0.49, 1.58, 0.4], 0.035));
      const path = Array.from({ length: 58 }, (_, i): Triple => { const a = i / 57 * Math.PI * 12; return [Math.cos(a) * 0.024, 0.18 + i / 57 * 2.1, Math.sin(a) * 0.024]; }), screw = tapered("柱内可见的升降丝杆螺旋", material.steel, path, path.map(() => 0.004)); screw.position = { x: side * 0.56, y: 0, z: 0.35 }; result.push(screw);
    }
    result.push(rod("后部护栏横杆", [-0.49, 1.58, 0.4], [0.49, 1.58, 0.4], 0.035), box("侧柱上的独立呼梯操作盒", [0.66, 1.37, 0.36], [0.085, 0.23, 0.12], material.dark)); return result;
  } },
  { name: "顶轨卷带式护理移位吊架", theme: "现代", itemType: "设施", build: () => [
    box("安装在天花下的工字吊轨", [0, 2.56, 0], [0.11, 0.13, 3.08], material.steel), ...[-1, 1].map(s => box("吊轨两端天花锚固板", [0, 2.68, s * 1.33], [0.32, 0.065, 0.29], material.dark)),
    box("在吊轨下行走的电动卷带机", [0, 2.36, -0.15], [0.24, 0.27, 0.32], material.ivory), ...[-1, 1].map(s => cylinder("夹住轨缘的滚动小轮", [s * 0.065, 2.5, -0.15], [0.075, 0.03, 0.075], material.dark, [0, 0, 90])),
    box("从卷带机垂落的宽承重织带", [0, 1.84, -0.15], [0.035, 0.83, 0.005], material.wood), rod("织带末端的吊兜平衡梁", [-0.27, 1.4, -0.15], [0.27, 1.4, -0.15], 0.035),
    ...[-1, 1].flatMap(s => [cord("吊兜背面两侧悬带", [[s * 0.26, 1.4, -0.15], [s * 0.2, 0.94, 0.02]], 0.009, material.dark), cord("分腿兜前侧悬带", [[s * 0.26, 1.4, -0.15], [s * 0.2, 0.84, -0.43]], 0.009, material.dark), box("下方独立分腿承托片", [s * 0.13, 0.82, -0.32], [0.22, 0.02, 0.36], material.wood)]),
    box("与分腿兜连接的柔性背片", [0, 0.97, 0.015], [0.43, 0.34, 0.015], material.wood, [-12, 0, 0]), cord("手持控制器卷线", [[0.12, 2.35, -0.15], [0.32, 1.37, -0.2], [0.36, 1.32, -0.2]], 0.004), box("线端上落控制器", [0.36, 1.29, -0.2], [0.055, 0.12, 0.035], material.dark),
  ] },
  { name: "料斗气混式干冰颗粒清洗机", theme: "现代", itemType: "设施", build: () => [
    box("气混计量设备底架", [0, 0.12, 0], [0.63, 0.16, 0.65], material.dark), part("下喉真正通向给料器的保温干冰料斗", "lathe", material.ivory, [0, 0.48, 0.05], [1, 1, 1], [0, 0, 0], { profile: [{ x: 0.06, y: 0 }, { x: 0.06, y: 0.03 }, { x: 0.25, y: 0.1 }, { x: 0.25, y: 0.38 }, { x: 0.235, y: 0.38 }, { x: 0.235, y: 0.11 }, { x: 0.05, y: 0.04 }, { x: 0.05, y: 0 }, { x: 0.06, y: 0 }] }), cylinder("料斗防潮盖", [0, 0.88, 0.05], [0.53, 0.035, 0.53], material.steel),
    cylinder("料斗下方定量回转给料器", [0, 0.44, 0.01], [0.14, 0.39, 0.14], material.dark, [0, 0, 90]), box("压缩气体与干冰混合腔", [0, 0.28, 0], [0.32, 0.16, 0.23], material.steel),
    ...[-1, 1].map(s => cylinder("后部转运轮", [s * 0.29, 0.115, 0.19], [0.22, 0.065, 0.22], material.dark, [0, 0, 90])), ...[-1, 1].map(s => box("前部停放短足", [s * 0.24, 0.04, -0.23], [0.07, 0.08, 0.08], material.dark)),
    cord("后部推行弯把", [[-0.26, 0.24, 0.28], [-0.26, 1.05, 0.28], [0.26, 1.05, 0.28], [0.26, 0.24, 0.28]], 0.025),
    cord("前部大口径干冰喷射软管", [[0.13, 0.31, -0.12], [0.39, 0.06, -0.3], [0.48, 0.52, -0.24]], 0.027, material.dark), rod("软管末端手持喷射管", [0.48, 0.52, -0.24], [0.48, 0.72, -0.51], 0.035, material.steel), box("喷枪侧向扳机握柄", [0.48, 0.56, -0.23], [0.045, 0.13, 0.05], material.dark), box("计量压力控制面", [0, 0.6, -0.245], [0.29, 0.15, 0.035], material.dark),
  ] },
  { name: "卧式长筒地毯离心甩干机", theme: "现代", itemType: "设施", build: () => {
    const result: ModelPart[] = [hollowDrum("允许卷毯装入的长轴外筒", [0, 0.86, 0], 0.44, 3.6, 0.035, [0, 0, 90]), hollowDrum("外筒内独立旋转甩水内筒", [0, 0.86, 0], 0.365, 3.43, 0.018, [0, 0, 90]), ...[-1, 1].map(s => box("整机落地长底梁", [0, 0.09, s * 0.31], [3.95, 0.18, 0.13], material.dark))];
    for (const x of [-1.35, 1.35]) for (const side of [-1, 1]) result.push(rod("两端斜置减振托架", [x, 0.18, side * 0.31], [x, 0.74, side * 0.19], 0.09));
    result.push(cylinder("左端固定传动封头", [-1.82, 0.86, 0], [0.86, 0.07, 0.86], material.steel, [0, 0, 90]), cylinder("左端同轴驱动电机", [-2.08, 0.86, 0], [0.28, 0.4, 0.28], material.dark, [0, 0, 90]), ring("右端装毯口压紧法兰", material.dark, 0.45, 0.052, 0, 0.065, { position: { x: 1.82, y: 0.86, z: 0 }, rotation: { x: 0, y: 0, z: 90 } }), cylinder("绕侧边铰轴打开的圆形压力门", [1.82 + 0.42 * Math.sin(70 * Math.PI / 180), 0.86, 0.42 - 0.42 * Math.cos(70 * Math.PI / 180)], [0.84, 0.045, 0.84], material.ivory, [0, -70, 90]), rod("压力门外侧竖直铰轴", [1.82, 0.65, 0.42], [1.82, 1.07, 0.42], 0.04),
    ring("外筒底部离心水排出口", material.dark, 0.031, 0.006, 0.38, 0.12), box("靠侧端的独立启停操作柱", [1.13, 0.68, -0.59], [0.13, 1.08, 0.14], material.dark));
    return result;
  } },
  { name: "分舱滚筒连续隧道洗衣机", theme: "现代", itemType: "设施", build: () => {
    const result: ModelPart[] = [...[-1, 1].map(s => box("沿洗衣隧道连续支承底梁", [s * 0.8, 0.23, 0], [0.18, 0.45, 6.8], material.dark)), box("下方循环洗液总槽", [0, 0.49, 0], [1.45, 0.36, 6.4], material.ivory)];
    for (let i = 0; i < 5; i++) {
      const z = (i - 2) * 1.24;
      result.push(hollowDrum("独立分舱连续洗衣外壳", [0, 1.44, z], 0.83, 1.2, 0.045), ring("每舱滚筒内的分料隔板", material.dark, 0.78, 0.14, 0, 0.05, { position: { x: 0, y: 1.44, z: z + 0.5 }, rotation: { x: 90, y: 0, z: 0 } }), cylinder("每舱下侧回转驱动减速机", [0.91, 0.99, z], [0.23, 0.28, 0.23], material.dark, [0, 0, 90]));
      if (i < 4) result.push(hollowDrum("相邻洗衣分舱的柔性密封接环", [0, 1.44, z + 0.62], 0.84, 0.08, 0.055));
    }
    result.push(part("前端开放装衣斜导槽", "extrude", material.steel, [0, 0.7, -3.66], [1, 1, 1], [0, 90, 0], { depth: 1.2, profile: [{ x: -0.45, y: 0 }, { x: 0.32, y: 0.68 }, { x: 0.35, y: 0.67 }, { x: -0.43, y: -0.025 }] }), rod("各洗衣分舱的上部总供液管", [-0.36, 2.28, -2.8], [-0.36, 2.28, 2.8], 0.055), box("侧置隧道洗衣程序柜", [1.24, 1.22, -1.65], [0.43, 1.8, 0.65], material.dark));
    for (let i = 0; i < 5; i++) result.push(rod("总管至每个分舱的独立供液支路", [-0.36, 2.28, (i - 2) * 1.24], [0, 2.18, (i - 2) * 1.24], 0.027));
    return result;
  } },
  { name: "隔膜液压布草压水脱水机", theme: "现代", itemType: "设施", build: () => {
    const result: ModelPart[] = [box("压水机整体厚底台", [0, 0.13, 0], [1.65, 0.26, 1.55], material.dark), ring("下部承衣沥水压筐", material.steel, 0.62, 0.07, 0.67, 0.66), cylinder("压筐底部承载圆盘", [0, 0.34, 0], [1.23, 0.075, 1.23], material.steel), box("四柱上方主承压横板", [0, 2.04, 0], [1.6, 0.17, 1.48], material.steel), cylinder("中央向下施压液压主缸", [0, 1.7, 0], [0.4, 0.58, 0.4], material.dark), cylinder("伸入衣筐的液压活塞", [0, 1.27, 0], [0.19, 0.34, 0.19], material.steel), cylinder("接触布草的弹性隔膜压盘", [0, 1.06, 0], [1.08, 0.09, 1.08], material.wood)];
    for (const x of [-1, 1]) for (const z of [-1, 1]) result.push(cylinder("承受整机反力的四根立柱", [x * 0.68, 1.13, z * 0.62], [0.12, 1.83, 0.12], material.steel));
    result.push(box("一侧独立液压泵箱", [1.08, 0.44, 0.3], [0.48, 0.78, 0.7], material.dark), cord("泵箱至主缸的供压软管", [[1.08, 0.82, 0.3], [1, 1.9, 0.3], [0.18, 1.94, 0.03]], 0.018), ring("底部排走压出液体的水口", material.dark, 0.036, 0.008, 0, 0.23, { position: { x: 0, y: 0.28, z: -0.73 }, rotation: { x: 90, y: 0, z: 0 } })); return result;
  } },
  { name: "转篮喷淋零件清洗柜", theme: "现代", itemType: "设施", build: () => {
    const result: ModelPart[] = [...equipmentCabinet("可转篮喷淋清洗柜", 1.05, 1.58, 0.93), ring("柜内转动清洗篮外缘", material.dark, 0.39, 0.026, 0.66, 0.06), cylinder("承托清洗篮的电驱主轴", [0, 0.49, 0], [0.075, 0.29, 0.075], material.dark), ...bars("清洗篮贯通底栅", 11, [0, 0.64, 0], 0.65, [0.012, 0.02, 0.5], 0), box("下部循环清洗液储箱", [0, 0.19, 0], [0.94, 0.28, 0.8], material.dark), box("打开的独立密封前门", [0.5 - 0.475 * Math.cos(105 * Math.PI / 180), 0.94, -0.48 - 0.475 * Math.sin(105 * Math.PI / 180)], [0.95, 1.17, 0.045], material.ivory, [0, -105, 0]), rod("密封前门竖直铰轴", [0.5, 0.35, -0.48], [0.5, 1.53, -0.48], 0.024)];
    for (const side of [-1, 1]) result.push(rod("清洗腔两侧竖向喷淋管", [side * 0.4, 0.53, 0.33], [side * 0.4, 1.32, 0.33], 0.024), ...[0.69, 1, 1.26].map(y => cylinder("朝向转篮的喷淋嘴", [side * 0.375, y, 0.33], [0.025, 0.055, 0.025], material.steel, [0, 0, 90])));
    result.push(box("清洗柜侧置温压操作盒", [0.58, 1.27, 0.07], [0.15, 0.35, 0.25], material.dark), cylinder("底部循环泵电机", [0.34, 0.19, 0.24], [0.19, 0.22, 0.19], material.steel)); return result;
  } },
  { name: "双手套隔离式喷砂清理柜", theme: "现代", itemType: "设施", build: () => {
    const result: ModelPart[] = [box("喷砂柜后背板", [0, 1.07, 0.37], [1.05, 0.87, 0.035], material.steel), box("柜顶照明检修盖", [0, 1.52, 0], [1.1, 0.06, 0.79], material.ivory), ...[-1, 1].map(s => box("喷砂柜两侧壳板", [s * 0.53, 1.07, 0], [0.035, 0.87, 0.79], material.steel)), { ...box("向操作者倾斜的透明观察窗", [0, 1.31, -0.36], [0.88, 0.37, 0.015], material.glass, [-20, 0, 0]), opacity: 0.3 }, ...[-1, 1].flatMap(x => [-1, 1].map(z => box("柜体四脚支架", [x * 0.45, 0.34, z * 0.29], [0.07, 0.68, 0.07], material.dark)))];
    const holes = [-1, 1].map(s => Array.from({ length: 12 }, (_, i): [number, number] => { const a = i * Math.PI / 6; return [s * 0.24 + Math.cos(a) * 0.085, Math.sin(a) * 0.085]; })), face = polygon("带两个真正手套孔的前操作壁", material.ivory, [[-0.51, -0.17], [0.51, -0.17], [0.51, 0.17], [-0.51, 0.17]], 0.025, [0, 0.94, -0.41], holes);
    face.rotation.x = 90; result.push(face, ...bars("放置零件的开放耐磨底栅", 12, [0, 0.73, 0], 0.88, [0.025, 0.025, 0.65], 0, material.dark));
    for (const side of [-1, 1]) result.push(cord("穿过真实操作孔的密封手套袖", [[side * 0.24, 0.94, -0.39], [side * 0.24, 0.9, -0.22], [side * 0.17, 0.86, -0.09]], 0.06, material.wood), part("袖端的封闭橡胶手掌", "capsule", material.wood, [side * 0.17, 0.86, -0.04], [0.09, 0.13, 0.065], [90, 0, 0]));
    result.push(part("底部回收磨料的锥形集料斗", "lathe", material.dark, [0, 0.34, 0], [1, 1, 1], [0, 0, 0], { profile: [{ x: 0.055, y: 0 }, { x: 0.45, y: 0.36 }, { x: 0.434, y: 0.36 }, { x: 0.045, y: 0 }, { x: 0.055, y: 0 }] }), box("前方喷砂控制脚踏", [0.22, 0.035, -0.59], [0.19, 0.06, 0.23], material.dark)); return result;
  } },
  { name: "光纤手持式激光除锈清洗机", theme: "现代", itemType: "设施", build: () => [
    ...equipmentCabinet("推行式激光电源机柜", 0.51, 0.78, 0.63), box("前端冷却散热格背", [0, 0.38, -0.315], [0.45, 0.64, 0.02], material.dark), ...bars("散热百叶实条", 9, [0, 0.34, -0.33], 0.43, [0.42, 0.012, 0.025], 1, material.steel),
    ...[-1, 1].flatMap(x => [-1, 1].map(z => cylinder("锁止移动脚轮", [x * 0.21, 0.04, z * 0.24], [0.075, 0.04, 0.075], material.dark, [0, 0, 90]))), box("机柜顶面的触控操作屏", [0, 0.82, -0.08], [0.33, 0.035, 0.23], material.glass, [-15, 0, 0]),
    cord("连接机柜与清洗头的光纤护套", [[0.22, 0.69, 0.23], [0.47, 0.12, 0.29], [0.61, 0.13, -0.09], [0.54, 0.82, -0.18]], 0.019, material.dark), box("独立手持振镜扫描头", [0.54, 0.9, -0.23], [0.12, 0.14, 0.25], material.ivory), box("清洗头下方握柄", [0.54, 0.78, -0.14], [0.045, 0.16, 0.055], material.dark),
    cylinder("清洗头实际光学出射窗", [0.54, 0.91, -0.36], [0.075, 0.015, 0.075], material.glass, [90, 0, 0]), cord("机柜后上推行把", [[-0.2, 0.61, 0.27], [-0.2, 0.97, 0.29], [0.2, 0.97, 0.29], [0.2, 0.61, 0.27]], 0.022),
  ] },
  { name: "双提升机悬吊外墙作业篮", theme: "现代", itemType: "设施", build: () => {
    const result: ModelPart[] = [box("两人可站立的防滑篮底", [0, 0.08, 0], [2.15, 0.12, 0.77], material.steel), ...[-1, 1].flatMap(x => [-1, 1].map(z => rod("篮角护栏立柱", [x * 1.03, 0.12, z * 0.34], [x * 1.03, 1.15, z * 0.34], 0.045))), ...[-1, 1].flatMap(s => [rod("篮的前后上部护栏", [-1.03, 1.15, s * 0.34], [1.03, 1.15, s * 0.34], 0.04), rod("篮的前后中部护栏", [-1.03, 0.65, s * 0.34], [1.03, 0.65, s * 0.34], 0.03)]), ...[-1, 1].map(s => rod("篮的两端上横杆", [s * 1.03, 1.15, -0.34], [s * 1.03, 1.15, 0.34], 0.04))];
    for (const side of [-1, 1]) result.push(box("篮端独立穿绳提升机", [side * 0.96, 0.5, 0], [0.23, 0.49, 0.29], material.dark), cylinder("提升机旁的防坠安全锁", [side * 1.07, 0.82, 0.1], [0.08, 0.16, 0.08], material.steel), rod("穿过提升机的承重钢索", [side * 0.96, 0.04, 0], [side * 0.96, 2.1, 0], 0.008, material.dark), rod("独立穿过安全锁的保险钢索", [side * 1.07, 0.06, 0.1], [side * 1.07, 2.1, 0.1], 0.006, material.dark));
    result.push(box("篮中独立启停操作盒", [0, 0.78, 0.32], [0.27, 0.23, 0.09], material.ivory)); return result;
  } },
  { name: "多袋加温式腹膜透析液交换机", theme: "现代", itemType: "设施", build: () => [
    ...equipmentCabinet("腹膜液交换机", 0.43, 0.31, 0.36), box("上部袋液加温托盘", [0, 0.34, 0], [0.41, 0.045, 0.35], material.dark), { ...box("置于托盘的柔性透析液袋", [0, 0.39, 0], [0.34, 0.055, 0.28], material.glass), opacity: 0.35 },
    box("机前液路卡匣装夹门", [0, 0.17, -0.19], [0.29, 0.19, 0.025], material.ivory), box("前部操作读数显示屏", [0, 0.27, -0.21], [0.22, 0.075, 0.015], material.glass),
    rod("旁侧独立多袋悬挂立柱", [0.39, 0.03, 0.08], [0.39, 1.15, 0.08], 0.035), rod("顶端双袋悬挂横梁", [0.11, 1.15, 0.08], [0.67, 1.15, 0.08], 0.022),
    ...[-1, 1].map(s => ({ ...box("挂在横梁上的柔性备用液袋", [0.39 + s * 0.18, 0.91, 0.08], [0.22, 0.33, 0.07], material.glass), opacity: 0.35 })),
    ...[-1, 1].map(s => cord("各液袋到卡匣的独立液路", [[0.39 + s * 0.18, 0.745, 0.08], [0.34, 0.54, -0.08], [0.1 + s * 0.035, 0.14, -0.21]], 0.004)),
    cup("下方独立废液承收桶", [0.35, 0.01, -0.39], 0.17, 0.27, material.ivory), cord("交换机到废液桶的排出管", [[-0.07, 0.14, -0.21], [0.02, 0.03, -0.36], [0.35, 0.26, -0.39]], 0.005),
    ...Array.from({ length: 3 }, (_, i) => { const a = i * Math.PI * 2 / 3; return rod("挂袋立柱三向稳固底足", [0.39, 0.09, 0.08], [0.39 + Math.cos(a) * 0.28, 0.025, 0.08 + Math.sin(a) * 0.28], 0.035); }),
  ] },
  { name: "双仓化学储污便携坐便器", theme: "现代", itemType: "设施", build: () => [
    box("下部可拆密闭储污箱", [0, 0.13, 0], [0.39, 0.25, 0.43], material.dark), ...[-1, 1].flatMap(s => [box("围绕便池的清水箱左右壁", [s * 0.185, 0.335, 0], [0.02, 0.16, 0.43], material.ivory), box("清水箱前后壁", [0, 0.335, s * 0.205], [0.35, 0.16, 0.02], material.ivory)]),
    polygon("开出实际便池孔的清水箱顶片", material.ivory, [[-0.195, -0.215], [0.195, -0.215], [0.195, 0.215], [-0.195, 0.215]], 0.01, [0, 0.405, 0], [Array.from({ length: 16 }, (_, i): [number, number] => { const a = i * Math.PI / 8; return [Math.cos(a) * 0.142, Math.sin(a) * 0.16]; })]),
    ring("中部真正贯通的椭圆如厕座圈", material.ivory, 0.17, 0.037, 0.435, 0.04, { scale: { x: 1, y: 1, z: 1.15 } }), part("座圈下方真实承接漏斗", "lathe", material.ivory, [0, 0.28, 0], [1, 1, 1.1], [0, 0, 0], { profile: [{ x: 0.06, y: 0 }, { x: 0.06, y: 0.025 }, { x: 0.145, y: 0.145 }, { x: 0.135, y: 0.135 }, { x: 0.05, y: 0.025 }, { x: 0.05, y: 0 }, { x: 0.06, y: 0 }] }), ring("上下仓之间的滑闸排污喉道", material.dark, 0.052, 0.007, 0.269, 0.035),
    cylinder("独立清水冲洗手压泵", [0.155, 0.43, 0.13], [0.045, 0.11, 0.045], material.dark), rod("向前抽开储污口闸板的拉柄", [0, 0.25, -0.21], [0, 0.25, -0.32], 0.02), rod("抽闸手握横柄", [-0.065, 0.25, -0.32], [0.065, 0.25, -0.32], 0.025, material.ivory),
    ...[-1, 1].map(s => box("上下两仓侧向连接锁扣", [s * 0.205, 0.26, 0], [0.025, 0.12, 0.07], material.wood)), cylinder("后部储污箱排放管封帽", [0.14, 0.17, 0.23], [0.07, 0.035, 0.07], material.ivory, [90, 0, 0]),
  ] },
  { name: "抬罩卧姿自动喷淋洗浴舱", theme: "现代", itemType: "设施", build: () => {
    const arch: [number, number][] = [...Array.from({ length: 9 }, (_, i): [number, number] => { const a = Math.PI - i * Math.PI / 8; return [Math.cos(a) * 0.55, Math.sin(a) * 0.5]; }), ...Array.from({ length: 9 }, (_, i): [number, number] => { const a = i * Math.PI / 8; return [Math.cos(a) * 0.525, Math.sin(a) * 0.475]; })];
    const result: ModelPart[] = [box("下方温配循环机箱", [0, 0.28, 0], [1.04, 0.53, 2.23], material.ivory), ...[-1, 1].map(s => box("洗浴承水盆长侧壁", [s * 0.5, 0.63, 0], [0.035, 0.25, 2.2], material.ivory)), ...[-1, 1].map(s => box("洗浴承水盆首尾端壁", [0, 0.63, s * 1.09], [0.98, 0.25, 0.035], material.ivory)), ...bars("卧姿承托的可排水窄条床面", 16, [0, 0.64, 0], 1.96, [0.82, 0.025, 0.095], 2, material.wood),
      part("绕脚端铰点打开的薄壁弧罩", "extrude", material.ivory, [0, 0.73 + 0.95 * Math.sin(38 * Math.PI / 180), 1.05 - 0.95 * Math.cos(38 * Math.PI / 180)], [1, 1, 1], [38, 0, 0], { profile: arch.map(([x, y]) => ({ x, y })), depth: 1.9 }), rod("脚端弧罩贯通翻转铰轴", [-0.48, 0.73, 1.05], [0.48, 0.73, 1.05], 0.035), box("舱内可移动的头颈枕托", [0, 0.73, -0.9], [0.4, 0.12, 0.27], material.ivory)];
    for (const side of [-1, 1]) result.push(rod("沿承水盆两侧的喷淋总管", [side * 0.42, 0.75, -0.87], [side * 0.42, 0.75, 0.89], 0.025), ...Array.from({ length: 6 }, (_, i) => cylinder("朝躯干区喷淋的独立嘴", [side * 0.405, 0.75, -0.75 + i * 0.3], [0.02, 0.045, 0.02], material.dark, [0, 0, 90])), rod("弧罩两侧的限位撑杆", [side * 0.49, 0.61, 0.41], [side * 0.49, 1.21, 0.73], 0.022));
    result.push(box("设备脚端的温配控制台", [0.4, 0.9, 1.27], [0.25, 0.5, 0.22], material.dark), ring("底部可排出的废水接口", material.dark, 0.03, 0.006, 0, 0.13, { position: { x: 0, y: 0.17, z: 1.14 }, rotation: { x: 90, y: 0, z: 0 } })); return result;
  } },
  { name: "平板玻璃双面辊刷清洗干燥台", theme: "现代", itemType: "设施", build: () => {
    const result: ModelPart[] = [...[-1, 1].flatMap(x => [-1, 1].map(z => box("长台两侧落地支腿", [x * 1.02, 0.52, z * 1.85], [0.13, 1.04, 0.13], material.dark))), ...[-1, 1].map(s => box("滚道两侧贯通承重边梁", [s * 1.02, 1.03, 0], [0.13, 0.18, 4.2], material.steel)), box("下部封闭循环洗液槽", [0, 0.4, -0.35], [1.87, 0.42, 2.3], material.ivory)];
    for (let i = 0; i < 12; i++) result.push(cylinder("支承平板玻璃的横向滚轮", [0, 1.09, -1.94 + i * 0.35], [0.1, 1.98, 0.1], material.dark, [0, 0, 90]));
    for (const z of [-0.62, 0.03]) for (const side of [-1, 1]) result.push(cylinder("玻璃上下两面的独立刷辊", [0, 1.14 + side * 0.115, z], [0.2, 1.9, 0.2], material.wood, [0, 0, 90]), rod("沿整幅刷洗面的供水横管", [-0.97, 1.43, z], [0.97, 1.43, z], 0.025));
    for (const side of [-1, 1]) result.push(box("上下成对的狭缝吹干气刀", [0, 1.14 + side * 0.1, 1.02], [1.91, 0.09, 0.08], material.steel), box("横跨清洗段的外罩侧板", [side * 1.06, 1.44, -0.35], [0.04, 0.68, 1.82], material.ivory));
    result.push(box("清洗段上部防溅罩", [0, 1.78, -0.35], [2.16, 0.045, 1.82], material.ivory), box("一侧气刀送风机", [1.37, 0.6, 1.02], [0.52, 0.67, 0.61], material.dark), cord("风机到气刀的导风弯管", [[1.37, 0.92, 1.02], [1.3, 1.28, 1.02], [0.9, 1.28, 1.02]], 0.055)); return result;
  } },
  { name: "输送带刮收式自动猫厕", theme: "现代", itemType: "设施", build: () => [
    box("低位闭合传送带机架", [0, 0.09, 0], [0.59, 0.16, 0.92], material.ivory), box("猫可站立的上部工作带", [0, 0.205, 0], [0.49, 0.012, 0.72], material.dark), box("下部回行带", [0, 0.095, 0], [0.49, 0.012, 0.72], material.dark),
    ...[-1, 1].map(s => cylinder("工作带两端驱动辊", [0, 0.15, s * 0.36], [0.11, 0.49, 0.11], material.dark, [0, 0, 90])), ...[-1, 1].map(s => box("入口两侧防溅矮壁", [s * 0.275, 0.3, -0.03], [0.025, 0.21, 0.81], material.ivory)),
    box("后端紧贴带面的刮收刀条", [0, 0.204, 0.412], [0.5, 0.035, 0.008], material.steel), box("封闭集污后仓底板", [0, 0.11, 0.6], [0.56, 0.03, 0.32], material.dark), ...[-1, 1].map(s => box("集污仓左右壁", [s * 0.265, 0.27, 0.6], [0.025, 0.29, 0.32], material.dark)), box("集污仓后壁", [0, 0.27, 0.75], [0.53, 0.29, 0.025], material.dark), box("集污仓独立密封盖", [0, 0.43, 0.6], [0.57, 0.035, 0.33], material.ivory),
    cylinder("机侧低速驱动齿轮电机", [0.335, 0.16, 0.35], [0.11, 0.13, 0.11], material.steel, [0, 0, 90]), box("侧壁安全感应控制盒", [0.315, 0.36, 0.1], [0.055, 0.16, 0.15], material.dark),
  ] },
  { name: "夹鞋对转刷轮专用洗鞋机", theme: "现代", itemType: "设施", build: () => {
    const result: ModelPart[] = [box("机底循环水泵箱", [0, 0.11, 0], [0.65, 0.2, 0.64], material.dark), ...[-1, 1].flatMap(s => [box("清洗腔两侧挡水壁", [s * 0.31, 0.47, 0], [0.025, 0.52, 0.64], material.ivory), box("清洗腔前后挡水壁", [0, 0.47, s * 0.305], [0.6, 0.52, 0.025], material.ivory)]),
      { ...box("绕后铰轴打开的透明上盖", [0, 0.735 + Math.sin(65 * Math.PI / 180) * 0.3, 0.3 - Math.cos(65 * Math.PI / 180) * 0.3], [0.65, 0.02, 0.6], material.glass, [65, 0, 0]), opacity: 0.3 }, rod("后缘上盖真实铰轴", [-0.3, 0.735, 0.3], [0.3, 0.735, 0.3], 0.019), cylinder("下方刷洗鞋底的横向滚刷", [0, 0.29, -0.08], [0.11, 0.47, 0.11], material.dark, [0, 0, 90])];
    for (const side of [-1, 1]) {
      result.push(cylinder("清洗鞋帮的对转竖刷", [side * 0.2, 0.49, 0], [0.14, 0.39, 0.14], material.wood), rod("固定鞋体的独立承鞋立柱", [side * 0.074, 0.26, 0.11], [side * 0.074, 0.56, 0.11], 0.025), cord("套入鞋口的可压夹持弯架", [[side * 0.074, 0.55, 0.11], [side * 0.074, 0.64, 0.08], [side * 0.074, 0.64, -0.12], [side * 0.074, 0.56, -0.15]], 0.01, material.steel));
      for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; result.push(rod("竖刷外缘纵向刷毛排", [side * 0.2 + Math.cos(a) * 0.075, 0.315, Math.sin(a) * 0.075], [side * 0.2 + Math.cos(a) * 0.075, 0.665, Math.sin(a) * 0.075], 0.012, material.wood)); }
    }
    result.push(box("上缘分区清洗控制面", [0.22, 0.8, 0.24], [0.19, 0.1, 0.12], material.dark)); return result;
  } },
  { name: "张紧细线叉式牙线弓", theme: "现代", itemType: "器物", build: () => {
    const floss = tapered("真实亚毫米厚度的跨叉牙线", material.ivory, [[-0.018, 0.009, -0.061], [0.018, 0.009, -0.061]], [0.00015, 0.00015]);
    return [rod("后部扁长握柄", [0, 0.009, 0.055], [0, 0.009, -0.022], 0.008, material.ivory), ...[-1, 1].flatMap(s => [rod("握柄到叉颚的斜向连接", [0, 0.009, -0.022], [s * 0.018, 0.009, -0.03], 0.005, material.ivory), rod("独立持线叉臂", [s * 0.018, 0.009, -0.03], [s * 0.018, 0.009, -0.062], 0.005, material.ivory)]), floss];
  } },
  { name: "螺旋排毛牙间隙刷", theme: "现代", itemType: "器物", build: () => {
    const hairs: ModelPart[] = [];
    for (let i = 0; i < 24; i++) { const a = i * Math.PI * 0.7, z = -0.024 + i * 0.0008, tip: Triple = [Math.cos(a) * 0.0015, 0.004 + Math.sin(a) * 0.0015, z]; hairs.push(tapered("细丝径向刷毛", material.ivory, [[0, 0.004, z], tip], [0.00015, 0.00015])); }
    return [cylinder("短柄胶握套", [0, 0.004, 0.025], [0.006, 0.05, 0.006], material.wood, [90, 0, 0]), tapered("贯穿刷毛的真实细金属芯", material.steel, [[0, 0.004, -0.027], [0, 0.004, 0.003]], [0.0002, 0.0002]), combineMeshes("完整螺旋排布牙缝刷毛", material.ivory, hairs)];
  } },
  { name: "双柄半环薄带刮舌器", theme: "现代", itemType: "器物", build: () => {
    const outline: [number, number][] = [...Array.from({ length: 13 }, (_, i): [number, number] => { const a = Math.PI + i * Math.PI / 12; return [Math.cos(a) * 0.023, Math.sin(a) * 0.023]; }), ...Array.from({ length: 13 }, (_, i): [number, number] => { const a = Math.PI * 2 - i * Math.PI / 12; return [Math.cos(a) * 0.021, Math.sin(a) * 0.021]; })];
    return [polygon("真正留空的半环刮舌薄带", material.steel, outline, 0.001, [0, 0.002, -0.035]), ...[-1, 1].map(s => rod("半环末端延长双握柄", [s * 0.022, 0.0025, -0.035], [s * 0.024, 0.0025, 0.073], 0.002, material.steel)), ...[-1, 1].map(s => cylinder("末端防滑短握套", [s * 0.024, 0.0025, 0.05], [0.004, 0.047, 0.004], material.wood, [90, 0, 0]))];
  } },
  { name: "圆筒旋切电动鼻毛修剪器", theme: "现代", itemType: "器物", build: () => [
    cylinder("细长独立电池握持机身", [0, 0.055, 0], [0.025, 0.11, 0.025], material.dark), cylinder("上端收窄电机传动颈", [0, 0.119, 0], [0.018, 0.022, 0.018], material.steel), ring("旋切护罩下环", material.steel, 0.008, 0.0015, 0.134, 0.005), ring("旋切护罩上环", material.steel, 0.008, 0.0015, 0.149, 0.004),
    ...Array.from({ length: 6 }, (_, i) => { const a = i * Math.PI / 3; return rod("留有导毛开槽的护罩窄肋", [Math.cos(a) * 0.007, 0.134, Math.sin(a) * 0.007], [Math.cos(a) * 0.007, 0.148, Math.sin(a) * 0.007], 0.0015, material.steel); }), cylinder("护罩内部旋切主轴", [0, 0.14, 0], [0.005, 0.02, 0.005], material.dark), box("机身正面的滑动电源键", [0, 0.071, -0.013], [0.01, 0.025, 0.003], material.ivory),
  ] },
  { name: "浅凹匙端长柄耳勺", theme: "现代", itemType: "器物", build: () => [
    rod("连续细长持握勺柄", [0, 0.0015, 0.061], [0, 0.0015, -0.059], 0.0025, material.steel), part("真实凹入的椭圆耳勺匙", "lathe", material.steel, [0, 0, -0.064], [1, 1, 1.5], [0, 0, 0], { profile: [{ x: 0, y: 0 }, { x: 0.0025, y: 0 }, { x: 0.004, y: 0.0015 }, { x: 0.0042, y: 0.0025 }, { x: 0.0036, y: 0.0025 }, { x: 0.0021, y: 0.0005 }, { x: 0, y: 0.0005 }] }), cylinder("握柄后段防滑细套", [0, 0.0015, 0.03], [0.004, 0.055, 0.004], material.wood, [90, 0, 0]),
  ] },
  { name: "双环粉刺压取器", theme: "现代", itemType: "器物", build: () => [
    rod("中间不锈钢手握杆", [0, 0.002, -0.055], [0, 0.002, 0.055], 0.003, material.steel), ring("一端真正中空的小压取环", material.steel, 0.0035, 0.001, 0.002, 0.0012, { position: { x: 0, y: 0.002, z: -0.059 } }), ring("另一端扁椭圆压取环", material.steel, 0.0045, 0.001, 0.002, 0.0012, { position: { x: 0, y: 0.002, z: 0.061 }, scale: { x: 0.65, y: 1, z: 1.45 } }), cylinder("中部防滑握柄包套", [0, 0.002, 0], [0.005, 0.06, 0.005], material.wood, [90, 0, 0]),
  ] },
  { name: "柔性气垫排针发刷", theme: "现代", itemType: "器物", build: () => {
    const result: ModelPart[] = [part("椭圆微拱承针气垫", "sphere", material.dark, [0, 0.012, -0.018], [0.058, 0.017, 0.086]), part("气垫下方承力背壳", "sphere", material.wood, [0, 0.005, -0.018], [0.061, 0.014, 0.089]), rod("连接背壳的持握柄", [0, 0.005, 0.011], [0, 0.005, 0.12], 0.019, material.wood)];
    for (let row = 0; row < 7; row++) for (let col = 0; col < 5; col++) { const x = (col - 2) * 0.01, z = (row - 3) * 0.01; if ((x / 0.026) ** 2 + (z / 0.038) ** 2 > 1) continue; const y = 0.012 + Math.sqrt(1 - (x / 0.029) ** 2 - (z / 0.043) ** 2) * 0.0085; result.push(rod("独立弹性梳针", [x, y, -0.018 + z], [x, y + 0.014, -0.018 + z], 0.0015, material.ivory)); }
    return result;
  } },
  { name: "网孔空心定型卷发筒", theme: "现代", itemType: "器物", build: () => {
    const result: ModelPart[] = [...[-1, 1].map(s => ring("卷筒两端中空端圈", material.wood, 0.02, 0.002, 0, 0.004, { position: { x: s * 0.031, y: 0.023, z: 0 }, rotation: { x: 0, y: 0, z: 90 } }))];
    for (let i = 0; i < 14; i++) { const a = i * Math.PI / 7; result.push(rod("沿筒轴的真实镂空支肋", [-0.031, 0.023 + Math.cos(a) * 0.019, Math.sin(a) * 0.019], [0.031, 0.023 + Math.cos(a) * 0.019, Math.sin(a) * 0.019], 0.0015, material.wood)); }
    result.push(ring("筒身中段的镂空连接箍", material.wood, 0.02, 0.0015, 0, 0.002, { position: { x: 0, y: 0.023, z: 0 }, rotation: { x: 0, y: 0, z: 90 } })); return result;
  } },
];
