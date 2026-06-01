import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const uiBuilderPath = path.join(projectRoot, 'assets', 'scripts', 'ui', 'UISkeletonBuilder.ts');
const source = fs.readFileSync(uiBuilderPath, 'utf8');

assert.match(
  source,
  /this\.addCharacterStand\('Hero_LoginCat', -118, -56, 286, 376, '守夜猫'\)/,
  'login hero cat should sit in the left scenic art zone from the design board',
);
assert.match(
  source,
  /Button_ToggleAgreement[\s\S]*addButtonBehavior\(agreementHit, 'Button_ToggleAgreement'\)/,
  'agreement checkbox should use a separate invisible hit area so the visible checkbox is not covered',
);
assert.match(
  source,
  /name === 'Login_AgreementCheck_Border' \|\| name === 'BattlePrepare_AgreementCheck_Border'/,
  'agreement checkbox frame should use a runtime checkbox sprite so it is visible in Cocos preview and WeChat',
);
assert.match(
  source,
  /注意自我保护，谨防受骗上当。\\n适度游戏益脑，沉迷游戏伤身。/,
  'login health notice should use the full two-line regulated copy from the design board',
);
assert.doesNotMatch(
  source,
  /name\.includes\('AgeBadge_16'\)\) return 'rt_badge_age_16'/,
  'age badge runtime sprite should only apply to the badge frame, not both frame and inner fill',
);
assert.match(
  source,
  /name === 'AgeBadge_16_Border' \|\| name === 'AgeBadge_16_Prepare_Border'/,
  'age badge should render from the square CADPA runtime frame on mobile screenshots',
);

console.log('[verify_login_design_parity] login page design parity contract is present.');
