import { describe, it, expect } from 'vitest'
import { whitespaceCleanup } from '../../../src/formatter/steps/whitespace-cleanup'
import type { PipelineContext } from '../../../src/formatter/types'
import { DEFAULT_OPTIONS } from '../../../src/formatter/types'

function makeCtx(text: string): PipelineContext {
  return { text, protectedRegions: [], options: { ...DEFAULT_OPTIONS } }
}

describe('whitespaceCleanup', () => {
  it('collapses multiple spaces', () => {
    expect(whitespaceCleanup(makeCtx('hello    world')).text).toBe('hello world')
  })

  it('trims trailing whitespace', () => {
    expect(whitespaceCleanup(makeCtx('hello   ')).text).toBe('hello')
  })

  it('preserves leading indentation', () => {
    expect(whitespaceCleanup(makeCtx('  indented  text')).text).toBe('  indented text')
  })

  it('handles mixed indentation and trailing', () => {
    const input = '    code  here   \n  also  here  '
    const expected = '    code here\n  also here'
    expect(whitespaceCleanup(makeCtx(input)).text).toBe(expected)
  })
})
