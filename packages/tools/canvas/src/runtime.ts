import { z } from "zod";
export type { CanvasToolCall, CanvasInfo, CanvasContext } from "@toonflow/tools-scaffold/runtime";

const nodeId = z.string().min(1).max(256);
const position = z.strictObject({ x: z.number().finite(), y: z.number().finite() });

export const canvasSchemas = {
  getCanvas: z.strictObject({}),
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
  { name: "getCanvas", label: "读取画布", description: "获取当前工作区的 canvases 列表及激活画布的 id、nodes、edges、viewport、availableNodeTypes 和各节点注册的 nodeTools。操作前先查询实际节点 ID、端口和节点类型；不要通过修改画布 JSON 控制激活的画布。", parameters: canvasSchemas.getCanvas },
  { name: "addCanvas", label: "新增画布", description: "在当前工作区创建空白画布 JSON 并切换到新画布。name 可选且不含 .json 扩展名；省略时自动使用未占用的画布N，同名文件不会被覆盖。返回新画布状态，本轮后续调用可继续新增节点。", parameters: canvasSchemas.addCanvas },
  { name: "switchCanvas", label: "切换画布", description: "先从 getCanvas 的 canvases 列表获取 canvasId，再切换激活画布。等待当前修改保存，返回新画布状态，本轮后续操作继续作用于新画布。", parameters: canvasSchemas.switchCanvas },
  { name: "renameCanvas", label: "重命名画布", description: "重命名当前工作区画布，同时修改对应 JSON 文件名。省略 canvasId 时重命名激活画布；name 不含 .json 扩展名。不会覆盖已有文件，返回操作后的激活画布与 canvases 列表。", parameters: canvasSchemas.renameCanvas },
  { name: "addNode", label: "新增节点", description: "在激活画布的画布坐标 position 新增节点，type 必须来自 getCanvas 的 availableNodeTypes。返回新增节点详情和注册的 nodeTools。", parameters: canvasSchemas.addNode },
  { name: "deleteNodes", label: "删除节点", description: "从激活画布批量删除指定 nodeIds 的节点及其连接边；同一批次内的父子节点可以一起删除，任一节点校验失败则整体不执行。", parameters: canvasSchemas.deleteNodes },
  { name: "moveNodes", label: "移动节点", description: "将激活画布指定节点批量移动到各自的画布坐标 position，一次可传入多个节点，任一项校验失败则整体不执行。", parameters: canvasSchemas.moveNodes },
  { name: "renameNodes", label: "重命名节点", description: "批量修改激活画布指定节点的显示名称，一次可传入多个节点，任一项校验失败则整体不执行。", parameters: canvasSchemas.renameNodes },
  { name: "connectNodes", label: "连接节点", description: "批量连接激活画布的输出端口 sourceHandle 和输入端口 targetHandle，一次可传入多组连接。先用 getCanvas 确认节点与端口；沿用画布和节点的连接校验，任一项校验失败则整体不执行。", parameters: canvasSchemas.connectNodes },
  { name: "deleteEdges", label: "删除连线", description: "从激活画布批量删除指定 edgeIds 的连线，任一项校验失败则整体不执行。", parameters: canvasSchemas.deleteEdges },
  { name: "selectNodes", label: "选择节点", description: "选择激活画布中指定 nodeIds 的节点；传空数组取消节点选择。", parameters: canvasSchemas.selectNodes },
  { name: "arrangeCanvas", label: "整理画布", description: "根据节点实际尺寸和连线，将激活画布的全部顶层节点从左到右自动排列，并适应视图。子节点保持相对位置，不修改内容、连线或选择，不触发生成。返回 arrangedNodeIds 和 viewport；节点尺寸未就绪或存在不可移动节点时拒绝整理。仅在需要整理整幅画布时调用；局部调整使用 moveNodes，单纯查看使用 fitCanvas。", parameters: canvasSchemas.arrangeCanvas },
  { name: "fitCanvas", label: "适应画布", description: "调整激活画布视口以展示 nodeIds 指定的节点；省略 nodeIds 则展示全部节点。", parameters: canvasSchemas.fitCanvas },
  { name: "nodeTools", label: "调用节点函数", description: "调用激活画布节点注册的 node:functionName。nodeId 和 name 可从 getCanvas 或 addNode 的 nodeTools 获取，args 按该函数的 parameters 填写。新建节点可在同轮调用；不要通过修改画布 JSON 代替节点函数。", parameters: canvasSchemas.nodeTools },
] as const;
