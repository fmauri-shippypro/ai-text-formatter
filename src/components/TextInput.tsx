interface TextInputProps {
  value: string
  onChange: (value: string) => void
  onClear: () => void
}

export function TextInput({ value, onChange, onClear }: TextInputProps) {
  return (
    <div className="flex flex-col gap-2.5 animate-fade-in" style={{ animationDelay: '0.1s' }}>
      <div className="flex items-center justify-between">
        <label
          htmlFor="text-input"
          className="text-xs font-medium uppercase tracking-widest"
          style={{ color: 'var(--color-text-tertiary)', fontFamily: 'var(--font-body)' }}
        >
          Input
        </label>
        {value && (
          <button
            onClick={onClear}
            aria-label="Clear input"
            className="text-xs transition-colors duration-200 cursor-pointer"
            style={{ color: 'var(--color-text-tertiary)', fontFamily: 'var(--font-body)' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-accent)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-text-tertiary)')}
          >
            Clear all
          </button>
        )}
      </div>
      <textarea
        id="text-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Paste AI-generated text here..."
        spellCheck={false}
        className="w-full resize-y transition-all duration-200"
        style={{
          height: '360px',
          minHeight: '200px',
          background: 'var(--color-surface-bright)',
          color: 'var(--color-text)',
          border: '1px solid var(--color-border)',
          borderRadius: '10px',
          padding: '18px 20px',
        }}
      />
    </div>
  )
}
