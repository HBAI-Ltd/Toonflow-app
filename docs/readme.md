# Toonflow 文档目录

[返回项目首页](../README.md)

## 项目介绍

| README 语言 | 入口 |
| --- | --- |
| 简体中文 | [README](../README.md) |
| 繁體中文 | [README](./readme/readmeZhTw.md) |
| English | [README](./readme/readmeEn.md) |
| 日本語 | [README](./readme/readmeJa.md) |
| Русский | [README](./readme/readmeRu.md) |
| Tiếng Việt | [README](./readme/readmeVi.md) |
| ไทย | [README](./readme/readmeTh.md) |
| 한국어 | [README](./readme/readmeKo.md) |
| हिन्दी | [README](./readme/readmeHi.md) |
| Bahasa Indonesia | [README](./readme/readmeId.md) |
| Bahasa Melayu | [README](./readme/readmeMs.md) |
| Filipino | [README](./readme/readmeFil.md) |
| বাংলা | [README](./readme/readmeBn.md) |
| اردو | [README](./readme/readmeUr.md) |
| தமிழ் | [README](./readme/readmeTa.md) |
| తెలుగు | [README](./readme/readmeTe.md) |
| मराठी | [README](./readme/readmeMr.md) |
| ਪੰਜਾਬੀ | [README](./readme/readmePa.md) |
| العربية | [README](./readme/readmeAr.md) |
| فارسی | [README](./readme/readmeFa.md) |
| Türkçe | [README](./readme/readmeTr.md) |

项目介绍提供以上 21 种语言版本，与[应用支持的语言](../README.md#languages)保持一致。

## 使用与开发

- [项目圣经](./projectBible.md)：迭代前必读的项目概要、架构、运行、数据边界和验证流程。
- [使用教程](https://qcn7xdsqgc4z.feishu.cn/docx/RXFqdgR2Xo0dXZxGfd0cZCGgnwf)：日常操作与创作流程。
- [开发与扩展指南](./development.md)：源码运行、插件扩展、桌面打包和更新发布。
- [贡献指南](../CONTRIBUTING.md)与[开发规范](../AGENTS.md)：参与项目的约定。
- [多语言维护说明](../packages/i18n/readme.md)：字典抽取、动态文案、前后端接入和语言回退。
- [多语言回归记录](../packages/i18n/regression.md)：已完成的检查与已知范围。
- [MCP 接入说明](../packages/mcp/README.md)：外部客户端连接与工具能力。

## 目录约定

```text
docs/
  readme.md          文档入口
  development.md     开发与扩展指南
  readme/            各语言项目介绍
  images/            标识、认证与社区图片
    screenshots/     产品截图
    sponsors/        赞助商图片
```

各子包的实现与维护说明保留在对应 `packages/` 目录。更新项目介绍时，以根目录 `README.md` 为准同步其余二十份译版；图片统一复用 `images/`，移动文件时同时更新 Markdown 和 HTML 中的相对链接。
