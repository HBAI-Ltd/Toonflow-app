# 文档扩展脚手架

文档页使用 Dockview 管理标签、分屏与关闭流程。`packages/ext/*` 中每个工作区子包提供一种文件编辑器、预览器或画布节点展示器。扩展只接收宿主提供的 `context`，不导入 `apps/web/src`。

## 创建扩展

在仓库根目录执行：

```sh
bun packages/extScaffold/create.ts myEditor
bun install
bun run --cwd packages/ext/myEditor typecheck
bun run --cwd packages/ext/myEditor build
```

参数是小驼峰名称，不带 `ext-`；例如 `myEditor` 生成 ID `ext-myEditor` 和包名 `@toonflow/ext-myeditor`。已有同名目录时拒绝创建。命令只创建目录和文件，不隐式安装依赖、构建或修改宿主配置。

写入中途失败时保留已创建文件，修复原因后可补齐或手动清理；脚手架不会递归删除目录回滚。

```text
packages/ext/myEditor/
  package.json
  tsconfig.json
  viteConfig.ts
  readme.md
  src/
    metadata.ts
    index.ts
    index.vue
```

生成的组件可直接编辑文本，并演示由扩展自己声明的图标和字号设置。修改 `src/metadata.ts` 的扩展显示名、图标、文件后缀与配置规则，再实现 `src/index.vue` 的内容。

## 扩展声明

```ts
// src/metadata.ts
import type { ExtDefinition } from "@toonflow/ext-scaffold/runtime";

export default {
  id: "ext-myEditor",
  displayName: "我的编辑器",
  extensions: ["txt"],
  resourceKind: "file",
  text: true,
  configRules: [{ type: "inputNumber", field: "fontSize", title: "字号", value: 14, props: { min: 10, max: 32 } }],
} satisfies Omit<ExtDefinition, "load">;
```

入口 `src/index.ts` 将声明与组件加载函数组合：

```ts
import { defineExt } from "@toonflow/ext-scaffold/runtime";
import metadata from "./metadata";

export default defineExt({ ...metadata, load: () => import("./index.vue") });
```

`id` 在所有扩展中唯一，格式为 `ext-` 加小驼峰名称，例如 `ext-image`、`ext-canvasNode`；目录与变量仍使用小驼峰。后缀不带点，使用小写字母或数字。`resourceKind` 为 `file` 或 `canvasNode`，画布节点扩展允许空后缀数组。文本编辑器设置 `text: true`，宿主才会预载文本并开放文档读写能力；图片等二进制预览省略此标记。

可选 `icon` 是图片 URL，允许 `http:`、`https:`，或 SVG、PNG、JPEG、WebP、GIF、AVIF 的 `data:image` URL。图标随扩展产物声明，宿主只按图片展示；未声明时使用通用文件图标。内置扩展和生成模板使用内嵌 SVG，无需额外图片请求。

可选 `configRules` 复用插件市场现有的 form-create `Rule[]`，每条 `rule.value` 提供默认值，不另建设置 schema。规则必须可序列化为 JSON，最多 100 项；不能包含函数。未声明或空数组时不显示该扩展的设置入口。

布局 `children` 和条件 `control[].rule` 中的字段同样保存。隐藏且未提交的条件字段不触发服务端必填校验。

宿主从 `data/ext/` 枚举已安装且启用的扩展，按需加载 UMD 产物和 `load()` 返回的组件，无需修改 web 工作区依赖或静态注册表。同一后缀有多个可用扩展时，宿主弹出“打开方式”选择，可设置默认关联；文件树右键“打开方式”可以重新选择。脚手架不会自动覆盖原有文件关联。

## 组件上下文

```ts
import type { ExtContext } from "@toonflow/ext-scaffold/runtime";

const props = defineProps<{ context: ExtContext }>();
```

| 字段 | 用途 |
| --- | --- |
| `resource` | 资源身份，包括工作区目录、相对路径、标签名；画布节点另含 `nodeId`。 |
| `files` | 固定到资源工作区的文件能力，包含 `read`、`readText`、`readJson`、`write`、`writeJson`、`list`、`rename`、`copy`、`reveal`、`remove`、`mkdir`、`acquireUrl`。 |
| `text`、`loading`、`error`、`dirty` | 宿主管理的文本与加载、保存状态。通过 `updateText()` 提交编辑；不要直接修改宿主状态，`loading` 同时表示文件操作期间暂停编辑。 |
| `active` | 文档页是否激活；画布节点据此挂载或释放展示，媒体组件可据此暂停。 |
| `config` | 当前扩展配置，包含规则默认值和已保存值；宿主在市场设置更新后同步。不要直接修改以代替保存。 |
| `saveConfig(config)` | 保存当前扩展声明的配置并更新宿主状态，失败抛出异常。市场设置使用同一持久化入口。 |
| `updateText(text)` | 更新当前标签文本，由宿主管理保存队列，不另起一份自动保存。 |
| `flushSave()` | 等待当前标签的修改保存完成，失败抛出异常。 |
| `writeClipboardText(text)` | 通过宿主的桌面或浏览器剪贴板能力复制文本。 |
| `openFile(path)` | 打开同一工作区的相对路径，由宿主管理文件关联、节点映射和标签去重。 |
| `location` | 可选的当前视图定位请求，包含从 1 开始的 `line`、`column`、待选中 `query` 和变化标记 `revision`。扩展监听后定位自身编辑器；不参与正文保存。 |
| `mountNode(element)` | 仅画布节点提供。将原节点界面展示到元素，返回释放展示的方法；卸载时须调用。 |

文本保存支持 UTF-8（有或无 BOM）和带 BOM 的 UTF-16 LE/BE，并保留原编码。不支持的编码会拒绝打开，不修改原文件。宿主保存前核对读取时的文件版本；发现外部修改时停止覆盖，保留当前编辑内容，供用户选择载入磁盘版本或另存副本。扩展应通过 `context.updateText(text)` 编辑当前文档，不要调用 `context.files.write()` 绕过宿主的编码、保存队列和冲突保护。

同一文件可以在多个分屏视图展示，正文与保存状态共用一个会话。组件应监听 `context.text` 接收另一视图的修改，光标、查找与编辑模式保留在各自组件中。关闭一个视图不会取消其他视图的保存；画布节点保留唯一运行实例，分屏仅移动其视图。

二进制预览通过 `context.files.acquireUrl(path)` 取得 `{ url: Promise<string>, release() }`。无论加载完成与否，资源切换或组件卸载时都要调用 `release()`。不要自行撤销共享 URL。文件操作失败须交给界面呈现，路径必须为当前工作区内的相对路径。

`files.copy(path, target)` 只在此工作区内复制，目标已存在时拒绝覆盖；目录复制禁止符号链接，失败可能保留部分目标内容，错误数据中的 `partial` 与 `target` 会说明。`files.reveal(path)` 只支持桌面客户端或本机 Windows/macOS 开发页面，远程访问会被拒绝。

## 共享 Markdown 编辑依赖

Tiptap、marked 和 DOMPurify 通过构建配置的 external 复用宿主依赖。编辑器、预览组件、工具栏和生命周期由各扩展或节点在自己的包内实现，不导入宿主组件，也没有组件转发层。子包使用这些依赖时声明与宿主兼容的 peerDependencies：当前 Tiptap 各包为 `3.31.3`，`marked` 为 `18.0.13`，`dompurify` 为 `3.4.16`。

直接使用依赖原有 API：

```ts
import { Editor } from "@tiptap/core";
import { StarterKit } from "@tiptap/starter-kit";
import { Markdown } from "@tiptap/markdown";

const editor = new Editor({
  extensions: [StarterKit, Markdown],
  content: "# 标题",
  contentType: "markdown",
});
```

共享模块包括 `@tiptap/core`、`@tiptap/vue-3`、`@tiptap/starter-kit`、`@tiptap/markdown`，以及 `extension-find-and-replace`、`extension-highlight`、`extension-image`、`extension-list`、`extension-subscript`、`extension-superscript`、`extension-table`、`extension-text-align`（均为 `@tiptap/` 前缀）；还包括 `@tiptap/pm/model`、`@tiptap/pm/state`、`@tiptap/pm/view`、`marked` 和 `dompurify`。构建产物引用 `window.toonflowTiptapHost` 中对应的依赖，不重复打包这些实现。

Tiptap 统一使用具名导入，例如 `{ StarterKit }`、`{ Image }`、`{ Highlight }`、`{ Superscript }`、`{ Subscript }`、`{ TextAlign }`、`{ FindAndReplace }`。当前 Vite 8 UMD 的默认导入会取整个外部模块对象，不能用于这些共享模块；DOMPurify 单独共享默认函数，继续使用 `import DOMPurify from "dompurify"`。无需启用影响所有依赖的旧版 CJS 兼容开关。

宿主先检查 UMD 是否引用 `toonflowTiptapHost`，仅在需要时动态加载共享依赖，后续复用同一个 ES 模块；普通图片、视频或纯文本插件不会因此预载 Tiptap。组件的挂载、销毁、隐藏状态、正文更新和文件保存仍由各包管理。使用共享依赖的产物需要配套宿主版本。

## 独立构建与开发

`viteConfig.ts` 使用共享配置：

```ts
import { createExtConfig } from "@toonflow/ext-scaffold";
import metadata from "./src/metadata.ts";

export default createExtConfig(metadata, import.meta.url);
```

声明文件不导入组件，避免配置打包器提前解析 Vue 文件。每次重建重新读取声明及其依赖，后缀、图标与设置变更会同步进入 UMD 元数据；修改扩展 ID 后须重启构建。

产物为 `build/ext/<name>.ext.js`，例如 ID `ext-image` 对应 `build/ext/image.ext.js`。文件名去掉 ID 的 `ext-` 前缀，使用小驼峰；包内保留原 ID，已有配置和市场身份不变。产物包含 `toonflowExt` JSON 元数据注释、版本、说明文档和自动注入的组件样式。产物仍使用 UMD 模块格式，导出 `window.toonflowExts[id]`，结构为 `ExtDefinition`；`.ext.js` 是扩展插件的文件类型标识。Vue、Element Plus 与 Toonflow 语言状态由宿主共享：

```ts
import * as vue from "vue";
import * as elementPlus from "element-plus";
import * as i18n from "@toonflow/i18n/vue";

Object.assign(window, { toonflowExtHost: { vue, elementPlus, i18n } });
```

运行时使用 `@toonflow/ext-scaffold/runtime`；构建配置使用 `@toonflow/ext-scaffold`，避免把 Vite 与文件系统代码打包到浏览器。Element Plus 的基础样式由宿主加载，扩展自身的组件样式会打入产物。

安装、导出与新构建统一使用 `.ext.js`。已有 `ext-<name>.umd.js` 保持兼容，新旧文件并存时优先加载 `.ext.js`，只展示一个扩展；读取和启动不会删除旧文件。安装前同时检查元数据 ID、脚本语法与实际导出，不要求无宿主依赖的扩展引用 `toonflowExtHost`，也不使用字符串中的示例判断脚本类型。

`bun run --cwd packages/ext/myEditor dev` 持续构建，并把产物原子替换到 `data/ext/`，供本机插件市场与文档宿主读取。`NODE_ENV=dev` 或 `--mode development` 的单次构建同样同步；生产构建只输出 `build/ext/`。

市场元数据包含 `id`、`displayName`、可选 `icon`、`configRules`、`extensions`、`resourceKind`、可选 `text`、`version` 和 `readme`。`load` 留在运行时导出，不写入 JSON 元数据。插件市场负责安装、更新与启停，脚手架负责声明、生成和独立构建。

## HTTP 与 WebSocket 服务

每个扩展视图通过 `context.server` 获得独立的通用服务对象。扩展在初始化时用 `get/post/put/patch/delete/head/options` 注册 HTTP 路由，用 `ws(path, handler)` 注册 WebSocket；调用 `await context.server.start()` 才启动并返回访问地址，无需声明页面或静态文件清单。

HTTP 回调接收 `{ request, params, query, signal }`，由扩展处理路径与业务参数。普通对象自动返回 JSON，字符串返回纯文本，`context.server.html(content)` 返回 HTML，也可返回原生 `Response`。WebSocket 提供 `send`、`onMessage`、`onClose` 和 `close` 的桥接 socket。`url`、`status`、`error` 为只读响应式状态；`stop()` 停止服务后可再次启动。

同一文档的分屏视图共享正文与保存状态，各自拥有独立服务；相同路由通过不同服务 ID 隔离。关闭视图或退出工作区时自动销毁所属服务，不影响其他视图；扩展停用时停止服务。处理函数运行在扩展的前端实例中，创作页面关闭后不再处理请求。断线不会重放旧请求，重新启动取得新的服务地址。

访问端可从 `@toonflow/ext-scaffold/serverClient` 导入 `createServerClient(serviceUrl)`，使用当前服务内的相对路径访问 HTTP／WS，避免请求落到主应用或其他插件。共享通道协议、限制与客户端方法详见 `packages/pluginServer/readme.md`。此能力只接入 Node 与 Ext，不扩展 Tool 的执行上下文。
