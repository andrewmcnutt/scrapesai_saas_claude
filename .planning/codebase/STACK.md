# Technology Stack

**Analysis Date:** 2026-02-21

## Languages

**Primary:**
- JavaScript - Infrastructure and tooling via GSD framework

**Secondary:**
- Not detected in application code

## Runtime

**Environment:**
- Node.js 16.7.0 or higher (per GSD framework requirements)

**Package Manager:**
- npm (inferred from project setup)
- Lockfile: Not found (no application package.json in project root)

## Frameworks

**Core:**
- GSD (Get Shit Done) v1.20.5 - Meta-prompting and spec-driven development system for Claude Code

**Build/Dev:**
- esbuild 0.24.0 - JavaScript bundler and minifier (used for GSD hooks)

**Testing:**
- Node.js built-in test runner (configured in GSD package.json scripts)

## Key Dependencies

**Critical:**
- None in application code (project scaffold only contains GSD framework)

**Infrastructure:**
- get-shit-done-cc 1.20.5 - Project management and AI-assisted development framework

## Configuration

**Environment:**
- `.claude/settings.json` - Claude Code IDE configuration
- `.claude/settings.local.json` - Local Claude Code settings
- `.claude/hooks/` - Custom hooks for GSD operations

**Build:**
- No build configuration files found in application root
- GSD framework has its own esbuild configuration for hook compilation

## Platform Requirements

**Development:**
- Node.js >= 16.7.0
- Claude Code IDE with GSD plugin installed
- Git repository initialized

**Production:**
- Not applicable - project is in scaffold phase with no production code

## Project Status

**Current State:**
- Empty application scaffold initialized with GSD framework
- No source code, dependencies, or external integrations present
- Ready for application development

---

*Stack analysis: 2026-02-21*
