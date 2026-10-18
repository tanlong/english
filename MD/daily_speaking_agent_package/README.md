# Daily Speaking — Agent + Practice Section

This package provides a ready-to-integrate **conversational AI agent configuration** and a **Daily Speaking** practice section based on the user's English project content.

## Contents

- `DAILY_SPEAKING_AGENT.md`: complete teaching agent configuration and system prompt.
- `DAILY_SPEAKING_MODULE.md`: placement, interaction, modes, and learning rules for the new menu section.
- `daily-speaking-demo.html`: responsive UI with browser microphone input, audio replay, **separate Vietnamese explanations** and server API hooks. Without an AI server, it uses an explicitly labeled **offline scripted demo** (not genuine free conversation).
- `nextjs/lib/daily-speaking-agent.ts`: shortened production system prompt.
- `nextjs/app/api/daily-speaking/route.ts`: server-side model dialogue route.
- `nextjs/app/api/daily-speaking/speech/route.ts`: OpenAI TTS voice route.
- `nextjs/.env.example`: server-side environment variable template.

## Vietnamese explanations (new)

The demo now provides **Giải thích tiếng Việt**: `Khi cần` (default), `Luôn hiển thị`, and `Chỉ khi bấm hỏi`. Explanations are shown under English messages and are **not** sent to the American-English TTS track. The **🌐 Giải thích tiếng Việt** button explains the last question without counting as spoken practice. The production AI route responds with separate `reply` (English) and `explanationVi` (Vietnamese) fields. The offline demo uses a limited set of predefined bilingual examples; it cannot provide genuinely open-ended explanations.

## Integrate into an existing Next.js app

1. Copy `nextjs/lib/daily-speaking-agent.ts` to `<your project>/lib/daily-speaking-agent.ts`.
2. Copy the two API routes into `<your project>/app/api/daily-speaking/...`.
3. Put `daily-speaking-demo.html` in `<your project>/public/daily-speaking.html` (served at `/daily-speaking.html`).
4. Add a menu item labeled **Luyện giao tiếp hằng ngày / Daily Speaking**, pointing to `/daily-speaking.html`.
5. Set the server-side variables in `.env.local` using `.env.example` as a template. Never expose an OpenAI API key in the browser or a public build.
6. Run your app and confirm that chat replies use the agent endpoint and voice replies use the TTS endpoint. Microphone input uses browser Web Speech Recognition, so browser support varies.
7. In production, add authentication, per-user rate limits, request quotas, privacy and data-retention controls. Consider a robust STT endpoint for browsers that do not support SpeechRecognition.

The preview can also be opened directly as an offline HTML file. In that case, the UI and scripted conversation work, but it is **not** an AI agent. Male TTS cannot be guaranteed by browser voices; the API route requests the `onyx` voice, which should be auditioned to confirm it matches the desired male-sounding US accent.

## Important constraints

- Only **Lesson 01 — My Daily Routine** was available in the provided project materials. Do not auto-assume other lessons exist.
- The content publication approval workflow requires checking Cambridge, COCA and YouGlish before approving fixed lesson audio. Interactive generated dialogue is not the same as a reviewed lesson.
- This package is not installed automatically into an existing application or into ChatGPT's project sidebar. Source code or an integration environment is required for actual menu installation and server deployment.
