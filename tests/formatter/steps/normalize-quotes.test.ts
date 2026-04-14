import { describe, it, expect } from 'vitest'
import { normalizeQuotes } from '../../../src/formatter/steps/normalize-quotes'
import type { PipelineContext } from '../../../src/formatter/types'
import { DEFAULT_OPTIONS } from '../../../src/formatter/types'

function makeCtx(text: string): PipelineContext {
  return { text, protectedRegions: [], options: { ...DEFAULT_OPTIONS } }
}

describe('normalizeQuotes', () => {
  it('converts left/right single smart quotes to straight', () => {
    expect(normalizeQuotes(makeCtx('\u2018hello\u2019')).text).toBe("'hello'")
  })

  it('converts left/right double smart quotes to straight', () => {
    expect(normalizeQuotes(makeCtx('\u201Chello\u201D')).text).toBe('"hello"')
  })

  it('preserves regular quotes', () => {
    expect(normalizeQuotes(makeCtx("it's \"fine\"")).text).toBe("it's \"fine\"")
  })

  it('skips when option is disabled', () => {
    const ctx = makeCtx('\u201Chello\u201D')
    ctx.options.normalizeQuotes = false
    expect(normalizeQuotes(ctx).text).toBe('\u201Chello\u201D')
  })
})
