import { Quaternion, Vector3 } from "three";
import { part, ring, type ModelPart, type Triple } from "../assetModelParts";
import { polygon } from "../masterNature/shared";
import { base, box, colors, cylinder, design, rail, stairs } from "./structures";
import { barrelRoof, halfRoundWall } from "./spatialShells";

const bone = "#c6c1a8", root = "#7f8f73", coral = "#bd9e8b", wood = "#8b745c", crystal = "#9daebd";

function tube(name: string, color: string, path: Triple[], radius: number): ModelPart {
  return part(name, "tube", color, [0, 0, 0], [1, 1, 1], [0, 0, 0], { radius, path: path.map(([x, y, z]) => ({ x, y, z })) });
}

function hollowBranch(name: string, path: Triple[], radius: number, thickness: number, color: string): ModelPart {
  const sides = 12, rings = path.length, layer = rings * sides;
  const vertices: { x: number; y: number; z: number }[] = [], indices: number[] = [];
  for (const r of [radius, radius - thickness]) for (let step = 0; step < rings; step++) {
    const direction = new Vector3(...path[Math.min(rings - 1, step + 1)]!).sub(new Vector3(...path[Math.max(0, step - 1)]!)).normalize();
    const rotation = new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), direction);
    for (let side = 0; side < sides; side++) {
      const a = side * Math.PI * 2 / sides, p = new Vector3(Math.cos(a) * r, 0, Math.sin(a) * r).applyQuaternion(rotation).add(new Vector3(...path[step]!));
      vertices.push({ x: p.x, y: p.y, z: p.z });
    }
  }
  for (let step = 0; step < rings - 1; step++) for (let side = 0; side < sides; side++) {
    const a = step * sides + side, b = a + sides, c = step * sides + (side + 1) % sides, d = c + sides;
    indices.push(a, b, c, c, b, d, a + layer, c + layer, b + layer, c + layer, d + layer, b + layer);
  }
  for (let side = 0; side < sides; side++) {
    const a = side, b = (side + 1) % sides, c = (rings - 1) * sides + side, d = (rings - 1) * sides + (side + 1) % sides;
    indices.push(a, b, b + layer, a, b + layer, a + layer, c, d + layer, d, c, c + layer, d + layer);
  }
  return part(name, "mesh", color, [0, 0, 0], [1, 1, 1], [0, 0, 0], { vertices, indices });
}

function plate(name: string, outline: [number, number][], thickness: number, position: Triple, color: string, yaw = 0): ModelPart {
  return part(name, "extrude", color, position, [1, 1, 1], [0, yaw, 0], { depth: thickness, profile: outline.map(([x, y]) => ({ x, y })) });
}

function circle(sides: number, radius: number): [number, number][] {
  return Array.from({ length: sides }, (_, index) => [Math.cos(index * Math.PI * 2 / sides) * radius, Math.sin(index * Math.PI * 2 / sides) * radius]);
}

function crystalFacet(points: Triple[]): ModelPart {
  const normal = new Vector3(...points[1]!).sub(new Vector3(...points[0]!)).cross(new Vector3(...points[2]!).sub(new Vector3(...points[0]!))).normalize().multiplyScalar(.07);
  const corners = [-1, 1].flatMap(side => points.map(([x, y, z]) => ({ x: x + normal.x * side, y: y + normal.y * side, z: z + normal.z * side })));
  const vertices: { x: number; y: number; z: number }[] = [], indices: number[] = [];
  for (const face of [[0, 2, 1], [3, 4, 5], [0, 1, 4, 3], [1, 2, 5, 4], [2, 0, 3, 5]]) {
    const start = vertices.length;
    vertices.push(...face.map(index => corners[index]!));
    for (let index = 1; index < face.length - 1; index++) indices.push(start, start + index, start + index + 1);
  }
  return part("真正向同一尖顶收拢且硬边分顶点的晶面", "mesh", crystal, [0, 0, 0], [1, 1, 1], [0, 0, 0], { vertices, indices, opacity: .76, roughness: .18 });
}

function hornPass(): ModelPart[] {
  const parts: ModelPart[] = [base(14, 8), box("两侧角座之间的完整通行台", 0, .3, 0, 11, .25, 3, bone)];
  for (const side of [-1, 1]) {
    parts.push(cylinder("螺角厚根落地础", side * 5, .6, 0, 2.8, 1.2, bone),
      hollowBranch("由厚角根向内盘起的真正中空角廊", [[side * 5, 1, 0], [side * 5.5, 3.2, 0], [side * 4.5, 6.2, 0], [side * 1.9, 8.2, 0], [side * .25, 7.5, 0], [side * 1.2, 6.1, 0]], 1.05, .2, bone),
      rail([side * 5, .8, 1.3], [side * 4.3, 5.1, .6], .28, wood), box("角根检修入口小台", side * 5, 1.1, -1.55, 2.1, .2, 2.2, wood));
  }
  parts.push(box("角拱下可进入的守关阁地板", 0, 4.3, .8, 5.7, .28, 2.6, wood), ...[-1, 1].map(side => rail([side * 4.9, 2, .6], [side * 2.6, 4.3, .8], .28, bone)),
    box("两角间上层栏板", 0, 5.05, 2, 5.5, 1.1, .12, wood));
  return parts;
}

function coralPalace(): ModelPart[] {
  const parts: ModelPart[] = [cylinder("潮宫中央落地骨盘", 0, .25, 0, 10, .5, coral), ring("中庭开放环廊", bone, 3.2, 1.25, .75, .3),
    ...[[20, 100], [140, 220], [290, 340]].map(([from, to]) => halfRoundWall("门口与三条管廊处真实断开的中央寝宫壁", 2.9, .22, 3, [0, .9, 0], -from!, coral, (to! - from!) * Math.PI / 180)),
    part("开放通光井的向心珊瑚屋壳", "lathe", coral, [0, 0, 0], [1, 1, 1], [0, 0, 0], { profile: [{ x: 1, y: 5.5 }, { x: 3, y: 3.9 }, { x: 3.15, y: 4.04 }, { x: 1.1, y: 5.62 }, { x: 1, y: 5.5 }] })];
  for (let index = 0; index < 3; index++) {
    const a = index * Math.PI * 2 / 3, x = Math.cos(a), z = Math.sin(a);
    parts.push(hollowBranch("从寝宫环廊向上分岔的通人珊瑚管廊", [[x * 2.7, 1.8, z * 2.7], [x * 4.3, 2, z * 4.3], [x * 5.2, 3.9, z * 5.2], [x * 4.7, 5.5, z * 4.7]], .8, .16, coral),
      polygon("管廊顶保留上行通口的潮寝小室环底", bone, circle(16, 1.15), .16, [x * 4.7, 5.5, z * 4.7], [circle(12, .67)]), ring("潮寝小室半高围护", coral, 1.15, .15, 6.1, 1.1, { position: { x: x * 4.7, y: 6.1, z: z * 4.7 } }));
    for (const side of [-1, 1]) parts.push(tube("接地后分叉托住管廊的珊瑚支根", coral, [[x * 5.7 - z * side, .2, z * 5.7 + x * side], [x * 5.4 - z * side * .5, 2.5, z * 5.4 + x * side * .5], [x * 5.1, 4, z * 5.1]], .18));
  }
  parts.push(...stairs(0, -4.4, 1.8, 3, .25, .45));
  return parts;
}

function featherCourt(): ModelPart[] {
  const parts: ModelPart[] = [base(17, 12), box("羽扇仲裁庭中央通道", 0, .4, -1, 2.2, .3, 9, wood),
    tube("巨扇中轴从根部接到最高羽端", bone, [[0, .2, 2.7], [0, 3.5, 3], [0, 7, 3.4], [0, 10.7, 4.2]], .23),
    box("仲裁席低位承台", 0, .9, 1.5, 3.6, .5, 2, bone)];
  for (let index = -4; index <= 4; index++) {
    const a = index * .16, x = Math.sin(a) * 10.8, y = .3 + Math.cos(a) * 10.8;
    parts.push(tube("弧形展开且下端共根的羽轴", bone, [[0, .35, 2.7], [x * .35, y * .47, 3], [x * .75, y * .85, 3.7], [x, y, 4.2]], .09),
      plate("有中央羽轴承托的独立叶形羽屏", [[-.65, 0], [-1.05, 2.1], [-.62, 4.1], [0, 5.1], [.62, 4.1], [1.05, 2.1], [.65, 0]], .08, [x * .7, y * .6 - .8, 3.85], root, -index * 7));
  }
  for (const side of [-1, 1]) for (let row = 0; row < 4; row++) parts.push(box("面向竖扇的两组阶形听审席", side * (3.1 + row * .7), .6 + row * .35, -.5, 1.1, .3, 6.4, bone),
    box("阶席下连续增高的实承托", side * (3.1 + row * .7), (.45 + row * .35) / 2, -.5, 1.1, .45 + row * .35, 6.4, bone));
  return parts;
}

function gillHouse(): ModelPart[] {
  const parts: ModelPart[] = [base(12, 16), box("鳃居屋纵向下层地板", 0, .4, 0, 6, .28, 13, bone), box("中轴上层连续走廊", 0, 3.2, 0, 2.4, .2, 13, wood),
    tube("沿屋脊贯通并真实承接每层鳃盖的鱼背主梁", bone, [[0, 3.6, -7], ...Array.from({ length: 6 }, (_, index): Triple => [0, 5.7 + Math.sin(index / 5 * Math.PI), -5.5 + index * 2.2]), [0, 3.6, 7]], .21)];
  for (let index = 0; index < 6; index++) {
    const z = -5.5 + index * 2.2, h = 5.7 + Math.sin(index / 5 * Math.PI);
    for (const side of [-1, 1]) {
      parts.push(plate("从中脊伸向地面的鳃盖薄片", [[0, h], [1.5, h - .2], [4.8, 2.5], [5.25, .4], [4.95, .4], [4.5, 2.35], [1.4, h - .45], [0, h - .25]], .65, [0, 0, z], root, side > 0 ? 0 : 180),
        box("相邻鳃盖间保持通行的侧居住榻台", side * 2.4, 1, z + .8, 2, .6, 1.3, wood),
        rail([side * 4.6, .3, z], [side * 1.3, h - .25, z], .18, bone));
    }
  }
  parts.push(...stairs(0, -7.5, 2, 12, .25, .36));
  return parts;
}

function palmHall(): ModelPart[] {
  const parts: ModelPart[] = [base(15, 15), cylinder("石掌主腕落地骨础", 0, 1.9, 1.9, 3.4, 3.8, bone),
    polygon("可进入的掌心不规则平整殿台", bone, [[-3.6, -3.4], [-1.5, -5], [2, -4.6], [4, -1.5], [3.7, 3.1], [1.1, 4.7], [-2.3, 3.5], [-4.2, .2]], .48, [0, 3.5, 0]),
    box("腕侧接驳廊地板", 0, 3.7, 4.9, 2.4, .28, 4, wood)];
  const fingers: Triple[][] = [
    [[-3.4, 3.6, -.3], [-5.4, 4.5, -1], [-5.5, 6.2, -2.6], [-3.7, 6.7, -3.7]],
    [[-2.8, 3.6, -2.8], [-3.1, 5.9, -5.7], [-2.7, 8.8, -5.6], [-1.4, 10, -3.7]],
    [[-.7, 3.6, -4.1], [-.7, 6.6, -6.7], [-.45, 9.7, -6], [0, 10.5, -3.5]],
    [[1.2, 3.6, -3.8], [2.5, 6.2, -6.1], [2.6, 9.1, -5], [1.4, 10, -3.5]],
    [[3, 3.6, -2.8], [4.9, 5.4, -4.2], [5, 7.7, -3.5], [3.4, 8.16, -2.2]],
  ];
  for (const points of fingers) {
    parts.push(tube("从掌盘长出并在上方回抱的整根石指", bone, points, .44));
    for (const p of points.slice(1, 3)) parts.push(part("实际承接指节的横向关节骨帽", "sphere", bone, p, [1.05, 1.05, 1.05]));
  }
  parts.push(barrelRoof("指端承着的开放薄券殿顶", 3.7, .16, 5.5, [0, 6.7, -2.5], root));
  return parts;
}

function combWeavery(): ModelPart[] {
  const parts: ModelPart[] = [base(13, 10), box("茧格织坊中部共享工作长台", 0, .8, -1, 7, .24, 1.2, wood)];
  const hexagon = (r: number) => Array.from({ length: 6 }, (_, index): [number, number] => [Math.cos(Math.PI / 6 + index * Math.PI / 3) * r, Math.sin(Math.PI / 6 + index * Math.PI / 3) * r]);
  for (const [x, y] of [[-3.11769, 1.8], [0, 1.8], [3.11769, 1.8], [-1.558845, 4.5], [1.558845, 4.5]]) {
    const cell = polygon("连续六棱外壁与真实六角通口的深茧格", root, hexagon(1.8), 5.5, [x!, y!, 2.4], [hexagon(1.58)]);
    cell.rotation.x = 90;
    parts.push(cell, box("每格内独立水平踏台", x!, y! - 1, -.4, 2.3, .16, 5.1, wood));
    for (let index = 0; index < 5; index++) parts.push(rail([x! - 1.08, y! - .82, -2 + index * .85], [x! - 1.08, y! + .92, -2 + index * .85], .035, bone));
  }
  parts.push(box("上排茧格之间的连接栈道", 0, 3.45, -3.5, 6.5, .18, 1.1, wood), box("侧梯顶实际接到后侧栈道的短搭桥", -3.65, 3.45, -3.5, 2.7, .18, 1.1, wood), ...stairs(-4.5, -7.34, 1.35, 13, .25, .32));
  return parts;
}

function crystalRoom(): ModelPart[] {
  const parts: ModelPart[] = [polygon("棱晶室六角落地台", bone, circle(6, 4.6), .32),
    polygon("六角墙下平整室内地板", wood, circle(6, 3.9), .15, [0, .32, 0])];
  for (let index = 0; index < 6; index++) {
    const angle = index * Math.PI / 3, x = Math.cos(angle) * 3.65, z = Math.sin(angle) * 3.65;
    if (index !== 4) parts.push(part("真正围合室内的六片薄晶壁", "box", crystal, [x, 3.1, z], [4.21466, 5.2, .16], [0, 90 - index * 60, 0], { opacity: .7, roughness: .18, metalness: .15 }));
    else for (const side of [-1, 1]) {
      const tangentX = -Math.sin(angle), tangentZ = Math.cos(angle);
      parts.push(part("晶壁入口两侧的薄晶门垛", "box", crystal, [x + tangentX * side * 1.5, 3.1, z + tangentZ * side * 1.5], [1.3, 5.2, .16], [0, 90 - index * 60, 0], { opacity: .7, roughness: .18 }));
    }
    const tx = -Math.sin(angle) * 2.10733, tz = Math.cos(angle) * 2.10733;
    parts.push(crystalFacet([[x - tx, 5.7, z - tz], [x + tx, 5.7, z + tz], [0, 9.2, 0]]));
  }
  return parts;
}

function whaleDock(): ModelPart[] {
  const parts: ModelPart[] = [base(19, 17), ...[-1, 1].map(side => box("鲸口港池两侧的分离码头", side * 5.8, .8, 0, 3.5, 1.2, 15, bone)),
    box("港池后端封闭转运码头", 0, .8, 6.3, 15, 1.2, 2.4, bone), box("鲸口港池低位水面", 0, .4, 0, 7.9, .05, 13.7, colors.water),
    tube("左颚沿港池前缘向上回弯的主骨", bone, [[-7.3, .8, -6.5], [-7.7, 4, -5.4], [-5.4, 7.4, -4.4], [0, 9, -4]], .55),
    tube("右颚沿港池前缘向上回弯的主骨", bone, [[7.3, .8, -6.5], [7.7, 4, -5.4], [5.4, 7.4, -4.4], [0, 9, -4]], .55)];
  for (const side of [-1, 1]) for (let index = 0; index < 8; index++) {
    const z = -4.5 + index * 1.35;
    parts.push(tube("鲸口上方分列且不封堵水道的须板梳齿", bone, [[side * 6.3, .8, z], [side * 6, 3, z], [side * 4.3, 6.3, z], [side * 2.8, 7.7, z]], .11),
      box("岸侧装卸枕木", side * 4.2, 1.5, z, .3, .2, .65, wood));
  }
  return parts;
}

function antMoundFort(): ModelPart[] {
  const parts: ModelPart[] = [cylinder("蚁丘土堡宽基盘", 0, .3, 0, 15, .6, root),
    halfRoundWall("螺孔土堡下环真通行入口", 5.7, .55, 3, [0, .6, 0], 60, root, Math.PI * 5 / 3),
    halfRoundWall("中层错位开门的厚土巢壁", 4.4, .5, 2.9, [0, 3.6, 0], 240, root, Math.PI * 5 / 3),
    halfRoundWall("上层朝侧面开口的巢壁", 3, .45, 2.8, [0, 6.5, 0], 150, root, Math.PI * 5 / 3),
    ring("贯通中轴巢井外的第一层环板", wood, 5.6, 3.9, 3.5, .25), ring("贯通中轴巢井外的第二层环板", wood, 4.3, 2.6, 6.4, .25),
    ring("顶部巢井出光口环板", root, 3, 1.3, 9.25, .25)];
  for (let index = 0; index < 29; index++) {
    const a = index * Math.PI / 7, y = .75 + index * .3, r = 6.3 - index * .1;
    parts.push(part("绕蚁丘外壁连续上升的落脚踏板", "box", wood, [Math.cos(a) * r, y, Math.sin(a) * r], [1.6, .12, 1.25], [0, -a * 180 / Math.PI, 0]), rail([Math.cos(a) * r, y - .3, Math.sin(a) * r], [Math.cos(a) * (r - .9), y - .7, Math.sin(a) * (r - .9)], .12, root));
  }
  return parts;
}

function vineBasketStation(): ModelPart[] {
  const parts: ModelPart[] = [base(16, 11), box("根蔓篮站中间低位换乘道", 0, .45, 0, 14, .3, 2.2, wood)];
  for (const side of [-1, 1]) {
    parts.push(tube("从两端接地并扭转上拱的主藤", root, [[side * 7, .2, -3], [side * 5.5, 4.2, -2], [side * 2.5, 7.8, 0], [0, 8.7, 1], [-side * 3, 7.2, 2], [-side * 6.5, .2, 3]], .27));
    const x = side * 4.2;
    parts.push(box("悬篮下可实际站立的底板", x, 2.1, 0, 3.4, .18, 2.7, wood), box("悬篮背面连续护壁", x, 2.7, 1.28, 3.4, 1.1, .15, wood),
      ...[-1, 1].flatMap(end => [box("悬篮两侧护壁", x + end * 1.62, 2.7, 0, .15, 1.1, 2.7, wood), box("篮前门洞两侧短护壁", x + end * 1.17, 2.7, -1.28, 1.05, 1.1, .15, wood)]),
      box("从梯顶真实跨入篮中门洞的踏板", x, 2.1, -1.6, 1.35, .18, .8, wood));
    for (const end of [-1, 1]) parts.push(tube("从主藤挂到篮底的整根承重细藤", root, [[x * .8, 7.1, end * .7], [x, 5.2, end * 1.25], [x, 2.1, end * 1.25]], .07));
    parts.push(...stairs(x, -4.7, 1.4, 8, .25, .4));
  }
  return parts;
}

export const fantasySpaceBatchTwoDesigns = [
  design("巨角盘拱关隘", "成对中空盘角从厚根座向内卷起形成可穿过的高关口，角根连杆托住上层守关阁，根座前设有检修入口平台", hornPass, "建筑", "奇幻"),
  design("珊瑚分枝潮汐寝宫", "中央开门环廊向外分出三条真正空心的弯曲珊瑚管廊，上端分别接潮寝小室，分叉支根从外侧落地承托", coralPalace, "建筑", "奇幻"),
  design("羽轴竖扇仲裁庭", "共根羽轴向后上方展成竖向仲裁屏，独立羽片由各自弧轴承托，前方两组实承阶席面对同一低位议台", featherCourt, "建筑", "奇幻"),
  design("鱼鳃分层潜居屋", "连续鱼背主梁支承左右层叠鳃盖，鳃片之间保留侧开通风居住格；中央上层廊道与下层地坪由端梯相连", gillHouse, "建筑", "奇幻"),
  design("石掌托殿", "落地巨腕直接承托不规则掌心殿台，五根弯曲指骨围抱上方薄券殿顶，腕侧接驳廊通向可站立的掌内空间", palmHall, "建筑", "奇幻"),
  design("六棱茧格织坊", "错缝叠放的真实六角长管茧格形成五间透空织室，室内踏台和细经杆可辨，上层由独立后侧栈道与侧梯连接", combWeavery, "建筑", "奇幻"),
  design("棱晶分光密室", "分立薄晶壁围出六角室内空间，一面留出通人门口，六片斜收晶面接到同一尖顶，薄晶材质呈半透明外观", crystalRoom, "建筑", "奇幻"),
  design("梳齿鲸口码头", "鲸颚主骨环抱开放前港口，分列须板从两侧码头上举，中央水道通向后端转运岸，两边留有装卸作业平台", whaleDock, "建筑", "奇幻"),
  design("蚁丘螺孔土堡", "三层错位门口围绕连续巢井，环形楼板不填死中心孔，外侧连贯螺旋踏道从宽根盘逐层上行", antMoundFort, "建筑", "奇幻"),
  design("蔓茎提篮接驳站", "交织主藤从两侧接地后形成高拱，分开的悬篮平台由整根细藤挂接，端梯落到低位换乘道，篮前门口接上梯顶踏板", vineBasketStation, "建筑", "奇幻"),
];
