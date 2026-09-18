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
  assert.match(html, /href="\/tesisat-site\/assets\/css\/style\.css\?v=\d+"/);
});

test("whatsapp config sayfaya enjekte edilmiş", () => {
  const html = readFileSync("_site/index.html", "utf8");
  assert.match(html, /__GT_WHATSAPP__/);
  assert.match(html, /905346825560/);
});

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

test("JSON-LD LocalBusiness ve FAQPage geçerli JSON olarak parse ediliyor", () => {
  const html = readFileSync("_site/index.html", "utf8");
  const blocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
  assert.equal(blocks.length, 2);
  const localBusiness = JSON.parse(blocks[0][1]);
  const faqPage = JSON.parse(blocks[1][1]);
  assert.equal(localBusiness["@type"], "LocalBusiness");
  assert.deepEqual(localBusiness.areaServed, ["Çankırı", "Kastamonu"]);
  assert.equal(faqPage["@type"], "FAQPage");
  assert.ok(faqPage.mainEntity.length >= 5);
});

test("kampanya sayfası build ediliyor ve fiyatı içeriyor", () => {
  const html = readFileSync("_site/kampanya/index.html", "utf8");
  assert.match(html, /Kışa Hazırlık Kampanyası/);
  assert.match(html, /4000 TL|4\.000 TL/);
});

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
