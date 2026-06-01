const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const configDir = path.join(root, "assets", "configs");

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(fullPath) : [fullPath];
  });
}

const jsonFiles = walk(configDir).filter((file) => file.endsWith(".json"));
const failures = [];
const warnings = [];

for (const file of jsonFiles) {
  try {
    const parsed = JSON.parse(fs.readFileSync(file, "utf8"));
    if (
      !Object.prototype.hasOwnProperty.call(parsed, "version") &&
      !Object.prototype.hasOwnProperty.call(parsed, "schemaVersion") &&
      !Object.prototype.hasOwnProperty.call(parsed, "appVersion")
    ) {
      warnings.push(`${path.relative(root, file)} has no version/schemaVersion field`);
    }
  } catch (error) {
    failures.push(`${path.relative(root, file)}: ${error.message}`);
  }
}

if (!jsonFiles.length) {
  failures.push("No JSON config files found under assets/configs");
}

if (warnings.length) {
  console.warn(`[validate_configs] warnings:\n- ${warnings.join("\n- ")}`);
}

if (failures.length) {
  console.error(`[validate_configs] failed:\n- ${failures.join("\n- ")}`);
  process.exit(1);
}

console.log(`[validate_configs] PASS ${jsonFiles.length} JSON files parsed`);
