# 03 — UX INFORMATION ARCHITECTURE & USER FLOWS

## 1. Product UX principles

1. **One learning intent per screen:** see → hear → try → reveal → practice again.
2. **Visual-first, not decoration-first:** illustrations show situation and character intent.
3. **Adult, respectful:** realistic workplace situations, no childish rewards, no fabricated perfection scores.
4. **Audio before text when testing listening:** the first attempt cannot display target transcription.
5. **Unseen transfer:** after rehearsing one phrase, elicit equivalent meaning in a new question/context.
6. **User control:** show captions, IPA and Vietnamese only when requested; allow replay and lower audio speed on practice screens.
7. **Stop at 60 minutes:** review priority adapts; no infinite nudging or mandatory evening homework.
8. **Accessibility is not optional:** visible focus, keyboard operation, controls ≥44×44 CSS px where practical, non-audio alternatives.

## 2. Navigation / sitemap

```text
/
├── onboarding
│   ├── goal + role preference (general / ITBA / UX / UI / PM / Developer / PO)
│   ├── English starting point + preferences
│   ├── baseline listening + speaking (optional microphone, alternative input)
│   └── weekly schedule (6 days × 60m, day off)
├── home (Today's 60-minute journey)
│   ├── Continue today's lesson
│   ├── Visual roadmap 52 weeks
│   ├── Due review preview
│   └── Quick weekly progress
├── learn /course/{courseId}/week/{week}/day/{day}
│   ├── activity 1: active recall
│   ├── activity 2: illustrated listening
│   ├── activity 3: pronunciation + shadowing
│   ├── activity 4: interactive speaking
│   ├── activity 5: reading + writing
│   ├── activity 6: Carnegie-style listening
│   ├── activity 7: Carnegie roleplay
│   └── activity 8: reflection
├── review
│   ├── due cards
│   ├── problem sounds
│   ├── weak chunks
│   └── transfer scenarios
├── practice
│   ├── roleplay: daily life / coworker / ITBA / UX / UI / PM / Developer / PO
│   └── audio listening library
├── progress
│   ├── skill metrics
│   ├── weekly path + assessment results
│   └── errors to fix
├── library
│   ├── lesson history
│   └── phrase notebook
├── settings
│   ├── voices, playback speed, captions, VI support
│   ├── accessibility, keyboard and motion
│   ├── microphone/data choices
│   └── user profile, privacy and deletion
└── admin (staff-only)
    ├── lessons and content queue
    ├── language QA gate
    ├── illustration review/character tracking
    ├── approved audio jobs
    └── assessment bank and release history
```

## 3. Navigation pattern

**Desktop ≥1024px:** 240px left sidebar with Home, Learning Path, Review, Conversation, Progress, Library; header shows elapsed minutes, current lesson and accessibility controls. Center column max 1024px. Learning screens keep controls near the bottom of art and transcript collapsed by default.

**Tablet 768–1023px:** collapsible slim sidebar and central card; dialogue images become 4:3 or alternate mobile-friendly 4:5 art.

**Mobile 360–767px:** compact header (back / lesson title / progress), immersive large scene, sticky lower action bar, 4-tab bottom navigation (Home, Learn, Review, Progress). Avoid floating text obscuring art. Caption panel is beneath image or opens as a bottom sheet.

## 4. User journeys

### J-01 Onboarding (first use, separate from standard days)
`Select context → optional baseline assessment → establish ability profile → select 6 study days and rest day → begin lesson 1`

- Baseline asks about everyday spoken exchanges and role context. Do not label exact CEFR from an unvalidated short quiz.
- Asks microphone consent only at point of use, not as onboarding prerequisite.
- Default role can be General + Workplace IT; optional UX, UI, ITBA, PM, Developer or PO emphasis.

### J-02 Standard 60-minute day
`Open Home → see 8-step plan → 8m review → 15m illustration/audio → 7m pronunciation → 8m speaking → 10m R/W → 6m Carnegie listening → 4m roleplay → 2m reflection → recap → next day's queue`

- Activity time is **budget**, not a mandatory countdown of attention; done early = optional equivalent-level practice or finish early, never exceed daily ceiling.
- Pause/resume supports interruptions; server stores partial step and active elapsed time, not wall-clock time.
- Block-level progress states: `not_started`, `in_progress`, `passed`, `needs_retry`, `skipped_accessibility`, `completed`.

### J-03 Picture listening
1. Large illustration + Play button; English target hidden.
2. Play at comfortable speed (natural default); gist question appears with choices/paraphrase.
3. Respond; reveal feedback on gist and/or detail.
4. Transcript reveal optional; mark exactly which sounds/chunks were missed.
5. Play another voice or variant without transcript.
6. Save listening-specific outcome, not generic card success.

### J-04 Speaking roleplay
1. Scene establishes roles and goal (e.g., clarify a stakeholder request).
2. Play speaking turn. Learner records **only after consent**, or uses typed alternative.
3. Transcript editable for ASR mistakes; learner confirms intended response.
4. Feedback focuses on meaning, adequacy, clarity and 1–2 fixable mistakes.
5. AI or branching script follows up with a novel question; scenario completes on task, not rote exactness.

### J-05 Smart due review
`Select due item → choose modality based on failure tag → attempt → reveal → mark again/hard/good/easy → store new interval → next item`. New vocabulary load decreases when queue load exceeds daily 8 min.

### J-06 Book-inspired conversation
Illustrated workplace or family interaction (listen) → select empathetic intent → respond aloud → read a one-line insight → write brief reflection. Use original dialogue, not copied paragraphs.

### J-07 Checkpoint
At weeks 13, 26, 39, 52: audio clips and conversation tasks not seen in lessons; distinct rubric; variants held out from normal learning library. Assessment image cannot telegraph correct answer.

## 5. Screen/interaction states (cross-cutting)

| State | UX response |
|---|---|
| Loading audio | Skeleton scene and "Đang tải âm thanh" with cancel/back control |
| Audio fails | Retry, optional text alternative; don't silently mark learning complete |
| Microphone unsupported/denied | Typed answer and hearing-only practice, clear disclosure of limitation |
| No network | Use cached approved content; sync later; live AI roleplay unavailable clearly labeled |
| Learner gives wrong answer | Helpful explanation, focused replay, no punishment or shaming |
| Learner is fast | More novel variants or allow early finish; do not add minutes |
| Learner is overwhelmed | Reduce new content, switch to familiar chunks, resurface later |
| Accessibility captions on | Visible when requested; during scored listening, explain captions change scoring mode |
| Same-day return | Continue unfinished activity, do not restart or double-count time |
| Due backlog >8 minutes | Prioritize failed listening/response items; postpone lower-value new content |

## 6. Wireframes (schematic, not pixel-perfect)

### Home desktop

```text
┌──────────────────── NAV ────────┬──────────────────────── MAIN ────────────────────────┐
│ Logo                             │ Welcome back • Week 18 / Day 3                 24:00 │
│ Dashboard                        ├────────────────────────────────────────────────────┤
│ 52-week Journey                  │ [  LARGE ILLUSTRATED WEEK BANNER  IT OFFICE ]       │
│ Today's Lesson                   │ Week 18: My Job                                    │
│ Review 8 due                     │ Today: Speak / task updates  [Continue 60m]        │
│ Practice                         ├────────────────────────────┬───────────────────────┤
│ Progress                         │ 8-step plan                │ Review due            │
│ Library                          │ Listen → Speak → ...       │ Weak sound/chunks     │
└──────────────────────────────────┴────────────────────────────┴───────────────────────┘
```

### Immersive scene desktop

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│ Back  Week 18 • Day 3         LISTEN  08:00–23:00      [step 2 of 8]        │
├──────────────────────────────────────────────────────────────────────────────┤
│ ┌───────────────────────── 16:9 illustration ─────────────────────────────┐ │
│ │   Minh and Lan discussing a generic app user flow; NO artwork text     │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
│      [⟲ replay]   [▶ listen]   [slow / normal]   [CC reveal]              │
│ Gist question: What does Lan want Minh to check?                         │
│ [A. The user flow] [B. Lunch order] [C. Meeting room]                    │
│                   [Check]                 [Next task]                     │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Mobile scene

```text
┌──────────────────────┐
│ ←  Week 18   2/8     │
│  Listening · 15min   │
├──────────────────────┤
│                      │
│    [ 4:5 SCENE ]     │
│                      │
│                      │
├──────────────────────┤
│ [replay] [play] [CC] │
│ What is the issue?   │
│ [ Choice A ]         │
│ [ Choice B ]         │
│ [ Choice C ]         │
├──────────────────────┤
│      [ Check ]       │
└──────────────────────┘
```

## 7. User stories and acceptance

- **As a learner**, I can hide/reveal English and Vietnamese; initial scored listening must not display target text.
- **As a learner**, I can study without a working mic; app does not claim to evaluate my spoken audio in this case.
- **As a learner**, I can select ITBA / UX / UI / PM / Developer / PO emphasis; core phrase is the same, practice contexts adapt.
- **As a learner**, I can pause and return with elapsed active time retained.
- **As a learner**, I can hear two or more different speakers in selected lesson variants.
- **As a learner**, I can redo weak sounds without restarting full lesson.
- **As a content editor**, I cannot publish without approved text, validated meaning, illustration QA and audio assets.

## 8. Accessibility and linguistic UX

Use an `aria-live` region for short feedback but avoid automatic audio playback while a screen reader is speaking. Text-size controls should never hide the microphone/play control. IPA is optional and must match approved sentence. Vietnamese hints support understanding, not live literal translations used as scored answers. Reflection and typing are supported for accessibility, but only real spoken interaction counts in spoken outcome metrics.
