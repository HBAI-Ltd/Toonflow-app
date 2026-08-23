import u from "@/utils";
import { Socket } from "socket.io";
import { t, DEFAULT_LOCALE, type Locale } from "@/i18n";
import type {
  ChatMessageStatus,
  AIMessageContent,
  TextContent,
  MarkdownContent,
  ImageContent,
  ThinkingContent,
  SearchContent,
  SuggestionContent,
  ToolCallContent,
  ActivityContent,
  ReasoningContent,
} from "./chatMessagesData";

type ContentType = AIMessageContent["type"];

class ResTool {
  public socket: Socket;
  public data: Record<string, any>;
  public locale: Locale;

  constructor(socket: Socket, data: Record<string, any> = {}, locale: Locale = DEFAULT_LOCALE) {
    this.socket = socket;
    this.data = data;
    this.locale = locale;
  }

  // 创建新消息
  newMessage(role: "assistant" | "user" | "system" = "assistant", name?: string) {
    const messageId = u.uuid();
    const datetime = new Date().toISOString();

    this.socket.emit("message", {
      id: messageId,
      role,
      name,
      status: "pending" as ChatMessageStatus,
      datetime,
      content: [],
    });

    return new MessageBuilder(this.socket, messageId, role, name, datetime, this.locale);
  }

  // 发送错误消息
  sendError(messageId: string, error: string) {
    this.socket.emit("message:update", {
      id: messageId,
      status: "error" as ChatMessageStatus,
      ext: { error },
    });
  }

  // 发送完成状态
  sendComplete(messageId: string) {
    this.socket.emit("message:update", {
      id: messageId,
      status: "complete" as ChatMessageStatus,
    });
  }
}

// 消息构建器
class MessageBuilder {
  private socket: Socket;
  private messageId: string;
  private messageRole: "assistant" | "user" | "system";
  private messageName?: string;
  private messageDatetime: string;
  public readonly locale: Locale;

  constructor(
    socket: Socket,
    messageId: string,
    role: "assistant" | "user" | "system",
    name?: string,
    datetime?: string,
    locale: Locale = DEFAULT_LOCALE,
  ) {
    this.socket = socket;
    this.messageId = messageId;
    this.messageRole = role;
    this.messageName = name;
    this.messageDatetime = datetime ?? new Date().toISOString();
    this.locale = locale;
  }

  get id() {
    return this.messageId;
  }

  get role() {
    return this.messageRole;
  }

  get name() {
    return this.messageName;
  }

  get datetime() {
    return this.messageDatetime;
  }

  // 更新消息状态
  updateStatus(status: ChatMessageStatus) {
    this.socket.emit("message:update", {
      id: this.messageId,
      status,
    });
    return this;
  }

  // 添加文本内容
  text(initialText = "") {
    const contentId = u.uuid();
    const content: TextContent = {
      type: "text",
      id: contentId,
      data: "",
      status: "pending",
    };

    this.socket.emit("content:add", {
      messageId: this.messageId,
      content,
    });

    const stream = new AutoThinkingTextStream(this.socket, this.messageId, contentId, this);
    if (initialText) {
      stream.append(initialText);
    }
    return stream;
  }

  // 添加 Markdown 内容
  markdown(initialText = "") {
    const contentId = u.uuid();
    const content: MarkdownContent = {
      type: "markdown",
      id: contentId,
      data: initialText,
      status: "pending",
    };

    this.socket.emit("content:add", {
      messageId: this.messageId,
      content,
    });

    return new ContentStream<string>(this.socket, this.messageId, contentId, "markdown");
  }

  // 添加思考内容
  thinking(title?: string) {
    const resolvedTitle = title ?? t("socket.resTool.thinkingDefault", {}, this.locale);
    const contentId = u.uuid();
    const content: ThinkingContent = {
      type: "thinking",
      id: contentId,
      data: { title: resolvedTitle, text: "" },
      status: "pending",
    };

    this.socket.emit("content:add", {
      messageId: this.messageId,
      content,
    });

    return new ThinkingStream(this.socket, this.messageId, contentId);
  }

  // 添加搜索内容
  search(title?: string) {
    const resolvedTitle = title ?? t("socket.resTool.searchingDefault", {}, this.locale);
    const contentId = u.uuid();
    const content: SearchContent = {
      type: "search",
      id: contentId,
      data: { title: resolvedTitle, references: [] },
      status: "pending",
    };

    this.socket.emit("content:add", {
      messageId: this.messageId,
      content,
    });

    return new SearchStream(this.socket, this.messageId, contentId);
  }

  // 添加图片内容
  image(data: ImageContent["data"]) {
    const contentId = u.uuid();
    const content: ImageContent = {
      type: "image",
      id: contentId,
      data,
      status: "complete",
    };

    this.socket.emit("content:add", {
      messageId: this.messageId,
      content,
    });

    return this;
  }

  // 添加建议内容
  suggestion(suggestions: SuggestionContent["data"]) {
    const contentId = u.uuid();
    const content: SuggestionContent = {
      type: "suggestion",
      id: contentId,
      data: suggestions,
      status: "complete",
    };

    this.socket.emit("content:add", {
      messageId: this.messageId,
      content,
    });

    return this;
  }

  // 添加工具调用内容
  toolCall(data: ToolCallContent["data"]) {
    const contentId = u.uuid();
    const content: ToolCallContent = {
      type: "toolcall",
      id: contentId,
      data: { ...data, parentMessageId: this.messageId },
      status: "pending",
    };

    this.socket.emit("content:add", {
      messageId: this.messageId,
      content,
    });

    return new ToolCallStream(this.socket, this.messageId, contentId, data.toolCallId);
  }

  // 添加活动内容
  activity<T = Record<string, any>>(activityType: string, content: T) {
    const contentId = u.uuid();
    const activityContent: ActivityContent<T> = {
      type: "activity",
      id: contentId,
      data: {
        activityType,
        messageId: this.messageId,
        content,
      },
      status: "complete",
    };

    this.socket.emit("content:add", {
      messageId: this.messageId,
      content: activityContent,
    });

    return this;
  }

  // 添加推理内容
  reasoning() {
    const contentId = u.uuid();
    const content: ReasoningContent = {
      type: "reasoning",
      id: contentId,
      data: [],
      status: "pending",
    };

    this.socket.emit("content:add", {
      messageId: this.messageId,
      content,
    });

    return new ReasoningBuilder(this.socket, this.messageId, contentId);
  }

  // 完成消息
  complete() {
    this.socket.emit("message:update", {
      id: this.messageId,
      status: "complete" as ChatMessageStatus,
    });
  }

  // 停止消息
  stop() {
    this.socket.emit("message:update", {
      id: this.messageId,
      status: "stop" as ChatMessageStatus,
    });
  }

  // 错误
  error(errorMsg?: string) {
    this.socket.emit("message:update", {
      id: this.messageId,
      status: "error" as ChatMessageStatus,
      ext: errorMsg ? { error: errorMsg } : undefined,
    });
  }
}

// 内容流基类
class ContentStream<T> {
  protected socket: Socket;
  protected messageId: string;
  protected contentId: string;
  protected contentType: ContentType;

  constructor(socket: Socket, messageId: string, contentId: string, contentType: ContentType) {
    this.socket = socket;
    this.messageId = messageId;
    this.contentId = contentId;
    this.contentType = contentType;
  }

  get id() {
    return this.contentId;
  }

  // 流式追加数据
  append(chunk: string) {
    this.socket.emit("content:update", {
      messageId: this.messageId,
      contentId: this.contentId,
      type: this.contentType,
      data: chunk,
      strategy: "append",
      status: "streaming",
    });
    return this;
  }

  // 合并/替换数据
  merge(data: T) {
    this.socket.emit("content:update", {
      messageId: this.messageId,
      contentId: this.contentId,
      type: this.contentType,
      data,
      strategy: "merge",
      status: "streaming",
    });
    return this;
  }

  // 完成内容
  complete(finalData?: T) {
    this.socket.emit("content:update", {
      messageId: this.messageId,
      contentId: this.contentId,
      type: this.contentType,
      data: finalData,
      status: "complete",
    });
    return this;
  }

  // 错误
  error() {
    this.socket.emit("content:update", {
      messageId: this.messageId,
      contentId: this.contentId,
      status: "error",
    });
    return this;
  }
}

// 思考内容流
class ThinkingStream extends ContentStream<ThinkingContent["data"]> {
  constructor(socket: Socket, messageId: string, contentId: string) {
    super(socket, messageId, contentId, "thinking");
  }

  // 追加思考文本
  appendText(chunk: string) {
    this.socket.emit("content:update", {
      messageId: this.messageId,
      contentId: this.contentId,
      type: "thinking",
      data: { text: chunk },
      strategy: "append",
      status: "streaming",
    });
    return this;
  }

  // 更新标题
  updateTitle(title: string) {
    this.socket.emit("content:update", {
      messageId: this.messageId,
      contentId: this.contentId,
      type: "thinking",
      data: { title },
      strategy: "merge",
      status: "streaming",
    });
    return this;
  }
}

// 文本内容流：自动把 <think>...</think> 转为 thinking 内容
class AutoThinkingTextStream extends ContentStream<string> {
  private static readonly OPEN_TAG = "<think>";
  private static readonly CLOSE_TAG = "</think>";

  private readonly messageBuilder: MessageBuilder;
  private pending = "";
  private inThinking = false;
  private thinkingStream: ThinkingStream | null = null;

  constructor(socket: Socket, messageId: string, contentId: string, messageBuilder: MessageBuilder) {
    super(socket, messageId, contentId, "text");
    this.messageBuilder = messageBuilder;
  }

  override append(chunk: string) {
    if (!chunk) return this;

    let rest = this.pending + chunk;
    this.pending = "";

    while (rest.length > 0) {
      if (!this.inThinking) {
        const openIndex = rest.indexOf(AutoThinkingTextStream.OPEN_TAG);
        if (openIndex < 0) {
          const keepLen = AutoThinkingTextStream.OPEN_TAG.length - 1;
          const flushLen = Math.max(0, rest.length - keepLen);
          if (flushLen > 0) {
            this.appendText(rest.slice(0, flushLen));
            rest = rest.slice(flushLen);
          }
          this.pending = rest;
          break;
        }

        this.appendText(rest.slice(0, openIndex));
        this.inThinking = true;
        this.ensureThinkingStream();
        rest = rest.slice(openIndex + AutoThinkingTextStream.OPEN_TAG.length);
        continue;
      }

      const closeIndex = rest.indexOf(AutoThinkingTextStream.CLOSE_TAG);
      if (closeIndex < 0) {
        const keepLen = AutoThinkingTextStream.CLOSE_TAG.length - 1;
        const flushLen = Math.max(0, rest.length - keepLen);
        if (flushLen > 0) {
          this.appendThinking(rest.slice(0, flushLen));
          rest = rest.slice(flushLen);
        }
        this.pending = rest;
        break;
      }

      this.appendThinking(rest.slice(0, closeIndex));
      this.finishThinking();
      rest = rest.slice(closeIndex + AutoThinkingTextStream.CLOSE_TAG.length);
    }

    return this;
  }

  override complete(finalData?: string) {
    if (finalData) {
      this.append(finalData);
    }

    if (this.pending) {
      if (this.inThinking) {
        this.appendThinking(this.pending);
      } else {
        this.appendText(this.pending);
      }
      this.pending = "";
    }

    this.finishThinking();
    super.complete();
    return this;
  }

  override error() {
    if (this.thinkingStream) {
      this.thinkingStream.error();
      this.thinkingStream = null;
    }
    this.pending = "";
    this.inThinking = false;
    return super.error();
  }

  private appendText(text: string) {
    if (!text) return;
    super.append(text);
  }

  private appendThinking(text: string) {
    if (!text) return;
    this.ensureThinkingStream().appendText(text);
  }

  private ensureThinkingStream() {
    if (!this.thinkingStream) {
      this.thinkingStream = this.messageBuilder.thinking(t("socket.resTool.thinkingDefault", {}, this.messageBuilder.locale));
    }
    return this.thinkingStream;
  }

  private finishThinking() {
    if (this.thinkingStream) {
      this.thinkingStream.complete();
      this.thinkingStream = null;
    }
    this.inThinking = false;
  }
}

// 搜索内容流
class SearchStream extends ContentStream<SearchContent["data"]> {
  constructor(socket: Socket, messageId: string, contentId: string) {
    super(socket, messageId, contentId, "search");
  }

  // 添加引用
  addReference(ref: Exclude<SearchContent["data"]["references"], undefined>[0]) {
    this.socket.emit("content:update", {
      messageId: this.messageId,
      contentId: this.contentId,
      type: "search",
      data: { references: [ref] },
      strategy: "append",
      status: "streaming",
    });
    return this;
  }

  // 批量添加引用
  addReferences(refs: SearchContent["data"]["references"]) {
    this.socket.emit("content:update", {
      messageId: this.messageId,
      contentId: this.contentId,
      type: "search",
      data: { references: refs },
      strategy: "append",
      status: "streaming",
    });
    return this;
  }

  // 更新标题
  updateTitle(title: string) {
    this.socket.emit("content:update", {
      messageId: this.messageId,
      contentId: this.contentId,
      type: "search",
      data: { title },
      strategy: "merge",
      status: "streaming",
    });
    return this;
  }
}

// 工具调用流
class ToolCallStream extends ContentStream<ToolCallContent["data"]> {
  private toolCallId: string;

  constructor(socket: Socket, messageId: string, contentId: string, toolCallId: string) {
    super(socket, messageId, contentId, "toolcall");
    this.toolCallId = toolCallId;
  }

  // 追加参数块
  appendArgs(chunk: string) {
    this.socket.emit("content:update", {
      messageId: this.messageId,
      contentId: this.contentId,
      type: "toolcall",
      data: { toolCallId: this.toolCallId, args: chunk },
      strategy: "append",
      status: "streaming",
    });
    return this;
  }

  // 追加结果块
  appendResult(chunk: string) {
    this.socket.emit("content:update", {
      messageId: this.messageId,
      contentId: this.contentId,
      type: "toolcall",
      data: { toolCallId: this.toolCallId, chunk },
      strategy: "append",
      status: "streaming",
    });
    return this;
  }

  // 设置完整结果
  setResult(result: string) {
    this.socket.emit("content:update", {
      messageId: this.messageId,
      contentId: this.contentId,
      type: "toolcall",
      data: { toolCallId: this.toolCallId, result },
      strategy: "merge",
      status: "complete",
    });
    return this;
  }

  // 更新事件类型
  updateEventType(eventType: ToolCallContent["data"]["eventType"]) {
    this.socket.emit("content:update", {
      messageId: this.messageId,
      contentId: this.contentId,
      type: "toolcall",
      data: { toolCallId: this.toolCallId, eventType },
      strategy: "merge",
      status: "streaming",
    });
    return this;
  }
}

// 推理构建器
class ReasoningBuilder {
  private socket: Socket;
  private messageId: string;
  private contentId: string;

  constructor(socket: Socket, messageId: string, contentId: string) {
    this.socket = socket;
    this.messageId = messageId;
    this.contentId = contentId;
  }

  // 添加子内容
  addContent(content: AIMessageContent) {
    this.socket.emit("content:update", {
      messageId: this.messageId,
      contentId: this.contentId,
      type: "reasoning",
      data: [content],
      strategy: "append",
      status: "streaming",
    });
    return this;
  }

  // 完成推理
  complete() {
    this.socket.emit("content:update", {
      messageId: this.messageId,
      contentId: this.contentId,
      type: "reasoning",
      status: "complete",
    });
    return this;
  }
}

export default ResTool;
export { MessageBuilder, ContentStream, ThinkingStream, SearchStream, ToolCallStream, ReasoningBuilder };
