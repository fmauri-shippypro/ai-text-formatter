import type { PipelineStep } from '../types'

const NAMED_ENTITIES: Record<string, string> = {
  '&nbsp;': ' ',
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
  '&apos;': "'",
  '&mdash;': '\u2014',
  '&ndash;': '\u2013',
  '&hellip;': '\u2026',
  '&bull;': '\u2022',
  '&copy;': '\u00A9',
  '&reg;': '\u00AE',
  '&trade;': '\u2122',
  '&laquo;': '\u00AB',
  '&raquo;': '\u00BB',
}

const NAMED_RE = new RegExp(Object.keys(NAMED_ENTITIES).join('|'), 'gi')
const DECIMAL_RE = /&#(\d+);/g
const HEX_RE = /&#x([0-9a-fA-F]+);/g

export const decodeHtmlEntities: PipelineStep = (ctx) => {
  if (!ctx.options.decodeHtmlEntities) return ctx
  const text = ctx.text
    .replace(NAMED_RE, (match) => NAMED_ENTITIES[match.toLowerCase()] ?? match)
    .replace(DECIMAL_RE, (match, code) => {
      const cp = parseInt(code, 10)
      return (Number.isFinite(cp) && cp >= 0 && cp <= 0x10FFFF) ? String.fromCodePoint(cp) : match
    })
    .replace(HEX_RE, (match, code) => {
      const cp = parseInt(code, 16)
      return (Number.isFinite(cp) && cp >= 0 && cp <= 0x10FFFF) ? String.fromCodePoint(cp) : match
    })
  return { ...ctx, text }
}
