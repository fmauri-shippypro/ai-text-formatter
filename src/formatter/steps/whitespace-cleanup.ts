import type { PipelineStep } from '../types'

export const whitespaceCleanup: PipelineStep = (ctx) => {
  if (!ctx.options.cleanWhitespace) return ctx

  const cleaned = ctx.text
    .split('\n')
    .map((line) => {
      // Whitespace-only lines become empty
      if (line.trim() === '') return ''

      const match = line.match(/^(\s*)(.*)$/)
      if (!match) return line
      const [, indent, rest] = match
      return indent + rest.replace(/ {2,}/g, ' ').trimEnd()
    })
    .join('\n')

  return { ...ctx, text: cleaned }
}
