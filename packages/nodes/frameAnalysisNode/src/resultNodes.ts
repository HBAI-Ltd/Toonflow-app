import { useNode, useVueFlow, type Node } from "@vue-flow/core";
import type { AnalysisResult, AnalysisScene } from "./videoAnalysis";

type ResultDimensions = { frames: boolean; clips: boolean; audio: boolean };

function sceneLabel(scene: AnalysisScene, prefix: string) {
  const details = scene.annotation;
  return `${prefix}${String(scene.index).padStart(2, "0")} · ${details ? `${details.shotSize} · ${details.cameraAngle} · ${details.description}` : `${formatSceneTime(scene.start)}–${formatSceneTime(scene.end)}`}`;
}

export function formatSceneTime(value: number) {
  const milliseconds = Math.max(0, Math.round(value * 1000));
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  return `${String(minutes).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}.${String(milliseconds % 1000).padStart(3, "0")}`;
}

export function useResultNodes() {
  const { node } = useNode();
  const { addNodes, removeNodes, findNode, getNodes, nodeTypes } = useVueFlow();

  function verify(dimensions: ResultDimensions) {
    if (findNode(node.id) !== node) throw new Error("逐帧拉片节点已变化，请重新开始");
    if (!nodeTypes?.value?.canvasGroup) throw new Error("当前画布不支持分组");
    const required = [
      { enabled: dimensions.frames, type: "remote-imageNode", label: "图片" },
      { enabled: dimensions.clips, type: "remote-videoNode", label: "视频" },
      { enabled: dimensions.audio, type: "remote-audioNode", label: "音频" },
    ];
    const missing = required.filter(item => item.enabled && !nodeTypes?.value?.[item.type]);
    if (missing.length) throw new Error(`请先启用${missing.map(item => item.label).join("、")}节点插件`);
  }

  function create(result: AnalysisResult) {
    verify({ frames: result.scenes.some(scene => !!scene.image), clips: result.scenes.some(scene => !!scene.video), audio: !!result.audio });
    // ACT: 结果直接使用各素材自己的输出；视频、音频节点没有输入端口，不创建虚假数据连线。
    const nodes: Node[] = [];
    const groups: { node: Node; width: number; height: number }[] = [];
    const previewWidth = Math.max(180, result.height > 0 ? 240 * result.width / result.height : 320) + 18;
    const dimensions = [
      { key: "frames", type: "remote-imageNode", output: "image", dataType: "IMAGE", mimeType: "image/jpeg", label: "关键帧", prefix: "S", width: previewWidth, height: 300 },
      { key: "clips", type: "remote-videoNode", output: "video", dataType: "VIDEO", mimeType: "video/mp4", label: "视频片段", prefix: "M", width: previewWidth, height: 300 },
      { key: "audio", type: "remote-audioNode", output: "audio", dataType: "AUDIO", mimeType: "audio/mpeg", label: "原音轨", prefix: "A", width: 360, height: 220 },
    ] as const;

    for (const dimension of dimensions) {
      const media = dimension.key === "audio"
        ? result.audio ? [{ path: result.audio, label: "A01 · 原音轨", sceneIndex: 0 }] : []
        : result.scenes.flatMap(scene => {
          const path = dimension.key === "frames" ? scene.image : scene.video;
          return path ? [{
            path,
            label: sceneLabel(scene, dimension.prefix),
            sceneIndex: scene.index,
          }] : [];
        });
      // ACT: 每组最多 12 项、3 列，长视频继续向下排组，保留所有检测结果。
      for (let offset = 0; offset < media.length; offset += 12) {
        const items = media.slice(offset, offset + 12);
        const columns = Math.min(3, items.length);
        const rows = Math.ceil(items.length / columns);
        const width = columns * dimension.width + (columns - 1) * 32 + 48;
        const height = rows * dimension.height + (rows - 1) * 28 + 64;
        const groupId = crypto.randomUUID();
        const group: Node = {
          id: groupId,
          type: "canvasGroup",
          position: { x: 0, y: 0 },
          style: { width: `${width}px`, height: `${height}px` },
          connectable: false,
          expandParent: false,
          data: { label: `${dimension.label}${dimension.key === "audio" ? "" : `组${String(offset / 12 + 1).padStart(2, "0")}`} · ${node.data.label || "逐帧拉片"}` },
        };
        groups.push({ node: group, width, height });
        nodes.push(group);
        items.forEach((item, index) => {
          const id = crypto.randomUUID();
          nodes.push({
            id,
            type: dimension.type,
            parentNode: groupId,
            expandParent: false,
            position: { x: 24 + index % columns * (dimension.width + 32), y: 40 + Math.floor(index / columns) * (dimension.height + 28) },
            data: {
              label: item.label,
              frameAnalysisResult: { ownerId: node.id, manifest: result.manifest, sceneIndex: item.sceneIndex, kind: dimension.key },
              outputs: { [dimension.output]: { dataType: dimension.dataType, value: { url: item.path, mimeType: dimension.mimeType } } },
            },
          });
        });
      }
    }
    const width = Math.max(0, ...groups.map(group => group.width));
    const height = groups.reduce((total, group) => total + group.height + 48, 0);
    const x = node.computedPosition.x + (node.dimensions.width || 320) + 96;
    let y = node.computedPosition.y;
    for (const other of [...getNodes.value].sort((left, right) => left.computedPosition.y - right.computedPosition.y)) {
      const position = other.computedPosition;
      if (position.x < x + width && position.x + (other.dimensions.width || 320) > x
        && position.y < y + height && position.y + (other.dimensions.height || 300) > y) {
        y = position.y + (other.dimensions.height || 300) + 48;
      }
    }
    for (const group of groups) {
      group.node.position = { x, y };
      y += group.height + 48;
    }
    const ids = nodes.map(item => item.id);
    try {
      addNodes(nodes);
    } catch (error) {
      removeNodes(ids, true, false);
      throw error;
    }
    return ids;
  }

  function remove(ids: string[]) {
    removeNodes(ids, true, false);
  }

  function annotate(result: AnalysisResult, previousManifest: string) {
    const scenes = new Map(result.scenes.map(scene => [scene.index, scene]));
    for (const media of getNodes.value) {
      const origin = media.data.frameAnalysisResult as { ownerId?: string; manifest?: string; sceneIndex?: number; kind?: string } | undefined;
      if (origin?.ownerId !== node.id || origin.manifest !== previousManifest) continue;
      const scene = scenes.get(origin.sceneIndex ?? 0);
      if (scene?.annotation && (origin.kind === "frames" || origin.kind === "clips")) {
        media.data.label = sceneLabel(scene, origin.kind === "frames" ? "S" : "M");
      }
      origin.manifest = result.manifest;
    }
  }

  return { verify, create, remove, annotate };
}
