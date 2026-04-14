import { describe, it, expect } from 'vitest'
import { removeBoxDrawing } from '../../../src/formatter/steps/remove-box-drawing'
import type { PipelineContext } from '../../../src/formatter/types'
import { DEFAULT_OPTIONS } from '../../../src/formatter/types'

function makeCtx(text: string): PipelineContext {
  return { text, protectedRegions: [], options: { ...DEFAULT_OPTIONS } }
}

describe('removeBoxDrawing', () => {
  it('removes full box-drawing frame', () => {
    const result = removeBoxDrawing(makeCtx('┌──────┐\n│ text │\n└──────┘'))
    expect(result.text).toBe(' text ')
  })

  it('filters horizontal separator lines', () => {
    const result = removeBoxDrawing(makeCtx('═══════════\ncontent\n───────────'))
    expect(result.text).toBe('content')
  })

  it('removes vertical chars from column separators', () => {
    const result = removeBoxDrawing(makeCtx('│ Col1 │ Col2 │'))
    expect(result.text).toBe(' Col1  Col2 ')
  })

  it('preserves ASCII pipe (markdown tables)', () => {
    const result = removeBoxDrawing(makeCtx('| col1 | col2 |'))
    expect(result.text).toBe('| col1 | col2 |')
  })

  it('skips when option is disabled', () => {
    const ctx = makeCtx('│ text │')
    ctx.options.removeBoxDrawing = false
    expect(removeBoxDrawing(ctx).text).toBe('│ text │')
  })
})
