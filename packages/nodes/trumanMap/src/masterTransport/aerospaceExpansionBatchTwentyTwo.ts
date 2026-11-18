import { part, ring, type ModelPart, type Triple } from "../assetModelParts";
import { combineMeshes, polygon } from "../masterNature/shared";
import { cylinderBetween } from "./aerospaceExpansionBatchFour";
import { airfoil } from "./aerospaceExpansionBatchOne";
import { box, cylinder, strut, surface, transportColors, type TransportDefinition } from "./parts";

// 静态外观总成，不提供制造规格或进气、推力、飞行控制仿真；一类只保留一个完整姿态。
// https://www.grc.nasa.gov/www/k-12/airplane/inlet.html
// https://www.nasa.gov/special-projects-laboratory-turbojet-enhancements/
// https://ntrs.nasa.gov/citations/19770008098
// https://ntrs.nasa.gov/citations/19960052267
export const aerospaceExpansionBatchTwentyTwo: TransportDefinition[] = [
  { name: "二维斜板可调航空进气道完整总成", theme: "现代", itemType: "构件", tags: ["独立航空进气道", "双铰接斜板", "真实贯通流道", "矩圆转换接口"], create: () => {
    const top = box("容纳斜板驱动机构且保持完整围合的上部罩壳", [0, 2.25, 0], [2.8, 0.14, 5.2], transportColors.body); top.opacity = 0.4;
    const transition = polygon("在进气道后端保留真实圆孔的矩圆转换框", transportColors.body, [[-1.4, -1.1], [1.4, -1.1], [1.4, 1.1], [-1.4, 1.1]], 0.15, [0, 1.1, 2.45], [Array.from({ length: 20 }, (_, index) => [Math.cos(index * Math.PI / 10) * 0.9, Math.sin(index * Math.PI / 10) * 0.9])]); transition.rotation.x = 90;
    const parts: ModelPart[] = [top, box("保持进气道底部连续的下承力壳", [0, 0.075, 0], [2.8, 0.15, 5.2], transportColors.body), transition, ring("矩圆转换框之后真正空心的发动机连接凸缘", transportColors.dark, 1.04, 0.14, 0, 0.2, { position: { x: 0, y: 1.1, z: 2.65 }, rotation: { x: 90, y: 0, z: 0 } })];
    for (const side of [-1, 1]) parts.push(box("将上罩壳与下承力壳连成整体的进气侧壁", [side * 1.35, 1.1, 0], [0.15, 2.2, 5.2], transportColors.body));
    for (const [name, startZ, startY, endZ, endY] of [["从进口上缘向喉部下偏的第一片可调斜板", -2.6, 2.17, -0.5, 1.65], ["从中间铰轴向后恢复截面的第二片可调斜板", -0.5, 1.65, 1.4, 1.8], ["将斜板后缘接到圆形接口上缘的固定扩散面", 1.4, 1.8, 2.45, 2.0]] as const) parts.push(surface(name, transportColors.trim, [[-1.2, startY, startZ], [1.2, startY, startZ], [1.2, endY, endZ], [-1.2, endY, endZ]], [0, 1, 2, 0, 2, 3]));
    for (const [y, z] of [[2.17, -2.6], [1.65, -0.5]]) parts.push(cylinder("在侧壁之间实际支承可调斜板的横向铰轴", [0, y!, z!], [0.1, 2.65, 0.1], transportColors.dark, [0, 0, 90]));
    for (const side of [-1, 1]) parts.push(cylinderBetween("在上罩壳与第二片斜板之间承载的执行外套", [side * 0.8, 2.25, 0.2], [side * 0.8, 1.95, 0.2], 0.12, transportColors.body), cylinderBetween("由执行外套接入斜板实体的细控制杆", [side * 0.8, 1.95, 0.2], [side * 0.8, 1.705, 0.2], 0.065, transportColors.dark));
    return parts;
  } },
  { name: "多瓣收敛扩张可调航空喷管完整总成", theme: "现代", itemType: "构件", tags: ["独立可调喷管", "收敛扩张瓣片", "外部同步驱动环", "真正贯通空腔"], create: () => {
    const parts: ModelPart[] = [ring("连接上游发动机且保留贯通腔的固定圆筒", transportColors.body, 1.25, 0.15, 0.3, 0.6), ring("固定圆筒外部的执行机构承载安装环", transportColors.dark, 1.4, 0.15, 0.2, 0.3), ring("沿圆筒外侧统一连接各执行杆的同步活动环", transportColors.trim, 1.5, 0.12, 0.8, 0.16)];
    for (let index = 0; index < 12; index++) {
      const a = index * Math.PI / 6, b = (index + 1) * Math.PI / 6, point = (angle: number, radius: number, y: number): Triple => [Math.cos(angle) * radius, y, Math.sin(angle) * radius];
      parts.push(surface("从上游固定筒向中间喉口收敛的独立主瓣", transportColors.body, [point(a, 1.2, 0.6), point(b, 1.2, 0.6), point(b, 0.75, 1.6), point(a, 0.75, 1.6)], [0, 1, 2, 0, 2, 3]), surface("从中间喉口向下游出口展开的独立扩张瓣", transportColors.dark, [point(a, 0.75, 1.6), point(b, 0.75, 1.6), point(b, 1.05, 2.6), point(a, 1.05, 2.6)], [0, 1, 2, 0, 2, 3]));
    }
    for (let index = 0; index < 6; index++) {
      const a = index * Math.PI / 3, x = Math.cos(a), z = Math.sin(a), start: Triple = [x * 1.32, 0.3, z * 1.32], middle: Triple = [x * 1.38, 0.6, z * 1.38], end: Triple = [x * 1.42, 0.8, z * 1.42];
      parts.push(cylinderBetween("固定安装环与同步环之间的短执行外套", start, middle, 0.11, transportColors.body), cylinderBetween("将执行外套与同步活动环相连的细杆", middle, end, 0.06, transportColors.dark), strut("由同步活动环接到主瓣喉部的独立承载连杆", end, [x * 0.78, 1.6, z * 0.78], 0.08));
    }
    return parts;
  } },
  { name: "滑套栅栏式涡扇反推机构完整总成", theme: "现代", itemType: "构件", tags: ["独立航空反推机构", "滑套外露导流栅栏", "环形旁通流道", "内翻阻流瓣"], create: () => {
    const centerY = 1.65, tube = (name: string, outer: number, inner: number, start: number, end: number, color: string) => part(name, "lathe", color, [0, centerY, 0], [1, 1, 1], [90, 0, 0], { profile: [{ x: inner, y: start }, { x: outer, y: start }, { x: outer, y: end }, { x: inner, y: end }, { x: inner, y: start }] });
    const parts: ModelPart[] = [tube("反推机构前端真正空心的固定外罩", 1.65, 1.55, -2.4, -0.7, transportColors.body), tube("向后滑移并露出导流栅栏的中空外套", 1.6, 1.5, 0.8, 2.5, transportColors.body), tube("形成环形旁通流道内边界的贯通核心隔筒", 0.9, 0.8, -2.4, 2.5, transportColors.dark)];
    for (const z of [-0.7, 0.8]) parts.push(ring("导流栅栏前后端与罩壳相接的连续承载圈", transportColors.dark, 1.67, 0.13, 0, 0.08, { position: { x: 0, y: centerY, z }, rotation: { x: 90, y: 0, z: 0 } }));
    for (let index = 0; index < 12; index++) {
      const a = index * Math.PI / 6, b = (index + 1) * Math.PI / 6, point = (angle: number, radius: number, z: number): Triple => [Math.cos(angle) * radius, centerY + Math.sin(angle) * radius, z], vanes: ModelPart[] = [];
      for (const z of [-0.5, -0.1, 0.3, 0.7]) vanes.push(surface("将环形旁通流导向外前侧的独立倾斜导流栅片", transportColors.trim, [point(a, 1.35, z + 0.15), point(b, 1.35, z + 0.15), point(b, 1.63, z - 0.15), point(a, 1.63, z - 0.15)], [0, 1, 2, 0, 2, 3]));
      parts.push(combineMeshes("保留栅片间真实流道开口的环周导流栅片组", transportColors.trim, vanes), strut("在相邻导流栅片组边缘连接前后承载圈的轴向肋", point(a, 1.6, -0.7), point(a, 1.6, 0.8), 0.055), surface("从滑套内缘接向核心隔筒而不封中央核心孔的阻流瓣", transportColors.dark, [point(a, 1.5, 0.8), point(b, 1.5, 0.8), point(b, 0.9, 0.3), point(a, 0.9, 0.3)], [0, 1, 2, 0, 2, 3]));
    }
    for (let index = 0; index < 3; index++) {
      const a = index * Math.PI * 2 / 3, x = Math.cos(a), y = Math.sin(a), p = (radius: number, z: number): Triple => [x * radius, centerY + y * radius, z];
      parts.push(strut("固定外罩内部接至核心隔筒的实际径向承座", p(0.88, -2.0), p(1.6, -2.0), 0.08), strut("将外部滑套驱动套筒支到固定外罩上的前安装托", p(1.6, -1.2), p(1.8, -1.2), 0.08), strut("将滑套驱动杆支到移动外套上的后安装托", p(1.55, 1.3), p(1.8, 1.3), 0.08), cylinderBetween("位于罩壳外侧且不穿过导流栅片的长驱动外套", p(1.8, -1.2), p(1.8, 0.1), 0.1, transportColors.body), cylinderBetween("从长驱动外套伸至移动滑套安装托的细杆", p(1.8, 0.1), p(1.8, 1.3), 0.055, transportColors.dark));
    }
    return parts;
  } },
  { name: "下翼面铰转克鲁格前缘增升翼段总成", theme: "现代", itemType: "构件", tags: ["独立前缘增升翼段", "下翼面铰转展开", "克鲁格前缘面", "真实铰轴与执行连杆"], create: () => {
    const parts: ModelPart[] = [airfoil("承载下翼面翻转增升机构的完整固定翼段", 6.0, 3.0, [0, 1.2, 0]), part("从下翼面铰轴向前翻出并带有弯曲前鼻的连续增升面", "extrude", transportColors.body, [0, 0, 0], [1, 1, 1], [0, -90, 0], { depth: 6.0, profile: [{ x: -0.8, y: 1.1 }, { x: -1.4, y: 0.65 }, { x: -2.25, y: 0.8 }, { x: -2.35, y: 1.05 }, { x: -2.22, y: 0.94 }, { x: -1.42, y: 0.79 }, { x: -0.85, y: 1.17 }] }), cylinder("位于固定翼下表面并连续支承增升面的长铰轴", [0, 1.1, -0.8], [0.12, 6.0, 0.12], transportColors.dark, [0, 0, 90])];
    for (const side of [-1, 1]) parts.push(box("固定翼段内与短执行机构相连的根部承载座", [side * 2.0, 1.2, -0.15], [0.3, 0.15, 0.3], transportColors.body), cylinderBetween("由固定翼下表面向翻转前缘面伸出的执行外套", [side * 2.0, 1.12, -0.15], [side * 2.0, 0.92, -0.95], 0.11, transportColors.body), cylinderBetween("由执行外套接入弯曲增升面实体的细承力杆", [side * 2.0, 0.92, -0.95], [side * 2.0, 0.78, -1.5], 0.055, transportColors.dark));
    return parts;
  } },
];
