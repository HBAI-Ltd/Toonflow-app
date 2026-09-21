# Skill 操作器

通过一个 `skillOperator` 工具统一查询、读取、新建和修改技能。源码说明在构建时嵌入 `.tool.js`，安装只需这个 JS 文件。

读取、新建、修改三个配置开关默认开启；关闭某项后，该操作从工具参数中移除，执行时也会拒绝。目录查询始终可用。这些开关只约束本工具，不替代其他工具的文件权限。

| action | 用途 | 参数 |
| --- | --- | --- |
| `list` | 实时列出技能名称、描述、来源及路径 | 可选 `scope` |
| `read` | 读取技能正文或引用资料 | `name`，可选 `scope`、`path` |
| `create` | 新建技能或资料文件，不覆盖已有文件 | `name`、`content`，可选 `scope`、`path` |
| `update` | 用完整内容修改已有文件 | `name`、`content`，可选 `scope`、`path` |

`scope` 为 `workspace`（当前工作区 `skill/`）或 `global`（全局 `data/skills/`）。读取、修改未指定范围时，同名技能优先使用工作区版本；新建默认工作区。可指定全局范围访问被覆盖的版本。

`path` 相对于该技能的目录，默认 `SKILL.md`。可使用 `references/example.md` 操作附带资料，禁止越出技能目录。新技能先创建 `SKILL.md`，名称使用小驼峰；正文必须包含有效的 YAML frontmatter，`name` 与技能名称一致，`description` 不为空。修改前先读取原内容。

目录按调用实时扫描，新建后可立即查询、读取；`/skill:名称` 仍可手动调用。列表中的 `disableModelInvocation` 表示该技能是否仅适用于用户主动指定。
