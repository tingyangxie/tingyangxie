// Shared palette, fonts and drawing helpers for the profile SVGs.
// Everything is deterministic (seeded RNG) so regenerating gives stable diffs.
import { readFileSync, writeFileSync } from "node:fs";

const ROOT = new URL("../", import.meta.url);
const read = p => readFileSync(new URL(p, ROOT));

// "Paper Desk" with black handwriting over a pink highlighter
export const P = {
  desk: "#ECE7DA", dot: "#1B1B1B", dotOp: 0.22, blob: "#1B1B1B",
  win: "#FFFFFF", ink: "#1B1B1B", muted: "#7A7468", track: "#E4DFD2",
  pink: "#FF8DBF", hl: "#FF9CC8"
};

const METRICS = JSON.parse(read("fonts/metrics.json"));
export const monoWidth = (text, size) => text.length * METRICS.mono * size;
export const handWidth = (text, size) => [...text].reduce((w, c) => w + (METRICS.hand[c] ?? 0.41), 0) * size;

function fontStyle({ mono, hand }) {
  const face = (name, file) => `@font-face{font-family:"${name}";src:url(data:font/woff2;base64,${read(`fonts/${file}`).toString("base64")}) format("woff2")}`;
  let css = "";
  if (mono) css += face("TX Mono", "ShareTechMono-Regular.subset.woff2") + `.m{font-family:"TX Mono","Share Tech Mono",ui-monospace,monospace}`;
  if (hand) css += face("TX Hand", "Caveat-Bold.subset.woff2") + `.h{font-family:"TX Hand","Caveat",cursive;font-weight:700}`;
  return `<style>${css}</style>`;
}

const esc = t => String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
// SVG collapses runs of spaces; non-breaking spaces keep monospace columns aligned
export const pre = t => esc(t).replace(/ {2,}/g, m => " ".repeat(m.length));

export function svgDoc({ w, h, label, body, mono = true, hand = true }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(label)}">
<title>${esc(label)}</title>
<defs>${fontStyle({ mono, hand })}${dotPattern("dots")}${wobbleFilter("wob")}</defs>
${body}
</svg>
`;
}

export function write(file, svg) {
  writeFileSync(new URL(file, ROOT), svg);
  console.log(`${file}  ${(Buffer.byteLength(svg) / 1024).toFixed(1)} KB`);
}

// ---------- randomness + number formatting ----------
export function rng(seed) {
  return () => {
    seed |= 0; seed = seed + 0x6d2b79f5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
export const f1 = n => Math.round(n * 10) / 10;

// ---------- backgrounds ----------
const dotPattern = id => `<pattern id="${id}" width="6" height="6" patternUnits="userSpaceOnUse"><circle cx="3" cy="3" r=".75" fill="${P.dot}" fill-opacity="${P.dotOp}"/></pattern>`;
const wobbleFilter = id => `<filter id="${id}"><feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="2" seed="7"/><feDisplacementMap in="SourceGraphic" scale="2" xChannelSelector="R" yChannelSelector="G"/></filter>`;
export const desk = (w, h) => `<rect width="${w}" height="${h}" fill="${P.desk}"/><rect width="${w}" height="${h}" fill="url(#dots)"/>`;

// 1-bit stipple blobs on a grid, denser towards each centre.
// Each dot is a zero-length square-capped stroke reached by a relative move, which keeps the path short.
export function stipple(blobs, seed, cell = 3, size = 1.6) {
  const R = rng(seed);
  let d = "", px = 0, py = 0;
  for (const [cx, cy, r, k = 0.95] of blobs) {
    for (let y = cy - r; y <= cy + r; y += cell) for (let x = cx - r; x <= cx + r; x += cell) {
      const gx = Math.round(x / cell) * cell, gy = Math.round(y / cell) * cell;
      const dist = Math.hypot(gx - cx, gy - cy) / r;
      if (dist <= 1 && R() < Math.pow(1 - dist, 1.25) * k) { d += `m${gx - px} ${gy - py}h0`; px = gx; py = gy; }
    }
  }
  return `<path d="M0 0${d}" fill="none" stroke="${P.blob}" stroke-width="${size}" stroke-linecap="square"/>`;
}

// ---------- hand-drawn strokes ----------
export function sketchLine(x1, y1, x2, y2, R, j = 1.2) {
  let d = "";
  for (let pass = 0; pass < 2; pass++) {
    const o = () => (R() - 0.5) * 2 * j;
    d += `M${f1(x1 + o())} ${f1(y1 + o())}Q${f1((x1 + x2) / 2 + o() * 1.3)} ${f1((y1 + y2) / 2 + o() * 1.3)} ${f1(x2 + o())} ${f1(y2 + o())}`;
  }
  return d;
}
export const sketchRect = (x, y, w, h, R, j) =>
  sketchLine(x, y, x + w, y, R, j) + sketchLine(x + w, y, x + w, y + h, R, j) + sketchLine(x + w, y + h, x, y + h, R, j) + sketchLine(x, y + h, x, y, R, j);
export function sketchCircle(cx, cy, r, R) {
  let d = "";
  const a0 = R() * 6;
  for (let i = 0; i <= 36; i++) {
    const t = a0 + (i / 36) * Math.PI * 2.15, k = 1 + (R() - 0.5) * 0.06;
    d += (i ? "L" : "M") + f1(cx + Math.cos(t) * r * k) + " " + f1(cy + Math.sin(t) * r * k);
  }
  return d;
}
export function sketchArrow(x1, y1, cx, cy, x2, y2) {
  const a = Math.atan2(y2 - cy, x2 - cx), L = 10;
  return `M${x1} ${y1}Q${cx} ${cy} ${x2} ${y2}M${f1(x2 - L * Math.cos(a - 0.5))} ${f1(y2 - L * Math.sin(a - 0.5))}L${x2} ${y2}L${f1(x2 - L * Math.cos(a + 0.5))} ${f1(y2 - L * Math.sin(a + 0.5))}`;
}
export const inked = (d, width = 2) =>
  `<g filter="url(#wob)" fill="none" stroke="${P.ink}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round"><path d="${d}"/></g>`;

// ---------- type ----------
export const mono = (x, y, size, text, fill = P.ink, extra = "") =>
  `<text class="m" x="${x}" y="${y}" font-size="${size}" fill="${fill}" ${extra}>${pre(text)}</text>`;
// text with a hard offset shadow, like a broadcast caption
export const hardText = (x, y, size, text, off = 2.5) =>
  mono(x + off, y + off, size, text, P.pink) + mono(x, y, size, text, P.ink);
// black handwriting over a pink highlighter swipe
export function note(x, y, size, text, { anchor = "start", rot = 0 } = {}) {
  const w = handWidth(text, size), h = size * 0.62, x0 = anchor === "end" ? x - w : x;
  const swipe = `<path d="M${f1(x0 - 5)} ${f1(y - h - 1)}L${f1(x0 + w + 4)} ${f1(y - h + 2)}L${f1(x0 + w + 2)} ${f1(y + size * 0.16)}L${f1(x0 - 3)} ${f1(y + size * 0.12)}Z" fill="${P.hl}" fill-opacity=".92"/>`;
  return `<g transform="rotate(${rot} ${x} ${y})">${swipe}<text class="h" x="${x}" y="${y}" text-anchor="${anchor}" font-size="${size}" fill="${P.ink}">${esc(text)}</text></g>`;
}

// ---------- UI pieces ----------
export function win(x, y, w, h, title, body = "") {
  return `<rect x="${x + 4}" y="${y + 4}" width="${w}" height="${h}" fill="${P.ink}"/>
<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${P.win}" stroke="${P.ink}"/>
<rect x="${x}" y="${y}" width="${w}" height="18" fill="${P.ink}"/>
<rect x="${x + 6}" y="${y + 5}" width="8" height="8" fill="none" stroke="${P.win}" stroke-width="1"/>
${mono(x + 20, y + 13.5, 12.5, title, P.win)}${body}`;
}
export const check = (x, y) => `<path d="M${x} ${y + 5}l3.5 3.5l7-9" fill="none" stroke="${P.ink}" stroke-width="2" stroke-linecap="square"/>`;
export const blink = (dur, low = 0) => `<animate attributeName="opacity" values="1;${low}" dur="${dur}s" calcMode="discrete" repeatCount="indefinite"/>`;
