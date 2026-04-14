# AI Text Formatter

Client-side text cleaner for AI-generated output. Strips terminal artifacts, normalizes Unicode, and formats for Jira, Slack, email, or plain text — entirely in-browser, zero data leaves your machine.

## Why

Copying text from Claude Code, ChatGPT, terminals, or AI tools into Jira/Slack often brings along ANSI escape codes, box-drawing characters, invisible Unicode, smart quotes, and broken whitespace. This tool runs a configurable 17-step pipeline to clean all of that while preserving the content you actually want (tables, code blocks, bullet lists).

## Features

- **ANSI stripping** — removes terminal color/style escape sequences
- **Box-drawing removal** — cleans `│║┃` and separator lines from tool output
- **Invisible Unicode** — strips zero-width spaces, BOM, soft hyphens
- **Dash normalization** — em-dash, en-dash, figure dash to standard hyphens
- **Smart quote normalization** — curly quotes to straight quotes
- **HTML entity decoding** — `&lt;` `&amp;` `&#39;` etc.
- **Whitespace cleanup** — NBSP, irregular spacing, trailing whitespace, excess blank lines
- **Dedent** — removes common leading indentation
- **Line re-joining** — smart paragraph joining for broken lines
- **Unicode NFC normalization**
- **Structure preservation** — Markdown tables, fenced code blocks, bullet lists are detected and protected before cleaning
- **Auto-detect code blocks** — unfenced code and diffs are automatically wrapped for Slack (```` ``` ````) and Jira (`{code}`)
- **4 format targets** — Plain, Jira, Slack, Email with target-aware defaults

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 19 + TypeScript (strict) |
| Build | Vite 7 |
| Styling | TailwindCSS 4 |
| Testing | Vitest + jsdom |
| Linting | ESLint 9 + typescript-eslint |
| Deploy | AWS Amplify |
| CI | GitHub Actions |
| Runtime deps | **react, react-dom only** |

Node 20 required (pinned in CI). Package manager: pnpm 8.15.3.

## Architecture

```
src/
├── formatter/
│   ├── pipeline.ts          # Orchestrates the 17-step pipeline
│   ├── types.ts             # FormatterOptions, PipelineContext, FormatTarget
│   ├── steps/               # One file per transformation step
│   │   ├── strip-ansi.ts
│   │   ├── decode-html-entities.ts
│   │   ├── normalize-bullets.ts
│   │   ├── detect-structures.ts
│   │   ├── remove-decorative.ts
│   │   ├── remove-box-drawing.ts
│   │   ├── remove-invisible.ts
│   │   ├── normalize-dashes.ts
│   │   ├── normalize-spaces.ts
│   │   ├── normalize-quotes.ts
│   │   ├── normalize-newlines.ts
│   │   ├── unicode-normalize.ts
│   │   ├── whitespace-cleanup.ts
│   │   ├── dedent.ts
│   │   ├── rejoin-lines.ts
│   │   ├── final-cleanup.ts
│   │   ├── detect-code-blocks.ts
│   │   └── format-for-target.ts
│   └── utils/
│       ├── patterns.ts      # Shared regex patterns
│       ├── placeholder.ts   # Protected region token system
│       └── structure-detector.ts
├── components/
│   ├── Header.tsx
│   ├── FormatSelector.tsx
│   ├── TextInput.tsx
│   ├── TextOutput.tsx
│   ├── CleaningOptions.tsx
│   └── HelpPage.tsx         # Lazy-loaded
├── hooks/
│   └── useFormatter.ts      # Debounced formatting + state
├── App.tsx
├── main.tsx
└── index.css                # Design tokens + TailwindCSS
```

### Pipeline

Each step is a pure function `(PipelineContext) => PipelineContext`. The pipeline:

1. Normalizes newlines (`\r\n` to `\n`)
2. Strips ANSI escape sequences
3. Decodes HTML entities
4. Normalizes bullet characters
5. **Detects and protects** tables, code blocks, bullet lists (placeholder tokens)
6. Removes decorative symbols
7. Removes box-drawing characters
8. Removes invisible Unicode
9. Normalizes dashes
10. Normalizes spaces (NBSP)
11. Normalizes quotes
12. Unicode NFC normalization
13. Whitespace cleanup
14. Dedent
15. Re-joins broken lines
16. Final cleanup
17. **Restores** protected regions
18. Formats for target (Slack/Jira code wrapping)

Steps 5 and 17 use a placeholder token system — structured content is replaced with unique markers before cleaning, then restored after, so tables and code blocks pass through untouched.

## Getting Started

```bash
# Prerequisites: Node 20+, pnpm
corepack enable

# Install
pnpm install

# Dev server (http://localhost:5173)
pnpm dev

# Run tests (watch mode)
pnpm test

# Run tests once
pnpm test:run

# Lint
pnpm lint

# Production build (outputs to dist/)
pnpm build

# Preview production build
pnpm preview
```

## Testing

15 test files covering unit and integration scenarios:

```
tests/
├── formatter/
│   ├── pipeline.test.ts          # End-to-end pipeline tests
│   ├── comprehensive.test.ts     # Cross-cutting scenarios
│   ├── real-terminal.test.ts     # Real terminal output fixtures
│   └── steps/                    # Per-step unit tests
│       ├── strip-ansi.test.ts
│       ├── remove-box-drawing.test.ts
│       ├── detect-code-blocks.test.ts
│       └── ...
└── fixtures/
    ├── terminal-output.txt
    ├── markdown-table.txt
    └── mixed-content.txt
```

Run a specific test file:

```bash
pnpm vitest run tests/formatter/steps/strip-ansi.test.ts
```

## Deployment

**AWS Amplify** — push to `main` triggers automatic build and deploy.

Build pipeline (`amplify.yml`):
1. `corepack enable` + `pnpm install --frozen-lockfile`
2. `pnpm run build` (TypeScript check + Vite build)
3. Serve `dist/`

**CI** (GitHub Actions on push/PR to `main`):
1. Type check (`tsc -b`)
2. Tests (`pnpm test:run`)
3. Build (`pnpm build`)

## Privacy

All processing happens client-side in the browser. No text is transmitted to any server. The app has a Content Security Policy header restricting script execution to same-origin only.

## License

Private.
