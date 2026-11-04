import { computed, watch, type Ref } from "vue";
import formCreate, { type Rule } from "@form-create/element-ui";
import { findNodeModel, type NodeMediaModel } from "@toonflow/nodes-scaffold/runtime";

export function useModelForm(data: Ref<{ model: string; other: Record<string, unknown> }>, model: Ref<NodeMediaModel | undefined>) {
  let previousModel = data.value.model;

  watch([() => data.value.model, model], ([modelKey, selectedModel]) => {
    const sameModel = selectedModel && findNodeModel([selectedModel], previousModel);
    const values = modelKey === previousModel || sameModel ? data.value.other : {};
    previousModel = modelKey;
    if (!selectedModel) {
      if (values !== data.value.other) data.value.other = values;
      return;
    }
    data.value.other = getModelFormValues(selectedModel, values);
  }, { immediate: true, flush: "sync" });
}

export function getModelFormValues(model: NodeMediaModel, values: Record<string, unknown>, updates: Record<string, unknown> = {}) {
  const fields = new Map<string, unknown>();
  collectFields(formCreate.copyRules(model.rules ?? []), fields);
  for (const field of Object.keys(updates)) {
    if (!fields.has(field)) throw new Error(`当前模型不支持自定义配置 ${field}，请查看 getConfig 返回的模型 rules`);
  }
  const nextValues = { ...values, ...updates };
  return Object.fromEntries([...fields].map(([field, value]) => [field, Object.hasOwn(nextValues, field) ? nextValues[field] : value]));
}

export function useImageModelForm(data: Ref<{ model: string; other: Record<string, unknown>; size: string; ratio: string }>, model: Ref<NodeMediaModel | undefined>) {
  useModelForm(data, model);
  const sizeOptions = computed(() => model.value?.imageSizes?.length ? model.value.imageSizes : ["2K"]);
  const ratioOptions = computed(() => model.value?.imageRatios?.length ? model.value.imageRatios : ["16:9"]);
  watch(model, choice => {
    if (!choice) return;
    // ACT: 现有分辨率使用 K 单位；出现其他单位时再统一换算，未知名称排在数值选项之后。
    if (!sizeOptions.value.includes(data.value.size)) data.value.size = sizeOptions.value.toSorted((left, right) =>
      (Number.parseFloat(left) || Infinity) - (Number.parseFloat(right) || Infinity)
    )[0]!;
    if (!ratioOptions.value.includes(data.value.ratio)) data.value.ratio = ratioOptions.value.includes("16:9") ? "16:9" : ratioOptions.value[0]!;
  }, { flush: "sync" });
  return { sizeOptions, ratioOptions };
}

function collectFields(rules: unknown, fields: Map<string, unknown>) {
  if (!Array.isArray(rules)) return;
  for (const rule of rules) {
    if (!rule || typeof rule !== "object") continue;
    const item = rule as Rule;
    if (typeof item.field === "string") fields.set(item.field, item.value);
    collectFields(item.children, fields);
    if (Array.isArray(item.control)) {
      for (const control of item.control) collectFields(control?.rule, fields);
    }
  }
}
