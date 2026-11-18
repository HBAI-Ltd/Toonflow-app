import { z, type NodeAiTool } from "@toonflow/nodes-scaffold/runtime";
import { parseToolArgs } from "./toolArgs";
import { modelSchema, type ModelDefinition } from "./modelGeometry";
import { createSceneObject, getObjectGravityEnabled, assetThemes, assetStates, assetItemTypes, type SceneAnchor, type SceneAsset, type SceneDocument, type SceneObject, type SceneWeather } from "./sceneDocument";
import { getAssetItemType } from "./assetMetadata";
import { parseSceneDocument, sceneLightingSchema, sceneTimeSchema, sceneWeatherLayersPatchSchema } from "./sceneValidation";
import { getTerrainWaterLevel, worldSizeLimits } from "./terrainModel";
import { getAssetDerivatives, getAssetSearchText, isCatalogDerivative, matchesAssetFilters, matchesSearchToken } from "./assetCatalog";
import { getSceneTime } from "./worldTime";
import { getWeatherLayers } from "./weatherModel";
import { treeBrushAssets } from "./sceneBrushAssets";
import { editSceneTerrain, editTerrainSchema, readTerrain, readTerrainSchema } from "./aiTerrain";
import { createBrushPathSchema, createSceneBrushPath, getObjectBrushCapabilities, scatterAssetsSchema, scatterSceneAssets } from "./aiPlacement";
import { layoutSceneStreet, layoutStreetSchema } from "./streetLayout";
import { getSetTemplateAssets, groupSetObjects, runSetTemplate, setTemplates } from "./setTemplates";
import { arrangeAssetsSchema, arrangeSceneAssets, faceRotation, measureAssetFootprint, placeCrowdSchema, placeSceneCrowd, replaceObjectsAsset } from "./setDressing";
import { patchModelParts, readModelParts, readModelPartsSchema, updateModelPartsSchema } from "./aiModelParts";

export const sceneToolNames = ["listAssets", "listAssetVariants", "inspectScene", "readModelParts", "updateModelParts", "createModel", "addAsset", "updateObject", "readTerrain", "editTerrain", "scatterAssets", "createBrushPath", "layoutStreet", "arrangeAssets", "placeCrowd", "useSetTemplate", "replaceAsset", "setTime", "setWeather", "removeObject"] as const;
export const setRecipesInstruction = "现成整套景：用户要的景接近" + setTemplates.map(template => template.name).join("、") + "时，先用useSetTemplate在空地一步铺出验证过的整套景（三面墙、陈设、群演、地面都已摆好），再按剧情增删改，不要从零逐件摆；其他景按下面的搭法。常见影视景搭法（按剧情挑用，素材用listAssets按题材和名称查，没有就选最接近的）：【古装】街市集镇=layoutStreet；客栈酒楼大堂=walls加enclose三面墙，柜台掌柜位back居中，grid方桌再around配长凳，酒坛货架贴墙；府邸四合院、衙门、寺庙道观=walls排房屋加enclose院墙，front门楼；公堂、朝堂、金銮殿=主座back居中，line bothSides立柱沿中轴，grid站班衙役或文武百官facing=target面向主座，中间留御道；书院学堂=grid书案加aisle面向先生案；戏园茶楼=戏台back，grid桌椅面向戏台；军营校场=ring营帐朝帅帐或篝火，grid列阵士兵面向点将台，line旗杆；城门城楼=城门居中，两侧城墙，placeCrowd queue进城队伍；码头渡口=line沿岸船只货堆，placeCrowd chat挑夫；农家村落=房屋散而有聚，createBrushPath土路，line篱笆；刑场法场=高台back，placeCrowd audience围观；灵堂墓地=棺木或墓碑back，grid跪拜的人，line白幡；竹林山道、江湖野店=scatterAssets树林围出空地，中间留表演区。【现代】城市街道、十字路口=layoutStreet分段（两条街各调一次，avoid自动让开转角），line路灯行道树，grid停车位车辆；开放办公区=walls加enclose，grid工位桌加aisle，再around aroundSides=['front']配椅，柜子贴墙；会议室=长桌around aroundSides=['left','right'] perSide 3到5；教室=讲台back，grid课桌加aisle面向讲台；阶梯教室、报告厅=ring span 120到160 rings 4到8面向讲台；医院病房=walls fill两侧病床（床头靠墙），around aroundSides=['left']床头柜；手术室=手术台居中，around器械车和医护；医院走廊、办公走廊=line bothSides墙边长椅和门；法庭、审讯室=法官席back，grid旁听席加aisle面向法官，原告被告桌居中；教堂婚礼、葬礼=祭坛或棺木back，grid长椅加aisle面向祭坛；餐厅、咖啡馆、酒吧=吧台贴back或left，grid桌再around配椅，placeCrowd chat；超市、便利店、图书馆=grid货架书架成排加aisle，收银台在front旁，placeCrowd queue排队结账；公寓客厅=电视柜back居中，沙发facing=target朝电视，茶几居中，柜架贴墙；卧室=床靠back居中，around aroundSides=['left','right']床头柜，衣柜贴left或right；酒店大堂、车站候车厅、机场=前台或检票口back，grid座椅加aisle，placeCrowd queue和wander；停车场=grid车辆；工地、工厂、仓库=grid货架或机器，line围挡，scatterAssets堆料；监狱=walls fill牢房，中间走廊；体育馆、演唱会=舞台在一端，ring span 160到200多排看台或placeCrowd audience站席；天台、小巷=walls或line两侧墙体杂物把画面收住。【科幻奇幻】飞船舰桥、指挥中心=主屏back，ring span 120到180控制台面向主屏，指挥椅居中；实验室=grid实验台，柜体贴墙；城堡王座厅=王座back居中，line bothSides立柱和旗帜，grid卫兵面向中轴；地下城、牢笼=walls fill牢笼；魔法学院、藏书馆=grid书架加aisle；末日废墟=scatterAssets残骸车辆，残墙半包围。【自然与交通】森林、山谷、河边、海滩、沙漠、雪原=editTerrain塑地形地表，scatterAssets树石成团、留出表演空地和小路；营地=ring帐篷朝篝火；车厢、公交、机舱=walls加enclose窄长车厢，grid两列座椅加aisle面向车头；船甲板=line两侧栏杆货箱；车祸事故现场=车辆斜停，placeCrowd audience围观，line警戒锥。";
export const setDressingInstruction = "影棚布景（按影视拍摄搭景，用户要搭整体场景时遵守）：1）先定主机位方向和焦点：焦点（柜台、主座、戏台、篝火、牌坊、病床、讲台）放在主机位正对的后方或中心，人和陈设朝向焦点；室内景用arrangeAssets walls的enclose砌三面直墙、主机位一侧敞开（影棚第四面墙），再用createBrushPath paving铺地面。2）成组摆：大件用arrangeAssets按真实占地成组，不逐件猜坐标和朝向——walls贴墙一圈（家具、院落房屋，bySide分主次），ring围成圈（营帐、圆桌、围观），grid行列（宴席、课桌、列阵、摊位），line沿线（栏杆、长凳、行道树、灯），around围着桌子/篝火配椅子；街道用layoutStreet。3）层次与收口：前景放半遮挡道具，中景留3到6米表演走位通道，背景用建筑、墙、树林把画面收住，不露空旷地平线和大片空地。4）密度与统一：同题材同年代素材，大件成组、小件点缀在台面墙边；地面统一铺装（createBrushPath paving或editTerrain地表）。5）群演用placeCrowd放胶囊人：chat成群交谈，audience面向焦点围观、朝拜、列队，有椅子长凳的课堂、礼堂、教堂、餐馆、候车厅用seated让人坐进座位（seatIds用摆椅子那次arrangeAssets返回的objects的id），不要让人站在椅子之间；集市街道每米约0.5到1人，室内每10平米1到2人。6）用setTime/setWeather配氛围（日戏、黄昏暖光、夜戏灯笼、阴雨）；夜戏内景按月光夜景布光让画面看得清：setWeather lighting {sunIntensity:1.4,sunAzimuth:200,sunElevation:35,sunColor:'#a9bdf0',ambientIntensity:0.9,ambientColor:'#7f93c9',skyIntensity:0.6,exposure:1.5,weatherInfluence:1}。常见景：客栈/酒楼大堂=三面墙+地板，柜台在back居中，墙边酒坛货架，中间grid方桌再around配长凳，客人chat围桌；厅堂/朝堂/公堂=主座在back居中，两侧walls排椅或grid站班面向主座；卧房/书房=床或书案靠back，柜架贴left/right；四合院/衙门/寺院=walls排房屋（back正房大殿，left/right厢房，front门楼或opening院门）并加enclose四面院墙（门楼处自动断开），院子大小按房屋定（宽约正房面宽+两厢进深×2，进深约正房进深+院子8到12米+门楼进深），房子不够长就fill排满，院中树、水缸、石桌；广场/戏台/刑场=焦点在back，placeCrowd audience；营地/战场=ring营帐朝篝火，grid列阵士兵面向敌方；集市=grid摊位加人群；野外林地=scatterAssets树木围出空地，中间留表演区，createBrushPath小路。";
export const streetLayoutInstruction = "搭街道、集市、街区、古镇街景时先用layoutStreet成片排：listAssets查同一题材的“临街”“铺楼”“商铺”等建筑2到4种交替，街宽8到14米，gap取0到1米让门面连续；同时给街心摊位、两侧路灯、街尾或两端牌坊/城门收住街景，crowd按街长每米约0.5到1人放胶囊人NPC；街面再用createBrushPath铺装。多条街或十字路口分段多次调用。不要用scatterAssets撒建筑（朝向随机），不要把楼零散放在空地上；街景要密：两侧门面连续、正面朝街、两端有收口。";
// ACT: 默认场景的NPC用胶囊人（轻、够用）；主角、用户点名或要做肢体动作的人物才用骨骼人物。
export const defaultHumanInstruction = "人物素材规则：修改或演绎现有人物时先复用其真实objectId，不能新造一个替代。新增人物时，群演、NPC、路人、背景人群默认用胶囊人assetId=person（头、身子、腿三段关节：能寻路走动线、停留、坐、蹲、跪、弯腰、点头、倒地，没有手臂，开销小）；只有主角（用户点名的主要角色）、用户明确要求骨骼人物、或用户明确要某人做挥手、坐下、鞠躬、拾物等肢体动作时，才用骨骼人物assetId=riggedPerson，再addAsset摆放；不要自己用JSON或Kiln重造人。用户描述的姓名或职位不是另造人物外形的要求；需要挥手、拾物等手上动作的角色在同一骨骼人物上编排动作即可；胶囊人没有手臂，不能播放骨骼人物的动作库动作，自编骨骼动作只认hips、spine、chest、neck、head和左右大腿（对应它的身子、头、腿三段）。只有用户明确指定其他素材、特殊外观或要求自定义人物建模时才采用其他模型；不擅自替换已有指定角色，也不虚构胶囊人有手臂、替代模型有骨骼动作能力。此人物规则优先于后面的通用建模说明。";
export const localEditInstruction = "只执行本轮用户明确要求，历史对话只帮助理解已有状态，不扩写剧情或补齐未要求的场景。局部修改默认保留全部未涉及物体、部件、摆放和环境，不重建整屋、不添置装饰/道具、不用静态开门替代播放交互。已有造型先readModelParts，再updateModelParts只改指定partIndex；只有确实缺少几何且用户明确需要创建时才检索或建造。缺少可控独立门、道具、动作或可达通路时说明具体原因，不生成替身绕过。最终只简述实际发生的修改及尚未执行的限制，不额外编故事。";

const coordinate = z.number().finite().min(-10000).max(10000);
const vector = z.strictObject({ x: coordinate, y: coordinate, z: coordinate });
const scale = z.number().finite().min(0.001).max(1000);
const scaleVector = z.strictObject({ x: scale, y: scale, z: scale });
const identifier = z.string().min(1).max(160);
const anchorSchema = z.discriminatedUnion("kind", [
  z.strictObject({ kind: z.literal("point"), position: vector }),
  z.strictObject({ kind: z.literal("object"), objectId: identifier, position: vector }),
]);
const placement = { position: vector.optional(), rotation: vector.optional(), scale: scaleVector.optional(), height: coordinate.optional().describe("模型几何底面的世界Y，单位米；不是离地偏移"), gravityEnabled: z.boolean().optional().describe("默认开启垂直重力；关闭后保留悬空或主动埋入地面的高度") };

function clone<T>(value: T): T { return JSON.parse(JSON.stringify(value)); }
/**
 * ACT: 只给position、没给height时，position.y相对原值的变化同步到底面高度height（原点和底面一起移动）：
 * 平移时顺手写了y不再整次调用失败；开着重力的物体之后照常落到真实支撑面。
 */
export function heightFromPosition(previous: Pick<SceneObject, "position" | "height">, position: { y: number } | undefined, height: number | undefined) {
  if (height !== undefined || !position || Math.abs(position.y - previous.position.y) < 1e-6) return height;
  return Math.round(((previous.height ?? previous.position.y) + position.y - previous.position.y) * 10000) / 10000;
}

export function snapshotSceneAnchor(value: SceneAnchor | undefined, document: SceneDocument): SceneAnchor | undefined {
  if (value === undefined) return;
  const anchor = anchorSchema.parse(value);
  if (anchor.kind === "object" && !document.objects.some(object => object.id === anchor.objectId)) throw new Error("选中锚点对应的场景物体已不存在，请重新选择");
  return anchor;
}

function createTool<Schema extends z.ZodType>(name: string, description: string, schema: Schema, execute: (args: z.output<Schema>, signal?: AbortSignal) => unknown): NodeAiTool {
  return {
    name, description, parameters: z.toJSONSchema(schema, { io: "input" }),
    execute(args, signal) {
      signal?.throwIfAborted();
      if (new TextEncoder().encode(JSON.stringify(args)).byteLength > 1024 * 1024) throw new Error("工具参数不能超过1 MB");
      return execute(parseToolArgs(name, schema, args), signal);
    },
  };
}

export function createAiSceneDraft(input: { document: SceneDocument; assets: SceneAsset[]; mode: "scene" | "model"; selectedId?: string; anchor?: SceneAnchor; readonlyCatalog?: boolean }) {
  let draft = clone(input.document);
  const anchor = snapshotSceneAnchor(input.anchor, draft);
  const selectedId = anchor?.kind === "object" ? anchor.objectId : anchor ? undefined : draft.objects.find(object => object.id === input.selectedId)?.id;
  const original = JSON.stringify(draft);
  const assets = new Map<string, SceneAsset>();
  // Holodeck 已持有本轮目录快照；只读复用目录，具体摆放仍克隆资产，避免每次工具调用复制整个目录。
  for (const asset of input.assets) assets.set(asset.id, input.readonlyCatalog ? asset : clone(asset));
  for (const asset of treeBrushAssets) if (!assets.has(asset.id)) assets.set(asset.id, input.readonlyCatalog ? asset : clone(asset));
  for (const object of draft.objects) assets.set(object.asset.id, object.asset);
  const models = new Map<string, ModelDefinition>();
  let modelObjectId = input.mode === "model" && anchor?.kind === "object" ? anchor.objectId : undefined;

  function readObject(id: string) {
    const object = draft.objects.find(object => object.id === id);
    if (!object) throw new Error(`场景物体不存在：${id}`);
    return object;
  }

  function commit(value: SceneDocument) {
    const next = parseSceneDocument(value);
    if (new Set(next.objects.map(object => object.asset.id).filter(id => models.has(id))).size > 12) throw new Error("每轮最多使用12个不同生成模型，请分批搭建");
    if (new TextEncoder().encode(JSON.stringify(next)).byteLength > 8 * 1024 * 1024) throw new Error("场景草稿超过8 MB，请减少重复的生成模型部件");
    draft = next;
  }

  function ensureModelBudget(previous?: SceneObject) {
    const usedModels = new Set(draft.objects.map(object => object.asset.id).filter(id => models.has(id)));
    const replacesUnique = previous && usedModels.has(previous.asset.id) && draft.objects.filter(object => object.asset.id === previous.asset.id).length === 1;
    if (usedModels.size + 1 - Number(!!replacesUnique) > 12) throw new Error("每轮最多创建12个不同模型，请分批搭建");
  }

  const inspectScene = createTool("inspectScene", "读取当前独立草稿。默认返回选中物体或地点的anchor快照、物体、观察视角、独立日历时间、天气与真实ID；anchor是上下文，不代表已经编辑。id读取物体完整生成定义。", z.strictObject({ id: identifier.optional() }), ({ id }) => {
    if (id) return clone(readObject(id));
    return {
      selectedId: modelObjectId ?? (draft.objects.some(object => object.id === selectedId) ? selectedId : undefined),
      anchor: anchor && (anchor.kind === "point" || draft.objects.some(object => object.id === anchor.objectId)) ? clone(anchor) : null,
      objects: draft.objects.map(object => ({ id: object.id, name: object.name, assetId: object.asset.id, assetName: object.asset.name, shape: object.asset.shape, rig: object.asset.shape === "riggedPerson" ? "riggedPerson" : undefined, generated: !!(object.asset.model || object.asset.recipe), position: clone(object.position), rotation: clone(object.rotation), scale: clone(object.scale), visible: object.visible, height: object.height, gravityEnabled: getObjectGravityEnabled(object) })),
      view: clone(draft.view),
      terrain: draft.terrain ? { size: draft.terrain.size, segments: draft.terrain.segments, minHeight: Math.min(...draft.terrain.heights), maxHeight: Math.max(...draft.terrain.heights), waterSamples: draft.terrain.heights.reduce((count, _, index) => count + Number(getTerrainWaterLevel(draft.terrain!, index) !== null), 0) } : null,
      weather: draft.weather ? clone(draft.weather) : null,
      time: getSceneTime(draft),
    };
  });
  const readParts = createTool("readModelParts", "读取已有物体的真实可编辑JSON部件及assetRevision、partIndex，支持已有model/recipe/blueprint。修改前必须读取；部件名称可能重复，索引只对该修订有效。纯GLB且无源定义不能还原部件，不可因此重建整屋。", readModelPartsSchema, ({ id }) => readModelParts(readObject(id)));
  const updateParts = createTool("updateModelParts", "只修改readModelParts返回的真实部件，必须提供同一assetRevision和partIndex。changes仅列本轮要求改变的属性，position/rotation/scale为完整XYZ局部向量；可选造型或材质属性传null删除该属性。其余部件和物体根摆放、重力、名称保持原样；height仅派生为新几何的实际世界底面元数据，避免旧底面高度抬动整屋。产生新的不可变资产并沿用真实GLB交付流程。不要用静态开门形状冒充播放中的互动。", updateModelPartsSchema, async (args, signal) => {
    const previous = readObject(args.id);
    if (input.mode === "model" && previous.id !== (modelObjectId ?? selectedId)) throw new Error("模型模式只能修改本轮选中模型的部件");
    const source = JSON.stringify(previous.asset);
    const placement = JSON.stringify([previous.position, previous.rotation, previous.scale, previous.height]);
    const result = await patchModelParts(previous, args);
    const inspected = result.summary.changed ? await readModelParts({ ...previous, asset: result.asset }) : undefined;
    signal?.throwIfAborted();
    const current = readObject(args.id);
    if (JSON.stringify(current.asset) !== source) throw new Error("模型已被其他操作修改，请重新readModelParts");
    if (JSON.stringify([current.position, current.rotation, current.scale, current.height]) !== placement) throw new Error("物体摆放已变化，请重新读取后修改部件");
    if (result.summary.changed) {
      ensureModelBudget(current);
      commit({ ...draft, objects: draft.objects.map(object => object.id === current.id ? { ...current, asset: result.asset, height: result.height } : object) });
      assets.set(result.asset.id, result.asset);
      models.set(result.asset.id, result.definition);
      if (input.mode === "model") modelObjectId = current.id;
    }
    return { ...result.summary, ...(inspected ? { assetRevision: inspected.assetRevision } : {}) };
  });
  const listAssets = createTool("listAssets", "检索真实主素材，支持query名称、theme题材、itemType类型组合筛选，主数量不包含款式与状态衍生。归并前名称会命中对应主项；需要该具体款式时，用同一query和返回assetId调用listAssetVariants。theme和itemType也匹配父项下已收纳子款的题材和类型，返回字段仍是主项默认值；需要对应子款时，将题材或类型名称作为listAssetVariants的query。例如破损汽车先用itemType=交通查车型主项，再筛选破损状态。每页最多60项，nextOffset非null时保留全部筛选并用该offset继续读取。新增人物时先返回person胶囊人（群演、NPC默认），其次riggedPerson骨骼人物（主角、用户明确要求或要做肢体动作的人物）；只有用户明确指定其他形象时才另选或建模。返回真实assetId供addAsset复用，不猜ID。", z.strictObject({ query: z.string().max(160).optional(), theme: z.enum(assetThemes).optional(), itemType: z.enum(assetItemTypes).optional(), offset: z.number().int().min(0).max(100000).optional() }), ({ query, theme, itemType, offset = 0 }) => {
    const tokens = query?.trim().toLowerCase().split(/\s+/).filter(Boolean) ?? [];
    const matches = [...assets.values()].filter(asset => !isCatalogDerivative(asset) && matchesAssetFilters(asset, { theme, itemType }) && (!tokens.length || (text => tokens.some(token => matchesSearchToken(text, token)))(getAssetSearchText(asset))));
    // 胶囊人（默认NPC）排第一，骨骼人物（主角、要做动作的人物）第二。
    const humanRank = (asset: SceneAsset) => asset.id === "person" ? 2 : asset.id === "riggedPerson" ? 1 : 0;
    matches.sort((left, right) => humanRank(right) - humanRank(left));
    return { total: matches.length, offset, nextOffset: offset + 60 < matches.length ? offset + 60 : null, assets: matches.slice(offset, offset + 60).map(asset => ({ assetId: asset.id, name: asset.name, category: asset.category, ...(asset.theme ? { theme: asset.theme } : {}), itemType: getAssetItemType(asset), state: asset.state ?? "原始", ...(asset.variantOf ? { variantOf: asset.variantOf } : {}), kind: asset.kind, ...(asset.shape ? { shape: asset.shape } : {}), ...(asset.shape === "riggedPerson" ? { preferredFor: "protagonistOrBodyActions", rig: "riggedPerson", customSkeletalMotion: true } : asset.shape === "person" ? { preferredFor: "defaultNpc", rig: "capsule3", customSkeletalMotion: "hips/spine/chest/neck/head/thighs only, no arms" } : {}), generated: !!asset.model })) };
  });
  const listAssetVariants = createTool("listAssetVariants", "查询一个真实主素材的款式与状态衍生。先listAssets找主assetId，再传assetId；query可按具体款式或归并前名称筛选，state可选原始/老旧/破损/废弃。旧配方variant为0到26；本地结构蓝图用返回的design编号筛选，不猜编号。返回真实子assetId、variantOf及对应recipe或blueprint，可直接交给addAsset。衍生不计入主素材数量，每页最多60项，保留筛选并用nextOffset继续。", z.strictObject({ assetId: identifier, query: z.string().max(160).optional(), state: z.enum(assetStates).optional(), variant: z.number().int().min(0).max(26).optional(), design: z.number().int().min(0).max(99999).optional(), offset: z.number().int().min(0).max(100000).optional() }), ({ assetId, query, state, variant, design, offset = 0 }) => {
    const main = assets.get(assetId);
    if (!main || isCatalogDerivative(main)) throw new Error("请先调用listAssets查询真实主素材assetId，再读取其衍生");
    const derivatives = getAssetDerivatives(main);
    for (const asset of derivatives) if (!assets.has(asset.id)) assets.set(asset.id, input.readonlyCatalog ? asset : clone(asset));
    const nameQuery = query?.trim().toLocaleLowerCase();
    const matches = derivatives.filter(asset => (!state || (asset.state ?? "原始") === state) && (variant === undefined || asset.recipe?.variant === variant) && (design === undefined || asset.blueprint?.design === design) && (!nameQuery || getAssetSearchText(asset).includes(nameQuery)));
    return { parentAssetId: main.id, total: matches.length, offset, nextOffset: offset + 60 < matches.length ? offset + 60 : null, assets: matches.slice(offset, offset + 60).map(asset => ({ assetId: asset.id, name: asset.name, state: asset.state ?? "原始", variantOf: asset.variantOf, ...(asset.recipe ? { variant: asset.recipe.variant, recipe: clone(asset.recipe) } : {}), ...(asset.blueprint ? { design: asset.blueprint.design, blueprint: clone(asset.blueprint) } : {}) })) };
  });
  const createModel = createTool("createModel", "仅用户明确要求新建或整体重建造型时创建真实可导出GLB的程序化复合模型；已有局部造型先readModelParts→updateModelParts，不重建整屋。普通人物请用addAsset（群演、NPC用person胶囊人；主角或要做肢体动作的用riggedPerson），已有骨骼人物的动作请用worldAnimate的pose片段，不能为动作重造人物。definition支持拉伸、旋转体、曲管、自定义网格与基础几何。只在独立草稿中创建定义，不执行代码、不写文件。replaceId替换已有场景物体并保留其摆放、高度与重力；未指定则新增。height是模型几何底面的世界Y，不是离地偏移；新建默认开启重力，悬空或主动埋地需gravityEnabled=false。修改竖直位置必须提供height，不能只改模型原点position.y。返回assetId可复用。", z.strictObject({ definition: modelSchema, replaceId: identifier.optional(), ...placement }), args => {
    const replaceId = args.replaceId ?? (input.mode === "model" ? modelObjectId : undefined);
    if (input.mode === "model" && replaceId && replaceId !== modelObjectId && replaceId !== (anchor?.kind === "object" ? selectedId : input.selectedId)) throw new Error("模型生成模式只能修改本轮模型或当前选中物体");
    const previous = replaceId ? readObject(replaceId) : undefined;
    const derivedHeight = previous ? heightFromPosition(previous, args.position, args.height) : args.height;
    if (input.mode === "model" && modelObjectId && previous?.id !== modelObjectId) throw new Error("模型生成模式每轮只生成一个模型，请继续修改本轮模型");
    ensureModelBudget(previous);
    const id = crypto.randomUUID();
    const asset: SceneAsset = { id, name: args.definition.name, category: "生成", kind: "model", model: clone(args.definition), normalize: false };
    const object = createSceneObject(asset, args.position ?? previous?.position ?? (anchor?.kind === "point" ? clone(anchor.position) : { x: 0, y: 0, z: 0 }));
    object.id = previous?.id ?? object.id;
    object.rotation = clone(args.rotation ?? previous?.rotation ?? object.rotation);
    object.scale = clone(args.scale ?? previous?.scale ?? object.scale);
    object.visible = previous?.visible ?? true;
    if (previous) {
      object.height = previous.height;
      object.gravityEnabled = getObjectGravityEnabled(previous);
    }
    if (derivedHeight !== undefined) object.height = derivedHeight;
    if (args.gravityEnabled !== undefined) object.gravityEnabled = args.gravityEnabled;
    commit({ ...draft, objects: previous ? draft.objects.map(item => item.id === previous.id ? object : item) : [...draft.objects, object] });
    assets.set(id, asset);
    models.set(id, clone(args.definition));
    if (input.mode === "model") modelObjectId = object.id;
    return { id: object.id, assetId: id, name: asset.name, parts: args.definition.parts.length, valid: true };
  });
  // ACT: 新增、调整、删除、换素材都能一次传多个（items/ids），少几次模型往返；单个的老写法照旧可用。
  const addFields = { name: z.string().trim().min(1).max(160).optional(), rotation: vector.optional(), faceToward: z.strictObject({ x: z.number().finite().min(-10000).max(10000), z: z.number().finite().min(-10000).max(10000) }).optional(), scale: scaleVector.optional(), height: placement.height, gravityEnabled: placement.gravityEnabled };
  const addItem = z.strictObject({ assetId: identifier, position: vector, ...addFields });
  function placeAsset(args: z.output<typeof addItem>) {
    const asset = assets.get(args.assetId);
    if (!asset) throw new Error(`资产不存在：${args.assetId}，请先调用listAssets或listAssetVariants查询实际assetId`);
    const object = createSceneObject(clone(asset), args.position);
    if (args.name) object.name = args.name;
    if (args.rotation) object.rotation = clone(args.rotation);
    if (args.faceToward) {
      const footprint = measureAssetFootprint(asset);
      const dir = { x: args.faceToward.x - args.position.x, z: args.faceToward.z - args.position.z };
      if (footprint && Math.hypot(dir.x, dir.z) > 1e-6) object.rotation = { x: object.rotation.x, y: faceRotation(footprint, dir), z: object.rotation.z };
    }
    if (args.scale) object.scale = clone(args.scale);
    if (args.height !== undefined) object.height = args.height;
    if (args.gravityEnabled !== undefined) object.gravityEnabled = args.gravityEnabled;
    return object;
  }
  const addAsset = createTool("addAsset", "将listAssets、listAssetVariants或createModel返回的真实assetId添加到场景草稿。一次放多件时用items数组（最多100件，每项字段同单件），不要逐件调用。群演、NPC等普通人物默认assetId=person胶囊人；主角、用户明确要求骨骼人物或要做肢体动作的人物用riggedPerson（保留骨骼和自编动作能力）；其他指定模型按用户要求。位置单位米，Y向上，rotation为XYZ欧拉角度数。height为模型几何底面的世界Y，不是离地偏移，省略时新建以position.y作为初始底面高度。默认开启重力并落向实际支撑面；悬空或主动埋地需gravityEnabled=false。position.y是模型原点，竖直编辑以height为准。faceToward给世界XZ点时按素材自己的正面（门、台口、屏幕、靠背反侧等自动识别）转向那一点，戏台、王座、祭坛、讲台、电视等焦点物用它朝向观众或主机位。", z.strictObject({ assetId: identifier.optional(), position: vector.optional(), ...addFields, items: z.array(addItem).min(1).max(100).optional() }).refine(args => !!args.items?.length || args.assetId !== undefined && args.position !== undefined, "单件给assetId和position，多件给items"), ({ items, ...single }) => {
    // 弱模型常把单件写法和items混着传：外层那件（给全了assetId和position）也放，不整次报错。
    const objects = [...(single.assetId !== undefined && single.position !== undefined ? [single as z.output<typeof addItem>] : []), ...(items ?? [])].map(placeAsset);
    commit({ ...draft, objects: [...draft.objects, ...objects] });
    const summary = (object: SceneObject) => ({ id: object.id, assetId: object.asset.id, name: object.name, rotationY: object.rotation.y });
    return items ? { added: objects.length, objects: objects.map(summary) } : summary(objects[0]);
  });
  const terrainRead = createTool("readTerrain", "读取当前真实地形的边界、网格间距、可用塑形与地貌笔刷及参数上限，以及树木、墙体/铺装的物件画笔款式；points可采样指定世界XZ的高度、水位和混合地表。没有地形也返回可创建的范围。无需转抄完整高度数组，坐标可依据inspectScene的anchor。", readTerrainSchema, args => ({ ...readTerrain(draft, args), objectBrushes: getObjectBrushCapabilities() }));
  const editTerrain = createTool("editTerrain", "直接在场景草稿中塑形、改变地貌或创建局部湖泊/河流，复用编辑器真实地形画笔算法，不模拟鼠标。先readTerrain读取笔刷与边界；strokes每批1至8笔，每笔单点为圆形区域，多点为路径，seconds为整笔总作用秒数；radius不得小于一个网格。flatten/ramp可指定targetHeight，ramp恰好2端点；waterLevel可指定湖泊/河流起始水位，河流随后顺坡下降。保留未改地形、混层和已删树木。超预算分小批，返回真实变化格数。完成后用worldSubmit核对。", editTerrainSchema, async (args, signal) => {
    const result = await editSceneTerrain(draft, args, signal);
    signal?.throwIfAborted();
    if (result.summary.changed) commit({ ...draft, terrain: result.terrain });
    return result.summary;
  });
  const scatterAssets = createTool("scatterAssets", "朝向随机，适合树木、草石、杂物，不用来排建筑（排街用layoutStreet）。按圆区或折线路径批量摆放listAssets/listAssetVariants返回的真实assetIds；树木笔刷素材可直接检索，无须打开画笔。points单点圆区须radius>0，多点可沿路径或走廊摆放，count每次最多200，spacing约束物体根部间距，seed可复现。每个结果是可单独编辑/删除的物体，贴真实地面并保留heightOffset；不是整体图片或不可编辑森林。实际数量可能受空间/间距限制，读取placed/skipped。间距不等于网格碰撞，最后用真实观察核对。", scatterAssetsSchema, async (args, signal) => {
    const result = await scatterSceneAssets(draft, assets, args, signal);
    signal?.throwIfAborted();
    commit({ ...draft, objects: [...draft.objects, ...result.objects] });
    return { ...result.summary, objects: result.objects.map(object => ({ id: object.id, assetId: object.asset.id, position: object.position, height: object.height })) };
  });
  const createBrushPath = createTool("createBrushPath", "直接复用物件画笔创建真实墙体或铺装路径。mode为wall或paving，style必须从readTerrain返回的物件画笔款式中读取，points为世界XZ折线，width/height单位米；自动采样真实地形并保留原有道路/步行导航能力。每次生成一个独立可编辑模型，无需Kiln或转抄几何。完成后用worldSubmit核对。", createBrushPathSchema, (args, signal) => {
    if (new Set(draft.objects.filter(object => models.has(object.asset.id)).map(object => object.asset.id)).size >= 12) throw new Error("每轮最多使用12个不同生成模型，请分批创建墙体或铺装");
    const result = createSceneBrushPath(draft, args, signal);
    commit({ ...draft, objects: [...draft.objects, result.object] });
    assets.set(result.asset.id, result.asset);
    if (result.asset.model) models.set(result.asset.id, clone(result.asset.model));
    return { ...result.summary, id: result.object.id, assetId: result.asset.id };
  });
  const layoutStreet = createTool("layoutStreet", "沿街布局：按街道中线一次排出成片街道。buildings按真实占地沿两侧紧挨排列、正面（门面、招牌）自动朝街，街宽width为两侧门面之间的距离；stalls沿街心排摊位，lamps在两侧街边交错立路灯，gates在街口/街尾横跨街道立牌坊或城门，crowd放成群的人（默认胶囊人person，每组一色，围摊位或站着交谈）。只支持内置建筑（能测量占地）；结果每件都是可单独编辑的物体。返回各侧实际排下的栋数、摊位/路灯/人数和warnings。选空地调用，已有物体不会被避让；完成后用worldSubmit核对核对。" + "搭街道、集市、街区、古镇街景时先用layoutStreet成片排：listAssets查同一题材的“临街”“铺楼”“商铺”等建筑2到4种交替，街宽8到14米，gap取0到1米让门面连续；同时给街心摊位、两侧路灯、街尾或两端牌坊/城门收住街景，crowd按街长每米约0.5到1人放胶囊人NPC；街面再用createBrushPath铺装。多条街或十字路口分段多次调用。不要用scatterAssets撒建筑（朝向随机），不要把楼零散放在空地上；街景要密：两侧门面连续、正面朝街、两端有收口。", layoutStreetSchema, async (args, signal) => {
    const result = await layoutSceneStreet(draft, assets, args, signal);
    signal?.throwIfAborted();
    commit({ ...draft, objects: [...draft.objects, ...result.objects] });
    return { ...result.summary, placed: result.objects.length, buildingIds: result.objects.filter(object => args.buildings.includes(object.asset.id)).map(object => object.id) };
  });
  const arrangeAssets = createTool("arrangeAssets", "成组布置：把同类或配套素材按真实占地和各自的正面一次摆好，不逐件猜坐标和朝向。pattern=walls沿矩形贴边一圈、正面朝内（房间家具贴墙、院落四周房屋；bySide给每条边分配素材，sides默认back/left/right三面，front边opening留门洞或机位开口；enclose沿边界砌院墙或室内墙，门楼和opening处自动断开）；ring围成一圈（营帐、圆桌椅、围观，默认朝圆心；span扇形、rings多排做看台、阶梯教室、舰桥）；grid行列（宴席桌、课桌、列阵、摊位、长椅，默认朝angle正前方，可facing=target，aisle留中间过道）；line沿折线（栏杆、长凳、行道树、灯、立柱，offset为离线距离，bothSides两侧对称）；around围着已有物体（targetIds给桌子、篝火、病床）每个配perTarget件、椅子正对桌边，或aroundSides指定目标的前后左右各配perSide件（工位配椅、长桌两侧排椅、床头柜）。angle是布局正前方：0朝+Z、90朝+X。素材正面按门、柜门、靠背、床头等部件自动识别。默认避开已有物体，返回placed和skipped（压到已有物体或越界而跳过）。只支持内置素材；完成后用worldSubmit核对核对。", arrangeAssetsSchema, (args, signal) => {
    const result = arrangeSceneAssets(draft, assets, args, signal);
    signal?.throwIfAborted();
    commit({ ...draft, objects: [...draft.objects, ...result.objects] });
    return { ...result.summary, objects: result.objects.map(object => ({ id: object.id, name: object.name, position: { x: Math.round(object.position.x * 100) / 100, z: Math.round(object.position.z * 100) / 100 }, rotationY: object.rotation.y })) };
  });
  const placeCrowd = createTool("placeCrowd", "放群演：在圆形（center+radius）、矩形（center+width+depth+angle）或沿路（path+width）区域里放成群的人，默认胶囊人person。mode=chat三五成群面对面交谈，audience全体面向target（围观、听讲、朝拜、列队），wander各自随意，queue沿path排队（第一个点是队头），seated坐进seatIds给的椅子、长凳（arrangeAssets返回的objects，长凳按宽度坐多人，fill是上座率）；posture=kneel跪坐/席地坐（书院学堂、和室、灵堂跪拜、寺庙蒲团），seatPoints给每人的地面位置；children按比例放孩子（家眷、集市、公园）。自动避开已有物体和彼此，每组一种衣色。主角和要做肢体动作的人用riggedPerson另外addAsset。", placeCrowdSchema, (args, signal) => {
    const result = placeSceneCrowd(draft, assets, args, signal);
    signal?.throwIfAborted();
    commit({ ...draft, objects: [...draft.objects, ...result.objects] });
    return result.summary;
  });
  const updateFields = { name: z.string().trim().min(1).max(160).optional(), ...placement, color: z.string().regex(/^#[\da-f]{6}$/i).optional(), visible: z.boolean().optional() };
  const updateItem = z.strictObject({ id: identifier, ...updateFields });
  const updateObject = createTool("updateObject", "按场景物体id局部调整名称、位置、旋转角度、缩放、基础颜色、可见性、高度或重力。一次改多件时用items数组（最多200件，每项{id,要改的字段}），不要逐件调用。未指定字段保持原值。height是模型几何底面的世界Y，不是离地偏移；gravityEnabled=true受垂直重力和支撑碰撞，false可自由悬空或主动埋地。竖直编辑请直接设置height；只给position时y的变化会同步到height，只想平移就沿用原y。已有模型部件用readModelParts→updateModelParts，不能为局部修订重建整屋；播放中的门或道具用worldAnimate。", z.strictObject({
    id: identifier.optional(), ...updateFields, items: z.array(updateItem).min(1).max(200).optional(),
  }).refine(args => !!args.items?.length || args.id !== undefined, "单件给id，多件给items"), ({ items, ...single }) => {
    const objects = [...draft.objects];
    // 外层字段（不含id）是每一项的默认值；外层还给了id、items里又没有这件，就当多出来的一项。单件写法和items混着传也照做。
    const { id: singleId, ...shared } = single;
    const list = items ? items.map(item => ({ ...shared, ...item })) : [];
    if (singleId !== undefined && !list.some(item => item.id === singleId)) list.unshift({ ...shared, id: singleId });
    const results = list.map(({ id, ...changes }) => {
      const index = objects.findIndex(object => object.id === id);
      if (index < 0) throw new Error(`场景物体不存在：${id}`);
      const object = objects[index];
      const height = heightFromPosition(object, changes.position, changes.height);
      const next: SceneObject = { ...object, ...Object.fromEntries(Object.entries(changes).filter(([, value]) => value !== undefined)), ...(height !== undefined ? { height } : {}) };
      objects[index] = next;
      // 只回传摆放字段：整个物体带着素材定义，生成模型能有几十KB，回传会白白占模型上下文。
      return { id, name: next.name, position: clone(next.position), rotation: clone(next.rotation), scale: clone(next.scale), ...(next.height !== undefined ? { height: next.height } : {}), visible: next.visible, gravityEnabled: getObjectGravityEnabled(next), ...(next.color ? { color: next.color } : {}), ...(height !== changes.height ? { note: `position.y变化已换算成底面高度height=${height}${getObjectGravityEnabled(next) ? "，开着重力会落到真实支撑面" : ""}` } : {}) };
    });
    commit({ ...draft, objects });
    return items ? { updated: results.length, objects: results } : results[0];
  });
  const setTime = createTool("setTime", "局部设置独立世界时间，保留天气和未提供的时间字段。date必须是1900到2200年的真实YYYY-MM-DD日期，hour为0到24；latitude/longitude控制场景地点，utcOffset控制当地民用时的UTC偏移，northOffset控制世界北向，speed控制时间流逝倍速，paused控制暂停。moonPhase为0新月、0.25上弦、0.5满月、0.75下弦，传null恢复按日期自动计算；moonIntensity和starIntensity控制月光与星光。至少提供一个字段，不会直接采用草稿。", sceneTimeSchema.partial().extend({
    moonPhase: z.number().finite().min(0).max(1).nullable().optional().describe("0新月、0.25上弦、0.5满月、0.75下弦；null恢复自动日期月相"),
  }).refine(args => Object.values(args).some(value => value !== undefined), "至少提供一个时间字段"), ({ moonPhase, ...changes }) => {
    const time = { ...getSceneTime(draft), ...Object.fromEntries(Object.entries(changes).filter(([, value]) => value !== undefined)) };
    if (moonPhase === null) delete time.moonPhase;
    else if (moonPhase !== undefined) time.moonPhase = moonPhase;
    commit({ ...draft, time });
    return clone(draft.time);
  });
  const setWeather = createTool("setWeather", "局部设置本轮草稿的混合天气、光照、全局强度、风力和风向。独立日期与时间请优先使用setTime；旧hour/timeOfDay仍兼容并同步独立时间。lighting与layers均按字段局部合并，省略项保留。layers支持clouds/rain/snow/fog/hail/thunder/dust/sandstorm/haze/blizzard/aurora/rainbow/meteors，权重0到1可叠加；只提供condition时切换旧四层但保留新增九层，清除全部天气必须显式把13层全部置0。auroraColor为#rrggbb、auroraDirection为0到360。windDirection为吹向的角度0到360：0向东+X、90向南+Z、180向西-X、270向北-Z，默认45。其余未提供字段保持已有值；新天气默认晴天/白天、强度0.6、风力0.25。至少提供一个字段，不会直接采用草稿。", z.strictObject({
    condition: z.enum(["clear", "cloudy", "rain", "snow", "fog"]).optional(),
    timeOfDay: z.enum(["day", "sunset", "night"]).optional(),
    hour: z.number().finite().min(0).max(24).optional().describe("旧时刻入口，兼容写入独立time；优先使用setTime.hour"),
    intensity: z.number().finite().min(0).max(1).optional(),
    wind: z.number().finite().min(0).max(1).optional(),
    windDirection: z.number().finite().min(0).max(360).optional(),
    lighting: sceneLightingSchema.refine(value => Object.keys(value).length > 0, "至少提供一个光照字段").optional(),
    layers: sceneWeatherLayersPatchSchema.optional(),
    auroraColor: z.string().regex(/^#[\da-f]{6}$/i).optional(),
    auroraDirection: z.number().finite().min(0).max(360).optional(),
  }).refine(args => Object.values(args).some(value => value !== undefined), "至少提供一个天气字段"), args => {
    const { layers, ...changes } = args;
    const weather: SceneWeather = { condition: "clear", timeOfDay: "day", intensity: 0.6, wind: 0.25, windDirection: 45, ...draft.weather, ...Object.fromEntries(Object.entries(changes).filter(([, value]) => value !== undefined)) };
    if (args.lighting) weather.lighting = { ...draft.weather?.lighting, ...args.lighting };
    if (args.timeOfDay !== undefined && args.hour === undefined) delete weather.hour;
    if (layers) weather.layers = { ...getWeatherLayers(draft.weather), ...Object.fromEntries(Object.entries(layers).filter(([, value]) => value !== undefined)) };
    else if (args.condition !== undefined) weather.layers = { ...getWeatherLayers(draft.weather), clouds: Number(args.condition === "cloudy"), rain: Number(args.condition === "rain"), snow: Number(args.condition === "snow"), fog: Number(args.condition === "fog") };
    const time = args.hour !== undefined || args.timeOfDay !== undefined ? { ...getSceneTime(draft), hour: args.hour ?? (args.timeOfDay === "day" ? 12 : args.timeOfDay === "sunset" ? 18 : 0) } : draft.time;
    commit({ ...draft, weather, ...(time ? { time } : {}) });
    return clone(draft.weather);
  });
  // ACT: 一键布景模板也给Agent用：先铺出验证过的整套景再按剧情改，比逐件摆稳定、省调用。
  const useSetTemplate = createTool("useSetTemplate", "整套现成影视景：一次搭好" + setTemplates.map(template => `${template.id}=${template.name}`).join("、") + "。at为景的中心（世界XZ，默认原点），须选空地且整套景在世界边界内（各景占地：" + setTemplates.map(template => `${template.name}${template.half[0] * 2}×${template.half[1] * 2}米`).join("、") + "，超界会直接报错且不留半套）；陈设默认避开已有物体，但街道建筑和地面不避让。会按景设置日景或夜戏时间。返回新增物体数和建议的观察视角view；随后可用updateObject/removeObject/arrangeAssets/placeCrowd按剧情增删改。群演路人的走动用演绎工具另外安排。", z.strictObject({ templateId: z.enum(setTemplates.map(template => template.id) as [string, ...string[]]), at: z.strictObject({ x: z.number().finite().min(-10000).max(10000), z: z.number().finite().min(-10000).max(10000) }).optional() }), async ({ templateId, at }, signal) => {
    const template = setTemplates.find(item => item.id === templateId)!;
    const tools = new Map([addAsset, createBrushPath, layoutStreet, arrangeAssets, placeCrowd, setTime].map(tool => [tool.name, tool]));
    for (const asset of getSetTemplateAssets()) if (!assets.has(asset.id)) assets.set(asset.id, asset);
    const saved = draft;
    try {
      const { view } = await runSetTemplate(template, async (name, args) => tools.get(name)!.execute(args, signal), at, (draft.terrain?.size ?? worldSizeLimits.default) / 2);
      signal?.throwIfAborted();
      commit(groupSetObjects(template, saved, draft));
      return { template: template.name, added: draft.objects.length - saved.objects.length, group: draft.objectGroups?.at(-1)?.name, view };
    } catch (error) { draft = saved; throw error; }
  });
  const replaceAsset = createTool("replaceAsset", "把场景里已有的物体换成另一件素材（白模迭代：换款式、换年代、换题材），一次最多200件：保留物体id、位置、缩放、演绎动线和集合；朝向按两件素材各自的正面自动校正，换完仍朝同一方向（椅子仍对着桌、铺子仍朝街）；名字里带旧素材名的换成新素材名。assetId用listAssets查到的真实id。比removeObject再addAsset省事且不丢动线。几组物体分别换成不同素材时用items:[{ids,assetId}]一次换完。", z.strictObject({ ids: z.array(identifier).min(1).max(200).optional(), assetId: identifier.optional(), items: z.array(z.strictObject({ ids: z.array(identifier).min(1).max(200), assetId: identifier })).min(1).max(40).optional() }).refine(args => !!args.items?.length || args.ids !== undefined && args.assetId !== undefined, "一组给ids和assetId，多组给items"), ({ ids, assetId, items }) => {
    const groups = [...(ids !== undefined && assetId !== undefined ? [{ ids, assetId }] : []), ...(items ?? [])];
    let objects = draft.objects;
    const replaced = groups.map(group => {
      const asset = assets.get(group.assetId);
      if (!asset) throw new Error(`素材未登记：${group.assetId}，请先用listAssets检索真实assetId`);
      for (const id of group.ids) if (!objects.some(object => object.id === id)) throw new Error(`场景物体不存在：${id}`);
      objects = replaceObjectsAsset(objects, new Set(group.ids), clone(asset));
      return { replaced: group.ids.length, asset: asset.name };
    });
    commit({ ...draft, objects });
    return items ? { groups: replaced, replaced: replaced.reduce((total, group) => total + group.replaced, 0) } : replaced[0];
  });
  const removeObject = createTool("removeObject", "仅从本轮场景草稿移除指定物体实例；不删除资产、工作区文件或任何线上资源。删多件时一次传ids数组（最多500个），不要逐件调用。", z.strictObject({ id: identifier.optional(), ids: z.array(identifier).min(1).max(500).optional() }).refine(args => args.id !== undefined || !!args.ids?.length, "给id或ids"), ({ id, ids }) => {
    const wanted = [...new Set([...(id ? [id] : []), ...(ids ?? [])])];
    const present = new Set(draft.objects.map(object => object.id));
    const removing = new Set(wanted.filter(item => present.has(item)));
    const missing = wanted.filter(item => !present.has(item));
    // 批量删时有几个id已经不在（重复删、读错）不让整批作废：删掉找得到的，把找不到的报回去。
    if (!removing.size) throw new Error(`场景物体不存在：${missing.slice(0, 8).join("、")}`);
    commit({ ...draft, objects: draft.objects.filter(object => !removing.has(object.id)), ...(draft.objectGroups ? { objectGroups: draft.objectGroups.map(group => ({ ...group, objectIds: group.objectIds.filter(objectId => !removing.has(objectId)) })) } : {}) });
    return ids ? { removed: [...removing], count: removing.size, ...(missing.length ? { notFound: missing } : {}) } : { removed: id };
  });

  return {
    tools: input.mode === "model" ? [inspectScene, readParts, updateParts, listAssets, addAsset, createModel] : [listAssets, listAssetVariants, inspectScene, readParts, updateParts, createModel, addAsset, updateObject, terrainRead, editTerrain, scatterAssets, createBrushPath, layoutStreet, arrangeAssets, placeCrowd, useSetTemplate, replaceAsset, setTime, setWeather, removeObject],
    get changed() { return JSON.stringify(draft) !== original; },
    getResult(): { document: SceneDocument; models: { id: string; definition: ModelDefinition }[] } {
      const used = new Set(draft.objects.map(object => object.asset.id));
      return { document: clone(draft), models: [...models].filter(([id]) => used.has(id)).map(([id, definition]) => ({ id, definition: clone(definition) })) };
    },
  };
}

export function createAiScenePrompt(mode: "scene" | "model") {
  return `${defaultHumanInstruction}
${localEditInstruction}
你是Toonflow的三维场景设计师，通过本轮提供的私有工具实际完成编辑。所有操作只作用于独立草稿，应用会在模型成功导出和场景验证后统一采用。
先调用inspectScene读取真实状态；修改已有造型先readModelParts，再用同assetRevision和partIndex调用updateModelParts，只发送被要求改变的属性。必须调用工具完成修改，结束前核对changedParts与保留内容。工具报错时修正后重试，禁止只写计划、伪造文件、声称未发生的成功。
${mode === "scene" ? "地形/地貌直接用readTerrain读取笔刷和范围，再editTerrain按圆形区域或路径修改真实高度场、地表和局部水位，不模拟鼠标，不用几何模型冒充山河。重复树木/物件用真实assetIds调用scatterAssets，结果保持独立；墙体和铺装用createBrushPath，style从readTerrain.objectBrushes读取。" + setRecipesInstruction + "影棚布景（按影视拍摄搭景，用户要搭整体场景时遵守）：1）先定主机位方向和焦点：焦点（柜台、主座、戏台、篝火、牌坊、病床、讲台）放在主机位正对的后方或中心，人和陈设朝向焦点；室内景用arrangeAssets walls的enclose砌三面直墙、主机位一侧敞开（影棚第四面墙），再用createBrushPath paving铺地面。2）成组摆：大件用arrangeAssets按真实占地成组，不逐件猜坐标和朝向——walls贴墙一圈（家具、院落房屋，bySide分主次），ring围成圈（营帐、圆桌、围观），grid行列（宴席、课桌、列阵、摊位），line沿线（栏杆、长凳、行道树、灯），around围着桌子/篝火配椅子；街道用layoutStreet。3）层次与收口：前景放半遮挡道具，中景留3到6米表演走位通道，背景用建筑、墙、树林把画面收住，不露空旷地平线和大片空地。4）密度与统一：同题材同年代素材，大件成组、小件点缀在台面墙边；地面统一铺装（createBrushPath paving或editTerrain地表）。5）群演用placeCrowd放胶囊人：chat成群交谈，audience面向焦点围观、朝拜、列队，有椅子长凳的课堂、礼堂、教堂、餐馆、候车厅用seated让人坐进座位（seatIds用摆椅子那次arrangeAssets返回的objects的id），不要让人站在椅子之间；集市街道每米约0.5到1人，室内每10平米1到2人。6）用setTime/setWeather配氛围（日戏、黄昏暖光、夜戏灯笼、阴雨）；夜戏内景按月光夜景布光让画面看得清：setWeather lighting {sunIntensity:1.4,sunAzimuth:200,sunElevation:35,sunColor:'#a9bdf0',ambientIntensity:0.9,ambientColor:'#7f93c9',skyIntensity:0.6,exposure:1.5,weatherInfluence:1}。常见景：客栈/酒楼大堂=三面墙+地板，柜台在back居中，墙边酒坛货架，中间grid方桌再around配长凳，客人chat围桌；厅堂/朝堂/公堂=主座在back居中，两侧walls排椅或grid站班面向主座；卧房/书房=床或书案靠back，柜架贴left/right；四合院/衙门/寺院=walls排房屋（back正房大殿，left/right厢房，front门楼或opening院门）并加enclose四面院墙（门楼处自动断开），院子大小按房屋定（宽约正房面宽+两厢进深×2，进深约正房进深+院子8到12米+门楼进深），房子不够长就fill排满，院中树、水缸、石桌；广场/戏台/刑场=焦点在back，placeCrowd audience；营地/战场=ring营帐朝篝火，grid列阵士兵面向敌方；集市=grid摊位加人群；野外林地=scatterAssets树木围出空地，中间留表演区，createBrushPath小路。搭街道、集市、街区、古镇街景时先用layoutStreet成片排：listAssets查同一题材的“临街”“铺楼”“商铺”等建筑2到4种交替，街宽8到14米，gap取0到1米让门面连续；同时给街心摊位、两侧路灯、街尾或两端牌坊/城门收住街景，crowd按街长每米约0.5到1人放胶囊人NPC；街面再用createBrushPath铺装。多条街或十字路口分段多次调用。不要用scatterAssets撒建筑（朝向随机），不要把楼零散放在空地上；街景要密：两侧门面连续、正面朝街、两端有收口。根据工具真实changed/placed/skipped结果核对，不把不足数量当作全部完成。" : ""}
anchor是本轮开始时的选中上下文快照，不是编辑指令或生成结果。object锚点的objectId用于定位用户选中的真实物体；仅按用户要求精确修改该模型，不因选中就修改其他内容。point锚点是空地点世界坐标，可作为场景布局的基准，不代表那里已有模型。先读取anchor再组织空间关系，不自动平移整个方案。工具显式position优先；替换已有模型默认保留原摆放，只有新增模型未给position时才默认采用point锚点。
坐标单位米，+Y向上，无地形时地面y=0，有地形时使用真实高度场；未改地形必须保留，包括与heights等长的waterLevels局部水位数组；null无水，surface2且水位高于河床才有水，高地湖泊不等于海平面。物体rotation与模型部件rotation都是XYZ欧拉角度数。position/rotation默认0，scale默认1。不要把角度写成弧度。各物体保留独立稳定id，未涉及的场景内容保持原样。
height是模型几何底面的世界Y，允许-10000到10000米，绝不是相对地面的偏移。position.y是模型原点，旋转、缩放后不等于底面高度；竖直编辑直接设置height，不要猜测或只改position.y。新物体默认gravityEnabled=true，按垂直重力向真实支撑面下落，不是持续吸附地形；要保留悬空或主动埋地时设置gravityEnabled=false。替换模型默认保留原有高度和重力，不因建模而开启旧悬空物体的重力。这里只支持垂直重力和支撑碰撞，不声称完整刚体动力学。
${mode === "model" ? "本轮只迭代指定模型的指定部件；局部修订用readModelParts→updateModelParts保留其他结构。仅用户明确要求新造或重建完整模型时才用createModel完整definition，普通人物仍复用内置人物（NPC用person胶囊人，主角或要做肢体动作的用riggedPerson）。" : "仅用户明确要求新增或搭建整体场景时，才用listAssets/listAssetVariants查询真实assetId并addAsset；确有缺少且明确需要的新造型再createModel。普通局部修改不组织新的前中后景、不增加未要求物件。"}
${mode === "scene" ? "时间通过独立setTime编辑：date为1900到2200年的真实YYYY-MM-DD日期，hour为0到24（24和0均为午夜），latitude为-89到89度，longitude为-180到180度（东经为正），utcOffset为-12到14的当地民用钟相对UTC小时偏移，northOffset为0到360度的北向偏角。speed为1到3600倍，paused控制暂停；日期、时刻和纬度共同影响日月位置，moonPhase为0新月、0.25上弦、0.5满月、0.75下弦，传null恢复随日期自动计算；moonIntensity与starIntensity为0到2。未提供字段保留，调整天气不重置日期和时钟，不把这些创作效果说成精密天文模拟。旧setWeather.hour/timeOfDay仅兼容迁移到独立time，优先使用setTime。天气使用setWeather：layers中的clouds/rain/snow/fog/hail/thunder/dust/sandstorm/haze/blizzard/aurora/rainbow/meteors分别为云、雨、雪、雾、冰雹、雷暴、扬尘、沙尘暴、霾、暴风雪、极光、彩虹和流星，各0到1，可以混合并按字段局部合并；没传的层保持原值，归零必须显式传0。condition仅兼容clear/cloudy/rain/snow/fog；只传condition时切换旧四层，保留新增九层。用户要晴朗无现象时必须将13层显式全置0，不能只传clear而让沙尘暴残留。auroraColor为#rrggbb、auroraDirection为0到360，极光和流星主要在夜间可见。intensity与wind为0到1，总强度乘各层权重，暴雨的rain与intensity均应接近1；windDirection为吹向角度0到360，东+X为0、南+Z为90、西-X为180、北-Z为270，统一影响降水、扬尘、水面和树木。lighting按字段局部合并主光强度/方位/高度角/颜色、补光、天空光、曝光与weatherInfluence，保留已有手动覆盖；weatherInfluence为0保留手动光照，1让天气共同影响光照。按用户要求协调天气强度、风向、时刻和光照，不仅增加粒子。时间和天气工具均至少提供一个字段。" : "保留已有time、weather，不在生成模型模式修改时间或天气。"}
程序化建模definition={name,parts}，最多120部件、50000三角形，每部件有name、shape、position、rotation、scale、color及可选roughness/metalness、opacity（0～1）、emissive（十六进制颜色）、emissiveIntensity（0～5）。box是边长1的立方体；sphere直径1；cylinder和cone直径1、高1，沿Y；capsule高1、直径0.5，沿Y；torus位于XY平面、外径1。scale控制尺寸。
复杂轮廓优先用lathe、extrude、tube、mesh，不要仅靠方块拼所有物件。lathe的profile=[{x:半径,y:高度}]绕Y旋转，适合瓶罐、柱、灯罩与花盆。extrude的profile=[{x,y}]是二维闭合外轮廓（不重复首点），depth是沿Z的厚度，适合拱形、招牌、侧板等；轮廓不能自交。tube的path=[{x,y,z}]为曲管中心线、radius为半径，适合弯曲把手、枝干、线缆。mesh用vertices和可选indices（每3个下标一面），正确设置表面绕序，适合屋顶、斜面和不规则轮廓。
模型需有可信比例、辨识度与适当的结构细节：例如椅子包含腿、座面、靠背，树木包含枝干与有层次的树冠。按功能命名部件并分配协调材质颜色，不要用一个球或方块冒充用户要求的具体模型；用户明确要求简单几何体时遵从其要求。设计局部坐标时让模型底部靠近y=0。
无须输出JSON到聊天文本，所有定义交给工具参数。`;
}
