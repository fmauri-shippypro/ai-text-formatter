import type { PipelineContext, PipelineStep, ProtectedRegion } from '../types'
import {
  ANSI_REGEX,
  DECORATIVE,
  DASH_VARIANTS,
  SINGLE_QUOTES,
  DOUBLE_QUOTES,
  INVISIBLE,
  NBSP,
  AI_ARTIFACT_PATTERNS,
} from './patterns'

export function generatePlaceholder(
  type: ProtectedRegion['type'],
  index: number,
): string {
  const label = type.toUpperCase().replace(/-/g, '_')
  const nonce = Math.random().toString(36).slice(2, 8)
  return `\x00PROT_${label}_${index}_${nonce}\x00`
}

export const PLACEHOLDER_RE = /^\x00PROT_\w+_\d+_\w+\x00$/

export function isPlaceholder(line: string): boolean {
  return PLACEHOLDER_RE.test(line.trim())
}

export function insertPlaceholder(
  ctx: PipelineContext,
  startLine: number,
  endLine: number,
  type: ProtectedRegion['type'],
): PipelineContext {
  const lines = ctx.text.split('\n')
  const original = lines.slice(startLine, endLine + 1).join('\n')
  const placeholder = generatePlaceholder(type, ctx.protectedRegions.length)

  const newLines = [
    ...lines.slice(0, startLine),
    placeholder,
    ...lines.slice(endLine + 1),
  ]

  return {
    ...ctx,
    text: newLines.join('\n'),
    protectedRegions: [
      ...ctx.protectedRegions,
      { placeholder, original, type },
    ],
  }
}

const LIST_MARKER = /^\s*(?:[-*+]\s|\d+[.)]\s)/

function rejoinListContent(text: string): string {
  const lines = text.split('\n')
  const result: string[] = []
  let i = 0

  while (i < lines.length) {
    let current = lines[i]

    while (i + 1 < lines.length) {
      const next = lines[i + 1]
      const nextTrimmed = next.trim()

      if (nextTrimmed === '') break
      if (LIST_MARKER.test(next)) break
      current = current.trimEnd() + ' ' + nextTrimmed
      i++
    }

    result.push(current)
    i++
  }

  return result.join('\n')
}

function cleanProtectedContent(text: string, type: ProtectedRegion['type']): string {
  let cleaned = text
    .replace(ANSI_REGEX, '')
    .replace(DECORATIVE, '')
    .replace(INVISIBLE, '')
    .replace(NBSP, ' ')

  if (type === 'tool-output') {
    for (const pattern of AI_ARTIFACT_PATTERNS) {
      cleaned = cleaned.replace(pattern, '')
    }
    cleaned = cleaned
      .split('\n')
      .map((line) => line.trimEnd())
      .join('\n')
      .replace(/\n{3,}/g, '\n\n')
    return cleaned
  }

  cleaned = cleaned
    .replace(DASH_VARIANTS, '-')
    .replace(SINGLE_QUOTES, "'")
    .replace(DOUBLE_QUOTES, '"')

  if (type === 'bullet-list') {
    cleaned = rejoinListContent(cleaned)
  }

  cleaned = cleaned
    .split('\n')
    .map((line) => line.trimEnd())
    .join('\n')

  return cleaned
}

export const restoreProtectedRegions: PipelineStep = (ctx) => {
  let { text } = ctx

  for (const region of ctx.protectedRegions) {
    const cleaned = cleanProtectedContent(region.original, region.type)
    text = text.replace(region.placeholder, () => cleaned)
  }

  return {
    ...ctx,
    text,
    protectedRegions: [],
  }
}
