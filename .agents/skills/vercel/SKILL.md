---
name: vercel
description: "Manage KissMyChat's Vercel deployments. Redeploy, list deployments, check status, view logs. Use when user mentions 'vercel', 'deploy', 'redeploy', 'deployment status', or 'production build'."
user_invocable: true
---

# Vercel Deployment Management

KissMyChat is deployed on **Vercel** under team `leovvays-projects-fe4664b8`, project `kissmychat`.

## Prerequisites

- Vercel CLI installed: `vercel` (v44+)
- Must be on correct team: `vercel switch leovvays-projects-fe4664b8`

## Common Operations

### List recent deployments

```bash
vercel ls --yes 2>&1 | head -20
```

### Redeploy latest (or a specific deployment)

```bash
# Redeploy a specific deployment URL
vercel redeploy <deployment-url>

# Example:
vercel redeploy kissmychat-kcj9ptc0e-leovvays-projects-fe4664b8.vercel.app
```

### Check deployment logs

```bash
vercel logs <deployment-url>
```

### Inspect a deployment

```bash
vercel inspect <deployment-url>
```

### Promote a deployment to production

```bash
vercel promote <deployment-url>
```

## Workflow

1. **List deployments** to find the latest or a specific one
2. **Inspect** to check build details or errors
3. **Redeploy** to trigger a fresh build from the same source
4. After redeploy, check the **Inspect URL** returned by the CLI for build progress

## Team Setup

If you get "Deployment belongs to a different team", switch first:

```bash
vercel switch leovvays-projects-fe4664b8
```

## Integration with Neon

- Database: Neon PostgreSQL (see `/neon` skill)
- Region: aws-eu-central-1
- DB migrations run during Vercel build (`scripts/migrateServerDB/index.ts`)
- If migration fails (e.g., missing extension), fix on Neon side first, then redeploy

## Notes

- Production URL: kissmychat.vercel.app
- Git integration: pushes to `main` auto-deploy to production
- Build command uses Next.js + Vite SPA
- Typical build duration: ~8 minutes
