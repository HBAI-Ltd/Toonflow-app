import { z } from "@toonflow/nodes-scaffold/runtime";
import { Box3, Group, MathUtils, Vector3 } from "three";
import { resolveAssetModel } from "./assetModelResolver";
import { usesNativeScale } from "./assetLibrary";
import { getAssetPlacementScale } from "./assetMetadata";
import { createModelGroup, modelSchema, type ModelDefinition } from "./modelGeometry";
import { measureCollisionBounds } from "./sceneCollision";
import { disposeObject } from "./sceneResources";
import type { SceneAsset, SceneObject } from "./sceneDocument";

const identifier = z.string().trim().min(1).max(160);
const partPatchSchema = z.strictObject(Object.fromEntries(Object.entries(modelSchema.shape.parts.element.shape).map(([name, field]) => [
  name, field instanceof z.ZodDefault ? field.removeDefault().optional() : field.isOptional() ? field.nullable() : field.optional(),
]))).refine(value => Object.keys(value).length > 0, "部件修改不能为空");

export const readModelPartsSchema = z.strictObject({ id: identifier });
export const updateModelPartsSchema = z.strictObject({
  id: identifier,
  assetRevision: z.string().regex(/^[a-f\d]{64}$/),
  patches: z.array(z.strictObject({ partIndex: z.number().int().min(0).max(119), changes: partPatchSchema })).min(1).max(32),
}).refine(value => new Set(value.patches.map(patch => patch.partIndex)).size === value.patches.length, "同一批不能重复修改同一部件");

async function modelSource(object: SceneObject) {
  const source = resolveAssetModel(object.asset);
  if (!source) throw new Error("此资产没有可编辑的JSON部件定义；有Kiln来源时编辑真实源码，纯GLB不能凭空还原或重建整屋");
  const definition = modelSchema.parse(source);
  const bytes = new TextEncoder().encode(JSON.stringify([object.asset.id, object.asset.path, object.asset.sha256, object.asset.kiln, object.asset.normalize, object.asset.contentTransform, definition]));
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  const assetRevision = [...new Uint8Array(digest)].map(value => value.toString(16).padStart(2, "0")).join("");
  return { definition, assetRevision };
}

function modelLayout(asset: SceneAsset, definition: ModelDefinition) {
  const model = createModelGroup(definition);
  try {
    const bounds = measureCollisionBounds(model, new Box3());
    const center = bounds.getCenter(new Vector3());
    const effectiveContentTransform = asset.contentTransform ? structuredClone(asset.contentTransform) : {
      offset: { x: -center.x, y: -bounds.min.y, z: -center.z },
      scale: usesNativeScale(asset) ? 1 : getAssetPlacementScale(asset, bounds.getSize(new Vector3())),
    };
    const { offset, scale } = effectiveContentTransform;
    bounds.translate(new Vector3(offset.x, offset.y, offset.z));
    bounds.min.multiplyScalar(scale);
    bounds.max.multiplyScalar(scale);
    return { effectiveContentTransform, rootBounds: { min: bounds.min.toArray(), max: bounds.max.toArray(), size: bounds.getSize(new Vector3()).toArray() } };
  } finally { disposeObject(model); }
}

function placedModelBottom(definition: ModelDefinition, object: SceneObject, transform: NonNullable<SceneAsset["contentTransform"]>) {
  const model = createModelGroup(definition);
  const content = new Group();
  const root = new Group();
  content.add(model);
  root.add(content);
  try {
    model.position.set(transform.offset.x, transform.offset.y, transform.offset.z);
    content.scale.setScalar(transform.scale);
    root.position.set(object.position.x, object.position.y, object.position.z);
    root.rotation.set(MathUtils.degToRad(object.rotation.x), MathUtils.degToRad(object.rotation.y), MathUtils.degToRad(object.rotation.z));
    root.scale.set(object.scale.x, object.scale.y, object.scale.z);
    root.updateMatrixWorld(true);
    return measureCollisionBounds(root, new Box3()).min.y;
  } finally { disposeObject(root); }
}

export async function readModelParts(object: SceneObject) {
  const { definition, assetRevision } = await modelSource(object);
  return {
    objectId: object.id, assetId: object.asset.id, assetRevision, name: definition.name,
    contentTransform: object.asset.contentTransform ?? null,
    ...modelLayout(object.asset, definition),
    coordinateSpace: "parts保留模型定义原始局部坐标，rotation为XYZ角度；实际物件根坐标=(原坐标+effectiveContentTransform.offset)*scale。rootBounds含渲染根坐标min/max/size三个XYZ数组，单位米，transform.pivot使用此根坐标。partIndex只对本assetRevision有效，不能按重复名称猜部件。",
    parts: definition.parts.map((part, partIndex) => ({ partIndex, ...part })),
  };
}

export async function patchModelParts(object: SceneObject, input: z.infer<typeof updateModelPartsSchema>) {
  const { definition, assetRevision } = await modelSource(object);
  if (assetRevision !== input.assetRevision) throw new Error("模型部件修订已变化，请重新readModelParts后再修改");
  const patches = new Map(input.patches.map(patch => [patch.partIndex, patch.changes]));
  if (input.patches.some(patch => patch.partIndex >= definition.parts.length)) throw new Error("部件索引超出当前模型范围，请重新readModelParts");
  const next = modelSchema.parse({ ...definition, parts: definition.parts.map((part, index) => {
    const changes = patches.get(index);
    if (!changes) return part;
    const updated: Record<string, unknown> = { ...part, ...changes };
    for (const [name, value] of Object.entries(changes)) if (value === null) delete updated[name];
    return updated;
  }) });
  const changedParts = input.patches.filter(patch => JSON.stringify(definition.parts[patch.partIndex]) !== JSON.stringify(next.parts[patch.partIndex]))
    .map(patch => ({ partIndex: patch.partIndex, name: next.parts[patch.partIndex]!.name, fields: Object.keys(patch.changes) }));
  if (!changedParts.length) return { asset: object.asset, definition, summary: { objectId: object.id, assetId: object.asset.id, assetRevision, changed: false, changedParts, unchangedParts: definition.parts.length } };
  const { effectiveContentTransform: contentTransform } = modelLayout(object.asset, definition);
  const previousBottom = placedModelBottom(definition, object, contentTransform);
  const nextBottom = placedModelBottom(next, object, contentTransform);
  const height = nextBottom + (object.height === undefined ? 0 : object.height - previousBottom);
  // 局部修订保留作者与来源元数据，旧GLB和Kiln交付记录仍属于旧资产，不覆盖或删除。
  const { path, url, sha256, bytes, thumbnail, kiln, recipe, blueprint, shape, ...metadata } = object.asset;
  const asset: SceneAsset = { ...metadata, id: crypto.randomUUID(), kind: "model", model: next, normalize: false, contentTransform };
  return { asset, definition: next, height, summary: { objectId: object.id, assetId: asset.id, previousAssetRevision: assetRevision, changed: true, changedParts, unchangedParts: definition.parts.length - changedParts.length, height, heightMetadataUpdated: object.height !== height } };
}
