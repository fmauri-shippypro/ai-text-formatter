# CLAUDE.md — AI Text Formatter

## Project Overview

Client-side React app that cleans AI-generated text (from Claude Code, ChatGPT, terminals) for pasting into Jira, Slack, email. Zero runtime dependencies beyond React. All processing in-browser.

## Tech Stack

- **React 19** + TypeScript (strict mode) — `src/`
- **Vite 7** — dev server, build tool
- **TailwindCSS 4** — styling via `@tailwindcss/vite` plugin
- **Vitest** + jsdom — testing
- **ESLint 9** + typescript-eslint — linting
- **pnpm 8.15.3** — package manager (pinned via `packageManager` field)
- **Node 20** — required (pinned in CI)

## Commands

```bash
pnpm dev          # Vite dev server at localhost:5173
pnpm test         # Vitest watch mode
pnpm test:run     # Vitest single run (CI)
pnpm lint         # ESLint
pnpm build        # tsc -b && vite build → dist/
pnpm preview      # Serve dist/ locally
```

## Architecture

### Formatter Pipeline (`src/formatter/`)

Core logic. A 17-step pipeline of pure functions `(PipelineContext) => PipelineContext`.

- **`pipeline.ts`** — orchestrates steps, merges options, auto-derives preserve flags for Jira/Slack targets
- **`types.ts`** — `FormatterOptions`, `FormatTarget`, `PipelineContext`, `ProtectedRegion`, `PipelineStep`
- **`steps/`** — one file per transformation step (strip-ansi, normalize-dashes, etc.)
- **`utils/patterns.ts`** — shared regex patterns (ANSI, decorative, dashes, quotes, invisible chars)
- **`utils/placeholder.ts`** — protected region system using placeholder tokens
- **`utils/structure-detector.ts`** — detects tables, code blocks, bullet lists

**Step execution order matters.** Notably:
1. `detectAndProtectStructures` must run before `removeDecorative` (it uses symbols as markers)
2. `restoreProtectedRegions` runs after all cleaning steps
3. `formatForTarget` runs last (wraps code blocks for Slack/Jira)

### Protected Regions

Structured content (tables, code blocks, bullets) is replaced with unique placeholder tokens before cleaning, then restored after. This prevents cleaning steps from destroying intentional formatting. See `utils/placeholder.ts`.

### Components (`src/components/`)

- `Header.tsx` — app header with help toggle
- `FormatSelector.tsx` — radio buttons for Plain/Jira/Slack/Email
- `TextInput.tsx` — input textarea with clear button
- `TextOutput.tsx` — read-only output display
- `CleaningOptions.tsx` — checkboxes for 14 toggle-able cleaning rules
- `HelpPage.tsx` — lazy-loaded documentation page

### Hook (`src/hooks/useFormatter.ts`)

- Manages input/output/options state
- Debounced processing (150ms)
- 500KB input limit with error feedback
- Graceful fallback to original input on pipeline errors

## Testing

Tests live in `tests/formatter/`. 15 test files.

- **Integration tests:** `pipeline.test.ts`, `comprehensive.test.ts`, `real-terminal.test.ts`
- **Unit tests:** `tests/formatter/steps/` — one per pipeline step
- **Fixtures:** `tests/fixtures/` — real terminal output, markdown tables, mixed content

Pattern: test files create a `PipelineContext` with test options and call individual step functions.

Run a single file: `pnpm vitest run tests/formatter/steps/strip-ansi.test.ts`

## Deployment

- **AWS Amplify** — auto-deploy on push to `main` (config: `amplify.yml`)
- **GitHub Actions CI** — runs on push/PR to `main`: type check → tests → build (config: `.github/workflows/ci.yml`)

## Conventions

- All formatter steps are pure functions with signature `(PipelineContext) => PipelineContext`
- New steps go in `src/formatter/steps/` with a corresponding test in `tests/formatter/steps/`
- New steps must be added to the pipeline array in `pipeline.ts` — order matters
- Regex patterns shared across steps go in `utils/patterns.ts`
- No runtime dependencies beyond React — keep it that way
- CSS design tokens are defined as CSS variables in `src/index.css`
- Component props use TypeScript interfaces, no `any`
- Use `pnpm`, not npm or yarn
