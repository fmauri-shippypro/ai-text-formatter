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

// ── Code detection heuristics ──

const LANG_KEYWORDS_RE = /^(?:function|const|let|var|import|export|class|interface|type|def|return|from|async|await|if|for|while|switch|case)\b/
// Trailing syntax chars that end code lines (including comma for object/array props)
const LINE_ENDING_SYNTAX_RE = /[{};),]\s*$/
const OPERATORS_RE = /===|!==|=>|->|::|&&|\|\||<<|>>/
const COMMENT_MARKERS_RE = /^\s*(?:\/\/|\/\*|\*\/|#\s|"""|''')/
// Terminal prompt: $ or > followed by a non-space char — weight 2 (strong signal)
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
  if (TERMINAL_CMD_RE.test(trimmed)) score += 2

  // Medium signals (weight 1)
  if (OPERATORS_RE.test(trimmed)) score += 1
  if (COMMENT_MARKERS_RE.test(trimmed)) score += 1
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
  let lastCodeLine = -1
  let pendingBlanks = 0   // blank lines buffered since the last code line
  let proseStreak = 0

  function closeBlock(endLine?: number) {
    if (blockStart !== -1 && codeLineCount >= BLOCK_MIN_LINES) {
      blocks.push({ startLine: blockStart, endLine: endLine ?? lastCodeLine })
    }
    blockStart = -1
    codeLineCount = 0
    lastCodeLine = -1
    pendingBlanks = 0
    proseStreak = 0
  }

  for (let i = 0; i <= lines.length; i++) {
    // Past-the-end or skipped line: close any open block
    if (i === lines.length || skip.has(i)) {
      // If we have a trailing prose streak (no preceding blank), include those lines
      const physicalEnd = i - 1
      if (blockStart !== -1 && proseStreak > 0 && pendingBlanks === 0) {
        // Trailing prose directly attached to code: include up to last non-blank physical line
        let end = physicalEnd
        while (end > blockStart && lines[end].trim() === '') end--
        closeBlock(end)
      } else {
        closeBlock()
      }
      continue
    }

    const line = lines[i]

    if (line.trim() === '') {
      if (blockStart !== -1) {
        pendingBlanks++
      }
      continue
    }

    const score = computeLineScore(line)

    if (score >= CODE_LINE_THRESHOLD) {
      if (blockStart === -1) blockStart = i
      codeLineCount++
      lastCodeLine = i
      pendingBlanks = 0
      proseStreak = 0
    } else {
      if (blockStart !== -1) {
        if (pendingBlanks > 0) {
          // A blank line preceded this prose → blank acts as separator, close the block
          closeBlock()
        } else {
          proseStreak++
          if (proseStreak >= 2) {
            // 2+ consecutive prose lines (no blank between them) also close the block
            closeBlock()
          }
        }
      }
      // prose line outside a block or after close: just reset pending state
      pendingBlanks = 0
    }
  }

  return blocks
}
