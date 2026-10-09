# Toonflow 迭代流程

[返回项目圣经](./projectBible.md)

## 开始前

1. 阅读本圣经、相关子文档、根目录 `AGENTS.md` 和 `CONTRIBUTING.md`。
2. 用 `rg` 搜索目标函数、接口、Store、组件和所有调用方，先走通真实链路。
3. 确认改动属于 Web、Server、桌面、插件、提供方、工作区文件还是发布链路，并选最小验证范围。
4. 检查 `git status --short`，不要覆盖已有的用户改动、`data/` 或构建产物。

## 实现约束

- 优先复用现有 Store、工具函数、包 exports 和第三方依赖。
- 新增 Server 路由时一个文件只放一个接口，输入使用 Zod，响应使用 `success`/`error`。
- 新增/移动/删除路由后执行 `bun run --cwd apps/server routes`，不手改 `router.ts`。
- 工作区文件操作统一走 `useWorkspaceFiles`；底层文件原语统一走 `@toonflow/file`。
- 完整快照覆盖使用原子写入，失败不返回成功。
- 新文件和目录遵守小驼峰；Vue 文件顺序、模板标签和属性遵守 `AGENTS.md`。
- 不新增测试文件、测试框架或隐藏检查入口。
- 只实现当前需求，不顺手扩展未要求的空状态、后端逻辑或占位功能。

## 验证矩阵

| 改动 | 最小验证 |
| --- | --- |
| Web 页面/Store/组件 | `bun run --cwd apps/web typecheck`；必要时 `bun run --cwd apps/web build` |
| Server 路由 | 生成路由后 `bun run --cwd apps/server typecheck`；必要时临时数据目录做 HTTP 验证 |
| Server 工具/Agent | `bun run --cwd apps/server typecheck`，按接口手动验证错误和资源清理 |
| 节点 | 对应包 `typecheck`/`build`，再 `bun run dev:plugins` 检查运行副本 |
| 工具/技能/提供方 | 对应包检查或 `bun run build:tools`/Server 构建，确认 `data/` 装载行为 |
| 工作区/设置持久化 | 使用独立临时目录，验证成功、非法输入、失败和目录边界 |
| 桌面/协议/更新 | 运行 `bun run dev:desktop` 或当前平台打包，在真实宿主操作验证 |
| Docker/部署 | `docker compose up --build`，检查实际配置的探针或首页、端口、权限和持久化目录 |
| 仅文档 | 检查 Markdown、命令、相对链接和文档索引 |

类型检查和构建通过不代表真实模型调用、媒体生成、桌面安装/升级或跨平台行为已验证；提交说明必须写清实际运行过的命令和未覆盖的边界。

## 完成前清单

- [ ] 改动范围没有混入个人数据、密钥、`data/`、日志或无关构建产物。
- [ ] 所有共享函数调用方已搜索，公共根因只修一处。
- [ ] 路由注册表、包 exports、文档链接和命令已同步。
- [ ] 失败路径、权限、目录边界和数据丢失风险已检查。
- [ ] 已执行与改动匹配的真实验证，并记录结果与限制。
- [ ] 若改动了架构、运行方式、数据位置或扩展协议，已更新本圣经或子文档。
