# Contributing

Thank you for helping improve Avora. This project follows a simple GitHub flow.

## Development Setup

```bash
git clone https://github.com/your-fork/avora.git
cd avora
corepack enable
corepack prepare pnpm@9.15.4 --activate
pnpm install
cp .env.example .env
```

## Workflow

1. Create a branch from `main`.
2. Make a focused change.
3. Run `pnpm run test` and `pnpm run build`.
4. Commit with a clear message.
5. Push your branch and open a pull request.

```bash
git checkout -b feature/your-feature
pnpm run test
pnpm run build
git add .
git commit -m "Add your feature"
git push origin feature/your-feature
```

## Pull Request Checklist

- The PR has a clear summary.
- Tests and build pass locally.
- Public API or README changes are documented.
- Accessibility behavior is preserved for user-facing changes.
- No secrets, `.env` files, logs, or generated build output are committed.

## Code Guidelines

- Prefer the existing TypeScript, React, Express, and pnpm workspace patterns.
- Keep changes scoped to the feature or fix.
- Add tests when behavior changes.
- Use clear UI labels and keyboard-accessible controls.
