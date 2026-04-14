import { describe, it, expect } from 'vitest'
import { removeInvisible } from '../../../src/formatter/steps/remove-invisible'
import type { PipelineContext } from '../../../src/formatter/types'
import { DEFAULT_OPTIONS } from '../../../src/formatter/types'

function makeCtx(text: string): PipelineContext {
  return { text, protectedRegions: [], options: { ...DEFAULT_OPTIONS } }
}

describe('removeInvisible', () => {
  it('removes zero-width space', () => {
    expect(removeInvisible(makeCtx('he\u200Bllo')).text).toBe('hello')
  })

  it('removes BOM', () => {
    expect(removeInvisible(makeCtx('\uFEFFhello')).text).toBe('hello')
  })

  it('removes soft hyphen', () => {
    expect(removeInvisible(makeCtx('hel\u00ADlo')).text).toBe('hello')
  })

  it('removes word joiner', () => {
    expect(removeInvisible(makeCtx('hel\u2060lo')).text).toBe('hello')
  })

  it('preserves visible characters', () => {
    expect(removeInvisible(makeCtx('hello world')).text).toBe('hello world')
  })
})
