export default function replaceUrl(url: string): string {
  if (typeof url !== "string" || !url.trim()) return "";
  let cleanedPath = "";
  try {
    cleanedPath = new URL(url).pathname;
  } catch (e) {
    cleanedPath = url;
  }
  return cleanedPath.replace(/^[/\\]+/, "").replace(/^oss[/\\]+/, "").replace(/^smallImage[/\\]+/, "");
}
