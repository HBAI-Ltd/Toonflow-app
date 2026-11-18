import { part, ring, type ModelPart, type Triple } from "../assetModelParts";
import { polygon } from "../masterNature/shared";
import { box, cylinder, strut, transportColors, wheel, type TransportDefinition } from "./parts";

function locomotiveWheelset(z: number, radius: number, halfGauge = .7175): ModelPart[] {
  const y = radius + .035;
  const parts: ModelPart[] = [cylinder("贯穿钢轮与两端轴箱的承重整轴", [0, y, z], [.18, (halfGauge + .4) * 2, .18], transportColors.dark, [0, 0, 90])];
  for (const side of [-1, 1]) parts.push(part("内侧独立轮缘与平直踏面的铁路钢轮", "lathe", transportColors.dark, [side * (halfGauge + .08), y, z], [1, 1, 1], [0, 0, -side * 90], { profile: [{ x: .085, y: -.1175 }, { x: radius + .035, y: -.1175 }, { x: radius + .035, y: -.09 }, { x: radius, y: -.09 }, { x: radius, y: .13 }, { x: radius * .74, y: .13 }, { x: radius * .68, y: .055 }, { x: .085, y: .055 }, { x: .085, y: -.1175 }] }));
  return parts;
}

function locomotiveFrame(length: number, axles: number[], radius: number, width: number, frameY: number, halfGauge = .7175): ModelPart[] {
  const parts: ModelPart[] = axles.flatMap(z => locomotiveWheelset(z, radius, halfGauge));
  for (const side of [-1, 1]) {
    parts.push(box("贯通车端缓冲梁的承力纵梁", [side * (width / 2 - .16), frameY, 0], [.2, .28, length], transportColors.dark));
    for (const z of axles) {
      const bottom = radius - .095, top = frameY + .04;
      parts.push(box("由承重钢轴连续接入纵梁的轴箱吊座", [side * (halfGauge + .32), (bottom + top) / 2, z], [.24, top - bottom, .34], transportColors.body));
    }
  }
  for (const end of [-1, 1]) parts.push(box("接合两根纵梁的车端缓冲横梁", [0, frameY, end * (length / 2 - .12)], [width, .3, .25], transportColors.body), box("由缓冲横梁承接的车钩牵引柄", [0, frameY, end * (length / 2 + .18)], [.23, .2, .5], transportColors.dark));
  return parts;
}

function windowCab(position: Triple, size: Triple): ModelPart[] {
  const [x, y, z] = position, [width, height, depth] = size;
  const lower = height * .56, upper = height * .9;
  const parts: ModelPart[] = [box("驾驶室可站立的实承地板", [x, y, z], [width, .14, depth], transportColors.dark), box("同时承接四面窗框的驾驶室屋盖", [x, y + height, z], [width + .14, .13, depth + .14], transportColors.trim)];
  for (const end of [-1, 1]) {
    const frame = polygon("驾驶室前后端保留真实透窗的整体围护", transportColors.body, [[-width / 2, .02], [width / 2, .02], [width / 2, -height], [-width / 2, -height]], .08, [x, y, z + end * depth / 2 - .04], [[[-width * .35, -lower], [width * .35, -lower], [width * .35, -upper], [-width * .35, -upper]]]);
    frame.rotation.x = 90;
    parts.push(frame, part("嵌在真实孔洞内的前后透光风挡", "box", transportColors.glass, [x, y + (lower + upper) / 2, z + end * depth / 2], [width * .7, upper - lower, .018], [0, 0, 0], { opacity: .5 }));
  }
  for (const side of [-1, 1]) {
    const frame = polygon("驾驶室与地板屋盖相接的侧面透孔窗框", transportColors.body, [[-.02, -depth / 2], [height, -depth / 2], [height, depth / 2], [-.02, depth / 2]], .08, [x + side * width / 2 + .04, y, z], [[[lower, -depth * .35], [upper, -depth * .35], [upper, depth * .35], [lower, depth * .35]]]);
    frame.rotation.z = 90;
    parts.push(frame, part("侧窗孔中的独立透明玻璃", "box", transportColors.glass, [x + side * width / 2, y + (lower + upper) / 2, z], [.018, upper - lower, depth * .7], [0, 0, 0], { opacity: .5 }));
  }
  parts.push(box("独立于围护的司机坐垫", [x - width * .2, y + .61, z + depth * .12], [.48, .1, .48], transportColors.dark), box("坐垫下方接到地板的实际支座", [x - width * .2, y + .29, z + depth * .12], [.22, .58, .24], transportColors.body), box("接到驾驶室地板的操纵台", [x + width * .18, y + .48, z - depth * .25], [.44, .95, .4], transportColors.dark));
  return parts;
}

// 仅参考动力与总装原理；外廓、分件和无商标配色为本地原创，并非特定厂牌的复刻。
// https://wmgaz.pl/en/exhibit-database/fireless-locomotive
// https://schalke.eu/mining/
// https://zephir.eu/en/products/
// https://www.d9531.com/
export const railLocomotiveBatchOne: TransportDefinition[] = [
  { name: "卧式储汽罐无火蒸汽机车", theme: "欧式", tags: ["火车", "铁路", "无火机车", "外源充汽储能", "无燃烧室与烟囱", "车尾双缸连杆驱动"], create: () => {
    const parts: ModelPart[] = [...locomotiveFrame(7.6, [-2.05, 0, 2.05], .53, 2.55, 1), box("储汽罐与驾驶室共用的承重走台", [0, 1.18, 0], [2.4, .14, 7.25], transportColors.dark), ...windowCab([0, 1.28, 2.35], [2.25, 2.15, 2])];
    parts.push(part("没有火管和炉室的圆端封闭储汽压力容器", "lathe", transportColors.body, [0, 2.22, -1], [1, 1, 1], [90, 0, 0], { profile: [{ x: 0, y: -2.15 }, { x: .45, y: -2.1 }, { x: .87, y: -1.9 }, { x: 1, y: -1.6 }, { x: 1, y: 1.6 }, { x: .87, y: 1.9 }, { x: .45, y: 2.1 }, { x: 0, y: 2.15 }] }));
    for (const z of [-2.1, .1]) parts.push(box("压力容器下方与走台实接的承托鞍座", [0, 1.43, z], [1.5, .5, .42], transportColors.dark), ring("固定储汽罐的独立外周环箍", transportColors.trim, 1.012, .025, 0, .06, { position: { x: 0, y: 2.22, z }, rotation: { x: 90, y: 0, z: 0 } }));
    parts.push(cylinder("由容器前封头伸出的外源充汽接管", [0, 2.22, -3.19], [.16, .24, .16], transportColors.trim, [90, 0, 0]), cylinder("充汽管实际串接的截止阀体", [0, 2.22, -3.34], [.25, .14, .25], transportColors.dark, [90, 0, 0]), strut("接在截止阀体上的操作阀杆", [0, 2.22, -3.34], [0, 2.62, -3.34], .045), ring("充汽截止阀顶部带中孔的操作手轮", transportColors.trim, .17, .025, 2.64, .04, { position: { x: 0, y: 2.64, z: -3.34 } }), cylinder("储汽罐顶部安全阀直接接管", [0, 3.24, -.7], [.16, .26, .16], transportColors.trim));
    for (const side of [-1, 1]) {
      parts.push(cylinder("驾驶室前下方接入纵梁的卧式蒸汽工作缸", [side * 1.03, .91, 1.25], [.36, .92, .36], transportColors.body, [90, 0, 0]), part("由储汽罐接入后置工作缸的连续供汽管", "tube", transportColors.dark, [0, 0, 0], [1, 1, 1], [0, 0, 0], { radius: .055, path: [{ x: side * .72, y: 1.62, z: .75 }, { x: side * 1.03, y: 1.48, z: 1 }, { x: side * 1.03, y: 1.05, z: 1.25 }] }));
      for (const z of [-2.05, 0, 2.05]) parts.push(cylinder("钢轮外端实际承接联动杆的曲柄销", [side * .99, .385, z], [.11, .31, .11], transportColors.trim, [0, 0, 90]));
      parts.push(strut("贯穿三根驱动轴曲柄的外侧联动杆", [side * 1.06, .385, -2.05], [side * 1.06, .385, 2.05], .085, transportColors.trim), strut("工作缸活塞连接最后驱动轴的主连杆", [side * 1.06, .91, 1.65], [side * 1.06, .385, 2.05], .075, transportColors.trim), box("驾驶室侧门下方承托踏级", [side * 1.22, .92, 2.65], [.32, .13, .7], transportColors.dark), strut("驾驶室踏级与走台实际相接的斜托", [side * 1.03, 1.18, 2.65], [side * 1.22, .92, 2.65], .08));
    }
    return parts;
  } },
  { name: "低净空分列电池舱窄轨矿用电机车", theme: "现代", tags: ["火车", "铁路", "矿用蓄电池电机车", "762毫米窄轨", "中间低位操纵通道", "无架线低净空车体"], create: () => {
    const parts: ModelPart[] = [...locomotiveFrame(4.65, [-1.42, 1.42], .235, 1.35, .61, .381), box("分列电池箱之间可通行的低位中央底板", [0, .76, 0], [1.34, .13, 4.4], transportColors.dark)];
    for (const side of [-1, 1]) {
      parts.push(box("夹中央通道布置的独立长形牵引电池箱", [side * .46, 1.1, -.1], [.42, .59, 3.6], transportColors.body), box("实际压住电池箱上沿的检修盖", [side * .46, 1.42, -.1], [.46, .07, 3.64], transportColors.trim));
      for (const z of [-1.65, 1.45]) parts.push(box("电池箱盖与下箱相接的锁扣", [side * .69, 1.38, z], [.045, .15, .12], transportColors.dark));
      for (const z of [-.95, .95]) parts.push(strut("操纵位低顶保护棚的承力立柱", [side * .59, .76, z], [side * .59, 1.82, z], .065));
    }
    parts.push(box("低净空操纵席上方独立防落物顶棚", [0, 1.85, 0], [1.34, .1, 2.06], transportColors.dark), box("中央通道内司机低位坐垫", [0, .99, .36], [.41, .1, .4], transportColors.dark), box("司机低位座椅接到底板的短支架", [0, .875, .36], [.24, .15, .25], transportColors.body), box("司机座位后背", [0, 1.18, .54], [.42, .39, .07], transportColors.dark), box("中央通道前端的牵引电控制台", [0, 1.03, -.53], [.43, .48, .35], transportColors.dark), strut("控制台面伸出的实际手控杆", [0, 1.26, -.53], [0, 1.49, -.48], .035, transportColors.trim));
    for (const z of [-1.42, 1.42]) parts.push(cylinder("底板下方经减速箱驱动轮轴的平行偏置牵引电机", [0, .455, z], [.31, .51, .31], transportColors.body, [0, 0, 90]), box("牵引电机侧接轮轴的减速齿轮箱", [.21, .35, z], [.23, .32, .36], transportColors.dark));
    parts.push(part("两侧电池舱接入控制台的绝缘电缆", "tube", transportColors.dark, [0, 0, 0], [1, 1, 1], [0, 0, 0], { radius: .025, path: [{ x: -.3, y: 1.1, z: -.7 }, { x: -.2, y: .83, z: -.7 }, { x: .2, y: .83, z: -.7 }, { x: .3, y: 1.1, z: -.7 }] }));
    for (const end of [-1, 1]) parts.push(box("矿车端部低位防撞缓冲块", [0, .94, end * 2.2], [1.31, .23, .22], transportColors.signal), cylinder("缓冲块上方直接承托的前后工作灯", [0, 1.15, end * 2.26], [.18, .08, .18], transportColors.trim, [90, 0, 0]));
    return parts;
  } },
  { name: "橡胶驱动轮升降导轮公铁两用调车机", theme: "现代", tags: ["火车", "铁路", "公铁两用牵引机", "橡胶轮承重牵引", "独立液压收放轨道导轮", "厂区调车"], create: () => {
    const parts: ModelPart[] = [box("承接橡胶轮桥及导轮摆臂的完整底架", [0, 1.1, 0], [2.2, .27, 4.35], transportColors.dark), box("低机罩下方独立配重底箱", [0, 1.39, -1.3], [1.85, .42, 1.7], transportColors.body), ...windowCab([0, 1.26, .65], [1.8, 1.85, 1.8]), box("驾驶室前方低位牵引动力罩", [0, 1.83, -1.25], [1.7, .5, 1.5], transportColors.signal)];
    for (const z of [-1.45, 1.45]) {
      parts.push(cylinder("橡胶牵引轮之间的驱动桥", [0, .535, z], [.2, 2.15, .2], transportColors.dark, [0, 0, 90]), box("由驱动桥承接到底架的桥壳支承座", [0, .81, z], [.7, .38, .4], transportColors.body));
      for (const side of [-1, 1]) parts.push(...wheel([side * .91, .535, z], .5, .5));
    }
    for (const end of [-1, 1]) {
      const z = end * 2.65;
      parts.push(...locomotiveWheelset(z, .28));
      for (const side of [-1, 1]) parts.push(box("钢导轮轴端的独立摆臂轴箱", [side * 1.04, .345, z], [.22, .25, .28], transportColors.body), strut("导轮轴箱实接底架铰点的液压收放摆臂", [side * 1.04, .345, z], [side * 1.04, 1.01, end * 1.95], .12, transportColors.body), cylinder("摆臂与主底架相接的横向铰轴", [side * 1.04, 1.01, end * 1.95], [.18, .24, .18], transportColors.trim, [0, 0, 90]), strut("底架到导轮摆臂的独立液压缸体", [side * .82, 1.07, end * 1.72], [side * .98, .67, end * 2.31], .1, transportColors.dark), strut("液压缸伸到摆臂中段的活塞杆", [side * .98, .67, end * 2.31], [side * 1.04, .46, end * 2.52], .05, transportColors.trim));
      parts.push(box("与底架刚性连接的铁路车钩安装横梁", [0, 1.1, end * 2.33], [2.05, .3, .25], transportColors.signal), box("车钩横梁实际接入底架的中心承力梁", [0, 1.1, end * 2.15], [.5, .25, .55], transportColors.dark), box("铁路自动钩的纵向牵引柄", [0, 1.1, end * 2.71], [.22, .23, .65], transportColors.dark), box("车钩前端有横销的连接钩头", [0, 1.1, end * 3.04], [.4, .29, .17], transportColors.body));
    }
    for (const side of [-1, 1]) parts.push(box("驾驶室门边由底架承托的登车踏级", [side * 1.04, 1.18, .64], [.34, .1, .78], transportColors.trim), strut("驾驶室门旁独立纵向扶手", [side * .94, 1.4, 1.28], [side * .94, 2.3, 1.28], .035), box("动力罩两侧可辨识的散热格栅", [side * .86, 1.84, -1.25], [.035, .34, .88], transportColors.dark));
    parts.push(cylinder("实际固定在屋盖上的回转警示灯底座", [0, 3.2, .65], [.18, .12, .18], transportColors.dark), part("调车作业回转警示灯透明罩", "sphere", transportColors.signal, [0, 3.31, .65], [.24, .2, .24], [0, 0, 0], { opacity: .75 }));
    return parts;
  } },
  { name: "中置驾驶室双短罩联轴杆液力调车机车", theme: "现代", tags: ["火车", "铁路", "液力机械传动", "中间轴外置联轴杆", "中置驾驶室", "双向低机罩"], create: () => {
    const parts: ModelPart[] = [...locomotiveFrame(11.8, [-3.5, -1.5, 2.7], .6, 2.7, 1.18), box("纵梁上方贯通两罩与驾驶室的承重走台", [0, 1.37, 0], [2.6, .13, 11.4], transportColors.dark), ...windowCab([0, 1.47, .8], [2.4, 2.3, 2.25]), box("前方较长柴油动力罩", [0, 2.32, -2.75], [1.75, 1.78, 4.6], transportColors.body), box("后方低矮冷却辅助短罩", [0, 1.99, 3.55], [1.75, 1.12, 2.85], transportColors.body), box("驾驶室地板下实际接入车架的液力变速箱", [0, 1.13, .62], [1.2, .55, 1.5], transportColors.dark), cylinder("变速箱贯通到外置曲柄的中间驱动轴", [0, .92, .9], [.24, 2.28, .24], transportColors.trim, [0, 0, 90]), cylinder("前柴油机到液力变速箱的纵向传动轴", [0, 1.42, -1.1], [.18, 2, .18], transportColors.dark, [90, 0, 0])];
    for (const side of [-1, 1]) {
      parts.push(cylinder("中间驱动轴外端的偏心传动曲柄盘", [side * 1.06, .92, .9], [.52, .1, .52], transportColors.body, [0, 0, 90]), cylinder("偏心盘上接到两路联轴杆的实际曲柄销", [side * 1.06, .7, .9], [.12, .18, .12], transportColors.trim, [0, 0, 90]));
      for (const z of [-3.5, -1.5, 2.7]) parts.push(cylinder("驱动钢轮与联轴杆之间的真实曲柄销", [side * 1.02, .415, z], [.12, .36, .12], transportColors.trim, [0, 0, 90]));
      parts.push(strut("前两驱动轴之间的外置平联轴杆", [side * 1.06, .415, -3.5], [side * 1.06, .415, -1.5], .1, transportColors.trim), strut("前驱动轴接到中间驱动轴的斜联轴杆", [side * 1.06, .415, -1.5], [side * 1.06, .7, .9], .1, transportColors.trim), strut("中间驱动轴接到后驱动轴的独立斜联轴杆", [side * 1.06, .7, .9], [side * 1.06, .415, 2.7], .1, transportColors.trim), box("液力传动中间轴与车架的固定轴承座", [side * 1.08, 1.07, .9], [.23, .35, .36], transportColors.dark));
      for (const [z, length] of [[-2.7, 4.5], [3.6, 2.7]]) {
        parts.push(box("低机罩外侧连续巡检走道", [side * 1.08, 1.42, z!], [.36, .12, length!], transportColors.trim), strut("巡检走道上方通长护栏", [side * 1.24, 2.22, z! - length! / 2], [side * 1.24, 2.22, z! + length! / 2], .035));
        for (const end of [-1, 1]) parts.push(strut("通长护栏实接走道的端立柱", [side * 1.24, 1.42, z! + end * length! / 2], [side * 1.24, 2.22, z! + end * length! / 2], .035));
      }
      for (const z of [-4.25, -2.75, -1.25]) parts.push(box("前动力罩侧面散热与维护百叶", [side * .89, 2.36, z], [.045, 1.05, .76], transportColors.dark));
      for (const [level, x] of [[.51, 1.53], [.86, 1.42], [1.21, 1.3]]) parts.push(box("驾驶室侧边逐级接到走台的登车踏步", [side * x!, level!, .8], [.32, .13, .75], transportColors.trim));
      for (const z of [.48, 1.12]) parts.push(strut("从登车最低级连续接到走台的梯架", [side * 1.53, .47, z], [side * 1.18, 1.42, z], .07));
    }
    parts.push(cylinder("前动力罩上方实际接出的排气短管", [0, 3.42, -1.1], [.22, .43, .22], transportColors.dark), cylinder("后辅助罩顶部的冷却风扇面", [0, 2.59, 3.65], [1.18, .1, 1.18], transportColors.dark));
    for (const end of [-1, 1]) parts.push(cylinder("低机罩端面与横梁相接的工作前灯", [0, end < 0 ? 2.51 : 2.2, end < 0 ? -5.1 : 5.02], [.26, .13, .26], transportColors.trim, [90, 0, 0]));
    return parts;
  } },
];
