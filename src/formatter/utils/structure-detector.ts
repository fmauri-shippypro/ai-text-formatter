export interface DetectedRegion {
  startLine: number
  endLine: number
  type: 'table' | 'code-block' | 'bullet-list' | 'tool-output'
}

const TABLE_SEPARATOR_RE = /^\s*\|(\s*:?-{3,}:?\s*\|)+\s*$/

function isTableRow(line: string): boolean {
  const trimmed = line.trim()
  return trimmed.startsWith('|') && trimmed.endsWith('|')
}

function countPipes(line: string): number {
  let count = 0
  for (const ch of line) {
    if (ch === '|') count++
  }
  return count
}

function detectTables(lines: string[]): DetectedRegion[] {
  const regions: DetectedRegion[] = []
  let i = 0

  while (i < lines.length) {
    if (!isTableRow(lines[i])) {
      i++
      continue
    }

    let end = i
    while (end + 1 < lines.length && isTableRow(lines[end + 1])) {
      end++
    }

    const block = lines.slice(i, end + 1)
    const hasSeparator = block.some((line) => TABLE_SEPARATOR_RE.test(line))

    if (hasSeparator && block.length >= 2) {
      const pipeCounts = block.map(countPipes)
      const expectedPipes = pipeCounts[0]
      const consistent = pipeCounts.every((c) => c === expectedPipes)

      if (consistent) {
        regions.push({ startLine: i, endLine: end, type: 'table' })
      }
    }

    i = end + 1
  }

  return regions
}

function detectCodeBlocks(lines: string[]): DetectedRegion[] {
  const regions: DetectedRegion[] = []
  let i = 0

  while (i < lines.length) {
    const trimmed = lines[i].trimStart()
    if (trimmed.startsWith('```') || trimmed.startsWith('~~~')) {
      const fence = trimmed.startsWith('```') ? '```' : '~~~'
      const start = i
      i++

      while (i < lines.length) {
        const inner = lines[i].trimStart()
        if (inner.startsWith(fence) && inner.slice(fence.length).trim() === '') {
          break
        }
        i++
      }

      regions.push({ startLine: start, endLine: i, type: 'code-block' })
    }

    i++
  }

  return regions
}

const BULLET_RE = /^\s*[-*+]\s/
const NUMBERED_RE = /^\s*\d+\.\s/

function isListItem(line: string): boolean {
  return BULLET_RE.test(line) || NUMBERED_RE.test(line)
}

function isContinuationLine(line: string): boolean {
  return line.length > 0 && /^\s+\S/.test(line)
}

function detectBulletLists(lines: string[]): DetectedRegion[] {
  const regions: DetectedRegion[] = []
  let i = 0

  while (i < lines.length) {
    if (!isListItem(lines[i])) {
      i++
      continue
    }

    const start = i
    let end = i
    i++

    while (i < lines.length) {
      if (isListItem(lines[i])) {
        end = i
        i++
      } else if (isContinuationLine(lines[i])) {
        end = i
        i++
      } else {
        break
      }
    }

    if (end >= start) {
      regions.push({ startLine: start, endLine: end, type: 'bullet-list' })
    }
  }

  return regions
}

// ── Claude Code tool output block detection ──

// Matches: ⏺ Write(...), ⏺ Bash(...), Write(...), Bash(...), etc.
const TOOL_HEADER_RE =
  /^\s*(?:⏺\s*)?(?:Write|Read|Edit|Bash|Glob|Grep|Agent|Skill)\s*\(/i

// The ⎿ response marker or heavily indented lines
const TOOL_CONTENT_RE = /^\s{2,}\S/

function detectToolOutputBlocks(lines: string[]): DetectedRegion[] {
  const regions: DetectedRegion[] = []
  let i = 0

  while (i < lines.length) {
    if (!TOOL_HEADER_RE.test(lines[i])) {
      i++
      continue
    }

    const start = i
    let end = i
    i++

    // Consume indented content lines (tool output is always indented)
    while (i < lines.length) {
      const line = lines[i]
      // Blank line within tool output — include it but check if block continues
      if (line.trim() === '') {
        // Look ahead: if the next non-blank line is still indented, this is part of the block
        let peek = i + 1
        while (peek < lines.length && lines[peek].trim() === '') peek++
        if (peek < lines.length && TOOL_CONTENT_RE.test(lines[peek])) {
          end = i
          i++
          continue
        }
        break
      }
      // Another tool header = new block
      if (TOOL_HEADER_RE.test(line)) break
      // Non-indented non-blank line that starts with ⏺ = new Claude Code message
      if (/^\s*⏺/.test(line)) break
      // Content line (indented)
      if (TOOL_CONTENT_RE.test(line)) {
        end = i
        i++
        continue
      }
      // Non-indented line = end of block
      break
    }

    if (end > start) {
      regions.push({ startLine: start, endLine: end, type: 'tool-output' })
    }
  }

  return regions
}

// ── Main detection ──

export function detectStructures(lines: string[]): DetectedRegion[] {
  // Tool output blocks first (highest priority — may contain code, lists, etc.)
  const toolBlocks = detectToolOutputBlocks(lines)

  // Code blocks second
  const codeBlocks = detectCodeBlocks(lines)

  // Merge tool + code blocks for masking
  const maskedRegions = [...toolBlocks, ...codeBlocks]

  const maskedLines = new Set<number>()
  for (const r of maskedRegions) {
    for (let i = r.startLine; i <= r.endLine; i++) maskedLines.add(i)
  }
  const filteredLines = lines.map((line, idx) => maskedLines.has(idx) ? '' : line)

  const tables = detectTables(filteredLines)
  const bulletLists = detectBulletLists(filteredLines)

  const allRegions = [...toolBlocks, ...codeBlocks, ...tables, ...bulletLists]
  allRegions.sort((a, b) => a.startLine - b.startLine)

  return allRegions
}
