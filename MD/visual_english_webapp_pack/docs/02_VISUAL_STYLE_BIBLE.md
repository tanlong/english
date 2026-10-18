# 02 — VISUAL STYLE BIBLE

**Official style ID:** `FRIENDLY_PROFESSIONAL_VISUAL_ENGLISH_V1`  
**Display name:** Friendly Professional Visual English  
**Reference:** user-supplied colorful 'English Flashcards' illustration (`prototype/assets/style-reference.png`) plus four existing Morning Routine flashcards (see source images outside package).  
**Audience:** Vietnamese working adults in IT banking (ITBA, UX, UI, PM, Developer, PO/Product Owner) and general daily life.

## 1. Visual thesis

Retain from the user's supplied illustration: polished colorful 2D cartoon painting, bright blue sky, friendly expressive characters, crisp outlines, a lively but understandable scene, sunny accent colors and clear flashcard framing. **Age up** the audience: anatomically adult faces and body proportions, contemporary smart-casual outfits, banks/IT workspaces, quiet professional details, modest and intentional sticker decoration. Never replicate the exact cover composition on every card.

**Three words:** Warm / Clear / Professional.

### Do / don't

| DO | DON'T |
|---|---|
| Attractive adult character acting in a specific realistic situation | Schoolbook ABC imagery in workplace lessons |
| One dominant learning action visible in a scene | Ten floating vocabulary cards in a small dialogue panel |
| Consistent soft painterly 2D lighting and navy outline | Flat generic stock-vector next to anime and photorealistic images |
| Clean composition with focal area and space for UI text | Generated paragraphs/UI text baked into the illustration |
| Vietnam-appropriate daily scenes and modern office life | Unfounded real bank branding, identifying client data, live production dashboards |
| Diverse adult characters and courteous body language | Cutesy infant proportions or exaggerated infant voices |
| Rich but controlled blue/yellow palette | Neon gradients, harsh color clashes, decorative confetti everywhere |

## 2. Canonical style fingerprint

- **Medium:** high-finish 2D digital illustration, character-driven storyboard/cartoon with soft shading (not photograph, 3D clay, photorealism, chibi, preschool clipart).
- **Linework:** expressive, clean, confident navy-brown outer contours, medium width relative to canvas; sparing interior linework.
- **Lighting:** daylight or warm indoor practical light, rounded soft shadows, subtle bounce, gentle depth separation.
- **Composition:** readable at mobile scale, 1 clear foreground action, supporting environment that signals situation, no busy typography.
- **Expressions:** empathetic, authentic gestures and meaningful eye contact; no exaggerated childish clowning.
- **Characters:** adults around 25–45 years, plausible anatomy (~6.5–7.5 heads tall), diverse faces, Vietnamese/Southeast Asian everyday appearance; recurring outfits aligned to role.
- **Environment:** contemporary Vietnamese city, coffee shop, scooter parking, apartment, school gate only when family context justifies it, office lobby, bank IT innovation office, sprint board, meeting room, UX workstation, cafe with coworkers.
- **Brand-neutral:** do not fabricate corporate logos/crests/IDs; generic screens with abstract widgets instead of specific confidential dashboards.

## 3. Color system

| Role | Color | Hex | Use |
|---|---|---|---|
| Primary blue | Bright blue | `#1976E8` | Header, main CTA, active learning path |
| Deep navy | Dark ink | `#102044` | Body text and outlines |
| Accent yellow | Warm yellow | `#FFC83D` | Highlights, progress stars, motivation (sparingly) |
| Sky blue | Light blue | `#EAF6FF` | Background panels / illustration sky |
| Paper | Warm white | `#FFFDF9` | Cards and lesson text backgrounds |
| Teal | Calm green-blue | `#168E88` | Correct, completed, listening-speaking meter |
| Coral | Soft orange-red | `#F07865` | Attention / warm secondary accent |
| Violet | Soft purple | `#8B6CB8` | Carnegie communication-scene tag |
| Neutral border | Pale gray-blue | `#D7E5F2` | Cards / separators |
| Muted text | Steel-blue | `#596A85` | Secondary labels and hints |

**Accessibility:** body text contrast ≥4.5:1, large text ≥3:1 where WCAG allows; important controls must not rely on color alone. Check contrast with final adjacent background. Yellow is an accent, not default light-background body text.

## 4. Typography (web UI)

- Headings: friendly geometric sans (system sans fallback first; optionally an appropriately licensed rounded sans). Avoid playful kindergarten bubble fonts in app body.
- Reading body: high-legibility sans; sizes mobile 16–18 px, lesson sentence 22–28 px when space permits; Vietnamese diacritics tested.
- Font scale example: display 40/48; H1 32/40; H2 24/32; body 16/24; helper 13/20.
- **English learning sentences are DOM text overlaid outside the artwork** so they remain selectable, readable, translated, accessible and correctable. The image generator should not render spelled sentences, IPA or signs containing essential content.

## 5. Iconography and decoration

Rounded line icons with consistent stroke width; `play`, `replay`, `microphone`, `captions`, `check`, `clock`, `message`, `image`, `bookmark`, `help`. Decorative sparkles/asterisks may appear on covers, not every task. 1–3 supportive icons per flashcard at most. All interactive actions use semantic labels.

## 6. Layout families and image ratio

| Asset | Recommended ratio | Required safe zones | Default image usage |
|---|---|---|---|
| Lesson cover | 16:9 and 4:5 crop | 10% edge safe; reserve title outside image or one quiet corner | Strong illustration with clear story |
| Single action flashcard | 4:5 original, adaptable to 1:1 | central subject within 70% width | Art fills ~65–75% of learning card |
| Two-person dialogue | 16:9 desktop, 4:5 mobile variant | keep both characters away from cut edges | Wide story scene above control panel |
| Task decision scene | 4:3 or 16:9 | negative space for separate UI options | Situational signal without answer text |
| Character reference | 3:4 or 2:3 | full body, white/neutral background | Pose guide and identity consistency |
| Avatar | 1:1 | generous headroom | Profile and speaker chip |
| Progress illustration | 1:1 or 3:2 | isolated action | Small supportive accent; low clutter |

**Small-screen implementation:** `object-fit: cover` with editorial focal-point metadata. Do not crop off hands, objects defining the action, interlocutors or clocks conveying target times. Prefer separate mobile compositions if crop fails.

## 7. Character bible v1 (fictional, not portraits of real colleagues)

| ID | Role | Appearance/continuity | Core scenes |
|---|---|---|---|
| `char_minh` | Vietnamese adult learner; ITBA/BA track | Man 30s, neat black side-parted hair, soft-blue oxford shirt, navy chinos, friendly expression | Commuting, team stand-up, requirement review |
| `char_lan` | UX/UI designer | Woman late 20s/30s, dark shoulder-length hair, smart-casual light cardigan, tablet/stylus | Wireframe review, usability feedback |
| `char_anna` | PM colleague | Woman 30s, tidy medium-length hair, relaxed blazer, neutral blouse | Planning, meeting, deadlines, status updates |
| `char_david` | English-speaking colleague/stakeholder | Man 30s/40s, approachable, simple workwear, diverse appearance | Cross-team calls, clarifications, small talk |
| `char_quan` | Developer colleague | Man 20s/30s, short dark hair, office casual shirt, laptop | Coding discussions, API implementation, bugs, release coordination |
| `char_thao` | Product Owner (PO) colleague | Woman early 30s, tied-back dark hair, cream blouse and navy blazer | Product priorities, backlog refinement, user stories, feature trade-offs |
| `char_huy` | QA/tester colleague | Man late 20s/30s, short tidy hair, green office-casual top | Test cases, UAT, reproduction steps |
| `char_family` | Family members in daily-life modules | Age-appropriate, consistent with lesson story | Home, school drop-off, after-work plans |

Characters are placeholders for the official roster; approve one master reference sheet per person **before** generating scenes. Maintain character IDs, outfit palette, face references and model reference images per request. The child appears **only** in appropriate family/school stories, not as the target learner.

## 8. Environment bible

- `env_home_morning`: bright Vietnamese apartment, blue pillow/linen, small clock, natural sunrise.
- `env_commute`: recognizable Vietnamese street proportions, legal safe travel visuals, scooters, morning café.
- `env_office_open`: contemporary bank IT office, large windows, quiet plants, mock UI monitors, neutral corporate palette.
- `env_meeting`: simple room, table, abstract diagram screen, no legible confidential text.
- `env_ux`: designer screen with generic colored wireframe blocks, sticky notes, tablet; **no fake brand**.
- `env_coffee`: realistic local café/lunch setting, friendly adult colleagues.
- `env_service`: generic bank digital-service design context; no customer account information.
- `env_dev`: open-office developer desk, abstract code shapes, test device, no real terminals or production endpoints.
- `env_product`: product backlog planning wall, unlabeled colored cards, roadmap shapes, PO and team aligning priorities.

## 9. Content-image coupling

1. Art must depict the *intended meaning*, not an unrelated mascot.
2. An image may support comprehension but must not reveal a scored listening answer. For tests use neutral/contextual image or no image where appropriate.
3. **Do not put essential words into artwork.** Overlay title/captions using HTML/DOM.
4. Supply alt text describing only visual content, not the solution.
5. For action verbs show **who does what to whom/where**, not an abstract icon alone.
6. User can choose larger text/captions without shrinking the interactive target below accessible size.

## 10. QC scorecard for generated illustrations

Score 0–2 per item (0 fail / 1 needs edit / 2 pass), ship at ≥16/20 **and zero critical fails**:
- Relevance to sentence/task
- Correct adult demographic and professional context
- Character identity continuity
- Accurate hands/props/visible screen layout
- Clean focal hierarchy
- Appropriate amount of scene detail
- Color/line/shading consistency
- No baked-in essential text
- Responsive crop safe and no accidental answer leakage
- No sensitive logos/data or harmful stereotype

Critical fails: sensitive data/logo, wrong sentence meaning, childlike workplace learner, impossible prop/gesture, important text baked in illegibly, or character identity drift.

## 11. Asset workflow

`storyboard brief → character/environment refs → generate illustration WITHOUT text → editorial QC → 16:9/4:5 variants → image optimization → alt text/crop metadata → content linking → responsive QA → publish`

Naming: `course_week_day_scene_asset-vNN_ratio_locale.webp` (e.g., `ne_w18_d03_ux-review_illu-v02_16x9.webp`). Locale need not be in basename if image has no lettering; prefer language-neutral scenes. Original artwork and licensing ledger must be stored separately.

## 12. Acceptance examples

**PASS:** Minh and Lan at a workstation, Lan pointing toward a wireframe, Minh listening, adult anatomy, daylight office, empty UI frame for overlaid sentence, abstract mock screen.  
**FAIL:** Two cartoon schoolchildren, 'UX DESIGN' printed on a monitor in a distorted font, distracting ABC letters and celebratory confetti over a production bank dashboard.
