import { part, ring, type ModelPart, type Triple } from "../assetModelParts";
import { barrelRoof, halfRoundWall, rectangularFlue } from "./spatialShells";
import { arch, base, box, colors, cylinder, design, glow, pipe, rail, stairs, type ArchitecturePrototype } from "./structures";

const alloy = "#748990", panel = "#a9b4b0", dark = "#485860", brass = "#a18b62", brick = "#a58b79";

function offset(parts: ModelPart[], x: number, y: number, z: number): ModelPart[] {
  for (const value of parts) { value.position.x += x; value.position.y += y; value.position.z += z; }
  return parts;
}

function portal(name: string, width: number, height: number, position: Triple, depth = 0.24, color = alloy): ModelPart[] {
  const [x, y, z] = position;
  return [box(`${name}左框`, x - width / 2 - 0.12, y + height / 2, z, 0.24, height, depth, color), box(`${name}右框`, x + width / 2 + 0.12, y + height / 2, z, 0.24, height, depth, color), box(`${name}过梁`, x, y + height + 0.12, z, width + 0.48, 0.24, depth, color)];
}

function hexPod(x: number, y: number, z: number): ModelPart[] {
  const parts: ModelPart[] = [];
  for (let side = 0; side < 6; side++) {
    const angle = side * Math.PI / 3;
    parts.push(part("六角舱连续薄壁面", "box", panel, [x + Math.cos(angle) * 1.08, y + Math.sin(angle) * 1.08, z], [1.35, 0.12, 3.2], [0, 0, side * 60 + 90]));
  }
  parts.push(box("舱内真实承床板", x, y - 0.6, z + 0.3, 1.6, 0.14, 2.2, dark), part("六边形舱后密封板", "extrude", alloy, [x, y, z + 1.58], [1, 1, 1], [0, 0, 0], { depth: 0.12, profile: Array.from({ length: 6 }, (_, index) => ({ x: Math.cos((index + 0.5) * Math.PI / 3) * 1.25, y: Math.sin((index + 0.5) * Math.PI / 3) * 1.25 })) }), ...portal("保持开放的舱门口", 0.9, 1.65, [x, y - 0.9, z - 1.58], 0.16));
  return parts;
}

export const futureSpaceBatchOneDesigns: ArchitecturePrototype[] = [
  design("覆土拱壳月面居住站", "覆土拱券承压居室与外伸双门前室串接，埋土只盖两侧和屋面，入口与居住空间保持贯通", () => {
    const shell = arch(0, 1.2, 3.6, 2.1, 10.4, 0.38); shell.color = panel;
    const entry = arch(0, -5.4, 1.3, 1.2, 3.8, 0.2); entry.color = alloy;
    const vent = ring("通风管口", dark, 0.4, 0.08, 6.65, 0.3); vent.position.z = 3;
    return [base(12.8, 16, 0.3), shell, entry, box("居室后端承压壁", 0, 2.65, 6.3, 6.6, 4.9, 0.22, panel), ...[-1, 1].map(side => part("侧向缓坡覆土", "extrude", colors.earth, [side * 3.95, 0.3, 1.2], [1, 1, 1], [0, 0, 0], { depth: 11.2, profile: side < 0 ? [{ x: -2.3, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 4.4 }, { x: -0.8, y: 3 }] : [{ x: 0, y: 0 }, { x: 2.3, y: 0 }, { x: 0.8, y: 3 }, { x: 0, y: 4.4 }] })), ...[-1, 1].map(side => box("前部舱壁保留居室门口", side * 2.5, 2.45, -4.05, 2.2, 4.3, 0.2, panel)), box("舱门口上承压填壁", 0, 4.2, -4.05, 2.8, 0.8, 0.2, panel), ...[-5.8, -4.6].flatMap(z => portal("串接气密门框", 1.6, 2.2, [0, 0.3, z], 0.18)), ...[-1, 1].map(side => box("外展避让气闸门叶", side * 1.22, 1.4, -5.8, 0.7, 2.2, 0.1, dark)), box("后部设备平台", 0, 0.6, 4.9, 4.8, 0.6, 2), ...[-1, 1].map(side => box("居住平台", side * 2.2, 0.8, 0.5, 1.4, 1, 5.2, dark)), box("贯通中央通道", 0, 0.35, 0, 1.8, 0.1, 10.5, alloy), cylinder("覆土上方空心通风套座", 0, 6.2, 3, 0.85, 0.7), vent];
  }, "建筑", "科幻"),
  design("六角蜂巢悬臂旅馆", "四个六角薄壳寝舱错层挂在双柱服务脊上，独立外廊与开放楼梯连接各入口，舱间留出采光间隙", () => {
    const parts: ModelPart[] = [base(11, 9, 0.3), ...[-1, 1].map(side => box("中央服务脊承力柱", side * 0.85, 3.9, 1.3, 0.4, 7.2, 0.65, dark)), box("竖向服务背壁", 0, 4, 2.6, 2.2, 7.4, 0.25, alloy)];
    for (const [x, y] of [[-2.7, 2], [2.7, 2], [-2.7, 5.1], [2.7, 5.1]]) parts.push(...hexPod(x!, y!, 0.7), rail([x!, y! - 1.1, 1.8], [Math.sign(x!) * 0.85, y! - 2, 1.3], 0.22, dark));
    for (const y of [1.1, 4.2]) parts.push(box("舱口外贯通走廊板", 0, y, -1.45, 8.2, 0.18, 1.2, alloy), rail([-4.1, y + 1, -2], [4.1, y + 1, -2], 0.055, dark));
    parts.push(...offset(stairs(0, -4.1, 1.3, 10, 0.31, 0.34), 0, 1.02, 0), ...stairs(3.5, -3.4, 1.1, 3, 0.28, 0.4), box("楼梯顶层接廊板", 0, 4.2, -2.3, 1.3, 0.18, 1), ...[-1, 1].map(side => rail([side * 0.7, 2.1, -4.1], [side * 0.7, 5.2, -1], 0.055, dark)));
    return parts;
  }, "建筑", "科幻"),
  design("十字气闸隔离医院", "中央会诊核心与四条独立隔离翼形成十字平面，入口前室和各病翼门框不相互直通，屋面开缝保留采光中庭", () => {
    const parts: ModelPart[] = [base(17, 17, 0.26), box("中央会诊平台", 0, 0.45, 0, 5, 0.38, 5, panel), ...[-1, 1].flatMap(x => [-1, 1].map(z => box("核心四角承柱", x * 2.5, 2.3, z * 2.5, 0.25, 4.1, 0.25, alloy))), rectangularFlue("中央中空天井围护", 5.2, 5.2, 1.1, 0.18, [0, 4.1, 0], panel)];
    for (let wing = 0; wing < 4; wing++) {
      const angle = wing * Math.PI / 2, x = Math.sin(angle), z = Math.cos(angle);
      const roof = barrelRoof("各翼独立拱形屋面", 1.9, 0.14, 4.8, [x * 5.2, 3.15, z * 5.2], panel); roof.rotation.y = wing * 90;
      parts.push(roof);
      for (const side of [-1, 1]) parts.push(part("病翼薄侧壁", "box", panel, [x * 5.2 + z * side * 1.85, 1.8, z * 5.2 - x * side * 1.85], [0.18, 3.1, 4.8], [0, wing * 90, 0]), box("翼内独立护理床", x * 5.4 + z * side * 0.95, 0.72, z * 5.4 - x * side * 0.95, wing % 2 ? 2 : 0.85, 0.9, wing % 2 ? 0.85 : 2, alloy));
      const frames = portal("独立隔离门框", 1.45, 2.3, [0, 0.26, 0], 0.18);
      for (const value of frames) { const oldX = value.position.x; value.position.x = oldX * z + x * 7.6; value.position.z = -oldX * x + z * 7.6; value.rotation.y = wing * 90; }
      parts.push(...frames);
    }
    return parts;
  }, "建筑", "科幻"),
  design("双脊架空街巷居住楼", "两列抬升居住翼分别落在连续斜撑脊上，横向短桥连接中空街巷，底层保留贯通步行空间", () => {
    const parts: ModelPart[] = [base(16, 18, 0.3)];
    for (const side of [-1, 1]) {
      parts.push(box("架空居住翼厚楼板", side * 4.9, 4, 0, 4.7, 0.35, 15.6, alloy), box("住翼外侧连续剪力墙", side * 7.2, 6.1, 0, 0.25, 4, 15.6, panel), box("居住翼屋面", side * 4.9, 8.24, 0, 5.2, 0.28, 16.2, panel));
      for (const z of [-6, 0, 6]) parts.push(box("底层独立承重墩", side * 4.9, 1.9, z, 0.6, 3.2, 0.7, dark), rail([side * 4.9, 1.1, z], [side * 6.9, 3.9, z], 0.28, dark), rail([side * 4.9, 1.1, z], [side * 2.9, 3.9, z], 0.28, dark), box("居住翼端隔墙", side * 4.9, 6.1, z, 4.6, 4, 0.18, panel));
      for (const z of [-3, 3]) parts.push(box("开放街巷侧接入楼板和屋盖的玻璃段", side * 2.64, 6.145, z, 0.08, 3.95, 3.8, colors.glass));
    }
    for (const z of [-5, 5]) parts.push(box("跨空横向接桥", 0, 4, z, 5.6, 0.3, 1.8, alloy), ...[-1, 1].map(side => rail([-2.7, 5, z + side * 0.8], [2.7, 5, z + side * 0.8], 0.06, dark)));
    for (const z of [-5, 5]) for (const x of [-2.6, 2.6]) for (const side of [-1, 1]) parts.push(box("接桥扶手真实落在桥板上的细立柱", x, 4.575, z + side * 0.8, 0.06, 0.91, 0.06, dark));
    parts.push(...stairs(0, -7.9, 2, 12, 0.31, 0.35));
    return parts;
  }, "建筑", "科幻"),
  design("双瓣开启航天维修坞", "左右两片深弧壳从地面铰轴向外翻，中央通长维修槽、架空作业台和门端桁架形成开放维修空间", () => {
    const parts: ModelPart[] = [base(19, 22, 0.3), ...[-1, 1].map(side => box("维修槽两侧步行台", side * 5.2, 1.1, 0, 4, 1.6, 18, alloy)), box("贯通维修槽底", 0, 0.4, 0, 6, 0.2, 18, dark)];
    for (const side of [-1, 1]) {
      const profile = Array.from({ length: 9 }, (_, index) => { const angle = index * Math.PI / 16; return { x: side * (Math.cos(angle) * 6.24 - 6), y: Math.sin(angle) * 6.24 }; });
      profile.push(...Array.from({ length: 9 }, (_, index) => { const angle = (8 - index) * Math.PI / 16; return { x: side * (Math.cos(angle) * 6 - 6), y: Math.sin(angle) * 6 }; }));
      parts.push(part("外翻弧形维修坞瓣壳", "extrude", panel, [side * 6.8, 1.8, 0], [1, 1, 1], [0, 0, -side * 28], { depth: 18, profile }));
      parts.push(cylinder("贯通落地翻壳铰轴", side * 6.8, 1.8, 0, 0.55, 19, dark, [90, 0, 0]));
      for (const z of [-7, 7]) parts.push(pipe("翻壳液压锁定撑", [side * 8.4, 0.5, z], [side * 7.7, 5.5, z], 0.22));
      parts.push(box("侧部架空维修走道", side * 3.4, 3, 0, 1.2, 0.18, 17, dark));
      for (const z of [-7, 0, 7]) parts.push(rail([side * 5.4, 1.8, z], [side * 3.4, 3, z], 0.14, dark));
    }
    for (const z of [-9.4, 9.4]) parts.push(...portal("贯通端面起吊框", 11.5, 8.5, [0, 0.3, z], 0.4, dark), cylinder("端架滑轮横轴", 0, 8.61, z, 0.38, 4, alloy, [0, 0, 90]));
    return parts;
  }, "建筑", "科幻"),
  design("竖井采光地下殖民厅", "四周低矮厚壁围合下沉环厅，中央贯通的高采光井把地表天窗接入内庭，入口以折返坡廊进入", () => {
    const ramp = box("折返入口外坡道", -5.7, 1.5, -5.6, 2.1, 0.22, 6, alloy); ramp.rotation.x = 20;
    const parts: ModelPart[] = [base(16, 16, 0.4), ring("下沉环厅可步行地板", alloy, 6.7, 4.1, 0.5, 0.2), halfRoundWall("环厅三面厚围护", 7.1, 0.45, 3.5, [0, 0.4, 0], 25, panel, Math.PI * 1.72), ring("环厅上覆隔热屋面", colors.earth, 7.4, 4.6, 4.2, 0.7), ring("中心贯通采光井壁", panel, 2.9, 0.25, 4, 7.2), ring("采光井顶部承托圈", dark, 3.25, 0.35, 7.6, 0.3), part("井顶透明采光片", "cylinder", colors.glass, [0, 7.8, 0], [5.6, 0.12, 5.6], [0, 0, 0], { opacity: 0.5 }), ramp, box("入口内侧接驳地台", -3.7, 0.65, -4.8, 2.4, 0.3, 2.1, alloy)];
    for (let index = 0; index < 8; index++) { const a = index * Math.PI / 4; parts.push(rail([Math.cos(a) * 2.9, 3.5, Math.sin(a) * 2.9], [Math.cos(a) * 6.8, 3.5, Math.sin(a) * 6.8], 0.2, dark)); }
    for (const side of [-1, 1]) parts.push(box("井下内庭分列平台", side * 1.2, 0.8, 0, 1, 0.6, 3, colors.wood));
    return parts;
  }, "建筑", "科幻"),
  design("环坡内庭星际议事厅", "不等高的扇形议席围住中央空庭，后方高侧窗与辐射屋盖跨过席间通道，入口保留整段缺口", () => {
    const parts: ModelPart[] = [base(19, 17, 0.3), cylinder("中央圆形发言台", 0, 0.65, 0, 3.8, 0.7, dark)];
    for (let row = 0; row < 3; row++) for (let index = 0; index < 8; index++) {
      const a = (index + 0.5) * Math.PI / 5 + Math.PI * 0.2, r = 3.5 + row * 1.55;
      parts.push(part("独立扇区阶席平台", "box", alloy, [Math.cos(a) * r, 0.6 + row * 0.5, Math.sin(a) * r], [1.45, 0.55 + row, 1.5], [0, -a * 180 / Math.PI, 0]), part("议席背板", "box", panel, [Math.cos(a) * (r + 0.4), 1.35 + row * 0.5, Math.sin(a) * (r + 0.4)], [1.3, 0.8, 0.16], [0, 90 - a * 180 / Math.PI, 0]));
    }
    parts.push(halfRoundWall("环厅后部弧形高侧窗墙", 8.2, 0.18, 5.2, [0, 0.3, 0], 20, colors.glass, Math.PI * 1.6), ring("中央开放采光环梁", dark, 2.4, 0.22, 6.2, 0.35));
    for (let index = 0; index < 8; index++) { const a = index * Math.PI / 5 + 0.35; parts.push(rail([Math.cos(a) * 8, 5.4, Math.sin(a) * 8], [Math.cos(a) * 2.3, 6.2, Math.sin(a) * 2.3], 0.24, dark)); }
    parts.push(box("缺口入口平廊", 0, 0.4, -6, 2.2, 0.2, 5.4, alloy));
    return parts;
  }, "建筑", "科幻"),
  design("折板晶体太空纪念堂", "六片不等斜率的闭合三角薄壳包围内厅，正面两壳错开形成贯通门缝，后部内凹纪念台与地面分离", () => {
    const parts: ModelPart[] = [base(13, 13, 0.3)];
    const points: Triple[] = [[-5, 0.3, -4], [0, 0.3, -5.5], [5, 0.3, -4], [5.5, 0.3, 3.5], [0, 0.3, 5], [-5.5, 0.3, 3.5]];
    for (let index = 1; index < 6; index++) parts.push(triangleShell("独立折板晶壳", points[index]!, points[(index + 1) % 6]!, [0.4, index % 2 ? 9 : 7.5, 0.8], 0.18, index % 2 ? panel : alloy));
    parts.push(triangleShell("入口左侧折片", [-5, 0.3, -4], [-1.1, 0.3, -5.2], [-1.1, 6.6, -1.1], 0.18, panel), triangleShell("入口右侧折片", [1.1, 0.3, -5.2], [5, 0.3, -4], [1.1, 7.3, -1.1], 0.18, alloy), box("内厅纪念低台", 0, 0.65, 2.5, 3.5, 0.7, 1.8, dark), glow("纪念台后独立光柱", 0, 3.2, 3, 0.18, 4.2, 0.18), box("门缝贯通引导地板", 0, 0.35, -2, 1.8, 0.1, 7, dark));
    return parts;
  }, "建筑", "科幻"),
  design("分层穿楼轨道换乘站", "两条正交轨道从不同标高穿过开放站厅，站台之间由折返楼梯与中央转换平台相接，轨道槽不被楼板填死", () => {
    const parts: ModelPart[] = [base(22, 22, 0.3), ...[-1, 1].flatMap(x => [-1, 1].map(z => box("换乘站独立承柱", x * 5.8, 4.8, z * 5.8, 0.65, 9, 0.65, dark)))];
    parts.push(box("下层轨道承床", 0, 2.65, 0, 2.4, 0.3, 21, dark), box("上层轨道承床", 0, 6.8, 0, 21, 0.3, 2.4, dark));
    for (const side of [-1, 1]) {
      for (const sign of [-1, 1]) parts.push(rail([side * 5.8, 2.95, sign * 5.8], [0, 2.95, sign * 5.8], 0.35, dark), rail([side * 5.8, 7.1, sign * 5.8], [side * 5.8, 7.1, 0], 0.35, dark));
      parts.push(box("下层纵向侧站台", side * 3.1, 3.25, 0, 2.8, 0.35, 20, alloy), box("下层站台接向换乘梯的真实起步平台", side * 5.15, 3.25, -5.2, 2.9, 0.35, 1.4, alloy), box("上层横向侧站台", 0, 7.4, side * 3.1, 20, 0.35, 2.8, panel), rail([side * 0.72, 2.85, -10.4], [side * 0.72, 2.85, 10.4], 0.1, alloy), rail([-10.4, 7, side * 0.72], [10.4, 7, side * 0.72], 0.1, alloy), box("架空站台端部转换平台", side * 6, 5.3, 0, 2.8, 0.25, 4.8, alloy));
      parts.push(...offset(stairs(side * 5.8, -5.1, 1.6, 7, 0.29, 0.42), 0, 3.09, 0), ...offset(stairs(side * 5.8, 1.2, 1.6, 7, 0.29, 0.42), 0, 5.19, 0));
      parts.push(box("纵向屋盖悬臂梁", side * 5.8, 9.45, 0, 0.35, 0.4, 20, alloy));
    }
    parts.push(box("高位十字透光顶", 0, 9.71, 0, 16, 0.12, 16, colors.glass), box("地面候乘平台", -6, 0.48, -6.8, 4.2, 0.35, 3.8, panel), ...stairs(-5.8, -9.5, 1.8, 11, 0.295, 0.38));
    return parts;
  }, "建筑", "赛博朋克"),
  design("悬桥中庭数据交易大厅", "四角竖井承托边缘楼层，两道交叉吊桥跨过无柱交易中庭，操作席位于桥上和底层边缘，中央保持通高空庭", () => {
    const parts: ModelPart[] = [base(18, 18, 0.3), rectangularFlue("二层连续中空边廊板", 15.6, 15.6, 0.25, 2.4, [0, 4, 0], alloy), rectangularFlue("顶层承托环梁", 16.2, 16.2, 0.5, 0.5, [0, 9, 0], dark)];
    for (const x of [-1, 1]) for (const z of [-1, 1]) parts.push(box("四角固定服务竖井", x * 6.6, 4.6, z * 6.6, 1.3, 8.6, 1.3, panel), rail([x * 6.6, 8.8, z * 6.6], [x * 3, 4.3, z * 3], 0.08, dark));
    parts.push(box("中庭纵向悬桥板", 0, 4.2, 0, 1.9, 0.2, 11.2, alloy), box("中庭高位横向悬桥板", 0, 6.5, 0, 11.2, 0.2, 1.9, alloy));
    for (const side of [-1, 1]) parts.push(rail([side * 5.4, 9.1, 0], [side * 3.8, 6.6, 0], 0.065, dark), rail([0, 9.1, side * 5.4], [0, 4.3, side * 3.8], 0.065, dark), box("上桥独立接驳升降井", side * 5.9, 5.3, 0, 1.2, 2.1, 2, panel));
    for (const x of [-4, 0, 4]) for (const z of [-6, 6]) parts.push(box("边廊交易操作台", x, 4.75, z, 1.8, 1, 0.55, dark), glow("倾向席内的数据终端面", x, 5.4, z + Math.sign(z) * 0.1, 1.6, 0.65, 0.08));
    parts.push(...portal("中庭正面高入口", 5.5, 3.4, [0, 0.3, -7.8], 0.3), box("底层贯通接待台", 0, 0.8, 3, 4.5, 1, 0.8, alloy));
    return parts;
  }, "建筑", "赛博朋克"),
  design("夹街连桥微型商住楼", "两栋窄面高楼夹出真实街巷，底层开敞商铺与上部外廊住居以不同深度退进，架空桥只连接相对楼层", () => {
    const parts: ModelPart[] = [base(16, 17, 0.3)];
    for (const side of [-1, 1]) {
      parts.push(box("狭长楼体外侧剪力壁", side * 6.8, 6.5, 0, 0.3, 12.4, 14, dark), box("狭长楼体后端厚壁", side * 4.9, 6.5, 6.8, 3.8, 12.4, 0.3, panel));
      for (let level = 0; level < 4; level++) {
        const y = 0.45 + level * 3.05;
        parts.push(box("商住层板与内侧外廊", side * 4.8, y, 0, 4.2, 0.22, 14, alloy), box("内廊端部短墙", side * 3.4, y + 1.53, 4.8, 0.18, 2.84, 3.6, panel), box("楼层内部分隔墙", side * 5.1, y + 1.53, 0.6, 3.3, 2.84, 0.16, panel));
        if (level) parts.push(rail([side * 2.8, y + 1, -6.9], [side * 2.8, y + 1, 3], 0.055, dark), part("外翻侧店招遮棚", "box", alloy, [side * 2.45, y + 2.1, -2.3], [1.1, 0.12, 6], [0, 0, side * 12]));
        if (level) {
          for (const z of [-6.5, 2.8]) parts.push(box("外廊扶手与楼板相接的完整立柱", side * 2.8, y + 0.55, z, 0.055, 0.9, 0.055, dark));
          for (const z of [-4.8, 0.2]) parts.push(box("店招遮棚从外廊接起的细立柱", side * 2.8, y + 1.15, z, 0.045, 2.1, 0.045, dark));
        }
      }
      parts.push(box("退进上层屋面", side * 5.5, 12.65, 1.2, 3.3, 0.25, 11.8, panel));
    }
    parts.push(box("三层跨街连桥", 0, 6.55, -3.5, 5.8, 0.25, 1.6, alloy), box("四层偏后跨街连桥", 0, 9.6, 3.8, 5.8, 0.25, 1.6, alloy), ...[-1, 1].flatMap(s => [rail([-2.9, 7.55, -3.5 + s * 0.7], [2.9, 7.55, -3.5 + s * 0.7], 0.06, dark), rail([-2.9, 10.6, 3.8 + s * 0.7], [2.9, 10.6, 3.8 + s * 0.7], 0.06, dark)]), box("下穿步行街面", 0, 0.34, 0, 4.8, 0.08, 16, colors.stone));
    for (const [y, z] of [[6.55, -3.5], [9.6, 3.8]]) for (const x of [-2.8, 2.8]) for (const side of [-1, 1]) parts.push(box("跨街连桥扶手实际落在桥板上的立柱", x, y! + 0.5625, z! + side * 0.7, 0.06, 0.875, 0.06, dark));
    for (const x of [-0.7, 0.7]) for (const z of [5.4, 6.8]) parts.push(box("街后通层升降框架", x, 6.5, z, 0.14, 12.4, 0.14, dark));
    for (const y of [3.5, 6.55, 9.6]) for (const side of [-1, 1]) parts.push(box("街后升降井两侧接廊", side * 1.8, y, 6.1, 2.2, 0.18, 1.3, alloy));
    parts.push(box("升降井内可见停靠台", 0, 3.5, 6.1, 1.2, 0.18, 1.2, panel), ...[-1, 1].map(s => pipe("停靠台竖向悬索", [s * 0.45, 3.58, 6.6], [s * 0.45, 12.7, 6.6], 0.025)), box("升降井顶部承机梁", 0, 12.8, 6.1, 1.7, 0.2, 1.8, dark));
    return parts;
  }, "建筑", "赛博朋克"),
  design("缆挂菱格夜市棚廊", "两列高桅拉索悬起交替倾斜的菱形薄膜顶，摊位沿两侧落地并留下中央通道，顶片之间保留狭缝", () => {
    const parts: ModelPart[] = [base(12, 21, 0.24)];
    for (const side of [-1, 1]) for (const z of [-8, 0, 8]) {
      parts.push(cylinder("边缘悬膜承索高桅", side * 5, 3.9, z, 0.18, 7.3, dark), pipe("桅外落地锚索", [side * 5, 7.2, z], [side * 5.8, 0.3, z + (z < 0 ? -1.1 : 1.1)], 0.025), box("落地独立摊台", side * 3.4, 0.85, z, 2.4, 1.25, 2.7, alloy), box("摊位背部储格", side * 4.5, 1.7, z, 0.28, 1.7, 2.5, panel));
    }
    for (let index = 0; index < 4; index++) {
      const z = -7.5 + index * 5, high = index % 2 ? 5.7 : 6.4;
      parts.push(triangleShell("菱膜前半片", [-4.7, 5.2, z], [0, high, z - 2.8], [4.7, 5.2, z], 0.045, index % 2 ? panel : colors.glass), triangleShell("菱膜后半片", [4.7, 5.2, z], [0, high, z + 2.8], [-4.7, 5.2, z], 0.045, panel));
      for (const side of [-1, 1]) parts.push(pipe("菱膜角点悬索", [side * 4.7, 5.2, z], [side * 5, 7.2, index < 2 ? -8 : 8], 0.022));
    }
    parts.push(glow("中路低位连续指示线", 0, 0.26, 0, 0.06, 0.04, 20), ...[-1, 1].map(s => rail([s * 4.7, 5.2, -9], [s * 4.7, 5.2, 9], 0.08, dark)));
    return parts;
  }, "建筑", "赛博朋克"),
  design("错角叠层中庭书楼", "矩形环形书层逐层错角转向，四柱核心通过水平悬臂梁承托环板，中央空庭和层间采光缝连续贯通", () => {
    const parts: ModelPart[] = [base(20, 20, 0.35), ...[-1, 1].flatMap(x => [-1, 1].map(z => box("贯通核心承重柱", x * 1.2, 6.6, z * 1.2, 0.4, 12.5, 0.4, dark)))];
    for (let level = 0; level < 4; level++) {
      const y = 0.5 + level * 3, yaw = level * 22.5, angle = yaw * Math.PI / 180;
      const floor = rectangularFlue("错角环形书层承板", 15, 11.8, 0.24, 2.7, [0, y, 0], alloy); floor.rotation.y = yaw; parts.push(floor);
      for (const side of [-1, 1]) {
        parts.push(rail([side * 1.2, y - 0.2, side * 1.2], [Math.cos(angle) * side * 6.8, y - 0.2, -Math.sin(angle) * side * 6.8], 0.32, dark), rail([side * 1.2, y - 0.2, -side * 1.2], [Math.sin(angle) * side * 5.3, y - 0.2, Math.cos(angle) * side * 5.3], 0.32, dark));
        const shelf = box("楼层内侧通长书柜", side * 5.7, y + 1.2, 0, 0.4, 2.15, 6.5, colors.wood); shelf.position.x = Math.cos(angle) * side * 5.7; shelf.position.z = -Math.sin(angle) * side * 5.7; shelf.rotation.y = yaw; parts.push(shelf);
      }
      for (const side of [-1, 1]) { const sidewall = box("书楼端部透光围护", 0, y + 1.35, side * 5.8, 12, 2.4, 0.08, colors.glass); sidewall.position.x = Math.sin(angle) * side * 5.8; sidewall.position.z = Math.cos(angle) * side * 5.8; sidewall.rotation.y = yaw; parts.push(sidewall); }
    }
    parts.push(ring("核心顶部采光环", panel, 2.5, 0.25, 13, 0.3), box("地面入口服务台", 4.8, 0.85, -6.4, 3.2, 1, 0.8, dark), rectangularFlue("核心贯通升降围井", 3.5, 3.5, 11.5, 0.12, [0, 0.35, 0], colors.glass));
    return parts;
  }, "建筑", "赛博朋克"),
  design("窗式盒台网络直播楼", "三层表演盒台向开放前庭交错悬挑，外置斜撑把盒台荷载带回后部钢脊，背部共用服务走廊与侧楼梯相连", () => {
    const parts: ModelPart[] = [base(14, 14, 0.3), box("后部垂直服务厚脊", 0, 5.5, 3.7, 9.8, 10.4, 0.55, dark), ...[-1, 1].map(s => box("侧边连续钢框柱", s * 4.8, 5.4, 2.3, 0.38, 10.2, 0.38, alloy))];
    for (let level = 0; level < 3; level++) {
      const y = 0.6 + level * 3.4, x = level % 2 ? 1.5 : -1.5;
      parts.push(box("向前庭挑出的直播台板", x, y, -0.8, 6.4, 0.28, 6.2, alloy), box("直播盒台顶板", x, y + 2.85, -0.8, 6.4, 0.18, 6.2, panel), ...[-1, 1].map(s => box("直播盒台两侧声壁", x + s * 3.1, y + 1.5, -0.8, 0.18, 2.7, 6, panel)), box("独立室内操作台", x, y + 0.74, 1.8, 3.6, 1.2, 0.65, dark), ...[-1, 1].map(s => rail([s * 4.8, y + 2.4, 2.3], [x + s * 3, y - 0.1, -3.6], 0.14, dark)), ...[-1, 1].map(s => part("可侧翻的正面遮光薄翼", "box", dark, [x + s * 3.7, y + 1.5, -3.6], [1.2, 2.7, 0.12], [0, s * 48, 0])), box("后部共用服务廊", 0, y, 4.8, 10.5, 0.22, 1.7, alloy));
    }
    parts.push(...offset(stairs(5.7, -4.4, 1.3, 11, 0.3, 0.42), 0, 0.52, 0), ...offset(stairs(5.7, 0.4, 1.3, 11, 0.3, 0.42), 0, 3.92, 0), box("侧梯中间转换台", 5.7, 4, 0.2, 1.4, 0.2, 1.2, alloy));
    return parts;
  }, "建筑", "赛博朋克"),
  design("屋架吊层商业楼", "两侧高柱承担屋架桁架，下方两层营业楼板以独立竖吊杆悬挂，中部底层不设柱，楼内侧廊留出通高商场空庭", () => {
    const parts: ModelPart[] = [base(18, 18, 0.3)];
    for (const x of [-1, 1]) for (const z of [-1, 1]) parts.push(box("外角落地巨柱", x * 7.3, 5.1, z * 7.3, 0.7, 9.6, 0.7, dark));
    for (const side of [-1, 1]) {
      parts.push(box("屋架上弦", 0, 10.3, side * 6.8, 15.2, 0.3, 0.35, alloy), box("屋架下弦", 0, 8.5, side * 6.8, 15.2, 0.3, 0.35, alloy));
      for (let index = 0; index < 6; index++) parts.push(rail([-7.5 + index * 2.5, index % 2 ? 10.3 : 8.5, side * 6.8], [-5 + index * 2.5, index % 2 ? 8.5 : 10.3, side * 6.8], 0.18, dark));
      for (const x of [-5.7, 0, 5.7]) parts.push(pipe("屋架独立悬吊杆", [x, 8.5, side * 6], [x, 2.8, side * 6], 0.1), box("屋架下弦向吊杆锚点内挑的实际短托梁", x, 8.5, side * 6.4, 0.18, 0.25, 1, dark));
    }
    for (const y of [2.9, 5.7]) {
      parts.push(rectangularFlue("悬挂营业楼层环板", 13.5, 13.5, 0.22, 3.3, [0, y, 0], alloy));
      for (const side of [-1, 1]) parts.push(box("悬层外侧通透幕墙", side * 6.6, y + 1.3, 0, 0.1, 2.5, 11.8, colors.glass), box("侧廊短店面分隔", side * 4.6, y + 1.3, 0, 3.5, 2.5, 0.12, panel));
    }
    parts.push(box("顶部跨中平屋盖", 0, 10.55, 0, 15.4, 0.2, 15.4, panel), ...[-1, 1].map(s => box("侧边垂直交通塔", s * 7.2, 3.1, 0, 1.6, 5.6, 2.4, colors.glass)), box("无柱首层接待台", 0, 0.95, 3.8, 3.5, 1.3, 0.8, dark));
    return parts;
  }, "建筑", "赛博朋克"),
  design("连拱动力工坊街", "六间开敞拱廊作坊分列窄街两侧，共用架空动力轴穿过檐部，局部皮带垂到各独立工作台", () => {
    const parts: ModelPart[] = [base(17, 20, 0.3), box("贯通工坊街面", 0, 0.35, 0, 3.5, 0.1, 19, colors.stone)];
    for (const side of [-1, 1]) for (const z of [-6, 0, 6]) {
      const x = side * 5.4;
      parts.push(box("作坊落地承台", x, 0.5, z, 6.4, 0.4, 5.6, brick), box("作坊后砖墙", side * 8.35, 2.3, z, 0.3, 3.6, 5.6, brick), ...[-1, 1].map(s => box("作坊分隔砖墙", x, 2.3, z + s * 2.75, 6.2, 3.6, 0.18, brick)), box("作坊独立工作台", side * 6.2, 1.2, z, 2.5, 1, 1.5, colors.wood));
      const front = arch(0, 0, 2.1, 1.7, 0.3, 0.25); front.position = { x: side * 2.3, y: 0.5, z }; front.rotation.y = 90; front.color = brick; parts.push(front);
      const canopy = barrelRoof("单间作坊拱顶", 2.8, 0.2, 6.4, [x, 4.1, z], brick); canopy.rotation.y = 90; parts.push(canopy);
    }
    for (const side of [-1, 1]) {
      parts.push(cylinder("檐边贯通动力轴", side * 2.1, 3.65, 0, 0.13, 18, dark, [90, 0, 0]));
      for (const z of [-6, 0, 6]) parts.push(rail([side * 2.1, 3.65, z], [side * 4.2, 3.65, z], 0.1, brass), part("传动皮带上轮", "torus", dark, [side * 4.2, 3.65, z], [0.6, 0.6, 0.1], [0, 90, 0]), part("下行到作业台的皮带", "box", dark, [side * 4.2, 2.8, z], [0.06, 1.6, 0.35], [0, 0, 0]));
    }
    return parts;
  }, "建筑", "蒸汽朋克"),
  design("跨轨装卸拱架仓库", "主铁路从中央长槽穿过高拱仓库，左右抬升货台经横梁承接拱架，檐下小吊机面向中央装卸通道", () => {
    const parts: ModelPart[] = [base(19, 24, 0.35), box("中央贯通轨道基床", 0, 0.5, 0, 3.8, 0.3, 24, dark), ...[-1, 1].map(s => rail([s * 0.78, 0.75, -12], [s * 0.78, 0.75, 12], 0.12, alloy))];
    for (const side of [-1, 1]) {
      parts.push(box("高位装卸货台", side * 5.3, 1.4, 0, 6.2, 2.1, 22, brick), box("仓库背向实墙", side * 8.6, 4.6, 0, 0.4, 4.6, 22, brick));
      for (const z of [-9, -3, 3, 9]) parts.push(box("拱架落地竖墩", side * 7.6, 3.1, z, 0.55, 5.5, 0.65, brick), box("货台开放货架横板", side * 6.5, 3.3, z, 2.5, 0.16, 2.8, colors.wood));
      parts.push(rail([side * 3.7, 6.8, -9], [side * 3.7, 6.8, 9], 0.2, dark), pipe("货台吊挂短索", [side * 3.7, 6.8, 2], [side * 3.7, 3.8, 2], 0.04));
    }
    for (const z of [-9, -3, 3, 9]) { const frame = arch(0, z, 7.4, 4.2, 0.3, 0.32); frame.color = dark; parts.push(frame); }
    parts.push(barrelRoof("连续高拱仓库屋壳", 7.75, 0.18, 22.6, [0, 4.55, 0], panel), ...portal("货运贯通入口", 5, 5.3, [0, 0.35, -11.4], 0.45, brick), ...stairs(7.5, -11.6, 1.8, 7, 0.31, 0.35));
    return parts;
  }, "建筑", "蒸汽朋克"),
  design("双筒气动管邮交换楼", "两根可检修大筒穿过交换楼中庭，底层收发台与上层分拣环廊通过开放竖井对齐，分支管在外侧跨层走线", () => {
    const parts: ModelPart[] = [base(14, 13, 0.3), rectangularFlue("管邮楼中空分拣环板", 11.4, 10.4, 0.25, 2.6, [0, 3.8, 0], colors.wood), ...[-1, 1].flatMap(x => [-1, 1].map(z => box("交换楼四角砖柱", x * 5.4, 3.7, z * 4.9, 0.55, 6.8, 0.55, brick))), box("楼后分拣壁", 0, 3.8, 5, 10.8, 6.8, 0.25, brick)];
    for (const side of [-1, 1]) {
      const tube = ring("贯通楼层的大型气动主管", brass, 0.9, 0.15, 4.7, 8.8); tube.position.x = side * 1.4; parts.push(tube, box("主管侧向收发底台", side * 2.7, 0.95, -0.5, 1.9, 1.3, 2.2, dark), pipe("底台连接主管的短支路", [side * 2.7, 1.2, -0.5], [side * 1.4, 1.2, 0], 0.42), part("跨层弯曲分拣支路", "tube", brass, [0, 0, 0], [1, 1, 1], [0, 0, 0], { radius: 0.16, path: [{ x: side * 1.4, y: 5, z: 0 }, { x: side * 3.8, y: 5, z: 0 }, { x: side * 5.4, y: 6.1, z: -2.5 }, { x: side * 6.2, y: 7, z: -5 }] }), box("上层分拣操作长台", side * 4.2, 4.5, 0, 1.2, 1.1, 6, colors.wood));
      for (const y of [2.4, 5.4, 8.4]) { const collar = ring("主管可拆装外箍", dark, 1.02, 0.16, y, 0.2); collar.position.x = side * 1.4; parts.push(collar); }
    }
    parts.push(...portal("收发楼开放入口", 4.5, 2.8, [0, 0.3, -5.4], 0.25, brick), barrelRoof("交换楼分缝采光顶", 5.6, 0.16, 10.5, [0, 6.9, 0], colors.glass), ...stairs(-4.1, -4.5, 1.3, 11, 0.31, 0.4));
    return parts;
  }, "建筑", "蒸汽朋克"),
  design("双坡热雾洗衣公社", "成列洗槽与中部排水沟位于低层湿区，上方干燥搁架跨在独立细柱上，错缝双坡屋盖把热雾引向高侧缝", () => {
    const parts: ModelPart[] = [base(14, 18, 0.3), box("贯通地面排水沟底", 0, 0.33, 0, 0.5, 0.06, 16, colors.water)];
    for (const side of [-1, 1]) {
      parts.push(box("洗衣场砖质侧矮墙", side * 6.1, 1.3, 0, 0.3, 2, 16.5, brick));
      for (const z of [-6, 0, 6]) {
        parts.push(box("开口洗槽接回地面的完整实底", side * 3.9, 0.6, z, 3.2, 0.6, 3.3, colors.stone), ...[-1, 1].map(s => box("洗槽两端挡壁", side * 3.9, 1.2, z + s * 1.5, 3.2, 0.65, 0.15, colors.stone)), ...[-1, 1].map(s => box("洗槽两侧挡壁", side * 3.9 + s * 1.5, 1.2, z, 0.15, 0.65, 3, colors.stone)), box("干燥阁承柱", side * 2.1, 2.6, z, 0.18, 4.6, 0.18, dark));
      }
      parts.push(box("上层通风晾晒搁台", side * 3.3, 3.2, 0, 2.4, 0.18, 15, colors.wood), rail([side * 2.1, 4.3, -7.5], [side * 2.1, 4.3, 7.5], 0.055, dark), part("错高双坡洗衣屋面", "box", panel, [side * 3.2, side < 0 ? 5.7 : 6.3, 0], [6.7, 0.18, 17], [0, 0, -side * 16]));
    }
    for (const z of [-6, 0, 6]) parts.push(box("中部屋架跨梁", 0, 5, z, 12.3, 0.22, 0.24, dark));
    parts.push(...stairs(4.3, -8.4, 1.2, 9, 0.32, 0.35), box("入口低台", 0, 0.48, -8.8, 4.4, 0.35, 1.2, brick));
    return parts;
  }, "建筑", "蒸汽朋克"),
  design("斜列弧肋玻璃制图厅", "斜置拱肋把长条玻璃拱顶支承在低砖墩上，两侧制图席与中间通行轴分开，门端保留透明高窗和真实入口", () => {
    const parts: ModelPart[] = [base(12, 19, 0.3), ...[-1, 1].map(s => box("长厅低砖墩", s * 4.7, 0.9, 0, 0.55, 1.2, 16.5, brick))];
    for (const z of [-7, -3.5, 0, 3.5, 7]) {
      const rib = arch(0, z, 4.3, 2.6, 0.16, 0.15); rib.rotation.y = 12; rib.color = dark; parts.push(rib);
    }
    const roof = barrelRoof("薄壁透明制图厅拱顶", 4.65, 0.06, 17.4, [0, 2.9, 0], colors.glass); roof.opacity = 0.32; parts.push(roof);
    for (const side of [-1, 1]) {
      parts.push(part("厅侧通透玻璃立面", "box", colors.glass, [side * 4.45, 2.1, 0], [0.07, 2.4, 17], [0, 0, 0], { opacity: 0.38 }));
      for (const z of [-5.7, 0, 5.7]) parts.push(part("倾斜制图长桌板", "box", colors.wood, [side * 2.6, 1.25, z], [2, 0.12, 2.5], [0, 0, side * 14]), ...[-1, 1].map(s => box("制图桌独立短腿", side * 2.6 + s * 0.65, 0.75, z, 0.12, 0.9, 1.8, dark)));
    }
    parts.push(...portal("玻璃厅真实门洞", 2.2, 2.6, [0, 0.3, -8.5], 0.22, brick), box("门上透明高窗", 0, 4.1, -8.5, 4.8, 2.3, 0.08, colors.glass), ...[-1, 1].map(s => box("门侧端窗", s * 3.2, 1.8, -8.5, 1.8, 3, 0.08, colors.glass)));
    return parts;
  }, "建筑", "蒸汽朋克"),
  design("天窗翻板轨道车辆段", "双股轨道分别穿过检修地槽，屋盖由高低错置板带构成排烟天窗，端面双门洞与顶部短桥不阻断车辆进入", () => {
    const parts: ModelPart[] = [base(19, 25, 0.3), ...[-1, 1].map(s => box("段内侧向检修地台", s * 7.5, 0.95, 0, 3.2, 1.3, 23, brick)), box("两轨之间的检修地台", 0, 0.95, 0, 2.7, 1.3, 23, brick)];
    for (const side of [-1, 1]) {
      for (const z of [-10, 0, 10]) parts.push(box("车辆段砖墩", side * 8.5, 3.6, z, 0.55, 6.6, 0.6, brick));
      parts.push(box("檐下侧墙", side * 8.5, 4.7, 0, 0.2, 3, 23, brick), box("检修坑真实底板", side * 4.2, 0.4, 0, 3.8, 0.2, 24, dark));
      for (const trackSide of [-1, 1]) parts.push(rail([side * 4.2 + trackSide * 0.8, 1.55, -12.5], [side * 4.2 + trackSide * 0.8, 1.55, 12.5], 0.11, alloy), box("轨下连续支承矮墙", side * 4.2 + trackSide * 0.8, 1, 0, 0.22, 1, 24, brick));
      parts.push(...portal("车辆段独立端门洞", 5, 5.5, [side * 4.2, 0.3, -11.8], 0.35, brick));
    }
    for (let index = 0; index < 5; index++) {
      const z = -9.5 + index * 4.75;
      parts.push(box("车段横向屋架主梁", 0, 6.9, z, 17.3, 0.28, 0.28, dark), part("向后抬起的排烟屋面板", "box", panel, [0, 7.3, z], [18, 0.16, 4.9], [12, 0, 0]), box("排烟缝下透明竖窗", 0, 7.3, z - 2.2, 16.5, 0.75, 0.07, colors.glass));
    }
    parts.push(box("后端横向检修短桥", 0, 2.6, 9.5, 16.5, 0.22, 1.2, dark));
    return parts;
  }, "建筑", "蒸汽朋克"),
  design("穿堂立体缆运集市", "地面摊廊围合通高交易厅，高位缆运通道从三角承架间穿过，两侧接货廊与中部落货口按不同标高分开", () => {
    const parts: ModelPart[] = [base(17, 22, 0.3), ...[-1, 1].map(s => box("集市侧向架空接货廊", s * 5.3, 3.5, 0, 3.6, 0.25, 18, colors.wood))];
    for (const z of [-9, 0, 9]) {
      parts.push(rail([-7.3, 0.3, z], [0, 11.1, z], 0.4, dark), rail([7.3, 0.3, z], [0, 11.1, z], 0.4, dark), box("三角承架横向拉杆", 0, 6.4, z, 7.8, 0.2, 0.2, brass));
      for (const side of [-1, 1]) parts.push(box("地面集市独立摊台", side * 5.4, 0.95, z * 0.7, 2.6, 1.3, 2.5, colors.wood), box("接货廊落地支柱", side * 6.2, 1.9, z, 0.24, 3.2, 0.24, dark));
    }
    for (const side of [-1, 1]) parts.push(pipe("贯通上层缆运承索", [side * 0.6, 9.4, -11], [side * 0.6, 9.4, 11], 0.06), part("集市双坡覆盖屋面", "box", panel, [side * 3.7, 8.1, 0], [8.7, 0.16, 20.8], [0, 0, side * 36]));
    parts.push(box("中央独立落货开口框底板", 0, 0.6, 0, 3, 0.6, 3), ...[-1, 1].map(s => box("高位接货悬挂叉梁", s * 1.8, 6.4, 0, 0.2, 0.2, 6)), ...[-1, 1].map(s => pipe("吊货平台竖索", [s * 1.2, 9.4, 1.5], [s * 1.2, 4.4, 1.5], 0.04)), box("正在停靠的悬吊载台", 0, 4.3, 1.5, 2.7, 0.18, 2.8, alloy), ...stairs(5.2, -9.7, 1.5, 10, 0.32, 0.4));
    return parts;
  }, "建筑", "蒸汽朋克"),
  design("塔桥藏书阅览厅", "双塔收藏空间托起中跨阅览桥，桥体以贯通筒拱覆盖，底层保留穿行门廊，上层环形书架面向可见的中心井", () => {
    const bridgeRoof = barrelRoof("跨塔阅览桥筒拱", 2.2, 0.2, 10.6, [0, 8.9, 0], brick); bridgeRoof.rotation.y = 90;
    const parts: ModelPart[] = [base(23, 12, 0.3), box("两塔之间的高位阅览桥面", 0, 6.7, 0, 10.6, 0.35, 4.4, colors.wood), bridgeRoof];
    for (const side of [-1, 1]) {
      const towerX = side * 8.1;
      const lower = halfRoundWall("塔身留入口的厚弧壁", 3.5, 0.35, 10.6, [towerX, 0.3, 0], side < 0 ? -31.5 : 148.5, brick, Math.PI * 1.65); parts.push(lower);
      const top = ring("藏书塔上口石冠", brick, 3.8, 0.5, 11.1, 0.6); top.position.x = towerX; parts.push(top);
      for (const y of [3.7, 6.7, 9.5]) { const floor = ring("塔内通井环形楼板", colors.wood, 3.2, 2.1, y, 0.22); floor.position.x = towerX; parts.push(floor); }
      for (let shelf = 0; shelf < 6; shelf++) { const a = shelf * Math.PI / 4 + 0.3; parts.push(part("塔内环列弧向书柜", "box", colors.wood, [towerX + Math.cos(a) * 2.7, 7.9, Math.sin(a) * 2.7], [0.4, 2, 1.5], [0, -a * 180 / Math.PI, 0])); }
      parts.push(...portal("塔向桥内的贯通门框", 1.8, 2.4, [0, 6.7, 0], 0.3).map(value => { const x = value.position.x; value.position.x = side * 5.1; value.position.z = x; value.rotation.y = 90; return value; }));
    }
    for (const side of [-1, 1]) parts.push(box("跨桥高侧玻璃窗", 0, 8.05, side * 2.1, 10.2, 2, 0.08, colors.glass), rail([-5.3, 6.5, side * 1.7], [5.3, 6.5, side * 1.7], 0.22, dark));
    parts.push(box("阅览桥中央长桌", 0, 7.575, 0, 6.8, 1.4, 1.2, colors.wood));
    return parts;
  }, "建筑", "蒸汽朋克"),
  design("高架透明电梯庭院楼", "三翼厚壁楼体围出开放庭院，独立玻璃升降筒置于庭心，两层放射接桥连接筒壁门口和建筑内廊", () => {
    const parts: ModelPart[] = [base(19, 18, 0.3), box("庭院楼后翼地台", 0, 0.65, 6, 16.4, 0.7, 4.8, brick), box("庭院楼后翼外壁", 0, 4.8, 8.3, 16.4, 8.3, 0.3, brick)];
    for (const side of [-1, 1]) {
      parts.push(box("庭院楼侧翼地台", side * 6.2, 0.65, 0, 4.1, 0.7, 12, brick), box("庭院楼侧翼外壁", side * 8.3, 4.8, 0, 0.3, 8.3, 12, brick));
      for (const y of [3.5, 6.4]) parts.push(box("侧翼内侧架空走廊板", side * 6.1, y, 0, 4.4, 0.22, 12.4, colors.wood), box("庭心电梯接驳短桥", side * 3.2, y, 0, 3.2, 0.2, 1.5, dark));
      for (const z of [-5, 0, 5]) parts.push(box("内庭连续立柱", side * 4, 4.8, z, 0.2, 8.4, 0.2, dark));
    }
    for (const y of [3.5, 6.4]) parts.push(box("后翼通长接驳层板", 0, y, 6.1, 16.4, 0.22, 4.4, colors.wood));
    for (const [y, h] of [[1.85, 3.1], [6.15, 0.5], [9.2, 0.6]]) { const glass = ring("井筒门层间的连续玻璃环壁", colors.glass, 1.65, 0.1, y!, h!); glass.opacity = 0.28; parts.push(glass); }
    for (const y of [3.4, 6.4]) for (const yaw of [-40, -220]) { const glass = halfRoundWall("两桥间保留真实门口的玻璃弧壁", 1.65, 0.1, 2.5, [0, y, 0], yaw, colors.glass, Math.PI * 5 / 9); glass.opacity = 0.28; parts.push(glass); }
    parts.push(cylinder("升降井底部承座", 0, 0.5, 0, 3.7, 0.4, dark), cylinder("顶部曳引机承板", 0, 9.625, 0, 3.7, 0.25, dark), cylinder("透明筒内可见轿厢底", 0, 3.51, 0, 2.6, 0.18, brass), ...[-1, 1].flatMap(x => [-1, 1].map(z => pipe("轿厢角部吊杆", [x * 0.85, 3.5, z * 0.85], [x * 0.85, 9.5, z * 0.85], 0.035))), ...[-1, 1].map(s => box("侧翼覆盖平顶", s * 6.2, 9.05, 0, 4.5, 0.2, 12.6, panel)), box("后翼覆盖平顶", 0, 9.05, 6.1, 16.8, 0.2, 4.8, panel));
    return parts;
  }, "建筑", "蒸汽朋克"),
];

export function triangleShell(name: string, a: Triple, b: Triple, c: Triple, thickness: number, color: string): ModelPart {
  const ab = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], ac = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
  const normal = [ab[1]! * ac[2]! - ab[2]! * ac[1]!, ab[2]! * ac[0]! - ab[0]! * ac[2]!, ab[0]! * ac[1]! - ab[1]! * ac[0]!];
  const length = Math.hypot(...normal);
  const points = [a, b, c, ...[a, b, c].map(value => value.map((coordinate, axis) => coordinate - normal[axis]! / length * thickness) as Triple)];
  const vertices: { x: number; y: number; z: number }[] = [], indices: number[] = [];
  for (const face of [[0, 1, 2], [5, 4, 3], [0, 3, 4, 1], [1, 4, 5, 2], [2, 5, 3, 0]]) {
    const offset = vertices.length;
    for (const index of face) { const value = points[index]!; vertices.push({ x: value[0], y: value[1], z: value[2] }); }
    indices.push(offset, offset + 1, offset + 2); if (face.length === 4) indices.push(offset, offset + 2, offset + 3);
  }
  return part(name, "mesh", color, [0, 0, 0], [1, 1, 1], [0, 0, 0], { vertices, indices });
}
