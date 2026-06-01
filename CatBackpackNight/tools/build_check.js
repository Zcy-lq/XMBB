const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");

const requiredPaths = [
  "package.json",
  "project.json",
  "project.config.json",
  "game.json",
  "tsconfig.json",
  "assets/scripts",
  "assets/configs",
  "assets/scenes",
  "assets/configs/assets.json",
  "assets/configs/version.json",
  "docs/COCOS_EDITOR_CHECKLIST.md",
  "docs/WECHAT_RELEASE_COMPLIANCE.md",
  "agent_handoffs",
  "agent_reports",
];

const failures = [];
for (const relativePath of requiredPaths) {
  if (!fs.existsSync(path.join(root, relativePath))) {
    failures.push(`${relativePath} missing`);
  }
}

const sceneDir = path.join(root, "assets", "scenes");
if (fs.existsSync(sceneDir)) {
  const scenes = fs.readdirSync(sceneDir).filter((name) => name.endsWith(".scene"));
  if (!scenes.length) failures.push("assets/scenes has no .scene files");
}

const packageJson = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
for (const scriptName of [
  "validate:configs",
  "validate:assets",
  "validate:handoffs",
  "build:check",
]) {
  if (!packageJson.scripts || !packageJson.scripts[scriptName]) {
    failures.push(`package.json missing script ${scriptName}`);
  }
}

if (failures.length) {
  console.error(`[build_check] failed:\n- ${failures.join("\n- ")}`);
  process.exit(1);
}

console.log("[build_check] PASS project structure and workflow gates present");
