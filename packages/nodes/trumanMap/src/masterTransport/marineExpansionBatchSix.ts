import { part, ring, type ModelPart } from "../assetModelParts";
import { polygon } from "../masterNature/shared";
import { box, cylinder, strut, transportColors, type TransportDefinition } from "./parts";

// 原创简化海上生产主体，保留贯通转塔和张力腿的实质构造，不作为工程制造规格。
// https://www.modec.com/ir/library/integrated/pdf/2024/IntegratedReport2024_en_print.pdf
// https://www.modec.com/business/service/floater/tlp/
// https://www.dco.uscg.mil/OCSNCOE/FOF/Types-of-FOFs/

const body = transportColors.body, dark = transportColors.dark, trim = transportColors.trim;

export const marineExpansionBatchSix: TransportDefinition[] = [
  { name: "穿船转塔系泊式浮式生产储卸油船", theme: "现代", tags: ["FPSO", "浮式生产储油船", "贯通船体转塔"], create: () => {
    const outline: [number, number][] = [[-0.8, -69], [0.8, -69], [13, -49], [13, 60], [10, 69], [-10, 69], [-13, 60], [-13, -49]];
    const moonpool: [number, number][] = Array.from({ length: 24 }, (_, index) => [Math.cos(index * Math.PI / 12) * 4.3, -40 + Math.sin(index * Math.PI / 12) * 4.3]);
    const parts: ModelPart[] = [polygon("转塔井真正从甲板贯通船底的储油船壳", body, outline, 10, [0, 0, 0], [moonpool]), part("位于转塔井中且保留管线内腔的旋转筒", "lathe", dark, [0, 0, -40], [1, 1, 1], [0, 0, 0], { profile: [{ x: 3.1, y: 0 }, { x: 4.05, y: 0 }, { x: 4.05, y: 16 }, { x: 3.1, y: 16 }, { x: 3.1, y: 0 }] }), ring("连接船壳的转塔主回转轴承外圈", trim, 5, 0.7, 10.5, 0.9, { position: { x: 0, y: 10.5, z: -40 } }), ring("承托中央接头且留立管孔的转塔上平台", body, 3.5, 2.8, 14.6, 0.3, { position: { x: 0, y: 14.6, z: -40 } }), cylinder("转塔顶部多通道旋转接头筒", [0, 18.7, -40], [2, 8, 2], body), box("甲板中央连续检修通道", [0, 10.3, 0], [3.4, 0.6, 78], dark), box("横贯工艺区的高架管廊", [0, 18.3, 2], [2.6, 0.7, 73], dark), box("远离工艺区的艉部生活舱", [0, 19, 52], [20, 16, 18], trim), box("生活舱前端窗带", [0, 21.7, 42.95], [18, 1.3, 0.1], transportColors.glass), box("生活舱第二层窗带", [0, 16.7, 42.95], [18, 1.3, 0.1], transportColors.glass), cylinder("艉部航空工作甲板", [0, 27.2, 52], [21, 0.6, 21], dark)];
    for (const side of [-1, 1]) {
      for (const z of [-22, -3, 16]) parts.push(box("船体与工艺撬之间的实际基座", [side * 7.5, 10.7, z], [7.6, 1.4, 14], dark), cylinder("甲板工艺分离设备卧罐", [side * 7.5, 13.8, z], [4.8, 11, 4.8], body, [90, 0, 0]), ...[-4.4, 4.4].map(offset => box("卧罐底部落到撬座的承载鞍", [side * 7.5, 11.6, z + offset], [3.6, 1, 0.7], trim)));
      parts.push(box("后处理工艺塔的落甲板底座", [side * 7.5, 10.35, 32], [5, 0.7, 5], dark), cylinder("后处理区竖向工艺塔", [side * 7.5, 17.4, 32], [3.8, 13.4, 3.8], body), strut("甲板工艺塔上接管廊", [side * 7.5, 20.5, 32], [side * 1, 18.6, 32], 0.5, dark), ...[-23, -3, 17, 35].map(z => box("高架管廊实际落脚立柱", [side * 1.15, 14.275, z], [0.3, 7.35, 0.3], dark)), strut("船侧上层护栏", [side * 12.1, 11.3, -30], [side * 12.1, 11.3, 39], 0.08, trim));
      for (const z of [-30, -7, 16, 39]) parts.push(strut("长舷防护栏立柱", [side * 12.1, 10, z], [side * 12.1, 11.3, z], 0.08, trim));
      parts.push(part("进入旋转接头的工艺硬管", "tube", dark, [0, 0, 0], [1, 1, 1], [0, 0, 0], { radius: 0.22, path: [{ x: side * 0.7, y: 19, z: 36 }, { x: side * 0.7, y: 19, z: -31 }, { x: side * 0.7, y: 20.4, z: -37 }, { x: side * 0.45, y: 22, z: -40 }] }));
    }
    for (const z of [-43, -37]) parts.push(strut("跨过转塔内腔的旋转接头承托梁", [-3.6, 16.1, z], [3.6, 16.1, z], 0.28, body));
    parts.push(strut("艏外伸火炬上弦梁", [0, 11, -53], [0, 29, -79], 0.55, body), strut("艏火炬下弦梁", [0, 10.2, -57], [0, 28.5, -79], 0.4, dark), cylinder("火炬竖直末端排放嘴", [0, 29.5, -79], [0.6, 1.6, 0.6], dark));
    return parts;
  } },
  { name: "三幅浮臂竖向张力腿海上平台", theme: "现代", itemType: "设施", tags: ["TLP", "张力腿平台", "竖向受拉系泊"], create: () => {
    const parts: ModelPart[] = [cylinder("张力腿浮台中央封闭浮柱", [0, 50, 0], [10, 22, 10], body), box("中央浮柱承载的主作业甲板", [0, 61.75, 0], [27, 1.5, 23], dark), box("上层控制与生活舱", [-5.5, 66, 2], [10, 7, 13], trim), box("控制舱前端窗带", [-5.5, 67, -4.55], [8.8, 1.1, 0.1], transportColors.glass), cylinder("独立工艺竖罐", [7, 66.75, 4], [3.2, 8.5, 3.2], body), cylinder("独立工艺卧罐", [7, 64.3, -5], [2.7, 8, 2.7], body, [90, 0, 0]), ...[-2.5, 2.5].map(offset => box("卧罐的落甲板承载鞍", [7, 62.9, -5 + offset], [2, 0.8, 0.5], trim)), cylinder("侧向航空甲板", [-19, 70.2, 2], [12, 0.5, 12], dark), strut("航空甲板落到主甲板的悬臂承梁", [-11, 62.3, 2], [-19, 69.8, 2], 0.8, body)];
    for (let index = 0; index < 3; index++) {
      const angle = (index * 120 - 90) * Math.PI / 180, x = Math.cos(angle) * 23, z = Math.sin(angle) * 23;
      parts.push(strut("中央浮柱向外伸出的密封浮臂", [0, 44, 0], [x, 44, z], 3.8, body), cylinder("浮臂端部的封闭张力腿承载浮舱", [x, 45, z], [5.4, 10, 5.4], body), cylinder("海床处独立永久系泊承力基础", [x, 0.4, z], [7, 0.8, 7], dark), box("两根竖向拉管共用的上部夹持台", [x, 50.2, z], [3.2, 0.4, 3.2], dark));
      for (const side of [-1, 1]) {
        const tx = x - Math.sin(angle) * side * 0.8, tz = z + Math.cos(angle) * side * 0.8;
        parts.push(cylinder("海床基础至浮臂间连续受拉钢管", [tx, 20.4, tz], [0.3, 39.2, 0.3], dark), cylinder("浮舱上方钢管张紧接头", [tx, 50.6, tz], [0.7, 0.8, 0.7], trim));
      }
      parts.push(strut("主浮柱至浮臂端的几何稳定撑", [0, 58, 0], [x, 48, z], 0.65, dark));
    }
    for (const side of [-1, 1]) {
      parts.push(strut("主甲板侧向安全横栏", [side * 13, 64, -11], [side * 13, 64, 11], 0.06, trim));
      for (const z of [-11, 0, 11]) parts.push(strut("主甲板安全横栏立柱", [side * 13, 62.5, z], [side * 13, 64, z], 0.06, trim));
    }
    parts.push(strut("工艺区外伸放散梁", [8, 63, -6], [19, 77, -17], 0.45, body), strut("放散梁下部回撑", [6, 61.5, -6], [19, 76.6, -17], 0.3, dark), cylinder("放散梁最端部排放头", [19, 77.5, -17], [0.55, 1.4, 0.55], dark));
    return parts;
  } },
];
