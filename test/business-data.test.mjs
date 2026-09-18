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
