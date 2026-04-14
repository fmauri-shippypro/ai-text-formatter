import type { PipelineStep } from '../types'
import { isPlaceholder } from '../utils/placeholder'

export const dedent: PipelineStep = (ctx) => {
  if (!ctx.options.dedent) return ctx

  const lines = ctx.text.split('\n')

  // Find minimum indentation across non-empty, non-placeholder lines
  let minIndent = Infinity
  for (const line of lines) {
    if (line.trim() === '') continue
    if (isPlaceholder(line)) continue
    const match = line.match(/^( +)/)
    if (match) {
      minIndent = Math.min(minIndent, match[1].length)
    } else {
      minIndent = 0
      break
    }
  }

  if (minIndent === 0 || minIndent === Infinity) return ctx

  const dedented = lines.map((line) => {
    if (line.trim() === '') return line
    if (isPlaceholder(line)) return line
    return line.slice(minIndent)
  })

  return { ...ctx, text: dedented.join('\n') }
}
