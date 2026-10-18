# VISUAL ENGLISH — Web App Development Kit

**Version:** 1.1 (2026-10-16)  
**Working title:** Natural English — Visual-first Workplace & Daily Life  
**Languages:** Product documentation in Vietnamese; learner-facing content in American English + Vietnamese scaffolding.

## What is in this package?

| File | Who should read it? | Purpose |
|---|---|---|
| `docs/01_PRODUCT_BRIEF_AND_REQUIREMENTS.md` | Product Owner, PM, BA | Scope, learners, constraints, metrics and backlog priorities |
| `docs/02_VISUAL_STYLE_BIBLE.md` | Art director, illustrator, UI designer | Official visual direction, design tokens, character/world consistency, accessibility |
| `docs/03_UX_IA_USER_FLOWS.md` | UX, BA, frontend | Sitemap, personas, learning and review journeys, navigation and states |
| `docs/04_UI_SCREEN_SPECS.md` | UI, frontend, QA | Screen-by-screen components, desktop/mobile layouts, interactions, acceptance criteria |
| `docs/05_LEARNING_CONTENT_AND_REVIEW.md` | Learning designer, backend, AI team | 52-week curriculum mapping, exact 60-minute pipeline, spaced review, lesson authoring QA |
| `docs/06_TECHNICAL_HANDOFF.md` | Tech lead, frontend/backend | Suggested architecture, models, endpoints, speech/audio, assets, security and delivery slices |
| `docs/07_QA_ACCEPTANCE_TESTS.md` | QA/PM | Test cases, quality gates and definitions of done |
| `docs/08_VIETNAM_SPOKEN_CORE_LEXICON.md` | Content lead, linguist, AI team | **New rule:** Vietnam-first communication vocabulary, coverage computation, examples |
| `docs/09_IT_BANKING_ROLE_SCENARIOS.md` | PO, Developer, ITBA, PM, designers | Six role-specific professional tracks and practical conversation situations |
| `docs/10_CURRENT_12_MONTH_BLUEPRINT_V1_1.md` | Learning designer / all | **Current** 12-month curriculum replacing the old baseline snapshot for implementation |
| `CHANGELOG_V1_1.md` | All | Các thay đổi từ v1.0 → v1.1 |
| `prompts/01_IMAGE_PROMPT_SYSTEM.md` | Visual designer, image producer | Master prompt + reusable scene templates, negatives and image QA |
| `prompts/02_SCENE_SHOT_LIST.md` | Content team | Sample production prompts for everyday life / bank IT workplace / soft skills |
| `data/design-tokens.json` | Frontend | Portable visual tokens |
| `data/lesson01.example.json` | Frontend/backend | **Illustrative**, not production-reviewed lesson object |
| `data/vietnam-spoken-core.seed.json` | Content/CMS team | Starter candidates, **not yet corpus-verified** |
| `scripts/check_lexical_coverage.py` | Editorial QA/backend | Count authored running tokens against approved lexicon; refuse unapproved seed in production |
| `diagrams/*.mmd` | Dev/BA | Mermaid diagrams for flows and content lifecycle |
| `prototype/index.html` | All | Responsive **interactive UI concept**, open locally in a browser |
| `prototype/assets/` | All | User-provided images used as **visual references**, not finished adult-focused art |
| `docs/00_*_SOURCE.md` | All | Snapshots of previously created curriculum, English review workflow and Lesson 01 |

## Quick start

**Read `docs/10_CURRENT_12_MONTH_BLUEPRINT_V1_1.md` for the latest program rules.** Files named `00_*_SOURCE.md` are historical snapshots, so their Oxford 3000 statements are intentionally not current.

1. Open `prototype/index.html` in a modern browser. It runs without installation or external services.
2. Read `docs/01_PRODUCT_BRIEF_AND_REQUIREMENTS.md` and `docs/02_VISUAL_STYLE_BIBLE.md`.
3. Implement screens in `docs/04_UI_SCREEN_SPECS.md` following flows in `docs/03_UX_IA_USER_FLOWS.md`.
4. Use the image system in `prompts/01_IMAGE_PROMPT_SYSTEM.md`, not one-off unrelated visual styles.
5. Import token values from `data/design-tokens.json`; treat `data/lesson01.example.json` as shape guidance, not approved learning material.
6. Preserve the content review gate before publishing lessons or generating approved TTS.

## Locked requirements

- **12 months / 52 weeks; 6 sessions weekly; 60 minutes maximum per study day.** One rest day.
- **80% listening-speaking (48 minutes), 20% reading-writing (12 minutes).**
- **Separately**, 80% everyday/work English (48 minutes), 20% communication-skills content inspired by Dale Carnegie (12 minutes).
- **≥90% of eligible running English word tokens** in authored lesson dialogue from a **reviewed Vietnam Everyday & IT Banking Spoken Core**: words used to communicate naturally in Vietnam-based daily life, with coworkers and in IT banking. Oxford 3000 is a **secondary reference**, not the binding vocabulary list. Domain jargon is allowed when communicatively necessary, with documented checks. This is an editorial coverage rule, not a learner comprehension statistic; the starter lexicon is **not yet validated**.
- Goal: **CEFR B1-oriented** and **≥80% correct** on independent, unseen, level-controlled familiar-conversation listening tasks; not a B1 certification or unconditional result promise.
- Audience: **Vietnamese working adults**; everyday life, coworker small talk, **banking technology teams (UX, UI, ITBA, PM, Developer, PO/Product Owner; also QA and stakeholders)**.
- Learning images should occupy **~65–75% of the active illustration card** where the teaching intention is visual; not 70% of every screen.
- American English; Vietnamese assistance on demand; audio-first listening, spontaneous speaking, review and assessment.

## Source-of-truth and assumptions

**Historical source references (not current policy):** `docs/00_LEARNING_BLUEPRINT_SOURCE.md` (52 weeks, 60-minute breakdown); `docs/00_CONTENT_REVIEW_WORKFLOW_SOURCE.md` (Cambridge → COCA → YouGlish → approve → TTS); `docs/00_LESSON_01_SOURCE.md`; the attached illustration samples.  
**New design proposals:** personas, UX information architecture, component specs, prompt library, data contracts, progress scoring, technical options and test cases. These are engineering recommendations, not claims the user supplied or the science established a single optimal implementation.

**Important:** The included Vietnam Spoken Core is an editorial **seed**, not an empirically validated list of the most frequent words in Vietnam. Expand and validate with reviewed real-life anonymized samples and spoken usage checks. Production publishing must fail closed until the reference lexicon and editorial QA pass. No copyrighted book text should be transcribed wholesale; use original dialogue illustrating communication principles instead.

## Change log v1.1

- Replaced Oxford-3000-based 90% quota with a **Vietnam-context spoken-English core** (everyday life + office small talk + IT banking); Oxford 3000 remains optional for cross-checking.
- Promoted **Developer** and **PO (Product Owner)** to first-class role paths alongside ITBA, UX, UI and PM.
- Added role scenario matrix, seed lexicon and candidate coverage checker. Original `docs/00_*_SOURCE.md` snapshots remain unchanged for provenance.

## Suggested implementation sequence

- **Sprint 0:** content model, design tokens, character bible, asset pipeline and baseline assessment plan.
- **MVP 1:** visual home + lesson + audio/captions + flashcard + review queue, manual editorial content.
- **MVP 2:** speaking practice, recordings with explicit consent, roleplay branching, feedback, progress and accessibility audit.
- **MVP 3:** AI-generated roleplay with guardrails, adaptive difficulty, independent B1-oriented assessments, content operations.

## Licensing and privacy

The images inside `prototype/assets/` were supplied for this project and are included solely as local design references. Confirm rights to reproduce and deploy them publicly. Do not package font binaries, identifiable customer financial data, company-internal dashboards, production bank screenshots or real account information. The prototype does not access any microphone, create an account or send data to a server.
