# DreamAPI 全媒体生成服务商接入设计

状态：本地实现、构建与配置界面验证已完成；Dream-API/Toonflow-app Fork 与功能分支已创建并推送。PR 尚未创建。真实素材生成截图仍待在隔离测试实例中配置用户自己的 DreamAPI Key 并完成一次 Seedream 4.5 生成（此前已授权，最多 10 积分）；密钥不得进入仓库或截图。

## 目标

将 DreamAPI 作为 Toonflow 的媒体生成服务商接入，使 Toonflow Agent 和图片、视频、音频生成节点能够调用 DreamAPI 中所有会产出图片、视频或音频文件的能力。生成结果沿用 Toonflow 现有流程保存到当前项目工作区，并由 Agent 返回文件路径/预览。

用户在 DreamAPI 官方平台注册并自行充值、创建 API Key，再在 Toonflow 的媒体服务商设置中配置自己的 Key（BYOK）。Toonflow 不提供、共享或代付 DreamAPI 凭据与额度。

## 接入范围

依据 [DreamAPI Skill](https://github.com/dreamfaceapp/skill) 的能力清单，纳入所有产出媒体文件的能力：

| 结果类型 | 纳入的能力 |
| --- | --- |
| 图片 | Flux 文生图/图生图、DreamImage 2.0；Colorize、Enhance、Outpainting、Swap Face、Remove Background、Virtual Try-On；Seedream 4.0/4.5/5.0 Lite/5.0 Pro；Nano Banana 2/Pro；GPT Image 2、GPT Image 2.5 Flare/Sunburst 文生图与图生图。 |
| 视频 | LipSync、LipSync 2.0、DreamAvatar 3.0 Fast、Dreamact；Wan2.1 文生/图生/首尾帧；DreamVideo 3.0 文生/图生；Seedance 2.5/2.0/2.0 Mini；视频换脸、抠像、合成、去水印、增强；Video Translate 2.0。 |
| 音频 | TTS Clone、TTS Common、TTS Pro。 |

DreamAPI Skill 还列出 Voice Clone 与 Voice List。Voice Clone 的结果是后续 TTS 使用的 `cloneId`，Voice List 返回音色目录；两者本身不输出媒体文件，因此不作为生成模型加入本次范围。TTS Clone 仍纳入，但需要调用者提供已存在的 `cloneId`；TTS Common/Pro 需要实际有效的 `audioId`，首版只使用文档可核实的音色选项或显式 ID 输入，不新增独立的 Voice List 工具，也不编造 ID。能力名称不等于 DreamAPI 请求中的 `modelId`；实现时须按 Skill 中各能力的 API 请求/响应文档核对真实 ID、参数、输入角色与输出字段，不得从名称推测或虚构。

## Toonflow 当前实现与扩展依据

以下是对当前仓库代码的核对结果，接入按这些既有扩展点设计：

1. `packages/providers/types.d.ts:14-26` 的 `ProviderModel` 当前仅描述类型、模式、音频、尺寸、比例、时长/分辨率和音色；`ProviderDefinition` 在 `:194-231` 通过 `generateImage`、`generateVideo`、`generateAudio` 接收请求，`GenerateMedia` 在 `:180-186` 要求返回最终 `MediaAsset[]`。`MediaRequest.other` 已有供应商专属参数槽（`:44-47`），但不会自动从 Agent/节点请求传到供应商。
2. `packages/toolScaffold/src/runtime.ts:80-124` 的 `MediaModel` 和 `MediaGenerationRequest` 只包含通用字段，没有命名输入角色或动态操作参数。服务端 `apps/server/src/utils/media/generation.ts:33-49` 只把已知模型能力映射给客户端；`:112-135` 仅准备通用字段；`:164-205` 对所有模型统一要求非空提示词、调用对应媒体方法，并将供应商返回的每个文件写入项目目录。
3. `packages/tools/mediaGeneration/src/runtime.ts:12-56` 使用严格 Zod schema，当前三个 Agent 生成工具都要求非空 `prompt`；`src/index.ts:16-49` 暴露固定的 `generateImage`、`generateVideo`、`generateAudio`，并把返回的所有文件路径交还给 Agent。
4. `packages/nodes/imageGenerationNode/src/index.vue:204-224`、`videoGenerationNode/src/index.vue:218-238`、`audioGenerationNode/src/index.vue:124-138` 将节点表单值和通用参考素材组成请求。节点目前按媒体类型提供固定输入与参数表单；视频和音频节点的生成流程在各自 `src/index.vue` 中只取结果数组的第一项接到节点输出端口。
5. `apps/server/src/utils/conf/index.ts:18-22` 将应用设置写入数据目录的 `settings.json`，文件权限为 `0o600`；`settings.mediaProviderConfigs` 保存媒体供应商配置。`packages/providers/src/media/tfRouter.ts:1-9,25-43` 展示了现有 API Key 密码输入项及从供应商配置读取 Key、以 Bearer 头发请求的模式。`apps/server/src/app.ts:16,53-68` 维护随应用安装的内置媒体供应商清单。

## 设计方案

### 1. 作为原生媒体 Provider 注册

新增 `dreamApi` 媒体 Provider，设置页显示品牌名 DreamAPI，并使用现有 `rules` 表单提供密码型 API Key 输入；除非官方 API 文档证明有需要，不增加账号密码或额外配置。将该文件加入 Provider 包导出、`mediaProviders` 注册表和 Server 内置 Provider 安装清单，使其可随 Toonflow 安装并出现在现有媒体服务商设置中。

Provider 内维护经文档核对的静态能力清单。每个可选项指向一个确定的 DreamAPI 操作，且标注输出类型、提示词是否必需、具名媒体输入角色及该操作实际支持的参数。不要假设 DreamAPI 提供兼容 OpenAI 的模型列表端点，也不要把不支持的能力显示成可用模型。

### 2. 以可选元数据描述特殊操作

对现有类型做兼容性优先的可选扩展：

- `ProviderModel` / `MediaModel` 可附带操作标识、`promptRequired`、具名输入角色（字段名、媒体类型、必需性和数量范围）及参数描述（字段名、类型、必需性、选项/边界）。这些元数据只描述 UI 和校验规则，不包含凭据或任意请求 URL。
- `MediaGenerationRequest` 增加具名本地媒体输入和 `other` 参数，并允许外部请求省略 `prompt`。普通的 `images`、`videos`、`audios`、比例、时长等字段继续沿用；带角色的输入用于明确区分目标图/人脸图、人物图/衣物图、源视频/Alpha 视频等。
- 扩展服务端模型映射、请求准备和 Agent 严格 schema，使元数据及角色输入能抵达 Provider。将提示词必填规则改为按模型能力判定：未声明时默认必填，只有文档确认无需提示词的操作才允许空提示词；服务端把省略的提示词规范化为空字符串。Provider 现有方法签名中的 `prompt` 保持字符串，避免迫使其他 Provider 同时改造。
- 图片、视频、音频节点根据所选模型元数据呈现对应的角色输入和参数控件；既有模型未提供扩展元数据时继续使用当前固定控件及规则。Agent 的 `listMediaModels` 返回这些安全的能力描述，生成工具接收角色路径和经过 JSON/Zod 基础校验的 `other`，再由服务端/Provider 按操作做字段白名单、类型、范围和必需性校验。

元数据字段的最终 TypeScript 名称可在实现前结合仓库类型约定细化，但必须保持“默认行为不变、DreamAPI 扩展可选、请求端不控制 API 路径”的边界。

### 3. Provider 处理 API 调用与文件

所有操作仍经 `generateImage`、`generateVideo` 或 `generateAudio` 三个既有入口路由；DreamAPI 的操作标识由 Provider 自己映射到文档中的固定 endpoint，不能接受调用者传入任意 URL。

本地参考素材由 Toonflow 以受工作区限制的路径读取，再按 DreamAPI Skill 的三步上传流程取得可访问 URL；URL 输入只在官方文档允许时透传。所有任务按 Skill 文档使用异步提交和 `taskId` 轮询，成功后将每个文档定义的图片/视频/音频结果转换成 `MediaAsset[]`。临时轮询故障继续查询同一个 `taskId`，不可因网络重试重复提交收费任务。遵循取消信号、响应大小/MIME 校验及错误脱敏。

服务端沿用现有 `generateMedia` 保存流程：Agent 默认输出目录为 `assets/generated`，画布节点沿用各自 `assets/<nodeId>`；不把 DreamAPI 密钥、任务凭据或远端响应原样写入项目文件。

### 4. BYOK 密钥与隐私边界

- 用户在 DreamAPI 官方平台注册、充值并获取个人 API Key；在 Toonflow 设置页自行录入。
- Key 只作为该 Toonflow 实例的本地媒体供应商配置保存在既有数据目录 `settings.json`（当前文件权限 `0o600`）中；由 Toonflow Server 运行时读取，并仅以 `Authorization: Bearer ...` 发给 DreamAPI。这里的“服务端”指用户运行的 Toonflow Server，不是 DreamAPI 或 Toonflow 代用户托管的共享 Key。
- 不将 Key 写进 Provider 源码、默认模型清单、仓库、日志、错误正文、Agent 返回、演示素材或 PR 截图。截图须避开设置密钥页或确保只呈现遮罩状态。
- 不在本次实现中调用用户 Key 做收费生成，除非用户另行明确批准付费端到端测试。

### 5. 输出与已知边界

Server 已保存 `MediaAsset[]` 中的全部结果，Agent 也逐项返回全部路径。为保持画布现有节点连线和存档格式兼容，本次设计不扩展节点的动态输出端口：图像/视频/音频节点仍把第一项作为主输出，其余结果保存于节点资源目录；Agent 可拿到完整路径列表并将伴随文件用于后续操作。抠像等需要 Alpha 等多个结果的完整链式工作流，可在 Agent 中把返回路径继续传给合成操作；通过画布端口直接连接次要结果不在本次范围。

当前 Server 对单个输入和结果文件有 100 MB 上限（`apps/server/src/utils/media/generation.ts:12,51-60,88-109`），本次不提高该安全限制；若 DreamAPI 某能力需要更大输入，需另行评估 Toonflow 的工作区文件约束，不能绕过限制。

Voice Clone 的创建流程及 Voice List 音色浏览不在本次目标内；TTS Clone 需要已有 `cloneId`。DreamAPI API 文档未覆盖、参数/输出无法确认或当前 Toonflow 类型无法安全承载的能力，应在 PR 中明确标为未支持并说明原因，不能用相似接口猜测实现。

## 改动范围

| 文件/区域 | 预期改动 |
| --- | --- |
| `packages/providers/src/media/dreamApi.ts`（新增）、`packages/providers/index.ts`、`packages/providers/package.json` | Provider 实现、导出、模型/操作清单及 API Key 表单规则。 |
| `apps/server/src/app.ts` | 加入内置媒体 Provider 安装清单。 |
| `packages/providers/types.d.ts`、`packages/toolScaffold/src/runtime.ts` | 可选操作能力元数据、具名输入与请求参数类型。 |
| `apps/server/src/utils/media/generation.ts` | 转发操作元数据/参数/具名输入，并依模型声明校验提示词；保持工作区边界、文件类型与大小校验。 |
| `packages/tools/mediaGeneration/src/runtime.ts`、`src/index.ts` | Agent 工具 schema/说明支持无提示词操作、角色素材及模型参数，保留严格输入校验。 |
| `packages/nodes/imageGenerationNode/src/`、`videoGenerationNode/src/`、`audioGenerationNode/src/` | 按模型元数据显示角色输入和专属参数，并继续兼容当前节点配置和主输出端口。 |

不修改全局设置结构、不新增依赖、不提交 DreamAPI Skill 的凭据文件、不扩大 100 MB 文件上限、不新增测试文件。

## 依赖兼容性评估

仓库根 `package.json` 固定 `packageManager` 为 `bun@1.3.14`，使用 TypeScript/ES Modules。方案沿用已有 `fetch`、`AbortSignal`、Zod、Provider 插件协议和本地设置机制，不需要新增运行时依赖；类型扩展均为可选字段，既有 Provider 与画布数据默认维持当前行为。实现后需在当前 Bun 版本下分别执行受影响工作区的类型检查与构建，不能以此替代真实 API 验证。

## 实施验收与 PR 证据

1. DreamAPI Provider 出现在媒体服务商设置，API Key 密码输入可保存/修改；缺少 Key 时明确失败；代码、日志、错误和界面返回均不泄漏 Key。
2. Skill 所列每个媒体文件输出操作均有经过文档核实的操作映射、输入角色、必需参数、模式/限制和输出媒体类型；未支持的项在 PR 中明确列出，不用占位或臆造模型。
3. Agent 的模型目录能区分图片/视频/音频及操作能力；Agent 与三个生成节点均能传递所需的角色输入和操作参数；所有结果落在当前项目工作区，Agent 返回全部结果路径；旧 Provider/画布配置不回归。
4. 遵循仓库 `CONTRIBUTING.md`：不新增测试文件；运行相关类型检查、构建和实际产品手动流程；PR 正文列出命令与结果、未验证边界、兼容性影响，并附 Toonflow 产品内实际使用 DreamAPI 生成素材的截图。真实生成可能产生 DreamAPI 费用，须在得到单独授权后执行；截图不得包含 API Key。

建议验证命令（从仓库根目录执行）：

```sh
bun run --cwd apps/server typecheck
bun run --cwd packages/tools/mediaGeneration typecheck
bun run --cwd packages/nodes/imageGenerationNode typecheck
bun run --cwd packages/nodes/videoGenerationNode typecheck
bun run --cwd packages/nodes/audioGenerationNode typecheck
bun run build
bun run build:nodes
```

这些检查验证代码/构建兼容性，不证明 DreamAPI 真实任务已成功。真实生成素材截图与接口生成验证应在用户单独授权使用其 BYOK Key 后补齐；创建 PR 还需要可推送的 fork 或上游写权限。
