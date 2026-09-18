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
