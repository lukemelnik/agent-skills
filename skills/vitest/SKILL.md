---
name: vitest
description: Vitest testing conventions. Use when writing or reviewing Vitest tests.
---

# Vitest

## Philosophy

Focus on crucial functions, not 100% coverage.

Test:
- Business logic with edge cases (null, empty, boundary values)
- Data transformations and validation functions
- Utilities with complex logic
- Functions where bugs would be costly

Skip:
- Simple getters/setters and pass-through functions
- UI components (unless complex logic)
- Trivial CRUD operations

Test behavior, not implementation details. Keep tests focused and name them "should X when Y". Reset mocks in `beforeEach` (`vi.clearAllMocks()`).

## File Naming

Co-locate test files with the source: `isrc-utils.ts` next to `isrc-utils.test.ts`, `songs-repository.ts` next to `songs-repository.test.ts`.
