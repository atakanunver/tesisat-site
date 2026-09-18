const fs = require("node:fs");
const path = require("node:path");
const yaml = require("js-yaml");

module.exports = function () {
  const filePath = path.join(__dirname, "..", "..", "config", "business.yaml");
  const raw = fs.readFileSync(filePath, "utf8");
  return yaml.load(raw);
};
