/** 复制文本；不安全上下文回退到临时 textarea，失败时返回 false。 */
export async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const area = window.document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.top = "-1000px";
    area.style.opacity = "0";
    window.document.body.appendChild(area);
    area.select();
    let copied = false;
    try { copied = window.document.execCommand("copy"); }
    catch { copied = false; }
    area.remove();
    return copied;
  }
}
