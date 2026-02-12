---
name: vitest
description: Vitest testing patterns. Use when writing tests, unit tests, or test coverage for crucial functions.
---

# Vitest Testing Patterns

## Testing Philosophy

**Focus on crucial functions, not 100% coverage.**

Write tests for:
- Business logic with edge cases
- Data transformations
- Validation functions
- Utility functions with complex logic
- Functions where bugs would be costly

Skip tests for:
- Simple getters/setters
- Pass-through functions
- UI components (unless complex logic)
- Trivial CRUD operations

## Basic Test Structure

```typescript
import { describe, it, expect, beforeEach, vi } from "vitest";

describe("calculateTotal", () => {
  it("should sum items correctly", () => {
    const items = [
      { price: 100, quantity: 2 },
      { price: 50, quantity: 1 },
    ];

    const result = calculateTotal(items);

    expect(result).toBe(250);
  });

  it("should handle empty array", () => {
    expect(calculateTotal([])).toBe(0);
  });

  it("should throw on negative quantities", () => {
    const items = [{ price: 100, quantity: -1 }];

    expect(() => calculateTotal(items)).toThrow("Invalid quantity");
  });
});
```

## Testing Edge Cases

Focus tests on boundaries and edge cases:

```typescript
describe("validateISRC", () => {
  it("should accept valid ISRC format", () => {
    expect(validateISRC("USRC12345678")).toEqual({ valid: true });
  });

  it("should reject ISRC that is too short", () => {
    expect(validateISRC("USRC1234")).toEqual({
      valid: false,
      error: "ISRC must be 12 characters",
    });
  });

  it("should reject ISRC with invalid country code", () => {
    expect(validateISRC("XX1234567890")).toEqual({
      valid: false,
      error: "Invalid country code",
    });
  });

  it("should handle null input", () => {
    expect(validateISRC(null)).toEqual({
      valid: false,
      error: "ISRC is required",
    });
  });
});
```

## Mocking with vi

```typescript
import { vi, describe, it, expect, beforeEach } from "vitest";

// Mock a module
vi.mock("./email-service", () => ({
  sendEmail: vi.fn(),
}));

import { sendEmail } from "./email-service";

describe("notifyUser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should send email with correct parameters", async () => {
    await notifyUser("user@example.com", "Welcome!");

    expect(sendEmail).toHaveBeenCalledWith({
      to: "user@example.com",
      subject: "Notification",
      body: "Welcome!",
    });
  });
});
```

## Testing Async Functions

```typescript
describe("fetchUserData", () => {
  it("should return user data on success", async () => {
    const result = await fetchUserData(123);

    expect(result).toEqual({
      id: 123,
      name: expect.any(String),
    });
  });

  it("should throw on network error", async () => {
    vi.spyOn(global, "fetch").mockRejectedValue(new Error("Network error"));

    await expect(fetchUserData(123)).rejects.toThrow("Network error");
  });
});
```

## Test Data Factories

Create factories for consistent test data:

```typescript
function createSong(overrides: Partial<Song> = {}): Song {
  return {
    id: 1,
    title: "Test Song",
    artistId: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe("songService", () => {
  it("should format song title", () => {
    const song = createSong({ title: "  my song  " });

    const result = formatSongTitle(song);

    expect(result).toBe("My Song");
  });
});
```

## Testing Zod Schemas

```typescript
import { CreateSongSchema } from "./songs-schema";

describe("CreateSongSchema", () => {
  it("should accept valid input", () => {
    const input = {
      songTitle: "My Song",
      notes: "Some notes",
    };

    const result = CreateSongSchema.safeParse(input);

    expect(result.success).toBe(true);
  });

  it("should reject empty title", () => {
    const input = {
      songTitle: "",
      notes: "Some notes",
    };

    const result = CreateSongSchema.safeParse(input);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toContain("songTitle");
    }
  });
});
```

## Running Tests

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test --watch

# Run specific test file
pnpm test src/lib/isrc-utils.test.ts

# Run with coverage
pnpm test --coverage
```

## File Naming

Test files should be co-located with source files:

```
src/
  lib/
    isrc-utils.ts
    isrc-utils.test.ts
  domains/
    songs/
      songs-repository.ts
      songs-repository.test.ts
```

## Common Mistakes to Avoid

1. **Don't aim for 100% coverage** - Focus on critical paths
2. **Don't test implementation details** - Test behavior, not internals
3. **Don't forget edge cases** - Null, empty, boundary values
4. **Do use `beforeEach` to reset mocks** - `vi.clearAllMocks()`
5. **Do keep tests focused** - One assertion concept per test
6. **Do use descriptive test names** - "should X when Y"
