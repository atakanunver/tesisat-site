const fs = require("node:fs");
const path = require("node:path");
const yaml = require("js-yaml");

module.exports = function () {
  const filePath = path.join(__dirname, "..", "..", "config", "business.yaml");
  const raw = fs.readFileSync(filePath, "utf8");
  const data = yaml.load(raw);
  data.service_area_provinces = [...new Set(data.service_areas.map((a) => a.il))];
  return data;
};
