import type { NodeMediaModel } from "@toonflow/nodes-scaffold/runtime";

export type DreamApiMediaReference = { path: string; mimeType: string };
export type DreamApiOperationRequest = {
  prompt?: string;
  inputs?: Record<string, DreamApiMediaReference[]>;
  other?: Record<string, unknown>;
  images?: DreamApiMediaReference[];
  videos?: DreamApiMediaReference[];
  audios?: DreamApiMediaReference[];
  firstFrame?: DreamApiMediaReference;
  lastFrame?: DreamApiMediaReference;
};

export function getDreamApiOptions(model: NodeMediaModel, storedInputs: Record<string, DreamApiMediaReference[]>, storedValues: Record<string, unknown>) {
  const generation = model.generation;
  if (!generation) return {};
  const inputs = Object.fromEntries((generation.inputs ?? []).flatMap(item => {
    const files = storedInputs[item.id];
    return files?.length ? [[item.id, files]] : [];
  }));
  const other = Object.fromEntries((generation.parameters ?? []).flatMap(item => {
    const value = Object.hasOwn(storedValues, item.id) ? storedValues[item.id] : item.defaultValue;
    return value === undefined ? [] : [[item.id, value]];
  }));
  return {
    ...(Object.keys(inputs).length ? { inputs } : {}),
    ...(Object.keys(other).length ? { other } : {}),
  };
}

export function matchesAcceptedMimeType(mimeType: string, accepted: string[] | undefined) {
  const normalized = mimeType.split(";")[0]!.trim().toLowerCase();
  if (!accepted?.length) return true;
  return accepted.some(item => {
    const type = item.toLowerCase();
    return type.endsWith("/*") ? normalized.startsWith(type.slice(0, -1)) : normalized === type;
  });
}

export function validateDreamApiGeneration(model: NodeMediaModel, prompt: string, request: DreamApiOperationRequest) {
  const generation = model.generation;
  if (!generation) return;
  if (generation.promptRequired !== false && !prompt.trim()) throw new Error("请输入生成提示词或待朗读文本");
  if (generation.promptMaxLength && prompt.length > generation.promptMaxLength) throw new Error(`提示词不能超过 ${generation.promptMaxLength} 个字符`);

  const fallbackInputs: Record<string, DreamApiMediaReference[] | undefined> = {
    images: request.images,
    videos: request.videos,
    audios: request.audios,
    firstFrame: request.firstFrame ? [request.firstFrame] : undefined,
    lastFrame: request.lastFrame ? [request.lastFrame] : undefined,
  };
  for (const definition of generation.inputs ?? []) {
    const fallback = fallbackInputs[definition.fallback ?? ""] ?? [];
    const fallbackReferences = definition.fallbackIndex === undefined
      ? fallback
      : fallback[definition.fallbackIndex] ? [fallback[definition.fallbackIndex]!] : [];
    const references = Object.hasOwn(request.inputs ?? {}, definition.id) ? request.inputs![definition.id]! : fallbackReferences;
    const minimum = definition.minItems ?? (definition.required ? 1 : 0);
    if (references.length < minimum) throw new Error(`素材输入“${definition.label}”至少需要 ${minimum} 个文件`);
    if (definition.maxItems !== undefined && references.length > definition.maxItems) throw new Error(`素材输入“${definition.label}”最多接受 ${definition.maxItems} 个文件`);
    if (references.some(item => !item.mimeType.toLowerCase().startsWith(`${definition.mediaType}/`) || !matchesAcceptedMimeType(item.mimeType, definition.accept))) {
      throw new Error(`素材输入“${definition.label}”的文件格式不受支持`);
    }
  }

  const parameters = request.other ?? {};
  const definitions = generation.parameters ?? [];
  const allowedParameters = new Set(definitions.map(item => item.id));
  if (Object.keys(parameters).some(key => !allowedParameters.has(key))) throw new Error("请求包含当前模型未声明的专属参数");
  for (const definition of definitions) {
    const value = Object.hasOwn(parameters, definition.id) ? parameters[definition.id] : definition.defaultValue;
    if (value === undefined || value === null || value === "") {
      if (definition.required) throw new Error(`模型参数“${definition.label}”为必填项`);
      continue;
    }
    if (definition.type === "string" && typeof value !== "string" || definition.type === "number" && (typeof value !== "number" || !Number.isFinite(value)) || definition.type === "boolean" && typeof value !== "boolean") {
      throw new Error(`模型参数“${definition.label}”的值类型不正确`);
    }
    if (typeof value === "string" && definition.required && !value.trim()) throw new Error(`模型参数“${definition.label}”不能为空`);
    if (typeof value === "number") {
      const stepOffset = value - (definition.min ?? 0);
      if (definition.min !== undefined && value < definition.min || definition.max !== undefined && value > definition.max
        || definition.step && Math.abs(stepOffset / definition.step - Math.round(stepOffset / definition.step)) > 1e-8) {
        throw new Error(`模型参数“${definition.label}”超出允许范围`);
      }
    }
    if (definition.options?.length && !definition.allowCustom && !definition.options.includes(value as string | number)) {
      throw new Error(`模型参数“${definition.label}”不在允许选项中`);
    }
  }
}
