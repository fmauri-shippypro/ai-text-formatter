# AI Text Formatter

A client-side web app that cleans AI-generated text for pasting into Jira, Slack, email, and other tools.

## What it does

- Strips ANSI escape sequences
- Removes box-drawing and terminal border characters
- Removes invisible Unicode (zero-width spaces, BOM, soft hyphens)
- Normalizes dash variants (em-dash, en-dash) to standard hyphens
- Cleans up irregular whitespace
- Preserves Markdown tables, code blocks, and bullet lists

## Tech Stack

- React 19 + TypeScript
- Vite 7
- TailwindCSS 4
- Vitest (testing)
- Zero runtime dependencies beyond React

## Development

```bash
pnpm install
pnpm dev        # Start dev server
pnpm test       # Run tests in watch mode
pnpm test:run   # Run tests once
pnpm build      # Production build
```

## Deployment

Configured for AWS Amplify. Push to `main` triggers automatic deployment.
