# CLAUDE.md — Project Git Workflow & Rules

> **This file governs how Claude Code interacts with Git and GitHub on this project.**
> All team members using Claude Code will inherit these rules automatically.

---

## 1. Branch Structure

This project uses a **two-branch model**:

| Branch | Purpose | Deploys To |
|--------|---------|------------|
| `main` | Production-ready code only | **GitHub Pages** (live site) |
| `develop` | Active development — everyone commits here | Not deployed |

**`main` is protected.** Code reaches `main` only through reviewed pull requests from `develop`. Never commit or push directly to `main` (except for the one-time initial bootstrap commit that created the repo).

**Feature branches are not used on this project.** Everyone works directly on `develop` and follows the pull-before-push rule in Section 3 to stay in sync.

Day-to-day work stays on `develop`. `main` is updated only periodically — when the team decides `develop` is stable and it's time to push a new version of the live site.

---

## 2. Default Working Branch

**Always work from `develop`.** Before starting any task:

```
git checkout develop
git pull origin develop
```

If you are not on `develop`, switch to it first. Never begin work from `main` or a detached HEAD.

---

## 3. The Pull-Before-Push Rule

**Every single time before pushing, pull first.** This is non-negotiable.

Because everyone on the team commits directly to `develop`, teammates are likely pushing at the same time you are. The only way to avoid clobbering their work is to pull their changes, verify nothing broke, and *then* push.

### Standard flow:
```
git add .
git commit -m "<type>: <short description>"
git pull origin develop --rebase
# Resolve any conflicts if they appear (see Section 6)
# Verify the code still runs correctly — open index.html or run the dev server
git push origin develop
```

If `git pull --rebase` produces conflicts, **stop and resolve them carefully** before pushing. After resolving, re-test the site so you aren't pushing broken code on top of someone else's commit.

**Never force-push to `develop` or `main`.**

---

## 4. Releasing to Main

Code moves from `develop` → `main` **only via pull request with at least one review**.

### When to release
Releases happen occasionally, not after every push to `develop`. Open a `develop → main` PR only when:
- The team has agreed it's time to deploy
- `develop` has accumulated a stable set of tested changes
- Someone explicitly asks for a release

**Claude Code should not open a `main` PR unprompted** just because `develop` has new commits. Keep pushes focused on `develop` and wait for explicit direction to release.

### Steps:
1. Ensure `develop` is stable and tested
2. Open a Pull Request: `develop` → `main`
3. Title the PR clearly (e.g., "Release: Add contact page and fix nav bugs")
4. At least one team member must review and approve
5. Use **"Squash and merge"** or **"Create a merge commit"** — never rebase onto main
6. After merge, GitHub Pages will automatically deploy from `main`

### How to open the PR
Use this link to go straight to the create-PR page with `develop → main` pre-selected:

**https://github.com/Dawson-Gibbons/HabitatForHumanity/compare/main...develop**

This is the preferred way for this team. The `gh` CLI is not required and Claude Code should not suggest installing it — just provide the link above along with a suggested title and body.

**Claude Code must never merge into `main` directly.** If asked to deploy or push to main, provide the compare link above and inform the user that a review is required.

---

## 5. Commit Message Conventions

Every commit message must follow this format:

```
<type>: <short description in present tense>
```

### Types:
| Type | Use When |
|------|----------|
| `feat` | Adding new functionality or content |
| `fix` | Fixing a bug or broken behavior |
| `style` | Visual/CSS changes that don't affect logic |
| `refactor` | Restructuring code without changing behavior |
| `docs` | Updating README, comments, or documentation |
| `chore` | Config, dependencies, build tooling |
| `test` | Adding or updating tests |

### Examples:
```
feat: add team members section to about page
fix: correct broken image path on homepage
style: adjust header padding for mobile
docs: update README with setup instructions
chore: add .gitignore entry for node_modules
```

### Rules:
- Use lowercase, no period at the end
- Keep the description under 72 characters
- Use present tense ("add" not "added")
- One logical change per commit — don't bundle unrelated changes

---

## 6. Conflict Resolution

If a pull or rebase produces merge conflicts:

1. **Read the conflict markers carefully.** Understand what both sides changed.
2. **Preserve both changes when possible.** Don't blindly accept one side.
3. **If unsure, ask the user.** Say: "I found a merge conflict in `<file>`. Here's what both versions look like — which should I keep?"
4. After resolving, test that the file still works correctly.
5. Stage the resolved file and continue the rebase:
   ```
   git add <resolved-file>
   git rebase --continue
   ```

**Never use `--force` to push over conflicts.** Never silently drop someone else's work.

---

## 7. Safe Push Checklist

Before every push, confirm all of the following:

- [ ] You are on `develop` — **never** `main`
- [ ] You have pulled the latest from `develop` with `--rebase`
- [ ] All merge conflicts (if any) are resolved
- [ ] Your commit messages follow the conventions in Section 5
- [ ] The code runs without errors (open `index.html` or run the dev server to verify if possible)
- [ ] You are not pushing anything sensitive (API keys, passwords, `.env` files)

---

## 8. GitHub Pages Configuration

- GitHub Pages is configured to serve from the **`main`** branch
- Only production-ready, reviewed code should exist on `main`
- The live site URL reflects what is on `main` — treat it as the public face of the project
- Never push experimental, broken, or in-progress work to `main`

---

## 9. Files to Never Commit

The project includes a `.gitignore` that excludes the following. Never stage these files:

```
node_modules/
.env
.env.local
.DS_Store
Thumbs.db
*.log
dist/
.cache/
```

If you see any of these in a `git status`, do not add them. If they were accidentally committed previously, remove them:
```
git rm -r --cached node_modules/
```

---

## 10. General Rules for Claude Code

- **Ask before making destructive changes.** If a task involves deleting files, overwriting large sections, or restructuring directories, confirm with the user first.
- **Keep commits atomic.** Each commit should represent one logical change. Don't combine a bug fix with a new feature in the same commit.
- **Don't overwrite other people's unpushed work.** Always pull before pushing (Section 3).
- **Always verify the working branch** at the start of every task by running `git branch` — you should always be on `develop`.
- **Communicate what you're doing.** Before pushing, summarize what you changed and why.
