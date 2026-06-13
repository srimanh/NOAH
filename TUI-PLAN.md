# 🖥️ NOAH TUI — Reverse-Engineering Pi's TUI (Implementation Plan)

Reuse Pi's TUI **engine** (`@earendil-works/pi-tui`) and build NOAH's own components
on it. Additive frontend (`noah --tui`); the frozen print CLI stays the default and
untouched. Built **test-first (red → green → refactor)**.

---

## 1 · What we reuse vs build

**Reuse (Pi's code — the hard parts):**
- `TUI` — differential render loop (`start` / `stop` / `requestRender`)
- `Component` interface — `render(width): string[]`, `handleInput?`, `invalidate()`
- `Container` — composite parent for our transcript
- `Box`, `Text`, `Markdown`, `Loader`, `Spacer`, `TruncatedText`
- `ProcessTerminal`, keys / keybindings / themes

**Build (NOAH):**
- Components: `Header`, `RequestPanel`, `ThinkingView`, `ToolCard`, `SafetyReview`,
  `SafetyBlock`, `AuditLine`, `ResponseView`
- `TranscriptController` — maps `session.subscribe` events → append/update components
- `noah --tui` frontend wiring (safety extension + tools unchanged)

## 2 · Architecture (mirrored from Pi)

```
        ProcessTerminal
              │
            TUI  ← render loop (diff, cursor, input)
              │
        TranscriptContainer (Container)            ← root
   ┌──────┬───────────┬───────────┬──────────┬─────────────┐
 Header Request   Thinking     ToolCard   Safety        Response
        Panel     View(dim)    (+Loader)  Review/Block  View(Markdown)
              ▲
   session.subscribe(event) → append/update component + tui.requestRender()
```

## 3 · Event → component mapping

| Source event | Renders |
|---|---|
| prompt start | `Header` + `RequestPanel` |
| `message_update` · `thinking_start` | open `● THINKING` panel |
| `message_update` · `thinking_delta` | stream dim/italic into `ThinkingView` |
| `message_update` · `thinking_end` | collapse / dim `ThinkingView` |
| `message_update` · `text_delta` | stream into `ResponseView` (Markdown) |
| `tool_execution_start` | append `ToolCard` (RUNNING + `Loader` spinner) |
| `tool_execution_end` | update card → SUCCESS/ERROR + `AuditLine` |
| safety gate `confirm` | `SafetyReview` (focusable, y/n keys) |
| safety gate `deny` | `SafetyBlock` block panel |

## 4 · Thinking stream

Pi emits `thinking_start` / `thinking_delta` / `thinking_end` on the same
`message_update` channel as text. To enable: set `thinkingLevel` in the session.
Default **off**; `noah --tui --think` turns it on (predictable token cost for demos).

## 5 · Phases (test-first)

| Phase | Work | TDD focus |
|---|---|---|
| **T1 · Spike** | add `pi-tui` dep; set up `node --test`; stand up `TUI + ProcessTerminal`; prove loop starts/stops | smoke import test |
| **T2 · Components** | `RequestPanel`, `Header`, `ToolCard` (+Loader), `SafetyReview`, `SafetyBlock`, `AuditLine`, `ThinkingView`, `ResponseView` | each: `render(width)` returns lines, **every line ≤ width**, contains expected text/badge |
| **T3 · Transcript controller** | root `Container`; map events → append/update + `requestRender` | controller appends correct component per event (mock events) |
| **T4 · Confirm in-TUI** | `SafetyReview.handleInput` resolves on `y`/`n` | input `y`→approve, `n`→deny |
| **T5 · Wire `noah --tui`** | additive frontend; print CLI default; smoke unaffected | smoke 8/8 unchanged |
| **T6 · Polish + record** | theme, spacing, `--think`, live run, re-record video | manual |

## 6 · Test strategy (red → green → refactor)

- Runner: `node --import tsx --test` (zero new deps; Node 22 built-in).
- Components are pure over `render(width)` → deterministic, fast unit tests.
- Tests run with **no TTY** → no ANSI, so line-length and content assertions are stable.
- **Invariant under test for every component:** for widths 20…120, every rendered
  line's visible length ≤ width, and required text/badge words are present.
- `scripts/smoke.sh` (8 checks) must stay green every phase — print CLI is untouched.

## 7 · Risk & guardrails

- **Breaks the freeze** → mitigated: additive `--tui`; default path unchanged.
- **Render loop instability** → spike (T1) proves start/stop before any wiring.
- **Width/wrap bugs** → caught by the line-length invariant test on every component.
- Commit per phase; any regression is one `git revert`.

> Definition of done: `noah --tui "<task>"` shows Header → Request → (Thinking) →
> ToolCards → Safety panels → Response, flicker-free; print CLI + smoke unchanged.
