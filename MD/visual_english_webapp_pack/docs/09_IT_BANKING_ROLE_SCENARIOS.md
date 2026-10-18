# 09 — IT BANKING ROLE TRACKS: ITBA • UX • UI • PM • DEVELOPER • PO

**Version:** v1.1 · **Audience:** Vietnamese working adults who need natural US-English conversations in banking technology teams and ordinary everyday situations.

## 1. Role taxonomy (locked)

| Slug | Role | Việc thường trao đổi | Phân biệt quan trọng |
|---|---|---|---|
| `itba` | IT Business Analyst | business requirements, acceptance criteria, UAT, clarifying flows | Hiểu bài toán/nghiệp vụ và chuyển yêu cầu thành giải pháp rõ ràng |
| `ux` | UX Designer | research findings, user journey, usability, interaction flow | Tập trung trải nghiệm/hành vi/người dùng |
| `ui` | UI Designer | screen details, components, spacing, accessibility, visual states | Tập trung thành phần hiển thị/thiết kế giao diện |
| `pm` | Project Manager | delivery, timeline, dependencies, resources, risks | Quản lý tiến độ và triển khai dự án |
| `developer` | Software Developer | implementation, API, code review, bugs, testing, release | Triển khai và giải thích kỹ thuật rõ ràng |
| `po` | Product Owner | product goal, backlog, user stories, priority, business value | Quyết định thứ tự ưu tiên/giá trị sản phẩm, **không đồng nhất PM** |

Every role shares the 52-week everyday English foundation. Role preference personalizes **visual scenes, partner roles, dialogue tasks, jargon examples**; it does not remove listening/speaking practice or the 20% Carnegie-inspired interpersonal content.

## 2. Everyday situations in Vietnam are shared across ALL roles

| Situation | Natural English chunk | Real-life intent |
|---|---|---|
| Chào đồng nghiệp ở quán cà phê | How's your morning going? | Open small talk |
| Ăn trưa gần văn phòng | Are you joining us for lunch? | Invite politely |
| Kẹt xe trên đường đi làm | Traffic was pretty bad this morning. | Explain delay |
| Gửi tin nhắn xin dời họp | Could we move the meeting to two? | Reschedule |
| Nhờ đồng nghiệp nói lại | Sorry, could you say that again? | Repair misunderstanding |
| Xin cập nhật ngắn | Any updates on this? | Ask for status |
| Có lịch cá nhân | I've got an appointment this afternoon. | State availability |
| Kết thúc cuộc trao đổi | Thanks for the update. I'll follow up later. | Close and follow up |

## 3. Role-specific scenarios and natural utterances (sample drafts)

### ITBA
- Clarify a rule: **Could you explain what happens when the payment fails?**
- Confirm requirement: **Let me make sure I understand the requirement.**
- Discuss UAT: **Can we test this case again?**
- Coordinate with Developer: **What information do you need from me?**

### UX Designer
- Present a flow: **Let me walk you through the user journey.**
- Seek opinion: **Does this flow make sense to you?**
- Discuss usability: **Users may have trouble finding this option.**
- Ask for feedback: **What would you change here?**

### UI Designer
- Review screen: **Can you check the spacing on this screen?**
- Explain state: **We need a clearer error message here.**
- Coordinate with Dev: **I'll share the updated design.**
- Compare variants: **Which version is easier to read?**

### Project Manager (PM)
- Update status: **We're still on track for Friday.**
- Flag a risk: **We might need more time to finish this.**
- Align ownership: **Who's taking care of this task?**
- Close meeting: **Let's confirm the next steps before we finish.**

### Developer
- Report bug: **I found a bug in the latest update.**
- Explain blocker: **I'm waiting for the API response before I can finish.**
- Request clarification: **What should happen when the user taps this button?**
- Discuss release: **The fix is ready, but we still need to test it.**
- Ask PO/BA: **Could you clarify the expected result?**

### Product Owner (PO)
- Prioritize: **Which feature should we work on first?**
- Clarify value: **What problem are we trying to solve for the user?**
- Refine backlog: **Let's break this user story into smaller tasks.**
- Confirm scope: **This feature is important, but it can wait until the next release.**
- Negotiate trade-off: **If we do this now, what will we need to delay?**

**Content status:** these lines are **examples for design**, not approved learner lessons. Check contemporary US usage, terminology and audio before publication. All mock bank workflows are fictional and sanitized.

## 4. Role-play partner pairing matrix

| Learner role | Primary interlocutors | Transfer scenario |
|---|---|---|
| ITBA | PO, Developer, stakeholder, QA | Turn a vague request into a clear requirement |
| UX | PO, UI, ITBA, user researcher | Explain a user journey and ask for feedback |
| UI | UX, Developer, QA, PO | Hand over screen specs and clarify edge states |
| PM | Developer, PO, ITBA, stakeholder | Renegotiate timeline after a blocker |
| Developer | ITBA, PO, QA, UI | Ask what to build and describe a bug or API issue |
| PO | PM, ITBA, Developer, UX/UI, stakeholder | Prioritize a feature and explain a trade-off |

## 5. Proposed mapping across the existing 52 weeks

| Week | Shared core | ITBA | UX | UI | PM | Developer | PO |
|---:|---|---|---|---|---|---|---|
| 18 | Introduce your job | Explain BA work | Describe research | Describe UI | Explain PM scope | Explain coding tasks | Explain product ownership |
| 19 | Teamwork | Ask clarifying Q | Feedback on flow | Handoff details | Delegate | Ask about API | Align priority |
| 20 | Task updates | Requirement progress | User testing progress | Component progress | Milestones | Bug fix update | Backlog progress |
| 21 | Asking for help | Business rule | Need research input | Need assets | Need help from team | Need logs/mock API | Need stakeholder decision |
| 22 | Meetings | Clarify acceptance | Present UX option | Present UI option | Lead agenda | Explain technical options | Decide next priority |
| 23 | Explain technology | Explain flow | Explain user journey | Explain form states | Explain risk | Explain API/bug in plain English | Explain why feature matters |
| 24 | Problem solving | UAT issue | Usability concern | UI defect | Scope change | Debugging / hotfix | Reorder backlog |
| 25 | Coworker small talk | Lunch chat | Coffee break | Team activity | Check-in | Informal dev chat | Build trust |
| 41 | Negotiation | Scope of requirement | Research timing | Rework trade-off | Delivery timeline | Implementation feasibility | Value vs cost |
| 49 | Integration | Stakeholder review | UX handoff | UI handoff | Release plan | Code/test handoff | Product review |
| 50 | Simulation | BA+Dev+PO | UX+UI+PO | UI+Dev+BA | PM+Dev+PO | Dev+BA+PO | PO+PM+BA |

## 6. Speaking task template (build-ready)

```yaml
scenario_id: ne_w20_developer_status
week: 20
roles: [developer, itba]
setting: fictional_bank_it_office
intent: communicate status + ask for missing information
image_scene_id: IT-11
opening_audio_en: 'Do you have an update on the issue?'
learner_goal_en: 'Explain what is done, what remains, and ask one clarifying question.'
sample_target_en: 'I found the bug, but I still need more time to test the fix.'
follow_up_en: 'What do you need from our team?'
scoring:
  - main_intent_understood
  - status_explained
  - clarification_requested
  - conversational_politeness
no_real_customer_data: true
```

## 7. Image/prompt requirements for Developer and PO

- **Developer:** `char_quan`, `env_dev`, laptop with abstract non-readable elements, review collaboration, test device, safe generic software diagrams. Never generate actual sensitive code, access tokens, real hostnames, deployment screens or financial transaction data.
- **PO:** `char_thao`, `env_product`, simple unlabeled color-coded backlog cards, conversation with PM/BA/Developer, hand gestures indicating priority/scope, no sensitive project plan or real roadmap.
- Keep dominant action obvious; no preschool vocabulary stickers; original illustration supplies context while correct English text is rendered in HTML outside image.

## 8. Acceptance criteria

1. Onboarding allows **six distinct** roles: ITBA, UX, UI, PM, Developer, PO, plus General.
2. The same general listening/speaking foundation is offered to every role.
3. Developer has at least bug/implementation/API/release tasks; PO has backlog/story/priority/value tasks.
4. PO and PM have distinct situations and wording; mixed-role meetings give learner meaningful questions.
5. Workplace English remains comprehensible at the current level; technical jargon is explained after a basic version.
6. Any AI-generated dynamic conversation is not mislabeled as approved vocabulary coverage; privacy and customer-data constraints apply.
