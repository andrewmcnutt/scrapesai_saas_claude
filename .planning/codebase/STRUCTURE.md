# Codebase Structure

**Analysis Date:** 2026-02-21

## Directory Layout

```
scrapesai_saas_claude/
├── .claude/           # GSD tool configuration and templates
├── .git/              # Git repository metadata
├── .gitignore         # Git ignore rules (if present)
└── .planning/         # Planning and documentation (this file and related docs)
    └── codebase/      # Architecture and codebase analysis documents
```

## Directory Purposes

**`.claude/`:**
- Purpose: GSD (get-shit-done) workflow tool configuration
- Contains: Tool settings, hooks, agent prompts, workflow templates
- Key files: `settings.json`, `gsd-file-manifest.json`
- Managed by: GSD system
- Status: Do not edit manually

**`.planning/`:**
- Purpose: Project planning, documentation, and codebase analysis
- Contains: Architecture docs, structure analysis, design decisions
- Key files: `codebase/ARCHITECTURE.md`, `codebase/STRUCTURE.md`
- Status: Workspace documentation directory

**`.git/`:**
- Purpose: Git version control metadata
- Contains: Repository history, branches, configuration
- Status: Managed by git

## Current State

**Application Source Code:** Not present

No application code directories exist. When application development begins, structure this repository with appropriate directories.

## Recommended Structure for Future Development

When adding application code, organize as follows:

### For Frontend Application

```
src/
├── components/        # UI components
├── pages/            # Page/route components
├── services/         # API and external service clients
├── hooks/            # React hooks or custom hooks
├── utils/            # Utility functions
├── styles/           # Stylesheets
├── types/            # TypeScript types/interfaces
└── __tests__/        # Test files (co-located pattern)
```

### For Backend/API Application

```
src/
├── routes/           # Route handlers
├── controllers/      # Request handlers
├── services/         # Business logic
├── models/           # Data models
├── middleware/       # Express/framework middleware
├── utils/            # Utility functions
├── config/           # Configuration
└── __tests__/        # Test files
```

### For Full Stack

```
apps/
├── web/              # Frontend application
│   └── src/
├── api/              # Backend application
│   └── src/
└── shared/           # Shared types and utilities
    └── src/
```

## Where to Add New Code

**When you're ready to build:**

1. **Create root configuration files:**
   - `package.json` - Project dependencies and scripts
   - `tsconfig.json` - TypeScript configuration (if using TS)
   - `.env.example` - Environment variable template
   - `README.md` - Project documentation

2. **Create source directory:**
   - Choose structure based on application type (see recommendations above)
   - Follow naming conventions for your selected language/framework

3. **Create test directory:**
   - `__tests__/` or `tests/` at project root
   - Or co-located with source files (`*.test.ts`, `*.spec.ts`)

4. **Create build/config files:**
   - `vite.config.ts`, `webpack.config.js`, or equivalent
   - `.eslintrc.json`, `.prettierrc` for code standards
   - `jest.config.js`, `vitest.config.ts` for testing

## Naming Conventions (Placeholder)

To be determined when application framework is selected. Consider:

**Files:**
- Use kebab-case for file names if following common web conventions
- Component files: match component name (UserProfile.tsx for UserProfile component)

**Directories:**
- Use kebab-case or lowercase for directories
- Feature-based organization preferred over type-based

**Variables and Functions:**
- camelCase for JavaScript/TypeScript
- UPPER_SNAKE_CASE for constants
- PascalCase for component and class names

## Special Directories

**`.planning/codebase/`:**
- Purpose: Store codebase analysis documents
- Generated: By GSD codebase mapper agent
- Committed: Yes
- Documents: ARCHITECTURE.md, STRUCTURE.md, TESTING.md, CONVENTIONS.md, CONCERNS.md, STACK.md, INTEGRATIONS.md

**`node_modules/`, `venv/`, `.venv/`:**
- Purpose: Dependency installations
- Generated: Yes (by package managers)
- Committed: No (add to .gitignore)

**`dist/`, `build/`, `.next/`:**
- Purpose: Build output
- Generated: Yes (by build tools)
- Committed: No (add to .gitignore)

---

*Structure analysis: 2026-02-21*
