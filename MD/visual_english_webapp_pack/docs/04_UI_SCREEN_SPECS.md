# 04 — UI SCREEN SPECIFICATIONS / COMPONENT CONTRACTS

**Note:** Screens are defined so frontend, UX and QA can work from the same acceptance checklist. Wireframes in 03 are structural; prototype/index.html is a demonstration.

## Global design system

- Layout: 8px base grid; radius 12px form controls, 18–24px cards, full-circle audio buttons.
- Touch: target ≥44×44px where possible; desktop focus ring visible.
- Grid: max content width 1120px (desktop); inside lesson scenes 840–960px.
- Breakpoints proposed: `<640` compact mobile; `640–1023` tablet; `≥1024` desktop.
- Components: `AppShell`, `NavRail`, `HeaderProgress`, `ProgressStepper`, `VisualScene`, `AudioControl`, `CaptionPanel`, `ChoiceGrid`, `MicRecorder`, `RoleplayTurn`, `FeedbackPanel`, `SmartFlashcard`, `ReviewRating`, `TimeBudget`, `DailyRecap`, `RoleBadge`, `IllustratedModuleCard`, `AccessibilityMenu`.
- Every component has loading/error/empty/focus/disabled states; error messaging is clear Vietnamese.

## S-01 — Onboarding & baseline

**Goal:** identify learner context, not diagnose B1 from a single quiz.  
**Hero visual:** adult learner with everyday and workplace contexts, 40–60% not huge art.

**Inputs:** use case (everyday / workplace / both), IT role (ITBA/UX/UI/PM/Developer/PO/general), baseline confidence, mic and captions preferences.  
**Actions:** Next/Back/Skip baseline; persist preferences locally/account.  
**Success:** setup complete and Week 1 available; baseline score marked provisional.  
**Edge:** mic access denied → text-based/on-device alternative, spoken score unavailable.

## S-02 — Home and 52-week map

**Hero:** one featured illustrated card for today's topic; user sees week/day and 60-minute path.  
**Data:** activeWeek, day, completedStages[], dueCount, daysStudied, lastAssessment and timeActiveToday.  
**Actions:** Continue; browse module, navigate review, practice roleplay.  
**Success:** one click reaches next unfinished step.  
**Edge:** when no lesson scheduled, rest day and optional short review are non-mandatory.

## S-03 — Lesson player: visual listening

**Main illustration:** 16:9 desktop and alternative 4:5 mobile; ~65–75% of illustration *card*.  
**Always visible:** play/replay, audio state, speaker, remaining step time, simple situational cue, response UI.  
**Initially hidden:** English transcript, target phrase, Vietnamese translation, IPA.  
**Actions:** play, speed (practice only), submit gist/detail answer, reveal transcript after first attempt, alternative voice, move next.  
**Assessment mode:** speed/reveal restrictions pre-defined; visual may not leak answer.  
**Data event:** `listening_attempt {item_id, audio_variant_id, correct, shown_caption_before_response, replay_count, latency_ms}`.  
**Acceptance:** listening question can be answered by hearing, not by reading illustrated signage.

## S-04 — Pronunciation and shadowing

**Main visual:** same scene cropped to focus of relevant person/action.  
**Content:** one meaningful sentence chunked by slash pauses, optional audio waveform/segments, repeat control.  
**Actions:** hear normal/slow, repeat aloud, mic opt-in, save reflection or replay.  
**Feedback:** suggest stress/sound to practice; never equate speech recognition transcription alone with comprehensive accent assessment.  
**Acceptance:** learner can use the tool without a mic; only claim pronunciation feedback if recorded and assessed.

## S-05 — Interactive speaking / roleplay

**Visual:** two adult characters in a recognizable location.  
**UI:** who speaks next, task goal, current conversational turn, replay, mic or typed alternative, Send, feedback panel, 1–2 follow-up branches.  
**Content constraints:** respectful work dialogue, simple English, no real account or customer information; explicit fictional setting.  
**Acceptance:** one unscripted or branched new question tests transfer, not exact memorization.

## S-06 — Reading & writing

**Visual:** small supporting illustration with 2–5 turns of readable HTML text, not text embedded in image.  
**Inputs:** one reflection or message composed in 1–3 sentences; writing prompt tied to same topic.  
**Feedback:** meaning clarity and grammar priorities, optional natural rewrite, no encyclopedic explanation.  
**Time:** 10 minutes Everyday block; separate 2-minute Carnegie reflection.

## S-07 — Carnegie interpersonal scene

**Visual:** social scenario with body language (e.g., colleague asking for project status).  
**Content:** own dialogue illustrating a principle; listening 6 minutes, short reply 4 minutes, written reflection 2 minutes.  
**Badge:** "Communication Skills" (not full-size brand as if part of UI vendor).  
**Acceptance:** adult-adult respectful interaction; no verbatim copyrighted passages.

## S-08 — Smart review cards

**Front:** visual + voice; optional neutral situational hint; transcript hidden.  
**Back:** English sentence, helpful chunk highlight, optional IPA/VI, one new example.  
**Interactions:** reveal, Again/Hard/Good/Easy or meaningful equivalent, report audio/meaning issue.  
**Review item types:** `sound_recognition`, `meaning_comprehension`, `spoken_recall`, `transfer`.  
**Acceptance:** score per skill; mastering meaning does not auto-master spontaneous speech.

## S-09 — Daily recap

**Content:** blocks completed; listening question results; successful novel answer; 1–3 items to review; next-day preview.  
**Presentation:** supportive progress, no unearned "B1 achieved" badge.  
**Action:** Finish day, replay one item (only if still within time budget), exit.  
**Acceptance:** active minutes never exceed daily cap and unfinished activities can be resumed.

## S-10 — Progress and assessments

**Charts:** unseen listening score across comparable tests; response task success, review retention, all four skill areas, time spent.  
**No fake metric:** don't display inferred CEFR until validation; if displaying B1-oriented readiness, label estimated/internal.  
**Accessibility:** chart data has an accessible table alternative.

## S-11 — Admin/editorial CMS

**Stages:** Draft → Linguistic Review → Illustration Review → Audio Review → Assessment Safeguards → Published.  
**Gate:** publish action disabled unless mandatory flags and provenance are present.  
**Required metadata:** auth/editor, timestamps, locale, Cambridge reference, COCA note, YouGlish note, source usage restrictions, approved IPA, Vietnam Spoken Core vocabulary coverage with list version and exceptions, media rights, alt text, audio voice provenance, versioned published revision.  
**Acceptance:** newly edited English sentence invalidates dependent IPA and TTS approval until reconfirmed.

## UI layout specifications and viewport adaptation

| Screen | Desktop | Mobile | Important accessibility |
|---|---|---|---|
| Home | 2-column hero + review summary | single stacked cards | heading order; image alt |
| Lesson scene | large 16:9 image + right/below controls | 4:5 art + bottom actions | captions under image; no floating text on art |
| Dialogue | 2-character landscape scene | alternately framed portrait shot | speaker labels as text |
| Flashcard | left art/right readable text after reveal | image top 65%, text below | flip via button and keyboard |
| Progress | charts + supporting table | single-column stats | full text equivalents |
| CMS | table/detail split panes | desktop-first admin experience | keyboard edit and labeled controls |

## Interaction states and copy examples

- Pre-answer hint: `Nghe trước, rồi chọn ý đúng.`
- Show text: `Hiện câu tiếng Anh` / `Ẩn câu tiếng Anh`
- Show Vietnamese: `Xem nghĩa tiếng Việt`
- Microphone: `Bắt đầu ghi âm` / `Dừng ghi âm` / `Không dùng micro`
- Missing playback: `Không tải được âm thanh. Thử lại hoặc sử dụng bản chép lời.`
- Review failure: `Bạn đã hiểu ý chính; thử nghe lại phần nối âm ở cuối câu.`
- Resumable lesson: `Bạn còn 24 phút trong buổi học hôm nay.`

## UI acceptance checklist

- [ ] 360px width content does not overflow horizontally.
- [ ] All interactive elements focusable with visible focus styles and clear accessible labels.
- [ ] Main art doesn't hide caption controls on 200% zoom.
- [ ] At least 2 responsive crops checked for the same scene.
- [ ] Transcript/VI hidden until intended reveal in listening mode.
- [ ] Loading/offline/mic denied paths work.
- [ ] Pause/resume keeps step and correct time ledger.
- [ ] Vietnamese diacritics render correctly in all font choices.
- [ ] Character consistency meets Style Bible check.
- [ ] All practice controls have actual behaviors; placeholder indicators clearly labeled in the prototype.
