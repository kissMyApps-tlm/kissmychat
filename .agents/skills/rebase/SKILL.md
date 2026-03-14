---
name: rebase
description: "Rebase current branch onto lobe/canary (upstream LobeChat). Fetches latest upstream, rebases, and resolves conflicts with fork-aware logic. Use when the user says 'rebase', 'sync with lobe', 'update from upstream', or 'rebase with lobe'."
user_invocable: true
---

# Rebase with Lobe (upstream sync)

This repo is a **KissMyApps fork** of [lobehub/lobe-chat](https://github.com/lobehub/lobe-chat). The fork carries:

1. **Ukrainian translations** (`locales/uk/`, `locales/uk-UA/`, `locales/ru-RU/` (repurposed as Ukrainian), and Ukrainian text in source files)
2. **KissMyApps branding** (`packages/business/const/src/branding.ts`, logos, app names)
3. **Company-specific features** (KissMyMolfar builtin agent, Notion builtin tool, UI tweaks)
4. **Fork-specific CI/config** (`.github/workflows/`, `.i18nrc.js`, `CLAUDE.md`, `.agents/`)

## Remotes

- `origin` = `kissMyApps-tlm/kissmychat` (this fork)
- `lobe` = `lobehub/lobe-chat` (upstream)

## Fork-content manifest

These files/directories MUST exist after every rebase. If any are missing, the rebase has lost fork content and must be investigated before pushing.

```
# Branding
packages/business/const/src/branding.ts

# KissMyMolfar agent
packages/builtin-agents/src/agents/kiss-my-molfar/index.ts
packages/builtin-agents/src/agents/kiss-my-molfar/systemRole.ts
public/avatars/kiss-my-molfar.png

# Notion builtin tool
packages/builtin-tool-notion/package.json
packages/builtin-tool-notion/src/ExecutionRuntime/index.ts
packages/builtin-tool-notion/src/index.ts
packages/builtin-tool-notion/src/manifest.ts
packages/builtin-tool-notion/src/types.ts
src/server/routers/tools/notion.ts
src/services/notion.ts
src/store/tool/slices/builtin/executors/lobe-notion.ts

# GroupDMFilter (revealDM feature)
packages/context-engine/src/processors/GroupDMFilter.ts
packages/context-engine/src/processors/__tests__/GroupDMFilter.test.ts

# Wiring (Notion must be registered in these)
packages/builtin-tools/src/index.ts
src/store/tool/slices/builtin/executors/index.ts

# Ukrainian translations (spot-check)
locales/ru-RU/common.json

# Fork config
.i18nrc.js
CLAUDE.md
```

## Rebase workflow

### Step 1: Pre-flight checks

Run in parallel:
- `git status --short` — must be clean (no uncommitted changes)
- `git branch --show-current` — note current branch
- `git stash list` — check for stashes

If working tree is dirty, ask the user whether to stash or commit first. **Do not proceed with a dirty tree.**

### Step 2: Sync with both remotes

**CRITICAL**: Fetch BOTH remotes before doing anything else. A past incident occurred because only `lobe` was fetched while `origin` had newer commits that were lost during force-push.

```bash
git fetch origin
git fetch lobe
```

### Step 3: Check local vs remote divergence

**CRITICAL SAFETY CHECK** — this prevents overwriting remote work.

```bash
# Check if local is behind origin/main
git rev-list --count HEAD..origin/main
# Check if local has commits not on origin/main
git rev-list --count origin/main..HEAD
```

**If local is behind origin/main (count > 0):**
- Run `git pull --ff-only origin main` to fast-forward
- If fast-forward fails (diverged), ask the user how to proceed
- **NEVER skip this step** — rebasing from a stale local state will lose remote work

**If local and origin/main have diverged (both counts > 0):**
- Stop and ask the user. This means someone pushed changes that conflict with local work.

### Step 4: Take fork-content snapshot

Before rebasing, capture the FULL set of fork-specific changes. This snapshot is used for post-rebase verification.

```bash
# Save fork file list
git diff --name-only lobe/canary..HEAD | sort > /tmp/fork-files-before-rebase.txt
# Count fork-specific files
wc -l /tmp/fork-files-before-rebase.txt
# Count fork commits and check for merge commits
git rev-list --count lobe/canary..HEAD
git rev-list --merges --count lobe/canary..HEAD
```

### Step 5: Consolidate fork commits (if needed)

**CRITICAL** — `git rebase` silently drops merge commits. If the fork has merge commits, their content will be lost unless consolidated first.

```bash
# Check for merge commits
git rev-list --merges lobe/canary..HEAD
```

**If merge commits exist OR there are more than 1 fork commit:**

Squash all fork changes into a single commit before rebasing. This ensures nothing is silently dropped.

```bash
# Find the merge-base (where our fork diverges from upstream)
MERGE_BASE=$(git merge-base HEAD lobe/canary)

# Soft-reset to merge-base, keeping all changes staged
git reset --soft "$MERGE_BASE"

# Create a single squashed commit with all fork changes
git commit --no-verify -m "✨ feat: KissMyApps fork — branding, Ukrainian i18n, KissMyMolfar agent, Notion builtin tool, UI tweaks"
```

After squashing, **immediately verify** the fork snapshot is intact:
```bash
git diff --name-only lobe/canary..HEAD | sort > /tmp/fork-files-after-squash.txt
diff /tmp/fork-files-before-rebase.txt /tmp/fork-files-after-squash.txt
```
If the diff shows ANY missing files, **STOP and investigate**. The squash lost content.

### Step 6: Show what's incoming

```bash
git log --oneline HEAD..lobe/canary | head -30
```

Tell the user how many new upstream commits are incoming.

### Step 7: Start rebase

```bash
git rebase lobe/canary
```

### Step 8: Resolve conflicts

When conflicts occur, handle them iteratively — for each conflicted commit:

1. Run `git diff --name-only --diff-filter=U` to list conflicted files
2. For each conflicted file, read it and resolve using the rules below
3. After resolving all files in a commit, stage them with `git add <files>` and run `git rebase --continue`
4. Repeat until rebase completes

#### Conflict resolution rules (priority order)

**ALWAYS KEEP OURS (fork version):**
- `packages/business/const/src/branding.ts` — KissMyApps branding, never take upstream LobeHub branding
- `locales/uk/` and `locales/uk-UA/` — Ukrainian translations are fork-only
- `locales/ru-RU/` — **repurposed as Ukrainian** in this fork (see MERGE CAREFULLY section for conflict handling)
- `packages/builtin-agents/src/agents/kiss-my-molfar/` — KissMyMolfar agent is fork-specific
- `packages/builtin-tool-notion/` — Notion builtin tool is fork-specific
- `public/avatars/kiss-my-molfar.png` — fork-specific asset
- `.i18nrc.js` — includes Ukrainian locale config
- `CLAUDE.md` — fork-specific Claude Code instructions
- `.agents/` — fork-specific skills and agent configs
- Any file where the conflict is only about KissMyApps/KissMyChat naming vs LobeHub/LobeChat naming — keep our branding

**ALWAYS KEEP THEIRS (upstream version):**
- `CHANGELOG.md` — upstream changelog, our changes don't go there
- `changelog/` — upstream release notes
- `package.json` version field — upstream version tracking
- `lerna.json`, `turbo.json` — upstream build config (unless fork has specific overrides)

**MERGE CAREFULLY (combine both):**
- `packages/builtin-agents/src/index.ts` — keep upstream agents AND our KissMyMolfar agent. Ensure our agent import/export is preserved alongside upstream additions.
- `packages/builtin-agents/src/types.ts` — keep upstream type changes AND our additions
- `packages/builtin-tools/src/index.ts` — keep upstream tool manifests AND our NotionManifest registration
- `src/store/tool/slices/builtin/executors/index.ts` — keep upstream executor changes AND our `lobe-notion` executor
- `src/server/routers/tools/index.ts` — keep upstream router changes AND our Notion router
- `src/envs/tools.ts` — keep upstream env vars AND our `NOTION_API_URL`, `NOTION_QUERY_TOKEN`
- `packages/context-engine/src/engine/messages/MessagesEngine.ts` — **HIGH CONFLICT RISK**. Our `GroupDMFilterProcessor` block must stay immediately BEFORE `GroupOrchestrationFilterProcessor` in `buildProcessors()`. When upstream adds/reorders processors, re-insert our block using the same pattern (conditional spread with `isAgentGroupEnabled && !agentGroup.revealDM`).
- `packages/context-engine/src/processors/index.ts` — keep upstream processor exports AND our `GroupDMFilterProcessor` export
- `src/services/chat/mecha/contextEngineering.ts` — **HIGH CONFLICT RISK**. Our `revealDM: groupDetail.config?.revealDM ?? false` line must stay inside the `agentGroup` object literal. When upstream adds fields to the same block, merge both.
- `src/server/services/aiAgent/index.ts` — **HIGH CONFLICT RISK**. Our changes: `ChatGroupModel` in constructor, `agentGroup` in `InternalExecAgentParams`, destructured in `execAgent`, `agentGroup` building block in `execGroupAgent`, passed to `createOperation`. When upstream modifies these areas, re-add our additions using the sibling pattern (agentGroup next to discordContext/evalContext).
- `src/server/modules/AgentRuntime/RuntimeExecutors.ts` — our `agentGroup` field in `RuntimeExecutorContext` interface and `agentGroup: ctx.agentGroup` in `contextEngineInput`. Follow the discordContext/evalContext sibling pattern.
- `src/server/services/agentRuntime/AgentRuntimeService.ts` — our `agentGroup` in 3 spots: destructuring, metadata object, executorContext. Follow the discordContext/evalContext sibling pattern.
- `src/server/services/agentRuntime/types.ts` — our `agentGroup?: AgentGroupConfig` field in `OperationCreationParams`. Re-add alongside other context fields.
- `src/server/modules/Mecha/ContextEngineering/types.ts` — our `AgentGroupConfig` import and `agentGroup?` field in `ServerMessagesEngineParams`.
- `src/server/modules/Mecha/ContextEngineering/index.ts` — our `agentGroup` in destructuring and `...(agentGroup && { agentGroup })` spread.
- `locales/ru-RU/` — this folder contains **Ukrainian translations** in our fork (not Russian). When conflicted: take the upstream Russian JSON as a reference for new/changed keys, then **translate those new entries to Ukrainian** and merge them into our existing Ukrainian content. Preserve all existing Ukrainian translations; only add/update keys that are new or changed upstream. Keep the same JSON structure (flat or nested) as the existing file uses.
- `locales/*/` (other non-Ukrainian locales) — take upstream translations but preserve any fork-specific key additions
- `src/locales/default/` — take upstream keys but keep any fork-specific keys we added
- `.github/workflows/` — take upstream workflow updates but preserve fork-specific workflow modifications
- `eslint-suppressions.json` — regenerate if conflicted (take upstream, then our additions)

**DEFAULT RULE for unlisted files:**
- If the file is new in upstream and we don't have it: accept theirs
- If the file was only modified by us: keep ours
- If both modified: accept upstream code changes but preserve any fork-specific additions (imports, exports, config entries for our features). When in doubt, prefer upstream and re-add our changes on top.

### Step 9: Post-rebase verification (COMPREHENSIVE)

This step catches silent content loss. **Do not skip any part.**

#### 9a. Check fork commits are on top
```bash
git log --oneline lobe/canary..HEAD
```
Verify there is exactly 1 fork commit on top of upstream.

#### 9b. Compare fork file list against pre-rebase snapshot
```bash
git diff --name-only lobe/canary..HEAD | sort > /tmp/fork-files-after-rebase.txt
diff /tmp/fork-files-before-rebase.txt /tmp/fork-files-after-rebase.txt
```

**If ANY files are MISSING from the post-rebase list (lines starting with `<`):**
- **STOP. Do not push.**
- List the missing files to the user
- These files were lost during rebase and need to be recovered
- Consider `git rebase --abort` and investigating

#### 9c. Verify fork-content manifest

Check every file in the manifest (see top of this document):
```bash
ls \
  packages/business/const/src/branding.ts \
  packages/builtin-agents/src/agents/kiss-my-molfar/index.ts \
  packages/builtin-agents/src/agents/kiss-my-molfar/systemRole.ts \
  public/avatars/kiss-my-molfar.png \
  packages/builtin-tool-notion/package.json \
  packages/builtin-tool-notion/src/ExecutionRuntime/index.ts \
  packages/builtin-tool-notion/src/index.ts \
  packages/builtin-tool-notion/src/manifest.ts \
  packages/builtin-tool-notion/src/types.ts \
  src/server/routers/tools/notion.ts \
  src/services/notion.ts \
  src/store/tool/slices/builtin/executors/lobe-notion.ts \
  packages/context-engine/src/processors/GroupDMFilter.ts \
  packages/context-engine/src/processors/__tests__/GroupDMFilter.test.ts \
  locales/ru-RU/common.json \
  .i18nrc.js \
  CLAUDE.md
```

**If any manifest file is missing: STOP. Do not push.** Report the missing files.

#### 9d. Verify wiring files contain fork registrations

```bash
# NotionManifest must be registered
grep -q 'NotionManifest\|notion' packages/builtin-tools/src/index.ts
# Notion executor must be imported
grep -q 'notion' src/store/tool/slices/builtin/executors/index.ts
# KissMyMolfar must be exported
grep -q 'KissMyMolfar\|kiss-my-molfar' packages/builtin-agents/src/index.ts
# GroupDMFilterProcessor must be exported from processors index
grep -q 'GroupDMFilterProcessor' packages/context-engine/src/processors/index.ts
# GroupDMFilterProcessor must be imported in MessagesEngine
grep -q 'GroupDMFilterProcessor' packages/context-engine/src/engine/messages/MessagesEngine.ts
# revealDM must be threaded in client context engineering
grep -q 'revealDM' src/services/chat/mecha/contextEngineering.ts
# agentGroup must be threaded in server context engineering
grep -q 'agentGroup' src/server/modules/Mecha/ContextEngineering/index.ts
grep -q 'agentGroup' src/server/modules/AgentRuntime/RuntimeExecutors.ts
```

If any grep fails, the wiring was lost during conflict resolution. Fix before pushing.

### Step 10: Safe push

**CRITICAL SAFETY**: Fetch origin again before pushing to detect any last-minute remote changes.

```bash
# Refresh remote tracking refs
git fetch origin

# Check if origin/main has diverged from our expected base
ORIGIN_MAIN=$(git rev-parse origin/main)
OUR_BASE=$(git merge-base HEAD origin/main)

# If origin/main is not an ancestor of our HEAD, someone pushed while we were rebasing
git merge-base --is-ancestor origin/main HEAD
```

**If origin/main IS an ancestor of HEAD (exit code 0):** Safe to push.
```bash
git push --force-with-lease --no-verify
```

**If origin/main is NOT an ancestor (exit code 1):**
- Stop and tell the user: "origin/main has commits not in our rebased branch"
- Show what would be lost: `git log --oneline HEAD..origin/main`
- Ask user how to proceed

### Step 11: Report — What's New (ranked by interest)

Analyze the upstream commits that were incorporated and present a **summarized changelog ordered by most interesting/impactful first** (use your own judgement). Group by category:

1. **New features** — new capabilities, model support, etc.
2. **Notable fixes** — bug fixes that affect UX or stability
3. **Infrastructure/CI** — build, release, CI changes (less interesting, list briefly)
4. **Chores** — version bumps, translations, minor cleanup (summarize in one line)

For each interesting item, write a 1-sentence plain-language summary (not just the commit message). Skip merge commits and release version bumps from the detailed list.

Also mention:
- How many conflicts were resolved (and which files)
- Whether the fork-content manifest check passed
- Remind the user to run `pnpm install` and `bun run type-check` to verify everything builds

## Aborting

Resolve conflicts autonomously using the rules above. Only ask the user if you have **strong doubts** about a specific conflict (e.g., large structural refactors that fundamentally change fork-specific logic in ambiguous ways). For everything else, make your best judgement call and proceed. You can always `git rebase --abort` to undo if things go wrong.

## Notes

- NEVER use `git rebase -i` (interactive mode not supported)
- Use `--no-verify` for commits and pushes during rebase (hooks are not relevant for rebase operations)
- If rebase has too many conflicts (>20 commits with conflicts), consider stopping and suggesting the user review the upstream changes first
- **ALWAYS fetch origin before rebasing** — rebasing from stale local state is the #1 cause of fork content loss
- **ALWAYS verify the fork-content manifest before pushing** — silent file loss is invisible until runtime
