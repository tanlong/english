# 07 — QA, ACCEPTANCE TESTS & RELEASE GATES

## 1. Definition of Done for a single lesson

- [ ] Realistic adult learner context and explicit communicative goal.
- [ ] Approved Basic/Better/Natural US English, bilingual meaning, IPA reviewed.
- [ ] Cambridge/COCA/YouGlish reference links recorded; review timestamp and editor.
- [ ] Vietnam Spoken Core token coverage validated with approved, versioned locally relevant lexicon; exceptions justified. Seed-only lexicon must never pass publication.
- [ ] Illustration meaning, character appearance, 16:9/4:5 crops and alt text approved.
- [ ] Audio generated **only** after language approval; listened to by a reviewer.
- [ ] At least one unseen wording/speaker variant and one open-ended question.
- [ ] Exact stage totals: 60m; L/S 48m, R/W 12m; everyday 48m, Carnegie 12m.
- [ ] All button/keyboard/mic denied/offline states tested.
- [ ] Scored listening answer not visible as artwork/caption before attempt.
- [ ] Privacy/security scan and versioned publish record completed.

## 2. Functional test matrix

| ID | Scenario | Steps | Expected |
|---|---|---|---|
| TC-001 | New learner setup | Select Developer or PO role, choose Everyday+Work, finish onboarding | Profile retained, 52-week map loaded |
| TC-002 | Daily cap | Complete 8 activity blocks | Budget 3600s, no mandatory extra content |
| TC-003 | Dual ledger | Validate lesson manifest | 2880s L/S,720s R/W;2880s Everyday,720s Carnegie |
| TC-004 | Caption gate | Open first listening attempt | EN/VI transcript hidden; reveal after response |
| TC-005 | Replay | Click replay while sound loaded | Same reviewed audio replays, UI state correct |
| TC-006 | New voice | Switch listening variant | Different approved voice audio available |
| TC-007 | Mobile layout | At 360, 390, 768 and 1280 widths | No horizontal overflow, controls reachable |
| TC-008 | Flashcard | Flip card with keyboard | Front/reveal accessible, answer in DOM |
| TC-009 | Due result | Fail listening of phrase | Item tagged listening, rescheduled, other skills preserved |
| TC-010 | Review overload | Seed >8 min due queue | Limit due session, reduce new exposure, no >60m lesson |
| TC-011 | Resume | Pause midway, reopen | Returns exact step and saved attempts |
| TC-012 | Microphone denied | Deny browser mic permission | Clear fallback; no false spoken score |
| TC-013 | Typing option | Submit typed response | Semantic practice tracked as typed, not spoken |
| TC-014 | Role variation | Change from General to Developer or PO | Context changes, core level progression preserved |
| TC-015 | Authenticity | Display 'workplace' illustration | No childlike characters or real banking customer data |
| TC-016 | Text in artwork | Inspect scored listening image | No answer-bearing text embedded in pixels |
| TC-017 | Screenreader | Navigate lesson via keyboard+reader | Labels, focus, statuses readable |
| TC-018 | Offline failure | Disconnect before AI roleplay | Clearly marked unavailable, cached content still usable |
| TC-019 | Revision dependency | Edit approved English utterance | Audio + IPA approvals invalidated |
| TC-020 | Assessment holdout | Try to fetch unpublished test transcript | Blocked before attempt/completion policy allows |
| TC-021 | User data removal | Delete voice history through settings | Raw stored recording deleted per retention policy |
| TC-022 | Multivoice listen | Replay with alternate speaker | Equivalent intended meaning, no transcript mismatch |
| TC-023 | English orthography | Scan approved content | US spellings, no inconsistency from source lesson |
| TC-024 | Illustration crop | 4:5 on mobile | Action and critical props not clipped |
| TC-025 | Local spoken core | Verify editorial coverage of a sample text | Uses approved Vietnam-core version, not Oxford-only gate or seed-only words |
| TC-026 | Developer track | Select Developer and open Week 20 | Relevant bug/API/code-review dialogue and workplace art |
| TC-027 | PO track | Select PO and open Week 20 | Backlog / user-story / priority dialogue, PO distinct from PM |
| TC-028 | Candidate vocabulary | Try to publish with unreviewed seed reference | Publishing blocked with actionable editorial error |

## 3. Acceptance / analytics definitions

- **Listening success:** correct gist/detail on **previously unseen** audio; event records whether subtitles or replay were used.
- **Speaking task success:** listener/roleplay goal satisfied; not derived only from speech-to-text exact-match.
- **B1 readout:** separate CEFR-aligned evaluator rubric; no certification claim.
- **Vocabulary coverage:** eligible running tokens, versioned *approved Vietnam Spoken Core*, exclusions and contextual exceptions documented (Oxford 3000 is a supplementary check).
- **Session time:** active engaged time per stage; planned time ceiling; pause excluded.
- **Retention:** success on scheduled items after delay, with modality-specific counters.

## 4. Minimum visual regression suite

- Dashboard desktop/mobile, Lesson listening desktop/mobile, Flashcard front/back, roleplay with feedback, Vietnamese hint panel, audio load error, dark/contrast mode if implemented, 200% browser zoom.
- Confirm artwork colors consistent with guide and readable with text overlay.
- Confirm no generated false letters/logos or incorrect anatomy in accepted assets.

## 5. Content acceptance rubric (0–2 each, 10 items)

1. Meaning true to learner's use case.
2. Natural contemporary US English.
3. Correct grammar/IPA/US audio.
4. Spoken corpus and usage evidence.
5. Appropriate difficulty and allowed jargon.
6. Scene implies target communicative intent.
7. Distinct non-leaking unseen comprehension items.
8. Authentic and inclusive adult work/life representation.
9. Effective feedback and reuse in a second scenario.
10. Fully verified metadata and licensing.

Minimum proposal: ≥17/20 with no zero in items 1, 3, 7 or 10. This is an internal editorial standard, not a published academic benchmark.

## 6. User acceptance tests (UAT) with adults

Try prototype with 5–8 working adults across at least two IT roles and one non-IT role to surface obvious usability issues (not statistically representative). Tasks: start 60m plan, find captions, replay unheard phrase, answer roleplay without transcript, finish flashcard, view progress. Collect completion time, confusion points, trust in AI feedback and image relevance. Iterate before art batch generation.

## 7. Release gate

Do not publish when: editorial references missing; image/answer leakage discovered; correct output forced without audio understanding; any session manifest >60 minutes; privacy/consent incomplete; hidden assessment items inadvertently exported to normal lesson API.
