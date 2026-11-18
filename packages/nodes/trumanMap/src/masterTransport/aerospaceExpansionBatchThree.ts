import { part, ring, type ModelPart } from "../assetModelParts";
import { polygon } from "../masterNature/shared";
import { box, cylinder, strut, transportColors, wheel, type TransportDefinition } from "./parts";

function launchTrack(x: number, z: number): ModelPart[] {
  const outer: [number, number][] = [[-2.7, 0.42], [-2.45, 0.15], [2.45, 0.15], [2.7, 0.42], [2.7, 0.9], [2.4, 1.2], [-2.4, 1.2], [-2.7, 0.9]];
  const inner: [number, number][] = [[-2.45, 0.46], [-2.25, 0.35], [2.25, 0.35], [2.45, 0.46], [2.45, 0.8], [2.25, 1], [-2.25, 1], [-2.45, 0.8]];
  const belt = polygon("有真实贯通轮腔的厚壁履带环", transportColors.dark, outer.map(([z, y]) => [z, -y]), 0.8, [x + 0.4, 0, z], [inner.map(([z, y]) => [z, -y])]);
  belt.rotation = { x: 90, y: 0, z: 90 };
  return [belt, ...[-2.0, -1.0, 0, 1.0, 2.0].map(offset => cylinder("履带内独立承重滚轮", [x, 0.67, z + offset], [0.66, 0.72, 0.66], transportColors.body, [0, 0, 90]))];
}

function ringBrush(x: number, y: number): ModelPart {
  const profile = [{ x: 0, y: -0.85 }, { x: 0.4, y: -0.85 }];
  for (let index = 0; index < 12; index++) profile.push({ x: index % 2 ? 0.41 : 0.49, y: -0.78 + index * 0.14 });
  profile.push({ x: 0.4, y: 0.85 }, { x: 0, y: 0.85 });
  return part("有分圈刷束轮廓的机身洗刷滚筒", "lathe", transportColors.trim, [x, y, 0], [1, 1, 1], [90, 0, 0], { profile });
}

export const aerospaceExpansionBatchThree: TransportDefinition[] = [
  { name: "包围机身与两翼的开放整机坞修平台", theme: "现代", itemType: "设施", tags: ["飞机坞修", "机身侧廊", "机翼前后作业平台", "开放维护通路"], create: () => {
    const parts: ModelPart[] = [];
    for (const side of [-1, 1]) {
      parts.push(box("沿机身侧面贯通的低层作业廊", [side * 3, 3.2, 0], [1.2, 0.16, 17], transportColors.body), strut("机身侧廊外沿连续护栏", [side * 3.57, 4.28, -8.4], [side * 3.57, 4.28, 8.4], 0.05));
      for (const z of [-7.8, 0, 7.8]) parts.push(box("侧廊独立落地支柱", [side * 3, 1.56, z], [0.18, 3.12, 0.18], transportColors.dark), strut("侧廊外侧护栏立柱", [side * 3.57, 3.28, z], [side * 3.57, 4.28, z], 0.05));
      for (const end of [-1, 1]) {
        parts.push(box("分列机翼前后缘的高层横向平台", [side * 6.6, 4.2, end * 2.4], [7.6, 0.16, 1.4], transportColors.body), strut("机翼作业平台外沿护栏", [side * 2.9, 5.28, end * 3.07], [side * 10.3, 5.28, end * 3.07], 0.05));
        for (const x of [side * 3.1, side * 10.1]) parts.push(box("高层翼廊落地支腿", [x, 2.06, end * 2.4], [0.18, 4.12, 0.18], transportColors.dark), strut("翼廊护栏独立立柱", [x, 4.28, end * 3.07], [x, 5.28, end * 3.07], 0.05));
        for (let index = 0; index < 3; index++) parts.push(box("连接低层机身廊与高层翼廊的阶台", [side * 3, 3.28 + (index + 1) / 6, end * (4.2 - index * 0.4)], [1.05, (index + 1) / 3, 0.4], transportColors.trim));
      }
      for (const edge of [-1, 1]) parts.push(strut("上平台楼梯连续承力边梁", [side * 3 + edge * 0.5, 0.06, -11.85], [side * 3 + edge * 0.5, 3.2, -8.35], 0.1), strut("平台楼梯随坡扶手", [side * 3 + edge * 0.55, 1.15, -11.85], [side * 3 + edge * 0.55, 4.28, -8.35], 0.045));
      for (let index = 0; index < 8; index++) parts.push(box("上侧廊的独立钢制楼梯踏板", [side * 3, (index + 1) * 0.4, -11.55 + index * 0.45], [1.05, 0.08, 0.48], transportColors.body));
    }
    return parts;
  } },
  { name: "双环轨道径向刷洗飞机机身清洗机", theme: "现代", itemType: "设施", tags: ["飞机机身刷洗", "贯通清洗环", "径向可调滚刷"], create: () => {
    const parts: ModelPart[] = [box("清洗机低位连接横梁", [0, 0.51, 0], [9.4, 0.22, 1.2], transportColors.dark)];
    for (const side of [-1, 1]) {
      parts.push(box("机身清洗环的长条行走底梁", [side * 4.7, 0.58, 0], [0.55, 0.36, 5.2], transportColors.body));
      for (const z of [-2.05, 2.05]) parts.push(...wheel([side * 4.7, 0.29, z], 0.29, 0.21));
      for (const end of [-1, 1]) parts.push(strut("底梁至清洗环下侧的斜撑", [side * 4.7, 0.7, end * 1.05], [side * 3.1, 1.7, end * 1.05], 0.15));
    }
    for (const z of [-1.05, 1.05]) parts.push(ring("中心完全贯通的前后两道轨道环", transportColors.body, 4.6, 0.16, 0, 0.3, { position: { x: 0, y: 5.1, z }, rotation: { x: 90, y: 0, z: 0 } }));
    for (let index = 0; index < 8; index++) {
      const a = index * Math.PI / 4, x = Math.cos(a), y = Math.sin(a);
      parts.push(ringBrush(x * 3.92, 5.1 + y * 3.92), cylinder("穿过滚刷并接两侧轴承的长转轴", [x * 3.92, 5.1 + y * 3.92, 0], [0.1, 2.18, 0.1], transportColors.dark, [90, 0, 0]));
      for (const z of [-1.05, 1.05]) parts.push(strut("从外环向机身调节接触位置的径向臂", [x * 4.55, 5.1 + y * 4.55, z], [x * 3.92, 5.1 + y * 3.92, z], 0.09));
    }
    parts.push(box("侧边清洗液泵和回收控制柜", [5.05, 1.2, 1.0], [0.65, 1.05, 1.3], transportColors.signal));
    return parts;
  } },
  { name: "双层服务臂移动低温推进剂加注塔", theme: "现代", itemType: "设施", tags: ["航天加注服务", "移动服务塔", "独立介质管路", "双层接近平台"], create: () => {
    const parts: ModelPart[] = [box("大型移动服务塔底盘", [0, 1.3, 0], [5.4, 0.5, 9.6], transportColors.dark), box("车辆前端操作舱下部", [0, 1.95, -3.9], [2.5, 0.8, 1.45], transportColors.body), box("前端操作舱风挡", [0, 2.56, -4.48], [2.25, 0.5, 0.08], transportColors.glass), box("前端操作舱顶", [0, 2.87, -3.9], [2.6, 0.12, 1.55], transportColors.body)];
    for (const side of [-1, 1]) {
      for (const z of [-3.0, 3.0]) parts.push(...wheel([side * 2.45, 0.56, z], 0.56, 0.38), strut("横向伸出的落地稳定支腿", [side * 2.2, 1.25, z], [side * 3.75, 1.25, z], 0.22), cylinder("稳定支腿垂直顶升柱", [side * 3.75, 0.7, z], [0.22, 1.15, 0.22], transportColors.body), box("支腿末端扩展承压底板", [side * 3.75, 0.08, z], [0.85, 0.16, 0.85], transportColors.dark));
      for (const z of [-1.1, 1.1]) parts.push(box("服务塔四角承力立柱", [side * 1.1, 9.4, z], [0.22, 16, 0.22], transportColors.body));
      for (const level of [1.5, 9.4]) parts.push(strut("服务塔侧面空间斜撑", [side * 1.1, level, -1.1], [side * 1.1, level + 7.9, 1.1], 0.12));
      parts.push(strut("垂直接近梯左右梯框", [side * 0.27, 1.6, -1.34], [side * 0.27, 17.3, -1.34], 0.055));
    }
    for (let index = 0; index < 51; index++) parts.push(strut("通向两层服务平台的独立梯棍", [-0.27, 1.8 + index * 0.3, -1.34], [0.27, 1.8 + index * 0.3, -1.34], 0.03));
    for (const [level, radius, lineZ] of [[8.8, 0.13, -0.2], [16.3, 0.1, 0.2]]) {
      parts.push(box("服务臂根部接近平台", [0, level!, 0], [2.7, 0.18, 2.7], transportColors.body), strut("伸向待加注飞行器的水平服务臂", [1.1, level!, 0], [5.5, level!, 0], 0.2), strut("服务臂底部三角承力拉撑", [1.1, level! - 1.4, 0], [4.2, level!, 0], 0.12), part("沿服务臂通向远端的独立介质软管", "tube", transportColors.trim, [0, 0, 0], [1, 1, 1], [0, 0, 0], { radius: radius!, path: [{ x: -0.6, y: 1.7, z: lineZ! }, { x: -0.6, y: level! - 0.4, z: lineZ! }, { x: 1.1, y: level! - 0.3, z: lineZ! }, { x: 4.8, y: level! - 0.3, z: lineZ! }, { x: 5.3, y: level! - 0.7, z: lineZ! }, { x: 5.5, y: level! - 0.7, z: lineZ! }] }), ring("远端介质连接口的中空法兰", transportColors.dark, 0.22, 0.065, 0, 0.18, { position: { x: 5.5, y: level! - 0.7, z: lineZ! }, rotation: { x: 0, y: 0, z: 90 } }));
    }
    return parts;
  } },
  { name: "四角双履带液压调平航天运输平台", theme: "现代", tags: ["航天履带运输", "四角承载", "八条独立履带", "液压调平支承"], create: () => {
    const parts: ModelPart[] = [box("承载整座发射设施的连续重型顶甲板", [0, 4.2, 0], [22, 1.4, 27], transportColors.body), ...[-1, 1].map(side => box("顶甲板下方的纵向箱形主梁", [side * 7.5, 2.95, 0], [1.0, 0.7, 25], transportColors.dark)), ...[-1, 1].map(end => box("连接四角调平柱的横向主梁", [0, 2.95, end * 9.5], [18.8, 0.7, 1.1], transportColors.dark))];
    for (const side of [-1, 1]) for (const end of [-1, 1]) {
      const x = side * 8.5, z = end * 9.5;
      for (const offset of [-0.95, 0.95]) parts.push(...launchTrack(x + offset, z));
      parts.push(cylinder("双履带转向模块上方的调平液压缸", [x, 2.05, z], [1.25, 2.1, 1.25], transportColors.dark), cylinder("接到顶甲板主梁的调平柱塞", [x, 3.15, z], [0.72, 1.1, 0.72], transportColors.trim), strut("双履带轮架连接调平中心的承力横枕", [x - 1.5, 1.05, z], [x + 1.5, 1.05, z], 0.32));
    }
    for (const end of [-1, 1]) {
      parts.push(box("前后相反方向驾驶舱的下部承台", [end * 11.6, 2.45, end * 12.6], [2.4, 0.8, 2.6], transportColors.body), box("伸在甲板外侧的驾驶舱顶", [end * 11.6, 3.8, end * 12.6], [2.5, 0.12, 2.7], transportColors.body), box("驾驶舱外侧观察玻璃", [end * 12.81, 3.3, end * 12.6], [0.06, 0.9, 2.45], transportColors.glass), ...[-1, 1].map(z => box("驾驶舱前后封闭侧板", [end * 11.6, 3.3, end * 12.6 + z * 1.24], [2.4, 0.9, 0.06], transportColors.body)));
      parts.push(strut("顶甲板前后外缘护栏", [-10.8, 5.9, end * 13.3], [10.8, 5.9, end * 13.3], 0.065));
      for (const x of [-10.8, 10.8]) parts.push(strut("甲板外缘护栏立柱", [x, 4.9, end * 13.3], [x, 5.9, end * 13.3], 0.065));
    }
    parts.push(box("中央封闭动力与调平控制舱", [0, 5.5, 0], [5, 1.2, 7], transportColors.dark));
    return parts;
  } },
];
