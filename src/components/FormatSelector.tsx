import type { FormatTarget } from '../formatter'

interface FormatSelectorProps {
  target: FormatTarget
  onChange: (target: FormatTarget) => void
}

const TARGETS: { value: FormatTarget; label: string }[] = [
  { value: 'plain', label: 'Plain' },
  { value: 'jira', label: 'Jira' },
  { value: 'slack', label: 'Slack' },
  { value: 'email', label: 'Email' },
]

export function FormatSelector({ target, onChange }: FormatSelectorProps) {
  return (
    <div
      role="radiogroup"
      aria-label="Output format"
      className="flex items-center gap-1.5 mb-8 animate-fade-in"
      style={{ animationDelay: '0.05s', fontFamily: 'var(--font-body)' }}
    >
      <span
        className="text-xs mr-2 uppercase tracking-widest"
        style={{ color: 'var(--color-text-tertiary)' }}
      >
        Target
      </span>
      {TARGETS.map(({ value, label }) => (
        <button
          key={value}
          role="radio"
          aria-checked={target === value}
          onClick={() => onChange(value)}
          className="text-xs font-medium px-3.5 py-1.5 transition-all duration-200 cursor-pointer"
          style={{
            borderRadius: '6px',
            background: target === value ? 'var(--color-accent-glow)' : 'transparent',
            color: target === value ? 'var(--color-accent)' : 'var(--color-text-tertiary)',
            border: `1px solid ${target === value ? 'var(--color-accent-dim)' : 'transparent'}`,
          }}
          onMouseEnter={(e) => {
            if (target !== value) {
              e.currentTarget.style.color = 'var(--color-text-secondary)'
              e.currentTarget.style.background = 'var(--color-surface-bright)'
            }
          }}
          onMouseLeave={(e) => {
            if (target !== value) {
              e.currentTarget.style.color = 'var(--color-text-tertiary)'
              e.currentTarget.style.background = 'transparent'
            }
          }}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
