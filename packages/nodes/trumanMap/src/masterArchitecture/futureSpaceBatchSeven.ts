import { part, ring, type ModelPart } from "../assetModelParts";
import { polygon } from "../masterNature/shared";
import { halfRoundWall, rectangularFlue } from "./spatialShells";
import { base, box, colors, cylinder, design, pipe, rail, type ArchitecturePrototype } from "./structures";

const steel = "#778b90", pale = "#aab3ad", dark = "#44565d", stone = "#a39379";

export const futureSpaceBatchSevenDesigns: ArchitecturePrototype[] = [
  // 台面下方导槽/偏流面的形态依据NASA公开说明；原创简化场景，不复刻具体发射场网格或工况。
  // https://www.nasa.gov/reference/launch-complex-39b/
  design("敞口火焰导槽发射台", "有中央大开孔的高位台面跨过贯通导槽，槽内闭合弧面把垂直通道接向水平出口，两侧工作塔和独立短桥保持在导槽外", () => {
    const hole: [number, number][] = Array.from({ length: 12 }, (_, index) => { const a = index * Math.PI / 6; return [Math.cos(a) * 5.5, Math.sin(a) * 5.5]; });
    const parts: ModelPart[] = [base(69, 83, 0.5), polygon("中央喷流口真正贯通的高位台面", steel, [[-22, -24], [22, -24], [22, 24], [-22, 24]], 0.6, [0, 14, 0], [hole]), box("导槽完整低位底床", 0, 0.85, 8, 13.5, 0.7, 62, stone), ...[-1, 1].map(s => box("贯通导槽两侧耐热厚墙", s * 7, 5, 8, 0.8, 9, 62, stone)), ring("喷流口周围开放承托环", dark, 6.5, 1, 15, 0.8)];
    const profile = Array.from({ length: 9 }, (_, index) => { const a = index * Math.PI / 16; return { x: 6 - Math.cos(a) * 6.45, y: 8 - Math.sin(a) * 6.45 }; });
    profile.push(...Array.from({ length: 9 }, (_, index) => { const a = (8 - index) * Math.PI / 16; return { x: 6 - Math.cos(a) * 6, y: 8 - Math.sin(a) * 6 }; }));
    parts.push(part("将竖向开口接到水平导槽的完整厚弧面", "extrude", pale, [0, 0, 0], [1, 1, 1], [0, -90, 0], { profile, depth: 11.4 }), box("弧面入口横向固定承梁", 0, 8, 0, 15, 0.35, 0.4, dark), box("弧面出口横向固定承梁", 0, 1.8, 6, 15, 0.35, 0.4, dark));
    for (const x of [-1, 1]) for (const z of [-1, 1]) parts.push(box("高位台面独立落地重柱", x * 18, 7.35, z * 18, 1.1, 13.7, 1.1, dark));
    for (const side of [-1, 1]) {
      for (const x of [-1, 1]) for (const z of [-1, 1]) parts.push(box("工作塔四角贯通承柱", side * 27 + x * 2.3, 13, -12 + z * 3.3, 0.35, 25, 0.35, dark));
      parts.push(box("工作塔外侧薄围护", side * 29.4, 13, -12, 0.2, 25, 6.6, pale), ...[-1, 1].map(z => box("工作塔侧面透光薄围护", side * 27, 13, -12 + z * 3.4, 4.6, 25, 0.12, colors.glass)), rectangularFlue("面向短桥敞开的高位工作台", 4.6, 6.6, 0.3, 1.3, [side * 27, 14.15, -12], steel), box("工作塔整体平顶", side * 27, 25.65, -12, 5.1, 0.3, 7.1, steel), box("工作塔接至台面的独立短桥", side * 23.3, 14.3, -12, 8.5, 0.25, 2.5, steel), pipe("沿台边上行的分离供水立管", [side * 12, 1, -21], [side * 12, 14.8, -21], 0.45), pipe("台面边缘向喷口引导的短管", [side * 12, 14.8, -21], [side * 5.5, 14.8, -3], 0.45));
    }
    parts.push(box("高位台面后侧设备低台", 0, 15.3, -19, 11, 1.4, 4.2, pale), ...[-1, 1].map(s => part("台面侧缘与承板接实的连续低玻璃护壁", "box", colors.glass, [s * 21, 15.1, 0], [0.07, 1, 46], [0, 0, 0], { opacity: 0.3 })));
    return parts;
  }, "设施", "科幻"),
  design("双脊开放轨道干船坞", "两条长桁架龙骨围住开放装配空域，横向检修门架跨在骨架上，分开的舷侧托臂与作业走道接到各自长脊而不封闭船坞入口", () => {
    const parts: ModelPart[] = [];
    for (const side of [-1, 1]) {
      parts.push(box("船坞纵向桁架下弦", side * 16, 6, 0, 0.65, 0.65, 79, dark), box("船坞纵向桁架上弦", side * 16, 14, 0, 0.65, 0.65, 79, dark), box("龙骨内侧连续检修走道", side * 14.8, 6.2, 0, 2.2, 0.3, 76, steel));
      for (let bay = 0; bay < 10; bay++) {
        const z = -39 + bay * 7.8;
        parts.push(rail([side * 16, bay % 2 ? 14 : 6, z], [side * 16, bay % 2 ? 6 : 14, z + 7.8], 0.3, dark));
      }
      for (const z of [-34, -11.3, 11.3, 34]) parts.push(box("长脊下部独立落地鞍座", side * 16, 3.1, z, 4, 6.2, 5.2, dark), rail([side * 16, 6, z], [side * 7.3, 7.8, z], 0.55, steel), box("向船体舷侧开放的独立托台", side * 6.7, 8, z, 2, 0.35, 5.2, steel));
    }
    for (const z of [-29, 0, 29]) {
      parts.push(box("船坞横向检修门架高梁", 0, 24, z, 38, 0.55, 0.55, steel), ...[-1, 1].map(s => box("横向门架独立落地支柱", s * 18.5, 12, z, 0.5, 24, 0.5, dark)), ...[-1, 1].map(s => cylinder("独立门架落地承压垫", s * 18.5, 0.15, z, 2.2, 0.3, dark)), ...[-1, 1].map(s => pipe("门架向空载吊具延伸的短索", [s * 4, 23.8, z], [s * 4, 16, z], 0.06)));
    }
    parts.push(box("船坞后端分离控制舱楼板", 0, 6.2, 37, 27.5, 0.4, 7.5, steel), box("控制舱后部薄围护", 0, 9, 40.6, 27.5, 5.2, 0.18, pale), box("控制舱完整薄屋面", 0, 11.725, 37, 28.3, 0.25, 8.1, pale), ...[-1, 1].map(s => box("控制舱前沿敞口承柱", s * 13.2, 9, 33.5, 0.25, 5.2, 0.25, dark)));
    return parts;
  }, "设施", "科幻"),
  design("碟缘多泊位太空港台", "宽环形港台围住中央开放装卸庭，四条独立接驳廊从外缘伸出，沿环布置的服务亭让出一整圈连续人行通路", () => {
    const parts: ModelPart[] = [base(65, 65, 0.5), ring("太空港完整宽环形承板", steel, 26, 13, 8.5, 0.6)];
    for (let arc = 0; arc < 4; arc++) parts.push(halfRoundWall("接驳口之间真正断开的外缘护壁", 25.8, 0.14, 1.1, [0, 8.75, 0], -(arc * 90 + 7), dark, Math.PI / 2 - 14 * Math.PI / 180));
    for (let arc = 0; arc < 2; arc++) parts.push(halfRoundWall("中央接桥之间留开口的内缘护壁", 13.2, 0.14, 1.1, [0, 8.75, 0], -(arc * 180 + 7), dark, Math.PI - 14 * Math.PI / 180));
    for (let station = 0; station < 4; station++) {
      const a = station * Math.PI / 2, c = Math.cos(a), s = Math.sin(a), cells: ModelPart[] = [box("外缘接驳廊连续楼板", 0, 8.65, 0, 17.5, 0.3, 5.2, steel), box("接驳廊一侧薄围护", 0, 11.2, 2.5, 17.5, 4.8, 0.12, pale), box("接驳廊另一侧透光薄围护", 0, 11.2, -2.5, 17.5, 4.8, 0.1, colors.glass), box("接驳廊完整平顶", 0, 13.725, 0, 18.2, 0.25, 5.8, pale)];
      for (const value of cells) { const x = value.position.x, z = value.position.z; value.position.x = c * 29.4 + x * c - z * s; value.position.z = s * 29.4 + x * s + z * c; value.rotation.y = -station * 90; } parts.push(...cells);
      parts.push(box("港台独立落地承柱", c * 20, 4.5, s * 20, 0.7, 8, 0.7, dark), rail([c * 20, 5, s * 20], [c * 30.5, 8.5, s * 30.5], 0.45, dark));
      const x = Math.cos(a + Math.PI / 4) * 20, z = Math.sin(a + Math.PI / 4) * 20;
      parts.push(box("环形港台服务亭独立低台", x, 8.8, z, 6.2, 0.3, 5.5, steel), box("服务亭后侧薄壁", x, 11, z + 2.6, 6.2, 4.1, 0.15, pale), box("服务亭整体挑檐屋面", x, 13.15, z, 7, 0.2, 6.5, pale));
    }
    parts.push(cylinder("中央低位装卸庭独立地台", 0, 0.85, 0, 22, 0.7, stone), rectangularFlue("港台中央独立中空交通井", 4.5, 5.5, 8, 0.2, [0, 0.5, 0], dark), ...[-1, 1].map(s => box("中央井通向环台的独立接桥", s * 8.5, 8.65, 0, 13, 0.3, 2.5, steel)));
    return parts;
  }, "建筑", "科幻"),
];
