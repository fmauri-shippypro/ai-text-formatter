# Auto-detect Code Blocks & Diffs for Slack/Jira

**Date:** 2026-04-14
**Status:** Approved

## Problem

When users copy Claude's terminal output and paste it into the formatter, code snippets and diffs often arrive without markdown fences (the terminal strips them). These unfenced blocks are treated as regular text, get mangled by the cleaning pipeline, and are not wrapped in the target platform's code format.

## Solution

Add automatic detection of unfenced code and diffs **only when the target is Slack or Jira**. Detected blocks are wrapped in the platform's native code format. Plain and Email targets are unaffected.

## Detection Heuristics

### Diff Detection (first pass, higher priority)

A block is classified as a diff when it has **3+ consecutive lines** matching these patterns:

- Hunk headers: `@@ ... @@`
- File headers: `--- a/...` and `+++ b/...`
- Added/removed lines: lines starting with `+` or `-` (excluding bullet-list-style `+ text` with space after)
- Context lines between diff lines (no prefix, between +/- lines)

Entry: a `@@` header or a `--- a/` / `+++ b/` pair.
Exit: first line that doesn't match any diff pattern.

### Code Detection (second pass, on remaining text)

A block of **2+ consecutive lines** is classified as code using a scoring system. Each line is scored and the block's aggregate score must exceed a threshold.

**Strong signals (weight: 2):**
- Consistent indentation with spaces/tabs (3+ indented lines in a row)
- Language keywords at typical positions: `function`, `const`, `let`, `var`, `import`, `export`, `class`, `def`, `return`, `if (`, `for (`, `=> {`, `<?php`
- Lines frequently ending with `{`, `}`, `;`, `)` (>50% of block lines)

**Medium signals (weight: 1):**
- High syntactic punctuation density (ratio of `{ } ; ( ) [ ] < > = // # -> ::` to word count)
- Operators: `===`, `!==`, `=>`, `->`, `::`, `&&`, `||`
- Prevalence of camelCase or snake_case identifiers
- String/comment markers: `//`, `/* */`, `#`, `"""`
- Terminal command patterns: lines starting with `$`, `>`

**Anti-signals (weight: -1):**
- Long prose lines (>120 chars without operators)
- Natural punctuation (`.` at end of sentence, commas in prose context)
- No indentation at all across the block

**Threshold:** block average score > 0.6 = code.

### Boundary Detection

- Scanning line-by-line with a sliding window approach
- A code block candidate opens when a line scores above the code threshold
- Single blank lines inside a block do not break it
- 2+ consecutive prose lines close the block
- The block candidate is evaluated as a whole after closing

### Priority

Diff detection runs first (more specific patterns). Code detection runs second on the remaining text. This prevents diffs from being misclassified as generic code.

## Output Format

| Type | Jira | Slack |
|------|------|-------|
| Diff | `{code:diff}...{code}` | `` ```diff...``` `` |
| Code | `{code}...{code}` | `` ```...``` `` |

Single-line code is never wrapped (too high false-positive risk).

## Integration Point

All detection logic lives inside the `formatForTarget` step, which already runs last in the pipeline and has access to the target format.

**Flow within `formatForTarget` (when target is jira or slack):**

1. Extract and protect existing fenced code blocks with placeholders (already implemented)
2. **New:** Run diff detection on unprotected text, wrap matches in target format
3. **New:** Run code detection on remaining unprotected text, wrap matches in target format
4. Continue with existing transformations (headings, bold, tables) which operate only on text outside code blocks

**What does NOT change:**
- Plain and Email: no detection, identical behavior to today
- Already-fenced code blocks: handled as before, detection ignores them (already placeholders)
- Pipeline steps upstream of `formatForTarget`: zero modifications

## File Structure

- `src/formatter/steps/format-for-target.ts` — orchestration, calls detection functions
- `src/formatter/steps/detect-code-blocks.ts` — new file with detection heuristics (diff detector + code detector), exported as pure testable utility

## Tuning Note

The scoring weights and threshold (0.6) are starting values. They should be validated and adjusted through test cases with real Claude terminal output. The test suite should include both positive cases (code/diffs that must be detected) and negative cases (prose that must not be wrapped).

## Scope

- Only active for Slack and Jira targets
- No new dependencies
- No changes to existing pipeline steps or protected regions system
- No UI changes (detection is automatic)
