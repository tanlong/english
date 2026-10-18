# 06 — TECHNICAL HANDOFF (PROPOSED ARCHITECTURE)

> This architecture is a **recommendation**, not a user-approved stack mandate. Align with the actual team stack and hosting constraints before implementation.

## 1. Recommended system slices

1. **Web frontend:** Next.js App Router + React + TypeScript, reusable design tokens and component library; PWA caching is an optional later enhancement.
2. **App/API server:** Next.js route handlers or separate service as scale dictates; authenticated endpoints, media signing, activity state.
3. **Database:** relational DB (PostgreSQL as default suggestion) with lesson versions, attempts, SRS item state and assessment isolation.
4. **Media:** object storage/CDN for illustration WebP/AVIF and reviewed audio, manifest with responsive variants and rights metadata.
5. **AI orchestration (later):** backend-only prompt and roleplay service; content and safety guardrails; never expose vendor keys to browser.
6. **CMS/admin:** create/edit content, linguistic checks, illustrator review, TTS approval, publish revision and regression audit.
7. **Observability:** anonymized aggregate quality/time metrics, content issue reporting and operational traces excluding raw customer details.

## 2. Functional data entities

```text
User ──< Enrollment >── Course
User ──< LearningSession ──< ActivityAttempt
User ──< ReviewState >── Chunk / Utterance
Course ──< WeekModule ──< DailyLesson ──< ActivityBlock
DailyLesson ──< Scene ──< Utterance ──< AudioVariant
Scene ──< IllustrationAsset
Utterance ──< PhraseChunk
DailyLesson ──< AssessmentItem (separate holdout bank)
DailyLesson ──< ContentReviewDecision
```

### Core fields and illustrative contract

| Entity | Required fields |
|---|---|
| `Course` | id, locale, version, weeks_count, active, skill_mix, topic_mix |
| `WeekModule` | id, index, month, title_en, title_vi, cefr_target, carnegie_theme, role_tags |
| `DailyLesson` | id, week_id, day_index, objective, revision, publish_state, budget_seconds |
| `ActivityBlock` | id, lesson_id, order, type, seconds, skill_ledger, content_ledger |
| `Scene` | id, situation, venue, characters[], focal_asset, content_sensitivity, img_alt |
| `Utterance` | id, speaker_id, text_en, text_vi, ipa, basic/better/natural, lex_coverage, lexicon_version, coverage_review_status, approval_state |
| `AudioVariant` | id, utterance_id, speaker_voice, locale, media_uri, duration_ms, approved |
| `ReviewState` | user_id, chunk_id, weakest_skill, due_at, interval_days, counters, status |
| `ActivityAttempt` | id, user_id, activity_id, modality, answer, accuracy, errors, elapsed_active_ms, created_at |
| `IllustrationAsset` | id, scene_id, ratio, URL, focal_point, alt, style_version, license_status |
| `AssessmentItem` | id, held_out, skill, difficulty_tag, media, rubric, reviewed_by |

Detailed example at `data/lesson01.example.json`; create JSON Schema or typed Zod model during development.

## 3. API endpoints (sketch)

```http
GET    /api/v1/me/profile
PATCH  /api/v1/me/preferences
GET    /api/v1/courses/current
GET    /api/v1/lessons/today
GET    /api/v1/lessons/{lessonId}
POST   /api/v1/sessions/start
POST   /api/v1/sessions/{sessionId}/events
POST   /api/v1/sessions/{sessionId}/pause
POST   /api/v1/sessions/{sessionId}/complete
GET    /api/v1/review/due?maxSeconds=480
POST   /api/v1/review/{reviewItemId}/attempt
POST   /api/v1/speech/transcribe (explicit consent, capped size, authenticated)
POST   /api/v1/roleplay/turn (backend-only model call, stateful/context-limited)
GET    /api/v1/progress/summary
GET    /api/v1/assessment/{id} (held-out authorization and no public transcripts)
POST   /api/v1/assessment/{id}/submit
POST   /api/v1/admin/lessons/{id}/submit-review
POST   /api/v1/admin/lessons/{id}/publish
```

Use idempotency keys on session/review mutations and event IDs to handle offline retries; timestamps UTC storage, user timezone projection. Do not trust client-reported elapsed time as a sole metric; session duration is a UX budget rather than a security-critical timer.

## 4. Activity time accounting

Activity manifest must pass validation:

```ts
type Skill = 'listening_speaking' | 'reading_writing';
type ContentTrack = 'everyday' | 'carnegie';
type Activity = { id: string; seconds: number; skill: Skill; track: ContentTrack };
function validatePlan(a: Activity[]) {
  const sum = (filter: (x:Activity)=>boolean) => a.filter(filter).reduce((s,x)=>s+x.seconds,0);
  return sum(()=>true)===3600
    && sum(x=>x.skill==='listening_speaking')===2880
    && sum(x=>x.skill==='reading_writing')===720
    && sum(x=>x.track==='everyday')===2880
    && sum(x=>x.track==='carnegie')===720;
}
```

If actual learner stops early, **report actual minutes honestly** and preserve allotted budget without adding catch-up demand. Treat offline sessions, partial completion and day-boundary carefully.

## 5. Audio and speech pipeline

`English draft → editorial source checks → approved utterance revision → TTS job request → voice/QC review → media version → distribution`

- Select US locale voice variants; use approved neutral natural pace and a few distinct speakers; for advanced listening include human speech where rights allow.
- Store alignment/timecode segments only when verified; don't present approximate forced alignments as certainty.
- Transcription quality varies by accent, noise, device; allow manual correction and semantically based roleplay assessment.
- Microphone permission at point of need; consent/retention displayed; avoid storing raw audio by default if user only needs ephemeral feedback.
- Cross-device media caching and retry; mute other playback when recording begins.

## 6. Image asset handling

- Image prompts have no baked-in textual caption; all learning words live in localizable HTML.
- Store per-asset `style_id`, `character_refs`, `scene_intent`, `version`, `alt_en`, `alt_vi`, `focal_x`, `focal_y`, `crop_approved`, `rights`.
- Generate/approve separate 16:9 / 4:5 variants where crop compromises interaction.
- CDN with sized assets, `srcset`/`sizes`, optimized WebP or AVIF, lazy-load non-critical scenes and prefetch next approved asset.
- Treat child family scenes respectfully: no unnecessary sensitive detail or real personally identifying child data.

## 7. AI roleplay guardrails

The AI receives: approved scene, learner level, assigned roles, communicative goal, approved Vietnam Spoken Core words/chunks + role exceptions (ITBA/UX/UI/PM/Developer/PO), relevant approved chunks, prohibited sensitive themes, current dialogue turns, permitted question count.

Expected output: short natural US-English next turn, simple feedback limited to 1–2 corrections, no unjustified test score; confidence about uncertain ASR marked as uncertain.

- No production bank account/card numbers, credentials, internal hostnames, client PII, staff directory info.
- If user introduces sensitive finance content, redirect to generic educational scenario.
- AI-generated output is **unreviewed runtime material** and should not be confused with curated authored lesson and vocabulary coverage guarantee.
- Prompt injection in learner-provided text cannot override lesson/banking-data boundaries.

## 7A. Vocabulary coverage and role personalization — implementation contract

- `LexiconEntry`: `{lemma, category, context_tags[], roles[], examples[], review_status, source_evidence[], revision}`. In production, accept **only** reviewed, approved entries. Starter data in `data/vietnam-spoken-core.seed.json` are deliberately marked `seed_only` and must **not** grant publish eligibility.
- `LexicalCheck`: `{utterance_revision, lexicon_version, eligible_tokens, covered_tokens, ratio, uncovered_terms[], reviewer, decision}`. New utterance wording invalidates coverage and audio/IPA approval.
- Route `role_preference` values through role slugs `general`, `itba`, `ux`, `ui`, `pm`, `developer`, `po`. `po` means **Product Owner**, not PM; switching roles changes scenes, chunks and queries, not foundation/CEFR requirements.
- CMS supports accepting/rejecting new terms and evidence; no automatic use of proprietary bank chat logs without consent, redaction and authorization.
- `scripts/check_lexical_coverage.py` illustrates deterministic **local diagnostic** counting only. It does not establish that the candidate list reflects true usage in Vietnam.

## 8. Security/privacy baseline

Authentication and access control; role-based CMS permissions, rate limiting and abuse controls; encrypted transport; secure media upload validation; recorded consent for microphone/transcript retention; ability to delete personal recordings, data retention policy; no third-party trackers on answer content by default.

## 9. Release testing and observability

Track: crash rate, lesson startup time, audio failure, image failure, transcription fallback rate, session abandonment by step, completion per difficulty level, learning performance on unseen tests. Inspect per role and device without storing confidential free text. Watch metrics for accessibility and microphone availability bias.

## 10. Implementation order

**Phase A — static curriculum core:** tokens, asset manifests, onboarding, home, lesson, captions, flashcards and review events.  
**Phase B — interaction:** speaking activities, opt-in recording, simple branching roleplay, day recap, assessment.  
**Phase C — adaptive intelligence:** true audio variants, AI roleplay, per-skill review engine, editorial tooling and sustained retention experiments.

## 11. Engineering decisions still to make

- Authentication provider, deployment region, database vendor and data retention policies.
- Vietnam Spoken Core: anonymized local-use sampling/review, approved versioning, tokenizer + inflection policy, audit trail. Oxford 3000 access is optional reference only.
- Speech vendor and latency budget; voice licensing; cost caps per user/session.
- Use of managed CMS vs custom editor; support for A/B lesson variants.
- Whether the existing business environment imposes security/banking compliance requirements beyond this general specification.
