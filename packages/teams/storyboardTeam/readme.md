# 分镜创作团队

本地团队示例：director 统筹，writer 编写，reviewer 审阅。成员可以通过团队内的委派能力分工；所有成员只使用已授予的读取能力，本示例不执行消耗算力的媒体生成任务，不自动写入工作区。

team.json 声明成员、委派关系和资源访问范围。members 保存提示词，skills/storyboard 保存团队私有技能，knowledge 保存私有知识。私有表示不会注册到其他团队的资源目录，不表示内容对本机用户保密。

运行 `bun run build` 生成 build/agents/storyboardTeam 目录和 storyboardTeam.agent.zip。开发环境中首次构建可安装到 data/agents/storyboardTeam；该目录已存在时默认保留其中所有改动。确认要用源码完整替换开发安装副本时，使用 `NODE_ENV=dev bun run build --sync`；该命令会删除安装副本中不再属于源码的文件。

对外 A2A 访问由宿主提供地址、认证、模型与工作区。团队包本身不包含密钥，不监听端口。
