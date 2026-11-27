import { onScopeDispose, provide, shallowRef } from "vue";
import { getQuoteTotal } from "@toonflow/providers";
import type { ConfirmMediaCost } from "@toonflow/node-shared/useNodeGeneration";
import { getMediaCostReminder, saveMediaCostReminder } from "@/stores/settings";

type Reminder = ReturnType<typeof getMediaCostReminder>;
type CostPrompt = {
  key: number;
  props: Parameters<ConfirmMediaCost>[0] & { estimatedPrice: string; reminderAmount: number; saveAmount: (amount: number) => Promise<void> };
  setVisible: (visible: boolean) => void;
  confirm: (skipReminder: boolean) => void;
};

export function useMediaCostReminder() {
  const prompt = shallowRef<CostPrompt>();
  const lifetime = new AbortController();
  let sequence = 0;
  let queue = Promise.resolve();
  onScopeDispose(() => lifetime.abort());

  const reminderEnabled = (providerId: string) => getMediaCostReminder(providerId).remindersEnabled;
  provide("mediaCostReminderEnabled", reminderEnabled);

  const confirmMediaCost: ConfirmMediaCost = async (request, getQuote, nodeSignal) => {
    const signal = AbortSignal.any([nodeSignal, lifetime.signal]);
    if (signal.aborted) return false;
    if (!reminderEnabled(request.providerId)) return true;
    const quote = await getQuote(signal).catch(() => null);
    if (signal.aborted) return false;
    if (!quote) return true;
    const estimatedPrice = quote.price;
    const total = quote.totalAmount ?? getQuoteTotal(estimatedPrice, quote.tips);
    if (total === undefined || !Number.isFinite(total)) return true;
    const needsPrompt = (reminder: Reminder) => reminder.remindersEnabled && total > reminder.reminderAmount;
    if (!needsPrompt(getMediaCostReminder(request.providerId))) return true;

    const decision = Promise.withResolvers<boolean | null>();
    const result = Promise.withResolvers<boolean>();
    function cancel() {
      decision.resolve(null);
      result.resolve(false);
    }
    signal.addEventListener("abort", cancel, { once: true });

    async function ask() {
      if (signal.aborted) return false;
      // 前一个确认可能已保存同一供应商的新提醒值。
      const reminder = getMediaCostReminder(request.providerId);
      if (!needsPrompt(reminder)) return true;
      prompt.value = {
        key: ++sequence,
        props: {
          ...request, estimatedPrice, reminderAmount: reminder.reminderAmount,
          saveAmount: amount => saveMediaCostReminder(request.providerId, { ...getMediaCostReminder(request.providerId), reminderAmount: amount }),
        },
        setVisible: visible => { if (!visible) decision.resolve(null); },
        confirm: decision.resolve,
      };
      const skipReminder = await decision.promise;
      prompt.value = undefined;
      if (skipReminder === null || signal.aborted) return false;
      if (skipReminder) {
        await saveMediaCostReminder(request.providerId, { ...getMediaCostReminder(request.providerId), remindersEnabled: false });
      }
      return !signal.aborted;
    }
    queue = queue.then(ask).then(result.resolve, result.reject).finally(() => signal.removeEventListener("abort", cancel));
    return result.promise;
  };
  provide("confirmMediaCost", confirmMediaCost);
  return prompt;
}
