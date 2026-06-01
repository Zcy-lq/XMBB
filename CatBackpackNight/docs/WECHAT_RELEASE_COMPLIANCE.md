# WeChat Release Compliance

This document defines the minimum commercial release checks for PlatformAgent and BuildAgent.

## Configuration

- `appid` must come from `assets/configs/platform.json` or a build-time private setting. Do not hard-code it in TypeScript.
- Rewarded video ad unit IDs, interstitial IDs, and banner IDs must be config-driven.
- `reviewMode` must disable risky live monetization, remote experiments, and unreviewed content paths during audit.

## Privacy And User Consent

- Show privacy policy and user agreement entry points before collecting personal information.
- Request user authorization only at the feature moment that needs it.
- Provide a documented user data deletion path or customer support route.
- Keep age rating, `16+ CADPA`, and health game reminders visible in the required entry points.

## Ads

- Rewarded video must handle success, cancel, load failure, show failure, and no-inventory states.
- Interstitial ads need frequency caps and scene restrictions.
- Banner ads must account for safe area and narrow-screen layout.
- Rewards must never imply a reward was granted when the ad failed or was cancelled.

## Sharing

- Share success, cancellation, and failure must all resolve safely.
- Share rewards, if enabled later, need anti-repeat and review-mode controls.

## Ranking And Cloud Data

- Open data domain limitations must be documented before leaderboard work is accepted.
- Cloud save failures must fall back to local save without blocking play.
- Network loss must queue or gracefully skip optional platform calls.

## Remote Assets And Cache

- Remote bundles require explicit version fields.
- CDN cache invalidation must be tied to `remoteBundleVersion`.
- Runtime must not load development reference images, QA screenshots, or temporary candidates.

## WeChat DevTools

- Import the Cocos build output into WeChat DevTools.
- Verify launch, login fallback, privacy entry points, ad mock/fallback, and one battle loop.
- Do not mark WeChat verification as passed unless WeChat DevTools was actually used.

## Pre-submission Checklist

- P0 issues are zero.
- P1 issues have owner Agent and fix plan.
- `docs/QA_BLOCKERS.md` is current.
- `docs/RELEASE_CHECKLIST.md` is current.
- `npm run workflow:check` exits with code `0`.
