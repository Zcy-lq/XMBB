# UI Design Parity Matrix

This is the 22-page visual launch checklist for the WeChat mini game. A page is not launch-ready until the implemented screen is compared against the matching AI annotated design reference and the result is recorded here.

Design source: `../设计图_AI全页面2K标注版`

Local screenshot evidence source: `tmp/final_mobile_pages_after_ui_pass` (gitignored local QA evidence)

Status values:

- `PASS`: visual layout, content, interaction states, and text fitting are signed off against the design reference.
- `REVIEW_REQUIRED`: current implementation/screenshot exists, but manual design parity has not been signed off.
- `BLOCKED`: page, screenshot, route, or required state is missing.

| Page | Design Reference | Current Screenshot Evidence | Status | Required Launch Check |
| --- | --- | --- | --- | --- |
| 01 Login | `设计图_AI全页面2K标注版/01_LOGIN_登录页.png` | `tmp/final_mobile_pages_after_ui_pass/01_login.png` | REVIEW_REQUIRED | Agreement gate, age/health notice, title art, primary CTA, and safe-area fit match the design. |
| 02 Home | `设计图_AI全页面2K标注版/02_HOME_主页.png` | `tmp/final_mobile_pages_after_ui_pass/02_home.png` | REVIEW_REQUIRED | Top resources, function rail, side entries, stage selector, bottom nav, and start CTA match the design. |
| 03 Battle Prepare | `设计图_AI全页面2K标注版/03_BATTLE_PREPARE_战斗准备.png` | `tmp/final_mobile_pages_after_ui_pass/03_battle_prepare.png` | REVIEW_REQUIRED | Recommended power, player power, weapon preview, cost, start, and back states match the design. |
| 04 Battle | `设计图_AI全页面2K标注版/04_BATTLE_战斗界面.png` | `tmp/final_mobile_pages_after_ui_pass/04_battle.png` | REVIEW_REQUIRED | Monster lane, camp HP, wave, timer, weapon bar, skill button, pause, and damage readability match the design. |
| 05 Pause Modal | `设计图_AI全页面2K标注版/05_PAUSE_MODAL_暂停弹窗.png` | `tmp/final_mobile_pages_after_ui_pass/05_pause_modal.png` | REVIEW_REQUIRED | Resume, restart/exit, dim backdrop, and modal hierarchy match the design. |
| 06 Skill Choice | `设计图_AI全页面2K标注版/06_SKILL_CHOICE_技能选择弹窗.png` | `tmp/final_mobile_pages_after_ui_pass/06_skill_choice.png` | REVIEW_REQUIRED | Three-choice layout, rarity/description text, select feedback, and battle backdrop match the design. |
| 07 Victory | `设计图_AI全页面2K标注版/07_VICTORY_胜利结算.png` | `tmp/final_mobile_pages_after_ui_pass/07_victory.png` | REVIEW_REQUIRED | Reward list, first-clear state, double reward entry, confirm action, and backdrop match the design. |
| 08 Defeat | `设计图_AI全页面2K标注版/08_DEFEAT_失败结算.png` | `tmp/final_mobile_pages_after_ui_pass/08_defeat.png` | REVIEW_REQUIRED | Failure reason, retry/exit CTA, progress hint, and reward/no-reward state match the design. |
| 09 Backpack | `设计图_AI全页面2K标注版/09_BACKPACK_背包.png` | `tmp/final_mobile_pages_after_ui_pass/09_backpack.png` | REVIEW_REQUIRED | Grid, tabs, selected item detail, merge/open actions, resource text, and empty states match the design. |
| 10 Merge Guide | `设计图_AI全页面2K标注版/10_MERGE_GUIDE_合成提示.png` | `tmp/final_mobile_pages_after_ui_pass/10_merge_guide.png` | REVIEW_REQUIRED | First-merge tutorial copy, highlight target, confirm/close behavior, and no repeated annoyance match the design. |
| 11 Shop | `设计图_AI全页面2K标注版/11_SHOP_商店.png` | `tmp/final_mobile_pages_after_ui_pass/11_shop.png` | REVIEW_REQUIRED | Goods cards, free daily state, refresh countdown, insufficient-resource state, and tabs match the design. |
| 12 Pet | `设计图_AI全页面2K标注版/12_PET_宠物.png` | `tmp/final_mobile_pages_after_ui_pass/12_pet.png` | REVIEW_REQUIRED | Pet list, locked/unlocked/deployed states, selected pet, upgrade CTA, and material cost match the design. |
| 13 Pet Detail | `设计图_AI全页面2K标注版/13_PET_DETAIL_宠物详情.png` | `tmp/final_mobile_pages_after_ui_pass/13_pet_detail.png` | REVIEW_REQUIRED | Detail modal/page, stats, skills, deploy/upgrade actions, and close/back behavior match the design. |
| 14 Talent | `设计图_AI全页面2K标注版/14_TALENT_天赋.png` | `tmp/final_mobile_pages_after_ui_pass/14_talent.png` | REVIEW_REQUIRED | Tree scrolling, prerequisites, selected node detail, upgrade/reset actions, and point display match the design. |
| 15 Daily Task | `设计图_AI全页面2K标注版/15_DAILY_TASK_每日任务.png` | `tmp/final_mobile_pages_after_ui_pass/15_daily_task.png` | REVIEW_REQUIRED | Task list, progress bars, claim states, activity chest track, and daily reset hint match the design. |
| 16 Achievement | `设计图_AI全页面2K标注版/16_ACHIEVEMENT_成就.png` | `tmp/final_mobile_pages_after_ui_pass/16_achievement.png` | REVIEW_REQUIRED | Achievement categories, progress, claim/claimed states, and claim-all behavior match the design. |
| 17 Mail | `设计图_AI全页面2K标注版/17_MAIL_邮件.png` | `tmp/final_mobile_pages_after_ui_pass/17_mail.png` | REVIEW_REQUIRED | Mail list, unread/read/claimed states, red dot, claim-all, delete-safe behavior, and empty state match the design. |
| 18 Mail Detail | `设计图_AI全页面2K标注版/18_MAIL_DETAIL_邮件详情弹窗.png` | `tmp/final_mobile_pages_after_ui_pass/18_mail_detail.png` | REVIEW_REQUIRED | Long title/body fitting, attachments, claim button, claimed state, and close behavior match the design. |
| 19 Settings | `设计图_AI全页面2K标注版/19_SETTINGS_设置.png` | `tmp/final_mobile_pages_after_ui_pass/19_settings.png` | REVIEW_REQUIRED | Audio, vibration, power-saving, policy links, version text, and persistence states match the design. |
| 20 Policy Modal | `设计图_AI全页面2K标注版/20_POLICY_MODAL_协议隐私弹窗.png` | `tmp/final_mobile_pages_after_ui_pass/20_policy_modal.png` | REVIEW_REQUIRED | Agreement/privacy content, scroll, accept/close state, and safe-area layout match the design. |
| 21 Confirm Modal | `设计图_AI全页面2K标注版/21_CONFIRM_MODAL_通用确认弹窗.png` | `tmp/final_mobile_pages_after_ui_pass/21_confirm_modal.png` | REVIEW_REQUIRED | Title/body/action variants, destructive action style, cancel/confirm layout, and backdrop match the design. |
| 22 Toast Modal | `设计图_AI全页面2K标注版/22_TOAST_MODAL_提示弹窗.png` | `tmp/final_mobile_pages_after_ui_pass/22_toast_modal.png` | REVIEW_REQUIRED | Toast placement, duration, success/error/warning variants, and no-content-overlap behavior match the design. |

## Current Design P0

- The design audit must count all 22 annotated page references before any UI pass can be considered valid.
- Screenshots in `tmp/final_mobile_pages_after_ui_pass` are useful local evidence, but they are not release evidence until each row above is reviewed and signed off.
- Pet/talent selected-state actions and WeChat runtime screenshots must be verified before these rows can move to `PASS`.
