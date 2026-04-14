interface HeaderProps {
  onHelpClick: () => void
}

export function Header({ onHelpClick }: HeaderProps) {
  return (
    <header className="mb-10 animate-fade-in">
      <div className="flex items-center gap-3 mb-3">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-medium"
          style={{
            background: 'var(--color-accent-glow)',
            color: 'var(--color-accent)',
            border: '1px solid var(--color-accent-dim)',
          }}
        >
          T
        </div>
        <div className="h-px flex-1" style={{ background: 'var(--color-border)' }} />
        <button
          onClick={onHelpClick}
          aria-label="Open help page"
          className="text-xs font-medium cursor-pointer transition-colors"
          style={{ color: 'var(--color-text-tertiary)', fontFamily: 'var(--font-body)' }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-accent)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-text-tertiary)')}
        >
          How it works &rarr;
        </button>
      </div>
      <div className="pl-11">
        <h1
          className="text-4xl sm:text-5xl tracking-tight leading-none"
          style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', color: 'var(--color-text)' }}
        >
          AI Text Formatter
        </h1>
        <p
          className="mt-3 text-sm tracking-wide"
          style={{ color: 'var(--color-text-secondary)', fontFamily: 'var(--font-body)' }}
        >
          Paste messy AI output. Get clean, paste-ready text.
        </p>
      </div>
    </header>
  )
}
