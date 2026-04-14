import type { PipelineStep } from '../types'

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
