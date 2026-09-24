# 节点脚手架

`@toonflow/nodes-scaffold` 提供共享 Vite 配置和节点骨架组件。每个 `packages/nodes/*` 目录是一个独立 Bun workspace，自行维护依赖、Vue 子组件和构建插件。

```text
packages/nodeScaffold/
  index.ts                 共享构建配置
  src/runtime.ts           浏览器组件、组合式函数、类型和工具的统一入口
  src/useNode.ts           当前节点状态、端口、输出、事件和文件能力
  src/nodeSkeleton.vue     共用标题栏、内容 Card 和左右连接点
  src/values.ts            固定输出结构与类型校验
  src/nodeInputs.ts             按目标节点、输入端口读取上游值
  src/nodeEvent.ts         统一注册节点输入、输出、删除和连接校验事件
  src/workspaceFiles.ts    使用宿主文件能力、上传节点文件
packages/nodes/imageNode/
  package.json             当前节点自己的依赖
  vite.config.ts           引用共享配置
  tsconfig.json
  src/index.vue            当前节点唯一入口
build/nodes/
  imageNode.umd.js          单个节点的元数据、组件、子组件、依赖和样式
data/nodes/
  imageNode.umd.js          开发时同步，供 server 加载
```

在 `src/components/` 中封装子组件、在其它目录放工具函数，正常 import 即可；它们不会单独生成节点入口。

节点运行时代码统一从 `@toonflow/nodes-scaffold/runtime` 导入组件、组合式函数、类型和工具。根入口 `@toonflow/nodes-scaffold` 仅供 Vite 配置导入 `createNodeConfig`，不要在浏览器组件中引用；旧的运行时子路径仍兼容。

## 共享提示词与参考列表

多种节点共用的提示词输入与参考列表放在脚手架中，节点之间不互相依赖。按组件子路径导入，仅使用时才打包对应依赖：

```ts
import promptInput from "@toonflow/nodes-scaffold/promptInput";
import referenceItem from "@toonflow/nodes-scaffold/referenceItem";
import { useNodeReferences } from "@toonflow/nodes-scaffold/runtime";

const { refList, referenceMentions, setReferencePreview, removeReference } = useNodeReferences("in");
```

`promptInput` 使用 `v-model` 保存富文本结构、`v-model:text` 读取纯文本，`references` 接收包含 `id`、`name`、`value` 和可选 `avatar` 的参考项。`referenceItem` 使用 `v-model` 绑定 `NodeInputValue[]`，通过 `preview` 返回预览地址、`remove` 通知节点断开对应连线。Vue、VueFlow 和 Element Plus 仍复用宿主实例。

`useNodeReferences(handleId = "in")` 统一管理对应输入端口的参考顺序、预览和删除连线。将 `refList` 绑定到 `referenceItem`，`preview`、`remove` 分别绑定 `setReferencePreview`、`removeReference`，并把 `referenceMentions` 传给 `promptInput`。拖拽顺序按来源节点与端口 ID 保存到 `node.data.referenceOrder[handleId]`，上游输出与预览不重复保存；重载恢复相同顺序，已插入的引用通过稳定 ID 跟随原对象更新编号。

## 节点骨架

从 `@toonflow/nodes-scaffold/runtime` 导入 `nodeSkeleton` 和 `useNode`，在节点入口用 `<nodeSkeleton v-bind="nodeProps">` 包裹内容。`label` 默认是“未命名节点”，上方标题栏无边框，下方内容使用 Element Plus Card，默认插槽用于节点内容。节点入口保留 `defineOptions({ inheritAttrs: false })`，避免 VueFlow 传入的顶层属性覆盖骨架的 `label` 等参数。

标题左侧显示 16px 图标，默认使用 `IconBox`；节点入口在 `defineOptions({ icon: IconPhoto })` 声明图标，`useNode()` 和画布节点列表复用同一个组件。单个实例仍可通过 `useNode({ icon })` 或骨架的 `:icon` 覆盖，图标无需写入节点的 `data`。

通过 `handles` 数组定义连接点，默认没有连接点。每项包含节点内唯一且稳定的 `id`、`type`（`target` 为左侧输入，`source` 为右侧输出）、数据类型 `dataType`，以及可选提示 `label`。同一侧支持多个连接点，按数组顺序均匀排列；单个连接点居中。Card 会按连接点数量增高。

每个 node 在 `defineOptions({ handles })` 声明默认端口，UMD 组件直接暴露该数组，供画布在创建节点前过滤可连接的节点列表。`useNode()` 自动复制这份定义到独立的 `handles` ref；需要动态初始化时仍可用 `useNode({ handles })` 覆盖，不从 `data.handles` 读取定义或默认值。节点通过修改 `handles.value` 控制端口数量、类型、提示及顺序；接收规则通过 `nodeEvent.on("canConnect", callback)` 注册。`nodeProps` 自动跟随画布中的标题变化。标题换行、端口位置变化后会重新测量连线锚点；删除端口、修改端口 ID 或输入输出方向时，会清理原端口的失效连线。

```vue
<template>
  <nodeSkeleton v-bind="nodeProps">
    <el-input v-model="outputs.text.value" type="textarea" class="nodrag nopan nowheel" @pointerdown.stop @mousedown.stop @dblclick.stop @keydown.stop />
  </nodeSkeleton>
</template>

<script setup lang="ts">
import { ElInput as elInput } from "element-plus";
import { nodeSkeleton, useNode, type NodeHandle } from "@toonflow/nodes-scaffold/runtime";

defineOptions({
  inheritAttrs: false,
  handles: [{ id: "text", type: "source", dataType: "STRING", label: "文本输出" }] satisfies NodeHandle[],
});
const { nodeProps, outputs } = useNode({
  label: "文本",
  outputs: { text: { dataType: "STRING", value: "" } },
});
</script>
```

`useNode(options?)` 接受 `label`、`icon`、`handles`、`outputs`，返回 `id`、`node`、`config`、`nodeProps`、`handles`、`outputs`、`nodeEvent`、`nodeTools`、`files`、`ai`、`ffmpeg`、`updateNodeInternals`。`nodeProps` 是供骨架绑定的 computed，包含标题、图标、端口和输出；`outputs` 根据默认值推导类型，并恢复当前节点保存的合法输出，只接受仍存在的 source 端口及匹配类型。文本默认值保持 `STRING`；图片节点无已保存输出时保持为空。

`files.uploadFile(file)`、`files.removeNodeFiles()` 和 `updateNodeInternals()` 已绑定当前节点，无需再次传 ID；`files` 同时提供 `getWorkspaceFiles()`、`useFileUrl()`。端口定义、具体 UI、上传校验和上传/删除互斥仍由业务节点管理。选中状态可直接使用 `node.selected`，例如绑定 `v-model:bottomVisible="node.selected"`。

`useNode()` 还返回 `previewReady`，并通过 `nodeProps` 传给骨架：节点首次靠近视口时才挂载默认槽位，之后保留预览和 UI 状态。工具注册、输出及生成任务应放在节点自身的 `setup` 中，不依赖预览子组件挂载；需要立即挂载内容时，可在骨架上显式设置 `:previewReady="true"`。框选或拖动时上下槽位不挂载，单击单个节点后恢复。

连接点未连接时使用 `IconCircleDashed`，连接后使用 `IconCircleDot`，最后一条连线移除后恢复虚线圆。图标为 18px，透明鼠标交互区域向外扩大 8px（总计 34px），不会显示原来的实心圆背景。



### FFmpeg 媒体处理

`await useNode().ffmpeg(signal?)` 获取绑定当前工作区的工厂；在组件 setup 中获取 `ffmpeg`，事件处理函数中再调用。也可以单独使用 `useNodeFfmpeg()`（从 runtime 或 `@toonflow/nodes-scaffold/nodeFfmpeg` 导入）。调用方式与 tools 的 fluent 链一致，支持多输入、多输出、复杂滤镜、截图、拼接、`clone()`、`ffprobe` 和编码器等能力查询。

```ts
const { ffmpeg: loadFfmpeg, id } = useNode();

async function compose(signal?: AbortSignal) {
  const ffmpeg = await loadFfmpeg(signal);
  // 输出目录应事先通过 files 创建；新文件名避免覆盖原素材。
  const output = `assets/${id}/combined.mp4`;
  await new Promise<void>((resolve, reject) => {
    ffmpeg("assets/first.mp4")
      .input("assets/second.mp4")
      .complexFilter("[0:v][1:v]hstack=inputs=2[video]")
      .outputOptions("-map [video]")
      .videoCodec("libx264")
      .on("progress", progress => console.log(progress.timemark))
      .on("error", reject)
      .on("end", () => resolve())
      .save(output);
  });
  return output;
}
```

链式调用通过 `/api/ffmpeg/execute` 交给宿主的 `@toonflow/ffmpeg` 执行，节点 UMD 不包含 Node.js 执行库。支持 `start`、`progress`、`stderr`、`codecData`、`filenames`、`end`、`error` 事件及 `on/once/off`；配置在执行前完成，并行使用独立命令或 `clone()`。目录在获取工厂时固定，切换工作区后不会写入新项目。

输入输出使用工作区文件路径，上传和读取二进制复用 `files`。浏览器不能传递 Node.js Stream、logger 或子进程，不提供 `.pipe()`、执行程序路径 setter 和服务器预设文件加载；`preset(command => ...)` 可在节点内复用配置。类型使用 `BrowserFfmpegFactory` / `BrowserFfmpegCommand`，不冒充原生 Node.js 对象。

节点卸载、传入 signal 取消或 `command.kill()` 会取消请求并终止转换；开始前取消也会阻止随后启动的 FFmpeg 继续执行。FFprobe/能力查询的原生库未暴露子进程，取消仅停止等待查询结果。缺少 FFmpeg 时复用设置中的下载提示，不自动安装或重试。

显式输入输出与截图路径沿用宿主的工作区、符号链接检查；原始参数、滤镜和媒体清单中的间接 I/O 仍仅供可信节点使用，**不是文件系统沙箱**。服务端原生 API 参见 `packages/toolScaffold/readme.md`。

### AI 模型调用

`useNode()` 返回的 `ai` 提供文本与媒体模型列表、文本生成和媒体生成，也可以在组件 setup 中单独调用 `useNodeAi()`。文本生成统一使用 `ai.generate()`，流式通知与私有工具都是可选参数，不需要切换调用方法。

```ts
const { ai } = useNode();
const models = await ai.getModels();
const model = models[0];
if (!model) throw new Error("请先在设置中添加模型");
const input = { providerId: model.providerId, modelId: model.modelId, prompt: "写一段简短介绍" };

// 一次返回完整文本，也可传入 systemPrompt。
const result = await ai.generate(input);
console.log(result.text);

// 按增量更新；Promise 最终返回完整结果。
let text = "";
await ai.generate({
  ...input,
  onEvent(event) {
    if (event.type === "text") text += event.delta;
  },
});
```

- `ai.getModels(signal?)`：读取设置中已配置的模型，返回 `providerId`、`providerLabel`、`modelId`、`label`、`protocol` 和可选的上下文、输出长度；`protocol` 为 `openai-completions`、`openai-responses` 或 `anthropic-messages`，不返回密钥或接口地址。
- `ai.generate(input)`：始终返回 `{ text, reasoning? }`。`input` 包含 `providerId`、`modelId`、`prompt`，可选 `systemPrompt`、`references`、`directory`、`tools`、`onEvent` 和 `signal`。
- `onEvent` 接收正文或思考增量 `{ type: "text" | "reasoning", delta }`，以及工具开始 `{ type: "toolStart", id, name, args }`、工具完成 `{ type: "toolEnd", id, name, result, isError }`。不传回调也使用相同执行流程，等待最终结果即可。
- `references` 按列表顺序传入 `STRING`、`IMAGE`、`VIDEO` 的 `{ dataType, value }`，对应 `{{ref 1}}` 等编号；文本携带原文，媒体携带工作区相对路径与 MIME 类型，后端校验目录并读取为附件。媒体参考必须传入工作区绝对路径 `directory`。节点不预判模型附件能力，接口错误原样回传；视频使用 Chat Completions 的 `video_url`，Responses/Anthropic 按文件提交，是否接受取决于供应商。
- 组件卸载会中止浏览器请求；Bun 1.3.14 在部分静默 SSE 场景下不能及时感知断连，上游生成可能继续到结束。需要提前中止时传入 `signal: controller.signal`。HTTP 错误、流内错误和缺少完成事件的断流都会抛错，调用方负责显示错误；客户端不自动重试。
- 文本节点保留上次输出，直到收到新文本；流中断时保留已生成部分。

需要工具调用时向同一个入口传入 `tools: localTools`，类型为 `NodeAiTool[]`，从运行时入口导出。每个工具包含 `{ name, description, parameters, execute }`；`parameters` 是 JSON Schema，`execute(args, signal)` 在节点侧执行并校验参数。工具循环复用 SDK，本次上下文由浏览器维护，每次请求携带模型所需的上下文；服务端仅代理单次模型请求、读取密钥和处理附件，不创建会话、不执行工具。私有工具不注册到 `nodeTools`，后者仅用于外部总 Agent 操作节点。

带工具的调用最多请求模型 40 次，超过 10 分钟会发出取消信号；异步工具应响应传入的 `signal`，脚手架无法强制中断忽略信号的任意代码。需要原子提交的工具应只修改私有草稿；调用成功后由节点校验并保存，错误或取消时丢弃草稿。脚手架不能自动回滚工具已经产生的外部副作用。

文本 AI 只提供 `generate({ ...input, onEvent, signal })`；服务端只接收 `Context` 请求并返回 SSE，不保留旧调用格式。


- `ai.getMediaModels(signal?)`：读取已安装供应商声明的图片、视频模型，返回供应商与模型 ID、名称、类型及模式参数。图片模型可通过 `imageSizes`、`imageRatios` 声明支持的分辨率与比例选项，节点生成时使用 `size`、`ratio` 传入选择值。
- `ai.generateImage(input, signal?)`：非流式生成并落盘，返回 `{ path, mimeType, mediaType: "image" }[]`。`input` 包含工作区绝对路径 `directory`、`providerId`、`modelId`、`prompt`、工作区相对目录 `outputDirectory`；可传 `images: { path, mimeType }[]`、`ratio`、`size`。图片参考只传工作区相对路径，由后端读取。
- `ai.generateVideo(input, signal?)`：视频生成并落盘，返回 `{ path, mimeType, mediaType: "video" }[]`。基础字段同图片生成；使用 `duration`、`resolution`、`ratio`、`generateAudio`、`mode` 配置视频，可传 `images`、`videos`、`audios` 和 `firstFrame`、`lastFrame`，素材均为工作区内 `{ path, mimeType }` 引用。

`directory` 在生成前通过 `files.getWorkspaceFiles().list()` 取得快照，`outputDirectory` 使用 `assets/${id}`。结果可直接赋给 `outputs.value.image = { dataType: "IMAGE", value: { url: result.path, mimeType: result.mimeType } }`；使用 `files.useFileUrl` 预览。图片生成节点会合并文本参考、传入图片参考，成功后替换输出，失败或停止时保留上次图片；删除节点前取消请求，并清理其文件目录。

### Agent 节点函数

在节点的同步 `setup` 中调用 `nodeTools.register`。可以直接从运行时入口导入 `nodeTools`，也可以从 `useNode()` 返回值取得。方法自动绑定当前节点 ID，返回注销函数，并在组件卸载时自动注销。

```ts
import { useNode, z } from "@toonflow/nodes-scaffold/runtime";

const { outputs, nodeTools } = useNode({
  handles: [{ id: "text", type: "source", dataType: "STRING" }],
  outputs: { text: { dataType: "STRING", value: "" } },
});

nodeTools.register({
  name: "setText",
  description: "修改此节点的文本输出",
  parameters: z.strictObject({ text: z.string().min(1) }),
  execute({ text }) {
    outputs.value.text.value = text;
    return { text };
  },
});
```

函数名使用小驼峰，上例显示为 `node:setText`；同名函数通过 `nodeId` 区分。启用 `packages/tools/canvas` 的“画布操作”插件后，Agent 通过 `getCanvas` 查询节点、端口和 `nodeTools` 清单，并通过统一的 `nodeTools` 调用：

```json
{ "nodeId": "具体节点 ID", "name": "node:setText", "args": { "text": "新内容" } }
```

`parameters` 使用 Zod 对象 schema，`z` 由脚手架统一导出，节点无需单独安装 Zod。`execute` 的参数类型自动推导，注册时转为输入类型的 Draft 7 JSON Schema 供 Agent 和服务端使用。前端执行前调用原始 schema 的 `parseAsync`，保留默认值、转换和异步 `refine`，参数不合法时不会执行回调。不能转换为 JSON Schema 的输入类型会在注册时直接报错。

回调支持同步或异步，返回值须可 JSON 序列化；没有返回值时传回 `null`，抛错会作为工具执行错误返回 Agent。

注册表共用宿主 Vue Flow 实例，不写入画布 JSON。每次画布操作读取当前注册表，`addNode` 返回新增节点的 `nodeTools` 清单，可在同一轮 Agent 对话中继续调用。节点卸载后的函数不可调用；手动切换画布会终止当前对话绑定的旧画布操作；Agent 通过 `addCanvas` 新建或 `switchCanvas` 切换后，仅发起操作的对话重新绑定新画布并可在同轮继续调用。修改通过 Vue Flow 实例完成，前端执行后等待现有画布保存流程完成再返回结果。

`getCanvas` 同时返回工作区 `canvases` 列表（`id`、`name`）。`addCanvas({ name? })` 新建空画布并选中，省略名称时使用未占用的 `画布N`；`switchCanvas({ canvasId })` 在保存后切换画布；`renameCanvas({ canvasId?, name })` 重命名对应 JSON 文件，省略 `canvasId` 则修改激活画布，`name` 不含 `.json` 后缀。三者返回更新后的激活画布状态，新建和重命名不会覆盖已有文件。

画布基础操作包括 `getCanvas`、`addCanvas`、`switchCanvas`、`renameCanvas`、`addNode`、`deleteNode`、`moveNode`、`renameNode`、`connectNodes`、`deleteEdge`、`selectNodes` 和 `fitCanvas`。节点内容仍通过已注册函数修改，不向 Agent 开放任意写入节点 `data`。删除会先触发节点的 `delete` 回调并清理连接边；连接复用端口方向、数据类型和节点的 `canConnect` 校验。

异步回调可从第二个参数取得 `{ signal }`，传给 `fetch` 等操作并在修改状态前检查 `signal.throwIfAborted()`。单次调用最多等待 120 秒；取消或切换画布会停止等待，但回调内部的异步工作需要配合 signal 才能停止。浏览器直接断开且运行时未触发关闭事件时，服务端由超时清理等待。

### 上下悬浮插槽

骨架提供 `top`、`bottom` 两个具名插槽，分别通过 `v-model:topVisible`、`v-model:bottomVisible` 控制显隐，默认隐藏。未提供 `top` 插槽时，上方默认显示“添加到素材库、下载、全屏”工具栏；未提供 `bottom` 插槽时不渲染下方浮层。浮层水平居中，与节点相距 12px，上方浮层位于标题栏之上，避免遮挡标题。两者不占据节点布局空间，不影响卡片和连接点位置。

`topWidth`、`bottomWidth` 默认均为 `"20vw"`。数字按 px 处理，字符串支持百分比等 CSS 宽度。默认工具栏建议设置 `topWidth="max-content"`；传入 `downloadUrl`、`downloadName` 控制下载，通过 `@fullscreen` 打开节点自己的全屏视图。素材库按钮复用节点的输出与宿主保存弹窗，没有输出时禁用。额外按钮放在 `topActions` 插槽，位置在下载按钮前；图片、视频、音频节点在此提供替换按钮。自定义 `top` 则替换整个工具栏。编辑浮层内容不会拖动画布或弹出节点右键菜单。

```vue
<template>
  <nodeSkeleton v-model:topVisible="topVisible" v-model:bottomVisible="bottomVisible" :bottomWidth="480">
    <template #top>上方内容</template>
    <template #bottom>下方内容</template>
  </nodeSkeleton>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { nodeSkeleton } from "@toonflow/nodes-scaffold/runtime";

defineOptions({ inheritAttrs: false });
const topVisible = ref(true);
const bottomVisible = ref(false);
</script>
```

### 数据类型与连接校验

`dataType` 仿照 [ComfyUI 类型](https://docs.comfy.org/custom-nodes/backend/datatypes)，使用区分大小写的大写字符串：`STRING`、`INT`、`FLOAT`、`BOOLEAN`、`IMAGE`、`MASK`、`LATENT`、`AUDIO`、`VIDEO`、`MODEL`、`CLIP`、`VAE`、`CONDITIONING`，也支持自定义类型。`*` 为通配类型，`["INT", "FLOAT"]` 表示接受多种类型，单类型仍可写 `"IMAGE"`；兼容旧的逗号字符串写法；默认两端类型有交集即可连接。图片输出类型为 `IMAGE`，通用节点使用 `*`。这只是端口兼容性声明，不负责生成或转换数据。

只允许 `source` 连接 `target`，同类端口和缺失的端口或类型始终拒绝连接。节点通过 `nodeEvent.on("canConnect", callback)` 注册连接校验回调，使用 VueFlow 的 `ValidConnectionFunc` 签名：`(connection, context) => boolean`。`connection` 包含 `source`、`target`、`sourceHandle`、`targetHandle`；`context` 包含两端节点以及当前画布的节点、连线。无论从哪端开始拖线，字段始终按实际输入输出方向提供，且**只调用 target 节点的回调，source 不参与校验**。

附加接收规则在具体节点组件的 `setup` 中注册。下例限制每个输入端口最多接收两条连线；在回调内也可读取 `sourceNode.id`、`sourceNode.type`、`sourceNode.data` 和来源端口来限制来源。图片节点只有输出，不需要接收回调。

```vue
<template>
  <nodeSkeleton v-bind="nodeProps" />
</template>

<script setup lang="ts">
import { nodeSkeleton, useNode } from "@toonflow/nodes-scaffold/runtime";

defineOptions({ inheritAttrs: false });
const { nodeProps, nodeEvent } = useNode({
  handles: [
    { id: "in", type: "target", dataType: "*" },
    { id: "out", type: "source", dataType: "*" },
  ],
});

nodeEvent.on("canConnect", (connection, { edges }) => {
  // 类型兼容由骨架统一检查，本节点只限制每个输入端口的连接数量。
  return edges.filter(edge => edge.target === connection.target && edge.targetHandle === connection.targetHandle).length < 2;
});
</script>
```

公共校验先检查端口方向、存在性和类型兼容，通过后才调用 target 的附加回调。未注册回调时允许连接；已注册的回调必须全部同步、严格返回 `true`，返回其它值或抛出异常会拒绝连接，不支持异步校验。node 内无需重复调用 `isTypeCompatible`，也不能通过返回 `true` 绕过类型限制。回调会在拖动过程中重复执行，应保持无副作用。

骨架将端口定义放在 `node.data.handles`，事件按当前 VueFlow 实例和节点 ID 共享，支持独立 UMD 节点互相连接。所有端口使用共享校验入口，以保证从 source 起拖也能调用 target 的回调。`NodeData`、`NodeHandle`、`NodeDataType` 类型以及 `isTypeCompatible`、`validateConnection` 均从 `@toonflow/nodes-scaffold/runtime` 导出；手动调用 `addEdges` 时需要自行调用校验函数，不能绕过拖线流程后仍假定已完成校验。

## 节点删除

节点通过 `nodeEvent.on("delete", callback)` 注册删除处理，可以使用异步回调。骨架按注册顺序逐个等待，全部成功后才移除节点及连线；没有处理函数则直接移除，任一处理抛错则停止、提示并保留节点。删除按钮和右键菜单共用此入口，不要在组件卸载时清理文件，否则切换画布或刷新节点也会误删资源。

```ts
import { useNode } from "@toonflow/nodes-scaffold/runtime";

const { nodeEvent, files } = useNode();
nodeEvent.on("delete", async () => {
  await files.removeNodeFiles();
});
```

图片节点使用 `files.removeNodeFiles()` 清理工作区 `assets/<nodeId>/`，目录不存在视为已清理。上传期间拒绝删除，清理期间禁用上传。仅删除该节点自己的目录，不根据输出 URL 删除其它节点的文件。当前复制节点仍共享原图片路径，删除原节点的目录也会影响副本引用。

## 输出值与读取工具

输出由 `useNode` 返回的 `outputs` ref 维护，随 `nodeProps` 传给骨架。对象的 key 是 source handle ID，每个值固定为 `{ dataType, value }`，例如图片节点准备好资源后：

```ts
import { useNode } from "@toonflow/nodes-scaffold/runtime";

const { outputs } = useNode({
  handles: [{ id: "image", type: "source", dataType: "IMAGE" }],
});
// 在节点的实际加载或生成逻辑完成后赋值。
outputs.value.image = { dataType: "IMAGE", value: { url: "/files/example.png", mimeType: "image/png" } };
```

首批输出协议如下。媒体使用文件引用，不是 ComfyUI 后端的 Python 张量；不进行数据转换。

| dataType | value |
| --- | --- |
| STRING | string |
| INT | 安全整数 number |
| FLOAT | 有限 number |
| BOOLEAN | boolean |
| IMAGE / MASK | `{ url: string, mimeType: "image/…" }` |
| VIDEO | `{ url: string, mimeType: "video/…" }` |
| AUDIO | `{ url: string, mimeType: "audio/…" }` |

输出值必须使用具体类型，不能写 `*` 或类型数组；它们仅用于端口的兼容声明。`LATENT`、`MODEL` 等其它端口类型暂未定义传值协议，新增协议时同步扩展 `NodeValueMap` 与 `isNodeOutput`。图片节点未上传时输出为空，刷新时从画布保存的 `data.outputs` 恢复。

### 图片上传与工作区文件

图片节点通过上传按钮选择图片，文件保存到当前工作区的 `assets/<nodeId>/<随机文件名>.<扩展名>`（目录名为 `assets`）。替换图片使用新文件名，保留旧文件，避免影响复制节点的已有引用。图片输出为 `{ dataType: "IMAGE", value: { url: "assets/...", mimeType: "image/..." } }`；`url` 是工作区相对路径，不是可直接放入 `<img src>` 的地址。

在节点 `setup` 中取得 `useNode()` 返回的 `files`，无需自行注入或请求接口：

```ts
import { useNode } from "@toonflow/nodes-scaffold/runtime";

const { files } = useNode();
const path = await files.uploadFile(file); // 创建当前节点目录，使用唯一文件名写入
const workspaceFiles = files.getWorkspaceFiles();
const bytes = await workspaceFiles.read(path);
```

`getWorkspaceFiles()` 返回宿主的完整文件方法：`list`、`read`、`readText`、`readJson`、`write`、`writeJson`、`rename`、`remove`、`mkdir`。每次调用绑定当时的工作目录，多步操作复用同一个返回值；`uploadFile` 内部也只取得一次，避免上传中切换项目导致文件写到另一目录。文件类型和大小校验由具体节点负责。

画布通过 Vue `provide("workspaceFiles", factory)` 提供宿主文件能力，脚手架负责注入，不打包 Axios 或 Pinia。宿主通过可选的 `acquireUrl(path, mimeType)` 共享相同工作区文件的读取与 Blob URL，返回 `{ url: Promise<string>, release() }`；最后一个使用者释放后撤销 URL，文件写入、改名或删除后使缓存失效。画布 JSON 只持久化相对路径与 MIME 类型。

`files.useFileUrl(media, onError)` 在 `setup` 中接收 `{ url, mimeType }` 的 ref、computed 或 getter，返回可绑定到图片、音视频 `src` 的 URL ref。它在节点首次靠近视口后读取文件，忽略过期请求，并在替换或卸载时释放资源引用；旧宿主未提供 `acquireUrl` 时仍使用普通读取。错误交给 `onError` 处理。图片节点只需 `const previewUrl = files.useFileUrl(image, error => showError(error, "图片读取失败"))`。

在节点 `setup` 中使用工具集读取指定 target：

```ts
import { computed } from "vue";
import { useNode, useNodeInputs } from "@toonflow/nodes-scaffold/runtime";

const { id } = useNode();
const { getTargetSources, getTargetValues } = useNodeInputs();
const sources = computed(() => getTargetSources(id, "in"));
// 每项为 { node, handle }：上游节点对象、与该输入连接的 source 端口。
const inputValues = computed(() => getTargetValues(id, "in"));
// 也可传其它目标节点 ID：getTargetValues("otherNodeId", "imageInput")。
// 每项为 { source, sourceHandle, dataType, value }。
```

一个输入可连接多个 source，因此返回数组，按画布连线顺序排列。断开的、端口不存在的、类型不兼容的连接不返回结果；尚未输出的连接仍保留来源和端口声明的 `dataType`，`value` 为 `undefined`，参考列表显示类型图标。合法的 `0`、`false`、空字符串会保留。读取内容或发起生成前须检查 `value`，不能把空引用作为附件发送。输出结构或输出类型不符合 source 声明时抛出错误。放入 `computed` 后，连线、端口及输出值变化会自动更新读取结果。工具只读取当前值，不执行上游节点或请求媒体文件。

`getTargetSources` 按连线顺序返回该 target handle 的来源，不要求上游已有输出。缺失节点、端口、方向错误或端口类型不兼容的连接不会返回；同一上游不同端口分别保留。只查询连接时使用它，需要实际输出值时使用 `getTargetValues`。

纯函数 `getTargetSources(targetId, targetHandleId, nodes, edges)` 和 `getTargetValues(targetId, targetHandleId, nodes, edges)` 也从 `@toonflow/nodes-scaffold/runtime` 导出，可在已有画布数据的逻辑中直接使用。

### 节点事件

在节点组件的 `setup` 中取得 `useNode()` 返回的 `nodeEvent`，也可单独调用 `useNodeEvent()`；不传参数默认使用当前节点，`useNodeEvent(nodeId)` 则使用指定节点。统一通过 `nodeEvent.on(name, callback)` 注册，只有事件名和回调两个参数。`input:<handleId>` 监听 target handle 的上游输入，`output:<handleId>` 监听 source handle 的输出，同名的输入、输出端口分别监听；删除处理和连接校验使用前文的 `delete`、`canConnect` 事件。`useNodeInputs()` 保留即时读取工具，不负责事件注册。

`save` 回调应等待节点文件写入完成；抛错会阻止当前切换或刷新。普通保存不传参数，强制刷新时传入 `"reload"`，生成或导出尚未结束的节点可据此拒绝卸载，避免新实例读到未完成的内容。

```ts
import { useNode, useNodeEvent } from "@toonflow/nodes-scaffold/runtime";

const { nodeEvent } = useNode();
const stopInput = nodeEvent.on("input:in", values => {
  // values: NodeInputValue[]，每项包含 source、sourceHandle、dataType、value。
});
const stopOutput = nodeEvent.on("output:text", output => {
  // output: NodeOutput | undefined，包含 dataType、value。
});

useNodeEvent("otherNodeId").on("output:text", output => {
  // 监听其它节点的指定输出端口。
});
// 需要提前停止时调用 stopInput() / stopOutput()。
```

输入、输出监听注册后立即回调当前值；此后输入随连线、端口和上游输出变化而通知，输出随端口及输出值变化而通知，包含媒体对象内的 URL 等嵌套字段。输入无有效值时为 `[]`，输出不存在时为 `undefined`；删除节点、移除端口或清空输出也会通知，合法的 `0`、`false`、空字符串会保留。类型校验沿用读取工具，非法输出会抛错。

输入、输出监听使用共享 Vue 的深度 `watch`，同一轮同步修改按 Vue 调度合并，不执行上游节点；不要在回调里无条件修改正在监听的输出，以免循环触发。所有 `on` 注册均返回取消函数，在 `setup` 中同步注册会随组件作用域销毁自动清理，也可提前调用返回的函数取消。

## 构建和加载

在仓库根目录运行：

```powershell
bun install
bun run dev:plugins
bun run dev
```

只构建或监听一个节点：

```powershell
bun run --filter '@toonflow/node-image' build
bun run --filter '@toonflow/node-image' dev
```

节点监听命令与根目录 `bun run dev` 分别在两个终端运行；修改源码后刷新宿主页面。默认构建只输出到根目录 `build/nodes`；`dev:plugins` 设置 `NODE_ENV=dev`，节点监听或 Vite `--mode development` 也会同步当前节点到 `data/nodes`。同步先写临时文件，再替换正式文件，避免服务读取到未写完的脚本；同步失败会报告构建错误。

单包构建不清空这两个目录，避免删掉其它节点的产物。根目录 `bun run build:nodes` 先清空 `build/nodes` 再构建全部节点，不改动 `data/nodes`。已安装但不再需要的节点通过设置页卸载。

server 从 `data/nodes` 提供节点列表 `/api/nodes/get`，并通过 `/api/nodes/files?name=<节点名>` 提供脚本。首页自动读取列表，加载对应 `window.toonflowNodes[节点名]` 并注册到 VueFlow，右键菜单中可添加已加载的节点；无需配置 `VITE_NODES_URL` 或单独启动产物服务。

已安装列表支持启用、禁用和卸载。禁用状态存为 `data/nodes/<节点名>.disabled` 标记，开发同步不会重置；禁用包仍显示在已安装列表，后端停止提供它的脚本。卸载只删除 `data/nodes` 中对应的 UMD 和状态标记，保留源码及 `build/nodes` 产物；重新安装或开发同步会再次添加该节点。操作后画布添加菜单立即同步，当前画布已有实例和连线保留，刷新页面后仅加载已启用包。

## 新增节点

1. 参考 `packages/nodes/imageNode` 在 `packages/nodes/textNode` 创建源码与配置，按新节点需求编写内容，修改 `package.json` 的包名，例如 `@toonflow/node-text`，并把 `vite.config.ts` 的节点名改为 `textNode`。
2. 修改 `src/index.vue`，在这个子包的 `dependencies` 中声明自己使用的 UI 框架和第三方库。需要 Sass 或其它构建插件时，加入该子包的 `devDependencies`。
3. 根目录运行 `bun install` 和 `bun run dev:plugins`，得到 `build/nodes/textNode.umd.js` 并同步到 `data/nodes/textNode.umd.js`；启动 `bun run dev` 或刷新已打开的首页即可加载，浏览器导出为 `window.toonflowNodes.textNode`。仅生成发布产物使用 `bun run build:nodes`。

节点名必须唯一且使用小驼峰；显式指定名字可避免 Windows 工具链路径大小写变化影响导出名。各包的 Vite 配置只需：

```ts
import { createNodeConfig } from "@toonflow/nodes-scaffold";

export default createNodeConfig({
  name: "textNode",
  displayName: "文本节点",
  author: "", // 填写作者名称
  github: "", // 填写作者或项目的 https://github.com/... 地址
}, import.meta.url);
```

`name` 是节点的唯一标识，决定文件名和 VueFlow 注册名；`displayName` 是插件市场显示的名称。`author` 和 `github` 可以留空，市场只显示已填写的信息。

版本由每个节点子包的 `package.json.version` 维护，例如 `"version": "2.0.0"`，发布新版本时修改该字段，无需在 Vite 配置重复填写。构建要求版本为非空字符串，并监听 `package.json` 的变化。

构建会把三个展示字段、`version`、`readme` 和 `configRules` 写入 UMD 第一行的 `/*! toonflowNode:{JSON} */` 注释，无需额外清单文件。server 只解析这段 JSON，不执行节点代码，并通过 `/api/nodes/get` 返回元数据。设置中的已安装列表显示插件名称、版本和作者，名称末尾的小图标用于打开 GitHub；没有元数据的旧 UMD 继续显示节点标识，缺少版本时接口返回空字符串。修改配置或版本并开发同步后，重新打开市场即可刷新。

需要额外 alias、插件等配置时，在该节点的 `vite.config.ts` 中用 Vite 的 `mergeConfig` 合并。保持共享配置中的 UMD 格式、输出目录和 Vue/VueFlow/Element Plus external 设置。

### 节点插件配置

节点可在 `createNodeConfig` 中声明 `configRules`，类型直接使用 `@form-create/element-ui` 的 `Rule[]`，与工具共用同一套格式和前端 `<form-create>` 渲染。`type`、`field`、`title`、`value`、`props`、`options`、`validate` 等均遵循库的原生规则，不另定义表单格式。规则随插件元数据以 JSON 传输，最多 100 项，不能包含函数或其它非 JSON 值。未声明或为空时隐藏配置按钮；必填字段使用 `validate` 声明：

```ts
export default createNodeConfig({
  name: "exampleNode",
  displayName: "示例节点",
  author: "",
  github: "",
  configRules: [{
    type: "input",
    field: "apiKey",
    title: "API Key",
    props: { type: "password", showPassword: true },
    validate: [{ required: true, whitespace: true, message: "请填写 API Key" }],
  }],
}, import.meta.url);
```

用户在设置的插件市场中打开节点的“配置”表单并保存；缺少必填配置时，配置按钮显示小红点。配置按节点类型保存，同类型的所有节点实例共用，不写入 `node.data` 或画布 JSON。

```ts
const { config } = useNode();
// 在实际执行时读取，保留配置保存后的响应式更新。
const apiKey = computed(() => String(config.value.apiKey ?? ""));
```

`config` 是只读 computed，仅包含当前节点类型自己的配置，不提供全局 settings。宿主通过 Vue `provide("nodeConfig", (nodeType: string) => config)` 提供响应式读取能力；脚手架传入当前节点的完整类型（例如 `remote-exampleNode`）。用户保存后，已有节点会取得新配置；未保存的字段使用 `configRules` 中声明的 `value` 默认值，未提供宿主能力时返回 `{}`。

## 依赖和样式边界

- `vue` 和 `@vue-flow/core` 是节点的 peer dependency，UMD 直接使用宿主提供的 `window.toonflowNodeHost.vue`、`.vueFlow`；节点内不创建 Vue app，`useVueFlow()` 继承所在画布。
- `element-plus` 同样声明为 peer dependency，复用 `window.toonflowNodeHost.elementPlus`。组件从根入口按需导入，例如 `import { ElButton as elButton } from "element-plus"`；不要导入 `element-plus/es/...` 或其 CSS。宿主统一加载 Element Plus 组件与样式，节点产物不重复打包。
- 文本 AI 使用的 Pi SDK 同样通过现有 external 机制复用 `window.toonflowNodeHost.ai`，包含 `runAgentLoop` 和 `createAssistantMessageEventStream`；不在各节点 UMD 中重复打包，不新增运行时或服务。节点 UMD、宿主与后端需要使用配套版本。
- 第三方库直接引用 `@vue/runtime-core` 或 `@vue/runtime-dom` 时，也使用宿主的 Vue 导出。各节点的 Vue/VueFlow 版本必须与宿主兼容；不要引入自行内嵌 Vue 的库或直接导入 Vue 的 `dist` 产物。
- 其它依赖随各节点独立打包；不同节点可以使用不同 UI 框架和第三方库版本，同一个库也可能重复出现在不同 UMD 中。
- 其它 UI 库的组件优先局部 import，所需 CSS 也在节点源码中 import。Vite 的 UMD 模式配合 `cssCodeSplit: true` 将 CSS 注入同一个 JS。需要 provider 的组件库，在节点根组件内包裹它自己的 provider。
- 独立子包提供依赖管理边界，不提供页面样式隔离；全局 CSS、reset 或依赖 `app.use()` 全局安装的库需要单独适配。节点自有样式优先使用 `<style scoped>`。
