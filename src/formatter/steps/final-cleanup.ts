import type { PipelineStep } from '../types'

export const finalCleanup: PipelineStep = (ctx) => {
  const text = ctx.text.replace(/\n{3,}/g, '\n\n').trim()
  return { ...ctx, text }
}
