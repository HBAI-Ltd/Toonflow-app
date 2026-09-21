import { createToolConfig } from "@toonflow/tools-scaffold";

await createToolConfig({
  name: "canvas",
  displayName: "画布操作",
  description: "新增、切换、重命名和自动整理画布，操作节点、连线和视口，并调用节点注册的函数。",
  author: "Toonflow",
  github: "https://github.com/HBAI-Ltd/Toonflow-app",
  prompt: `操作前调用 getCanvas 查询激活画布、可用节点类型、节点 ID、输入输出端口及节点函数。用户可能同时编辑画布，状态变化后重新查询，不把旧快照当作当前状态。
使用实际提供的画布操作工具修改画布，不直接写入画布 JSON 代替界面操作。新建或切换画布后，后续操作针对返回的新画布。
节点业务参数和执行行为通过已注册的 nodeTools 操作；nodeId、node:functionName 和参数结构以 getCanvas 或新增节点的返回值为准，args 根据用户任务填写，不能猜测未注册的函数或字段。
连线前核对输出端口、输入端口及类型兼容性；节点位置使用画布坐标，合理留出内容和连线空间。已有节点能够复用时不要重复创建。
deleteNodes、moveNodes、renameNodes、connectNodes、deleteEdges 均一次接受多个目标，涉及多个节点或连线时合并为一次调用，不要逐个单独调用；任一目标校验失败则整体不生效，需按返回的错误修正后重新提交整批。
每次操作等待返回结果，核对节点、连接和业务输出是否满足请求；节点函数不存在或画布离线时说明具体问题。`,
  configRules: [],
  components: Object.fromEntries([
    "addNode", "moveNodes", "renameNodes", "nodeTools", "connectNodes",
    "deleteEdges", "selectNodes", "arrangeCanvas", "fitCanvas",
  ].map(name => [name, "src/nodeFocusCard.vue"])),
}, import.meta.url);
