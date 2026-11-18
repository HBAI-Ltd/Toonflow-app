import { part, ring, type ModelPart, type Triple } from "../assetModelParts";
import { polygon, tapered } from "../masterNature/shared";
import { cylinderBetween } from "./aerospaceExpansionBatchFour";
import { box, cylinder, strut, surface, transportColors, type TransportDefinition } from "./parts";

// 分别制作完整的再入、减速、垂直试飞和轨道储补主体，不以附件或展开状态扩项。
// https://www.nasa.gov/directorates/stmd/adaptable-deployable-entry-and-placement-technology-adept/
// https://ntrs.nasa.gov/citations/20060025049
// https://science.nasa.gov/image-article/apod-1995-october-28-the-delta-clipper/
// https://www.esa.int/Enabling_Support/Space_Transportation/Future_space_transportation/Proving_technology_in_space
export const aerospaceExpansionBatchThirteen: TransportDefinition[] = [
  { name: "机械伞骨展开碳织热盾再入飞行器", theme: "科幻", tags: ["机械展开式热盾", "伞骨与支撑肋", "碳织柔性减速面", "完整再入飞行器"], create: () => {
    const parts: ModelPart[] = [part("前向封闭中央刚性鼻帽", "lathe", transportColors.dark, [0, 0, 0], [1, 1, 1], [0, 0, 0], { profile: [{ x: 0, y: 0 }, { x: 0.9, y: 0.588 }, { x: 0.9, y: 0.72 }, { x: 0, y: 0.18 }] }), cylinder("连接鼻帽与载荷舱的轴向承力桅", [0, 3.0, 0], [0.5, 5.5, 0.5], transportColors.body), ring("机械展开支撑杆的中央滑动承力圈", transportColors.body, 0.6, 0.15, 4.2, 0.4), cylinder("在柔性热盾背后的密封飞行载荷舱", [0, 5.3, 0], [2.1, 2.8, 2.1], transportColors.body), cylinder("载荷舱顶端的封闭回收与航电头舱", [0, 6.9, 0], [1.6, 0.4, 1.6], transportColors.trim)];
    for (let index = 0; index < 12; index++) {
      const start = index * Math.PI / 6, points: Triple[] = [], faces: number[] = [];
      for (const radius of [0.8, 3.0, 5.8, 8.0]) for (let step = 0; step < 3; step++) {
        const angle = start + step * Math.PI / 12;
        points.push([Math.cos(angle) * radius, 0.3 + radius * 0.32 - (step === 1 ? 0.055 : 0), Math.sin(angle) * radius]);
      }
      for (let level = 0; level < 3; level++) for (let step = 0; step < 2; step++) { const a = level * 3 + step, b = a + 3; faces.push(a, b, b + 1, a, b + 1, a + 1); }
      parts.push(surface("两根机械肋之间张紧并略有弧垂的碳织减速面", "#4b5355", points, faces));
      const path: Triple[] = [0.7, 3.0, 5.8, 8.0].map(radius => [Math.cos(start) * radius, 0.37 + radius * 0.32 - radius / 8 * 0.028, Math.sin(start) * radius]);
      parts.push(tapered("从中央鼻帽延伸至展开热盾外缘的连续机械伞骨", transportColors.body, path, [0.08, 0.075, 0.06, 0.045]), strut("中央滑圈至机械伞骨中段的展开撑杆", [Math.cos(start) * 0.45, 4.2, Math.sin(start) * 0.45], [Math.cos(start) * 4.5, 1.83, Math.sin(start) * 4.5], 0.09));
    }
    return parts;
  } },
  { name: "拖曳大环形气动球伞深空探测系统", theme: "科幻", tags: ["拖曳环形球伞", "中央大通孔", "远距承力牵索", "行星气动捕获概念"], create: () => {
    const parts: ModelPart[] = [part("以大通孔绕过前方探测器尾流的连续密封充气环", "lathe", transportColors.trim, [0, 38, 0], [1, 1, 1], [0, 0, 0], { profile: Array.from({ length: 17 }, (_, index) => ({ x: 15 + Math.cos(index * Math.PI / 8) * 2.5, y: Math.sin(index * Math.PI / 8) * 2.5 })) }), part("位于大气动球伞之前的独立密封探测飞行舱", "lathe", transportColors.body, [0, 0, 0], [1, 1, 1], [0, 0, 0], { profile: [{ x: 0, y: 0 }, { x: 1.6, y: 0.3 }, { x: 1.5, y: 1.1 }, { x: 0.65, y: 4.1 }, { x: 0.65, y: 4.5 }, { x: 0, y: 4.5 }] }), ring("飞行舱尾部的牵引承载连接环", transportColors.dark, 1.3, 0.16, 4.4, 0.18), strut("探测飞行舱侧方的细通信天线", [-1.0, 2.0, 0], [-3.0, 2.2, 0], 0.035)];
    for (let index = 0; index < 6; index++) {
      const angle = index * Math.PI / 3, x = Math.cos(angle), z = Math.sin(angle);
      parts.push(strut("连接飞行舱承载环与远距大球伞的独立长牵索", [x * 1.2, 4.4, z * 1.2], [x * 15, 35.5, z * 15], 0.045, transportColors.body), strut("飞行舱至外侧牵引连接环的短径向撑", [x * 0.56, 4.3, z * 0.56], [x * 1.23, 4.4, z * 1.23], 0.1));
      const path: Triple[] = Array.from({ length: 17 }, (_, step) => {
        const a = step * Math.PI / 8, radius = 15 + Math.cos(a) * 2.54;
        return [x * radius, 38 + Math.sin(a) * 2.54, z * radius];
      });
      parts.push(tapered("穿过环形球伞内外侧并连接牵索锚点的环向约束带", transportColors.body, path, path.map(() => 0.045)));
    }
    return parts;
  } },
  { name: "四棱锥体垂直起降复用试验飞行器", theme: "现代", tags: ["四棱锥飞行器", "垂直起降复用试验", "独立铰接落腿", "完整试验载体"], create: () => {
    const sections = [[2.3, 2.2], [4.0, 2.2], [8.0, 1.65], [12.5, 0.6], [14.0, 0.07]], vertices = sections.flatMap(([y, r]) => [[-r!, -r!], [r!, -r!], [r!, r!], [-r!, r!]].map(([x, z]) => ({ x: x!, y: y!, z: z! }))), indices = [0, 1, 2, 0, 2, 3];
    for (let level = 0; level < sections.length - 1; level++) for (let edge = 0; edge < 4; edge++) { const a = level * 4 + edge, b = level * 4 + (edge + 1) % 4; indices.push(a, a + 4, b + 4, a, b + 4, b); }
    const last = vertices.length - 4;
    indices.push(last, last + 2, last + 1, last, last + 3, last + 2);
    const parts: ModelPart[] = [part("宽基座渐缩为尖顶的连续四棱锥承力外壳", "mesh", transportColors.trim, [0, 0, 0], [1, 1, 1], [0, 0, 0], { vertices, indices }), box("四个发动机上方的横向安装承力梁", [0, 2.25, 0], [3.5, 0.3, 0.4], transportColors.dark), box("四个发动机上方的纵向安装承力梁", [0, 2.25, 0], [0.4, 0.3, 3.5], transportColors.dark)];
    for (const side of [-1, 1]) for (const end of [-1, 1]) {
      const top: Triple = [side * 1.95, 4.0, end * 1.95], middle: Triple = [side * 2.83, 1.5, end * 2.83], bottom: Triple = [side * 3.2, 0.22, end * 3.2];
      parts.push(cylinderBetween("从机身角部铰点向下外伸的主着陆腿套筒", top, middle, 0.22, transportColors.body), cylinderBetween("着陆腿下端露出的细长缓冲杆", middle, bottom, 0.14, transportColors.dark), strut("防止展开落腿侧向折返的独立斜撑", [side * 1.9, 2.5, end * 1.9], bottom, 0.13), cylinder("落腿下端连接地面的圆形脚垫", [side * 3.2, 0.1, end * 3.2], [0.85, 0.2, 0.85], transportColors.dark), part("机身基部独立发动机的真正贯通钟形喷管", "lathe", transportColors.dark, [side * 0.95, 0, end * 0.95], [1, 1, 1], [0, 0, 0], { profile: [{ x: 0.48, y: 0.5 }, { x: 0.55, y: 0.5 }, { x: 0.28, y: 1.6 }, { x: 0.22, y: 2.1 }, { x: 0.18, y: 2.5 }, { x: 0.12, y: 2.5 }, { x: 0.16, y: 2.1 }, { x: 0.22, y: 1.6 }, { x: 0.48, y: 0.5 }] }));
    }
    for (const side of [-1, 1]) parts.push(ring("侧向姿态喷口的贯通口缘", transportColors.dark, 0.14, 0.04, 0, 0.14, { position: { x: side * 1.38, y: 9.2, z: 0 }, rotation: { x: 0, y: 0, z: 90 } }), ring("前后姿态喷口的贯通口缘", transportColors.dark, 0.14, 0.04, 0, 0.14, { position: { x: 0, y: 9.2, z: side * 1.38 }, rotation: { x: 90, y: 0, z: 0 } }));
    return parts;
  } },
  { name: "独立传输桁架低温罐组轨道储补站", theme: "科幻", tags: ["轨道低温储补站", "独立长传输桁架", "罐组隔热冷屏", "贯通对接输送端"], create: () => {
    const parts: ModelPart[] = [box("桁架中部独立的输送阀与控制设备舱", [0, 6.0, 0], [2.3, 1.6, 3.5], transportColors.body)];
    const stations = [-24.8, -24.8 / 3, 24.8 / 3, 24.8];
    for (const side of [-1, 1]) for (const height of [-1, 1]) parts.push(strut("贯穿完整储补站的连续桁架纵弦", [side * 1.6, 6 + height * 1.4, -24.8], [side * 1.6, 6 + height * 1.4, 24.8], 0.18));
    for (const z of stations) for (const side of [-1, 1]) parts.push(strut("长桁架每个承力截面的上下载荷横梁", [-1.6, 6 + side * 1.4, z], [1.6, 6 + side * 1.4, z], 0.15), strut("长桁架每个承力截面的侧向立柱", [side * 1.6, 4.6, z], [side * 1.6, 7.4, z], 0.15));
    for (let index = 0; index < stations.length - 1; index++) for (const side of [-1, 1]) parts.push(strut("沿长桁架上下面连续连接的抗剪斜杆", [-1.6, 6 + side * 1.4, stations[index]!], [1.6, 6 + side * 1.4, stations[index + 1]!], 0.12), strut("沿长桁架两侧面连续连接的抗剪斜杆", [side * 1.6, 4.6, stations[index]!], [side * 1.6, 7.4, stations[index + 1]!], 0.12));
    for (const side of [-1, 1]) {
      parts.push(part("独立安装在桁架侧方并具有封闭圆顶端部的低温主罐", "lathe", transportColors.trim, [side * 6.0, 6.8, 0], [1, 1, 1], [90, 0, 0], { profile: [{ x: 0, y: -15 }, { x: 1.7, y: -14 }, { x: 3.4, y: -11.5 }, { x: 3.4, y: 11.5 }, { x: 1.7, y: 14 }, { x: 0, y: 15 }] }), part("沿中央桁架连续布置并连接端部耦合口的空心输送主管", "lathe", transportColors.dark, [side * 0.4, 5.6, 0], [1, 1, 1], [90, 0, 0], { profile: [{ x: 0.065, y: -27.9 }, { x: 0.09, y: -27.9 }, { x: 0.09, y: 27.9 }, { x: 0.065, y: 27.9 }, { x: 0.065, y: -27.9 }] }), cylinderBetween("将主罐内侧接头连接至中央输送主管的短分支管", [side * 0.4, 5.6, 1.9], [side * 2.6, 6.8, 1.9], 0.18, transportColors.dark), box("低温主罐上方独立的长平面散热器", [side * 6.0, 12.5, 0], [4.0, 0.12, 24], transportColors.dark));
      for (const z of [-9.0, 9.0]) parts.push(ring("将低温主罐载荷传至桁架的整圈承力鞍带", transportColors.body, 3.52, 0.14, 0, 0.22, { position: { x: side * 6.0, y: 6.8, z }, rotation: { x: 90, y: 0, z: 0 } }), strut("承力鞍带内侧至中央桁架的短固定支承", [side * 1.6, 6.0, z], [side * 2.5, 6.8, z], 0.3));
      for (const z of [-11.0, 11.0]) parts.push(strut("低温罐外壳至上方散热器的热控安装支架", [side * 6.0, 10.1, z], [side * 6.0, 12.5, z], 0.1));
      for (const z of [-19.0, 19.0]) parts.push(box("位于主罐前后方而不遮挡主罐的展开供电翼", [side * 18.0, 8.5, z], [18, 0.1, 6.0], "#496e82"), strut("避开低温主罐两端的长供电翼支撑梁", [side * 1.6, 7.4, z], [side * 18.0, 8.5, z], 0.16), strut("支承下方大幅隔热屏的外张支杆", [side * 1.6, 4.6, z * 14 / 19], [side * 10.0, 1.1, z * 14 / 19], 0.12));
    }
    for (const y of [0.9, 1.1]) parts.push(box("与低温罐保持空间间隔的大幅辐射隔热屏", [0, y, 0], [30, 0.035, 40], transportColors.trim));
    const frameOutline: [number, number][] = [[-1.75, -1.55], [1.75, -1.55], [1.75, 1.55], [-1.75, 1.55]], opening: [number, number][] = Array.from({ length: 16 }, (_, index) => [Math.cos(index * Math.PI / 8) * 1.35, Math.sin(index * Math.PI / 8) * 1.35]);
    for (const end of [-1, 1]) {
      const transition = polygon("将方形传输桁架连接到圆形对接筒的真开孔转换框", transportColors.body, frameOutline, 0.2, [0, 6, end * 24.8], [opening]); transition.rotation.x = 90;
      parts.push(transition, ring("储补站端部的贯通圆形对接承力筒", transportColors.body, 1.55, 0.15, 0, 3.2, { position: { x: 0, y: 6, z: end * 26.4 }, rotation: { x: 90, y: 0, z: 0 } }), ring("贯通对接筒外端的整圈锁紧凸缘", transportColors.dark, 1.8, 0.25, 0, 0.2, { position: { x: 0, y: 6, z: end * 28.0 }, rotation: { x: 90, y: 0, z: 0 } }), box("输送接头在对接筒下部的统一安装横梁", [0, 5.6, end * 27.8], [2.0, 0.12, 0.2], transportColors.body));
      for (const side of [-1, 1]) parts.push(ring("长输送主管端部可见的真空心流体耦合口", transportColors.dark, 0.2, 0.125, 0, 0.3, { position: { x: side * 0.4, y: 5.6, z: end * 27.95 }, rotation: { x: 90, y: 0, z: 0 } }));
    }
    return parts;
  } },
];
