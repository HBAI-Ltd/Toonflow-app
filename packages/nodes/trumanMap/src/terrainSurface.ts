import { Box3, BufferGeometry, Color, ConeGeometry, CylinderGeometry, DoubleSide, DynamicDrawUsage, Float32BufferAttribute, Group, IcosahedronGeometry, InstancedBufferAttribute, InstancedMesh, Matrix4, Mesh, MeshDepthMaterial, MeshStandardMaterial, Quaternion, Ray, Raycaster, RGBADepthPacking, Sphere, Vector2, Vector3 } from "three";
import type { SceneTerrain, SceneWeather, Vector3Value } from "./sceneDocument";
import { getTerrainHeight, getTerrainTreePosition, getTerrainWaterLevel, terrainWaterColor } from "./terrainModel";
import { disposeObject } from "./sceneResources";
import { getWeatherEnvironment } from "./worldWeather";
import { createTerrainMaterial } from "./terrainMaterial";
import { getTerrainPaint } from "./terrainPaint";

function random(index: number, seed: number) { const value = Math.sin(index * 127.1 + seed * 0.17) * 43758.5453; return value - Math.floor(value); }

function grassPatch(x: number, z: number, seed: number) {
  const column = Math.floor(x / 6);
  const row = Math.floor(z / 6);
  const fx = x / 6 - column;
  const fz = z / 6 - row;
  const u = fx * fx * (3 - 2 * fx);
  const v = fz * fz * (3 - 2 * fz);
  const index = row * 317 + column * 173;
  const a = random(index, seed + 509);
  const b = random(index + 173, seed + 509);
  const c = random(index + 317, seed + 509);
  const d = random(index + 490, seed + 509);
  return (a + (b - a) * u) * (1 - v) + (c + (d - c) * u) * v;
}
type WaterPoint = { x: number; z: number; level: number; ground: number; flowX: number; flowZ: number; colorR: number; colorG: number; colorB: number };
export type TerrainTree = { index: number; position: Vector3Value; height: number; radius: number };
export type TerrainTreeHit = { tree: TerrainTree; point: Vector3Value; distance: number };

export function createTerrainSurface(initial: SceneTerrain) {
  const group = new Group();
  const width = initial.segments + 1;
  const vertexCount = width * width;
  // ACT: 同一分段数复用顶点和索引缓冲；世界尺寸切换分段数时由视口重建，笔刷不逐帧重建 GPU 几何。
  const positions = new Float32BufferAttribute(new Float32Array(vertexCount * 3), 3).setUsage(DynamicDrawUsage);
  const indices: number[] = [];
  for (let row = 0; row < initial.segments; row++) for (let column = 0; column < initial.segments; column++) {
    const a = row * width + column;
    const b = a + width;
    indices.push(a, b, a + 1, b, b + 1, a + 1);
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", positions);
  geometry.setIndex(indices);
  const terrainMaterial = createTerrainMaterial(initial);
  const ground = new Mesh(geometry, terrainMaterial.previewMaterial);
  ground.name = "terrainGround";
  ground.receiveShadow = true;
  ground.castShadow = true;
  const materialWarmupMesh = new Mesh(geometry, terrainMaterial.material);
  materialWarmupMesh.receiveShadow = ground.receiveShadow;
  materialWarmupMesh.castShadow = ground.castShadow;
  group.add(ground);
  const groundPickBounds = new Box3();
  const groundPickRay = new Ray();
  const groundPickInverse = new Matrix4();
  ground.raycast = (raycaster, hits) => {
    const bounds = geometry.boundingBox;
    if (!bounds || geometry.drawRange.start !== 0 || geometry.drawRange.count !== Infinity) {
      Mesh.prototype.raycast.call(ground, raycaster, hits);
      return;
    }
    groundPickRay.copy(raycaster.ray).applyMatrix4(groundPickInverse.copy(ground.matrixWorld).invert());
    // 区域边界取自当前 Float32 顶点。给边界留舍入余量，保留公共边和公共顶点上的全部交点。
    const padding = (bounds.max.x - bounds.min.x) * 1e-8;
    groundPickBounds.min.y = bounds.min.y - padding;
    groundPickBounds.max.y = bounds.max.y + padding;
    function visit(row: number, rowEnd: number, column: number, columnEnd: number) {
      groundPickBounds.min.setX(positions.getX(column) - padding).setZ(positions.getZ(row * width) - padding);
      groundPickBounds.max.setX(positions.getX(columnEnd) + padding).setZ(positions.getZ(rowEnd * width) + padding);
      if (!groundPickRay.intersectsBox(groundPickBounds)) return;
      if (rowEnd - row > 1) {
        const middle = Math.floor((row + rowEnd) / 2);
        visit(row, middle, column, columnEnd);
        visit(middle, rowEnd, column, columnEnd);
      } else if (columnEnd - column > 8) {
        const middle = Math.floor((column + columnEnd) / 2);
        visit(row, rowEnd, column, middle);
        visit(row, rowEnd, middle, columnEnd);
      } else {
        geometry.setDrawRange((row * initial.segments + column) * 6, (columnEnd - column) * 6);
        Mesh.prototype.raycast.call(ground, raycaster, hits);
      }
    }
    // 索引按行连续；仅在同步拾取期间缩小范围，由 Three 负责正反面、面编号、插值法线与远近裁切。
    try { visit(0, initial.segments, 0, initial.segments); }
    finally { geometry.setDrawRange(0, Infinity); }
  };
  function createWaterGeometry(capacity: number) {
    const geometry = new BufferGeometry<Record<string, Float32BufferAttribute>>();
    for (const [name, size] of Object.entries({ position: 3, normal: 3, waterShape: 3, waterFlow: 2, color: 3 })) {
      geometry.setAttribute(name, new Float32BufferAttribute(capacity * size, size).setUsage(DynamicDrawUsage));
    }
    geometry.setDrawRange(0, 0);
    geometry.boundingBox = new Box3();
    geometry.boundingSphere = new Sphere(new Vector3(), 0);
    return geometry;
  }
  const water = new Mesh(createWaterGeometry(0), new MeshStandardMaterial({ color: terrainWaterColor, vertexColors: true, roughness: 0.22, metalness: 0.12, transparent: true, opacity: 0.86, side: DoubleSide }));
  water.name = "terrainWater";
  water.receiveShadow = true;
  water.renderOrder = 1;
  water.visible = false;
  group.add(water);
  // ACT: 只在裁岸后的顶点数跨档时换整套几何，保留已写前缀；干地释放旧缓冲。
  function resizeWaterGeometry(capacity: number, written: number) {
    const previous = water.geometry;
    const next = createWaterGeometry(capacity);
    if (written) for (const [name, attr] of Object.entries(next.attributes)) {
      attr.array.set(previous.attributes[name]!.array.subarray(0, written * attr.itemSize));
    }
    previous.dispose();
    water.geometry = next;
  }
  const trunks = new InstancedMesh(new CylinderGeometry(0.13, 0.19, 1, 7, 4), new MeshStandardMaterial({ color: "#69503b", roughness: 1 }), 400);
  const foliage = new InstancedMesh(new ConeGeometry(0.85, 1.7, 7, 4), new MeshStandardMaterial({ color: "#365b39", roughness: 0.95 }), 800);
  const trunkBases = new InstancedBufferAttribute(new Float32Array(400), 1).setUsage(DynamicDrawUsage);
  const foliageBases = new InstancedBufferAttribute(new Float32Array(800), 1).setUsage(DynamicDrawUsage);
  trunks.geometry.setAttribute("treeBaseHeight", trunkBases);
  foliage.geometry.setAttribute("treeBaseHeight", foliageBases);
  const treeUniforms = { treeWeatherTime: { value: 0 }, treeWeatherWind: { value: new Vector2() } };
  const treeDepth = new MeshDepthMaterial({ depthPacking: RGBADepthPacking });
  function applyTreeWind(material: MeshStandardMaterial | MeshDepthMaterial, grass = false) {
    const heightAt = (value: string) => grass ? "max(position.y, 0.0) * length(instanceMatrix[1].xyz)" : `max((instanceMatrix * vec4(${value}, 1.0)).y - treeBaseHeight, 0.0)`;
    material.customProgramCacheKey = () => grass ? "terrainGrassWind1" : "terrainTreeWind1";
    material.onBeforeCompile = shader => {
      Object.assign(shader.uniforms, treeUniforms);
      shader.vertexShader = /* glsl */ `
        uniform float treeWeatherTime;
        uniform vec2 treeWeatherWind;
        attribute float treeBaseHeight;
        vec2 terrainTreeSway(vec2 origin) {
          float phase = origin.x * 0.29 + origin.y * 0.23;
          return treeWeatherWind * (0.65 + sin(treeWeatherTime * 1.9 + phase) * 0.3)
            + vec2(-treeWeatherWind.y, treeWeatherWind.x) * sin(treeWeatherTime * 2.7 + phase) * 0.12;
        }
      ` + shader.vertexShader;
      shader.vertexShader = shader.vertexShader.replace("#include <beginnormal_vertex>", /* glsl */ `
        #include <beginnormal_vertex>
        #ifdef USE_INSTANCING
          float treeNormalHeight = ${heightAt("position")};
          vec2 treeSlope = terrainTreeSway(instanceMatrix[3].xz) * treeNormalHeight * ${grass ? "0.1" : "0.0026"};
          vec3 treeNormal = transpose(inverse(mat3(instanceMatrix))) * objectNormal;
          treeNormal.y -= dot(treeSlope, treeNormal.xz);
          objectNormal = transpose(mat3(instanceMatrix)) * treeNormal;
        #endif
      `).replace("#include <begin_vertex>", /* glsl */ `
        #include <begin_vertex>
        #ifdef USE_INSTANCING
          float treeHeight = ${heightAt("transformed")};
          vec2 treeOffset = terrainTreeSway(instanceMatrix[3].xz) * treeHeight * treeHeight * ${grass ? "0.05" : "0.0013"};
          transformed += inverse(mat3(instanceMatrix)) * vec3(treeOffset.x, 0.0, treeOffset.y);
        #endif
      `);
    };
  }
  // ACT: 固定实例矩阵只在编辑地形时更新；可见材质与深度材质共享绝对时间和同一弯曲公式，树根位移始终为零。
  for (const mesh of [trunks, foliage]) {
    applyTreeWind(mesh.material);
    mesh.customDepthMaterial = treeDepth;
    mesh.frustumCulled = false;
  }
  applyTreeWind(treeDepth);
  const waterUniforms = {
    waterWeatherTime: { value: 0 }, waterWeatherFlow: { value: new Vector2(0.95448, 0.29828) },
    waterWeatherRipple: { value: new Vector2() }, waterWeatherSpeed: { value: 1 },
    waterWaveAxis: { value: new Vector2() }, waterWaveAmplitude: { value: new Vector3() },
  };
  water.material.customProgramCacheKey = () => "terrainWeatherWater4";
  water.material.onBeforeCompile = shader => {
    Object.assign(shader.uniforms, waterUniforms);
    // ACT: 拾取使用裁岸后的基准水面；GPU按同一波形修正顶点和法线，岸线位移为零。
    shader.vertexShader = /* glsl */ `
      attribute vec3 waterShape;
      attribute vec2 waterFlow;
      varying vec2 terrainWaterPosition;
      varying vec2 terrainWaterFlow;
      varying float terrainWaterBankFade;
      uniform float waterWeatherTime;
      uniform float waterWeatherSpeed;
      uniform vec2 waterWaveAxis;
      uniform vec3 waterWaveAmplitude;
    ` + shader.vertexShader;
    shader.vertexShader = shader.vertexShader.replace("#include <beginnormal_vertex>", /* glsl */ `
      #include <beginnormal_vertex>
      vec2 firstAxis = vec2(0.8, 0.25);
      vec3 phases = vec3(dot(position.xz, firstAxis), dot(position.xz, waterWaveAxis), (position.x + position.z) * 3.8)
        - waterWeatherTime * vec3(1.4, 0.85 * waterWeatherSpeed, 9.0);
      float wave = dot(sin(phases), waterWaveAmplitude);
      vec3 slopes = cos(phases) * waterWaveAmplitude;
      vec2 gradient = waterShape.x * (firstAxis * slopes.x + waterWaveAxis * slopes.y + vec2(3.8 * slopes.z)) + wave * waterShape.yz;
      objectNormal.xz -= objectNormal.y * gradient;
    `).replace("#include <begin_vertex>", /* glsl */ `
      #include <begin_vertex>
      transformed.y += wave * waterShape.x;
      terrainWaterPosition = (modelMatrix * vec4(transformed, 1.0)).xz;
      terrainWaterFlow = waterFlow;
      terrainWaterBankFade = waterShape.x;
    `);
    shader.fragmentShader = /* glsl */ `
      varying vec2 terrainWaterPosition;
      varying vec2 terrainWaterFlow;
      varying float terrainWaterBankFade;
      uniform float waterWeatherTime;
      uniform vec2 waterWeatherFlow;
      uniform vec2 waterWeatherRipple;
      uniform float waterWeatherSpeed;
    ` + shader.fragmentShader;
    shader.fragmentShader = shader.fragmentShader.replace("#include <normal_fragment_maps>", /* glsl */ `
      #include <normal_fragment_maps>
      vec2 waterCrossFlow = vec2(-waterWeatherFlow.y, waterWeatherFlow.x);
      float waterFinePhase = dot(terrainWaterPosition, waterWeatherFlow) * 7.0 - waterWeatherTime * waterWeatherSpeed * 5.0;
      float waterRainPhase = dot(terrainWaterPosition, waterCrossFlow) * 12.0 - waterWeatherTime * 17.0;
      vec2 waterFineSlope = waterWeatherFlow * cos(waterFinePhase) * waterWeatherRipple.x
        + waterCrossFlow * cos(waterRainPhase) * waterWeatherRipple.y;
      float waterCurrentSpeed = length(terrainWaterFlow);
      vec2 waterCurrentDirection = terrainWaterFlow / max(waterCurrentSpeed, 0.0001);
      float waterCurrentPhase = dot(terrainWaterPosition, waterCurrentDirection) * 4.0 - waterWeatherTime * waterCurrentSpeed * 4.0;
      waterFineSlope += waterCurrentDirection * cos(waterCurrentPhase) * min(0.12, waterCurrentSpeed * 0.04);
      waterFineSlope *= terrainWaterBankFade;
      normal = normalize(normal + mat3(viewMatrix) * vec3(-waterFineSlope.x, 0.0, -waterFineSlope.y) * faceDirection);
    `);
  };
  const waterBaseColor = water.material.color.clone();
  const grassGeometry = new BufferGeometry();
  const grassVertices: number[] = [];
  const grassColors: number[] = [];
  const grassIndices: number[] = [];
  const grassRootColor = new Color("#6f8658");
  const grassTipColor = new Color("#a5b67b");
  const grassColor = new Color();
  for (let blade = 0; blade < 9; blade++) {
    const angle = blade * 2.39996 + (random(blade + 401, 3181) - 0.5) * 1.4;
    const x = (random(blade + 419, 3181) - 0.5) * 0.22;
    const z = (random(blade + 433, 3181) - 0.5) * 0.22;
    const halfWidth = 0.0095 + random(blade + 449, 3181) * 0.0015;
    const height = 0.76 + random(blade + 461, 3181) * 0.24;
    const bend = 0.045 + random(blade + 479, 3181) * 0.075;
    const twist = (random(blade + 491, 3181) - 0.5) * 0.8;
    const base = grassVertices.length / 3;
    for (const amount of [0, 0.58]) {
      const centerX = x + Math.cos(angle) * bend * amount * amount;
      const centerZ = z + Math.sin(angle) * bend * amount * amount;
      const leafWidth = halfWidth * (1 - amount * 0.85);
      const rightX = -Math.sin(angle + twist * amount) * leafWidth;
      const rightZ = Math.cos(angle + twist * amount) * leafWidth;
      grassVertices.push(centerX - rightX, height * amount, centerZ - rightZ, centerX + rightX, height * amount, centerZ + rightZ);
      grassColor.copy(grassRootColor).lerp(grassTipColor, amount);
      grassColors.push(grassColor.r, grassColor.g, grassColor.b, grassColor.r, grassColor.g, grassColor.b);
    }
    grassVertices.push(x + Math.cos(angle) * bend, height, z + Math.sin(angle) * bend);
    grassColors.push(grassTipColor.r, grassTipColor.g, grassTipColor.b);
    grassIndices.push(base, base + 1, base + 2, base + 1, base + 3, base + 2, base + 2, base + 3, base + 4);
  }
  grassGeometry.setAttribute("position", new Float32BufferAttribute(grassVertices, 3));
  grassGeometry.setAttribute("color", new Float32BufferAttribute(grassColors, 3));
  grassGeometry.setIndex(grassIndices);
  grassGeometry.computeVertexNormals();
  const grass = new InstancedMesh(grassGeometry, new MeshStandardMaterial({ vertexColors: true, roughness: 0.95, side: DoubleSide }), 6144);
  grass.name = "terrainGrass";
  const grassDepth = new MeshDepthMaterial({ depthPacking: RGBADepthPacking, side: DoubleSide });
  applyTreeWind(grass.material, true);
  applyTreeWind(grassDepth, true);
  grass.customDepthMaterial = grassDepth;
  const rocks = new InstancedMesh(new IcosahedronGeometry(1, 0), new MeshStandardMaterial({ color: "#a29481", roughness: 1 }), 4096);
  rocks.name = "terrainPebbles";
  const rockBaseColor = rocks.material.color.clone();
  const ice = new InstancedMesh(new IcosahedronGeometry(1, 0), new MeshStandardMaterial({ color: "#bdd8df", roughness: 0.46, metalness: 0.05 }), 180);
  for (const mesh of [trunks, foliage, grass, rocks, ice]) { mesh.castShadow = true; mesh.receiveShadow = true; mesh.instanceMatrix.setUsage(DynamicDrawUsage); mesh.count = 0; group.add(mesh); }
  const matrix = new Matrix4();
  const rotation = new Quaternion();
  const position = new Vector3();
  const scale = new Vector3();
  const up = new Vector3(0, 1, 0);
  const detailNormal = new Vector3();
  const detailYaw = new Quaternion();
  const detailColor = new Color();
  let detailHeight = 0;
  let detailPaint: ReturnType<typeof getTerrainPaint>;
  let legacyHasDetails = true;
  let legacySurfaces: SceneTerrain["surfaces"] | undefined;
  let legacyBlend: SceneTerrain["surfaceBlend"];
  let previousHeights: SceneTerrain["heights"] | undefined;
  let previousWaterLevels: SceneTerrain["waterLevels"];
  let previousWaterColors: SceneTerrain["waterColors"];
  const trees = new Map<number, TerrainTree>();
  const treeIndices: number[] = [];
  const waterLevels = new Float64Array(vertexCount).fill(Number.NaN);
  const extendedLevels = new Float64Array(vertexCount);
  // ACT: 存线性RGB相对原水色的倍率；旧水全为1，保留原材质/天气像素基础值，笔色不再受蓝色偏染。
  const waterTintValues = new Float32Array(vertexCount * 3).fill(1);
  const extendedWaterTintValues = new Float32Array(vertexCount * 3);
  const waterTintKeys = Array<string | undefined>(vertexCount);
  const waterTintColor = new Color();
  const waterBounds = new Box3();
  let waterVertexCount = 0;
  let terrainSize = initial.size;
  let waterTime = 0;
  let weather: SceneWeather | undefined;
  let disposed = false;

  function place(mesh: InstancedMesh, index: number, x: number, y: number, z: number, sx: number, sy: number, sz: number, angle: number) {
    rotation.setFromAxisAngle(up, angle);
    matrix.compose(position.set(x, y, z), rotation, scale.set(sx, sy, sz));
    mesh.setMatrixAt(index, matrix);
  }

  function sampleDetail(terrain: SceneTerrain, row: number, column: number, u: number, v: number) {
    const a = row * width + column;
    const b = a + width;
    const c = b + 1;
    const d = a + 1;
    const first = u + v <= 1;
    const ia = first ? a : c;
    const ib = b;
    const ic = d;
    const wa = first ? 1 - u - v : u + v - 1;
    const wb = first ? v : 1 - u;
    const wc = first ? u : 1 - v;
    detailHeight = terrain.heights[ia]! * wa + terrain.heights[ib]! * wb + terrain.heights[ic]! * wc;
    const spacing = terrain.size / terrain.segments;
    detailNormal.set(-(first ? terrain.heights[d]! - terrain.heights[a]! : terrain.heights[c]! - terrain.heights[b]!) / spacing,
      1, -(first ? terrain.heights[b]! - terrain.heights[a]! : terrain.heights[c]! - terrain.heights[d]!) / spacing).normalize();
    // 地貌、水位与坡面共用实际三角网格，不按最近网格点误把草石放进裁岸后的水面。
    if (Number.isFinite(waterLevels[ia]) || Number.isFinite(waterLevels[ib]) || Number.isFinite(waterLevels[ic])) {
      const level = extendedLevels[ia]! * wa + extendedLevels[ib]! * wb + extendedLevels[ic]! * wc;
      if (Number.isFinite(level) && level >= detailHeight - 0.005) return -1;
    }
    return sampleSurface(terrain, (column + u) * spacing - terrain.size / 2, (row + v) * spacing - terrain.size / 2);
  }

  function sampleSurface(terrain: SceneTerrain, x: number, z: number) {
    const gridX = Math.max(0, Math.min(terrain.segments, (x / terrain.size + 0.5) * terrain.segments));
    const gridZ = Math.max(0, Math.min(terrain.segments, (z / terrain.size + 0.5) * terrain.segments));
    const column = Math.min(terrain.segments - 1, Math.floor(gridX));
    const row = Math.min(terrain.segments - 1, Math.floor(gridZ));
    const u = gridX - column, v = gridZ - row;
    const sx = u * u * (3 - 2 * u), sz = v * v * (3 - 2 * v);
    const hash = Math.sin(x * 127.1 + z * 311.7 + terrain.seed * 0.17) * 43758.5453;
    let pick = hash - Math.floor(hash);
    const paint = detailPaint;
    if (paint) {
      const paintX = Math.max(0, Math.min(paint.segments, (x / terrain.size + 0.5) * paint.segments));
      const paintZ = Math.max(0, Math.min(paint.segments, (z / terrain.size + 0.5) * paint.segments));
      const paintColumn = Math.min(paint.segments - 1, Math.floor(paintX));
      const paintRow = Math.min(paint.segments - 1, Math.floor(paintZ));
      const pu = paintX - paintColumn, pv = paintZ - paintRow;
      const px = pu * pu * (3 - 2 * pu), pz = pv * pv * (3 - 2 * pv);
      let coverage = 0;
      for (let corner = 0; corner < 4; corner++) {
        const offset = ((paintRow + (corner & 1)) * (paint.segments + 1) + paintColumn + (corner >> 1)) * 4;
        const weight = (corner & 2 ? px : 1 - px) * (corner & 1 ? pz : 1 - pz) * paint.data[offset + 3]! / 255;
        const mix = paint.data[offset + 2]! / 255;
        pick -= weight * (1 - mix);
        if (pick < 0) return paint.styles?.[paint.data[offset]!]?.surface ?? paint.data[offset]!;
        pick -= weight * mix;
        if (pick < 0) return paint.styles?.[paint.data[offset + 1]!]?.surface ?? paint.data[offset + 1]!;
        coverage += weight;
      }
      pick /= Math.max(0.000001, 1 - coverage);
    }
    const a = row * width + column;
    for (let corner = 0; corner < 4; corner++) {
      const index = a + (corner >> 1) + (corner & 1) * width;
      const weight = (corner & 2 ? sx : 1 - sx) * (corner & 1 ? sz : 1 - sz);
      const base = terrain.surfaces[index] ?? 38;
      const coverage = Math.round(Math.max(0, Math.min(1, terrain.surfaceBlend?.weights[index] ?? 0)) * 255) / 255;
      pick -= weight * (1 - coverage);
      if (pick < 0) return base;
      pick -= weight * coverage;
      if (pick < 0) return terrain.surfaceBlend?.surfaces[index] ?? base;
    }
    return terrain.surfaces[a] ?? 38;
  }

  function placeDetail(mesh: InstancedMesh, index: number, x: number, y: number, z: number, sx: number, sy: number, sz: number, angle: number) {
    rotation.setFromUnitVectors(up, detailNormal).multiply(detailYaw.setFromAxisAngle(up, angle));
    matrix.compose(position.set(x, y, z), rotation, scale.set(sx, sy, sz));
    mesh.setMatrixAt(index, matrix);
  }

  function rebuildWater(terrain: SceneTerrain) {
    waterVertexCount = 0;
    waterBounds.makeEmpty();
    extendedLevels.set(waterLevels);
    extendedWaterTintValues.set(waterTintValues);
    let minRow = width, minColumn = width, maxRow = -1, maxColumn = -1;
    for (let index = 0; index < waterLevels.length; index++) {
      if (!Number.isFinite(waterLevels[index])) continue;
      const row = Math.floor(index / width), column = index % width;
      minRow = Math.min(minRow, row); maxRow = Math.max(maxRow, row);
      minColumn = Math.min(minColumn, column); maxColumn = Math.max(maxColumn, column);
    }
    if (maxRow < 0) {
      if (water.geometry.attributes.position.count) resizeWaterGeometry(0, 0);
      water.visible = false;
      return;
    }
    // 裁岸只延拓到湿点相邻的一圈顶点。
    minRow = Math.max(0, minRow - 1); maxRow = Math.min(width - 1, maxRow + 1);
    minColumn = Math.max(0, minColumn - 1); maxColumn = Math.min(width - 1, maxColumn + 1);
    const spacing = terrain.size / terrain.segments;
    const points: WaterPoint[] = [];
    for (let row = minRow; row <= maxRow; row++) for (let column = minColumn; column <= maxColumn; column++) {
      const index = row * width + column;
      if (Number.isFinite(waterLevels[index])) continue;
      let sum = 0;
      let weight = 0;
      let colorR = 0, colorG = 0, colorB = 0;
      // 干岸只在相邻湿点所在三角形中延拓水位，随后按实际地面高程求交，不把整个网格单元铺成水面。
      for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
        const nearRow = row + dz;
        const nearColumn = column + dx;
        if ((!dx && !dz) || nearRow < 0 || nearRow >= width || nearColumn < 0 || nearColumn >= width) continue;
        const nearIndex = nearRow * width + nearColumn;
        const level = waterLevels[nearIndex]!;
        if (!Number.isFinite(level)) continue;
        const part = 1 / (dx * dx + dz * dz);
        sum += level * part;
        weight += part;
        const offset = nearIndex * 3;
        colorR += waterTintValues[offset]! * part;
        colorG += waterTintValues[offset + 1]! * part;
        colorB += waterTintValues[offset + 2]! * part;
      }
      if (weight) {
        extendedLevels[index] = sum / weight;
        const offset = index * 3;
        extendedWaterTintValues[offset] = colorR / weight;
        extendedWaterTintValues[offset + 1] = colorG / weight;
        extendedWaterTintValues[offset + 2] = colorB / weight;
      }
    }
    for (let row = minRow; row <= maxRow; row++) for (let column = minColumn; column <= maxColumn; column++) {
      const index = row * width + column;
      const level = extendedLevels[index]!;
      let flowX = 0;
      let flowZ = 0;
      if (Number.isFinite(level)) {
        const left = column > 0 ? extendedLevels[index - 1]! : Number.NaN;
        const right = column < terrain.segments ? extendedLevels[index + 1]! : Number.NaN;
        const back = row > 0 ? extendedLevels[index - width]! : Number.NaN;
        const front = row < terrain.segments ? extendedLevels[index + width]! : Number.NaN;
        const slopeX = ((Number.isFinite(right) ? right : level) - (Number.isFinite(left) ? left : level)) / Math.max(1, Number(Number.isFinite(left)) + Number(Number.isFinite(right))) / spacing;
        const slopeZ = ((Number.isFinite(front) ? front : level) - (Number.isFinite(back) ? back : level)) / Math.max(1, Number(Number.isFinite(back)) + Number(Number.isFinite(front))) / spacing;
        const slope = Math.hypot(slopeX, slopeZ);
        const speed = Math.min(3, Math.sqrt(slope) * 2);
        if (slope > 0.00001) { flowX = -slopeX / slope * speed; flowZ = -slopeZ / slope * speed; }
        else if (!terrain.waterLevels) flowZ = -0.45;
      }
      const tintOffset = index * 3;
      points[index] = { x: (column / terrain.segments - 0.5) * terrain.size, z: (row / terrain.segments - 0.5) * terrain.size,
        level, ground: terrain.heights[index]!, flowX, flowZ,
        colorR: extendedWaterTintValues[tintOffset]!, colorG: extendedWaterTintValues[tintOffset + 1]!, colorB: extendedWaterTintValues[tintOffset + 2]! };
    }

    function addTriangle(a: number, b: number, c: number) {
      if (![a, b, c].some(index => Number.isFinite(waterLevels[index]))) return;
      const triangle = [points[a]!, points[b]!, points[c]!];
      const first = triangle[0]!;
      const dx1 = triangle[1]!.x - first.x;
      const dz1 = triangle[1]!.z - first.z;
      const dx2 = triangle[2]!.x - first.x;
      const dz2 = triangle[2]!.z - first.z;
      const determinant = dx1 * dz2 - dx2 * dz1;
      const level1 = triangle[1]!.level - first.level;
      const level2 = triangle[2]!.level - first.level;
      const slopeX = (level1 * dz2 - level2 * dz1) / determinant;
      const slopeZ = (dx1 * level2 - dx2 * level1) / determinant;
      const depth1 = level1 - (triangle[1]!.ground - first.ground);
      const depth2 = level2 - (triangle[2]!.ground - first.ground);
      const bankX = (depth1 * dz2 - depth2 * dz1) / determinant;
      const bankZ = (dx1 * depth2 - dx2 * depth1) / determinant;
      const shore: WaterPoint[] = [];
      for (let index = 0; index < triangle.length; index++) {
        const from = triangle[(index + triangle.length - 1) % triangle.length]!;
        const to = triangle[index]!;
        const fromDepth = from.level - from.ground;
        const toDepth = to.level - to.ground;
        if ((fromDepth > 0) !== (toDepth > 0)) {
          const fraction = fromDepth / (fromDepth - toDepth);
          const level = from.level + (to.level - from.level) * fraction;
          shore.push({ x: from.x + (to.x - from.x) * fraction, z: from.z + (to.z - from.z) * fraction,
            level, ground: level, flowX: from.flowX + (to.flowX - from.flowX) * fraction, flowZ: from.flowZ + (to.flowZ - from.flowZ) * fraction,
            colorR: from.colorR + (to.colorR - from.colorR) * fraction,
            colorG: from.colorG + (to.colorG - from.colorG) * fraction,
            colorB: from.colorB + (to.colorB - from.colorB) * fraction });
        }
        if (toDepth > 0) shore.push(to);
      }
      const normalY = 1 / Math.hypot(slopeX, 1, slopeZ);
      const capacity = water.geometry.attributes.position.count;
      if (waterVertexCount + (shore.length - 2) * 3 > capacity) resizeWaterGeometry(Math.max(192, capacity * 2), waterVertexCount);
      const { position: waterPositions, normal: waterNormals, waterShape, waterFlow, color: waterVertexColors } = water.geometry.attributes;
      for (let index = 1; index < shore.length - 1; index++) for (const point of [shore[0]!, shore[index]!, shore[index + 1]!]) {
        const depth = Math.max(0, point.level - point.ground);
        waterPositions.setXYZ(waterVertexCount, point.x, point.level, point.z);
        waterNormals.setXYZ(waterVertexCount, -slopeX * normalY, normalY, -slopeZ * normalY);
        waterShape.setXYZ(waterVertexCount, Math.min(1, depth / 0.7), depth < 0.7 ? bankX / 0.7 : 0, depth < 0.7 ? bankZ / 0.7 : 0);
        waterFlow.setXY(waterVertexCount, point.flowX, point.flowZ);
        waterVertexColors.setXYZ(waterVertexCount, point.colorR, point.colorG, point.colorB);
        waterBounds.expandByPoint(position.set(point.x, point.level, point.z));
        waterVertexCount++;
      }
    }
    for (let row = minRow; row < maxRow; row++) for (let column = minColumn; column < maxColumn; column++) {
      const a = row * width + column;
      const b = a + width;
      addTriangle(a, b, a + 1);
      addTriangle(b, b + 1, a + 1);
    }
    water.geometry.setDrawRange(0, waterVertexCount);
    water.visible = waterVertexCount > 0;
    if (water.visible) for (const attribute of Object.values(water.geometry.attributes)) {
      attribute.clearUpdateRanges();
      attribute.addUpdateRange(0, waterVertexCount * attribute.itemSize);
      attribute.needsUpdate = true;
    }
    water.geometry.boundingBox!.copy(waterBounds);
    if (water.visible) {
      water.geometry.boundingBox!.min.y -= 0.2;
      water.geometry.boundingBox!.max.y += 0.2;
      water.geometry.boundingBox!.getBoundingSphere(water.geometry.boundingSphere!);
      animate(waterTime);
    } else water.geometry.boundingSphere!.set(position.set(0, 0, 0), 0);
  }

  function update(terrain: SceneTerrain, materialOnly = false) {
    if (disposed) return false;
    detailPaint = getTerrainPaint(terrain);
    const sizeChanged = terrain.size !== terrainSize;
    const paintHasDetails = !detailPaint?.styles || detailPaint.styles.some(style => style.surface === 0 || style.surface === 3 || style.surface === 5 || style.surface === 6);
    // ACT: materialOnly只接受只读legacy引用；有装饰或无样式表时保守重排，避免漏掉植物消隐。
    if (materialOnly && !sizeChanged && terrain.segments + 1 === width
      && terrain.surfaces === legacySurfaces && terrain.surfaceBlend === legacyBlend
      && terrain.heights === previousHeights && terrain.waterLevels === previousWaterLevels && terrain.waterColors === previousWaterColors
      && !legacyHasDetails && !paintHasDetails && !trunks.count && !grass.count && !rocks.count && !ice.count) {
      terrainMaterial.update(terrain, true);
      return false;
    }
    legacyHasDetails = false;
    let positionsChanged = false;
    let waterLevelsChanged = false;
    let waterColorsChanged = false;
    for (let row = 0; row <= terrain.segments; row++) for (let column = 0; column <= terrain.segments; column++) {
      const index = row * width + column;
      const surfaceId = terrain.surfaces[index];
      const blendId = terrain.surfaceBlend?.surfaces[index];
      if (surfaceId === 0 || surfaceId === 3 || surfaceId === 5 || surfaceId === 6
        || (terrain.surfaceBlend?.weights[index] ?? 0) > 0 && (blendId === 0 || blendId === 3 || blendId === 5 || blendId === 6)) legacyHasDetails = true;
      const height = terrain.heights[index]!;
      const x = Math.fround((column / terrain.segments - 0.5) * terrain.size);
      const y = Math.fround(height);
      const z = Math.fround((row / terrain.segments - 0.5) * terrain.size);
      if (positions.getX(index) !== x || positions.getY(index) !== y || positions.getZ(index) !== z) {
        positions.setXYZ(index, x, y, z);
        positionsChanged = true;
      }
      const waterLevel = getTerrainWaterLevel(terrain, index) ?? Number.NaN;
      if (!Object.is(waterLevels[index], waterLevel)) { waterLevels[index] = waterLevel; waterLevelsChanged = true; }
      const candidate = Number.isFinite(waterLevel) ? terrain.waterColors?.[index] : undefined;
      const tint = typeof candidate === "string" && /^#[0-9a-f]{6}$/i.test(candidate) ? candidate.toLowerCase() : undefined;
      if (waterTintKeys[index] !== tint) {
        waterTintKeys[index] = tint;
        if (tint) waterTintColor.set(tint);
        const r = tint ? Math.fround(waterTintColor.r / waterBaseColor.r) : 1;
        const g = tint ? Math.fround(waterTintColor.g / waterBaseColor.g) : 1;
        const b = tint ? Math.fround(waterTintColor.b / waterBaseColor.b) : 1;
        const offset = index * 3;
        if (waterTintValues[offset] !== r || waterTintValues[offset + 1] !== g || waterTintValues[offset + 2] !== b) {
          waterTintValues[offset] = r; waterTintValues[offset + 1] = g; waterTintValues[offset + 2] = b;
          waterColorsChanged = true;
        }
      }
    }
    if (positionsChanged) {
      positions.needsUpdate = true;
      geometry.computeVertexNormals();
      geometry.computeBoundingSphere();
      geometry.computeBoundingBox();
    }
    terrainMaterial.update(terrain);
    if (waterLevelsChanged || waterColorsChanged || positionsChanged || sizeChanged) rebuildWater(terrain);
    terrainSize = terrain.size;
    legacySurfaces = terrain.surfaces;
    legacyBlend = terrain.surfaceBlend;
    previousHeights = terrain.heights;
    previousWaterLevels = terrain.waterLevels;
    previousWaterColors = terrain.waterColors;
    trees.clear();
    treeIndices.length = 0;
    const removedTrees = new Set(terrain.removedTrees ?? []);
    let candidateCount = 0;
    let treeCount = 0;
    let grassCount = 0;
    let rockCount = 0;
    let iceCount = 0;
    // ACT: 树木与石块采用固定容量实例，笔刷修改只更新矩阵，不为每棵树重建材质和几何。
    for (let row = 1; row < terrain.segments; row += 2) for (let column = 1; column < terrain.segments; column += 2) {
      const index = row * width + column;
      const value = random(index, terrain.seed);
      const { x, y: height, z } = getTerrainTreePosition(terrain, index);
      const sampleColumn = Math.min(terrain.segments - 1, Math.max(0, Math.floor((x / terrain.size + 0.5) * terrain.segments)));
      const sampleRow = Math.min(terrain.segments - 1, Math.max(0, Math.floor((z / terrain.size + 0.5) * terrain.segments)));
      const surface = sampleDetail(terrain, sampleRow, sampleColumn,
        (x / terrain.size + 0.5) * terrain.segments - sampleColumn, (z / terrain.size + 0.5) * terrain.segments - sampleRow);
      if (surface === 3 && value > 0.56) {
        // 删除只隐藏原有候选，不以第401棵补位；网格索引在实例压缩、地形升降后仍稳定。
        if (candidateCount++ >= 400 || removedTrees.has(index)) continue;
        const size = (5 + random(index + 19, terrain.seed) * 4) / (2.4 + 1.7 * 0.9 / 2);
        const trunkHeight = 1.1 * size;
        treeIndices.push(index);
        trees.set(index, { index, position: { x, y: height, z }, height: (2.4 + 1.7 * 0.9 / 2) * size, radius: 0.85 * size });
        trunkBases.setX(treeCount, height);
        foliageBases.setX(treeCount * 2, height);
        foliageBases.setX(treeCount * 2 + 1, height);
        place(trunks, treeCount, x, height + trunkHeight / 2, z, size, trunkHeight, size, value * Math.PI * 2);
        place(foliage, treeCount * 2, x, height + 1.65 * size, z, size, size, size, value * Math.PI * 2);
        place(foliage, treeCount * 2 + 1, x, height + 2.4 * size, z, size * 0.78, size * 0.9, size * 0.78, value * Math.PI * 2);
        treeCount++;
      } else if (surface === 6 && value > 0.86 && iceCount < 180) {
        const size = 0.3 + random(index + 31, terrain.seed) * 0.6;
        place(ice, iceCount++, x, height + size * 0.45, z, size * 0.8, size * 1.2, size, value * Math.PI * 2);
      }
    }
    const spacing = terrain.size / terrain.segments;
    // ACT: 大世界均匀抽样至最多64×64格，仍最多6144簇草、4096颗碎石，不从前排截断实例。
    const detailStep = Math.ceil(terrain.segments / 64);
    for (let row = 0; row < terrain.segments; row += detailStep) for (let column = 0; column < terrain.segments; column += detailStep) {
      const index = row * width + column;
      const samples = (row / detailStep + column / detailStep) % 2 ? 1 : 2;
      for (let sample = 0; sample < samples; sample++) {
        const seed = terrain.seed + sample * 193;
        const value = random(index + 71, seed);
        const u = 0.08 + random(index + 37, seed) * 0.84;
        const v = 0.08 + random(index + 59, seed) * 0.84;
        const surface = sampleDetail(terrain, row, column, u, v);
        if (surface !== 0 && (surface !== 5 || sample !== 0)) continue;
        const x = (column + u) * spacing - terrain.size / 2;
        const z = (row + v) * spacing - terrain.size / 2;
        if (Math.abs(x) > terrain.size / 2 - 0.6 || Math.abs(z) > terrain.size / 2 - 0.6) continue;
        const patch = surface === 0 ? grassPatch(x, z, terrain.seed) : 0;
        if (surface === 0 && detailNormal.y > 0.62 && value > 1 - (0.35 + patch * 0.45)) {
          const size = 0.7 + random(index + 83, seed) * 0.2;
          const height = 0.13 + random(index + 97, seed) ** 1.35 * 0.07 + patch * 0.02;
          placeDetail(grass, grassCount, x, detailHeight - 0.006, z, size, height, size, random(index + 149, seed) * Math.PI * 2);
          const shade = 0.97 + patch * 0.03 + (random(index + 107, seed) - 0.5) * 0.04;
          grass.setColorAt(grassCount++, detailColor.setRGB(shade, shade, shade * (0.98 + random(index + 157, seed) * 0.02)));
        } else if (surface === 5 && detailNormal.y > 0.4 && value > 0.18) {
          const size = 0.1 + random(index + 113, seed) * 0.2;
          const height = size * (0.45 + random(index + 127, seed) * 0.35);
          placeDetail(rocks, rockCount, x, detailHeight + height * 0.18, z, size, height, size * (0.7 + value * 0.45), value * Math.PI * 2);
          const shade = 0.72 + random(index + 139, seed) * 0.5;
          rocks.setColorAt(rockCount++, detailColor.setRGB(shade * (0.93 + value * 0.12), shade, shade * (0.9 + value * 0.13)));
        }
      }
    }
    trunks.count = treeCount;
    foliage.count = treeCount * 2;
    grass.count = grassCount;
    rocks.count = rockCount;
    ice.count = iceCount;
    trunkBases.needsUpdate = true;
    foliageBases.needsUpdate = true;
    for (const mesh of [trunks, foliage, grass, rocks, ice]) { mesh.instanceMatrix.needsUpdate = true; mesh.computeBoundingBox(); mesh.computeBoundingSphere(); mesh.visible = mesh.count > 0; }
    if (grass.instanceColor) grass.instanceColor.needsUpdate = true;
    if (rocks.instanceColor) rocks.instanceColor.needsUpdate = true;
    if (grass.visible) {
      grass.boundingBox?.expandByScalar(0.5);
      if (grass.boundingSphere) grass.boundingSphere.radius += 0.5;
    }
    return true;
  }

  function setWeather(value: SceneWeather | undefined) {
    weather = value;
    animate(waterTime);
  }

  function setMaterialReady(ready: boolean) {
    if (!disposed) ground.material = ready ? terrainMaterial.material : terrainMaterial.previewMaterial;
  }

  function getTree(index: number): TerrainTree | undefined {
    const tree = disposed ? undefined : trees.get(index);
    return tree ? { ...tree, position: { ...tree.position } } : undefined;
  }

  function pickTree(raycaster: Raycaster): TerrainTreeHit | undefined {
    if (disposed || !group.visible || !treeIndices.length) return;
    trunks.updateWorldMatrix(true, false);
    foliage.updateWorldMatrix(true, false);
    const hits = raycaster.intersectObjects([trunks, foliage].filter(mesh => mesh.visible), false);
    for (const hit of hits) {
      if (hit.instanceId === undefined) continue;
      const slot = hit.object === foliage ? Math.floor(hit.instanceId / 2) : hit.instanceId;
      const index = treeIndices[slot];
      const tree = index === undefined ? undefined : getTree(index);
      if (tree) {
        ground.updateWorldMatrix(true, false);
        const groundHit = raycaster.intersectObject(ground, false)[0];
        if (groundHit && groundHit.distance < hit.distance - 0.001) return;
        return { tree, point: { x: hit.point.x, y: hit.point.y, z: hit.point.z }, distance: hit.distance };
      }
    }
  }

  function animate(time: number) {
    if (disposed) return false;
    waterTime = Number.isFinite(time) ? Math.max(0, time) : 0;
    const environment = getWeatherEnvironment(weather, waterTime);
    const windSpeed = Math.hypot(environment.windX, environment.windZ);
    const windLevel = Math.min(1, windSpeed / 18);
    const steadyWind = windSpeed / Math.max(0.001, environment.gust);
    const rain = environment.rain;
    treeUniforms.treeWeatherTime.value = waterTime;
    treeUniforms.treeWeatherWind.value.set(environment.windX, environment.windZ);
    terrainMaterial.setRain(rain);
    grass.material.color.setRGB(1 - rain * 0.16, 1 - rain * 0.12, 1 - rain * 0.1);
    grass.material.roughness = 0.95 - rain * 0.25;
    rocks.material.color.copy(rockBaseColor).multiplyScalar(1 - rain * 0.18);
    rocks.material.roughness = 1 - rain * 0.3;
    water.material.color.copy(waterBaseColor).multiplyScalar(1 - rain * 0.12);
    water.material.roughness = 0.22 + windLevel * 0.2 + rain * 0.18;
    const flowX = windSpeed > 0.0001 ? environment.windX / windSpeed : 0.95448;
    const flowZ = windSpeed > 0.0001 ? environment.windZ / windSpeed : 0.29828;
    const speed = 1 + steadyWind * 0.045 + rain * 0.5;
    waterUniforms.waterWeatherTime.value = waterTime;
    waterUniforms.waterWeatherFlow.value.set(flowX, flowZ);
    waterUniforms.waterWeatherRipple.value.set(windLevel * 0.08 + rain * 0.06, rain * 0.12);
    waterUniforms.waterWeatherSpeed.value = speed;
    if (!water.visible) return (trunks.count > 0 || grass.count > 0) && windSpeed > 0.0001;
    waterUniforms.waterWaveAxis.value.set(windSpeed > 0.0001 ? -flowZ * 1.315 : -0.2, windSpeed > 0.0001 ? flowX * 1.315 : 1.3);
    waterUniforms.waterWaveAmplitude.value.set(0.035 + windLevel * 0.065 + rain * 0.02, 0.018 + windLevel * 0.028 + rain * 0.012, rain * 0.005);
    return true;
  }

  function dispose() {
    if (disposed) return;
    disposed = true;
    treeDepth.dispose();
    grassDepth.dispose();
    group.remove(ground);
    geometry.dispose();
    terrainMaterial.dispose();
    detailPaint = undefined;
    disposeObject(group);
    group.clear();
    trees.clear();
    treeIndices.length = 0;
  }

  update(initial);
  return { group, update, setColors: terrainMaterial.setColors, setEnvironment: terrainMaterial.setEnvironment,
    setMaterialReady, getMaterialWarmupMesh: () => materialWarmupMesh, setWeather, getTree, pickTree, animate, dispose };
}
