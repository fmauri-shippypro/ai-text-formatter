export interface DetectedBlock {
  startLine: number
  endLine: number
}

// --- a/file or +++ b/file
const DIFF_FILE_HEADER_RE = /^(?:---|\+\+\+)\s+\S/
// @@ -N,N +N,N @@
const DIFF_HUNK_HEADER_RE = /^@@\s+-\d+(?:,\d+)?\s+\+\d+(?:,\d+)?\s+@@/
// +line or -line (but NOT "- text" with space = bullet list)
const DIFF_ADDED_RE = /^\+[^+\s]|^\+$/
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
      if (isDiffLine(lines[i])) {
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

export function detectUnfencedCode(_lines: string[]): DetectedBlock[] {
  return []
}
