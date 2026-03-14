---
name: neon
description: "Manage KissMyChat's Neon PostgreSQL database (Vercel integration). Enable extensions, check project config, manage preload libraries. Use when user mentions 'neon', 'pg_search', 'database extension', or 'preload libraries'."
user_invocable: true
---

# Neon Database Management

KissMyChat uses **Neon PostgreSQL** (via Vercel integration) in AWS eu-central-1.

## Configuration

- **Project ID**: stored in `$NEON_PROJECT_ID` (set in ~/.zshrc)
- **API Key**: stored in `$NEON_API_KEY` (set in ~/.zshrc)
- **Region**: aws-eu-central-1
- **Postgres version**: 15 (check if upgrade needed for certain extensions)

## Common Operations

### List available preload libraries

```bash
curl -s --request GET \
  --url "https://console.neon.tech/api/v2/projects/${NEON_PROJECT_ID}/available_preload_libraries" \
  --header 'accept: application/json' \
  --header "authorization: Bearer ${NEON_API_KEY}" | python3 -m json.tool
```

### Get current project settings

```bash
curl -s --request GET \
  --url "https://console.neon.tech/api/v2/projects/${NEON_PROJECT_ID}" \
  --header 'accept: application/json' \
  --header "authorization: Bearer ${NEON_API_KEY}" | python3 -c "
import sys, json
d = json.load(sys.stdin)
print(json.dumps(d.get('project', {}).get('settings', {}), indent=2))
"
```

### Enable a preload library

**IMPORTANT**: Always include ALL currently enabled libraries plus the new one. Omitting a library disables it.

```bash
curl -s --request PATCH \
  --url "https://console.neon.tech/api/v2/projects/${NEON_PROJECT_ID}" \
  --header 'accept: application/json' \
  --header "authorization: Bearer ${NEON_API_KEY}" \
  --header 'content-type: application/json' \
  --data '{
    "project": {
      "settings": {
        "preload_libraries": {
          "enabled_libraries": [
            "timescaledb",
            "pg_cron",
            "pg_partman_bgw",
            "rag_bge_small_en_v15,rag_jina_reranker_v1_tiny_en",
            "<NEW_LIBRARY_HERE>"
          ]
        }
      }
    }
  }'
```

### Currently enabled libraries (as of 2026-03-10)

- timescaledb
- pg_cron
- pg_partman_bgw
- rag_bge_small_en_v15,rag_jina_reranker_v1_tiny_en
- pg_search

## Notes

- After changing preload libraries, the compute needs a restart (happens automatically on scale-to-zero wake-up)
- Some extensions (like pg_search) require specific Postgres versions — pg_search is fully supported on PG17, PG14-16 may need Neon support
- Extensions are created via SQL: `CREATE EXTENSION IF NOT EXISTS <name>;`
- Neon API docs: https://api-docs.neon.tech/reference/getting-started-with-neon-api
- Extension docs: https://neon.com/docs/extensions/pg-extensions
