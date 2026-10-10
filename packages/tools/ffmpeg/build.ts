import { createToolConfig } from "@toonflow/tools-scaffold";

await createToolConfig({
  name: "ffmpeg",
  displayName: "FFmpeg 媒体处理",
  description: "使用本机 FFmpeg 处理工作区音视频、图片，并通过 FFprobe 查询媒体信息。",
  author: "Toonflow",
  github: "https://github.com/HBAI-Ltd/Toonflow-app",
  prompt: `处理前按需使用 ffprobe 查询实际媒体信息，再通过 ffmpeg 的 steps 顺序调用 fluent 方法，operation 选择执行或能力查询。
FFmpeg 选项、滤镜和文件序列沿用原生语法；工具不重写输出位置，不设置固定处理超时。根据用户要求选择输出位置，除非用户要求覆盖，否则使用新文件名。
定长音视频合成前先用 ffprobe 确认实际流信息，按用户要求及裁剪、变速后的时间轴确定每段和最终输出的有限正数时长 T（秒），不能猜测时长。为每个定长输出设置 duration(T) 或 outputOptions 的 -t T；这是媒体时长，不是处理超时。循环图片、循环音频和静音源也必须有明确的结束条件。
定长补静音使用 apad=whole_dur=T,atrim=duration=T,asetpts=PTS-STARTPTS，T 替换为该段实际目标秒数；whole_dur 只补齐短音频，atrim 负责裁掉超长音频。送入 concat 前，每段音视频均须有限并对齐时长、重置时间戳，不能让不限时长的 apad 阻塞后续片段；不能仅依赖 -shortest 终止。
显式路径和滤镜、参数、媒体清单中的文件均使用当前工作区内的路径。等待执行成功后再交付，不把声明的输出路径当成已生成文件。FFmpeg 未就绪时提示用户在插件市场配置。`,
  configRules: [],
}, import.meta.url);
