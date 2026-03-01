import u from "@/utils";
import { generateText, streamText, Output, stepCountIs, ModelMessage, LanguageModel, Tool, GenerateTextResult } from "ai";
import { wrapLanguageModel } from "ai";
import { devToolsMiddleware } from "@ai-sdk/devtools";
import { parse } from "best-effort-json-parser";
import { getModelList } from "./modelList";
import { z } from "zod";
import { OpenAIProvider } from "@ai-sdk/openai";
interface AIInput<T extends Record<string, z.ZodTypeAny> | undefined = undefined> {
  system?: string;
  tools?: Record<string, Tool>;
  maxStep?: number;
  output?: T;
  prompt?: string;
  messages?: Array<ModelMessage>;
}

interface AIConfig {
  model?: string;
  apiKey?: string;
  baseURL?: string;
  manufacturer?: string;
}

const buildOptions = async (input: AIInput<any>, config: AIConfig = {}) => {
  if (!config || !config?.model || !config?.apiKey || !config?.manufacturer) throw new Error("请检查模型配置是否正确");
  const { model, apiKey, baseURL, manufacturer } = { ...config };
  let owned;
  const modelList = await getModelList();
  if (manufacturer == "other") {
    owned = modelList.find((m) => m.manufacturer === manufacturer);
  } else {
    owned = modelList.find((m) => m.model === model && m.manufacturer === manufacturer);
    if (!owned) owned = modelList.find((m) => m.manufacturer === manufacturer);
  }
  if (!owned) throw new Error("不支持的厂商");

  const modelInstance = owned.instance({ apiKey, baseURL: baseURL!, name: "xixixi" });

  const maxStep = input.maxStep ?? (input.tools ? Object.keys(input.tools).length * 5 : undefined);
  const outputBuilders: Record<string, (schema: any) => any> = {
    schema: (s) => {
      return Output.object({ schema: z.object(s) });
    },
    object: () => {
      const jsonSchemaPrompt = `\n请按照以下 JSON Schema 格式返回结果:\n${JSON.stringify(
        z.toJSONSchema(z.object(input.output)),
        null,
        2,
      )}\n只返回结果，不要将Schema返回。`;
      input.system = (input.system ?? "") + jsonSchemaPrompt;
      // return Output.json();
    },
  };

  const output = input.output ? (outputBuilders[owned.responseFormat]?.(input.output) ?? null) : null;
  const chatModelManufacturer = ["volcengine", "other", "openai", "modelScope","grsai"];
  const modelFn = chatModelManufacturer.includes(owned.manufacturer) ? (modelInstance as OpenAIProvider).chat(model!) : modelInstance(model!);

  return {
    config: {
      model: modelFn as LanguageModel,
      ...(input.system && { system: input.system }),
      ...(input.prompt ? { prompt: input.prompt } : { messages: input.messages! }),
      ...(input.tools && owned.tool && { tools: input.tools }),
      ...(maxStep && { stopWhen: stepCountIs(maxStep) }),
      ...(output && { output }),
    },
    responseFormat: owned.responseFormat,
  };
};

type InferOutput<T> = T extends Record<string, z.ZodTypeAny> ? z.infer<z.ZodObject<T>> : GenerateTextResult<Record<string, Tool>, never>;

const ai = Object.create({}) as {
  invoke<T extends Record<string, z.ZodTypeAny> | undefined = undefined>(input: AIInput<T>, config?: AIConfig): Promise<InferOutput<T>>;
  stream(input: AIInput, config?: AIConfig): Promise<ReturnType<typeof streamText>>;
};

ai.invoke = async (input: AIInput<any>, config: AIConfig) => {
  const options = await buildOptions(input, config);

  const result = await generateText(options.config);
  if (options.responseFormat === "object" && input.output) {
    const pattern = /{[^{}]*}|{(?:[^{}]*|{[^{}]*})*}/g;
    const jsonLikeTexts = Array.from(result.text.matchAll(pattern), (m) => m[0]);

    const res = jsonLikeTexts.map((jsonText) => parse(jsonText));
    return res[0];
  }
  if (options.responseFormat === "schema" && input.output) {
    return JSON.parse(result.text);
  }
  return result;
};

ai.stream = async (input: AIInput, config: AIConfig) => {
  const options = await buildOptions(input, config);

  return streamText(options.config);
};

export default ai;
