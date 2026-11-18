import { part, type ModelPart } from "../assetModelParts";
import { box, cylinder, strut, transportColors, type TransportDefinition } from "./parts";

export const compactionToolModels: TransportDefinition[] = [
  { name: "曲柄往复式冲击夯", itemType: "器物", tags: ["工程机具", "冲击夯", "往复夯足"], create: () => {
    const profile = [{ x: 0, y: 0 }];
    for (let index = 0; index < 13; index++) profile.push({ x: index % 2 ? 0.095 : 0.125, y: index * 0.025 });
    profile.push({ x: 0, y: 0.3 });
    const parts: ModelPart[] = [box("耐磨矩形夯足", [0, 0.035, 0], [0.29, 0.07, 0.34], transportColors.dark), box("夯足传力连接座", [0, 0.11, 0], [0.18, 0.1, 0.24], transportColors.signal), part("轴向伸缩褶皱防尘套", "lathe", transportColors.dark, [0, 0.16, 0], [1, 1, 1], [0, 0, 0], { profile }), box("曲柄连杆密闭传动箱", [0, 0.58, 0], [0.32, 0.27, 0.31], transportColors.signal), cylinder("横置发动机曲轴箱", [0, 0.77, 0.05], [0.29, 0.36, 0.29], transportColors.dark, [0, 0, 90]), box("顶置油箱", [0, 0.97, -0.02], [0.32, 0.15, 0.34], transportColors.trim), cylinder("加油口盖", [0, 1.06, -0.09], [0.065, 0.035, 0.065]), box("发动机散热缸头", [0, 0.76, -0.18], [0.2, 0.2, 0.14], transportColors.body)];
    for (const side of [-1, 1]) parts.push(strut("隔振手柄前撑", [side * 0.13, 0.69, -0.12], [side * 0.26, 1.13, -0.2], 0.028), strut("隔振手柄后撑", [side * 0.13, 0.69, 0.14], [side * 0.26, 1.13, 0.24], 0.028), strut("手柄纵边握杆", [side * 0.26, 1.13, -0.2], [side * 0.26, 1.13, 0.24], 0.035));
    parts.push(strut("后侧横向操纵握杆", [-0.26, 1.13, 0.24], [0.26, 1.13, 0.24], 0.04, transportColors.dark));
    return parts;
  } },
  { name: "偏心振动平板夯", itemType: "器物", tags: ["工程机具", "平板夯", "偏心激振"], create: () => {
    const parts: ModelPart[] = [part("前后翘缘耐磨夯板", "extrude", transportColors.dark, [0, 0, 0], [1, 1, 1], [0, 90, 0], { depth: 0.48, profile: [{ x: -0.42, y: 0.09 }, { x: -0.29, y: 0 }, { x: 0.29, y: 0 }, { x: 0.42, y: 0.09 }, { x: 0.39, y: 0.13 }, { x: 0.27, y: 0.045 }, { x: -0.27, y: 0.045 }, { x: -0.39, y: 0.13 }] }), cylinder("前置偏心激振轴壳", [0, 0.18, -0.18], [0.19, 0.36, 0.19], transportColors.signal, [0, 0, 90]), box("弹性隔振发动机托架", [0, 0.23, 0.12], [0.35, 0.12, 0.4], transportColors.body), box("发动机曲轴壳体", [0, 0.4, 0.11], [0.29, 0.24, 0.32], transportColors.dark), box("上置燃油箱", [0, 0.59, 0.1], [0.3, 0.14, 0.32], transportColors.trim), cylinder("油箱旋盖", [0, 0.68, 0.04], [0.06, 0.035, 0.06]), box("侧置传动皮带罩", [0.21, 0.25, -0.02], [0.09, 0.28, 0.52], transportColors.signal, [-16, 0, 0])];
    for (const side of [-1, 1]) parts.push(cylinder("折叠手柄铰轴", [side * 0.21, 0.2, 0.23], [0.08, 0.06, 0.08], transportColors.trim, [0, 0, 90]), strut("后斜操纵推杆", [side * 0.21, 0.2, 0.23], [side * 0.26, 0.98, 0.86], 0.03));
    parts.push(strut("横向隔振握杆", [-0.26, 0.98, 0.86], [0.26, 0.98, 0.86], 0.042, transportColors.dark), box("推杆油门拨片", [0.19, 1.02, 0.86], [0.06, 0.03, 0.09], transportColors.signal));
    return parts;
  } },
];
