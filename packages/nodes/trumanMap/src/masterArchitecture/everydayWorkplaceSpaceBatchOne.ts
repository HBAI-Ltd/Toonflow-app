import { part, type ModelPart } from "../assetModelParts";
import { combineMeshes, polygon } from "../masterNature/shared";
import { stairFlight } from "./futureSpaceBatchSix";
import { xYWall } from "./futureSpaceBatchTen";
import { base, box, design, rail, type ArchitecturePrototype } from "./structures";

const wallColor = "#b9b9af", concrete = "#a4aaa4", roofColor = "#87918c", glassColor = "#9ab9bc", timber = "#9c896f", dark = "#59676a";

export function rectangle(x: number, y: number, width: number, height: number): [number, number][] { return [[x - width / 2, y], [x + width / 2, y], [x + width / 2, y + height], [x - width / 2, y + height]]; }

export function wallYz(name: string, outline: [number, number][], holes: [number, number][][], x: number, thickness: number, color: string): ModelPart {
  const value = polygon(name, color, outline.map(([z, y]) => [y, z]), thickness, [x + thickness / 2, 0, 0], holes.map(loop => loop.map(([z, y]) => [y, z]))); value.rotation.z = 90; return value;
}

export function glazedFace(name: string, axis: "xy" | "yz", outline: [number, number][], windows: [number, number][][], doors: [number, number][][], offset: number): ModelPart[] {
  const make = axis === "xy" ? xYWall : wallYz;
  const parts = [make(name, outline, [...windows, ...doors], offset, 0.18, wallColor)];
  if (windows.length) { const panes = combineMeshes(`${name}各独立窗洞内的薄玻璃`, glassColor, windows.map(loop => make("窗洞内独立薄玻璃", loop, [], offset, 0.025, glassColor))); panes.opacity = 0.24; panes.roughness = 0.2; parts.push(panes); }
  return parts;
}

export const everydayWorkplaceSpaceBatchOneDesigns: ArchitecturePrototype[] = [
  design("四层直走廊办公楼", "普通矩形办公楼的前厅通向中部直走廊，前后两排独立办公室由真实门口进入，三段连续楼梯穿过各层实际梯井，后门连到地面出口", () => {
    const parts: ModelPart[] = [base(55, 43, 0.2)], stairHole: [number, number][] = [[-15.2, 3], [-11.8, 3], [-11.8, 9.1], [-15.2, 9.1]], floors = [0.5, 3.9, 7.3, 10.7];
    for (let level = 0; level < floors.length; level++) {
      const top = floors[level]!, roomHeight = level === 3 ? 3.15 : 3.1;
      parts.push(polygon("办公楼完整楼面与真实梯井", concrete, [[-18, -11], [18, -11], [18, 11], [-18, 11]], 0.3, [0, top - 0.3, 0], level ? [stairHole] : []));
      for (const zSide of [-1, 1]) {
        const doors = level === 0 && zSide < 0 ? [rectangle(-13.5, top, 1.1, 2.3), rectangle(0, top, 3.2, 2.7), rectangle(13.5, top, 1.1, 2.3)] : [-13.5, -4.5, 4.5, 13.5].map(x => rectangle(x, top, 1.1, 2.3));
        parts.push(xYWall("直走廊两侧逐间开门的办公室薄隔墙", [[-17.8, top], [17.8, top], [17.8, top + roomHeight], [-17.8, top + roomHeight]], doors, zSide * 1.3, 0.12, wallColor));
        for (const x of [-9, 0, 9]) { if (level === 0 && zSide < 0 && x === 0) continue; parts.push(box("前后办公室之间接到走廊墙的分室薄墙", x, top + roomHeight / 2, zSide * 6, 0.12, roomHeight, 9.4, wallColor)); }
      }
      if (level < 3) for (let flight = 0; flight < 2; flight++) parts.push(stairFlight("普通办公楼同一梯井内连续向上的实体梯段", [-13.5, top + flight * 1.7, 3.2 + flight * 2.8], 10, 0.17, 0.28, 2.6, 0.18));
      if (level > 0) parts.push(box("办公室楼梯上端连接后廊的实际落脚台", -13.5, top - 0.15, 9.25, 3.4, 0.3, 1, concrete));
      if (level > 0 && level < 3) parts.push(box("办公室后廊接到下一跑楼梯的实际起步台", -13.5, top - 0.15, 2.9, 3.4, 0.3, 1.2, concrete));
    }
    const frontWindows: [number, number][][] = [], rearWindows: [number, number][][] = [], sideWindows: [number, number][][] = [];
    for (let level = 0; level < floors.length; level++) {
      const top = floors[level]!;
      for (const x of [-14, -10, -6, -2, 2, 6, 10, 14]) { if (level || Math.abs(x) > 3) frontWindows.push(rectangle(x, top + 0.9, 2.4, 1.45)); rearWindows.push(rectangle(x, top + 0.9, 2.4, 1.45)); }
      for (const z of [-7.5, -2.5, 2.5, 7.5]) sideWindows.push(rectangle(z, top + 0.9, 2.5, 1.45));
    }
    parts.push(...glazedFace("办公楼前立面实际窗洞和主入口", "xy", [[-18, 0.2], [18, 0.2], [18, 13.85], [-18, 13.85]], frontWindows, [rectangle(0, 0.5, 3.2, 2.7)], -11), ...glazedFace("办公楼后立面实际窗洞和独立后门", "xy", [[-18, 0.2], [18, 0.2], [18, 13.85], [-18, 13.85]], rearWindows, [rectangle(16.5, 0.5, 1.8, 2.3)], 11));
    for (const x of [-18, 18]) parts.push(...glazedFace("办公楼两侧完整开窗薄外墙", "yz", [[-11, 0.2], [11, 0.2], [11, 13.85], [-11, 13.85]], sideWindows, [], x));
    parts.push(box("办公楼完整平屋盖", 0, 14, 0, 37, 0.3, 23, roofColor), box("普通办公楼前厅接待台", 4.5, 1.05, -6.5, 3.2, 1.1, 1.1, timber));
    for (const x of [-17.7, 17.7]) for (const z of [-10.7, 10.7]) parts.push(box("普通办公楼四角贯通承重柱", x, 7.025, z, 0.3, 13.65, 0.3, concrete));
    parts.push(stairFlight("办公楼主入口实际接入前厅的短台阶", [0, 0.2, -12.6], 2, 0.15, 0.8, 4));
    const backSteps = stairFlight("办公楼后门接回场坪的短台阶", [16.5, 0.2, 12.6], 2, 0.15, 0.8, 2.4); backSteps.rotation.y = 90; parts.push(backSteps);
    return parts;
  }, "建筑", "现代"),
  design("L形内院办公园", "三层办公翼沿两边围出开放角庭，转角内的L形公共走廊连续通往各办公室，西翼独立梯井串联楼层，角庭的两处入口分别接入前厅", () => {
    const outline: [number, number][] = [[-25, -23], [-13, -23], [-13, 9], [17, 9], [17, 21], [-25, 21]], shaft: [number, number][] = [[-23.8, -1], [-20.8, -1], [-20.8, 5.1], [-23.8, 5.1]], parts: ModelPart[] = [base(65, 63, 0.2)], floors = [0.45, 3.75, 7.05];
    for (let level = 0; level < 3; level++) {
      const top = floors[level]!, height = level === 2 ? 3.15 : 3.05;
      parts.push(polygon("完整L形办公层及真实西翼梯井", concrete, outline, 0.25, [0, top - 0.25, 0], level ? [shaft] : []));
      const westDoors = [-18, -9, 2, 12, 18].map(z => rectangle(z, top, z === 2 ? 1.6 : 1.05, 2.25)), eastDoors = [-18, -9, 3, 7.4].map(z => rectangle(z, top, 1.05, 2.25));
      parts.push(wallYz("西翼公共走廊靠梯井一侧逐间开门的薄墙", [[-22.8, top], [20.8, top], [20.8, top + height], [-22.8, top + height]], westDoors, -20, 0.12, wallColor), wallYz("西翼公共走廊靠角庭一侧逐间开门的薄墙", [[-22.8, top], [8.8, top], [8.8, top + height], [-22.8, top + height]], eastDoors, -17.6, 0.12, wallColor));
      for (const z of [13.8, 16.2]) parts.push(xYWall("北翼与转角连续相接的公共走廊薄隔墙", [[-17.6, top], [16.8, top], [16.8, top + height], [-17.6, top + height]], [-8, 2, 12].map(x => rectangle(x, top, 1.05, 2.25)), z, 0.12, wallColor));
      for (const z of [-13.5, -4.5, 6, 15]) parts.push(box("西翼外侧办公室之间的分室薄墙", -22.5, top + height / 2, z, 5, height, 0.12, wallColor));
      for (const z of [-13.5, -4.5, 6]) parts.push(box("西翼庭侧办公室之间的分室薄墙", -15.3, top + height / 2, z, 4.6, height, 0.12, wallColor));
      for (const x of [-3, 7]) for (const z of [11.4, 18.6]) parts.push(box("北翼前后办公室之间的分室薄墙", x, top + height / 2, z, 0.12, height, 4.8, wallColor));
      if (level < 2) for (let flight = 0; flight < 2; flight++) parts.push(stairFlight("L形办公园西翼实际贯穿楼层的实体梯段", [-22.3, top + flight * 1.65, -0.8 + flight * 2.8], 10, 0.165, 0.28, 2.4, 0.18));
      if (level > 0) parts.push(box("西翼楼梯上端接向梯厅的完整落脚台", -22.3, top - 0.125, 5.25, 3, 0.25, 1, concrete));
      if (level === 1) parts.push(box("西翼梯厅接入下一跑楼梯的完整起步台", -22.3, top - 0.125, -1.1, 3, 0.25, 1.2, concrete));
    }
    const allWindows = (centers: number[], width: number) => floors.flatMap(top => centers.map(x => rectangle(x, top + 0.85, width, 1.45)));
    parts.push(...glazedFace("办公园南端完整开窗薄立面", "xy", [[-25, 0.2], [-13, 0.2], [-13, 10.2], [-25, 10.2]], allWindows([-22, -16], 2.6), [], -23));
    const courtyardWest = floors.flatMap((top, level) => (level ? [-18, -10, -2, 6] : [-18, -10, -2]).map(z => rectangle(z, top + 0.85, 2.6, 1.45)));
    parts.push(...glazedFace("西翼面向角庭的开窗及前厅正门", "yz", [[-23, 0.2], [9, 0.2], [9, 10.2], [-23, 10.2]], courtyardWest, [rectangle(3, 0.45, 3, 2.65)], -13));
    const courtyardNorth = floors.flatMap((top, level) => (level ? [-8, 2, 10, 15] : [-8, 10, 15]).map(x => rectangle(x, top + 0.85, 2.6, 1.45)));
    parts.push(...glazedFace("北翼面向角庭的开窗及公共前厅入口", "xy", [[-13, 0.2], [17, 0.2], [17, 10.2], [-13, 10.2]], courtyardNorth, [rectangle(2, 0.45, 3.2, 2.65)], 9), ...glazedFace("办公园东端完整开窗薄立面", "yz", [[9, 0.2], [21, 0.2], [21, 10.2], [9, 10.2]], allWindows([12, 18], 2.6), [], 17), ...glazedFace("办公园北侧完整开窗薄立面", "xy", [[-25, 0.2], [17, 0.2], [17, 10.2], [-25, 10.2]], allWindows([-20, -12, -4, 4, 12], 3.2), [], 21), ...glazedFace("办公园西侧完整开窗薄立面", "yz", [[-23, 0.2], [21, 0.2], [21, 10.2], [-23, 10.2]], allWindows([-18, -10, -2, 6, 14, 19], 2.4), [], -25));
    parts.push(polygon("两翼连续相接的完整L形平屋盖", roofColor, outline, 0.3, [0, 10.2, 0]), box("北翼前厅独立接待台", 6, 0.95, 11, 2.8, 1, 1, timber));
    for (const [x, z] of outline) parts.push(box("L形办公楼转角贯通承重柱", x, 5.2, z, 0.3, 10, 0.3, concrete));
    parts.push(stairFlight("角庭接入北翼前厅的两级短梯", [2, 0.2, 7.6], 2, 0.125, 0.7, 4));
    const westSteps = stairFlight("角庭接入西翼前厅的两级短梯", [-11.6, 0.2, 3], 2, 0.125, 0.7, 3.6); westSteps.rotation.y = 180; parts.push(westSteps);
    return parts;
  }, "建筑", "现代"),
  design("前厅侧卸双坡物流库", "高位双坡库房前接两层办公前厅，正面大门和侧向装卸月台分别服务车辆，另一侧实体坡道接入叉车通门，前厅内的连续楼梯和后部短阶连接办公层与库内地坪", () => {
    const parts: ModelPart[] = [base(85, 85, 0.25), box("物流库连续高位地坪及落地地基", 0, 0.875, 3, 44, 1.25, 54, concrete)];
    const gable: [number, number][] = [[-22, 1.5], [22, 1.5], [22, 9.5], [0, 13.5], [-22, 9.5]], frontWindows = [rectangle(0, 5, 8, 1.5)], backWindows = [-13, 0, 13].map(x => rectangle(x, 7.4, 6, 1.4));
    parts.push(...glazedFace("物流库正面两道车辆门及办公观察窗", "xy", gable, frontWindows, [rectangle(-12.5, 1.5, 6, 5.5), rectangle(12.5, 1.5, 6, 5.5), rectangle(0, 1.5, 2.4, 2.4)], -24), ...glazedFace("物流库后端完整山墙及高窗", "xy", gable, backWindows, [], 30));
    const sideOutline: [number, number][] = [[-24, 1.5], [30, 1.5], [30, 9.5], [-24, 9.5]], highWindows = [-18, -6, 6, 18].map(z => rectangle(z, 7.2, 5.5, 1.2));
    parts.push(...glazedFace("物流库侧卸月台对应的三道真实车辆门", "yz", sideOutline, highWindows, [-12, 6, 24].map(z => rectangle(z, 1.5, 5.5, 4.8)), 22), ...glazedFace("物流库叉车坡道对应的真实通门及高窗", "yz", sideOutline, highWindows, [rectangle(0, 1.5, 6, 5.2)], -22));
    const roofProfile = [{ x: -22.5, y: 9.5 }, { x: 0, y: 13.6 }, { x: 22.5, y: 9.5 }, { x: 22.5, y: 9.25 }, { x: 0, y: 13.35 }, { x: -22.5, y: 9.25 }];
    parts.push(part("物流库带两面真实厚度的完整双坡屋盖", "extrude", roofColor, [0, 0, 3], [1, 1, 1], [0, 0, 0], { profile: roofProfile, depth: 55 }));
    for (const z of [-20, -4, 12, 28]) parts.push(...[-1, 1].map(side => box("物流库钢门架落在地坪上的完整立柱", side * 21.6, 5.5, z, 0.4, 8, 0.4, dark)), rail([-22, 9.25, z], [0, 13.35, z], 0.45, dark), rail([0, 13.35, z], [22, 9.25, z], 0.45, dark), box("库房门架跨越净空的水平系梁", 0, 8.8, z, 43.2, 0.3, 0.3, dark));
    for (const z of [-12, 6, 24]) {
      parts.push(box("侧卸车辆门前与库内地坪等高的装卸台", 24, 1.25, z, 4, 0.5, 6.2, concrete));
      for (const end of [-1, 1]) parts.push(box("侧卸装卸台外沿实际落地短支座", 25.4, 0.625, z + end * 2.7, 0.45, 0.75, 0.45, concrete));
    }
    for (const x of [-12.5, 12.5]) parts.push(box("正面大车辆门前完整落地装卸台", x, 0.875, -26, 6.2, 1.25, 4, concrete));
    parts.push(part("从场坪连续升到叉车门口的完整实体坡道", "extrude", concrete, [0, 0, 0], [1, 1, 1], [0, 0, 0], { profile: [{ x: -34, y: 0.25 }, { x: -22, y: 0.25 }, { x: -22, y: 1.5 }], depth: 5.5 }));
    parts.push(box("前厅底层与场坪相接的完整地面", 0, 0.375, -30, 12, 0.25, 12, concrete), polygon("前厅二层办公室保留实际楼梯孔的楼面", concrete, [[-6, -36], [6, -36], [6, -24], [-6, -24]], 0.25, [0, 3.95, 0], [[[-4.8, -34.8], [-2.2, -34.8], [-2.2, -29.2], [-4.8, -29.2]]]), box("前厅两层办公室的完整平屋盖", 0, 7.7, -30, 12.6, 0.3, 12.6, roofColor));
    const officeOutline: [number, number][] = [[-6, 0.25], [6, 0.25], [6, 7.55], [-6, 7.55]], officeFront = [rectangle(-3.8, 1.4, 2.2, 1.4), rectangle(3.8, 1.4, 2.2, 1.4), ...[-3, 0, 3].map(x => rectangle(x, 5.1, 2, 1.4))];
    parts.push(...glazedFace("物流前厅实际开窗及独立步行入口", "xy", officeOutline, officeFront, [rectangle(0, 0.5, 2.4, 2.5)], -36), ...glazedFace("前厅通向高位库内地坪的真实门口及上层观察窗", "xy", officeOutline, frontWindows, [rectangle(0, 0.5, 2.4, 3.4)], -24));
    const officeSides: [number, number][][] = [0.5, 4.2].flatMap(top => [-33, -27].map(z => rectangle(z, top + 0.9, 2.5, 1.4)));
    for (const x of [-6, 6]) parts.push(...glazedFace("物流前厅两侧完整开窗薄墙", "yz", [[-36, 0.25], [-24, 0.25], [-24, 7.55], [-36, 7.55]], officeSides, [], x));
    for (let flight = 0; flight < 2; flight++) parts.push(stairFlight("物流前厅两层办公室实际贯穿楼面的实体梯", [-3.5, 0.5 + flight * 1.85, -34.5 + flight * 2.5], 10, 0.185, 0.25, 2));
    parts.push(box("前厅办公室楼梯上端实际接入二层的落脚台", -3.5, 4.075, -29.05, 2.6, 0.25, 1, concrete), stairFlight("前厅接到高位仓库地坪的三步实体台阶", [0, 0.5, -25.05], 3, 1 / 3, 0.35, 2.4), stairFlight("场坪接入物流前厅正门的两步短梯", [0, 0.25, -37.4], 2, 0.125, 0.7, 3.2), box("物流前厅独立接待工作台", 2.8, 1, -31, 2.4, 1, 1.1, timber));
    for (const x of [-5.7, 5.7]) for (const z of [-35.7, -24.3]) parts.push(box("物流前厅四角从场坪接到屋盖的完整细柱", x, 3.9, z, 0.25, 7.3, 0.25, concrete));
    return parts;
  }, "建筑", "现代"),
  design("四工位临街修车铺", "四道车辆门接入两座驶上式开口检修台和两组举升工位，检修台的中央沟槽从后部通道实际开通，固定后工作间与侧边接待前厅通过独立人行门连接", () => {
    const roofY = (z: number) => 5.9875 + z * 0.025, bays = [-12, -4, 4, 12], parts: ModelPart[] = [base(65, 55, 0.2), box("四工位修车铺连续车间地坪", 0, 0.325, 0.5, 32, 0.25, 23, concrete)];
    parts.push(...glazedFace("修车铺四道实际车辆入口及门上高窗", "xy", [[-16, 0.2], [16, 0.2], [16, roofY(-11)], [-16, roofY(-11)]], bays.map(x => rectangle(x, 4.7, 4.4, 0.7)), bays.map(x => rectangle(x, 0.45, 5.6, 3.8)), -11), ...glazedFace("修车铺后工作间高窗与独立人行出口", "xy", [[-16, 0.2], [16, 0.2], [16, roofY(12)], [-16, roofY(12)]], bays.map(x => rectangle(x, 4.4, 4, 1.2)), [rectangle(-12.5, 0.45, 1.2, 2.3)], 12));
    const side: [number, number][] = [[-11, 0.2], [12, 0.2], [12, roofY(12)], [-11, roofY(-11)]], sideWindows = [-6, 3, 10].map(z => rectangle(z, 4.3, 3.5, 0.8));
    parts.push(...glazedFace("修车铺西侧完整高窗薄墙", "yz", side, sideWindows, [], -16), ...glazedFace("接待前厅通向维修车间的实际人行门及高窗", "yz", side, sideWindows, [rectangle(-4, 0.45, 1.2, 2.3)], 16));
    parts.push(part("修车铺连续单坡完整厚屋盖", "extrude", roofColor, [0, 0, 0], [1, 1, 1], [0, -90, 0], { profile: [{ x: -11.5, y: 5.7 }, { x: 12.5, y: 6.3 }, { x: 12.5, y: 6.08 }, { x: -11.5, y: 5.48 }], depth: 32.8 }));
    for (const x of [-16, -8, 0, 8, 16]) {
      for (const z of [-10.6, 11.6]) { const top = roofY(z) - 0.22; parts.push(box("车辆工位之间接到屋架的完整落地柱", x, (0.45 + top) / 2, z, 0.25, top - 0.45, 0.25, dark)); }
      parts.push(rail([x, roofY(-10.6) - 0.22, -10.6], [x, roofY(11.6) - 0.22, 11.6], 0.25, dark));
    }
    for (const x of [-12, -4]) {
      const outline: [number, number][] = [[x - 2.4, -3], [x + 2.4, -3], [x + 2.4, 7.5], [x + 0.65, 7.5], [x + 0.65, -1.5], [x - 0.65, -1.5], [x - 0.65, 7.5], [x - 2.4, 7.5]];
      parts.push(polygon("后端实际开通中央检修沟的完整驶上式台座", concrete, outline, 1.35, [0, 0.45, 0]));
      for (const side of [-1, 1]) parts.push(part("车辆两轮分别驶上检修台的完整实体斜坡", "extrude", concrete, [x + side * 0.95, 0, 0], [1, 1, 1], [0, -90, 0], { profile: [{ x: -8, y: 0.45 }, { x: -3, y: 0.45 }, { x: -3, y: 1.8 }], depth: 0.6 }));
    }
    for (const x of [4, 12]) {
      for (const side of [-1, 1]) parts.push(box("车辆举升工位两侧固定立柱", x + side * 1.8, 2.25, -0.5, 0.28, 3.6, 0.4, dark));
      parts.push(box("举升工位两柱顶部实际相接的完整横梁", x, 4.1, -0.5, 4, 0.25, 0.4, dark));
      for (const side of [-1, 1]) for (const end of [-1, 1]) parts.push(rail([x + side * 1.8, 0.95, -0.5], [x + side * 0.7, 0.95, -0.5 + end * 1.1], 0.12, dark), box("举升臂端部实际承接车底的宽托垫", x + side * 0.7, 1.05, -0.5 + end * 1.1, 0.3, 0.12, 0.3, concrete));
    }
    parts.push(xYWall("各工位后端实际开门的固定维修间薄隔墙", [[-16, 0.45], [16, 0.45], [16, 3.55], [-16, 3.55]], bays.map(x => rectangle(x, 0.45, 1.1, 2.2)), 8, 0.15, wallColor), ...[0, 8].map(x => box("后部工具工作间之间的完整薄隔墙", x, 2, 10, 0.15, 3.1, 4, wallColor)));
    for (const x of bays) parts.push(part("场坪平顺接到各车辆门地坪的完整宽短坡", "extrude", concrete, [x, 0, 0], [1, 1, 1], [0, -90, 0], { profile: [{ x: -15, y: 0.2 }, { x: -11, y: 0.2 }, { x: -11, y: 0.45 }], depth: 6.5 }));
    parts.push(box("侧边接待前厅与车间同高的完整地面", 20, 0.325, -5, 8, 0.25, 12, concrete), box("侧边接待前厅完整平屋盖", 20, 3.9, -5, 8.4, 0.3, 12.4, roofColor));
    const receptionOutline: [number, number][] = [[16, 0.2], [24, 0.2], [24, 3.75], [16, 3.75]];
    parts.push(...glazedFace("修车铺接待前厅实际主入口及独立窗洞", "xy", receptionOutline, [rectangle(17.6, 1.25, 1.8, 1.3), rectangle(22.4, 1.25, 1.8, 1.3)], [rectangle(20, 0.45, 2, 2.3)], -11), ...glazedFace("接待前厅后部完整开窗薄墙", "xy", receptionOutline, [rectangle(20, 1.25, 4.5, 1.3)], [], 1), ...glazedFace("接待前厅面向场坪的完整侧窗墙", "yz", [[-11, 0.2], [1, 0.2], [1, 3.75], [-11, 3.75]], [-8, -2].map(z => rectangle(z, 1.25, 2.2, 1.3)), [], 24), wallYz("接待前厅实际通向维修车间的人行门", [[-11, 0.2], [1, 0.2], [1, 3.75], [-11, 3.75]], [rectangle(-4, 0.45, 1.2, 2.3)], 16, 0.18, wallColor), box("接待前厅内独立服务台", 21.4, 1, -4, 2.4, 1.1, 1.1, timber), stairFlight("场坪接入修车铺接待入口的两级短梯", [20, 0.2, -12.4], 2, 0.125, 0.7, 2.6));
    const exit = stairFlight("修车铺后人行门接回场坪的两级短梯", [-12.5, 0.2, 13.4], 2, 0.125, 0.7, 1.8); exit.rotation.y = 90; parts.push(exit);
    return parts;
  }, "建筑", "现代"),
];
