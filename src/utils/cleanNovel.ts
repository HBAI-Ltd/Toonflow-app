import { EventEmitter } from "events";
import { o_novel } from "@/types/database";
import u from "@/utils";
import { stripThink } from "@/utils/stripThink";
import { recordGenerationArtifact } from "@/utils/contentAudit";
import { recordPromptUsage, resolveFunctionPrompt } from "@/utils/promptCenter";
export interface EventType {
  id: number;
  event: string;
}

/*  文本数据清洗
 * @param textData 需要清洗的文本
 * @param windowSize 每组数量 默认5
 * @param overlap 交叠数量 默认1
 * @returns {totalCharacter:所有人物角色卡,totalEvent:所有事件}
 */

class CleanNovel {
  emitter: EventEmitter;
  /** 最大并发数 */
  concurrency: number;

  constructor(concurrency: number = 5) {
    this.emitter = new EventEmitter();
    this.concurrency = concurrency;
  }

  private async processChapter(novel: o_novel, projectId: number): Promise<EventType | null> {
    try {
      const chapterOrder = novel.chapterOrder ?? novel.chapterIndex ?? "";
      const sectionOrder = novel.sectionOrder ?? 0;
      const prompt = await u.getPrompts("event");
      const eventExtraction = await resolveFunctionPrompt("eventExtraction");
      const modelName = await u.Ai.resolveModelName("universalAi").catch(() => "universalAi");
      const promptUsageId = await recordPromptUsage({
        effectivePrompt: eventExtraction,
        modelName,
        relatedType: "novel:eventExtraction",
        relatedId: novel.id,
        meta: { projectId, chapterIndex: novel.chapterIndex, chapterOrder, sectionOrder },
      });
      const resData = await u.Ai.Text("universalAi").invoke({
        system: eventExtraction.content ? JSON.stringify(eventExtraction.content) : (prompt as string),
        messages: [
          {
            role: "user",
            content:
              "请根据以下小说章节数：" +
              chapterOrder +
              "小说章节券：" +
              novel.reel +
              "小说章节名称：" +
              novel.chapter +
              "小说小节名称：" +
              (novel.section || "") +
              "、小说章节内容生成事件摘要：\n" +
              novel.chapterData!,
          },
        ],
      });
      const preData = stripThink(resData.text);
      await recordGenerationArtifact({
        projectId,
        artifactType: "event",
        targetType: "o_novel",
        targetId: novel.id!,
        targetField: "event",
        title: `第${chapterOrder}章第${sectionOrder}节事件`,
        content: preData,
        effectivePrompt: eventExtraction,
        promptUsageId,
        modelName,
        meta: { chapterIndex: novel.chapterIndex, chapterOrder, sectionOrder, chapter: novel.chapter, section: novel.section },
      });
      this.emitter.emit("item", { id: novel.id, event: preData });
      return { id: novel.id!, event: preData };
    } catch (e) {
      this.emitter.emit("item", { id: novel.id, event: null, errorReason: u.error(e).message });
      return null;
    }
  }

  async start(allChapters: o_novel[], projectId: number): Promise<EventType[]> {
    const totalEvent: EventType[] = [];

    // 并发控制：通过信号量限制同时执行的任务数
    let running = 0;
    let index = 0;
    const results: Promise<void>[] = [];

    const runNext = (): Promise<void> => {
      if (index >= allChapters.length) return Promise.resolve();
      const novel = allChapters[index++];
      running++;

      return this.processChapter(novel, projectId).then((result) => {
        if (result) totalEvent.push(result);
        running--;
        return runNext();
      });
    };

    // 启动最多 concurrency 个并发任务
    const workers = Array.from({ length: Math.min(this.concurrency, allChapters.length) }, () => runNext());

    await Promise.all(workers);

    return totalEvent;
  }
}

export default CleanNovel;
