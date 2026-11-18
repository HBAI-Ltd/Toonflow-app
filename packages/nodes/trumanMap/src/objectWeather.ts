import { Box3, Group, InstancedMesh, Matrix4, Mesh, MeshDepthMaterial, MeshStandardMaterial, RGBADepthPacking, Sphere, Vector2, Vector3 } from "three";
import type { SceneAsset, SceneWeather } from "./sceneDocument";
import { getWeatherEnvironment, type WeatherEnvironment } from "./worldWeather";
import { isVegetationAsset } from "./assetMetadata";
import { modelPartBatches } from "./modelGeometry";

type WeatherMesh = Mesh & { boundingSphere?: Sphere | null };

export function createObjectWeather(group: Group, asset: SceneAsset) {
  const uniforms = {
    objectWeatherTime: { value: 0 }, objectWeatherWind: { value: new Vector2() },
    objectWeatherProfile: { value: new Vector3(0, 1, 0) }, objectWeatherWetness: { value: 0 },
  };
  const bounds = new Box3();
  const size = new Vector3();
  const center = new Vector3();
  const localBounds = new Box3();
  const meshBounds = new Box3();
  const boundsMatrix = new Matrix4();
  const inverseMatrix = new Matrix4();
  let boundsSynced = false;
  const vegetation = isVegetationAsset(asset);
  const materials = new Map<MeshStandardMaterial, { roughness: number; compile: MeshStandardMaterial["onBeforeCompile"]; cacheKey: MeshStandardMaterial["customProgramCacheKey"]; wind: boolean }>();
  const meshes: Mesh[] = [];
  let weather: SceneWeather | undefined;
  let seconds = 0;
  let disposed = false;
  group.traverse(child => {
    if (!(child instanceof Mesh)) return;
    meshes.push(child);
    // ACT: 只为已知静态的程序化批次开启实例风摆；外部实例仍保留原动画与深度材质。
    const wind = vegetation && !("isSkinnedMesh" in child) && (!(child instanceof InstancedMesh) || modelPartBatches.has(child))
      && !child.morphTargetInfluences?.length && !Array.isArray(child.material) && !child.customDepthMaterial;
    for (const material of Array.isArray(child.material) ? child.material : [child.material]) {
      if (!(material instanceof MeshStandardMaterial)) continue;
      const previous = materials.get(material);
      if (previous) previous.wind &&= wind;
      else materials.set(material, { roughness: material.roughness, compile: material.onBeforeCompile, cacheKey: material.customProgramCacheKey, wind });
    }
  });

  function applyShader(material: MeshStandardMaterial | MeshDepthMaterial, wind: boolean, wet: boolean) {
    const previousCompile = material.onBeforeCompile;
    const previousKey = material.customProgramCacheKey();
    material.customProgramCacheKey = () => `${previousKey}|objectWeather3:${Number(wind)}:${Number(wet)}`;
    material.onBeforeCompile = (shader, renderer) => {
      previousCompile.call(material, shader, renderer);
      Object.assign(shader.uniforms, uniforms);
      if (wind) {
        shader.vertexShader = /* glsl */ `
          uniform float objectWeatherTime;
          uniform vec2 objectWeatherWind;
          #ifdef sceneBatchUsesWind
            attribute vec3 sceneBatchWind;
            #define windProfile sceneBatchWind
          #else
            uniform vec3 objectWeatherProfile;
            #define windProfile objectWeatherProfile
          #endif
          #ifdef USE_INSTANCING
            #define objectWindModel (modelMatrix * instanceMatrix)
          #else
            #define objectWindModel modelMatrix
          #endif
          bool objectHasWind() { return any(notEqual(objectWeatherWind, vec2(0.0))); }
          vec2 objectWindSway() {
            vec2 wind = objectWeatherWind * windProfile.y;
            return wind * (0.65 + sin(objectWeatherTime * 1.9 + windProfile.z) * 0.3)
              + vec2(-wind.y, wind.x) * sin(objectWeatherTime * 2.7 + windProfile.z) * 0.12;
          }
        ` + shader.vertexShader;
        shader.vertexShader = shader.vertexShader.replace("#include <beginnormal_vertex>", /* glsl */ `
          #include <beginnormal_vertex>
          if (objectHasWind()) {
            float objectNormalHeight = clamp(((objectWindModel * vec4(position, 1.0)).y - windProfile.x) / windProfile.y, 0.0, 1.0);
            vec2 objectWindSlope = objectWindSway() * objectNormalHeight * 2.0 / windProfile.y;
            vec3 weatherNormal = transpose(inverse(mat3(objectWindModel))) * objectNormal;
            weatherNormal.y -= dot(objectWindSlope, weatherNormal.xz);
            objectNormal = transpose(mat3(objectWindModel)) * weatherNormal;
            #ifdef USE_TANGENT
              vec3 weatherTangent = mat3(objectWindModel) * objectTangent;
              weatherTangent.xz += objectWindSlope * weatherTangent.y;
              objectTangent = inverse(mat3(objectWindModel)) * weatherTangent;
            #endif
          }
        `).replace("#include <begin_vertex>", /* glsl */ `
          #include <begin_vertex>
          if (objectHasWind()) {
            float objectBendHeight = clamp(((objectWindModel * vec4(transformed, 1.0)).y - windProfile.x) / windProfile.y, 0.0, 1.0);
            vec2 objectWindOffset = objectWindSway() * objectBendHeight * objectBendHeight;
            transformed += inverse(mat3(objectWindModel)) * vec3(objectWindOffset.x, 0.0, objectWindOffset.y);
          }
        `);
      }
      if (wet) {
        shader.fragmentShader = "uniform float objectWeatherWetness;\n" + shader.fragmentShader;
        shader.fragmentShader = shader.fragmentShader.replace("#include <color_fragment>", "#include <color_fragment>\ndiffuseColor.rgb *= 1.0 - objectWeatherWetness * 0.18;");
      }
    };
    material.needsUpdate = true;
  }

  const depthMaterials = new Map<MeshStandardMaterial, MeshDepthMaterial>();
  const windMeshes: { mesh: WeatherMesh; bounds: Box3; sphere: Sphere; originalSphere: Sphere | null | undefined; hadOwnSphere: boolean }[] = [];
  for (const [material, state] of materials) applyShader(material, state.wind, true);
  for (const mesh of meshes) {
    if (!(mesh.material instanceof MeshStandardMaterial) || !materials.get(mesh.material)?.wind) continue;
    let depth = depthMaterials.get(mesh.material);
    if (!depth) {
      depth = new MeshDepthMaterial({ depthPacking: RGBADepthPacking, map: mesh.material.map, alphaMap: mesh.material.alphaMap, alphaTest: mesh.material.alphaTest, side: mesh.material.side });
      applyShader(depth, true, false);
      depthMaterials.set(mesh.material, depth);
    }
    const weatherMesh = mesh as WeatherMesh;
    if (!mesh.geometry.boundingBox) mesh.geometry.computeBoundingBox();
    if (mesh instanceof InstancedMesh && !mesh.boundingBox) mesh.computeBoundingBox();
    const localBox = mesh instanceof InstancedMesh ? mesh.boundingBox! : mesh.geometry.boundingBox!;
    const sphere = new Sphere();
    windMeshes.push({ mesh: weatherMesh, bounds: localBox.clone(), sphere, originalSphere: weatherMesh.boundingSphere, hadOwnSphere: Object.hasOwn(weatherMesh, "boundingSphere") });
    mesh.customDepthMaterial = depth;
    weatherMesh.boundingSphere = sphere;
  }

  if (windMeshes.length) {
    group.updateWorldMatrix(true, true);
    inverseMatrix.copy(group.matrixWorld).invert();
    const meshToGroup = new Matrix4(), partToGroup = new Matrix4();
    for (const mesh of meshes) {
      if (!mesh.geometry.boundingBox) mesh.geometry.computeBoundingBox();
      const box = mesh.geometry.boundingBox!;
      meshToGroup.multiplyMatrices(inverseMatrix, mesh.matrixWorld);
      if (mesh instanceof InstancedMesh) {
        for (let index = 0; index < mesh.count; index++) {
          mesh.getMatrixAt(index, partToGroup);
          localBounds.union(meshBounds.copy(box).applyMatrix4(partToGroup.premultiply(meshToGroup)));
        }
      } else localBounds.union(meshBounds.copy(box).applyMatrix4(meshToGroup));
    }
  }

  function animate(time: number, sharedEnvironment?: WeatherEnvironment) {
    if (disposed) return false;
    seconds = Number.isFinite(time) ? Math.max(0, time) : 0;
    if (!materials.size) return false;
    const environment = sharedEnvironment ?? getWeatherEnvironment(weather, seconds);
    if (uniforms.objectWeatherWetness.value !== environment.rain) {
      uniforms.objectWeatherWetness.value = environment.rain;
      for (const [material, state] of materials) material.roughness = state.roughness * (1 - environment.rain * 0.55);
    }
    if (!windMeshes.length) return false;
    const speed = Math.hypot(environment.windX, environment.windZ);
    const strength = Math.min(1, speed / 38);
    const amplitude = 0.1 * strength;
    uniforms.objectWeatherTime.value = seconds;
    uniforms.objectWeatherWind.value.set(speed > 0 ? environment.windX / speed * amplitude : 0, speed > 0 ? environment.windZ / speed * amplitude : 0);
    return speed > 0.0001;
  }

  function update(value: SceneWeather | undefined) {
    if (disposed) return;
    weather = value;
    animate(seconds);
  }

  function syncBounds() {
    if (disposed || !windMeshes.length) return;
    group.updateWorldMatrix(true, false);
    if (boundsSynced && boundsMatrix.equals(group.matrixWorld)) return;
    boundsSynced = true;
    boundsMatrix.copy(group.matrixWorld);
    group.updateWorldMatrix(true, true);
    // ACT: 风摆只支持静态子网格；模型替换会重建控制器。缓存局部几何边界，平移、旋转、缩放只转换盒体，不逐帧扫描顶点。
    bounds.copy(localBounds).applyMatrix4(group.matrixWorld);
    bounds.getSize(size);
    bounds.getCenter(center);
    if (bounds.isEmpty() || !Number.isFinite(size.y) || size.y < 0.0001) {
      uniforms.objectWeatherProfile.value.set(0, 0.0001, 0);
    } else {
      uniforms.objectWeatherProfile.value.set(bounds.min.y, size.y, center.x * 0.29 + center.z * 0.23);
    }
    // ACT: Three.js 的视锥和阴影剔除读取 mesh.boundingSphere。使用每个 mesh 独立球体，不修改共享 geometry；世界盒体再转回局部球体，兼容非匀缩放产生的剪切。
    const windMargin = uniforms.objectWeatherProfile.value.y * 0.11;
    for (const { mesh, bounds: localMeshBounds, sphere } of windMeshes) {
      meshBounds.copy(localMeshBounds).applyMatrix4(mesh.matrixWorld).getBoundingSphere(sphere);
      const scale = mesh.matrixWorld.getMaxScaleOnAxis();
      if (scale <= 1e-12) { sphere.center.set(0, 0, 0); sphere.radius = 0; continue; }
      sphere.radius = (sphere.radius + windMargin) / scale;
      localMeshBounds.getCenter(sphere.center);
    }
    animate(seconds);
  }

  function dispose() {
    if (disposed) return;
    disposed = true;
    for (const { mesh, originalSphere, hadOwnSphere } of windMeshes) {
      mesh.customDepthMaterial = undefined;
      if (hadOwnSphere) mesh.boundingSphere = originalSphere;
      else delete mesh.boundingSphere;
    }
    for (const depth of depthMaterials.values()) depth.dispose();
    for (const [material, state] of materials) {
      material.onBeforeCompile = state.compile;
      material.customProgramCacheKey = state.cacheKey;
      material.roughness = state.roughness;
      material.needsUpdate = true;
    }
    depthMaterials.clear();
    materials.clear();
  }

  syncBounds();
  return { update, syncBounds, animate, dispose, windAnimated: windMeshes.length > 0,
    batchWind: windMeshes.length > 0 && windMeshes.length === meshes.length ? uniforms.objectWeatherProfile.value : undefined };
}
