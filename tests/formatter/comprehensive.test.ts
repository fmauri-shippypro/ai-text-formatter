import { describe, it, expect } from 'vitest'
import { runPipeline } from '../../src/formatter'

describe('Comprehensive pipeline tests', () => {

  // ─────────────────────────────────────────────
  // ANSI ESCAPE SEQUENCES
  // ─────────────────────────────────────────────
  describe('ANSI codes', () => {
    it('strips color codes', () => {
      expect(runPipeline('\x1b[31mred\x1b[0m')).toBe('red')
    })

    it('strips bold/dim/underline', () => {
      expect(runPipeline('\x1b[1mbold\x1b[0m \x1b[2mdim\x1b[0m \x1b[4munderline\x1b[0m'))
        .toBe('bold dim underline')
    })

    it('strips 256-color codes', () => {
      expect(runPipeline('\x1b[38;5;196mred256\x1b[0m')).toBe('red256')
    })

    it('strips RGB color codes', () => {
      expect(runPipeline('\x1b[38;2;255;0;0mrgb\x1b[0m')).toBe('rgb')
    })

    it('strips cursor movement codes', () => {
      expect(runPipeline('\x1b[2Ahello\x1b[K')).toBe('hello')
    })

    it('handles text with no ANSI codes unchanged', () => {
      expect(runPipeline('plain text')).toBe('plain text')
    })
  })

  // ─────────────────────────────────────────────
  // BOX-DRAWING REMOVAL (chirurgico)
  // ─────────────────────────────────────────────
  describe('box-drawing removal', () => {
    it('removes simple box frame', () => {
      const input = '┌──────┐\n│ text │\n└──────┘'
      expect(runPipeline(input)).toBe('text')
    })

    it('removes complex table with column separators', () => {
      const input = [
        '┌───────┬────────┬───────┐',
        '│ Name  │ Status │ Count │',
        '├───────┼────────┼───────┤',
        '│ Alpha │ OK     │ 10    │',
        '│ Beta  │ FAIL   │ 3     │',
        '└───────┴────────┴───────┘',
      ].join('\n')
      const result = runPipeline(input)
      expect(result).toContain('Name')
      expect(result).toContain('Alpha')
      expect(result).not.toMatch(/[│┌┐└┘├┤┬┴┼─]/)
    })

    it('removes double-line box drawing', () => {
      const input = '╔════════╗\n║ title  ║\n╚════════╝'
      const result = runPipeline(input)
      expect(result).toContain('title')
      expect(result).not.toMatch(/[╔╗╚╝═║]/)
    })

    it('removes rounded corners', () => {
      const input = '╭──────╮\n│ box  │\n╰──────╯'
      const result = runPipeline(input)
      expect(result).toContain('box')
    })

    it('preserves ASCII pipe in markdown tables', () => {
      const input = '| Col | Val |\n| --- | --- |\n| a   | 1   |'
      expect(runPipeline(input)).toContain('| Col | Val |')
    })

    it('handles mixed box-drawing and text lines', () => {
      const input = '── Header ──\nSome content\n────────────'
      const result = runPipeline(input)
      expect(result).toContain('Some content')
    })
  })

  // ─────────────────────────────────────────────
  // BULLET NORMALIZATION
  // ─────────────────────────────────────────────
  describe('bullet normalization', () => {
    it('converts • to markdown dash', () => {
      expect(runPipeline('• first\n• second')).toContain('- first')
    })

    it('converts ▸ to markdown dash', () => {
      expect(runPipeline('▸ arrow item')).toBe('- arrow item')
    })

    it('converts ➤ to markdown dash', () => {
      expect(runPipeline('➤ heavy arrow')).toBe('- heavy arrow')
    })

    it('converts › to markdown dash', () => {
      expect(runPipeline('› chevron item')).toBe('- chevron item')
    })

    it('preserves indentation for nested bullets', () => {
      const input = '• parent\n  • child\n    • grandchild'
      const result = runPipeline(input)
      expect(result).toContain('- parent')
      expect(result).toContain('  - child')
      expect(result).toContain('    - grandchild')
    })

    it('does not convert bullets in mid-line text', () => {
      const result = runPipeline('price is 5• per unit')
      expect(result).toContain('5•')
    })

    it('handles mixed bullet styles', () => {
      const input = '• bullet\n▸ arrow\n➤ heavy\n- normal'
      const result = runPipeline(input)
      const lines = result.split('\n').filter(l => l.trim())
      expect(lines.every(l => l.trimStart().startsWith('- '))).toBe(true)
    })
  })

  // ─────────────────────────────────────────────
  // SMART QUOTES
  // ─────────────────────────────────────────────
  describe('smart quote normalization', () => {
    it('converts left/right single quotes', () => {
      expect(runPipeline('\u2018hello\u2019')).toBe("'hello'")
    })

    it('converts left/right double quotes', () => {
      expect(runPipeline('\u201Chello\u201D')).toBe('"hello"')
    })

    it('converts low-9 quotes', () => {
      expect(runPipeline('\u201Ehello\u201D')).toBe('"hello"')
    })

    it('preserves regular ASCII quotes', () => {
      expect(runPipeline("it's \"fine\"")).toBe("it's \"fine\"")
    })

    it('handles mixed quotes in a sentence', () => {
      const input = 'He said \u201CHello\u201D and she said \u2018Hi\u2019'
      expect(runPipeline(input)).toBe('He said "Hello" and she said \'Hi\'')
    })
  })

  // ─────────────────────────────────────────────
  // LINE RE-JOINING
  // ─────────────────────────────────────────────
  describe('line re-joining', () => {
    it('joins lines wrapped at terminal width', () => {
      const input = 'This is a long sentence that was wrapped at the terminal\nwidth boundary and should be joined back together.'
      expect(runPipeline(input)).toBe(
        'This is a long sentence that was wrapped at the terminal width boundary and should be joined back together.'
      )
    })

    it('joins multiple wrapped lines', () => {
      const input = 'This is the first part of a very long paragraph that\nwas wrapped at the terminal boundary and it continues\non yet another line and flows naturally.'
      expect(runPipeline(input)).toBe(
        'This is the first part of a very long paragraph that was wrapped at the terminal boundary and it continues on yet another line and flows naturally.'
      )
    })

    it('does NOT join after sentence-ending punctuation (.)', () => {
      const input = 'This sentence ends with a period and is quite long.\nnew line starts here'
      const result = runPipeline(input)
      expect(result).toContain('long.')
      expect(result).toContain('\n')
    })

    it('does NOT join after sentence-ending punctuation (!)', () => {
      const input = 'This sentence ends with exclamation and is long!\nnew line starts here'
      const result = runPipeline(input)
      expect(result).toContain('long!')
      expect(result).toContain('\n')
    })

    it('does NOT join when next line starts with uppercase', () => {
      const input = 'This is a long first paragraph line that continues on\nNew paragraph starts with uppercase letter here'
      expect(runPipeline(input)).toContain('\n')
    })

    it('does NOT join short lines (< 40 chars)', () => {
      expect(runPipeline('Short line\ncontinuation')).toBe('Short line\ncontinuation')
    })

    it('does NOT join across blank lines', () => {
      const input = 'A long first line that is definitely long enough here\n\ncontinuation after blank'
      expect(runPipeline(input)).toContain('\n\n')
    })

    it('does NOT join across protected regions', () => {
      const input = 'A long first line that is definitely long enough here\n| Col | Val |\n| --- | --- |\n| a   | b   |\ncontinuation'
      const result = runPipeline(input)
      expect(result).toContain('| Col | Val |')
    })

    it('can be disabled via options', () => {
      const input = 'This is a long sentence that was wrapped at the terminal\nwidth boundary and should be joined back together.'
      const result = runPipeline(input, { rejoinLines: false })
      expect(result).toContain('\n')
    })
  })

  // ─────────────────────────────────────────────
  // INVISIBLE UNICODE
  // ─────────────────────────────────────────────
  describe('invisible unicode removal', () => {
    it('removes zero-width space', () => {
      expect(runPipeline('he\u200Bllo')).toBe('hello')
    })

    it('removes BOM', () => {
      expect(runPipeline('\uFEFFhello')).toBe('hello')
    })

    it('removes zero-width joiner', () => {
      expect(runPipeline('he\u200Dllo')).toBe('hello')
    })

    it('removes soft hyphen', () => {
      expect(runPipeline('syl\u00ADla\u00ADble')).toBe('syllable')
    })

    it('removes word joiner', () => {
      expect(runPipeline('no\u2060break')).toBe('nobreak')
    })

    it('handles multiple invisible chars in one string', () => {
      expect(runPipeline('\uFEFF\u200Bhello\u200C\u200Dworld\u2060')).toBe('helloworld')
    })
  })

  // ─────────────────────────────────────────────
  // DASH NORMALIZATION
  // ─────────────────────────────────────────────
  describe('dash normalization', () => {
    it('normalizes em-dash', () => {
      expect(runPipeline('hello\u2014world')).toBe('hello-world')
    })

    it('normalizes en-dash', () => {
      expect(runPipeline('pages 1\u201310')).toBe('pages 1-10')
    })

    it('normalizes figure dash', () => {
      expect(runPipeline('tel: 555\u20121234')).toBe('tel: 555-1234')
    })

    it('normalizes horizontal bar', () => {
      expect(runPipeline('a\u2015b')).toBe('a-b')
    })

    it('preserves regular hyphens', () => {
      expect(runPipeline('well-known')).toBe('well-known')
    })

    it('handles multiple dash types in one string', () => {
      expect(runPipeline('a\u2014b\u2013c\u2012d')).toBe('a-b-c-d')
    })
  })

  // ─────────────────────────────────────────────
  // WHITESPACE NORMALIZATION
  // ─────────────────────────────────────────────
  describe('whitespace normalization', () => {
    it('collapses multiple spaces to one', () => {
      expect(runPipeline('hello    world')).toBe('hello world')
    })

    it('trims trailing whitespace per line', () => {
      expect(runPipeline('hello   ')).toBe('hello')
    })

    it('preserves leading indentation in multiline text', () => {
      expect(runPipeline('line one\n  indented  text')).toBe('line one\n  indented text')
    })

    it('converts NBSP to regular space', () => {
      expect(runPipeline('hello\u00A0world')).toBe('hello world')
    })

    it('collapses 3+ blank lines to max 2', () => {
      expect(runPipeline('a\n\n\n\n\nb')).toBe('a\n\nb')
    })

    it('normalizes \\r\\n to \\n', () => {
      expect(runPipeline('line1\r\nline2')).toBe('line1\nline2')
    })

    it('trims the entire document', () => {
      expect(runPipeline('\n\nhello\n\n')).toBe('hello')
    })
  })

  // ─────────────────────────────────────────────
  // STRUCTURE PRESERVATION
  // ─────────────────────────────────────────────
  describe('structure preservation', () => {
    it('preserves markdown table completely', () => {
      const table = '| Name | Age |\n| ---- | --- |\n| John | 30  |'
      expect(runPipeline(table)).toBe(table)
    })

    it('preserves table with alignment markers', () => {
      const table = '| Left | Center | Right |\n| :--- | :----: | ----: |\n| a    | b      | c     |'
      expect(runPipeline(table)).toBe(table)
    })

    it('preserves fenced code block with backticks', () => {
      const code = '```javascript\nconst x = 1;\nconsole.log(x);\n```'
      expect(runPipeline(code)).toBe(code)
    })

    it('preserves fenced code block with tildes', () => {
      const code = '~~~python\nprint("hello")\n~~~'
      expect(runPipeline(code)).toBe(code)
    })

    it('preserves box-drawing chars inside code blocks', () => {
      const code = '```\n┌──────┐\n│ box  │\n└──────┘\n```'
      expect(runPipeline(code)).toContain('│ box  │')
    })

    it('preserves bullet lists', () => {
      const list = '- item 1\n- item 2\n- item 3'
      expect(runPipeline(list)).toBe(list)
    })

    it('preserves numbered lists', () => {
      const list = '1. first\n2. second\n3. third'
      expect(runPipeline(list)).toBe(list)
    })

    it('preserves nested lists', () => {
      const list = '- parent\n  - child 1\n  - child 2'
      expect(runPipeline(list)).toBe(list)
    })

    it('does not detect table inside code block', () => {
      const input = '```\n| Not | A | Table |\n| --- | - | ----- |\n```'
      const result = runPipeline(input)
      expect(result).toContain('| Not | A | Table |')
    })
  })

  // ─────────────────────────────────────────────
  // REAL-WORLD SCENARIOS
  // ─────────────────────────────────────────────
  describe('real-world scenarios', () => {
    it('cleans Claude Code terminal output', () => {
      const input = [
        '\x1b[1;36m● Task completed\x1b[0m',
        '',
        '┌─────────────────────────────────┐',
        '│  \x1b[1mBuild Results\x1b[0m                │',
        '└─────────────────────────────────┘',
        '',
        '• All tests passed',
        '• No warnings found',
        '• Coverage: 95%',
      ].join('\n')
      const result = runPipeline(input)

      expect(result).not.toMatch(/\x1b/)
      expect(result).not.toMatch(/[│┌┐└┘─]/)
      expect(result).toContain('Task completed')
      expect(result).toContain('Build Results')
      expect(result).toContain('- All tests passed')
      expect(result).toContain('- Coverage: 95%')
    })

    it('cleans ChatGPT-style output with smart quotes and dashes', () => {
      const input = 'The \u201Cbest\u201D approach is to use an em\u2014dash for interruptions and an en\u2013dash for ranges like 1\u201310.'
      const result = runPipeline(input)

      expect(result).toBe('The "best" approach is to use an em-dash for interruptions and an en-dash for ranges like 1-10.')
    })

    it('handles text with mixed formatting issues', () => {
      const input = '\uFEFF\u200BHello\u00A0world  \n  with\u200C   extra\u00A0\u00A0spaces  '
      const result = runPipeline(input)

      expect(result).not.toMatch(/\u200B/)
      expect(result).not.toMatch(/\uFEFF/)
      expect(result).not.toMatch(/\u00A0/)
      expect(result).toContain('Hello world')
      expect(result).toContain('with extra spaces')
    })

    it('preserves a Jira-friendly mixed document', () => {
      const input = [
        '## Summary',
        '',
        'The build completed successfully.',
        '',
        '| Test Suite | Result |',
        '| ---------- | ------ |',
        '| Unit       | PASS   |',
        '| E2E        | PASS   |',
        '',
        '### Action items:',
        '',
        '- Deploy to staging',
        '- Run smoke tests',
        '- Update documentation',
        '',
        '```bash',
        'npm run deploy --env staging',
        '```',
      ].join('\n')
      const result = runPipeline(input)

      expect(result).toContain('## Summary')
      expect(result).toContain('| Test Suite | Result |')
      expect(result).toContain('- Deploy to staging')
      expect(result).toContain('npm run deploy --env staging')
    })

    it('handles completely empty input', () => {
      expect(runPipeline('')).toBe('')
    })

    it('handles input with only whitespace', () => {
      expect(runPipeline('   \n\n   \n  ')).toBe('')
    })

    it('handles input with only box-drawing', () => {
      expect(runPipeline('┌──────┐\n└──────┘')).toBe('')
    })

    it('handles input with only ANSI codes', () => {
      expect(runPipeline('\x1b[31m\x1b[0m')).toBe('')
    })
  })

  // ─────────────────────────────────────────────
  // OPTIONS / TOGGLING
  // ─────────────────────────────────────────────
  describe('option toggling', () => {
    it('disabling normalizeDashes preserves em-dash', () => {
      expect(runPipeline('a\u2014b', { normalizeDashes: false })).toBe('a\u2014b')
    })

    it('disabling normalizeQuotes preserves smart quotes', () => {
      expect(runPipeline('\u201Ctest\u201D', { normalizeQuotes: false })).toBe('\u201Ctest\u201D')
    })

    it('disabling normalizeBullets preserves •', () => {
      expect(runPipeline('• item', { normalizeBullets: false })).toBe('• item')
    })

    it('disabling rejoinLines preserves line breaks', () => {
      const input = 'This is a long sentence that was wrapped at the terminal\nwidth boundary and should be joined back together.'
      expect(runPipeline(input, { rejoinLines: false })).toContain('\n')
    })

    it('disabling removeBoxDrawing preserves box chars', () => {
      expect(runPipeline('│ text │', { removeBoxDrawing: false })).toBe('│ text │')
    })

    it('disabling removeInvisible preserves zero-width space mid-text', () => {
      expect(runPipeline('he\u200Bllo', { removeInvisible: false })).toBe('he\u200Bllo')
    })

    it('disabling cleanWhitespace preserves multiple spaces', () => {
      expect(runPipeline('hello    world', { cleanWhitespace: false })).toBe('hello    world')
    })

    it('multiple options can be disabled simultaneously', () => {
      const result = runPipeline('a\u2014b \u201Cc\u201D', {
        normalizeDashes: false,
        normalizeQuotes: false,
      })
      expect(result).toContain('\u2014')
      expect(result).toContain('\u201C')
    })
  })
})
