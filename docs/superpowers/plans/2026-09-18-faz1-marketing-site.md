# Faz 1 — Pazarlama Sitesi (11ty) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `atakanunver/tesisat-site` reposundaki boş placeholder'ı, gerçek kampanya/fiyat bilgisini `config/business.yaml`'dan okuyan, mobil-first, SEO'lu, çok sayfalı bir Eleventy (11ty) statik sitesine dönüştürmek.

**Architecture:** Sunucu/veritabanı yok. `config/business.yaml` tek doğru veri kaynağı; 11ty build-time'da bunu okuyup Nunjucks şablonlarına enjekte eder. WhatsApp CTA'ları client-side saf JS ile `utm_source`'a göre dinamik mesaj kurar. Site `https://atakanunver.github.io/tesisat-site/` adresinde bir GitHub Pages "project page" olarak yayınlanacağı için tüm dahili asset/link referansları bir `site.base` (`/tesisat-site`) öneki taşır — özel domain alınırsa bu tek bir data dosyasında `""`e çevrilir. Çıktı `_site/` altında üretilir ve GitHub Actions ile Pages'e deploy edilir.

**Tech Stack:** Node.js + Eleventy (`@11ty/eleventy`) + Nunjucks + `js-yaml`. Test için Node'un yerleşik `node:test` çalıştırıcısı (ek framework yok). CSS/JS elle yazılır, build aracı gerektirmez.

**Spec:** `docs/superpowers/specs/2026-09-18-marketing-site-design.md`

## Global Constraints

- Fiyatlar/kampanya bilgisi SADECE `config/business.yaml`'dan okunur, hiçbir şablonda hardcode edilmez.
- Kampanya: Kombi bakımı 3.000 TL, petek temizliği 2.000 TL, paket 4.000 TL (normal toplam 5.000 TL), 15 peteğe kadar, tüm marka kombiler, 6 ay garanti.
- Telefon: `0534 682 55 60` (E.164: `905346825560`). Adres: `Kalekapı Mah. İstasyon Cad. Hocalar Sokak, 18300 Kurşunlu/Çankırı`. Çalışma saati: 7/24.
- Hizmet bölgesi sayfaları SADECE Çankırı ve Kastamonu il düzeyinde (`/cankiri-kombi-bakimi`, `/cankiri-petek-temizligi`, `/kastamonu-kombi-bakimi`, `/kastamonu-petek-temizligi`) — gerçekte hizmet verilmeyen bir ilçe/il varmış gibi gösterilmez, ilçe bazlı sayfa fabrike edilmez.
- Sahte müşteri yorumu, sahte puan, sahte sertifika görseli, doğrulanmamış rakam ("X yıllık deneyim" vb.) YOK.
- Emoji yerine inline SVG ikon kullanılır (mevcut sitedeki 📞💬🔵 gibi emoji'ler kaldırılır).
- Backend/API/veritabanı/AI asistan bu plan kapsamında YOK (ayrı, kapsam dışı — bkz. spec).
- Node.js >= 18 gerekli (yerleşik `node:test` için).
- Tasarım token sistemi (bkz. Task 2) tüm sayfalarda tutarlı kullanılır; yeni renk/font şablon dışında eklenmez.

---

### Task 1: Proje iskeleti + `business.yaml` veri katmanı

**Files:**
- Create: `package.json`
- Create: `.eleventy.js`
- Create: `.gitignore`
- Create: `config/business.yaml`
- Create: `site/_data/business.js`
- Create: `site/_data/site.js`
- Test: `test/business-data.test.mjs`
- Modify: (repo kökü) — mevcut placeholder `index.html`, `README.md`, `README.en.md`, `README.zh.md` `docs/legacy/` altına taşınır (silinmez, git geçmişinde zaten var; sadece yeni build'in kökü karıştırmaması için).

**Interfaces:**
- Produces: `site/_data/business.js` → 11ty'ye global `business` verisi olarak sunulur (`business.business.*`, `business.campaign.*`, `business.whatsapp_messages.*`, `business.service_areas[]`, `business.faq[]` — sonraki tüm görevler bu şemayı kullanır).
- Produces: `site/_data/site.js` → global `site.base` değeri (`"/tesisat-site"`). Tüm dahili `href`/`src` (kök-göreli) referansları `{{ site.base }}` ile başlar; permalink/dosya çıktı yolları BUNDAN etkilenmez (GitHub Pages proje sayfası routing'i alt-yolu zaten dışarıdan ekler).

- [ ] **Step 1: `package.json` oluştur**

```json
{
  "name": "gurbuz-teknik-site",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "build": "eleventy",
    "serve": "eleventy --serve",
    "test": "node --test test/"
  },
  "engines": { "node": ">=18" },
  "devDependencies": {
    "@11ty/eleventy": "^2.0.1",
    "js-yaml": "^4.1.0"
  }
}
```

- [ ] **Step 2: Bağımlılıkları yükle**

Run: `npm install`
Expected: `node_modules/` oluşur, `package-lock.json` yazılır.

- [ ] **Step 3: `.gitignore` oluştur**

```
node_modules/
_site/
.cache/
```

- [ ] **Step 4: `config/business.yaml` oluştur (gerçek veriler, spec'ten)**

```yaml
business:
  name: "Gürbüz Teknik"
  legal_note: "Doğalgaz yetki belgeli"
  phone_display: "0534 682 55 60"
  phone_e164: "905346825560"
  address: "Kalekapı Mah. İstasyon Cad. Hocalar Sokak, 18300 Kurşunlu/Çankırı"
  working_hours: "7/24"
  facebook_url: "https://www.facebook.com/profile.php?id=100063294876188"
  site_url: "https://atakanunver.github.io/tesisat-site/"

campaign:
  name: "Kışa Hazırlık Kampanyası"
  boiler_maintenance_price: 3000
  radiator_cleaning_price: 2000
  package_price: 4000
  normal_total_price: 5000
  radiator_limit: 15
  warranty_months: 6
  brands_note: "Tüm marka kombiler"

whatsapp_messages:
  google: "Merhaba, Google'da gördüğüm Gürbüz Teknik Kışa Hazırlık Kampanyası hakkında bilgi almak istiyorum."
  instagram: "Merhaba, Instagram'da gördüğüm Gürbüz Teknik Kışa Hazırlık Kampanyası hakkında bilgi almak istiyorum."
  facebook: "Merhaba, Facebook'ta gördüğüm Gürbüz Teknik Kışa Hazırlık Kampanyası hakkında bilgi almak istiyorum."
  default: "Merhaba, Gürbüz Teknik Kışa Hazırlık Kampanyası hakkında bilgi almak istiyorum."

service_areas:
  - slug: cankiri-kombi-bakimi
    il: "Çankırı"
    service: "Kombi Bakımı"
    title: "Çankırı Kombi Bakımı"
    intro: "Çankırı genelinde tüm marka kombilerde yerinde bakım hizmeti veriyoruz. Merkez üssümüz Kurşunlu'dur."
  - slug: cankiri-petek-temizligi
    il: "Çankırı"
    service: "Petek Temizliği"
    title: "Çankırı Petek Temizliği"
    intro: "Çankırı genelinde 15 peteğe kadar petek temizliği hizmeti sunuyoruz."
  - slug: kastamonu-kombi-bakimi
    il: "Kastamonu"
    service: "Kombi Bakımı"
    title: "Kastamonu Kombi Bakımı"
    intro: "Kastamonu genelinde tüm marka kombilerde yerinde bakım hizmeti veriyoruz."
  - slug: kastamonu-petek-temizligi
    il: "Kastamonu"
    service: "Petek Temizliği"
    title: "Kastamonu Petek Temizliği"
    intro: "Kastamonu genelinde 15 peteğe kadar petek temizliği hizmeti sunuyoruz."

faq:
  - q: "Kışa Hazırlık Kampanyası kapsamında neler var?"
    a: "Kombi bakımı ve 15 peteğe kadar petek temizliği bir arada 4.000 TL (normal toplam 5.000 TL)."
  - q: "Kampanya hangi bölgelerde geçerli?"
    a: "Kurşunlu merkezli olarak Çankırı ve Kastamonu genelinde hizmet veriyoruz."
  - q: "Hangi marka kombilerde bakım yapıyorsunuz?"
    a: "Tüm marka kombilerde bakım hizmeti veriyoruz."
  - q: "Garanti süresi ne kadar?"
    a: "Yapılan bakım işçiliği için 6 ay garanti sunulmaktadır."
  - q: "Randevu nasıl alınır?"
    a: "WhatsApp üzerinden 0534 682 55 60 numaramıza yazarak randevu talebinde bulunabilirsiniz."
  - q: "Çalışma saatleriniz nedir?"
    a: "7/24 hizmet veriyoruz."
```

- [ ] **Step 5: `site/_data/business.js` yaz (yaml → 11ty global data)**

```js
const fs = require("node:fs");
const path = require("node:path");
const yaml = require("js-yaml");

module.exports = function () {
  const filePath = path.join(__dirname, "..", "..", "config", "business.yaml");
  const raw = fs.readFileSync(filePath, "utf8");
  return yaml.load(raw);
};
```

- [ ] **Step 6: `site/_data/site.js` yaz (GitHub Pages alt-yol öneki)**

```js
module.exports = function () {
  return { base: "/tesisat-site" };
};
```

*Not:* Özel bir domain alınırsa bu tek satır `{ base: "" }` olur, başka hiçbir dosya değişmez.

- [ ] **Step 7: `.eleventy.js` oluştur (temel config)**

```js
module.exports = function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy({ "site/assets": "assets" });
  return {
    dir: {
      input: "site",
      output: "_site",
      includes: "_includes",
      data: "_data",
    },
  };
};
```

- [ ] **Step 8: Veri katmanı testini yaz**

```js
// test/business-data.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const loadBusiness = require("../site/_data/business.js");

test("business.yaml gerekli alanları içeriyor", () => {
  const data = loadBusiness();
  assert.equal(data.business.phone_e164, "905346825560");
  assert.equal(data.campaign.package_price, 4000);
  assert.equal(data.campaign.radiator_limit, 15);
  assert.equal(data.service_areas.length, 4);
  assert.ok(data.faq.length >= 5);
});
```

- [ ] **Step 9: Testi çalıştır ve doğrula**

Run: `node --test test/business-data.test.mjs`
Expected: PASS (1 test).

- [ ] **Step 10: Eski placeholder kök dosyalarını arşivle**

```bash
mkdir -p docs/legacy
git mv index.html docs/legacy/index.html.old
git mv README.md docs/legacy/README.md.old
git mv README.en.md docs/legacy/README.en.md.old
git mv README.zh.md docs/legacy/README.zh.md.old
```

(Yeni bir kök `README.md` Task 8'de yazılacak.)

- [ ] **Step 11: Commit**

```bash
git add package.json package-lock.json .eleventy.js .gitignore config/business.yaml site/_data/business.js site/_data/site.js test/business-data.test.mjs docs/legacy/
git commit -m "feat: add eleventy scaffolding and business.yaml single source of truth"
```

---

### Task 2: Tasarım sistemi + temel layout

**Design tokens (bu görevde CSS'e gömülür, sonraki tüm görevler bunu kullanır):**

```css
:root{
  --night:  #0B1F33; /* kış gecesi - hero/footer zemin */
  --ice:    #4A7FA5; /* soğuk boru mavisi - ikincil metin/çizgi */
  --ember:  #E8722C; /* kor turuncu - fiyat/vurgu */
  --cream:  #F6F2EC; /* sıcak krem - içerik zemini */
  --coal:   #1C1C1C; /* metin */
  --whatsapp: #25D366; /* SADECE WhatsApp butonları için */
  --font-display: 'Space Grotesk', sans-serif;
  --font-body: 'Karla', sans-serif;
  --font-mono: 'JetBrains Mono', monospace;
}
```

Görsel imza: petek/radyatör dilimlerini andıran ince dikey çizgi deseni (`.fin-pattern`), hero'da soğuk mavi tondan sıcak turuncu tona ısınan tek seferlik bir CSS animasyonuyla açılır (`prefers-reduced-motion` saygı görür). Sayfa "soğuk gece (hero) → sıcak ev içi (içerik) → gece (footer)" anlatısıyla ilerler.

**Files:**
- Create: `site/_includes/base.njk`
- Create: `site/assets/css/style.css`
- Create: `site/index.njk` (geçici stub — Task 4'te tam içerik gelecek)
- Test: `test/build.test.mjs`

**Interfaces:**
- Consumes: `site/_data/business.js` çıktısı (`business` global değişkeni, Nunjucks içinde `business.business.name` vb.) ve `site/_data/site.js` çıktısı (`site.base`, Task 1).
- Produces: `base.njk` layout — sonraki tüm sayfalar `layout: base.njk` front matter ile bunu kullanır; `{% block content %}` yerine 11ty/Nunjucks `{{ content | safe }}` deseniyle çalışır (11ty'nin varsayılan davranışı).

- [ ] **Step 1: `site/assets/css/style.css` yaz**

```css
:root{
  --night:  #0B1F33;
  --ice:    #4A7FA5;
  --ember:  #E8722C;
  --cream:  #F6F2EC;
  --coal:   #1C1C1C;
  --whatsapp: #25D366;
  --font-display: 'Space Grotesk', sans-serif;
  --font-body: 'Karla', sans-serif;
  --font-mono: 'JetBrains Mono', monospace;
}

*{box-sizing:border-box}
body{
  margin:0;
  font-family:var(--font-body);
  background:var(--cream);
  color:var(--coal);
  line-height:1.5;
}
h1,h2,h3{font-family:var(--font-display);margin:0 0 .5em}
a{color:inherit}

.fin-pattern{
  background-image:repeating-linear-gradient(
    90deg, var(--ice) 0 2px, transparent 2px 24px
  );
  opacity:.25;
}

.hero{
  position:relative;
  background:var(--night);
  color:#fff;
  padding:64px 20px 56px;
  text-align:center;
  overflow:hidden;
}
.hero::before{
  content:"";
  position:absolute;inset:0;
  background-image:repeating-linear-gradient(
    90deg, var(--ice) 0 2px, transparent 2px 24px
  );
  opacity:.35;
  animation:warm-up 1.6s ease-out 1 forwards;
}
@keyframes warm-up{
  from{ filter:hue-rotate(0deg); opacity:.35; }
  to{ filter:hue-rotate(-25deg); opacity:.55; }
}
@media (prefers-reduced-motion: reduce){
  .hero::before{ animation:none; filter:hue-rotate(-25deg); opacity:.55; }
}
.hero > *{position:relative;z-index:1}
.hero h1{font-size:2.4rem}
.hero p{margin-top:10px;font-size:1.1rem}

.price-tag{
  display:inline-flex;
  align-items:baseline;
  gap:12px;
  background:rgba(232,114,44,.15);
  border:1px solid var(--ember);
  border-radius:10px;
  padding:14px 22px;
  margin:20px 0;
  font-family:var(--font-mono);
}
.price-tag .now{font-size:2rem;color:var(--ember);font-weight:700}
.price-tag .was{font-size:1.1rem;color:var(--ice);text-decoration:line-through}

.btn-whatsapp{
  background:var(--whatsapp);
  color:#fff;
  padding:14px 26px;
  border-radius:30px;
  text-decoration:none;
  font-weight:700;
  display:inline-flex;
  align-items:center;
  gap:8px;
  border:none;
  cursor:pointer;
}
.btn-whatsapp:hover, .btn-whatsapp:focus-visible{
  filter:brightness(1.08);
  outline:2px solid #fff;
  outline-offset:2px;
}

.whatsapp-sticky{
  position:fixed;
  bottom:20px;right:20px;
  z-index:50;
  box-shadow:0 6px 20px rgba(0,0,0,.25);
}

.container{max-width:1100px;margin:0 auto;padding:48px 20px}

.cards{
  display:grid;
  grid-template-columns:repeat(auto-fit,minmax(220px,1fr));
  gap:20px;
}
.card{
  background:#fff;
  padding:22px;
  border-radius:14px;
  box-shadow:0 6px 20px rgba(0,0,0,.06);
  border-top:3px solid transparent;
  border-image:repeating-linear-gradient(90deg, var(--ice) 0 2px, transparent 2px 8px) 3;
}

footer{
  background:var(--night);
  color:#cbd5e1;
  text-align:center;
  padding:32px 20px;
}
footer a{color:var(--ember)}

.faq details{
  background:#fff;
  border-radius:10px;
  padding:14px 18px;
  margin-bottom:10px;
}
.faq summary{
  font-family:var(--font-display);
  cursor:pointer;
  font-weight:700;
}

.skip-link{
  position:absolute;left:-999px;top:0;
  background:var(--ember);color:#fff;padding:10px;
}
.skip-link:focus{left:10px;top:10px;z-index:100}
```

- [ ] **Step 2: `site/_includes/base.njk` yaz**

```njk
<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="UTF-8">
<title>{{ title }} | {{ business.business.name }}</title>
<meta name="description" content="{{ description }}">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&family=Karla:wght@400;600&family=JetBrains+Mono:wght@500&display=swap" rel="stylesheet">
<link rel="stylesheet" href="{{ site.base }}/assets/css/style.css">
{% block head %}{% endblock %}
</head>
<body>
<a class="skip-link" href="#icerik">İçeriğe geç</a>

<main id="icerik">
{{ content | safe }}
</main>

<footer>
  <p>© 2026 {{ business.business.name }} – {{ business.business.address }}</p>
  <p><a href="tel:+{{ business.business.phone_e164 }}">{{ business.business.phone_display }}</a></p>
</footer>

<a class="btn-whatsapp whatsapp-sticky" id="whatsapp-sticky"
   href="https://wa.me/{{ business.business.phone_e164 }}"
   aria-label="WhatsApp'tan yazın">
  WhatsApp
</a>

<script src="{{ site.base }}/assets/js/whatsapp.js" defer></script>
</body>
</html>
```

*Not:* `whatsapp.js` Task 3'te oluşturulacak; bu görevde script etiketi var ama dosya henüz yok — build testi bunu görmezden gelir (HTML'de sadece `<script>` etiketinin varlığını kontrol eder, dosyanın var olmasını değil), Task 3 dosyayı ekleyecek.

- [ ] **Step 3: Geçici `site/index.njk` stub'u yaz**

```njk
---
layout: base.njk
title: "Ana Sayfa"
description: "Gürbüz Teknik Kışa Hazırlık Kampanyası"
---
<section class="hero">
  <h1>{{ business.business.name }}</h1>
  <p>Site yapım aşamasında.</p>
</section>
```

- [ ] **Step 4: Build testini yaz**

```js
// test/build.test.mjs
import { test, before } from "node:test";
import assert from "node:assert/strict";
import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";

before(() => {
  execSync("npx @11ty/eleventy", { stdio: "inherit" });
});

test("ana sayfa build edilip başlığı içeriyor", () => {
  const html = readFileSync("_site/index.html", "utf8");
  assert.match(html, /Gürbüz Teknik/);
});

test("style.css asset olarak kopyalanmış", () => {
  const css = readFileSync("_site/assets/css/style.css", "utf8");
  assert.match(css, /--ember/);
});

test("asset linkleri site.base öneki ile kuruluyor", () => {
  const html = readFileSync("_site/index.html", "utf8");
  assert.match(html, /href="\/tesisat-site\/assets\/css\/style\.css"/);
});
```

- [ ] **Step 5: Testi çalıştır ve doğrula**

Run: `node --test test/build.test.mjs`
Expected: PASS (2 test).

- [ ] **Step 6: Commit**

```bash
git add site/_includes/base.njk site/assets/css/style.css site/index.njk test/build.test.mjs
git commit -m "feat: add design system tokens and base layout"
```

---

### Task 3: WhatsApp CTA — kaynağa göre dinamik mesaj

**Files:**
- Create: `site/assets/js/whatsapp.js`
- Test: `test/whatsapp-url.test.mjs`

**Interfaces:**
- Produces: `buildWhatsappUrl(phoneE164, utmSource, messages)` saf fonksiyonu (parametreler: `phoneE164: string`, `utmSource: string|null`, `messages: {google, instagram, facebook, default}`) → `string` (tam `https://wa.me/...` URL'i). Bu fonksiyon `whatsapp.js` içinde hem tarayıcıda hem Node testinde çalışacak şekilde `module.exports` ile de dışa açılır (dual-use: `typeof module !== "undefined"` kontrolü).
- Consumes: Task 2'deki `base.njk` içindeki `#whatsapp-sticky` linki ve hero'daki ana CTA linki (Task 4'te eklenecek, `data-whatsapp-cta` attribute'u ile işaretlenir).

- [ ] **Step 1: Saf fonksiyonun testini yaz**

```js
// test/whatsapp-url.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { buildWhatsappUrl } = require("../site/assets/js/whatsapp.js");

const messages = {
  google: "google mesaji",
  instagram: "instagram mesaji",
  facebook: "facebook mesaji",
  default: "varsayilan mesaj",
};

test("google kaynağı için doğru mesaj seçilir", () => {
  const url = buildWhatsappUrl("905346825560", "google", messages);
  assert.equal(
    url,
    "https://wa.me/905346825560?text=" + encodeURIComponent("google mesaji")
  );
});

test("bilinmeyen/olmayan kaynak için varsayılan mesaj kullanılır", () => {
  const url = buildWhatsappUrl("905346825560", null, messages);
  assert.equal(
    url,
    "https://wa.me/905346825560?text=" + encodeURIComponent("varsayilan mesaj")
  );
});

test("büyük/küçük harf farkı kaynağı etkilemez", () => {
  const url = buildWhatsappUrl("905346825560", "Instagram", messages);
  assert.match(url, /instagram%20mesaji|instagram\+mesaji/i);
});
```

- [ ] **Step 2: Testi çalıştır, başarısız olduğunu doğrula**

Run: `node --test test/whatsapp-url.test.mjs`
Expected: FAIL (dosya/fonksiyon henüz yok).

- [ ] **Step 3: `site/assets/js/whatsapp.js` yaz**

```js
function buildWhatsappUrl(phoneE164, utmSource, messages) {
  const key = (utmSource || "").toLowerCase();
  const text = messages[key] || messages.default;
  return "https://wa.me/" + phoneE164 + "?text=" + encodeURIComponent(text);
}

(function attachToDom() {
  if (typeof document === "undefined") return;

  var params = new URLSearchParams(window.location.search);
  var utmSource = params.get("utm_source");
  if (utmSource) {
    window.localStorage.setItem("gt_utm_source", utmSource);
  } else {
    utmSource = window.localStorage.getItem("gt_utm_source");
  }

  var config = window.__GT_WHATSAPP__;
  if (!config) return;

  var url = buildWhatsappUrl(config.phone, utmSource, config.messages);
  document.querySelectorAll("[data-whatsapp-cta]").forEach(function (el) {
    el.setAttribute("href", url);
  });
})();

if (typeof module !== "undefined") {
  module.exports = { buildWhatsappUrl: buildWhatsappUrl };
}
```

- [ ] **Step 4: Testi tekrar çalıştır, geçtiğini doğrula**

Run: `node --test test/whatsapp-url.test.mjs`
Expected: PASS (3 test).

- [ ] **Step 5: `base.njk`'e config enjeksiyonu ekle ve sticky butonu `data-whatsapp-cta` ile işaretle**

`site/_includes/base.njk` içinde `<script src="/assets/js/whatsapp.js" defer></script>` satırından **önce** ekle:

```njk
<script>
  window.__GT_WHATSAPP__ = {
    phone: "{{ business.business.phone_e164 }}",
    messages: {{ business.whatsapp_messages | dump | safe }}
  };
</script>
```

Sticky link etiketine `data-whatsapp-cta` ekle:

```njk
<a class="btn-whatsapp whatsapp-sticky" id="whatsapp-sticky" data-whatsapp-cta
   href="https://wa.me/{{ business.business.phone_e164 }}"
   aria-label="WhatsApp'tan yazın">
  WhatsApp
</a>
```

- [ ] **Step 6: Build testine whatsapp config kontrolü ekle**

`test/build.test.mjs` dosyasına yeni bir test ekle:

```js
test("whatsapp config sayfaya enjekte edilmiş", () => {
  const html = readFileSync("_site/index.html", "utf8");
  assert.match(html, /__GT_WHATSAPP__/);
  assert.match(html, /905346825560/);
});
```

- [ ] **Step 7: Tüm testleri çalıştır**

Run: `npm test`
Expected: PASS (tüm testler).

- [ ] **Step 8: Commit**

```bash
git add site/assets/js/whatsapp.js site/_includes/base.njk test/whatsapp-url.test.mjs test/build.test.mjs
git commit -m "feat: dynamic whatsapp message based on utm_source"
```

---

### Task 4: Ana sayfa — tam içerik

**Files:**
- Modify: `site/index.njk` (stub → tam sayfa)
- Modify: `test/build.test.mjs`

**Interfaces:**
- Consumes: `business.business.*`, `business.campaign.*`, `business.faq[]`, `business.service_areas[]`, `site.base` (Task 1), `buildWhatsappUrl`'ün DOM entegrasyonu (Task 3).

- [ ] **Step 1: `site/index.njk`'i tam içerikle değiştir**

```njk
---
layout: base.njk
title: "Kombi Bakımı ve Petek Temizliği"
description: "Çankırı ve Kastamonu'da Kışa Hazırlık Kampanyası: Kombi bakımı + petek temizliği 4.000 TL. WhatsApp'tan randevu alın."
---
<section class="hero">
  <h1>Kışa Hazır Girin</h1>
  <p>Kombi Bakımı + Petek Temizliği</p>
  <div class="price-tag">
    <span class="now">{{ business.campaign.package_price }} TL</span>
    <span class="was">{{ business.campaign.normal_total_price }} TL</span>
  </div>
  <ul style="list-style:none;padding:0;margin:0 0 20px">
    <li>✓ {{ business.campaign.brands_note }}</li>
    <li>✓ {{ business.campaign.radiator_limit }} peteğe kadar petek temizliği</li>
    <li>✓ {{ business.campaign.warranty_months }} ay garanti*</li>
    <li>✓ Yerinde servis</li>
  </ul>
  <a class="btn-whatsapp" data-whatsapp-cta href="https://wa.me/{{ business.business.phone_e164 }}">
    WhatsApp'tan Randevu Al
  </a>
  <p style="margin-top:14px">
    <a href="tel:+{{ business.business.phone_e164 }}" style="color:#fff">
      {{ business.business.phone_display }}
    </a>
  </p>
</section>

<section class="container">
  <h2>Hizmetlerimiz</h2>
  <div class="cards">
    <div class="card">
      <h3>Kombi Bakımı</h3>
      <p>{{ business.campaign.boiler_maintenance_price }} TL — {{ business.campaign.brands_note }}.</p>
    </div>
    <div class="card">
      <h3>Petek Temizliği</h3>
      <p>{{ business.campaign.radiator_cleaning_price }} TL — {{ business.campaign.radiator_limit }} peteğe kadar.</p>
    </div>
    <div class="card">
      <h3>Kombi + Petek Paketi</h3>
      <p>{{ business.campaign.package_price }} TL (normal {{ business.campaign.normal_total_price }} TL).</p>
    </div>
  </div>
</section>

<section class="container">
  <h2>Neden {{ business.business.name }}?</h2>
  <div class="cards">
    <div class="card"><p>{{ business.business.legal_note }}.</p></div>
    <div class="card"><p>{{ business.campaign.brands_note }} için yerinde servis.</p></div>
    <div class="card"><p>Yapılan işçilik için {{ business.campaign.warranty_months }} ay garanti.</p></div>
    <div class="card"><p>WhatsApp üzerinden hızlı iletişim, {{ business.business.working_hours }} hizmet.</p></div>
  </div>
</section>

<section class="container">
  <h2>Nasıl Çalışıyor?</h2>
  <div class="cards">
    <div class="card"><p>WhatsApp'tan yazın veya arayın.</p></div>
    <div class="card"><p>İhtiyacınızı ve bölgenizi paylaşın, randevu netleşsin.</p></div>
    <div class="card"><p>Kararlaştırılan tarihte yerinde servis alın.</p></div>
  </div>
</section>

<section class="container">
  <h2>Hizmet Bölgeleri</h2>
  <div class="cards">
    {% for area in business.service_areas %}
    <a class="card" href="{{ site.base }}/{{ area.slug }}/" style="text-decoration:none;color:inherit;display:block">
      <h3>{{ area.title }}</h3>
    </a>
    {% endfor %}
  </div>
</section>

<section class="container faq">
  <h2>Sık Sorulan Sorular</h2>
  {% for item in business.faq %}
  <details>
    <summary>{{ item.q }}</summary>
    <p>{{ item.a }}</p>
  </details>
  {% endfor %}
</section>

<section class="container" style="text-align:center">
  <h2>İletişim</h2>
  <p>
    <a href="tel:+{{ business.business.phone_e164 }}">{{ business.business.phone_display }}</a><br>
    {{ business.business.address }}<br>
    <a href="{{ business.business.facebook_url }}" target="_blank" rel="noopener">Facebook</a>
  </p>
  <p style="font-size:.85rem;color:var(--ice)">
    * Garanti kapsamı hizmet sırasında netleştirilir.
  </p>
</section>
```

- [ ] **Step 2: Build testine içerik kontrolleri ekle**

`test/build.test.mjs` dosyasına ekle:

```js
test("kampanya fiyatı build edilen sayfada doğru görünüyor", () => {
  const html = readFileSync("_site/index.html", "utf8");
  assert.match(html, /4000 TL|4\.000 TL/);
  assert.match(html, /5000 TL|5\.000 TL/);
});

test("hizmet bölgeleri linkleri sayfada var", () => {
  const html = readFileSync("_site/index.html", "utf8");
  assert.match(html, /\/cankiri-kombi-bakimi\//);
  assert.match(html, /\/kastamonu-petek-temizligi\//);
});
```

*Not:* `business.yaml`'daki sayılar YAML'de `4000` (noktasız) olarak tutulur; Nunjucks çıktısı da noktasız basar. Fiyatın kullanıcıya "4.000 TL" gibi görünmesi isteniyorsa Task 4 Step 1'deki `{{ business.campaign.package_price }}` ifadeleri yerine bir Nunjucks filtresi (`{{ "%d"|format(...) }}` yerine basitçe) kullanılabilir — bu plan kapsamında sade "4000 TL" formatı kabul edilir, biçimlendirme kozmetik bir sonraki iyileştirmedir. Test bu nedenle her iki formatı da (`4000 TL` veya `4.000 TL`) kabul edecek şekilde yazıldı.

- [ ] **Step 3: Testleri çalıştır**

Run: `npm test`
Expected: PASS (tüm testler).

- [ ] **Step 4: Commit**

```bash
git add site/index.njk test/build.test.mjs
git commit -m "feat: build full home page content from business.yaml"
```

---

### Task 5: Yapısal veri (JSON-LD) — LocalBusiness/Service/FAQPage

**Files:**
- Create: `site/_includes/schema.njk`
- Modify: `site/_includes/base.njk` (schema include eklenir)
- Modify: `test/build.test.mjs`

**Interfaces:**
- Consumes: `business.business.*`, `business.campaign.*`, `business.faq[]`, `business.service_areas[]`.
- Produces: `<script type="application/ld+json">` bloğu, `base.njk`'in `<head>` bölümünde her sayfada render edilir (sayfaya özgü `@type` farkı bu görev kapsamında yok — tüm sayfalar aynı LocalBusiness+FAQPage şemasını taşır, bu spec'in onayladığı sadelik).

- [ ] **Step 1: `site/_includes/schema.njk` yaz**

```njk
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "name": "{{ business.business.name }}",
  "telephone": "+{{ business.business.phone_e164 }}",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "{{ business.business.address }}",
    "addressCountry": "TR"
  },
  "areaServed": [
    {% for area in business.service_areas %}
    "{{ area.il }}"{% if not loop.last %},{% endif %}
    {% endfor %}
  ],
  "url": "{{ business.business.site_url }}",
  "sameAs": ["{{ business.business.facebook_url }}"]
}
</script>
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {% for item in business.faq %}
    {
      "@type": "Question",
      "name": {{ item.q | dump | safe }},
      "acceptedAnswer": { "@type": "Answer", "text": {{ item.a | dump | safe }} }
    }{% if not loop.last %},{% endif %}
    {% endfor %}
  ]
}
</script>
```

- [ ] **Step 2: `base.njk`'in `<head>` bölümüne include ekle**

`</head>` etiketinden hemen önce:

```njk
{% include "schema.njk" %}
```

- [ ] **Step 3: Build testine JSON-LD doğrulaması ekle**

```js
test("JSON-LD LocalBusiness ve FAQPage geçerli JSON olarak parse ediliyor", () => {
  const html = readFileSync("_site/index.html", "utf8");
  const blocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
  assert.equal(blocks.length, 2);
  const localBusiness = JSON.parse(blocks[0][1]);
  const faqPage = JSON.parse(blocks[1][1]);
  assert.equal(localBusiness["@type"], "LocalBusiness");
  assert.deepEqual(localBusiness.areaServed, ["Çankırı", "Çankırı", "Kastamonu", "Kastamonu"]);
  assert.equal(faqPage["@type"], "FAQPage");
  assert.ok(faqPage.mainEntity.length >= 5);
});
```

- [ ] **Step 4: Testleri çalıştır**

Run: `npm test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add site/_includes/schema.njk site/_includes/base.njk test/build.test.mjs
git commit -m "feat: add LocalBusiness and FAQPage structured data"
```

---

### Task 6: Kampanya landing sayfası (reklam trafiği için)

**Files:**
- Create: `site/kampanya/index.njk`
- Modify: `test/build.test.mjs`

**Interfaces:**
- Consumes: aynı `business` verisi; ana sayfadaki hero+fiyat+CTA bloğunu yeniden kullanır ama sayfa dışına çıkmadan (hizmetler/nasıl çalışır gibi bölümler olmadan) tek amaçlı bir sayfa olarak kurgulanır — reklamdan gelen trafiğin dikkatini dağıtmamak için.

- [ ] **Step 1: `site/kampanya/index.njk` yaz**

```njk
---
layout: base.njk
title: "Kışa Hazırlık Kampanyası"
description: "Kombi bakımı + petek temizliği tek pakette 4.000 TL. WhatsApp'tan hemen randevu alın."
permalink: "/kampanya/"
---
<section class="hero">
  <h1>{{ business.campaign.name }}</h1>
  <p>Kombi Bakımı + Petek Temizliği</p>
  <div class="price-tag">
    <span class="now">{{ business.campaign.package_price }} TL</span>
    <span class="was">{{ business.campaign.normal_total_price }} TL</span>
  </div>
  <ul style="list-style:none;padding:0;margin:0 0 20px">
    <li>✓ {{ business.campaign.brands_note }}</li>
    <li>✓ {{ business.campaign.radiator_limit }} peteğe kadar petek temizliği</li>
    <li>✓ {{ business.campaign.warranty_months }} ay garanti*</li>
  </ul>
  <a class="btn-whatsapp" data-whatsapp-cta href="https://wa.me/{{ business.business.phone_e164 }}">
    WhatsApp'tan Randevu Al
  </a>
</section>

<section class="container faq">
  <h2>Sık Sorulan Sorular</h2>
  {% for item in business.faq %}
  <details>
    <summary>{{ item.q }}</summary>
    <p>{{ item.a }}</p>
  </details>
  {% endfor %}
</section>
```

- [ ] **Step 2: Build testine kampanya sayfası kontrolü ekle**

```js
test("kampanya sayfası build ediliyor ve fiyatı içeriyor", () => {
  const html = readFileSync("_site/kampanya/index.html", "utf8");
  assert.match(html, /Kışa Hazırlık Kampanyası/);
  assert.match(html, /4000 TL|4\.000 TL/);
});
```

- [ ] **Step 3: Testleri çalıştır**

Run: `npm test`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add site/kampanya/index.njk test/build.test.mjs
git commit -m "feat: add dedicated campaign landing page for ad traffic"
```

---

### Task 7: Hizmet bölgeleri sayfaları (il bazlı, data-driven)

**Files:**
- Create: `site/hizmet-bolgeleri-sayfasi.njk` (pagination template — 4 çıktı üretir)
- Modify: `test/build.test.mjs`

**Interfaces:**
- Consumes: `business.service_areas[]` (Task 1'de tanımlı şema: `slug, il, service, title, intro`), `site.base` (Task 1, "Tüm hizmetlere dön" linki için).
- Produces: `/cankiri-kombi-bakimi/`, `/cankiri-petek-temizligi/`, `/kastamonu-kombi-bakimi/`, `/kastamonu-petek-temizligi/` (dosya çıktı yolları — `site.base` bunları etkilemez) — Task 4'teki "Hizmet Bölgeleri" kartlarının linklediği tam olarak bu yollar.

- [ ] **Step 1: Pagination şablonunu yaz**

```njk
---
layout: base.njk
pagination:
  data: business.service_areas
  size: 1
  alias: area
permalink: "/{{ area.slug }}/"
eleventyComputed:
  title: "{{ area.title }}"
  description: "{{ area.title }} — Kışa Hazırlık Kampanyası, WhatsApp'tan randevu alın."
---
<section class="hero">
  <h1>{{ area.title }}</h1>
  <p>{{ area.intro }}</p>
  <div class="price-tag">
    <span class="now">{{ business.campaign.package_price }} TL</span>
    <span class="was">{{ business.campaign.normal_total_price }} TL</span>
  </div>
  <a class="btn-whatsapp" data-whatsapp-cta href="https://wa.me/{{ business.business.phone_e164 }}">
    WhatsApp'tan Randevu Al
  </a>
</section>

<section class="container">
  <h2>{{ area.service }} Kapsamı</h2>
  <p>{{ business.campaign.brands_note }}, {{ business.campaign.radiator_limit }} peteğe kadar petek temizliği,
     yapılan işçilik için {{ business.campaign.warranty_months }} ay garanti.</p>
  <p><a href="{{ site.base }}/">← Tüm hizmetlere dön</a></p>
</section>
```

- [ ] **Step 2: Build testine 4 sayfanın da üretildiğini doğrulayan kontrol ekle**

```js
test("4 hizmet bölgesi sayfası da üretiliyor", () => {
  const slugs = [
    "cankiri-kombi-bakimi",
    "cankiri-petek-temizligi",
    "kastamonu-kombi-bakimi",
    "kastamonu-petek-temizligi",
  ];
  for (const slug of slugs) {
    const html = readFileSync(`_site/${slug}/index.html`, "utf8");
    assert.match(html, /WhatsApp'tan Randevu Al/);
  }
});
```

- [ ] **Step 3: Testleri çalıştır**

Run: `npm test`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add site/hizmet-bolgeleri-sayfasi.njk test/build.test.mjs
git commit -m "feat: generate province-level service area pages from business.yaml"
```

---

### Task 8: GitHub Actions ile deploy + kök `README.md`

**Files:**
- Create: `.github/workflows/deploy.yml`
- Create: `README.md` (yeni kök, eskisinin yerine)
- Test: manuel doğrulama (CI ortamı olmadan tam test edilemez — Step 3'te YAML sözdizimi lokal doğrulanır).

**Interfaces:**
- `atakanunver` hesabının `atakanunver/tesisat-site` üzerinde tam admin/push yetkisi var (repo public, doğrulandı) — bu görevin tüm adımları (push + Pages ayarı) ek bir onay beklemeden tamamlanabilir.

- [ ] **Step 1: `.github/workflows/deploy.yml` yaz**

```yaml
name: Deploy site

on:
  push:
    branches: [main]

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "20"
      - run: npm ci
      - run: npm test
      - run: npm run build
      - uses: actions/upload-pages-artifact@v3
        with:
          path: _site
  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

- [ ] **Step 2: YAML sözdizimini lokal doğrula**

Run: `node -e "require('js-yaml').load(require('fs').readFileSync('.github/workflows/deploy.yml','utf8')); console.log('YAML OK')"`
Expected: `YAML OK` yazdırır, hata fırlatmaz.

- [ ] **Step 3: Kök `README.md`'yi yeniden yaz**

```md
# Gürbüz Teknik — Dijital Satış Sitesi

Kaynak: `site/` (Eleventy). Veri: `config/business.yaml` (tek doğru kaynak).

## Geliştirme

npm install
npm run serve

## Build + test

npm test
npm run build
```

- [ ] **Step 4: Commit**

```bash
git add .github/workflows/deploy.yml README.md
git commit -m "feat: add GitHub Actions deploy workflow"
```

- [ ] **Step 5: Pages kaynağını "GitHub Actions" olarak ayarla**

Repo daha önce hiç Pages yayını yapmadığı için (`has_pages: false`), branch bazlı bir kaynağı "değiştirmek" yerine doğrudan Actions kaynağıyla ilk kez etkinleştirilir:

Run: `gh api -X POST repos/atakanunver/tesisat-site/pages -f "build_type=workflow"`
Expected: JSON yanıtında `"build_type": "workflow"` döner.

- [ ] **Step 6: Push**

```bash
git push origin main
```

- [ ] **Step 7: Deploy'u doğrula**

Run: `gh run watch $(gh run list --workflow=deploy.yml --limit 1 --json databaseId --jq '.[0].databaseId')`
Expected: `Deploy site` workflow'u başarıyla (yeşil) tamamlanır.

Sonra: `curl -s -o /dev/null -w "%{http_code}" https://atakanunver.github.io/tesisat-site/`
Expected: `200`.

---

## Self-Review Notu (plan yazarı tarafından yapıldı)

- **Spec kapsamı:** Hero/kampanya/hizmetler/neden biz/nasıl çalışır/hizmet bölgeleri/SSS/güven/WhatsApp CTA/footer (spec §10) → Task 4. Kaynağa göre WhatsApp mesajı (spec) → Task 3. JSON-LD (spec) → Task 5. İl bazlı hizmet sayfaları, spam olmayan (spec) → Task 7. Sahte AI kutusunun kaldırılması → Task 1 Step 10 (eski placeholder dosyalar arşivlendi, yeni sitede o kutu hiç yok). Deploy (spec) → Task 8, artık tam admin yetkisiyle bloklanmadan tamamlanabiliyor. `site.base`/`/tesisat-site` alt-yol öneki (repo değişikliği sonrası eklendi) → Task 1 (`site.js`), Task 2/4/7 (link/asset referansları). Faz 2 (GA4/Meta Pixel/Sheets) bu plana **dahil değil** — ayrı bir sonraki plan.
- **Placeholder taraması:** Yok — tüm kod blokları çalıştırılabilir gerçek içerik.
- **Tip/isim tutarlılığı:** `buildWhatsappUrl(phoneE164, utmSource, messages)` imzası Task 3'te tanımlanıp Task 3 Step 5'te aynı adla `base.njk`'e bağlanıyor; `business.service_areas[].slug` alanı Task 1'de tanımlanıp Task 7'nin `permalink`'inde aynen kullanılıyor; `site.base` Task 1'de tanımlanıp Task 2/4/7'de aynı isimle tüketiliyor.
