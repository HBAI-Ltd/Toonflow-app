import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import type { GLTF } from "three/addons/loaders/GLTFLoader.js";
import type { LoadingManager } from "three";
import { validateModel } from "./assetLibrary";
import { disposeObject } from "./sceneResources";

const convertedModels = new WeakMap<ArrayBuffer, Promise<ArrayBuffer>>();

function usesSpecularGlossiness(content: ArrayBuffer) {
  const view = new DataView(content);
  const document = JSON.parse(new TextDecoder().decode(new Uint8Array(content, 20, view.getUint32(12, true)))) as { extensionsUsed?: string[] };
  return !!document.extensionsUsed?.includes("KHR_materials_pbrSpecularGlossiness");
}

async function convertSpecularGlossiness(content: ArrayBuffer): Promise<ArrayBuffer> {
  const [{ WebIO }, { ALL_EXTENSIONS }, { metalRough }] = await Promise.all([
    import("@gltf-transform/core"), import("@gltf-transform/extensions"), import("@gltf-transform/functions"),
  ]);
  // 所有URI已由validateModel限制为内嵌资源；WebIO只读取内存，不会请求模型外的纹理或buffer。
  const io = new WebIO({ credentials: "omit", referrerPolicy: "no-referrer" }).registerExtensions(ALL_EXTENSIONS);
  const document = await io.readBinary(new Uint8Array(content));
  await document.transform(metalRough());
  const converted = await io.writeBinary(document);
  const result = converted.buffer.slice(converted.byteOffset, converted.byteOffset + converted.byteLength);
  validateModel(result);
  return result;
}

function renderBuffer(content: ArrayBuffer) {
  if (!usesSpecularGlossiness(content)) return Promise.resolve(content);
  let pending = convertedModels.get(content);
  if (!pending) {
    // ACT: 只缓存仍被调用方持有的原buffer；保留真实源字节和哈希，临时转换不进入保存链路。
    pending = convertSpecularGlossiness(content).catch(error => { convertedModels.delete(content); throw error; });
    convertedModels.set(content, pending);
  }
  return pending;
}

export async function parseGltfModel(content: ArrayBuffer, manager?: LoadingManager, signal?: AbortSignal): Promise<GLTF> {
  signal?.throwIfAborted();
  validateModel(content);
  const bytes = await renderBuffer(content);
  signal?.throwIfAborted();
  const model = await new GLTFLoader(manager).parseAsync(bytes, "");
  if (signal?.aborted) {
    for (const scene of model.scenes) disposeObject(scene);
    signal.throwIfAborted();
  }
  return model;
}
