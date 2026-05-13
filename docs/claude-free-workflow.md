# Claude Free Collaboration Workflow

Use Claude Free as a lightweight reviewer and content assistant while Codex handles code changes in the repository.

## Roles

- Codex: code edits, wiring API/database, type checks, local verification.
- Claude Free: product critique, accessibility copy, seed content, edge-case review.

## Best Tasks For Claude Free

1. Review one user flow at a time:

```text
You are reviewing Avora, an AI career copilot for people with disabilities.
Focus only on this flow:
Login -> Accessibility profile -> Career assessment -> Job analysis -> Roadmap.

Find missing user steps, confusing wording, accessibility risks, and what should be simplified for an MVP.
Return a short prioritized list.
```

2. Generate realistic seed jobs:

```text
Create 20 realistic job records for an accessibility-first career platform.
Each job needs title, company, location, type, salary range, plain-language description, requirements, benefits, accessibility features, and accessibility score 0-100.
Avoid fake claims like guaranteed accommodation. Keep data suitable for demo seed content.
Return JSON only.
```

3. Improve AI template responses without paid AI calls:

```text
Write template responses for a career assessment chatbot serving people with disabilities.
Tone: respectful, practical, strengths-based, not medical advice.
Create 10 follow-up questions and 5 final summary templates.
```

4. Accessibility review:

```text
Review this UI copy for WCAG-friendly language, cognitive accessibility, and plain language.
Suggest shorter labels and error messages.
Do not rewrite the whole app, only list exact replacements.
```

## Working Rule

Paste Claude's output back into Codex before changing code. Treat Claude as a reviewer, not the source of truth.
