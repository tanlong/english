# SAMPLE PROMPT SHOT LIST — 32 PRIORITY ASSETS

**How to use:** combine each row with the full master prefix and negative restrictions from `01_IMAGE_PROMPT_SYSTEM.md`. Scene descriptions are art briefs; the learner sentence is OVERLAID by web app, not rendered in the image. Art direction sample is a proposal, not a completed AI image set.

## A. Daily life — Weeks 01–08

| ID | Topic / ratio | Scene brief and focal props | Target utterance or scenario (separate UI) |
|---|---|---|---|
| DL-01 | Morning / 4:5 | Adult father waking in Vietnamese apartment, sunrise, clearly getting out of bed, bedside clock only in practice scene | I usually get up around five forty. |
| DL-02 | Get ready / 4:5 | Adult father putting work items in bag in front of mirror, morning household | I get ready for work. |
| DL-03 | Family / 4:5 | Father gently wakes school-age son, supportive family atmosphere | I wake my son up around six. |
| DL-04 | School drop-off / 4:5 | Adult father waving to son at recognizable school gate, child walking inside | I drop my son off at school. |
| DL-05 | Café / 4:5 | Adult office worker getting breakfast and coffee at Vietnamese café on commute | I get breakfast on the way to work. |
| DL-06 | Office lobby / 4:5 | Man entering elevator at office with laptop bag, generic level buttons (no text needed) | I take the elevator up. |
| DL-07 | Commuting / 16:9 | Safe street scene with adult riding motorbike helmeted on journey, no private address | I usually ride to work. |
| DL-08 | Weekend / 16:9 | Adult friends meeting at a relaxed café, warm casual mood | What do you usually do on weekends? |

## B. IT banking workplace — Weeks 18–26 and 49

| ID | Topic / ratio | Scene brief and focal props | Target utterance or scenario (separate UI) |
|---|---|---|---|
| IT-01 | My Job / 16:9 | ITBA adult introduces role to English-speaking coworker in neutral office | I work as a business analyst. |
| IT-02 | UX review / 16:9 | UX designer gestures toward **abstract** screen flow on tablet as BA listens | Let's review the user flow. |
| IT-03 | UI review / 4:5 | UI designer checks spacing/colors on generic fictional banking-app mock screens | Could you check this screen? |
| IT-04 | Status update / 16:9 | PM leads short stand-up, adults attentive, sticky-note board with no readable words | We're still working on this task. |
| IT-05 | Requirement / 16:9 | BA asks stakeholder for detail in meeting room, open notebook, friendly expression | Could you explain the requirement? |
| IT-06 | Timeline / 4:5 | PM points to simple abstract gantt-like bars without numbers/text, colleague listening | We need more time to finish this. |
| IT-07 | Blocker / 16:9 | Developer concerned about issue, QA coworker offering help by laptop, healthy interaction | We're having an issue with the latest update. |
| IT-08 | QA/UAT / 16:9 | Test engineer demonstrates generic mobile test screen to BA, no real customer info | Let's test this again. |
| IT-09 | Clarification / 16:9 | Coworker politely raises hand and asks a question during a team discussion | Could you say that again? |
| IT-10 | Project handoff / 16:9 | Designer and developer exchange tablet with harmless abstract wireframes | I'll send you the latest design. |
| IT-11 | Developer bug report / 16:9 | Developer Quan explains a failing mock test on generic laptop to QA Huy, no readable code | I found a bug in the latest update. |
| IT-12 | Developer API clarification / 16:9 | Developer Quan asks ITBA Minh about integration behavior using schematic boxes | Can you explain how this API should work? |
| IT-13 | PO backlog priority / 16:9 | PO Thao discusses two competing generic feature cards with PM Anna | Which task should we work on first? |
| IT-14 | PO user-story refinement / 16:9 | PO Thao clarifies the goal of a fictional digital-banking feature with ITBA Minh and developer Quan | Let's make sure we understand what users need. |

## C. Coworker small talk / Carnegie — Weeks 02, 19, 25, 33, 44

| ID | Topic / ratio | Scene brief and focal props | Target utterance or scenario (separate UI) |
|---|---|---|---|
| SS-01 | Greeting / 4:5 | Two adult colleagues warmly greeting near office coffee corner | How's your day going? |
| SS-02 | Interest / 16:9 | Colleague shows an image from vacation on personal phone; listener engaged but phone screen indistinct | Tell me more about it. |
| SS-03 | Active listening / 16:9 | One colleague speaks calmly about a concern, other person listens empathetically | I see what you mean. |
| SS-04 | Constructive disagreement / 16:9 | PM and BA respectfully compare alternatives at meeting table | That's a good point. What about this option? |
| SS-05 | Appreciation / 4:5 | Two adults after successful collaboration, modest appreciative handshake | Thanks for your help today. |
| SS-06 | Follow-up / 16:9 | Colleagues continuing a coffee break, one asking a thoughtful follow-up | What happened next? |

## D. Assessment-safe neutral art

| ID | Topic / ratio | Prompt restriction |
|---|---|---|
| AS-01 | Appointment / 16:9 | Adult coworkers in office corridor, NO clocks/calendars, no answer-bearing time clues; audio tests rescheduling |
| AS-02 | Task update / 16:9 | Neutral meeting room and abstract laptops, NO visible progress bars that give correct stage; audio supplies progress |
| AS-03 | Café / 16:9 | Two adults in café, no visible ordered dish/receipt; audio question asks order |
| AS-04 | Commute / 16:9 | Two coworkers outdoors without visible means of transport; audio question asks vehicle choice |

## Batch order and design reviews

1. Approve `char_minh`, `char_lan`, `char_anna`, `char_quan`, `char_thao`, `char_huy`, `char_david` master references and `env_office_open`/`env_home_morning` look.
2. Produce 4 scenes: DL-01, DL-04, IT-02, SS-03 — verify both adult context and artwork consistency.
3. Establish approved 16:9 and 4:5 crops; only then batch the other 28 assets.
4. Run scene-vs-sentence check and no-baked-text/no-sensitive-data QA.
5. Add content manifest links only to **approved** and licensed image variants.

## Model prompt example — IT-04 (full scene draft)

```text
Friendly Professional Visual English style. High-quality polished 2D digital storybook illustration for Vietnamese working adults, bright professional blue palette with warm yellow accents, softly painted light and clear navy outlines, realistic adult proportions, pleasant expressions. A female project manager in her mid-30s wearing a tasteful office blazer runs a short stand-up with three adult coworkers (IT business analyst, UX designer and developer) in a modern bright bank technology office. One coworker briefly explains a work update while others listen, transparent respectful communication, generic blank task board with color-coded shapes but no readable words or names. Medium-wide eye-level landscape 16:9 composition; main speaking coworker clearly visible and another listening; no bank logo, client information or real dashboard, no generated text, no chibi, no 3D, no photo styling, no overcrowding. Match approved character references exactly.
```
