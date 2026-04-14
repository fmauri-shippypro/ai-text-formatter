import { describe, it, expect } from 'vitest'
import { rejoinLines } from '../../../src/formatter/steps/rejoin-lines'
import { generatePlaceholder } from '../../../src/formatter/utils/placeholder'
import type { PipelineContext } from '../../../src/formatter/types'
import { DEFAULT_OPTIONS } from '../../../src/formatter/types'

function makeCtx(text: string): PipelineContext {
  return { text, protectedRegions: [], options: { ...DEFAULT_OPTIONS } }
}

describe('rejoinLines', () => {
  it('joins lines wrapped at terminal width', () => {
    const input = 'This is a long sentence that was wrapped at the terminal\nwidth boundary and should be joined back together.'
    const expected = 'This is a long sentence that was wrapped at the terminal width boundary and should be joined back together.'
    expect(rejoinLines(makeCtx(input)).text).toBe(expected)
  })

  it('does not join when current line ends with period', () => {
    const input = 'This is a complete sentence that is long enough.\nnew paragraph starts here'
    expect(rejoinLines(makeCtx(input)).text).toBe(input)
  })

  it('does not join when next line starts with uppercase', () => {
    const input = 'This is a long line that could look like a wrapped line\nBut this starts a new paragraph with uppercase'
    expect(rejoinLines(makeCtx(input)).text).toBe(input)
  })

  it('does not join short lines (< 40 chars)', () => {
    const input = 'Short line\ncontinuation'
    expect(rejoinLines(makeCtx(input)).text).toBe(input)
  })

  it('does not join across blank lines', () => {
    const input = 'A long first line that is definitely long enough here\n\ncontinuation after blank'
    expect(rejoinLines(makeCtx(input)).text).toBe(input)
  })

  it('does not join across placeholder lines', () => {
    const placeholder = generatePlaceholder('table', 0)
    const input = `A long first line that is definitely long enough here\n${placeholder}\ncontinuation`
    expect(rejoinLines(makeCtx(input)).text).toBe(input)
  })

  it('joins multiple consecutive wrapped lines', () => {
    const input = 'This is the first part of a very long paragraph that was\nwrapped at the terminal boundary and continues\non yet another line that flows naturally.'
    const expected = 'This is the first part of a very long paragraph that was wrapped at the terminal boundary and continues on yet another line that flows naturally.'
    expect(rejoinLines(makeCtx(input)).text).toBe(expected)
  })

  it('skips when option is disabled', () => {
    const input = 'This is a long sentence that was wrapped at the terminal\nwidth boundary and should be joined back together.'
    const ctx = makeCtx(input)
    ctx.options.rejoinLines = false
    expect(rejoinLines(ctx).text).toBe(input)
  })
})
