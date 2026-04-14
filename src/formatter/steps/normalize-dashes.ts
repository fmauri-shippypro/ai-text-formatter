import type { PipelineStep } from '../types'
import { DASH_VARIANTS } from '../utils/patterns'

export const normalizeDashes: PipelineStep = (ctx) => {
  if (!ctx.options.normalizeDashes) return ctx
  if (ctx.options.preserveDashes) return ctx
  return { ...ctx, text: ctx.text.replace(DASH_VARIANTS, '-') }
}
