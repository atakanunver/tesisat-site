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
