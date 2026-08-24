import { EventEmitter } from "events";
import { o_novel } from "@/types/database";
import u from "@/utils";
import { stripThink } from "@/utils/stripThink";
import { t, getPromptLanguage } from "@/i18n";
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

  private async processChapter(novel: o_novel): Promise<EventType | null> {
    try {
      // system/content below go straight into u.Ai.Text().invoke() as the event-extraction
      // prompt — model-facing, so this resolves through prompt_language, not content_language.
      const locale = await getPromptLanguage();
      const prompt = await u.getPrompts("event");
      const promptData = await u.db("o_prompt").where("type", "eventExtraction").first();
      let eventExtraction = "" as string | undefined;
      if (promptData && promptData.useData) {
        eventExtraction = promptData.useData;
      } else {
        eventExtraction = promptData?.data ?? undefined;
      }
      const resData = await u.Ai.Text("universalAi").invoke({
        system: eventExtraction ? JSON.stringify(eventExtraction) : (prompt as string),
        messages: [
          {
            role: "user",
            content: t(
              "agent.eventExtraction.userPrompt",
              {
                chapterIndex: novel.chapterIndex as unknown as string,
                reel: novel.reel as unknown as string,
                chapter: novel.chapter as unknown as string,
                chapterData: novel.chapterData!,
              },
              locale,
            ),
          },
        ],
      });
      const preData = stripThink(resData.text);
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

      return this.processChapter(novel).then((result) => {
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
