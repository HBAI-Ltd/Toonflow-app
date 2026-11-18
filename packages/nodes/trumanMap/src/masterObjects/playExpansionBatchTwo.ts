import { CatmullRomCurve3, Vector3 } from "three";
import { part, type ModelPart, type Triple } from "../assetModelParts";
import { sweptProfile } from "../masterNature/shared";
import { ball, box, cone, cord, cylinder, loop, material, piercedPanel, rod, type MasterPrototype } from "./parts";

// 通用运动构造参考：hussrides.com/en/thrill-rides/、zamperla.com/product/air-race62、
// zamperla.com/product/disko-coaster40；只用于辨别设备类型，几何由本地代码构造。
export function rideSeat(position: Triple, yaw = 0): ModelPart[] {
  const [x, y, z] = position, a = yaw * Math.PI / 180;
  const point = (dx: number, dy: number, dz: number): Triple => [x + dx * Math.cos(a) + dz * Math.sin(a), y + dy, z - dx * Math.sin(a) + dz * Math.cos(a)];
  return [box("固定在乘员甲板上的座椅承托", point(0, -.18, 0), [.39, .36, .39], material.steel, [0, yaw, 0]), box("独立乘员坐垫", position, [.48, .1, .47], material.red, [0, yaw, 0]), box("带头枕的独立靠背", point(0, .46, .25), [.48, .86, .09], material.red, [0, yaw, 0]), cord("跨过双肩并接到座盆的安全约束框", [point(-.18, .08, -.13), point(-.18, .72, -.09), point(0, .83, .12), point(.18, .72, -.09), point(.18, .08, -.13)], .024, material.dark)];
}

function circularSeats(count: number, radius: number, y: number, center: Triple = [0, 0, 0]): ModelPart[] {
  return Array.from({ length: count }, (_, i) => { const a = i * Math.PI * 2 / count; return rideSeat([center[0] + Math.cos(a) * radius, center[1] + y, center[2] + Math.sin(a) * radius], -i * 360 / count - 90); }).flat();
}

function aFrame(width: number, depth: number, height: number): ModelPart[] {
  return [-1, 1].flatMap(x => [-1, 1].flatMap(z => [box("分开的落地锚固足座", [x * width, .15, z * depth], [.95, .3, 1.1], material.steel), rod("把主轴载荷传到地面的斜撑", [x * width, .3, z * depth], [x * width, height, 0], .28, material.dark)]));
}

export function hollowChute(name: string, points: Triple[], radius: number, color = material.glass): ModelPart[] {
  const curve = new CatmullRomCurve3(points.map(p => new Vector3(...p)), false, "centripetal"), steps = 36, sides = 12;
  const frames = curve.computeFrenetFrames(steps, false), parts: ModelPart[] = [], thickness = .065;
  for (let begin = 0; begin < steps; begin += 12) {
    const end = Math.min(begin + 12, steps), vertices: { x: number; y: number; z: number }[] = [], indices: number[] = [];
    for (let step = begin; step <= end; step++) {
      const p = curve.getPointAt(step / steps), n = frames.normals[step]!, b = frames.binormals[step]!;
      for (const r of [radius, radius - thickness]) for (let j = 0; j < sides; j++) { const a = j * Math.PI * 2 / sides; const v = p.clone().addScaledVector(n, Math.cos(a) * r).addScaledVector(b, Math.sin(a) * r); vertices.push({ x: v.x, y: v.y, z: v.z }); }
      if (step === begin) continue;
      const current = (step - begin - 1) * sides * 2, next = current + sides * 2;
      for (let j = 0; j < sides; j++) {
        const k = (j + 1) % sides, a = current + j, b = current + k, c = next + j, d = next + k;
        indices.push(a, b, c, b, d, c, a + sides, c + sides, b + sides, b + sides, c + sides, d + sides);
      }
    }
    for (const [offset, reverse] of [[0, false], [(end - begin) * sides * 2, true]] as const) {
      const cap = vertices.length;
      vertices.push(...vertices.slice(offset, offset + sides * 2));
      for (let j = 0; j < sides; j++) { const k = (j + 1) % sides, face = [cap + j, cap + j + sides, cap + k, cap + k, cap + j + sides, cap + k + sides]; if (reverse) for (let t = 0; t < face.length; t += 3) [face[t + 1], face[t + 2]] = [face[t + 2]!, face[t + 1]!]; indices.push(...face); }
    }
    parts.push(part(name, "mesh", color, [0, 0, 0], [1, 1, 1], [0, 0, 0], { vertices, indices }));
  }
  return parts;
}

export const playExpansionBatchTwoObjects: MasterPrototype[] = [
  { name: "伞篷链吊旋转飞椅", itemType: "设施", build: () => {
    const p = [cylinder("地面固定基础", [0, .16, 0], [8.8, .32, 8.8], material.steel), cylinder("中央回转驱动柱", [0, 3.5, 0], [.9, 6.7, .9], material.dark), cone("与回转头一起运动的伞顶", [0, 6.95, 0], [7.5, 1.2, 7.5], material.red), cylinder("伞篷下的承链环盘", [0, 6.32, 0], [6.6, .19, 6.6], material.ivory)];
    for (let i = 0; i < 8; i++) {
      const a = i * Math.PI / 4, x = Math.cos(a) * 3.6, z = Math.sin(a) * 3.6, tangent: Triple = [-Math.sin(a) * .22, 0, Math.cos(a) * .22];
      p.push(box("链条下悬挂的轻型座板", [x, 1.78, z], [.51, .06, .5], material.red, [0, -i * 45, 0]), box("悬椅背板", [x + Math.cos(a) * .22, 2.02, z + Math.sin(a) * .22], [.5, .42, .055], material.red, [0, 90 - i * 45, 0]));
      for (const s of [-1, 1]) p.push(rod("两根独立承重吊链", [Math.cos(a) * 3.05 + tangent[0] * s, 6.24, Math.sin(a) * 3.05 + tangent[2] * s], [x + tangent[0] * s, 1.81, z + tangent[2] * s], .019, material.dark));
      p.push(rod("座椅前方安全横杆", [x - Math.cos(a) * .19 - tangent[0], 1.99, z - Math.sin(a) * .19 - tangent[2]], [x - Math.cos(a) * .19 + tangent[0], 1.99, z - Math.sin(a) * .19 + tangent[2]], .025, material.ivory));
    }
    return p;
  } },
  { name: "双曲柄翻转乘员排舱", itemType: "设施", build: () => {
    const p = [...aFrame(6.2, 2.6, 7.2), rod("两侧主驱动横轴", [-6.5, 7.2, 0], [6.5, 7.2, 0], .4), box("独立翻转排舱的乘员地板", [0, 2.6, 1.5], [10.4, .17, 2.3], material.steel)];
    for (const s of [-1, 1]) p.push(rod("主动曲柄支臂", [s * 5.45, 7.2, 0], [s * 5.45, 3.65, 1.5], .37, material.red), cylinder("排舱可独立翻转的端部耳轴", [s * 5.25, 3.65, 1.5], [.28, .6, .28], material.dark, [0, 0, 90]), rod("耳轴至乘员地板的侧框", [s * 5.12, 3.65, 1.5], [s * 5.12, 2.68, 1.5], .16), box("驱动轴旁的传动机罩", [s * 6.2, 7.2, .5], [.9, .95, 1.1], material.ivory));
    for (let i = 0; i < 10; i++) p.push(...rideSeat([(i - 4.5) * .92, 3.045, 1.45]));
    return p;
  } },
  { name: "双端长臂翻转吊舱机", itemType: "设施", build: () => {
    const p = [...aFrame(1.6, 3.6, 11.3), rod("支架顶部的纵向回转轴", [0, 11.3, -1.7], [0, 11.3, 1.7], .55), rod("带相对两端吊舱的整体长转臂", [-5.8, 5.5, 0], [5.8, 17.1, 0], .55, material.red), ...[-1, 1].map(s => rod("将顶部轴承接到左右A架的横梁", [s * 1.6, 11.3, 0], [0, 11.3, 0], .35))];
    for (const s of [-1, 1]) {
      const x = s * 5.8, y = 11.3 + s * 5.8;
      p.push(cylinder("端部吊舱的独立翻转耳轴", [x, y, 0], [.34, 1.8, .34], material.dark, [90, 0, 0]), box("悬舱落脚地板", [x, y - 1.5, 0], [1.7, .15, 1.5], material.ivory));
      for (const z of [-1, 1]) p.push(rod("轴头到地板的封闭侧框", [x, y, z * .7], [x, y - 1.43, z * .7], .095));
      for (const side of [-1, 1]) p.push(...rideSeat([x + side * .38, y - 1.065, 0]));
    }
    return p;
  } },
  { name: "倾转公转悬舱轮", itemType: "设施", build: () => {
    const r = 4.3, tilt = 64 * Math.PI / 180;
    const point = (a: number, radius = r): Triple => [Math.cos(a) * radius, 6.5 + Math.sin(a) * radius * Math.sin(tilt), Math.sin(a) * radius * Math.cos(tilt)];
    const p = [box("倾轮铰接的宽基础", [0, .2, 1.1], [8, .4, 6], material.steel), ...[-1, 1].map(s => rod("倾转主臂两侧桁杆", [s * 1.1, .4, 2.1], [s * .5, 6.5, .5], .4, material.dark)), rod("主臂端的轮盘回转轴", [0, 6.15, .72], [0, 6.8, -.61], .49), loop("悬舱轮周缘承载环", [0, 6.5, 0], r, .085, [-64, 0, 0], material.red), cylinder("回转轮中心盘", [0, 6.5, 0], [1, .7, 1], material.steel, [-64, 0, 0]), rod("抬升倾转主臂的独立液压缸", [0, .6, -.8], [0, 4.5, .8], .23)];
    for (let i = 0; i < 8; i++) {
      const a = i * Math.PI / 4, q = point(a), inner = point(a, .4);
      p.push(rod("把周缘舱载荷汇到轮心的辐条", inner, q, .13, material.red), rod("舱体重力悬挂短轴", [q[0], q[1], q[2] - .35], [q[0], q[1], q[2] + .35], .12), box("独立悬舱的座下薄地板", [q[0], q[1] - 1.05, q[2]], [.74, .1, 1.05], material.ivory), rod("吊轴到乘员舱底的侧托", [q[0], q[1], q[2] + .35], [q[0], q[1] - 1, q[2] + .35], .07), ...rideSeat([q[0], q[1] - .64, q[2]]));
    }
    return p;
  } },
  { name: "环轨摇摆自旋圆座", itemType: "设施", build: () => {
    const p = [box("圆盘滑车共用的落地基础", [0, .15, 0], [22, .3, 9], material.steel)];
    for (const s of [-1, 1]) p.push(cord("沿两端升高的连续弧轨", Array.from({ length: 17 }, (_, i): Triple => { const x = -10 + i * 1.25; return [x, .8 + x * x * .045, s * 1.4]; }), .11, material.dark));
    for (let i = -3; i <= 3; i++) { const x = i * 3; p.push(rod("弧轨下的横向轨枕", [x, .8 + x * x * .045, -1.4], [x, .8 + x * x * .045, 1.4], .16), rod("轨枕至地基的竖向支承", [x, .3, 0], [x, .8 + x * x * .045, 0], .19)); }
    p.push(box("沿轨往复的滚轮承载小车", [0, 1.1, 0], [2.8, .6, 3.05], material.red), cylinder("小车上独立旋转的乘员大盘", [0, 1.55, 0], [7.8, .3, 7.8], material.ivory));
    for (const x of [-1, 1]) for (const z of [-1, 1]) p.push(cylinder("夹住弧轨的行走轮", [x * .95, 1.11, z * 1.4], [.6, .14, .6], material.dark, [90, 0, 0]));
    p.push(...circularSeats(8, 2.8, 2.06));
    return p;
  } },
  { name: "平行曲柄飞毯平台", itemType: "设施", build: () => {
    const p = [box("飞毯四角立座共用基础", [0, .16, 0], [12, .32, 7], material.steel), box("保持水平的乘员飞毯地板", [0, 4.8, 1.2], [10.5, .18, 3.9], material.red)];
    for (const x of [-1, 1]) for (const z of [-1, 1]) p.push(rod("固定曲柄轴的四根立架", [x * 4.8, .32, z * 1.65], [x * 4.8, 3.3, z * 1.65], .24, material.dark), cylinder("四角平行曲柄的固定轴座", [x * 4.8, 3.3, z * 1.65], [.55, .4, .55], material.steel, [0, 0, 90]), rod("同相转动并保持平台水平的曲柄", [x * 4.8, 3.3, z * 1.65], [x * 4.8, 4.89, z * 1.65 + 1.2], .24, material.ivory));
    for (let i = 0; i < 5; i++) for (const z of [-1, 1]) p.push(...rideSeat([(i - 2) * 1.45, 5.25, 1.2 + z * .88], z > 0 ? 180 : 0));
    return p;
  } },
  { name: "充气旋扫竞技盘", itemType: "设施", build: () => {
    const p = [ball("连续低矮充气竞技底垫", [0, .38, 0], [9, .76, 9], material.glass), cylinder("带软护套的中心驱动塔", [0, 1, 0], [.95, 1.5, .95], material.red), rod("低位旋扫的软包横臂", [-3.6, 1.05, 0], [3.6, 1.05, 0], .28, material.ivory), rod("高位旋扫的另一根软臂", [0, 1.8, -3.2], [0, 1.8, 3.2], .25, material.red)];
    for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3; p.push(cylinder("乘员需要独立站稳的缓冲墩", [Math.cos(a) * 2.9, .9, Math.sin(a) * 2.9], [.95, .65, .95], material.wood)); }
    p.push(cord("围合竞技区域的连续软外圈", Array.from({ length: 33 }, (_, i): Triple => [Math.cos(i * Math.PI / 16) * 3.9, .85, Math.sin(i * Math.PI / 16) * 3.9]), .25, material.red), box("接到充气底垫的鼓风机", [4.6, .35, .5], [.8, .7, .8], material.dark), rod("鼓风机与气垫相连的送气软颈", [4.6, .36, .5], [3.95, .36, .5], .22, material.glass));
    return p;
  } },
  { name: "双柱弹绳弹射双人座", itemType: "设施", build: () => {
    const p = [box("两塔及发射位的共用基础", [0, .2, 0], [13, .4, 7], material.steel), ...[-1, 1].flatMap(s => [rod("侧塔前方斜撑", [s * 5.2, .4, -2], [s * 5.2, 14, 0], .22), rod("侧塔后方斜撑", [s * 5.2, .4, 2], [s * 5.2, 14, 0], .22), cylinder("顶部弹绳鞍座", [s * 5.2, 14, 0], [.65, .7, .65], material.red), cord("将弹射舱连到侧塔的粗弹性绳", [[s * 5.2, 14.2, 0], [s * 3.4, 9.1, 0], [s * .86, 3.65, 0]], .068, material.dark)]), box("双人弹射舱的地板", [0, 2.05, 0], [1.8, .16, 1.3], material.red), ...[-1, 1].map(s => loop("双人座舱两侧的保护翻转环", [s * .85, 3.1, 0], 1.15, .07, [0, 0, 90], material.ivory)), rod("两根弹绳汇合处的舱体翻转轴", [-1.05, 3.65, 0], [1.05, 3.65, 0], .16)];
    for (const s of [-1, 1]) p.push(rod("把弹绳轴与保护环及地板相连的侧承重杆", [s * .85, 2.12, 0], [s * .85, 4.25, 0], .07, material.ivory), ...rideSeat([s * .4, 2.49, 0]));
    return p;
  } },
  { name: "离心贴壁立式转筒", itemType: "设施", build: () => {
    const wall = sweptProfile("保留侧向进入缺口的薄壁旋转筒", material.red, [[3, .25], [3.12, .25], [3.12, 3.8], [3, 3.8]], Math.PI * 2 - .44, 32);
    const p = [cylinder("转筒落地基础", [0, .12, 0], [7.2, .24, 7.2], material.steel), cylinder("可随转筒降低的独立乘员地板", [0, .3, 0], [5.96, .12, 5.96], material.ivory), wall, cylinder("下部回转轴承平台", [0, .18, 0], [6.35, .18, 6.35], material.dark), box("与转鼓外缘接触的驱动机座", [3.15, .7, 1], [.9, .9, 1.2], material.steel), cylinder("驱动筒壁的立式胶轮", [3.15, .9, .53], [.56, .45, .56], material.dark), box("对准筒侧入口的登乘短台", [3.62, .23, -.45], [1.5, .46, 1.2], material.ivory)];
    for (let i = 1; i < 12; i++) { const a = i * (Math.PI * 2 - .44) / 12; p.push(box("供乘员贴靠的内壁背垫", [Math.cos(a) * 2.9, 1.85, Math.sin(a) * 2.9], [.63, 1.75, .1], material.glass, [0, 90 - a * 180 / Math.PI, 0]), rod("背垫上端的手扶抓杆", [Math.cos(a) * 2.82 - Math.sin(a) * .19, 2.7, Math.sin(a) * 2.82 + Math.cos(a) * .19], [Math.cos(a) * 2.82 + Math.sin(a) * .19, 2.7, Math.sin(a) * 2.82 - Math.cos(a) * .19], .028, material.dark)); }
    return p;
  } },
  { name: "三级卫星自旋游乐机", itemType: "设施", build: () => {
    const p = [cylinder("公转大盘的落地平台", [0, .19, 0], [13.5, .38, 13.5], material.steel), cylinder("主公转轴的封闭传动座", [0, .64, 0], [1.5, .9, 1.5], material.red)];
    for (let i = 0; i < 3; i++) {
      const a = i * Math.PI * 2 / 3, x = Math.cos(a) * 3.6, z = Math.sin(a) * 3.6;
      p.push(rod("从中央大轴伸向卫星轴的回转臂", [0, .8, 0], [x, .8, z], .3, material.ivory), cylinder("第二级反向旋转的卫星头", [x, .9, z], [.8, .5, .8], material.dark));
      for (let j = 0; j < 3; j++) { const b = a + j * Math.PI * 2 / 3, qx = x + Math.cos(b) * 1.65, qz = z + Math.sin(b) * 1.65; p.push(rod("卫星头至自由自旋舱的短臂", [x, .9, z], [qx, .9, qz], .18, material.red), cylinder("第三级自由自旋舱轴承", [qx, 1.06, qz], [.35, .32, .35], material.steel), box("自由自旋舱的独立薄地板", [qx, 1.25, qz], [.95, .1, 1.15], material.ivory, [0, -b * 180 / Math.PI, 0]), ...rideSeat([qx, 1.66, qz], -b * 180 / Math.PI)); }
    }
    return p;
  } },
  { name: "纵轴翻滚飞行吊座", itemType: "设施", build: () => {
    const p = [cylinder("飞行吊座的宽圆基础", [0, .16, 0], [12, .32, 12], material.steel), cylinder("公转主轴的固定支柱", [0, 1.85, 0], [1.1, 3.1, 1.1], material.dark), cylinder("回转臂中央传动盘", [0, 3.5, 0], [2, .55, 2], material.red), cone("中央驱动头护罩", [0, 4, 0], [2, .6, 2], material.ivory)];
    for (let i = 0; i < 4; i++) {
      const a = i * Math.PI / 2, x = Math.cos(a) * 4.15, z = Math.sin(a) * 4.15, yaw = -i * 90 - 90, tx = -Math.sin(a), tz = Math.cos(a);
      p.push(rod("绕中央主轴公转的四根大臂", [Math.cos(a) * .8, 3.5, Math.sin(a) * .8], [x, 3.5, z], .27, material.red), rod("使吊座绕前进纵轴翻滚的端轴", [x - Math.cos(a) * .32, 3.5, z - Math.sin(a) * .32], [x + Math.cos(a) * .32, 3.5, z + Math.sin(a) * .32], .17), loop("环绕双人舱的纵轴回转承载环", [x, 3.5, z], 1.2, .07, [0, -i * 90, -90], material.ivory), box("双人舱独立底框", [x, 2.16, z], [1.65, .16, 1.2], material.steel, [0, yaw, 0]), rod("环顶与中心端轴相连的承力辐条", [x, 3.5, z], [x, 4.7, z], .1, material.dark));
      for (const s of [-1, 1]) p.push(rod("底框向上连接回转环的侧框", [x + tx * s * .78, 2.24, z + tz * s * .78], [x + tx * s * .78, 4.39, z + tz * s * .78], .065, material.red), ...rideSeat([x + tx * s * .38, 2.6, z + tz * s * .38], yaw));
    }
    return p;
  } },
  { name: "充气弹跳围合堡", itemType: "设施", build: () => {
    const p: ModelPart[] = [];
    for (let i = 0; i < 7; i++) p.push(cylinder("并排密封气室构成的弹跳床面", [(i - 3) * .65, .27, 0], [.7, 4.8, .54], i % 2 ? material.glass : material.ivory, [90, 0, 0]));
    for (const x of [-1, 1]) for (const z of [-1, 1]) p.push(cylinder("四角充气承托立柱", [x * 2.05, 1.83, z * 2.2], [.55, 2.8, .55], material.red), ball("气柱封闭软底", [x * 2.05, .44, z * 2.2], [.55, .55, .55], material.red), cone("儿童气堡的柔软顶帽", [x * 2.05, 3.45, z * 2.2], [.72, .65, .72], material.wood));
    const holes = Array.from({ length: 12 }, (_, i): [number, number][] => { const x = (i % 4) * .94 - 1.83, z = Math.floor(i / 4) * .66 + .12; return [[x, z], [x, z + .57], [x + .82, z + .57], [x + .82, z]]; });
    p.push(piercedPanel("前后可看穿的后侧防护网壁", [0, .56, 2.2], [[-1.93, 0], [1.93, 0], [1.93, 2.25], [-1.93, 2.25]], holes, .018, material.dark, [-90, 0, 0]));
    for (const s of [-1, 1]) {
      p.push(piercedPanel("侧边真网孔的保护织网", [s * 2.05, .56, 0], [[0, -2.08], [2.25, -2.08], [2.25, 2.08], [0, 2.08]], Array.from({ length: 12 }, (_, i): [number, number][] => { const y = Math.floor(i / 4) * .67 + .12, z = (i % 4) * 1.02 - 1.98; return [[y, z], [y, z + .9], [y + .56, z + .9], [y + .56, z]]; }), .018, material.dark, [0, 0, 90]), rod("侧网顶端充气横梁", [s * 2.05, 2.95, -2.2], [s * 2.05, 2.95, 2.2], .23, material.glass), cord("把软堡系到地锚的固定带", [[s * 2.2, .45, -2.3], [s * 2.8, .03, -2.8]], .025, material.dark));
    }
    p.push(rod("后网顶端充气横梁", [-2.05, 2.95, 2.2], [2.05, 2.95, 2.2], .23, material.glass), box("敞开入口处的低缓充气踏垫", [0, .16, -2.7], [1.7, .32, 1.2], material.red), box("持续供气的地面鼓风机", [3.1, .32, 1.5], [.7, .64, .8], material.dark), cord("连接气堡与鼓风机的软气管", [[2.2, .3, 1.5], [2.7, .3, 1.5], [3.1, .3, 1.5]], .14, material.glass));
    return p;
  } },
  { name: "水面充气滚筒步行器", itemType: "设施", build: () => {
    const p: ModelPart[] = [{ ...part("两端开口并保留人体通道的透明充气筒壁", "lathe", material.glass, [0, 1.75, 0], [1, 1, 1], [90, 0, 0], { profile: [{ x: 1.74, y: -1.6 }, { x: 1.74, y: 1.6 }, { x: 1.55, y: 1.6 }, { x: 1.55, y: -1.6 }, { x: 1.74, y: -1.6 }] }), opacity: .2 }];
    for (const s of [-1, 1]) p.push(cord("端面开放的圆周充气护圈", Array.from({ length: 25 }, (_, i): Triple => [Math.cos(i * Math.PI / 12) * 1.56, 1.75 + Math.sin(i * Math.PI / 12) * 1.56, s * 1.6]), .17, material.red));
    for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; p.push(rod("连接两端护圈的纵向充气分隔梁", [Math.cos(a) * 1.63, 1.75 + Math.sin(a) * 1.63, -1.6], [Math.cos(a) * 1.63, 1.75 + Math.sin(a) * 1.63, 1.6], .15, material.ivory)); }
    p.push(cylinder("充气壁上的封闭补气阀", [1.72, 1.75, .8], [.12, .06, .12], material.dark, [0, 0, 90]));
    return p;
  } },
  { name: "四塔弹力绳辅助蹦跳床", itemType: "设施", build: () => {
    const p = [box("中央弹跳区的独立地垫", [0, .12, 0], [4.1, .24, 4.1], material.ivory), loop("蹦跳床的连续刚性外框", [0, .75, 0], 1.65, .07, [0, 0, 0], material.steel), cylinder("被外圈弹簧拉住的中心跳面", [0, .75, 0], [2.7, .025, 2.7], material.dark)];
    for (let i = 0; i < 4; i++) {
      const a = i * Math.PI / 2 + Math.PI / 4, x = Math.cos(a) * 4.6, z = Math.sin(a) * 4.6;
      p.push(box("各塔独立落地的宽足座", [x, .16, z], [1.3, .32, 1.3], material.steel), rod("向中央悬带会合的高挑塔杆", [x, .32, z], [x * .85, 7.2, z * .85], .2, material.red), rod("塔杆外侧独立斜支撑", [x * 1.2, .18, z * 1.2], [x * .88, 5.9, z * .88], .13), cord("从塔顶到人体束带的弹力牵引绳", [[x * .85, 7.2, z * .85], [x * .4, 5, z * .4], [Math.cos(a) * .28, 2.8, Math.sin(a) * .28]], .035, material.dark), rod("蹦跳框落地支足", [Math.cos(a) * 1.55, .23, Math.sin(a) * 1.55], [Math.cos(a) * 1.55, .75, Math.sin(a) * 1.55], .045));
    }
    for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6; p.push(rod("跳面周边的独立径向拉簧", [Math.cos(a) * 1.34, .75, Math.sin(a) * 1.34], [Math.cos(a) * 1.62, .75, Math.sin(a) * 1.62], .017)); }
    p.push(loop("弹力绳下的人体腰部安全束带", [0, 2.8, 0], .3, .055, [0, 0, 0], material.red), ...[-1, 1].map(s => loop("与腰带连接的腿部吊环", [s * .17, 2.6, 0], .17, .035, [0, 0, s * 25], material.red)), ...[-1, 1].map(s => rod("腰带到腿环的承重织带", [s * .24, 2.8, 0], [s * .24, 2.6, 0], .028, material.red)));
    return p;
  } },
  { name: "机械公牛软垫台", itemType: "设施", build: () => [
    ball("包住运动机座的整块充气缓冲垫", [0, .4, 0], [8, .8, 8], material.red), cylinder("藏在牛身下的固定驱动底座", [0, .9, 0], [.85, .8, .85], material.dark), cylinder("控制扭转的回转立轴", [0, 1.3, 0], [.3, .6, .3], material.steel), cylinder("允许前后俯仰的横向耳轴", [0, 1.45, 0], [.2, .95, .2], material.steel, [0, 0, 90]),
    ball("带鞍形弧背的牛身承骑壳", [0, 1.78, 0], [.96, .75, 1.75], material.wood), ball("前方粗短颈部", [0, 1.85, -.73], [.62, .68, .62], material.wood), ball("可供乘员辨识的公牛头部", [0, 2.15, -1.02], [.62, .57, .65], material.wood), ball("牛头下端软鼻口", [0, 1.99, -1.34], [.49, .3, .27], material.ivory),
    ...[-1, 1].flatMap(s => [cord("向两侧弯曲的软包牛角", [[s * .22, 2.35, -.99], [s * .48, 2.43, -.95], [s * .58, 2.59, -1.04]], .055, material.ivory), ball("软包牛耳", [s * .33, 2.27, -.94], [.28, .12, .15], material.wood), ball("头部眼点", [s * .26, 2.22, -1.22], [.055, .05, .028], material.dark)]),
    cord("供骑乘者握住的拱形短绳", [[-.18, 2.08, -.3], [0, 2.32, -.3], [.18, 2.08, -.3]], .026, material.dark), cord("后端柔软短尾", [[0, 1.83, .83], [0, 1.65, 1.15], [.1, 1.29, 1.12]], .032, material.wood),
  ] },
  { name: "履带循环攀岩墙", itemType: "设施", build: () => {
    const p = [box("攀爬带的固定落地底盘", [0, .16, .1], [3.8, .32, 2.5], material.steel), ...[-1, 1].map(s => rod("滚筒两侧的轴承承托立柱", [s * 1.5, .32, 0], [s * 1.5, 3.65, 0], .16, material.dark)), ...[.72, 3.55].map(y => cylinder("跨越攀爬带宽度的完整端滚筒", [0, y, 0], [.61, 2.8, .61], material.dark, [0, 0, 90])), box("循环带上供攀爬的正面承载层", [0, 2.135, -.3], [2.45, 2.83, .055], material.ivory), box("回到背面的返程履带层", [0, 2.135, .3], [2.45, 2.83, .055], material.ivory), rod("下滚筒的贯通驱动轴", [-1.6, .72, 0], [1.6, .72, 0], .1), rod("上滚筒的贯通从动轴", [-1.6, 3.55, 0], [1.6, 3.55, 0], .1), box("侧边减速驱动机箱", [1.72, .72, .1], [.47, .7, .7], material.red)];
    for (let i = 0; i < 20; i++) p.push(part("独立凸起且随承载带循环的攀岩抓点", "extrude", i % 2 ? material.red : material.glass, [(i % 4 - 1.5) * .55, .95 + Math.floor(i / 4) * .52, -.369], [1, 1, 1], [0, 0, i * 31], { depth: .09, profile: [{ x: -.075, y: -.025 }, { x: .035, y: -.065 }, { x: .095, y: .008 }, { x: .025, y: .07 }, { x: -.065, y: .05 }] }));
    p.push(box("攀爬面前方连续缓冲垫", [0, .42, -1.3], [3.4, .2, 1.5], material.glass));
    return p;
  } },
  { name: "六杆并联动感观影舱", itemType: "设施", build: () => {
    const p = [cylinder("承受六根缸体载荷的宽底盘", [0, .15, 0], [5.6, .3, 5.6], material.steel), cylinder("六杆共同托起的乘员平台", [0, 1.9, 0], [4.9, .18, 4.9], material.dark), box("观影舱的完整地板", [0, 2.06, 0], [4.25, .15, 3.6], material.ivory), box("舱后完整封闭壁", [0, 3.15, 1.77], [4.25, 2.25, .12], material.red), box("舱左侧封闭壁", [-2.07, 3.15, 0], [.12, 2.25, 3.6], material.red), box("观影舱顶盖", [0, 4.31, 0], [4.25, .12, 3.6], material.red), box("舱内固定宽视角银幕", [0, 3.25, -1.72], [3.9, 1.65, .07], material.glass)];
    for (let i = 0; i < 6; i++) {
      const a = i * Math.PI / 3, b = a + (i % 2 ? -.4 : .4), lower: Triple = [Math.cos(a) * 2.3, .3, Math.sin(a) * 2.3], upper: Triple = [Math.cos(b) * 1.75, 1.81, Math.sin(b) * 1.75], middle = lower.map((n, k) => n + (upper[k]! - n) * .65) as Triple;
      p.push(rod("独立液压执行器的外缸筒", lower, middle, .17), rod("从缸筒伸出的活塞杆", middle, upper, .09), ball("执行器下端球铰", lower, [.23, .23, .23], material.dark), ball("执行器平台端球铰", upper, [.2, .2, .2], material.dark));
    }
    for (let i = 0; i < 4; i++) p.push(...rideSeat([(i - 1.5) * .9, 2.495, .25]));
    p.push(piercedPanel("右壁留出完整登乘门孔的舱壁", [2.07, 2.135, 0], [[0, -1.8], [2.12, -1.8], [2.12, 1.8], [0, 1.8]], [[[.1, -.95], [.1, .05], [1.85, .05], [1.85, -.95]]], .12, material.red, [0, 0, 90]));
    return p;
  } },
  { name: "吊挂式飞行影院排座", itemType: "设施", build: () => {
    const p = [box("悬挂观影机架的宽基础", [0, .18, 0], [11.2, .36, 7.3], material.steel), ...[-1, 1].flatMap(s => [rod("后方悬挂主架的高立柱", [s * 4.6, .36, 2.5], [s * 4.6, 7.2, 2.5], .3, material.dark), rod("把座舱重量传到地面的斜撑", [s * 4.6, .36, -1.7], [s * 4.6, 6.5, 2.5], .22, material.dark), rod("从立柱挑到乘员上方的悬臂", [s * 4.6, 7.2, 2.5], [s * 4.6, 7.2, -.9], .28, material.red)]), rod("两侧挑臂之间的上悬挂主轴", [-4.7, 7.2, -.9], [4.7, 7.2, -.9], .3)];
    for (const z of [-1, 1]) {
      p.push(rod("整排座椅下方的承重横梁", [-4, 3.45, z * .85], [4, 3.45, z * .85], .22, material.steel));
      for (const s of [-1, 1]) p.push(rod("座排侧面通向上悬轴的吊杆", [s * 3.9, 3.45, z * .85], [s * 3.9, 7.2, -.9], .16, material.red));
      for (let i = 0; i < 4; i++) p.push(...rideSeat([(i - 1.5) * 1.6, 3.81, z * .85]));
    }
    const screen = sweptProfile("乘员前方真正弯曲的宽幅影院银幕", material.ivory, [[6.3, .6], [6.39, .6], [6.39, 6.9], [6.3, 6.9]], Math.PI * .68, 24);
    screen.rotation.y = 150;
    p.push(screen);
    for (const a of [-140, -90, -40]) { const angle = a * Math.PI / 180; p.push(box("将弧形银幕接到地面的独立足座", [Math.cos(angle) * 6.345, .3, Math.sin(angle) * 6.345], [.65, .6, .7], material.dark)); }
    return p;
  } },
  { name: "翻斗淋水水寨塔", itemType: "设施", build: () => {
    const p = [box("淋水区防滑浅池底", [0, .1, 0], [8, .2, 7.5], material.ivory), ...[-1, 1].flatMap(s => [box("浅池侧边挡水矮墙", [s * 4, .35, 0], [.16, .5, 7.5], material.glass), box("浅池前后挡水矮墙", [0, .35, s * 3.75], [8, .5, .16], material.glass)]), ...[-1, 1].flatMap(x => [-1, 1].map(z => rod("水桶翻转架四角承重柱", [x * 1.55, .2, z * 1.1], [x * 1.55, 6.65, z * 1.1], .22, material.red))), ...[-1, 1].map(s => rod("跨两根立柱承托桶轴的侧梁", [s * 1.55, 6.4, -1.1], [s * 1.55, 6.4, 1.1], .23)), rod("水桶偏心翻倒的贯通横轴", [-1.7, 6.4, 0], [1.7, 6.4, 0], .22), part("有真正开放口腔和厚底的翻水桶", "lathe", material.wood, [0, 5.35, 0], [1, 1, 1], [-13, 0, 0], { profile: [{ x: 0, y: 0 }, { x: .8, y: 0 }, { x: 1.22, y: 1.95 }, { x: 1.14, y: 1.95 }, { x: .73, y: .11 }, { x: 0, y: .11 }] }), box("桶下方维修操作小平台", [0, 4.5, 0], [3.5, .15, 2.8], material.steel), ...[-1, 1].map(s => rod("维修梯竖侧杆", [1.75, .25, s * .35], [1.75, 4.8, s * .35], .045, material.dark)), cord("从地面泵送到桶顶的供水弯管", [[-2.2, .2, 1.5], [-2.2, 6.9, 1.5], [-.5, 7.6, 1.1], [0, 7.5, 0]], .09, material.steel)];
    for (let i = 0; i < 12; i++) p.push(rod("维修梯独立横踏棍", [1.75, .42 + i * .36, -.35], [1.75, .42 + i * .36, .35], .035));
    p.push(box("浅池外的循环供水泵箱", [-3, .48, 2.7], [1.1, .96, 1], material.dark), cord("供水泵与水塔上行管的实际连接", [[-3, .65, 2.3], [-2.2, .65, 2.3], [-2.2, .2, 1.5]], .095, material.steel));
    return p;
  } },
  { name: "旋转筒形滑水轮", itemType: "设施", build: () => {
    const p: ModelPart[] = [];
    for (const x of [-1, 1]) for (const z of [-1, 1]) p.push(box("滑水轮支架的独立锚固基础", [x * 3.8, .17, z * 3.2], [1.3, .34, 1.6], material.steel), rod("将轮心支承到四脚的A形大斜撑", [x * 3.8, .34, z * 3.2], [0, 6, z * 3.2], .35, material.dark));
    p.push(rod("贯通两侧支架的旋转轮轴", [0, 6, -3.6], [0, 6, 3.6], .48));
    for (const s of [-1, 1]) {
      p.push(loop("与滑水管一起旋转的外承载轮圈", [0, 6, s * 3], 5.1, .13, [90, 0, 0], material.red), box("底部滑水管开口旁的登乘接收台", [0, .59, s * 2.85], [2.5, .12, 2.35], material.ivory));
      for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3; p.push(rod("轮轴至周缘的大承力辐条", [0, 6, s * 3], [Math.cos(a) * 5.1, 6 + Math.sin(a) * 5.1, s * 3], .15, material.red)); }
    }
    const points = Array.from({ length: 17 }, (_, i): Triple => { const a = -Math.PI / 2 + i * Math.PI / 4; return [Math.cos(a) * 4.7, 6 + Math.sin(a) * 4.7, -2 + i / 4]; });
    p.push(...hollowChute("两端在下方开口的连续螺旋滑水管", points, .66));
    for (let i = 1; i < 16; i += 2) { const q = points[i]!, side = q[2] < 0 ? -1 : 1; p.push(rod("把滑水管外壁固定到承载轮的挂接杆", [q[0], q[1], q[2] + side * .66], [q[0], q[1], side * 3], .08)); }
    return p;
  } },
  { name: "斜轴往复锥斗滑水设施", itemType: "设施", build: () => {
    const tilt = 65 * Math.PI / 180;
    const cradlePoint = (station: number, a: number): Triple => { const r = .96 + (station + 3) * 3.29 / 5.5, z = Math.sin(a) * r; return [Math.cos(a) * r, 6.1 + station * Math.cos(tilt) - z * Math.sin(tilt), station * Math.sin(tilt) + z * Math.cos(tilt)]; };
    const p = [part("倾斜轴线且两端真正开放的巨大锥斗", "lathe", material.red, [0, 6.1, 0], [1, 1, 1], [65, 0, 0], { profile: [{ x: .86, y: -3 }, { x: 4.15, y: 2.5 }, { x: 4.06, y: 2.5 }, { x: .77, y: -3 }, { x: .86, y: -3 }] }), box("高位入水起滑平台", [-6.9, 8.95, 4.6], [2, .18, 2], material.ivory), ...[-1, 1].flatMap(x => [-1, 1].map(z => rod("高位起滑台四根支柱", [-6.9 + x * .85, .2, 4.6 + z * .85], [-6.9 + x * .85, 8.86, 4.6 + z * .85], .15)))];
    for (const station of [-1.9, .9]) {
      const side = station < 0 ? -1 : 1;
      p.push(cord("贴着锥斗外壁下半周的连续鞍架", Array.from({ length: 13 }, (_, i) => cradlePoint(station, i * Math.PI / 12)), .1, material.dark));
      for (const x of [-1, 1]) p.push(box("锥斗钢架独立基础", [x * 3.2, .17, side * 2.8], [1.4, .34, 1.4], material.steel), rod("接到外侧鞍架而不穿进滑水腔的斜柱", [x * 3.2, .34, side * 2.8], cradlePoint(station, x < 0 ? Math.PI * 2 / 3 : Math.PI / 3), .27, material.dark));
    }
    p.push(...hollowChute("从起滑平台进入锥斗大口的真正空心滑管", [[-6.9, 9.55, 4.6], [-5.6, 9.15, 3.8], [-4.35, 8.7, 3.1], [-3, 8.1, 2.4]], .65), ...hollowChute("从锥斗小端降到接收区的真正空心滑管", [[0, 4.832, -2.719], [0, 4.325, -3.806], [0, 2.5, -5.4], [0, 1.1, -6.5]], .77));
    for (let i = 0; i < 15; i++) p.push(box("高台直梯的独立踏步", [-6.9, .22 + i * .59, -.8 + i * .36], [1.1, .15, .38], material.steel));
    for (const s of [-1, 1]) p.push(rod("起滑梯两侧连续承重斜梁", [-6.9 + s * .6, .12, -1], [-6.9 + s * .6, 8.9, 4.6], .12));
    p.push(box("滑管低端开放的接收水槽底", [0, .28, -7.2], [3.1, .16, 3.7], material.ivory), ...[-1, 1].map(s => box("接收水槽两侧挡水壁", [s * 1.5, .6, -7.2], [.12, .6, 3.7], material.glass)));
    return p;
  } },
  { name: "竖轴回旋碗形滑水设施", itemType: "设施", build: () => {
    const p = [part("侧向入流并向中心落口收敛的真正空心碗", "lathe", material.glass, [0, 0, 0], [1, 1, 1], [0, 0, 0], { profile: [{ x: .83, y: 4.12 }, { x: 2.4, y: 4.36 }, { x: 4.25, y: 4.94 }, { x: 5.02, y: 6.25 }, { x: 4.94, y: 6.28 }, { x: 4.18, y: 5.02 }, { x: 2.37, y: 4.44 }, { x: .75, y: 4.2 }, { x: .83, y: 4.12 }] }), ...[-1, 1].flatMap(x => [-1, 1].flatMap(z => [box("回旋滑碗支承的四角基础", [x * 3.1, .16, z * 3.1], [1.2, .32, 1.2], material.steel), rod("与碗底相接的外侧斜柱", [x * 3.1, .32, z * 3.1], [x * 2.8, 4.9, z * 2.8], .25, material.dark)])), box("回旋碗侧方的独立起滑台", [-6.2, 6.3, 2.9], [2.2, .18, 2], material.ivory), ...[-1, 1].map(s => rod("起滑台两侧承重框", [-6.2 + s * .8, .25, 2.9], [-6.2 + s * .8, 6.2, 2.9], .18))];
    p.push(...hollowChute("从碗缘沿切向进入的真正空心滑管", [[-6.2, 7, 2.9], [-4.7, 6.8, 2.7], [-3.5, 6.3, 2.7], [-2.3, 5.8, 3.3]], .64), ...hollowChute("从碗中心落口向下转出的出水管", [[0, 4.2, 0], [0, 2.6, 0], [0, 1, -2.1], [0, 1, -5.2]], .75));
    for (let i = 0; i < 12; i++) p.push(box("侧台直梯独立踏步", [-6.2, .24 + i * .55, -1.2 + i * .35], [1.1, .14, .38], material.steel));
    for (const s of [-1, 1]) p.push(rod("直梯两侧的长斜梁", [-6.2 + s * .61, .12, -1.4], [-6.2 + s * .61, 6.3, 2.9], .11));
    p.push(box("碗下出水口的独立缓冲水槽底", [0, .22, -5.65], [2.8, .16, 3.2], material.ivory), ...[-1, 1].map(s => box("缓冲槽的两侧薄壁", [s * 1.35, .55, -5.65], [.1, .65, 3.2], material.glass)));
    return p;
  } },
  { name: "水枪驱动竞速游艺摊", itemType: "设施", build: () => {
    const p = [box("完整游艺摊的落地底台", [0, .13, 0], [6.5, .26, 3.7], material.steel), ...[-1, 1].map(s => rod("支承后方轨道与顶棚的侧柱", [s * 3, .26, 1.4], [s * 3, 3.8, 1.4], .16)), box("覆盖四名玩家操作区的雨棚", [0, 3.9, .35], [6.7, .18, 3.5], material.red), box("四个水枪共同的高位操作台", [0, 1.03, -.95], [6, .17, 1.1], material.ivory), box("目标水流回收槽底", [0, .85, .75], [5.7, .1, .9], material.glass), ...[-1, 1].map(s => box("回水槽前后围边", [0, 1.02, .75 + s * .45], [5.8, .3, .08], material.glass))];
    for (let i = 0; i < 4; i++) {
      const x = (i - 1.5) * 1.35;
      p.push(cylinder("操作台下落地承托柱", [x, .62, -.95], [.2, .74, .2], material.steel), cylinder("可俯仰水枪的水平转向座", [x, 1.17, -1.1], [.28, .13, .28], material.red), rod("可向目标瞄准的短水枪管", [x, 1.35, -1.1], [x, 1.48, -.61], .06, material.steel), rod("水枪操纵把", [x, 1.35, -1.1], [x, 1.13, -1.2], .045, material.dark), cord("从操作台送到水枪的柔性供水管", [[x, 1.12, -.85], [x + .13, 1.3, -1], [x, 1.35, -1.1]], .025, material.dark), loop("接住瞄准水流的开放靶环", [x, 1.8, 1.05], .18, .045, [90, 0, 0], material.red), part("靶环后真正接水的漏斗", "lathe", material.wood, [x, 1.8, 1.1], [1, 1, 1], [90, 0, 0], { profile: [{ x: .18, y: 0 }, { x: .04, y: .3 }, { x: .025, y: .3 }, { x: .16, y: 0 }, { x: .18, y: 0 }] }), rod("独立竞速指示物的竖直导轨", [x, 1.1, 1.45], [x, 3.45, 1.45], .045), box("沿轨升降的竞速指示滑块", [x, 1.5 + i * .42, 1.45], [.42, .22, .16], i % 2 ? material.glass : material.red));
    }
    return p;
  } },
  { name: "滚珠入孔赛道游艺摊", itemType: "设施", build: () => {
    const p = [box("三个投球台共用落地底台", [0, .12, 0], [4.4, .24, 4.2], material.steel), ...[-1, 1].map(s => rod("支住竞速横轨的侧柱", [s * 2, .24, 1.55], [s * 2, 3.5, 1.55], .12)), box("赛道后方薄护板", [0, 2.25, 1.72], [4.1, 2.4, .08], material.ivory)];
    for (let i = 0; i < 3; i++) {
      const x = (i - 1) * 1.27;
      const panel = piercedPanel("坡面上可把球分流计分的三个真实落孔", [x, .9, 0], [[-.5, -1.3], [.5, -1.3], [.5, 1.2], [-.5, 1.2]], [.22, .61, .99].map(z => Array.from({ length: 12 }, (_, j): [number, number] => [Math.cos(-j * Math.PI / 6) * .095, z + Math.sin(-j * Math.PI / 6) * .095])), .035, material.wood, [-12, 0, 0]);
      p.push(panel, ...[-1, 1].map(s => rod("滚球台两侧连续挡球边", [x + s * .5, .663, -1.3], [x + s * .5, 1.183, 1.2], .05, material.red)), box("球洞下方的接球回流底板", [x, .5, 0], [.95, .025, 2.5], material.glass, [-5, 0, 0]), box("前端开放的还球小托盘", [x, .38, -1.65], [.95, .06, .65], material.ivory), ...[-1, 1].map(s => box("投球台的前后承重脚", [x, s < 0 ? .4 : .65, s * 1.1], [.17, s < 0 ? .65 : 1.15, .18], material.steel)), rod("把滚入不同球洞的得分显示为距离的横轨", [-1.85, 1.6 + i * .65, 1.57], [1.85, 1.6 + i * .65, 1.57], .04), box("沿横轨向终点移动的竞速小车", [-1.3 + i * .8, 1.62 + i * .65, 1.52], [.35, .2, .21], i % 2 ? material.red : material.glass), ball("放在前端供玩家滚动的实心游戏球", [x, .809, -.95], [.14, .14, .14], material.red));
    }
    return p;
  } },
  { name: "投球翻靶兑奖游艺摊", itemType: "设施", build: () => {
    const p = [box("翻靶摊的完整落地底台", [0, .13, 0], [4.8, .26, 3.5], material.steel), ...[-1, 1].map(s => rod("靶架两端完整立柱", [s * 2.2, .26, 1.25], [s * 2.2, 3.5, 1.25], .14, material.red)), box("覆盖投球及回收区的摊棚", [0, 3.65, .2], [5, .16, 3.5], material.red), box("前端投球台面", [0, .93, -1.1], [4.45, .14, .78], material.ivory), ...[-1, 1].map(s => box("投球台面的侧向落地柜脚", [s * 1.8, .55, -1.1], [.22, .69, .7], material.steel)), box("靶下向前倾斜的回球托底", [0, .55, .2], [4.25, .035, 2.4], material.glass, [-8, 0, 0])];
    for (let row = 0; row < 3; row++) {
      const y = 1.55 + row * .68;
      p.push(rod("供一排靶片绕轴后翻的共用横轴", [-2.2, y + .23, 1.25], [2.2, y + .23, 1.25], .04));
      for (let col = 0; col < 3; col++) { const x = (col - 1) * 1.28; p.push(cylinder("击中后可绕顶轴翻落的完整圆靶片", [x, y, 1.25], [.45, .032, .45], row % 2 ? material.wood : material.ivory, [90, 0, 0]), rod("将靶片接到翻转横轴的短颈", [x, y + .2, 1.25], [x, y + .23, 1.25], .035, material.dark)); }
    }
    for (let i = 0; i < 5; i++) p.push(ball("台面上待投掷的软游戏球", [(i - 2) * .45, 1.075, -1.1], [.15, .15, .15], material.red));
    p.push(piercedPanel("让落球保留在摊内的真实后挡网", [0, .8, 1.58], [[-2.2, 0], [2.2, 0], [2.2, 2.6], [-2.2, 2.6]], Array.from({ length: 20 }, (_, i): [number, number][] => { const x = (i % 5) * .84 - 2.08, z = Math.floor(i / 5) * .6 + .11; return [[x, z], [x, z + .49], [x + .72, z + .49], [x + .72, z]]; }), .015, material.dark, [-90, 0, 0]));
    return p;
  } },
];
