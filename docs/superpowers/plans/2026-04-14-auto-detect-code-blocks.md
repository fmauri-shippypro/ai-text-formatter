# Auto-detect Code Blocks & Diffs Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Automatically detect unfenced code and diffs when target is Slack/Jira, wrapping them in the platform's native code format.

**Architecture:** A new `detect-code-blocks.ts` utility file with pure functions for diff and code detection. The existing `format-for-target.ts` calls these detectors before applying its transformations, only for `jira` and `slack` targets.

**Tech Stack:** TypeScript, Vitest

---

### Task 1: Diff Detection — Tests

**Files:**
- Create: `tests/formatter/steps/detect-code-blocks.test.ts`

- [ ] **Step 1: Write failing tests for diff detection**

```typescript
import { describe, it, expect } from 'vitest'
import { detectUnfencedDiffs, detectUnfencedCode } from '../../../src/formatter/steps/detect-code-blocks'

describe('detect-code-blocks', () => {
  describe('detectUnfencedDiffs', () => {
    it('detects a unified diff block', () => {
      const lines = [
        'Some explanation text',
        '',
        '--- a/src/app.ts',
        '+++ b/src/app.ts',
        '@@ -1,3 +1,4 @@',
        ' import React from "react"',
        '+import { useState } from "react"',
        ' ',
        ' function App() {',
        '',
        'More text after the diff',
      ]
      const result = detectUnfencedDiffs(lines)
      expect(result).toEqual([{ startLine: 2, endLine: 8 }])
    })

    it('detects a diff without file headers (just hunks)', () => {
      const lines = [
        '@@ -10,4 +10,5 @@',
        ' const x = 1',
        '-const y = 2',
        '+const y = 3',
        '+const z = 4',
      ]
      const result = detectUnfencedDiffs(lines)
      expect(result).toEqual([{ startLine: 0, endLine: 4 }])
    })

    it('ignores blocks with fewer than 3 diff lines', () => {
      const lines = [
        '-removed',
        '+added',
      ]
      const result = detectUnfencedDiffs(lines)
      expect(result).toEqual([])
    })

    it('does not treat bullet lists as diffs', () => {
      const lines = [
        '- item one',
        '- item two',
        '- item three',
        '+ another item',
      ]
      const result = detectUnfencedDiffs(lines)
      expect(result).toEqual([])
    })

    it('detects multiple diff blocks', () => {
      const lines = [
        '--- a/file1.ts',
        '+++ b/file1.ts',
        '@@ -1,2 +1,2 @@',
        '-old line',
        '+new line',
        '',
        'Some text in between',
        '',
        '--- a/file2.ts',
        '+++ b/file2.ts',
        '@@ -5,3 +5,3 @@',
        ' context',
        '-removed',
        '+added',
      ]
      const result = detectUnfencedDiffs(lines)
      expect(result).toHaveLength(2)
      expect(result[0]).toEqual({ startLine: 0, endLine: 4 })
      expect(result[1]).toEqual({ startLine: 8, endLine: 13 })
    })
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/formatter/steps/detect-code-blocks.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Commit**

```bash
git add tests/formatter/steps/detect-code-blocks.test.ts
git commit -m "test: add failing tests for diff detection"
```

---

### Task 2: Diff Detection — Implementation

**Files:**
- Create: `src/formatter/steps/detect-code-blocks.ts`

- [ ] **Step 1: Implement diff detection**

```typescript
export interface DetectedBlock {
  startLine: number
  endLine: number
}

// --- a/file or +++ b/file
const DIFF_FILE_HEADER_RE = /^(?:---|\+\+\+)\s+\S/
// @@ -N,N +N,N @@
const DIFF_HUNK_HEADER_RE = /^@@\s+-\d+(?:,\d+)?\s+\+\d+(?:,\d+)?\s+@@/
// +line or -line (but NOT "- text" with space = bullet list)
const DIFF_ADDED_RE = /^\+[^\+\s]|^\+$/
const DIFF_REMOVED_RE = /^-[^-\s]|^-$/
// Context line in a diff: starts with a space (not blank)
const DIFF_CONTEXT_RE = /^ \S/

function isDiffLine(line: string): boolean {
  return (
    DIFF_FILE_HEADER_RE.test(line) ||
    DIFF_HUNK_HEADER_RE.test(line) ||
    DIFF_ADDED_RE.test(line) ||
    DIFF_REMOVED_RE.test(line) ||
    DIFF_CONTEXT_RE.test(line)
  )
}

function isDiffEntryPoint(line: string): boolean {
  return DIFF_FILE_HEADER_RE.test(line) || DIFF_HUNK_HEADER_RE.test(line)
}

export function detectUnfencedDiffs(lines: string[]): DetectedBlock[] {
  const blocks: DetectedBlock[] = []
  let i = 0

  while (i < lines.length) {
    if (!isDiffEntryPoint(lines[i])) {
      i++
      continue
    }

    const start = i
    let diffLineCount = 0

    while (i < lines.length) {
      if (isDiffLine(lines[i]) || DIFF_FILE_HEADER_RE.test(lines[i])) {
        diffLineCount++
        i++
      } else if (lines[i].trim() === '' && i + 1 < lines.length && isDiffLine(lines[i + 1])) {
        // blank line within diff — include it
        i++
      } else {
        break
      }
    }

    // end is inclusive, last non-blank diff line
    let end = i - 1
    while (end > start && lines[end].trim() === '') end--

    if (diffLineCount >= 3) {
      blocks.push({ startLine: start, endLine: end })
    }
  }

  return blocks
}
```

- [ ] **Step 2: Run tests to verify they pass**

Run: `npx vitest run tests/formatter/steps/detect-code-blocks.test.ts`
Expected: All 5 tests PASS

- [ ] **Step 3: Commit**

```bash
git add src/formatter/steps/detect-code-blocks.ts
git commit -m "feat: implement diff detection for unfenced diffs"
```

---

### Task 3: Code Detection — Tests

**Files:**
- Modify: `tests/formatter/steps/detect-code-blocks.test.ts`

- [ ] **Step 1: Add failing tests for code detection**

Append inside the outer `describe('detect-code-blocks', ...)`:

```typescript
  describe('detectUnfencedCode', () => {
    it('detects a block of JavaScript code', () => {
      const lines = [
        'Here is the fix:',
        '',
        'function greet(name) {',
        '  const message = `Hello ${name}`;',
        '  return message;',
        '}',
        '',
        'This should work now.',
      ]
      const result = detectUnfencedCode(lines)
      expect(result).toEqual([{ startLine: 2, endLine: 5 }])
    })

    it('detects a block with import/export statements', () => {
      const lines = [
        'import React from "react"',
        'import { useState } from "react"',
        '',
        'export const App = () => {',
        '  const [count, setCount] = useState(0)',
        '  return <div>{count}</div>',
        '}',
      ]
      const result = detectUnfencedCode(lines)
      expect(result).toEqual([{ startLine: 0, endLine: 6 }])
    })

    it('detects Python code', () => {
      const lines = [
        'def calculate(x, y):',
        '    result = x + y',
        '    return result',
      ]
      const result = detectUnfencedCode(lines)
      expect(result).toEqual([{ startLine: 0, endLine: 2 }])
    })

    it('does not detect regular prose', () => {
      const lines = [
        'This is a normal paragraph of text that describes something.',
        'It has multiple sentences and continues on the next line.',
        'The explanation covers several important points about the topic.',
      ]
      const result = detectUnfencedCode(lines)
      expect(result).toEqual([])
    })

    it('does not detect a single line of code', () => {
      const lines = [
        'const x = 1;',
      ]
      const result = detectUnfencedCode(lines)
      expect(result).toEqual([])
    })

    it('detects code block surrounded by prose', () => {
      const lines = [
        'You need to update the config:',
        '',
        'const config = {',
        '  host: "localhost",',
        '  port: 3000,',
        '};',
        '',
        'Then restart the server.',
      ]
      const result = detectUnfencedCode(lines)
      expect(result).toEqual([{ startLine: 2, endLine: 5 }])
    })

    it('detects terminal command output', () => {
      const lines = [
        '$ npm install react',
        'added 5 packages in 2s',
        '$ npm run build',
        'Build successful',
      ]
      const result = detectUnfencedCode(lines)
      expect(result).toEqual([{ startLine: 0, endLine: 3 }])
    })

    it('handles blank lines within a code block', () => {
      const lines = [
        'function a() {',
        '  return 1',
        '}',
        '',
        'function b() {',
        '  return 2',
        '}',
      ]
      const result = detectUnfencedCode(lines)
      expect(result).toEqual([{ startLine: 0, endLine: 6 }])
    })

    it('skips lines already detected as diffs', () => {
      const lines = [
        '@@ -1,3 +1,3 @@',
        ' const x = 1',
        '-const y = 2',
        '+const y = 3',
      ]
      // When called with skipRanges covering the diff
      const result = detectUnfencedCode(lines, [{ startLine: 0, endLine: 3 }])
      expect(result).toEqual([])
    })
  })
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/formatter/steps/detect-code-blocks.test.ts`
Expected: FAIL — `detectUnfencedCode` not a function

- [ ] **Step 3: Commit**

```bash
git add tests/formatter/steps/detect-code-blocks.test.ts
git commit -m "test: add failing tests for code detection"
```

---

### Task 4: Code Detection — Implementation

**Files:**
- Modify: `src/formatter/steps/detect-code-blocks.ts`

- [ ] **Step 1: Implement code scoring and detection**

Add to the end of `detect-code-blocks.ts`:

```typescript
// ── Code detection heuristics ──

const LANG_KEYWORDS_RE = /^(?:function|const|let|var|import|export|class|interface|type|def|return|from|async|await|if|for|while|switch|case)\b/
const LINE_ENDING_SYNTAX_RE = /[{};)]\s*$/
const OPERATORS_RE = /===|!==|=>|->|::|&&|\|\||<<|>>/
const COMMENT_MARKERS_RE = /^\s*(?:\/\/|\/\*|\*\/|#\s|"""|''')/
const TERMINAL_CMD_RE = /^\s*[$>]\s+\S/
const CAMEL_OR_SNAKE_RE = /[a-z][A-Z]|[a-z]_[a-z]/

// Syntactic punctuation chars for density calculation
const SYNTAX_CHARS = new Set(['{', '}', ';', '(', ')', '[', ']', '<', '>', '=', '/', '#'])

function computeLineScore(line: string): number {
  const trimmed = line.trim()
  if (trimmed === '') return 0 // blank lines are neutral

  let score = 0

  // Strong signals (weight 2)
  if (LANG_KEYWORDS_RE.test(trimmed)) score += 2
  if (LINE_ENDING_SYNTAX_RE.test(trimmed)) score += 2

  // Medium signals (weight 1)
  if (OPERATORS_RE.test(trimmed)) score += 1
  if (COMMENT_MARKERS_RE.test(trimmed)) score += 1
  if (TERMINAL_CMD_RE.test(trimmed)) score += 1
  if (CAMEL_OR_SNAKE_RE.test(trimmed)) score += 1

  // Punctuation density
  const words = trimmed.split(/\s+/).length
  let syntaxCount = 0
  for (const ch of trimmed) {
    if (SYNTAX_CHARS.has(ch)) syntaxCount++
  }
  if (words > 0 && syntaxCount / words > 0.3) score += 1

  // Indentation signal (at least 2 spaces or a tab)
  if (/^(?:\t| {2,})\S/.test(line)) score += 1

  // Anti-signals (weight -1)
  // Long prose line without operators
  if (trimmed.length > 120 && !OPERATORS_RE.test(trimmed) && !LINE_ENDING_SYNTAX_RE.test(trimmed)) {
    score -= 1
  }
  // Ends with natural sentence punctuation (period followed by space or end)
  if (/[.!?]\s*$/.test(trimmed) && !LINE_ENDING_SYNTAX_RE.test(trimmed)) {
    score -= 1
  }

  return score
}

const CODE_LINE_THRESHOLD = 2   // a line needs score >= 2 to count as "looks like code"
const BLOCK_MIN_LINES = 2       // minimum lines to form a code block

export function detectUnfencedCode(
  lines: string[],
  skipRanges: DetectedBlock[] = [],
): DetectedBlock[] {
  const skip = new Set<number>()
  for (const r of skipRanges) {
    for (let i = r.startLine; i <= r.endLine; i++) skip.add(i)
  }

  const blocks: DetectedBlock[] = []
  let blockStart = -1
  let codeLineCount = 0
  let proseStreak = 0

  for (let i = 0; i <= lines.length; i++) {
    // Past-the-end or skipped line: close any open block
    if (i === lines.length || skip.has(i)) {
      if (blockStart !== -1 && codeLineCount >= BLOCK_MIN_LINES) {
        let end = i - 1
        while (end > blockStart && lines[end].trim() === '') end--
        blocks.push({ startLine: blockStart, endLine: end })
      }
      blockStart = -1
      codeLineCount = 0
      proseStreak = 0
      continue
    }

    const line = lines[i]

    if (line.trim() === '') {
      // blank lines don't break a block but don't contribute
      if (blockStart !== -1) continue
      continue
    }

    const score = computeLineScore(line)

    if (score >= CODE_LINE_THRESHOLD) {
      if (blockStart === -1) blockStart = i
      codeLineCount++
      proseStreak = 0
    } else {
      proseStreak++
      if (proseStreak >= 2 && blockStart !== -1) {
        // 2+ consecutive prose lines close the block
        if (codeLineCount >= BLOCK_MIN_LINES) {
          // end before the prose streak
          let end = i - proseStreak
          while (end > blockStart && lines[end].trim() === '') end--
          blocks.push({ startLine: blockStart, endLine: end })
        }
        blockStart = -1
        codeLineCount = 0
        proseStreak = 0
      }
    }
  }

  return blocks
}
```

- [ ] **Step 2: Run tests to verify they pass**

Run: `npx vitest run tests/formatter/steps/detect-code-blocks.test.ts`
Expected: All 14 tests PASS

- [ ] **Step 3: Commit**

```bash
git add src/formatter/steps/detect-code-blocks.ts
git commit -m "feat: implement code detection heuristics"
```

---

### Task 5: Integration with formatForTarget — Tests

**Files:**
- Modify: `tests/formatter/steps/format-for-target.test.ts`

- [ ] **Step 1: Add failing integration tests**

Add the following test blocks inside the main `describe('format-for-target', ...)`, after the existing "mixed content across targets" block:

```typescript
  // ── Auto-detect unfenced code ──

  describe('auto-detect unfenced code (jira)', () => {
    it('wraps detected diff in {code:diff}', () => {
      const input = [
        'Here is the change:',
        '',
        '--- a/src/app.ts',
        '+++ b/src/app.ts',
        '@@ -1,3 +1,4 @@',
        ' import React from "react"',
        '+import { useState } from "react"',
        ' ',
        ' function App() {',
      ].join('\n')
      const result = runPipeline(input, { target: 'jira' })
      expect(result).toContain('{code:diff}')
      expect(result).toContain('{code}')
      expect(result).toContain('+import { useState }')
    })

    it('wraps detected code in {code}', () => {
      const input = [
        'Update your config:',
        '',
        'const config = {',
        '  host: "localhost",',
        '  port: 3000,',
        '};',
      ].join('\n')
      const result = runPipeline(input, { target: 'jira' })
      expect(result).toContain('{code}')
      expect(result).toContain('const config = {')
    })

    it('does not wrap prose as code', () => {
      const input = 'This is a normal paragraph explaining something important.'
      const result = runPipeline(input, { target: 'jira' })
      expect(result).not.toContain('{code}')
    })
  })

  describe('auto-detect unfenced code (slack)', () => {
    it('wraps detected diff in code fence with diff tag', () => {
      const input = [
        'Here is the change:',
        '',
        '@@ -1,3 +1,4 @@',
        ' import React from "react"',
        '+import { useState } from "react"',
        ' ',
        ' function App() {',
      ].join('\n')
      const result = runPipeline(input, { target: 'slack' })
      expect(result).toContain('```diff')
      expect(result).toContain('```')
      expect(result).toContain('+import { useState }')
    })

    it('wraps detected code in code fence', () => {
      const input = [
        'Update your config:',
        '',
        'const config = {',
        '  host: "localhost",',
        '  port: 3000,',
        '};',
      ].join('\n')
      const result = runPipeline(input, { target: 'slack' })
      // Should have ``` wrapping the code
      const fenceCount = (result.match(/```/g) || []).length
      expect(fenceCount).toBeGreaterThanOrEqual(2)
      expect(result).toContain('const config = {')
    })

    it('does not wrap prose as code', () => {
      const input = 'This is a normal paragraph explaining something important.'
      const result = runPipeline(input, { target: 'slack' })
      expect(result).not.toContain('```')
    })
  })

  describe('auto-detect does NOT activate for plain/email', () => {
    it('plain: no wrapping of unfenced code', () => {
      const input = [
        'const config = {',
        '  host: "localhost",',
        '  port: 3000,',
        '};',
      ].join('\n')
      const result = runPipeline(input, { target: 'plain' })
      expect(result).not.toContain('{code}')
      expect(result).not.toContain('```')
    })

    it('email: no wrapping of unfenced code', () => {
      const input = [
        'const config = {',
        '  host: "localhost",',
        '  port: 3000,',
        '};',
      ].join('\n')
      const result = runPipeline(input, { target: 'email' })
      expect(result).not.toContain('{code}')
    })
  })

  describe('auto-detect with already-fenced code', () => {
    it('does not double-wrap code that already has fences', () => {
      const input = [
        '```typescript',
        'const x = 1;',
        '```',
      ].join('\n')
      const result = runPipeline(input, { target: 'jira' })
      expect(result).toBe('{code:typescript}\nconst x = 1;\n{code}')
    })

    it('wraps unfenced code but not already-fenced code', () => {
      const input = [
        '```typescript',
        'const x = 1;',
        '```',
        '',
        'And also this fix:',
        '',
        'function greet(name) {',
        '  return `Hello ${name}`;',
        '}',
      ].join('\n')
      const result = runPipeline(input, { target: 'jira' })
      // Fenced code → {code:typescript}
      expect(result).toContain('{code:typescript}')
      // Unfenced code → {code}
      const codeTagCount = (result.match(/\{code\}/g) || []).length
      // Should have at least 3 {code} tags: closing for typescript + opening + closing for unfenced
      expect(codeTagCount).toBeGreaterThanOrEqual(3)
      expect(result).toContain('function greet(name) {')
    })
  })
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/formatter/steps/format-for-target.test.ts`
Expected: FAIL — unfenced code/diff not wrapped

- [ ] **Step 3: Commit**

```bash
git add tests/formatter/steps/format-for-target.test.ts
git commit -m "test: add failing integration tests for auto-detect code blocks"
```

---

### Task 6: Integration with formatForTarget — Implementation

**Files:**
- Modify: `src/formatter/steps/format-for-target.ts`

- [ ] **Step 1: Integrate detection into toJira and toSlack**

Update `format-for-target.ts`:

```typescript
import type { PipelineStep } from '../types'
import { detectUnfencedDiffs, detectUnfencedCode, type DetectedBlock } from './detect-code-blocks'

// Temporarily replace code blocks with placeholders so that heading/bold/table
// transforms don't corrupt content inside code fences or {code} blocks.
function withProtectedCodeBlocks(
  text: string,
  transform: (text: string) => string,
): string {
  const blocks: string[] = []
  // Protect fenced code blocks (``` or ~~~)
  let safe = text.replace(
    /^(?:```|~~~)[\s\S]*?^(?:```|~~~)\s*$/gm,
    (match) => { blocks.push(match); return `\x00CODE${blocks.length - 1}\x00` },
  )
  safe = transform(safe)
  // Restore code blocks
  safe = safe.replace(/\x00CODE(\d+)\x00/g, (_, idx) => blocks[parseInt(idx)])
  return safe
}

/**
 * Wrap detected unfenced code/diff blocks in platform-native format.
 * Runs AFTER fenced code blocks have been replaced with placeholders,
 * so only truly unfenced content is affected.
 */
function wrapDetectedBlocks(
  text: string,
  target: 'jira' | 'slack',
): string {
  const lines = text.split('\n')

  // First pass: detect diffs
  const diffs = detectUnfencedDiffs(lines)
  // Second pass: detect code, skipping diff ranges
  const codeBlocks = detectUnfencedCode(lines, diffs)

  // Merge and sort in reverse order (bottom-up) so line indices stay valid
  const allBlocks: Array<DetectedBlock & { kind: 'diff' | 'code' }> = [
    ...diffs.map((b) => ({ ...b, kind: 'diff' as const })),
    ...codeBlocks.map((b) => ({ ...b, kind: 'code' as const })),
  ]
  allBlocks.sort((a, b) => b.startLine - a.startLine)

  for (const block of allBlocks) {
    const blockLines = lines.slice(block.startLine, block.endLine + 1)
    const content = blockLines.join('\n')

    let wrapped: string
    if (target === 'jira') {
      const tag = block.kind === 'diff' ? '{code:diff}' : '{code}'
      wrapped = `${tag}\n${content}\n{code}`
    } else {
      const tag = block.kind === 'diff' ? '```diff' : '```'
      wrapped = `${tag}\n${content}\n\`\`\``
    }

    // Replace the lines in-place
    lines.splice(block.startLine, block.endLine - block.startLine + 1, wrapped)
  }

  return lines.join('\n')
}

// ── Jira transformations ──

function toJira(text: string): string {
  // Code fences → {code} (runs on full text including inside protected areas)
  let result = text.replace(
    /^```(\w*)\n([\s\S]*?)^```$/gm,
    (_match, lang: string, code: string) => {
      const attr = lang ? `:${lang}` : ''
      return `{code${attr}}\n${code.trimEnd()}\n{code}`
    },
  )

  // Protect {code} blocks before applying heading/bold/table transforms
  const codeBlocks: string[] = []
  result = result.replace(
    /\{code(?::\w+)?\}[\s\S]*?\{code\}/g,
    (match) => { codeBlocks.push(match); return `\x00JCODE${codeBlocks.length - 1}\x00` },
  )

  // Auto-detect unfenced code/diffs and wrap them
  result = wrapDetectedBlocks(result, 'jira')

  // Protect newly created {code} blocks too
  result = result.replace(
    /\{code(?::\w+)?\}[\s\S]*?\{code\}/g,
    (match) => {
      // Only protect if not already a placeholder
      if (match.startsWith('\x00')) return match
      codeBlocks.push(match)
      return `\x00JCODE${codeBlocks.length - 1}\x00`
    },
  )

  result = result.replace(/^(#{1,6})\s+(.+)$/gm, (_match, hashes: string, title: string) => {
    return `h${hashes.length}. ${title}`
  })
  result = result.replace(/\*\*(.+?)\*\*/g, '*$1*')
  result = result.replace(
    /^(\|.+\|)\n\|[\s:]*-{3,}[\s:]*\|.*$/gm,
    (_match, headerRow: string) => {
      const jiraHeader = headerRow.replace(/\|\s*/g, '|| ').replace(/\s*\|$/g, ' ||')
      return jiraHeader
    },
  )

  // Restore {code} blocks
  result = result.replace(/\x00JCODE(\d+)\x00/g, (_, idx) => codeBlocks[parseInt(idx)])
  return result
}

// ── Slack transformations ──

function toSlack(text: string): string {
  return withProtectedCodeBlocks(text, (safe) => {
    // Auto-detect unfenced code/diffs and wrap them
    safe = wrapDetectedBlocks(safe, 'slack')

    // Protect newly created code fences
    const newBlocks: string[] = []
    safe = safe.replace(
      /^```[\s\S]*?^```$/gm,
      (match) => { newBlocks.push(match); return `\x00SCODE${newBlocks.length - 1}\x00` },
    )

    // Tables → wrap in code block (Slack can't render tables)
    safe = safe.replace(
      /^(\|.+\|)\n(\|[\s:]*-{3,}[\s:]*\|.*)\n((?:\|.+\|\n?)*)/gm,
      (_match, header: string, _sep: string, body: string) => {
        const tableContent = `${header}\n${body}`.trimEnd()
        return '```\n' + tableContent + '\n```'
      },
    )
    safe = safe.replace(/\*\*(.+?)\*\*/g, '*$1*')
    safe = safe.replace(/~~(.+?)~~/g, '~$1~')

    // Restore newly created code fences
    safe = safe.replace(/\x00SCODE(\d+)\x00/g, (_, idx) => newBlocks[parseInt(idx)])
    return safe
  })
}

// ── Email transformations ──

function toEmail(text: string): string {
  return text.replace(
    /^```\w*\n([\s\S]*?)^```$/gm,
    (_match, code: string) => {
      return code
        .trimEnd()
        .split('\n')
        .map((line) => '    ' + line)
        .join('\n')
    },
  )
}

// ── Pipeline step ──

export const formatForTarget: PipelineStep = (ctx) => {
  switch (ctx.options.target) {
    case 'jira':
      return { ...ctx, text: toJira(ctx.text) }
    case 'slack':
      return { ...ctx, text: toSlack(ctx.text) }
    case 'email':
      return { ...ctx, text: toEmail(ctx.text) }
    default:
      return ctx
  }
}
```

- [ ] **Step 2: Run ALL tests to verify they pass**

Run: `npx vitest run`
Expected: All tests PASS, including existing tests (no regressions)

- [ ] **Step 3: Commit**

```bash
git add src/formatter/steps/format-for-target.ts src/formatter/steps/detect-code-blocks.ts
git commit -m "feat: integrate auto-detect code blocks into formatForTarget for Slack/Jira"
```

---

### Task 7: Edge Cases & Regression Tests

**Files:**
- Modify: `tests/formatter/steps/detect-code-blocks.test.ts`

- [ ] **Step 1: Add edge case tests**

Append inside `describe('detect-code-blocks', ...)`:

```typescript
  describe('edge cases', () => {
    it('handles empty input', () => {
      expect(detectUnfencedDiffs([])).toEqual([])
      expect(detectUnfencedCode([])).toEqual([])
    })

    it('handles input that is all blank lines', () => {
      const lines = ['', '', '']
      expect(detectUnfencedDiffs(lines)).toEqual([])
      expect(detectUnfencedCode(lines)).toEqual([])
    })

    it('does not detect markdown bullet lists as code', () => {
      const lines = [
        '- Install dependencies',
        '- Run the build',
        '- Deploy to production',
      ]
      expect(detectUnfencedCode(lines)).toEqual([])
    })

    it('does not detect numbered lists as code', () => {
      const lines = [
        '1. First step',
        '2. Second step',
        '3. Third step',
      ]
      expect(detectUnfencedCode(lines)).toEqual([])
    })

    it('detects code after diff in mixed input', () => {
      const lines = [
        '@@ -1,2 +1,2 @@',
        '-const old = 1',
        '+const new = 2',
        ' const keep = 3',
        '',
        'And also update:',
        '',
        'function helper() {',
        '  return true;',
        '}',
      ]
      const diffs = detectUnfencedDiffs(lines)
      expect(diffs).toHaveLength(1)
      const code = detectUnfencedCode(lines, diffs)
      expect(code).toHaveLength(1)
      expect(code[0].startLine).toBe(7)
    })

    it('placeholder lines from fenced code are not detected as code', () => {
      const lines = [
        'Some text',
        '\x00CODE0\x00',
        'More text',
      ]
      expect(detectUnfencedCode(lines)).toEqual([])
    })
  })
```

- [ ] **Step 2: Run tests to verify they pass**

Run: `npx vitest run tests/formatter/steps/detect-code-blocks.test.ts`
Expected: All tests PASS

- [ ] **Step 3: Run the full test suite for regressions**

Run: `npx vitest run`
Expected: All tests PASS

- [ ] **Step 4: Commit**

```bash
git add tests/formatter/steps/detect-code-blocks.test.ts
git commit -m "test: add edge case tests for auto-detect code blocks"
```
