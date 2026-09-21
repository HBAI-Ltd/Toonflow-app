import type { ValidConnectionFunc } from "@vue-flow/core";
import type { NodeOutputs } from "./values";

export type NodeDataType = "STRING" | "INT" | "FLOAT" | "BOOLEAN" | "IMAGE" | "MASK" | "LATENT"
  | "AUDIO" | "VIDEO" | "MODEL" | "CLIP" | "VAE" | "CONDITIONING" | "*" | (string & {});

export type NodeHandle = {
  id: string;
  type: "source" | "target";
  dataType: NodeDataType | NodeDataType[];
  label?: string;
};

export type NodeConnectionFeedback = {
  nodeId: string;
  handles: Pick<NodeHandle, "id" | "type">[];
  status: "valid" | "invalid";
};

export type NodeData = {
  label?: string;
  handles?: NodeHandle[];
  outputs?: NodeOutputs;
};

function getDataTypes(dataType: NodeHandle["dataType"]) {
  const types = Array.isArray(dataType) ? dataType : [dataType];
  return types.every(type => typeof type === "string")
    ? types.flatMap(type => type.split(",")).map(type => type.trim()).filter(Boolean)
    : [];
}

export function isTypeCompatible(sourceType: NodeHandle["dataType"], targetType: NodeHandle["dataType"]) {
  const sourceTypes = getDataTypes(sourceType);
  const targetTypes = getDataTypes(targetType);
  return sourceTypes.length > 0 && targetTypes.length > 0
    && (sourceTypes.includes("*") || targetTypes.includes("*") || sourceTypes.some(type => targetTypes.includes(type)));
}

export const validateConnection: ValidConnectionFunc = (connection, context) => {
  if (connection.source === connection.target) return false;
  const { sourceNode, targetNode } = context;
  const sourceHandles: NodeHandle[] = Array.isArray(sourceNode?.data.handles) ? sourceNode.data.handles : [];
  const targetHandles: NodeHandle[] = Array.isArray(targetNode?.data.handles) ? targetNode.data.handles : [];
  const source = sourceHandles.find(item => item?.id === connection.sourceHandle && item.type === "source");
  const target = targetHandles.find(item => item?.id === connection.targetHandle && item.type === "target");
  if (!source || !target || !isTypeCompatible(source.dataType, target.dataType)) return false;

  try {
    // VueFlow 已统一正向和反向拖线的端点；基础校验通过后，仅执行接收端的附加规则。
    return !targetNode.isValidTargetPos || targetNode.isValidTargetPos(connection, context) === true;
  } catch (error) {
    console.error("节点连接校验失败", error);
    return false;
  }
};
