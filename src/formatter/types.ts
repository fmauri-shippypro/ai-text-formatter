export type FormatTarget = 'plain' | 'jira' | 'slack' | 'email'

export interface FormatterOptions {
  stripAnsi: boolean
  decodeHtmlEntities: boolean
  normalizeBullets: boolean
  removeDecorative: boolean
  removeBoxDrawing: boolean
  removeInvisible: boolean
  normalizeDashes: boolean
  normalizeSpaces: boolean
  normalizeQuotes: boolean
  preserveDashes: boolean
  preserveQuotes: boolean
  unicodeNormalize: boolean
  cleanWhitespace: boolean
  dedent: boolean
  rejoinLines: boolean
  normalizeNewlines: boolean
  target: FormatTarget
}

export const DEFAULT_OPTIONS: FormatterOptions = {
  stripAnsi: true,
  decodeHtmlEntities: true,
  normalizeBullets: true,
  removeDecorative: true,
  removeBoxDrawing: true,
  removeInvisible: true,
  normalizeDashes: true,
  normalizeSpaces: true,
  normalizeQuotes: true,
  preserveDashes: false,
  preserveQuotes: false,
  unicodeNormalize: true,
  cleanWhitespace: true,
  dedent: true,
  rejoinLines: true,
  normalizeNewlines: true,
  target: 'plain',
}

export interface ProtectedRegion {
  placeholder: string
  original: string
  type: 'table' | 'code-block' | 'bullet-list' | 'tool-output'
}

export interface PipelineContext {
  text: string
  protectedRegions: ProtectedRegion[]
  options: FormatterOptions
}

export type PipelineStep = (ctx: PipelineContext) => PipelineContext
