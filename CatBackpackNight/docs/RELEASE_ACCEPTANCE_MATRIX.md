# Release Acceptance Matrix

This matrix is the launch gate for the WeChat mini game release. A row is not `PASS` unless it has fresh automated output, Cocos/WeChat evidence, screenshot evidence, or a recorded manual QA result.

Status values:

- `PASS`: verified with fresh evidence.
- `PARTIAL`: source/static checks exist, but runtime or manual evidence is incomplete.
- `UNVERIFIED`: no current launch evidence.
- `BLOCKED`: cannot pass until an external tool, account, device, or build step is completed.

| AC ID | Priority | Area | Status | Evidence | Owner | Next Action |
| --- | --- | --- | --- | --- | --- | --- |
| AC-001 | P0 | WeChat import | BLOCKED | No WeChat DevTools import evidence recorded | PlatformAgent | Build WeChat target and import in DevTools |
| AC-002 | P0 | Startup | UNVERIFIED | Browser Preview route screenshots exist; WeChat startup not recorded | QAReleaseAgent | Record Cocos launch and WeChat launch logs/screenshots |
| AC-003 | P1 | Resource loading | PARTIAL | `verify_runtime_asset_index` and UI asset contract pass locally | QAReleaseAgent | Cold-start home/backpack/battle in Cocos and WeChat |
| AC-004 | P1 | Config loading | PASS | `validate_configs` passes 19 JSON files | QAReleaseAgent | Keep in regression suite |
| AC-010 | P0 | Agreement gate | PARTIAL | `UISkeletonBuilder` blocks start without agreement | QAReleaseAgent | Manually verify toast and route lock in Cocos/WeChat |
| AC-011 | P0 | Enter home | PARTIAL | UI handler routes accepted agreement to `home` | QAReleaseAgent | Verify accepted agreement persists and enters home |
| AC-012 | P1 | Compliance info | PARTIAL | Login UI contains agreement, privacy, 16+, health notice nodes | ComplianceService/QAReleaseAgent | Compare against 22-page design and legal text |
| AC-013 | P1 | Second launch agreement | UNVERIFIED | Save path exists; restart evidence missing | QAReleaseAgent | Restart after accepting agreement |
| AC-020 | P0 | Home display | PARTIAL | Home builder and route screenshot exist | UIUXAgent/QAReleaseAgent | Verify player info/resources/chapter/start button in Cocos/WeChat |
| AC-021 | P0 | Bottom navigation | PARTIAL | Route map and static guards cover routes | UIUXAgent/QAReleaseAgent | Tap every nav route on device |
| AC-022 | P1 | Settings entry | PARTIAL | Settings route and button handler exist | QAReleaseAgent | Verify settings opens and returns |
| AC-023 | P1 | Red dots | UNVERIFIED | `RedDotManager` exists; full route evidence missing | UIUXAgent/QAReleaseAgent | Verify task/mail red dots before and after claim |
| AC-024 | P1 | Insufficient energy | PARTIAL | Battle start can fail with insufficient currency; dev unlimited energy may mask it | CoreGameplayAgent | Test release-mode energy insufficient path |
| AC-030 | P0 | Open battle prepare | PARTIAL | Home start routes to `battlePrepare` | QAReleaseAgent | Tap from home and record prepare screen |
| AC-031 | P1 | Power display | PARTIAL | `getBattlePreparation` computes recommended/my power | CoreGameplayAgent | Verify visible values update after growth |
| AC-032 | P1 | Weapon preview | PARTIAL | Weapon preview data and UI slots exist | QAReleaseAgent | Verify inventory weapons appear in prepare page |
| AC-033 | P0 | Start battle | PARTIAL | `startBattle` and battle scene entry exist | CoreGameplayAgent/QAReleaseAgent | Verify 5 energy cost in release mode and route to battle |
| AC-034 | P1 | Prepare return | UNVERIFIED | Route buttons exist | QAReleaseAgent | Verify back/close returns home without state loss |
| AC-040 | P0 | Auto attack | PARTIAL | `GameLogicSelfCheck` covers battle session finishing and attack visuals | CoreGameplayAgent | Run runtime battle and observe monster damage |
| AC-041 | P0 | Victory settlement | PARTIAL | Settlement system exists and self-check covers one settlement | CoreGameplayAgent | Verify UI reaches victory and claim path |
| AC-042 | P0 | Defeat settlement | PARTIAL | Defeat route exists; runtime defeat path not recorded | CoreGameplayAgent | Force camp HP to zero and verify rewards |
| AC-043 | P1 | Pause/continue | UNVERIFIED | Pause modal route exists | QAReleaseAgent | Verify countdown/attack pause and resume |
| AC-044 | P1 | Auto-merge switch | PARTIAL | Button currently triggers auto merge; per-battle toggle state not proven | CoreGameplayAgent | Implement/verify toggle state if required by MVP |
| AC-045 | P1 | Skill choice | PARTIAL | Skill choice modal exists; selection effect needs runtime proof | CoreGameplayAgent | Verify one skill choice applies and returns to battle |
| AC-046 | P1 | Damage number readability | PARTIAL | Static guards check live damage nodes | UIUXAgent/QAReleaseAgent | Stress test multi-monster damage readability |
| AC-050 | P0 | Base reward claim | PARTIAL | Settlement grant path exists | CoreGameplayAgent/QAReleaseAgent | Verify victory confirm grants once and exits |
| AC-051 | P0 | Duplicate reward prevention | PARTIAL | Self-check covers duplicate settlement idempotency | CoreGameplayAgent | Verify fast-click UI path does not duplicate |
| AC-052 | P1 | Double ad success | PARTIAL | Ad completion state supported in reward system | PlatformAgent | Verify rewarded-video success grants double |
| AC-053 | P1 | Double ad failure | PARTIAL | Failure states exist in services/config | PlatformAgent | Verify cancel/fail/unavailable do not grant double |
| AC-054 | P1 | First-clear reward | PARTIAL | Reward rules exist; first-clear UI evidence missing | CoreGameplayAgent | Verify key wave first-clear idempotency |
| AC-060 | P0 | Backpack opens | PARTIAL | Backpack page and screenshot exist | QAReleaseAgent | Verify grid/detail/actions in Cocos/WeChat |
| AC-061 | P1 | Item selection | PARTIAL | UI detail nodes exist; selected-state evidence missing | UIUXAgent | Verify selected outline and detail panel |
| AC-062 | P0 | Same-type merge | PARTIAL | Inventory merge system and self-check exist | CoreGameplayAgent | Verify UI merge consumes two and creates one |
| AC-063 | P0 | Merge failure safety | PARTIAL | Merge result failures exist | CoreGameplayAgent | Verify insufficient materials do not mutate save |
| AC-064 | P1 | First merge tutorial | UNVERIFIED | Merge guide route exists | UIUXAgent/QAReleaseAgent | Verify first-time trigger and no repeated annoyance |
| AC-065 | P1 | Open chest | PARTIAL | `openChest` action exists | CoreGameplayAgent | Verify cost/reward and insufficient-resource path |
| AC-070 | P0 | Shop purchase | PARTIAL | Shop buy system exists | CoreGameplayAgent | Verify each goods card deducts/grants correctly |
| AC-071 | P0 | Shop insufficient resource | PARTIAL | Economy failure result exists | CoreGameplayAgent | Verify no deduction and clear toast |
| AC-072 | P1 | Free daily goods | PARTIAL | Self-check covers free gold once | QAReleaseAgent | Verify visible claimed state after领取 |
| AC-073 | P1 | Refresh countdown | PARTIAL | Shop UI has countdown text | UIUXAgent | Verify countdown updates and fits |
| AC-074 | P1 | Manual shop refresh | PARTIAL | `refreshShop` exists and UI calls success path | PlatformAgent/CoreGameplayAgent | Verify ad/gem branch and daily limits |
| AC-075 | P1 | Special offer placeholder | UNVERIFIED | Shop tab/card UI exists | UIUXAgent | Verify no payment path and clear coming-soon state |
| AC-080 | P0 | Pet page opens | PARTIAL | Pet page and screenshot exist | QAReleaseAgent | Verify detail/list states in Cocos/WeChat |
| AC-081 | P0 | Pet upgrade | PARTIAL | Selected pet binding added; `verify_scene_flow_guards` blocks fixed sample IDs | CoreGameplayAgent | Verify selected pet upgrade in Cocos/WeChat |
| AC-082 | P0 | Pet upgrade failure | PARTIAL | Failure reasons exist | CoreGameplayAgent | Verify insufficient materials do not mutate save |
| AC-083 | P1 | Pet deploy switch | PARTIAL | Selected pet binding added; deploy/detail buttons use current selection | CoreGameplayAgent | Verify selected pet deploy and only one deployed |
| AC-084 | P1 | Pet locked condition | PARTIAL | Config has locked pets; UI state needs verification | UIUXAgent | Verify locked cards show clear unlock condition |
| AC-085 | P1 | Pet affects power | PARTIAL | `getPower` includes progression bonuses | CoreGameplayAgent | Verify prepare power changes after pet upgrade |
| AC-090 | P0 | Talent page opens | PARTIAL | Talent page and screenshot exist | QAReleaseAgent | Verify tabs/tree/detail in runtime |
| AC-091 | P0 | Talent upgrade | PARTIAL | Selected talent binding added; learn/reset buttons use current selected node/branch | CoreGameplayAgent | Verify selected talent upgrade and prerequisite blocking |
| AC-092 | P0 | Talent prerequisite | PARTIAL | `prerequisite_missing` reason exists | CoreGameplayAgent | Verify blocked node does not spend points |
| AC-093 | P1 | Talent max level | PARTIAL | `max_level` reason exists | CoreGameplayAgent | Verify max node state in UI |
| AC-094 | P1 | Talent reset | PARTIAL | Reset system exists | CoreGameplayAgent | Verify confirm/reset/refund through UI |
| AC-095 | P1 | Talent affects power | PARTIAL | Power calculation includes talent bonuses | CoreGameplayAgent | Verify prepare power or damage increases |
| AC-100 | P0 | Task progress | PARTIAL | Progression records events | CoreGameplayAgent | Verify battle/merge/kill progress increments |
| AC-101 | P0 | Task claim | PARTIAL | Claim system and UI handlers exist | QAReleaseAgent | Verify completed task reward and claimed state |
| AC-102 | P0 | Task duplicate prevention | PARTIAL | Self-check covers daily task idempotency | CoreGameplayAgent | Verify fast-click claim path |
| AC-103 | P1 | Activity chests | PARTIAL | Activity claim method exists | QAReleaseAgent | Verify 30/60/90/120 thresholds |
| AC-104 | P1 | Daily refresh | UNVERIFIED | Time manager/save fields exist | CoreGameplayAgent | Simulate cross-day reset |
| AC-105 | P0 | Achievement claim | PARTIAL | Achievement claim system exists | QAReleaseAgent | Verify one achievement reward |
| AC-106 | P1 | Claim all achievements | PARTIAL | `claimAllAchievements` exists | QAReleaseAgent | Verify multi-claim idempotency |
| AC-110 | P0 | Mail opens | PARTIAL | Mail page/detail route exists | QAReleaseAgent | Verify list and detail drawer |
| AC-111 | P0 | Mail attachment claim | PARTIAL | `claimMail` exists | QAReleaseAgent | Verify single attachment grant |
| AC-112 | P0 | Mail duplicate prevention | PARTIAL | Claimed mail blocks repeat | QAReleaseAgent | Verify fast-click path |
| AC-113 | P1 | Claim all mails | PARTIAL | `claimAllMails` exists | QAReleaseAgent | Verify multiple attachments grant once |
| AC-114 | P1 | Delete all mails | PARTIAL | `deleteClaimedAndEmptyMails` exists; UI binding needs proof | QAReleaseAgent | Verify only safe mails delete |
| AC-115 | P1 | Mail red dot | UNVERIFIED | Red-dot system exists | UIUXAgent | Verify red dot before/after claim |
| AC-120 | P0 | Settings save | PARTIAL | Settings toggle updates save | QAReleaseAgent | Restart after toggles |
| AC-121 | P1 | Policy entry | PARTIAL | Settings privacy route exists | ComplianceService | Verify agreement/privacy content and access |
| AC-122 | P1 | Version display | PARTIAL | Settings version node exists | QAReleaseAgent | Verify version matches config |
| AC-123 | P0 | Save restore | UNVERIFIED | SaveManager exists; restart evidence missing | QAReleaseAgent | Restart after reward/merge/pet/talent changes |
| AC-124 | P0 | Crash/restart safety | UNVERIFIED | Atomic commit pattern exists | QAReleaseAgent/CoreGameplayAgent | Force restart during battle/claim and inspect save |
| AC-130 | P0 | Non-negative currency | PARTIAL | Self-check covers no negative currency | CoreGameplayAgent | Stress purchase/upgrade/open chest through UI |
| AC-131 | P0 | Atomic transaction | PARTIAL | Commit pattern clones and replaces on success | CoreGameplayAgent | Simulate failure and verify no partial mutation |
| AC-132 | P0 | Reward idempotency | PARTIAL | Claimed reward IDs exist for battle | CoreGameplayAgent | Verify all reward sources are idempotent |
| AC-133 | P1 | Energy recovery | PARTIAL | `recoverEnergy` exists | CoreGameplayAgent | Verify cap and time behavior |
| AC-134 | P1 | Daily limits | PARTIAL | Daily limits exist for shop/ad paths | QAReleaseAgent | Verify buttons disable or toast after limit |
| AC-140 | P1 | Portrait safe-area | UNVERIFIED | Browser screenshots exist only | UIUXAgent/QAReleaseAgent | Test common phones and aspect ratios |
| AC-141 | P1 | Text fitting | PARTIAL | Static screenshots exist | UIUXAgent | Test long nickname/task/mail text |
| AC-142 | P1 | Battle weapon bar layout | PARTIAL | Static guard checks HUD placement | UIUXAgent | Verify short-screen battle layout |
| AC-143 | P1 | Mail long layout | UNVERIFIED | Mail detail UI exists | UIUXAgent | Test long mail body and attachments |
| AC-144 | P1 | Talent scrolling | UNVERIFIED | Talent tree UI exists; scroll behavior not proven | UIUXAgent | Verify all nodes reachable |
| AC-145 | P2 | Interaction feedback | PARTIAL | Buttons/toasts exist | UIUXAgent | Verify press/claim/merge feedback |
| AC-150 | P1 | Page switching stability | UNVERIFIED | Static routes exist | QAReleaseAgent | Repeatedly switch core pages |
| AC-151 | P1 | Battle pressure | PARTIAL | Battle model supports multiple monsters/damage | QAReleaseAgent | Stress test runtime FPS/responsiveness |
| AC-152 | P1 | Memory release | UNVERIFIED | No memory evidence recorded | QAReleaseAgent | Re-enter battle repeatedly on device |
| AC-153 | P1 | Power-saving mode | PARTIAL | Setting exists; reduced effect behavior not proven | CoreGameplayAgent | Verify lower update/effect pressure while playable |

## Current P0 Launch Blockers

- `AC-001`: WeChat DevTools import and preview evidence is missing.
- `AC-002`: WeChat launch startup evidence is missing.
- `AC-033`, `AC-040`, `AC-041`, `AC-050`: the full battle loop has static/self-check evidence but no fresh UI/WeChat proof.
- `AC-081`, `AC-083`, `AC-091`: pet/talent selected-state bindings now have static guard coverage; Cocos/WeChat runtime proof is still required.
- `AC-123`, `AC-124`: restart/crash save recovery evidence is missing.
- `AC-130` through `AC-132`: economy integrity has partial system evidence but needs UI stress evidence.
