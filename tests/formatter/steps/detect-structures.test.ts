import { describe, it, expect } from 'vitest'
import { detectStructures } from '../../../src/formatter/utils/structure-detector'

describe('detectStructures', () => {
  describe('markdown tables', () => {
    it('detects a standard markdown table', () => {
      const lines = [
        '| Col1 | Col2 |',
        '| ---- | ---- |',
        '| A    | B    |',
      ]
      const regions = detectStructures(lines)
      expect(regions).toEqual([
        { startLine: 0, endLine: 2, type: 'table' },
      ])
    })

    it('detects table with alignment colons', () => {
      const lines = [
        '| Left | Center | Right |',
        '| :--- | :----: | ----: |',
        '| a    | b      | c     |',
      ]
      const regions = detectStructures(lines)
      expect(regions).toHaveLength(1)
      expect(regions[0].type).toBe('table')
    })

    it('does not detect lines without separator row', () => {
      const lines = [
        '| not a table |',
        '| just pipes  |',
      ]
      const regions = detectStructures(lines)
      const tables = regions.filter(r => r.type === 'table')
      expect(tables).toHaveLength(0)
    })
  })

  describe('code blocks', () => {
    it('detects fenced code block with backticks', () => {
      const lines = [
        'before',
        '```javascript',
        'const x = 1;',
        '```',
        'after',
      ]
      const regions = detectStructures(lines)
      expect(regions).toEqual([
        { startLine: 1, endLine: 3, type: 'code-block' },
      ])
    })

    it('detects fenced code block with tildes', () => {
      const lines = [
        '~~~',
        'code here',
        '~~~',
      ]
      const regions = detectStructures(lines)
      expect(regions).toEqual([
        { startLine: 0, endLine: 2, type: 'code-block' },
      ])
    })
  })

  describe('bullet lists', () => {
    it('detects unordered list', () => {
      const lines = [
        'intro text',
        '- item 1',
        '- item 2',
        '- item 3',
        'after text',
      ]
      const regions = detectStructures(lines)
      expect(regions).toEqual([
        { startLine: 1, endLine: 3, type: 'bullet-list' },
      ])
    })

    it('detects numbered list', () => {
      const lines = [
        '1. first',
        '2. second',
        '3. third',
      ]
      const regions = detectStructures(lines)
      expect(regions).toEqual([
        { startLine: 0, endLine: 2, type: 'bullet-list' },
      ])
    })
  })

  describe('mixed content', () => {
    it('does not detect table inside code block', () => {
      const lines = [
        '```',
        '| Col1 | Col2 |',
        '| ---- | ---- |',
        '| A    | B    |',
        '```',
      ]
      const regions = detectStructures(lines)
      expect(regions).toHaveLength(1)
      expect(regions[0].type).toBe('code-block')
    })
  })

  describe('tool output blocks', () => {
    it('detects tool header with ⏺ prefix and indented output', () => {
      const lines = [
        '⏺ Bash(npm test)',
        '  PASS src/index.test.ts',
        '  Tests: 5 passed, 5 total',
      ]
      const regions = detectStructures(lines)
      const toolRegions = regions.filter(r => r.type === 'tool-output')
      expect(toolRegions).toHaveLength(1)
      expect(toolRegions[0]).toEqual({ startLine: 0, endLine: 2, type: 'tool-output' })
    })

    it('detects tool output without ⏺ prefix', () => {
      const lines = [
        'Write(file.ts)',
        '  const x = 1;',
        '  export default x;',
      ]
      const regions = detectStructures(lines)
      const toolRegions = regions.filter(r => r.type === 'tool-output')
      expect(toolRegions).toHaveLength(1)
      expect(toolRegions[0]).toEqual({ startLine: 0, endLine: 2, type: 'tool-output' })
    })

    it('does NOT produce a region for tool header with no indented content', () => {
      const lines = [
        '⏺ Bash(echo hello)',
        'some unindented line',
      ]
      const regions = detectStructures(lines)
      const toolRegions = regions.filter(r => r.type === 'tool-output')
      expect(toolRegions).toHaveLength(0)
    })

    it('includes blank lines inside tool output that continue with indented content', () => {
      const lines = [
        '⏺ Bash(npm test)',
        '  PASS src/a.test.ts',
        '',
        '  PASS src/b.test.ts',
        '  Tests: 10 passed',
      ]
      const regions = detectStructures(lines)
      const toolRegions = regions.filter(r => r.type === 'tool-output')
      expect(toolRegions).toHaveLength(1)
      expect(toolRegions[0]).toEqual({ startLine: 0, endLine: 4, type: 'tool-output' })
    })

    it('detects two consecutive tool blocks separately', () => {
      const lines = [
        '⏺ Bash(npm test)',
        '  All tests passed',
        '⏺ Write(output.txt)',
        '  file written',
      ]
      const regions = detectStructures(lines)
      const toolRegions = regions.filter(r => r.type === 'tool-output')
      expect(toolRegions).toHaveLength(2)
      expect(toolRegions[0]).toEqual({ startLine: 0, endLine: 1, type: 'tool-output' })
      expect(toolRegions[1]).toEqual({ startLine: 2, endLine: 3, type: 'tool-output' })
    })
  })
})
