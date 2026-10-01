// Fetches the last year of contributions and renders assets/contributions.svg
// as a dot-matrix calendar: bigger squares for busier days, pink for the busiest.
// Runs daily in .github/workflows/contributions.yml; locally: GITHUB_TOKEN=$(gh auth token) node scripts/contributions.mjs
import { P, svgDoc, write, f1, desk, mono, win } from "./lib.mjs";

const LOGIN = process.env.PROFILE_LOGIN || "tingyangxie";
const TOKEN = process.env.GITHUB_TOKEN;
if (!TOKEN) throw new Error("GITHUB_TOKEN is required");

const query = `query($login: String!) { user(login: $login) { contributionsCollection { contributionCalendar {
  totalContributions weeks { contributionDays { date contributionCount } } } } } }`;
const res = await fetch("https://api.github.com/graphql", {
  method: "POST",
  headers: { Authorization: `bearer ${TOKEN}`, "Content-Type": "application/json", "User-Agent": LOGIN },
  body: JSON.stringify({ query, variables: { login: LOGIN } })
});
const json = await res.json();
if (!res.ok || json.errors) throw new Error(JSON.stringify(json.errors || json));
const { totalContributions: total, weeks } = json.data.user.contributionsCollection.contributionCalendar;

// quartiles of non-zero days, the same bucketing GitHub uses for its greens
const counts = weeks.flatMap(w => w.contributionDays.map(d => d.contributionCount)).filter(c => c > 0).sort((a, b) => a - b);
const q = p => counts[Math.floor(p * (counts.length - 1))] ?? 0;
const [q1, q2, q3] = [q(0.25), q(0.5), q(0.75)];
const level = c => (c === 0 ? 0 : c <= q1 ? 1 : c <= q2 ? 2 : c <= q3 ? 3 : 4);

const W = 830, H = 200, pitch = 13.4, x0 = 64, y0 = 64;
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
let cells = "", months = "", lastMonth = -1, lastLabel = -9;
weeks.forEach((w, i) => {
  const m = new Date(w.contributionDays[0].date + "T00:00:00Z").getUTCMonth();
  if (m !== lastMonth) {
    lastMonth = m;
    if (i - lastLabel >= 3 && i < weeks.length - 2) { months += mono(f1(x0 + i * pitch - 3), y0 - 10, 11, MONTHS[m], P.muted); lastLabel = i; }
  }
  for (const d of w.contributionDays) {
    const cx = x0 + i * pitch, cy = y0 + new Date(d.date + "T00:00:00Z").getUTCDay() * pitch, L = level(d.contributionCount);
    if (L === 0) { cells += `<rect x="${f1(cx - 0.8)}" y="${f1(cy - 0.8)}" width="1.6" height="1.6" fill="${P.ink}" opacity=".35"/>`; continue; }
    const s = [0, 4, 6.5, 8.5, 10.5][L];
    cells += `<rect x="${f1(cx - s / 2)}" y="${f1(cy - s / 2)}" width="${s}" height="${s}" fill="${L === 4 ? P.pink : P.ink}"${L === 4 ? ` stroke="${P.ink}" stroke-width=".8"` : ""}/>`;
  }
});
const days = [[1, "Mon"], [3, "Wed"], [5, "Fri"]].map(([d, t]) => mono(28, f1(y0 + d * pitch + 4), 11, t, P.muted)).join("");

// legend + timestamp along the bottom of the window
const ly = 172;
let legend = mono(560, ly, 11, "less", P.muted);
[4, 6.5, 8.5, 10.5].forEach((s, k) => {
  const cx = 600 + k * 16;
  legend += `<rect x="${f1(cx - s / 2)}" y="${f1(ly - 4 - s / 2)}" width="${s}" height="${s}" fill="${k === 3 ? P.pink : P.ink}"${k === 3 ? ` stroke="${P.ink}" stroke-width=".8"` : ""}/>`;
});
legend += mono(662, ly, 11, "more", P.muted);
const today = new Date().toISOString().slice(0, 10);

const body = `${desk(W, H)}
${win(14, 12, 798, 172, `Contributions 1.0 — ${total.toLocaleString("en-US")} in the last year`,
  `${months}${days}${cells}${mono(30, ly, 11, `auto-updated ${today}`, P.muted)}${legend}`)}`;
write("assets/contributions.svg", svgDoc({ w: W, h: H, label: `${total} contributions in the last year`, body, hand: false }));
