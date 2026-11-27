import { markMessages } from "@toonflow/i18n/vue";
import { builtinAssets } from "./assetLibrary";
import { catalogAssets } from "./assetCatalog";
import { getSceneLife } from "./lifeDocument";
import type { PerformanceTrack } from "./performanceDocument";
import { createOccupancy, measureAssetFootprint, rectFor, rectsOverlap, type Rect } from "./setDressing";
import { worldSizeLimits } from "./terrainModel";
import type { SceneAsset, SceneDocument } from "./sceneDocument";
type SceneView = SceneDocument["view"];

// ACT: 一键布景。新手在空场景直接点一套常见影视景，不接AI也能得到成套、朝向正确、有群演的景；
// 每一步复用AI的布景工具（layoutStreet/arrangeAssets/placeCrowd/createBrushPath），结果每件仍可单独编辑，
// 熟练用户可以接着改或让Agent在此基础上加工。

export type SetTemplateRun = (tool: string, args: Record<string, unknown>) => Promise<any>;
type Run = SetTemplateRun;
type Vec = { x: number; z: number };

/** floor：站台、舞台等平台面高度；给了就放在平台上，并用path模式沿线走（不依赖导航网格）。avoid=false：整块布景里走（布景占地覆盖整片，按占地避让就放不下人）。 */
type Walkers = { name: string; path: Vec[]; width: number; count: number; floor?: number; avoid?: boolean };

export type SetTemplate = {
  id: string;
  name: string;
  /** 题材分组，界面上按组排列。 */
  genre: "古装" | "民国" | "现代" | "奇幻";
  /** 以中心为原点的半宽、半深（米，含墙和群演），放置前检查是否出世界边界。 */
  half: [number, number];
  view: SceneView;
  build: (run: Run) => Promise<void>;
  /** 播放时沿这条线来回走动的路人：放胶囊人并给每人一条演绎路线，景一播就“活”起来。 */
  walkers?: Walkers | Walkers[];
  /** 播放时沿车道开过的车：build里用这个名字addAsset放好车，再按path直线开一趟（path含起点，path模式只走路线点之间的线）。 */
  drivers?: { name: string; path: Vec[]; speed?: number }[];
  /** 会挪步的背景群演（名字前缀）：只列聊天、闲逛的人；列阵士兵、卫兵、队伍、听众站定不动。 */
  milling?: string[];
};

const view = (position: [number, number, number], target: [number, number, number], fov = 50): SceneView => ({ position: { x: position[0], y: position[1], z: position[2] }, target: { x: target[0], y: target[1], z: target[2] }, fov });

export const setTemplates: SetTemplate[] = [
  {
    milling: ["古街"],
    id: "ancientStreet", half: [18, 38], name: markMessages("古街集市"), genre: "古装",
    view: view([18, 22, 46], [-1, 0, -4]),
    async build(run) {
      await run("createBrushPath", { mode: "paving", style: "flagstone", points: [{ x: 0, z: -38 }, { x: 0, z: 38 }], width: 12, height: 0.06 });
      await run("layoutStreet", { path: [{ x: 0, z: -36 }, { x: 0, z: 36 }], width: 12, buildings: ["masterArchitecture2760", "masterArchitecture2763", "masterArchitecture2762", "masterArchitecture2667"], gap: 0.3, stalls: { assetIds: ["masterArchitecture2677", "masterArchitecture2678", "masterArchitecture2679"], spacing: 11 }, lamps: { assetId: "masterArchitecture2766", spacing: 12 }, gates: { assetId: "masterArchitecture2765", at: "both" }, crowd: { count: 40, groupSize: 3 }, seed: 7, name: "古街" });
    },
    walkers: { name: "行人", path: [{ x: 0, z: -32 }, { x: 0, z: 32 }], width: 9, count: 14 },
  },
  {
    // 夜戏街景：同一条古街，晚上8点半，暖色灯笼光为主、冷蓝月光补轮廓，暗而看得清。
    milling: ["古街"],
    id: "nightMarket", half: [18, 38], name: markMessages("古街夜市"), genre: "古装",
    view: view([18, 22, 46], [-1, 0, -4]),
    async build(run) {
      await setTemplates.find(template => template.id === "ancientStreet")!.build(run);
      await run("setTime", { hour: 20.5 });
      await run("setWeather", { lighting: { sunIntensity: 0.9, sunAzimuth: 200, sunElevation: 35, sunColor: "#9fb3e6", ambientIntensity: 1.05, ambientColor: "#c98f5c", skyIntensity: 0.5, exposure: 1.6, weatherInfluence: 1 } });
    },
    walkers: { name: "行人", path: [{ x: 0, z: -32 }, { x: 0, z: 32 }], width: 9, count: 14 },
  },
  {
    milling: ["客人"],
    id: "inn", half: [7, 5], name: markMessages("客栈大堂"), genre: "古装",
    view: view([0, 11, 14], [0, 0, -1]),
    async build(run) {
      await run("createBrushPath", { mode: "paving", style: "boardwalk", points: [{ x: -7, z: 0 }, { x: 7, z: 0 }], width: 10, height: 0.06 });
      await run("arrangeAssets", { pattern: "walls", center: { x: 0, z: 0 }, width: 13.4, depth: 9.4, bySide: { back: ["easternCnDisplayShelf", "easternCnOfficialChair", "easternCnDisplayShelf"], left: ["easternCnDisplayShelf", "easternCnWaterJar"], right: ["easternCnWaterJar", "easternCnDisplayShelf"] }, gap: 0.6, enclose: { style: "whiteTile", height: 3.2 }, name: "大堂" });
      const tables = await run("arrangeAssets", { pattern: "grid", assetIds: ["easternCnSquareTable"], center: { x: 0, z: 1.2 }, rows: 2, columns: 3, spacing: 3.4, name: "大堂" });
      const benches = await run("arrangeAssets", { pattern: "around", assetIds: ["easternCnBench"], targetIds: tables.objects.map((object: { id: string }) => object.id), perTarget: 4, gap: 0.15, name: "大堂" });
      await run("placeCrowd", { mode: "seated", seatIds: benches.objects.map((object: { id: string }) => object.id), fill: 0.45, name: "食客" });
      await run("placeCrowd", { center: { x: 0, z: 1.4 }, width: 11, depth: 6.5, count: 5, groupSize: 2, name: "客人" });
      await run("setTime", { hour: 15 });
    },
  },
  {
    milling: ["家眷"],
    id: "courtyard", half: [11, 11], name: markMessages("四合院"), genre: "古装",
    view: view([9, 13, 22], [0, 0, 1]),
    async build(run) {
      await run("arrangeAssets", { pattern: "walls", center: { x: 0, z: 0 }, width: 19, depth: 20, sides: ["back", "left", "right", "front"], bySide: { back: ["easternCnCourtyardHouse"], left: ["easternCnCourtyardHouse", "easternCnCourtyardHouse"], right: ["easternCnCourtyardHouse", "easternCnCourtyardHouse"], front: ["easternCnGatehouse"] }, gap: 0.4, enclose: { style: "whiteTile", height: 2.6 }, name: "四合院" });
      await run("createBrushPath", { mode: "paving", style: "courtyard", points: [{ x: 0, z: -4.5 }, { x: 0, z: 7 }], width: 7.5, height: 0.05 });
      await run("arrangeAssets", { pattern: "line", assetIds: ["easternCnWaterJar", "masterNaturePine", "easternCnWaterJar"], path: [{ x: -2.5, z: -1 }, { x: 2.5, z: -1 }], count: 3, name: "院中" });
      await run("placeCrowd", { center: { x: 0, z: 3 }, radius: 2.5, count: 6, groupSize: 3, children: 0.34, name: "家眷" });
    },
  },
  {
    milling: ["营兵"],
    id: "camp", half: [15, 24], name: markMessages("军营"), genre: "古装",
    view: view([0, 26, 38], [0, 0, 11]),
    async build(run) {
      await run("addAsset", { assetId: "nature4510", position: { x: 0, y: 0, z: 0 } });
      await run("arrangeAssets", { pattern: "ring", assetIds: ["wasteAidTent", "worldDesertTent"], center: { x: 0, z: 0 }, radius: 10, count: 5, span: 240, angle: 180, name: "营地" });
      await run("arrangeAssets", { pattern: "grid", assetIds: ["person"], center: { x: 0, z: 17 }, rows: 3, columns: 8, spacing: 1.2, facing: "target", target: { x: 0, z: 0 }, name: "士兵" });
      await run("placeCrowd", { center: { x: 0, z: 0 }, radius: 5, count: 10, groupSize: 5, name: "营兵" });
      await run("setTime", { hour: 20 });
    },
    walkers: { name: "巡营", path: [{ x: -14, z: 22 }, { x: 14, z: 22 }], width: 2, count: 3 },
  },
  {
    id: "throneRoom", half: [8, 14], name: markMessages("王座大殿"), genre: "奇幻",
    view: view([0, 12, 24], [0, 1, -2]),
    async build(run) {
      await run("createBrushPath", { mode: "paving", style: "marble", points: [{ x: 0, z: -14 }, { x: 0, z: 14 }], width: 16, height: 0.06 });
      await run("arrangeAssets", { pattern: "walls", center: { x: 0, z: 0 }, width: 16, depth: 28, bySide: { back: ["fantasyCrystalThrone"] }, sides: ["back"], enclose: { style: "ashlar", height: 6, sides: ["back", "left", "right"] }, name: "王座厅" });
      await run("arrangeAssets", { pattern: "line", assetIds: ["themedRomanColumn"], path: [{ x: 0, z: -10 }, { x: 0, z: 12 }], offset: 4.5, bothSides: true, spacing: 4.4, name: "王座厅" });
      await run("arrangeAssets", { pattern: "line", assetIds: ["person"], path: [{ x: 0, z: -8 }, { x: 0, z: 10 }], offset: 2.8, bothSides: true, spacing: 2.2, name: "卫兵" });
    },
    walkers: { name: "觐见者", path: [{ x: 0, z: 12 }, { x: 0, z: -9 }], width: 1.6, count: 2 },
  },
  {
    milling: ["同事"],
    id: "office", half: [9, 7], name: markMessages("开放办公室"), genre: "现代",
    view: view([0, 16, 17], [0, 0, 0]),
    async build(run) {
      await run("createBrushPath", { mode: "paving", style: "concreteSlab", points: [{ x: -9, z: 0 }, { x: 9, z: 0 }], width: 14, height: 0.05 });
      await run("arrangeAssets", { pattern: "walls", center: { x: 0, z: 0 }, width: 18, depth: 14, bySide: { back: ["objectDesign0520", "objectDesign0520", "objectDesign0520"], left: ["objectDesign0520", "objectDesign0520"] }, gap: 0.4, enclose: { style: "stucco", height: 3 }, name: "办公区" });
      const desks = await run("arrangeAssets", { pattern: "grid", assetIds: ["cyberHoloDesk"], center: { x: 0, z: 0.5 }, rows: 3, columns: 4, spacing: 3.2, aisle: 1.6, name: "工位" });
      const chairs = await run("arrangeAssets", { pattern: "around", assetIds: ["civicSwivelChair"], targetIds: desks.objects.map((object: { id: string }) => object.id), aroundSides: ["front"], name: "工位" });
      await run("placeCrowd", { mode: "seated", seatIds: chairs.objects.map((object: { id: string }) => object.id), fill: 0.7, name: "职员" });
      await run("placeCrowd", { mode: "chat", center: { x: 0, z: 5.6 }, width: 14, depth: 2, count: 6, groupSize: 3, name: "同事" });
    },
  },
  {
    id: "lectureHall", half: [15, 17], name: markMessages("报告厅"), genre: "现代",
    view: view([0, 13, 20], [0, 0, 1]),
    async build(run) {
      await run("addAsset", { assetId: "masterArchitecture0141", position: { x: 0, y: 0, z: -6 } });
      await run("addAsset", { assetId: "masterObject1056", position: { x: 0, y: 0, z: -2 }, faceToward: { x: 0, z: 10 } });
      await run("addAsset", { assetId: "person", name: "主讲人", position: { x: 0, y: 0, z: -2.7 }, faceToward: { x: 0, z: 10 } });
      const seats = await run("arrangeAssets", { pattern: "ring", assetIds: ["objectDesign0000"], center: { x: 0, z: -6 }, radius: 7, span: 140, rings: 6, angle: 0, name: "报告厅" });
      await run("placeCrowd", { mode: "seated", seatIds: seats.objects.map((object: { id: string }) => object.id), fill: 0.6, name: "听众" });
    },
  },
  {
    milling: ["行人"],
    id: "modernStreet", half: [20, 38], name: markMessages("现代街道"), genre: "现代",
    // 沿街纵深看过去（以前斜上方的视角被右侧楼群整块挡住）。
    view: view([3, 10, 44], [0, 1, 10]),
    async build(run) {
      await run("createBrushPath", { mode: "paving", style: "street", points: [{ x: 0, z: -38 }, { x: 0, z: 38 }], width: 9, height: 0.05 });
      for (const x of [-6.25, 6.25]) await run("createBrushPath", { mode: "paving", style: "sidewalk", points: [{ x, z: -38 }, { x, z: 38 }], width: 3.5, height: 0.12 });
      await run("layoutStreet", { path: [{ x: 0, z: -36 }, { x: 0, z: 36 }], width: 16, buildings: ["civicApartmentBlock", "civicOfficeTower", "civicApartmentBlock"], gap: 0.5, lamps: { assetId: "themedModernStreetlight", spacing: 14 }, seed: 11, name: "街道" });
      await run("arrangeAssets", { pattern: "line", assetIds: ["civicSedan", "masterTransport0688", "masterTransport0680"], path: [{ x: 3.6, z: -30 }, { x: 3.6, z: 30 }], spacing: 9, facing: "along", name: "停车" });
      await run("addAsset", { assetId: "civicSedan", name: "行驶车辆1", position: { x: -2.2, y: 0, z: -34 }, faceToward: { x: -2.2, z: 34 } });
      await run("addAsset", { assetId: "masterTransport0688", name: "行驶车辆2", position: { x: 1.4, y: 0, z: 34 }, faceToward: { x: 1.4, z: -34 } });
      for (const x of [-6.3, 6.3]) await run("placeCrowd", { mode: "chat", path: [{ x, z: -30 }, { x, z: 30 }], width: 2, count: 8, groupSize: 2, name: "行人" });
      await run("setTime", { hour: 15 });
    },
    walkers: [{ name: "路人", path: [{ x: -6.3, z: -32 }, { x: -6.3, z: 32 }], width: 2, count: 6 }, { name: "路人", path: [{ x: 6.3, z: 32 }, { x: 6.3, z: -32 }], width: 2, count: 6 }],
    drivers: [{ name: "行驶车辆1", path: [{ x: -2.2, z: -34 }, { x: -2.2, z: 34 }], speed: 5 }, { name: "行驶车辆2", path: [{ x: 1.4, z: 34 }, { x: 1.4, z: -34 }], speed: 5 }],
  },
  {
    id: "interrogation", half: [3.2, 2.6], name: markMessages("审讯室"), genre: "现代",
    view: view([0.6, 2.4, 4.6], [0.2, 0.9, 0]),
    async build(run) {
      // 现成的“现代审讯室三壁内景（单向玻璃）”整块布景；射线实测：地面0.1米，审讯桌在中间（x≈-0.6..0.8），两端各一把椅子（x≈-0.9、+1.3）。
      await run("addAsset", { assetId: "masterArchitecture2854", name: "审讯室", position: { x: 0, y: 0, z: 0 } });
      await run("addAsset", { assetId: "person", name: "嫌疑人", position: { x: -1.4, y: 0.1, z: 0.2 }, faceToward: { x: 2, z: 0.2 } });
      await run("addAsset", { assetId: "person", name: "警官", position: { x: 1.8, y: 0.1, z: 0.2 }, faceToward: { x: -2, z: 0.2 } });
      await run("addAsset", { assetId: "person", name: "警官（站）", position: { x: 1.9, y: 0.1, z: -1.2 }, faceToward: { x: -1.4, z: 0.2 } });
      await run("setTime", { hour: 21 });
      await run("setWeather", { lighting: { sunIntensity: 0.6, sunAzimuth: 200, sunElevation: 35, sunColor: "#c9d6f0", ambientIntensity: 1.1, ambientColor: "#9aa8c2", skyIntensity: 0.4, exposure: 1.6, weatherInfluence: 1 } });
    },
  },
  {
    id: "courtroom", half: [6.5, 5.5], name: markMessages("法庭"), genre: "现代",
    view: view([0, 7, 13], [0, 0.5, -1.2]),
    async build(run) {
      // 用现成的“现代法庭三壁内景”整块布景（审判席、原被告席、栏杆、旁听席），人按布景里的座位放。
      await run("addAsset", { assetId: "masterArchitecture2902", name: "法庭", position: { x: 0, y: 0, z: 0 } });
      // 审判席在抬高0.62米的平台上（射线实测剖面：审判台桌面z=-2.4..-2.9高1.72，桌椅间空地-3.0..-3.2，椅面-3.3..-3.8，高靠背-3.9），法官站在桌椅之间。
      await run("addAsset", { assetId: "person", name: "法官", position: { x: 0, y: 0.62, z: -3.1 }, faceToward: { x: 0, z: 5 } });
      await run("addAsset", { assetId: "person", name: "原告", position: { x: -2.1, y: 0, z: -0.2 }, faceToward: { x: 0, z: -4 } });
      await run("addAsset", { assetId: "person", name: "被告", position: { x: 2.1, y: 0, z: -0.2 }, faceToward: { x: 0, z: -4 } });
      // 旁听席长凳（射线实测：座面高0.58，三排 z≈2.95/3.75/4.75，左右两块 x=±1.6..±3.6），按座位坐人。
      await run("placeCrowd", { mode: "seated", seatPoints: [2.95, 3.75, 4.75].flatMap(z => [-3.3, -2.6, -1.9, 1.9, 2.6, 3.3].map(x => ({ x, z }))), target: { x: 0, z: -4 }, fill: 0.6, name: "旁听" });
    },
  },
  {
    milling: ["家人"],
    id: "livingRoom", half: [5, 4], name: markMessages("现代客厅"), genre: "现代",
    view: view([0, 7.5, 10], [0, 0.5, -0.5]),
    async build(run) {
      await run("createBrushPath", { mode: "paving", style: "boardwalk", points: [{ x: -4.5, z: 0 }, { x: 4.5, z: 0 }], width: 7, height: 0.05 });
      await run("arrangeAssets", { pattern: "walls", center: { x: 0, z: 0 }, width: 9, depth: 7, bySide: { back: ["masterObject2914"], left: ["objectDesign0520", "masterObject3779"], right: ["objectDesign0640"] }, gap: 0.4, enclose: { style: "stucco", height: 2.8 }, name: "客厅" });
      await run("addAsset", { assetId: "civicModularSofa", position: { x: 0, y: 0, z: 1.6 }, faceToward: { x: 0, z: -3.5 } });
      await run("addAsset", { assetId: "civicCoffeeTable", position: { x: 0, y: 0, z: 0.1 } });
      await run("placeCrowd", { mode: "chat", center: { x: 1.2, z: 2.6 }, width: 3, depth: 1.4, count: 3, groupSize: 3, children: 0.34, name: "家人" });
      await run("setTime", { hour: 16 });
    },
  },
  {
    milling: ["客人"],
    id: "cafe", half: [6, 5], name: markMessages("咖啡馆"), genre: "现代",
    view: view([0, 10, 13], [0, 0, -0.5]),
    async build(run) {
      await run("createBrushPath", { mode: "paving", style: "herringbone", points: [{ x: -6, z: 0 }, { x: 6, z: 0 }], width: 9, height: 0.05 });
      await run("arrangeAssets", { pattern: "walls", center: { x: 0, z: 0 }, width: 12, depth: 9, bySide: { back: ["objectDesign0640", "objectDesign0640", "objectDesign0640"], left: ["objectDesign0520"], right: ["objectDesign0520"] }, gap: 0.2, enclose: { style: "redBrick", height: 3.2 }, name: "咖啡馆" });
      const tables = await run("arrangeAssets", { pattern: "grid", assetIds: ["masterObject3054"], center: { x: 0, z: 1.2 }, rows: 2, columns: 3, spacing: 2.6, name: "咖啡馆" });
      const chairs = await run("arrangeAssets", { pattern: "around", assetIds: ["objectDesign0000"], targetIds: tables.objects.map((object: { id: string }) => object.id), aroundSides: ["left", "right"], gap: 0.15, name: "咖啡馆" });
      await run("placeCrowd", { mode: "seated", seatIds: chairs.objects.map((object: { id: string }) => object.id), fill: 0.6, name: "座客" });
      await run("placeCrowd", { mode: "queue", path: [{ x: 0, z: -2.6 }, { x: 0, z: -0.4 }], count: 3, name: "点单" });
      await run("placeCrowd", { mode: "chat", center: { x: 0, z: 1.2 }, width: 10, depth: 5, count: 2, groupSize: 2, name: "客人" });
      await run("setTime", { hour: 16 });
    },
  },
  {
    id: "classroom", half: [6, 5], name: markMessages("教室"), genre: "现代",
    view: view([0, 10, 12], [0, 0, -1]),
    async build(run) {
      await run("createBrushPath", { mode: "paving", style: "concreteSlab", points: [{ x: -6, z: 0 }, { x: 6, z: 0 }], width: 9, height: 0.05 });
      await run("arrangeAssets", { pattern: "walls", center: { x: 0, z: 0 }, width: 12, depth: 9, bySide: { back: ["masterObject2597"], left: ["objectDesign0520"], right: ["objectDesign0520"] }, gap: 0.6, enclose: { style: "stucco", height: 3.2 }, name: "教室" });
      await run("addAsset", { assetId: "masterObject1056", position: { x: 0, y: 0, z: -2.6 }, faceToward: { x: 0, z: 4 } });
      const desks = await run("arrangeAssets", { pattern: "grid", assetIds: ["objectDesign0240"], center: { x: 0, z: 1.5 }, rows: 3, columns: 4, spacing: 1.9, aisle: 1.2, facing: "target", target: { x: 0, z: -3.5 }, name: "课桌" });
      const chairs = await run("arrangeAssets", { pattern: "around", assetIds: ["objectDesign0000"], targetIds: desks.objects.map((object: { id: string }) => object.id), aroundSides: ["front"], name: "课桌" });
      await run("addAsset", { assetId: "person", name: "老师", position: { x: 1, y: 0, z: -2.8 }, faceToward: { x: 0, z: 4 } });
      await run("placeCrowd", { mode: "seated", seatIds: chairs.objects.map((object: { id: string }) => object.id), fill: 0.9, name: "学生" });
    },
  },
  {
    id: "church", half: [8, 12], name: markMessages("教堂婚礼"), genre: "现代",
    view: view([0, 8, 17], [0, 1, -3]),
    async build(run) {
      await run("createBrushPath", { mode: "paving", style: "marble", points: [{ x: 0, z: -12 }, { x: 0, z: 12 }], width: 16, height: 0.05 });
      await run("arrangeAssets", { pattern: "walls", center: { x: 0, z: 0 }, width: 16, depth: 24, bySide: { back: ["masterObject1056"] }, sides: ["back"], enclose: { style: "ashlar", height: 5, sides: ["back", "left", "right"] }, name: "教堂" });
      const pews = await run("arrangeAssets", { pattern: "grid", assetIds: ["masterObject2104"], center: { x: 0, z: 2 }, rows: 7, columns: 4, spacing: 2, aisle: 2.2, facing: "target", target: { x: 0, z: -11 }, name: "教堂" });
      await run("placeCrowd", { mode: "seated", seatIds: pews.objects.map((object: { id: string }) => object.id), fill: 0.7, name: "宾客" });
      await run("placeCrowd", { mode: "queue", path: [{ x: 0, z: -8 }, { x: 0, z: 10 }], count: 8, name: "婚礼队伍" });
    },
  },
  {
    milling: ["医护"],
    id: "ward", half: [6, 9], name: markMessages("医院病房"), genre: "现代",
    view: view([0, 14, 13], [0, 0, -1]),
    async build(run) {
      await run("createBrushPath", { mode: "paving", style: "concreteSlab", points: [{ x: 0, z: -9 }, { x: 0, z: 9 }], width: 12, height: 0.05 });
      const beds = await run("arrangeAssets", { pattern: "walls", center: { x: 0, z: 0 }, width: 12, depth: 18, assetIds: ["masterObject2452"], sides: ["left", "right"], fill: true, gap: 2, enclose: { style: "stucco", height: 3, sides: ["back", "left", "right"] }, name: "病房" });
      await run("arrangeAssets", { pattern: "around", assetIds: ["masterObject0084"], targetIds: beds.objects.map((object: { id: string }) => object.id), aroundSides: ["left"], gap: 0.1, name: "输液架" });
      await run("placeCrowd", { mode: "chat", center: { x: 0, z: 0 }, width: 3, depth: 12, count: 4, groupSize: 2, name: "医护" });
    },
  },
  {
    // 整块“现代医院走廊三壁内景”（射线实测：两侧墙 x=±1.8，尽头墙 z=-6.8，+z端敞开；右墙边候诊长椅 x=1.4、z=-5.6..-0.8，左侧推床 x=-1.4..-1.0、z=3.6..5.2）；家属靠左墙站着说话，医护沿走廊中线偏右来回走，不从家属中间穿过。
    id: "hospitalCorridor", half: [3, 8], name: markMessages("医院走廊"), genre: "现代",
    view: view([0.6, 2.6, 11], [0, 1, -2]),
    async build(run) {
      await run("addAsset", { assetId: "masterArchitecture2896", name: "医院走廊", position: { x: 0, y: 0, z: 0 } });
      await run("placeCrowd", { mode: "seated", seatPoints: [-5.4, -4.6, -3.8, -2.6, -1.8, -1.0].map(z => ({ x: 1.3, z })), target: { x: -30, z: -3 }, fill: 0.7, name: "候诊" });
      await run("placeCrowd", { mode: "chat", center: { x: -0.95, z: 1.8 }, width: 0.5, depth: 0.9, count: 2, groupSize: 2, avoid: false, name: "家属" });
    },
    walkers: { name: "医护", path: [{ x: 0.25, z: -6 }, { x: 0.25, z: 6.5 }], width: 0.5, count: 2, avoid: false },
  },
  {
    // 整块“现代便利店三壁内景”（射线实测：墙 x=-5.0..4.2、后墙 z=-3.2 冰柜，+z敞开；两排货架 z=0 与 z=1.6；收银台 x=2.2..2.6、z=0.8..2.4）。夜里的便利店。
    id: "convenienceStore", half: [5.5, 4], name: markMessages("便利店"), genre: "现代",
    view: view([2, 3.4, 8.5], [0, 0.8, -0.5]),
    async build(run) {
      await run("addAsset", { assetId: "masterArchitecture2909", name: "便利店", position: { x: 0, y: 0, z: 0 } });
      await run("addAsset", { assetId: "person", name: "收银员", position: { x: 3.55, y: 0, z: 1.6 }, faceToward: { x: 0, z: 1.6 } });
      await run("placeCrowd", { mode: "queue", path: [{ x: 1.7, z: 2.2 }, { x: 1.2, z: 2.9 }, { x: -1.5, z: 2.9 }], count: 2, avoid: false, name: "结账" });
      await run("placeCrowd", { mode: "wander", center: { x: -1.6, z: 0.8 }, width: 4.5, depth: 0.5, count: 2, groupSize: 1, avoid: false, name: "顾客" });
      await run("setTime", { hour: 21.5 });
      await run("setWeather", { lighting: { sunIntensity: 1.4, sunAzimuth: 200, sunElevation: 35, sunColor: "#a9bdf0", ambientIntensity: 0.9, ambientColor: "#7f93c9", skyIntensity: 0.6, exposure: 1.5, weatherInfluence: 1 } });
    },
    // 货架和冰柜之间的过道里有人慢慢走过。
    walkers: { name: "逛店", path: [{ x: -4.2, z: -1.5 }, { x: 3.4, z: -1.5 }], width: 0.5, count: 2, avoid: false },
  },
  {
    // 整块“现代酒吧三壁内景”（射线实测：墙 x=-4.8..4.4、后墙 z=-3.4，+z敞开；吧台 z=-1.4..-1.0、x=-2.8..2.4，吧凳 z=-0.2；右墙卡座 x≈3.0；左侧大桌 x=-4.4..-2.4、z=1.0..1.8）。
    id: "bar", half: [5.2, 4], name: markMessages("酒吧"), genre: "现代",
    view: view([0.5, 3.6, 9], [0, 0.9, -1]),
    async build(run) {
      await run("addAsset", { assetId: "masterArchitecture2899", name: "酒吧", position: { x: 0, y: 0, z: 0 } });
      await run("addAsset", { assetId: "person", name: "调酒师", position: { x: 0, y: 0, z: -2.3 }, faceToward: { x: 0, z: 3 } });
      await run("placeCrowd", { mode: "seated", seatPoints: [-2.4, -1.6, -0.8, 1.2, 2.0].map(x => ({ x, z: -0.2 })), target: { x: 0, z: -6 }, fill: 0.6, name: "吧客" });
      await run("placeCrowd", { mode: "seated", seatPoints: [0.4, 1.2, 2.2, 3.0].map(z => ({ x: 3.0, z })), target: { x: -20, z: 1.7 }, fill: 0.5, seed: 3, name: "卡座客" });
      await run("placeCrowd", { mode: "chat", center: { x: -0.6, z: 1.8 }, width: 1.6, depth: 1.2, count: 3, groupSize: 3, avoid: false, name: "酒客" });
      await run("setTime", { hour: 22.5 });
      await run("setWeather", { lighting: { sunIntensity: 0.8, sunAzimuth: 200, sunElevation: 35, sunColor: "#b9a6e6", ambientIntensity: 1, ambientColor: "#b0805c", skyIntensity: 0.4, exposure: 1.6, weatherInfluence: 1 } });
    },
  },
  {
    // 整块“古装衙门公堂三壁内景”（射线从2.2米往下实测：高台 z=-3.0..-1.4、高约0.4，案桌 x=-1.8..1.2、z=-2.6..-2.0，案后官椅座面约 x=-0.4、z=-2.75，椅背后贴着一道折屏 z≈-2.9（座位再往后就钻进屏风里了）；堂下 z=-1.0..3.4 空地，+z敞开）。
    id: "yamen", half: [5.5, 4], name: markMessages("衙门公堂"), genre: "古装",
    view: view([0.5, 3.4, 8.5], [-0.4, 0.9, -1]),
    async build(run) {
      await run("addAsset", { assetId: "masterArchitecture2847", name: "衙门公堂", position: { x: 0, y: 0, z: 0 } });
      await run("placeCrowd", { mode: "seated", seatPoints: [{ x: -0.4, z: -2.72 }], target: { x: -0.4, z: 6 }, floor: 0.49, name: "县官" });
      await run("placeCrowd", { mode: "audience", center: { x: -3.4, z: 1.0 }, width: 0.6, depth: 3.2, count: 3, groupSize: 3, target: { x: 0, z: 1.0 }, avoid: false, name: "衙役" });
      await run("placeCrowd", { mode: "audience", center: { x: 2.4, z: 1.0 }, width: 0.6, depth: 3.2, count: 3, groupSize: 3, target: { x: 0, z: 1.0 }, avoid: false, seed: 7, name: "衙役" });
      await run("addAsset", { assetId: "person", name: "犯人", position: { x: -0.6, y: 0, z: 0.4 }, faceToward: { x: -0.4, z: -2.7 } });
      await run("addAsset", { assetId: "person", name: "原告", position: { x: -1.8, y: 0, z: 0.9 }, faceToward: { x: -0.4, z: -2.7 } });
    },
  },
  {
    // 整块“古装大牢囚室三壁内景”（射线从2.2米往下实测：左半边稻草堆 x=-2.4..-0.4、z=-1.6..0.4，长凳 x=-2.4..-1.2、z=1.2..1.6，右后角木桶）；犯人坐长凳，探监的人站在囚室里。
    id: "prison", half: [3.2, 3], name: markMessages("大牢"), genre: "古装",
    view: view([0.4, 2.6, 6.5], [-0.6, 0.8, 0]),
    async build(run) {
      await run("addAsset", { assetId: "masterArchitecture2848", name: "大牢", position: { x: 0, y: 0, z: 0 } });
      await run("placeCrowd", { mode: "seated", seatPoints: [{ x: -1.8, z: 1.4 }], target: { x: 3, z: 1.4 }, name: "犯人" });
      await run("addAsset", { assetId: "person", name: "探监人", position: { x: 0.6, y: 0, z: 0.9 }, faceToward: { x: -1.8, z: 1.4 } });
      await run("addAsset", { assetId: "person", name: "狱卒", position: { x: 1.8, y: 0, z: 1.8 }, faceToward: { x: -1, z: 0.5 } });
      await run("setTime", { hour: 21 });
      await run("setWeather", { lighting: { sunIntensity: 0.9, sunAzimuth: 200, sunElevation: 35, sunColor: "#c9b48a", ambientIntensity: 0.9, ambientColor: "#8a7a62", skyIntensity: 0.4, exposure: 1.5, weatherInfluence: 1 } });
    },
  },
  {
    // 整块“古装喜堂三壁内景”（射线从2.2米往下实测：供桌 x=-1.2..0.4、z=-2.4..-2.0，两把太师椅座面约 x=-1.0/0.6、z=-1.2，红毯 z=-0.6..1.8）；高堂坐椅、新人站红毯面向高堂、司仪在侧、宾客两边站。
    id: "weddingHall", half: [3.8, 3.2], name: markMessages("喜堂拜堂"), genre: "古装",
    view: view([-0.2, 3.4, 6.8], [-0.2, 0.9, -1.2]),
    async build(run) {
      await run("addAsset", { assetId: "masterArchitecture2846", name: "喜堂", position: { x: 0, y: 0, z: 0 } });
      await run("placeCrowd", { mode: "seated", seatPoints: [{ x: -1.0, z: -1.2 }, { x: 0.6, z: -1.2 }], target: { x: -0.2, z: 6 }, name: "高堂" });
      await run("addAsset", { assetId: "person", name: "新郎", position: { x: -0.55, y: 0, z: 0.6 }, faceToward: { x: -0.2, z: -3 } });
      await run("addAsset", { assetId: "person", name: "新娘", position: { x: 0.15, y: 0, z: 0.6 }, faceToward: { x: -0.2, z: -3 } });
      await run("addAsset", { assetId: "person", name: "司仪", position: { x: 1.7, y: 0, z: -0.4 }, faceToward: { x: -0.2, z: 0.6 } });
      await run("placeCrowd", { mode: "audience", center: { x: -2.8, z: 1.0 }, width: 0.6, depth: 2.4, count: 3, groupSize: 3, target: { x: -0.2, z: 1.0 }, avoid: false, name: "宾客" });
      await run("placeCrowd", { mode: "audience", center: { x: 2.4, z: 1.2 }, width: 0.6, depth: 2.0, count: 3, groupSize: 3, target: { x: -0.2, z: 1.2 }, avoid: false, seed: 9, name: "宾客" });
      await run("setTime", { hour: 19.5 });
    },
  },
  {
    // 整块“古装灵堂三壁内景”（射线实测：棺椁 x≈0.2、z=-1.6..0.0、高约1.3，跪垫 x=-0.4..0.8、z=0.4..1.6、高约0.2）；孝子孝女跪在跪垫上（跪坐）、亲属分立两侧、吊唁者从前面进来。
    id: "mourningHall", half: [3.8, 3.2], name: markMessages("灵堂"), genre: "古装",
    view: view([0.8, 2.3, 6.6], [0.1, 1, -0.6]),
    async build(run) {
      await run("addAsset", { assetId: "masterArchitecture2845", name: "灵堂", position: { x: 0, y: 0, z: 0 } });
      await run("placeCrowd", { mode: "seated", posture: "kneel", seatPoints: [{ x: -0.05, z: 1.0 }, { x: 0.5, z: 1.05 }], target: { x: 0.2, z: -3 }, floor: 0.2, name: "孝子孝女" });
      await run("addAsset", { assetId: "person", name: "亲属", position: { x: -1.7, y: 0, z: -0.5 }, faceToward: { x: 0.2, z: -0.5 } });
      await run("addAsset", { assetId: "person", name: "亲属", position: { x: 2.1, y: 0, z: -0.3 }, faceToward: { x: 0.2, z: -0.5 } });
      await run("addAsset", { assetId: "person", name: "吊唁者", position: { x: 1.5, y: 0, z: 2.2 }, faceToward: { x: 0.2, z: -3 } });
      await run("setTime", { hour: 20.5 });
      await run("setWeather", { lighting: { sunIntensity: 0.8, sunAzimuth: 200, sunElevation: 35, sunColor: "#c8cbd6", ambientIntensity: 0.9, ambientColor: "#6f7480", skyIntensity: 0.4, exposure: 1.5, weatherInfluence: 1 } });
    },
  },
  {
    // 整块“古装书房三壁内景”（射线实测：书案 x=-0.6..1.2、z=0..0.3，案后圈椅座面约 x=0.4、z=-0.45，背墙书架，案前客凳 x=-0.3、z=1.2）；主人坐案后、来客站案前、书童在侧。
    id: "study", half: [3.2, 3], name: markMessages("书房"), genre: "古装",
    view: view([0.6, 2, 5.8], [0.3, 1, -0.4]),
    async build(run) {
      await run("addAsset", { assetId: "masterArchitecture2842", name: "书房", position: { x: 0, y: 0, z: 0 } });
      await run("placeCrowd", { mode: "seated", seatPoints: [{ x: 0.4, z: -0.45 }], target: { x: 0.4, z: 6 }, name: "主人" });
      await run("addAsset", { assetId: "person", name: "来客", position: { x: 0.8, y: 0, z: 1.05 }, faceToward: { x: 0.4, z: -0.45 } });
      await run("addAsset", { assetId: "person", name: "书童", position: { x: -1.4, y: 0, z: -0.7 }, faceToward: { x: 0.4, z: -0.2 } });
    },
  },
  {
    // 整块“古装闺房绣楼三壁内景”（射线实测：梳妆台 x=-0.9..-0.3、z=-1.8..-1.5，台前绣凳 x=-0.6、z=-0.9，拔步床 x=0.6..2.1、z=-1.8..0）；小姐对镜坐、丫鬟侍立。
    id: "boudoir", half: [3.2, 3], name: markMessages("闺房"), genre: "古装",
    view: view([0.2, 1.9, 5.6], [-0.2, 1, -0.8]),
    async build(run) {
      await run("addAsset", { assetId: "masterArchitecture2843", name: "闺房", position: { x: 0, y: 0, z: 0 } });
      await run("placeCrowd", { mode: "seated", seatPoints: [{ x: -0.6, z: -0.9 }], target: { x: -0.6, z: -3 }, name: "小姐" });
      await run("addAsset", { assetId: "person", name: "丫鬟", position: { x: 0.05, y: 0, z: -0.45 }, faceToward: { x: -0.6, z: -0.9 } });
    },
  },
  {
    // 整块“古装客栈客房三壁内景”（射线实测：床靠左墙 x=-2.4..-1.2、z=-1.8..0，方桌 x=0.3..0.9、z=-0.6..0，桌边凳 x=0/1.2、z=-0.3 和 x=0.6、z=0.45）；两人隔桌对坐，小二进门送茶。
    id: "innRoom", half: [3.2, 3], name: markMessages("客栈客房"), genre: "古装",
    view: view([0.3, 2, 5.6], [0.3, 0.9, -0.5]),
    async build(run) {
      await run("addAsset", { assetId: "masterArchitecture2841", name: "客栈客房", position: { x: 0, y: 0, z: 0 } });
      await run("placeCrowd", { mode: "seated", seatPoints: [{ x: 0, z: -0.3 }], target: { x: 0.6, z: -0.3 }, name: "客人" });
      await run("placeCrowd", { mode: "seated", seatPoints: [{ x: 1.3, z: -0.3 }], target: { x: 0.6, z: -0.3 }, name: "来访者" });
      await run("addAsset", { assetId: "person", name: "小二", position: { x: -0.6, y: 0, z: 1.3 }, faceToward: { x: 0.6, z: -0.3 } });
      await run("setTime", { hour: 20 });
    },
  },
  {
    // 整块“民国老上海公寓客厅三壁内景”（射线实测：沙发靠后墙 x=-0.6..0.9、z=-1.8..-1.5，圆茶几 x≈0.15、z=-0.9..0，地毯 z=0.25..1.55）；夫妇坐沙发、访客站地毯上、女佣在侧。
    id: "shanghaiParlor", half: [3.4, 3], name: markMessages("民国客厅"), genre: "民国",
    view: view([-0.4, 1.9, 5.8], [0.1, 1, -0.8]),
    async build(run) {
      await run("addAsset", { assetId: "masterArchitecture2849", name: "民国客厅", position: { x: 0, y: 0, z: 0 } });
      await run("placeCrowd", { mode: "seated", seatPoints: [{ x: -0.2, z: -1.6 }, { x: 0.55, z: -1.6 }], target: { x: 0.15, z: 6 }, name: "主人" });
      await run("addAsset", { assetId: "person", name: "访客", position: { x: 1.15, y: 0, z: 0.5 }, faceToward: { x: 0.15, z: -1.6 } });
      await run("addAsset", { assetId: "person", name: "女佣", position: { x: -1.6, y: 0, z: 0.3 }, faceToward: { x: 0.15, z: -0.5 } });
      await run("setTime", { hour: 20 });
    },
  },
  {
    // 整块“古装药铺堂屋三壁内景百子柜”（射线实测：后墙百子柜 x=-2.7..2.7、z=-2.4..-2.1，柜台横在前面 x=-1.8..1.8、z=0.9..1.2，台前候诊凳 x=-1.8/-1.2、z=2.1）；掌柜在柜台后面朝外，伙计在百子柜前抓药，病人坐凳上、家属在台前。
    id: "apothecary", half: [3.6, 3.2], name: markMessages("药铺"), genre: "古装",
    view: view([1.2, 2.3, 6.4], [0, 1.1, -0.6]),
    async build(run) {
      await run("addAsset", { assetId: "masterArchitecture2844", name: "药铺", position: { x: 0, y: 0, z: 0 } });
      await run("addAsset", { assetId: "person", name: "掌柜", position: { x: 0.2, y: 0, z: 0.35 }, faceToward: { x: 0.2, z: 3 } });
      await run("addAsset", { assetId: "person", name: "伙计", position: { x: -1.4, y: 0, z: -1.45 }, faceToward: { x: -1.4, z: -3 } });
      await run("placeCrowd", { mode: "seated", seatPoints: [{ x: -1.8, z: 2.1 }], target: { x: 0.2, z: 1 }, name: "病人" });
      await run("addAsset", { assetId: "person", name: "家属", position: { x: 0.5, y: 0, z: 1.75 }, faceToward: { x: 0.2, z: 0.35 } });
    },
  },
  {
    // 整块“现代警局办公室三壁内景证物板”（射线实测：两排办公桌 x=-2.7..-1.5 / -0.3..0.9、z=-1.2..-0.6 与 0.9..1.5，椅子在桌子+z侧 x=-2.1 / 0.45，后墙证物板 x≈0..1.6，右墙白板 x≈3.3）；队长站在后墙证物板旁给大家讲案情。
    id: "policeOffice", half: [3.8, 3.2], name: markMessages("警局办公室"), genre: "现代",
    view: view([-0.6, 2.3, 6.2], [0.6, 1.1, -0.6]),
    async build(run) {
      await run("addAsset", { assetId: "masterArchitecture2855", name: "警局办公室", position: { x: 0, y: 0, z: 0 } });
      await run("addAsset", { assetId: "person", name: "队长", position: { x: 1.9, y: 0, z: -1.75 }, faceToward: { x: 0.3, z: 0.6 } });
      await run("placeCrowd", { mode: "seated", seatPoints: [{ x: 0.45, z: -0.15 }], target: { x: 1.9, z: -1.75 }, name: "警员" });
      await run("placeCrowd", { mode: "seated", seatPoints: [{ x: 0.45, z: 1.95 }], target: { x: 1.9, z: -1.75 }, seed: 3, name: "警员" });
      await run("addAsset", { assetId: "person", name: "警员", position: { x: 2.5, y: 0, z: 0.5 }, faceToward: { x: 1.9, z: -1.75 } });
      await run("setTime", { hour: 21 });
      await run("setWeather", { lighting: { sunIntensity: 1.4, sunAzimuth: 200, sunElevation: 35, sunColor: "#a9bdf0", ambientIntensity: 0.9, ambientColor: "#7f93c9", skyIntensity: 0.6, exposure: 1.5, weatherInfluence: 1 } });
    },
  },
  {
    // 整块“民国理发店三壁内景”（射线实测：后墙镜台 x=-2.1..2.1、z=-2.1..-1.8，两把理发椅 x≈-1.65 / 1.05、z=-0.75（座面高0.91，比一般椅子高，座位抬到0.46），前面等候长凳 x=-2.7..-1.2、z=1.8）；客人坐理发椅对镜、师傅站在身后，长凳上有人等着。
    id: "barberShop", half: [3.6, 3.2], name: markMessages("理发店"), genre: "民国",
    view: view([0.9, 2, 5.8], [-0.4, 1.1, -1]),
    async build(run) {
      await run("addAsset", { assetId: "masterArchitecture2850", name: "理发店", position: { x: 0, y: 0, z: 0 } });
      await run("placeCrowd", { mode: "seated", seatPoints: [{ x: -1.65, z: -0.75 }], target: { x: -1.65, z: -3 }, floor: 0.46, name: "客人" });
      await run("addAsset", { assetId: "person", name: "师傅", position: { x: -1.6, y: 0, z: 0.05 }, faceToward: { x: -1.65, z: -0.75 } });
      await run("placeCrowd", { mode: "seated", seatPoints: [{ x: -2.1, z: 1.8 }], target: { x: -2.1, z: -3 }, name: "等候" });
      await run("addAsset", { assetId: "person", name: "伙计", position: { x: 1.0, y: 0, z: 0.4 }, faceToward: { x: -1.6, z: 0.05 } });
    },
  },
  {
    // 整块“戏班后台化妆间三壁内景”（射线实测：后墙一排三张妆台 x=-3.0..1.8、z=-2.1..-1.8，台前凳 x=-2.4 / -0.6 / 1.2、z=-1.2，前面两排戏服架 z=1.5、x=-3.3..-1.5 / -0.6..1.2，中间和右边留口子）；角儿对镜上妆，化妆师在旁，班主从右边进来。
    id: "backstage", half: [3.8, 3.2], name: markMessages("戏班后台"), genre: "民国",
    view: view([3, 2.2, 3.2], [-1, 1, -1.4]),
    async build(run) {
      await run("addAsset", { assetId: "masterArchitecture2853", name: "戏班后台", position: { x: 0, y: 0, z: 0 } });
      await run("placeCrowd", { mode: "seated", seatPoints: [{ x: -0.6, z: -1.2 }], target: { x: -0.6, z: -3 }, name: "角儿" });
      await run("placeCrowd", { mode: "seated", seatPoints: [{ x: 1.2, z: -1.2 }], target: { x: 1.2, z: -3 }, seed: 5, name: "配角" });
      await run("addAsset", { assetId: "person", name: "化妆师", position: { x: -0.05, y: 0, z: -0.85 }, faceToward: { x: -0.6, z: -1.3 } });
      await run("addAsset", { assetId: "person", name: "班主", position: { x: 2.0, y: 0, z: -0.2 }, faceToward: { x: -0.6, z: -1.2 } });
      await run("setTime", { hour: 19.5 });
    },
  },
  {
    // 整块“现代总裁办公室三壁内景落地窗夜景”（射线实测：大班台 x=-1.2..0.8、z=-1.6..-0.8，台后老板椅约 x=-0.2、z=-2.0，台前两把访客椅 x=-0.8/0.4、z=0，左墙沙发 x≈-3.0、z=0.4..2.0）；总裁坐台后，访客坐台前，秘书站在一边。
    id: "ceoOffice", half: [4, 3.4], name: markMessages("总裁办公室"), genre: "现代",
    view: view([0.6, 2.2, 6.4], [-0.2, 1, -1]),
    async build(run) {
      await run("addAsset", { assetId: "masterArchitecture2891", name: "总裁办公室", position: { x: 0, y: 0, z: 0 } });
      await run("placeCrowd", { mode: "seated", seatPoints: [{ x: -0.2, z: -2.0 }], target: { x: -0.2, z: 6 }, name: "总裁" });
      await run("placeCrowd", { mode: "seated", seatPoints: [{ x: -0.8, z: 0 }], target: { x: -0.2, z: -2 }, seed: 3, name: "访客" });
      await run("addAsset", { assetId: "person", name: "秘书", position: { x: 1.7, y: 0, z: -0.9 }, faceToward: { x: -0.2, z: -1.4 } });
      await run("setTime", { hour: 20.5 });
    },
  },
  {
    // 整块“现代酒店客房三壁内景大床窗帘”（射线实测：大床床头靠后墙 x=-0.4..1.2、z=-2.6..-1.4，床尾凳 z≈-1.0，左墙矮柜 x≈-2.4、右墙书桌 x≈2.8）；一人坐床尾，另一人站在床前。
    id: "hotelRoom", half: [3.6, 3.4], name: markMessages("酒店客房"), genre: "现代",
    view: view([0.8, 2.1, 6], [0.3, 0.9, -1]),
    async build(run) {
      await run("addAsset", { assetId: "masterArchitecture2893", name: "酒店客房", position: { x: 0, y: 0, z: 0 } });
      await run("placeCrowd", { mode: "seated", seatPoints: [{ x: 0.4, z: -1.5 }], target: { x: 0.4, z: 6 }, name: "住客" });
      await run("addAsset", { assetId: "person", name: "来人", position: { x: 1.3, y: 0, z: 0.4 }, faceToward: { x: 0.4, z: -1.5 } });
      await run("setTime", { hour: 22 });
    },
  },
  {
    // 整块“中餐包间三壁内景大圆桌转盘屏风”（射线实测：大圆桌中心约 x=0、z=0.4、半径约0.9，椅子一圈在半径约1.6处，左墙屏风 x≈-3.2）；一桌人围坐吃饭，服务员站在边上。
    id: "privateDining", half: [3.6, 3.2], name: markMessages("中餐包间"), genre: "现代",
    view: view([1.6, 2.6, 5.8], [0, 0.8, 0.2]),
    async build(run) {
      await run("addAsset", { assetId: "masterArchitecture2911", name: "中餐包间", position: { x: 0, y: 0, z: 0 } });
      await run("placeCrowd", { mode: "seated", seatPoints: [{ x: -0.4, z: -1.2 }, { x: 0.4, z: -1.2 }, { x: 1.2, z: -0.4 }, { x: -1.6, z: 0.4 }, { x: 1.2, z: 1.2 }, { x: -0.4, z: 2.0 }, { x: 0.4, z: 2.0 }], target: { x: 0, z: 0.4 }, name: "宾客" });
      await run("addAsset", { assetId: "person", name: "服务员", position: { x: 2.4, y: 0, z: -1.4 }, faceToward: { x: 0, z: 0.4 } });
      await run("setTime", { hour: 19.5 });
    },
  },
  {
    // 整块“现代卧室三壁内景大床衣柜梳妆台”（射线实测：大床床头靠后墙 x=-0.4..0.8、z=-2.0..-0.4，床头柜 x≈1.6..2.0、z=-2.0，左墙衣柜 x≈-2.4，右前梳妆台 x≈1.2..2.0、z=1.6）；一人坐床边，一人站着。
    id: "bedroom", half: [3.2, 3.2], name: markMessages("现代卧室"), genre: "现代",
    view: view([0.6, 2, 5.6], [0.2, 0.9, -0.8]),
    async build(run) {
      await run("addAsset", { assetId: "masterArchitecture2906", name: "现代卧室", position: { x: 0, y: 0, z: 0 } });
      await run("placeCrowd", { mode: "seated", seatPoints: [{ x: 0.2, z: -0.6 }], target: { x: 0.2, z: 6 }, name: "女主" });
      await run("addAsset", { assetId: "person", name: "男主", position: { x: 1.2, y: 0, z: 0.8 }, faceToward: { x: 0.2, z: -0.6 } });
      await run("setTime", { hour: 22.5 });
    },
  },
  {
    // 整块“古装御书房三壁内景龙案奏折”（射线实测：龙案 x=-1.2..1.2、z=-1.6..-0.8，案后御座约 x=-0.2、z=-2.0，左墙书架 x≈-3.6，案前 z=0.4..2.8 空地）；皇帝坐案后批奏折，大臣在案前回话，太监侍立一旁。
    id: "imperialStudy", half: [4, 3.6], name: markMessages("御书房"), genre: "古装",
    view: view([0.8, 2.4, 6.8], [-0.2, 1, -1.2]),
    async build(run) {
      await run("addAsset", { assetId: "masterArchitecture2871", name: "御书房", position: { x: 0, y: 0, z: 0 } });
      await run("placeCrowd", { mode: "seated", seatPoints: [{ x: -0.2, z: -2.0 }], target: { x: -0.2, z: 6 }, name: "皇帝" });
      await run("addAsset", { assetId: "person", name: "大臣", position: { x: -0.2, y: 0, z: 1.0 }, faceToward: { x: -0.2, z: -2 } });
      await run("addAsset", { assetId: "person", name: "太监", position: { x: 1.9, y: 0, z: -1.7 }, faceToward: { x: -0.2, z: 0 } });
    },
  },
  {
    // 整块“古装茶馆三壁内景说书台柜台”（射线实测：说书台平台高0.82、x=-1.6..1.2、z=-3.2..-1.6，台上书桌 z≈-2.6；右墙柜台 x≈4.0..4.8；中排四张茶桌 z=0..0.4、长凳在桌北 z=-0.4，前排两桌 x=±2.4、z=2.4..2.8、长凳在桌南 z=3.2）；说书人站台上，茶客坐着听，小二在柜台边。
    id: "teahouse", half: [5, 4], name: markMessages("茶馆说书"), genre: "古装",
    view: view([1.2, 2.8, 7.6], [0, 1, -1.2]),
    async build(run) {
      await run("addAsset", { assetId: "masterArchitecture2877", name: "茶馆", position: { x: 0, y: 0, z: 0 } });
      await run("addAsset", { assetId: "person", name: "说书人", position: { x: 0, y: 0.82, z: -3.0 }, faceToward: { x: 0, z: 3 } });
      await run("placeCrowd", { mode: "seated", seatPoints: [{ x: -3.6, z: -0.4 }, { x: -1.2, z: -0.4 }, { x: 1.2, z: -0.4 }, { x: 3.6, z: -0.4 }, { x: -2.4, z: 3.2 }, { x: 2.4, z: 3.2 }], target: { x: 0, z: -2.4 }, fill: 0.85, name: "茶客" });
      await run("addAsset", { assetId: "person", name: "小二", position: { x: 3.2, y: 0, z: -1.6 }, faceToward: { x: 0, z: 0 } });
    },
  },
  {
    // 整块“古装中军大帐三壁内景帅案沙盘”（射线实测：帐内满铺木台高0.18，帅案 x=-0.8..1.2、z=-2.4..-2.0，案后帅椅座面0.65、约 x=0.2、z=-2.8，右前沙盘 x=1.2..3.2、z=0.4..1.6）；将军坐帅案后，副将回话，谋士看沙盘，传令兵在帐中。夜里点灯议事。
    id: "warTent", half: [4.4, 3.8], name: markMessages("中军大帐"), genre: "古装",
    view: view([0.2, 2.6, 7], [0.4, 1, -1]),
    async build(run) {
      await run("addAsset", { assetId: "masterArchitecture2878", name: "中军大帐", position: { x: 0, y: 0, z: 0 } });
      await run("placeCrowd", { mode: "seated", seatPoints: [{ x: 0.2, z: -2.7 }], target: { x: 0.2, z: 6 }, floor: 0.2, name: "将军" });
      await run("addAsset", { assetId: "person", name: "副将", position: { x: -1.3, y: 0.18, z: -0.7 }, faceToward: { x: 0.2, z: -2.6 } });
      await run("addAsset", { assetId: "person", name: "谋士", position: { x: 2.2, y: 0.18, z: -0.2 }, faceToward: { x: 2.2, z: 1.0 } });
      await run("addAsset", { assetId: "person", name: "传令兵", position: { x: 0.9, y: 0.18, z: 1.9 }, faceToward: { x: 0.2, z: -2.6 } });
      await run("setTime", { hour: 21 });
      await run("setWeather", { lighting: { sunIntensity: 0.9, sunAzimuth: 200, sunElevation: 35, sunColor: "#d8b98a", ambientIntensity: 0.95, ambientColor: "#8a7258", skyIntensity: 0.4, exposure: 1.5, weatherInfluence: 1 } });
    },
  },
  {
    // 整块“现代KTV包间三壁内景沙发大屏灯球”（射线实测：长沙发靠后墙 x=-1.6..2.0、座面 z=-1.6，茶几 x=0..1.2、z=0.4，右前音箱 x≈2.6）；朋友们坐沙发，一人拿麦站在茶几边唱。
    id: "ktv", half: [3.4, 3.2], name: markMessages("KTV包间"), genre: "现代",
    view: view([0.4, 2.1, 5.8], [0.2, 0.9, -0.8]),
    async build(run) {
      await run("addAsset", { assetId: "masterArchitecture2900", name: "KTV包间", position: { x: 0, y: 0, z: 0 } });
      await run("placeCrowd", { mode: "seated", seatPoints: [{ x: -1.2, z: -1.6 }, { x: -0.4, z: -1.6 }, { x: 0.4, z: -1.6 }, { x: 1.2, z: -1.6 }], target: { x: 0.2, z: 6 }, fill: 0.8, name: "朋友" });
      await run("addAsset", { assetId: "person", name: "麦霸", position: { x: -1.0, y: 0, z: 0.7 }, faceToward: { x: 0.2, z: -1.6 } });
      await run("setTime", { hour: 23 });
    },
  },
  {
    // 整块“现代会议室三壁内景长桌投影幕”（射线实测：长会议桌 x=-2.4..2.0、z=0..0.8（中线 z=0.4），北侧椅子 z=-0.4、南侧 z=1.2，西头主位椅 x≈-2.8）；老板坐主位，几个人分坐两边开会。
    id: "meetingRoom", half: [4.8, 3.6], name: markMessages("会议室"), genre: "现代",
    view: view([1.8, 2.6, 6.6], [-0.4, 0.9, 0]),
    async build(run) {
      await run("addAsset", { assetId: "masterArchitecture2892", name: "会议室", position: { x: 0, y: 0, z: 0 } });
      await run("placeCrowd", { mode: "seated", seatPoints: [{ x: -2.8, z: 0.4 }], target: { x: 3, z: 0.4 }, name: "老板" });
      await run("placeCrowd", { mode: "seated", seatPoints: [{ x: -1.8, z: -0.4 }, { x: -0.8, z: -0.4 }, { x: 0, z: -0.4 }, { x: 0.8, z: -0.4 }, { x: 1.8, z: -0.4 }], target: { x: -1.2, z: 0.4 }, fill: 0.8, seed: 2, name: "同事" });
      await run("placeCrowd", { mode: "seated", seatPoints: [{ x: -1.8, z: 1.2 }, { x: -0.8, z: 1.2 }, { x: 0, z: 1.2 }, { x: 0.8, z: 1.2 }, { x: 1.8, z: 1.2 }], target: { x: -1.2, z: 0.4 }, fill: 0.6, seed: 5, name: "同事" });
    },
  },
  {
    // 整块“八十年代家庭客厅三壁内景沙发电视缝纫机”（射线实测：屋子 x=-3.2..1.6，后墙一排柜子，长沙发 x=-2.4..-0.8、座面 z≈-1.4，右后电视柜缝纫机 x=0.8..1.6）；年代剧一家人：父母坐沙发，孩子站着说话。
    id: "eightiesHome", half: [3.6, 3.2], name: markMessages("八十年代客厅"), genre: "现代",
    view: view([-0.4, 2.1, 5.6], [-0.8, 0.9, -0.8]),
    async build(run) {
      await run("addAsset", { assetId: "masterArchitecture2888", name: "八十年代客厅", position: { x: 0, y: 0, z: 0 } });
      await run("placeCrowd", { mode: "seated", seatPoints: [{ x: -2.0, z: -1.4 }, { x: -1.2, z: -1.4 }], target: { x: -1.6, z: 6 }, name: "父母" });
      await run("addAsset", { assetId: "person", name: "孩子", position: { x: -0.2, y: 0, z: 0.5 }, faceToward: { x: -1.6, z: -1.4 } });
      await run("setTime", { hour: 20 });
    },
  },
  {
    // 整块“现代厨房三壁内景橱柜灶台冰箱”（射线实测：后墙橱柜灶台 x=-2.4..1.6、z=-1.6..-1.2，左墙橱柜 x=-2.4..-2.0，冰箱 x≈1.6..2.0、z=-1.2，小餐桌 x=-0.4..0.4、z=1.2..1.6，桌南椅 z=2.0）；妈妈在灶台前做饭，孩子坐餐桌边，爸爸站着说话。
    id: "kitchen", half: [3.2, 3], name: markMessages("现代厨房"), genre: "现代",
    view: view([1.4, 2, 5.8], [-0.2, 1, -0.6]),
    async build(run) {
      await run("addAsset", { assetId: "masterArchitecture2907", name: "现代厨房", position: { x: 0, y: 0, z: 0 } });
      await run("addAsset", { assetId: "person", name: "妈妈", position: { x: -0.6, y: 0, z: -0.85 }, faceToward: { x: -0.6, z: -3 } });
      await run("placeCrowd", { mode: "seated", seatPoints: [{ x: 0, z: 2.0 }], target: { x: 0, z: 1.4 }, name: "孩子" });
      await run("addAsset", { assetId: "person", name: "爸爸", position: { x: 1.1, y: 0, z: 0.3 }, faceToward: { x: -0.6, z: -0.85 } });
      await run("setTime", { hour: 18.5 });
    },
  },
  {
    // 整块“现代手术室三壁内景无影灯”（射线实测：手术台在中间 x≈0、z=-0.4..0.4，后墙器械柜 x=-2.8..1.6、z=-2.4..-2.0，无影灯在台上方）；主刀、助手站手术台两边，护士在器械旁。
    id: "operatingRoom", half: [3.2, 3], name: markMessages("手术室"), genre: "现代",
    view: view([1.6, 2.4, 5.6], [0, 1, 0]),
    async build(run) {
      await run("addAsset", { assetId: "masterArchitecture2856", name: "手术室", position: { x: 0, y: 0, z: 0 } });
      await run("addAsset", { assetId: "person", name: "主刀", position: { x: -0.85, y: 0, z: 0 }, faceToward: { x: 0, z: 0 } });
      await run("addAsset", { assetId: "person", name: "助手", position: { x: 0.85, y: 0, z: -0.1 }, faceToward: { x: 0, z: 0 } });
      await run("addAsset", { assetId: "person", name: "护士", position: { x: 0.9, y: 0, z: 1.2 }, faceToward: { x: 0, z: 0 } });
    },
  },
  {
    // 整块“民国咖啡厅三壁内景吧台圆桌”（射线实测：后墙吧台酒柜 x=-2.4..2.4、z=-2.8..-2.4，前面两排小圆桌（z≈0.6 和 2.6），中间那桌 x≈-0.2、两边椅子 x=-0.8/0.4）；一对男女隔着小圆桌说话，侍者站在吧台前，邻桌有客人。
    id: "minguoCafe", half: [4.8, 3.6], name: markMessages("民国咖啡厅"), genre: "民国",
    view: view([0.8, 2.2, 6.6], [-0.2, 1, -0.4]),
    async build(run) {
      await run("addAsset", { assetId: "masterArchitecture2881", name: "民国咖啡厅", position: { x: 0, y: 0, z: 0 } });
      await run("placeCrowd", { mode: "seated", seatPoints: [{ x: -0.8, z: 0.4 }], target: { x: 0.4, z: 0.4 }, name: "先生" });
      await run("placeCrowd", { mode: "seated", seatPoints: [{ x: 0.4, z: 0.4 }], target: { x: -0.8, z: 0.4 }, seed: 4, name: "小姐" });
      await run("placeCrowd", { mode: "seated", seatPoints: [{ x: -3.2, z: 0.4 }, { x: 2.8, z: 2.4 }], target: { x: -0.2, z: 1.4 }, seed: 7, name: "客人" });
      await run("addAsset", { assetId: "person", name: "侍者", position: { x: 0.9, y: 0, z: -1.7 }, faceToward: { x: -0.2, z: 0.4 } });
      await run("setTime", { hour: 20.5 });
    },
  },
  {
    // 整块“现代酒店走廊三壁内景客房门成排”（射线实测：走廊 x=-1.4..1.4、z=-6..7，满铺地毯高0.12，两侧一排客房门）；两人在走廊里迎面站着说话，一个客人沿走廊边走过。
    id: "hotelCorridor", half: [2.2, 7.5], name: markMessages("酒店走廊"), genre: "现代",
    view: view([0.4, 1.9, 9.5], [0, 1.2, -1]),
    async build(run) {
      await run("addAsset", { assetId: "masterArchitecture2894", name: "酒店走廊", position: { x: 0, y: 0, z: 0 } });
      await run("addAsset", { assetId: "person", name: "男人", position: { x: -0.3, y: 0.12, z: -0.6 }, faceToward: { x: -0.1, z: 1 } });
      await run("addAsset", { assetId: "person", name: "女人", position: { x: 0.1, y: 0.12, z: 0.9 }, faceToward: { x: -0.3, z: -0.6 } });
      await run("setTime", { hour: 22.5 });
    },
    walkers: { name: "客人", path: [{ x: 0.9, z: -5.5 }, { x: 0.9, z: 6.5 }], width: 0.5, count: 1, floor: 0.12, avoid: false },
  },
  {
    // 整块“古装青楼花厅三壁内景舞台二楼挑台”（射线实测：后面舞台高0.75、x=-2.0..1.6、z=-3.6..-1.6，两侧和前排小桌，椅子座面0.58：西桌椅 x=-2.8/-4.4、东桌椅 x=1.6/3.2、前排椅 x=-1.2、z=2.0 和 x=0.4、z=2.4）；舞姬在台上，客人围桌看，老鸨在一边招呼。
    id: "brothelHall", half: [5, 4.2], name: markMessages("青楼花厅"), genre: "古装",
    view: view([0.6, 3, 8], [-0.2, 1, -1.2]),
    async build(run) {
      await run("addAsset", { assetId: "masterArchitecture2873", name: "青楼花厅", position: { x: 0, y: 0, z: 0 } });
      await run("addAsset", { assetId: "person", name: "舞姬", position: { x: -0.2, y: 0.75, z: -2.6 }, faceToward: { x: -0.2, z: 3 } });
      await run("placeCrowd", { mode: "seated", seatPoints: [{ x: -2.8, z: 0 }, { x: 1.6, z: 0.4 }, { x: -1.2, z: 2.0 }, { x: 0.4, z: 2.4 }, { x: 3.2, z: 0 }], target: { x: -0.2, z: -2.6 }, fill: 0.85, name: "客人" });
      await run("addAsset", { assetId: "person", name: "老鸨", position: { x: 2.6, y: 0, z: 1.8 }, faceToward: { x: 0.4, z: 2.4 } });
      await run("setTime", { hour: 21 });
    },
  },
  {
    // 整块“古装后妃寝殿三壁内景凤榻妆台古筝”（射线实测：凤榻 x=0.8..2.4、z=-2.0..-0.4，左后妆台 x=-1.6..-0.8、z=-2.0、妆凳 x=-1.2、z=-1.2，左前古筝 x=-2.8..-1.6、z=0.8，榻尾矮凳 z=0.4）；娘娘坐在凤榻边，宫女侍立，太医/来人站在榻前。
    id: "consortChamber", half: [3.6, 3.2], name: markMessages("后妃寝殿"), genre: "古装",
    view: view([0.2, 2.2, 6.2], [0.4, 1, -0.8]),
    async build(run) {
      await run("addAsset", { assetId: "masterArchitecture2872", name: "后妃寝殿", position: { x: 0, y: 0, z: 0 } });
      await run("placeCrowd", { mode: "seated", seatPoints: [{ x: 1.6, z: -0.6 }], target: { x: 1.6, z: 6 }, name: "娘娘" });
      await run("addAsset", { assetId: "person", name: "宫女", position: { x: 0.6, y: 0, z: 0.5 }, faceToward: { x: 1.6, z: -0.6 } });
      await run("addAsset", { assetId: "person", name: "太医", position: { x: -0.3, y: 0, z: 0.9 }, faceToward: { x: 1.6, z: -0.6 } });
      await run("setTime", { hour: 21.5 });
    },
  },
  {
    // 整块“古装镖局练功房三壁内景兵器架梅花桩”（射线实测：地面0.12，中间3×3梅花桩 x=-1.2/0/1.2、z=-0.4/0.8/2.0，桩顶高低不一（0.62到1.32），四周兵器架）；两个徒弟站在桩顶对练（武侠戏，人站在桩顶上），师父在地上看。
    id: "martialHall", half: [5, 4], name: markMessages("镖局练功房"), genre: "古装",
    view: view([3.2, 2.2, 6.4], [0.4, 1.3, 0.4]),
    async build(run) {
      await run("addAsset", { assetId: "masterArchitecture2875", name: "镖局练功房", position: { x: 0, y: 0, z: 0 } });
      await run("addAsset", { assetId: "person", name: "徒弟甲", position: { x: 0, y: 0.92, z: 0.8 }, faceToward: { x: 1.2, z: 0.8 } });
      await run("addAsset", { assetId: "person", name: "徒弟乙", position: { x: 1.2, y: 0.82, z: 0.8 }, faceToward: { x: 0, z: 0.8 } });
      await run("addAsset", { assetId: "person", name: "师父", position: { x: -2.6, y: 0, z: -1.6 }, faceToward: { x: 0.6, z: 0.8 } });
    },
  },
  {
    // 整块“古装古墓墓室三壁内景石棺长明灯”（射线实测：石棺顺着进深放 x=-0.4..0.8、z=-2.0..0.4，两侧长明灯 x=-1.6/2.0，右墙壁龛 x≈3.2）；三个人举着火围着石棺，夜里没有天光，只有灯火。
    id: "tomb", half: [4.4, 4.2], name: markMessages("古墓墓室"), genre: "古装",
    view: view([0.8, 2.6, 6.8], [0.2, 0.9, -0.8]),
    async build(run) {
      await run("addAsset", { assetId: "masterArchitecture2879", name: "古墓墓室", position: { x: 0, y: 0, z: 0 } });
      await run("addAsset", { assetId: "person", name: "领头", position: { x: 0.2, y: 0, z: 1.4 }, faceToward: { x: 0.2, z: -0.8 } });
      await run("addAsset", { assetId: "person", name: "队员甲", position: { x: -1.0, y: 0, z: -0.3 }, faceToward: { x: 0.2, z: -0.8 } });
      await run("addAsset", { assetId: "person", name: "队员乙", position: { x: 1.5, y: 0, z: 0.2 }, faceToward: { x: 0.2, z: -0.8 } });
      await run("setTime", { hour: 23 });
      await run("setWeather", { lighting: { sunIntensity: 0.6, sunAzimuth: 200, sunElevation: 35, sunColor: "#c9a46e", ambientIntensity: 0.85, ambientColor: "#6e5a44", skyIntensity: 0.2, exposure: 1.6, weatherInfluence: 1 } });
    },
  },
  {
    // 整块“民国督军府会客厅三壁内景壁炉沙发座钟”（射线实测：后墙壁炉 x=-1.2..1.2，中间长沙发 x=-0.8..0.8、座面 z≈-0.6，茶几 z=0.4..0.8，两侧单人沙发 x=-2.2/2.2、z≈0.6，前排长沙发背对镜头 z=2.0）；督军坐中间沙发，客人坐单人沙发，副官站在一边。
    id: "warlordParlor", half: [4.6, 3.6], name: markMessages("督军府会客厅"), genre: "民国",
    view: view([1.2, 2.3, 6.6], [0, 0.9, -0.6]),
    async build(run) {
      await run("addAsset", { assetId: "masterArchitecture2885", name: "督军府会客厅", position: { x: 0, y: 0, z: 0 } });
      await run("placeCrowd", { mode: "seated", seatPoints: [{ x: 0, z: -0.6 }], target: { x: 0, z: 6 }, name: "督军" });
      await run("placeCrowd", { mode: "seated", seatPoints: [{ x: 2.2, z: 0.6 }], target: { x: 0, z: -0.6 }, seed: 6, name: "客人" });
      await run("addAsset", { assetId: "person", name: "副官", position: { x: -1.6, y: 0, z: -1.3 }, faceToward: { x: 0, z: -0.6 } });
      await run("setTime", { hour: 21 });
    },
  },
  {
    // 整块“民国舞厅三壁内景舞池乐队台卡座”（射线实测：后面大乐队台高1.02、z=-4.0..-1.6，舞池地面0.12、z=-1.2..4.4，左墙卡座座面0.56、x=-4.4，右墙吧台 x≈4.2）；歌女在台上唱，舞池里两对跳舞，卡座有客人看。
    id: "ballroom", half: [5.6, 4.8], name: markMessages("民国舞厅"), genre: "民国",
    view: view([1.6, 2.6, 8.6], [-0.2, 1.2, -1]),
    async build(run) {
      await run("addAsset", { assetId: "masterArchitecture2880", name: "民国舞厅", position: { x: 0, y: 0, z: 0 } });
      await run("addAsset", { assetId: "person", name: "歌女", position: { x: 0, y: 1.02, z: -2.2 }, faceToward: { x: 0, z: 3 } });
      await run("addAsset", { assetId: "person", name: "舞伴甲", position: { x: -0.9, y: 0, z: 0.7 }, faceToward: { x: -0.9, z: 1.3 } });
      await run("addAsset", { assetId: "person", name: "舞伴乙", position: { x: -0.9, y: 0, z: 1.25 }, faceToward: { x: -0.9, z: 0.7 } });
      await run("addAsset", { assetId: "person", name: "舞伴丙", position: { x: 1.3, y: 0, z: 1.6 }, faceToward: { x: 1.8, z: 1.6 } });
      await run("addAsset", { assetId: "person", name: "舞伴丁", position: { x: 1.85, y: 0, z: 1.6 }, faceToward: { x: 1.3, z: 1.6 } });
      await run("placeCrowd", { mode: "seated", seatPoints: [{ x: -4.4, z: 0.4 }, { x: -4.4, z: 2.6 }], target: { x: 0, z: 1 }, name: "客人" });
      await run("setTime", { hour: 22 });
    },
  },
  {
    // 整块“民国照相馆三壁内景布景幕布大木箱相机”（射线实测：后墙布景幕布 z≈-2.4，幕前拍照椅 x≈0.4、z=-1.0，大木箱相机在前面 x=0..0.4、z=1.6..2.0）；一对新人在幕前一坐一站拍合影，照相师傅站在相机后面。
    id: "photoStudio", half: [3.6, 3.2], name: markMessages("照相馆"), genre: "民国",
    view: view([2.2, 2, 5.6], [0, 1, -0.6]),
    async build(run) {
      await run("addAsset", { assetId: "masterArchitecture2886", name: "照相馆", position: { x: 0, y: 0, z: 0 } });
      await run("placeCrowd", { mode: "seated", seatPoints: [{ x: 0.4, z: -1.0 }], target: { x: 0.4, z: 6 }, name: "新娘" });
      await run("addAsset", { assetId: "person", name: "新郎", position: { x: -0.25, y: 0, z: -1.15 }, faceToward: { x: -0.25, z: 3 } });
      await run("addAsset", { assetId: "person", name: "照相师傅", position: { x: 0.2, y: 0, z: 2.6 }, faceToward: { x: 0.2, z: -1 } });
    },
  },
  {
    // 整块“现代地下停车场一角三壁内景”（射线实测：地面空旷 x=-4.4..3.6、z=-2.8..3.2，中间靠后两组车/柱 x≈-1.4、0.9、z≈-0.2）；夜里女主走向车子，有人在后面跟着——悬疑戏常用。
    id: "parkingGarage", half: [5.2, 4], name: markMessages("地下停车场"), genre: "现代",
    view: view([2.4, 1.8, 7], [-0.4, 1.1, 0.4]),
    async build(run) {
      await run("addAsset", { assetId: "masterArchitecture2861", name: "地下停车场", position: { x: 0, y: 0, z: 0 } });
      await run("addAsset", { assetId: "person", name: "女主", position: { x: -0.3, y: 0, z: 1.3 }, faceToward: { x: -1.4, z: 0 } });
      await run("addAsset", { assetId: "person", name: "跟踪者", position: { x: 2.4, y: 0, z: 2.6 }, faceToward: { x: -0.3, z: 1.3 } });
      await run("setTime", { hour: 23 });
      await run("setWeather", { lighting: { sunIntensity: 0.8, sunAzimuth: 200, sunElevation: 35, sunColor: "#b7c4d8", ambientIntensity: 0.85, ambientColor: "#6c7684", skyIntensity: 0.3, exposure: 1.5, weatherInfluence: 1 } });
    },
  },
  {
    // 整块“现代凌乱出租屋被翻乱三壁内景”（射线实测：小屋 x=-1.6..2.8、z=-1.6..2.4，左后衣柜，右边单人床 x=1.6..2.4、z=-1.2..0，地上一地被翻出来的杂物）；警察站在门口看现场，房东跟在旁边。
    id: "ransackedRoom", half: [3.2, 3], name: markMessages("被翻乱的出租屋"), genre: "现代",
    view: view([0.8, 2.2, 5.6], [0.4, 0.8, -0.2]),
    async build(run) {
      await run("addAsset", { assetId: "masterArchitecture2859", name: "出租屋", position: { x: 0, y: 0, z: 0 } });
      await run("addAsset", { assetId: "person", name: "警察", position: { x: 0.4, y: 0, z: 2.0 }, faceToward: { x: 0.4, z: -0.6 } });
      await run("addAsset", { assetId: "person", name: "房东", position: { x: -0.7, y: 0, z: 2.2 }, faceToward: { x: 0.4, z: -0.4 } });
    },
  },
  {
    // 整块“现代老旧小区楼梯间三壁内景”（射线实测：上层平台高1.74、z=-2.4..0.4，右边楼梯 x≈2.0 从平台一路下到 z=2.8 的底层地面0.12，底层空地 x=-0.4..1.2、z=0.4..2.8）；楼道对峙：一人站在平台上往下看，一人在楼梯底下抬头。
    id: "stairwell", half: [3.2, 3.4], name: markMessages("老小区楼梯间"), genre: "现代",
    view: view([0.6, 1.9, 6.4], [0.6, 1.6, -0.4]),
    async build(run) {
      await run("addAsset", { assetId: "masterArchitecture2860", name: "楼梯间", position: { x: 0, y: 0, z: 0 } });
      await run("addAsset", { assetId: "person", name: "楼上的人", position: { x: 0.6, y: 1.74, z: -0.4 }, faceToward: { x: 0.4, z: 3 } });
      await run("addAsset", { assetId: "person", name: "楼下的人", position: { x: -0.1, y: 0.12, z: 2.1 }, faceToward: { x: 0.6, z: -0.4 } });
      await run("setTime", { hour: 21.5 });
    },
  },
  {
    // 整块“现代新闻演播室三壁内景主播台灯架”（射线实测：主播台 x=-2.0..1.2、z=-1.2..-0.8，台后两把主播椅 x=-1.2/0.4、z=-2.0，前面两侧灯架 x=-2.4/2.0、z≈1.4）；两位主播坐台后，摄像师在前面，导播站在一边。
    id: "newsStudio", half: [4.8, 4], name: markMessages("新闻演播室"), genre: "现代",
    view: view([1.8, 2.2, 6.4], [-0.4, 1.1, -1.2]),
    async build(run) {
      await run("addAsset", { assetId: "masterArchitecture2903", name: "新闻演播室", position: { x: 0, y: 0, z: 0 } });
      await run("placeCrowd", { mode: "seated", seatPoints: [{ x: -1.2, z: -2.0 }, { x: 0.4, z: -2.0 }], target: { x: -0.4, z: 6 }, name: "主播" });
      await run("addAsset", { assetId: "person", name: "摄像师", position: { x: -0.4, y: 0, z: 2.4 }, faceToward: { x: -0.4, z: -2 } });
      await run("addAsset", { assetId: "person", name: "导播", position: { x: 2.9, y: 0, z: 0.4 }, faceToward: { x: -0.4, z: -1.4 } });
    },
  },
  {
    // 整块“现代健身房三壁内景跑步机镜墙器械”（射线实测：三台跑步机跑带高0.44、x=-3.0/-1.8/-0.6、z=-1.2..0，右后镜墙，右前卧推凳 x≈2.8，前面地垫 z=2.0..2.4）；两人在跑步机上跑，私教站在旁边说话。
    id: "gym", half: [5.2, 4], name: markMessages("健身房"), genre: "现代",
    view: view([1.6, 2, 6.4], [-1.2, 1.1, -0.6]),
    async build(run) {
      await run("addAsset", { assetId: "masterArchitecture2904", name: "健身房", position: { x: 0, y: 0, z: 0 } });
      await run("addAsset", { assetId: "person", name: "跑步的人", position: { x: -1.8, y: 0.44, z: -0.6 }, faceToward: { x: -1.8, z: -3 } });
      await run("addAsset", { assetId: "person", name: "另一个人", position: { x: -0.6, y: 0.44, z: -0.6 }, faceToward: { x: -0.6, z: -3 } });
      await run("addAsset", { assetId: "person", name: "私教", position: { x: 0.6, y: 0, z: 0.8 }, faceToward: { x: -1.2, z: -0.6 } });
    },
  },
  {
    // 整块“现代指挥中心三壁内景视频墙操作席”（射线实测：三排操作台 z=-1.2..-0.8 / 0.8..1.2 / 2.4..2.8，每排后面椅子 z=0 / 1.6 / 3.6、x≈-2.4/0.4/2.8，右侧视频墙 x≈3.8）；操作员坐在台前盯屏幕，指挥官站在排间下命令。
    id: "commandCenter", half: [5.2, 4.2], name: markMessages("指挥中心"), genre: "现代",
    view: view([1.2, 2.8, 7.4], [-0.2, 1, -0.6]),
    async build(run) {
      await run("addAsset", { assetId: "masterArchitecture2905", name: "指挥中心", position: { x: 0, y: 0, z: 0 } });
      await run("placeCrowd", { mode: "seated", seatPoints: [{ x: -2.4, z: 0 }, { x: 0.4, z: 0 }, { x: 2.8, z: 0 }, { x: -2.4, z: 1.6 }, { x: 0.4, z: 1.6 }], target: { x: 0, z: -6 }, fill: 0.9, name: "操作员" });
      await run("addAsset", { assetId: "person", name: "指挥官", position: { x: -1.0, y: 0, z: 2.0 }, faceToward: { x: -0.4, z: -1 } });
      await run("setTime", { hour: 2 });
    },
  },
  {
    // 整块“古装书院学堂三壁内景讲台课桌”（射线实测：后面讲台高0.36、z=-2.8..-1.6，台上书案、先生座椅座面0.83约 x=-0.2、z=-2.6；下面三排矮书案，学生坐垫高0.19在 x=-2.4/0/2.4、z=0/1.6/3.2）；先生坐讲台上，学生跪坐在矮案后听讲。
    id: "academy", half: [4.8, 4.2], name: markMessages("书院学堂"), genre: "古装",
    view: view([1.6, 2.6, 7.4], [-0.2, 0.8, -0.6]),
    async build(run) {
      await run("addAsset", { assetId: "masterArchitecture2876", name: "书院学堂", position: { x: 0, y: 0, z: 0 } });
      await run("placeCrowd", { mode: "seated", seatPoints: [{ x: -0.2, z: -2.72 }], target: { x: -0.2, z: 6 }, floor: 0.38, name: "先生" });
      await run("placeCrowd", { mode: "seated", posture: "kneel", seatPoints: [{ x: -2.4, z: 0 }, { x: 0, z: 0 }, { x: 2.4, z: 0 }, { x: -2.4, z: 1.6 }, { x: 0, z: 1.6 }, { x: 2.4, z: 1.6 }, { x: -2.4, z: 3.2 }, { x: 0, z: 3.2 }, { x: 2.4, z: 3.2 }], target: { x: -0.2, z: -6 }, floor: 0.19, fill: 0.85, name: "学生" });
    },
  },
  {
    // 整块“日式和室三壁内景榻榻米壁龛”（射线实测：满铺榻榻米高0.22，中间矮桌高0.62、约 x=0.4、z=0.2，后面壁龛台高0.35）；两人隔着矮桌跪坐对谈（民国谍战、日式茶道）。
    id: "tatamiRoom", half: [4.2, 3.2], name: markMessages("日式和室"), genre: "民国",
    view: view([2.6, 1.8, 5.2], [0.4, 0.7, 0.3]),
    async build(run) {
      await run("addAsset", { assetId: "masterArchitecture2884", name: "日式和室", position: { x: 0, y: 0, z: 0 } });
      await run("placeCrowd", { mode: "seated", posture: "kneel", seatPoints: [{ x: 0.4, z: -0.5 }], target: { x: 0.4, z: 1.3 }, floor: 0.22, name: "主人" });
      await run("placeCrowd", { mode: "seated", posture: "kneel", seatPoints: [{ x: 0.4, z: 1.3 }], target: { x: 0.4, z: -0.5 }, floor: 0.22, seed: 4, name: "客人" });
    },
  },
  {
    // 整块“民国银行营业厅三壁内景柜台金库门”（射线实测：营业柜台 x=-4.4..-2.0 和 -1.2..1.2、z=-2.4..-2.0，柜台后是柜员，后墙金库门 z≈-3.6，前面两排候客长椅 z=2.4、x=-3.2..-1.2 和 0.4..2.4）；柜员在柜台后，客户在台前办事，有人坐长椅等，门口站着警卫。
    id: "bankHall", half: [5.6, 4.4], name: markMessages("民国银行"), genre: "民国",
    view: view([1.4, 2.4, 7.8], [-0.8, 1.1, -1.6]),
    async build(run) {
      await run("addAsset", { assetId: "masterArchitecture2883", name: "民国银行", position: { x: 0, y: 0, z: 0 } });
      await run("addAsset", { assetId: "person", name: "柜员", position: { x: -3.2, y: 0, z: -2.8 }, faceToward: { x: -3.2, z: 3 } });
      await run("addAsset", { assetId: "person", name: "柜员", position: { x: 0, y: 0, z: -2.8 }, faceToward: { x: 0, z: 3 } });
      await run("addAsset", { assetId: "person", name: "客户", position: { x: 0.1, y: 0, z: -1.3 }, faceToward: { x: 0, z: -2.8 } });
      await run("placeCrowd", { mode: "seated", seatPoints: [{ x: -2.4, z: 2.4 }, { x: 1.2, z: 2.4 }], target: { x: -0.8, z: -2.2 }, name: "等候" });
      await run("addAsset", { assetId: "person", name: "警卫", position: { x: 3.8, y: 0, z: 0.6 }, faceToward: { x: 0, z: 0 } });
    },
  },
  {
    // 整块“民国报馆三壁内景编辑部排字房印刷机”（射线实测：左边两排编辑桌 z=-1.2..-0.8 和 1.2..1.6、x=-3.6..-0.4，椅子在桌南 z=0 / 2.0、x=-3.2/-0.8，右边印刷机 x=2.0..3.2、z=1.2..2.8）；编辑伏案写稿，主编站在桌前训话，工人守着印刷机。
    id: "newspaperOffice", half: [5.2, 4], name: markMessages("民国报馆"), genre: "民国",
    view: view([1.2, 2.4, 7], [-1, 1, -0.4]),
    async build(run) {
      await run("addAsset", { assetId: "masterArchitecture2882", name: "民国报馆", position: { x: 0, y: 0, z: 0 } });
      await run("placeCrowd", { mode: "seated", seatPoints: [{ x: -3.2, z: 0 }, { x: -0.8, z: 0 }, { x: -3.2, z: 2.0 }], target: { x: -2, z: -6 }, name: "编辑" });
      await run("addAsset", { assetId: "person", name: "主编", position: { x: -2.0, y: 0, z: -2.0 }, faceToward: { x: -2.0, z: 1 } });
      await run("addAsset", { assetId: "person", name: "工人", position: { x: 1.4, y: 0, z: 0.6 }, faceToward: { x: 2.6, z: 1.8 } });
    },
  },
  {
    // 整块“现代电梯轿厢三壁内景”（约2×1.6米，+z门侧敞开）；三个乘客面朝门，悬疑、对峙、尴尬沉默的常用景。
    id: "elevator", half: [1.5, 1.5], name: markMessages("电梯"), genre: "现代",
    view: view([0.3, 1.7, 3.6], [0, 1.2, 0]),
    async build(run) {
      await run("addAsset", { assetId: "masterArchitecture2901", name: "电梯", position: { x: 0, y: 0, z: 0 } });
      await run("addAsset", { assetId: "person", name: "乘客1", position: { x: -0.5, y: 0, z: -0.3 }, faceToward: { x: -0.5, z: 3 } });
      await run("addAsset", { assetId: "person", name: "乘客2", position: { x: 0.45, y: 0, z: -0.35 }, faceToward: { x: 0.45, z: 3 } });
      await run("addAsset", { assetId: "person", name: "乘客3", position: { x: 0, y: 0, z: 0.35 }, faceToward: { x: 0, z: 3 } });
    },
  },
  {
    // 白模“地铁站台·岛式·36m×18m·筒拱隧道”（射线实测：中间轨道 |z|<3、两侧站台面高1.40、|z|=3..8.8，立柱在 z=±3.5）；候车的人面朝轨道，站台上有人走过。
    id: "subwayPlatform", half: [18.5, 10], name: markMessages("地铁站台"), genre: "现代",
    view: view([-15, 3.2, 7.5], [4, 1.6, 4.5]),
    async build(run) {
      await run("addAsset", { assetId: "masterArchitecture3032", name: "地铁站台", position: { x: 0, y: 0, z: 0 } });
      await run("placeCrowd", { mode: "audience", center: { x: 2, z: 5.6 }, width: 26, depth: 2, count: 12, groupSize: 2, target: { x: 2, z: -60 }, avoid: false, floor: 1.4, name: "候车" });
      await run("placeCrowd", { mode: "audience", center: { x: 2, z: -5.6 }, width: 26, depth: 2, count: 8, groupSize: 2, target: { x: 2, z: 60 }, avoid: false, floor: 1.4, seed: 5, name: "对面候车" });
    },
    walkers: { name: "乘客", path: [{ x: -16, z: 7.8 }, { x: 16, z: 7.8 }], width: 1, count: 4, floor: 1.4, avoid: false },
  },
];

// 模板坐标以原点为中心；平移到at时把各工具参数里的世界坐标一起挪过去（朝向、尺寸不变）。
const pointKeys = new Set(["center", "target", "position", "faceToward"]);
const pathKeys = new Set(["path", "points", "seatPoints"]);
function shift<T>(value: T, dx: number, dz: number): T {
  const move = (point: unknown) => point && typeof point === "object" && "x" in point && "z" in point ? { ...point, x: (point as Vec).x + dx, z: (point as Vec).z + dz } : point;
  return Object.fromEntries(Object.entries(value as Record<string, unknown>).map(([key, item]) => [key, pointKeys.has(key) ? move(item) : pathKeys.has(key) && Array.isArray(item) ? item.map(move) : item])) as T;
}

/** 用给定的工具执行器搭模板（Agent的布景工具和一键布景共用）；at为景的中心。返回路人路线所需的信息。 */
export async function runSetTemplate(template: SetTemplate, run: Run, at: Vec = { x: 0, z: 0 }, worldHalf = Infinity) {
  const [hx, hz] = template.half;
  if (Math.abs(at.x) + hx > worldHalf || Math.abs(at.z) + hz > worldHalf) throw new Error(`${template.name}占地约${hx * 2}×${hz * 2}米，放在(${at.x}, ${at.z})会超出世界边界（X/Z各±${worldHalf}米）；中心须在X ±${Math.max(0, worldHalf - hx)}、Z ±${Math.max(0, worldHalf - hz)}米以内`);
  const moved: Run = (tool, args) => run(tool, at.x || at.z ? shift(args, at.x, at.z) : args);
  await template.build(moved);
  return { view: { ...template.view, position: { ...template.view.position, x: template.view.position.x + at.x, z: template.view.position.z + at.z }, target: { ...template.view.target, x: template.view.target.x + at.x, z: template.view.target.z + at.z } } };
}

/**
 * 整套景的陈设（建筑、家具、墙、地面）打成一个集合：世界→资产里一点选中整套，好挪好删（一键布景和Agent共用）。
 * 人物和有动线的物体（开过的车）一律不进集合——同一集合里只有一条动线生效，群演以后要分别走位。
 */
export function groupSetObjects(template: SetTemplate, before: SceneDocument, after: SceneDocument, moving: ReadonlySet<string> = new Set()): SceneDocument {
  const existing = new Set(before.objects.map(object => object.id));
  const members = after.objects.filter(object => !existing.has(object.id) && !moving.has(object.id) && !/person/i.test(object.asset.shape ?? "")).map(object => object.id);
  if (!members.length) return after;
  const groups = after.objectGroups ?? [];
  let name = template.name;
  for (let index = 2; groups.some(group => group.name === name); index++) name = `${template.name} ${index}`;
  return { ...after, objectGroups: [...groups, { id: `set-${template.id}-${crypto.randomUUID().slice(0, 8)}`, name, objectIds: members }] };
}

/** 模板用到的素材都在内置目录里；调用方素材表没加载全时用它补齐。 */
export function getSetTemplateAssets(): SceneAsset[] { return [...builtinAssets, ...catalogAssets]; }

export function getWorldHalf(document: SceneDocument) { return (document.terrain?.size ?? worldSizeLimits.default) / 2; }

/** 在已有场景里给整套景找空地：从prefer附近按4米一圈往外找，整块占地不压任何可见物体、不出世界边界。 */
export function findSetTemplateSpot(template: SetTemplate, document: SceneDocument, prefer: Vec): Vec | undefined {
  const [hx, hz] = template.half, worldHalf = getWorldHalf(document);
  const limitX = worldHalf - hx, limitZ = worldHalf - hz;
  if (limitX < 0 || limitZ < 0) return;
  const rects: Rect[] = document.objects.filter(object => object.visible).map(object => {
    const footprint = measureAssetFootprint(object.asset);
    return footprint ? rectFor(footprint, object.position.x, object.position.z, object.rotation.y, object.scale.x, object.scale.z) : { x: object.position.x, z: object.position.z, hw: 0.5, hd: 0.5, angle: 0 };
  });
  const clamp = (value: number, limit: number) => Math.max(-limit, Math.min(limit, Math.round(value)));
  const start = { x: clamp(prefer.x, limitX), z: clamp(prefer.z, limitZ) };
  const free = (x: number, z: number) => Math.abs(x) <= limitX && Math.abs(z) <= limitZ && !rects.some(rect => rectsOverlap({ x, z, hw: hx + 0.5, hd: hz + 0.5, angle: 0 }, rect));
  const step = 4, rings = Math.ceil(worldHalf * 2 / step);
  for (let ring = 0; ring <= rings; ring++) {
    const candidates: Vec[] = [];
    for (let i = -ring; i <= ring; i++) for (let j = -ring; j <= ring; j++) if (Math.max(Math.abs(i), Math.abs(j)) === ring) candidates.push({ x: start.x + i * step, z: start.z + j * step });
    candidates.sort((a, b) => Math.hypot(a.x - prefer.x, a.z - prefer.z) - Math.hypot(b.x - prefer.x, b.z - prefer.z));
    const spot = candidates.find(point => free(point.x, point.z));
    if (spot) return spot;
  }
}

/** 搭一整套景：空场景时设好景的时间；已有场景时放在at处、保留原有物体和时间。保留地形、天气、机位等世界设置。 */
export async function buildSetTemplate(template: SetTemplate, base: SceneDocument, signal: AbortSignal, at: Vec = { x: 0, z: 0 }) {
  const assets = getSetTemplateAssets();
  const { createAiSceneDraft } = await import("./aiScene");
  const keepTime = base.objects.length > 0;
  const draft = createAiSceneDraft({ document: keepTime ? base : { ...base, objects: [], objectGroups: undefined }, assets, mode: "scene", readonlyCatalog: true });
  const tools = new Map(draft.tools.map(tool => [tool.name, tool]));
  const run: Run = async (name, args) => {
    signal.throwIfAborted();
    if (keepTime && name === "setTime") return {};
    const tool = tools.get(name);
    if (!tool) throw new Error(`布景工具不存在：${name}`);
    const result = await tool.execute(args, signal) as unknown;
    // 工具可能直接返回对象，也可能包在content文本里。
    const text = (result as { content?: { text?: string }[] })?.content?.[0]?.text;
    return text ? JSON.parse(text) : result;
  };
  // 默认日景，模板需要黄昏、夜戏时自己再设。
  await run("setTime", { hour: 10 });
  const { view } = await runSetTemplate(template, run, at, getWorldHalf(base));
  const tracks: PerformanceTrack[] = [];
  const groups = template.walkers ? Array.isArray(template.walkers) ? template.walkers : [template.walkers] : [];
  for (const group of groups) {
    const { name, width, count, floor, avoid } = group;
    const path = group.path.map(point => ({ x: point.x + at.x, z: point.z + at.z }));
    const before = new Set(draft.getResult().document.objects.map(object => object.id));
    await run("placeCrowd", { mode: "wander", path, width, count, groupSize: 1, name, ...(floor !== undefined ? { floor } : {}), ...(avoid === false ? { avoid } : {}) });
    const walkers = draft.getResult().document.objects.filter(object => !before.has(object.id));
    walkers.forEach((object, index) => tracks.push(walkerTrack(`${template.id}Walk${tracks.length + 1}`, object.id, object.position, path, index % 2 === 1, floor)));
  }
  // 背景群演挪步：站着的群演每三个挑一个，慢慢往旁边挪0.8到1.5米、停一会再挪回来，像实拍里背景演员换脚、侧身、让位；
  // 目标点压到桌椅墙体就换个方向，四个方向都不行就不动。最多20人，不抢主体的戏。
  {
    const built = draft.getResult().document;
    const moving = new Set(tracks.map(track => track.objectId));
    const occupancy = createOccupancy({ ...built, objects: built.objects.filter(object => !/person/i.test(object.asset.shape ?? "")) });
    const extras = built.objects.filter(object => object.asset.shape === "person" && !moving.has(object.id) && !base.objects.some(item => item.id === object.id) && (template.milling ?? []).some(prefix => object.name.startsWith(prefix)));
    let added = 0;
    for (const [index, person] of extras.entries()) {
      if (index % 3 !== 1 || added >= 20) continue;
      const distance = 0.8 + ((index * 0.6180339887) % 1) * 0.7;
      for (let turn = 0; turn < 4; turn++) {
        const angle = ((index * 97 + turn * 90) % 360) * Math.PI / 180;
        const x = person.position.x + Math.sin(angle) * distance, z = person.position.z + Math.cos(angle) * distance;
        if (occupancy.blocked({ x, z, hw: 0.3, hd: 0.3, angle: 0 })) continue;
        // 两个来回：慢慢挪过去、挪回原位、再换个方向挪一次（压到东西就还用原方向）、回原位；按0.5米/秒慢慢挪，两个来回约10秒。
        // 用path模式沿线直走：站在桌凳之间的群演往往不在导航网格上（网格在家具边会收缩一圈），ground模式连不上导航就一直不起步；path只走路线点之间，所以第一个点就是原位。
        const back = ((index * 97 + turn * 90 + 140) % 360) * Math.PI / 180;
        const bx = person.position.x + Math.sin(back) * distance * 0.7, bz = person.position.z + Math.cos(back) * distance * 0.7;
        const second = occupancy.blocked({ x: bx, z: bz, hw: 0.3, hd: 0.3, angle: 0 }) ? [x, z] : [bx, bz];
        const at = (px: number, pz: number) => [Math.round(px * 100) / 100, Math.round(person.position.y * 100) / 100, Math.round(pz * 100) / 100] as [number, number, number];
        const home = at(person.position.x, person.position.z);
        tracks.push({ id: `${template.id}Mill${++added}`, objectId: person.id, name: "群演挪步", points: [home, at(x, z), home, at(second[0]!, second[1]!), home], mode: "path", speed: 0.5 });
        break;
      }
    }
  }
  // 行车：模板里按名字放好的车，沿车道直线开一趟（path模式严格贴线走，不被导航网格卡住）。
  for (const [index, drive] of (template.drivers ?? []).entries()) {
    const car = draft.getResult().document.objects.find(object => object.name === drive.name);
    if (!car) continue;
    tracks.push({ id: `${template.id}Drive${index + 1}`, objectId: car.id, name: drive.name, points: drive.path.map(point => [Math.round((point.x + at.x) * 100) / 100, 0, Math.round((point.z + at.z) * 100) / 100] as [number, number, number]), mode: "path", speed: drive.speed ?? 7 });
  }
  signal.throwIfAborted();
  const built = draft.getResult().document;
  const document = groupSetObjects(template, base, built, new Set(tracks.map(track => track.objectId)));
  if (!tracks.length) return { ...document, view };
  const life = getSceneLife(base.life);
  // 时间轴整理：路人、挪步群演、行车各收进一个默认折叠的分组，时间轴上只露出几行，要改哪条再展开。
  const folders = [...(base.timeline?.folders ?? [])];
  for (const [kind, label] of [["Walk", "路人"], ["Mill", "群演挪步"], ["Drive", "行车"]] as const) {
    const items = tracks.filter(track => track.id.startsWith(`${template.id}${kind}`)).map(track => `track:${track.id}`);
    if (items.length) folders.push({ id: `${template.id}-${kind}-${crypto.randomUUID().slice(0, 6)}`, name: label, collapsed: true, items });
  }
  return { ...document, view, life: { ...life, enabled: true, tracks: [...(life.tracks ?? []), ...tracks] }, timeline: { ...base.timeline, folders: folders.slice(-32) } } as SceneDocument;
}

/** 路人沿街走一个来回（先去一头再走回另一头，约一两分钟，够一个镜头）：按他离中线的横向偏移平移整条线，单双号反向。 */
function walkerTrack(id: string, objectId: string, position: { x: number; z: number }, path: Vec[], reverse: boolean, floor?: number): PerformanceTrack {
  const [a, b] = [path[0]!, path[path.length - 1]!];
  const length = Math.hypot(b.x - a.x, b.z - a.z) || 1;
  const side = ((b.x - a.x) * (position.z - a.z) - (b.z - a.z) * (position.x - a.x)) / length;
  const normal = { x: -(b.z - a.z) / length, z: (b.x - a.x) / length };
  const points = (reverse ? [...path].reverse() : path).map(point => [Math.round((point.x + normal.x * side) * 100) / 100, floor ?? 0, Math.round((point.z + normal.z * side) * 100) / 100] as [number, number, number]);
  // 步速1.1到1.6米/秒，按id定下来（同一套景每次一样），人流快慢不一才像真的。
  const order = Number(id.match(/\d+$/)?.[0] ?? 0);
  const speed = Math.round((1.1 + ((order * 0.6180339887) % 1) * 0.5) * 100) / 100;
  return { id, objectId, name: "路人", points, mode: floor !== undefined ? "path" : "ground", speed };
}

// ACT: 按剧本挑景：先看场次标题（前三行里不带冒号的行，或“场景：…”），再看前十行动作说明，按地点关键词挑一套整套景；
// 街、巷这种古今都有的地点，按台词里的称呼（客官、公子、本官……）判断古装还是现代。夜里的古街用夜市。
const placeRules: [RegExp, string][] = [
  [/(酒店|宾馆|旅馆|客房)的?(走廊|过道|楼道)/, "hotelCorridor"], [/总裁|董事长|老板办公室|CEO/i, "ceoOffice"], [/酒店|宾馆|旅馆|套房/, "hotelRoom"], [/KTV|K歌|唱歌|唱K/i, "ktv"], [/包间|包厢|饭局|酒席|宴请|聚餐/, "privateDining"], [/卧室|睡房|床上|床边/, "bedroom"], [/厨房|灶台|做饭|炒菜/, "kitchen"], [/手术室|手术台|做手术|开刀/, "operatingRoom"], [/八十年代|七十年代|九十年代|筒子楼|年代剧/, "eightiesHome"],
  [/客房|上房|天字号|厢房/, "innRoom"], [/客栈|酒楼|酒肆|饭庄|驿站/, "inn"], [/喜堂|拜堂|拜天地|成亲|大婚/, "weddingHall"], [/灵堂|守灵|吊唁|丧事|出殡|灵柩|灵前/, "mourningHall"],
  [/书院|学堂|私塾|讲学|先生讲课/, "academy"], [/和室|榻榻米|日式|茶道/, "tatamiRoom"], [/御书房|御案|批奏折/, "imperialStudy"], [/书房|书斋|书案/, "study"], [/茶馆|说书|茶楼/, "teahouse"], [/药铺|医馆|药堂|郎中|抓药/, "apothecary"], [/理发|剃头|发廊|美发/, "barberShop"], [/后台|化妆间|戏班/, "backstage"], [/练功房|镖局|武馆|梅花桩|练武|比武/, "martialHall"], [/古墓|墓室|地宫|盗墓|陵墓|石棺/, "tomb"], [/督军|大帅|帅府|司令府/, "warlordParlor"], [/银行|钱庄|取钱|存钱|金库|营业厅/, "bankHall"], [/报馆|报社|编辑部|排字房|印刷厂/, "newspaperOffice"], [/舞厅|百乐门|舞池|歌女|夜总会/, "ballroom"], [/停车场|车库|地库/, "parkingGarage"], [/楼梯间|楼梯口|楼道|单元楼/, "stairwell"], [/演播室|直播间|播音|主播台|新闻台/, "newsStudio"], [/健身房|跑步机|健身|私教/, "gym"], [/指挥中心|指挥部|作战室|监控室|调度/, "commandCenter"], [/被翻|翻乱|现场勘查|案发现场|出租屋/, "ransackedRoom"], [/照相馆|拍照|合影|照相/, "photoStudio"], [/青楼|花楼|妓院|花厅|勾栏|花魁/, "brothelHall"], [/寝殿|寝宫|娘娘|贵妃|后妃|凤榻/, "consortChamber"], [/闺房|绣楼|梳妆/, "boudoir"], [/民国咖啡|旧上海咖啡|租界咖啡|咖啡厅.*民国|民国.*咖啡/, "minguoCafe"], [/民国|上海滩|公馆|洋房/, "shanghaiParlor"], [/夜市|灯会/, "nightMarket"], [/四合院|院子|府邸|宅院|庭院|府中|府上|后院/, "courtyard"],
  [/中军大帐|帅帐|大帐|帐中|议事|沙盘/, "warTent"], [/军营|营帐|营地|大营|校场/, "camp"], [/大殿|王座|宫殿|朝堂|金銮殿|皇宫|王宫/, "throneRoom"], [/会议室|开会|例会|董事会/, "meetingRoom"], [/办公室|公司|写字楼|工位/, "office"],
  [/报告厅|礼堂|会场|讲座|发布会|演讲/, "lectureHall"], [/公堂|衙门|升堂|县衙/, "yamen"], [/大牢|牢房|天牢|地牢|囚室|探监/, "prison"], [/审讯室|讯问室|询问室/, "interrogation"], [/警局|派出所|刑警队|警察局|专案组|公安局/, "policeOffice"], [/法庭|法院|庭审|开庭/, "courtroom"],
  [/客厅|家中|家里|公寓|住处|饭桌/, "livingRoom"], [/咖啡|奶茶店|甜品店|餐厅|饭店|西餐/, "cafe"], [/教室|课堂|班级|讲台/, "classroom"],
  [/教堂|婚礼|礼拜/, "church"], [/病房|病床|ICU/i, "ward"], [/医院|走廊|过道|诊室|急诊/, "hospitalCorridor"], [/便利店|超市|小卖部|商店|收银/, "convenienceStore"],
  [/酒吧|夜店|清吧|吧台/, "bar"], [/电梯/, "elevator"], [/地铁|站台|月台/, "subwayPlatform"], [/街道|马路|路口|街头|路边|人行道|十字路/, "modernStreet"],
];
const ancientCues = /客官|在下|大人|姑娘|公子|江湖|阁下|本官|陛下|娘娘|掌柜|小二|老爷|夫人|兄台|少侠/;
export function matchSetTemplate(script: string): SetTemplate | undefined {
  const lines = script.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
  const heading = lines.slice(0, 3).filter(line => !/[：:]/.test(line) || /^(场景|场次)/.test(line)).join(" ");
  const actions = lines.slice(0, 10).filter(line => /^[（(【[]/.test(line) || !/[：:]/.test(line)).join(" ");
  const night = /夜|NIGHT/i.test(heading);
  for (const text of [heading, actions]) {
    if (!text) continue;
    const rule = placeRules.find(([pattern]) => pattern.test(text));
    if (rule) return setTemplates.find(template => template.id === rule[1]);
    if (/街|巷|集|市/.test(text)) return setTemplates.find(template => template.id === (ancientCues.test(script) ? night ? "nightMarket" : "ancientStreet" : "modernStreet"));
  }
  return undefined;
}
