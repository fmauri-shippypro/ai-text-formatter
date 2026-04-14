import { describe, it, expect } from 'vitest'
import { detectUnfencedDiffs, detectUnfencedCode } from '../../../src/formatter/steps/detect-code-blocks'

describe('detect-code-blocks', () => {
  describe('detectUnfencedDiffs', () => {
    it('detects a unified diff block', () => {
      const lines = [
        'Some explanation text',
        '',
        '--- a/src/app.ts',
        '+++ b/src/app.ts',
        '@@ -1,3 +1,4 @@',
        ' import React from "react"',
        '+import { useState } from "react"',
        ' ',
        ' function App() {',
        '',
        'More text after the diff',
      ]
      const result = detectUnfencedDiffs(lines)
      expect(result).toEqual([{ startLine: 2, endLine: 8 }])
    })

    it('detects a diff without file headers (just hunks)', () => {
      const lines = [
        '@@ -10,4 +10,5 @@',
        ' const x = 1',
        '-const y = 2',
        '+const y = 3',
        '+const z = 4',
      ]
      const result = detectUnfencedDiffs(lines)
      expect(result).toEqual([{ startLine: 0, endLine: 4 }])
    })

    it('ignores blocks with fewer than 3 diff lines', () => {
      const lines = [
        '--- a/file.ts',
        '+++ b/file.ts',
      ]
      const result = detectUnfencedDiffs(lines)
      expect(result).toEqual([])
    })

    it('does not treat bullet lists as diffs', () => {
      const lines = [
        '- item one',
        '- item two',
        '- item three',
        '+ another item',
      ]
      const result = detectUnfencedDiffs(lines)
      expect(result).toEqual([])
    })

    it('detects multiple diff blocks', () => {
      const lines = [
        '--- a/file1.ts',
        '+++ b/file1.ts',
        '@@ -1,2 +1,2 @@',
        '-old line',
        '+new line',
        '',
        'Some text in between',
        '',
        '--- a/file2.ts',
        '+++ b/file2.ts',
        '@@ -5,3 +5,3 @@',
        ' context',
        '-removed',
        '+added',
      ]
      const result = detectUnfencedDiffs(lines)
      expect(result).toHaveLength(2)
      expect(result[0]).toEqual({ startLine: 0, endLine: 4 })
      expect(result[1]).toEqual({ startLine: 8, endLine: 13 })
    })
  })

  describe('detectUnfencedCode', () => {
    it('detects a block of JavaScript code', () => {
      const lines = [
        'Here is the fix:',
        '',
        'function greet(name) {',
        '  const message = `Hello ${name}`;',
        '  return message;',
        '}',
        '',
        'This should work now.',
      ]
      const result = detectUnfencedCode(lines)
      expect(result).toEqual([{ startLine: 2, endLine: 5 }])
    })

    it('detects a block with import/export statements', () => {
      const lines = [
        'import React from "react"',
        'import { useState } from "react"',
        '',
        'export const App = () => {',
        '  const [count, setCount] = useState(0)',
        '  return <div>{count}</div>',
        '}',
      ]
      const result = detectUnfencedCode(lines)
      expect(result).toEqual([{ startLine: 0, endLine: 6 }])
    })

    it('detects Python code', () => {
      const lines = [
        'def calculate(x, y):',
        '    result = x + y',
        '    return result',
      ]
      const result = detectUnfencedCode(lines)
      expect(result).toEqual([{ startLine: 0, endLine: 2 }])
    })

    it('does not detect regular prose', () => {
      const lines = [
        'This is a normal paragraph of text that describes something.',
        'It has multiple sentences and continues on the next line.',
        'The explanation covers several important points about the topic.',
      ]
      const result = detectUnfencedCode(lines)
      expect(result).toEqual([])
    })

    it('does not detect a single line of code', () => {
      const lines = [
        'const x = 1;',
      ]
      const result = detectUnfencedCode(lines)
      expect(result).toEqual([])
    })

    it('detects code block surrounded by prose', () => {
      const lines = [
        'You need to update the config:',
        '',
        'const config = {',
        '  host: "localhost",',
        '  port: 3000,',
        '};',
        '',
        'Then restart the server.',
      ]
      const result = detectUnfencedCode(lines)
      expect(result).toEqual([{ startLine: 2, endLine: 5 }])
    })

    it('detects terminal command output', () => {
      const lines = [
        '$ npm install react',
        'added 5 packages in 2s',
        '$ npm run build',
        'Build successful',
      ]
      const result = detectUnfencedCode(lines)
      expect(result).toEqual([{ startLine: 0, endLine: 3 }])
    })

    it('handles blank lines within a code block', () => {
      const lines = [
        'function a() {',
        '  return 1',
        '}',
        '',
        'function b() {',
        '  return 2',
        '}',
      ]
      const result = detectUnfencedCode(lines)
      expect(result).toEqual([{ startLine: 0, endLine: 6 }])
    })

    it('skips lines already detected as diffs', () => {
      const lines = [
        '@@ -1,3 +1,3 @@',
        ' const x = 1',
        '-const y = 2',
        '+const y = 3',
      ]
      // When called with skipRanges covering the diff
      const result = detectUnfencedCode(lines, [{ startLine: 0, endLine: 3 }])
      expect(result).toEqual([])
    })
  })
})
