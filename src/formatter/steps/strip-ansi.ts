import type { PipelineStep } from '../types'
import { ANSI_REGEX } from '../utils/patterns'

export const stripAnsi: PipelineStep = (ctx) => {
  if (!ctx.options.stripAnsi) return ctx
  return { ...ctx, text: ctx.text.replace(ANSI_REGEX, '') }
}
