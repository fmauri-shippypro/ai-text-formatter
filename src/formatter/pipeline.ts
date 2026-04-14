import type { FormatterOptions, PipelineContext, PipelineStep } from './types'
import { DEFAULT_OPTIONS } from './types'
import { restoreProtectedRegions } from './utils/placeholder'
import { stripAnsi } from './steps/strip-ansi'
import { decodeHtmlEntities } from './steps/decode-html-entities'
import { normalizeBullets } from './steps/normalize-bullets'
import { detectAndProtectStructures } from './steps/detect-structures'
import { removeDecorative } from './steps/remove-decorative'
import { removeBoxDrawing } from './steps/remove-box-drawing'
import { removeInvisible } from './steps/remove-invisible'
import { normalizeDashes } from './steps/normalize-dashes'
import { normalizeSpaces } from './steps/normalize-spaces'
import { normalizeQuotes } from './steps/normalize-quotes'
import { unicodeNormalize } from './steps/unicode-normalize'
import { whitespaceCleanup } from './steps/whitespace-cleanup'
import { dedent } from './steps/dedent'
import { rejoinLines } from './steps/rejoin-lines'
import { normalizeNewlines } from './steps/normalize-newlines'
import { finalCleanup } from './steps/final-cleanup'
import { formatForTarget } from './steps/format-for-target'

function createPipeline(): PipelineStep[] {
  return [
    normalizeNewlines,           // first: \r\n → \n before any split('\n')
    stripAnsi,
    decodeHtmlEntities,
    normalizeBullets,
    detectAndProtectStructures,  // before removeDecorative — uses ⏺/⎿ as markers
    removeDecorative,
    removeBoxDrawing,
    removeInvisible,
    normalizeDashes,
    normalizeSpaces,
    normalizeQuotes,
    unicodeNormalize,
    whitespaceCleanup,
    dedent,
    rejoinLines,
    finalCleanup,
    restoreProtectedRegions,
    formatForTarget,             // last — protects code blocks internally
  ]
}

export function runPipeline(
  input: string,
  options: Partial<FormatterOptions> = {},
): string {
  const mergedOptions: FormatterOptions = { ...DEFAULT_OPTIONS, ...options }

  // Auto-derive preserve flags from target unless explicitly set
  if ((mergedOptions.target === 'jira' || mergedOptions.target === 'slack') && options.preserveDashes === undefined) {
    mergedOptions.preserveDashes = true
  }
  if ((mergedOptions.target === 'jira' || mergedOptions.target === 'slack') && options.preserveQuotes === undefined) {
    mergedOptions.preserveQuotes = true
  }

  const steps = createPipeline()

  let ctx: PipelineContext = {
    text: input,
    protectedRegions: [],
    options: mergedOptions,
  }

  try {
    for (const step of steps) {
      ctx = step(ctx)
    }
  } catch {
    return input
  }

  return ctx.text
}
