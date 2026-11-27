# Toonflow 多语言

[返回项目首页](../../README.md) · [文档目录](../../docs/readme.md) · [开发与扩展指南](../../docs/development.md)

语言字典集中在 `src/locales/`，共 22 种语言：简体中文、繁体中文、英语、日语、俄语、越南语、泰语、韩语、印地语，以及印尼语（`id`）、马来语（`ms`）、菲律宾语（`fil`）、孟加拉语（`bn`）、乌尔都语（`ur`）、泰米尔语（`ta`）、泰卢固语（`te`）、马拉地语（`mr`）、旁遮普语（`pa`，Gurmukhi 文字）、阿拉伯语（`ar`）、波斯语（`fa`）、土耳其语（`tr`）和巴西葡萄牙语（`pt`）。`zhCn.json` 是抽取的中文源文案，其他语言使用同一消息键。

## 使用

Web 设置和首次引导复用 `languageSelect.vue`：设置页直接展示语言卡片，首次引导通过按钮弹出同一组卡片。卡片使用本地 SVG 国旗和原生语言名，支持方向键、Home/End 选择。首次默认跟随 `navigator.languages`；手动选择保存在现有 `settings.ui.language`，不会覆盖主题、模型或其他设置。选择“跟随系统”后继续监听系统语言变化。中文优先按 Hans/Hant 区分，再按地区判断；不支持的系统语言回退英语。

全部 17 幅国旗统一来自 [flag-icons 7.3.2](https://github.com/lipis/flag-icons/tree/7.3.2/flags/4x3) 的现成 4:3 SVG，仅将根元素包装为本地 `languageFlags.svg` 的 symbol，保留原始路径、定义、比例和 MIT 授权声明。只收录组件实际引用的国家，不安装整套图库，运行时不请求 CDN；修改图案时应更新对应上游资源，不再手绘。

亚洲新增语言支持地区形式（如 `id-ID`、`bn-BD`、`ar-SA`）与 `tl-PH` → `fil`、`in-ID` → `id` 别名。每种语言目前只提供一种文字体系，`pa-PK` / `pa-Arab` 不会误用 Gurmukhi 旁遮普语，未支持的文字体系继续尝试系统语言列表的下一项。阿拉伯语、波斯语、乌尔都语使用 RTL；画布坐标、代码、地址、密钥和 JSON 等技术内容保留 LTR。阿拉伯语和波斯语卡片分别使用沙特阿拉伯、伊朗国旗。葡萄牙语的 `pt-PT` 等地区形式同样使用巴西葡萄牙语（`pt`）译文，卡片使用巴西国旗。国旗用于视觉辅助，同一国家的不同语言会复用图标。

Element Plus 使用 `src/elementPlus/` 中的 22 份完整语言 JSON，通过 `@toonflow/i18n/elementPlus` 接入全局 ConfigProvider；分页、日期、上传、筛选及无障碍提示随语言即时更新，不再因官方语言包缺失而回退英语。日期格式和星期名称使用 Web 已注册的 Day.js 语言包；菲律宾语映射为 `tl-ph`，Gurmukhi 旁遮普语映射为 `pa-in`，巴西葡萄牙语映射为 `pt-br`。TDesign 缺少的语言仍使用英语基底，聊天控件由应用字典补齐；Zod 的 `fil/te/mr/pa` 通用校验提示仍回退英语。

Web 静态文本和明确的展示属性由 `@toonflow/i18n/vite` 在 Vue 编译前转换，业务源码继续写中文。转换仅作用于 `apps/web/src`；编译器只处理已知显示位置，不遍历 DOM，不调用在线翻译，不关闭 Vue 静态优化，也不通过重新挂载页面切换语言。

动态文案可以使用原生 JavaScript 标签模板，无需 Babel 宏：

```ts
import { t, msg, translate } from "@toonflow/i18n/vue";

// 操作发生时显示当前语言。
ElMessage.success(t`文件 ${fileName} 已保存`);

// 配置保存消息描述，显示时翻译；参数会在创建描述时取值。
const saveLabel = msg`保存`;
const label = computed(() => translate(saveLabel));

// 动态参数在响应式作用域内求值。
const countLabel = computed(() => t`已选择 ${selectedCount.value} 个节点`);
```

`msg` 保留模板与参数，`t` 立即翻译。Vue 入口中的翻译函数读取响应式语言；模块初始化或 setup 中一次性得到的普通字符串不会自动更新。参数原样插入，不被当成新模板解析；花括号与引号由标签模板转义。需要复数时，译文可使用 ICU MessageFormat 的 `plural`，不要把句子拆开拼接。

后端使用 `apps/server/src/lib/i18n.ts` 的请求上下文。`success/error` 兼容旧中文字符串和消息描述；动态错误使用该模块的 `t`。FFmpeg 服务端错误可用 `@toonflow/i18n/errors` 的 `messageError`，传入 `msg` 标签模板生成的描述，保存原文和参数，到系统错误出口再翻译。后端不要调用 core 的 `setLocale` 切换全局语言。

语言来源按每个请求的 `Accept-Language`（含 q 权重）隔离；无支持的请求语言时使用保存的应用语言或系统语言。Zod 使用一次注册、按请求读取的语言分派器。SSE、MCP 和 FFmpeg 仅处理已识别的系统错误，模型正文、工具成功结果、供应商未知错误、用户内容和日志详情保持原样。

## 插件多语言

节点（`nodeScaffold`）和工具（`toolScaffold`）可选接入与宿主相同的多语言能力，字典由插件自己维护，不进入宿主字典，宿主 `extract` 也不扫描插件：

```text
packages/nodes/imageNode/
  i18n/
    zhCn.json    抽取出的中文源字典，不打包
    en.json      “中文原文 → 译文”，文件名与 src/locales 相同（zhTw、ja、pt……）
```

- 插件目录存在 `i18n/` 时，构建器对插件自身源码执行与 Web 相同的编译期转换，界面继续写中文；显式文案同样使用 `import { t, msg, translate, locale } from "@toonflow/i18n/vue"`。工具服务端代码使用 `import { t, msg, translate } from "@toonflow/i18n"`，按当前请求语言翻译。
- 构建时读取并校验 `i18n/*.json`，内联进产物 `.umd.js` / `.tool.js`，不生成额外资源。文件名不属于支持语言或内容不是字符串对象时构建失败；缺少的语言或词条回退中文原文。
- 语言与 ICU 格式化由宿主提供：节点读取 `toonflowNodeHost.i18n`，工具组件读取 `toonflowToolHost.i18n`，工具服务端读取 `toonflow:tool-i18n`。使用多语言的插件需要配套宿主版本；没有 `i18n/` 也不导入 `@toonflow/i18n` 的插件产物不变。
- 插件有 `i18n/` 时，随插件打包且自身也有 `i18n/` 的工作区依赖（`nodeScaffold`、`nodeShared`、被引用的 `@toonflow/node-image` 等节点包）一并转换，字典按依赖合并、插件自身优先；共享文案只在所属包维护一份。没有 `i18n/` 的共享包不转换。插件名称、元数据、提示词与预设保持原值。类型提示需要插件 `package.json` 声明 `"@toonflow/i18n": "workspace:*"`。
- 自动转换只覆盖已知显示位置。显示数组、配置对象里的文案（如 `name` 字段、代码里比较或交给 Agent 的数据）保持原文，用 `markMessages(...)` 包住定义，让抽取收进字典，显示时再调用 `translate(item.name)`；`markMessages` 原样返回参数，不改变数据。计算属性的块状函数体、`notice` 等非约定变量里的文案，直接写 `t\`...\`` 或 `translate("...")`。变量名含 `prompt` 的声明会整体跳过抽取，界面文案不要放在这类变量里。
- 工具只翻译界面组件与显式 `t`；返回给模型的工具结果和错误保持原样，没有界面的工具不建 `i18n/`。

在仓库根目录抽取插件源文案，生成 `<插件目录>/i18n/zhCn.json`，再补齐其他语言文件。先抽取依赖包（`nodeScaffold` → `nodeShared` → 被引用的节点包），插件自身的源字典会自动排除依赖已有的词条：

```sh
bun packages/i18n/src/extract.ts packages/nodes/imageNode
```

白模预演的内置素材名称由目录数据动态生成，需使用其专用入口：

```sh
bun run --cwd packages/nodes/trumanMap extractI18n
```

该入口先运行通用插件抽取，再将内置主素材、非配方衍生素材及配方源素材名称合并到 `i18n/zhCn.json`；用户素材不参与抽取。配方衍生的状态和款式在显示时组合，无需为每个组合单独维护名称。该命令不会修改其他语言字典；新增名称需补充译文，缺失时显示原名。

内置插件字典覆盖宿主支持的 22 种语言，但白模预演的素材名称尚未全部翻译。新增译文包含机器翻译，尚需母语及领域术语校对；新增词条缺少译文时回退中文原文。

Web 中的插件管理菜单、安装操作和配置校验提示仍属于应用界面，使用宿主字典。

## 更新文案

在仓库根目录执行：

```sh
bun run --cwd packages/i18n extract
```

此命令只更新中文源字典和 `src/messageSources.json`（消息来源索引），不会覆盖其他语言的人工译文。补齐其余二十一个语言文件中新增的键，保留 `{0}` 等参数；变更中文原文后要同步调整译文。相同中文需要不同语义时，应明确拆分消息，不能通过翻译后的文字判断业务状态。

Element Plus JSON 独立于应用文案抽取维护，基于 2.14.5 的完整 142 项组件文案，保留上游 MIT 授权于 `src/elementPlus/license.txt`。升级 Element Plus 时对照其英语包核对所有键与数组结构，再补齐 22 份 JSON。组件模板保留 `{total}`、`{pager}`、`{column}` 等原始命名参数，不使用应用字典的 ICU 语法；`name` 必须匹配已注册的 Day.js 语言名。类型检查会检查语言覆盖及相对于本地英语包的结构，但不能代替与升级后上游的核对或译文校对。

校对时沿来源索引追到按钮事件、状态分支和接口实际行为，确认操作对象、影响范围及完成条件。例如收藏分类与“添加收藏”是不同语义，关闭弹窗与“不使用高亮颜色”也应分别翻译；音频裁剪区间、表格行、版本说明和消费金额须按所在功能理解。

未支持的显示代码应在显示边界显式调用 `translate/t`，不要扩大规则到任意 `message`、`label` 或所有中文字符串。`data`、`inputs`、`outputs` 等用户数据不属于自动翻译范围。已有 `[aria-label="中文"]` 逻辑定位应改为稳定的 `data-*` 标识。

字典随应用打包，运行时不依赖翻译服务。当前 20 份译文字典已完成 AI 辅助的全量逐条语义校对，并对术语、否定条件、操作对象、数字和模板参数进行复核；这不等同于各语言母语人员的出版级审校。新增的巴西葡萄牙语（`pt`）基于社区贡献的译文（[PR #400](https://github.com/HBAI-Ltd/Toonflow-app/pull/400)），已核对键集合、模板参数和技术标识，尚未纳入上述全量逐条校对。供应商、tools、nodes 子包、第三方网站与安装器不在本次翻译范围。

本次验证过程见 [回归记录](./regression.md)。
