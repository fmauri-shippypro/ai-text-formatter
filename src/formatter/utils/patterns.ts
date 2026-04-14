// Shared regex patterns used across pipeline steps and protected content cleaning.
// Single source of truth — import from here, don't re-declare.

export const ANSI_REGEX =
  /[\u001B\u009B][[\]()#;?]*(?:(?:(?:(?:;[-a-zA-Z\d\/#&.:=?%@~_])*|[a-zA-Z\d]+(?:;[-a-zA-Z\d\/#&.:=?%@~_]*)*)?\u0007)|(?:(?:\d{1,4}(?:;\d{0,4})*)?[\dA-PR-TZcf-nq-uy=><~]))/g

export const DECORATIVE = /[⏺◆◇●○■□▶▷⎿❯✻⊘⊙◉△▲▽▼◀◁▷▹►⚡✓✗⊕\u2580-\u259F]/g

export const DASH_VARIANTS = /[\u2014\u2013\u2012\u2015]/g

export const SINGLE_QUOTES = /[\u2018\u2019\u201A\u201B]/g

export const DOUBLE_QUOTES = /[\u201C\u201D\u201E\u201F]/g

export const INVISIBLE = /[\u200B\u200C\u200D\uFEFF\u00AD\u2060\u180E]/g

export const NBSP = /\u00A0/g

export const AI_ARTIFACT_PATTERNS = [
  /^\s*…\s*\+\d+\s+lines?\s*\(ctrl\+o to expand\)\s*$/gm,
  /^\s*Read\s+\d+\s+files?\s*\(ctrl\+o to expand\)\s*$/gm,
  /^\s*[✻*]\s*(?:Cogitated|Crunched|Thought)\s+for\s+.*$/gm,
  /^Copy code\s*$/gm,
  /^Copied!\s*$/gm,
]
