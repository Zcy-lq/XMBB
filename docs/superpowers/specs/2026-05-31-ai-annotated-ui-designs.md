# AI Annotated UI Design Set

Date: 2026-05-31
Project: CatBackpackNight
Output folder: `D:\工作\XMBB\设计图_AI全页面2K标注版`

## Goal

Generate a complete 2K high-definition AI design-board set for every major screen and modal in CatBackpackNight. Each image should match the existing red dashed annotation-board style in `D:\工作\XMBB\设计图`, while preserving the night forest, wood sign, parchment panel, gold button, and cute cat adventure visual identity from the project references.

## Source Context

- Existing annotated template examples: `D:\工作\XMBB\设计图`
- Existing vertical UI references: `D:\工作\XMBB\CatBackpackNight\assets\textures\references`
- Screen flow contract: `D:\工作\XMBB\CatBackpackNight\docs\SCREEN_FLOW.md`
- Component contract: `D:\工作\XMBB\CatBackpackNight\docs\UI_COMPONENT_SPEC.md`
- Runtime routes: `D:\工作\XMBB\CatBackpackNight\assets\scripts\configs\RouteConfig.ts`

## Global Image Rules

- Use AI image generation directly for the full annotated design board.
- Use a consistent landscape development-board template for every file.
- Target 2K clarity. The board should read as a polished design annotation image.
- Left side: primary game screen mockup in portrait phone ratio.
- Right side: component notes, interaction notes, and asset list.
- Bottom: component state examples where useful.
- Annotation style: red or colored dashed rectangles, numbered round markers, compact tables, warm parchment background, dark brown borders.
- Visual style: Q-version cat adventure, night forest camp, wood signs, parchment panels, gold/yellow primary buttons, green claim buttons, blue secondary buttons, red warning markers.
- Avoid photorealism, modern flat SaaS UI, neon sci-fi UI, generic mobile-app style, and inconsistent fonts or palettes.

## File Order

1. `01_LOGIN_登录页.png`
2. `02_HOME_主页.png`
3. `03_BATTLE_PREPARE_战斗准备.png`
4. `04_BATTLE_战斗界面.png`
5. `05_PAUSE_MODAL_暂停弹窗.png`
6. `06_SKILL_CHOICE_技能选择弹窗.png`
7. `07_VICTORY_胜利结算.png`
8. `08_DEFEAT_失败结算.png`
9. `09_BACKPACK_背包.png`
10. `10_MERGE_GUIDE_合成提示.png`
11. `11_SHOP_商店.png`
12. `12_PET_宠物.png`
13. `13_PET_DETAIL_宠物详情.png`
14. `14_TALENT_天赋.png`
15. `15_DAILY_TASK_每日任务.png`
16. `16_ACHIEVEMENT_成就.png`
17. `17_MAIL_邮件.png`
18. `18_MAIL_DETAIL_邮件详情弹窗.png`
19. `19_SETTINGS_设置.png`
20. `20_POLICY_MODAL_协议隐私弹窗.png`
21. `21_CONFIRM_MODAL_通用确认弹窗.png`
22. `22_TOAST_MODAL_提示弹窗.png`

## Per-Image Content

Every generated board must include:

- Header title: `猫猫背包守夜 - <screen name>【开发标注版设计图】`
- Metadata chips: screen id, version, portrait target `1080x1920`, logical size `750x1334`
- Numbered annotations on the game mockup
- A legend explaining dashed box colors
- Component/layer notes
- Interaction notes
- Asset list, including which items require final art and which can be code-rendered

## Quality Review

After generation:

- Copy every final image from the built-in generated image folder into `D:\工作\XMBB\设计图_AI全页面2K标注版`.
- Inspect key outputs visually for consistent template, readable layout, correct screen subject, and no severe text overlap.
- If an image drifts badly from the template, regenerate it once with a tighter prompt.
- Report the final saved paths and any images that may need manual refinement.
