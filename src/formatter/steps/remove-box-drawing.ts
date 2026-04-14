import type { PipelineStep } from '../types'

// Lines composed entirely of box-drawing chars and whitespace (horizontal separators)
const SEPARATOR_LINE = /^[\s\u2500-\u257F\u2580-\u259F]+$/

// Vertical border/separator chars — safe to remove everywhere because
// Markdown tables use ASCII pipe | (U+007C), not Unicode │ (U+2502)
const VERTICAL_CHARS = /[│║┃]/g

export const removeBoxDrawing: PipelineStep = (ctx) => {
  if (!ctx.options.removeBoxDrawing) return ctx

  const cleaned = ctx.text
    .split('\n')
    .filter((line) => !SEPARATOR_LINE.test(line))
    .map((line) => line.replace(VERTICAL_CHARS, ''))
    .join('\n')

  return { ...ctx, text: cleaned }
}
