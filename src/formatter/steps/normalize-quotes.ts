import type { PipelineStep } from '../types'
import { SINGLE_QUOTES, DOUBLE_QUOTES } from '../utils/patterns'

export const normalizeQuotes: PipelineStep = (ctx) => {
  if (!ctx.options.normalizeQuotes) return ctx
  if (ctx.options.preserveQuotes) return ctx
  const text = ctx.text
    .replace(SINGLE_QUOTES, "'")
    .replace(DOUBLE_QUOTES, '"')
  return { ...ctx, text }
}
