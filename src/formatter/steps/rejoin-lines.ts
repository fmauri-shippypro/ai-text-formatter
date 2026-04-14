import type { PipelineStep } from '../types'
import { isPlaceholder } from '../utils/placeholder'

function shouldJoin(current: string, next: string): boolean {
  const trimmedCurrent = current.trimEnd()
  const trimmedNext = next.trim()

  if (trimmedNext === '') return false
  if (isPlaceholder(next)) return false
  if (/[.!?:;]$/.test(trimmedCurrent)) return false
  if (/^[A-Z]/.test(trimmedNext)) return false
  if (trimmedCurrent.length < 40) return false

  return true
}

export const rejoinLines: PipelineStep = (ctx) => {
  if (!ctx.options.rejoinLines) return ctx

  const lines = ctx.text.split('\n')
  const result: string[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]

    if (isPlaceholder(line) || line.trim() === '') {
      result.push(line)
      i++
      continue
    }

    let merged = line
    while (i + 1 < lines.length && shouldJoin(merged, lines[i + 1])) {
      i++
      merged = merged.trimEnd() + ' ' + lines[i].trimStart()
    }

    result.push(merged)
    i++
  }

  return { ...ctx, text: result.join('\n') }
}
