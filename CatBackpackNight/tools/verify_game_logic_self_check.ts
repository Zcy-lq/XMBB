import { runGameLogicSelfCheck } from '../assets/scripts/game/GameLogicSelfCheck';

const report = runGameLogicSelfCheck();
const failed = report.checks.filter((item) => !item.passed);

console.log(
  `[game-logic-self-check] ${JSON.stringify({
    passed: report.passed,
    checks: report.checks.length,
    failed: failed.length,
  })}`,
);

for (const item of report.checks) {
  const status = item.passed ? 'PASS' : 'FAIL';
  console.log(`[game-logic-self-check] ${status} ${item.name}: ${item.detail}`);
}

if (!report.passed) {
  process.exit(1);
}
