# 🤝 Contributing to NOAH

Thanks for your interest in improving NOAH! This project is built with a strict
**Red → Green → Refactor** TDD discipline, and we'd love your help keeping it that way.

> **First time here?** Read **[ARCHITECTURE.md](./ARCHITECTURE.md)** for a tour of
> the codebase, and **[docs/STORY.md](./docs/STORY.md)** for the *why* behind NOAH.
> Then come back here for the workflow.

## 🧪 The workflow (non-negotiable)

Every change ships with tests, added **before** the implementation:

1. **Red** — write a failing test that describes the behaviour you want.
2. **Green** — write the minimal code to make it pass.
3. **Refactor** — clean it up with the test as your safety net.

Keep the suite **100% green** and the smoke check passing at every commit.

```bash
npm install
npm run build
npm test            # 330+ tests, must stay green
./scripts/smoke.sh  # must print: 8 passed, 0 failed
```

## 🛠️ Local development

```bash
npm run dev -- "how healthy is my machine?"   # run from source (tsx)
npm run dev                                    # interactive TUI from source
node --import tsx --test src/sys/probe.test.ts # run a single test file
```

- Source lives in `src/`, compiled output in `dist/` (gitignored).
- Pure logic (parsers, policy, formatters, health rules) is unit-tested directly.
- I/O is made testable via **injectable runners / fetch / fs** — never hit the
  network or real system in unit tests; pass a fake.

## 📐 Project conventions

- **TypeScript strict mode**, ES modules, Node ≥ 20.6.
- Keep tools read-only unless they must mutate; mutating tools go through the safety policy.
- Width-safe TUI: measure with `visibleWidth` / our `visibleLen`, truncate before render.
- Cross-platform: add behaviour behind the `PlatformAdapter`, test both Linux + macOS mappings.

## ✅ Pull requests

- One focused change per PR; **one commit per feature** with a clear message
  (`feat(scope):`, `fix(scope):`, `docs:`, `chore:`, `test:`).
- Include tests. CI/maintainers will run `npm test` + `./scripts/smoke.sh`.
- Update `README.md` if you add or change a command/flag/feature.
- No regressions, no skipped tests.

## 🌱 Good first contributions

- A new built-in **playbook** in `src/playbooks/builtins.ts` (pure data).
- A new **health rule** in `src/sys/health.ts` (pure logic, easy to test).
- A **platform mapping** in `src/platform/linux.ts` / `macos.ts`.
- A new **tool** in `src/tools/` (remember: classify it in `src/safety/policy.ts`
  and make mutations reversible).

## 🔒 Safety-sensitive changes

Changes to `src/safety/` (the policy/gate/audit) or `src/ops/` (undo/ledger)
require extra scrutiny — add test cases for `deny`, `confirm`, and `allow` paths,
keep every mutation reversible, and never weaken the blocklist without discussion.
See [SECURITY.md](./SECURITY.md) for reporting vulnerabilities.

## 🐛 Reporting issues

Open an issue at https://github.com/srimanh/NOAH/issues with your OS, Node
version, the command you ran, and the output (redact secrets).

By contributing you agree to abide by our [Code of Conduct](./CODE_OF_CONDUCT.md).
