#!/usr/bin/env node
// post-*.md  (या content/updates/*.md)  ->  u-*.html पेज + updates.html + updates.json + sitemap.xml + robots.txt
// GitHub Actions इसे अपने-आप चलाता है।
const fs = require("fs"), path = require("path"), vm = require("vm");
process.on("uncaughtException", e => { console.error("❌ " + e.message); process.exit(1); });
const ROOT = __dirname;
const CFG = vm.runInNewContext("var window={};" + fs.readFileSync(path.join(ROOT, "config.js"), "utf8") + ";window.AKM_CONFIG||{}", {}) || {};
const SITE = (process.env.SITE_URL || CFG.SITE_URL || "").replace(/\/+$/, "");
const NAME = "AKM Student Portal";
const esc = s => String(s == null ? "" : s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

function parse(file) {
  const raw = fs.readFileSync(file, "utf8").replace(/\r\n/g, "\n"), name = path.basename(file);
  const m = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!m) throw new Error(name + ": सबसे ऊपर --- ... --- वाला हिस्सा नहीं मिला");
  const meta = {};
  m[1].split("\n").forEach(l => { const i = l.indexOf(":"); if (i > 0) meta[l.slice(0, i).trim()] = l.slice(i + 1).trim(); });
  if (!meta.title || !meta.date) throw new Error(name + ": title और date ज़रूरी हैं");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(meta.date)) throw new Error(name + ": date YYYY-MM-DD में लिखें (जैसे 2026-11-02)");
  return { slug: name.replace(/\.md$/, "").replace(/^post-/, "").toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, ""), meta, body: m[2].trim() };
}
const FILE = "[A-Za-z0-9._-]+\\.(?:pdf|docx?|xlsx?|pptx?|zip|png|jpe?g|webp|gif)";
const IMG = new RegExp("!\\[([^\\]]*)\\]\\(((?:https?:\\/\\/[^)\\s]+)|(?:" + FILE + "))\\)", "gi");
const LNK = new RegExp("\\[([^\\]]+)\\]\\(((?:https?:\\/\\/[^)\\s]+)|(?:" + FILE + "))\\)", "gi");
const inline = t => esc(t).replace(/\*\*(.+?)\*\*/g, "<b>$1</b>").replace(IMG, '<img src="$2" alt="$1" loading="lazy">').replace(LNK, '<a href="$2" target="_blank" rel="noopener nofollow">$1</a>');
const md = b => b.split(/\n{2,}/).map(p => {
  const L = p.split("\n");
  if (L.every(l => /^\s*[-*] /.test(l))) return "<ul>" + L.map(l => "<li>" + inline(l.replace(/^\s*[-*] /, "")) + "</li>").join("") + "</ul>";
  if (/^## /.test(p)) return "<h2>" + inline(p.slice(3)) + "</h2>";
  return "<p>" + inline(L.join(" ")) + "</p>";
}).join("\n");

const CSS = `:root{--bg:#f5f5f5;--card:#fff;--tx:#0a0a0a;--mu:#6b6b70;--pr:#0a0a0a;--on:#fff;--bd:#e4e4e7;color-scheme:light dark}
@media(prefers-color-scheme:dark){:root{--bg:#000;--card:#101011;--tx:#f5f5f7;--mu:#98989f;--pr:#fff;--on:#000;--bd:#252528}}
*{box-sizing:border-box;margin:0}body{background:var(--bg);color:var(--tx);font:16px/1.75 system-ui,-apple-system,"Noto Sans Devanagari",Roboto,sans-serif;-webkit-font-smoothing:antialiased}
header{background:#000;padding:13px 14px;border-bottom:1px solid #1f1f22}header a{color:#fff;text-decoration:none;font-weight:600;letter-spacing:.3px;display:flex;align-items:center;gap:12px}
.mono{height:26px;width:auto}header span{font-size:12px;letter-spacing:.28em;text-transform:uppercase;font-weight:400}
main{max-width:720px;margin:auto;padding:16px 14px 40px}.card{background:var(--card);border:1px solid var(--bd);border-radius:16px;padding:16px;margin:14px 0}
h1{font-size:24px;line-height:1.35;margin:6px 0 8px;font-weight:700}h2{font-size:18px;margin:20px 0 6px}p,ul{margin:10px 0}ul{padding-left:22px}a{color:var(--tx)}
.mu{color:var(--mu);font-size:13px}.tag{border:1px solid var(--bd);border-radius:7px;padding:1px 8px;font-size:12px;font-weight:600}
.btn{display:block;text-align:center;background:var(--pr);color:var(--on);font-weight:600;border-radius:12px;padding:12px;text-decoration:none;margin:8px 0}
.card img{max-width:100%;height:auto;border-radius:12px;margin:10px 0;display:block}.item{display:block;text-decoration:none;color:var(--tx)}.item b{display:block;margin-top:4px}
.jn{display:flex;align-items:center;gap:12px;background:var(--bg);border:1px solid var(--bd);border-radius:14px;padding:10px 12px;text-decoration:none;color:var(--tx);margin-top:10px}.jn svg{flex:none}.jn span{flex:1;min-width:0}.jn b{display:block;font-size:15px;line-height:1.3}.jn small{color:var(--mu);font-size:13px}.jn i{font-style:normal;color:var(--mu);font-size:20px}
.ad{margin:16px 0;text-align:center}.ad small{display:block;font-size:10px;color:var(--mu)}.ft{text-align:center;font-size:13px;color:var(--mu);margin-top:26px}`;
const SVG_WA = `<svg viewBox="0 0 32 32" width="40" height="40" aria-hidden="true"><circle cx="16" cy="16" r="16" fill="#25D366"/><path d="M16 7.1A8.4 8.4 0 1 1 11.8 22.8L7.2 24.4 8.7 20A8.4 8.4 0 0 1 16 7.1Z" fill="none" stroke="#fff" stroke-width="1.8" stroke-linejoin="round"/><path transform="translate(10 9.5) scale(.5)" fill="#fff" d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/></svg>`, SVG_TG = `<svg viewBox="0 0 32 32" width="40" height="40" aria-hidden="true"><circle cx="16" cy="16" r="16" fill="#229ED9"/><path fill="#fff" d="M7.2 15.5l16.3-6.3c.76-.28 1.42.18 1.18 1.33l-2.77 13.05c-.2.93-.76 1.15-1.54.72l-4.2-3.1-2.03 1.96c-.22.22-.41.41-.84.41l.3-4.28 7.78-7.03c.34-.3-.07-.47-.52-.17l-9.62 6.06-4.15-1.3c-.9-.28-.92-.9.19-1.34z"/></svg>`;
const jn = (u, svg, t) => `<a class="jn" href="${esc(u)}" target="_blank" rel="noopener">${svg}<span><b>${t}</b><small>जॉइन करें · रोज़ के updates</small></span><i>›</i></a>`;
function joinBlock() {
  const a = [];
  if (CFG.WHATSAPP_URL) a.push(jn(CFG.WHATSAPP_URL, SVG_WA, "WhatsApp Channel"));
  if (CFG.TELEGRAM_URL) a.push(jn(CFG.TELEGRAM_URL, SVG_TG, "Telegram Channel"));
  return a.length ? `<div class="card"><b>📲 रोज़ के updates सीधे फ़ोन पर पाएँ</b>${a.join("")}</div>` : "";
}
function adBlock() {
  return CFG.ADSENSE_CLIENT && CFG.ADSENSE_SLOT
    ? `<div class="ad"><small>विज्ञापन</small><ins class="adsbygoogle" style="display:block" data-ad-client="${esc(CFG.ADSENSE_CLIENT)}" data-ad-slot="${esc(CFG.ADSENSE_SLOT)}" data-ad-format="auto" data-full-width-responsive="true"></ins><script>(adsbygoogle=window.adsbygoogle||[]).push({});</script></div>` : "";
}
function shell({ title, desc, p, body, ld, og }) {
  const canon = SITE ? SITE + p : "";
  const adsJs = CFG.ADSENSE_CLIENT && CFG.ADSENSE_SLOT ? `<script async crossorigin="anonymous" src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(CFG.ADSENSE_CLIENT)}"></script>` : "";
  return `<!DOCTYPE html><html lang="hi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title><meta name="description" content="${esc(desc)}">${canon ? `<link rel="canonical" href="${esc(canon)}">` : ""}
<meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}"><meta property="og:type" content="article">${SITE ? `<meta property="og:image" content="${esc(og || SITE + "/og.png")}"><meta name="twitter:card" content="summary_large_image">` : ""}<meta name="theme-color" content="#000000">
<link rel="icon" href="icon-192.png">${ld && SITE ? `<script type="application/ld+json">${JSON.stringify(ld).replace(/</g, "\\u003c")}</script>` : ""}${adsJs}<style>${CSS}</style></head>
<body><header><a href="./"><img class="mono" src="mono-white.png" alt="AKM"><span>Student Portal</span></a></header><main>${body}
<div class="ft"><a href="./#disclaimer">Disclaimer</a> · <a href="./#privacy">Privacy Policy</a> · <a href="updates.html">सभी Updates</a><p>${NAME} एक स्वतंत्र शैक्षिक वेबसाइट है; किसी विश्वविद्यालय या सरकारी संस्था से संबद्ध नहीं। अंतिम जानकारी आधिकारिक वेबसाइट से जाँचें।</p></div></main></body></html>`;
}


// ---- data.txt  ->  data.json  (कॉलेज, लिंक, MCQ, study material आदि) ----
function parseData() {
  const fp = path.join(ROOT, "data.txt");
  if (!fs.existsSync(fp)) return;
  const out = { unis: [], colleges: [], uniLinks: [], collegeLinks: [], notices: [], collegeNotices: [], study: [], mcq: [], cx: [], sx: [] };
  const okU = u => !u || /^https?:\/\//i.test(u) || new RegExp("^" + FILE + "$", "i").test(u);
  const need = (c, ln, msg) => { if (!c) throw new Error(`data.txt लाइन ${ln}: ${msg}`); };
  const nm = s => { const q = s.split("@"); return { n: q[0].trim(), p: (q[1] || "").trim() }; };
  const lk = (a, ln) => { const l = {}; ["ad", "ex", "rs", "sy"].forEach((k, i) => { if (a[i]) { need(okU(a[i]), ln, "लिंक https:// से शुरू होना चाहिए (या फ़ाइल का नाम, जैसे notes.pdf): " + a[i]); l[k] = a[i]; } }); return l; };
  const SECS = ["universities", "colleges", "uni-links", "college-links", "notices", "college-notices", "study", "mcq", "central-exams", "state-exams"];
  let sec = "";
  fs.readFileSync(fp, "utf8").replace(/\r\n/g, "\n").split("\n").forEach((raw, i) => {
    const ln = i + 1, line = raw.trim();
    if (!line || line.startsWith("#")) return;
    const sm = line.match(/^\[([a-z-]+)\]$/i);
    if (sm) { sec = sm[1].toLowerCase(); need(SECS.includes(sec), ln, "अज्ञात हिस्सा [" + sec + "]"); return; }
    need(sec, ln, "पहले [हिस्से का नाम] लिखें");
    const f = line.split("|").map(s => s.trim());
    if (sec === "universities") { need(f.length >= 5 && /^[a-z0-9-]+$/.test(f[0]), ln, "ढाँचा: id | Short | पूरा नाम | शहर | Type | Website (id में छोटे अक्षर/अंक/-)"); need(["State", "Central", "Institute"].includes(f[4]), ln, "Type State, Central या Institute लिखें"); need(okU(f[5]), ln, "Website का लिंक https:// से शुरू करें"); out.unis.push({ id: f[0], s: f[1], n: f[2], c: f[3], t: f[4], u: f[5] || "", v: 0, l: {} }); }
    else if (sec === "colleges") { need(f.length >= 3 && f[0] && f[1] && f[2], ln, "ढाँचा: uni-id | College नाम | जगह | Type | Website"); need(okU(f[4]), ln, "Website का लिंक https:// से शुरू करें"); out.colleges.push({ uid: f[0], n: f[1], p: f[2], t: /^c/i.test(f[3] || "") ? "Constituent" : "Affiliated", u: f[4] || "", nt: [] }); }
    else if (sec === "uni-links") { need(f[0], ln, "ढाँचा: uni-id | Website | Admission | Exam Form | Result | Syllabus"); need(okU(f[1]), ln, "Website का लिंक सही नहीं"); out.uniLinks.push({ id: f[0], u: f[1] || "", l: lk(f.slice(2), ln) }); }
    else if (sec === "college-links") { need(f[0], ln, "ढाँचा: College नाम | Website | Admission | Exam Form | Result | Syllabus"); need(okU(f[1]), ln, "Website का लिंक सही नहीं"); out.collegeLinks.push({ ...nm(f[0]), u: f[1] || "", l: lk(f.slice(2), ln) }); }
    else if (sec === "notices") { need(/^\d{4}-\d{2}-\d{2}$/.test(f[0]) && f[1], ln, "ढाँचा: 2026-11-02 | शीर्षक | विवरण"); out.notices.push({ d: f[0], t: f[1], x: f.slice(2).join(" | ") }); }
    else if (sec === "college-notices") { need(f[0] && /^\d{4}-\d{2}-\d{2}$/.test(f[1]) && f[2], ln, "ढाँचा: College नाम | 2026-11-02 | शीर्षक | विवरण"); out.collegeNotices.push({ ...nm(f[0]), d: f[1], t: f[2], x: f.slice(3).join(" | ") }); }
    else if (sec === "study") { need(f[0] && f[2], ln, "ढाँचा: Course | Subject | शीर्षक | नोट्स | लिंक/PDF"); need(okU(f[4]), ln, "लिंक https:// से शुरू करें या फ़ाइल का नाम लिखें (जैसे notes.pdf)"); out.study.push({ c: f[0], s: f[1] || "", t: f[2], x: f[3] || "", u: f[4] || "" }); }
    else if (sec === "mcq") { const a = "ABCD".indexOf((f[5] || "").toUpperCase()); need(f[0] && f[1] && f[2] && a > -1, ln, "ढाँचा: सवाल | A | B | C | D | सही उत्तर (A/B/C/D)"); out.mcq.push({ q: f[0], o: [f[1], f[2], f[3], f[4]].filter(Boolean), a }); }
    else { need(f[0] && f[2], ln, "ढाँचा: Exam नाम | संस्था | Official लिंक | Syllabus लिंक | PYQ लिंक"); need(okU(f[2]) && okU(f[3]) && okU(f[4]), ln, "लिंक https:// से शुरू करें"); (sec === "central-exams" ? out.cx : out.sx).push({ n: f[0], b: f[1] || "", u: f[2], sy: f[3] || "", pq: f[4] || "" }); }
  });
  fs.writeFileSync(path.join(ROOT, "data.json"), JSON.stringify(out));
  console.log(`✅ data.txt: ${out.colleges.length} college, ${out.unis.length} university, ${out.mcq.length} MCQ, ${out.study.length} study, ${out.cx.length + out.sx.length} exam`);
}
parseData();

const files = [];
const dir = path.join(ROOT, "content", "updates");
if (fs.existsSync(dir)) fs.readdirSync(dir).filter(f => f.endsWith(".md")).forEach(f => files.push(path.join(dir, f)));
fs.readdirSync(ROOT).filter(f => /^post-.+\.md$/.test(f)).forEach(f => files.push(path.join(ROOT, f)));
if (!files.length) { console.log("ℹ️  कोई post-*.md फ़ाइल नहीं मिली; मौजूदा update पेज जैसे हैं वैसे रखे गए।"); process.exit(0); }

const items = files.map(parse).sort((a, b) => b.meta.date.localeCompare(a.meta.date));
const seen = new Set(); items.forEach(u => { if (seen.has(u.slug)) throw new Error("एक ही नाम की दो फ़ाइलें: " + u.slug); seen.add(u.slug); });
fs.readdirSync(ROOT).filter(f => /^u-.+\.html$/.test(f)).forEach(f => fs.rmSync(path.join(ROOT, f)));
const card = u => `<a class="card item" href="u-${u.slug}.html"><span class="mu">${esc(u.meta.date)} · <span class="tag">${esc(u.meta.category || "Update")}</span></span><b>${esc(u.meta.title)}</b>${u.meta.summary ? `<span class="mu">${esc(u.meta.summary)}</span>` : ""}</a>`;

items.forEach(u => {
  const m = u.meta, p = `/u-${u.slug}.html`;
  const desc = m.summary || u.body.replace(/[#*\[\]()\-\n]+/g, " ").replace(/\s+/g, " ").slice(0, 150);
  const im = m.image && /^(https?:\/\/\S+|[\w.-]+\.(png|jpe?g|webp|gif))$/i.test(m.image) ? m.image : "";
  const related = items.filter(x => x !== u).slice(0, 4).map(card).join("");
  const body = `<p class="mu"><a href="updates.html">← सभी Updates</a></p><h1>${esc(m.title)}</h1>
<p class="mu">${esc(m.date)} · <span class="tag">${esc(m.category || "Update")}</span>${m.university ? " · " + esc(m.university) : ""}</p>
${im ? `<img src="${esc(im)}" alt="${esc(m.title)}" style="max-width:100%;height:auto;border-radius:14px;margin:8px 0">` : ""}<div class="card">${md(u.body)}</div>
${m.source ? `<a class="btn" href="${esc(m.source)}" target="_blank" rel="noopener nofollow">📌 आधिकारिक वेबसाइट / नोटिस खोलें</a>` : ""}
${adBlock()}${joinBlock()}${related ? `<h2>और updates</h2>${related}` : ""}`;
  fs.writeFileSync(path.join(ROOT, `u-${u.slug}.html`), shell({
    title: `${m.title} | ${NAME}`, desc, p, body, og: im ? (/^https?:/.test(im) ? im : SITE + "/" + im) : "",
    ld: { "@context": "https://schema.org", "@type": "Article", headline: m.title, datePublished: m.date, dateModified: m.date, inLanguage: "hi",
      author: { "@type": "Organization", name: NAME }, publisher: { "@type": "Organization", name: NAME }, mainEntityOfPage: SITE + p }
  }));
});
fs.writeFileSync(path.join(ROOT, "updates.html"), shell({
  title: `Updates: Admission, Exam, Result | ${NAME}`, desc: "विश्वविद्यालय और प्रतियोगी परीक्षाओं के updates, गाइड और आधिकारिक लिंक।", p: "/updates.html",
  body: `<p class="mu"><a href="./">← होम</a></p><h1>📰 Updates</h1>${items.map(card).join("")}${adBlock()}${joinBlock()}`
}));
fs.writeFileSync(path.join(ROOT, "updates.json"), JSON.stringify(items.map(u => ({ slug: u.slug, title: u.meta.title, date: u.meta.date, category: u.meta.category || "Update", university: u.meta.university || "", summary: u.meta.summary || "" }))));
fs.writeFileSync(path.join(ROOT, "robots.txt"), "User-agent: *\nAllow: /\n" + (SITE ? `Sitemap: ${SITE}/sitemap.xml\n` : ""));
if (SITE) {
  const u = [[SITE + "/", ""], [SITE + "/updates.html", ""]].concat(items.map(i => [`${SITE}/u-${i.slug}.html`, i.meta.date]));
  fs.writeFileSync(path.join(ROOT, "sitemap.xml"), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${u.map(([l, d]) => `<url><loc>${esc(l)}</loc>${d ? `<lastmod>${d}</lastmod>` : ""}</url>`).join("\n")}\n</urlset>\n`);
}
const ip = path.join(ROOT, "index.html");
if (fs.existsSync(ip)) {
  const og = SITE ? `<meta property="og:image" content="${SITE}/og.png"><meta property="og:url" content="${SITE}/"><meta name="twitter:card" content="summary_large_image">` : "";
  fs.writeFileSync(ip, fs.readFileSync(ip, "utf8").replace(/<!--OG-->[\s\S]*?<!--\/OG-->/, "<!--OG-->" + og + "<!--/OG-->"));
}
console.log(`✅ ${items.length} update पेज बने${SITE ? ", sitemap.xml बना" : " (config.js में SITE_URL नहीं है, sitemap नहीं बना)"}`);
