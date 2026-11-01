# AKM Student Portal – Website

सिर्फ website। OTP हटा दिया गया है। Student login अब सादा और वैकल्पिक है (नाम सिर्फ उसी फ़ोन में रहता है)।

## क्या-क्या है
- `www/`  – वेबसाइट (index.html, config.js, icons)
- `content/updates/*.md` – हर update/गाइड का अपना पेज बनता है (Google में दिखने के लिए)
- `build.js` – इन .md फ़ाइलों से पेज, sitemap.xml और robots.txt बनाता है (अपने-आप चलता है)
- `.github/workflows/deploy-site.yml` – GitHub Pages पर अपने-आप deploy
- `supabase/schema.sql` – वैकल्पिक (नीचे भाग 7)

## 1) Hosting – GitHub Pages (मुफ़्त)
1. github.com पर free account बनाएँ।
2. **New repository** → नाम जैसे `akm-portal` → **Public** → Create।
3. इस zip की सारी files/folders repo में **Add file → Upload files** से डालें → Commit।
4. ध्यान दें: फ़ोन से upload करने पर `.github` (dot वाला folder) छूट सकता है। तब:
   Add file → **Create new file** → नाम में लिखें `.github/workflows/deploy-site.yml` → इस zip वाली उसी फ़ाइल की सामग्री पेस्ट करें → Commit।
5. Repo → **Settings → Pages → Build and deployment → Source: GitHub Actions**।
6. **Actions** टैब → "Deploy website" → **Run workflow**। 1–2 मिनट में हरा ✔ आएगा।
7. आपकी साइट: `https://आपका-username.github.io/akm-portal/`
उसके बाद `main` में हर बदलाव (नया update, config) अपने-आप live हो जाता है।
विकल्प: Netlify → Add new site → Import from Git → यही repo (settings `netlify.toml` में पहले से हैं)।

## 2) Domain (अपना नाम, जैसे akmportal.in)
**कहाँ से:** GoDaddy, Hostinger, Namecheap, Porkbun जैसे किसी भी registrar से। भारत के लिए `.in` अच्छा है, `.com` भी चलेगा।
**कीमत (2026 के बीच की जानकारी, checkout पर ज़रूर जाँचें):** `.in` का पहला साल अक्सर ₹199–₹699 (offer), renewal आम तौर पर ₹800–₹1,200 प्रति वर्ष, ऊपर से 18% GST। कुछ offers में 2–3 साल साथ खरीदने की शर्त होती है। सिर्फ पहले साल की कीमत नहीं, **renewal की कीमत** देखें।
**नाम चुनते समय:** छोटा और याद रहने वाला रखें। किसी विश्वविद्यालय/सरकारी संस्था के नाम जैसा (जैसे "magadhuniversity-official") न रखें, भ्रम और विवाद हो सकता है।

**GitHub Pages से जोड़ना:**
1. पहले GitHub में: repo → Settings → Pages → **Custom domain** में अपना domain लिखें (बिना https:// और www) → Save।
2. फिर registrar के DNS पेज में ये records डालें:
   - चार **A** records, Host `@`: `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
   - एक **CNAME**, Host `www` → `आपका-username.github.io` (repo का नाम नहीं लिखना)
3. DNS बदलने में 24 घंटे तक लग सकते हैं। फिर Pages में **Enforce HTTPS** चालू करें (यह भी 24 घंटे तक में उपलब्ध होता है)।
4. `www/config.js` में `SITE_URL: "https://आपका-domain.in"` भरें → Commit। अब sitemap और canonical बनेंगे।

## 3) नया Update कैसे जोड़ें (फ़ोन से भी)
GitHub → `content/updates` → Add file → Create new file → नाम अंग्रेज़ी में, अंत में `.md` (जैसे `ba-part1-result-2026.md`) →
`content/_template.txt` का ढाँचा पेस्ट करके अपनी जानकारी लिखें → Commit। 1–2 मिनट में उसका अलग पेज live हो जाता है, और ऐप के Updates टैब में भी दिखता है।
- title और date (YYYY-MM-DD) ज़रूरी हैं। `source:` में आधिकारिक लिंक दें।
- starter वाले 3 गाइड नमूने हैं। AdSense के लिए अपने शब्दों में, काम की, मौलिक जानकारी लिखें। दूसरों की साइट से कॉपी न करें।

## 4) WhatsApp / Telegram जॉइन बटन
WhatsApp group/channel और Telegram channel बनाएँ, उनके invite link `www/config.js` में `WHATSAPP_URL`, `TELEGRAM_URL` में भरें। बटन ऐप और हर update पेज पर दिखने लगेंगे।

## 5) Google में दिखना
Google Search Console में अपना domain जोड़ें और `https://आपका-domain.in/sitemap.xml` submit करें। नए पेज दिखने में दिन से हफ़्ते तक लग सकते हैं; कोई गारंटी नहीं।

## 6) विज्ञापन (Google AdSense)
असली domain पर पर्याप्त मौलिक content के बाद AdSense में site जोड़कर approval लें (Privacy Policy, Disclaimer, Contact मौजूद हैं)।
approve होने पर `config.js` में `ADSENSE_CLIENT` और `ADSENSE_SLOT` भरें, और `www/ads.txt` में publisher ID डालकर '#' हटाएँ।
`CONTACT_EMAIL` ज़रूर भरें।

## 7) वैकल्पिक: Supabase (admin-डेटा सबको एक जैसा)
Updates (भाग 3) Supabase के बिना चलते हैं। Supabase सिर्फ ऐप के अंदर वाले admin डेटा (कॉलेज सूची, MCQ, छोटे नोटिस, exam लिंक) को सभी के लिए एक जैसा रखता है।
1. supabase.com पर project बनाएँ → Authentication → Users → Add user (admin email + password, Auto-confirm)।
2. SQL Editor में `supabase/schema.sql` चलाएँ (आख़िरी लाइन में अपना admin email डालकर)।
3. Authentication में नए sign-up बंद करें ("Allow new users to sign up" off)।
4. Project URL और anon key `config.js` में भरें। ऐप में ⚙️ → admin login → "अभी सब कुछ cloud पर भेजें"।
यह कोड mock server पर जाँचा गया है, असली Supabase पर नहीं; पहले अपने project पर आज़माएँ।

## ज़रूरी
- Privacy Policy और Disclaimer सामान्य मसौदा हैं; असली launch से पहले किसी वकील से जँचवा लें।
- Study material और PYQ सिर्फ वही डालें जो आपका अपना हो, licensed हो, या आधिकारिक लिंक हो।
- सभी बाहरी नाम/लिंक आधिकारिक स्रोत की जानकारी के लिए हैं; साइट किसी संस्था से संबद्ध नहीं है।
