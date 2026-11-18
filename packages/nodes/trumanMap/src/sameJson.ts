// ACT: 场景按整份快照传递，没改的模型、地形在新旧文档里是同一个对象：先比引用，只有真正不同的部分才逐项比较，
// 比把两份文档各 JSON.stringify 一遍再比字符串省掉几百毫秒（AI 模型顶点内联在文档里时一份就有好几 MB）。
// 结果与 JSON.stringify(a) === JSON.stringify(b) 一致（undefined 字段不写出、非有限数写成 null），只是不在乎字段顺序。

/** JSON.stringify 会跳过的值：对象里不写出，数组里写成 null。 */
function skipped(value: unknown) {
  return value === undefined || typeof value === "function" || typeof value === "symbol";
}

function scalar(value: unknown) {
  if (skipped(value)) return null;
  if (typeof value === "number") return Number.isFinite(value) ? value + 0 : null;
  return value;
}

export function sameJson(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (!a || !b || typeof a !== "object" || typeof b !== "object") return scalar(a) === scalar(b);
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  if (Array.isArray(a)) {
    const other = b as unknown[];
    if (a.length !== other.length) return false;
    for (let index = 0; index < a.length; index++) if (!sameJson(a[index], other[index])) return false;
    return true;
  }
  const left = a as Record<string, unknown>, right = b as Record<string, unknown>;
  let count = 0;
  for (const key in left) {
    if (!Object.hasOwn(left, key) || skipped(left[key])) continue;
    count++;
    if (!Object.hasOwn(right, key) || skipped(right[key]) || !sameJson(left[key], right[key])) return false;
  }
  for (const key in right) if (Object.hasOwn(right, key) && !skipped(right[key])) count--;
  return count === 0;
}

/** 两份场景除镜头视角外内容相同（原来是比较去掉 view 后的 JSON 字符串）。 */
export function sameSceneContent<T extends { view?: unknown }>(a: T, b: T) {
  if (a === b) return true;
  const { view: _left, ...left } = a;
  const { view: _right, ...right } = b;
  return sameJson(left, right);
}
