# 工具插件

`packages/toolScaffold` 提供构建入口、共享类型与浏览器加载器，`packages/tools/<name>` 保存各工具包。服务端逻辑与可选的 Vue 组件统一打包为一个 `.tool.js`，安装、升级和卸载均处理这个文件。

每个工具包包含：

- `build.ts`：调用 `createToolConfig(metadata, import.meta.url)`，声明名称、说明、工具包提示词 `prompt` 与 form-create 的纯 JSON 配置规则。
- 可选的 `readme.md`：构建时自动读取并嵌入首行元数据的 `readme`，无需在 `build.ts` 配置；缺失时为空字符串，最多 200000 个字符。
- `src/index.ts`：默认导出 `ToolPlugin`，实现 `validateConfig` 与 `createTools`。
- 可选的 Vue 组件：通过 `components: { askUser: "src/questionCard.vue" }` 声明工具名到组件入口的映射；一个工具包可提供多个组件。
- `package.json` 与 `tsconfig.json`：声明自身依赖及构建、类型检查命令。构建器自动读取工具子包的 `package.json.version` 并嵌入元数据，版本必须是非空字符串（最多 100 个字符），不在 `build.ts` 重复配置；发布更新时修改此版本。

在工具包目录执行 `bun run build`，只输出 `build/tools/<name>.tool.js`。开发时在根目录执行 `bun run dev:plugins`，或以 `NODE_ENV=dev` 构建工具，才复制同步到 `data/tools/`。Pi 工具构造函数由宿主的 `context.sdk` 注入；`zod` 由 Server 共享，其余运行依赖随插件打包。单包构建保留其他工具的已有产物。

`import { z } from "zod"` 无需修改：构建时将 `zod` 转为外部模块 `toonflow:tool-zod`，Server 在加载工具前通过 Bun 虚拟模块提供完整的 Zod 4 导出。仅共享精确的 `zod` 导入，子路径仍随工具打包。发布这些新产物时须同步更新 Server；旧版自带 Zod 的工具仍可加载。

在仓库根目录运行 `bun run build:tools` 会清空 `build/tools` 后构建全部工具，不改动 `data/tools`；`dev:desktop` 会先执行 `dev:plugins` 同步开发产物。在“设置 → 工具”中安装 `.tool.js`、启停、卸载或编辑配置；配置写入 `data/settings.json` 的 `toolConfigs`，下一次发送消息时生效。桌面构建会携带默认工具，首次启动初始化后，用户卸载的工具不会因普通重启而自动恢复。

文件首行 `/*! toonflowTool:<JSON> */` 包含 `ToolMetadata`，其中 `version` 为工具版本，随单个 `.tool.js` 文件安装和分享。服务端可以读取这段数据而不执行插件；旧工具没有版本时仍可加载，列表返回空字符串表示未知版本，不推断或补造版本号。

`configRules` 直接使用 `@form-create/element-ui` 的 `Rule[]`，与节点配置使用相同格式；`type`、`field`、`title`、`value`、`props`、`options`、`validate` 等遵循库的原生规则。`field` 对应配置属性，`value` 为默认值。规则以 JSON 写入元数据，最多 100 项，不能包含函数或其它非 JSON 值。前端共用配置弹窗，通过 `<form-create>` 渲染，并使用 `copyRules` 隔离表单修改。插件必须在 `validateConfig` 中校验配置，不能仅依赖前端表单限制。

配置 `components` 时，构建器使用 Vite 编译 Vue 组件，第二行 `/*! toonflowToolClient:<JSON> */` 保存独立 UMD 代码及 CSS，元数据只保存组件对应的工具名称。组件必须显式导入所用 UI 组件与样式，不依赖 web 自动导入；Vue、Element Plus、Axios 和 form-create 复用 `toonflowToolHost` 的宿主实例。其余客户端依赖随组件打包，不生成安装包外的资源文件。

`/api/tools/renderers` 仅列出已启用的组件映射及内容版本地址，`/api/tools/client` 只下发对应浏览器代码与样式，不执行或暴露服务端入口、配置和密钥。web 使用 `@toonflow/tools-scaffold/client` 的 `loadToolComponent(tool.name)`，统一向组件传入 `{ tool: ToolCall, directory?: string }`；无组件时展示普通工具消息，加载失败时提示用户停止后重试。历史消息可能只有 `args/result`，组件不能假定一定存在实时交互信息。`askUser` 的回答、跳过和历史展示均由包内 `src/questionCard.vue` 维护，web 不导入该组件。

`createTools(context)` 返回 Pi 的工具定义数组，一个插件可提供多个工具。宿主传入当前工作区 `cwd`、仅属于该工具且已校验的配置 `config`、安全路径解析 `resolvePath`、带锁的原子写入 `writeFile`，以及 Pi SDK 工具构造函数。不传入应用全局设置或其他工具的配置；工具需要的密钥通过自身配置项填写。工作区文件插件通过宿主方法限制路径；只读模式只注册 `read` 与 `ls`。

`context.skills` 提供统一的技能扫描、读取、新建和修改，复用宿主的 SDK 扫描与文件落盘。`skillOperator` 据此操作工作区 `skill/` 和全局 `data/skills/`，无需把 Pi SDK 打入工具。读取、新建、修改默认开启，可在工具配置中分别关闭；目录查询始终保留，普通工作区文件的写入范围不因此扩大。

`context.ffmpeg.convert(bytes, options, signal?)` 复用宿主 FFmpeg，不随工具打包 FFmpeg 或调用库；全局工具和团队私有工具均可使用。`FfmpegContext`、`FfmpegConvertOptions` 从 `@toonflow/tools-scaffold/runtime` 导出，选项与供应商保持一致。仅接收、返回内存字节，支持已有的格式转换、裁剪、缩放、`hflip`/`vflip` 翻转及音频参数，不接受路径、URL 或任意命令参数。输入和输出各限 100 MB，处理最长 5 分钟，传入当前工具调用的 `signal` 可取消处理；需要 seek 的输入仍受管道读取限制。

```ts
const { data, mimeType } = await context.ffmpeg.convert(bytes, {
  format: "png",
  vf: "hflip",
}, signal);
```

接口始终注入，调用时才检查 FFmpeg。未安装时沿用宿主的下载询问通知并抛出 `FfmpegRequiredError`，工具应继续向上抛出，不自动重试；安装后由用户重新发起操作。文件读取、落盘继续使用工作区能力，并通过 `context.resolvePath` 校验路径。

工具包的静态提示词在 `build.ts` 的 `createToolConfig({ ..., prompt: "工具操作规则", configRules: [...] }, import.meta.url)` 中声明。`prompt` 为可选字符串，最多 20000 个字符，支持多行文本；随元数据打包，旧插件未声明时按空字符串处理。

`src/index.ts` 返回的工具定义保留 `promptSnippet` 简短用途说明；`promptGuidelines` 用于根据 `context.config` 和运行上下文生成的动态规则，例如只读模式、当前画布 ID。扩展 SDK 工具时追加原有 `promptGuidelines`，不要覆盖其规则。

宿主把包级 `prompt` 与运行时 `promptGuidelines` 合并，Agent 仅汇总本轮实际加载工具的摘要与规则，并对相同文本去重；一个工具包提供多个工具时，包级提示词只出现一次。工具被禁用或因缺少上下文返回空数组时，其规则不会进入系统提示词。新增工具不需要修改 `apps/server/src/agent/runtime/prompt.ts`。

现有插件：

- `skillOperator`：通过 `action: list/read/create/update` 聚合技能目录与读写，支持按 `name`、`scope`、技能相对 `path` 操作正文及资料。默认同名工作区技能优先；新建默认工作区，`SKILL.md` 校验名称和描述，新建不覆盖、修改只针对已有文件。启用后由此工具按需查询目录，保留 `/skill:名称` 调用。
- `askUser`：提问器，通过 `context.question.ask` 一次发送一个或多个问题，等待用户回答或明确跳过后继续执行。简单提问传 `{ title, question, options? }`，返回 `{ answer }`；多个问题传 `{ title, question, fields }`，前端使用 `@form-create/element-ui` 渲染，返回 `{ answer, values }`。`fields` 最多 12 项，每项一个问题，包含唯一 `field`、`title`、`type`，默认可留空，可设置 `required`、`placeholder`；支持 `input`、`textarea`、`radio`、`checkbox`、`select`、`inputNumber`、`switch`，选择类字段必须提供 `options`。动态表单与顶层 `options` 不同时使用。点击“跳过”返回 `{ answer: "用户跳过了本次提问", skipped: true }`，不要求填写必填项，也不停止 Agent；停止或断开对话仍会取消等待。问题、回答和跳过结果沿用 Pi 工具调用历史保存。
- `canvas`：画布操作工具，通过可选的 `context.canvas` 控制本轮绑定的激活画布，提供 `getCanvas`、`addNode`、`deleteNodes`、`moveNodes`、`renameNodes`、`connectNodes`、`deleteEdges`、`selectNodes`、`fitCanvas`，以及节点注册函数的统一入口 `nodeTools`；`deleteNodes`/`moveNodes`/`renameNodes`/`connectNodes`/`deleteEdges` 均一次接受多个目标进行批量操作。参数规则由 `@toonflow/tool-canvas/runtime` 的 Zod schema 共享。没有激活画布时不提供这些工具；空画布仍可新增节点，再调用新节点的函数。执行走 Agent 流与回传接口，操作由当前 Vue Flow 实例完成并复用画布保存逻辑，不通过直接编辑 JSON 控制画布。
- `workspace`：工作区读取、写入、编辑和目录列表，可开启只读模式。
- `webSearch`：默认使用免密钥的 DuckDuckGo，可配置切换 DeepSeek 或 Tavily 并填写对应密钥；支持设置结果数量和超时。
- `webFetch`：使用 Bun 原生 fetch 读取网页，可设置超时与正文长度；最多 5 次重定向和 2 MiB 响应正文，不预判 DNS 公网地址，兼容 Fake-IP，网络隔离由部署环境负责。

工具插件是可信的服务端代码，导入后拥有服务器进程权限，**不是沙箱**。`context.resolvePath` 等方法限制现有工作区工具的行为，不能阻止第三方插件自行调用系统 API。仅安装可信来源的工具文件。
