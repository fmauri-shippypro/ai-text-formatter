interface HelpPageProps {
  onBack: () => void
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <h2
        className="text-xl mb-4 pb-2"
        style={{
          fontFamily: 'var(--font-display)',
          fontStyle: 'italic',
          color: 'var(--color-text)',
          borderBottom: '1px solid var(--color-border)',
        }}
      >
        {title}
      </h2>
      <div className="space-y-3 text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
        {children}
      </div>
    </section>
  )
}

function Rule({ name, description, before, after }: { name: string; description: string; before: string; after: string }) {
  return (
    <div
      className="p-4 rounded-lg mb-3"
      style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
    >
      <div className="flex items-start gap-3 mb-3">
        <span
          className="text-xs font-medium px-2 py-0.5 rounded shrink-0 mt-0.5"
          style={{ background: 'var(--color-accent-glow)', color: 'var(--color-accent)', border: '1px solid var(--color-accent-dim)' }}
        >
          {name}
        </span>
        <p style={{ color: 'var(--color-text-secondary)' }}>{description}</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <span className="text-xs uppercase tracking-wider mb-1 block" style={{ color: 'var(--color-text-tertiary)' }}>Before</span>
          <pre
            className="text-xs p-3 rounded overflow-x-auto whitespace-pre-wrap"
            style={{ background: 'var(--color-base)', color: '#ef9a9a', fontFamily: 'var(--font-mono)' }}
          >{before}</pre>
        </div>
        <div>
          <span className="text-xs uppercase tracking-wider mb-1 block" style={{ color: 'var(--color-text-tertiary)' }}>After</span>
          <pre
            className="text-xs p-3 rounded overflow-x-auto whitespace-pre-wrap"
            style={{ background: 'var(--color-base)', color: 'var(--color-success)', fontFamily: 'var(--font-mono)' }}
          >{after}</pre>
        </div>
      </div>
    </div>
  )
}

function TargetCard({ name, description, children }: { name: string; description: string; children: React.ReactNode }) {
  return (
    <div
      className="p-5 rounded-xl"
      style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
    >
      <h3 className="text-base font-semibold mb-1" style={{ color: 'var(--color-text)' }}>{name}</h3>
      <p className="text-xs mb-4" style={{ color: 'var(--color-text-tertiary)' }}>{description}</p>
      <div className="space-y-2 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
        {children}
      </div>
    </div>
  )
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-2">
      <span style={{ color: 'var(--color-accent)' }}>-</span>
      <span>{children}</span>
    </div>
  )
}

export default function HelpPage({ onBack }: HelpPageProps) {
  return (
    <div className="min-h-screen relative" style={{ background: 'var(--color-base)' }}>
      <main className="max-w-4xl mx-auto px-5 sm:px-8 py-10 sm:py-14 relative z-10" style={{ fontFamily: 'var(--font-body)' }}>

        {/* Back button */}
        <button
          onClick={onBack}
          aria-label="Back to formatter"
          className="flex items-center gap-2 text-xs font-medium mb-8 cursor-pointer transition-colors"
          style={{ color: 'var(--color-accent)' }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-text)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-accent)')}
        >
          <span>&larr;</span>
          <span>Back to formatter</span>
        </button>

        {/* Title */}
        <header className="mb-12">
          <h1
            className="text-4xl sm:text-5xl tracking-tight leading-none mb-4"
            style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', color: 'var(--color-text)' }}
          >
            How it works
          </h1>
          <p className="text-sm leading-relaxed max-w-2xl" style={{ color: 'var(--color-text-secondary)' }}>
            AI Text Formatter takes messy text copied from AI terminals (Claude Code, ChatGPT, Copilot) and transforms it into clean,
            paste-ready text for Jira, Slack, email, or any other destination. All processing happens locally in your browser &mdash;
            no data leaves your machine.
          </p>
        </header>

        {/* ── The Pipeline ── */}
        <Section title="The Cleaning Pipeline">
          <p>
            Your text passes through a sequence of independent cleaning steps, each responsible for one type of transformation.
            Every step can be individually toggled on or off in the settings panel. The steps execute in this exact order:
          </p>
        </Section>

        {/* ── Step by step ── */}
        <Section title="Step 1 &mdash; Strip ANSI Escape Codes">
          <p>
            Terminal applications use ANSI escape sequences to add colors, bold text, cursor movement, and other visual effects.
            When you copy text from a terminal, these invisible control characters often come along and produce garbled output
            when pasted elsewhere. This step removes all of them, including 256-color codes, RGB sequences, and cursor movement commands.
          </p>
          <Rule
            name="ANSI codes"
            description="Color codes, bold, dim, underline, cursor movement sequences"
            before={'[1;32m✓[0m All tests [2mpassed[0m'}
            after="✓ All tests passed"
          />
        </Section>

        <Section title="Step 2 &mdash; Normalize Bullet Characters">
          <p>
            AI tools often use fancy Unicode bullet characters instead of standard Markdown dashes.
            This step converts them all to the standard <code style={{ background: 'var(--color-surface-bright)', padding: '1px 5px', borderRadius: '3px', fontFamily: 'var(--font-mono)', fontSize: '12px' }}>- </code> Markdown
            bullet format, which is universally recognized. The conversion only applies to bullets at the beginning of a line &mdash; the same
            characters appearing mid-sentence are left untouched.
          </p>
          <Rule
            name="Bullets"
            description="Converts fancy bullet symbols to Markdown dashes"
            before={"• First item\n▸ Second item\n➤ Third item"}
            after={"- First item\n- Second item\n- Third item"}
          />
        </Section>

        <Section title="Step 3 &mdash; Remove Decorative Symbols">
          <p>
            CLI tools like Claude Code use special Unicode symbols for their interface: <code style={{ background: 'var(--color-surface-bright)', padding: '1px 5px', borderRadius: '3px', fontFamily: 'var(--font-mono)', fontSize: '12px' }}>⏺</code> for
            message markers, <code style={{ background: 'var(--color-surface-bright)', padding: '1px 5px', borderRadius: '3px', fontFamily: 'var(--font-mono)', fontSize: '12px' }}>⎿</code> for response indicators, <code style={{ background: 'var(--color-surface-bright)', padding: '1px 5px', borderRadius: '3px', fontFamily: 'var(--font-mono)', fontSize: '12px' }}>❯</code> for
            prompt markers, and <code style={{ background: 'var(--color-surface-bright)', padding: '1px 5px', borderRadius: '3px', fontFamily: 'var(--font-mono)', fontSize: '12px' }}>✻</code> for thinking indicators. This step removes all of these, plus
            entire Claude Code artifact lines like <em>"... +8 lines (ctrl+o to expand)"</em> and <em>"Cogitated for 4m 57s"</em>.
          </p>
          <Rule
            name="Decorative"
            description="Terminal UI symbols and Claude Code artifact lines"
            before={"⏺ Task completed\n  ⎿  Output here\n✻ Cogitated for 2m 30s"}
            after={"Task completed\n  Output here"}
          />
        </Section>

        <Section title="Step 4 &mdash; Remove Box-Drawing Characters">
          <p>
            Terminal tables and panels use Unicode box-drawing characters to create visual borders (lines like <code style={{ background: 'var(--color-surface-bright)', padding: '1px 5px', borderRadius: '3px', fontFamily: 'var(--font-mono)', fontSize: '12px' }}>┌─┐│└┘</code>).
            This step removes them surgically: entire horizontal separator lines are filtered out, and vertical border
            characters (<code style={{ background: 'var(--color-surface-bright)', padding: '1px 5px', borderRadius: '3px', fontFamily: 'var(--font-mono)', fontSize: '12px' }}>│ ║ ┃</code>) are removed everywhere. This is safe because Markdown tables use ASCII
            pipe <code style={{ background: 'var(--color-surface-bright)', padding: '1px 5px', borderRadius: '3px', fontFamily: 'var(--font-mono)', fontSize: '12px' }}>|</code> (a different character), which is preserved.
          </p>
          <Rule
            name="Box drawing"
            description="Terminal table borders, separators, and frames"
            before={"┌──────┬────────┐\n│ Name │ Status │\n├──────┼────────┤\n│ Auth │ Done   │\n└──────┴────────┘"}
            after={"Name   Status\nAuth   Done"}
          />
        </Section>

        <Section title="Step 5 &mdash; Remove Invisible Unicode">
          <p>
            Text copied from various sources can contain invisible Unicode characters that cause subtle formatting
            issues: zero-width spaces (U+200B), byte order marks (U+FEFF), soft hyphens (U+00AD), word joiners (U+2060),
            and zero-width joiners/non-joiners. These are completely invisible but can break copy-paste, search, and text comparison.
            This step removes all of them.
          </p>
          <Rule
            name="Invisible"
            description="Zero-width spaces, BOM, soft hyphens, word joiners"
            before={"he\u200Bllo w\u00ADorld (invisible chars between letters)"}
            after={"hello world"}
          />
        </Section>

        <Section title="Step 6 &mdash; Normalize Dashes">
          <p>
            AI outputs frequently use typographic dash variants: em-dashes (&mdash;), en-dashes (&ndash;), figure dashes,
            and horizontal bars. These look similar to a regular hyphen but are different Unicode characters that can cause
            issues when pasted into forms, search fields, or code. This step converts them all to the standard ASCII
            hyphen-minus. <strong>Note:</strong> when the target is Jira or Slack, this step is skipped because those
            platforms render typographic dashes natively.
          </p>
          <Rule
            name="Dashes"
            description="Em-dash, en-dash, figure dash, horizontal bar"
            before={"Next steps \u2014 implement the dashboard\nPages 1\u201310"}
            after={"Next steps - implement the dashboard\nPages 1-10"}
          />
        </Section>

        <Section title="Step 7 &mdash; Normalize Spaces">
          <p>
            Non-breaking spaces (U+00A0) look identical to regular spaces but behave differently &mdash; they prevent line
            breaks and can cause alignment issues when pasted. This step converts them to standard spaces.
          </p>
        </Section>

        <Section title="Step 8 &mdash; Normalize Smart Quotes">
          <p>
            AI tools often produce typographic "smart" quotes (curly quotes) instead of straight ASCII quotes. While they
            look nice in documents, they cause problems in code, commands, and many form fields. This step converts all
            smart quote variants to their ASCII equivalents. <strong>Note:</strong> when the target is Jira or Slack,
            this step is skipped because those platforms render smart quotes correctly.
          </p>
          <Rule
            name="Quotes"
            description="Curly/smart single and double quotes to ASCII"
            before={'\u201CHello,\u201D she said. \u2018It\u2019s fine.\u2019'}
            after={'"Hello," she said. \'It\'s fine.\''}
          />
        </Section>

        <Section title="Step 9 &mdash; Unicode Normalization (NFC)">
          <p>
            Unicode allows the same visual character to be represented in multiple ways. For example, "e" can be a single
            character or "e" + combining accent. NFC normalization ensures consistent representation, which prevents
            issues with search, comparison, and display.
          </p>
        </Section>

        <Section title="Step 10 &mdash; Whitespace Cleanup">
          <p>
            Cleans up whitespace issues: collapses multiple consecutive spaces into one (while preserving leading
            indentation), removes trailing whitespace from each line, and converts lines that contain only spaces into
            empty lines. This is one of the most impactful steps for terminal output, which is often padded with spaces
            to fill the terminal width.
          </p>
          <Rule
            name="Whitespace"
            description="Multiple spaces, trailing whitespace, padding"
            before={"hello    world   \n  indented   text  "}
            after={"hello world\n  indented text"}
          />
        </Section>

        <Section title="Step 11 &mdash; Dedent">
          <p>
            Terminal output is often uniformly indented (e.g., every line starts with 4+ spaces because of the terminal
            UI frame). This step detects the minimum common indentation across all non-empty lines and strips it, while
            preserving relative indentation differences. For example, if all lines have at least 4 spaces of indent, those
            4 spaces are removed from every line.
          </p>
          <Rule
            name="Dedent"
            description="Strips common leading whitespace from all lines"
            before={"    parent\n      child\n    sibling"}
            after={"parent\n  child\nsibling"}
          />
        </Section>

        <Section title="Step 12 &mdash; Re-join Wrapped Lines">
          <p>
            When you copy text from a terminal with a fixed width (e.g., 80 or 120 columns), long sentences get split
            into multiple lines. This step detects and re-joins these artificial line breaks using heuristics:
          </p>
          <div className="pl-4 space-y-1 text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
            <Bullet>The current line is long enough (&ge;40 chars) to suggest it was wrapped</Bullet>
            <Bullet>The current line does not end with sentence-ending punctuation (. ! ? : ;)</Bullet>
            <Bullet>The next line does not start with an uppercase letter (which would indicate a new paragraph)</Bullet>
            <Bullet>The next line is not blank or a protected region (table, code block, list)</Bullet>
          </div>
          <div className="mt-3">
            <Rule
              name="Re-join"
              description="Merges lines that were artificially split by terminal width"
              before={"This is a long sentence that was wrapped at the\nterminal width boundary and should be joined."}
              after={"This is a long sentence that was wrapped at the terminal width boundary and should be joined."}
            />
          </div>
        </Section>

        <Section title="Step 13 &mdash; Final Cleanup">
          <p>
            Normalizes line endings (CRLF and CR to LF), collapses three or more consecutive blank lines
            into a maximum of two, and trims leading/trailing whitespace from the entire document.
          </p>
        </Section>

        {/* ── Structure preservation ── */}
        <Section title="Structure Preservation">
          <p>
            Before the aggressive cleaning steps run, the pipeline scans the text and detects structures that should be
            preserved intact. These are temporarily replaced with placeholders, protected from all cleaning, and then
            restored at the end with light cleaning (ANSI removal, trailing whitespace trim, and for lists, re-joining
            of wrapped continuation lines).
          </p>
          <p className="mt-2"><strong>Protected structures:</strong></p>
          <div className="pl-4 space-y-1 text-xs mt-2" style={{ color: 'var(--color-text-tertiary)' }}>
            <Bullet><strong style={{ color: 'var(--color-text-secondary)' }}>Markdown tables</strong> &mdash; Lines with ASCII pipe <code style={{ background: 'var(--color-surface-bright)', padding: '1px 5px', borderRadius: '3px', fontFamily: 'var(--font-mono)', fontSize: '11px' }}>|</code> characters and a separator row with dashes. Pipe count must be consistent across all rows.</Bullet>
            <Bullet><strong style={{ color: 'var(--color-text-secondary)' }}>Fenced code blocks</strong> &mdash; Content between <code style={{ background: 'var(--color-surface-bright)', padding: '1px 5px', borderRadius: '3px', fontFamily: 'var(--font-mono)', fontSize: '11px' }}>```</code> or <code style={{ background: 'var(--color-surface-bright)', padding: '1px 5px', borderRadius: '3px', fontFamily: 'var(--font-mono)', fontSize: '11px' }}>~~~</code> fences. Everything inside is preserved verbatim, including box-drawing characters.</Bullet>
            <Bullet><strong style={{ color: 'var(--color-text-secondary)' }}>Bullet and numbered lists</strong> &mdash; Contiguous blocks of lines starting with <code style={{ background: 'var(--color-surface-bright)', padding: '1px 5px', borderRadius: '3px', fontFamily: 'var(--font-mono)', fontSize: '11px' }}>-</code>, <code style={{ background: 'var(--color-surface-bright)', padding: '1px 5px', borderRadius: '3px', fontFamily: 'var(--font-mono)', fontSize: '11px' }}>*</code>, <code style={{ background: 'var(--color-surface-bright)', padding: '1px 5px', borderRadius: '3px', fontFamily: 'var(--font-mono)', fontSize: '11px' }}>+</code>, or <code style={{ background: 'var(--color-surface-bright)', padding: '1px 5px', borderRadius: '3px', fontFamily: 'var(--font-mono)', fontSize: '11px' }}>1.</code>, including indented continuation lines. Wrapped lines within list items are re-joined.</Bullet>
            <Bullet><strong style={{ color: 'var(--color-text-secondary)' }}>Tool output blocks</strong> &mdash; Claude Code tool calls (<code style={{ background: 'var(--color-surface-bright)', padding: '1px 5px', borderRadius: '3px', fontFamily: 'var(--font-mono)', fontSize: '11px' }}>Write(...)</code>, <code style={{ background: 'var(--color-surface-bright)', padding: '1px 5px', borderRadius: '3px', fontFamily: 'var(--font-mono)', fontSize: '11px' }}>Bash(...)</code>, etc.) and their indented output, including diffs. These blocks retain their original structure.</Bullet>
          </div>
        </Section>

        {/* ── Format targets ── */}
        <Section title="Format Targets">
          <p>
            After all cleaning is done, a final transformation step adapts the output for the selected destination
            platform. The cleaning pipeline is the same for all targets &mdash; only the final formatting pass differs.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <TargetCard name="Plain Text" description="Default &mdash; maximum ASCII cleanup">
              <Bullet>All dashes normalized to ASCII hyphen</Bullet>
              <Bullet>All smart quotes normalized to straight quotes</Bullet>
              <Bullet>Code blocks, tables, lists preserved as Markdown</Bullet>
              <Bullet>No additional formatting transformations</Bullet>
            </TargetCard>
            <TargetCard name="Jira" description="Atlassian wiki markup format">
              <Bullet>Em/en-dashes <strong>preserved</strong> (Jira renders them)</Bullet>
              <Bullet>Smart quotes <strong>preserved</strong> (Jira renders them)</Bullet>
              <Bullet><code style={{ fontFamily: 'var(--font-mono)', fontSize: '11px' }}>```lang</code> code blocks &rarr; <code style={{ fontFamily: 'var(--font-mono)', fontSize: '11px' }}>{'{{code:lang}}'}</code></Bullet>
              <Bullet><code style={{ fontFamily: 'var(--font-mono)', fontSize: '11px' }}>## Heading</code> &rarr; <code style={{ fontFamily: 'var(--font-mono)', fontSize: '11px' }}>h2. Heading</code></Bullet>
              <Bullet><code style={{ fontFamily: 'var(--font-mono)', fontSize: '11px' }}>**bold**</code> &rarr; <code style={{ fontFamily: 'var(--font-mono)', fontSize: '11px' }}>*bold*</code></Bullet>
              <Bullet>Table header row converted to <code style={{ fontFamily: 'var(--font-mono)', fontSize: '11px' }}>|| col ||</code> format</Bullet>
            </TargetCard>
            <TargetCard name="Slack" description="Slack mrkdwn format">
              <Bullet>Em/en-dashes <strong>preserved</strong> (Slack renders them)</Bullet>
              <Bullet>Smart quotes <strong>preserved</strong> (Slack renders them)</Bullet>
              <Bullet>Tables wrapped in <code style={{ fontFamily: 'var(--font-mono)', fontSize: '11px' }}>```</code> code blocks (Slack cannot render tables)</Bullet>
              <Bullet><code style={{ fontFamily: 'var(--font-mono)', fontSize: '11px' }}>**bold**</code> &rarr; <code style={{ fontFamily: 'var(--font-mono)', fontSize: '11px' }}>*bold*</code></Bullet>
              <Bullet><code style={{ fontFamily: 'var(--font-mono)', fontSize: '11px' }}>~~strike~~</code> &rarr; <code style={{ fontFamily: 'var(--font-mono)', fontSize: '11px' }}>~strike~</code></Bullet>
              <Bullet>Code blocks kept as <code style={{ fontFamily: 'var(--font-mono)', fontSize: '11px' }}>```</code> (native Slack format)</Bullet>
            </TargetCard>
            <TargetCard name="Email" description="Plain text optimized for readability">
              <Bullet>Dashes normalized to ASCII (email client compatibility)</Bullet>
              <Bullet>Smart quotes normalized (email client compatibility)</Bullet>
              <Bullet>Code blocks converted to 4-space indentation</Bullet>
              <Bullet>Tables preserved as plain text (already pipe-aligned)</Bullet>
            </TargetCard>
          </div>
        </Section>

        {/* ── Privacy ── */}
        <Section title="Privacy">
          <p>
            AI Text Formatter is a 100% client-side application. Your text is processed entirely in your browser
            using JavaScript. No data is sent to any server, no API calls are made, nothing is stored. You can
            verify this by checking the Network tab in your browser's developer tools &mdash; you will see zero
            requests after the initial page load.
          </p>
        </Section>

        {/* Footer */}
        <footer
          className="mt-12 pt-6 text-center text-xs"
          style={{ borderTop: '1px solid var(--color-border)', color: 'var(--color-text-tertiary)' }}
        >
          AI Text Formatter &mdash; Open source on GitHub
        </footer>
      </main>
    </div>
  )
}
