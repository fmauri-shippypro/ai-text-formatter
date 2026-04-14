import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { runPipeline } from '../../src/formatter'

function readFixture(name: string): string {
  return readFileSync(join(__dirname, '../fixtures', name), 'utf-8')
}

describe('runPipeline', () => {
  it('cleans terminal output with ANSI and box-drawing', () => {
    const input = readFixture('terminal-output.txt')
    const result = runPipeline(input)

    expect(result).not.toMatch(/\x1b\[/)
    // Vertical box-drawing chars (│║┃) removed
    expect(result).not.toMatch(/[│║┃]/)
    expect(result).toContain('All tests passed')
    expect(result).toContain('Failed: connection timeout')
  })

  it('preserves markdown tables', () => {
    const input = readFixture('markdown-table.txt')
    const result = runPipeline(input)

    expect(result).toContain('| Feature | Status | Notes |')
    expect(result).toContain('| ------- | ------ | ----- |')
    expect(result).toContain('| Auth    | Done   | OAuth2 |')
  })

  it('handles mixed content correctly', () => {
    const input = readFixture('mixed-content.txt')
    const result = runPipeline(input)

    // ANSI codes removed
    expect(result).not.toMatch(/\x1b\[/)

    // Box-drawing removed outside protected regions
    const lines = result.split('\n')
    const codeBlockStart = lines.findIndex(l => l.includes('```'))
    const codeBlockEnd = lines.findIndex((l, i) => i > codeBlockStart && l.includes('```'))
    const outsideCodeBlock = [
      ...lines.slice(0, codeBlockStart),
      ...lines.slice(codeBlockEnd + 1),
    ].join('\n')
    expect(outsideCodeBlock).not.toMatch(/[\u2500-\u259F]/)

    // Markdown table preserved
    expect(result).toContain('| Module   | Tests | Coverage |')

    // Bullet list preserved
    expect(result).toContain('- Coverage is above 75% for all modules')

    // Code block preserved (including box-drawing char inside it)
    expect(result).toContain('console.log("Hello \u2502 World")')

    // Dashes normalized
    expect(result).toContain('Next steps - implement the dashboard')
    expect(result).toContain('1-10')
  })

})
