# Cánh đồng — chiều tối mưa giông

Art created with built-in imagegen. Sources, final prompts, runtime paths and checksums:
[manifest](../../art/dalat/field-storm/v1/manifest.json).
Runtime conversion: `node scripts/cafe/build-field-storm.mjs`.

The dusk poster sits behind a drifting sky, fixed transparent terrain, and independently
swaying left/right canopies. Rain, wind mist, ground impacts and branching lightning are
animated in the browser. Sun King remains interactive. Thunder is opt-in and follows the
flash; pausing or leaving the scene stops it. Reduced motion disables animated layers,
rain and lightning.

Validated only the changed field scene: 8 Playwright cases at 390/1440px with normal and
reduced motion, covering layer loading/movement, motion controls, rain impacts, Sun King
dialog, thunder toggle/playback, lightning, return to map and horizontal overflow.
Targeted ESLint and TypeScript checks passed.

- [Desktop](desktop.png)
- [Mobile](mobile.png)
- [Lightning](lightning.png)
