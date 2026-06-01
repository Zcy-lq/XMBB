# Smoke Test Checklist

Use this checklist before calling a multi-agent pass ready for the next stage.

## Static Gates

- `npm run validate:configs`
- `npm run validate:assets`
- `npm run validate:handoffs -- --allow-missing`
- `npm run build:check`
- `npm run typecheck`

## Runtime Flow

- Login screen opens.
- Start button enters home after agreement check.
- Home screen can route to battle prepare.
- Battle prepare can start a battle.
- Battle can reach win or lose settlement.
- Backpack can select and merge a valid item.
- Shop can buy a configured item and prevent negative currency.
- Save data persists after reload.

## Platform Fallback

- Non-WeChat environment uses mock platform services.
- Login failure does not block local play.
- Rewarded ad cancel/fail/no-inventory states do not grant accidental rewards.

## Verification Notes

- Mark Cocos Editor checks as UNVERIFIED unless Cocos Creator was actually opened.
- Mark WeChat checks as UNVERIFIED unless WeChat DevTools was actually used.
- Restart Cocos Browser Preview before judging UI screenshots after script changes.
