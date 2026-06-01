const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const workspaceRoot = path.resolve(root, "..");
const configPath = path.join(workspaceRoot, "cat_game_agents_prompts.json");
const handoffDir = path.join(root, "agent_handoffs");
const reportDir = path.join(root, "agent_reports");
const allowMissing = process.argv.includes("--allow-missing");

function readAgents() {
  if (!fs.existsSync(configPath)) {
    return [
      "ProductAgent",
      "ClientArchAgent",
      "UIUXAgent",
      "AssetAgent",
      "CoreGameplayAgent",
      "EconomyRewardAgent",
      "SaveDataAgent",
      "PlatformAgent",
      "BuildAgent",
      "QAReleaseAgent",
    ];
  }
  const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
  return config.execution_order || config.agents.map((agent) => agent.name);
}

fs.mkdirSync(handoffDir, { recursive: true });
fs.mkdirSync(reportDir, { recursive: true });

const failures = [];
const warnings = [];
const requiredSections = [
  "Agent Identity",
  "Inputs Actually Read",
  "Files Created",
  "Files Modified",
  "Validation Performed",
  "Next Agent Instructions",
];

for (const agent of readAgents()) {
  const handoffPath = path.join(handoffDir, `HANDOFF_${agent}.md`);
  const reportPath = path.join(reportDir, `REPORT_${agent}.md`);

  for (const file of [handoffPath, reportPath]) {
    if (!fs.existsSync(file)) {
      const message = `${path.relative(root, file)} missing`;
      if (allowMissing) warnings.push(message);
      else failures.push(message);
      continue;
    }
    const content = fs.readFileSync(file, "utf8");
    if (file.includes("HANDOFF_")) {
      for (const section of requiredSections) {
        if (!content.includes(section)) {
          failures.push(`${path.relative(root, file)} missing section: ${section}`);
        }
      }
    }
  }
}

if (warnings.length) {
  console.warn(`[validate_handoffs] warnings:\n- ${warnings.join("\n- ")}`);
}

if (failures.length) {
  console.error(`[validate_handoffs] failed:\n- ${failures.join("\n- ")}`);
  process.exit(1);
}

console.log(`[validate_handoffs] PASS allowMissing=${allowMissing}`);
