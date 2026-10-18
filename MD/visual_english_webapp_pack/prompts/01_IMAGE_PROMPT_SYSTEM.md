# IMAGE GENERATION SYSTEM — FRIENDLY PROFESSIONAL VISUAL ENGLISH

**Style lock:** `FRIENDLY_PROFESSIONAL_VISUAL_ENGLISH_V1`  
**Purpose:** reproducible illustrations for lesson covers, action flashcards, adult workplace dialogues, listening tests, soft-skills and review.  
**Use:** copy the appropriate template and replace `{{...}}` with the scene brief; always include matching character references and approved image(s) for style consistency.

## 1. Grounding and boundaries

Reference image: user-supplied bright-blue-and-yellow English Flashcards illustration. Preserve cheerful, polished 2D narrative charm but **not** the preschool ABC aesthetic. In working adult scenes use Vietnamese/Asian adult characters, realistic contemporary smart-casual outfits, true-to-life IT banking workflows. Do not reproduce logos, customer data or production screens. Generated art remains an illustration — teachable sentence and Vietnamese/IPA caption are separately typeset in the web UI.

This prompt system does NOT itself create reference-consistent characters. Before bulk production generate and approve a character master set: head front/three-quarter; full body front/side; 4 expressions; 2 typical poses; outfit/prop sheet for each main role. Keep these reference IDs in metadata for later prompts.

## 2. MASTER STYLE PREFIX (English — paste into all generation prompts)

```text
High-quality modern 2D digital storybook illustration for a visual-first American English learning web app for Vietnamese working adults (ages roughly 25–45). Friendly professional, bright and optimistic, expressive natural adult characters with believable adult anatomy and smart-casual contemporary clothes. Confident clean slightly rounded navy-brown outlines, polished soft hand-painted shading, pleasing depth, warm daylight and subtle ambient bounce light. Coordinated bright blue, warm yellow, sky blue, warm white and restrained teal accents. Rich but clean storytelling environments appropriate to contemporary Vietnamese everyday life or a modern banking technology office. One unmistakable focal action, clear relationships among characters, readable silhouettes, sophisticated composition, welcoming but not childish. Exact same character identity, face, hairstyle, outfit and visual rendering style as approved character reference images. No required words or typography inside the illustration; all educational text is overlaid later by the web app.
```

## 3. MASTER NEGATIVE / RESTRICTION LIST

```text
No chibi, baby-like facial proportions, preschool textbook, kindergarten classroom, ABC letters, childish mascot styling, exaggerated anime eyes, photorealism, 3D plastic render, generic flat stock vector, excessive emojis, noisy decorative stickers, chaotic lighting, overly saturated neon. No visible real bank logos, real account numbers, real client profiles, personal addresses, credentials, production dashboard data, authentic company ID badges, watermarks, illegible generated text, fake UI labels or random words. No disfigured hands, extra fingers, inconsistent faces, duplicated props, unnatural eye contact or implausible gestures. No word cards or speech bubbles with legible text baked into image. Do not depict a child as the app's main adult professional learner. Do not crop any object essential for understanding the target action.
```

## 4. Scene prompt schema

Fill and store for every art request:

```yaml
scene_id: ne_w18_d03_ux_review
style_id: FRIENDLY_PROFESSIONAL_VISUAL_ENGLISH_V1
asset_type: dialogue_scene  # cover | flashcard | dialogue_scene | choice_scene | character_sheet | avatar | badge
week: 18
day: 3
audience: working_adult
communicative_intent: politely ask a colleague to review a user flow
characters: [char_minh, char_lan]
environment: env_ux
camera: medium-wide eye-level, 3/4 view
focal_action: Lan points to a tablet with an abstract wireframe as Minh listens
expression: collegial, engaged, calm
props: tablet, laptop with abstract boxes, neutral coffee mug
lighting: clear window daylight
composition: subject in middle 70%, lower quarter available for app controls
ratio: '16:9'
mobile_variant: '4:5'
no_baked_text: true
alt_vi: Hai đồng nghiệp trưởng thành trao đổi một bản phác thảo giao diện trên máy tính bảng.
alt_en: Two adult coworkers discuss a generic interface sketch on a tablet.
answer_leak_check: pass
approved_character_refs: [char_minh_v1, char_lan_v1]
rights_status: pending
```

## 5. MASTER STRUCTURED PROMPT TEMPLATE

```text
{{MASTER_STYLE_PREFIX}}

SCENE SUBJECT: {{who}}, {{where}}, {{what happens}}.
LEARNING INTENT (for scene composition only, do not render sentence text): {{meaning_or_phrase}}.
CHARACTERS: {{character_ids, exact reference appearance, clothing and continuity requirements}}.
ADULT CONTEXT: {{realistic everyday or IT Bank workplace task (ITBA, UX, UI, PM, Developer or PO/Product Owner)}}.
VISUAL EVIDENCE: {{necessary props / action / time of day / emotional cues}}.
CAMERA: {{shot size, height, view angle, subject position, focal depth}}.
LIGHT / COLOR: {{morning/daylight/office glow; style palette}}.
COMPOSITION: {{aspect ratio and crop safety}}. Keep an unobstructed quiet zone where user interface controls can sit outside or adjacent to the art.
CONTINUITY: {{prior_scene_id or master characters}}.
TEXT RESTRICTION: No essential readable writing, captions, sentence, IPA, Vietnamese, company logos or numbers inside the artwork.

{{MASTER_NEGATIVE_LIST}}
```

## 6. Templates by asset

### 6A. Lesson cover, landscape 16:9

```text
{{MASTER_STYLE_PREFIX}}
A cinematic but welcoming 16:9 cover for adult English lesson '{{LESSON_TOPIC}}'. Show {{MAIN_ADULT_CHARACTER}} in {{TOPIC_PLACE}} with {{ONE_MAIN_ACTION}} and 2–3 subtle contextual vignettes or props that imply related learning tasks: {{PROP_1}}, {{PROP_2}}, {{PROP_3}}. Polished art direction, warm adult-friendly energy, expressive faces, lively blue/yellow accent system, generous upper/lower safe margin for separate DOM title overlay. Not a preschool poster and no large generated words or floating spelling flashcards.
{{MASTER_NEGATIVE_LIST}}
```

### 6B. Action flashcard, portrait 4:5

```text
{{MASTER_STYLE_PREFIX}}
A single portrait 4:5 illustration teaching this meaning VISUALLY: {{MEANING}}. {{CHARACTER}} performs {{ACTION}} at {{LOCATION}}. Clearly show {{KEY_OBJECT_OR_PERSON}} and exact intended action; waist-up or full-body based on clarity. Expressive natural face and uncluttered background, crisp focal point. Compose for image to occupy the upper 70% of a flashcard with separate HTML sentence and controls beneath it; no text rendered in artwork. Adult learner context.
{{MASTER_NEGATIVE_LIST}}
```

### 6C. Dialogue scene, 16:9 plus 4:5 remake

```text
{{MASTER_STYLE_PREFIX}}
Two adult professional characters {{CHARACTER_A}} and {{CHARACTER_B}} in {{WORKPLACE_OR_SOCIAL_SETTING}}. {{WHO_SPEAKS}} is {{GESTURE}}, {{WHO_LISTENS}} responds with {{BODY_LANGUAGE}}. Show {{FICTITIOUS_CONTEXT_PROP}} as a meaningful conversation object. Professional but warm scene, eye-level medium-wide, shared gaze, clear turn-taking cues without speech bubbles containing text. No company/bank branding or authentic customer details. {{RATIO}} with safe crop regions for mobile.
{{MASTER_NEGATIVE_LIST}}
```

### 6D. Listening assessment neutral art

```text
{{MASTER_STYLE_PREFIX}}
Context-only illustration for an unseen listening quiz in {{LOCATION}} with {{CHARACTERS}} and ordinary surroundings. Do NOT visibly disclose the answer to the audio's main question, time, choice, or request. No answer-bearing clock, sign, receipt, visible text or specific visual evidence that would let the learner guess without listening. Neutral but engaging adult scene in {{RATIO}}.
{{MASTER_NEGATIVE_LIST}}
```

### 6E. Carnegie-inspired interpersonal scene

```text
{{MASTER_STYLE_PREFIX}}
Original adult-to-adult interpersonal learning moment: {{PRINCIPLE}} in situation {{SCENARIO}}. Show {{PERSON_A}} listening attentively and {{PERSON_B}} expressing {{EMOTION}}; balanced, authentic body language, no theatrical caricature. Modern workplace or everyday-life setting, 16:9. No quotations from any published book, no book cover or author portrait, no caption/text in image.
{{MASTER_NEGATIVE_LIST}}
```

### 6F. Character turnaround sheet

```text
{{MASTER_STYLE_PREFIX}}
Clean full-body character design reference for {{CHARACTER_ID}} {{CHARACTER_ROLE}}, same identity in front, 3/4 and side views, one neutral expression and two natural expressions, same smart-casual outfit, neutral bright studio background, consistent anatomy and proportions. Use separate call per view or frame if image generation quality requires. No labels/text inside generated image; reference IDs supplied as metadata.
{{MASTER_NEGATIVE_LIST}}
```

## 6G. Developer and PO workplace scenarios

```text
{{MASTER_STYLE_PREFIX}}
Professional adult IT banking team in Vietnam. Role: {{ROLE}} (Developer / PO). Communicative intent: {{REVIEW_A_BUG / DISCUSS_API / CLARIFY_USER_STORY / PRIORITIZE_BACKLOG}}. {{CHARACTER_ID}} interacts with {{PARTNER_ID}} at {{env_dev / env_product}}. Generic fictional laptop panels with abstract shapes and no readable code, account data, backlog item names, passwords or real logos. Natural collaboration, bright office daylight, 16:9 for dialogue and 4:5 for focused flashcard scenes. Use separately rendered web UI subtitles, not text printed into art. Match approved character references exactly.
{{MASTER_NEGATIVE_LIST}}
```

## 7. Example: adult ITBA requirements review — ready to use

```text
High-quality modern 2D digital storybook illustration for a Vietnamese working-adult English learning app. Friendly professional cartoon style derived from bright illustrated English learning flashcards, but updated for adults: bright elegant blue and yellow palette, clean navy outlines, soft sophisticated shading, realistic adult proportions and natural expressions. A Vietnamese male IT business analyst in his 30s, short neat black hair, pale-blue shirt and dark trousers, discusses a generic digital-banking mobile app user flow with a Vietnamese female UX designer in her 30s, shoulder-length dark hair and cream cardigan. They are in an airy modern bank technology office, looking at a tablet screen with simple abstract gray and blue wireframe rectangles (no actual readable UI). The designer points to the flow while the analyst listens carefully, friendly respectful coworker interaction. Medium-wide eye-level three-quarter composition, warm daylight, uncluttered professional office plants and notebook, useful negative space at image edges, landscape 16:9, character continuity, crisp clear focal story. No captions, no readable English or Vietnamese text, no bubbles, no bank logos, no account numbers, no confidential dashboards, no chibi or preschool styling, no photorealism, no 3D, no deformed hands.
```

## 8. Example: adult daily routine — ready to use

```text
High-quality modern 2D storybook illustration, visually continuous with cheerful blue/yellow illustrated English flashcards but sophisticated for adult learners. A Vietnamese father in his mid-30s with neat black hair and soft-blue T-shirt is waking up at dawn in a tidy apartment bedroom and getting out of bed; bright early morning sunlight through the window, bedside clock visibly showing 5:40 if and only if this is a teaching scene and not an unseen listening assessment. Believable adult anatomy, warm home atmosphere, clear focal action, expressive but mature face, painterly shading, crisp navy contours, portrait 4:5 upper 70% composition; space for separately rendered web-app caption below. No words, watermark, preschool icon clutter, character inconsistency or photorealism.
```

## 9. Production variants & exact output requests

For every teaching scene produce:
- `16:9` desktop landscape when needed; `4:5` mobile illustrated panel; `1:1` thumbnail crop if safe.
- one principal identity-consistent render; never ask AI to recreate the same specific face without reference.
- no English or Vietnamese baked into image.
- ALT text, main focal point coordinates, object list, character ID, style version and rights status.
- visual QA checklist from `docs/02_VISUAL_STYLE_BIBLE.md`.

**Do not generate endlessly until passing.** Review draft contact sheets first and reject bad anatomy/composition before producing full lesson batch.

## 10. Prompt QA and failure correction

| Failure | Revision instruction |
|---|---|
| Looks like a children's app | Increase adult proportions, neutral mature expressions, smart-casual office context; remove ABC/cards/confetti |
| Inconsistent faces | Lock reference face images/identity and costume identifiers |
| Unreadable UI in office scene | Use abstract mock rectangles, remove text entirely; render actual UI later in HTML overlay |
| Scene leaks answer | Remove visible time/sign/object that supplies scored listening detail |
| Too visually dense | One focal action, fewer background people, clean prop inventory |
| Misleading action | Specify exact actor, verb, recipient, object placement, camera visibility |
| Broken hands/phones/laptops | Simplify gesture, change view, rerender prop under tighter description |
| Mobile crop hides scene | Generate independent portrait re-composition, not only crop |

## 11. Asset registration checklist

`scene_id, style_id, character_reference_ids, environment_id, source_prompt, negative_prompt, generation_settings, original_file, approved_file, crop_variants, illustrator_reviewer, teaching_meaning, reading_risk, alt, ownership/right, created_at, revision`.
