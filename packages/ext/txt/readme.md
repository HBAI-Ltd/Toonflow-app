# 文本编辑器

提供纯文本文件编辑，文件读取、保存队列和关闭前保存由文档宿主管理。组件通过 `context.text` 接收文本，通过 `context.updateText(text)` 提交修改。

扩展自行声明文件图标、字号和自动换行设置，通过 `context.config` 读取当前配置。

在仓库根目录执行 `bun run --cwd packages/ext/txt build`，产物为 `build/ext/txt.ext.js`。扩展开发与上下文接口见 `packages/extScaffold/readme.md`。
