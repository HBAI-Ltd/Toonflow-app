# 开发报告：手动图片/视频生成模式

## 变更摘要

- 图片、视频生成入口改为完整提示词复制与原位置上传。
- 文本提示词生成/润色保留，主流程不再创建媒体生成任务。
- 新增统一 409 拦截、AI 图片/视频底层保护和视频轨道上传接口。
- 未新增依赖，未修改数据库结构。

## 修改文件

- `PLAN.md`
- `src/app.ts`
- `src/lib/manualMediaMode.ts`
- `src/utils/ai.ts`
- `src/router.ts`
- `src/routes/production/workbench/uploadVideo.ts`
- `docs/manual-media-api.md`
- `tests/manualMediaMode.test.mjs`
- `data/serve/app.js`
- `data/web/index.html`
- `DEV_REPORT.md`
- `CODEX_REVIEW.md`

## 测试结果

- `node --test tests/manualMediaMode.test.mjs`：3/3 通过。
- `./node_modules/.bin/tsc --noEmit`：通过。
- 后端生产构建：通过。
- 前端手动媒体测试：3/3 通过。
- 前端 Vite 生产构建：通过。
- 前端完整类型检查受既有 `generate copy.vue` 语法错误和其他既有类型错误阻断；本次修改文件未出现新增类型错误。
- 实际交付目录启动、页面 200、生成接口 409 和上传接口无效 MIME 400 冒烟通过。

## 风险与回滚

- Base64 视频受现有 100 MB 请求体限制。
- 外部生成一致性依赖目标工具对提示词的执行效果。
- 回滚源码、`data/serve/app.js` 和 `data/web/` 即可；无数据库迁移。

## 人工确认

- PR 仅创建供审阅，不自动合并。
- 登录后的真实图片/视频上传会写入项目数据，需用户指定测试项目后再执行。

---

# 开发报告：豆包网页视频 API 接入

## 变更摘要

新增 Toonflow 内置供应商“豆包网页视频”，通过本机 `doubao2api` 的
`POST /v1/video/generations` 调用豆包网页视频生成能力。供应商公开真实
模型标识 `doubao-video`，仅声明当前后端实际支持的文生视频模式。

适配器支持服务根地址或完整接口地址、可选 Bearer API Key、画面比例透传、
视频 URL 提取以及结构化错误提示。`710022004` 不会自动重试或绕过，而会
提示用户在 `doubao2api` 托管浏览器中完成人工验证。

启动数据修复流程会读取随安装包发布的 `data/vendor/doubaoWeb.ts` 并自动
注册供应商；没有改写现有内置供应商 JSON，也没有修改工作区中原有的其他
未提交供应商文件。

## 修改文件

- `PLAN.md`
- `data/vendor/doubaoWeb.ts`
- `src/lib/fixDB.ts`
- `data/serve/app.js`（构建产物）
- `tests/doubaoWeb.vendor.test.mjs`
- `docs/doubao-video-api.md`
- `DEV_REPORT.md`
- `CODEX_REVIEW.md`

## 测试命令

```bash
node --test tests/doubaoWeb.vendor.test.mjs
npm run lint
npm run build
DOUBAO_LIVE_TEST=1 node --test --test-name-pattern='live:' tests/doubaoWeb.vendor.test.mjs
sqlite3 -json data/db2.sqlite \
  "select id, enable, inputValues, models from o_vendorConfig where id='doubaoWeb';"
curl http://127.0.0.1:9090/v1/models
curl http://127.0.0.1:9090/health
```

## 测试结果

- 供应商契约测试：5 项通过，1 项真实生成测试默认跳过。
- TypeScript lint：通过。
- 后端与 Electron 主进程构建：通过。
- Toonflow 开发服务自动重载并注册 `doubaoWeb`：通过。
- 当前开发数据库中的 `doubaoWeb` 已启用：通过。
- `doubao2api /v1/models` 返回 `doubao-video`：通过。
- `doubao2api /health` 返回已登录：通过。
- 真实视频生成：请求已到达豆包，但上游返回
  `710022004 rate limited`，本次未生成视频。浏览器截图显示账号仍登录；
  该错误是视频生成动作触发的豆包人工验证，不是 Toonflow 请求契约失败。

## 风险说明

1. 豆包网页接口不是稳定的官方开放平台接口，上游字段或风控策略变化可能
   导致适配器需要同步更新。
2. 当前后端不支持参考图、显式时长、显式分辨率或音频参数；Toonflow 中
   没有伪装这些能力。
3. 视频生成返回临时 URL，Toonflow 会立即下载并转为项目文件；URL 失效前
   必须完成下载。
4. 新增第三方供应商遵循项目既有策略，发行版默认注册但不自动启用；当前
   开发数据库已按本次接入需求启用。
5. 当前工作区原有 4 个未提交文件未被本任务修改或清理。

## 回滚方案

删除 `data/vendor/doubaoWeb.ts`、契约测试和接入文档，恢复
`src/lib/fixDB.ts` 中 `externalBuiltInVendorFiles` 相关逻辑，并重新执行
`npm run build` 生成 `data/serve/app.js`。本地数据库中如已注册，可在
Toonflow 供应商设置中禁用；无需修改数据库结构。

## 人工确认

代码集成不需要额外确认。要完成真实视频生成验收，需要用户在
`doubao2api` 托管浏览器中完成人工验证或重新登录，然后重新运行带
`DOUBAO_LIVE_TEST=1` 的测试。

## ChatGPT 网页 GPT-5.6 SOL 主工作目录接入

### 变更摘要

- 新增内置文本供应商“ChatGPT 网页 GPT-5.6 SOL”。
- 上游模型固定为 `gpt-5.6-sol-wm`，每次请求固定注入
  `reasoning_effort: xhigh`。
- `src/lib/fixDB.ts` 同时注册 `doubaoWeb.ts` 和
  `chatgptWebSol.ts`，没有覆盖豆包视频接入。
- 生产 bundle 已重新生成并包含两个外部内置供应商。
- 新增供应商契约测试和配置文档。

### 修改文件

- `data/vendor/chatgptWebSol.ts`
- `src/lib/fixDB.ts`
- `data/serve/app.js`
- `tests/chatgptWebSol.vendor.test.mjs`
- `docs/chatgpt-web-sol.md`
- `PLAN.md`
- `DEV_REPORT.md`
- `CODEX_REVIEW.md`

### 测试命令与结果

```bash
node --test tests/chatgptWebSol.vendor.test.mjs tests/doubaoWeb.vendor.test.mjs
npm run lint
npm run build
```

结果：ChatGPT 6/6、豆包 5/5 通过；豆包真实生成测试按设计跳过。
TypeScript lint、后端构建和 Electron 主进程构建通过。

通过当前主工作目录的 `data/vendor/chatgptWebSol.ts`、真实
`@ai-sdk/openai` 和 `generateText` 请求本机 `chatgpt2api`，返回
`MAIN_TOONFLOW_OK`。当前运行中的 Toonflow 开发服务自动重载后，
只读数据库检查确认 `chatgptWebSol` 已注册且 `enable=0`；
原 `doubaoWeb` 保持 `enable=1`。

### 风险说明

1. `chatgptWebSol` 默认关闭且 API Key 为空；需要用户在模型服务中配置
   `CHATGPT2API_AUTH_KEY` 后手动启用。
2. Toonflow 现有供应商配置保存在本地 SQLite，不是系统 Keychain。
3. ChatGPT 网页模型标识和内部协议可能变化。
4. `chatgpt2api` 的有限 TLS 重试无法处理代理持续离线或上游协议改版。
5. 本轮没有清理、覆盖或提交工作目录中既有豆包及其他供应商改动。

### 回滚方案

删除 ChatGPT 供应商、测试和文档；从 `externalBuiltInVendorFiles`
移除 `chatgptWebSol.ts`；重新运行 `npm run build`。数据库中的既有记录可在
模型服务中保持禁用或手动删除，无数据库结构迁移。

### 人工确认

代码接入和检测已完成。写入真实代理 API Key、启用供应商以及合并提交仍需人工确认。

## Toonflow 启动时同步编排本地 API

### 变更摘要

- 新增 `CompanionApiManager`，在 Toonflow 监听端口前并行检查
  `chatgpt2api` 与 `doubao2api`。
- 服务不可达时，通过 Anaconda/Conda 复用现有
  `chatgpt2api-py313` 与 `base` 环境自动启动。
- 使用 Toonflow 本地供应商配置中的服务地址和 API Key 请求
  `/v1/models`，并分别要求存在 `gpt-5.6-sol-wm` 与
  `doubao-video`。
- API Key 仅通过子进程环境变量传递，不进入命令参数、源码或日志。
- 已运行的外部服务只复用、不重复启动；正常关闭 Toonflow 时只回收本次
  自行启动的子进程。
- CLI 启动失败会清理子进程并以非零状态退出；Electron 启动失败会显示错误
  并退出，不再继续打开不可用的主窗口。

### 修改文件

- `src/lib/companionApis.ts`
- `src/app.ts`
- `scripts/main.ts`
- `package.json`
- `README.md`
- `data/vendor/chatgptWebSol.ts`
- `docs/chatgpt-web-sol.md`
- `docs/doubao-video-api.md`
- `tests/companionApis.test.ts`
- `tests/chatgptWebSol.vendor.test.mjs`
- `data/serve/app.js`
- `PLAN.md`
- `DEV_REPORT.md`
- `CODEX_REVIEW.md`

### 测试命令与结果

```bash
node --import tsx --test \
  tests/companionApis.test.ts \
  tests/chatgptWebSol.vendor.test.mjs \
  tests/doubaoWeb.vendor.test.mjs
yarn lint
yarn build
```

结果：

- 自动化测试共 18 项：17 项通过，豆包真实视频生成测试按环境开关跳过。
- `yarn lint` 通过。
- 后端生产 bundle 与 Electron 主进程构建通过。
- 冷启动真实验收通过：两个端口均为空时，Toonflow 并行启动两项 Conda
  服务；ChatGPT 返回 18 个模型且包含 `gpt-5.6-sol-wm`，豆包返回
  21 个模型且包含 `doubao-video`，随后 Toonflow `10588` 返回 HTTP 200。
- 外部服务复用验收通过：两个 API 已运行时 PID 保持不变，关闭 Toonflow
  不会终止它们。
- 自有服务清理验收通过：向 Toonflow Node 进程发送 `SIGTERM` 后，
  `10588`、`8000`、`9090` 三个监听端口全部停止。

### 风险说明

1. `/v1/models` 验证服务鉴权与模型可见性，不执行真实文本或视频生成，
   因此不替代上游登录状态、额度和风控的端到端检查。
2. `SIGINT`、`SIGTERM` 和 Electron 正常退出会清理自有子进程；操作系统
   `SIGKILL`、崩溃或强制断电无法执行任何进程内清理逻辑。
3. 打包应用不会包含两个 Python 项目；项目不在 Toonflow 同级目录时，
   必须通过 `TOONFLOW_CHATGPT2API_DIR` 和
   `TOONFLOW_DOUBAO2API_DIR` 指定。
4. 任一服务不可达、鉴权失败、模型缺失或 60 秒内未就绪时，Toonflow
   会按需求拒绝启动。

### 回滚方案

移除 `src/lib/companionApis.ts`，恢复 `src/app.ts` 与
`scripts/main.ts` 的原启动行为，撤销文档、测试及 ChatGPT 默认地址调整，
然后运行 `yarn build` 重新生成生产 bundle。无需数据库迁移。

### 人工确认

实现和本地验收已完成。提交、推送、创建 PR 及最终合并仍需人工确认。

## ChatGPT 网页 Image2 图片模型接入

### 变更摘要

- 将 `chatgptWebSol` 供应商升级到 `1.1`，显示名称更新为
  “ChatGPT 网页 GPT-5.6 SOL + Image2”。
- 新增图片模型 `gpt-image-2`，公开文生图、单图和多参考图能力。
- 无参考图请求 `POST /v1/images/generations`；有参考图请求
  `POST /v1/images/edits`。
- 参考图使用 `chatgpt2api` 支持的 JSON `images[].b64_json` 格式，
  不引入 multipart 或新依赖。
- 横、竖、方比例分别映射到 `1536x1024`、`1024x1536`、
  `1024x1024`。
- 成功响应支持 `data[0].b64_json` 和 `data[0].url`；HTTP 错误会提取
  后端错误信息且不输出代理 API Key。
- 原 GPT-5.6 SOL 文本模型及固定 `reasoning_effort: xhigh` 行为保持不变。

### 修改文件

- `data/vendor/chatgptWebSol.ts`
- `tests/chatgptWebSol.vendor.test.mjs`
- `docs/chatgpt-web-sol.md`
- `data/serve/app.js`
- `PLAN.md`
- `DEV_REPORT.md`
- `CODEX_REVIEW.md`

### 测试命令与结果

```bash
node --import tsx --test \
  tests/companionApis.test.ts \
  tests/chatgptWebSol.vendor.test.mjs \
  tests/doubaoWeb.vendor.test.mjs
yarn lint
yarn build
```

结果：

- 共 21 项测试：20 项通过，豆包真实视频生成测试按环境开关跳过。
- ChatGPT 供应商 9 项测试全部通过，其中包含 Image2 模型声明、文生图、
  多参考图编辑、比例映射、base64/URL 响应及错误脱敏。
- `yarn lint` 通过。
- 后端生产 bundle 与 Electron 主进程构建通过。
- 通过当前运行中的 Toonflow 供应商列表 API 验证：
  `chatgptWebSol` 版本为 `1.1`、状态为启用，模型列表包含
  `chatgptWebSol:gpt-image-2`，模式为 `text`、`singleImage`、
  `multiReference`。
- 未执行真实图片生成，未消耗上游图片资源。

### 风险说明

1. `chatgpt2api /v1/models` 按其契约只列文本模型，不列
   `gpt-image-2`；Image2 通过专用图片接口和供应商契约声明。
2. 真实生成仍依赖 `chatgpt2api` 中可用的图片账号、额度和上游风控。
3. Toonflow 的 `1K/2K/4K` 选择会按画面比例映射为 Image2 支持的三个
   固定尺寸，不承诺实际输出达到 2K 或 4K。
4. 多参考图会随请求转发至本机 `chatgpt2api`，再由其传给 ChatGPT 网页
   图片服务。

### 回滚方案

从 `chatgptWebSol` 中移除 `gpt-image-2` 模型和 `imageRequest`
实现，将供应商名称及版本恢复为 `1.0`，撤销对应测试和文档，再运行
`yarn build`。无需修改数据库结构。

### 人工确认

代码与非付费验收已完成。真实图片生成、提交、推送和 PR 仍需人工确认。

---

## 豆包网页视频仅多图模式

### 变更摘要

- 将 `doubaoWeb` 供应商升级到 `2.1`。
- 模型显示名改为“豆包网页多图视频生成（自动路由）”。
- 视频能力只声明 `[["imageReference:10"]]`，移除 `text` 模式。
- 提交前要求 1 至 10 张且全部为图片参考；空图片、非图片和超过 10 张会在
  Toonflow 侧直接报错，不发送请求。
- Data URL 会拆出 MIME 和纯 Base64，裸 Base64 默认按 PNG 发送。
- 请求体新增 `images[].b64_json`、`filename`、`mime_type`，保留
  `model`、`prompt`、`ratio` 和原有鉴权/响应解析。
- 接入文档已同步为仅多图模式，说明多账号切换时由 doubao2api 重新上传图片。

### 修改文件

- `data/vendor/doubaoWeb.ts`
- `tests/doubaoWeb.vendor.test.mjs`
- `docs/doubao-video-api.md`
- `data/serve/app.js`（按现有构建流程重新生成）
- `PLAN.md`
- `DEV_REPORT.md`
- `CODEX_REVIEW.md`

### 测试命令与结果

```bash
node --test \
  tests/chatgptWebSol.vendor.test.mjs \
  tests/doubaoWeb.vendor.test.mjs
node --import tsx --test tests/companionApis.test.ts
yarn lint
yarn build
```

结果：

- 两个供应商共 16 项：15 项通过，真实豆包视频测试按环境开关跳过。
- 伴随 API 6 项测试全部通过。
- `yarn lint` 通过。
- 后端生产 bundle 和 Electron 主进程构建通过。
- doubao2api 的 28 个相关 Python 测试通过。

### 启动结果

旧的 Toonflow 进程已正常停止，其自有 `chatgpt2api` 和 `doubao2api` 同步
退出。随后使用新构建执行 `yarn start`：

- Toonflow：`http://localhost:10588`，首页 HTTP 200。
- chatgpt2api：`http://127.0.0.1:8000`，健康检查 HTTP 200。
- doubao2api：`http://127.0.0.1:9090`，健康检查 HTTP 200。
- 启动编排确认 `gpt-5.6-sol-wm` 与 `doubao-video` 后才开放 Toonflow。
- doubao2api 模型列表显示新的多图视频名称。

### 风险说明

1. 当前豆包托管浏览器未登录，未执行真实多图视频生成，也未消耗额度。
2. Toonflow 侧合同和 doubao2api 载荷均支持 10 张，但豆包网页上游的真实
   2 至 10 图行为仍需登录后验证。
3. 这是有意的不兼容 UI 变化：该供应商不再提供“文生视频”选项；提示词仍用于
   描述参考图中的运动和镜头。
4. 当前工作区还有此前任务和既有换行格式变更；创建提交时必须审核暂存范围。

### 回滚方案

将 `doubaoWeb` 模式恢复为 `["text"]`，移除 `images` 请求转换和图片数量校验，
恢复旧模型名称与文档，并重新运行 `yarn build`。doubao2api 也必须同步回滚旧
视频请求契约，避免两端不一致。

### 人工确认

业务代码修改已获得确认。继续使用本地应用不需要额外确认；真实多图视频生成
需要用户先登录豆包，并明确允许消耗视频额度。提交、推送和 PR 合并仍按仓库
流程进行。

---

## 东北90年代拟人猫视觉手册

### 变更摘要

- 新增完整视觉手册 `3D_90s_northeast_anthropomorphic_cat`，包含 Toonflow
  识别的 12 个 Markdown 字段文件，共 2304 行。
- 手册锁定 1988—1990 年北安市红星机械厂家属院、轻写实电影级拟人猫动画、
  9:16 竖屏和每个视频约 60 秒。
- 固定小橘、橘爸、花妈、猫奶奶、大勇的毛色、脸部标记、体型、服装、身高关系
  和喜剧表演方式。
- 固定小橘家、家属院、红星机械厂、红星小学、供销社、露天市场和大勇家，并
  补充露天电影、火车站、绿皮火车和楼道等常用扩展场景。
- 新增年代允许/慎用/禁止矩阵，明确排除现代电子产品、服装、包装、精装修以及
  真人猫耳、四足宠物猫、Q 版萌宠等风格漂移。
- 新增 1672×941 PNG 封面，表现小橘偷吃饺子、花妈看穿、橘爸忍笑的家庭喜剧
  瞬间；封面由内置 ImageGen 生成并保存到项目目录。
- 新增专项测试，覆盖文件结构、封面、名称、人物、地点、60 秒规格、色盘和
  穿帮禁止项。

### 修改文件

- `data/skills/art_skills/3D_90s_northeast_anthropomorphic_cat/README.md`
- `data/skills/art_skills/3D_90s_northeast_anthropomorphic_cat/prefix.md`
- `data/skills/art_skills/3D_90s_northeast_anthropomorphic_cat/art_prompt/`
  下 7 个专项手册。
- `data/skills/art_skills/3D_90s_northeast_anthropomorphic_cat/driector_skills/`
  下 3 个导演技法手册。
- `data/skills/art_skills/3D_90s_northeast_anthropomorphic_cat/images/cover.png`
- `tests/visualManual.90sNortheast.test.mjs`
- `PLAN.md`
- `DEV_REPORT.md`
- `CODEX_REVIEW.md`

### 测试命令与结果

```bash
node --test tests/visualManual.90sNortheast.test.mjs
yarn lint
```

结果：

- 专项测试 8/8 通过。
- `yarn lint`（`tsc --noEmit`）通过。
- 模板残留检查通过；12 个 Markdown 文件全部非空，路径与 Toonflow 字段映射
  一致。
- 当前运行中的 Toonflow `POST /api/project/getVisualManual` 返回该手册，
  `fieldCount=12`、`filledFieldCount=12`。
- 在 Toonflow“新建项目 → 视觉手册”中确认新卡片可见，编辑弹窗显示 12 个
  页签；README、分镜视频和技法-分镜表设计均成功加载实际内容。
- 封面浏览器状态为 `complete=true`，自然尺寸 1672×941，资源地址返回成功。
- 未调用文本、图片或视频业务生成接口，不产生真实短片资源消耗。

### 风险说明

1. 视觉手册可以约束生成，但模型仍可能偶发产生年代或角色漂移；应在首批资产
   生成后进行角色锚图和年代复核。
2. 封面是风格参考，不是五名角色的完整标准设定图；正式生产前仍应分别生成并
   人工确认五名角色四视图。
3. 品牌包装、电视节目、游戏机型号等具体年代细节被设为慎用；如剧本指定真实
   品牌，仍需逐项核验。
4. 当前工作区包含此前供应商和启动编排任务的未提交修改，提交时必须严格限制
   暂存范围。

### 回滚方案

删除 `data/skills/art_skills/3D_90s_northeast_anthropomorphic_cat/` 和
`tests/visualManual.90sNortheast.test.mjs`，并回退本任务在 `PLAN.md`、
`DEV_REPORT.md`、`CODEX_REVIEW.md` 中的对应章节即可。无需数据库迁移，
不会影响现有视觉手册。

### 人工确认

视觉手册、封面、自动化测试和界面验证已完成。实际批量生成角色、场景、图片或
视频会消耗上游资源，需要另行人工确认；PR 只能由人工合并。
