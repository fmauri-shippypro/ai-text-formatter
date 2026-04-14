import type { PipelineStep } from '../types'
import { detectStructures } from '../utils/structure-detector'
import { generatePlaceholder } from '../utils/placeholder'

export const detectAndProtectStructures: PipelineStep = (ctx) => {
  const lines = ctx.text.split('\n')
  const structures = detectStructures(lines)

  if (structures.length === 0) return ctx
  const protectedRegions = [...ctx.protectedRegions]
  const sortedStructures = [...structures].sort(
    (a, b) => b.startLine - a.startLine,
  )

  for (const structure of sortedStructures) {
    const original = lines
      .slice(structure.startLine, structure.endLine + 1)
      .join('\n')
    const placeholder = generatePlaceholder(
      structure.type,
      protectedRegions.length,
    )

    lines.splice(
      structure.startLine,
      structure.endLine - structure.startLine + 1,
      placeholder,
    )

    protectedRegions.push({ placeholder, original, type: structure.type })
  }

  return {
    ...ctx,
    text: lines.join('\n'),
    protectedRegions,
  }
}
