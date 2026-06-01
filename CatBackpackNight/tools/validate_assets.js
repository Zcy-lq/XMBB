const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const assetsPath = path.join(root, "assets", "configs", "assets.json");

function normalizeProjectPath(projectPath) {
  return path.join(root, ...projectPath.split(/[\\/]+/));
}

if (!fs.existsSync(assetsPath)) {
  console.error("[validate_assets] missing assets/configs/assets.json");
  process.exit(1);
}

let index;
try {
  index = JSON.parse(fs.readFileSync(assetsPath, "utf8"));
} catch (error) {
  console.error(`[validate_assets] assets.json is invalid JSON: ${error.message}`);
  process.exit(1);
}

const assets = Array.isArray(index.assets) ? index.assets : [];
const failures = [];
const warnings = [];

for (const asset of assets) {
  const id = asset.id || "(missing id)";
  if (!asset.id) failures.push("asset entry missing id");
  if (!asset.bundle) warnings.push(`${id} has no bundle`);

  const placeholderPath = asset.placeholderPath || asset.path;
  const isPlaceholder =
    asset.placeholder === true ||
    typeof asset.status === "string" && asset.status.toLowerCase().includes("placeholder") ||
    Boolean(asset.placeholderPath);

  if (isPlaceholder && placeholderPath && !fs.existsSync(normalizeProjectPath(placeholderPath))) {
    failures.push(`${id} placeholder path missing: ${placeholderPath}`);
  }

  if (asset.devOnly === true && asset.bundle && asset.bundle !== "dev") {
    warnings.push(`${id} is devOnly but bundle is ${asset.bundle}`);
  }
}

if (assets.length < 25) {
  failures.push(`assets.json has ${assets.length} assets; expected at least 25`);
}

if (warnings.length) {
  console.warn(`[validate_assets] warnings:\n- ${warnings.join("\n- ")}`);
}

if (failures.length) {
  console.error(`[validate_assets] failed:\n- ${failures.join("\n- ")}`);
  process.exit(1);
}

console.log(`[validate_assets] PASS ${assets.length} asset entries checked`);
