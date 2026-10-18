# 01 — PRODUCT BRIEF / PRD

**Project:** Natural English — Visual-first Workplace & Daily Life  
**Status:** development specification v1.1; final copy/UI subject to user testing.

## 1. Vision

A Vietnamese-first learning companion that helps a busy working adult learn *usable American English* in 60 focused minutes a day. Images supply a situation; authentic-like speech supplies a listening challenge; interaction supplies a reason to respond. Everyday-life stories and IT banking workplace scenarios share one cast and one progressive language syllabus.

Not a school-oriented vocabulary game, not a reading-first grammar workbook, and not an app that mistakes memorized text for real conversation.

## 2. Users, context and jobs-to-be-done

### Primary persona: working IT banking professional
- Adult, working full time in Vietnam; overlapping responsibilities at home and at work.
- Role variants: **IT Business Analyst (ITBA)**, **UX designer**, **UI designer**, **Project Manager (PM)**, **Developer**, **Product Owner (PO)**, with QA and business stakeholders as frequent conversation partners.
- Needs: daily coworker small talk; explain tasks; ask follow-up questions; clarify requirements; talk about wireframes and user flows; discuss APIs, bugs, releases, backlogs and user stories; report blockers; review timelines and user acceptance testing; politely negotiate priorities.
- Constraints: ≤60 minutes on study days, mobile and desktop use, may have prior English knowledge but low listening confidence, may be in shared/noisy spaces.

### Secondary persona: general working adult
- Needs: family, commute, food, restaurants, shopping, appointments, travel, health and polite interpersonal exchanges.

### Job stories
1. When a colleague asks a fast question, I want to understand the meaning and answer or clarify without translating every word.
2. When presenting a user flow, I want simple language to explain it, ask questions and respond to disagreement.
3. When I only have one hour, I want the app to prioritize items I forget and stop at 60 minutes.
4. When listening to a new speaker, I want to distinguish words I know from how they actually sound.

## 3. Locked requirements and traceability

| ID | Requirement | Priority | Acceptance example |
|---|---|---|---|
| P-01 | 12 months / 52 weeks | MUST | 52 weekly modules present, ordered, with checkpoints |
| P-02 | 6 sessions/week, 60 min ceiling | MUST | Session cannot schedule >3,600 seconds; rest day non-mandatory |
| P-03 | 48 min L/S + 12 min R/W | MUST | Daily activity ledger totals exactly 48/12 min |
| P-04 | 48 min Everyday+Work + 12 min Carnegie-inspired content | MUST | Content ledger totals 48/12 min independently |
| P-05 | ≥90% of authored eligible running word tokens from reviewed Vietnam Everyday & IT Banking Spoken Core | MUST | Content checker uses approved locale-specific lexicon, tracks exceptions, fails closed while reference is seed-only |
| P-06 | B1-oriented + 80% unseen familiar listening task KPI | MUST | Evaluated with an unpublished test set, not a rehearsed lesson |
| P-07 | Predominantly visual lesson screens | MUST | Teaching card illustrated region ~65–75%; not at cost of legibility |
| P-08 | Friendly professional style based on uploaded sample | MUST | Consistent adult character world; no grade-school imagery in professional scenes |
| P-09 | Workplace IT Bank + general daily life + small talk, for ITBA/UX/UI/PM/Developer/PO | MUST | Six first-class role-specific scenarios available, from relevant work modules |
| P-10 | American English, Basic→Better→Natural | MUST | All final utterances pass source-based editorial QA |
| P-11 | Audio-first; subtitles/IPA/Vietnamese on demand | MUST | Listening challenge begins without answer text |
| P-12 | Spaced, error-aware daily review | MUST | Due queue and failure type drive next practice |
| P-13 | Accessible desktop/mobile | MUST | Keyboard access, captions, contrast, responsive layouts |
| P-14 | AI roleplay with bounded, role-relevant context | SHOULD | Feedback never claims word accuracy from a silent input |
| P-15 | Offline cache for approved lessons | COULD | User may open downloaded content without network |

## 4. Language and content policy

- **What 90% means (revised):** numerator = eligible **running English tokens** covered by the versioned, human-reviewed **Vietnam Everyday & IT Banking Spoken Core** (including approved inflections/domain expressions where independently justified); denominator = all eligible running tokens of final authored lesson utterances. Exclude only documented metadata, numerals and proper names. Count tokens, not distinct vocabulary items. A draft/core seed does **not** prove frequency or eligibility; publish check must remain blocked until linguistic validation. Record out-of-core terms and why natural meaning requires them. External authentic audio and AI live dialogue use difficulty tags, not fake 90% certification. Details: `08_VIETNAM_SPOKEN_CORE_LEXICON.md`.
- **Oxford 3000 is supplemental**, not the mandatory source and not 3,000 memorization targets. Prioritize actual reusable spoken words and chunks in Vietnam (family, commute, coworkers, café, office, IT banking); never favor an artificial quota over grammatical, natural speech.
- **Role jargon:** explain with plain English before specialized term. Example: 'We need to check the screen flow' → 'Let's review the user flow'.
- **Tone:** adult-to-adult, respectful, contemporary American English; avoid textbook formality and patronizing speech.
- **Book use:** roughly 20% time for **original** Carnegie-inspired scenarios (interest, listening, appreciation, respectful disagreement, constructive feedback). Do not reproduce large copyrighted passages.
- **Financial safety:** use fictional client/product identities and sandbox/mock screens only. No real bank account details or confidential production system information in generated practice content.

## 5. Outcomes and evaluation

**Primary learning goal:** learner scores ≥80% correct on unseen, familiar-topic listening comprehension (e.g., at least 16/20 items across several voices and dialogues), without captions, on independently held-out test sets. Repeat on a second equivalent set to reduce luck. **Separate** CEFR-aligned listening, spoken interaction, reading and writing rubrics to establish B1-oriented performance. No certificate without independent certification process.

**Leading indicators:** weekly attended sessions, correct novel-audio responses, proportion of oral responses not based on transcript, due-item success, number of different speaker voices understood, task completion in roleplay, month-1/3/6/9/12 retention. Do not optimize only streaks or minutes watched.

## 6. Course topology

- 52 weekly modules as described in `00_LEARNING_BLUEPRINT_SOURCE.md`.
- Six daily lessons: Discover, Understand, Speak, Apply, Natural Listening, Challenge & Review.
- Each day exactly eight activity blocks as in `05_LEARNING_CONTENT_AND_REVIEW.md`; changing depth is allowed, changing total minutes or allocations is not.
- Role-specific tracks use shared language foundation; role preferences influence *examples* and *randomized tasks*, not the core CEFR progression.

### Example role overlay by core week

| Week | Shared theme | ITBA | UX / UI | PM | Developer | PO |
|---|---|---|---|---|---|---|
| 18 My Job | Describe role | Clarify business requirements | Review user flows / design | Explain project plan | Explain implementation role | Explain product goals |
| 19 Teamwork | Request help | Confirm acceptance criteria | Ask for design feedback | Align responsibilities | Ask about API dependency | Clarify priority with team |
| 20 Task Updates | Status update | Requirement status | Mockup / component status | Timeline and blocker | Fix progress / testing | Backlog priority update |
| 22 Meetings | Team discussion | Ask about business rule | Present screen / UX option | Summarize decisions | Explain technical tradeoff simply | Align scope and user value |
| 23 Explain Technology | Plain-English explanation | Walk through user flow | Explain design decision | Describe dependencies | Explain bug / API simply | Explain feature purpose |
| 24 Problem Solving | Resolve an issue | UAT feedback | Usability problem | Change request | Debug and release issue | Reprioritize user story |
| 49 Workplace Integration | Cross-functional exchange | Stakeholder walkthrough | Design handoff | Delivery planning | Implementation handoff | Product review and release choice |

For real-life bilingual sample utterances and a role-by-role intent matrix, see `09_IT_BANKING_ROLE_SCENARIOS.md`.

## 7. Functional scope

**Core:** onboarding + baseline; visual 52-week map; lesson player with image/audio/subtitles toggle; oral practice + opt-in microphone; flashcard; due review; role-specific scenarios; communication skill mini-scenes; dashboard; accessible settings; educator/content admin publication gates.

**Outside MVP:** full video courses, teacher marketplace, social feed, public leaderboards, live bank system integrations, automatic CEFR certification, fully automated visual asset approval.

## 8. Nonfunctional constraints

- **Performance:** image optimized/responsive formats, preload current and next asset, avoid layout shift, lesson interactions responsive offline when possible.
- **Privacy:** consent before recording/transcribing; data minimization, short retention defaults, clear delete/export. Never use real bank/customer documents as roleplay context by default.
- **Security:** server-side authorization, abuse/rate limits for AI APIs, secrets never in browser, CSP, input validation, audit trail for editorial edits.
- **Accessibility:** WCAG 2.2 AA target for real UI; image alt text and usable keyboard controls; reduced motion; captions/translation when requested.

## 9. Release milestones

- **R0 Spec approved:** style, UX, schema, 1 gold-standard lesson + 1 office scenario approved.
- **R1 Read/Listen MVP:** onboarding, path, images, playback, controlled transcript reveal, review card, saved progress.
- **R2 Talk & Reflect:** manual speech roleplay and feedback, branch trees, microphone opt-in and no-mic fallback, due scheduling.
- **R3 Adaptive:** skill-specific reviews, voices, role tracks, independent assessments and educator workflow.

## 10. Risks and mitigations

| Risk | Mitigation |
|---|---|
| Too childish visual assets | Adult proportion, professional clothing, restrained stickers, realistic workplace context |
| Image merely reveals quiz answer | Separate decorative/context images from scoring images; no text in quiz art |
| Low coverage from role-specific terms | Validate the Vietnam communication core against real, privacy-safe usage; register accepted domain terms, rewrite only if it preserves natural speech |
| ASR penalizes accent unfairly | Meaning-based feedback, retry, manual transcript correction, avoid one-number pronunciation grades |
| AI hallucinates banking practices | Generic mock scenarios, domain review, never ask for sensitive data |
| Learner falls behind | Due queue cap and adaptive reduction of new content |
| Claiming B1 based on streak/one test | Multi-skill rubric and independent, unseen equivalent assessment sets |
