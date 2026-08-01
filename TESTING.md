# Testing Guide

## Overview

Model0-SDK uses **Vitest** for unit and integration testing. All tests must pass before merge to `main`.

## Test Structure

### Test Files Location

```
packages/
  <package>/
    src/              # Source code
    tests/
      <feature>.test.ts
      integration.test.ts
```

### Test Naming Convention

- **Unit tests**: `features.test.ts` - Test individual functions
- **Integration tests**: `integration.test.ts` - Test component interactions
- **E2E tests**: Can be added to examples apps using Playwright

## Running Tests

### Run All Tests

```bash
pnpm test
```

Runs across all packages that have test scripts defined.

### Run Tests for Specific Package

```bash
pnpm --filter=@model0-sdk/model0-sdk test
pnpm --filter=@model0-sdk/react test
pnpm --filter=@model0-sdk/ai-tools test
```

### Run Tests in Watch Mode

```bash
pnpm test:watch
```

Watches for file changes and re-runs affected tests.

### Run with Coverage

```bash
pnpm test -- --coverage
```

Generates coverage reports in `coverage/` directory.

## Coverage Requirements

### Coverage Thresholds

Enforced per package (in `vitest.config.ts`):
- **Lines**: 60%
- **Functions**: 60%
- **Branches**: 60%
- **Statements**: 60%

### View Coverage Report

```bash
# Generate report
pnpm test -- --coverage

# HTML report (in coverage/index.html)
open packages/model0-sdk/coverage/index.html
```

### Coverage Goals

- **Phase 1**: 60% minimum (current requirement)
- **Phase 2**: 75% target
- **Phase 3**: 85% target
- **Production**: 90%+ critical paths

## Writing Tests

### Basic Test Structure

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { myFunction } from '../src/my-module'

describe('My Module', () => {
  describe('myFunction', () => {
    it('should return correct value', () => {
      const result = myFunction('input')
      expect(result).toBe('expected')
    })

    it('should handle edge cases', () => {
      expect(myFunction('')).toThrow()
    })
  })
})
```

### Async Tests

```typescript
it('should fetch data', async () => {
  const result = await fetchData()
  expect(result).toBeDefined()
})
```

### Mocking

```typescript
import { vi } from 'vitest'

it('should call API', () => {
  const mockFetch = vi.fn().mockResolvedValue({ ok: true })
  // Use mockFetch in your code
  expect(mockFetch).toHaveBeenCalled()
})
```

### Fixtures & Setup

```typescript
beforeEach(() => {
  // Setup before each test
})

afterEach(() => {
  // Cleanup after each test
})
```

## CI/CD Testing

### GitHub Actions Workflow

Tests run automatically:
- **On PR**: `pnpm test` (Node 20 & 22)
- **Before merge**: All checks must pass
- **On main**: Post-deploy validation

### Coverage Reporting

Coverage reports are:
1. Generated during test run
2. Merged into `.coverage/` directory
3. Reported as GitHub PR comment
4. Tracked over time in artifacts

### Test Node Versions

Tests run on multiple Node versions:
- **Node 20** (LTS)
- **Node 22** (Latest)

Ensures compatibility across versions.

## Performance Considerations

### Test Timeouts

Default timeout: **10,000ms per test**

Extend for slow tests:
```typescript
it('slow operation', async () => {
  // test code
}, { timeout: 30000 })
```

### Test Parallelization

Tests run in parallel by default.

For sequential tests (if needed):
```typescript
describe.sequential('API Tests', () => {
  // Tests run one after another
})
```

### Optimize Coverage

```typescript
it('should work', () => {
  const result = myFunction()
  expect(result).toBeDefined()
}, { skip: true }) // Skip expensive tests in CI
```

## Debugging Tests

### Run Single Test

```bash
pnpm test -- <test-file.test.ts>

# With watch mode
pnpm test:watch -- <test-file.test.ts>
```

### Debug in VS Code

Add `.vscode/launch.json`:
```json
{
  "type": "node",
  "request": "launch",
  "name": "Debug Tests",
  "runtimeExecutable": "pnpm",
  "runtimeArgs": ["test", "--inspect-brk"],
  "console": "integratedTerminal"
}
```

Then press F5 to debug.

### Verbose Output

```bash
pnpm test -- --reporter=verbose
```

## Best Practices

### 1. Test Behavior, Not Implementation

❌ Bad:
```typescript
it('calls setState', () => {
  const setState = vi.fn()
  // test setState directly
})
```

✅ Good:
```typescript
it('updates display when data changes', () => {
  // test user-visible behavior
})
```

### 2. Use Descriptive Names

❌ Bad:
```typescript
it('works', () => { })
```

✅ Good:
```typescript
it('should throw error when ID is empty', () => { })
```

### 3. One Assertion Per Test

❌ Bad:
```typescript
it('validates input', () => {
  expect(validate('abc')).toBe(true)
  expect(validate('123')).toBe(false)
  expect(validate('')).toThrow()
})
```

✅ Good:
```typescript
describe('validate', () => {
  it('should accept alphabetic input', () => { })
  it('should reject numeric input', () => { })
  it('should throw on empty input', () => { })
})
```

### 4. Keep Tests Isolated

- Don't share state between tests
- Use `beforeEach` for setup
- Use `afterEach` for cleanup
- Mock external dependencies

### 5. Test Error Cases

```typescript
describe('myFunction', () => {
  it('should succeed with valid input', () => { })
  it('should throw with invalid input', () => { })
  it('should handle network errors', () => { })
})
```

## Test Data & Fixtures

### Create Fixtures

```typescript
// tests/fixtures.ts
export const mockUser = {
  id: '123',
  name: 'John Doe',
  email: 'john@example.com'
}

export const mockApiResponse = {
  status: 'success',
  data: [mockUser]
}
```

### Use in Tests

```typescript
import { mockUser } from './fixtures'

it('processes user data', () => {
  const result = processUser(mockUser)
  expect(result.name).toBe('John Doe')
})
```

## Integration Tests

### Example: Testing API Client

```typescript
describe('SDK Client', () => {
  let client: SDKClient

  beforeEach(() => {
    client = new SDKClient({ apiKey: 'test-key' })
  })

  it('should fetch resources', async () => {
    const result = await client.resources.list()
    expect(result).toHaveLength(3)
  })

  it('should handle errors', async () => {
    await expect(client.resources.get('invalid')).rejects.toThrow()
  })
})
```

## Snapshot Testing

### Create Snapshots

```typescript
it('renders correctly', () => {
  const result = render(<Component />)
  expect(result).toMatchSnapshot()
})
```

### Update Snapshots

```bash
pnpm test -- -u
```

⚠️ Review snapshot changes carefully in PR.

## E2E Testing (Examples)

### Setup Playwright

```bash
pnpm add -D @playwright/test
```

### Create E2E Test

```typescript
// examples/simple/e2e/basic.spec.ts
import { test, expect } from '@playwright/test'

test('should load homepage', async ({ page }) => {
  await page.goto('http://localhost:3000')
  await expect(page).toHaveTitle('Model0 Simple Example')
})
```

### Run E2E Tests

```bash
pnpm --filter=simple exec playwright test
```

## Coverage Trends

### View Historical Coverage

Coverage reports are stored in GitHub artifacts:
1. Go to GitHub Actions
2. Select workflow run
3. Download "coverage-reports" artifact

### Track Improvements

```bash
# Compare coverage between commits
git diff HEAD~1 HEAD .coverage/lcov.info
```

## Troubleshooting

### Tests Pass Locally but Fail in CI

1. **Node version mismatch**: Use `nvm use 22`
2. **Dependency differences**: `pnpm install --frozen-lockfile`
3. **Environment variables**: Set in CI config
4. **Timeout issues**: Increase timeout for slow tests

### Coverage Below Threshold

```bash
# Find uncovered lines
pnpm test -- --coverage

# Open HTML report
open packages/*/coverage/index.html

# Add tests to improve coverage
```

### Tests Timeout

Increase timeout in test:
```typescript
it('slow test', async () => {
  // code
}, { timeout: 60000 })
```

## Resources

- [Vitest Documentation](https://vitest.dev)
- [Testing Library](https://testing-library.com)
- [Jest Matchers](https://jestjs.io/docs/using-matchers)
- [Playwright Testing](https://playwright.dev)
