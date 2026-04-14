import { describe, it, expect } from 'vitest'
import { normalizeBullets } from '../../../src/formatter/steps/normalize-bullets'
import type { PipelineContext } from '../../../src/formatter/types'
import { DEFAULT_OPTIONS } from '../../../src/formatter/types'

function makeCtx(text: string): PipelineContext {
  return { text, protectedRegions: [], options: { ...DEFAULT_OPTIONS } }
}

describe('normalizeBullets', () => {
  it('converts bullet • to markdown dash', () => {
    expect(normalizeBullets(makeCtx('• item 1\n• item 2')).text)
      .toBe('- item 1\n- item 2')
  })

  it('converts various fancy bullets', () => {
    expect(normalizeBullets(makeCtx('▸ item')).text).toBe('- item')
    expect(normalizeBullets(makeCtx('➤ item')).text).toBe('- item')
    expect(normalizeBullets(makeCtx('› item')).text).toBe('- item')
    expect(normalizeBullets(makeCtx('◦ item')).text).toBe('- item')
  })

  it('preserves indentation', () => {
    expect(normalizeBullets(makeCtx('  • nested item')).text)
      .toBe('  - nested item')
  })

  it('does not touch regular dashes', () => {
    expect(normalizeBullets(makeCtx('- already markdown')).text)
      .toBe('- already markdown')
  })

  it('does not touch bullets mid-line', () => {
    expect(normalizeBullets(makeCtx('text with • inside')).text)
      .toBe('text with • inside')
  })

  it('skips when option is disabled', () => {
    const ctx = makeCtx('• item')
    ctx.options.normalizeBullets = false
    expect(normalizeBullets(ctx).text).toBe('• item')
  })
})
