import { asset, beam, part, pitchedRoof, ring, type ModelPart, type Triple } from "./assetModelParts";
import type { AssetItemType, SceneAsset } from "./sceneDocument";

const brass = "#b3965d";
const copper = "#a67555";
const iron = "#44545b";
const leather = "#755344";
const cream = "#d5c6a5";
const brick = "#8e6251";
const steel = "#718491";
const shell = "#354653";
const black = "#202c38";
const glass = "#8daeb8";
const cyan = "#71cbd4";
const pink = "#c887ba";
const green = "#708b68";
const wood = "#8d6d4d";

function make(id: string, name: string, theme: "蒸汽朋克" | "赛博朋克", itemType: AssetItemType, parts: ModelPart[]) {
  return asset(id, name, theme, itemType === "建筑" ? "建筑" : itemType === "植物" ? "自然" : "道具", parts, { itemType });
}

function pipe(name: string, color: string, path: Triple[], radius = 0.045) {
  return part(name, "tube", color, [0, 0, 0], [1, 1, 1], [0, 0, 0], { path: path.map(([x, y, z]) => ({ x, y, z })), radius, metalness: 0.55, roughness: 0.4 });
}

function gear(name: string, center: Triple, radius: number, teeth = 8): ModelPart[] {
  const [x, y, z] = center;
  const parts = [part(`${name}轮身`, "cylinder", brass, center, [radius * 1.6, 0.1, radius * 1.6], [90, 0, 0], { metalness: 0.65 }), part(`${name}轮轴`, "cylinder", iron, [x, y, z + 0.075], [radius * 0.45, 0.1, radius * 0.45], [90, 0, 0])];
  for (let index = 0; index < teeth; index++) {
    const angle = index * Math.PI * 2 / teeth;
    parts.push(part(`${name}轮齿`, "box", brass, [x + Math.cos(angle) * radius * 0.83, y + Math.sin(angle) * radius * 0.83, z], [radius * 0.24, radius * 0.4, 0.12], [0, 0, index * 360 / teeth - 90], { metalness: 0.65 }));
  }
  return parts;
}

function gauge(center: Triple, diameter = 0.3): ModelPart[] {
  const [x, y, z] = center;
  return [part("压力表铜壳", "cylinder", brass, center, [diameter, 0.08, diameter], [90, 0, 0]), part("压力表刻度盘", "cylinder", cream, [x, y, z + 0.05], [diameter * 0.83, 0.018, diameter * 0.83], [90, 0, 0]), part("压力表指针", "box", "#ad6550", [x + diameter * 0.09, y + diameter * 0.06, z + 0.065], [diameter * 0.31, 0.015, 0.012], [0, 0, 35])];
}

function legs(width: number, depth: number, height: number, color = iron, thickness = 0.07): ModelPart[] {
  return [-1, 1].flatMap(x => [-1, 1].map(z => part("承重支腿", "cylinder", color, [x * width / 2, height / 2, z * depth / 2], [thickness, height, thickness])));
}

function roadWheels(width: number, y: number, axles: number[], radius: number, steam = true): ModelPart[] {
  return axles.flatMap(z => [-1, 1].flatMap(side => [part("车轮轮胎", "cylinder", steam ? iron : black, [side * width, y, z], [radius * 2, 0.18, radius * 2], [0, 0, 90]), part("车轮轮毂", "cylinder", steam ? brass : steel, [side * (width + 0.105), y, z], [radius * 1.15, 0.04, radius * 1.15], [0, 0, 90], { metalness: 0.7 })]));
}

function dome(name: string, color: string, position: Triple, radius: number, opacity = 1) {
  return part(name, "lathe", color, position, [1, 1, 1], [0, 0, 0], { profile: Array.from({ length: 9 }, (_, index) => ({ x: Math.sin(index * Math.PI / 16) * radius, y: Math.cos(index * Math.PI / 16) * radius })), opacity, roughness: opacity < 1 ? 0.18 : 0.55 });
}

function glow(name: string, color: string, position: Triple, scale: Triple, rotation: Triple = [0, 0, 0]) {
  return part(name, "box", color, position, scale, rotation, { emissive: color, emissiveIntensity: 0.65, roughness: 0.3 });
}

function fan(name: string, center: Triple, radius: number): ModelPart[] {
  const parts = [part(`${name}护环`, "torus", steel, center, [radius * 2, radius * 2, 0.35]), part(`${name}电机`, "cylinder", shell, center, [radius * 0.4, 0.16, radius * 0.4], [90, 0, 0])];
  for (let index = 0; index < 3; index++) parts.push(part(`${name}桨叶`, "box", black, center, [radius * 0.18, radius * 1.65, 0.03], [0, 0, index * 60]));
  return parts;
}

function steamClockTower() {
  const parts = [part("钟楼基座", "box", brick, [0, 0.2, 0], [3.8, 0.4, 3.8]), part("砖砌塔身", "box", brick, [0, 3.9, 0], [3, 7.4, 3]), part("铜顶檐", "box", copper, [0, 7.8, 0], [3.7, 0.3, 3.7]), part("钟楼尖顶", "cone", iron, [0, 9.05, 0], [4.5, 2.2, 4.5]), part("钟面外壳", "cylinder", brass, [0, 6.2, 1.57], [2.05, 0.2, 2.05], [90, 0, 0]), part("钟面", "cylinder", cream, [0, 6.2, 1.69], [1.78, 0.025, 1.78], [90, 0, 0]), part("分针", "box", iron, [0, 6.58, 1.72], [0.04, 0.8, 0.025]), part("时针", "box", iron, [0.24, 6.25, 1.72], [0.51, 0.06, 0.025], [0, 0, 18]), pipe("外露蒸汽管", copper, [[-1.6, 0.2, 0.8], [-1.6, 6.7, 0.8], [-1.6, 7.8, 0], [-0.6, 7.9, 0]], 0.12), ...gear("塔身传动齿", [0, 3.5, 1.58], 0.7, 10), part("入口门", "box", leather, [0, 1.2, 1.53], [0.9, 2.4, 0.06])];
  return make("steamClockTower", "蒸汽钟楼", "蒸汽朋克", "建筑", parts);
}

function boilerFactory() {
  const parts = [part("厂房砖墙", "box", brick, [0, 2.5, 0], [10, 5, 6]), pitchedRoof("铆接厂房顶", iron, 10.5, 6.5, 5.1), part("装卸门", "box", iron, [0, 1.7, 3.04], [3.3, 3.4, 0.1]), part("主烟囱", "cylinder", brick, [-3.8, 4.8, -1.5], [1.1, 9.6, 1.1]), part("烟囱铜箍", "cylinder", copper, [-3.8, 8.6, -1.5], [1.25, 0.25, 1.25])];
  for (const x of [-3, 3]) { parts.push(part("厂房拱窗", "box", "#9ba690", [x, 3.3, 3.04], [1.5, 1.7, 0.05])); parts.push(part("外置锅炉", "cylinder", copper, [x, 1.5, 4], [1.1, 3, 1.1])); parts.push(pipe("锅炉进汽弯管", brass, [[x, 3, 4], [x, 4.1, 4], [x, 4.3, 2.8]], 0.12)); }
  return make("steamBoilerFactory", "铆钉锅炉厂", "蒸汽朋克", "建筑", parts);
}

function steamStation() {
  const parts = [part("站台", "box", cream, [0, 0.4, 0], [10, 0.8, 4]), { ...pitchedRoof("铜板双坡站棚", copper, 4.8, 10.3, 3.7), rotation: { x: 0, y: 90, z: 0 } }, part("站台标牌", "box", iron, [0, 3.15, 2.01], [2.8, 0.55, 0.08])];
  for (const x of [-4, 0, 4]) for (const z of [-1.6, 1.6]) parts.push(part("铜管站柱", "cylinder", brass, [x, 2.2, z], [0.16, 2.8, 0.16]));
  parts.push(...gauge([0, 3.17, 2.08], 0.38), part("行李架台", "box", leather, [-3.2, 1.2, 0], [1.8, 0.8, 0.9]));
  return make("steamCopperStation", "铜管蒸汽车站", "蒸汽朋克", "建筑", parts);
}

function gearWorkshop() {
  return make("steamGearWorkshop", "齿轮机械工坊", "蒸汽朋克", "建筑", [part("工坊屋身", "box", "#98866d", [0, 1.7, 0], [4.7, 3.4, 3.7]), pitchedRoof("工坊斜顶", copper, 5.2, 4.2, 3.5), part("敞口工坊门", "box", iron, [0, 1.1, 1.89], [1.55, 2.2, 0.07]), part("工坊边窗", "box", "#aab396", [-1.65, 2, 1.9], [0.75, 1, 0.06]), ...gear("门顶招牌齿", [0, 3.25, 2.14], 0.65, 10), pipe("排气管", brass, [[2.1, 0.2, 1.9], [2.1, 3.7, 1.9], [1.6, 4.4, 1.9]], 0.09)]);
}

function airshipDock() {
  const parts = [part("停泊港高台", "box", iron, [0, 2.4, 0], [8, 0.4, 5]), ...legs(6.8, 3.7, 2.2, iron, 0.32), part("系留主桅", "cylinder", copper, [0, 5.3, -1.3], [0.5, 6, 0.5]), part("旋转停泊环", "torus", brass, [0, 7.8, -1.3], [2.2, 2.2, 0.6], [90, 0, 0]), part("港口控制亭", "box", leather, [-2.6, 3.7, -0.8], [2.1, 2.2, 1.8]), part("控制亭玻璃", "box", glass, [-2.6, 3.95, 0.13], [1.75, 1.2, 0.04])];
  for (const z of [-2.35, 2.35]) { parts.push(part("港口护栏", "box", brass, [0, 3.25, z], [8, 0.08, 0.08])); for (const x of [-3.6, 0, 3.6]) parts.push(part("护栏杆", "cylinder", iron, [x, 2.94, z], [0.05, 0.8, 0.05])); }
  return make("steamAirshipDock", "飞艇停泊港", "蒸汽朋克", "建筑", parts);
}

function mechanicalGreenhouse() {
  const parts = [part("温室底台", "cylinder", iron, [0, 0.16, 0], [5.5, 0.32, 5.5]), dome("温室玻璃穹顶", glass, [0, 0.3, 0], 2.6, 0.26), part("温室中央树干", "cylinder", leather, [0, 1.15, 0], [0.2, 1.7, 0.2]), part("温室树冠", "sphere", green, [0, 1.9, 0], [2.4, 1.3, 2.1])];
  for (let index = 0; index < 6; index++) { const angle = index * Math.PI / 3; const path: Triple[] = Array.from({ length: 9 }, (_, step) => [Math.cos(angle) * Math.sin(step * Math.PI / 16) * 2.65, 0.3 + Math.cos(step * Math.PI / 16) * 2.65, Math.sin(angle) * Math.sin(step * Math.PI / 16) * 2.65]); parts.push(pipe("穹顶铜肋", brass, path, 0.035)); }
  parts.push(pipe("温室供汽管", copper, [[-2.3, 0.3, 0], [-2.9, 0.5, 0], [-2.9, 1.2, 0]], 0.09));
  return make("steamMechanicalGreenhouse", "机械穹顶温室", "蒸汽朋克", "建筑", parts);
}

function brassObservatory() {
  return make("steamBrassObservatory", "黄铜天文台", "蒸汽朋克", "建筑", [part("天文台塔身", "cylinder", brick, [0, 2, 0], [4.4, 4, 4.4]), ring("塔顶回廊", brass, 2.6, 0.25, 4.05, 0.22), dome("可转天文穹顶", copper, [0, 4.15, 0], 2.2), part("观测镜筒", "cylinder", brass, [0.6, 5.2, 1.9], [0.45, 2.7, 0.45], [65, 0, 0]), part("观测透镜", "cylinder", "#658f9c", [0.6, 5.78, 3.13], [0.41, 0.06, 0.41], [65, 0, 0]), part("天文台入口", "box", leather, [0, 1.1, 2.23], [0.9, 2.2, 0.05]), ...gear("穹顶驱动齿", [-1.1, 4.4, 2], 0.5)]);
}

function steamTownhouse() {
  const parts = [part("公寓砖立面", "box", brick, [0, 4, 0], [6.2, 8, 4.7]), pitchedRoof("铜瓦坡顶", copper, 6.8, 5.3, 8.1), part("主入口门", "box", leather, [0, 1.25, 2.39], [1, 2.5, 0.07])];
  for (let floor = 0; floor < 3; floor++) for (const x of [-2, 2]) { const y = 1.65 + floor * 2.6; parts.push(part("黄铜窗框", "box", brass, [x, y, 2.39], [1.25, 1.7, 0.12])); parts.push(part("公寓窗玻璃", "box", glass, [x, y, 2.47], [1.05, 1.48, 0.025])); }
  parts.push(pipe("立面公共汽管", copper, [[-3.2, 0.3, 1.9], [-3.2, 7.4, 1.9], [2.9, 7.4, 1.9], [2.9, 5.8, 1.9]], 0.11), part("屋顶通风罐", "cylinder", iron, [1.8, 8.9, -0.7], [0.7, 1.4, 0.7]));
  return make("steamTownhouse", "蒸汽联排公寓", "蒸汽朋克", "建筑", parts);
}

function steamCar() {
  return make("steamMotorCar", "黄铜蒸汽汽车", "蒸汽朋克", "交通", [part("汽车底盘", "box", iron, [0, 0.6, 0], [1.6, 0.25, 3.6]), part("驾驶舱", "box", leather, [0, 1.25, -0.7], [1.45, 1.2, 1.4]), part("汽车挡风玻璃", "box", glass, [0, 1.51, 0.03], [1.3, 0.62, 0.045]), part("车前锅炉", "cylinder", copper, [0, 1.1, 1.05], [1.05, 1.4, 1.05], [90, 0, 0]), part("汽车烟囱", "cylinder", iron, [0, 1.98, 1.45], [0.2, 1, 0.2]), ...roadWheels(0.9, 0.46, [-1.2, 1.2], 0.45), ...gauge([0, 1.3, 1.82], 0.32), ...[-0.58, 0.58].map(x => part("黄铜车灯", "sphere", cream, [x, 0.92, 1.8], [0.3, 0.3, 0.3], [0, 0, 0], { emissive: "#cbaa6c", emissiveIntensity: 0.45 }))]);
}

function steamLocomotive() {
  const parts = [part("机车底架", "box", iron, [0, 0.75, 0], [2.15, 0.3, 6]), part("卧式主锅炉", "cylinder", copper, [0, 1.65, 0.9], [1.65, 3.5, 1.65], [90, 0, 0]), part("驾驶室", "box", "#675c4b", [0, 1.9, -2], [2.05, 2, 1.8]), part("驾驶室顶", "box", iron, [0, 2.99, -2], [2.3, 0.18, 2]), part("机车烟囱", "cylinder", iron, [0, 2.95, 1.9], [0.48, 1.2, 0.48]), part("机车汽包", "sphere", brass, [0, 2.52, 0.2], [0.5, 0.5, 0.5]), ...roadWheels(1.05, 0.59, [-1.8, 0, 1.8], 0.58)];
  for (const side of [-1, 1]) { parts.push(part("轮组连杆", "box", brass, [side * 1.18, 0.58, 0], [0.07, 0.1, 3.7])); parts.push(pipe("主蒸汽导管", brass, [[side * 0.85, 1.1, 2.3], [side * 0.85, 1.7, 1.8], [side * 0.85, 1.7, -1.1]], 0.07)); }
  return make("steamLocomotive", "铜壳蒸汽机车", "蒸汽朋克", "交通", parts);
}

function steamMonorail() {
  return make("steamMonorail", "悬吊单轨蒸汽车", "蒸汽朋克", "交通", [part("单轨悬挂车厢", "capsule", leather, [0, 1.8, 0], [1.8, 5, 1.8], [90, 0, 0]), part("轨道吊架", "box", iron, [0, 3.05, 0], [0.7, 0.3, 5]), ...[-1.6, 1.6].map(z => part("吊架立杆", "box", brass, [0, 2.62, z], [0.15, 0.85, 0.15])), ...[-0.84, 0.84].flatMap(x => [-1.4, 0, 1.4].map(z => part("单轨侧窗", "box", glass, [x, 1.9, z], [0.04, 0.7, 0.95]))), part("单轨动力汽缸", "cylinder", copper, [0, 3.5, -0.7], [0.75, 1.8, 0.75], [90, 0, 0]), ...gear("吊轨驱动轮", [0, 3.45, 1.4], 0.48), part("车厢登车梯", "box", iron, [0, 0.4, 2.1], [1.4, 0.12, 0.5])]);
}

function brassAirship() {
  const parts = [part("飞艇气囊", "sphere", "#bfae8e", [0, 3.7, 0], [3.2, 3, 8]), part("飞艇吊舱", "capsule", leather, [0, 1.1, 0.2], [1.3, 3.5, 1.1], [90, 0, 0]), part("艇尾方向舵", "box", copper, [0, 3.7, -3.65], [0.12, 2.8, 1.1]), part("艇尾水平尾翼", "box", copper, [0, 3.7, -3.55], [3, 0.1, 1.1])];
  for (const x of [-0.9, 0.9]) for (const z of [-1.3, 1.3]) parts.push(beam("气囊悬索", iron, [x * 1.1, 2.8, z], [x * 0.6, 1.45, z], 0.025));
  for (const x of [-1, 1]) { parts.push(part("飞艇推进汽机", "cylinder", copper, [x, 1.5, -0.8], [0.45, 0.9, 0.45], [90, 0, 0])); parts.push(part("飞艇推进桨", "box", wood, [x, 1.5, -1.32], [0.13, 1.5, 0.06], [0, 0, x * 35])); }
  return make("steamBrassAirship", "黄铜蒸汽飞艇", "蒸汽朋克", "交通", parts);
}

function gyrocraft() {
  const parts = [part("飞行器座舱", "sphere", copper, [0, 0.95, 0], [1.4, 1.25, 2.2]), part("座舱风挡", "sphere", glass, [0, 1.22, 0.45], [1.13, 0.9, 1.2], [0, 0, 0], { opacity: 0.3 }), part("旋翼立轴", "cylinder", iron, [0, 2, 0], [0.09, 1.35, 0.09]), part("主旋翼一", "box", wood, [0, 2.72, 0], [4.7, 0.06, 0.24]), part("主旋翼二", "box", wood, [0, 2.72, 0], [0.24, 0.06, 4.7]), beam("尾部机架", iron, [0, 1, -0.8], [0, 1.25, -2.9], 0.12), part("尾翼", "box", copper, [0, 1.43, -2.8], [1.2, 0.65, 0.08])];
  for (const x of [-0.7, 0.7]) { parts.push(part("着陆滑橇", "capsule", iron, [x, 0.15, 0], [0.12, 2.4, 0.12], [90, 0, 0])); parts.push(beam("着陆架", brass, [x, 0.2, 0], [x * 0.7, 0.8, 0], 0.06)); }
  return make("steamGyrocraft", "蒸汽螺旋飞行器", "蒸汽朋克", "交通", parts);
}

function steamTrike() {
  return make("steamCargoTrike", "蒸汽三轮货车", "蒸汽朋克", "交通", [part("三轮货台", "box", iron, [0, 0.65, -0.6], [1.4, 0.13, 1.8]), part("货台箱体", "box", leather, [0, 1, -0.7], [1.35, 0.65, 1.5]), ...roadWheels(0.78, 0.4, [-0.9], 0.39), part("前轮", "cylinder", iron, [0, 0.4, 1.3], [0.78, 0.16, 0.78], [0, 0, 90]), beam("前转向车架", brass, [0, 0.45, 1.3], [0, 1.2, 0.6], 0.09), part("驾驶坐垫", "box", leather, [0, 0.94, 0.2], [0.44, 0.12, 0.45]), part("动力锅炉", "cylinder", copper, [0, 0.53, 0.25], [0.48, 0.7, 0.48], [90, 0, 0]), part("操纵把", "cylinder", iron, [0, 1.32, 0.75], [0.04, 0.8, 0.04], [0, 0, 90])]);
}

function pipeDesk() {
  return make("steamPipeDesk", "铜管机械书桌", "蒸汽朋克", "家具", [part("书桌木台面", "box", leather, [0, 0.78, 0], [1.6, 0.1, 0.8]), ...legs(1.3, 0.58, 0.74, copper, 0.065), pipe("桌下横联铜管", brass, [[-0.65, 0.3, 0.29], [-0.65, 0.2, 0], [0.65, 0.2, 0], [0.65, 0.3, 0.29]]), part("桌上仪表台", "box", copper, [0.45, 0.96, -0.17], [0.5, 0.27, 0.3]), ...gauge([0.45, 0.99, 0.005], 0.18)]);
}

function rivetedChair() {
  const parts = [...legs(0.45, 0.45, 0.45), part("铆钉椅座", "box", leather, [0, 0.5, 0], [0.6, 0.14, 0.6]), part("铁壳高靠背", "box", iron, [0, 0.96, -0.25], [0.57, 0.85, 0.11]), part("皮革靠垫", "box", leather, [0, 0.97, -0.175], [0.43, 0.65, 0.06])];
  for (const x of [-0.23, 0.23]) for (const y of [0.65, 1.28]) parts.push(part("黄铜铆钉", "sphere", brass, [x, y, -0.18], [0.04, 0.04, 0.04]));
  return make("steamRivetedChair", "铆钉皮革高背椅", "蒸汽朋克", "家具", parts);
}

function gearSofa() {
  return make("steamGearSofa", "齿轮扶手沙发", "蒸汽朋克", "家具", [...legs(1.8, 0.65, 0.15, brass), part("皮革沙发座", "box", leather, [0, 0.39, 0], [2.1, 0.35, 0.85]), part("皮革沙发背", "box", leather, [0, 0.84, -0.34], [2.1, 0.8, 0.23]), ...[-1.08, 1.08].map(x => part("齿轮式扶手", "torus", brass, [x, 0.62, 0], [0.7, 0.7, 0.25], [0, 90, 0])), ...gear("沙发机械装饰", [0, 0.86, -0.19], 0.22)]);
}

function brassBed() {
  const parts = [part("床架", "box", iron, [0, 0.39, 0], [1.7, 0.16, 2.2]), part("床垫", "box", cream, [0, 0.57, 0], [1.6, 0.21, 2.1]), part("床褥", "box", "#967467", [0, 0.72, 0.3], [1.62, 0.08, 1.5])];
  for (const x of [-0.82, 0.82]) for (const z of [-1.04, 1.04]) { parts.push(part("黄铜床柱", "cylinder", brass, [x, 1.12, z], [0.06, 2.24, 0.06])); parts.push(part("床柱球饰", "sphere", brass, [x, 2.3, z], [0.13, 0.13, 0.13])); }
  for (const z of [-1.04, 1.04]) parts.push(part("床架横梁", "cylinder", brass, [0, z < 0 ? 1.05 : 0.7, z], [0.05, 1.64, 0.05], [0, 0, 90]));
  return make("steamBrassBed", "黄铜管四柱床", "蒸汽朋克", "家具", parts);
}

function instrumentCabinet() {
  const parts = [part("仪表柜橱主体", "box", leather, [0, 1, 0], [1.35, 2, 0.6]), part("柜橱铜顶檐", "box", brass, [0, 2.06, 0], [1.48, 0.12, 0.71])];
  for (const x of [-0.34, 0.34]) { parts.push(part("下层柜门", "box", copper, [x, 0.55, 0.33], [0.6, 0.85, 0.06])); parts.push(...gauge([x, 1.56, 0.34], 0.34)); }
  parts.push(pipe("柜橱外接气管", brass, [[-0.73, 0.2, 0], [-0.73, 1.85, 0], [-0.4, 2.1, 0]], 0.04));
  return make("steamInstrumentCabinet", "仪表双门柜橱", "蒸汽朋克", "家具", parts);
}

function trunkTable() {
  const parts = [part("旅行箱桌体", "box", leather, [0, 0.28, 0], [1.25, 0.48, 0.7]), part("桌面硬盖", "box", copper, [0, 0.54, 0], [1.29, 0.07, 0.74]), ...legs(1.05, 0.49, 0.08, brass, 0.06)];
  for (const x of [-0.42, 0.42]) { parts.push(part("旅行箱铜带", "box", brass, [x, 0.3, 0.365], [0.07, 0.48, 0.04])); parts.push(part("旅行箱搭扣", "box", iron, [x, 0.45, 0.4], [0.11, 0.12, 0.035])); }
  parts.push(part("皮箱提手", "torus", brass, [0, 0.27, 0.39], [0.27, 0.13, 0.08]));
  return make("steamTrunkTable", "旅行箱咖啡桌", "蒸汽朋克", "家具", parts);
}

function gasLamp() {
  return make("steamGasLamp", "双头煤气路灯", "蒸汽朋克", "灯具", [part("路灯底座", "cylinder", iron, [0, 0.12, 0], [0.55, 0.24, 0.55]), part("煤气立管", "cylinder", copper, [0, 1.8, 0], [0.1, 3.5, 0.1]), pipe("双头煤气弯臂", brass, [[-0.8, 3, 0], [-0.8, 3.6, 0], [0, 3.75, 0], [0.8, 3.6, 0], [0.8, 3, 0]], 0.04), ...[-0.8, 0.8].flatMap(x => [part("灯室", "cylinder", cream, [x, 2.95, 0], [0.37, 0.6, 0.37], [0, 0, 0], { opacity: 0.72, emissive: "#d6b16c", emissiveIntensity: 0.7 }), part("灯帽", "cone", brass, [x, 3.33, 0], [0.6, 0.2, 0.6]), part("灯室底盘", "cylinder", iron, [x, 2.61, 0], [0.48, 0.08, 0.48])])]);
}

function gearDeskLamp() {
  return make("steamGearDeskLamp", "齿轮关节台灯", "蒸汽朋克", "灯具", [part("台灯底盘", "cylinder", copper, [0, 0.045, 0], [0.42, 0.09, 0.42]), beam("下灯臂", brass, [0, 0.09, 0], [-0.18, 0.4, 0], 0.045), beam("上灯臂", brass, [-0.18, 0.4, 0], [0.12, 0.67, 0], 0.04), ...gear("台灯关节齿", [-0.18, 0.4, 0], 0.1, 8), part("台灯灯罩", "cone", copper, [0.2, 0.65, 0], [0.32, 0.22, 0.32], [0, 0, -35]), part("台灯灯泡", "sphere", cream, [0.25, 0.57, 0], [0.13, 0.13, 0.13], [0, 0, 0], { emissive: "#d4b278", emissiveIntensity: 0.8 })]);
}

function pipeChandelier() {
  const parts = [part("吊灯顶盘", "cylinder", iron, [0, 1.5, 0], [0.24, 0.09, 0.24]), part("吊灯垂直管", "cylinder", copper, [0, 0.95, 0], [0.06, 1.1, 0.06]), ring("吊灯主铜环", brass, 0.75, 0.06, 0.45, 0.08)];
  for (let index = 0; index < 5; index++) { const angle = index * Math.PI * 2 / 5, x = Math.cos(angle) * 0.67, z = Math.sin(angle) * 0.67; parts.push(beam("吊灯铜辐条", copper, [0, 0.45, 0], [x, 0.45, z], 0.04)); parts.push(part("吊灯玻璃灯管", "capsule", cream, [x, 0.25, z], [0.17, 0.4, 0.17], [0, 0, 0], { emissive: "#d8b46f", emissiveIntensity: 0.8 })); }
  return make("steamPipeChandelier", "五臂铜管吊灯", "蒸汽朋克", "灯具", parts);
}

function bulkheadLamp() {
  const parts = [part("舱壁灯底板", "box", iron, [0, 0.36, -0.09], [0.55, 0.72, 0.12]), part("舱壁灯玻璃罩", "sphere", cream, [0, 0.36, 0.02], [0.47, 0.61, 0.29], [0, 0, 0], { opacity: 0.68, emissive: "#d2a86a", emissiveIntensity: 0.7 })];
  for (const x of [-0.15, 0, 0.15]) parts.push(part("防爆护格", "box", brass, [x, 0.36, 0.17], [0.025, 0.57, 0.025]));
  parts.push(part("护格横梁", "box", brass, [0, 0.36, 0.18], [0.47, 0.025, 0.025]));
  return make("steamBulkheadLamp", "压力舱防爆壁灯", "蒸汽朋克", "灯具", parts);
}

function minerLantern() {
  const parts = [part("矿灯油罐", "cylinder", copper, [0, 0.09, 0], [0.28, 0.18, 0.28]), part("矿灯玻璃室", "cylinder", cream, [0, 0.32, 0], [0.2, 0.32, 0.2], [0, 0, 0], { opacity: 0.65, emissive: "#d6ac65", emissiveIntensity: 0.75 }), part("矿灯顶帽", "cone", iron, [0, 0.55, 0], [0.35, 0.14, 0.35]), part("矿灯提环", "torus", brass, [0, 0.73, 0], [0.29, 0.29, 0.1])];
  for (const x of [-0.12, 0.12]) parts.push(part("矿灯护杆", "cylinder", iron, [x, 0.32, 0], [0.025, 0.48, 0.025]));
  return make("steamMinerLantern", "铜壳矿工提灯", "蒸汽朋克", "灯具", parts);
}

function gearComputer() {
  const parts = [part("计算机木底座", "box", leather, [0, 0.12, 0], [1.1, 0.24, 0.65]), part("机械运算箱", "box", copper, [0, 0.48, -0.12], [1, 0.65, 0.35]), ...gear("大运算齿", [-0.25, 0.5, 0.085], 0.28, 10), ...gear("小运算齿", [0.24, 0.56, 0.09], 0.2, 8)];
  for (let index = 0; index < 8; index++) parts.push(part("运算输入键", "cylinder", cream, [-0.4 + index * 0.115, 0.28, 0.18], [0.075, 0.08, 0.075]));
  parts.push(part("纸带输出卷", "cylinder", cream, [0.38, 0.88, -0.1], [0.22, 0.3, 0.22], [0, 0, 90]));
  return make("steamGearComputer", "齿轮差分计算机", "蒸汽朋克", "器物", parts);
}

function divingHelmet() {
  return make("steamDivingHelmet", "黄铜潜水头盔", "蒸汽朋克", "器物", [part("头盔球壳", "sphere", copper, [0, 0.39, 0], [0.62, 0.65, 0.62], [0, 0, 0], { metalness: 0.6 }), part("头盔肩座", "cylinder", brass, [0, 0.08, 0], [0.85, 0.16, 0.7]), part("正面视窗铜圈", "torus", brass, [0, 0.43, 0.3], [0.34, 0.34, 0.25]), part("正面视窗玻璃", "cylinder", "#456d79", [0, 0.43, 0.33], [0.22, 0.03, 0.22], [90, 0, 0]), ...[-0.31, 0.31].map(x => part("侧视窗", "cylinder", brass, [x, 0.43, 0], [0.22, 0.07, 0.22], [0, 0, 90])), pipe("供气接管", brass, [[0.22, 0.23, -0.18], [0.4, 0.23, -0.25], [0.4, 0.4, -0.25]], 0.035)]);
}

function brassTelescope() {
  return make("steamBrassTelescope", "三脚铜制望远镜", "蒸汽朋克", "器物", [part("主镜筒", "cylinder", brass, [0, 1.24, 0], [0.22, 1.2, 0.22], [65, 0, 0]), part("主镜透镜", "cylinder", "#4e7e8b", [0, 1.5, 0.56], [0.23, 0.025, 0.23], [65, 0, 0]), part("调焦目镜", "cylinder", iron, [0, 0.96, -0.58], [0.08, 0.25, 0.08], [65, 0, 0]), ...Array.from({ length: 3 }, (_, index) => { const angle = index * Math.PI * 2 / 3; return beam("望远镜脚架", leather, [0, 1.1, 0], [Math.cos(angle) * 0.55, 0.035, Math.sin(angle) * 0.55], 0.055); }), ...gear("俯仰调节齿", [0.15, 1.13, 0], 0.15)]);
}

function typewriter() {
  const parts = [part("打字机机座", "box", iron, [0, 0.12, 0], [0.62, 0.24, 0.48]), part("键盘斜面", "box", copper, [0, 0.24, 0.1], [0.58, 0.08, 0.3], [-12, 0, 0]), part("纸张滚筒", "cylinder", iron, [0, 0.39, -0.12], [0.13, 0.62, 0.13], [0, 0, 90]), part("纸张", "box", cream, [0, 0.55, -0.17], [0.34, 0.38, 0.015]), part("回车推杆", "box", brass, [-0.35, 0.43, -0.04], [0.22, 0.035, 0.04])];
  for (let row = 0; row < 3; row++) for (let index = 0; index < 8; index++) parts.push(part("圆形打字键", "cylinder", cream, [-0.23 + index * 0.065, 0.3 + row * 0.01, 0.21 - row * 0.08], [0.04, 0.025, 0.04]));
  return make("steamTypewriter", "黄铜机械打字机", "蒸汽朋克", "器物", parts);
}

function clockworkClock() {
  return make("steamClockworkClock", "裸齿发条座钟", "蒸汽朋克", "器物", [part("座钟底盘", "box", leather, [0, 0.045, 0], [0.75, 0.09, 0.28]), ...gear("座钟大齿轮", [-0.14, 0.45, 0], 0.31, 12), ...gear("座钟副齿轮", [0.25, 0.34, 0], 0.17), part("座钟长针", "box", iron, [-0.14, 0.58, 0.14], [0.02, 0.32, 0.02]), part("座钟短针", "box", iron, [-0.03, 0.45, 0.14], [0.25, 0.025, 0.02], [0, 0, 20]), part("座钟发条摇把", "box", brass, [0.41, 0.27, 0], [0.07, 0.2, 0.04])]);
}

function mechanicalBirdcage() {
  const parts = [part("鸟笼圆底", "cylinder", leather, [0, 0.05, 0], [0.72, 0.1, 0.72]), dome("铜丝鸟笼顶", brass, [0, 0.72, 0], 0.35, 0.3), part("鸟笼挂环", "torus", brass, [0, 1.18, 0], [0.18, 0.18, 0.1]), part("机械鸟身", "sphere", copper, [0, 0.43, 0], [0.23, 0.18, 0.35]), part("机械鸟头", "sphere", brass, [0, 0.55, 0.15], [0.14, 0.14, 0.14]), part("机械鸟尾", "box", iron, [0, 0.42, -0.23], [0.18, 0.025, 0.19], [18, 0, 0])];
  for (let index = 0; index < 10; index++) { const angle = index * Math.PI / 5; parts.push(part("铜丝鸟笼柱", "cylinder", brass, [Math.cos(angle) * 0.33, 0.39, Math.sin(angle) * 0.33], [0.012, 0.68, 0.012])); }
  return make("steamMechanicalBirdcage", "发条机械鸟笼", "蒸汽朋克", "器物", parts);
}

function industrialBoiler() {
  const parts = [part("锅炉底台", "box", iron, [0, 0.13, 0], [1.8, 0.26, 1.55]), part("立式蒸汽罐", "cylinder", copper, [0, 1.55, 0], [1.25, 2.65, 1.25]), dome("锅炉封头", copper, [0, 2.87, 0], 0.625), part("燃烧室门", "cylinder", iron, [0, 0.74, 0.65], [0.65, 0.1, 0.65], [90, 0, 0]), ...gauge([0, 2.2, 0.65], 0.37), pipe("锅炉出汽管", brass, [[0, 3.45, 0], [0, 3.8, 0], [1.1, 3.8, 0], [1.1, 2.2, 0]], 0.09)];
  for (const y of [0.55, 2.6]) parts.push(ring("锅炉加强箍", iron, 0.66, 0.04, y, 0.12));
  return make("steamIndustrialBoiler", "工业立式蒸汽锅炉", "蒸汽朋克", "设施", parts);
}

function pneumaticLift() {
  const parts = [part("升降台底座", "box", iron, [0, 0.1, 0], [2.4, 0.2, 2]), part("气动载货平台", "box", copper, [0, 1.35, 0], [2.2, 0.16, 1.8])];
  for (const x of [-0.85, 0.85]) { parts.push(part("气动缸筒", "cylinder", iron, [x, 0.4, 0], [0.25, 0.6, 0.25])); parts.push(part("升降活塞杆", "cylinder", brass, [x, 0.95, 0], [0.11, 0.8, 0.11])); }
  parts.push(pipe("气动分压管", brass, [[-0.85, 0.3, 0.5], [0, 0.3, 0.7], [0.85, 0.3, 0.5]], 0.04), part("平台货箱", "box", leather, [0, 1.72, 0], [1.1, 0.6, 1]), ...gauge([0.95, 0.5, 0.7], 0.23));
  return make("steamPneumaticLift", "气动货运升降台", "蒸汽朋克", "设施", parts);
}

function pumpWaterTower() {
  const parts = [...legs(1.8, 1.8, 3.5, iron, 0.13), part("水塔水罐", "cylinder", copper, [0, 4.35, 0], [2.8, 1.7, 2.8]), part("水罐锥顶", "cone", iron, [0, 5.45, 0], [3, 0.55, 3]), pipe("水塔供水立管", brass, [[1.1, 0.2, 0.6], [1.1, 2.6, 0.6], [1.1, 4, 0]], 0.09), part("地面泵机", "cylinder", copper, [0.5, 0.55, 0.5], [0.6, 1.2, 0.6], [90, 0, 0])];
  for (const x of [-0.9, 0.9]) parts.push(beam("水塔交叉撑", iron, [x, 0.2, -0.9], [-x, 3.4, -0.9], 0.06));
  return make("steamPumpWaterTower", "铜罐水塔泵站", "蒸汽朋克", "设施", parts);
}

function gearTransmission() {
  return make("steamGearTransmission", "大型齿轮传动机构", "蒸汽朋克", "设施", [part("传动底座", "box", iron, [0, 0.1, 0], [2.7, 0.2, 0.9]), part("传动支架", "box", iron, [0, 0.8, -0.14], [2.3, 1.3, 0.12]), ...gear("输入齿轮", [-0.7, 0.85, 0], 0.52, 12), ...gear("中央齿轮", [0.27, 0.85, 0], 0.46, 10), ...gear("输出齿轮", [0.91, 1.1, 0], 0.25, 8), part("输出曲柄", "box", copper, [0.91, 0.95, 0.2], [0.07, 0.34, 0.07])]);
}

function steamTicketMachine() {
  return make("steamTicketMachine", "蒸汽车票售票机", "蒸汽朋克", "设施", [part("售票机脚座", "box", iron, [0, 0.1, 0], [0.9, 0.2, 0.7]), part("售票机铜柜", "box", copper, [0, 0.95, 0], [0.72, 1.6, 0.55]), ...gauge([0, 1.42, 0.31], 0.38), part("投币槽", "box", iron, [0.19, 1.1, 0.31], [0.07, 0.025, 0.025]), part("出票口", "box", iron, [0, 0.58, 0.31], [0.38, 0.07, 0.025]), part("纸票", "box", cream, [0, 0.54, 0.39], [0.19, 0.13, 0.02]), ...gear("售票选择轮", [-0.18, 0.95, 0.32], 0.14), pipe("售票供汽管", brass, [[-0.4, 0.2, 0], [-0.4, 1.65, 0], [-0.15, 1.8, 0]], 0.03)]);
}

function copperBotanicalTree() {
  const parts = [part("生态树根座", "cylinder", copper, [0, 0.15, 0], [1.1, 0.3, 1.1]), part("树干供养管", "cylinder", brass, [0, 1.35, 0], [0.18, 2.4, 0.18])];
  for (let index = 0; index < 7; index++) { const angle = index * Math.PI * 2 / 7, x = Math.cos(angle) * 0.9, z = Math.sin(angle) * 0.9, y = 1.9 + index % 2 * 0.45; parts.push(beam("铜管树枝", copper, [0, 1.3, 0], [x, y, z], 0.07)); parts.push(part("生态叶冠", "sphere", index % 2 ? "#81906b" : green, [x, y + 0.15, z], [1, 0.8, 0.9])); }
  return make("steamCopperBotanicalTree", "铜管生态树", "蒸汽朋克", "植物", parts);
}

function mossGlobe() {
  return make("steamMossGlobe", "玻璃球苔藓台", "蒸汽朋克", "植物", [part("苔藓台底座", "lathe", brass, [0, 0, 0], [1, 1, 1], [0, 0, 0], { profile: [{ x: 0.35, y: 0 }, { x: 0.3, y: 0.14 }, { x: 0.18, y: 0.5 }, { x: 0.42, y: 0.61 }] }), part("玻璃生态球", "sphere", glass, [0, 1.03, 0], [1.05, 1.05, 1.05], [0, 0, 0], { opacity: 0.22, roughness: 0.12 }), part("球内苔藓丘", "sphere", "#769069", [0, 0.83, 0], [0.75, 0.32, 0.7]), part("球内石块", "sphere", "#96917c", [-0.19, 0.95, 0], [0.25, 0.3, 0.23]), pipe("养护喷气嘴", copper, [[0.36, 0.5, 0], [0.58, 0.75, 0], [0.4, 1.15, 0]], 0.025)]);
}

function fernChamber() {
  const parts = [part("蕨舱底座", "cylinder", iron, [0, 0.12, 0], [1, 0.24, 1]), part("蕨舱玻璃筒", "cylinder", glass, [0, 0.83, 0], [0.84, 1.22, 0.84], [0, 0, 0], { opacity: 0.22, roughness: 0.14 }), dome("蕨舱封顶", copper, [0, 1.44, 0], 0.46), ...gauge([0, 0.28, 0.52], 0.2)];
  for (let index = 0; index < 6; index++) { const a = index * Math.PI / 3; parts.push(beam("蕨叶中脉", green, [0, 0.25, 0], [Math.cos(a) * 0.3, 1.1, Math.sin(a) * 0.3], 0.018)); parts.push(part("蕨类长叶", "sphere", "#879c70", [Math.cos(a) * 0.2, 0.9, Math.sin(a) * 0.2], [0.18, 0.6, 0.08], [0, -index * 60, 18])); }
  return make("steamFernChamber", "气压蕨类培育舱", "蒸汽朋克", "植物", parts);
}

function clockworkRose() {
  const parts = [part("机械花盆", "lathe", iron, [0, 0, 0], [1, 1, 1], [0, 0, 0], { profile: [{ x: 0.17, y: 0 }, { x: 0.24, y: 0.3 }, { x: 0.2, y: 0.33 }, { x: 0.14, y: 0.05 }] }), part("铜管玫瑰茎", "cylinder", brass, [0, 0.7, 0], [0.025, 0.82, 0.025]), ...gear("花盆发条齿", [0, 0.18, 0.22], 0.12)];
  for (let index = 0; index < 7; index++) { const a = index * Math.PI * 2 / 7; parts.push(part("铜片玫瑰花瓣", "sphere", index % 2 ? copper : brass, [Math.cos(a) * 0.11, 1.14, Math.sin(a) * 0.11], [0.22, 0.13, 0.15], [20, index * 360 / 7, 0])); }
  for (const side of [-1, 1]) parts.push(part("机械玫瑰叶", "sphere", "#729077", [side * 0.11, 0.7, 0], [0.24, 0.065, 0.1], [0, 0, side * 30]));
  return make("steamClockworkRose", "发条花园玫瑰", "蒸汽朋克", "植物", parts);
}

const steamAssets = [
  steamClockTower(), boilerFactory(), steamStation(), gearWorkshop(), airshipDock(), mechanicalGreenhouse(), brassObservatory(), steamTownhouse(),
  steamCar(), steamLocomotive(), steamMonorail(), brassAirship(), gyrocraft(), steamTrike(),
  pipeDesk(), rivetedChair(), gearSofa(), brassBed(), instrumentCabinet(), trunkTable(),
  gasLamp(), gearDeskLamp(), pipeChandelier(), bulkheadLamp(), minerLantern(),
  gearComputer(), divingHelmet(), brassTelescope(), typewriter(), clockworkClock(), mechanicalBirdcage(),
  industrialBoiler(), pneumaticLift(), pumpWaterTower(), gearTransmission(), steamTicketMachine(),
  copperBotanicalTree(), mossGlobe(), fernChamber(), clockworkRose(),
];

function neonArcade() {
  const parts = [part("街机厅建筑", "box", shell, [0, 1.7, 0], [6, 3.4, 4.5]), part("街机厅平顶", "box", black, [0, 3.48, 0], [6.3, 0.16, 4.8]), part("厅前玻璃门", "box", glass, [0, 1.3, 2.29], [1.5, 2.6, 0.05], [0, 0, 0], { opacity: 0.55 }), glow("霓虹门楣", pink, [0, 3.03, 2.4], [5.5, 0.24, 0.08]), glow("屋顶光带", cyan, [0, 3.62, 2.36], [6, 0.08, 0.08])];
  for (const x of [-2, 2]) { parts.push(part("街机外壳", "box", black, [x, 0.95, 2.8], [0.75, 1.9, 0.7])); parts.push(glow("街机游戏屏", cyan, [x, 1.35, 3.17], [0.58, 0.65, 0.025])); parts.push(part("街机操作台", "box", steel, [x, 0.97, 3.25], [0.7, 0.1, 0.33])); }
  return make("cyberNeonArcade", "霓虹街机厅", "赛博朋克", "建筑", parts);
}

function capsuleHotel() {
  const parts = [part("胶囊旅馆塔体", "box", shell, [0, 5, 0], [5, 10, 4]), part("旅馆入口", "box", black, [0, 1.15, 2.05], [1.5, 2.3, 0.08]), glow("旅馆竖向招牌", pink, [2.65, 5.7, 1.8], [0.38, 6.8, 0.18]), part("屋顶机柜", "box", steel, [0, 10.4, -0.6], [2.4, 0.8, 1.7])];
  for (let floor = 0; floor < 3; floor++) for (const x of [-1.55, 0, 1.55]) { const y = 3.2 + floor * 2.4; parts.push(part("外挑胶囊舱", "capsule", steel, [x, y, 2.15], [1.1, 1.4, 1.1], [90, 0, 0])); parts.push(part("胶囊观察窗", "cylinder", glass, [x, y, 2.89], [0.77, 0.04, 0.77], [90, 0, 0], { opacity: 0.5 })); parts.push(glow("舱号灯条", cyan, [x, y + 0.45, 2.76], [0.5, 0.045, 0.04])); }
  return make("cyberCapsuleHotel", "胶囊旅馆塔", "赛博朋克", "建筑", parts);
}

function ramenKiosk() {
  const parts = [part("拉面铺台座", "box", black, [0, 0.1, 0], [3.8, 0.2, 2.5]), part("后厨墙", "box", shell, [0, 1.3, -0.75], [3.5, 2.5, 0.8]), part("拉面吧台", "box", steel, [0, 1.05, 0.8], [3.5, 0.17, 0.65]), part("店铺顶棚", "box", black, [0, 2.75, 0], [4, 0.17, 2.8]), glow("拉面店霓虹牌", pink, [0, 2.59, 1.43], [2.2, 0.45, 0.06]), ...legs(3.3, 2, 2.7, shell, 0.08)];
  for (const x of [-1.1, 0, 1.1]) { parts.push(part("吧凳立杆", "cylinder", steel, [x, 0.43, 1.55], [0.05, 0.86, 0.05])); parts.push(part("吧凳坐垫", "cylinder", leather, [x, 0.9, 1.55], [0.39, 0.08, 0.39])); parts.push(part("餐碗", "lathe", cream, [x, 1.14, 0.81], [1, 1, 1], [0, 0, 0], { profile: [{ x: 0.04, y: 0 }, { x: 0.14, y: 0.1 }, { x: 0.16, y: 0.16 }, { x: 0.14, y: 0.17 }, { x: 0.1, y: 0.07 }, { x: 0, y: 0.03 }] })); }
  return make("cyberRamenKiosk", "霓虹拉面街铺", "赛博朋克", "建筑", parts);
}

function dataRelayStation() {
  const parts = [part("中继站主楼", "box", shell, [0, 2.5, 0], [4.5, 5, 4]), part("屋顶散热模块", "box", steel, [0, 5.35, 0], [3.2, 0.7, 2.9]), part("中继主天线", "cylinder", steel, [0, 6.3, 0], [0.08, 1.5, 0.08]), part("天线阵列一", "box", steel, [0, 6.5, 0], [2, 0.08, 0.08]), part("天线阵列二", "box", steel, [0, 6, 0], [1.5, 0.08, 0.08]), glow("数据入口灯", cyan, [0, 1.6, 2.04], [1.2, 2.2, 0.025])];
  for (const x of [-1.4, 1.4]) parts.push(...fan("中继散热风机", [x, 3.65, 2.12], 0.62));
  return make("cyberDataRelayStation", "数据中继站", "赛博朋克", "建筑", parts);
}

function skybridgeStation() {
  const parts = [part("连桥行走平台", "box", steel, [0, 4, 0], [8.2, 0.26, 2.6]), part("连桥顶棚", "box", shell, [0, 6.12, 0], [8.4, 0.16, 2.8])];
  for (const x of [-3.6, 3.6]) { parts.push(part("桥头电梯塔", "box", shell, [x, 2.6, 0], [1.6, 5.2, 2.9])); parts.push(glow("电梯门光框", cyan, [x, 1.4, 1.49], [1, 2.4, 0.025])); }
  for (const z of [-1.25, 1.25]) { parts.push(part("连桥玻璃侧墙", "box", glass, [0, 5.1, z], [5.4, 1.9, 0.045], [0, 0, 0], { opacity: 0.32 })); parts.push(glow("桥侧引导光带", pink, [0, 4.35, z * 1.02], [7.8, 0.06, 0.04])); }
  return make("cyberSkybridgeStation", "空中连桥电梯站", "赛博朋克", "建筑", parts);
}

function cyberClinic() {
  return make("cyberRooftopClinic", "义体改装诊所", "赛博朋克", "建筑", [part("诊所模块外壳", "box", "#879999", [0, 1.5, 0], [4.2, 3, 3.4]), part("诊所自动门", "box", black, [-0.75, 1.2, 1.74], [1.2, 2.4, 0.06]), part("医疗观察窗", "box", glass, [1.1, 1.6, 1.74], [1.3, 1.4, 0.05]), glow("医疗标识竖画", cyan, [0.85, 2.83, 1.81], [0.14, 0.45, 0.04]), glow("医疗标识横画", cyan, [0.85, 2.83, 1.82], [0.45, 0.14, 0.04]), part("屋顶净化设备", "box", shell, [0.8, 3.33, -0.4], [1.6, 0.65, 1.2]), pipe("诊所管线", steel, [[-2.18, 0.3, 1], [-2.18, 2.7, 1], [-1.8, 3.4, -0.4]], 0.07), glow("诊所门楣", pink, [-0.75, 2.53, 1.8], [1.4, 0.08, 0.04])]);
}

function maglevTransitHub() {
  const parts = [part("磁悬浮站台", "box", steel, [0, 0.55, 0], [10, 1.1, 4]), part("悬浮站棚", "capsule", shell, [0, 4, 0], [4, 10, 0.4], [0, 0, 90]), glow("站棚侧面灯带", cyan, [0, 3.98, 2], [9.5, 0.1, 0.06])];
  for (const x of [-3.5, 3.5]) for (const z of [-1.4, 1.4]) parts.push(beam("V形站棚撑", steel, [x, 1, 0], [x, 3.9, z], 0.12));
  for (const z of [-2.65, 2.65]) { parts.push(part("磁悬浮导向梁", "box", shell, [0, 0.65, z], [11, 0.4, 0.32])); parts.push(glow("轨道能量带", pink, [0, 0.89, z], [10.8, 0.05, 0.18])); }
  return make("cyberMaglevTransitHub", "磁悬浮车站", "赛博朋克", "建筑", parts);
}

function verticalFarm() {
  const parts = [part("垂直农场底台", "box", shell, [0, 0.15, 0], [3.8, 0.3, 3]), ...legs(3.2, 2.4, 6.2, steel, 0.11), part("农场玻璃围护", "box", glass, [0, 3.2, -1.2], [3.2, 5.8, 0.04], [0, 0, 0], { opacity: 0.2 })];
  for (let level = 0; level < 5; level++) { const y = 0.45 + level * 1.15; parts.push(part("水培种植层", "box", shell, [0, y, 0], [3.3, 0.16, 2.4])); parts.push(glow("植物补光条", pink, [0, y + 0.84, 0], [2.9, 0.04, 0.08])); for (const x of [-0.9, 0, 0.9]) parts.push(part("层架绿植", "sphere", green, [x, y + 0.28, 0], [0.7, 0.45, 1.65])); }
  return make("cyberVerticalFarm", "垂直农场楼", "赛博朋克", "建筑", parts);
}

function hoverTaxi() {
  const parts = [part("出租车悬浮底盘", "box", shell, [0, 0.42, 0], [1.95, 0.32, 4.2]), part("出租车舱体", "capsule", "#a1976a", [0, 0.96, 0], [1.78, 3.5, 1.45], [90, 0, 0]), part("全景风挡", "sphere", glass, [0, 1.24, 0.55], [1.55, 0.75, 2.1], [0, 0, 0], { opacity: 0.36 }), glow("出租车顶灯", pink, [0, 1.7, 0], [0.55, 0.16, 0.2]), glow("车头灯带", cyan, [0, 0.78, 2.02], [1.4, 0.07, 0.05])];
  for (const x of [-0.92, 0.92]) for (const z of [-1.35, 1.35]) { parts.push(part("悬浮发动机", "cylinder", steel, [x, 0.24, z], [0.57, 0.22, 0.57])); parts.push(part("离子喷口", "cylinder", cyan, [x, 0.12, z], [0.4, 0.04, 0.4], [0, 0, 0], { emissive: cyan, emissiveIntensity: 0.85 })); }
  return make("cyberHoverTaxi", "悬浮出租车", "赛博朋克", "交通", parts);
}

function cyberMotorcycle() {
  const parts = [part("摩托主车体", "capsule", shell, [0, 0.72, 0], [0.56, 1.35, 0.64], [90, 0, 0]), part("摩托座垫", "box", black, [0, 1.02, -0.15], [0.42, 0.12, 0.78]), part("前转向把", "cylinder", steel, [0, 1.28, 0.69], [0.04, 0.7, 0.04], [0, 0, 90]), beam("前叉", steel, [0, 1.1, 0.62], [0, 0.51, 1], 0.075)];
  for (const z of [-0.95, 1]) { parts.push(part("无辐轮胎", "torus", black, [0, 0.51, z], [1, 1, 0.5], [0, 90, 0])); parts.push(part("轮内灯圈", "torus", cyan, [0.11, 0.51, z], [0.71, 0.71, 0.08], [0, 90, 0], { emissive: cyan, emissiveIntensity: 0.65 })); }
  parts.push(glow("摩托头灯", pink, [0, 0.98, 0.94], [0.3, 0.08, 0.05]));
  return make("cyberMotorcycle", "无辐轮赛博摩托", "赛博朋克", "交通", parts);
}

function horizontalRotor(center: Triple, radius: number): ModelPart[] {
  const [x, y, z] = center;
  const guard = ring("旋翼保护环", steel, radius, 0.035, y, 0.06);
  guard.position.x = x; guard.position.z = z;
  const parts = [guard, part("旋翼电机", "cylinder", shell, center, [0.13, 0.16, 0.13])];
  for (let index = 0; index < 3; index++) parts.push(part("旋翼桨叶", "box", black, center, [radius * 1.7, 0.025, radius * 0.13], [0, index * 60, 0]));
  return parts;
}

function deliveryDrone() {
  const parts = [part("配送机主壳", "box", shell, [0, 0.68, 0], [0.75, 0.25, 0.75]), part("吊挂配送货箱", "box", "#a3b9ad", [0, 0.3, 0], [0.58, 0.5, 0.58]), glow("无人机识别灯", cyan, [0, 0.72, 0.39], [0.42, 0.045, 0.025])];
  for (const x of [-0.75, 0.75]) for (const z of [-0.75, 0.75]) { parts.push(beam("旋翼支臂", steel, [0, 0.7, 0], [x, 0.7, z], 0.055)); parts.push(...horizontalRotor([x, 0.77, z], 0.4)); }
  return make("cyberDeliveryDrone", "四旋翼配送无人机", "赛博朋克", "交通", parts);
}

function patrolDrone() {
  return make("cyberPatrolDrone", "球形巡逻无人机", "赛博朋克", "交通", [part("球形无人机壳", "sphere", steel, [0, 0.85, 0], [1.15, 1.15, 1.15]), part("前置光学镜头", "cylinder", black, [0, 0.86, 0.58], [0.41, 0.12, 0.41], [90, 0, 0]), part("扫描镜片", "cylinder", pink, [0, 0.86, 0.66], [0.25, 0.025, 0.25], [90, 0, 0], { emissive: pink, emissiveIntensity: 0.75 }), ...fan("巡逻推进器", [-0.83, 0.83, 0], 0.43), ...fan("巡逻推进器", [0.83, 0.83, 0], 0.43), part("通讯天线", "cylinder", shell, [0, 1.62, 0], [0.025, 0.5, 0.025])]);
}

function maglevCarriage() {
  const parts = [part("悬浮车厢主体", "capsule", "#78929c", [0, 1.2, 0], [2.4, 7.2, 2.1], [90, 0, 0]), part("车厢底座", "box", shell, [0, 0.35, 0], [2.2, 0.28, 6.7]), part("车头观察窗", "sphere", glass, [0, 1.43, 3.12], [1.9, 1.1, 1.25], [0, 0, 0], { opacity: 0.35 })];
  for (const side of [-1, 1]) { parts.push(glow("车身悬浮灯带", cyan, [side * 1.12, 0.53, 0], [0.04, 0.1, 6.5])); for (let index = 0; index < 5; index++) parts.push(part("车厢侧窗", "box", glass, [side * 1.16, 1.45, -2.5 + index * 1.15], [0.04, 0.68, 0.88])); }
  return make("cyberMaglevCarriage", "磁悬浮列车车厢", "赛博朋克", "交通", parts);
}

function autonomousVan() {
  const parts = [part("配送车底盘", "box", shell, [0, 0.4, 0], [1.65, 0.27, 3.3]), part("无驾驶舱货体", "box", "#94a8a6", [0, 1.12, 0], [1.6, 1.3, 3.2]), ...roadWheels(0.79, 0.3, [-1.05, 1.05], 0.29, false), part("车顶激光雷达", "cylinder", black, [0, 1.9, 0.7], [0.22, 0.25, 0.22]), glow("前端状态灯", cyan, [0, 1.2, 1.64], [1.15, 0.08, 0.04])];
  for (const x of [-0.82, 0.82]) for (let index = 0; index < 3; index++) parts.push(part("配送独立柜门", "box", steel, [x, 1.1, -0.95 + index * 0.95], [0.04, 1.1, 0.84]));
  return make("cyberAutonomousVan", "无人自动配送车", "赛博朋克", "交通", parts);
}

function holoDesk() {
  return make("cyberHoloDesk", "全息交互办公桌", "赛博朋克", "家具", [part("交互桌左基座", "box", shell, [-0.58, 0.36, 0], [0.22, 0.72, 0.65]), part("交互桌右基座", "box", shell, [0.58, 0.36, 0], [0.22, 0.72, 0.65]), part("透明交互桌面", "box", glass, [0, 0.77, 0], [1.55, 0.065, 0.8], [0, 0, 0], { opacity: 0.5, roughness: 0.15 }), glow("桌面输入光条", cyan, [0, 0.812, 0.22], [1.2, 0.014, 0.12]), part("悬浮信息板", "box", cyan, [0, 1.2, -0.2], [1.12, 0.62, 0.018], [-12, 0, 0], { opacity: 0.28, emissive: cyan, emissiveIntensity: 0.45 }), glow("信息板顶边", pink, [0, 1.5, -0.14], [1.14, 0.025, 0.022], [-12, 0, 0])]);
}

function gamingChair() {
  const parts = [part("竞技椅座垫", "box", black, [0, 0.54, 0], [0.62, 0.14, 0.58]), part("竞技椅主靠背", "box", shell, [0, 1, -0.24], [0.48, 0.87, 0.13], [-12, 0, 0]), part("竞技椅头枕", "box", black, [0, 1.5, -0.32], [0.38, 0.2, 0.14]), part("座椅升降气杆", "cylinder", steel, [0, 0.3, 0], [0.07, 0.44, 0.07])];
  for (const side of [-1, 1]) { parts.push(part("包裹式靠背侧翼", "box", steel, [side * 0.28, 1.06, -0.18], [0.15, 0.75, 0.21], [0, side * 18, -side * 8])); parts.push(glow("靠背侧翼灯带", cyan, [side * 0.3, 1.07, -0.05], [0.027, 0.55, 0.02])); parts.push(part("竞技椅扶手", "box", shell, [side * 0.37, 0.76, 0], [0.08, 0.05, 0.4])); }
  for (let index = 0; index < 5; index++) { const a = index * Math.PI * 2 / 5; parts.push(beam("五星支脚", steel, [0, 0.2, 0], [Math.cos(a) * 0.33, 0.07, Math.sin(a) * 0.33], 0.045)); parts.push(part("脚轮", "sphere", black, [Math.cos(a) * 0.33, 0.055, Math.sin(a) * 0.33], [0.09, 0.11, 0.09])); }
  return make("cyberGamingChair", "竞技人体工学椅", "赛博朋克", "家具", parts);
}

function capsuleBed() {
  return make("cyberCapsuleBed", "睡眠胶囊床", "赛博朋克", "家具", [part("胶囊外壳", "lathe", shell, [0, 0.85, 0], [1, 1, 1], [90, 0, 0], { profile: [{ x: 0.67, y: -1.2 }, { x: 0.76, y: -1.2 }, { x: 0.76, y: 1.2 }, { x: 0.67, y: 1.2 }, { x: 0.67, y: -1.2 }] }), part("胶囊床基座", "box", black, [0, 0.09, 0], [1.1, 0.18, 2.1]), part("舱内床垫", "box", "#acb9b3", [0, 0.43, 0], [0.9, 0.12, 2.1]), part("舱内枕头", "box", cream, [0, 0.55, -0.74], [0.65, 0.12, 0.36]), part("胶囊后封板", "cylinder", steel, [0, 0.85, -1.21], [1.5, 0.06, 1.5], [90, 0, 0]), glow("睡眠阅读灯", cyan, [0, 1.47, -0.6], [0.35, 0.025, 0.12]), part("床侧控制面板", "box", black, [0.48, 0.9, 0.5], [0.07, 0.26, 0.25])]);
}

function lightCouch() {
  return make("cyberLightCouch", "模块灯带沙发", "赛博朋克", "家具", [part("悬浮感沙发基座", "box", shell, [0, 0.18, 0], [1.9, 0.28, 0.65]), ...[-0.55, 0.55].map(x => part("独立圆角座舱", "capsule", steel, [x, 0.56, 0], [1, 0.4, 0.9])), ...[-0.55, 0.55].map(x => part("圆角沙发靠背", "capsule", shell, [x, 0.95, -0.35], [1, 0.75, 0.22])), glow("沙发前侧灯带", pink, [0, 0.3, 0.44], [2.05, 0.05, 0.03]), ...[-1.06, 1.06].map(x => part("沙发宽扶手", "box", shell, [x, 0.66, 0], [0.18, 0.43, 0.8]))]);
}

function equipmentLocker() {
  const parts = [part("装备柜背板", "box", shell, [0, 1.08, -0.25], [1.2, 2.16, 0.1]), part("装备柜顶板", "box", steel, [0, 2.12, 0], [1.3, 0.12, 0.65]), part("装备柜底板", "box", steel, [0, 0.08, 0], [1.3, 0.16, 0.65]), part("头盔展示", "sphere", black, [0, 1.8, 0], [0.42, 0.42, 0.39]), part("防护背心", "box", "#758778", [0, 1.25, 0], [0.47, 0.58, 0.2]), glow("装备柜顶灯", cyan, [0, 2.03, 0.22], [0.95, 0.04, 0.06])];
  for (const x of [-0.59, 0.59]) parts.push(part("装备柜侧壁", "box", shell, [x, 1.08, 0], [0.1, 2.16, 0.65]));
  for (const x of [-0.35, 0.35]) parts.push(part("装备收纳箱", "box", black, [x, 0.38, 0], [0.4, 0.42, 0.4]));
  return make("cyberEquipmentLocker", "防护装备储物柜", "赛博朋克", "家具", parts);
}

function djDesk() {
  const parts = [part("混音桌控制台", "box", shell, [0, 0.84, 0], [1.8, 0.23, 0.75]), ...legs(1.45, 0.5, 0.74, steel, 0.07), ...[-0.53, 0.53].map(x => part("混音转盘", "cylinder", black, [x, 0.98, 0], [0.55, 0.04, 0.55])), glow("混音台前灯", pink, [0, 0.87, 0.39], [1.6, 0.055, 0.025])];
  for (let index = 0; index < 5; index++) { parts.push(part("推子滑轨", "box", black, [-0.16 + index * 0.08, 0.97, 0], [0.025, 0.015, 0.37])); parts.push(part("混音推子", "box", steel, [-0.16 + index * 0.08, 1, index % 2 * 0.13 - 0.07], [0.05, 0.025, 0.04])); }
  return make("cyberDjDesk", "音频混音工作桌", "赛博朋克", "家具", parts);
}

function neonStreetlight() {
  return make("cyberNeonStreetlight", "双叉霓虹路灯", "赛博朋克", "灯具", [part("霓虹灯底盘", "cylinder", shell, [0, 0.06, 0], [0.5, 0.12, 0.5]), part("霓虹立杆", "box", steel, [0, 2.1, 0], [0.13, 4.2, 0.13]), ...[-1, 1].flatMap(side => [beam("分叉灯臂", shell, [0, 3.5, 0], [side * 1.05, 4.5, 0], 0.11), glow("灯臂霓虹条", side < 0 ? cyan : pink, [side * 0.56, 4.05, 0.07], [0.04, 1.3, 0.035], [0, 0, -side * 45]), part("灯臂灯头", "box", shell, [side * 1.05, 4.5, 0], [0.48, 0.11, 0.25])])]);
}

function holoProjector() {
  return make("cyberHoloProjector", "全息灯环投影台", "赛博朋克", "灯具", [part("投影台底盘", "cylinder", shell, [0, 0.09, 0], [1.1, 0.18, 1.1]), part("全息投影柱", "cylinder", steel, [0, 0.48, 0], [0.24, 0.7, 0.24]), ring("投影发射环", cyan, 0.48, 0.07, 0.9, 0.04, { emissive: cyan, emissiveIntensity: 0.85 }), part("悬浮全息光环", "torus", cyan, [0, 1.65, 0], [1.25, 1.25, 0.08], [20, 0, 0], { emissive: cyan, emissiveIntensity: 0.65 }), part("全息光幕", "cylinder", pink, [0, 1.65, 0], [0.83, 0.025, 0.83], [110, 0, 0], { opacity: 0.18, emissive: pink, emissiveIntensity: 0.3 })]);
}

function tubeFloorLamp() {
  const parts = [part("三棱灯座", "cylinder", shell, [0, 0.05, 0], [0.48, 0.1, 0.48])];
  for (let index = 0; index < 3; index++) { const a = index * Math.PI * 2 / 3, x = Math.cos(a) * 0.12, z = Math.sin(a) * 0.12; parts.push(part("三棱灯管框", "cylinder", steel, [x, 0.94, z], [0.065, 1.8, 0.065])); parts.push(part("三棱发光灯管", "cylinder", index % 2 ? pink : cyan, [x, 0.94, z], [0.044, 1.65, 0.044], [0, 0, 0], { emissive: index % 2 ? pink : cyan, emissiveIntensity: 0.8 })); }
  parts.push(part("三棱顶帽", "cylinder", shell, [0, 1.86, 0], [0.38, 0.08, 0.38]));
  return make("cyberTubeFloorLamp", "三棱管落地灯", "赛博朋克", "灯具", parts);
}

function signTower() {
  const parts = [part("招牌塔底座", "box", shell, [0, 0.15, 0], [0.8, 0.3, 0.7]), part("招牌塔主柱", "box", steel, [0, 2.4, 0], [0.22, 4.5, 0.22])];
  for (let index = 0; index < 4; index++) { const side = index % 2 ? -1 : 1, y = 1.4 + index * 0.95; parts.push(part("独立广告牌框", "box", shell, [side * 0.55, y, 0], [1.2, 0.7, 0.14])); parts.push(glow("广告牌发光面", index % 2 ? cyan : pink, [side * 0.55, y, 0.085], [1.03, 0.52, 0.025])); }
  return make("cyberSignTower", "霓虹广告招牌塔", "赛博朋克", "灯具", parts);
}

function ceilingPanel() {
  const parts = [part("顶灯金属背板", "box", shell, [0, 0.14, 0], [1.5, 0.12, 1.5])];
  for (let row = 0; row < 4; row++) for (let col = 0; col < 4; col++) parts.push(glow("矩阵发光格", row % 2 ? cyan : "#bed7d9", [(col - 1.5) * 0.34, 0.055, (row - 1.5) * 0.34], [0.28, 0.035, 0.28]));
  return make("cyberCeilingPanel", "网格矩阵顶灯", "赛博朋克", "灯具", parts);
}

function cyberdeck() {
  const parts = [part("便携终端机座", "box", shell, [0, 0.045, 0], [0.62, 0.09, 0.43]), part("终端屏幕框", "box", black, [0, 0.28, -0.19], [0.6, 0.43, 0.035], [-12, 0, 0]), glow("终端显示面", cyan, [0, 0.28, -0.166], [0.53, 0.35, 0.014], [-12, 0, 0]), part("终端输入键盘", "box", steel, [0, 0.1, 0.04], [0.48, 0.025, 0.21]), part("终端天线", "cylinder", black, [0.26, 0.4, -0.2], [0.014, 0.37, 0.014]), pipe("终端数据连接线", black, [[-0.31, 0.04, 0], [-0.52, 0.04, 0.1], [-0.48, 0.025, 0.37], [-0.27, 0.025, 0.48]], 0.008)];
  return make("cyberPortableDeck", "便携赛博终端", "赛博朋克", "器物", parts);
}

function desktopRobotArm() {
  return make("cyberDesktopRobotArm", "桌面机械臂", "赛博朋克", "器物", [part("机械臂圆底座", "cylinder", shell, [0, 0.07, 0], [0.48, 0.14, 0.48]), part("底座回转关节", "cylinder", steel, [0, 0.19, 0], [0.21, 0.14, 0.21]), beam("机械上臂", steel, [0, 0.25, 0], [0.18, 0.66, 0], 0.1), part("机械肘关节", "sphere", shell, [0.18, 0.66, 0], [0.18, 0.18, 0.18]), beam("机械前臂", steel, [0.18, 0.66, 0], [0.51, 0.5, 0], 0.085), part("腕部夹爪座", "box", shell, [0.55, 0.49, 0], [0.14, 0.13, 0.14]), ...[-0.1, 0.1].map(z => beam("双指机械夹爪", steel, [0.59, 0.49, z], [0.74, 0.4, z * 0.65], 0.03)), glow("机械臂指示灯", cyan, [0, 0.22, 0.12], [0.08, 0.02, 0.025])]);
}

function prostheticDisplay() {
  const parts = [part("义肢展台", "cylinder", shell, [0, 0.1, 0], [0.55, 0.2, 0.55]), part("义肢支撑杆", "cylinder", steel, [0, 0.38, 0], [0.045, 0.5, 0.045]), part("义肢前臂", "capsule", steel, [0, 0.78, 0], [0.18, 0.55, 0.18]), part("义肢手掌", "box", shell, [0, 1.1, 0], [0.2, 0.2, 0.075])];
  for (let index = 0; index < 4; index++) parts.push(part("义肢手指", "capsule", steel, [(index - 1.5) * 0.052, 1.32 - index % 2 * 0.018, 0], [0.035, 0.24, 0.035]));
  parts.push(beam("义肢拇指", steel, [-0.09, 1.09, 0], [-0.19, 1.22, 0], 0.035), glow("义肢状态灯", cyan, [0, 0.8, 0.1], [0.045, 0.25, 0.018]));
  return make("cyberProstheticDisplay", "义肢前臂展示架", "赛博朋克", "器物", parts);
}

function vrHeadset() {
  return make("cyberVrHeadset", "沉浸式VR头显", "赛博朋克", "器物", [part("头显外壳", "box", shell, [0, 0.1, 0.03], [0.25, 0.16, 0.14]), part("头显弧面玻璃", "sphere", black, [0, 0.1, 0.105], [0.23, 0.13, 0.08]), part("头显头带", "torus", black, [0, 0.1, -0.1], [0.25, 0.32, 0.09], [90, 0, 0]), ...[-0.065, 0.065].map(x => part("头显眼部透镜", "cylinder", glass, [x, 0.1, -0.05], [0.07, 0.015, 0.07], [90, 0, 0])), glow("头显提示灯", cyan, [0, 0.15, 0.145], [0.12, 0.012, 0.008])]);
}

function holoGlobe() {
  return make("cyberHoloGlobe", "全息地球仪", "赛博朋克", "器物", [part("地球仪底盘", "cylinder", shell, [0, 0.04, 0], [0.5, 0.08, 0.5]), part("地球仪投影柱", "cylinder", steel, [0, 0.22, 0], [0.1, 0.34, 0.1]), part("全息球体", "sphere", cyan, [0, 0.64, 0], [0.65, 0.65, 0.65], [0, 0, 0], { opacity: 0.25, emissive: cyan, emissiveIntensity: 0.45 }), part("经线环", "torus", cyan, [0, 0.64, 0], [0.71, 0.71, 0.035], [0, 0, 15], { emissive: cyan, emissiveIntensity: 0.5 }), part("纬线环", "torus", pink, [0, 0.64, 0], [0.71, 0.71, 0.035], [90, 0, 0], { emissive: pink, emissiveIntensity: 0.5 })]);
}

function scannerGate() {
  const parts = [part("扫描门底台", "box", shell, [0, 0.045, 0], [1.6, 0.09, 0.8]), part("扫描门顶梁", "box", steel, [0, 2.22, 0], [1.45, 0.2, 0.5])];
  for (const x of [-0.67, 0.67]) { parts.push(part("扫描门柱", "box", shell, [x, 1.1, 0], [0.22, 2.2, 0.45])); parts.push(glow("扫描纵灯", cyan, [x, 1.1, 0.24], [0.07, 1.9, 0.025])); for (const y of [0.5, 1.1, 1.7]) parts.push(part("扫描传感器", "box", black, [x * 0.84, y, 0], [0.045, 0.1, 0.17])); }
  return make("cyberScannerGate", "智能安检扫描门", "赛博朋克", "设施", parts);
}

function energySupplyStation() {
  const parts = [part("能量站台基", "box", shell, [0, 0.1, 0], [2.1, 0.2, 1]), part("能量站主柜", "box", steel, [0, 1.1, -0.18], [1.9, 1.8, 0.55]), glow("主柜操作屏", cyan, [0, 1.45, 0.12], [0.6, 0.38, 0.025])];
  for (const x of [-0.65, 0.65]) { parts.push(part("可换电池仓", "cylinder", shell, [x, 0.9, 0.25], [0.38, 1.2, 0.38])); parts.push(part("能量电池芯", "cylinder", cyan, [x, 0.9, 0.27], [0.17, 0.9, 0.17], [0, 0, 0], { emissive: cyan, emissiveIntensity: 0.7 })); }
  return make("cyberEnergySupplyStation", "街头能量补给站", "赛博朋克", "设施", parts);
}

function recyclingRobot() {
  return make("cyberRecyclingRobot", "垃圾分拣机器人", "赛博朋克", "设施", [part("分拣机器人底盘", "box", shell, [0, 0.25, 0], [0.75, 0.3, 0.8]), part("分拣收纳舱", "box", steel, [0, 0.68, -0.1], [0.68, 0.65, 0.6]), part("机器人传感头", "box", black, [0, 1.1, 0.1], [0.4, 0.18, 0.2]), glow("识别镜头", cyan, [0, 1.1, 0.21], [0.21, 0.055, 0.018]), ...roadWheels(0.4, 0.18, [-0.25, 0.25], 0.17, false), beam("分拣机械臂", steel, [0.36, 0.8, 0], [0.73, 0.63, 0.31], 0.07), part("垃圾抓斗", "box", shell, [0.77, 0.56, 0.37], [0.24, 0.14, 0.25])]);
}

function serverRack() {
  const parts = [part("机架背板", "box", shell, [0, 1, -0.29], [0.72, 2, 0.08]), ...legs(0.64, 0.56, 2, steel, 0.06), part("机架顶板", "box", shell, [0, 2.04, 0], [0.8, 0.1, 0.7])];
  for (let index = 0; index < 8; index++) { const y = 0.18 + index * 0.23; parts.push(part("服务器单元", "box", steel, [0, y, 0], [0.66, 0.18, 0.6])); parts.push(glow("服务器状态条", index % 2 ? cyan : green, [-0.19, y, 0.32], [0.18, 0.025, 0.015])); parts.push(part("服务器散热口", "box", black, [0.15, y, 0.32], [0.23, 0.07, 0.015])); }
  return make("cyberServerRack", "灯阵服务器机架", "赛博朋克", "设施", parts);
}

function dronePort() {
  const parts = [part("停机坪主台", "cylinder", shell, [0, 0.22, 0], [4.4, 0.44, 4.4]), ring("停机坪引导环", cyan, 1.85, 0.07, 0.46, 0.025, { emissive: cyan, emissiveIntensity: 0.65 }), glow("停机坪中心标一", pink, [0, 0.46, 0], [0.1, 0.02, 1.2]), glow("停机坪中心标二", pink, [0, 0.46, 0], [1.2, 0.02, 0.1])];
  for (let index = 0; index < 4; index++) { const a = index * Math.PI / 2; parts.push(part("停机坪感应桩", "cylinder", steel, [Math.cos(a) * 2.02, 0.85, Math.sin(a) * 2.02], [0.14, 0.9, 0.14])); parts.push(part("感应桩灯", "sphere", cyan, [Math.cos(a) * 2.02, 1.32, Math.sin(a) * 2.02], [0.16, 0.16, 0.16], [0, 0, 0], { emissive: cyan, emissiveIntensity: 0.7 })); }
  return make("cyberDronePort", "无人机自动停机坪", "赛博朋克", "设施", parts);
}

function airScrubber() {
  const parts = [part("净化塔基础", "box", shell, [0, 0.15, 0], [1.9, 0.3, 1.6]), part("净化塔主柜", "box", steel, [0, 2, 0], [1.55, 3.7, 1.25]), part("净化塔排气筒", "cylinder", shell, [0, 4.3, 0], [0.8, 0.9, 0.8]), glow("净化塔传感灯", pink, [0.65, 2, 0.66], [0.05, 2.9, 0.025])];
  for (const y of [0.9, 2, 3.1]) parts.push(...fan("净化风机", [0, y, 0.68], 0.43));
  return make("cyberAirScrubber", "城市空气净化塔", "赛博朋克", "设施", parts);
}

function biolumTree() {
  const parts = [part("荧光树树干", "cylinder", "#536b69", [0, 1.4, 0], [0.21, 2.8, 0.21])];
  for (let index = 0; index < 6; index++) { const a = index * Math.PI / 3, x = Math.cos(a) * 1.05, z = Math.sin(a) * 1.05, y = 2.4 + index % 2 * 0.4; parts.push(beam("荧光树分枝", "#627a75", [0, 1.3, 0], [x, y, z], 0.08)); parts.push(part("荧光树叶簇", "sphere", index % 2 ? "#719d9a" : "#8d82a8", [x, y, z], [1.35, 1, 1.25], [0, 0, 0], { emissive: index % 2 ? "#42716c" : "#615578", emissiveIntensity: 0.3 })); parts.push(part("发光种子", "sphere", cyan, [x, y - 0.55, z], [0.1, 0.16, 0.1], [0, 0, 0], { emissive: cyan, emissiveIntensity: 0.7 })); }
  return make("cyberBiolumTree", "生物荧光树", "赛博朋克", "植物", parts);
}

function algaeTank() {
  const parts = [part("藻罐底座", "cylinder", shell, [0, 0.12, 0], [0.86, 0.24, 0.86]), part("藻类玻璃罐", "cylinder", glass, [0, 1.15, 0], [0.75, 1.85, 0.75], [0, 0, 0], { opacity: 0.2, roughness: 0.14 }), part("罐内藻液", "cylinder", "#7aa58a", [0, 1.05, 0], [0.64, 1.55, 0.64], [0, 0, 0], { opacity: 0.5, emissive: "#527e68", emissiveIntensity: 0.35 }), part("藻罐顶盖", "cylinder", steel, [0, 2.11, 0], [0.88, 0.14, 0.88]), pipe("藻罐循环管", black, [[0.4, 0.3, 0], [0.6, 0.5, 0], [0.6, 1.8, 0], [0.4, 2, 0]], 0.025)];
  for (const y of [0.35, 1.98]) parts.push(ring("藻罐环灯", cyan, 0.43, 0.025, y, 0.05, { emissive: cyan, emissiveIntensity: 0.65 }));
  return make("cyberAlgaeTank", "发光藻类循环罐", "赛博朋克", "植物", parts);
}

function hydroponicBed() {
  const parts = [...legs(1.8, 0.65, 0.55, steel, 0.06), part("水培菜床托盘", "box", shell, [0, 0.63, 0], [2.1, 0.2, 0.9]), part("水培循环水槽", "box", "#708c8f", [0, 0.74, 0], [1.9, 0.035, 0.72]), ...[-0.92, 0.92].map(x => part("补光灯支架", "box", steel, [x, 1.12, 0], [0.045, 0.9, 0.045])), glow("水培补光灯", pink, [0, 1.58, 0], [2, 0.045, 0.12])];
  for (const x of [-0.7, 0, 0.7]) for (const z of [-0.22, 0.22]) parts.push(part("水培生菜", "sphere", green, [x, 0.86, z], [0.42, 0.3, 0.38]));
  return make("cyberHydroponicBed", "模块水培菜床", "赛博朋克", "植物", parts);
}

function cyberBonsai() {
  const parts = [part("盆景多边形盆", "box", shell, [0, 0.11, 0], [0.7, 0.22, 0.45]), part("盆景基质", "box", "#556b63", [0, 0.23, 0], [0.58, 0.035, 0.34]), pipe("盆景主干", "#748d87", [[0, 0.23, 0], [-0.12, 0.45, 0], [0.08, 0.72, 0], [-0.02, 1, 0]], 0.035), glow("盆景感应灯", cyan, [0, 0.12, 0.24], [0.45, 0.025, 0.015])];
  for (let index = 0; index < 5; index++) { const side = index % 2 ? -1 : 1, x = side * (0.15 + index % 2 * 0.07), y = 0.5 + index * 0.12; parts.push(beam("盆景分枝", "#748d87", [0, y - 0.08, 0], [x, y, 0], 0.025)); parts.push(part("盆景修剪叶片", "box", index % 2 ? "#759686" : "#86a698", [x, y + 0.045, 0], [0.32 - index * 0.025, 0.12, 0.29], [0, index * 27, 0])); }
  return make("cyberBonsai", "传感赛博盆景", "赛博朋克", "植物", parts);
}

const cyberAssets = [
  neonArcade(), capsuleHotel(), ramenKiosk(), dataRelayStation(), skybridgeStation(), cyberClinic(), maglevTransitHub(), verticalFarm(),
  hoverTaxi(), cyberMotorcycle(), deliveryDrone(), patrolDrone(), maglevCarriage(), autonomousVan(),
  holoDesk(), gamingChair(), capsuleBed(), lightCouch(), equipmentLocker(), djDesk(),
  neonStreetlight(), holoProjector(), tubeFloorLamp(), signTower(), ceilingPanel(),
  cyberdeck(), desktopRobotArm(), prostheticDisplay(), vrHeadset(), holoGlobe(), scannerGate(),
  energySupplyStation(), recyclingRobot(), serverRack(), dronePort(), airScrubber(),
  biolumTree(), algaeTank(), hydroponicBed(), cyberBonsai(),
];

export const industrialStyleAssets: SceneAsset[] = [...steamAssets, ...cyberAssets];
