import { describe, it, expect } from 'vitest'
import { runPipeline } from '../../../src/formatter'

describe('format-for-target', () => {
  // ── Plain (default) ──

  describe('plain target', () => {
    it('normalizes dashes to ASCII', () => {
      const result = runPipeline('hello\u2014world', { target: 'plain' })
      expect(result).toBe('hello-world')
    })

    it('normalizes smart quotes to ASCII', () => {
      const result = runPipeline('\u201Chello\u201D', { target: 'plain' })
      expect(result).toBe('"hello"')
    })

    it('keeps code fences as-is', () => {
      const result = runPipeline('```js\nconst x = 1\n```', { target: 'plain' })
      expect(result).toContain('```')
    })
  })

  // ── Jira ──

  describe('jira target', () => {
    it('preserves em-dashes', () => {
      const result = runPipeline('hello\u2014world', { target: 'jira' })
      expect(result).toContain('\u2014')
    })

    it('preserves smart quotes', () => {
      const result = runPipeline('\u201Chello\u201D', { target: 'jira' })
      expect(result).toContain('\u201C')
      expect(result).toContain('\u201D')
    })

    it('converts code fences to {code}', () => {
      const result = runPipeline('```javascript\nconst x = 1;\n```', { target: 'jira' })
      expect(result).toContain('{code:javascript}')
      expect(result).toContain('{code}')
      expect(result).toContain('const x = 1;')
      expect(result).not.toContain('```')
    })

    it('converts code fences without language', () => {
      const result = runPipeline('```\nhello\n```', { target: 'jira' })
      expect(result).toContain('{code}')
      expect(result).toContain('hello')
    })

    it('converts markdown headings to Jira h1-h6', () => {
      expect(runPipeline('# Title', { target: 'jira' })).toBe('h1. Title')
      expect(runPipeline('## Subtitle', { target: 'jira' })).toBe('h2. Subtitle')
      expect(runPipeline('### Section', { target: 'jira' })).toBe('h3. Section')
    })

    it('converts bold **text** to *text*', () => {
      const result = runPipeline('This is **bold** text', { target: 'jira' })
      expect(result).toBe('This is *bold* text')
    })

    it('converts table header to Jira format', () => {
      const input = '| Name | Age |\n| ---- | --- |\n| John | 30  |'
      const result = runPipeline(input, { target: 'jira' })
      expect(result).toContain('|| Name')
      expect(result).toContain('||')
      expect(result).toContain('| John | 30  |')
    })
  })

  // ── Slack ──

  describe('slack target', () => {
    it('preserves em-dashes', () => {
      const result = runPipeline('hello\u2014world', { target: 'slack' })
      expect(result).toContain('\u2014')
    })

    it('preserves smart quotes', () => {
      const result = runPipeline('\u201Chello\u201D', { target: 'slack' })
      expect(result).toContain('\u201C')
    })

    it('wraps tables in code block', () => {
      const input = '| Name | Age |\n| ---- | --- |\n| John | 30  |'
      const result = runPipeline(input, { target: 'slack' })
      expect(result).toContain('```')
      expect(result).toContain('| Name | Age |')
      expect(result).toContain('| John | 30  |')
    })

    it('converts bold **text** to *text*', () => {
      const result = runPipeline('This is **bold** text', { target: 'slack' })
      expect(result).toBe('This is *bold* text')
    })

    it('converts strikethrough ~~text~~ to ~text~', () => {
      const result = runPipeline('This is ~~deleted~~ text', { target: 'slack' })
      expect(result).toBe('This is ~deleted~ text')
    })

    it('keeps code fences as-is', () => {
      const result = runPipeline('```js\ncode\n```', { target: 'slack' })
      expect(result).toContain('```')
    })
  })

  // ── Email ──

  describe('email target', () => {
    it('normalizes dashes to ASCII', () => {
      const result = runPipeline('hello\u2014world', { target: 'email' })
      expect(result).toBe('hello-world')
    })

    it('normalizes smart quotes', () => {
      const result = runPipeline('\u201Chello\u201D', { target: 'email' })
      expect(result).toBe('"hello"')
    })

    it('converts code fences to 4-space indentation', () => {
      const result = runPipeline('```\nline 1\nline 2\n```', { target: 'email' })
      expect(result).toContain('    line 1')
      expect(result).toContain('    line 2')
      expect(result).not.toContain('```')
    })

    it('preserves tables as-is (plain text aligned)', () => {
      const input = '| Name | Age |\n| ---- | --- |\n| John | 30  |'
      const result = runPipeline(input, { target: 'email' })
      expect(result).toContain('| Name | Age |')
    })
  })

  // ── Mixed content ──

  describe('mixed content across targets', () => {
    const input = [
      '## Summary',
      '',
      'This is **important** text with an em\u2014dash.',
      '',
      '```bash',
      'npm install',
      '```',
      '',
      '| Feature | Status |',
      '| ------- | ------ |',
      '| Auth    | Done   |',
    ].join('\n')

    it('plain: maximum ASCII cleanup', () => {
      const result = runPipeline(input, { target: 'plain' })
      expect(result).toContain('## Summary')
      expect(result).toContain('em-dash')
      expect(result).toContain('```')
    })

    it('jira: wiki markup conversion', () => {
      const result = runPipeline(input, { target: 'jira' })
      expect(result).toContain('h2. Summary')
      expect(result).toContain('*important*')
      expect(result).toContain('em\u2014dash')
      expect(result).toContain('{code:bash}')
      expect(result).toContain('|| Feature')
    })

    it('slack: mrkdwn conversion', () => {
      const result = runPipeline(input, { target: 'slack' })
      expect(result).toContain('## Summary')
      expect(result).toContain('*important*')
      expect(result).toContain('em\u2014dash')
      expect(result).toContain('```')
    })

    it('email: plain text with indented code', () => {
      const result = runPipeline(input, { target: 'email' })
      expect(result).toContain('## Summary')
      expect(result).toContain('em-dash')
      expect(result).toContain('    npm install')
      expect(result).not.toContain('```')
    })
  })
})
