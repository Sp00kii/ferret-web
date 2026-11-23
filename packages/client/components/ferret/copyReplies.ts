/**
 * Copying messages keeps "Replying to <name>: <message>" on one line
 * (stoatchat/for-web#172). The reply line is made of separate boxes, so the
 * browser copies it as "Replying to / name / : / message" on four lines;
 * this puts it back together. Other copied text is left alone.
 */

const SPLIT_REPLY = /Replying to\s*\n+\s*([^\n]*?)\s*\n+\s*:\s*\n+\s*/g;

let installed = false;

export function installCopyReplies() {
  if (installed || !window.ferret) return;
  installed = true;

  document.addEventListener("copy", (event) => {
    const selection = getSelection();
    if (!selection || selection.isCollapsed || !event.clipboardData) return;
    const text = selection.toString();
    if (!text.includes("Replying to")) return;
    const fixed = text.replace(SPLIT_REPLY, "Replying to $1: ");
    if (fixed === text) return;

    // keep the formatted copy as it was, only fix the plain text
    const html = document.createElement("div");
    for (let i = 0; i < selection.rangeCount; i++)
      html.append(selection.getRangeAt(i).cloneContents());
    event.clipboardData.setData("text/plain", fixed);
    event.clipboardData.setData("text/html", html.innerHTML);
    event.preventDefault();
  });
}
