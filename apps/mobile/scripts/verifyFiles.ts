import assert from "node:assert/strict";
import { dirname, join } from "node:path";
import { tmpdir } from "node:os";
import { existsSync, mkdtemp, readFile, readdir, realpath, rm, writeAtomic, writeAtomicSync } from "@toonflow/file";

const content = "Toonflow 完整文件\n".repeat(65536);
if (process.argv[2] === "write") {
  try { await writeAtomic(process.argv[3]!, content, { exclusive: true }); }
  catch (error) { if ((error as NodeJS.ErrnoException).code === "EEXIST") process.exit(17); throw error; }
} else {
  const temporaryRoot = await realpath(tmpdir());
  const directory = await mkdtemp(join(temporaryRoot, "toonflowFiles-"));
  try {
    const asyncPath = join(directory, "async.txt");
    const syncPath = join(directory, "sync.txt");
    await writeAtomic(asyncPath, content, { exclusive: true });
    writeAtomicSync(syncPath, content, { exclusive: true });
    assert.equal(await readFile(asyncPath, "utf8"), content);
    assert.equal(await readFile(syncPath, "utf8"), content);
    await assert.rejects(writeAtomic(asyncPath, "不得覆盖", { exclusive: true }), { code: "EEXIST" });
    assert.throws(() => writeAtomicSync(syncPath, "不得覆盖", { exclusive: true }), { code: "EEXIST" });
    assert.equal(await readFile(asyncPath, "utf8"), content);
    assert.equal(await readFile(syncPath, "utf8"), content);

    const missingPath = join(directory, "nul.txt");
    for (const path of [asyncPath, missingPath]) {
      await assert.rejects(writeAtomic(path + "\0invalid", "错误路径", { exclusive: true }), { code: "ERR_INVALID_ARG_VALUE" });
      assert.throws(() => writeAtomicSync(path + "\0invalid", "错误路径", { exclusive: true }), { code: "ERR_INVALID_ARG_VALUE" });
    }
    assert.equal(await readFile(asyncPath, "utf8"), content);
    assert.equal(existsSync(missingPath), false);

    await writeAtomic(asyncPath, "普通异步覆盖");
    writeAtomicSync(syncPath, "普通同步覆盖");
    assert.equal(await readFile(asyncPath, "utf8"), "普通异步覆盖");
    assert.equal(await readFile(syncPath, "utf8"), "普通同步覆盖");

    // ACT: 用独立进程竞争，避免只验证到进程内路径队列。
    const racePath = join(directory, "race.txt");
    const children = Array.from({ length: 4 }, () => Bun.spawn([process.execPath, import.meta.path, "write", racePath], { stdout: "inherit", stderr: "inherit" }));
    const codes = await Promise.all(children.map(child => child.exited));
    assert.equal(codes.filter(code => code === 0).length, 1);
    assert.equal(codes.filter(code => code === 17).length, 3);
    assert.equal(await readFile(racePath, "utf8"), content);
    assert.ok((await readdir(directory)).every(name => !name.startsWith(".write-")), "不能残留临时文件");
    console.log(`通过：${process.platform}/${process.arch} 异步与同步完整发布、独占冲突、普通覆盖、跨进程竞争、NUL 拒绝、临时文件清理。`);
  } finally {
    assert.equal(dirname(directory), temporaryRoot);
    await rm(directory, { recursive: true });
  }
}
