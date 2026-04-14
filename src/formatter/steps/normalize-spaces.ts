import type { PipelineStep } from '../types'
import { NBSP } from '../utils/patterns'

export const normalizeSpaces: PipelineStep = (ctx) => {
  if (!ctx.options.normalizeSpaces) return ctx
  return { ...ctx, text: ctx.text.replace(NBSP, ' ') }
}
