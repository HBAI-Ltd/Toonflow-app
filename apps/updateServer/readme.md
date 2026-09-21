# 更新服务器

这是独立的 Bun + Express 项目，可将整个 `updateServer` 文件夹复制到服务器安装依赖后运行。仅负责更新文件的发布与静态下载，不依赖桌面应用或业务 Server。

```powershell
cd apps/updateServer
bun install
bun run start
```

默认地址 `http://127.0.0.1:8091`，无需 `.env` 配置；需要对外监听或修改端口时，修改 `src/index.ts` 的 `host`、`port`。桌面构建的更新地址应指向客户端可访问的服务器地址。`bun run dev` 会监视源码。

## 应用装配

`src/app.ts` 的 `createApp(publicDirectory)` 负责静态下载与统一错误处理，`src/index.ts` 只负责目录准备和监听。JSON 错误响应使用 `src/lib/responseFormat.ts`，格式为 `{ code, data, message }`。命令行发布脚本位于 `scripts/publish.ts`。

服务只接受 GET/HEAD，不解析请求体、不开放跨域权限、不记录访问日志。独立项目保留自己的依赖与 `@/` 别名，不导入业务 Server 的内部文件。

## 发布更新

将桌面构建产物复制到服务器后，在本项目目录发布：

```powershell
bun run publish <桌面构建产物目录>
```

参数必须是包含且仅包含一个 `*-update.json` 的目录。清单的 `platform`、`arch` 必须与文件名前缀一致。新格式读取 `artifact.file` 指定的同前缀 `.tar.zst` 归档；Electrobun 1.18.1 Intel Mac 旧清单没有 `artifact` 时，从同目录查找且仅接受一个同前缀的 `.app.tar.zst`。Apple Silicon 使用包含 `artifact.file` 的新格式。

发布器同时复制同平台、渠道前缀的 `.patch`，保留旧补丁，先替换文件，最后原子替换清单。`public/` 是所有平台共用的静态目录，文件名前缀区分平台和架构。Windows 保持 `releases/<version>/` 快照；Intel Mac 和 Apple Silicon 分别保存到 `releases/macX64/<version>/`、`releases/macArm64/<version>/`。三个目标可以发布相同版本号，同一目标的同版本禁止重复发布。静态下载只开放平铺 ASCII 文件名的 GET/HEAD，并禁止缓存。

复制或发布失败会清理本次新建的快照目录和当前临时文件，允许重试，已有快照不会删除。已替换的公开文件不回滚，因此整个发布过程不是一次原子操作。

首次发布基线后保持服务运行，再构建下一版本，让 Electrobun 从该地址下载基线并生成补丁，然后再次发布。此服务不构建桌面程序，不提供 HTTP 上传接口；一次只运行一个发布命令。

类型检查：`bun run typecheck`。构建：`bun run build`，输出到本项目的 `build/index.js`，可使用 `bun build/index.js` 启动，仍读取项目根目录的 `public/`。构建不会安装依赖。
