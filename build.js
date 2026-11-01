#!/usr/bin/env node
// content/updates/*.md  ->  www/updates/*.html (Google में दिखने वाले अलग-अलग पेज) + index + sitemap.xml + robots.txt
// चलाएँ:  node build.js      (GitHub Actions / Netlify यह अपने-आप चलाते हैं)
const fs = require("fs"), path = require("path"), vm = require("vm");
const WWW = path.join(__dirname, "www"), SRC = path.join(__dirname, "content", "updates"), OUT = path.join(WWW, "updates");
const CFG = vm.runInNewContext("var window={};" + fs.readFileSync(path.join(WWW, "config.js"), "utf8") + ";window.AKM_CONFIG||{}", {}) || {};
const SITE = (process.env.SITE_URL || CFG.SITE_URL || "").replace(/\/+$/, "");
const NAME = "AKM Student Portal";
const esc = s => String(s == null ? "" : s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

function parse(file) {
  const raw = fs.readFileSync(file, "utf8").replace(/\r\n/g, "\n");
  const m = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!m) throw new Error(path.basename(file) + ": सबसे ऊपर --- ... --- वाला हिस्सा (front matter) नहीं मिला");
  const meta = {};
  m[1].split("\n").forEach(l => { const i = l.indexOf(":"); if (i > 0) meta[l.slice(0, i).trim()] = l.slice(i + 1).trim(); });
  if (!meta.title || !meta.date) throw new Error(path.basename(file) + ": title और date ज़रूरी हैं");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(meta.date)) throw new Error(path.basename(file) + ": date YYYY-MM-DD में लिखें (जैसे 2026-11-02)");
  return { slug: path.basename(file, ".md").toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, ""), meta, body: m[2].trim() };
}
const inline = t => esc(t).replace(/\*\*(.+?)\*\*/g, "<b>$1</b>").replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener nofollow">$1</a>');
const md = b => b.split(/\n{2,}/).map(p => {
  const L = p.split("\n");
  if (L.every(l => /^\s*[-*] /.test(l))) return "<ul>" + L.map(l => "<li>" + inline(l.replace(/^\s*[-*] /, "")) + "</li>").join("") + "</ul>";
  if (/^## /.test(p)) return "<h2>" + inline(p.slice(3)) + "</h2>";
  return "<p>" + inline(L.join(" ")) + "</p>";
}).join("\n");

const CSS = `:root{--bg:#f5f5f5;--card:#fff;--tx:#0a0a0a;--mu:#6b6b70;--pr:#0a0a0a;--on:#fff;--bd:#e4e4e7;color-scheme:light dark}
@media(prefers-color-scheme:dark){:root{--bg:#000;--card:#101011;--tx:#f5f5f7;--mu:#98989f;--pr:#fff;--on:#000;--bd:#252528}}
*{box-sizing:border-box;margin:0}body{background:var(--bg);color:var(--tx);font:16px/1.75 system-ui,-apple-system,"Noto Sans Devanagari",Roboto,sans-serif;-webkit-font-smoothing:antialiased}
header{background:#000;padding:13px 14px;border-bottom:1px solid #1f1f22}header a{color:#fff;text-decoration:none;font-weight:600;letter-spacing:.3px}
header a{display:flex;align-items:center;gap:12px}.mono{height:26px;width:auto}header span{font-size:12px;letter-spacing:.28em;text-transform:uppercase;font-weight:400}
main{max-width:720px;margin:auto;padding:16px 14px 40px}.card{background:var(--card);border:1px solid var(--bd);border-radius:16px;padding:16px;margin:14px 0}
h1{font-size:24px;line-height:1.35;margin:6px 0 8px;font-weight:700}h2{font-size:18px;margin:20px 0 6px}p,ul{margin:10px 0}ul{padding-left:22px}a{color:var(--tx)}
.mu{color:var(--mu);font-size:13px}.tag{border:1px solid var(--bd);border-radius:7px;padding:1px 8px;font-size:12px;font-weight:600}
.btn{display:block;text-align:center;background:var(--pr);color:var(--on);font-weight:600;border-radius:12px;padding:12px;text-decoration:none;margin:8px 0}
.btn.alt{background:transparent;color:var(--tx);border:1px solid var(--tx)}.item{display:block;text-decoration:none;color:var(--tx)}.item b{display:block;margin-top:4px}
.ad{margin:16px 0;text-align:center}.ad small{display:block;font-size:10px;color:var(--mu)}.ft{text-align:center;font-size:13px;color:var(--mu);margin-top:26px}`;

function adBlock() {
  return CFG.ADSENSE_CLIENT && CFG.ADSENSE_SLOT
    ? `<div class="ad"><small>विज्ञापन</small><ins class="adsbygoogle" style="display:block" data-ad-client="${esc(CFG.ADSENSE_CLIENT)}" data-ad-slot="${esc(CFG.ADSENSE_SLOT)}" data-ad-format="auto" data-full-width-responsive="true"></ins><script>(adsbygoogle=window.adsbygoogle||[]).push({});</script></div>` : "";
}
function joinBlock() {
  const a = [];
  if (CFG.WHATSAPP_URL) a.push(`<a class="btn" href="${esc(CFG.WHATSAPP_URL)}" rel="noopener">💬 WhatsApp Channel जॉइन करें</a>`);
  if (CFG.TELEGRAM_URL) a.push(`<a class="btn alt" href="${esc(CFG.TELEGRAM_URL)}" rel="noopener">✈️ Telegram Channel जॉइन करें</a>`);
  return a.length ? `<div class="card"><b>📲 रोज़ के updates सीधे फ़ोन पर पाएँ</b>${a.join("")}</div>` : "";
}
function shell({ title, desc, path: p, body, ld }) {
  const canon = SITE ? SITE + p : "";
  const adsJs = CFG.ADSENSE_CLIENT && CFG.ADSENSE_SLOT ? `<script async crossorigin="anonymous" src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(CFG.ADSENSE_CLIENT)}"></script>` : "";
  return `<!DOCTYPE html><html lang="hi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title><meta name="description" content="${esc(desc)}">${canon ? `<link rel="canonical" href="${esc(canon)}">` : ""}
<meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}"><meta property="og:type" content="article">${SITE ? `<meta property="og:image" content="${esc(SITE)}/brand/og.png"><meta name="twitter:card" content="summary_large_image">` : ""}<meta name="theme-color" content="#000000">
<link rel="icon" href="../icons/icon-192.png">${ld && SITE ? `<script type="application/ld+json">${JSON.stringify(ld).replace(/</g, "\\u003c")}</script>` : ""}${adsJs}<style>${CSS}</style></head>
<body><header><a href="../"><img class="mono" src="../brand/mono-white.png" alt="AKM"><span>Student Portal</span></a></header><main>${body}
<div class="ft"><a href="../#disclaimer">Disclaimer</a> · <a href="../#privacy">Privacy Policy</a> · <a href="./">सभी Updates</a><p>${NAME} एक स्वतंत्र शैक्षिक वेबसाइट है; किसी विश्वविद्यालय या सरकारी संस्था से संबद्ध नहीं। अंतिम जानकारी आधिकारिक वेबसाइट से जाँचें।</p></div></main></body></html>`;
}

const files = fs.existsSync(SRC) ? fs.readdirSync(SRC).filter(f => f.endsWith(".md")) : [];
const items = files.map(f => parse(path.join(SRC, f))).sort((a, b) => b.meta.date.localeCompare(a.meta.date));
const slugs = new Set(); items.forEach(u => { if (slugs.has(u.slug)) throw new Error("एक ही नाम की दो फ़ाइलें: " + u.slug); slugs.add(u.slug); });
fs.rmSync(OUT, { recursive: true, force: true }); fs.mkdirSync(OUT, { recursive: true });
const card = u => `<a class="card item" href="${u.slug}.html"><span class="mu">${esc(u.meta.date)} · <span class="tag">${esc(u.meta.category || "Update")}</span></span><b>${esc(u.meta.title)}</b>${u.meta.summary ? `<span class="mu">${esc(u.meta.summary)}</span>` : ""}</a>`;

items.forEach(u => {
  const m = u.meta, p = `/updates/${u.slug}.html`;
  const desc = m.summary || u.body.replace(/[#*\[\]()\-\n]+/g, " ").replace(/\s+/g, " ").slice(0, 150);
  const related = items.filter(x => x !== u).slice(0, 4).map(card).join("");
  const body = `<p class="mu"><a href="./">← सभी Updates</a></p><h1>${esc(m.title)}</h1>
<p class="mu">${esc(m.date)} · <span class="tag">${esc(m.category || "Update")}</span>${m.university ? " · " + esc(m.university) : ""}</p>
<div class="card">${md(u.body)}</div>
${m.source ? `<a class="btn" href="${esc(m.source)}" target="_blank" rel="noopener nofollow">📌 आधिकारिक वेबसाइट / नोटिस खोलें</a>` : ""}
${adBlock()}${joinBlock()}${related ? `<h2>और updates</h2>${related}` : ""}`;
  fs.writeFileSync(path.join(OUT, u.slug + ".html"), shell({
    title: `${m.title} | ${NAME}`, desc, path: p, body,
    ld: { "@context": "https://schema.org", "@type": "Article", headline: m.title, datePublished: m.date, dateModified: m.date, inLanguage: "hi",
      author: { "@type": "Organization", name: NAME }, publisher: { "@type": "Organization", name: NAME }, mainEntityOfPage: SITE + p }
  }));
});
fs.writeFileSync(path.join(OUT, "index.html"), shell({
  title: `Updates: Admission, Exam, Result | ${NAME}`, desc: "विश्वविद्यालय और प्रतियोगी परीक्षाओं के updates, गाइड और आधिकारिक लिंक।", path: "/updates/",
  body: `<p class="mu"><a href="../">← होम</a></p><h1>📰 Updates</h1>${items.map(card).join("") || '<p class="mu">अभी कोई update नहीं।</p>'}${adBlock()}${joinBlock()}`
}));
fs.writeFileSync(path.join(OUT, "index.json"), JSON.stringify(items.map(u => ({ slug: u.slug, title: u.meta.title, date: u.meta.date, category: u.meta.category || "Update", university: u.meta.university || "", summary: u.meta.summary || "" }))));
fs.writeFileSync(path.join(WWW, "robots.txt"), "User-agent: *\nAllow: /\n" + (SITE ? `Sitemap: ${SITE}/sitemap.xml\n` : ""));
if (SITE) {
  const u = [[SITE + "/", ""], [SITE + "/updates/", ""]].concat(items.map(i => [`${SITE}/updates/${i.slug}.html`, i.meta.date]));
  fs.writeFileSync(path.join(WWW, "sitemap.xml"), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${u.map(([l, d]) => `<url><loc>${esc(l)}</loc>${d ? `<lastmod>${d}</lastmod>` : ""}</url>`).join("\n")}\n</urlset>\n`);
} else console.warn("⚠️  config.js में SITE_URL नहीं भरा: sitemap.xml और canonical नहीं बने। अपना domain मिलने पर भरें।");
{ // मुख्य पेज (index.html) के og:image टैग, SITE_URL मिलने पर
  const ip = path.join(WWW, "index.html");
  if (fs.existsSync(ip)) {
    const og = SITE ? `<meta property="og:image" content="${SITE}/brand/og.png"><meta property="og:url" content="${SITE}/"><meta name="twitter:card" content="summary_large_image">` : "";
    fs.writeFileSync(ip, fs.readFileSync(ip, "utf8").replace(/<!--OG-->[\s\S]*?<!--\/OG-->/, "<!--OG-->" + og + "<!--/OG-->"));
  }
}
console.log(`✅ ${items.length} update pages बने${SITE ? ", sitemap.xml बना" : ""}`);
