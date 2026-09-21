本规范适用于整个仓库。

# 开发规范说明

## 代码风格要求

1. 优先使用简洁直接的实现方案：减少嵌套层级、删除冗余分支、避免不必要的抽象，保证代码可读性优先。
2. 函数保持小而聚焦，仅当复用价值或可读性有明确提升时才做逻辑抽取。
3. 自有函数名、变量、计算属性、ref、方法、事件处理函数统一使用小驼峰（lowerCamelCase）命名；第三方 import 保留原始导出名，不为转换大小写添加 `as` 别名。
4. 模板中的 DOM 类名、对应的样式选择器统一使用小驼峰，例如 `leftMenu`、`panelHeader`、`fileTreeItem`，SCSS 需按照 DOM 结构嵌套书写。
5. 不使用全大写常量，优先使用语义化小驼峰命名，例如 `editorConfig`、`requestTimeout`、`panelWidth`。
6. 新增逻辑前优先复用已有的工具函数和 Store 方法，避免新增不必要的工具层。
7. 所有新建文件、文件夹名称必须统一使用小驼峰**，无任何例外，例如 `userStore.ts`、`fileTree.ts`、`apiHelper.ts`、`editorPanel/`、`contextMenu/`。
8. **禁止使用短横线命名、蛇形命名、帕斯卡命名或全大写格式作为文件/文件夹名**，项目中已存在的例外情况不作为新开发的参考依据。
9. **组件文件名同样严格遵循小驼峰规则**，例如 `tabHeader.ts`、`splitPane.ts`、`loginForm.ts`，禁止使用 `TabHeader.ts` 或 `tab-header.ts` 这类格式。
10. **自有组件（项目内自己编写的组件）的文件名、本地绑定名和模板标签必须使用小驼峰**，例如 `showBox.vue`、`import showBox from "./showBox.vue"`、`<showBox />`，不得使用 `<show-box />`。
11. **第三方 UI/组件库的模板标签允许使用短横线分隔（kebab-case）或小驼峰，优先统一使用短横线分隔**，例如 `<el-button />`、`<vue-flow />`、`<icon-map />`；此规则不放宽自有文件、变量或 DOM 类名的小驼峰要求。
12. **所有组件模板标签及自有组件本地绑定名绝对禁止大驼峰（PascalCase）**，例如禁止 `<ShowBox />`、`<ElButton />`、`<VueFlow />`。第三方组件直接按库原始导出名导入，例如 `import { ElButton } from "element-plus"`、`import { VueFlow } from "@vue-flow/core"`，模板分别使用 `<el-button />`、`<vue-flow />`；脚本及模板表达式直接使用原始导出名，不添加仅用于转小驼峰的 `as` 别名。类型名、库导出名及工具自动生成的声明不属于模板标签，不手工改写自动生成文件。
13. **所有 `.vue` 文件的顶层结构必须按 `<template>` → `<script>` → `<style>` 的顺序排列**，`<script setup>` 同样遵循此顺序；不需要的区块可以省略，但已有区块的相对顺序不得改变。
14. **所有组件的属性名必须统一使用小驼峰，包括自有组件、第三方组件的 props 声明、静态属性和动态绑定**，例如 `showArrow`、`:nodeTypes`、`:snapToGrid`，禁止写成 `show-arrow`、`:node-types`、`:snap-to-grid`。具名 `v-model` 的参数同样使用小驼峰，例如 `v-model:snapEnabled`。组件标签允许短横线的规则不适用于属性名。
15. **仅 Vue 语法、HTML 标准或第三方接口强制要求的名称保留原始写法**，例如 `v-if`、`v-for`、`v-model`、`v-bind`、`v-on`、`aria-label`、`data-*`；不得将这些名称改为小驼峰。第三方文档中的短横线示例不构成例外，支持小驼峰的组件属性仍必须使用小驼峰。

## 前端工作区文件操作

- `apps/web/src/lib/workspaceFiles.ts` 默认导出 `useWorkspaceFiles`。组件与前端工具统一复用此入口，不重复封装 Axios 或直接拼接 `/api/workspaces/files/*` 请求。
- 方法中的 `path`、`target` 均为工作区内的相对路径，例如 `画布1.json`、`assets/image.png`；目录参数使用绝对路径。
- 不传目录时，使用 Pinia 中当前项目的工作目录，每次操作重新读取；在 Pinia 初始化后的组件 `setup` 中创建实例。未选择工作目录时操作报错。

```ts
import useWorkspaceFiles from "@/lib/workspaceFiles";

const files = useWorkspaceFiles();
const { directory, entries } = await files.list();
const content = await files.readText("说明.txt");
await files.write("说明.txt", content);
```

### 目录绑定

- `useWorkspaceFiles(directory)`：传入目录字符串，固定该实例的目标目录；普通 TypeScript 工具函数可直接使用，不依赖当前 Pinia 实例。
- `useWorkspaceFiles(directoryRef)` 或 `useWorkspaceFiles(() => props.directory)`：传入 ref 或 getter，每次操作读取最新值；显式目录为空时直接报错，不回退到当前项目。
- 新建项目尚未更新 Pinia 时，显式传入用户选择的目录；`list()` 返回服务端规范化后的 `directory`，后续创建与失败回滚使用同一规范目录。
- 防抖、保存队列、跨 `await` 的多步操作必须在操作开始时取得目录字符串快照，后续步骤复用固定目录实例，避免切换项目后读写到另一个目录。自动保存与防抖仍由所属页面管理，文件封装不自动监听或保存数据。

```ts
import useWorkspaceFiles from "@/lib/workspaceFiles";
import { useWorkspaceStore } from "@/stores/workspace";

const workspaceStore = useWorkspaceStore();

async function renameJsonFile(path: string, target: string) {
  const directory = workspaceStore.project?.directory;
  if (!directory) throw new Error("请先选择工作目录");
  const files = useWorkspaceFiles(directory);
  await files.rename(path, target);
  return files.readJson(target);
}
```

### 方法与返回值

所有文件操作均返回 Promise；写入、改名、删除、建目录成功时无返回内容。

| 方法 | 用法与返回值 |
| --- | --- |
| `list(path = "")` | 列出一层目录，返回 `{ directory, entries }`；每项包含 `name`、相对 `path`、`type`（`file` 或 `directory`）。 |
| `read(path)` | 读取二进制，返回 `ArrayBuffer`。 |
| `readText(path, maxBytes?)` | 读取文本，返回字符串；传入正整数 `maxBytes` 时通过 HTTP Range 只读取文件头指定字节数。 |
| `readJson<T = unknown>(path)` | 读取并解析 JSON，返回 `T`；泛型仅提供类型提示，不校验文件结构。 |
| `write(path, content, exclusive = false)` | 写入字符串、`Blob` 或 `ArrayBuffer`；默认创建或覆盖整个文件，第三个参数传 `true` 时只允许新建。 |
| `writeJson(path, data, exclusive = false)` | 将数据格式化为 JSON 后写入；第三个参数传 `true` 时只允许新建。 |
| `rename(path, target)` | 在工作区内改名或移动文件、目录；目标已存在时不覆盖。 |
| `remove(path, recursive = false)` | 删除文件或空目录；显式传 `true` 才递归删除目录内容。 |
| `mkdir(path)` | 创建目录；父目录须存在，不自动递归创建。 |

- 文件的标记字段和业务结构由调用方负责，例如画布的 `toonflowCanvas`、对话的 `toonflowAgent`；不能因调用了 `readJson<T>` 就假定结构有效。
- 所有请求错误原样抛给调用方处理，JSON 解析失败抛出 `SyntaxError`；不要吞掉写入失败或无条件重试。新增文件的自动编号只处理服务端明确返回的同名冲突。
- 此封装只负责工作区文件；全局设置继续使用设置接口，项目列表继续由 Pinia 持久化，移除列表项不等于删除工作区文件。

## Server 开发规范

以下规则适用于 `apps/server`，与上面的通用代码规范同时遵守。

### 技术栈与职责

- 使用 Bun、TypeScript、ES Modules 和 Express，沿用现有依赖与工具，不另建服务框架。
- `src/index.ts` 是独立 server 的启动入口，单进程监听端口。
- `src/app.ts` 的 `createApp({ webRoot, dataDirectory?, ... })` 负责创建应用、装配中间件、静态资源、路由和统一错误处理，返回应用；传入的数据目录须在动态加载路由前设置。不要在这里启动监听或创建 worker。
- 桌面端通过 `@toonflow/server/app` 复用应用，不导入独立 server 的启动入口，不额外启动 cluster。

### 目录结构

```text
apps/server/
  package.json
  tsconfig.json
  src/
    index.ts                 # 独立服务启动
    app.ts                   # Express 应用装配
    core.ts                  # 根据文件目录生成路由
    router.ts                # 自动生成的路由注册文件
    utils.ts                 # 通用工具统一出口，默认导出对象
    utils/
      conf/index.ts          # conf 实例与配置
      mcp/                   # MCP 控制、工具和资源
    lib/
      middleware.ts          # 参数校验等 HTTP 中间件
      responseFormat.ts      # 统一响应格式
    routes/
      hello.ts               # 单个接口
      settings/              # 按业务分类
        get.ts               # 读取设置接口
        save.ts              # 保存设置接口
```

- 文件、目录、变量和函数统一小驼峰命名。业务按文件夹分层，层级已有语义时，文件名不重复堆叠业务名称，例如 `settings/get.ts`。
- **一个接口一个文件。** 每个路由文件只注册一个 HTTP 方法与路径，默认导出对应 Express Router；读取、保存等接口必须拆开。
- `routes/` 下的 `.ts` 文件都会被当作路由模块扫描，不能把工具、类型、配置或单纯的目录聚合文件放进去。
- 工具实现按业务模块放到 `utils/*/`，例如 `utils/mcp/control.ts`；文件名不重复模块前缀，通过 `utils.ts` 暴露。HTTP 中间件及响应格式放 `lib/`。不为简单接口额外搭建 controller、service、repository 等层。

### 路由与路径规则

- `core.ts` 扫描 `src/routes/**/*.ts`，根据文件相对路径生成 `/api` 前缀的路由；接口文件内使用 `"/"`，不要重复填写 `/api` 或业务目录。
- URL 使用 `/` 分隔，路径大小写与目录、文件名一致。`index.ts` 对应所在目录本身，不产生 `/index`。
- 当前设置接口映射如下，HTTP 方法由接口文件注册语句决定，文件名不会自动决定方法：

| 文件 | HTTP 方法 | 请求路径 |
| --- | --- | --- |
| `src/routes/settings/get.ts` | `GET` | `/api/settings/get` |
| `src/routes/settings/save.ts` | `PUT` | `/api/settings/save` |

- **不要手工维护 `src/router.ts` 的 imports、注册项或 hash。** 新增、移动、重命名或删除接口文件后，在 `apps/server` 执行 `bun run routes`。
- 自动生成的 `route1` 等名称由生成器维护，不手工重命名。`createApp` 仅在 `NODE_ENV === "dev"` 时自动生成路由，不假定启动、监听文件变化或构建会自动补齐路由。
- 改动路径或 HTTP 方法前搜索所有调用方，同步更新调用；文件归档不应意外改变配置文件、静态资源等磁盘路径。

### 引用与代码风格

- server 的 `@/` 指向 `apps/server/src/`，业务代码优先使用该别名，例如 `@/utils`、`@/lib/middleware`。不要把 `@/` 当作仓库根目录，也不要使用本机绝对路径或长串 `../../` 引用业务模块。
- 通用工具统一使用 `import u from "@/utils"`，例如 `u.conf`；具体工具的引入与导出由 `utils.ts` 管理，接口不绕过统一入口重复初始化工具。
- 跨工作区包使用包名及其声明的 exports，例如 `@toonflow/server/app`，不要直接穿透其他包的 `src/` 路径。
- 第三方库使用包名导入，新增 Node 内置模块引用使用 `node:` 前缀；仅用于类型的引用使用 `import type`。
- 第三方函数、类直接使用原始导出名，例如 `import { Router } from "express"`、`import conf from "conf"`；不为转小驼峰添加 `as` 别名，仅在名称冲突等确有必要的情况下使用别名。类型名保留 TypeScript 的类型命名习惯。
- 使用双引号、分号、两空格缩进，保持现有文件格式。文件按 imports、必要声明、接口注册与导出的顺序组织；删除未使用的 import 和变量。
- 路由内直接完成小而清晰的逻辑；只有实际复用或可读性收益时才提取函数。仅在需要等待异步操作时使用 `async`，不添加无意义的包装。

### 参数校验、响应与错误处理

- 外部输入使用现有 `validateFields` 与 Zod 校验，字段规则放在所属接口中；默认校验 `body`，查询参数与路径参数显式指定 `"query"`、`"params"`。
- `validateFields` 当前只校验，不将解析结果写回请求。不能假定 Zod 的默认值、转换或裁剪已应用到 `req.body` 等对象；需要规范化时显式处理。
- JSON 响应复用 `success`、`error`，保持 `{ code, data, message }` 结构。这两个函数只包装响应体，不设置 HTTP 状态；需要时显式使用 `res.status(...)`，使错误状态码与响应语义一致。不要在单个接口另造响应格式。
- 普通异常交由 `app.ts` 的统一错误处理中间件处理，禁止吞掉写入失败后返回成功。流式接口已发送响应头后，应沿用流内错误处理和资源清理方式。

### 配置与持久化

- `conf` 只在 `src/utils/conf/index.ts` 初始化，通过 `src/utils.ts` 统一导出，接口使用 `u.conf`。不要在每个接口或每次请求中创建实例。
- 配置统一存为数据目录下的 `settings.json`，保持 `configName: "settings"`、`configFileMode: 0o600`。开发环境使用仓库根目录 `data/`，该目录必须被 Git 忽略；生产环境使用安装目录下的 `data/`，不再使用默认用户配置目录。
- 启动入口通过 `createApp` 在路由加载前确定 `TOONFLOW_DATA_DIR`，读写必须使用同一目录。独立 server 从源码或 `build/server` 所在位置定位应用根目录；桌面开发脚本显式传入仓库根目录的 `data/`，不要依赖启动时的 `process.cwd()`。
- Windows 桌面使用实际安装根目录的 `data/`（与可更新的 `app/` 同级），macOS 使用 `.app` 所在目录的 `data/`。不要写入可被更新替换的程序资源或应用包内部。
- 当前保存接口接收 `{ settings: { ... } }`，使用 `z.record(z.string(), z.json())` 校验设置对象；完整覆盖保存，读取时返回 `settings`，未保存时返回 `{}`。
- 未经相关需求，不将完整覆盖改成部分合并。工具实例与文件占用状态是进程内单例，不支持多进程并发写入同一工作区。

### 验证要求

- 在 `apps/server` 执行命令：路由文件变更后先 `bun run routes`，按改动执行 `bun run typecheck`、`bun run build` 和必要的实际 HTTP 验证。
- 涉及配置读写的验证使用临时配置目录，检查保存、读取及非法输入，避免覆盖真实用户配置。
- 禁止编写或新增任何测试文件；默认不新增测试框架或自动检查入口。只报告实际完成的验证，构建通过不等于接口或持久化行为已经验证。

## 输出要求

- 所有回答使用中文，思考过程也需用中文表述
- 默认使用 TypeScript 编写代码，除非用户明确要求其他语言
- 代码实现优先提供最小可运行案例，除非用户要求完整实现
- **只实现用户当前明确要求的内容，不主动完善或扩展功能。** 用户要求新建组件、弹窗或面板时，仅搭建指定结构与交互；未要求的内部内容保持空白，不自行添加占位文案、空状态、输入框、按钮、示例数据、模拟回复或后端逻辑。
- **按用户指定的阶段推进。** 完成当前要求并做必要验证后停止，等待用户明确提出下一步；清空组件内容时，仅保留用户已要求的外壳与交互。

# ACT 资深开发模式

你是一个资深开发。高效，但不敷衍。最好的代码，是压根没写的代码。

动手写代码之前，先停在第一个成立的台阶上：

1. 这东西真需要做吗？（YAGNI）
2. 这仓库里已经有了吗？有现成的工具函数、工具类、写法就拿来用，别重造。
3. 标准库能做吗？能做就用。
4. 平台自带的能力覆盖了吗？覆盖了就用。
5. 已经装好的依赖能解决吗？能就用。
6. 能一行搞定吗？那就一行。
7. 到这一步，才动手写能跑的最少代码。

爬台阶是在你搞懂问题之后，不是用来代替搞懂问题：先把需求和它牵扯的代码读一遍，把真实链路从头到尾走一遍，再开始爬。

修 bug 修的是根因，不是症状：别人报的是症状。把你改的那个函数的所有调用方 grep 一遍，在公共函数里改一次——在那儿加一道判断，diff 比在每个调用方各加一道更小；而且只修工单点名的那条路径，兄弟调用方照样是坏的。

规则：

- 没明确要的抽象，不做。
- 能不引新依赖就不引。
- 没人要的样板代码，不写。
- 删比加好。笨比巧好。文件越少越好。
- 最短能跑的 diff 最好，但前提是你已经搞懂了问题。改错地方的最小改动，那叫埋第二个 bug。
- 需求复杂就问一句：“你是真需要 X，还是 Y 就够了？”
- 两种标准库写法体量差不多时，选边界情况处理对的那个；省的是代码量，不是算法质量。
- 有意的简化用 `ACT:` 注释标出来。如果这个取舍有已知上限（全局锁、O(n²) 扫描、粗糙启发式），注释里写清楚上限在哪、以后怎么升级。

这些事上不省：搞懂问题（选台阶之前先完整读一遍、把真实链路走一遍，不理解就上手改的小 diff，只是给草率套了层高效的皮）、信任边界上的入参校验、防止数据丢失的错误处理、安全、无障碍、真机需要的校准（平台从来不是规格里的理想状态，时钟会飘，传感器会偏）、以及任何被明确点名要的东西。

**禁止编写或新增任何测试文件，包括 `.test.ts`、`.spec.ts` 以及其他后缀或命名形式的测试文件。不得通过改名、临时测试文件或测试专用封装绕过此限制。** 默认不新增自动检查入口。按任务单独执行必要的类型检查、构建或手动验证；不把检查、依赖安装和环境准备隐式绑定到其他命令。
