# 05 — LEARNING CONTENT, 60-MINUTE SESSION & ADAPTIVE REVIEW

## 1. Source of truth

Read `00_LEARNING_BLUEPRINT_SOURCE.md` for complete 52-week topic list and `00_LESSON_01_SOURCE.md` for the existing authored lesson. This document defines how to turn those into interactive units without contradicting the existing scope.

**Per 6-day week:** Monday Discover; Tuesday Understand; Wednesday Speak; Thursday Apply; Friday Natural Listening; Saturday Challenge & Review; Sunday rest. 52×6×60=312 hours planned. Do not count optional passive listening as required study minutes.

## 2. Daily pipeline — hard accounting

| Stage | Minutes | Skill ledger | Content ledger | Output artifact |
|---|---:|---|---|---|
| 01 Active recall | 8 | L/S | Everyday | due-item outcomes |
| 02 Visual listening | 15 | L | Everyday | new-audio gist/detail score |
| 03 Pronunciation + shadowing | 7 | L/S | Everyday | targeted sound practice |
| 04 Interactive speaking | 8 | L/S | Everyday | task-response outcome |
| 05 Read + write | 10 | R/W | Everyday | short reading/writing check |
| 06 Carnegie listening | 6 | L | Carnegie | interpersonal listening response |
| 07 Carnegie roleplay | 4 | L/S | Carnegie | concise real-world response |
| 08 Carnegie reflection | 2 | R/W | Carnegie | 1-sentence reflection |
| **TOTAL** | **60** | **L/S 48; R/W 12** | **Everyday 48; Carnegie 12** | |

**Double-ledger rule:** An activity is assigned one dominant skill class and one content class; don't double-count minutes. Speaking with on-screen reference is still counted L/S where speaking is the target. A special needs adaptation can vary modality and will be recorded explicitly rather than claiming unperformed oral practice.

## 3. Six-day micro-cycle for an adult IT banking learner

The week topic remains shared. Work role influences scene difficulty/context only when pedagogically appropriate.

| Day | Novelty | Task | Typical learner output |
|---|---|---|---|
| D1 Discover | primary visual, 3–5 reusable chunks | listen and locate key idea | 1 short response |
| D2 Understand | alternate speaker + paraphrase | infer request, identify detail | pick gist then answer |
| D3 Speak | same meaning, new questions | answer 3 surprise follow-ups | 30–60s spontaneous speech |
| D4 Apply | new location/actor or obstacle | roleplay task | clarify/solve problem |
| D5 Natural listening | speed/voice/accent variation within level | listen to unfamiliar clip | recount main idea |
| D6 Challenge | unseen comparable dialogue + review | achieve communicative task | 3–5 min exchange at early levels; longer at later levels |

## 4. Difficulty ladder

| Level | Listening input | Speaking task | Writing task |
|---|---|---|---|
| Foundation A1 | clear short exchanges, high contextual support | greetings, facts, simple preferences | 1–2 clear sentences |
| A1–A2 | everyday mini-dialogues and simple paraphrases | connected answers, questions | 2–4 sentences or short message |
| A2 | longer exchanges, choices, reasons and requests | follow-up questions, simple work updates | small email/chat reply |
| A2–B1 | normal-but-clear speech, multiple turns | explain/compare/problem-solve | connected paragraph |
| B1 target | new familiar-topic clips, mixed speakers, clear natural rate | 10–20 minute supported conversation by readiness | coherent simple work/life messages |

CEFR label is an instructional target; promote learner based on held-out tasks, not elapsed weeks.

## 5. Content grammar

Each lesson has:
- `objective` in English and Vietnamese (communicative outcome).
- 1 **illustrated anchor scene**, 1 variant, 1 transfer scene.
- 3–5 reusable chunks at target level; Basic → Better → Natural where relevant.
- 1 dialogue with role labels and approved audio.
- gist/detail listening questions and distractors not revealed by artwork.
- 2–4 spontaneous question variants that are *not simply identical to the model response*.
- 1 short reading and one short writing response.
- 1 Carnegie-inspired original interpersonal scenario plus reflection.
- approved image IDs, character IDs, scene alt, crop focal points and rights metadata.
- lexical coverage, pronunciation review flags, source references and audio approval metadata.

## 6. Lexical policy — ≥90% reviewed Vietnam Spoken Core running tokens

The historic Lesson 01 snapshot used **95% Oxford 3000**; a later blueprint snapshot used **90% Oxford-3000-oriented** language. **The revised user requirement replaces that reference:** prioritize vocabulary/chunks that Vietnamese adults genuinely need to speak English in Vietnam, especially at home, commuting, cafés, with coworkers and in IT banking (UX, UI, ITBA, PM, Developer, PO). Oxford 3000 remains one secondary resource for checking general usefulness, **not** the list on which the 90% quota is based. Preserve old `00_*_SOURCE.md` documents as history, not current policy. See `08_VIETNAM_SPOKEN_CORE_LEXICON.md` for inclusion/review rules.

Procedure:
1. Curate a **Vietnam Everyday & IT Banking Spoken Core** from realistic anonymized conversations, staff-reviewed workplace situations and authentic spoken US usage; preserve source evidence and review decisions. **Current seed is not frequency-validated.**
2. Normalize authored English utterance running tokens with documented English tokenizer/contraction/inflection rules; use the versioned **approved** core.
3. Exclude only metadata, numbers, proper names by consistent published rules; keep workplace jargon in denominator unless it is a genuinely excluded proper noun.
4. Report `covered_tokens`, `eligible_tokens`, `coverage_ratio`, `core_version`, and exceptions with reasons. Count tokens, not unique words or phrases.
5. Publishing requires ≥0.90 *on validated approved list* **or** signed editor override for a justified natural context; draft seed cannot pass the production gate.
6. Do not repeat easy words merely to inflate coverage. Let genuine coworker speech be natural; prioritize comprehension and ability to respond over gaming a metric.

## 7. Authoring and publication workflow (must match existing file)

1. Vietnamese meaning + realistic situation; no word-for-word literal translation.
2. Draft Basic → Better → Natural American English.
3. Check semantics/grammar/IPA/pronunciation in Cambridge Dictionary.
4. Validate phrase collocations and spoken frequency in COCA (spoken, TV/movie).
5. Hear multiple real US examples on YouGlish; reject mismatched register.
6. Compose original approved final sentence, record reference URLs/version.
7. Compute vocabulary coverage and any exception notes.
8. Generate art without legible critical text and run visual QA.
9. **Only after English wording passes** create approved TTS audio; test timing, pace, voice variants, and linguistic quality.
10. Add unseen test set separately; do not leak test variants into review queue.
11. Publish versioned content; edits trigger downstream invalidation of dependent audio/IPA.

Reference details in `00_CONTENT_REVIEW_WORKFLOW_SOURCE.md`. Prompts and sample JSON are **production aids, not editorial approval**.

## 8. Adaptive review scheduler

**Data dimensions per learning unit:** `listeningRecognition`, `semanticUnderstanding`, `oralRecall`, `transferUse`, optionally `reading`, `writing` — avoid merging everything into one mastery flag.

Proposed state machine:
- `new` → `introduced` → `understood` → `recall_ready` → `in_review` → `transfer_verified`.
- Wrong listening question tags `sound` / `meaning`; oral difficulty tags `retrieval` / `fluency` / `interaction`; never infer exact root cause without learner confirmation.
- Candidate spaced intervals: +1, +3, +7, +14, +30, +60 days; update based on `Again/Hard/Good/Easy` or a validated scheduler (e.g., SM-2/FSRS) if implemented with correct tracking.
- Review modality follows weakest skill: sound→listen/contrast, retrieval→visual-to-speech, transfer→novel scenario.
- Time budget capped at 8 minutes. If backlog exceeds it, prioritize recent errors and near-expiring material, postpone low-risk cards, reduce new content. Do **not** exceed 60 minutes.

### Deterministic MVP scheduler pseudocode

```pseudo
for item in due_items ordered by priority:
  if review_time_remaining <= 0: break
  show(item.mode_from_weakest_skill)
  result = collect_answer_and_confidence()
  if result == AGAIN: item.interval_days = 1; item.mode = failed_modality
  if result == HARD:  item.interval_days = max(1, floor(previous_interval * 1.2))
  if result == GOOD:  item.interval_days = next_in([1,3,7,14,30,60])
  if result == EASY:  item.interval_days = min(60, max(3, round(previous_interval * 2)))
  persist(item, skill_state, result, next_due_date)
if due_overflow: new_items_today = decrease(new_items_today)
```

This is a **starting policy**, not a validated optimal memory algorithm. Store event history so policy may improve later.

## 9. Lesson 01 acceptance mapping

| Existing asset | App transformation |
|---|---|
| Full Story | optional warm-up reading and long-form context, not the first scored listening transcript |
| 28 EN/IPA/VI sentences | approved utterance catalog after editorial re-check; each sentence audio/translation |
| Basic → Natural | difficulty toggle / comparison after learner attempt |
| Flashcards | image/audio front, text/IPA/VI back |
| Timeline/Mind map | story recap or learning path support, not independent listening test |
| Repetition/Shadowing | pronunciation block |
| Dictation | targeted listening error practice; do not overtake L/S allocation |
| Q&A Reflex | interactive speaking + unexpected questions |
| Speaking Challenge | independent day-6 performance task |

## 10. Assessment definitions

- **Daily:** low stakes; update learning state.
- **Weekly D6:** novel audio/voice and task; unseen answer with situational support.
- **Weeks 13/26/39/52:** held-out audio set from different speakers; timed mini oral interview, short reading and writing; use rubric and label interim CEFR-orientation only.
- **Primary KPI:** ≥16/20 correct listening detail/gist items on an independent set, then pass a second comparable set; balanced across domains. Keep confidence interval/number of questions visible in internal reports.
- **Separate B1:** independent rubric aligned to official CEFR ability descriptions. User should not see "B1 achieved" based only on 80% of one internal quiz.

## 11. Data health checks

- At publish: all activity minute totals exactly 60, L/S 48, R/W 12, Everyday 48, Carnegie 12; at least one newly heard variation per lesson; validated Vietnam Spoken Core coverage >=90% OR documented editor-approved exception (never pass on seed-only evidence); approved speech/IPA match final text; no answer embedded in scored assessment art.
- At runtime: completed review events have a measured modality, due date calculations timezone-aware, no duplicate awards on retries, stable offline sync IDs, no customer financial data.
