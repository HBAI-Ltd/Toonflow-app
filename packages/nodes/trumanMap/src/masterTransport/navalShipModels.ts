import { part, type ModelPart } from "../assetModelParts";
import { ball, box, cylinder, shipHull, strut, transportColors, type TransportDefinition } from "./parts";

export const navalShipModels: TransportDefinition[] = [
  { name: "直升机甲板轻型护卫舰", theme: "现代", tags: ["舰船", "海军", "护卫舰", "封闭机库", "综合桅杆", "舰艏炮塔"], create: () => {
    const parts = [shipHull(16, 102, 8), box("前置斜面舰桥底座", [0, 11, -13], [11, 6, 15]), box("高位封闭驾驶室", [0, 15, -15], [12, 3, 10]), box("舰桥前部深色窗带", [0, 15.3, -20.1], [10.5, 0.9, 0.1], transportColors.glass), box("后部封闭航空机库", [0, 11.5, 13], [12, 7, 19]), box("机库尾端卷门", [0, 11, 22.55], [8.5, 5.8, 0.15], transportColors.dark), box("尾部航空作业甲板", [0, 8.1, 35.5], [14, 0.35, 24], transportColors.dark), box("直升机着舰标线横段", [0, 8.3, 35], [4, 0.04, 0.24], transportColors.trim), ...[-1, 1].map(side => box("直升机着舰标线竖段", [side * 1.8, 8.3, 35], [0.24, 0.04, 5], transportColors.trim)), cylinder("前甲板炮塔回转座", [0, 8.5, -34], [4.8, 1, 4.8]), ball("低矮封闭炮塔罩", [0, 10, -34], [4.2, 3, 4.8]), strut("舰艏炮管", [0, 10.3, -36], [0, 11.1, -41], 0.28), box("一体化传感桅杆基座", [0, 20, -8], [4, 8, 4]), part("收窄桅杆上段", "cone", transportColors.body, [0, 26, -8], [4, 4, 4]), ball("上部导航雷达罩", [0, 28.4, -8], [2, 2, 2]), ...[-1, 1].map(side => box("侧向平面阵列面", [side * 2.05, 21, -8], [0.12, 3, 3], transportColors.dark)), box("封闭排烟烟囱", [0, 17, 4], [4, 5, 5], transportColors.dark)];
    for (const x of [-1.2, 1.2]) for (const z of [-25.5, -23]) parts.push(box("前甲板垂发舱盖", [x, 8.12, z], [2.1, 0.15, 2.1], transportColors.dark));
    return parts;
  } },
  { name: "艉部扫具布放猎雷舰", theme: "现代", tags: ["舰船", "海军", "猎雷舰", "扫雷舰", "A形尾架", "缆鼓", "拖曳声呐"], create: () => {
    const parts = [shipHull(10, 60, 5.5), box("前部居住舰楼", [0, 7.5, -8], [8.5, 4, 18]), box("上层驾驶舱", [0, 10.5, -11], [8.8, 2.5, 7]), box("驾驶舱前窗", [0, 10.8, -14.55], [7.5, 0.9, 0.1], transportColors.glass), box("开放扫具甲板", [0, 5.65, 13.5], [8.8, 0.2, 24], transportColors.dark), box("烟囱独立围壳", [0, 11, 1.5], [2.5, 4, 3]), strut("前部导航桅杆", [0, 11.8, -8], [0, 19, -8], 0.3), box("桅杆横向雷达天线", [0, 18, -8], [4.6, 0.35, 0.5], transportColors.dark), cylinder("扫具承托主缆鼓", [0, 7.2, 10], [2.5, 4.2, 2.5], transportColors.dark, [0, 0, 90])];
    for (const side of [-1, 1]) {
      parts.push(cylinder("缆鼓挡边盘", [side * 2.15, 7.2, 10], [3.3, 0.18, 3.3], transportColors.signal, [0, 0, 90]), strut("艉部扫具A架斜腿", [side * 3.8, 5.6, 23], [side * 2.5, 12.5, 26], 0.3), cylinder("甲板成对长形扫具浮体", [side * 2.7, 6.5, 18], [1.4, 8, 1.4], transportColors.signal, [90, 0, 0]), box("扫具浮体稳定鳍", [side * 2.7, 6.8, 21.3], [2.2, 0.12, 1.3], transportColors.trim));
    }
    parts.push(strut("A架顶部跨梁", [-2.5, 12.5, 26], [2.5, 12.5, 26], 0.35), cylinder("顶部出缆滑轮", [0, 12.1, 26], [0.9, 0.2, 0.9], transportColors.dark, [0, 0, 90]), strut("布放状态垂直拖缆", [0, 12.1, 26], [0, 6.5, 26], 0.045), ball("艉端拖曳声呐鱼体", [0, 6.3, 26], [1.1, 1.1, 3.5], transportColors.signal), box("声呐鱼十字尾翼", [0, 6.3, 27.5], [2, 0.08, 0.8], transportColors.trim));
    return parts;
  } },
  { name: "斜角甲板弹射航空母舰", theme: "现代", tags: ["舰船", "海军", "航母", "航空母舰", "斜角着舰区", "甲板弹射轨", "舷侧升降机"], create: () => {
    const deck: [number, number][] = [[-25, -144], [0, -150], [26, -145], [29, -95], [29, 139], [-24, 145], [-34, 115], [-34, 43], [-28, 12], [-28, -100]];
    const parts: ModelPart[] = [shipHull(40, 300, 18), part("大外飘连续飞行甲板", "extrude", transportColors.dark, [0, 18.8, 0], [1, 2, 1], [90, 0, 0], { depth: 1.6, profile: deck.map(([x, y]) => ({ x, y: y / 2 })) }), box("右舷舰岛下层", [21, 24.5, 15], [10, 10, 38]), box("右舷舰岛指挥层", [20, 31, 5], [12, 4, 19]), box("指挥层前窗带", [20, 31.4, -4.6], [10.5, 1.3, 0.15], transportColors.glass), box("航空管制观察室", [20, 35.5, 18], [11, 4, 14]), box("航空管制左侧窗带", [14.4, 35.5, 18], [0.15, 1.8, 12], transportColors.glass), box("后置岛式排烟管", [22, 35, 29], [6, 10, 8], transportColors.body), strut("舰岛上部雷达桅杆", [20, 37.5, 18], [20, 52, 18], 1), box("桅杆上部平面雷达", [20, 49, 18], [11, 4, 0.7], transportColors.body), box("舰艏左弹射槽", [-10, 19.63, -90], [0.55, 0.06, 83], transportColors.trim), box("舰艏右弹射槽", [8, 19.63, -90], [0.55, 0.06, 83], transportColors.trim)];
    for (const x of [-19, 2.5]) for (const offset of [-40, 40]) parts.push(box("连续斜角着舰区边线", [x - Math.sin(8 * Math.PI / 180) * offset, 19.64, 45 + Math.cos(8 * Math.PI / 180) * offset], [0.35, 0.06, 80], transportColors.trim, [0, -8, 0]));
    for (const side of [-1, 1]) {
      const x = side < 0 ? -37 : 33;
      parts.push(box("舷侧航空升降机平台", [x, 18.6, 55 + side * 25], [15, 1.2, 19], transportColors.body), box("升降机外侧承托梁", [side < 0 ? -30 : 27, 14, 55 + side * 25], [1.2, 8, 19]));
      for (let station = 0; station < 4; station++) parts.push(strut("飞行甲板舷侧外飘斜撑", [side * 16, 10, -65 + station * 45], [side * 27, 18, -65 + station * 45], 0.7));
    }
    for (const z of [72, 79, 86]) parts.push(strut("横跨着舰区的拦阻索", [-22, 19.75, z], [4.5, 19.75, z + 3.7], 0.11, transportColors.signal));
    for (const x of [-10, 8]) parts.push(box("弹射槽尾端抬起的喷流挡板", [x, 21.8, -45], [8, 0.25, 5], transportColors.body, [-55, 0, 0]));
    return parts;
  } },
];
