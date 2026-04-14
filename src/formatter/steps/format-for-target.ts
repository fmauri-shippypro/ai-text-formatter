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
  const diffs = detectUnfencedDiffs(lines)
  const codeBlocks = detectUnfencedCode(lines, diffs)

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

  // Protect {code} blocks created by wrapDetectedBlocks before
  // heading/bold/table transforms run. Pre-existing blocks are already
  // placeholders (\x00JCODE...\x00) so only new ones match this regex.
  result = result.replace(
    /\{code(?::\w+)?\}[\s\S]*?\{code\}/g,
    (match) => {
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

    // Protect newly created code fences from table/bold transforms
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
