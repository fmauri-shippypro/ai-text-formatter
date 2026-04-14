import type { FormatterOptions } from '../formatter'

interface CleaningOptionsProps {
  options: FormatterOptions
  onChange: (options: FormatterOptions) => void
}

const OPTION_LABELS: { key: keyof Omit<FormatterOptions, 'target' | 'preserveDashes' | 'preserveQuotes'>; label: string }[] = [
  { key: 'stripAnsi', label: 'ANSI codes' },
  { key: 'decodeHtmlEntities', label: 'HTML entities' },
  { key: 'normalizeBullets', label: 'Bullet chars' },
  { key: 'removeDecorative', label: 'Decorative symbols' },
  { key: 'removeBoxDrawing', label: 'Box drawing' },
  { key: 'removeInvisible', label: 'Invisible chars' },
  { key: 'normalizeDashes', label: 'Dash variants' },
  { key: 'normalizeSpaces', label: 'Spaces (NBSP)' },
  { key: 'normalizeQuotes', label: 'Smart quotes' },
  { key: 'unicodeNormalize', label: 'Unicode (NFC)' },
  { key: 'cleanWhitespace', label: 'Whitespace' },
  { key: 'dedent', label: 'Dedent' },
  { key: 'rejoinLines', label: 'Line re-join' },
  { key: 'normalizeNewlines', label: 'Newlines' },
]

export function CleaningOptions({ options, onChange }: CleaningOptionsProps) {
  const toggle = (key: keyof Omit<FormatterOptions, 'target' | 'preserveDashes' | 'preserveQuotes'>) => {
    onChange({ ...options, [key]: !options[key] })
  }

  const allEnabled = OPTION_LABELS.every(({ key }) => options[key])
  const toggleAll = () => {
    const newVal = !allEnabled
    const updated = { ...options }
    for (const { key } of OPTION_LABELS) {
      updated[key] = newVal
    }
    onChange(updated)
  }

  return (
    <div style={{ fontFamily: 'var(--font-body)' }}>
      <div className="flex items-center justify-between mb-4">
        <span
          className="text-xs uppercase tracking-widest font-medium"
          style={{ color: 'var(--color-text-tertiary)' }}
        >
          Cleaning rules
        </span>
        <button
          onClick={toggleAll}
          className="text-xs transition-colors duration-200 cursor-pointer"
          style={{ color: 'var(--color-text-tertiary)' }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-accent)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-text-tertiary)')}
        >
          {allEnabled ? 'Disable all' : 'Enable all'}
        </button>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-3">
        {OPTION_LABELS.map(({ key, label }) => (
          <label
            key={key}
            className="flex items-center gap-2.5 text-xs cursor-pointer group"
            style={{ color: options[key] ? 'var(--color-text-secondary)' : 'var(--color-text-tertiary)' }}
          >
            <input
              type="checkbox"
              checked={options[key] as boolean}
              onChange={() => toggle(key)}
            />
            <span className="transition-colors duration-150 group-hover:text-[var(--color-text)]">
              {label}
            </span>
          </label>
        ))}
      </div>
    </div>
  )
}
