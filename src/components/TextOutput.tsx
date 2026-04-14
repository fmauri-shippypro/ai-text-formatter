import { useState } from 'react'
import { copyToClipboard } from '../lib/clipboard'

interface TextOutputProps {
  value: string
}

export function TextOutput({ value }: TextOutputProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    const success = await copyToClipboard(value)
    if (success) {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="flex flex-col gap-2.5 animate-fade-in" style={{ animationDelay: '0.15s' }}>
      <div className="flex items-center justify-between">
        <label
          htmlFor="text-output"
          className="text-xs font-medium uppercase tracking-widest"
          style={{ color: 'var(--color-text-tertiary)', fontFamily: 'var(--font-body)' }}
        >
          Output
        </label>
        {value && (
          <button
            onClick={handleCopy}
            aria-label="Copy formatted text to clipboard"
            aria-live="polite"
            className="text-xs font-medium transition-all duration-200 cursor-pointer"
            style={{
              fontFamily: 'var(--font-body)',
              padding: '5px 14px',
              borderRadius: '6px',
              background: copied ? 'var(--color-success-dim)' : 'var(--color-accent-glow)',
              color: copied ? 'var(--color-success)' : 'var(--color-accent)',
              border: `1px solid ${copied ? 'var(--color-success)' : 'var(--color-accent-dim)'}`,
            }}
          >
            {copied ? '\u2713 Copied!' : 'Copy to clipboard'}
          </button>
        )}
      </div>
      <textarea
        id="text-output"
        aria-label="Formatted output"
        value={value}
        readOnly
        placeholder="Cleaned text will appear here..."
        className="w-full resize-y transition-all duration-200"
        style={{
          height: '360px',
          minHeight: '200px',
          background: value ? 'var(--color-surface-bright)' : 'var(--color-surface)',
          color: 'var(--color-text)',
          border: `1px solid ${value ? 'var(--color-border-bright)' : 'var(--color-border)'}`,
          borderRadius: '10px',
          padding: '18px 20px',
        }}
      />
    </div>
  )
}
