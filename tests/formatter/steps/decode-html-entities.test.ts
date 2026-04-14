import { describe, it, expect } from 'vitest'
import { decodeHtmlEntities } from '../../../src/formatter/steps/decode-html-entities'
import type { PipelineContext } from '../../../src/formatter/types'
import { DEFAULT_OPTIONS } from '../../../src/formatter/types'

function makeCtx(text: string): PipelineContext {
  return { text, protectedRegions: [], options: { ...DEFAULT_OPTIONS } }
}

describe('decodeHtmlEntities', () => {
  it('decodes &amp; to &', () => {
    const ctx = makeCtx('Tom &amp; Jerry')
    expect(decodeHtmlEntities(ctx).text).toBe('Tom & Jerry')
  })

  it('decodes &lt; and &gt; to < and >', () => {
    const ctx = makeCtx('&lt;div&gt;hello&lt;/div&gt;')
    expect(decodeHtmlEntities(ctx).text).toBe('<div>hello</div>')
  })

  it('decodes &nbsp; to a regular space', () => {
    const ctx = makeCtx('hello&nbsp;world')
    expect(decodeHtmlEntities(ctx).text).toBe('hello world')
  })

  it('decodes &mdash; to em-dash (U+2014)', () => {
    const ctx = makeCtx('word&mdash;word')
    expect(decodeHtmlEntities(ctx).text).toBe('word\u2014word')
  })

  it('decodes &quot; to double-quote', () => {
    const ctx = makeCtx('&quot;hello&quot;')
    expect(decodeHtmlEntities(ctx).text).toBe('"hello"')
  })

  it('decodes decimal entity &#169; to ©', () => {
    const ctx = makeCtx('&#169; 2026')
    expect(decodeHtmlEntities(ctx).text).toBe('\u00A9 2026')
  })

  it('decodes hex entity &#xA9; to ©', () => {
    const ctx = makeCtx('&#xA9; 2026')
    expect(decodeHtmlEntities(ctx).text).toBe('\u00A9 2026')
  })

  it('handles invalid code point &#99999999; by leaving it as-is', () => {
    const ctx = makeCtx('before &#99999999; after')
    expect(decodeHtmlEntities(ctx).text).toBe('before &#99999999; after')
  })

  it('handles empty numeric entity &#; by leaving it as-is', () => {
    const ctx = makeCtx('before &#; after')
    expect(decodeHtmlEntities(ctx).text).toBe('before &#; after')
  })

  it('handles unknown named entity &foo; by leaving it as-is', () => {
    const ctx = makeCtx('before &foo; after')
    expect(decodeHtmlEntities(ctx).text).toBe('before &foo; after')
  })

  it('is case-insensitive: &AMP; decodes to &', () => {
    const ctx = makeCtx('Tom &AMP; Jerry')
    expect(decodeHtmlEntities(ctx).text).toBe('Tom & Jerry')
  })

  it('returns text unchanged when there are no entities', () => {
    const ctx = makeCtx('plain text with no entities')
    expect(decodeHtmlEntities(ctx).text).toBe('plain text with no entities')
  })

  it('returns input unchanged when decodeHtmlEntities option is disabled', () => {
    const ctx = makeCtx('Tom &amp; Jerry')
    ctx.options.decodeHtmlEntities = false
    const result = decodeHtmlEntities(ctx)
    expect(result.text).toBe('Tom &amp; Jerry')
  })
})
