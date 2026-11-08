# NPC and environment proportions

All 19 conversation NPC placements use a uniform 1.5× scale. Source character
art, intrinsic proportions, poses, animation rigs, and foot anchors are preserved.
Hotspots, labels and Gray Boo's hologram follow the same placement dimensions.

Four interiors were recreated with built-in imagegen: smaller mid-distance
furniture, a lower camera and clear foreground standing lanes. Source PNGs,
runtime WebPs, final prompts and checksums are listed in the
[asset manifest](../../art/dalat/rooms/v2/manifest.json).

On mobile, navigation sits above the characters; topic bubbles stay inside the
scene. Closing chat restores focus before the next keyboard interaction.

## Visual evidence

Desktop and mobile frames for all 12 settings are saved in `1440/` and `390/`.

- [Work lounge, desktop](1440/work_lounge.webp) · [mobile](390/work_lounge.webp)
- [Design studio, desktop](1440/design_studio.webp) · [mobile](390/design_studio.webp)
- [Village market](1440/village_market.webp)
- [Project room](1440/project_room.webp)
- [Flower garden](1440/inside_cafe.webp)
- [Field and Sun King](1440/farm_fields.webp)
- [Mobile topic bubble](390/npc-topic-bubble.webp)

## Validation

13 targeted Playwright cases passed: the 18 topic NPCs at 390/1440px, Sun King
with thunder/motion controls at both sizes with normal/reduced motion, five outdoor
map destinations, four indoor destinations and return navigation, plus Gray Boo
hover, keyboard/chat focus, and touch interaction. Checks include actor bounds,
minimum visible size, topic bubble bounds, image loading, dialog topics and overflow.
Targeted ESLint, TypeScript and diff whitespace checks passed. The full application
suite was not run.
