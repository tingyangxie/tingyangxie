// Renders the static profile SVGs: header, project cards, footer.
// Usage: node scripts/build.mjs
import {
  P, svgDoc, write, rng, f1, desk, stipple, sketchLine, sketchRect, sketchCircle, sketchArrow, inked,
  mono, hardText, note, win, check, blink, monoWidth
} from "./lib.mjs";

// ---------- header ----------
function header() {
  const W = 830, H = 420;
  let mx = 104, menu = "";
  for (const m of ["File", "Edit", "Agents", "Verify", "Help"]) { menu += mono(mx, 16, 13, m); mx += monoWidth(m, 13) + 20; }

  const T = (y, t, c) => mono(50, y, 15.5, t, c);
  const terminal = [
    T(246, "$ cat focus.txt", P.muted), T(267, "reliable AI agents · agent evaluation"), T(288, "empirical software engineering"),
    T(318, "$ ls ~/now", P.muted), T(339, "research/  foodshutter/  tingyangxie.com/"), T(369, "$", P.muted),
    `<rect x="64" y="356" width="9" height="16" fill="${P.ink}">${blink(1.1)}</rect>`
  ].join("");

  // FormulaEdge: two cars chasing round a stadium track; the pink one keeps overtaking
  const track = "M575 92H715A38 38 0 0 1 715 168H575A38 38 0 0 1 575 92Z";
  const car = (fill, dur, begin) => `<g><rect x="-7" y="-4" width="14" height="8" rx="1.5" fill="${fill}" stroke="${P.ink}"/><rect x="2" y="-3" width="3" height="6" fill="${P.win}" opacity=".8"/><animateMotion dur="${dur}s" begin="${begin}s" repeatCount="indefinite" rotate="auto"><mpath href="#track"/></animateMotion></g>`;
  const formulaEdge = `<path id="track" d="${track}" fill="none" stroke="${P.track}" stroke-width="16"/>
<path d="${track}" fill="none" stroke="${P.ink}" stroke-dasharray="3 5" opacity=".55"/>
<path d="M645 84v16" stroke="${P.ink}" stroke-width="2" stroke-dasharray="2 2"/>
${car(P.ink, 5.4, 0)}${car(P.pink, 5, -0.6)}
${mono(504, 200, 12.5, "1st runner-up · Macau · 2024", P.muted)}`;

  const checks = `${check(506, 256)}${mono(526, 266, 15.5, "build passed")}
${check(506, 279)}${mono(526, 289, 15.5, "all tests passed")}
<path d="M500 298L724 296L722 317L502 318Z" fill="${P.hl}" fill-opacity=".92"/>
<text class="m" x="507" y="313" font-size="17" fill="${P.ink}">?${blink(1.4, 0.15)}</text>
${mono(526, 312, 15.5, "did it follow the rules")}`;

  const nameEnd = 32 + monoWidth("Tingyang Xie", 38);
  const body = `${desk(W, H)}
${stipple([[470, 440, 130, 0.8], [840, 250, 120, 0.85], [-10, 430, 100, 0.7], [420, -20, 90, 0.6]], 11)}
<rect width="${W}" height="22" fill="${P.win}"/><rect y="22" width="${W}" height="1" fill="${P.ink}"/>
<path d="M18 5l6 6l-6 6l-6-6z" fill="${P.ink}"/>${mono(32, 16, 13, "tingyang", P.ink, 'font-weight="700"')}${menu}
${mono(812, 16, 13, "Macau · UTC+8", P.ink, 'text-anchor="end"')}
${hardText(32, 76, 38, "Tingyang Xie")}
<rect x="34.5" y="90.5" width="330" height="3" fill="${P.pink}"/><rect x="32" y="88" width="330" height="3" fill="${P.ink}"/>
${hardText(32, 122, 21, "Base: Macau, China", 2)}
${hardText(32, 150, 21, "Now:  CS @ MUST", 2)}
${hardText(32, 178, 21, "Next: MS in CS, Fall 2027", 2)}
${inked(sketchArrow(f1(nameEnd + 40), 62, f1(nameEnd + 26), 54, f1(nameEnd + 8), 60))}
${note(f1(nameEnd + 46), 72, 25, "hi, that's me")}
${win(32, 206, 420, 190, "~/tingyang — zsh", terminal)}
${win(492, 52, 306, 158, "FormulaEdge 1.0", formulaEdge)}
${win(492, 230, 306, 98, "Checks 1.0", checks)}
${inked(sketchArrow(540, 362, 512, 356, 508, 334))}
${note(548, 370, 25, "the question I keep chasing")}`;
  return svgDoc({ w: W, h: H, label: "Tingyang Xie — building AI agents and checking they actually work", body });
}

// ---------- project cards ----------
const ICONS = {
  camera: R => sketchRect(8, 14, 48, 34, R, 1) + sketchRect(20, 7, 16, 8, R, 0.8) + sketchCircle(32, 31, 10, R) + sketchCircle(32, 31, 4, R),
  car: R => sketchLine(6, 34, 58, 34, R, 0.8) + sketchLine(10, 34, 16, 22, R, 0.8) + sketchLine(16, 22, 44, 22, R, 0.8) + sketchLine(44, 22, 54, 34, R, 0.8) +
    sketchCircle(18, 38, 6, R) + sketchCircle(46, 38, 6, R) + sketchLine(24, 14, 38, 14, R, 0.6) + sketchLine(31, 14, 31, 22, R, 0.6),
  calendar: R => sketchRect(8, 12, 48, 40, R, 1) + sketchLine(8, 22, 56, 22, R, 0.8) + sketchLine(20, 6, 20, 16, R, 0.6) + sketchLine(44, 6, 44, 16, R, 0.6) +
    sketchRect(16, 28, 7, 6, R, 0.5) + sketchRect(28, 28, 7, 6, R, 0.5) + sketchRect(40, 28, 7, 6, R, 0.5) + sketchRect(16, 39, 7, 6, R, 0.5)
};
export const PROJECTS = [
  { slug: "foodshutter", file: "FoodShutter.app", name: "FoodShutter", icon: "camera", desc: ["Snap a meal, get its", "nutrition breakdown."], tags: ["iOS", "SwiftUI"], note: "App Store soon!" },
  { slug: "formulaedge", file: "FormulaEdge", name: "FormulaEdge", icon: "car", desc: ["Self-driving RC car", "on a Jetson Nano."], tags: ["PyTorch", "Jetson"], note: "2nd in Macau!" },
  { slug: "launch-tracker", file: "launch-tracker", name: "Launch Tracker", icon: "calendar", desc: ["Interactive product", "release calendar."], tags: ["Next.js", "Supabase"], note: "rebuilding!" }
];
function card(p, seed) {
  const W = 270, H = 176, R = rng(seed);
  let tx = 16, tags = "";
  for (const t of p.tags) {
    const w = monoWidth(t, 12) + 12;
    tags += `<rect x="${tx}" y="136" width="${f1(w)}" height="17" fill="${P.ink}"/>${mono(tx + 6, 149, 12, t, P.win)}`;
    tx += w + 5;
  }
  const body = `${desk(W, H)}
${win(8, 8, 250, 156, p.file)}
<g transform="translate(16,38)">${inked(ICONS[p.icon](R), 1.5)}</g>
${mono(90, 62, 19, p.name)}
${mono(90, 86, 13, p.desc[0], P.muted)}${mono(90, 104, 13, p.desc[1], P.muted)}
${tags}
${note(250, 152, 21, p.note, { anchor: "end", rot: -4 })}`;
  return svgDoc({ w: W, h: H, label: `${p.name} — ${p.desc.join(" ")} ${p.tags.join(", ")}`, body });
}

// ---------- footer ----------
function footer() {
  const W = 830, H = 40;
  const body = `${desk(W, H)}<rect width="${W}" height="1" fill="${P.ink}" opacity=".5"/>
${mono(18, 25, 13, "© 2026 Tingyang Xie · Macau")}
${note(812, 27, 22, "built by hand, checked by machine", { anchor: "end" })}`;
  return svgDoc({ w: W, h: H, label: "Built by hand, checked by machine", body });
}

write("assets/header.svg", header());
PROJECTS.forEach((p, i) => write(`assets/card-${p.slug}.svg`, card(p, 20 + i)));
write("assets/footer.svg", footer());
