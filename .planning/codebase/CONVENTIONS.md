# Coding Conventions

**Analysis Date:** 2026-02-21

## Naming Patterns

**Files:**
- Kebab-case for multi-word filenames: `gsd-statusline.js`, `gsd-tools.cjs`, `gsd-check-update.js`
- Test files use `.test.cjs` or `.test.js` suffix: `gsd-tools.test.cjs`
- Markdown documentation files use UPPERCASE: `VERSION`, `SUMMARY.md`, `PLAN.md`, `STATE.md`, `REQUIREMENTS.md`

**Functions:**
- camelCase for all function names: `execGit()`, `extractFrontmatter()`, `loadConfig()`, `cmdHistoryDigest()`, `cmdStateLoad()`
- Command functions use `cmd` prefix: `cmdGenerateSlug()`, `cmdCurrentTimestamp()`, `cmdListTodos()`
- Helper functions use descriptive verbs: `safeReadFile()`, `normalizePhaseName()`, `spliceFrontmatter()`
- No function overloading; instead use optional parameters or descriptive names

**Variables:**
- camelCase for variables: `tmpDir`, `cwd`, `homeDir`, `cacheFile`, `projectVersionFile`
- const by default, let only when reassignment needed: `const tmpDir = ...`, `let input = ''`
- Single-letter variables only in tight loop contexts: `for (const line of lines)` is acceptable

**Types:**
- Plain objects used instead of TypeScript interfaces: `{ success: true, output: result.trim() }`
- Field names in objects use camelCase: `exitCode`, `stdout`, `stderr`, `display_name` (underscore only for external API keys)
- Boolean variables prefixed with verb or state: `result.success`, `fs.existsSync()`, `update_available`

## Code Style

**Formatting:**
- No automated formatter detected; code uses consistent manual formatting
- Indentation: 2 spaces (consistent across all files)
- Line length: no strict limit detected, pragmatic wrapping observed (~100-120 chars typical)
- Semicolons: required at end of statements
- Quotes: single quotes for strings in most code, double quotes in JSON contexts

**Linting:**
- No `.eslintrc` or linting config found; codebase relies on manual adherence to conventions
- Consistent patterns suggest implicit code review standards

## Import Organization

**Order:**
1. Node.js built-ins (`fs`, `path`, `os`, `child_process`)
2. External packages (none currently, codebase uses only Node.js stdlib)
3. Local/relative imports (functions, config from same file)

**Path Aliases:**
- No path aliases detected; all imports use relative paths or absolute Node.js module paths
- File paths resolved via `path.join()` and `require.resolve()` patterns

**Pattern:**
```javascript
// Built-in modules always first
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync, spawn } = require('child_process');

// No external packages imported in this codebase
// Function definitions follow
```

## Error Handling

**Patterns:**
- Try-catch blocks with early return on error: `try { ... } catch { return null; }`
- Silent failure preferred for non-critical operations: statusline and update checks fail silently to avoid breaking CLI output
- Explicit error reporting for CLI commands: use `error()` function wrapper
- exec-based operations return status objects: `{ exitCode, stdout, stderr }` instead of throwing

**Example from codebase:**
```javascript
function safeReadFile(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf-8');
  } catch {
    return null;
  }
}

// Return status object pattern
function execGit(cwd, args) {
  try {
    const stdout = execSync('git ' + escaped.join(' '), { cwd, stdio: 'pipe', encoding: 'utf-8' });
    return { exitCode: 0, stdout: stdout.trim(), stderr: '' };
  } catch (err) {
    return { exitCode: err.status ?? 1, stdout: (err.stdout ?? '').toString().trim(), stderr: (err.stderr ?? '').toString().trim() };
  }
}
```

## Logging

**Framework:** console methods (console.log, console.error, console.warn) plus custom `output()` and `error()` wrappers

**Patterns:**
- `output(result, raw, rawValue)` in `gsd-tools.cjs:465` - wrapper that handles JSON/text output modes
- `error(message)` in `gsd-tools.cjs:483` - prints error and exits with code 1
- Silent failures in hooks: `gsd-check-update.js` and `gsd-statusline.js` use try-catch without logging
- CLI commands use structured JSON output with `--raw` flag support

**When to Log:**
- Only CLI-level output goes to console (avoid logging in utility functions)
- Errors always logged before exit
- Status/progress info logged to stdout
- Sensitive info (like version checks) written to cache files, not logged

## Comments

**When to Comment:**
- Header comments on files explaining purpose: `// Claude Code Statusline - GSD Edition`
- TODO/FIXME comments for known issues
- Complex algorithmic logic gets inline comments explaining "why" not "what"
- Command documentation in docstrings (via multi-line comment blocks at file top)

**JSDoc/TSDoc:**
- Not used; this is CommonJS/Node.js code without TypeScript
- Instead use command documentation headers with Usage examples
- Complex function behavior documented in comments above function

**Example from codebase:**
```javascript
// Check for GSD updates in background, write result to cache
// Called by SessionStart hook - runs once per session

// Stack to track nested objects: [{obj, key, indent}]
// obj = object to write to, key = current key collecting array items, indent = indentation level
let stack = [{ obj: frontmatter, key: null, indent: -1 }];
```

## Function Design

**Size:**
- Most functions 20-80 lines; longer functions are data processing (YAML parsing, phase numbering)
- Helper functions 5-15 lines
- No hard limit enforced; pragmatism over strict rules

**Parameters:**
- Max 3-4 parameters typical; more use objects: `{ cwd, pattern, freshness }`
- Destructuring used for options: `const { cwd, phase, name } = options`
- Required params listed first, optional params after or in options object

**Return Values:**
- Functions return data, not side effects (except CLI commands which output)
- Status patterns: `{ success: boolean, output?: string, error?: string }`
- Null returns for optional/not-found cases
- Objects for complex data: `{ phases, decisions, tech_stack }`

**Example:**
```javascript
// Simple returns
function safeReadFile(filePath) {
  // ...
  return null; // or file content
}

// Status object returns
function execGit(cwd, args) {
  // ...
  return { exitCode: 0, stdout: stdout.trim(), stderr: '' };
}

// Complex data returns
function cmdHistoryDigest(cwd, raw) {
  // ...
  return { phases: {}, decisions: [], tech_stack: [] };
}
```

## Module Design

**Exports:**
- Single large file pattern: `gsd-tools.cjs` is 5324 lines of utilities + command handlers
- Each command is its own function, dispatched from main switch statement
- Hooks are self-contained scripts with no exports (run as CLI tools)

**File Organization in gsd-tools.cjs:**
1. Shebang and file-level documentation (lines 1-100)
2. Helper functions (lines 140-500)
3. Command functions (lines 490+)
4. Main dispatch logic at EOF

**Barrel Files:**
- Not used; codebase doesn't use ES6 modules or re-exports
- Each `.js`/`.cjs` file is independently runnable as a script

**Pattern:**
```javascript
// File runs as CLI tool
#!/usr/bin/env node

// Documentation/header

// Helper functions

// Command functions

// Main dispatch at bottom
const command = process.argv[2];
const args = process.argv.slice(3);

switch (command) {
  case 'history-digest':
    cmdHistoryDigest(cwd);
    break;
  // ... more cases
}
```

---

*Convention analysis: 2026-02-21*
