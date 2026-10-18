# SECTION — DAILY SPEAKING PRACTICE

## Menu position

`English → Practice → Daily Speaking`  
Vietnamese UI label: **Luyện giao tiếp hằng ngày**  
English UI label: **Daily Speaking**  
Subtitle: **Speak naturally, one conversation at a time.**

## What the learner sees

1. **Coach:** Alex — US English male voice (actual voice set by TTS).
2. **Mode:** Free Talk / Guided Lesson / Review.
3. **Lesson:** Lesson 01 — My Daily Routine; future **approved** lessons are added as they become available.
4. **Time:** 5 / 10 / 15 minutes, with a visible elapsed-time counter; no rigid timer for learning.
5. **Pace:** Slow / Normal (affects voice rate and agent sentence length).
6. **Start conversation:** Coach begins by speaking in English.
7. **Microphone:** Tap to speak; show transcription when supported. Always offer a text box as fallback.
8. **Listen again / Hint / Giải thích tiếng Việt / Skip question / End & review** actions. The Explain button explains the **last coach turn** without generating another question.
9. **After session:** actual practiced expressions, strengths supported by learner turns, max 3 corrections, a 30-second speaking exercise, and a **Vietnamese summary**.

## Conversation design

- **Free Talk:** User can discuss work, breakfast, family, commuting, weekend plans, shopping, etc. The model uses the approved phrases and basic language, but never traps the learner inside a memorized dialogue.
- **Guided Lesson:** Lesson 01 Q&A, substitution, and shadowing, varied naturally rather than a mechanical sequence.
- **Review:** Revisit previously approved patterns; use spaced review on days 1, 3, 7, 14 **if tracking is implemented**. Do not display progress that is not stored.
- Correct the most important errors **after** the learner finishes a thought. Keep turns short and avoid overwhelming annotations.
- English first; Vietnamese explanation is shown as a **separate note under the coach message**. English TTS reads only the English conversation. Vietnamese stays written unless Vietnamese voice support is explicitly implemented.

## Vietnamese explanation controls (new)

The settings panel provides **GIẢI THÍCH TIẾNG VIỆT** with three options:

| Option | Behavior |
|---|---|
| **Khi cần** (default, `asNeeded`) | Automatic 1–2-sentence Vietnamese note when correcting grammar, explaining a new everyday phrase, giving a hint, or summarizing the session |
| **Luôn hiển thị** (`always`) | Brief Vietnamese meaning of the coach's question or key phrase after each reply |
| **Chỉ khi bấm hỏi** (`onRequest`) | No automatic Vietnamese notes; use **Giải thích tiếng Việt** to explain the last message |

- When correcting, show **Original → Basic/Correct → Natural** when useful, with a simple Vietnamese reason; do not overload a speaking turn.
- The Explain button **must not** count as a learner speaking turn or advance the topic.
- The demo shows a Vietnamese explanation for a few scripted cases; in production the server returns `{ reply, explanationVi }` to separate display and speech content.
- Preserve the original Lesson 01 focus and the established 95/5 vocabulary preference.

## Sample with Vietnamese explanation

**Alex (EN):** What did you do this morning?  
**Giải thích (VI, khi bấm):** Alex hỏi: “Sáng nay bạn đã làm gì?” Vì kể hoạt động đã diễn ra, bạn có thể mở đầu bằng “I got up...” hoặc “I had breakfast...”.

**Learner:** I get up at five forty this morning.  
**Alex (EN):** Good! You can say, “I got up at five forty this morning.” What did you do next?  
**Giải thích (VI, tự động ở chế độ Khi cần):** Vì bạn kể việc đã xảy ra sáng nay, đổi “get up” thành “got up”. Cách nói vẫn giữ nguyên ý của bạn.

## Lesson 01 initial focus

`get up`, `get ready`, `head out`, `drop someone off`, `on the way to work`, `grab some breakfast`, `clock in`, `I work as...`, `take a lunch break`, `wrap things up`, `head home`.

## Suggested first session

**Coach:** Hey! Good to see you. Let's practice everyday English. What did you do this morning?  
**Learner:** I get up at five forty.  
**Coach:** Great! Since you're talking about this morning, you can say, "I got up at five forty." What did you do after that?  
**Learner:** I brushed my teeth and took a shower.  
**Coach:** Sounds good! Did you have breakfast at home or on the way to work?

Notice: this conversation naturally mixes the approved present-tense routine patterns with basic past-tense conversation where needed. New grammar is explained only when useful.

## Proposed data record (optional for integration)

```json
{
  "agentId": "daily_speaking_coach",
  "moduleId": "daily_speaking",
  "locale": "en-US",
  "voicePreference": "adult-male-sounding-US",
  "mode": "free",
  "lessonId": "lesson_01_my_daily_routine",
  "pace": "normal",
  "explanationMode": "asNeeded",
  "durationMinutes": 10,
  "recentTurns": [],
  "reviewItems": [],
  "startedAt": null
}
```

## Important technical boundaries

- The `daily-speaking-demo.html` file is a **front-end demonstration**, not a deployed ChatGPT Agent.
- For fully free AI conversation, connect the provided **server-side `/api/daily-speaking`** route and provide your own server-side API key.
- To obtain consistent **male-sounding speech**, use the included OpenAI TTS server route (configured with a voice to audition) rather than depending on a browser's voice availability.
- Microphone transcription in the demo uses browser Web Speech Recognition; support varies by browser and microphone permissions, so a text fallback is provided.
- To integrate this menu into the real app, its source code/navigation component is needed. This package does **not** directly modify the existing app or the ChatGPT Project sidebar.
