# Performance Checklist

## Package Size

- Keep production main package target under `3.5 MB` where practical.
- Hard review line: `4 MB` main package.
- Move non-critical art, reference images, large effects, and later chapters out of the main bundle.
- Do not load `assets/textures/references` at runtime.

## Asset Strategy

- Use atlases for:
  - Common UI buttons and panels.
  - Currency icons.
  - Bottom navigation icons.
  - Weapon icons.
  - Reward cards.
- Split battle art and effects into a battle bundle.
- Split future chapters into chapter bundles.
- Use nine-slice sprites for repeated panels and buttons.
- Avoid shipping full-screen reference PNGs in production bundles.

## Runtime

- Reuse nodes for damage numbers, bullets, monsters, and reward cards.
- Pool battle projectiles and floating text.
- Avoid creating/destroying UI cards during scrolling; prefer reuse.
- Keep battle update logic deterministic and lightweight.
- Release unused bundle resources when leaving heavy screens.

## UI Adaptation

- Design coordinate: `750 x 1334`.
- Respect safe areas on tall phones.
- Avoid fixed one-screen compression for the talent tree; use ScrollView.
- Use dynamic label shrink or line wrapping for long Chinese text.
- Mail detail should use drawer/modal on phone instead of permanent two-column layout.

## WeChat Device Test Matrix

Before release, test:

- Low-end Android phone.
- Mid-range Android phone.
- iPhone with notch.
- Small-height device.
- WeChat DevTools simulator.

Record:

- First load time.
- Scene switch time.
- Battle FPS.
- Memory before/after battle.
- Main package size.
- Subpackage size.

## P0 Performance Risks

- Reference images accidentally included in runtime bundle.
- Too many individual small textures loaded outside atlases.
- Damage numbers and bullets created every frame without pooling.
- Talent tree or mail list rendering all items at once without reuse.
