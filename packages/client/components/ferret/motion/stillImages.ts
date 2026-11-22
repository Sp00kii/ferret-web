/**
 * "Pause GIFs and animated emoji until hovered" (stoatchat/for-web#664).
 *
 * Watches the page for images from Stoat's file server / image proxy. When
 * one turns out to be animated (GIF, animated WebP or APNG), its first
 * frame is drawn into a still copy and shown instead; hovering it plays the
 * real one. Autoplaying videos (GIF picker results) are paused the same
 * way. Nothing changes on the server or for anyone else.
 */

const HOSTS = [
  "https://cdn.stoatusercontent.com/",
  "https://proxy.stoatusercontent.com/",
];
const MAX_BYTES = 20 * 1024 * 1024;
const MAX_CACHE = 600;

/** original url -> still image url (or null when it isn't animated) */
const stills = new Map<string, Promise<string | null>>();
let observer: MutationObserver | undefined;

const isRemote = (src: string) => HOSTS.some((host) => src.startsWith(host));

/** Look inside the file: only animated images need a still copy */
function isAnimated(bytes: Uint8Array, type: string) {
  const text = (from: number, length: number) =>
    String.fromCharCode(...bytes.subarray(from, from + length));
  if (type === "image/gif" || text(0, 3) === "GIF") {
    // more than one image descriptor after a graphic control extension
    let frames = 0;
    for (let i = 0; i < bytes.length - 3; i++) {
      if (bytes[i] === 0x21 && bytes[i + 1] === 0xf9 && bytes[i + 2] === 0x04) {
        if (++frames > 1) return true;
      }
    }
    return false;
  }
  if (text(0, 4) === "RIFF" && text(8, 4) === "WEBP") {
    return bytes.length > 64 && text(12, 64).includes("ANIM");
  }
  if (bytes[0] === 0x89 && text(1, 3) === "PNG") {
    // APNG has an acTL chunk before the image data
    const head = text(0, Math.min(bytes.length, 4096));
    return head.includes("acTL");
  }
  return false;
}

function makeStill(src: string): Promise<string | null> {
  let still = stills.get(src);
  if (still) return still;

  still = (async () => {
    const response = await fetch(src, { mode: "cors" });
    if (!response.ok) return null;
    const blob = await response.blob();
    if (blob.size > MAX_BYTES) return null;
    const bytes = new Uint8Array(await blob.arrayBuffer());
    if (!isAnimated(bytes, blob.type)) return null;

    const bitmap = await createImageBitmap(blob);
    const canvas = document.createElement("canvas");
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    canvas.getContext("2d")!.drawImage(bitmap, 0, 0);
    bitmap.close();
    const png = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/png"),
    );
    return png ? URL.createObjectURL(png) : null;
  })().catch(() => null);

  if (stills.size >= MAX_CACHE) {
    const oldest = stills.keys().next().value!;
    void stills.get(oldest)?.then((url) => url && URL.revokeObjectURL(url));
    stills.delete(oldest);
  }
  stills.set(src, still);
  return still;
}

const hovered = new WeakSet<Element>();

async function processImage(img: HTMLImageElement) {
  const src = img.getAttribute("src") ?? "";
  // our own still copy, or something we never touch
  if (src.startsWith("blob:") || !isRemote(src)) return;
  if (hovered.has(img)) return;
  // the page swapped in a different picture
  if (img.dataset.ferretAnimated && img.dataset.ferretAnimated !== src)
    delete img.dataset.ferretAnimated;

  const still = await makeStill(src);
  // the page may have moved on while we were working
  if (!still || img.getAttribute("src") !== src || hovered.has(img)) return;
  img.dataset.ferretAnimated = src;
  img.setAttribute("src", still);
}

function processVideo(video: HTMLVideoElement) {
  if (!video.autoplay && !video.dataset.ferretPaused) return;
  if (hovered.has(video)) return;
  video.dataset.ferretPaused = "1";
  video.autoplay = false;
  video.pause();
}

function scan(root: ParentNode) {
  root.querySelectorAll?.("img").forEach((img) => void processImage(img));
  root.querySelectorAll?.("video").forEach(processVideo);
}

function onOver(event: PointerEvent) {
  const target = event.target as Element | null;
  if (target instanceof HTMLImageElement && target.dataset.ferretAnimated) {
    hovered.add(target);
    target.setAttribute("src", target.dataset.ferretAnimated);
  } else if (
    target instanceof HTMLVideoElement &&
    target.dataset.ferretPaused
  ) {
    hovered.add(target);
    void target.play().catch(() => {});
  }
}

function onOut(event: PointerEvent) {
  const target = event.target as Element | null;
  if (!target || !hovered.has(target)) return;
  hovered.delete(target);
  if (target instanceof HTMLImageElement) void processImage(target);
  else if (target instanceof HTMLVideoElement) target.pause();
}

export function setPauseAnimations(on: boolean) {
  if (on && !observer) {
    observer = new MutationObserver((records) => {
      for (const record of records) {
        if (record.type === "attributes") {
          const target = record.target;
          if (target instanceof HTMLImageElement) void processImage(target);
        } else {
          for (const node of record.addedNodes) {
            if (node instanceof HTMLImageElement) void processImage(node);
            else if (node instanceof HTMLVideoElement) processVideo(node);
            else if (node instanceof Element) scan(node);
          }
        }
      }
    });
    observer.observe(document.body, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ["src"],
    });
    document.addEventListener("pointerover", onOver, true);
    document.addEventListener("pointerout", onOut, true);
    scan(document);
  } else if (!on && observer) {
    observer.disconnect();
    observer = undefined;
    document.removeEventListener("pointerover", onOver, true);
    document.removeEventListener("pointerout", onOut, true);
    // put the moving originals back
    document
      .querySelectorAll<HTMLImageElement>("img[data-ferret-animated]")
      .forEach((img) => {
        img.setAttribute("src", img.dataset.ferretAnimated!);
        delete img.dataset.ferretAnimated;
      });
    document
      .querySelectorAll<HTMLVideoElement>("video[data-ferret-paused]")
      .forEach((video) => {
        delete video.dataset.ferretPaused;
        video.autoplay = true;
        void video.play().catch(() => {});
      });
  }
}
