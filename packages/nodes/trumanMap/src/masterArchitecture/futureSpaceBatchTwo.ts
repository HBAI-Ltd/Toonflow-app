import { part, ring, type ModelPart, type Triple } from "../assetModelParts";
import { barrelRoof, halfDomeRoof, halfRoundWall, rectangularFlue } from "./spatialShells";
import { base, box, colors, cylinder, design, pipe, rail, type ArchitecturePrototype } from "./structures";
import { triangleShell } from "./futureSpaceBatchOne";
import { helicalFlight } from "../masterTransport/parts";

const steel = "#73868a", pale = "#aab3ad", dark = "#42535a", masonry = "#a28a73", copper = "#a18a62";

export function sectorSlab(name: string, inner: number, outer: number, start: number, span: number, y: number, height: number, color: string): ModelPart {
  const profile = Array.from({ length: 13 }, (_, index) => { const a = start + index * span / 12; return { x: Math.cos(a) * outer, y: Math.sin(a) * outer }; });
  profile.push(...Array.from({ length: 13 }, (_, index) => { const a = start + (12 - index) * span / 12; return { x: Math.cos(a) * inner, y: Math.sin(a) * inner }; }));
  return part(name, "extrude", color, [0, y, 0], [1, 1, 1], [90, 0, 0], { profile, depth: height });
}

function doorway(name: string, x: number, y: number, z: number, width: number, height: number, depth: number, color = steel): ModelPart[] {
  return [box(`${name}侧柱`, x - width / 2 - 0.15, y + height / 2, z, 0.3, height, depth, color), box(`${name}侧柱`, x + width / 2 + 0.15, y + height / 2, z, 0.3, height, depth, color), box(`${name}上梁`, x, y + height + 0.15, z, width + 0.6, 0.3, depth, color)];
}

export const futureSpaceBatchTwoDesigns: ArchitecturePrototype[] = [
  design("环形放射机车库", "九个放射式入库间围绕中央露天调向盘，库房的内侧逐间开放，外环砖墙和连续环带屋盖包住检修区", () => {
    const parts: ModelPart[] = [base(56, 56, 0.35), sectorSlab("放射检修库环带楼板", 12, 25.5, Math.PI / 4, Math.PI * 1.5, 0.6, 0.5, masonry), sectorSlab("连续环带检修库屋盖", 11.5, 26, Math.PI / 4, Math.PI * 1.5, 10.2, 0.3, pale), halfRoundWall("环库外侧连续砖墙", 25.5, 0.4, 9.2, [0, 0.85, 0], -45, masonry, Math.PI * 1.5), cylinder("中央调向盘承托圆台", 0, 0.6, 0, 17, 0.5, dark)];
    for (let index = 0; index <= 9; index++) {
      const a = Math.PI / 4 + index * Math.PI / 6, x = Math.cos(a), z = Math.sin(a);
      parts.push(box("内口放射库柱", x * 12, 5.45, z * 12, 0.35, 9.2, 0.35, steel), rail([x * 12, 9.9, z * 12], [x * 25, 9.9, z * 25], 0.32, steel));
      if (index === 9) continue;
      const bay = a + Math.PI / 12, c = Math.cos(bay), s = Math.sin(bay);
      for (const side of [-1, 1]) parts.push(rail([c * 8 - s * side * 0.78, 0.96, s * 8 + c * side * 0.78], [c * 24 - s * side * 0.78, 0.96, s * 24 + c * side * 0.78], 0.11, steel));
    }
    for (const side of [-1, 1]) parts.push(rail([-8, 0.9, side * 0.78], [27, 0.9, side * 0.78], 0.11, steel));
    return parts;
  }, "建筑", "蒸汽朋克"),
  design("立式火箭整备楼", "高耸整备厅以多层环形作业台包围一条自地面直达屋盖的清空竖向装配空间，整高前门向两侧独立展开", () => {
    const parts: ModelPart[] = [base(32, 34, 0.5), box("整备楼后侧剪力壁", 0, 25.2, 13.5, 27, 49.4, 0.6, pale), box("整备楼屋盖", 0, 50.2, 0, 28.5, 0.6, 28.5, steel)];
    for (const side of [-1, 1]) {
      parts.push(box("整备厅两侧高柱", side * 13.5, 25.2, -13, 0.85, 49.4, 1.1, dark), box("侧部固定服务核心", side * 13.5, 25.2, 6, 1, 49.4, 4, dark), box("向外退开的整高门叶", side * 15.5, 25, -13.8, 3.4, 49, 0.5, pale), box("起吊轨梁接回前后固定高柱的完整纵向托梁", side * 12.8, 48.8, 0.25, 1.3, 0.7, 26.5, dark));
      for (const z of [-5, 5]) parts.push(box("通高侧面接入地坪和屋盖的窄玻璃带", side * 13.7, 25.2, z, 0.12, 49.4, 4.8, colors.glass));
    }
    for (const y of [5, 12, 19, 26, 33, 40, 47]) parts.push(rectangularFlue("环抱中央清空竖井的作业层", 26.4, 26.4, 0.28, 3.5, [0, y, 0], steel), ...[-1, 1].map(side => box("侧部作业层控制室背壁", side * 11.8, y + 1.6, 7.5, 0.12, 2.7, 5.5, pale)));
    parts.push(box("屋顶横向起吊轨梁", 0, 48.8, 0, 25.5, 0.7, 0.7, dark), cylinder("起吊滑车行走轮轴", 0, 48.175, 0, 0.55, 2, steel, [0, 0, 90]), pipe("中央装配吊索", [0, 48, 0], [0, 38, 0], 0.065));
    return parts;
  }, "建筑", "科幻"),
  design("双轨移顶重装配厂房", "整间装配车间的两片屋顶沿外伸横轨分离，中央完全敞向天空，独立外侧支架继续承托打开的屋片", () => {
    const parts: ModelPart[] = [base(59, 62, 0.45), box("重装配厅平地坪", 0, 0.7, 0, 38, 0.5, 57, masonry), box("重装配厅后端厚壁", 0, 7.8, 28.5, 38, 14.6, 0.45, pale)];
    for (const side of [-1, 1]) {
      for (const z of [-25, -12.5, 0, 12.5, 25]) parts.push(box("车间侧向固定立柱", side * 19, 7.7, z, 0.6, 14.5, 0.6, dark), box("移顶外伸支承柱", side * 28, 7.7, z, 0.5, 14.5, 0.5, dark), rail([side * 8, 15.1, z], [side * 28.5, 15.1, z], 0.4, steel), box("桥吊运行梁从侧柱内挑的完整牛腿", side * 17.2, 12.6, z, 3.6, 0.4, 0.45, dark));
      parts.push(box("向外平移的半片屋面", side * 20.5, 15.7, 0, 17.5, 0.35, 57.8, pale), box("侧墙上部玻璃采光带", side * 19, 10.4, 0, 0.1, 6, 56.5, colors.glass), rail([side * 15.5, 12.6, -27], [side * 15.5, 12.6, 27], 0.35, steel));
      for (const z of [-22, 0, 22]) parts.push(cylinder("半屋面侧向滑移滚轮", side * 20, 15.4, z, 0.55, 0.3, dark, [90, 0, 0]));
    }
    parts.push(...doorway("地面整宽装配门洞", 0, 0.45, -28.5, 29, 13.8, 0.5, dark), box("内部桥吊承梁", 0, 12.6, 5, 31, 0.6, 0.65, steel), pipe("桥吊独立挂索", [2, 12.35, 5], [2, 7.2, 5], 0.06));
    return parts;
  }, "建筑", "科幻"),
  design("三叉树柱航站大厅", "三条长翼在同一中央分流庭汇合，成组树状分叉柱分别承托每翼折面屋盖，入口和翼间缝隙完整敞开", () => {
    const parts: ModelPart[] = [base(49, 49, 0.4), cylinder("三翼交会中央服务庭地台", 0, 0.6, 0, 15, 0.4, pale)];
    for (let wing = 0; wing < 3; wing++) {
      const a = wing * Math.PI * 2 / 3, x = Math.cos(a), z = Math.sin(a), p = -z, q = x;
      parts.push(part("放射航站翼地板", "box", pale, [x * 12.5, 0.65, z * 12.5], [24, 0.45, 10], [0, -a * 180 / Math.PI, 0]));
      for (const r of [7, 18]) {
        const root: Triple = [x * r, 0.85, z * r], fork: Triple = [x * r, 8.5, z * r];
        parts.push(rail(root, fork, 0.65, dark));
        for (const side of [-1, 1]) parts.push(rail(fork, [x * r + p * side * 4.5, 12.8, z * r + q * side * 4.5], 0.32, dark));
      }
      const left: Triple = [x * 1.5 + p * 5.5, 12.8, z * 1.5 + q * 5.5], right: Triple = [x * 1.5 - p * 5.5, 12.8, z * 1.5 - q * 5.5], farLeft: Triple = [x * 25 + p * 5.5, 12.8, z * 25 + q * 5.5], farRight: Triple = [x * 25 - p * 5.5, 12.8, z * 25 - q * 5.5], ridgeNear: Triple = [x * 1.5, 15.2, z * 1.5], ridgeFar: Triple = [x * 25, 15.2, z * 25];
      parts.push(triangleShell("翼廊折板屋顶", left, farLeft, ridgeNear, 0.18, pale), triangleShell("翼廊折板屋顶", farLeft, ridgeFar, ridgeNear, 0.18, pale), triangleShell("翼廊折板屋顶", right, ridgeNear, farRight, 0.18, steel), triangleShell("翼廊折板屋顶", farRight, ridgeNear, ridgeFar, 0.18, steel));
      for (const side of [-1, 1]) parts.push(part("分流庭两侧接入翼板和屋壳的细玻璃界面", "box", colors.glass, [x * 14 + p * side * 5, 6.875, z * 14 + q * side * 5], [19, 12.05, 0.1], [0, -a * 180 / Math.PI, 0]));
    }
    parts.push(cylinder("中央分流服务台", 0, 1.4, 0, 4, 1.2, dark));
    return parts;
  }, "建筑", "科幻"),
  design("独柱悬臂飞碟餐厅", "低部独柱向上分叉承托高空环形餐厅，外缘通透围护与浅盘屋盖分离，中央竖向井保留升降入口", () => {
    const parts: ModelPart[] = [base(15, 15, 0.5), cylinder("餐厅单柱承力塔芯", 0, 9.2, 0, 4.2, 17.4, dark), ring("高空环形餐厅楼板", steel, 15.5, 11.8, 18.4, 0.5), ring("外缘低墙连续餐座", pale, 15.1, 0.35, 19.15, 1), ring("顶部浅盘屋盖", pale, 16.2, 12.6, 23, 0.3), cylinder("屋顶中心服务机房", 0, 23.2, 0, 7, 0.9, dark)];
    for (let index = 0; index < 8; index++) {
      const a = index * Math.PI / 4, x = Math.cos(a), z = Math.sin(a);
      parts.push(rail([x * 1.8, 12.5, z * 1.8], [x * 13.8, 18.1, z * 13.8], 0.42, dark), box("餐厅环缘细立柱", x * 15.2, 21.1, z * 15.2, 0.12, 3.4, 0.12, steel), cylinder("环厅独立餐桌", x * 11.5, 19.5, z * 11.5, 1.5, 0.12, colors.wood), cylinder("餐桌中央承足", x * 11.5, 19, z * 11.5, 0.12, 0.9, dark));
    }
    const glass = ring("环形餐厅透光外缘", colors.glass, 15.2, 0.07, 21, 3.5); glass.opacity = 0.3; parts.push(glass);
    return parts;
  }, "建筑", "科幻"),
  design("索悬球舱驻地站", "四座锚塔用上下两组张索把中空球形驻地舱定位于空中，顶部检修桥通向球舱极口，地面保持无中心支柱", () => {
    const profile = Array.from({ length: 12 }, (_, index) => { const a = (168 - index * 156 / 11) * Math.PI / 180; return { x: Math.sin(a) * 6.8, y: Math.cos(a) * 6.8 }; });
    profile.push(...Array.from({ length: 12 }, (_, index) => { const a = (12 + index * 156 / 11) * Math.PI / 180; return { x: Math.sin(a) * 6.55, y: Math.cos(a) * 6.55 }; }));
    const parts: ModelPart[] = [base(31, 31, 0.5), part("两极开口的连续中空球壳", "lathe", pale, [0, 15, 0], [1, 1, 1], [0, 0, 0], { profile }), cylinder("球舱内部居住平台", 0, 13.8, 0, 11.2, 0.25, steel), ring("球舱顶部极口服务颈", dark, 1.45, 0.16, 22.2, 2), box("球舱顶部检修接桥", 0, 23.3, 7.4, 2, 0.25, 15.5, steel)];
    for (const x of [-1, 1]) for (const z of [-1, 1]) parts.push(box("落地锚塔立柱", x * 11.8, 12.8, z * 11.8, 0.65, 25.1, 0.65, dark), pipe("球舱上部承重索", [x * 11.8, 25.2, z * 11.8], [x * 3.5, 19.7, z * 3.5], 0.1), pipe("球舱下部抗摆索", [x * 11.8, 0.7, z * 11.8], [x * 3.5, 10.4, z * 3.5], 0.065));
    parts.push(box("接桥尾部独立交通塔", 0, 12, 14.7, 2.6, 23.1, 2.6, dark), ...[-1, 1].map(s => rail([s * 11.8, 25.2, 11.8], [s, 23.3, 10.5], 0.15, steel)));
    return parts;
  }, "建筑", "科幻"),
  design("三角辐射月面港站", "三条宽装卸翼围绕三角中央调度庭布置，翼端保留贯通航具入口，厚背楔墙和独立斜梁共同承托覆面", () => {
    const parts: ModelPart[] = [base(46, 46, 0.45), part("三角中央调度庭", "extrude", pale, [0, 0.7, 0], [1, 1, 1], [90, 0, 0], { depth: 0.5, profile: [{ x: 0, y: -9 }, { x: 7.8, y: 4.5 }, { x: -7.8, y: 4.5 }] })];
    for (let wing = 0; wing < 3; wing++) {
      const a = wing * Math.PI * 2 / 3 + Math.PI / 6, x = Math.cos(a), z = Math.sin(a), p = -z, q = x;
      parts.push(part("港站放射停靠翼地板", "box", steel, [x * 12, 0.8, z * 12], [22, 0.4, 11], [0, -a * 180 / Math.PI, 0]), part("港站翼后服务背壁", "box", pale, [x * 12 + p * 5.2, 4.7, z * 12 + q * 5.2], [22, 7.4, 0.5], [0, -a * 180 / Math.PI, 0]));
      for (const r of [5, 13, 21]) parts.push(rail([x * r + p * 5.2, 1, z * r + q * 5.2], [x * r - p * 4.4, 9.2, z * r - q * 4.4], 0.5, dark));
      parts.push(triangleShell("港站翼大悬挑覆盖片", [x * 1 - p * 5.7, 9.2, z * 1 - q * 5.7], [x * 23 - p * 5.7, 9.2, z * 23 - q * 5.7], [x * 1 + p * 5.7, 7.3, z * 1 + q * 5.7], 0.24, pale), triangleShell("港站翼大悬挑覆盖片", [x * 23 - p * 5.7, 9.2, z * 23 - q * 5.7], [x * 23 + p * 5.7, 7.3, z * 23 + q * 5.7], [x * 1 + p * 5.7, 7.3, z * 1 + q * 5.7], 0.24, pale));
    }
    parts.push(cylinder("中庭低位调度台", 0, 1.6, 0, 4.5, 1.2, dark));
    return parts;
  }, "建筑", "科幻"),
  design("四瓣鞍壳公共会堂", "四片交错高低角的双曲折面围住一个无柱会堂，屋壳只在四角落地支承，中央屋缝形成十字高采光", () => {
    const parts: ModelPart[] = [base(34, 34, 0.4), cylinder("无柱会堂中央地台", 0, 0.65, 0, 29, 0.5, pale)];
    for (let petal = 0; petal < 4; petal++) {
      const a = petal * Math.PI / 2, x = Math.cos(a), z = Math.sin(a), p = -z, q = x;
      const outer: Triple = [x * 15, 0.8, z * 15], left: Triple = [x * 8 + p * 8, 10, z * 8 + q * 8], right: Triple = [x * 8 - p * 8, 10, z * 8 - q * 8], inner: Triple = [x * 1.2, 7.5, z * 1.2];
      parts.push(box("鞍壳落地点承座", x * 15, 0.6, z * 15, 0.9, 0.4, 0.9, dark));
      parts.push(triangleShell("鞍形瓣屋壳外折面", outer, left, inner, 0.25, pale), triangleShell("鞍形瓣屋壳内折面", outer, inner, right, 0.25, steel), rail(outer, left, 0.22, dark), rail(outer, right, 0.22, dark));
      parts.push(part("瓣间开放入口上缘玻璃", "box", colors.glass, [x * 6.5 + p * 7.5, 4.6, z * 6.5 + q * 7.5], [12, 6.7, 0.08], [0, -a * 180 / Math.PI + 45, 0]));
    }
    parts.push(box("会堂后端低台", 0, 1.2, 8, 10, 1.1, 3.4, dark));
    return parts;
  }, "建筑", "科幻"),
  design("倾柱门形连体楼", "两座向外展开的斜柱楼翼在高位横梁处连接，底部形成跨街门洞，上部楼板分别从斜柱悬挑到内侧通廊", () => {
    const parts: ModelPart[] = [base(40, 22, 0.5), box("高空连体转换层", 0, 30.5, 0, 33, 1.2, 14, steel), box("门形楼顶部通长屋盖", 0, 38.8, 0, 34, 0.4, 14.8, pale)];
    for (const side of [-1, 1]) {
      for (const z of [-5.5, 5.5]) parts.push(rail([side * 9, 0.5, z], [side * 15.6, 38.6, z], 0.85, dark));
      for (let level = 0; level < 9; level++) { const y = 3.2 + level * 3.7, x = side * (9 + y / 38 * 6.6); parts.push(box("斜柱楼翼独立楼层", x, y, 0, 6.5, 0.25, 13.4, steel), part("楼翼向街高窗面", "box", colors.glass, [x - side * 3.1, y + 1.7, 0], [0.1, 3.2, 13.1], [0, 0, 0])); }
      parts.push(box("独立外侧竖向交通塔", side * 17, 19.2, 4, 2.4, 37.4, 3.2, pale));
    }
    parts.push(box("转换层上部中跨办公室地板", 0, 34.5, 0, 27, 0.25, 13.2, steel), ...[-1, 1].map(s => box("高位连桥透明长面", 0, 34.6, s * 6.7, 26.5, 7.7, 0.1, colors.glass)));
    return parts;
  }, "建筑", "赛博朋克"),
  design("外骨骼斜网高层楼", "四立面的连续交叉斜网把层间荷载传到底部，细层板退于外网之内，中央独立服务核心与外骨架分工承重", () => {
    const parts: ModelPart[] = [base(29, 29, 0.6), box("高层独立服务核心", 0, 27.225, 0, 4.8, 53.25, 4.8, pale)];
    for (let level = 0; level < 13; level++) parts.push(box("退进外骨架内的楼板", 0, 1.2 + level * 4.1, 0, 21.2, 0.25, 21.2, steel));
    for (let face = 0; face < 4; face++) {
      const a = face * Math.PI / 2, nx = Math.cos(a), nz = Math.sin(a), tx = -nz, tz = nx;
      for (let bay = 0; bay < 4; bay++) for (const side of [-1, 1]) parts.push(rail([nx * 11.2 + tx * side * 11.2, 0.6 + bay * 13.2, nz * 11.2 + tz * side * 11.2], [nx * 11.2 - tx * side * 11.2, 0.6 + (bay + 1) * 13.2, nz * 11.2 - tz * side * 11.2], 0.35, dark));
      parts.push(part("外网内的通高透明幕面", "box", colors.glass, [nx * 10.6, 27, nz * 10.6], [0.08, 52, 21.2], [0, -a * 180 / Math.PI, 0]));
    }
    parts.push(box("高层屋顶薄板", 0, 54, 0, 22, 0.3, 22, pale), ...doorway("首层开放高入口", 0, 0.6, -10.7, 3.2, 3.8, 0.25, dark));
    return parts;
  }, "建筑", "赛博朋克"),
  design("折纸脊廊大型温室", "两排温室种植廊夹住贯通服务脊，整片屋盖在连续折脊之间升降，向内的高窗缝保留通风与采光", () => {
    const parts: ModelPart[] = [base(32, 53, 0.4), box("温室中央贯通服务脊地台", 0, 0.65, 0, 4.2, 0.5, 50, steel)];
    for (const side of [-1, 1]) {
      parts.push(part("外侧连续玻璃围护", "box", colors.glass, [side * 14.2, 3.5, 0], [0.09, 6.2, 50], [0, 0, 0], { opacity: 0.35 }));
      for (let bay = 0; bay < 5; bay++) {
        const z = -20 + bay * 10;
        parts.push(box("温室独立种植台", side * 8.3, 1, z, 8.5, 1.2, 7.5, masonry), box("种植槽内凹土面", side * 8.3, 1.62, z, 8, 0.04, 7, colors.earth), box("外缘屋盖支柱", side * 14.2, 3.8, z, 0.18, 6.8, 0.18, dark), box("内缘高窗脊柱", side * 2.5, 5.66, z, 0.22, 10.52, 0.22, dark));
        parts.push(triangleShell("交替上扬折纸屋片", [side * 14.5, 6.6, z - 5.1], [side * 2.3, 10.2, z - 5.1], [side * 14.5, 6.6, z + 5.1], 0.08, colors.glass), triangleShell("交替下折折纸屋片", [side * 14.5, 6.6, z + 5.1], [side * 2.3, 10.2, z - 5.1], [side * 2.3, 8.6, z + 5.1], 0.08, pale));
      }
    }
    parts.push(box("脊廊独立遮雨薄顶", 0, 11, 0, 5.4, 0.16, 50.8, steel), ...[-1, 1].map(s => box("脊廊入口侧墙", s * 2.6, 2.2, -25.3, 0.2, 3.6, 1.5, dark)));
    return parts;
  }, "建筑", "科幻"),
  design("双层气枕球壳生态馆", "两层分离透明穹壳落在有入口缺口的环形基墙上，夹层保持间隙，地面入口通过横向双门廊进入大生态空间", () => {
    const parts: ModelPart[] = [base(46, 46, 0.4), cylinder("生态馆圆形地台", 0, 0.65, 0, 37.2, 0.5, masonry), halfRoundWall("保留主门缺口的外基墙", 18.6, 0.35, 3.2, [0, 0.4, 0], -15, pale, Math.PI * 11 / 6)];
    for (const yaw of [0, 180]) {
      const outer = halfDomeRoof("外层透明气枕穹壳", 18.5, 0.1, [0, 3.6, 0], yaw, colors.glass); outer.opacity = 0.25;
      const inner = halfDomeRoof("夹层内侧透明穹壳", 18.05, 0.08, [0, 3.6, 0], yaw, colors.glass); inner.opacity = 0.18; parts.push(outer, inner);
    }
    for (let index = 0; index < 8; index++) { const a = Math.PI / 4 * index; parts.push(rail([Math.cos(a) * 17.95, 3.7, Math.sin(a) * 17.95], [Math.cos(a) * 18.55, 3.7, Math.sin(a) * 18.55], 0.1, steel)); }
    for (const side of [-1, 1]) {
      parts.push(box("生态馆双门廊侧壁", 19, 1.95, side * 1.8, 8.5, 3.1, 0.2, pale), box("馆内独立展植低台", side * 6.5, 1.1, 5.2, 6.5, 0.9, 10, colors.earth));
    }
    for (const x of [16.5, 21.2]) { const frame = doorway("横向入口串接气闸", 0, 0.4, 0, 2.8, 2.9, 0.22, dark); for (const value of frame) { const oldX = value.position.x; value.position.x = x; value.position.z = oldX; value.rotation.y = 90; } parts.push(...frame); }
    parts.push(box("双门廊覆盖屋面", 19, 3.6, 0, 8.8, 0.18, 4.1, pale));
    return parts;
  }, "建筑", "科幻"),
  design("拱券穿院厂居楼", "高地面拱廊贯穿方形厂居院，三层住居环廊架在拱墩之上，院内与街面通过南北两个拱门连续相通", () => {
    const parts: ModelPart[] = [base(37, 37, 0.4)];
    for (const side of [-1, 1]) {
      for (const y of [5.5, 9.1, 12.7]) parts.push(box("院侧环廊长楼板", side * 14.4, y, 0, 6.8, 0.28, 31, steel), box("前后翼住居层板", 0, y, side * 14.4, 24.2, 0.28, 6.8, steel));
      parts.push(box("厂居楼外侧连续砖壁", side * 17.6, 10.8, 0, 0.3, 11, 34.5, masonry), box("厂居楼前后外壁", 0, 10.8, side * 17.6, 34.5, 11, 0.3, masonry));
      for (const z of [-12, -4, 4, 12]) {
        const arcade = part("底层侧翼真实贯通拱洞", "extrude", masonry, [side * 14.5, 0.4, z], [1, 1, 1], [0, 90, 0], { depth: 6.4, profile: [{ x: -3.8, y: 0 }, { x: -3.8, y: 5 }, { x: 3.8, y: 5 }, { x: 3.8, y: 0 }, { x: 3.1, y: 0 }, { x: 3.1, y: 2.4 }, { x: 2.7, y: 3.7 }, { x: 1.6, y: 4.4 }, { x: 0, y: 4.65 }, { x: -1.6, y: 4.4 }, { x: -2.7, y: 3.7 }, { x: -3.1, y: 2.4 }, { x: -3.1, y: 0 }] });
        parts.push(arcade);
      }
      for (const x of [-10, 0, 10]) parts.push(...doorway("前后翼底层通院门廊", x, 0.4, side * 14.5, 6.4, 4.8, 6.2, masonry));
    }
    parts.push(rectangularFlue("厂居院顶层环形平屋盖", 36, 36, 0.25, 7, [0, 16.3, 0], pale), box("院心开放休息地台", 0, 0.8, 0, 10, 0.8, 10, pale), ...[-1, 1].map(s => box("院侧连续竖向交通核心", s * 11.8, 8.3, 11.8, 2.4, 15.8, 2.4, dark)));
    return parts;
  }, "建筑", "蒸汽朋克"),
  design("巨桁架转换层办公楼", "两端重柱只承托中段巨型转换桁架，上部整组办公室层板跨过无柱前庭，转换层斜杆和上层常规楼柱明确分开", () => {
    const parts: ModelPart[] = [base(61, 31, 0.5)];
    for (const side of [-1, 1]) {
      for (const z of [-10.8, 10.8]) parts.push(box("转换层端部巨型承柱", side * 24, 8.8, z, 1.8, 16.6, 1.8, dark));
      parts.push(box("转换层上弦长梁", 0, 17.4, side * 10.8, 51, 0.85, 0.8, steel), box("转换层下弦长梁", 0, 11.1, side * 10.8, 51, 0.85, 0.8, steel));
      for (let bay = 0; bay < 8; bay++) parts.push(rail([-24 + bay * 6, bay % 2 ? 17.4 : 11.1, side * 10.8], [-18 + bay * 6, bay % 2 ? 11.1 : 17.4, side * 10.8], 0.45, dark));
      parts.push(box("上部办公层外侧通透幕面", 0, 31.1, side * 10.4, 49.5, 26.5, 0.12, colors.glass));
    }
    for (let level = 0; level < 8; level++) parts.push(box("跨转换层的整幅办公楼板", 0, 17.8 + level * 3.7, 0, 49.8, 0.25, 21.4, steel));
    for (const x of [-18, -6, 6, 18]) for (const z of [-10, 10]) parts.push(box("转换层以上办公细柱", x, 31, z, 0.25, 26.4, 0.25, dark));
    parts.push(box("办公楼上盖", 0, 44.5, 0, 51, 0.35, 22.2, pale), ...[-1, 1].map(s => box("端部独立升降服务核心", s * 26, 22.4, 0, 3.6, 43.8, 5.5, pale)), box("地面无柱前庭接待岛", 0, 1.25, 0, 9, 1.5, 3.5, masonry));
    return parts;
  }, "建筑", "赛博朋克"),
  design("对置锥壳潜海科研馆", "上下相对的两段锥壳围成一层宽阔径向工作馆，固定锚腿将壳体托离海底，顶部独立细颈接通上部气闸平台", () => {
    const profile = [{ x: 3, y: -8 }, { x: 8.8, y: 0 }, { x: 3, y: 8 }, { x: 2.75, y: 8 }, { x: 8.45, y: 0 }, { x: 2.75, y: -8 }];
    const parts: ModelPart[] = [base(29, 29, 0.5), part("上下对置的中空锥形馆壳", "lathe", pale, [0, 12, 0], [1, 1, 1], [0, 0, 0], { profile }), cylinder("馆内中央径向工作层", 0, 12, 0, 17.2, 0.3, steel), ring("顶端连续气闸颈壁", steel, 2.9, 0.18, 22.4, 4.8), ring("馆壳赤道外部维护环廊", steel, 10, 1.2, 11.8, 0.25), cylinder("顶端落脚平台", 0, 24.95, 0, 8, 0.3, dark)];
    for (let index = 0; index < 6; index++) { const a = index * Math.PI / 3, x = Math.cos(a), z = Math.sin(a); parts.push(rail([x * 11.8, 0.5, z * 11.8], [x * 7.4, 10.2, z * 7.4], 0.55, dark), box("馆内独立径向工作台", x * 5, 12.95, z * 5, 2.1, 1.6, 1.4, colors.wood)); }
    parts.push(...doorway("顶端气闸开放框", 0, 25.1, -1.8, 2.6, 2.7, 0.25, dark), barrelRoof("气闸覆盖拱壳", 2.1, 0.16, 4, [0, 27.8, 0], pale));
    return parts;
  }, "建筑", "科幻"),
  design("埋坡楔体观测馆", "楔形建筑顺斜坡伸出，连续斜顶把前端高玻璃厅压入两侧覆土翼，后部细长采光井独立露出坡面", () => {
    const parts: ModelPart[] = [base(41, 38, 0.5), box("楔体观测馆下层楼板", 0, 0.8, 0, 28, 0.6, 31, steel), ...[-1, 1].map(s => part("观测馆两侧实体楔墙", "extrude", masonry, [s * 13.7, 0.5, 0], [1, 1, 1], [0, 90, 0], { depth: 0.6, profile: [{ x: -15.5, y: 0 }, { x: 15.5, y: 0 }, { x: 15.5, y: 11.2 }, { x: -15.5, y: 3.7 }] })), triangleShell("斜坡观测馆完整斜屋盖", [-14, 11.7, -15.5], [14, 11.7, -15.5], [-14, 4.2, 15.5], 0.25, pale), triangleShell("斜坡观测馆完整斜屋盖", [14, 11.7, -15.5], [14, 4.2, 15.5], [-14, 4.2, 15.5], 0.25, pale)];
    for (const side of [-1, 1]) {
      parts.push(part("侧向覆土缓坡体", "extrude", colors.earth, [side * 16.4, 0.5, 0], [1, 1, 1], [0, 0, 0], { depth: 33, profile: side < 0 ? [{ x: -4, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 8.5 }] : [{ x: 0, y: 0 }, { x: 4, y: 0 }, { x: 0, y: 8.5 }] }), box("高端观测厅入口侧窗", side * 8.1, 6.2, -15.5, 10.5, 10.8, 0.12, colors.glass));
      for (const z of [-10, 0, 10]) parts.push(box("观测厅上层局部展台", side * 8.4, 1.5, z, 6.3, 1.4, 5.5, dark));
    }
    parts.push(...doorway("高端观测厅中央门口", 0, 0.5, -15.6, 5.5, 4.2, 0.3, dark), box("入口上部高窗", 0, 8, -15.5, 5.5, 6.7, 0.12, colors.glass), box("入口整宽高窗顶梁", 0, 11.35, -15.5, 27.8, 0.3, 0.3, dark), rectangularFlue("坡后独立矩形采光井", 3.6, 5.5, 4.8, 0.16, [0, 4.2, 10], steel));
    return parts;
  }, "建筑", "科幻"),
  design("椭圆管壳交叉居住站", "两条扁椭圆筒形居住翼斜交于同一生活庭，筒壳和地台保留贯通长轴，交会处用架空短平台连接侧廊", () => {
    const parts: ModelPart[] = [base(47, 47, 0.5)];
    for (const yaw of [-35, 35]) {
      const a = yaw * Math.PI / 180;
      parts.push(part("管壳内部独立地板", "box", steel, [0, 0.8, 0], [10.4, 0.45, 41], [0, yaw, 0]));
      for (const z of [-14, 14]) {
        const shell = barrelRoof("中央留出生活庭的扁椭圆翼壳", 5.5, 0.22, 13, [Math.sin(a) * z, 3.2, Math.cos(a) * z], pale); shell.scale.y = 0.65; shell.rotation.y = yaw; parts.push(shell);
        for (const side of [-1, 1]) {
          parts.push(part("生活庭以外的翼侧围护", "box", colors.glass, [Math.cos(a) * side * 5.5 + Math.sin(a) * z, 2.1, -Math.sin(a) * side * 5.5 + Math.cos(a) * z], [0.08, 2.6, 13], [0, yaw, 0], { opacity: 0.4 }));
          parts.push(rail([Math.cos(a) * side * 6.8 + Math.sin(a) * z, 0.5, -Math.sin(a) * side * 6.8 + Math.cos(a) * z], [Math.cos(a) * side * 5.4 + Math.sin(a) * z, 4.1, -Math.sin(a) * side * 5.4 + Math.cos(a) * z], 0.3, dark));
        }
      }
      for (const z of [-14, 14]) for (const side of [-1, 1]) parts.push(part("管翼内侧卧室隔台", "box", dark, [Math.cos(a) * side * 3 + Math.sin(a) * z, 1.6, -Math.sin(a) * side * 3 + Math.cos(a) * z], [2.3, 1.2, 5.5], [0, yaw, 0]));
    }
    for (const yaw of [0, 180]) parts.push(halfDomeRoof("交叉生活庭独立上覆盖壳", 8.1, 0.18, [0, 3.2, 0], yaw, pale));
    parts.push(cylinder("斜交中央生活庭", 0, 1.5, 0, 10, 0.3, steel), ...[-1, 1].map(s => box("交会庭高位短连廊", s * 5.5, 3.2, 0, 5, 0.2, 1.5, dark)), box("中央生活庭共用服务台", 0, 2.5, 0, 4, 1.7, 1.5, colors.wood));
    return parts;
  }, "建筑", "科幻"),
  design("塔芯双向悬臂档案楼", "高强度塔芯把两组错层档案翼托到相反方向，深腹箱梁支撑没有落地柱的长翼，中央服务带保持连续贯通", () => {
    const parts: ModelPart[] = [base(54, 24, 0.5), box("贯通中央档案塔芯", 0, 19.8, 0, 8, 38.6, 14, dark)];
    for (const side of [-1, 1]) {
      const y = side < 0 ? 12 : 25;
      parts.push(box("悬臂翼箱梁下弦底板", side * 13, y, 0, 27, 0.6, 13, steel), box("悬臂翼箱梁上弦楼板", side * 13, y + 4, 0, 27, 0.4, 13, steel), ...[-1, 1].map(z => box("悬臂翼深腹侧梁", side * 13, y + 2, z * 6.2, 27, 3.6, 0.3, dark)));
      for (const level of [0, 1, 2]) {
        const floorY = y + 4.2 + level * 3.4;
        parts.push(box("悬臂档案翼层板", side * 13, floorY, 0, 27, 0.22, 13, steel), ...[-1, 1].map(z => box("悬臂翼长边透光表面", side * 13, floorY + 1.6, z * 6.4, 26.4, 3, 0.08, colors.glass)));
        for (const x of [8, 18]) parts.push(box("翼内固定长档案柜", side * x, floorY + 1.5, 0, 3.4, 2.8, 8.6, colors.wood));
      }
      parts.push(box("档案翼端部封墙", side * 26, y + 9.25, 0, 0.3, 10.1, 12.8, pale), box("悬臂档案翼完整屋盖", side * 13, y + 14.4, 0, 27, 0.2, 13.3, pale));
    }
    parts.push(box("塔芯顶部平屋盖", 0, 39.3, 0, 8.6, 0.3, 14.6, pale), ...doorway("档案塔芯地面入口", 0, 0.5, -7.1, 3.6, 4.1, 0.3, steel));
    return parts;
  }, "建筑", "赛博朋克"),
  design("串联折环航材陈列馆", "倾角交替的厚环壳连续串接成大尺度展廊，前后保持完整椭圆通口，展台沿外缘布置并让出贯通运输轴", () => {
    const parts: ModelPart[] = [base(29, 57, 0.4), box("陈列馆贯通运输地板", 0, 0.7, 0, 19.5, 0.6, 53, steel)];
    for (let section = 0; section < 5; section++) {
      const z = -21 + section * 10.5;
      const ringPart = ring("前后贯通的大椭圆折环框", dark, 10, 0.35, 0, 0.45); ringPart.position = { x: 0, y: 8.5, z }; ringPart.rotation.x = 90; ringPart.rotation.y = section % 2 ? -9 : 9; ringPart.scale.z = 0.85; parts.push(ringPart);
      if (section < 4) {
        const shell = barrelRoof("折环之间连续上部覆盖壳", 10, 0.14, 11, [0, 8.5, z + 5.25], pale); shell.scale.y = 0.85; parts.push(shell, ...[-1, 1].map(s => box("展廊两侧玻璃围护段", s * 9.6, 4.9, z + 5.2, 0.1, 8, 10.7, colors.glass)));
      }
      for (const side of [-1, 1]) parts.push(box("馆侧连续独立陈列台", side * 6.2, 1.5, z, 4.5, 1, 6.8, masonry));
    }
    parts.push(...doorway("展廊端面低位通行门框", 0, 0.4, -26.4, 5, 4.3, 0.35, dark));
    return parts;
  }, "建筑", "科幻"),
  design("双层螺旋外廊博览楼", "两条相位错开的连续坡廊沿大中庭上升，三道环形展层与坡廊在相同标高接合，屋盖落在外圈独立高柱上", () => {
    const parts: ModelPart[] = [base(34, 34, 0.5)];
    for (const y of [0.8, 7.8, 14.8]) parts.push(ring("博览楼中空环形展层", steel, 13.5, 6.5, y, 0.25));
    for (const yaw of [0, 180]) { const ramp = helicalFlight([0, 0.9, 0], 7.3, 12.8, 14, 2, 1, 0.2); ramp.name = "连续可见的外圈螺旋坡廊"; ramp.rotation.y = yaw; ramp.color = pale; parts.push(ramp); }
    for (let index = 0; index < 8; index++) { const a = index * Math.PI / 4, x = Math.cos(a), z = Math.sin(a); parts.push(box("屋盖外环独立承柱", x * 14.5, 9.2, z * 14.5, 0.35, 17.4, 0.35, dark), rail([x * 14.5, 17.9, z * 14.5], [x * 6.3, 17.9, z * 6.3], 0.25, steel)); }
    parts.push(ring("博览楼开放中心环形屋盖", pale, 15.5, 9.2, 18.1, 0.25), cylinder("中庭独立服务圆台", 0, 1.3, 0, 7.5, 1.1, masonry), ...[-1, 1].map(s => rail([s * 4.5, 15, 0], [s * 7.5, 15, 0], 0.2, steel)));
    return parts;
  }, "建筑", "科幻"),
];
