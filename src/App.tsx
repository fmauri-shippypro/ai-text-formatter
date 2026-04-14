import { useState, lazy, Suspense } from 'react'
import { Header } from './components/Header'
import { TextInput } from './components/TextInput'
import { TextOutput } from './components/TextOutput'
import { FormatSelector } from './components/FormatSelector'
import { CleaningOptions } from './components/CleaningOptions'
import { useFormatter } from './hooks/useFormatter'
import type { FormatTarget } from './formatter'

const HelpPage = lazy(() => import('./components/HelpPage'))

function App() {
  const { input, setInput, output, options, setOptions, clear, error } = useFormatter()
  const [showHelp, setShowHelp] = useState(false)

  const handleTargetChange = (target: FormatTarget) => {
    const preserve = target === 'jira' || target === 'slack'
    setOptions({ ...options, target, preserveDashes: preserve, preserveQuotes: preserve })
  }

  const charsRemoved = input.length - output.length

  if (showHelp) {
    return (
      <Suspense fallback={<div className="min-h-screen" style={{ background: 'var(--color-base)' }} />}>
        <HelpPage onBack={() => setShowHelp(false)} />
      </Suspense>
    )
  }

  return (
    <div className="min-h-screen relative" style={{ background: 'var(--color-base)' }}>
      <div className="max-w-7xl mx-auto px-5 sm:px-8 py-10 sm:py-14 relative z-10">
        <Header onHelpClick={() => setShowHelp(true)} />

        <FormatSelector target={options.target} onChange={handleTargetChange} />

        {/* Main editor panels */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 lg:gap-6">
          <TextInput value={input} onChange={setInput} onClear={clear} />

          {/* Center arrow — desktop only */}
          <div className="hidden lg:flex absolute left-1/2 -translate-x-1/2 z-20 items-center" style={{ top: 'calc(50% + 40px)' }}>
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-sm"
              style={{
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                color: input ? 'var(--color-accent)' : 'var(--color-text-tertiary)',
                transition: 'color 0.3s, box-shadow 0.3s',
                boxShadow: input ? '0 0 20px var(--color-accent-glow)' : 'none',
              }}
            >
              &rarr;
            </div>
          </div>

          <TextOutput value={output} />
        </div>

        {/* Error/warning banner */}
        {error && (
          <div
            className="mt-5 px-4 py-3 rounded-lg text-sm animate-fade-in"
            style={{
              fontFamily: 'var(--font-body)',
              background: 'rgba(245, 158, 11, 0.1)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              color: 'rgb(245, 158, 11)',
            }}
          >
            {error}
          </div>
        )}

        {/* Stats bar */}
        {input && output && (
          <div
            className="mt-5 flex items-center justify-center gap-4 text-xs animate-fade-in"
            style={{ fontFamily: 'var(--font-body)', color: 'var(--color-text-tertiary)' }}
          >
            <span>{input.length.toLocaleString()} chars in</span>
            <span style={{ color: 'var(--color-border-bright)' }}>/</span>
            <span>{output.length.toLocaleString()} chars out</span>
            {charsRemoved > 0 && (
              <>
                <span style={{ color: 'var(--color-border-bright)' }}>/</span>
                <span style={{ color: 'var(--color-success)' }}>
                  &minus;{charsRemoved.toLocaleString()} removed
                </span>
              </>
            )}
          </div>
        )}

        {/* Settings section — always visible */}
        <div className="mt-8">
          <div className="h-px w-full mb-6" style={{ background: 'var(--color-border)' }} />
          <div
            className="p-5 rounded-xl"
            style={{
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
            }}
          >
            <CleaningOptions options={options} onChange={setOptions} />
          </div>
        </div>

        {/* Footer */}
        <footer
          className="mt-12 pt-6 text-center text-xs"
          style={{
            borderTop: '1px solid var(--color-border)',
            color: 'var(--color-text-tertiary)',
            fontFamily: 'var(--font-body)',
          }}
        >
          All processing happens locally in your browser. No data is sent anywhere.
        </footer>
      </div>
    </div>
  )
}

export default App
