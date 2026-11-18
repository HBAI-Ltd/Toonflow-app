import { part, ring, type ModelPart, type Triple } from "../assetModelParts";
import { barrelRoof, halfRoundWall, rectangularFlue } from "./spatialShells";
import { base, box, colors, cylinder, design, pipe, rail, type ArchitecturePrototype } from "./structures";
import { triangleShell } from "./futureSpaceBatchOne";
import { sectorSlab } from "./futureSpaceBatchTwo";
import { polygon } from "../masterNature/shared";

const steel = "#75898e", pale = "#a6b1ad", dark = "#43565d", stone = "#a08f7b";

function gate(name: string, x: number, y: number, z: number, width: number, height: number, depth: number, color = dark): ModelPart[] {
  return [box(`${name}两侧支柱`, x - width / 2 - 0.2, y + height / 2, z, 0.4, height, depth, color), box(`${name}两侧支柱`, x + width / 2 + 0.2, y + height / 2, z, 0.4, height, depth, color), box(`${name}顶部连接梁`, x, y + height + 0.2, z, width + 0.8, 0.4, depth, color)];
}

export const futureSpaceBatchThreeDesigns: ArchitecturePrototype[] = [
  design("山壁裂口复合机库", "双侧岩体和厚覆顶包住一个宽阔贯通机库，前端大门口被两座独立压墙收边，内部侧廊不占用航具中线", () => {
    const parts: ModelPart[] = [base(59, 48, 0.5), box("裂口机库连续整平地板", 0, 0.85, 0, 31, 0.7, 39, steel), box("机库后端岩壁衬层", 0, 9, 19.5, 31, 16.3, 0.7, stone), barrelRoof("机库岩体内衬拱壳", 15.5, 0.55, 39, [0, 11, 0], stone)];
    for (const side of [-1, 1]) {
      parts.push(part("两侧楔形原岩山壁", "extrude", colors.earth, [side * 16.5, 0.5, 0], [1, 1, 1], [0, 0, 0], { depth: 43, profile: side < 0 ? [{ x: -12, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 23 }, { x: -4, y: 21 }] : [{ x: 0, y: 0 }, { x: 12, y: 0 }, { x: 4, y: 21 }, { x: 0, y: 23 }] }), box("机库端面厚重门侧压墙", side * 14, 8, -20, 3.7, 15, 1.2, stone), box("机库内侧抬升维护廊", side * 12.7, 2.8, 0, 3.7, 0.3, 35, dark));
      for (const z of [-15, 0, 15]) parts.push(box("维护廊独立短柱", side * 12.7, 1.8, z, 0.25, 1.7, 0.25, steel));
    }
    parts.push(box("裂口上部覆岩厚梁", 0, 17.1, -20, 31.6, 3.2, 2.2, stone), ...gate("机库内部高起吊框", 0, 1.2, 9, 22, 13, 0.5), pipe("起吊框独立悬索", [0, 14, 9], [0, 8, 9], 0.07));
    return parts;
  }, "建筑", "科幻"),
  design("半露天竖井发射站", "厚圆筒包住低于井口的中央竖直工作空间，下部侧门廊进入检修层，顶端两片重门向外翻起保留真正井口", () => {
    const parts: ModelPart[] = [base(34, 39, 0.5), cylinder("竖井底部承载厚盘", 0, 0.85, 0, 21, 0.7, stone), halfRoundWall("井底侧门缺口的厚筒壁", 10.5, 0.6, 4.2, [0, 0.5, 0], 67.5, stone, Math.PI * 7 / 4), ring("高于侧门的完整竖井外壁", stone, 10.5, 0.6, 11.7, 14), ring("竖井顶部外伸承托檐", steel, 11.7, 1.8, 18.9, 0.4), ring("井内中层可行走检修环", steel, 9.8, 1.7, 8.2, 0.25), box("井底检修作业低台", 0, 1.8, 0, 6.2, 1.2, 6.2, dark)];
    const opening = 124 * Math.PI / 180;
    for (const side of [-1, 1]) parts.push(part("向外翻开的厚井口盖", "box", pale, [side * (10.7 - 5.4 * Math.cos(opening)), 19.2 + 5.4 * Math.sin(opening), 0], [10.8, 0.45, 21.5], [0, 0, -side * 124]), cylinder("井口盖贯通铰轴", side * 10.7, 19.2, 0, 0.5, 22, dark, [90, 0, 0]), box("地面检修入口侧墙", side * 2.1, 2.5, -14.3, 0.3, 4, 10.5, stone));
    for (let index = 0; index < 6; index++) { const a = index * Math.PI / 3; parts.push(pipe("井内固定竖向导轨", [Math.cos(a) * 8.8, 1.4, Math.sin(a) * 8.8], [Math.cos(a) * 8.8, 17.8, Math.sin(a) * 8.8], 0.14)); }
    parts.push(box("侧门检修廊顶部", 0, 4.65, -14.3, 4.6, 0.25, 10.8, pale), ...gate("地面侧门廊外口", 0, 0.5, -19.5, 3.8, 4, 0.3, dark));
    return parts;
  }, "建筑", "科幻"),
  design("二级缆升太空港", "两道巨大A形支架托起两级装卸港台，中央缆升带贯通上下并与地面港厅独立分离，港台在不同高度接入支架内侧", () => {
    const parts: ModelPart[] = [base(73, 46, 0.6), box("地面港厅连续基座", 0, 1, 0, 42, 0.8, 25, steel), box("中央贯通升降带", 0, 43.2, 0, 1.8, 85.2, 0.4, dark)];
    for (const z of [-10, 10]) {
      parts.push(rail([-27, 0.6, z], [0, 76, z], 1.2, dark), rail([27, 0.6, z], [0, 76, z], 1.2, dark), box("一级港台穿架横梁", 0, 29.5, z, 41, 1, 1, steel), box("二级港台穿架横梁", 0, 59.5, z, 25, 0.8, 0.8, steel));
    }
    for (const [y, width] of [[30.2, 42], [60.2, 26]]) {
      parts.push(rectangularFlue("中央让出升降带的港台地板", width!, 25, 0.5, 8, [0, y!, 0], steel));
      for (const side of [-1, 1]) parts.push(box("各级港台外侧装卸厅后壁", side * (width! / 2 - 4.2), y! + 2.7, 6.5, 7.4, 4.9, 0.3, pale), box("各级装卸厅覆盖屋面", side * (width! / 2 - 4.2), y! + 5.275, 0, 7.8, 0.25, 14, pale));
    }
    parts.push(box("顶端缆升转换机房", 0, 77.1, 0, 7, 3.2, 23, pale), ...[-1, 1].map(s => box("地面港厅侧向服务楼", s * 15.4, 5.6, 1, 9.8, 9.2, 18, pale)), ...gate("地面中央穿行港厅", 0, 1.4, -12.6, 14, 8.4, 0.4, steel));
    return parts;
  }, "建筑", "科幻"),
  design("凹槽式机甲整备场", "两条分开的低位足部检修槽留在抬升整备台之间，四根高柱支承上空维护框架，左右短臂面向中央机体检修空间", () => {
    const parts: ModelPart[] = [base(32, 35, 0.5), box("中央分腿检修隔岛", 0, 1.2, -2, 2.2, 1.4, 19, steel), ...[-1, 1].map(s => box("足槽外侧工作台", s * 7.4, 1.2, -2, 5.2, 1.4, 19, steel)), box("检修槽后端汇接平台", 0, 1.2, 10.2, 20, 1.4, 5.2, steel), ...[-1, 1].map(s => box("真实低于周边的足槽底板", s * 3.2, 0.62, -2, 3.8, 0.24, 18.5, dark))];
    for (const x of [-1, 1]) for (const z of [-1, 1]) parts.push(box("整备场上空维护柱", x * 11.8, 12.5, z * 12.2, 0.65, 24, 0.65, dark));
    for (const side of [-1, 1]) {
      parts.push(box("上方纵向吊运梁", side * 11.8, 24.5, 0, 0.55, 0.65, 25.5, steel), box("左右检修升降支柱", side * 11.8, 8, 0, 0.75, 15, 0.8, pale), rail([side * 11.8, 13.7, 0], [side * 6, 17.5, 1.5], 0.5, dark), rail([side * 6, 17.5, 1.5], [side * 3.3, 14.6, 1.5], 0.35, steel), box("末端开口维护托台", side * 3.2, 14.5, 1.5, 1.7, 0.22, 2.6, steel), box("边侧上层维护走道", side * 8.8, 7.3, 1, 2.8, 0.25, 20.8, steel), rail([side * 11.8, 5.5, 0], [side * 8.8, 7.2, 0], 0.25, dark));
      for (const end of [-1, 1]) parts.push(rail([side * 11.8, 4.5, end * 12.2], [side * 8.8, 7.2, end * 9.4], 0.25, dark));
    }
    parts.push(box("上空横向起吊桥梁", 0, 24.6, 6, 24.2, 0.6, 0.6, steel), ...[-1, 1].map(s => pipe("空载整备吊挂索", [s * 2, 24.3, 6], [s * 2, 16.5, 6], 0.06)), box("前方整备控制台", 10.4, 2.7, -12.8, 2.5, 2.7, 2.2, pale));
    return parts;
  }, "建筑", "科幻"),
  design("斜置巨箱天文观测馆", "整段长箱形观测厅倾斜架起，两个不同高度的支承墩托住底面，前端大玻璃开口与后端服务体分别处于不同标高", () => {
    const tilt = 22 * Math.PI / 180;
    const parts: ModelPart[] = [box("倾箱观测厅底板", 0, 0, 0, 17, 0.4, 30, steel), box("倾箱观测厅屋面", 0, 10, 0, 17, 0.3, 30, pale), ...[-1, 1].map(s => box("倾箱观测厅两侧薄壁", s * 8.3, 5, 0, 0.3, 10, 30, pale)), box("倾箱观测厅后服务隔壁", 0, 5, 14.8, 16.6, 10, 0.3, dark), ...[-1, 1].map(s => box("倾箱前端门侧大玻璃", s * 5.3, 5, -14.8, 5.8, 9.4, 0.1, colors.glass)), ...gate("倾箱观测厅中央入口", 0, 0.2, -14.9, 4.6, 3.2, 0.2, steel), box("倾箱门口上部大玻璃", 0, 6.9, -14.8, 4.6, 5.7, 0.1, colors.glass), box("厅内贯通观测展台", 0, 1.1, 1, 4.5, 1.8, 15, dark)];
    for (const value of parts) { const y = value.position.y, z = value.position.z; value.position.y = 13.5 + y * Math.cos(tilt) - z * Math.sin(tilt); value.position.z = y * Math.sin(tilt) + z * Math.cos(tilt); value.rotation.x += 22; }
    parts.unshift(base(31, 43, 0.5));
    for (const x of [-6.5, 6.5]) for (const z of [-10, 10]) { const top = 13.5 - Math.sin(tilt) * z; parts.push(box("随底面高差落地的观测馆支墩", x, (top + 0.5) / 2, z * Math.cos(tilt), 0.9, top - 0.5, 1.2, dark)); }
    parts.push(box("高端观测厅入口升降停靠台", 0, 19.2, -15.2, 2.6, 0.2, 3), ...[-1, 1].map(s => box("入口升降台落地导向架", s * 1.2, 10, -16.4, 0.2, 19, 0.2, dark)), box("入口升降架顶部承梁", 0, 19.6, -16.4, 2.7, 0.25, 0.3, steel));
    return parts;
  }, "建筑", "科幻"),
  design("错层折流防风驻地", "三道错开长墙围出相互避风的两列驻地空间，屋盖搭在高低不同的墙顶，外部通路需在端头折返才能进入居室", () => {
    const parts: ModelPart[] = [base(38, 49, 0.5), box("中央通长服务厚墙", 0, 5.1, 0, 1, 9.2, 42, stone), box("西侧退后外防风厚墙", -15.5, 3.4, 4, 1.2, 5.8, 42, stone), box("东侧前伸外防风厚墙", 15.5, 3.4, -4, 1.2, 5.8, 42, stone)];
    for (const side of [-1, 1]) {
      parts.push(box("驻地长翼架空生活板", side * 7.7, 0.9, -side * 1.5, 14.3, 0.8, 38.5, steel), part("向中央服务脊抬高的屋面", "box", pale, [side * 7.7, 8, -side * 1.5], [15, 0.3, 39], [0, 0, side * -12]));
      for (const z of [-13, 0, 13]) parts.push(box("长翼内部分间短墙", side * 7.7, 3.7, z, 12.8, 5.2, 0.22, pale), box("背风门前遮挡短墙", side * 12.2, 2.7, z - side * 2.2, 3.4, 3.6, 0.35, stone));
      parts.push(box("端部折返门廊外挡墙", side * 7.8, 3.3, -side * 22.5, 14.4, 5.6, 0.7, stone), box("中央服务脊外挑检修廊", side * 1.4, 5.9, 0, 1.5, 0.22, 39, dark));
    }
    parts.push(...gate("驻地前方小入口", 6, 0.5, -20.7, 2.3, 3, 0.3, steel), ...gate("驻地后方小入口", -6, 0.5, 20.7, 2.3, 3, 0.3, steel));
    return parts;
  }, "建筑", "科幻"),
  design("梯田阶退海岸旅馆", "每层向背部退进并露出整宽前庭露台，连续后部服务壁和侧边竖井承担层板，阶退边缘形成可见的分层生活空间", () => {
    const parts: ModelPart[] = [base(63, 46, 0.5), box("阶退旅馆后部连续服务壁", 0, 14.5, 20.2, 55, 28, 0.6, pale), ...[-1, 1].map(s => box("两侧独立竖向交通塔", s * 27.4, 15, 14, 3.6, 29, 7.5, dark))];
    for (let level = 0; level < 8; level++) {
      const y = 0.9 + level * 3.6, front = -20 + level * 3.8, depth = 40.2 - level * 3.8, center = (front + 20.2) / 2;
      parts.push(box("阶退旅馆整层地板", 0, y, center, 54.8, 0.3, depth, steel), box("退于露台后的房间玻璃前面", 0, y + 1.8, front + 3.3, 50.5, 3.3, 0.1, colors.glass), ...[-1, 1].map(s => box("阶退房间两侧短墙", s * 25.5, y + 1.8, center + 1.6, 0.2, 3.3, Math.max(2, depth - 3.2), pale)), part("露台边缘接实楼板的连续低玻璃护壁", "box", colors.glass, [0, y + 0.65, front + 0.3], [52, 1, 0.07], [0, 0, 0], { opacity: 0.3 }));
      for (const x of [-17, 0, 17]) parts.push(box("旅馆层间客房分隔壁", x, y + 1.8, center + 1.7, 0.15, 3.3, Math.max(2, depth - 3.5), pale));
    }
    parts.push(box("阶退旅馆最上层平屋顶", 0, 29.675, 13.5, 55.5, 0.25, 14.5, pale));
    return parts;
  }, "建筑", "赛博朋克"),
  design("断层双层防沙前哨", "两个斜对角错位的防沙院分别位于高低层，实心外挡墙把入口藏在折线后，内院房间和连坡保留独立的通行空隙", () => {
    const parts: ModelPart[] = [base(49, 49, 0.5)];
    for (const [side, y] of [[-1, 1], [1, 5]]) {
      const x = side! * 9, z = side! * 8;
      parts.push(box("错层前哨院内平台", x, y!, z, 25, 1, 25, stone), box("院外连续横挡风墙", x, y! + 3.1, z + side! * 12, 25, 5.2, 0.65, stone), box("院外连续纵挡风墙", x + side! * 12, y! + 3.1, z, 0.65, 5.2, 25, stone), box("内院房间覆盖屋面", x + side! * 7.5, y! + 5.8, z, 7.4, 0.25, 21, pale), box("院中遮挡入口短墙", x - side! * 5.5, y! + 2.3, z - side! * 8, 8, 3.6, 0.5, stone));
      for (const gap of [-6, 2, 9]) parts.push(box("内侧房间分隔薄墙", x + side! * 7.5, y! + 3.1, z + gap, 7, 5.2, 0.2, pale));
    }
    const ramp = box("连接高低院的折线长坡", 0, 3.5, -2, 4.3, 0.3, 21, steel); ramp.rotation.x = -11; parts.push(ramp, ...[-1, 1].map(s => rail([s * 2.1, 2.5, -12], [s * 2.1, 6.4, 8], 0.07, dark)), box("高层院下部独立服务承基", 9, 2.7, 8, 25, 3.6, 25, stone));
    return parts;
  }, "建筑", "废土"),
  design("四芯连桥城市堤门", "四座窄高服务塔在道路两侧成对落地，高位双层连桥横跨主通道，后侧闸叶收纳位与下部车行口分离", () => {
    const parts: ModelPart[] = [base(39, 27, 0.5), box("堤门中央通车地坪", 0, 0.8, 0, 14, 0.6, 27, steel)];
    for (const x of [-1, 1]) for (const z of [-1, 1]) parts.push(box("堤门独立服务塔芯", x * 12, 14.175, z * 7.5, 4.5, 27.35, 4.5, dark), ...[8, 16, 24].map(y => box("服务塔外挑检修层", x * 12, y, z * 7.5, 6.5, 0.3, 6.5, steel)));
    for (const y of [16, 24]) for (const z of [-7.5, 7.5]) parts.push(box("跨主路高位双层接桥", 0, y, z, 25.5, 0.45, 4.3, steel), box("高位接桥对外透明立面", 0, y + 2, z + Math.sign(z) * 2.1, 23.4, 3.5, 0.1, colors.glass));
    for (const side of [-1, 1]) parts.push(box("同侧两塔之间检修桥", side * 12, 8, 0, 4.4, 0.35, 16, steel), box("侧边收纳槽内的重门叶", side * 15.2, 5, 0, 2.4, 9, 0.5, pale), rail([side * 12, 24.3, -7.5], [0, 24.3, 7.5], 0.35, dark));
    parts.push(box("堤门顶部贯通薄屋面", 0, 28, 0, 31, 0.3, 19.4, pale));
    return parts;
  }, "建筑", "赛博朋克"),
  design("外伸弧翼新闻中心", "两个高低不同的弧形办公翼从中央采编服务脊向外抱出，弧翼内部保留环向走廊，入口前庭不被整圆楼体围死", () => {
    const parts: ModelPart[] = [base(45, 40, 0.5), box("新闻中心中央采编服务脊", 0, 8.8, 4.5, 6, 16.6, 8, dark)];
    for (const [side, radius, height] of [[-1, 14, 10.5], [1, 10, 7]]) {
      const x = side! * 6.5, yaw = side! < 0 ? 80 : -100;
      const floor = sectorSlab("弧翼连续环向地台", radius! - 5, radius!, 0, Math.PI * 1.3, 0.9, 0.6, steel); floor.position.x = x; floor.rotation.z = -yaw; parts.push(floor);
      const roof = sectorSlab("弧翼连续平顶", radius! - 5.4, radius! + 0.5, 0, Math.PI * 1.3, height!, 0.25, pale); roof.position.x = x; roof.rotation.z = -yaw; parts.push(roof);
      parts.push(halfRoundWall("弧翼外侧开放端头幕墙", radius!, 0.14, height! - 1.1, [x, 1.1, 0], yaw, colors.glass, Math.PI * 1.3));
      for (let level = 1; level <= (side! < 0 ? 2 : 1); level++) { const slab = sectorSlab("弧翼内部二层环廊", radius! - 5, radius!, 0, Math.PI * 1.3, 3.6 * level + 0.9, 0.22, steel); slab.position.x = x; slab.rotation.z = -yaw; parts.push(slab); }
      for (let index = 0; index < 5; index++) { const a = (index * 58.5 - yaw) * Math.PI / 180; parts.push(box("弧翼外缘固定细柱", x + Math.cos(a) * radius!, (height! + 1.1) / 2, Math.sin(a) * radius!, 0.22, height! - 1.1, 0.22, dark)); }
    }
    parts.push(box("中央主入口采编台", 0, 1.7, -2.5, 5.5, 1.8, 2.2, steel), ...gate("新闻中心前庭通高门框", 0, 0.5, -6, 7.5, 5.6, 0.35, steel));
    return parts;
  }, "建筑", "赛博朋克"),
  design("斜拉大跨板翼体育馆", "两列高锚塔牵住下垂钢带屋盖，细拉索连接带顶与屋片，中央比赛地面和四周台阶看台保持无内柱", () => {
    const parts: ModelPart[] = [base(65, 51, 0.5), box("中央比赛地面", 0, 0.65, 0, 27, 0.3, 17, pale)];
    for (const side of [-1, 1]) {
      for (const x of [-29, 29]) parts.push(box("屋盖两端高锚塔", x, 12.2, side * 20, 1, 23.4, 1, dark));
      for (let section = 0; section < 9; section++) {
        const x = -27 + section * 6, next = x + 6, y = 13 + 6 * (x / 27) ** 2, nextY = 13 + 6 * (next / 27) ** 2;
        parts.push(rail([x, y + 2.8, side * 20], [next, nextY + 2.8, side * 20], 0.16, dark), pipe("钢带与薄屋片的竖向挂索", [x, y + 2.8, side * 20], [x, y, side * 20], 0.035));
      }
    }
    for (let section = 0; section < 9; section++) {
      const x = -27 + section * 6, next = x + 6, y = 13 + 6 * (x / 27) ** 2, nextY = 13 + 6 * (next / 27) ** 2;
      parts.push(triangleShell("随钢带下垂的薄屋盖条带", [x, y, -21], [next, nextY, -21], [x, y, 21], 0.16, pale), triangleShell("随钢带下垂的薄屋盖条带", [next, nextY, -21], [next, nextY, 21], [x, y, 21], 0.16, pale));
    }
    for (let row = 0; row < 5; row++) parts.push(rectangularFlue("从地坪连续承起的嵌套环形阶梯看台", 32 + row * 4, 22 + row * 4, 0.85 + row * 0.7, 2.1, [0, 0.5, 0], steel));
    for (const side of [-1, 1]) { for (const x of [-1, 1]) parts.push(pipe("高锚塔接到钢带端部的固定索", [x * 29, 23.5, side * 20], [x * 27, 21.8, side * 20], 0.13)); parts.push(pipe("末端屋片独立吊挂索", [27, 21.8, side * 20], [27, 19, side * 20], 0.035)); }
    parts.push(...gate("体育馆端面低位大门洞", 0, 0.5, -24, 8, 6.5, 0.45, dark));
    return parts;
  }, "建筑", "赛博朋克"),
  design("非对称鱼腹会展中心", "展馆两端收窄并保留端口，中部渐宽抬高形成连续薄壳大展厅，纵向脊线和侧墙顺各截面过渡，内部展道保持贯通", () => {
    const radii = [5, 10, 15, 18, 18, 16, 12, 7, 4], heights = [4, 7, 10, 12, 13, 11, 8, 6, 3.5];
    const parts: ModelPart[] = [base(43, 63, 0.5), vaultLoft("鱼腹展厅连续闭合薄壳", radii, heights, 57, 4, 0.22), box("鱼腹馆贯通中央展道", 0, 0.8, 0, 8, 0.6, 58, steel)];
    for (let section = 0; section < radii.length - 1; section++) {
      const z = -28.5 + section * 57 / 8, next = z + 57 / 8;
      for (const side of [-1, 1]) {
        const x = side * radii[section]!, endX = side * radii[section + 1]!;
        parts.push(triangleShell("展馆外侧真实薄围护段", [x, 0.5, z], [endX, 0.5, next], [x, 4.2, z], 0.12, colors.glass), triangleShell("展馆外侧真实薄围护段", [endX, 0.5, next], [endX, 4.2, next], [x, 4.2, z], 0.12, colors.glass));
      }
      parts.push(box("收分展厅局部横向展板地台", 0, 0.85, (z + next) / 2, Math.min(radii[section]!, radii[section + 1]!) * 1.9, 0.7, 57 / 8, steel));
    }
    parts.push(...gate("收窄前端展馆入口", 0, 0.5, -28.7, 7, 3.5, 0.35, dark), ...gate("收窄后端展馆入口", 0, 0.5, 28.7, 5.5, 3, 0.35, dark));
    return parts;
  }, "建筑", "科幻"),
  design("脊骨筒廊医院", "一条高中央诊疗脊把两列短病房翼连在一起，每翼屋面由单独弧肋承托，病翼门前留出连续外廊与院间采光缝", () => {
    const parts: ModelPart[] = [base(47, 59, 0.5), box("医院贯通中央诊疗脊楼板", 0, 0.9, 0, 8.2, 0.8, 55, steel), barrelRoof("中央诊疗脊高拱屋面", 3.8, 0.18, 55, [0, 5, 0], pale)];
    for (const side of [-1, 1]) {
      for (const [start, end] of [[-26, -22.5], [-17.5, -9.2], [-4.2, 4.2], [9.2, 17.5], [22.5, 26]]) parts.push(box("病翼入口间保留的脊廊玻璃段", side * 3.8, 2.95, (start! + end!) / 2, 0.12, 4.1, end! - start!, colors.glass));
      parts.push(box("诊疗脊门口上方贯通承梁", side * 3.8, 5.1, 0, 0.25, 0.3, 54.5, dark));
    }
    for (const side of [-1, 1]) {
      parts.push(box("病房翼前连续外廊", side * 5.4, 0.9, 0, 3.2, 0.35, 54, steel));
      for (const z of [-20, -6.7, 6.7, 20]) {
        parts.push(box("独立病房翼地台", side * 13.5, 0.85, z, 15, 0.7, 9.8, steel), ...[-1, 1].map(s => box("病房翼端部短隔墙", side * 13.5, 2.7, z + s * 4.8, 14.8, 3.6, 0.16, pale)), box("翼端采光玻璃", side * 20.8, 2.7, z, 0.08, 3.6, 9.4, colors.glass));
        const roof = barrelRoof("独立病翼薄拱屋面", 5, 0.16, 15.2, [side * 13.5, 4.5, z], pale); roof.rotation.y = 90; parts.push(roof);
        for (const x of [10, 17]) parts.push(box("病翼内成列独立床台", side * x, 1.3, z, 2.8, 0.8, 1.4, dark));
      }
    }
    parts.push(...gate("医院中央前庭入口", 0, 0.5, -28, 5.5, 4.2, 0.25, dark));
    return parts;
  }, "建筑", "科幻"),
  design("三棱倾顶海岸研究馆", "三个角部重柱承托向中央收拢的三片斜屋盖，三角馆体内只设低工作平台，整条临海立面保留开放门洞和高玻璃窗", () => {
    const a: Triple = [-24, 0.5, -15], b: Triple = [24, 0.5, -15], c: Triple = [0, 0.5, 26], apex: Triple = [0, 20, 1];
    const parts: ModelPart[] = [base(55, 56, 0.5), part("三角形连续研究馆地板", "extrude", steel, [0, 0.8, 0], [1, 1, 1], [90, 0, 0], { depth: 0.6, profile: [a, b, c].map(([x, , z]) => ({ x, y: z })) })];
    const top: Triple[] = [a, b, c].map(([x, , z]) => [x, 8.5, z]);
    for (let index = 0; index < 3; index++) {
      const start = top[index]!, end = top[(index + 1) % 3]!;
      parts.push(triangleShell("三棱馆向中心升起的薄屋片", start, end, apex, 0.3, index ? pale : steel), rail([start[0], 0.5, start[2]], start, 0.8, dark), rail(start, apex, 0.35, dark));
      if (index) parts.push(triangleShell("三角馆非临海面下部玻璃墙", [start[0], 0.5, start[2]], [end[0], 0.5, end[2]], start, 0.1, colors.glass), triangleShell("三角馆非临海面下部玻璃墙", [end[0], 0.5, end[2]], end, start, 0.1, colors.glass));
    }
    parts.push(...gate("临海研究馆贯通主入口", 0, 0.5, -15.2, 6.5, 4, 0.3, dark), ...[-1, 1].map(s => box("主入口两侧临海大玻璃", s * 13.6, 4.5, -15, 20, 8, 0.1, colors.glass)), box("主入口上部高窗", 0, 6.65, -15, 6.5, 3.5, 0.1, colors.glass), ...[-1, 1].map(s => box("三角馆后部独立研究台", s * 6, 1.5, 8, 6.5, 1.4, 6.5, dark)));
    return parts;
  }, "建筑", "科幻"),
  design("箱桥交织多层市场", "多组可进入的长箱商铺在不同高度交叉搭接，独立四柱骨架承托其端部，中部保留贯通挑空的立体集市巷道", () => {
    const parts: ModelPart[] = [base(43, 43, 0.5), ...[-1, 1].flatMap(x => [-1, 1].map(z => box("立体市场贯通骨架柱", x * 11.5, 10.7, z * 11.5, 0.6, 20.4, 0.6, dark)))];
    for (let bridge = 0; bridge < 6; bridge++) {
      const y = 2.4 + Math.floor(bridge / 2) * 6.2, yaw = bridge % 2 ? 90 : 0, shift = bridge % 2 ? 8.3 : -8.3;
      const cells = [box("箱桥可通行店铺楼板", 0, 0, 0, 31, 0.3, 5.3, steel), box("箱桥覆盖屋顶", 0, 4.6, 0, 31, 0.22, 5.3, pale), box("箱桥外侧通长店壁", 0, 2.4, 2.55, 31, 4.5, 0.15, pale), ...[-10, 0, 10].map(x => box("长箱内部分区短隔墙", x, 2.4, 0.9, 0.12, 4.5, 3.2, pale))];
      for (const value of cells) { const x = value.position.x, z = value.position.z; value.position.x = yaw ? z + shift : x; value.position.z = yaw ? -x : z + shift; value.position.y += y; value.rotation.y = yaw; } parts.push(...cells);
      for (const side of [-1, 1]) { const x = yaw ? shift : side * 11.5, z = yaw ? side * 11.5 : shift; parts.push(rail([side * 11.5, y - 1, side * 11.5], [x, y - 0.1, z], 0.3, dark)); }
    }
    parts.push(...[-1, 1].map(s => box("市场外侧竖向交通塔", s * 16.2, 10.4, 12.5, 2.8, 19.8, 3.2, dark)), box("集市入口低台", 0, 0.85, -18, 12, 0.7, 4, steel));
    return parts;
  }, "建筑", "赛博朋克"),
  design("单侧悬臂阶台演艺楼", "后部厚塔承住一整片向前长悬挑的屋翼，下方阶台从地面向后抬升形成演出与观看空间，前庭没有屋盖落地柱", () => {
    const parts: ModelPart[] = [base(53, 49, 0.5), box("演艺楼后部厚重承塔", 0, 12.2, 15.5, 32, 23.4, 6.5, dark), box("后承塔背部平衡配重体", 0, 8.5, 20.2, 37, 16, 6.8, stone), box("向前大幅挑出的屋翼下板", 0, 21.7, -1.5, 44, 0.6, 39.5, steel), box("屋翼后部厚箱梁", 0, 23.1, 10, 44, 2.4, 17, pale)];
    for (const side of [-1, 1]) parts.push(rail([side * 18, 22, -21], [side * 15, 25.8, 17], 0.4, dark), box("演艺楼两侧开放服务廊", side * 20, 4.2, 3, 3.4, 0.3, 29, steel), box("服务廊独立落地侧壁", side * 21.5, 2.3, 3, 0.3, 3.6, 29, pale));
    for (let row = 0; row < 8; row++) parts.push(box("向后抬高的演艺阶台", 0, 0.85 + row * 0.35, -13.5 + row * 3.2, 34, 0.7 + row * 0.7, 3.3, steel));
    for (const side of [-1, 1]) parts.push(box("挑翼斜拉杆后部固定锚座", side * 15, 25.05, 17, 0.8, 1.5, 0.8, dark));
    parts.push(box("前庭独立低演出平台", 0, 0.95, -20.5, 20, 0.9, 7, dark), ...[-1, 1].map(s => box("后承塔外侧服务楼梯井", s * 17, 9.6, 14.5, 3.6, 18.2, 5.5, pale)));
    return parts;
  }, "建筑", "赛博朋克"),
  design("梯柱夹托竖向温室塔", "两侧连续阶形厚柱夹住逐级退进的温室楼板，竖向服务井与种植区分开，开放层间平台连接各层玻璃培植厅", () => {
    const parts: ModelPart[] = [base(35, 31, 0.5), box("温室塔背部竖向服务井", 0, 19.875, 12.6, 6, 38.75, 4.5, dark)];
    for (const side of [-1, 1]) {
      const profile = [{ x: -12, y: 0 }, { x: 12, y: 0 }, { x: 12, y: 39 }, { x: 6.5, y: 39 }, { x: 6.5, y: 31 }, { x: 1, y: 31 }, { x: 1, y: 23 }, { x: -4.5, y: 23 }, { x: -4.5, y: 15 }, { x: -10, y: 15 }, { x: -10, y: 7 }, { x: -12, y: 7 }];
      parts.push(part("夹托每层地台的阶形厚承柱", "extrude", stone, [side * 14.4, 0.5, 0], [1, 1, 1], [0, -90, 0], { depth: 0.8, profile }));
    }
    for (let level = 0; level < 5; level++) {
      const y = 1.1 + level * 7.7, front = -12 + level * 3.2, center = (front + 12) / 2, depth = 24 - level * 3.2;
      parts.push(box("阶进温室塔楼层承板", 0, y, center, 28.8, 0.3, depth, steel), box("各层独立玻璃种植厅前面", 0, y + 3.2, front + 3.6, 27, 6.1, 0.09, colors.glass), box("各层独立玻璃种植厅屋面", 0, y + 6.3, center + 1.8, 28, 0.12, Math.max(3.5, depth - 3.6), colors.glass));
      for (const side of [-1, 1]) parts.push(box("种植厅内长工作槽台", side * 7.4, y + 1.025, center + 2, 8.5, 1.75, Math.max(3, depth - 5), stone));
      parts.push(part("温室层板边缘接实的连续低玻璃护壁", "box", colors.glass, [0, y + 0.675, front + 0.3], [27.4, 1.05, 0.06], [0, 0, 0], { opacity: 0.3 }));
    }
    parts.push(box("温室塔服务井顶端维护梁", 0, 39.4, 12.6, 7.2, 0.3, 5.5, steel));
    return parts;
  }, "建筑", "科幻"),
  design("多孔街巷巨方居住楼", "四组角部住居体之间以三层街巷桥互相连接，中央与外部都有贯通巨口，角部外壁和细柱承担连续楼层，街桥上下保持开敞", () => {
    const parts: ModelPart[] = [base(49, 49, 0.5)];
    for (const x of [-1, 1]) for (const z of [-1, 1]) {
      const cx = x * 15.5, cz = z * 15.5;
      parts.push(box("角部住居体外侧实壁", cx + x * 5.9, 18.3, cz, 0.25, 35.6, 12, pale), box("角部住居体外侧实壁", cx, 18.3, cz + z * 5.9, 12, 35.6, 0.25, pale), box("角部住居体内侧竖向细柱", cx - x * 5.7, 18.3, cz - z * 5.7, 0.25, 35.6, 0.25, dark));
      for (let level = 0; level < 6; level++) parts.push(box("角部住居独立层板", cx, 0.8 + level * 6, cz, 12, 0.25, 12, steel));
      parts.push(box("角部住居体完整平屋顶", cx, 36.2, cz, 12.5, 0.25, 12.5, pale));
    }
    for (const y of [6.8, 18.8, 30.8]) for (const side of [-1, 1]) parts.push(box("贯通孔巷的横向城市街桥", 0, y, side * 15.5, 19, 0.35, 3.2, steel), box("贯通孔巷的纵向城市街桥", side * 15.5, y, 0, 3.2, 0.35, 19, steel), part("横向城市街桥贴实桥板的低玻璃护壁", "box", colors.glass, [0, y + 0.6025, side * 17], [19, 0.855, 0.06], [0, 0, 0], { opacity: 0.3 }), part("纵向城市街桥贴实桥板的低玻璃护壁", "box", colors.glass, [side * 17, y + 0.6025, 0], [0.06, 0.855, 19], [0, 0, 0], { opacity: 0.3 }));
    parts.push(box("巨方居住体中央地面共享广场", 0, 0.65, 0, 14, 0.3, 14, stone));
    return parts;
  }, "建筑", "赛博朋克"),
  design("三叉斜腿高架科考站", "三条向外展开的斜腿托起高处三角科考舱，中央贯通升降井穿过真实楼板洞口，顶部三片坡面共同围合工作空间", () => {
    const outline: [number, number][] = [[0, -19], [16.5, 9.5], [-16.5, 9.5]], hole: [number, number][] = Array.from({ length: 8 }, (_, index) => { const a = index * Math.PI / 4; return [Math.cos(a) * 2.1, Math.sin(a) * 2.1]; });
    const parts: ModelPart[] = [base(59, 59, 0.5), polygon("中央升降井开孔的三角高架楼板", steel, outline, 0.45, [0, 26, 0], [hole]), ring("高架站中央透明升降井壁", colors.glass, 1.9, 0.08, 13.3, 25.6), cylinder("升降井上部独立停靠圆台", 0, 26.2, 0, 3.5, 0.3, dark)];
    const tops: Triple[] = [];
    for (let leg = 0; leg < 3; leg++) {
      const a = -Math.PI / 2 + leg * Math.PI * 2 / 3, x = Math.cos(a), z = Math.sin(a);
      parts.push(rail([x * 25.5, 0.5, z * 25.5], [x * 8.7, 25.8, z * 8.7], 1.1, dark), rail([x * 8.7, 25.8, z * 8.7], [x * 18.9, 26.1, z * 18.9], 0.65, steel));
      tops.push([x * 18.9, 32, z * 18.9]);
    }
    for (let index = 0; index < 3; index++) {
      const a = tops[index]!, b = tops[(index + 1) % 3]!, root: Triple = [0, 37, 0];
      parts.push(triangleShell("高架科考舱三片闭合坡屋面", a, b, root, 0.24, pale), triangleShell("高架舱外缘薄玻璃围护", [a[0], 26.45, a[2]], [b[0], 26.45, b[2]], a, 0.1, colors.glass), triangleShell("高架舱外缘薄玻璃围护", [b[0], 26.45, b[2]], b, a, 0.1, colors.glass), rail([a[0], 26.45, a[2]], a, 0.25, dark));
    }
    parts.push(...[-1, 1].map(s => box("高架科考舱侧向工作台", s * 6.5, 27.3, 3.5, 4, 1.6, 4.5, dark)));
    return parts;
  }, "建筑", "科幻"),
  design("斜漏斗天光美术馆", "四片向中庭内倾的深屋盖围成巨大方形天光口，外缘梁柱支承高屋面，中央低口之下保持无柱展厅与连续环行通路", () => {
    const outer: Triple[] = [[-22, 14, -22], [22, 14, -22], [22, 14, 22], [-22, 14, 22]], inner: Triple[] = [[-7, 7.6, -7], [7, 7.6, -7], [7, 7.6, 7], [-7, 7.6, 7]];
    const parts: ModelPart[] = [base(51, 51, 0.5), box("美术馆无柱整幅地面", 0, 0.8, 0, 44, 0.6, 44, stone)];
    for (let index = 0; index < 4; index++) {
      const next = (index + 1) % 4, a = outer[index]!, b = outer[next]!, c = inner[index]!, d = inner[next]!;
      parts.push(triangleShell("向天光口内斜的完整屋盖折面", a, b, c, 0.3, pale), triangleShell("向天光口内斜的完整屋盖折面", b, d, c, 0.3, pale), box("馆外角部独立承柱", a[0], 7.2, a[2], 0.6, 13.4, 0.6, dark), rail(a, b, 0.35, steel));
      if (index) parts.push(box("展馆外缘低玻璃围护", (a[0] + b[0]) / 2, 4.5, (a[2] + b[2]) / 2, Math.abs(a[0] - b[0]) || 0.12, 8, Math.abs(a[2] - b[2]) || 0.12, colors.glass));
    }
    parts.push(...[-1, 1].map(s => box("馆前入口两侧玻璃墙", s * 13.5, 4.5, -22, 16.2, 8, 0.12, colors.glass)), ...gate("展馆前庭中央真实入口", 0, 0.5, -22.1, 9, 4.7, 0.3, dark), ...[-1, 1].map(s => box("天光口下方独立展品低座", s * 5, 1.1, 0, 3.4, 0.6, 3.4, pale)));
    return parts;
  }, "建筑", "科幻"),
];

function vaultLoft(name: string, radii: number[], heights: number[], length: number, spring: number, thickness: number): ModelPart {
  const columns = 13, count = columns * radii.length, vertices: { x: number; y: number; z: number }[] = [], faces: number[] = [];
  for (const inset of [0, thickness]) for (let row = 0; row < radii.length; row++) for (let column = 0; column < columns; column++) {
    const a = column / (columns - 1) * Math.PI;
    vertices.push({ x: Math.cos(a) * (radii[row]! - inset), y: spring + Math.sin(a) * (heights[row]! - inset), z: -length / 2 + row / (radii.length - 1) * length });
  }
  for (let row = 0; row < radii.length - 1; row++) for (let column = 0; column < columns - 1; column++) { const a = row * columns + column, b = a + 1, c = a + columns, d = c + 1; faces.push(a, b, c, b, d, c); }
  const indices = [...faces], edges = new Map<string, [number, number]>();
  for (let index = 0; index < faces.length; index += 3) {
    const triangle = faces.slice(index, index + 3); indices.push(triangle[2]! + count, triangle[1]! + count, triangle[0]! + count);
    for (let edge = 0; edge < 3; edge++) { const a = triangle[edge]!, b = triangle[(edge + 1) % 3]!; if (!edges.delete(`${b},${a}`)) edges.set(`${a},${b}`, [a, b]); }
  }
  for (const [a, b] of edges.values()) indices.push(a, b + count, b, a, a + count, b + count);
  return part(name, "mesh", pale, [0, 0, 0], [1, 1, 1], [0, 0, 0], { vertices, indices });
}
