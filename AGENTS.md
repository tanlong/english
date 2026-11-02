<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Matt Pocock skills

For future work in this project, use the relevant skills installed from
https://github.com/mattpocock/skills in `.agents/skills/`. Prefer these project
copies over global skills with the same name. Read the matching `SKILL.md`
before applying its workflow:

| Task                                                | Skill                                                                                    |
| --------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Features and bug fixes with behavior changes        | [.agents/skills/tdd/SKILL.md](.agents/skills/tdd/SKILL.md)                               |
| Broken behavior or performance regressions          | [.agents/skills/diagnosing-bugs/SKILL.md](.agents/skills/diagnosing-bugs/SKILL.md)       |
| Module interfaces and architectural changes         | [.agents/skills/codebase-design/SKILL.md](.agents/skills/codebase-design/SKILL.md)       |
| Reviewing a diff against standards and requirements | [.agents/skills/code-review/SKILL.md](.agents/skills/code-review/SKILL.md)               |
| Domain terminology, glossary, or ADRs               | [.agents/skills/domain-modeling/SKILL.md](.agents/skills/domain-modeling/SKILL.md)       |
| UI or logic experiments                             | [.agents/skills/prototype/SKILL.md](.agents/skills/prototype/SKILL.md)                   |
| Research requiring primary sources                  | [.agents/skills/research/SKILL.md](.agents/skills/research/SKILL.md)                     |
| Stress-testing an idea or plan                      | [.agents/skills/grilling/SKILL.md](.agents/skills/grilling/SKILL.md)                     |
| Infrastructure steps only the user can perform      | [.agents/skills/wizard/SKILL.md](.agents/skills/wizard/SKILL.md)                         |
| Editing agent instructions                          | [.agents/skills/writing-for-agents/SKILL.md](.agents/skills/writing-for-agents/SKILL.md) |

For tracker-dependent workflows, use local Markdown tickets under `docs/tickets/`;
create files when needed. The product requirements are in
`MD/English_App_ITBA_Documents/English_App_ITBA.md`. Apply each skill within the
user's requested scope and existing approvals.

Installation provenance and file hashes: `docs/mattpocock-skills.json`.
