import { describe, it, expect } from 'vitest'
import { normalizeDashes } from '../../../src/formatter/steps/normalize-dashes'
import type { PipelineContext } from '../../../src/formatter/types'
import { DEFAULT_OPTIONS } from '../../../src/formatter/types'

function makeCtx(text: string): PipelineContext {
  return { text, protectedRegions: [], options: { ...DEFAULT_OPTIONS } }
}

describe('normalizeDashes', () => {
  it('replaces em-dash', () => {
    expect(normalizeDashes(makeCtx('hello\u2014world')).text).toBe('hello-world')
  })

  it('replaces en-dash', () => {
    expect(normalizeDashes(makeCtx('1\u201310')).text).toBe('1-10')
  })

  it('replaces figure dash', () => {
    expect(normalizeDashes(makeCtx('a\u2012b')).text).toBe('a-b')
  })

  it('replaces horizontal bar', () => {
    expect(normalizeDashes(makeCtx('a\u2015b')).text).toBe('a-b')
  })

  it('preserves regular hyphens', () => {
    expect(normalizeDashes(makeCtx('well-known')).text).toBe('well-known')
  })
})
