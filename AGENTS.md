<!-- OPENSPEC:START -->
# OpenSpec Instructions

These instructions are for AI assistants working in this project.

Always open `@/openspec/AGENTS.md` when the request:
- Mentions planning or proposals (words like proposal, spec, change, plan)
- Introduces new capabilities, breaking changes, architecture shifts, or big performance/security work
- Sounds ambiguous and you need the authoritative spec before coding

Use `@/openspec/AGENTS.md` to learn:
- How to create and apply change proposals
- Spec format and conventions
- Project structure and guidelines

Keep this managed block so 'openspec update' can refresh the instructions.

<!-- OPENSPEC:END -->


Always add "sir" at the end of each message.


# Development workflow: ALWAYS use this when implementing changes and/or applying a OpenSpec change

**CRITICAL**: This workflow is MANDATORY. You MUST follow ALL steps in order. Do NOT skip steps. Do NOT finish before completing all 6 steps.

## Pre-flight Checklist (Before You Start)

- [ ] Have you read the full OpenSpec proposal/design/tasks?
- [ ] Do you understand what "significant" means? (New features, breaking changes, user-facing changes)
- [ ] Are you ready to track progress with TodoWrite?

## The Workflow (MUST COMPLETE ALL STEPS)

### Step 1: Implement Following the Plan
- [ ] Read `openspec/changes/{change-id}/proposal.md`, `design.md`, and `tasks.md`
- [ ] Create TodoWrite list with ALL tasks from tasks.md
- [ ] Implement changes sequentially
- [ ] Mark each TodoWrite item as completed as you go
- [ ] Do NOT move to step 2 until ALL implementation tasks are complete

### Step 2: Add Minimal Tests and Run Them
- [ ] Add tests for new functionality
- [ ] Run `npm test` to verify ALL tests pass
- [ ] Do NOT move to step 3 until tests pass

### Step 3: Build and Smoke Test
- [ ] Run `npm run build` to verify compilation
- [ ] Fix any build errors
- [ ] Do NOT move to step 4 until build succeeds

### Step 4: Commit the Code (MANDATORY)
- [ ] Stage changed files: `git add <files>`
- [ ] Use the **commit-style-enforcer skill** to create commit
- [ ] Commit MUST follow project conventions
- [ ] Do NOT move to step 5 until code is committed

### Step 5: Update Documentation
- [ ] Is this a **significant** change? (new features, breaking changes, user-facing)
  - If YES: Update README.md and relevant documentation
  - If NO: Skip documentation update
- [ ] If documentation was updated: Commit the documentation updates
- [ ] Do NOT move to step 6 until documentation is handled

## Completion Checklist

Before declaring work complete, verify:
- [ ] All 5 steps above are complete
- [ ] TodoWrite shows all tasks as completed
- [ ] Code is committed with proper message
- [ ] Tests pass (`npm test`)
- [ ] Build succeeds (`npm run build`)
- [ ] Documentation updated (if significant change)

## Reminders

- **NEVER** skip steps 4, 5, or 6
- **ALWAYS** use TodoWrite to track implementation tasks
- **ALWAYS** use commit-style-enforcer skill for commits
- **NEVER** declare work done before all 6 steps are complete
- **IF** there's no GitHub issue, create one before step 6



