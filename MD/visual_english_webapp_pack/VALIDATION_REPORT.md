# VALIDATION REPORT — Development Kit v1.1

Date: 2026-10-16. Scope: updated vocabulary policy + Developer/PO role tracks.

## Passed (automated/local)

- JSON parse: `design-tokens.json`, `lesson01.example.json`, `vietnam-spoken-core.seed.json`.
- `prototype/index.html`: JavaScript syntax parse with Node; 7 role values are present, including Developer and PO.
- Role-specific dialogue definitions exist for Developer (bug) and PO (user story). Manual browser interaction remains to be verified.
- `scripts/check_lexical_coverage.py`: candidate diagnostic returns `CANDIDATE_ONLY_NOT_VALIDATED`; production `--require-approved` correctly fails closed with exit code `3` for seed lexicon.
- Current `docs/10_CURRENT_12_MONTH_BLUEPRINT_V1_1.md` reflects revised language policy and roles; original `00_*_SOURCE.md` snapshots preserved unchanged.
- Unchanged planned 8 activity durations: **60 min** total, **48/12** min by skill, **48/12** min by Everyday+Work vs Carnegie.
- Developer/PO added to PRD, UX, technical handoff, prompt/shot list, style character roster, QA and prototype selector.

## Not yet verified or deliberately pending

- Full interactive Chromium/browser smoke test of modified prototype **not completed** in this runtime: browser navigation was blocked by environment administrator policy. `index.html` and JavaScript syntax were checked, but QA must rerun interaction/mobile smoke tests before release.
- Vietnam Spoken Core **seed-only**: no statistically representative sample or human source-evidence approvals; **no validated 90% claims** about real usage or course content.
- Published-course English review via Cambridge/COCA/YouGlish, audio TTS QA, character/art approval, bank security review, WCAG end-user tests, real microphone, backend/API, AI roleplay and B1 evaluation.
- Mock lesson JSON and prototype illustrations are not production-approved learning materials.

## Next required tests

1. Approve versioned Vietnam Spoken Core through evidence-based editorial reviews; calibrate tokenizer/lemmatizer and run real corpus + authored-content coverage.
2. Browser smoke test: choose each role, start roleplay, verify dialogue and follow-up update, mobile viewports and keyboard navigation.
3. Pilot two reviewed lessons: Daily Routine + a combined Developer/PO/ITBA story in a fictional banking team.
4. Validate image references/license, no sensitive bank data, and 60-minute session ledgers.
