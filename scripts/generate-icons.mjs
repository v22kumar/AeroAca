// Renders public/icons/icon.svg to the PNG sizes the manifest needs, using the
// preinstalled Chromium via Playwright. Run: npm run icons
import { chromium } from "playwright";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const root = path.resolve(new URL(".", import.meta.url).pathname, "..");
const svg = await readFile(path.join(root, "public/icons/icon.svg"), "utf8");

const targets = [
  { file: "icon-192.png", size: 192, pad: 0 },
  { file: "icon-512.png", size: 512, pad: 0 },
  { file: "apple-touch-icon.png", size: 180, pad: 0 },
  // Maskable: artwork inside the safe zone (inner 80%), solid background to the edge.
  { file: "icon-maskable-512.png", size: 512, pad: 0.12 },
];

const browser = await chromium.launch();
const page = await browser.newPage({ deviceScaleFactor: 1 });
for (const t of targets) {
  const inner = Math.round(t.size * (1 - 2 * t.pad));
  const html = `<!doctype html><html><body style="margin:0;background:#b2416f;width:${t.size}px;height:${t.size}px;display:flex;align-items:center;justify-content:center;overflow:hidden">
    <div style="width:${inner}px;height:${inner}px">${svg.replace(/width="512" height="512"/, `width="${inner}" height="${inner}"`)}</div></body></html>`;
  await page.setViewportSize({ width: t.size, height: t.size });
  await page.setContent(html);
  const buf = await page.screenshot({ clip: { x: 0, y: 0, width: t.size, height: t.size }, omitBackground: false });
  await writeFile(path.join(root, "public/icons", t.file), buf);
  console.log("wrote", t.file, buf.length, "bytes");
}
await browser.close();
