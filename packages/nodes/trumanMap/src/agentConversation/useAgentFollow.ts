import { nextTick, onMounted, ref, watch } from "vue";
import type { AgentMessage } from "../agentConversation";

/**
 * 宿主对话的贴底跟随：只有读者原本在底部时才自动滚动；
 * 新消息强制回到底部，向上阅读时保留位置并显示“回到最新消息”。
 */
export function useAgentFollow(getMessages: () => AgentMessage[]) {
  const list = ref<HTMLElement>();
  const following = ref(true);

  function readFollowing() {
    const element = list.value;
    if (!element) return;
    following.value = element.scrollHeight - element.scrollTop - element.clientHeight < 48;
  }

  function scrollToLatest(smooth = false) {
    const element = list.value;
    if (!element) return;
    element.scrollTo({ top: element.scrollHeight, behavior: smooth ? "smooth" : "auto" });
    following.value = true;
  }

  watch(() => getMessages().length, async () => {
    following.value = true;
    await nextTick();
    scrollToLatest();
  });
  watch(() => getMessages(), async () => {
    if (!following.value) return;
    await nextTick();
    scrollToLatest();
  }, { deep: true });
  onMounted(async () => { await nextTick(); scrollToLatest(); });

  return { list, following, readFollowing, scrollToLatest };
}
