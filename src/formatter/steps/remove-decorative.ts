import type { PipelineStep } from '../types'
import { DECORATIVE, AI_ARTIFACT_PATTERNS } from '../utils/patterns'

export const removeDecorative: PipelineStep = (ctx) => {
  if (!ctx.options.removeDecorative) return ctx

  let text = ctx.text

  for (const pattern of AI_ARTIFACT_PATTERNS) {
    text = text.replace(pattern, '')
  }

  text = text.replace(DECORATIVE, '')

  return { ...ctx, text }
}
