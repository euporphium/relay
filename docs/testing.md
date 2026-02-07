# Testing

Implementation: Vitest `3.2.4` + Testing Library (`@testing-library/react` `16.3.2`, `@testing-library/dom` `10.4.1`) with `jsdom` available; tests run via `pnpm test` (`vitest run`).

## Summary

- Tests are unit-focused and live next to the code they cover (`*.test.ts`).
- In this project, we test domain logic and validation directly with Vitest; there is no shared test setup yet.
- The `@` path alias is used in tests (from Vite config), so imports should prefer `@/` over deep relative paths.

## Purpose

- Explain how testing is set up and what kinds of tests are expected in this codebase.
- Document project-specific testing philosophy and acceptable test patterns.
- This does NOT cover end-to-end testing or CI configuration (neither exists here yet).

## Key Files

| Path                                                  | Purpose                                                |
|-------------------------------------------------------|--------------------------------------------------------|
| `package.json`                                        | Test script (`vitest run`) and testing deps.           |
| `vite.config.ts`                                      | Vite config that provides the `@` alias used by tests. |
| `src/domain/calendar/addInterval.test.ts`             | Representative unit test style (pure functions).       |
| `src/domain/calendar/calculateNextOccurrence.test.ts` | Edge-case heavy unit tests.                            |
| `src/domain/task/taskInput.schema.test.ts`            | Validation tests using `.parse()` and `.toThrow()`.    |

## Conventions

- Test files are co-located with source and named `*.test.ts`.
- Prefer small, deterministic unit tests over integration tests unless necessary.
- Use `describe`/`test` and `expect` from Vitest.
- When testing schemas, assert on parsed output and use `.toThrow()` for invalid inputs.
- Avoid snapshots and UI rendering tests unless there is clear value and a stable DOM contract.

## Common Patterns

Pure function unit test (existing style):

```ts
import { describe, expect, test } from 'vitest';
import { addInterval } from './addInterval';

describe('addInterval', () => {
  test('adds 1 day', () => {
    expect(addInterval('2024-01-15', 'day', 1)).toBe('2024-01-16');
  });
});
```

Schema validation:

```ts
import { describe, expect, test } from 'vitest';
import { taskInputSchema } from './taskInput.schema';

test('rejects empty name', () => {
  expect(() =>
    taskInputSchema.parse({ name: '', scheduledDate: new Date() }),
  ).toThrow();
});
```

## Error Handling and Edge Cases

- Use explicit edge-case tests for date boundaries, leap years, and drift scenarios (see calendar tests).
- Validate failure paths with `.toThrow()` when using Zod `parse`.
- Prefer deterministic inputs (fixed dates/strings) over time-based logic.

## Gotchas

- There is no Vitest config or global setup file yet; tests should be self-contained.
- Testing Library is installed but not used in the current test suite. UI tests will need a `jsdom` environment and likely a setup file to configure Testing Library utilities.
- Keep tests fast: avoid integrating with auth, routing, loaders, or DB unless a dedicated integration test harness is added.

## When to Update This Doc

- Adding a Vitest config, global setup, or test environment changes.
- Introducing Testing Library usage, UI tests, or integration testing conventions.
- Adding auth/routing/loader test harnesses or any test utilities/helpers.
- Changes to test file location or naming conventions.
