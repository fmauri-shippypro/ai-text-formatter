import { describe, it, expect } from 'vitest'
import { stripAnsi } from '../../../src/formatter/steps/strip-ansi'
import type { PipelineContext } from '../../../src/formatter/types'
import { DEFAULT_OPTIONS } from '../../../src/formatter/types'

function makeCtx(text: string): PipelineContext {
  return { text, protectedRegions: [], options: { ...DEFAULT_OPTIONS } }
}

describe('stripAnsi', () => {
  it('removes color codes', () => {
    const result = stripAnsi(makeCtx('\x1b[31mred text\x1b[0m'))
    expect(result.text).toBe('red text')
  })

  it('removes bold and dim codes', () => {
    const result = stripAnsi(makeCtx('\x1b[1mbold\x1b[0m \x1b[2mdim\x1b[0m'))
    expect(result.text).toBe('bold dim')
  })

  it('handles text with no ANSI codes', () => {
    const result = stripAnsi(makeCtx('plain text'))
    expect(result.text).toBe('plain text')
  })

  it('skips when option is disabled', () => {
    const ctx = makeCtx('\x1b[31mred\x1b[0m')
    ctx.options.stripAnsi = false
    const result = stripAnsi(ctx)
    expect(result.text).toBe('\x1b[31mred\x1b[0m')
  })
})
