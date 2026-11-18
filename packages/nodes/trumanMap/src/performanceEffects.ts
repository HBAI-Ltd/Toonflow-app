import {
  Box3, Color, Euler, Float32BufferAttribute, Group, InstancedBufferAttribute, InstancedBufferGeometry,
  InstancedMesh, Matrix4, Mesh, PlaneGeometry, PointLight, Quaternion, ShaderMaterial, Vector3,
} from "three";
import type { Material, Object3D, Scene } from "three";
import type { PerformanceEffectClip } from "./performanceClips";

export type PerformanceEffectSample = {
  key: string;
  source: Object3D;
  clip: PerformanceEffectClip;
  time: number;
  origin?: Matrix4;
  ground?: (x: number, z: number) => number;
  revision?: string;
};
type EffectPart = { id: string; name: string; mesh: Mesh; instance?: number };
type FlyingPart = EffectPart & { fragment: Mesh; local: Matrix4; instanceMatrix?: Matrix4; mask: number; visible: boolean; seed: number };
type EffectRecord = { source: Object3D; signature: string; root: Group; particles: Mesh<InstancedBufferGeometry, ShaderMaterial>; parts: FlyingPart[]; bounds: Box3; origin: Matrix4; lastSample: string; lastWorld: Matrix4; lastOrigin: Matrix4 };

function collectParts(source: Object3D) {
  const parts: EffectPart[] = [];
  function visit(node: Object3D, path: string) {
    if (node instanceof Mesh && !("isSkinnedMesh" in node) && node.geometry.getAttribute("position")) {
      if (node instanceof InstancedMesh) {
        const names: unknown = node.userData.toonflowPartNames;
        for (let index = 0; index < node.count; index++) parts.push({ id: path + "@" + index, name: Array.isArray(names) && typeof names[index] === "string" ? names[index] : node.name || "实例部件", mesh: node, instance: index });
      } else parts.push({ id: path, name: node.name || "部件", mesh: node });
    }
    node.children.forEach((child, index) => visit(child, path + "/" + index));
  }
  visit(source, "node");
  return parts;
}
function partVisible(mesh: Object3D, source: Object3D) {
  let node: Object3D | null = mesh;
  while (node) { if (!node.visible) return false; if (node === source) return true; node = node.parent; }
  return false;
}

export function getPerformanceEffectParts(source: Object3D): { id: string; name: string }[] {
  // ACT: 索引绑定真实模型子节点及实例槽，不依赖可能重名或被GLTF净化的部件名称。
  return collectParts(source).slice(0, 256).map(({ id, name, instance }) => ({ id, name: name + (instance === undefined ? "" : " · " + (instance + 1)) }));
}

const vertexShader = `
  attribute vec4 particleSeed;
  uniform float effectTime;
  uniform float effectKind;
  uniform float intensity;
  uniform float seedOffset;
  uniform vec3 volume;
  varying vec2 spriteUv;
  varying float particleAge;
  varying float smokeParticle;
  varying float particleOpacity;
  varying float randomValue;
  void main() {
    vec4 s = fract(particleSeed + vec4(seedOffset, seedOffset * 0.73, seedOffset * 0.31, seedOffset * 0.51));
    float smoke = effectKind > 0.5 && effectKind < 1.5 ? 1.0 : step(0.63, s.w);
    float life = mix(0.7 + s.z * 0.9, 2.0 + s.z * 3.0, smoke);
    float age = fract(effectTime / life + s.x);
    float a = s.y * 6.2831853;
    float spread = sqrt(s.z);
    vec3 center = vec3(cos(a) * volume.x, 0.0, sin(a) * volume.z) * spread;
    float size;
    float opacity = 1.0;
    if (effectKind > 1.5) {
      float t = max(0.0, effectTime);
      float burst = 1.0 - exp(-t * 2.1);
      vec3 direction = normalize(vec3(cos(a) * (0.4 + s.z), 0.25 + s.x, sin(a) * (0.4 + s.z)));
      center = direction * burst * (1.0 + s.z * 1.8) * max(volume.x, volume.z) * (0.7 + intensity * 0.4);
      center.y += smoke * t * volume.y * 0.28;
      age = clamp(t / mix(1.0, 5.5, smoke), 0.0, 1.0);
      size = mix(0.9, 1.6, smoke) * (0.3 + burst) * max(volume.x, volume.z) * (0.6 + s.y * 0.7);
      opacity = smoke > 0.5 ? exp(-t * 0.5) : exp(-t * 3.7);
    } else {
      center.xz *= 1.0 + smoke * age * 0.9;
      center.y += age * volume.y * mix(1.9, 3.4, smoke);
      center.x += sin(effectTime * 1.7 + s.y * 12.0 + age * 5.0) * volume.x * age * 0.35;
      center.z += cos(effectTime * 1.3 + s.x * 17.0) * volume.z * age * 0.25;
      size = max(volume.x, volume.z) * mix(0.8, 1.5, smoke) * (0.4 + s.z * 0.7) * mix(1.0 - age * 0.65, 0.5 + age, smoke);
      opacity = sin(age * 3.14159265) * mix(1.0, 0.46, smoke);
    }
    vec4 viewCenter = modelViewMatrix * vec4(center, 1.0);
    viewCenter.xy += position.xy * size;
    gl_Position = projectionMatrix * viewCenter;
    spriteUv = uv;
    particleAge = age;
    smokeParticle = smoke;
    particleOpacity = opacity;
    randomValue = s.y;
  }
`;
const fragmentShader = `
  uniform float effectTime;
  uniform float envelope;
  uniform float intensity;
  varying vec2 spriteUv;
  varying float particleAge;
  varying float smokeParticle;
  varying float particleOpacity;
  varying float randomValue;
  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y);
  }
  void main() {
    vec2 p = spriteUv * 2.0 - 1.0;
    float n = noise(spriteUv * 5.0 + vec2(randomValue * 30.0, -effectTime * 1.5));
    n += noise(spriteUv * 11.0 - vec2(effectTime * 0.6, effectTime * 2.0)) * 0.35;
    float edge = 1.0 - smoothstep(0.3, 1.0, length(p) + (n - 0.65) * 0.28);
    float alpha = edge * particleOpacity * envelope * min(1.0, intensity) * mix(0.78, 0.23, smokeParticle);
    if (alpha < 0.005) discard;
    float heat = clamp((1.0 - particleAge) * 0.7 + (1.0 - length(p)) * 0.5 + n * 0.15, 0.0, 1.0);
    vec3 fire = mix(vec3(0.65, 0.025, 0.002), vec3(1.8, 0.38, 0.025), smoothstep(0.1, 0.65, heat));
    fire = mix(fire, vec3(2.0, 1.35, 0.42), smoothstep(0.65, 1.0, heat));
    vec3 smoke = mix(vec3(0.055, 0.06, 0.067), vec3(0.28, 0.27, 0.25), n * 0.55 + particleAge * 0.2);
    gl_FragColor = vec4(mix(fire * (0.8 + intensity * 0.25), smoke, smokeParticle), alpha);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

function hashSeed(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index++) hash = Math.imul(hash ^ value.charCodeAt(index), 16777619);
  return (hash >>> 0) / 4294967296;
}
function cloneMaterial(material: Material | Material[]) { return Array.isArray(material) ? material.map(material => material.clone()) : material.clone(); }

export function createPerformanceEffects(scene: Scene) {
  const records = new Map<string, EffectRecord>();
  const warnings = new Map<string, string>();
  const layer = new Group();
  layer.name = "performanceEffects";
  scene.add(layer);
  const quad = new PlaneGeometry(1, 1);
  const geometry = new InstancedBufferGeometry();
  geometry.setIndex(quad.getIndex());
  geometry.setAttribute("position", new Float32BufferAttribute(quad.getAttribute("position").array.slice(), 3));
  geometry.setAttribute("uv", new Float32BufferAttribute(quad.getAttribute("uv").array.slice(), 2));
  const seeds = new Float32Array(160 * 4);
  for (let index = 0; index < seeds.length; index++) seeds[index] = hashSeed("particle" + index);
  geometry.setAttribute("particleSeed", new InstancedBufferAttribute(seeds, 4));
  geometry.instanceCount = 160;
  quad.dispose();
  // ACT: 效果共享一份160粒子的四边形缓冲及一盏无阴影火光，不引入体积流体或刚体引擎。
  const light = new PointLight("#ff9335", 0, 30, 2);
  layer.add(light);
  const inverse = new Matrix4();
  const matrix = new Matrix4();
  const zero = new Matrix4().makeScale(0, 0, 0);
  const localBounds = new Box3();
  const fragmentBounds = new Box3();
  const size = new Vector3();
  const center = new Vector3();
  const position = new Vector3();
  const scale = new Vector3();
  const spin = new Quaternion();
  const angles = new Euler();
  let disposed = false;

  function restoreParts(record: EffectRecord) {
    for (const part of record.parts) {
      if (part.instance !== undefined && part.mesh instanceof InstancedMesh && part.instanceMatrix) {
        part.mesh.setMatrixAt(part.instance, part.instanceMatrix);
        part.mesh.instanceMatrix.needsUpdate = true;
      } else part.mesh.layers.mask = part.mask;
      part.fragment.visible = false;
    }
  }
  function release(record: EffectRecord) {
    restoreParts(record);
    record.particles.material.dispose();
    for (const part of record.parts) for (const material of Array.isArray(part.fragment.material) ? part.fragment.material : [part.fragment.material]) material.dispose();
    // 源网格的几何/贴图仍由原模型管理，飞散副本只释放自己克隆的材质。
    record.root.removeFromParent();
  }
  function create(sample: PerformanceEffectSample): EffectRecord {
    const root = new Group();
    root.name = "effect:" + sample.key;
    const material = new ShaderMaterial({
      vertexShader, fragmentShader, transparent: true, depthWrite: false, toneMapped: false,
      uniforms: { effectTime: { value: 0 }, effectKind: { value: 0 }, intensity: { value: 1 }, seedOffset: { value: hashSeed(sample.key) }, volume: { value: new Vector3(1, 1, 1) }, envelope: { value: 0 } },
    });
    const particles = new Mesh(geometry, material);
    particles.frustumCulled = false;
    particles.renderOrder = 5;
    root.add(particles);
    sample.source.updateWorldMatrix(true, true);
    inverse.copy(sample.source.matrixWorld).invert();
    const bounds = new Box3();
    const available = collectParts(sample.source);
    const missing = sample.clip.parts?.filter(id => !available.some(part => part.id === id)) ?? [];
    if (missing.length) warnings.set(sample.key, "模型部件已变化，无法飞散，请重新选择真实部件：" + missing.join("、"));
    const parts: FlyingPart[] = [];
    for (const part of available) {
      part.mesh.updateWorldMatrix(true, false);
      const local = new Matrix4().multiplyMatrices(inverse, part.mesh.matrixWorld);
      let instanceMatrix: Matrix4 | undefined;
      if (part.instance !== undefined && part.mesh instanceof InstancedMesh) { instanceMatrix = new Matrix4(); part.mesh.getMatrixAt(part.instance, instanceMatrix); local.multiply(instanceMatrix); }
      part.mesh.geometry.computeBoundingBox();
      if (part.mesh.geometry.boundingBox) bounds.union(localBounds.copy(part.mesh.geometry.boundingBox).applyMatrix4(local));
      if (sample.clip.effect !== "explosion" || !sample.clip.parts?.includes(part.id)) continue;
      const fragment = new Mesh(part.mesh.geometry, cloneMaterial(part.mesh.material));
      fragment.layers.mask = part.mesh.layers.mask;
      if (part.mesh instanceof InstancedMesh && part.mesh.instanceColor && part.instance !== undefined) {
        const tint = new Color();
        part.mesh.getColorAt(part.instance, tint);
        for (const material of Array.isArray(fragment.material) ? fragment.material : [fragment.material]) if ("color" in material && material.color instanceof Color) material.color.multiply(tint);
      }
      fragment.castShadow = true;
      fragment.receiveShadow = true;
      fragment.visible = false;
      fragment.matrixAutoUpdate = false;
      root.add(fragment);
      parts.push({ ...part, fragment, local, instanceMatrix, mask: part.mesh.layers.mask, visible: partVisible(part.mesh, sample.source), seed: hashSeed(sample.key + part.id) });
    }
    if (bounds.isEmpty()) bounds.set(new Vector3(-0.5, 0, -0.5), new Vector3(0.5, 1, 0.5));
    layer.add(root);
    return { source: sample.source, signature: JSON.stringify([sample.clip.effect, sample.clip.parts, sample.revision ?? sample.source.children.map(child => child.uuid)]), root, particles, parts, bounds, origin: sample.source.matrixWorld.clone(), lastSample: "", lastWorld: new Matrix4(), lastOrigin: new Matrix4() };
  }
  function render(samples: readonly PerformanceEffectSample[]) {
    if (disposed) return false;
    const requested = new Set(samples.map(sample => sample.key));
    let changed = false;
    for (const [key, record] of records) {
      restoreParts(record);
      if (!requested.has(key)) { release(record); records.delete(key); warnings.delete(key); changed = true; }
    }
    for (const sample of samples) {
      const signature = JSON.stringify([sample.clip.effect, sample.clip.parts, sample.revision ?? sample.source.children.map(child => child.uuid)]);
      const record = records.get(sample.key);
      if (record && (record.source !== sample.source || record.signature !== signature)) { release(record); records.delete(sample.key); warnings.delete(sample.key); }
      if (!records.has(sample.key)) records.set(sample.key, create(sample));
    }
    let lightPower = 0;
    const lightPosition = new Vector3();
    const claimed = new Set<string>();
    for (const sample of [...samples].reverse()) {
      const record = records.get(sample.key)!;
      const { clip, time, source } = sample;
      source.updateWorldMatrix(true, false);
      const origin = sample.origin ?? record.origin;
      const sampleSignature = JSON.stringify([clip, time]);
      changed ||= sampleSignature !== record.lastSample || !record.lastWorld.equals(source.matrixWorld) || !record.lastOrigin.equals(origin);
      record.lastSample = sampleSignature;
      record.lastWorld.copy(source.matrixWorld);
      record.lastOrigin.copy(origin);
      const intensity = clip.intensity ?? 1;
      const explosion = clip.effect === "explosion";
      const elapsed = Math.max(0, time);
      const fade = Math.min(1, Math.max(0, (time - clip.sourceIn) / 0.12), Math.max(0, (clip.sourceOut - time) / 0.65));
      record.bounds.getSize(size).multiply(source.getWorldScale(scale));
      const volume = record.particles.material.uniforms.volume!.value as Vector3;
      volume.set(Math.max(0.3, Math.abs(size.x) * 0.4), Math.max(0.8, Math.abs(size.y)), Math.max(0.3, Math.abs(size.z) * 0.4));
      record.bounds.getCenter(center);
      center.y = record.bounds.min.y + record.bounds.getSize(size).y * 0.2;
      if (clip.offset) center.fromArray(clip.offset);
      record.particles.position.copy(center.applyMatrix4(source.matrixWorld));
      const uniforms = record.particles.material.uniforms;
      uniforms.effectTime!.value = elapsed;
      uniforms.effectKind!.value = clip.effect === "fire" ? 0 : clip.effect === "smoke" ? 1 : 2;
      uniforms.intensity!.value = intensity;
      uniforms.envelope!.value = fade;
      record.particles.visible = fade > 0;
      const power = clip.effect === "smoke" ? 0 : fade * intensity * (explosion ? Math.exp(-elapsed * 4) * 150 : 18 + Math.sin(elapsed * 17) * 3) * Math.max(1, volume.x * volume.z);
      if (power > lightPower) { lightPower = power; lightPosition.copy(record.particles.position); }
      const blast = record.bounds.getCenter(new Vector3()).applyMatrix4(origin);
      const travel = (1 - Math.exp(-elapsed * 1.15)) / 1.15;
      const spinTime = (1 - Math.exp(-elapsed * 1.3)) / 1.3;
      for (const part of record.parts) {
        if (!part.visible) { part.fragment.visible = false; continue; }
        const key = source.uuid + ":" + part.id;
        if (claimed.has(key)) { part.fragment.visible = false; continue; }
        claimed.add(key);
        if (part.instance !== undefined && part.mesh instanceof InstancedMesh) { part.mesh.setMatrixAt(part.instance, zero); part.mesh.instanceMatrix.needsUpdate = true; }
        else part.mesh.layers.mask = 0;
        matrix.multiplyMatrices(origin, part.local);
        localBounds.copy(part.mesh.geometry.boundingBox!).applyMatrix4(matrix).getCenter(center);
        position.copy(center).sub(blast);
        position.y = 0;
        if (position.lengthSq() < 0.01) position.set(Math.cos(part.seed * Math.PI * 2), 0, Math.sin(part.seed * Math.PI * 2));
        position.normalize().multiplyScalar((clip.strength ?? 7) * (0.65 + part.seed * 0.45) * travel);
        position.y = (clip.strength ?? 7) * (0.6 + part.seed * 0.6) * elapsed - 4.905 * elapsed * elapsed;
        spin.setFromEuler(angles.set((part.seed * 5 - 2) * spinTime, (part.seed * 8 - 3) * spinTime, (2 - part.seed * 6) * spinTime));
        matrix.premultiply(new Matrix4().makeTranslation(-center.x, -center.y, -center.z));
        matrix.premultiply(new Matrix4().makeRotationFromQuaternion(spin));
        matrix.premultiply(new Matrix4().makeTranslation(center.x + position.x, center.y + position.y, center.z + position.z));
        fragmentBounds.copy(part.mesh.geometry.boundingBox!).applyMatrix4(matrix);
        const x = (fragmentBounds.min.x + fragmentBounds.max.x) / 2;
        const z = (fragmentBounds.min.z + fragmentBounds.max.z) / 2;
        const floor = sample.ground?.(x, z) ?? record.bounds.min.y + origin.elements[13]!;
        if (fragmentBounds.min.y < floor) matrix.elements[13]! += floor - fragmentBounds.min.y;
        part.fragment.matrix.copy(matrix);
        part.fragment.matrixWorldNeedsUpdate = true;
        part.fragment.visible = true;
      }
    }
    light.position.copy(lightPosition);
    light.intensity = lightPower;
    light.distance = Math.max(12, Math.sqrt(lightPower) * 4);
    return changed;
  }
  function reset() {
    for (const record of records.values()) release(record);
    records.clear();
    warnings.clear();
    light.intensity = 0;
  }
  return { render, reset, getWarnings: (): ReadonlyMap<string, string> => warnings, dispose() { if (disposed) return; reset(); disposed = true; geometry.dispose(); layer.removeFromParent(); } };
}
