import { part, ring, type ModelPart } from "../assetModelParts";
import { polygon, sweptProfile } from "../masterNature/shared";
import { box, cylinder, strut, transportColors, type TransportDefinition } from "./parts";

function circle(x: number, z: number, radius: number): [number, number][] {
  return Array.from({ length: 24 }, (_, index) => { const angle = index * Math.PI / 12; return [x + Math.cos(angle) * radius, z + Math.sin(angle) * radius]; });
}

function gear(name: string, x: number, z: number, radius: number, root: number, count: number, inner: number): ModelPart {
  const outline: [number, number][] = [];
  for (let tooth = 0; tooth < count; tooth++) for (const [fraction, distance] of [[-0.48, root], [-0.21, radius], [0.21, radius], [0.48, root]]) {
    const angle = (tooth + fraction!) * Math.PI * 2 / count;
    outline.push([Math.cos(angle) * distance!, Math.sin(angle) * distance!]);
  }
  return polygon(name, transportColors.dark, outline, 0.24, [x, 1.13, z], [circle(0, 0, inner)]);
}

// 独立全回转夹持压拔设备，工作套管保留贯穿开口，不是钻架换尺寸或钻头。
// https://www.rocequipment.com/rotators
// https://machinery.leffer.de/app/uploads/2022/10/neu_LEFF-220744-Flyer_A4_quer_ENGLISCH.pdf
export const roadExpansionBatchSeventeen: TransportDefinition[] = [
  { name: "环抱夹持全回转套管压拔钻机", theme: "现代", itemType: "设施", tags: ["全回转套管钻机", "大齿圈连续回转", "贯通套管夹持升降"], create: () => {
    const outline: [number, number][] = [[-2.45, -2.75], [2.45, -2.75], [2.45, 2.75], [-2.45, 2.75]];
    const parts: ModelPart[] = [
      polygon("给套管留有真实贯通孔的重型承载底架", transportColors.body, outline, 0.2, [0, 0.12, 0], [circle(0, 0, 1.31)]),
      polygon("随套管夹持总成升降且保留驱动轴通孔的上框架", transportColors.body, outline, 0.18, [0, 1.68, 0], [circle(0, 0, 1.24), circle(-2.13, 0, 0.12), circle(2.13, 0, 0.12)]),
      ring("与底架相接的下部固定导向承环", transportColors.dark, 1.72, 0.43, 0.55, 0.46),
      ring("上下夹持体之间的中空连续回转支承", transportColors.trim, 1.7, 0.43, 0.99, 0.44),
      ring("围住工作套管并传递连续扭矩的上夹持体", transportColors.body, 1.69, 0.45, 1.43, 0.5),
      gear("与小齿轮保持同模数啮合的大齿圈", 0, 0, 1.9, 1.77, 56, 1.66),
      part("穿过夹持体上下开口的双壁钢套管", "lathe", transportColors.signal, [0, 1.92, 0], [1, 1, 1], [0, 0, 0], { profile: [{ x: 1.15, y: -1.9 }, { x: 1.15, y: 1.9 }, { x: 1.06, y: 1.9 }, { x: 1.06, y: -1.9 }, { x: 1.15, y: -1.9 }] }),
      box("外接液压动力源的本机控制阀组", [0, 0.67, 2.37], [1.25, 0.7, 0.57], transportColors.dark),
    ];
    for (const side of [-1, 1]) {
      const pinion = gear("与大齿圈错开半齿距的同模数驱动小齿轮", side * 2.13, 0, 0.3, 0.225, 8, 0.09);
      pinion.rotation.y = 22.5;
      parts.push(pinion, cylinder("通过上框架真实轴孔的同轴减速输出轴", [side * 2.13, 1.57, 0], [0.16, 0.85, 0.16], transportColors.trim), cylinder("框架上独立的高扭矩液压马达壳", [side * 2.13, 2.12, 0], [0.42, 0.64, 0.42], transportColors.dark), cylinder("马达与升降上框架相接的固定安装法兰", [side * 2.13, 1.87, 0], [0.54, 0.1, 0.54], transportColors.body));
      for (const end of [-1, 1]) parts.push(box("扩展底架受力面积的实际地面支脚", [side * 2.45, 0.12, end * 2.75], [0.7, 0.24, 0.7], transportColors.dark), cylinder("以底架为反力座的夹持体升降缸外筒", [side * 1.85, 0.72, end * 2.25], [0.3, 0.8, 0.3], transportColors.dark), cylinder("升降缸通向上承框的共轴活塞杆", [side * 1.85, 1.4, end * 2.25], [0.13, 0.7, 0.13], transportColors.trim), box("活塞杆上端与上承框相接的承压座", [side * 1.85, 1.66, end * 2.25], [0.44, 0.16, 0.44], transportColors.body), strut("操作平台外缘的防护立柱", [side * 2.39, 1.85, end * 2.64], [side * 2.39, 2.83, end * 2.64], 0.045, transportColors.trim));
      parts.push(strut("操作平台长边连续防护栏", [side * 2.39, 2.83, -2.64], [side * 2.39, 2.83, 2.64], 0.045, transportColors.trim), strut("操作平台短边连续防护栏", [-2.39, 2.83, side * 2.64], [2.39, 2.83, side * 2.64], 0.045, transportColors.trim), cylinder("控制阀组上供外接管线的实际快接接口", [side * 0.3, 0.67, 2.72], [0.09, 0.23, 0.09], transportColors.trim, [90, 0, 0]));
    }
    for (let jaw = 0; jaw < 3; jaw++) {
      const angle = jaw * Math.PI * 2 / 3;
      const clamp = sweptProfile("与钢套管圆周真正贴合的弧形夹持钳块", transportColors.dark, [[1.15, 1.22], [1.3, 1.22], [1.3, 1.62], [1.15, 1.62]], Math.PI / 6, 4);
      clamp.rotation.y = -angle * 180 / Math.PI + 15;
      parts.push(clamp);
    }
    return parts;
  } },
];
