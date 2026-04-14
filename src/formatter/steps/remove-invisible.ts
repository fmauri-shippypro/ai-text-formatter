import type { PipelineStep } from '../types'
import { INVISIBLE } from '../utils/patterns'

export const removeInvisible: PipelineStep = (ctx) => {
  if (!ctx.options.removeInvisible) return ctx
  return { ...ctx, text: ctx.text.replace(INVISIBLE, '') }
}
