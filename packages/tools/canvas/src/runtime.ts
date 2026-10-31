import { z } from "zod";
export type { CanvasToolCall, CanvasInfo, CanvasContext } from "@toonflow/tools-scaffold/runtime";

const additionalNodeToolNames = z.array(z.string().regex(/^[a-z][a-zA-Z0-9]{0,63}$/, "名称需以小写字母开头，只能包含字母和数字，最多 64 个字符")).max(100, "每类最多追加 100 个工具名称").default([]);
export const nodeToolPermissionsSchema = z.strictObject({
  allowImage: z.boolean().default(true),
  allowVideo: z.boolean().default(true),
  allowAudio: z.boolean().default(true),
  imageToolNames: additionalNodeToolNames,
  videoToolNames: additionalNodeToolNames,
  audioToolNames: additionalNodeToolNames,
});
export type NodeToolPermissions = z.output<typeof nodeToolPermissionsSchema>;

export function isNodeToolAllowed(name: string, permissions: NodeToolPermissions) {
  const toolName = name.startsWith("node:") ? name.slice(5) : name;
  return (permissions.allowImage || (toolName !== "generateImage" && !permissions.imageToolNames.includes(toolName)))
    && (permissions.allowVideo || (toolName !== "generateVideo" && !permissions.videoToolNames.includes(toolName)))
    && (permissions.allowAudio || (toolName !== "generateAudio" && !permissions.audioToolNames.includes(toolName)));
}

const nodeId = z.string().min(1).max(256);
const position = z.strictObject({ x: z.number().finite(), y: z.number().finite() });
const canvasId = nodeId.optional();
const cursor = z.string().min(1).max(4096).optional();
const nodeIds = z.array(nodeId).min(1).max(20);

export const canvasSchemas = {
  getCanvas: z.strictObject({
    canvasId,
    include: z.array(z.enum(["canvases", "nodeTypes"])).max(2).optional(),
    cursor,
    limit: z.number().int().min(1).max(100).default(30),
  }),
  findCanvasNodes: z.strictObject({
    canvasId,
    query: z.string().max(200).optional(),
    types: z.array(nodeId).max(20).optional(),
    selectedOnly: z.boolean().optional(),
    cursor,
    limit: z.number().int().min(1).max(100).default(30),
  }),
  getCanvasNodes: z.strictObject({
    canvasId,
    nodeIds: nodeIds.refine(value => new Set(value).size === value.length, "nodeIds 不能重复，请先去重"),
    fields: z.array(z.enum(["label", "type", "position", "ports", "data", "outputs"])).max(6).default(["label", "type", "position"]),
    dataKeys: z.array(nodeId).min(1).max(20).optional(),
    path: z.array(z.string().max(256)).min(1).max(64)
      .refine(value => ["label", "type", "position", "ports", "data", "outputs"].includes(value[0]!), "path 必须从节点投影字段开始")
      .refine(value => new TextEncoder().encode(JSON.stringify(value)).byteLength <= 2048, "path 的 JSON UTF-8 长度不能超过 2048 字节").optional(),
    valueOffset: z.number().int().min(0).default(0),
    valueLimit: z.number().int().min(1).max(100).default(30),
    textOffset: z.number().int().min(0).default(0),
    textLimit: z.number().int().min(1).max(4000).default(1000),
    cursor,
  }).refine(value => Boolean(value.path) || (value.textOffset === 0 && value.valueOffset === 0), "textOffset 或 valueOffset 大于 0 时必须提供 path"),
  getCanvasEdges: z.strictObject({
    canvasId,
    nodeIds: nodeIds.optional(),
    direction: z.enum(["incoming", "outgoing", "both"]).default("both"),
    cursor,
    limit: z.number().int().min(1).max(200).default(100),
  }),
  getNodeTools: z.strictObject({
    canvasId,
    nodeIds: nodeIds.refine(value => new Set(value).size === value.length, "nodeIds 不能重复，请先去重"),
    names: z.array(nodeId).min(1).max(20).optional(),
    cursor,
    limit: z.number().int().min(1).max(50).default(20),
  }),
  addCanvas: z.strictObject({ name: z.string().trim().min(1).max(120).optional() }),
  switchCanvas: z.strictObject({ canvasId: z.string().min(1).max(256) }),
  renameCanvas: z.strictObject({ canvasId: z.string().min(1).max(256).optional(), name: z.string().trim().min(1).max(120) }),
  addNode: z.strictObject({ type: z.string().min(1), position, label: z.string().trim().min(1).max(200).optional() }),
  deleteNodes: z.strictObject({ nodeIds: z.array(nodeId).min(1).max(64) }),
  moveNodes: z.strictObject({ moves: z.array(z.strictObject({ nodeId, position })).min(1).max(64) }),
  renameNodes: z.strictObject({ renames: z.array(z.strictObject({ nodeId, label: z.string().trim().min(1).max(200) })).min(1).max(64) }),
  connectNodes: z.strictObject({
    connections: z.array(z.strictObject({ source: nodeId, sourceHandle: z.string().min(1), target: nodeId, targetHandle: z.string().min(1) })).min(1).max(64),
  }),
  deleteEdges: z.strictObject({ edgeIds: z.array(z.string().min(1).max(256)).min(1).max(64) }),
  selectNodes: z.strictObject({ nodeIds: z.array(nodeId) }),
  arrangeCanvas: z.strictObject({}),
  fitCanvas: z.strictObject({ nodeIds: z.array(nodeId).optional() }),
  nodeTools: z.strictObject({ nodeId, name: z.templateLiteral(["node:", z.string().regex(/^[a-z][a-zA-Z0-9]{0,63}$/)]), args: z.record(z.string(), z.json()) }),
};

export type CanvasOperationName = keyof typeof canvasSchemas;
export type CanvasRequest = {
  [Name in CanvasOperationName]: { name: Name; args: z.output<(typeof canvasSchemas)[Name]> };
}[CanvasOperationName];

export const canvasOperations = [
  { name: "getCanvas", label: "画布概览", description: "读取激活画布的 ID、节点数、连线数、选中数量和视口，不返回全部节点、连线或函数。include 按需选择 canvases（画布列表）或 nodeTypes（availableNodeTypes），二者共用 cursor/limit 分页。已知节点 ID 时可直接读取节点。所有读取工具每次最多 64 KiB，返回 hasMore/nextCursor；继续分页须保留原参数，仅替换 cursor。cursor 失效时重新查询。canvasId 可选，用于校验目标仍是当前激活画布。不要直接修改画布 JSON。", parameters: canvasSchemas.getCanvas },
  { name: "findCanvasNodes", label: "查找画布节点", description: "按 query（节点 ID 或完整名称）、types 和 selectedOnly 筛选节点，省略筛选时分页列举；返回 nodes 简要信息，其中名称预览最多 512 字符，不返回正文和函数定义。limit 默认 30、最多 100，每次最多扫描 2000 个节点。totalNodes 是画布节点总数而非命中数；selectedOnly 按各页读取时的选择状态筛选，并非冻结快照。即使 nodes 为空，hasMore 为 true 仍须使用 nextCursor 继续扫描。处理全部节点时逐批完成并保留摘要和游标，避免将各页详情不断堆进上下文。", parameters: canvasSchemas.findCanvasNodes },
  { name: "getCanvasNodes", label: "读取节点详情", description: "按已知且不重复的 nodeIds 读取最多 20 个节点，fields 默认 label/type/position；按需指定 ports、data、outputs。dataKeys 仅选择 data 的自身属性。path 可读取投影字段下的嵌套值，如 ['data','promptModel']，仅访问自身属性，ports 对应 data.handles。path 返回 value，数组/对象按 valueOffset/valueLimit 分页（默认 30、最多 100），字符串按 textOffset/textLimit 分段（默认 1000、最多 4000 字符）。textOffset 或 valueOffset 大于 0 时必须提供 path。检查每节点 truncated 的路径、total、nextOffset，沿该路径继续读取，不能把截断当完整。已有文本文件路径应交给文件读取工具。响应受 64 KiB 限制，hasMore 时保留参数用 nextCursor 继续。", parameters: canvasSchemas.getCanvasNodes },
  { name: "getCanvasEdges", label: "读取画布连线", description: "分页读取 nodeIds 相关的局部连线；direction 为 incoming/outgoing/both，默认 both。省略 nodeIds 时分页遍历全图连线，limit 默认 100、最多 200，每次最多扫描 2000 条边。totalEdges 是画布连线总数而非命中数。返回 edges 与分页信息，空 edges 但 hasMore 为 true 时继续 nextCursor。查询上游时逐层限制范围，不一次展开整张图。", parameters: canvasSchemas.getCanvasEdges },
  { name: "getNodeTools", label: "查询节点函数", description: "按最多 20 个不重复的 nodeIds 查询实际注册的函数；names 可筛选完整 node:函数名，limit 默认 20、最多 50。返回 nodeTools，每项含 nodeId/name/description/parameters；函数 schema 保持完整，单项过大时明确报错。根据查询到的 schema 构造参数再调用 nodeTools，不猜测函数名或参数。hasMore 时用 nextCursor 继续。", parameters: canvasSchemas.getNodeTools },
  { name: "addCanvas", label: "新增画布", description: "在当前工作区创建空白画布 JSON 并切换到新画布。name 可选且不含 .json 扩展名；省略时自动使用未占用的画布N，同名文件不会被覆盖。返回新画布状态，本轮后续调用可继续新增节点。", parameters: canvasSchemas.addCanvas },
  { name: "switchCanvas", label: "切换画布", description: "先从 getCanvas({include:['canvases']}) 分页获取 canvasId，再切换激活画布。等待当前修改保存，返回新画布概览，本轮后续操作继续作用于新画布。", parameters: canvasSchemas.switchCanvas },
  { name: "renameCanvas", label: "重命名画布", description: "重命名当前工作区画布，同时修改对应 JSON 文件名。省略 canvasId 时重命名激活画布；name 不含 .json 扩展名。不会覆盖已有文件，返回操作后的激活画布概览。", parameters: canvasSchemas.renameCanvas },
  { name: "addNode", label: "新增节点", description: "在激活画布的画布坐标 position 新增节点，type 必须来自 getCanvas({include:['nodeTypes']}) 的 availableNodeTypes。返回新增节点信息；节点函数通过 getNodeTools 按需查询。", parameters: canvasSchemas.addNode },
  { name: "deleteNodes", label: "删除节点", description: "从激活画布批量删除指定 nodeIds 的节点及其连接边；同一批次内的父子节点可以一起删除，任一节点校验失败则整体不执行。返回 removedEdgeCount、最多 100 项 removedEdgeIds 及 truncated；截断只影响删除回执，不代表仅删除了部分连线。", parameters: canvasSchemas.deleteNodes },
  { name: "moveNodes", label: "移动节点", description: "将激活画布指定节点批量移动到各自的画布坐标 position，一次可传入多个节点，任一项校验失败则整体不执行。", parameters: canvasSchemas.moveNodes },
  { name: "renameNodes", label: "重命名节点", description: "批量修改激活画布指定节点的显示名称，一次可传入多个节点，任一项校验失败则整体不执行。", parameters: canvasSchemas.renameNodes },
  { name: "connectNodes", label: "连接节点", description: "批量连接激活画布的输出端口 sourceHandle 和输入端口 targetHandle，一次可传入多组连接。先用 getCanvasNodes 的 ports 字段确认目标节点与端口；沿用画布和节点的连接校验，任一项校验失败则整体不执行。", parameters: canvasSchemas.connectNodes },
  { name: "deleteEdges", label: "删除连线", description: "从激活画布批量删除指定 edgeIds 的连线，任一项校验失败则整体不执行。", parameters: canvasSchemas.deleteEdges },
  { name: "selectNodes", label: "选择节点", description: "选择激活画布中指定 nodeIds 的节点；传空数组取消节点选择。", parameters: canvasSchemas.selectNodes },
  { name: "arrangeCanvas", label: "整理画布", description: "根据节点实际尺寸和连线，将激活画布的全部顶层节点从左到右自动排列，并适应视图。子节点保持相对位置，不修改内容、连线或选择，不触发生成。返回 arrangedCount、最多 100 项 arrangedNodeIds、truncated 和 viewport；truncated 仅指 ID 回执缩略，不代表仅整理了部分节点。节点尺寸未就绪或存在不可移动节点时拒绝整理。仅在需要整理整幅画布时调用；局部调整使用 moveNodes，单纯查看使用 fitCanvas。", parameters: canvasSchemas.arrangeCanvas },
  { name: "fitCanvas", label: "适应画布", description: "调整激活画布视口以展示 nodeIds 指定的节点；省略 nodeIds 则展示全部节点。返回 fitted、viewport、nodeCount，传入 nodeIds 时另返回最多 100 项 nodeIds 和 truncated；截断只影响回执。", parameters: canvasSchemas.fitCanvas },
  { name: "nodeTools", label: "调用节点函数", description: "调用激活画布节点注册的 node:functionName。先通过 getNodeTools 读取该节点实际函数的完整 parameters，再按 schema 填写 args。新建节点可在同轮查询和调用；不要通过修改画布 JSON 代替节点函数。返回值由具体业务函数决定，五个画布读取工具的 64 KiB 限制不适用于此执行入口。", parameters: canvasSchemas.nodeTools },
] as const;
