# Testing Patterns

**Analysis Date:** 2026-02-21

## Test Framework

**Runner:**
- Node.js built-in `test` module (node:test)
- Config: No config file needed; tests run directly via `node gsd-tools.test.cjs`
- Version: Node.js 18+ (uses modern test runner)

**Assertion Library:**
- Node.js built-in `assert` module (`node:assert`)
- Uses `assert.ok()`, `assert.deepStrictEqual()`, `assert.strictEqual()`

**Run Commands:**
```bash
node gsd-tools.test.cjs              # Run all tests
# No watch mode or coverage tools configured
```

## Test File Organization

**Location:**
- Co-located with source code: `gsd-tools.cjs` (5324 lines) paired with `gsd-tools.test.cjs` (2302 lines)
- File path: `/Users/andrewmcnutt/Documents/labs/tech/scrapes_ai/scrapesai_saas_claude/.claude/get-shit-done/bin/gsd-tools.test.cjs`
- Follows Node.js convention of `.test.cjs` suffix

**Naming:**
- Test file name matches source file with `.test.cjs` suffix
- Test suites use `describe()` blocks with command names: `'history-digest command'`, `'phases list command'`
- Individual tests use `test()` with descriptive names: `'empty phases directory returns valid schema'`

**Structure:**
```
gsd-tools.test.cjs
├── Imports (test module, assert, fs, path)
├── Helper functions
│   ├── runGsdTools() - Execute CLI command
│   ├── createTempProject() - Setup temp dirs
│   └── cleanup() - Remove temp dirs
└── describe('command name')
    ├── beforeEach() - Setup
    ├── test() cases
    └── afterEach() - Teardown
```

## Test Structure

**Suite Organization:**
```javascript
const { test, describe, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');

describe('history-digest command', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = createTempProject();
  });

  afterEach(() => {
    cleanup(tmpDir);
  });

  test('empty phases directory returns valid schema', () => {
    const result = runGsdTools('history-digest', tmpDir);
    assert.ok(result.success, `Command failed: ${result.error}`);
    const digest = JSON.parse(result.output);
    assert.deepStrictEqual(digest.phases, {}, 'phases should be empty object');
  });
});
```

**Patterns:**
- **Setup (beforeEach):** Create temporary project structure with `.planning/phases/` directory via `createTempProject()`
- **Teardown (afterEach):** Remove temp directories via `cleanup(tmpDir)` which uses `fs.rmSync()`
- **Assertion Pattern:** First assert command success, then parse/verify output
- **Test Data:** Create temp files with frontmatter YAML content, test parsing and merging

## Mocking

**Framework:** No external mocking library (Jest, Sinon, etc.)

**Patterns:**
- File system mocking via temporary directories created fresh for each test
- No function/module mocking; tests execute real CLI commands via `execSync()`
- Isolated execution: each test runs in its own temp directory with fresh files

**Execution Pattern:**
```javascript
function runGsdTools(args, cwd = process.cwd()) {
  try {
    const result = execSync(`node "${TOOLS_PATH}" ${args}`, {
      cwd,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    return { success: true, output: result.trim() };
  } catch (err) {
    return {
      success: false,
      output: err.stdout?.toString().trim() || '',
      error: err.stderr?.toString().trim() || err.message,
    };
  }
}
```

**What to Mock:**
- File system: Use temporary directories instead of mocking `fs` module
- Child processes: Tests use real `execSync()` to CLI tool (integration-level)
- External APIs: Not applicable; CLI tool uses only file I/O and git commands

**What NOT to Mock:**
- Do not mock `fs`, `path`, or Node.js built-ins; use temp directories instead
- Do not mock CLI execution; integration tests verify entire command flow
- Do not mock parsing/processing logic; test the actual algorithm

## Fixtures and Factories

**Test Data:**
```javascript
// Example from gsd-tools.test.cjs line 64+
const summaryContent = `---
phase: "01"
name: "Foundation Setup"
dependency-graph:
  provides:
    - "Database schema"
    - "Auth system"
  affects:
    - "API layer"
tech-stack:
  added:
    - "prisma"
    - "jose"
patterns-established:
  - "Repository pattern"
  - "JWT auth flow"
key-decisions:
  - "Use Prisma over Drizzle"
  - "JWT in httpOnly cookies"
---

# Summary content here
`;

fs.writeFileSync(path.join(phaseDir, '01-01-SUMMARY.md'), summaryContent);
```

**Location:**
- Fixtures defined inline within test functions (no separate fixtures directory)
- Factory pattern: `createTempProject()` helper at line 32 creates standard directory structure
- File templates embedded as strings in test body

**Usage Pattern:**
```javascript
function createTempProject() {
  const tmpDir = fs.mkdtempSync(path.join(require('os').tmpdir(), 'gsd-test-'));
  fs.mkdirSync(path.join(tmpDir, '.planning', 'phases'), { recursive: true });
  return tmpDir;
}

// In test:
let tmpDir;
beforeEach(() => {
  tmpDir = createTempProject(); // Fresh isolated environment
});
```

## Coverage

**Requirements:** No coverage threshold enforced or measured

**View Coverage:**
- Not applicable; code does not generate or track coverage metrics
- No coverage tools configured

## Test Types

**Unit Tests:**
- Tests focus on CLI command correctness (history-digest, phases list)
- Scope: Single command invocation with controlled input files
- Approach: Create temp project, write test files, execute command, assert output JSON structure
- Examples:
  - `'empty phases directory returns valid schema'` - test edge case of no phases
  - `'nested frontmatter fields extracted correctly'` - test YAML parsing of nested structures
  - `'multiple phases merged into single digest'` - test aggregation logic

**Integration Tests:**
- Tests verify end-to-end CLI execution with real file I/O
- Scope: Full command pipeline from argument parsing to output generation
- Approach: Invoke actual CLI tool via `execSync()`, verify complete output
- Examples:
  - Each test in `gsd-tools.test.cjs` runs the real gsd-tools command
  - Tests verify that parsing, aggregation, and output formatting work together

**E2E Tests:**
- Not present; hooks (`gsd-statusline.js`, `gsd-check-update.js`) have no test coverage
- These scripts run in Claude Code environment and are manually verified

## Common Patterns

**Async Testing:**
```javascript
// Node.js test module is async-aware but all tests here are synchronous
// If async needed (e.g., file I/O with promises):
test('async example', async () => {
  const result = await fs.promises.readFile(path.join(tmpDir, 'file.txt'), 'utf8');
  assert.ok(result);
});

// Current approach uses sync fs methods (execSync, fs.writeFileSync, fs.mkdirSync)
```

**Error Testing:**
```javascript
// Pattern from tests: verify both success and failure paths
test('command execution with error', () => {
  const result = runGsdTools('invalid-command', tmpDir);

  // First check: command should still execute
  assert.ok(result.hasOwnProperty('success'));

  // Then check: error details captured
  assert.ok(!result.success);
  assert.ok(result.error);
});

// Actual pattern from test file (line 193):
test('malformed SUMMARY.md skipped gracefully', () => {
  // Create intentionally bad frontmatter
  fs.writeFileSync(path.join(phaseDir, '01-01-SUMMARY.md'), 'invalid content');

  // Command should still succeed (skip malformed files)
  const result = runGsdTools('history-digest', tmpDir);
  assert.ok(result.success, `Command should succeed despite malformed files: ${result.error}`);
});
```

**Data Structure Assertions:**
```javascript
// Deep equality for complex objects
assert.deepStrictEqual(
  digest.phases['01'].provides.sort(),
  ['Auth system', 'Database schema'],
  'provides should contain nested values'
);

// Array membership
assert.ok(
  digest.decisions.some(d => d.decision === 'Use Prisma over Drizzle'),
  'Should contain first decision'
);

// Strict type checking
assert.strictEqual(digest.decisions.length, 2, 'Should have 2 decisions');
```

## Test Naming Convention

- Test names are complete sentences describing behavior: `'empty phases directory returns valid schema'`
- Use "should/returns/verifies" language to clarify expectation
- Name the command being tested in suite name: `describe('history-digest command')`

## Running Tests

```bash
# Navigate to test file directory
cd /Users/andrewmcnutt/Documents/labs/tech/scrapes_ai/scrapesai_saas_claude/.claude/get-shit-done/bin

# Run all tests
node gsd-tools.test.cjs

# Run specific test (requires modifying file or filtering)
# No filtering built-in; use grep or comment out other describe blocks
```

## Coverage Gaps

**Areas not tested:**
- Hook scripts: `gsd-statusline.js` (91 lines) and `gsd-check-update.js` (62 lines) have no tests
  - These run in Claude Code environment and are manually verified
  - Would require mocking stdio and Claude Code context APIs
- Most command functions in `gsd-tools.cjs` beyond the two test suites
  - Only `history-digest` and `phases list` commands have test coverage
  - Other commands (commit, state operations, etc.) lack test coverage
- Error edge cases for git commands and file system operations beyond malformed YAML

---

*Testing analysis: 2026-02-21*
