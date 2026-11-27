import { markMessages } from "@toonflow/i18n";

type ReleaseNote = {
  label: string;
  text: string;
  preview?: "imageSequence" | "commands" | "costReminder" | "canvasAsset" | "sceneComposer" | "viewfinder" | "assetSearch" | "layouts" | "canvasSelection";
};

type ReleaseStep = {
  title: string;
  sections: { title?: string; notes: ReleaseNote[]; showMediaCatalog?: boolean }[];
};

export const updateSteps = markMessages<ReleaseStep[]>([
  {
    title: "新增",
    sections: [
      {
        title: "媒体节点新增「更多」菜单",
        showMediaCatalog: true,
        notes: [
          { label: "更多", text: "可按名称、分类或预设搜索工具。空图片、视频和音频节点可先选工具，再导入素材。" },
          { label: "生成节点", text: "图片、视频和音频生成后可直接从「更多」继续处理。处理进度显示在画布的新节点上，支持取消。" },
          { label: "选择素材", text: "需要添加素材的工具可从画布、素材库或本地文件选择。" },
          { label: "图片转视频", text: "多张图片转视频可以跟随首图比例，最多支持 300 张，可添加一段配音或配乐。点击镜头切换预览，拖动调整顺序。", preview: "imageSequence" },
          { label: "选项预览", text: "动漫人物选区可在原图上点选部位，深度图可对照两种明暗。视频的裁剪比例、打码方式和淡入淡出方向可在画面上切换预览。" },
          { label: "音频剪辑", text: "「拆分音频」可在波形上设置切点，各段可单独试听并输出为 WAV 节点。音效可先试听最多 8 秒。「拼接音频」可查看各音轨波形、试听和排序。" },
          { label: "波形视频", text: "音频可生成波形视频，可选背景图和波形颜色，播放时同步预览。" },
          { label: "分离人声与伴奏", text: "分别输出人声和伴奏两条 WAV 音轨。" },
          { label: "字幕", text: "视频可提取字幕为 VTT，音频可将语音转成 SRT。生成后可在文本节点编辑并按原格式下载。" },
          { label: "本地模型", text: "在插件市场的「本地模型」切换下载线路、导入文件或查看安装进度。工具缺少模型时会提示安装。" },
          { label: "费用提醒", text: "可为每个媒体供应商单独设置。", preview: "costReminder" },
        ],
      },
      {
        title: "视频片段重拍",
        notes: [
          { label: "片段重拍", text: "视频和视频生成节点上方点「片段重拍」，会新建重拍节点。在轨道上拖动选取 4–30 秒的片段，可选多段，每段可单独播放、删除和填写提示词。" },
          { label: "模型", text: "目前仅支持 Toonflow 官方 Seedance 2.5。" },
        ],
      },
      {
        title: "独立模式新增 5 条 Agent 命令",
        notes: [
          { label: "计划模式", text: "主对话输入 / 打开命令菜单。/plan 生成计划，可讨论、继续规划或批准执行。", preview: "commands" },
          { label: "目标模式", text: "/goal 分轮执行目标。可查看轮数和受阻原因，也可编辑、暂停或恢复。" },
          { label: "压缩上下文", text: "/compact 手动压缩对话，可指定要保留的内容。" },
          { label: "自动化任务", text: "/timer 定时接续对话。/automations 支持单次、间隔、每日和每周任务。服务运行时执行，可查看记录、打开结果或重试。" },
        ],
      },
      {
        title: "画布",
        notes: [
          { label: "画布布局模式", text: "在「通用设置」预览并选择 7 种布局。各布局的工具栏、搜索、缩放和 Agent 入口位置不同。", preview: "layouts" },
          { label: "插入到画布", text: "从素材库文件菜单插入，素材放在当前视口中央。", preview: "canvasAsset" },
          { label: "选区工具栏", text: "框选多个节点后，可从选区工具栏直接删除所选节点。" },
          { label: "空白画布", text: "可直接新建白模预演节点。" },
          { label: "Agent / MCP", text: "可在后台操作同一项目的其他画布。各画布并行，同一画布内按顺序执行。" },
        ],
      },
      {
        title: "白模预演",
        notes: [
          { label: "参考图", text: "描述框可粘贴最多 4 张参考图，可只用图片生成场景。单张不超过 10 MB，合计不超过 20 MB。", preview: "sceneComposer" },
          { label: "画面比例", text: "16:9、9:16、2.39:1、1.85:1、4:3。" },
        ],
      },
      {
        title: "客户端",
        notes: [
          { label: "插件市场", text: "客户端首页侧栏可直接打开「插件市场」。" },
          { label: "Bun", text: "Windows 和 macOS 支持暂停续传，也可拖入或选择本地文件离线安装。Linux DEB 下载运行时失败时显示下载地址和缓存命令。" },
        ],
      },
    ],
  },
  {
    title: "优化",
    sections: [
      {
        title: "媒体工具",
        notes: [
          { label: "视频生成", text: "视频生成节点和供应商测试会按模型、时长与分辨率联动筛选比例。旧供应商未声明比例时保留原有五种选项。" },
          { label: "预览", text: "图片、视频节点标题可显示分辨率。图片处理结果支持对比原图，视频节点支持鼠标悬停预览。" },
          { label: "逐帧拉片", text: "从视频或视频生成节点可一键创建并自动连线，默认不在添加节点菜单显示，可在「节点菜单管理」中开启。默认本地提取关键帧、片段和原音轨，开启 AI 后可逐镜头分析并总结全片。" },
        ],
      },
      {
        title: "画布",
        notes: [
          { label: "节点连线", text: "从输出端拖线，可在目标卡片上松手。多个输入端口按卡片高度分区，可连接目标高亮。节点菜单可重命名。" },
          { label: "框选与多选", text: "触屏可单指框选、点按增减节点。文件树可点「更多操作」，节点菜单设置可调整同级顺序。", preview: "canvasSelection" },
          { label: "外观", text: "浅色画布的节点边框和选中状态更清晰，窄屏选区工具栏可换行。" },
          { label: "画布操作", text: "优化多选时的平移和缩放。拖动分组连线到画布边缘时，会随视口移动重新匹配可连接节点。" },
          { label: "素材库", text: "可删除有内容的文件夹，删除前会确认。素材库为空或搜索无结果时显示提示。" },
        ],
      },
      {
        title: "Agent",
        notes: [
          { label: "工作流技能", text: "重写方法论和 48 类视频的制作流程。旧版保留在技能的 old 文件夹，可让 Agent 按旧版执行。" },
          { label: "生成", text: "提交生成后不再反复查询进度。视频提示词不再重复画风，由参考图决定。" },
          { label: "画布", text: "默认把资产和各集内容放在同一画布，也可选择分开。" },
          { label: "联网搜索", text: "只在用户要求时搜索。" },
          { label: "插件报错", text: "第三方插件的工具加载失败时，提示中会带上插件名称。" },
        ],
      },
      {
        title: "白模预演",
        notes: [
          { label: "取景窗", text: "双指拖动环视、捏合缩放。触屏上常显取景窗和时间轴按钮。", preview: "viewfinder" },
          { label: "素材搜索", text: "支持按原名或译名搜索，暂无译名时显示原名。", preview: "assetSearch" },
          { label: "素材库", text: "11,766 种主素材，含款式和状态共 81,326 项。" },
        ],
      },
      {
        title: "语言",
        notes: [
          { label: "界面语言", text: "文本与媒体节点、白模预演、镜头分析、画布工具和提问器均支持 22 种界面语言。插件可随节点和工具分发译文。" },
          { label: "回复语言", text: "Agent 默认沿用当前消息语言，包括中文简繁。可在消息中指定回复语言。" },
        ],
      },
      {
        title: "客户端",
        notes: [
          { label: "桌面首页", text: "发现新版时显示更新入口，可查看下载进度。" },
          { label: "macOS", text: "稳定渠道下载并校验 PKG 更新包后打开系统安装器，退出 Toonflow 后安装。" },
          { label: "FFmpeg", text: "安装进度实时更新，插件市场和安装窗口同步显示。" },
          { label: "充值", text: "套餐分开显示支付、到账和赠送金额，展开赠送细则可查看有效期和当前档位。" },
          { label: "Windows ARM64", text: "安装包无需额外安装 .NET Framework 4.8.1。" },
          { label: "Android", text: "Bun 升至 1.4.5。程序资源在首次启动或升级时解压。" },
          { label: "3D 导演台", text: "移除旧节点包。" },
          { label: "网络设置", text: "移除服务端代理设置和连接测试，旧代理配置停止生效。" },
        ],
      },
    ],
  },
  {
    title: "修复",
    sections: [
      {
        notes: [
          { label: "粘贴截图", text: "修复部分桌面环境首页和 Agent 输入框读不到截图的问题。附件读取完成后再发送。" },
          { label: "节点控件", text: "修复部分滑块、开关首次打开不可见的问题。" },
          { label: "滚轮缩放", text: "修复默认滚轮缩放模式下，节点内可滚动控件无法正常滚动的问题。" },
          { label: "设备互联", text: "修复开关保存后被旧状态覆盖的问题。关闭互联时停止轮询。手机在本地模式下停止定期查询远程连接。" },
          { label: "macOS", text: "修复发送系统通知时可能退出的问题。通知来源为「脚本编辑器」。" },
          { label: "代码沙箱", text: "修复部分严格校验工具参数的模型拒绝加载代码沙箱的问题。工具重名会提示来源。" },
          { label: "内置工具", text: "修复独立服务升级后，新增的内置工具（如浏览器）没有安装的问题。缺少工具时提示前往「插件市场」→「工具」安装或启用。" },
          { label: "视频读取", text: "修复画布和素材库读取部分视频文件失败的问题。" },
          { label: "文本节点", text: "修复表格列较多时出现横向滚动的问题，单元格文字会自动换行。" },
          { label: "画布标题", text: "修复左上角项目名与画布名没有对齐的问题。" },
          { label: "工具卡片", text: "修复在 Agent 工具卡片中按 Ctrl+C 时报错的问题。" },
          { label: "工作目录", text: "macOS 选择文件夹时从用户主目录打开。不能再选择应用安装目录作为工作目录。" },
          { label: "Windows 通知", text: "修复系统通知无法发送的问题。" },
          { label: "Windows 更新", text: "修复部分电脑因任务计划程序拒绝访问导致更新失败的问题。" },
        ],
      },
    ],
  },
]);
