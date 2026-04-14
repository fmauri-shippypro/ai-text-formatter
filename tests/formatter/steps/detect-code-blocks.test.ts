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
        '-removed',
        '+added',
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
})
