// 只检查 ONNX protobuf 中可包含 TensorProto 的字段，跳过权重数据本身。
// 外部初始化器可位于子图、函数、稀疏张量或训练图中，不能只检查顶层 initializer。
const nested: Record<string, Record<number, string>> = {
  model: { 7: "graph", 20: "training", 25: "function" }, training: { 1: "graph", 2: "graph" },
  graph: { 1: "node", 5: "tensor", 15: "sparse" }, function: { 7: "node", 11: "attribute" },
  node: { 5: "attribute" }, attribute: { 5: "tensor", 6: "graph", 10: "tensor", 11: "graph", 22: "sparse", 23: "sparse" },
  sparse: { 1: "tensor", 2: "tensor" }, tensor: {},
};

export function validateEmbeddedModel(data: Uint8Array) {
  let at = 0;
  let hasGraph = false;
  const invalid = () => new Error("模型须为完整的单文件 ONNX protobuf");
  function varint(end: number) {
    let value = 0;
    for (let shift = 0; shift < 70 && at < end; shift += 7) {
      const byte = data[at++]!;
      value += (byte & 127) * 2 ** shift;
      if (!(byte & 128)) return value;
    }
    throw invalid();
  }
  function visit(kind: string, end: number, depth: number) {
    if (depth > 100) throw invalid();
    while (at < end) {
      const tag = varint(end);
      if (tag < 8 || tag > 0xffffffff) throw invalid();
      const field = Math.floor(tag / 8), wire = tag % 8;
      if (wire === 0) {
        const value = varint(end);
        if (kind === "tensor" && field === 14 && value !== 0) throw new Error("本地模型仅支持内嵌权重，不能引用外部文件");
      } else if (wire === 2) {
        const length = varint(end), next = at + length;
        if (next > end) throw invalid();
        if (kind === "tensor" && field === 13) throw new Error("本地模型仅支持内嵌权重，不能引用外部文件");
        const child = nested[kind]![field];
        if (kind === "model" && child === "graph") hasGraph = true;
        if (child) visit(child, next, depth + 1);
        at = next;
      } else if (wire === 1 || wire === 5) {
        at += wire === 1 ? 8 : 4;
        if (at > end) throw invalid();
      } else throw invalid();
    }
  }
  visit("model", data.length, 0);
  if (!hasGraph) throw invalid();
}
