import type { PipelineStep } from '../types'

export const unicodeNormalize: PipelineStep = (ctx) => {
  if (!ctx.options.unicodeNormalize) return ctx
  return { ...ctx, text: ctx.text.normalize('NFC') }
}
