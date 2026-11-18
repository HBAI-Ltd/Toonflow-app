import { Group, InstancedBufferAttribute, InstancedMesh, Matrix4, Mesh, MeshDepthMaterial, MeshStandardMaterial } from "three";
import type { Material, Object3D, Scene, Vector3 } from "three";
import { createMergedProxy, disposeMergedProxy } from "./staticMergedProxy";

type Member = { root: Object3D; parts: Mesh[]; wind?: Vector3; active: boolean; last: Matrix4 };
type Cluster = { members: Member[]; draws: InstancedMesh[]; windMaterials: Map<Material, Material>; dirty: boolean };
type Bucket = { roots: Set<Object3D>; cluster?: Cluster };

export function createStaticSceneBatches(scene: Scene, objects: Group) {
  const layer = new Group();
  layer.name = "staticSceneBatches";
  layer.visible = false;
  scene.add(layer);
  const registered = new WeakMap<Object3D, string>();
  const buckets = new Map<string, Bucket>();
  const changed = new Set<Bucket>();
  const profiles = new WeakMap<Object3D, Vector3>();
  const weatherSources = new Set<Object3D>();
  const clusters = new Set<Cluster>();
  const hidden = new Set<Object3D>();
  const remaining: Object3D[] = [];
  const matrix = new Matrix4();
  // 单个静态物件的合并代理（见 staticMergedProxy.ts）：没凑成同款批次的楼、导入 GLB 也只画几次。null = 不能合并。
  const solos = new Map<Object3D, Group | null>();
  const soloQueue = new Set<Object3D>();
  const soloHidden = new Set<Object3D>();

  function removeSolo(root: Object3D) {
    const proxy = solos.get(root);
    if (proxy) disposeMergedProxy(proxy);
    solos.delete(root);
    soloQueue.delete(root);
    soloHidden.delete(root);
  }
  /** 合并有成本（一栋楼几毫秒）：每帧在预算内做几个，没做完的下帧继续，载入大场景不一下卡住。 */
  function buildSolos(excluded: (id: string) => boolean) {
    const started = performance.now();
    for (const root of soloQueue) {
      if (performance.now() - started > 4) break;
      // 正在拖、正在编辑的先不合并，等它停下再说。
      if (excluded(root.userData.sceneObjectId)) continue;
      soloQueue.delete(root);
      const proxy = createMergedProxy(root) ?? null;
      solos.set(root, proxy);
      if (proxy) layer.add(proxy);
    }
  }

  function clearBucket(bucket: Bucket) {
    const cluster = bucket.cluster;
    if (!cluster) return;
    for (const draw of cluster.draws) {
      draw.removeFromParent();
      draw.dispose();
      if (cluster.members[0]?.wind) draw.geometry.dispose();
    }
    for (const material of cluster.windMaterials.values()) material.dispose();
    for (const { root } of cluster.members) hidden.delete(root);
    weatherSources.delete(cluster.members[0]!.root);
    clusters.delete(cluster);
    bucket.cluster = undefined;
  }

  function windMaterial<T extends Material>(source: T, cache: Map<Material, Material>): T {
    const cached = cache.get(source);
    if (cached) return cached as T;
    const copy = source.clone();
    copy.defines = { ...source.defines, sceneBatchUsesWind: 1 };
    copy.onBeforeCompile = source.onBeforeCompile;
    copy.customProgramCacheKey = () => source.customProgramCacheKey() + "/sceneBatchWind";
    cache.set(source, copy);
    return copy;
  }

  function partsOf(root: Object3D) {
    const parts: Mesh[] = [];
    let valid = true;
    root.traverse(object => {
      if (object.animations.length) valid = false;
      if (!(object instanceof Mesh)) return;
      const material = object.material;
      if (!(material instanceof MeshStandardMaterial) || material.transparent || material.opacity !== 1 || !material.visible
        || (profiles.has(root) ? !(object.customDepthMaterial instanceof MeshDepthMaterial) : !!object.customDepthMaterial)
        || object.morphTargetInfluences || "isSkinnedMesh" in object
        || object instanceof InstancedMesh && (object.instanceColor || object.morphTexture)) valid = false;
      parts.push(object);
    });
    return valid ? parts : [];
  }

  function build(ready: boolean) {
    for (const bucket of changed) {
      const batchedCount = bucket.cluster?.members.length ?? 0;
      // 载入大场景时逐块接管已就绪的物件，每帧至多重建一个分区，避免首批几百棵一直走单独绘制。
      if (!ready && bucket.roots.size - batchedCount < Math.max(12, batchedCount * 0.25)) continue;
      changed.delete(bucket);
      clearBucket(bucket);
      if (bucket.roots.size < 3) continue;
      const members = Array.from(bucket.roots, root => ({ root, parts: partsOf(root), wind: profiles.get(root), active: false, last: new Matrix4() }));
      const first = members[0]!.parts;
      if (!first.length || members.some(member => member.parts.length !== first.length)) continue;
      const wind = members[0]!.wind;
      const windMaterials = new Map<Material, Material>();
      if (wind) weatherSources.add(members[0]!.root);
      const draws = first.map(part => {
        const count = part instanceof InstancedMesh ? part.count : 1;
        const capacity = count * members.length;
        const geometry = wind ? part.geometry.clone() : part.geometry;
        const material = part.material as MeshStandardMaterial;
        const draw = new InstancedMesh(geometry, wind ? windMaterial(material, windMaterials) : material, capacity);
        if (wind) {
          geometry.setAttribute("sceneBatchWind", new InstancedBufferAttribute(new Float32Array(capacity * 3), 3));
          draw.customDepthMaterial = windMaterial(part.customDepthMaterial!, windMaterials);
          draw.onBeforeRender = () => { draw.material.roughness = material.roughness; };
        }
        draw.count = 0;
        draw.castShadow = part.castShadow;
        draw.receiveShadow = part.receiveShadow;
        layer.add(draw);
        return draw;
      });
      bucket.cluster = { members, draws, windMaterials, dirty: true };
      clusters.add(bucket.cluster);
      if (!ready) break;
    }
  }

  /**
   * soloExcluded：合并代理的排除条件。能合并的物件没有骨骼和自带动画，演绎只会整体移动它的根节点，代理每帧跟着根矩阵走，
   * 所以演员不必排除（整条街编进一个物体组跟着动线走时，原来整条街都退回逐部件绘制）。
   */
  function render(ready: boolean, excluded: (id: string) => boolean, drawScene: () => void, soloExcluded = excluded) {
    if (changed.size) build(ready);
    if (soloQueue.size) buildSolos(soloExcluded);
    if (!clusters.size && !solos.size) { drawScene(); return; }
    for (const cluster of clusters) {
      for (const member of cluster.members) {
        const root = member.root;
        const scale = root.scale;
        // 外层非均匀缩放与局部旋转可能产生剪切，Three 的实例法线只支持无剪切变换。
        const active = root.visible && scale.x > 0 && scale.x === scale.y && scale.y === scale.z && !excluded(root.userData.sceneObjectId);
        if (active !== member.active) {
          cluster.dirty = true;
          member.active = active;
          if (active) hidden.add(root);
          else hidden.delete(root);
        }
        if (active) {
          root.updateWorldMatrix(true, false);
          if (!member.last.equals(root.matrixWorld)) cluster.dirty = true;
        }
      }
      if (!cluster.dirty) continue;
      let windMargin = 0;
      for (const draw of cluster.draws) draw.count = 0;
      for (const member of cluster.members) {
        if (!member.active) continue;
        member.root.updateWorldMatrix(false, true);
        member.last.copy(member.root.matrixWorld);
        if (member.wind) windMargin = Math.max(windMargin, member.wind.y * 0.11);
        member.parts.forEach((part, index) => {
          const draw = cluster.draws[index]!;
          const begin = draw.count;
          if (part instanceof InstancedMesh) {
            for (let i = 0; i < part.count; i++) {
              part.getMatrixAt(i, matrix);
              draw.setMatrixAt(draw.count++, matrix.premultiply(part.matrixWorld));
            }
          } else draw.setMatrixAt(draw.count++, part.matrixWorld);
          if (member.wind) {
            const attribute = draw.geometry.getAttribute("sceneBatchWind");
            for (let i = begin; i < draw.count; i++) attribute.setXYZ(i, member.wind.x, member.wind.y, member.wind.z);
          }
        });
      }
      for (const draw of cluster.draws) {
        draw.visible = draw.count > 0;
        if (!draw.visible) continue;
        draw.instanceMatrix.needsUpdate = true;
        draw.computeBoundingSphere();
        const wind = draw.geometry.getAttribute("sceneBatchWind");
        if (wind) { wind.needsUpdate = true; draw.boundingSphere!.radius += windMargin; }
      }
      cluster.dirty = false;
    }
    for (const [root, proxy] of solos) {
      if (!proxy) continue;
      // 被同款批次接管的、被选中/拖动/演绎中的、被挂到别处的，照旧画原件。
      const active = root.visible && root.parent === objects && !hidden.has(root) && !soloExcluded(root.userData.sceneObjectId);
      proxy.visible = active;
      if (!active) { soloHidden.delete(root); continue; }
      soloHidden.add(root);
      root.updateWorldMatrix(true, false);
      if (!proxy.matrix.equals(root.matrixWorld)) {
        proxy.matrix.copy(root.matrixWorld);
        proxy.matrixWorldNeedsUpdate = true;
        // 原件不再随渲染遍历更新矩阵；物件移动（动线、重力、拖动）时顺带更新部件矩阵，拾取、碰撞读到的才是当前位置。
        root.updateWorldMatrix(false, true);
      }
    }
    // 只替换同步绘制时的遍历列表，避免原网格重复遍历/提交。拾取、碰撞、导航和编辑读原模型。
    const original = objects.children;
    remaining.length = 0;
    for (const child of original) if (!hidden.has(child) && !soloHidden.has(child)) remaining.push(child);
    objects.children = remaining;
    layer.visible = true;
    try { drawScene(); }
    finally { objects.children = original; layer.visible = false; remaining.length = 0; }
  }
  function remove(root: Group) {
    removeSolo(root);
    const key = registered.get(root);
    if (key === undefined) return;
    const bucket = buckets.get(key)!;
    // 构造批次时可能复用此物件的材质；从视口销毁前，立即释放这一块并恢复其余原件。
    clearBucket(bucket);
    bucket.roots.delete(root);
    registered.delete(root);
    profiles.delete(root);
    if (bucket.roots.size) changed.add(bucket);
    else { buckets.delete(key); changed.delete(bucket); }
  }
  return {
    register(root: Group, key: string, wind?: Vector3) {
      remove(root);
      // 同款按空间分区；画笔在其他区域追加物件时，已有实例缓冲继续绘制。
      const span = wind ? 32 : 64;
      const cell = key + "/" + Math.floor(root.position.x / span) + "/" + Math.floor(root.position.z / span);
      const bucket = buckets.get(cell) ?? { roots: new Set<Object3D>() };
      buckets.set(cell, bucket);
      bucket.roots.add(root);
      registered.set(root, cell);
      if (wind) profiles.set(root, wind);
      changed.add(bucket);
    },
    /** 载入完成的静态物件登记合并代理（重新载入或删除时 remove 会一并释放）。 */
    registerSolo(root: Group) {
      removeSolo(root);
      soloQueue.add(root);
    },
    needsWind(root: Object3D) { return weatherSources.has(root); },
    remove,
    render,
    dispose() {
      for (const root of [...solos.keys()]) removeSolo(root);
      soloQueue.clear();
      for (const bucket of buckets.values()) clearBucket(bucket);
      buckets.clear();
      changed.clear();
      layer.removeFromParent();
    },
  };
}
