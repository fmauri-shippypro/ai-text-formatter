import type { PipelineStep } from '../types'

export const normalizeNewlines: PipelineStep = (ctx) => {
  if (!ctx.options.normalizeNewlines) return ctx
  return { ...ctx, text: ctx.text.replace(/\r\n/g, '\n').replace(/\r/g, '\n') }
}
