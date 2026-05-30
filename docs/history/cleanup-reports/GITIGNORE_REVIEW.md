# .gitignore Review Report

**Proje:** corteqs_landing
**Tarih:** 2026-05-15

---

## 1. Changes Made

The `.gitignore` was updated to include the following previously missing entries:

### Added Categories

| Category | Pattern | Reason |
|----------|---------|--------|
| Environment | `.env.local`, `.env.*.local` | Explicit (was only covered by `*.local` wildcard) |
| Coverage | `coverage/` | Test coverage output |
| Playwright | `playwright-report/`, `test-results/`, `blob-report/` | E2E test artifacts |
| Playwright MCP | `.playwright-mcp/` | MCP tool artifacts |
| Supabase | `supabase/.branches/`, `supabase/.env` | Supabase local dev artifacts |
| Runtime config | `env-config.js` | Generated at deploy time |
| TLS certs | `*.pem`, `*.key`, `*.crt` | Certificate files |
| Archive | `_archive/` | Archived files directory |
| Package manager | `.pnpm-store/` | pnpm store |
| Agent tools | `.omc/` | Tool artifacts |
| OS | `Thumbs.db` | Windows thumbnail cache |

### Reorganized Structure

The file was reorganized with clear section headers:
- Logs
- Dependencies
- Build output
- Environment files
- Secrets
- Coverage
- Playwright
- Supabase
- Runtime config
- TLS certificates
- Archive
- Package managers
- Agent / tool directories
- OS files
- Editor directories
- Misc
- Reference directory

---

## 2. Verification

### Verified Still Ignored
- `.env` - Explicitly listed
- `.env.local` - Now explicit + covered by `*.local`
- `*.log` - Via `*.log` pattern
- `node_modules/` - Explicitly listed
- `dist/` - Explicitly listed
- `.kilo/` - Explicitly listed
- `secret.md`, `secret_ignore.md` - Explicitly listed

### Verified NOT Ignored
- `.env.example` - Not matched by any pattern (correct)
- `src/` - Not matched (correct)
- `supabase/` (except .temp/, .branches/, .env) - Not matched (correct)
- `_archive/cleanup-2026-05-15/` - Now correctly ignored by `_archive/`

### Source Code Safety
- No `src/` patterns added
- No `public/` patterns that would affect served files
- No `supabase/functions/` or `supabase/migrations/` patterns
