import type { PipelineStep } from '../types'

const FANCY_BULLETS = /^(\s*)[•◦▪▸▹➤➜›]\s?/gm

export const normalizeBullets: PipelineStep = (ctx) => {
  if (!ctx.options.normalizeBullets) return ctx
  return { ...ctx, text: ctx.text.replace(FANCY_BULLETS, '$1- ') }
}
