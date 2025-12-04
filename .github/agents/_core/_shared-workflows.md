# Shared Workflows Between Agents

> Standard workflows for collaboration between agents in MERN + Next.js + TypeScript projects.
> All agents should reference this document for handoff procedures.

## Workflow Overview

```
┌────────────────────────────────────────────────────────────────────────────────┐
│  0. ORCHESTRATION    →  orchestrator                                           │
│     Entry point - analyzes request and routes to appropriate agent             │
├────────────────────────────────────────────────────────────────────────────────┤
│  1. DEFINITION       →  product-manager                                        │
│     User stories with acceptance criteria, KPIs                                │
├────────────────────────────────────────────────────────────────────────────────┤
│  2. ARCHITECTURE     →  solution-architect                                     │
│     ADRs, C4 diagrams, technology evaluation                                   │
├────────────────────────────────────────────────────────────────────────────────┤
│  3. IMPLEMENTATION   →  Specialized agents based on feature:                   │
│     • Backend: backend-architect                                               │
│     • UI/UX: frontend-architect                                                │
│     • PWA/Offline: pwa-specialist                                              │
│     • AI: ai-integration-engineer                                              │
│     • Data: data-engineer                                                      │
│     • Security: security-guardian                                              │
├────────────────────────────────────────────────────────────────────────────────┤
│  4. CODE REVIEW      →  code-reviewer                                          │
│     Standards review, SOLID compliance, mentoring                              │
├────────────────────────────────────────────────────────────────────────────────┤
│  5. TESTING & QA     →  test-engineer / qa-lead                                │
│     Unit tests, integration, E2E, acceptance criteria                          │
├────────────────────────────────────────────────────────────────────────────────┤
│  6. DOCUMENTATION    →  documentation-engineer                                 │
│     API docs, guides, README                                                   │
├────────────────────────────────────────────────────────────────────────────────┤
│  7. RELEASE          →  release-manager / devops-engineer                      │
│     Changelog, versioning, deployment                                          │
└────────────────────────────────────────────────────────────────────────────────┘
```

## Standard Workflows

### 🆕 New Feature (End-to-End)

```
1. product-manager
   └─ Delivers: User Story + Acceptance Criteria + KPIs
   
2. solution-architect
   └─ Delivers: ADR + Architecture Diagrams
   
3. Implementation Agents (in parallel as needed):
   ├─ backend-architect (if backend work)
   ├─ frontend-architect (if UI work)
   ├─ pwa-specialist (if offline/PWA work)
   ├─ data-engineer (if data model changes)
   └─ ai-integration-engineer (if AI features)
   
4. security-guardian
   └─ Delivers: Security Review
   
5. test-engineer
   └─ Delivers: Unit + Integration Tests
   
6. code-reviewer
   └─ Delivers: Approved Code Review
   
7. documentation-engineer
   └─ Delivers: Updated Documentation
   
8. qa-lead
   └─ Delivers: QA Approval
   
9. release-manager + devops-engineer
   └─ Delivers: Deployed Release
```

### 🐛 Bug Fix

```
1. qa-lead
   └─ Delivers: Bug Report with severity and reproduction steps
   
2. Implementation Agent (based on affected area):
   ├─ backend-architect (backend bug)
   ├─ frontend-architect (UI bug)
   └─ pwa-specialist (offline bug)
   
3. test-engineer
   └─ Delivers: Regression Test
   
4. code-reviewer
   └─ Delivers: Approved Code Review
   
5. release-manager (if hotfix)
   └─ Delivers: Deployed Hotfix
```

### 🏗️ Architecture Refactoring

```
1. solution-architect
   └─ Delivers: ADR with Migration Plan
   
2. backend-architect
   └─ Delivers: Implementation
   
3. test-engineer
   └─ Delivers: Regression Tests
   
4. observability-engineer
   └─ Delivers: Performance Validation
   
5. code-reviewer
   └─ Delivers: Approved Code Review
```

### 📊 Performance Optimization

```
1. observability-engineer
   └─ Delivers: Analysis + Recommendations
   
2. Implementation Agent (based on area):
   ├─ frontend-architect (UI optimization)
   ├─ backend-architect (API optimization)
   └─ pwa-specialist (cache optimization)
   
3. observability-engineer
   └─ Delivers: Improvement Validation
```

### 🔒 Security Audit

```
1. security-guardian
   └─ Delivers: Security Audit Report
   
2. Implementation Agents (fix vulnerabilities):
   ├─ backend-architect
   └─ frontend-architect
   
3. security-guardian
   └─ Delivers: Re-audit Approval
   
4. code-reviewer
   └─ Delivers: Approved Code Review
```

## Handoff Protocol

### Standard Handoff Format

When an agent completes their work, they must provide:

```markdown
## Handoff: [Current Agent] → [Next Agent]

### Completed Work
- [Summary of what was done]
- [Key deliverables]

### Artifacts
- [Links to files/documents created]
- [Code locations if applicable]

### Notes for Next Agent
- [Important context]
- [Decisions made and why]
- [Open questions]

### Suggested Command
> @[next-agent] [description of task]
```

### Example Handoff

```markdown
## Handoff: product-manager → solution-architect

### Completed Work
- Created User Story US-042: Product scanning feature
- Defined 5 acceptance criteria with Given/When/Then format
- Established KPIs: scan success rate > 95%, time to add < 3s

### Artifacts
- User Story: docs/user-stories/US-042.md
- Mockups: docs/mockups/scanning-flow.png

### Notes for Next Agent
- Must work offline (IndexedDB required)
- Camera permission handling is critical
- Consider fallback to manual input

### Suggested Command
> @solution-architect Design architecture for US-042: Product scanning with offline support
```

## Agent Responsibility Matrix (RACI)

| Activity | PM | SA | BA | FA | DE | SG | TE | CR | QA | DO | RM |
|----------|----|----|----|----|----|----|----|----|----|----|-----|
| User Stories | **R** | C | I | I | I | I | I | - | C | - | - |
| Architecture | C | **R** | C | C | C | C | - | - | - | I | - |
| Backend Code | I | C | **R** | - | C | C | I | **A** | - | - | - |
| Frontend Code | I | C | - | **R** | - | C | I | **A** | - | - | - |
| Data Schema | I | C | C | - | **R** | C | I | C | - | - | - |
| Security Review | I | C | C | C | C | **R** | - | C | - | - | - |
| Unit Tests | - | - | C | C | - | - | **R** | C | I | - | - |
| Code Review | - | C | I | I | I | I | I | **R** | - | - | - |
| QA Sign-off | I | - | - | - | - | - | I | - | **R** | - | I |
| Documentation | I | C | C | C | C | C | C | - | - | - | **R** |
| Deployment | - | - | - | - | - | I | - | - | C | **R** | **A** |
| Release | I | - | - | - | - | - | - | - | C | C | **R** |

**Legend**: R = Responsible, A = Accountable, C = Consulted, I = Informed

## Communication Templates

### Request for Clarification

```markdown
## Clarification Request

**From**: [Agent Name]
**To**: [Target Agent/User]
**Regarding**: [Topic]

### Question
[Clear, specific question]

### Context
[Why this information is needed]

### Options Considered
1. [Option A]
2. [Option B]

### Blocking?
[ ] Yes - Cannot proceed without answer
[ ] No - Can proceed with assumption [state assumption]
```

### Status Update

```markdown
## Status Update: [Task/Feature]

**Agent**: [Agent Name]
**Status**: 🟢 On Track | 🟡 At Risk | 🔴 Blocked

### Progress
- [x] [Completed item]
- [x] [Completed item]
- [ ] [In progress item]
- [ ] [Pending item]

### Issues/Blockers
- [Issue and mitigation]

### ETA
[Estimated completion]

### Next Steps
1. [Next action]
2. [Following action]
```

### Escalation Request

```markdown
## Escalation: [Issue Summary]

**From**: [Agent Name]
**To**: tech-lead / orchestrator
**Priority**: 🔴 Critical | 🟠 High | 🟡 Medium

### Issue
[Clear description of the problem]

### Agents Involved
- [Agent A]: [Their position]
- [Agent B]: [Their position]

### Impact
[What happens if not resolved]

### Attempted Resolution
[What was tried]

### Requested Decision
[What needs to be decided]
```

## Parallel Work Guidelines

### When Agents Can Work in Parallel

| Scenario | Parallel Work OK? | Coordination Needed |
|----------|-------------------|---------------------|
| Backend + Frontend for same feature | ✅ Yes | Agree on API contract first |
| Multiple unrelated features | ✅ Yes | None |
| Data schema + Repository implementation | ❌ No | Schema must be finalized first |
| Security review + Bug fix | ❌ No | Security review may identify more issues |
| Tests + Implementation | ⚠️ Partial | Tests can be written based on spec |

### Parallel Work Kickoff

```markdown
## Parallel Work: [Feature Name]

### Participating Agents
- backend-architect: API endpoints
- frontend-architect: UI components
- data-engineer: Database schema

### Shared Artifacts
- API Contract: docs/api/feature-x.yaml
- Type Definitions: src/types/feature-x.ts

### Integration Points
- [ ] API contract agreed
- [ ] Type definitions shared
- [ ] Integration test plan defined

### Sync Schedule
- Daily: Async status update
- Blockers: Immediate notification
- Integration: [Date/time]
```

## Quality Gates

### Before Passing to Next Agent

Each agent must verify before handoff:

| Checkpoint | Verification |
|------------|--------------|
| Work complete | All deliverables created |
| Self-reviewed | Checked own work for obvious issues |
| Documented | Handoff notes prepared |
| Artifacts linked | All files/code referenced |
| Tests passing | Relevant tests still pass |

### Before Release

| Gate | Owner | Criteria |
|------|-------|----------|
| Code Complete | backend/frontend-architect | All code merged |
| Tests Passing | test-engineer | CI green, coverage met |
| Security Approved | security-guardian | No critical vulnerabilities |
| QA Approved | qa-lead | Acceptance criteria met |
| Docs Updated | documentation-engineer | User-facing docs current |
| Change Log | release-manager | Version notes prepared |

---

> **Note**: Workflows should be adapted to project size. Smaller projects may skip or combine steps. The orchestrator can recommend appropriate workflow based on task complexity.
