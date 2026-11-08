import { toCanvas } from "html-to-image";

let fontCss: Promise<string> | null = null;
function snapshotFonts() {
  // Only the fonts printed on a chapter page are needed in its texture.
  return fontCss ??= (async () => {
    const rules: string[] = [];
    for (const sheet of Array.from(document.styleSheets)) {
      try {
        for (const rule of Array.from(sheet.cssRules)) {
          if (rule instanceof CSSFontFaceRule && /Samarkan|Kalam|Anek Latin|Eczar/i.test(rule.cssText)) rules.push(rule.cssText);
        }
      } catch { /* Local font files below are same-origin. */ }
    }
    return (await Promise.all(rules.map(async rule => {
      const urls = Array.from(rule.matchAll(/url\(["']?([^"')]+)["']?\)/g));
      for (const [, url] of urls) {
        const response = await fetch(url);
        if (!response.ok) continue;
        const blob = await response.blob();
        const data = await new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = reject; reader.readAsDataURL(blob); });
        rule = rule.replace(url, data);
      }
      return rule;
    }))).join("\n");
  })();
}

export async function capturePage(page: HTMLElement) {
  await document.fonts.ready;
  await Promise.all(Array.from(page.querySelectorAll("img")).map(image => image.decode().catch(() => {})));
  return toCanvas(page, {
    pixelRatio: Math.min(devicePixelRatio, 1.25),
    fontEmbedCSS: await snapshotFonts(),
    style: { transform: "none", opacity: "1", visibility: "visible" },
    filter: node => !(node instanceof HTMLElement && node.dataset.capture === "exclude"),
  });
}

export function captureImage(image: HTMLImageElement) {
  const width = image.clientWidth, height = image.clientHeight;
  const canvas = document.createElement("canvas");
  const dpr = Math.min(devicePixelRatio || 1, 1.5);
  canvas.width = Math.max(1, Math.round(width * dpr)); canvas.height = Math.max(1, Math.round(height * dpr));
  const context = canvas.getContext("2d")!;
  context.scale(dpr, dpr);
  const contain = getComputedStyle(image).objectFit === "contain";
  const ratio = (contain ? Math.min : Math.max)(width / image.naturalWidth, height / image.naturalHeight);
  const w = image.naturalWidth * ratio, h = image.naturalHeight * ratio;
  context.drawImage(image, (width - w) / 2, (height - h) / 2, w, h);
  return canvas;
}
