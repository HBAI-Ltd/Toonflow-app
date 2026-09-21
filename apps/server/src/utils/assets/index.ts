import { mkdir, realpath } from "node:fs/promises";
import { dirname, join } from "node:path";
import conf from "@/utils/conf";

export async function getAssetsDirectory() {
  const directory = join(dirname(conf.path), "assets");
  await mkdir(directory, { recursive: true });
  return realpath(directory);
}
