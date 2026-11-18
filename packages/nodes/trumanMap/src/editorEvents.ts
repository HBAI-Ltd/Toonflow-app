import { z } from "@toonflow/nodes-scaffold/runtime";
import { sceneAtmosphereSchema, sceneLightingSchema, sceneTimeSchema, sceneWeatherLayersSchema } from "./sceneValidation";
import type { SceneDocument } from "./sceneDocument";
import { exportItemKeys } from "./exportBundle";

// ACT: 编辑器界面里用户能做的每一件事，都作为一个节点函数（nodeTools）给画布上的外部总 Agent：
// 打开/保存/关闭、读状态、截图、撤销重做、面板、选中、物体与素材、布景、时间天气、播放、机位镜头、演绎、一键分镜、剧本预演、导出、内置 Agent 对话。
// 参数全用名字和中文词（物体名、机位名、第N镜），弱模型也能直接用；坐标、ID 可选。
// 这些操作像用户在编辑器里点一样立即生效、可撤销；要先私下打草稿、核验后再采用的大改动仍走 worldBegin → … → worldApply。

const target = z.string().trim().min(1).max(160).describe("物体名字或id（editorState的objects里有）；名字后加“们”或“*”表示所有名字带这几个字的物体，如“食客们”");
const coordinate = z.number().finite().min(-10000).max(10000);
const partialVector = z.strictObject({ x: coordinate.optional(), y: coordinate.optional(), z: coordinate.optional() });
const degrees = z.number().finite().min(-3600).max(3600);
const shotNumber = z.number().int().min(1).max(999).describe("第几镜（editorState里film.shots的shot，和时间轴成片行、镜头表同一套镜号）");
const cameraName = z.string().trim().min(1).max(160).describe("机位名字或id（editorState里cameras）");
const filmSeconds = z.number().finite().min(0).max(3600);
const workspacePath = z.string().trim().min(1).max(1024).describe("工作区相对路径，如 assets/xxx/model.glb");

export const editorEvents = {
  editorOpen: {
    description: "打开本节点的3D场景编辑器（全屏），等视口和模型载入完再返回编辑器状态。其余editor*函数会自动打开编辑器，一般不用单独调用。",
    parameters: z.strictObject({}),
  },
  editorClose: {
    description: "保存并关闭场景编辑器（会停下内置Agent正在进行的回复和导出）。",
    parameters: z.strictObject({}),
  },
  editorSave: {
    description: "把编辑器当前场景（含当前视角、物体落地位置、演绎时刻）保存到画布。编辑器没打开时保存节点里已有的场景。",
    parameters: z.strictObject({}),
  },
  editorState: {
    description: "读编辑器现状：忙不忙、提示、打开的面板、选中项、物体清单（名字/id/位置）、分组、时间天气、成片（画幅、时长、播放头、第N镜列表）、机位、演绎人物、撤销步数、内置Agent（是否在回复、可选模型、最近回复）、后台任务。操作前先读一次。",
    parameters: z.strictObject({
      objects: z.boolean().optional().describe("false=不列物体清单（场景物体很多时省篇幅）；默认列前200个"),
      query: z.string().trim().max(80).optional().describe("只列名字或素材名带这几个字的物体"),
    }),
  },
  editorWait: {
    description: "等后台任务做完并取回结果：导出视频、内置Agent回复等超过约100秒的操作会先返回{running:true, jobId}，用它接着等（每次最多等100秒）。不给jobId时等最早的那个。",
    parameters: z.strictObject({
      jobId: z.string().trim().min(1).max(40).optional(),
      seconds: z.number().finite().min(1).max(100).optional().describe("最多等几秒，默认100"),
    }),
  },
  editorCapture: {
    description: "截编辑器画面存进工作区，返回图片路径（用工作区读图工具实际查看）：默认当前编辑视角；shot=第N镜（定位到这一镜中间，按这台机位拍，带跟拍）；camera=某个机位此刻的画面。截第N镜后播放头回到原处。",
    parameters: z.strictObject({
      shot: shotNumber.optional(),
      camera: cameraName.optional(),
      width: z.number().int().min(320).max(1920).optional().describe("长边像素，默认1280"),
    }),
  },
  editorHistory: {
    description: "撤销或重做（和编辑器的撤销/重做按钮、Ctrl+Z一样，最多各记20步）。",
    parameters: z.strictObject({
      action: z.enum(["undo", "redo"]),
      steps: z.number().int().min(1).max(20).optional().describe("连续几步，默认1"),
    }),
  },
  editorPanel: {
    description: "打开或收起编辑器面板：scene场景、object物体（需先选中）、terrain地形、brush画笔、view世界（tab选资产/空间/时间/天气/光照）、life演绎与镜头（时间轴、取景窗）、assets素材库、chat内置Agent对话；closeAll全部收起。只改界面，不改场景。",
    parameters: z.strictObject({
      panel: z.enum(["scene", "object", "terrain", "brush", "view", "life", "assets", "chat", "closeAll"]),
      tab: z.enum(["assets", "space", "time", "weather", "lighting"]).optional().describe("panel=view时打开哪一页"),
    }),
  },
  editorSelect: {
    description: "选中物体或机位（和在场景里点选一样，选中的物体会作为内置Agent的修改对象）：objects选物体，camera/shot选机位或第N镜（会跳到这一镜），clear清空选择，focus把视角转过去看着选中的东西。",
    parameters: z.strictObject({
      objects: z.array(target).max(200).optional(),
      camera: cameraName.optional(),
      shot: shotNumber.optional(),
      clear: z.boolean().optional(),
      focus: z.boolean().optional(),
    }),
  },
  editorObjects: {
    description: "改场景里已有的物体，一次调用算一步撤销：edit按items逐个改名字/显隐/重力/颜色/位置/朝向/缩放/高度；remove删除targets（连带删它们的演绎）；duplicate复制targets（旁边错开1米）；group把targets建成一组（name组名）；ungroup解散group；renameGroup给group改名为name；replace把targets换成素材asset（保留位置朝向，胶囊人设为主角用asset=riggedPerson）。",
    parameters: z.strictObject({
      action: z.enum(["edit", "remove", "duplicate", "group", "ungroup", "renameGroup", "replace"]),
      targets: z.array(target).max(500).optional(),
      items: z.array(z.strictObject({
        target,
        name: z.string().trim().min(1).max(160).optional(),
        visible: z.boolean().optional(),
        gravity: z.boolean().optional().describe("false=关掉重力，物体可悬空或埋地"),
        color: z.string().regex(/^#[\da-f]{6}$/i).optional().describe("#rrggbb"),
        position: partialVector.optional().describe("世界坐标米，只给要改的轴；y只在关掉重力时有效"),
        rotation: z.strictObject({ x: degrees.optional(), y: degrees.optional(), z: degrees.optional() }).optional().describe("角度制，y是朝向"),
        scale: z.union([z.number().finite().min(0.01).max(100), z.strictObject({ x: z.number().finite().min(0.01).max(100).optional(), y: z.number().finite().min(0.01).max(100).optional(), z: z.number().finite().min(0.01).max(100).optional() })]).optional().describe("一个数=等比缩放"),
        height: coordinate.optional().describe("物体底面的世界高度米（关掉重力时用）"),
      })).max(200).optional(),
      asset: z.string().trim().min(1).max(160).optional().describe("replace用：素材名或id（editorFindAssets查）"),
      group: z.string().trim().min(1).max(160).optional().describe("分组名或id"),
      name: z.string().trim().min(1).max(40).optional(),
    }),
  },
  editorFindAssets: {
    description: "在素材库里按关键词找素材（空格分词，如“古代 椅子”），也会列出名字对得上的一键布景模板。返回素材id和名字，供editorAddAssets、editorObjects replace、editorSetTemplate使用。",
    parameters: z.strictObject({
      query: z.string().trim().max(80).optional(),
      limit: z.number().int().min(1).max(100).optional().describe("最多返回几个，默认30"),
    }),
  },
  editorAddAssets: {
    description: "从素材库往场景里放素材（和在素材库里点一下一样）：不给position放在画面中央附近的空地；给position按x、z放到地面上。放完自动选中最后一个。",
    parameters: z.strictObject({
      items: z.array(z.strictObject({
        asset: z.string().trim().min(1).max(160).describe("素材名或id（editorFindAssets查）"),
        position: z.strictObject({ x: coordinate, z: coordinate, y: coordinate.optional() }).optional(),
        rotation: degrees.optional().describe("朝向角度"),
        name: z.string().trim().min(1).max(160).optional().describe("放好后改成这个名字"),
        count: z.number().int().min(1).max(20).optional().describe("放几个，默认1"),
      })).min(1).max(20),
    }),
  },
  editorSetTemplate: {
    description: "一键布景：按模板名搭好整套景（客栈大堂、办公室、街道等，名字用editorFindAssets查），场景有东西时自动找空地。",
    parameters: z.strictObject({ template: z.string().trim().min(1).max(80).describe("布景模板名或id") }),
  },
  editorImportModel: {
    description: "把工作区里的GLB模型导入场景（和素材库的“导入”一样，单个不超过50 MB）。",
    parameters: z.strictObject({
      path: workspacePath,
      name: z.string().trim().min(1).max(160).optional(),
      position: z.strictObject({ x: coordinate, z: coordinate, y: coordinate.optional() }).optional(),
    }),
  },
  editorWorld: {
    description: "改世界设置，一次调用算一步撤销：mood一键氛围（日戏/黄昏/夜戏/阴天/雨夜）、time时间（hour几点、date日期、speed流速、paused暂停）、layers天气层0到1（clouds云/rain雨/snow雪/fog雾/thunder雷…）、clearLayers清掉全部天气、weather风力强度、lighting光照（null=恢复自动）、atmosphere大气雾、grid网格/axes坐标轴/shadows阴影显示、worldSize世界边长米。先应用mood，再叠加其余字段。",
    parameters: z.strictObject({
      mood: z.enum(["日戏", "黄昏", "夜戏", "阴天", "雨夜"]).optional(),
      time: sceneTimeSchema.partial().optional(),
      layers: sceneWeatherLayersSchema.partial().optional(),
      clearLayers: z.boolean().optional(),
      weather: z.strictObject({
        intensity: z.number().finite().min(0).max(1).optional(),
        wind: z.number().finite().min(0).max(1).optional(),
        windDirection: z.number().finite().min(0).max(360).optional(),
        auroraColor: z.string().regex(/^#[\da-f]{6}$/i).optional(),
        auroraDirection: z.number().finite().min(0).max(360).optional(),
      }).optional(),
      lighting: sceneLightingSchema.nullable().optional(),
      atmosphere: sceneAtmosphereSchema.partial().optional(),
      grid: z.boolean().optional(),
      axes: z.boolean().optional(),
      shadows: z.boolean().optional(),
      worldSize: z.number().finite().min(20).max(1024).optional().describe("世界边长米，20到1024"),
    }),
  },
  editorPlayback: {
    description: "控制演绎与成片播放：play播放、pause暂停、restart从头播放、seek定位（seconds=成片第几秒，或shot=第N镜开头）、preview全屏预演成片、exitPreview退出全屏预演。",
    parameters: z.strictObject({
      action: z.enum(["play", "pause", "restart", "seek", "preview", "exitPreview"]),
      seconds: filmSeconds.optional(),
      shot: shotNumber.optional(),
    }),
  },
  editorCameras: {
    description: "机位与镜头段（时间轴上的操作）：add在当前视角加一台机位（name可起名）；remove/rename/enable/disable某台机位；format改成片画幅；createShot给camera在start到end秒（成片时间）加一段镜头；retimeShot改第N镜的start/end；removeShot删第N镜；splitShot在成片第at秒把第N镜切成两段；fixLineTiming一键拉长台词说不完的镜头。摆镜头、改景别运镜用stageShots/worldCameras。",
    parameters: z.strictObject({
      action: z.enum(["add", "remove", "rename", "enable", "disable", "format", "createShot", "retimeShot", "removeShot", "splitShot", "fixLineTiming"]),
      camera: cameraName.optional(),
      shot: shotNumber.optional(),
      name: z.string().trim().min(1).max(80).optional(),
      format: z.enum(["16:9", "2.39:1", "1.85:1", "4:3", "9:16"]).optional().describe("16:9横屏、2.39:1宽银幕、1.85:1遮幅、4:3、9:16竖屏"),
      start: filmSeconds.optional(),
      end: filmSeconds.optional(),
      at: filmSeconds.optional(),
    }),
  },
  editorPerformance: {
    description: "改演绎轨道（时间轴上的操作）：removeTrack删掉who的整条演绎（人还在场景里）；removeClip删掉who的某个片段；splitClip在片段第at秒处把它切成两段。安排新表演用stageAct。",
    parameters: z.strictObject({
      action: z.enum(["removeTrack", "removeClip", "splitClip"]),
      who: target,
      clip: z.string().trim().min(1).max(160).optional().describe("片段名或id（editorState里performers的clips）"),
      at: z.number().finite().min(0).max(3600).optional().describe("splitClip：从片段开头算起第几秒"),
    }),
  },
  editorAutoCoverage: {
    description: "一键分镜（时间轴上的“分镜”按钮）：按场景里的人和演绎自动排“分镜·”机位并剪好，带遮挡避让；script给台词（每行“角色：台词”）就按对白切镜；pace节奏0.6快切、1正常、1.6舒缓。场景还空着且剧本写了地点时会先搭景。",
    parameters: z.strictObject({
      script: z.string().trim().min(1).max(20000).optional(),
      pace: z.number().finite().min(0.4).max(2.5).optional(),
    }),
  },
  editorPrevisScript: {
    description: "剧本一键预演（“粘贴剧本/按剧本一键预演”按钮）：按剧本地点搭景、按角色站位、定日夜、按对白分镜并打开时间轴。不给script时用画布上连进来的上游剧本。多场剧本只做第一场。",
    parameters: z.strictObject({ script: z.string().trim().min(1).max(20000).optional() }),
  },
  editorExport: {
    description: "导出（右上角导出面板，可多选，一次做完）。items每镜三样：frames分镜图（每镜关键帧，多于1镜时加一张分镜总览）、views场景四视图（以这一镜主体为中心前右后左四向斜俯拍拼成一张）、clips白模视频（每镜一段，无字幕，做视频参考）；整场：overview场景微缩图（整场鸟瞰全貌）、script分镜脚本文本、previs预演小样整片（带镜号时间码台词字幕）、shotList镜头表HTML、edl剪辑表。to=canvas（默认）在画布上按镜分行建图片/视频/文本节点，镜头表和剪辑表存进工作区返回路径；to=files全部存进工作区返回路径。longEdge 1280或1920（图片和视频清晰度）。需要先有镜头段；带视频较慢，超时会返回jobId再用editorWait等。",
    parameters: z.strictObject({
      items: z.array(z.enum(exportItemKeys)).min(1).max(exportItemKeys.length),
      to: z.enum(["canvas", "files"]).optional(),
      longEdge: z.union([z.literal(1280), z.literal(1920)]).optional(),
    }),
  },
  editorAgentChat: {
    description: "把一句话交给节点里的内置导演Agent去做（和在编辑器对话框里发送一样，结果合并进场景并保存）。适合整段需求：“搭一个夜晚客栈，林冲进门点酒，拍成正反打”。返回它的回复；超过约100秒会先返回jobId，用editorWait取回。model不给时沿用对话框已选的模型，没选过用第一个可用文本模型。",
    parameters: z.strictObject({
      message: z.string().trim().min(1).max(8000),
      model: z.string().trim().min(1).max(200).optional().describe("模型名或modelId（editorState的agent.models里）"),
      thinking: z.enum(["off", "minimal", "low", "medium", "high", "xhigh", "max"]).optional(),
      newSession: z.boolean().optional().describe("true=开一段新对话再发"),
      performance: z.boolean().optional().describe("true=只改演绎和镜头（快速通道，不动景）；默认按场景对话"),
      images: z.array(workspacePath).max(4).optional().describe("附图（工作区里的png/jpg/webp/gif，每张≤10 MB）"),
      documents: z.array(workspacePath).max(10).optional().describe("文本附件（工作区里的txt/md/json/csv/srt等，每个≤400 KB），正文随本轮交给内置Agent"),
      whileRunning: z.enum(["queue", "steer"]).optional().describe("内置Agent正在回复时：queue=排队，本轮做完接着发；steer=作为引导交给它，按这句调整接下来的步骤（已完成的不撤销）。不给时正在回复就报错。排队和引导只能发文字"),
    }),
  },
  editorAgentStop: {
    description: "停下内置Agent正在进行的回复（已经采用的结果保留）。",
    parameters: z.strictObject({}),
  },
  editorAgentAnswer: {
    description: "回答内置Agent正在等的提问卡（editorState的agent.question）：单选题给answer（选项原文或自己的话），表单给values（按字段名）；skip=true跳过。",
    parameters: z.strictObject({
      answer: z.string().trim().min(1).max(8000).optional(),
      values: z.record(z.string().max(64), z.union([z.string().max(8000), z.number(), z.boolean(), z.null(), z.array(z.string().max(300)).max(20)])).optional(),
      skip: z.boolean().optional(),
    }),
  },
  editorAgentSessions: {
    description: "管理内置Agent的对话：list列出对话；read读某段对话最近的消息（不给id读当前，每条带序号n）；new开新对话；select切换到id；rename给id改名为name；remove删除id；compact把当前对话较早的内容压缩成摘要；deleteMessage删掉当前对话第n条（用户消息连同它的回复一起删）；branch从当前对话第n条（含它那一轮）复制出一段新对话并切过去。",
    parameters: z.strictObject({
      action: z.enum(["list", "read", "new", "select", "rename", "remove", "compact", "deleteMessage", "branch"]),
      id: z.string().trim().min(1).max(80).optional(),
      name: z.string().trim().min(1).max(80).optional(),
      limit: z.number().int().min(1).max(60).optional().describe("read：最近几条，默认10"),
      n: z.number().int().min(1).max(500).optional().describe("deleteMessage/branch：read返回的消息序号"),
    }),
  },
} satisfies Record<string, { description: string; parameters: z.ZodObject }>;

export type EditorEventName = keyof typeof editorEvents;
export type EditorEventArgs<Name extends EditorEventName> = z.output<(typeof editorEvents)[Name]["parameters"]>;
/** 由节点（index.vue）直接处理、不经过编辑器组件的事件。 */
export const nodeLevelEvents = ["editorOpen", "editorClose", "editorSave", "editorWait"] as const satisfies readonly EditorEventName[];
export type StudioEventName = Exclude<EditorEventName, (typeof nodeLevelEvents)[number]>;
/** 节点读好工作区文件后交给编辑器：导入模型的GLB、对话附图。 */
export type StudioEventInput<Name extends StudioEventName> = EditorEventArgs<Name> & { file?: File; files?: File[] };
/** 编辑器返回的待存文件（截图、镜头表、剪辑表），节点存进工作区后换成路径。 */
export type StudioEventFile = { label: string; file: File };

const round = (value: number) => Math.round(value * 100) / 100;
/** 场景摘要（editorState用；编辑器没打开时只给这一份）：物体按名字、素材、位置、朝向列出，最多200个。 */
export function summarizeScene(scene: SceneDocument, options: { objects?: boolean; query?: string } = {}) {
  const query = options.query?.trim();
  const listed = options.objects === false ? undefined : scene.objects.filter(object => !query || object.name.includes(query) || object.asset.name.includes(query));
  return {
    objectCount: scene.objects.length,
    ...(listed ? {
      objects: listed.slice(0, 200).map(object => ({ id: object.id, name: object.name, asset: object.asset.name, ...(object.asset.shape ? { shape: object.asset.shape } : {}), at: [round(object.position.x), round(object.position.y), round(object.position.z)], facing: Math.round(object.rotation.y), ...(object.visible ? {} : { hidden: true }) })),
      ...(listed.length > 200 ? { objectsListed: `只列了前200个（共${listed.length}个），用query缩小范围` } : {}),
    } : {}),
    groups: (scene.objectGroups ?? []).map(group => ({ id: group.id, name: group.name, objects: group.objectIds.length })),
    cameras: (scene.cameras ?? []).map(camera => ({ id: camera.id, name: camera.name, ...(camera.enabled === false ? { enabled: false } : {}), shots: camera.shots?.length ?? 0 })),
  };
}
