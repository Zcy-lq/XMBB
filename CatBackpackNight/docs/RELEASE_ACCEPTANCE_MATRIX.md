# Release Acceptance Matrix

This matrix is the launch gate for the WeChat mini game release. A row is not `PASS` unless it has fresh automated output, Cocos/WeChat evidence, screenshot evidence, or a recorded manual QA result.

Status values:

- `PASS`: verified with fresh evidence.
- `PARTIAL`: source/static checks exist, but runtime or manual evidence is incomplete.
- `UNVERIFIED`: no current launch evidence.
- `BLOCKED`: cannot pass until an external tool, account, device, or build step is completed.

| AC ID | Priority | Area | Status | Evidence | Owner | Next Action |
| --- | --- | --- | --- | --- | --- | --- |
| AC-001 | P0 | WeChat import | BLOCKED | `build/wechatgame` output is generated and passes `verify_wechat_build_output`; WeChat DevTools CLI import/open still times out with no screenshot/log evidence; `verify_launch_evidence` final mode blocks until import evidence exists | PlatformAgent | Import the generated WeChat target in DevTools and record `docs/launch_evidence/launch_evidence.json` |
| AC-002 | P0 | Startup | UNVERIFIED | Browser Preview route screenshots exist; WeChat startup is not recorded in `docs/launch_evidence/launch_evidence.json` | QAReleaseAgent | Record Cocos launch and WeChat launch logs/screenshots |
| AC-003 | P1 | Resource loading | PARTIAL | `verify_runtime_asset_index` and UI asset contract pass locally | QAReleaseAgent | Cold-start home/backpack/battle in Cocos and WeChat |
| AC-004 | P1 | Config loading | PASS | `validate_configs` passes 19 JSON files | QAReleaseAgent | Keep in regression suite |
| AC-010 | P0 | Agreement gate | PARTIAL | `verify_full_loop_acceptance` covers `agreement_gate_blocks_start`; `UISkeletonBuilder` blocks start without agreement | QAReleaseAgent | Manually verify toast and route lock in Cocos/WeChat |
| AC-011 | P0 | Enter home | PARTIAL | `verify_full_loop_acceptance` covers `accept_agreement_enters_home`; UI handler routes accepted agreement to `home` | QAReleaseAgent | Verify accepted agreement persists and enters home in WeChat |
| AC-012 | P1 | Compliance info | PARTIAL | `verify_release_compliance` verifies readable agreement/privacy/16+/health text, login nodes, review-mode ad safety, and production-input blockers | ComplianceService/QAReleaseAgent | Verify legal URLs and content in WeChat runtime |
| AC-013 | P1 | Second launch agreement | PARTIAL | `verify_full_loop_acceptance` covers restart clone with accepted agreement; real storage restart evidence missing | QAReleaseAgent | Restart after accepting agreement in Cocos/WeChat |
| AC-020 | P0 | Home display | PARTIAL | `verify_page_function_coverage` covers the home route contract and screenshot; `verify_ui_design_parity` covers local portrait evidence; `verify_launch_evidence` requires final UI signoff evidence | UIUXAgent/QAReleaseAgent | Verify player info/resources/chapter/start button in Cocos/WeChat |
| AC-021 | P0 | Bottom navigation | PARTIAL | `verify_page_function_coverage` covers route map and bottom-nav route tokens | UIUXAgent/QAReleaseAgent | Tap every nav route on device |
| AC-022 | P1 | Settings entry | PARTIAL | Settings route and button handler exist | QAReleaseAgent | Verify settings opens and returns |
| AC-023 | P1 | Red dots | PARTIAL | `verify_full_loop_acceptance` covers `red_dot_claimable_thresholds_and_clear` and `mail_red_dot_count_drops_after_claim_all`; `DefaultRedDotRules` is config-backed and guarded by `verify_scene_flow_guards` | UIUXAgent/QAReleaseAgent | Verify task/mail red dots visually in Cocos/WeChat |
| AC-024 | P1 | Insufficient energy | PARTIAL | `verify_full_loop_acceptance` covers `release_energy_insufficient_blocks_start_no_mutation` and `release_energy_start_spends_configured_cost` with development unlimited energy disabled in the test config | CoreGameplayAgent | Verify release-mode toast/button state in Cocos/WeChat |
| AC-030 | P0 | Open battle prepare | PARTIAL | `verify_page_function_coverage` covers home start and battle-prepare route contracts | QAReleaseAgent | Tap from home and record prepare screen |
| AC-031 | P1 | Power display | PARTIAL | `getBattlePreparation` computes recommended/my power | CoreGameplayAgent | Verify visible values update after growth |
| AC-032 | P1 | Weapon preview | PARTIAL | Weapon preview data and UI slots exist | QAReleaseAgent | Verify inventory weapons appear in prepare page |
| AC-033 | P0 | Start battle | PARTIAL | `verify_full_loop_acceptance` covers `start_first_battle`; `startBattle` and battle scene entry exist | CoreGameplayAgent/QAReleaseAgent | Verify 5 energy cost in release mode and route to battle |
| AC-034 | P1 | Prepare return | UNVERIFIED | Route buttons exist | QAReleaseAgent | Verify back/close returns home without state loss |
| AC-040 | P0 | Auto attack | PARTIAL | `verify_full_loop_acceptance` covers `first_battle_reaches_settlement`; `GameLogicSelfCheck` covers battle session finishing and attack visuals | CoreGameplayAgent | Run runtime battle and observe monster damage |
| AC-041 | P0 | Victory settlement | PARTIAL | `verify_full_loop_acceptance` covers `first_battle_reaches_settlement` and `claim_reward_once`; self-check covers one settlement | CoreGameplayAgent | Verify UI reaches victory and claim path |
| AC-042 | P0 | Defeat settlement | PARTIAL | `verify_full_loop_acceptance` covers `defeat_settlement_no_wave_advance`; defeat route exists | CoreGameplayAgent | Force camp HP to zero in runtime and verify rewards |
| AC-043 | P1 | Pause/continue | PARTIAL | `verify_full_loop_acceptance` covers `battle_pause_resume_blocks_and_restores_ticks`; pause modal route exists | QAReleaseAgent | Verify countdown/attack pause and resume visually |
| AC-044 | P1 | Auto-merge switch | PARTIAL | `verify_full_loop_acceptance` covers `battle_auto_merge_toggle_state`; UI button exists | CoreGameplayAgent | Verify UI switch feedback if MVP needs a visible state |
| AC-045 | P1 | Skill choice | PARTIAL | `verify_full_loop_acceptance` covers `skill_choice_offer_apply_and_duplicate_block`; skill choice modal exists | CoreGameplayAgent | Verify one skill choice applies and returns to battle visually |
| AC-046 | P1 | Damage number readability | PARTIAL | Static guards check live damage nodes | UIUXAgent/QAReleaseAgent | Stress test multi-monster damage readability |
| AC-050 | P0 | Base reward claim | PARTIAL | `verify_full_loop_acceptance` covers `claim_reward_once`; settlement grant path exists | CoreGameplayAgent/QAReleaseAgent | Verify victory confirm grants once and exits |
| AC-051 | P0 | Duplicate reward prevention | PARTIAL | `verify_full_loop_acceptance` covers `duplicate_reward_blocked`; self-check covers duplicate settlement idempotency | CoreGameplayAgent | Verify fast-click UI path does not duplicate |
| AC-052 | P1 | Double ad success | PARTIAL | `verify_full_loop_acceptance` covers `battle_double_reward_after_ad`; UI calls `AdService.showRewardedAd('battle_reward_double')` before `claimBattleDoubleReward` | PlatformAgent | Verify rewarded-video success grants double in WeChat DevTools/device |
| AC-053 | P1 | Double ad failure | PARTIAL | `verify_full_loop_acceptance` covers `battle_double_cancelled_ad_no_mutation`; `AdService` requires completed close result before success | PlatformAgent | Verify cancel/fail/unavailable do not grant double in WeChat runtime |
| AC-054 | P1 | First-clear reward | PARTIAL | Reward rules exist; first-clear UI evidence missing | CoreGameplayAgent | Verify key wave first-clear idempotency |
| AC-060 | P0 | Backpack opens | PARTIAL | `verify_page_function_coverage` covers backpack route contract, screenshot, merge/open/sort actions | QAReleaseAgent | Verify grid/detail/actions in Cocos/WeChat |
| AC-061 | P1 | Item selection | PARTIAL | UI detail nodes exist; selected-state evidence missing | UIUXAgent | Verify selected outline and detail panel |
| AC-062 | P0 | Same-type merge | PARTIAL | `verify_full_loop_acceptance` covers `backpack_merge`; inventory merge system and self-check exist | CoreGameplayAgent | Verify UI merge consumes two and creates one |
| AC-063 | P0 | Merge failure safety | PARTIAL | `verify_full_loop_acceptance` covers `merge_failure_no_mutation`; merge result failures exist | CoreGameplayAgent | Verify insufficient materials do not mutate save through UI |
| AC-064 | P1 | First merge tutorial | UNVERIFIED | Merge guide route exists | UIUXAgent/QAReleaseAgent | Verify first-time trigger and no repeated annoyance |
| AC-065 | P1 | Open chest | PARTIAL | `verify_full_loop_acceptance` covers `open_chest_consumes_cost_and_grants_reward`, `open_chest_insufficient_gold_no_mutation`, and `open_chest_missing_chest_no_mutation`; UI action calls `gameLogic.openChest()` | CoreGameplayAgent | Verify open-chest UI feedback in Cocos/WeChat |
| AC-070 | P0 | Shop purchase | PARTIAL | `verify_full_loop_acceptance` covers `shop_paid_purchase_deducts_and_grants`; shop buy system exists | CoreGameplayAgent | Verify each goods card deducts/grants correctly through UI |
| AC-071 | P0 | Shop insufficient resource | PARTIAL | `verify_full_loop_acceptance` covers `shop_insufficient_resource_no_mutation`; economy failure result exists | CoreGameplayAgent | Verify no deduction and clear toast |
| AC-072 | P1 | Free daily goods | PARTIAL | `verify_full_loop_acceptance` covers `shop_free_good_once`; self-check covers free gold once | QAReleaseAgent | Verify visible claimed state after claim |
| AC-073 | P1 | Refresh countdown | PARTIAL | Shop UI has countdown text | UIUXAgent | Verify countdown updates and fits |
| AC-074 | P1 | Manual shop refresh | PARTIAL | `verify_full_loop_acceptance` covers `shop_refresh_cancelled_ad_no_mutation` and `shop_refresh_ad_success_then_daily_limit`; UI calls `gameLogic.refreshShop` | PlatformAgent/CoreGameplayAgent | Verify ad/gem branch and button state in Cocos/WeChat |
| AC-075 | P1 | Special offer placeholder | UNVERIFIED | Shop tab/card UI exists | UIUXAgent | Verify no payment path and clear coming-soon state |
| AC-080 | P0 | Pet page opens | PARTIAL | `verify_page_function_coverage` covers pet route contract, screenshot, selected/deploy/upgrade actions | QAReleaseAgent | Verify detail/list states in Cocos/WeChat |
| AC-081 | P0 | Pet upgrade | PARTIAL | `verify_full_loop_acceptance` covers `selected_pet_upgrade`; selected pet binding added and guarded against fixed sample IDs | CoreGameplayAgent | Verify selected pet upgrade in Cocos/WeChat |
| AC-082 | P0 | Pet upgrade failure | PARTIAL | `verify_full_loop_acceptance` covers `pet_upgrade_failure_no_mutation`; failure reasons exist | CoreGameplayAgent | Verify insufficient materials do not mutate save through UI |
| AC-083 | P1 | Pet deploy switch | PARTIAL | `verify_full_loop_acceptance` covers `pet_deploy_switch_single_active` and `pet_deploy_locked_blocked_no_mutation`; deploy/detail buttons use current selection | CoreGameplayAgent | Verify selected pet deploy UI state in Cocos/WeChat |
| AC-084 | P1 | Pet locked condition | PARTIAL | Config has locked pets; UI state needs verification | UIUXAgent | Verify locked cards show clear unlock condition |
| AC-085 | P1 | Pet affects power | PARTIAL | `getPower` includes progression bonuses | CoreGameplayAgent | Verify prepare power changes after pet upgrade |
| AC-090 | P0 | Talent page opens | PARTIAL | `verify_page_function_coverage` covers talent route contract, screenshot, select/learn/reset actions | QAReleaseAgent | Verify tabs/tree/detail in runtime |
| AC-091 | P0 | Talent upgrade | PARTIAL | `verify_full_loop_acceptance` covers `selected_talent_upgrade`; learn/reset buttons use current selected node/branch | CoreGameplayAgent | Verify selected talent upgrade and prerequisite blocking |
| AC-092 | P0 | Talent prerequisite | PARTIAL | `verify_full_loop_acceptance` covers `talent_prerequisite_blocked`; `prerequisite_missing` reason exists | CoreGameplayAgent | Verify blocked node does not spend points through UI |
| AC-093 | P1 | Talent max level | PARTIAL | `max_level` reason exists | CoreGameplayAgent | Verify max node state in UI |
| AC-094 | P1 | Talent reset | PARTIAL | `verify_full_loop_acceptance` covers `talent_reset_refunds_branch_points`; reset button uses selected branch | CoreGameplayAgent | Verify confirm/reset/refund through UI |
| AC-095 | P1 | Talent affects power | PARTIAL | Power calculation includes talent bonuses | CoreGameplayAgent | Verify prepare power or damage increases |
| AC-100 | P0 | Task progress | PARTIAL | `verify_full_loop_acceptance` covers `task_progress_updates`; progression records events | CoreGameplayAgent | Verify battle/merge/kill progress increments in UI |
| AC-101 | P0 | Task claim | PARTIAL | `verify_full_loop_acceptance` covers `task_claim`; claim system and UI handlers exist | QAReleaseAgent | Verify completed task reward and claimed state |
| AC-102 | P0 | Task duplicate prevention | PARTIAL | `verify_full_loop_acceptance` covers `task_duplicate_blocked`; self-check covers daily task idempotency | CoreGameplayAgent | Verify fast-click claim path |
| AC-103 | P1 | Activity chests | PARTIAL | `verify_full_loop_acceptance` covers `activity_chest_claim` and duplicate blocking; activity claim method exists | QAReleaseAgent | Verify 30/60/90/120 thresholds in UI |
| AC-104 | P1 | Daily refresh | PARTIAL | `verify_full_loop_acceptance` covers `daily_refresh_resets_tasks_and_limits_once`; `SaveManager` uses the pure `DailyResetSystem` helper | CoreGameplayAgent | Verify cross-day reset in Cocos/WeChat storage |
| AC-105 | P0 | Achievement claim | PARTIAL | `verify_full_loop_acceptance` covers `achievement_claim` and `achievement_duplicate_blocked`; achievement claim system exists | QAReleaseAgent | Verify one achievement reward in UI |
| AC-106 | P1 | Claim all achievements | PARTIAL | `verify_full_loop_acceptance` covers `achievement_claim_all_multi_and_idempotent`; UI button calls `gameLogic.claimAllAchievements()` | QAReleaseAgent | Verify multi-claim UI feedback in Cocos/WeChat |
| AC-110 | P0 | Mail opens | PARTIAL | `verify_page_function_coverage` covers mail and mailDetail route contracts, screenshots, selected-state actions | QAReleaseAgent | Verify list and detail drawer in Cocos/WeChat |
| AC-111 | P0 | Mail attachment claim | PARTIAL | `verify_full_loop_acceptance` covers `mail_claim`; mail list/detail claim buttons use selected mail id | QAReleaseAgent | Verify single attachment grant and read-only mail path |
| AC-112 | P0 | Mail duplicate prevention | PARTIAL | `verify_full_loop_acceptance` covers `mail_duplicate_blocked`; claimed mail blocks repeat | QAReleaseAgent | Verify fast-click path |
| AC-113 | P1 | Claim all mails | PARTIAL | `verify_full_loop_acceptance` covers `mail_claim_all` and duplicate blocking; `claimAllMails` exists | QAReleaseAgent | Verify multiple attachments grant once |
| AC-114 | P1 | Delete all mails | PARTIAL | `verify_full_loop_acceptance` covers `mail_delete_after_claim`, `mail_delete_all_safe`, and unclaimed delete blocking; delete-all and selected detail delete are bound | QAReleaseAgent | Verify only safe mails delete |
| AC-115 | P1 | Mail red dot | PARTIAL | `verify_full_loop_acceptance` covers `mail_red_dot_count_drops_after_claim_all`; unread announcement red dot remains by design | UIUXAgent | Verify visual red-dot count/state in Cocos/WeChat |
| AC-120 | P0 | Settings save | PARTIAL | `verify_full_loop_acceptance` covers `settings_persist_after_restart`; settings toggle updates save | QAReleaseAgent | Restart after toggles in Cocos/WeChat |
| AC-121 | P1 | Policy entry | PARTIAL | Settings privacy route exists | ComplianceService | Verify agreement/privacy content and access |
| AC-122 | P1 | Version display | PARTIAL | Settings version node exists | QAReleaseAgent | Verify version matches config |
| AC-123 | P0 | Save restore | PARTIAL | `verify_full_loop_acceptance` covers `restart_restore_save`; real Cocos/WeChat storage restart evidence missing | QAReleaseAgent | Restart after reward/merge/pet/talent changes |
| AC-124 | P0 | Crash/restart safety | PARTIAL | `verify_scene_flow_guards` now enforces clone-before-update and replace-only-after-success in `GameLogicFacade.commit`; real crash/restart proof is missing | QAReleaseAgent/CoreGameplayAgent | Force restart during battle/claim and inspect save |
| AC-130 | P0 | Non-negative currency | PARTIAL | `verify_full_loop_acceptance` covers `economy_non_negative`, open-chest cost safety, shop purchase limits, and energy cap behavior; self-check covers no negative currency | CoreGameplayAgent | Stress purchase/upgrade/open chest through UI |
| AC-131 | P0 | Atomic transaction | PARTIAL | `verify_full_loop_acceptance` covers failure no-mutation checks for merge, pet upgrade, open chest, shop purchase, ad refresh, and rewarded-video cancellation; commit pattern clones and replaces on success | CoreGameplayAgent | Simulate UI failures and verify no partial mutation |
| AC-132 | P0 | Reward idempotency | PARTIAL | `verify_full_loop_acceptance` covers duplicate battle, double reward, task, achievement single/all, activity chest, mail, and shop claims; claimed reward IDs exist for battle | CoreGameplayAgent | Verify all reward sources are idempotent through UI |
| AC-133 | P1 | Energy recovery | PARTIAL | `verify_full_loop_acceptance` covers `energy_recovery_interval_and_cap` | CoreGameplayAgent | Verify cap and time behavior in Cocos/WeChat |
| AC-134 | P1 | Daily limits | PARTIAL | `verify_full_loop_acceptance` covers `shop_paid_daily_limit_blocked_no_mutation`, `shop_refresh_ad_success_then_daily_limit`, and `daily_refresh_resets_tasks_and_limits_once` | QAReleaseAgent | Verify buttons disable or toast after limit |
| AC-140 | P1 | Portrait safe-area | UNVERIFIED | Browser screenshots exist only | UIUXAgent/QAReleaseAgent | Test common phones and aspect ratios |
| AC-141 | P1 | Text fitting | PARTIAL | Static screenshots exist | UIUXAgent | Test long nickname/task/mail text |
| AC-142 | P1 | Battle weapon bar layout | PARTIAL | Static guard checks HUD placement | UIUXAgent | Verify short-screen battle layout |
| AC-143 | P1 | Mail long layout | UNVERIFIED | Mail detail UI exists | UIUXAgent | Test long mail body and attachments |
| AC-144 | P1 | Talent scrolling | UNVERIFIED | Talent tree UI exists; scroll behavior not proven | UIUXAgent | Verify all nodes reachable |
| AC-145 | P2 | Interaction feedback | PARTIAL | Buttons/toasts exist | UIUXAgent | Verify press/claim/merge feedback |
| AC-150 | P1 | Page switching stability | UNVERIFIED | Static routes exist | QAReleaseAgent | Repeatedly switch core pages |
| AC-151 | P1 | Battle pressure | PARTIAL | Battle model supports multiple monsters/damage | QAReleaseAgent | Stress test runtime FPS/responsiveness |
| AC-152 | P1 | Memory release | UNVERIFIED | No memory evidence recorded; `verify_launch_evidence` requires performance smoke metrics in final mode | QAReleaseAgent | Re-enter battle repeatedly on device |
| AC-153 | P1 | Power-saving mode | PARTIAL | Setting exists; reduced effect behavior not proven | CoreGameplayAgent | Verify lower update/effect pressure while playable |

## Current P0 Launch Blockers

- `AC-001`: WeChat DevTools import and preview evidence is missing.
- `AC-002`: WeChat launch startup evidence is missing.
- Final launch evidence: `verify_launch_evidence` emits `BLOCKED_EVIDENCE launch_evidence.json` locally and fails in `XMBB_RELEASE_FINAL=1` until WeChat/真机/UI signoff evidence exists.
- `AC-033`, `AC-040`, `AC-041`, `AC-050`: the full battle loop has automated acceptance evidence, but no fresh Cocos/WeChat UI proof.
- `AC-052`, `AC-053`: rewarded-video double reward has automated and UI wiring evidence, but no WeChat ad runtime success/cancel evidence.
- `AC-081`, `AC-083`, `AC-091`, `AC-094`: pet/talent selected-state and reset behavior now have automated guard coverage; Cocos/WeChat runtime proof is still required.
- `AC-123`: restart restore has automated clone-save evidence, but real Cocos/WeChat storage restart evidence is missing.
- `AC-124`: atomic commit has static guard coverage, but real crash recovery evidence is missing.
- `AC-130` through `AC-132`: economy integrity has automated system evidence but needs UI stress evidence.
