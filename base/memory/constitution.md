# SDD Constitution (Articles I–IX)

- **I. Library-First**: Every feature begins as a standalone library.
- **II. CLI Interface**: Libraries expose a CLI; text-in/text-out; JSON supported.
- **III. Test-First (TDD)**: Tests (contract→integration→e2e→unit) precede code; fail first.
- **IV. Contracts**: API/data contracts live under `/contracts` and drive tests.
- **V. Observability**: `log_event(event, attrs)` required on key flows.
- **VI. Security**: Inputs validated; secrets managed; least privilege enforced.
- **VII. Simplicity**: ≤3 projects initially; no future-proofing without ADR.
- **VIII. Anti-Abstraction**: Prefer framework features directly; single model representation.
- **IX. Integration-First**: Prefer real deps in tests; contract tests mandatory.

Amendments require ADR + maintainer approval.
