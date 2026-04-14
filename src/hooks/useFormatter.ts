import { useState, useEffect } from 'react'
import { runPipeline } from '../formatter'
import type { FormatterOptions } from '../formatter'
import { DEFAULT_OPTIONS } from '../formatter'

export function useFormatter() {
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [options, setOptions] = useState<FormatterOptions>({ ...DEFAULT_OPTIONS })

  useEffect(() => {
    const timer = setTimeout(() => {
      if (input.trim()) {
        if (input.length > 500_000) {
          setError('Input is too large (over 500k characters). Reduce the size or disable some rules.')
          setOutput(input)
          return
        }
        try {
          setOutput(runPipeline(input, options))
          setError(null)
        } catch {
          setError('Formatting failed. Try with a smaller input or disable some rules.')
          setOutput(input)
        }
      } else {
        setOutput('')
        setError(null)
      }
    }, 150)
    return () => clearTimeout(timer)
  }, [input, options])

  const clear = () => {
    setInput('')
    setOutput('')
    setError(null)
  }

  return { input, setInput, output, options, setOptions, clear, error }
}
