import { part, type ModelPart, type Triple } from "../assetModelParts";
import { combineMeshes, polygon } from "../masterNature/shared";
import { stairFlight } from "./futureSpaceBatchSix";
import { xYWall } from "./futureSpaceBatchTen";
import { halfRoundWall } from "./spatialShells";
import { base, box, colors, design, pipe, rail, type ArchitecturePrototype } from "./structures";
import { Euler, Quaternion, Vector3 } from "three";

const steel = "#788c90", pale = "#b0b7ac", dark = "#465960", stone = "#a3977f";

export const futureSpaceBatchThirteenDesigns: ArchitecturePrototype[] = [
  design("三弧交脊立体学府", "三条高架弯曲教学翼围住中庭，双层连接廊在实际弧墙侧口之间跨过空庭，树状承柱托住宽楼板，内外实体阶梯分别接入下层入口和上层学习街", () => {
    const parts: ModelPart[] = [base(91, 91, 0.5)], start = Math.PI / 6, span = Math.PI * 2 / 3;
    const wingPorts: { a: Triple; b: Triple }[] = [];
    for (let wing = 0; wing < 3; wing++) {
      const angle = wing * Math.PI * 2 / 3, c = Math.cos(angle), s = Math.sin(angle), cells: ModelPart[] = [];
      const rotate = (x: number, z: number): Triple => [x * c - z * s, 0, x * s + z * c];
      for (const y of [6, 13, 20]) {
        const outline: [number, number][] = [];
        for (let i = 0; i <= 16; i++) { const a = start + i * span / 16; outline.push([Math.cos(a) * 28, -36 + Math.sin(a) * 28]); }
        for (let i = 16; i >= 0; i--) { const a = start + i * span / 16; outline.push([Math.cos(a) * 19, -36 + Math.sin(a) * 19]); }
        const holes: [number, number][][] = wing === 0 && y === 13 ? [[[-7.5, -14.4], [7.5, -14.4], [7.5, -10.6], [-7.5, -10.6]]] : [];
        cells.push(polygon(y === 20 ? "三弧教学翼完整环带薄屋盖" : "高架教学翼实际连续弧形楼板", y === 20 ? pale : steel, outline, y === 20 ? 0.3 : 0.4, [0, y === 20 ? 19.85 : y - 0.2, 0], holes));
      }
      const inner = halfRoundWall("教学翼内弧完整透光薄围护", 19.15, 0.15, 13.65, [0, 6.2, -36], -30, colors.glass, span), outer = combineMeshes("教学翼外弧给双层连接廊留真实侧口的薄围护", colors.glass, [[30, 54], [66, 114], [126, 150]].map(([a, b]) => halfRoundWall("侧口之间实际封厚的独立弧窗段", 28, 0.15, 13.65, [0, 6.2, -36], -a!, colors.glass, (b! - a!) * Math.PI / 180))); inner.opacity = 0.28; outer.opacity = 0.28; cells.push(inner, outer);
      for (const a of [start, start + span]) {
        const panel = xYWall("完整封合内外弧的教学翼端面透光薄窗墙", [[-4.5, 6.2], [4.5, 6.2], [4.5, 19.85], [-4.5, 19.85]], [], 0, 0.15, colors.glass);
        panel.vertices = panel.vertices!.map(p => ({ x: p.x, y: -p.z, z: p.y - 0.075 })); panel.position = { x: Math.cos(a) * 23.5, y: 0, z: -36 + Math.sin(a) * 23.5 }; panel.rotation = { x: 0, y: -a * 180 / Math.PI, z: 0 }; panel.opacity = 0.28; cells.push(panel);
      }
      for (const a of [Math.PI / 4, Math.PI / 2, Math.PI * 3 / 4]) {
        const x = Math.cos(a), z = Math.sin(a);
        cells.push(box("弧翼下方完整落地树状承柱主干", x * 23.5, 2.15, -36 + z * 23.5, 0.55, 3.3, 0.55, dark), rail([x * 23.5, 3.8, -36 + z * 23.5], [x * 19.3, 5.8, -36 + z * 19.3], 0.4, dark), rail([x * 23.5, 3.8, -36 + z * 23.5], [x * 27.7, 5.8, -36 + z * 27.7], 0.4, dark));
      }
      const rotation = new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), -angle);
      for (const cell of cells) {
        const x = cell.position.x, z = cell.position.z, euler = new Euler().setFromQuaternion(rotation.clone().multiply(new Quaternion().setFromEuler(new Euler(cell.rotation.x * Math.PI / 180, cell.rotation.y * Math.PI / 180, cell.rotation.z * Math.PI / 180))));
        cell.position.x = x * c - z * s; cell.position.z = x * s + z * c;
        cell.rotation = { x: euler.x * 180 / Math.PI, y: euler.y * 180 / Math.PI, z: euler.z * 180 / Math.PI };
      } parts.push(...cells);
      wingPorts.push({ a: rotate(14, -36 + Math.sin(Math.PI / 3) * 28), b: rotate(-14, -36 + Math.sin(Math.PI * 2 / 3) * 28) });
    }
    let entry: { x: number; z: number; travelX: number; travelZ: number; alongX: number; alongZ: number } | undefined;
    for (let bridge = 0; bridge < 3; bridge++) {
      const a = wingPorts[bridge]!.a, b = wingPorts[(bridge + 1) % 3]!.b, dx = b[0] - a[0], dz = b[2] - a[2], length = Math.hypot(dx, dz), x = (a[0] + b[0]) / 2, z = (a[2] + b[2]) / 2, alongX = dx / length, alongZ = dz / length, normalX = -alongZ, normalZ = alongX, yaw = -Math.atan2(dz, dx) * 180 / Math.PI;
      for (const y of [6, 13, 20]) parts.push(part(y === 20 ? "弧翼之间双层连接廊完整薄屋盖" : "两弧真实侧口之间实际跨接的完整楼板", "box", y === 20 ? pale : steel, [x, y, z], [length + 0.8, y === 20 ? 0.3 : 0.4, y === 20 ? 3 : 2.4], [0, yaw, 0]));
      for (const side of [-1, 1]) {
        if (bridge === 0 && side < 0) {
          const profile = [{ x: -length / 2, y: 6.2 }, { x: -length / 2, y: 19.85 }, { x: length / 2, y: 19.85 }, { x: length / 2, y: 6.2 }, { x: 1.8, y: 6.2 }, { x: 1.8, y: 10.6 }, { x: -1.8, y: 10.6 }, { x: -1.8, y: 6.2 }];
          parts.push(part("对外入口真实开通的连接廊薄围护", "extrude", pale, [x - normalX * 1.2, 0, z - normalZ * 1.2], [1, 1, 1], [0, yaw, 0], { profile, depth: 0.15 }));
          entry = { x: x - normalX * 1.2, z: z - normalZ * 1.2, travelX: normalX, travelZ: normalZ, alongX, alongZ };
        } else parts.push(part("弧翼连接廊连续透光薄围护", "box", colors.glass, [x + side * normalX * 1.2, 13.025, z + side * normalZ * 1.2], [length + 0.5, 13.65, 0.12], [0, yaw, 0], { opacity: 0.28, roughness: 0.2 }));
        parts.push(box("跨庭双层连接廊下方独立落地细柱", x + side * normalX, 3.15, z + side * normalZ, 0.4, 5.3, 0.4, dark));
      }
    }
    if (entry) {
      for (let flight = 0; flight < 2; flight++) {
        const distance = 12 - flight * 6, stairs = stairFlight("学府前庭实际接入连接廊正门的实体阶梯", [entry.x - entry.travelX * distance, 0.5 + flight * 2.85, entry.z - entry.travelZ * distance], 10, 0.285, 0.6, 3.5); stairs.rotation.y = -Math.atan2(entry.travelZ, entry.travelX) * 180 / Math.PI; parts.push(stairs);
      }
      for (const side of [-1, 1]) parts.push(box("前庭上跑阶梯下方的独立落地细柱", entry.x - entry.travelX * 3 + side * entry.alongX * 1.3, 1.925, entry.z - entry.travelZ * 3 + side * entry.alongZ * 1.3, 0.35, 2.85, 0.35, dark));
    }
    for (let flight = 0; flight < 2; flight++) { const stairs = stairFlight("首条弧翼内真正穿过上层梯井的实体楼梯", [-7 + flight * 7, 6.2 + flight * 3.5, -12.5], 10, 0.35, 0.7, 3.2); stairs.rotation.y = 0; parts.push(stairs); }
    parts.push(box("弧翼内部梯井上端实际连接学习廊的落脚台", 7.8, 13, -12.5, 1.6, 0.4, 3.6, steel), ...[-1, 1].map(side => box("弧翼内部上跑楼梯接回下层的承托细柱", 3, 7.95, -12.5 + side * 1.3, 0.3, 3.5, 0.3, dark)));
    return parts;
  }, "建筑", "科幻"),
  design("偏脊双弧教研馆", "偏置长交通脊支承两段朝不同方向弯落的薄屋顶，错位教研翼内保留完整中庭孔和高位学习廊，长天窗照入左翼而分层侧门贯通两翼", () => {
    const leftY = (x: number) => 20 + 7 * (1 - (x + 32) / 24) ** 2, rightY = (x: number) => 14 + 6 * Math.cos((x + 8) / 40 * Math.PI / 2);
    const curvedStrip = (name: string, x0: number, x1: number, height: (x: number) => number, z: number, depth: number, thickness: number, color: string): ModelPart => {
      const profile = Array.from({ length: 9 }, (_, i) => { const x = x0 + (x1 - x0) * i / 8; return { x, y: height(x) }; });
      profile.push(...Array.from({ length: 9 }, (_, i) => { const x = x1 - (x1 - x0) * i / 8; return { x, y: height(x) - thickness }; }));
      return part(name, "extrude", color, [0, 0, z], [1, 1, 1], [0, 0, 0], { profile, depth });
    };
    const leftCourt: [number, number][] = [[-28, -10], [-16, -10], [-16, 10], [-28, 10]], rightCourt: [number, number][] = [[6, -5], [24, -5], [24, 15], [6, 15]], shaft: [number, number][] = [[-13.5, -25.5], [-10.5, -25.5], [-10.5, -22.5], [-13.5, -22.5]], parts: ModelPart[] = [base(81, 81, 0.5)];
    for (const y of [0.8, 8.3, 15.8]) {
      parts.push(polygon("左教研翼中庭及独立升降孔实际贯穿的楼板", steel, [[-32, -29], [-8, -29], [-8, 29], [-32, 29]], 0.4, [0, y - 0.2, 0], [leftCourt, shaft]));
      if (y > 0.8) parts.push(polygon("左教研翼中庭与楼板连接的完整低护壁", pale, [[-28.1, -10.1], [-15.9, -10.1], [-15.9, 10.1], [-28.1, 10.1]], 1.1, [0, y + 0.2, 0], [leftCourt]));
      for (const z of [-17, 17]) parts.push(box("左翼保留脊侧走道的教研分室短墙", -21.25, y + (y === 15.8 ? 2 : 3.75), z, 20.5, y === 15.8 ? 3.6 : 7.1, 0.15, pale));
    }
    for (const y of [0.8, 8.3]) {
      parts.push(polygon("右教研翼中庭实际贯通的水平楼板", steel, [[-8, -20], [32, -20], [32, 38], [-8, 38]], 0.4, [0, y - 0.2, 0], y === 8.3 ? [rightCourt] : []));
      for (const z of [-12, 24]) parts.push(box("右翼保留脊侧走道的教研分室短墙", 13.25, y + (y === 8.3 ? 2.7 : 3.75), z, 36.5, y === 8.3 ? 5 : 7.1, 0.15, pale));
    }
    parts.push(polygon("右教研翼上层中庭边连续低护壁", pale, [[5.9, -5.1], [24.1, -5.1], [24.1, 15.1], [5.9, 15.1]], 1.1, [0, 8.5, 0], [rightCourt]), box("偏脊高处实际接入各层侧门的独立学习廊", -4, 15.8, 9, 8, 0.4, 58, steel));
    for (const [x0, x1] of [[-32, -24], [-24, -18], [-18, -8]]) { const roof = curvedStrip(x0 === -24 ? "左翼两段实屋面之间的完整弧形长天窗" : "左教研翼朝交通脊弯落的完整薄屋面", x0!, x1!, leftY, 0, 58, 0.22, x0 === -24 ? colors.glass : pale); if (x0 === -24) { roof.opacity = 0.36; roof.roughness = 0.2; } parts.push(roof); }
    parts.push(curvedStrip("右教研翼越过学习廊再向外弯落的完整薄屋面", -8, 32, rightY, 9, 58, 0.22, pale));
    for (const z of [-24, 0, 24]) parts.push(curvedStrip("左弧屋面下方同形封厚的连续承屋肋", -32, -8, x => leftY(x) - 0.22, z, 0.35, 0.7, dark));
    for (const z of [-15, 9, 33]) parts.push(curvedStrip("右弧屋面下方同形封厚的连续承屋肋", -8, 32, x => rightY(x) - 0.22, z, 0.35, 0.7, dark));
    const doors: [number, number][][] = [];
    for (const y of [1, 8.5, 16]) for (const z of [-16, 0, 22]) doors.push([[y, z - 1.5], [Math.min(y + 4.2, 19.5), z - 1.5], [Math.min(y + 4.2, 19.5), z + 1.5], [y, z + 1.5]]);
    const spine = polygon("分层侧门真正贯通的完整偏置交通脊墙", pale, [[0.5, -29], [20.3, -29], [20.3, 38], [0.5, 38]], 0.6, [-7.7, 0, 0], doors); spine.rotation.z = 90; parts.push(spine);
    for (const z of [-25, 0, 25]) parts.push(box("左翼高外檐连续落地细承柱", -32, 13.64, z, 0.45, 26.28, 0.45, dark));
    for (const z of [-16, 9, 34]) parts.push(box("右翼低外檐连续落地细承柱", 32, 7.14, z, 0.45, 13.28, 0.45, dark));
    parts.push(part("左教研翼通高外侧透光薄围护", "box", colors.glass, [-32, 13.89, 0], [0.12, 25.78, 58], [0, 0, 0], { opacity: 0.28, roughness: 0.2 }), part("右教研翼低外檐透光薄围护", "box", colors.glass, [32, 7.39, 9], [0.12, 12.78, 58], [0, 0, 0], { opacity: 0.28, roughness: 0.2 }));
    for (const side of [0, 1]) for (const front of [true, false]) {
      const x0 = side ? -8 : -32, x1 = side ? 32 : -8, height = side ? rightY : leftY, z = side ? front ? -20 : 38 : front ? -29 : 29, outline: [number, number][] = [[x0, 1]];
      for (let i = 0; i <= 8; i++) { const x = x0 + (x1 - x0) * i / 8; outline.push([x, height(x) - 0.22]); } outline.push([x1, 1]);
      const x = side ? 12 : -21, door: [number, number][] = [[x - 2.2, 1], [x + 2.2, 1], [x + 2.2, 5.2], [x - 2.2, 5.2]], wall = xYWall("贴合弧屋缘并保留正门的完整教研翼端窗墙", outline, front ? [door] : [], z, 0.12, colors.glass); wall.opacity = 0.28; wall.roughness = 0.2; parts.push(wall);
      if (front) parts.push(stairFlight("前庭接入教研翼实际正门的两级短梯", [x, 0.5, z - 1.6], 2, 0.25, 0.8, 4));
    }
    for (const x of [-1.5, 1.5]) for (const z of [-1.5, 1.5]) parts.push(box("左教研翼独立升降井贯通细柱", -12 + x, 10.15, -24 + z, 0.15, 19.3, 0.15, dark));
    parts.push(box("教研馆升降井独立顶部承索梁", -12, 19.8, -24, 3.4, 0.3, 3.4, dark), box("教研馆升降井最低层独立轿厢", -12, 0.8, -24, 2.8, 0.4, 2.8, steel), pipe("教研馆独立升降井中可见吊索", [-12, 19.8, -24], [-12, 0.99, -24], 0.05));
    return parts;
  }, "建筑", "科幻"),
];
