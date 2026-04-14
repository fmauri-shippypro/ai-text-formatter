import { describe, it, expect } from 'vitest'
import { runPipeline } from '../../src/formatter'

describe('real terminal output cleaning', () => {
  it('cleans Claude Code terminal output with padding and decorative symbols', () => {
    const input = [
      '                                                     ',
      '\u23FA Ecco il riepilogo di quello che e\u2019 stato fatto:                                                                                                                                ',
      '                                                                                                                                                                                 ',
      '  Implementato                                                                                                                                                                 ',
      '                                                                                                                                                                                 ',
      '  1. Normalize bullet chars (steps/normalize-bullets.ts) \u2014 converte \u2022, \u25E6, \u25B8, \u25B9, \u27A4, \u279C, \u203A in -  markdown. Posizionato PRIMA del detect-structures cosi\u2019 le liste vengono rilevate e',
      '   protette.                                                                                                                                                                     ',
      '  2. Normalize smart quotes (steps/normalize-quotes.ts) \u2014 converte \u2018\u2019 \u2192 \u2019 e \u201C\u201D \u2192 \u201D (incluse varianti low-9).                                                                     ',
    ].join('\n')

    const result = runPipeline(input)

    // Decorative symbol ⏺ removed
    expect(result).not.toContain('\u23FA')

    // Em-dash normalized
    expect(result).not.toContain('\u2014')

    // Smart quotes normalized
    expect(result).not.toContain('\u2018')
    expect(result).not.toContain('\u2019')
    expect(result).not.toContain('\u201C')
    expect(result).not.toContain('\u201D')

    // No excessive leading whitespace (dedented)
    const lines = result.split('\n')
    const nonEmptyLines = lines.filter(l => l.trim().length > 0)
    const hasExcessivePadding = nonEmptyLines.some(l => /^ {10,}/.test(l))
    expect(hasExcessivePadding).toBe(false)

    // No trailing whitespace
    const hasTrailingSpaces = lines.some(l => / $/.test(l))
    expect(hasTrailingSpaces).toBe(false)

    // Content preserved
    expect(result).toContain('Ecco il riepilogo')
    expect(result).toContain('Implementato')
    expect(result).toContain('Normalize bullet chars')
  })

  it('removes ⏺ at start of lines', () => {
    expect(runPipeline('⏺ Hello world')).toBe('Hello world')
  })

  it('removes ◆ decorative symbol', () => {
    expect(runPipeline('◆ Task completed')).toBe('Task completed')
  })

  it('dedents uniformly indented text', () => {
    const input = '    line one\n    line two\n    line three'
    const result = runPipeline(input)
    expect(result).toBe('line one\nline two\nline three')
  })

  it('dedents preserving relative indentation', () => {
    const input = '    parent\n      child\n    sibling'
    const result = runPipeline(input)
    expect(result).toBe('parent\n  child\nsibling')
  })

  it('turns whitespace-only lines into empty lines', () => {
    const input = 'hello\n          \nworld'
    const result = runPipeline(input)
    // Whitespace-only line becomes empty, final cleanup may collapse
    expect(result).not.toMatch(/^ {5,}/m)
    expect(result).toContain('hello')
    expect(result).toContain('world')
  })

  it('collapses multiple whitespace-only lines', () => {
    const input = 'hello\n          \n          \n          \nworld'
    const result = runPipeline(input)
    // Multiple whitespace-only lines collapse, no excessive blank lines
    expect(result).not.toMatch(/\n{3,}/)
    expect(result).toContain('hello')
    expect(result).toContain('world')
  })
})
