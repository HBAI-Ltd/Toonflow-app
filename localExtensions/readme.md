# 本地定制和上游同步

此目录保存本机插件和服务助手的源码，不包含密钥、模型、工作区、素材或服务配置。宿主的界面与服务修改放在各自的源码目录中。

## 当前覆盖范围

- 聊天中识别工作区内的常见文件链接，音视频可预览，桌面端可打开所在文件夹。
- 隐藏首页两处广告和画布余额；媒体模型列表过滤 Toonflow 官方模型。
- 聊天附件允许音频；ComfyUI 视频请求保留素材引用顺序。
- 视频生成节点可停用、取消当前任务并阻止自动恢复；保留已有结果。
- `providers/` 中是 ComfyUI、IndexTTS、YuE2 的本地供应商源码。通过媒体供应商安装，并在配置中填写本机启动助手令牌；不要提交令牌。
- `tools/hindsight.tool.js` 是现有 Hindsight 工具。宿主自动记忆需要设置环境变量 `TOONFLOW_HINDSIGHT_AUTO=1`，并准备用户目录下 `.hindsight/coding-agent.json`。启用后会将工作区支持的文本和对话同步到配置的 Hindsight 服务的 `toonflow-shared`，请只在信任服务和工作区时启用。
- `serviceHelper/` 保存原本机启动助手逻辑；它依赖独立的 `config.json`、Python、psutil、Node 和本机模型服务。旧版代码包含本机 `D:/stable` 等路径，换机器或安装目录时必须适配。不要提交 `config.json`、日志、状态文件和令牌。

此前定制的真实采样进度、超时后结果同步、增强 IndexTTS 节点及音色服务尚未迁入新版源码；旧版文件和数据仍在本机。不要将旧版编译后的节点直接覆盖新版来代替迁移。

## 更新官方代码

本工作副本的 `origin` 指向个人 fork，`upstream` 指向官方仓库，定制在 `codex/local-customizations` 分支。先提交或另行保存当前改动，然后：

```powershell
git fetch upstream
git switch codex/local-customizations
git merge upstream/master
```

如有冲突，逐项解决后执行类型检查、构建及相关功能验证，再提交合并。需要同步 GitHub 上的个人 fork 时，将确认过的分支推送到 `origin`。官方更新也可能改变接口，合并成功本身不证明本地供应商和节点仍可用。

按官方文档准备 Bun 和 Electrobun SDK 后，可执行 `bun install --frozen-lockfile`、`bun run build`，以及相关工作区的 `typecheck`。节点需要额外构建，桌面安装包使用 `bun run package:desktop`。独立构建和安装之前，备份现有 `D:/stable/data`；不要把开发运行指向唯一的正式数据目录，也不要覆盖已有项目素材。
