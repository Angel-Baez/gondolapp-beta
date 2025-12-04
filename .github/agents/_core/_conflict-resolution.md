# Conflict Resolution Guidelines

> Guidelines for resolving conflicts between agents in MERN + Next.js + TypeScript projects.
> The tech-lead and orchestrator should use this document for arbitration.

## Priority Hierarchy

When two agents have conflicting objectives, apply this immutable hierarchy:

| Priority | Area | Responsible Agent | Rule |
|----------|------|-------------------|------|
| 1 | 🔒 **Security** | security-guardian | Absolute veto. Never compromised. |
| 2 | 📴 **Core Functionality** | Varies by project type | Product's core value proposition. |
| 3 | ⚡ **Performance** | observability-engineer | Lighthouse/Core Web Vitals targets. |
| 4 | ♿ **Accessibility** | frontend-architect | WCAG AA minimum. |
| 5 | 📦 **Delivery** | release-manager + product-manager | Business value timeline. |
| 6 | 🎨 **Aesthetics** | frontend-architect | Nice-to-have, flexible. |
| 7 | 🧹 **Maintainability** | backend-architect / code-reviewer | Temporary technical debt acceptable. |

### Priority 2: Core Functionality by Project Type

| Project Type | Core Functionality | Never Compromise |
|--------------|-------------------|------------------|
| PWA/Retail | Offline-First | Must work without network |
| SaaS | Multi-tenancy | Data isolation |
| E-commerce | Checkout Flow | Payment reliability |
| Dashboard | Data Accuracy | Correct metrics |

## Common Conflict Scenarios

### Conflict 1: UI/UX vs Performance

**Situation**: Frontend wants heavy animations, Performance says Lighthouse drops below 90.

**Apply Hierarchy**: Performance (pos 3) > Aesthetics (pos 6)

**Resolution**:
- Maintain Lighthouse ≥ 90 as non-negotiable requirement
- Frontend must use CSS animations or optimized Framer Motion
- Alternative: Reduce animation duration, use `will-change` strategically

**Resolution Template**:
```markdown
Prioritizing Performance over Aesthetics per established hierarchy.
Animation must be optimized to maintain Lighthouse ≥ 90.
Suggestion: Use CSS transforms instead of JavaScript animations.
```

---

### Conflict 2: Security vs User Experience

**Situation**: Security wants strict CSP that breaks third-party widget.

**Apply Hierarchy**: Security (pos 1) > Aesthetics (pos 6)

**Resolution**:
- Maintain strict CSP
- Find alternative widget that works with CSP
- Or implement equivalent functionality internally

**Resolution Template**:
```markdown
Security has absolute priority.
The third-party widget must be replaced with a CSP-compliant alternative.
Frontend: Research alternative widgets or implement custom solution.
```

---

### Conflict 3: Feature Scope vs Security

**Situation**: Product wants to launch with known medium-severity vulnerability.

**Apply Hierarchy**: Security (pos 1) > Delivery (pos 5)

**Resolution**:
- **Critical/High vulnerabilities**: Always block release
- **Medium vulnerabilities**: Case-by-case, documented risk acceptance required
- **Low vulnerabilities**: Can proceed with documented plan to fix

**Resolution Template**:
```markdown
Security vulnerability assessment:
- Severity: [Critical/High/Medium/Low]
- CVSS Score: [Score]
- Exploitability: [Easy/Moderate/Difficult]

Decision: [Block/Proceed with mitigation]
Required actions: [List of mitigations]
Fix timeline: [Date]
```

---

### Conflict 4: Performance vs Core Functionality

**Situation**: Offline sync is slow and hurts performance metrics.

**Apply Hierarchy**: Core Functionality (pos 2) > Performance (pos 3) - BUT both are near top

**Resolution**:
- Find technical solution that satisfies both
- If impossible, core functionality wins but with optimization plan

**Resolution Template**:
```markdown
Both Performance and Core Functionality are high priority.
Seeking technical solution that satisfies both:

Option A: Background sync with Web Workers (recommended)
Option B: Defer non-critical sync
Option C: Optimize sync payload size

If no solution: Core Functionality takes precedence, with documented
performance improvement plan for next sprint.
```

---

### Conflict 5: DevOps vs Release Manager

**Situation**: Auto-deploy on push conflicts with release approval process.

**Resolution** (Process, not hierarchy):
- Release Manager decides WHEN to deploy
- DevOps decides HOW to deploy
- Pipeline must have approval step before production

**Resolution Template**:
```markdown
Release Manager controls timing, DevOps controls execution.
DevOps: Add manual approval step in production workflow.
Release Manager: Approve after validating changelog and tag.
```

---

### Conflict 6: QA vs Product Manager

**Situation**: QA finds P2 bug, PM needs to release for stakeholder demo tomorrow.

**Resolution by Severity**:

| Severity | Blocks Release? | Who Decides |
|----------|-----------------|-------------|
| P0 - Critical | ✅ Always | QA (veto) |
| P1 - High | ✅ Always | QA (veto) |
| P2 - Medium | ⚠️ Depends | tech-lead arbitrates |
| P3 - Low | ❌ No | Document as known issue |

**Resolution Template for P2**:
```markdown
P2 bug found before urgent release.
Evaluating: [Bug description] vs [Feature value]

Impact Assessment:
- Users affected: [Percentage/Number]
- Workaround available: [Yes/No]
- Business impact: [Description]

Decision: [Block/Release with known issue]
Justification: [Based on user impact analysis]
```

---

### Conflict 7: Test Engineer vs Backend Architect

**Situation**: Tests need simple mocks but interfaces have 15 methods.

**Apply Principle**: ISP (Interface Segregation Principle)

**Resolution**:
- Backend must split large interfaces into smaller, specific ones
- Test Engineer can mock only the interface they need

**Resolution Template**:
```markdown
Applying Interface Segregation Principle.
Backend: Split IProductRepository into:
- IProductReader (findById, findByBarcode, search)
- IProductWriter (save, update, delete)
Test Engineer: Mock only the interface required for each test.
```

---

### Conflict 8: Frontend vs PWA (Bundle Size)

**Situation**: Frontend wants 5 font weights (500KB), PWA wants minimal cache.

**Apply Hierarchy**: Core Functionality/Offline (pos 2) > Aesthetics (pos 6)

**Resolution**:
- Initial load: Only 1-2 font weights (regular, bold)
- Additional weights: Lazy load after installation
- Alternative: Use system fonts to reduce to 0KB

**Resolution Template**:
```markdown
Prioritizing fast installation over complete typography.
Frontend: Use maximum 2 font weights in initial load.
Additional weights load with font-display: swap after FCP.
```

---

### Conflict 9: Documentation vs Delivery Speed

**Situation**: PR without API documentation, developer wants to merge urgently.

**Resolution by Change Type**:

| Change Type | Docs Required? | Rule |
|-------------|----------------|------|
| Major (breaking) | ✅ Yes | Blocks PR |
| Minor (feature) | ✅ Yes | Blocks PR |
| Patch (bugfix) | ❌ No | Optional, can be separate PR |
| Hotfix (P0) | ❌ No | Document within 48h |

**Resolution Template**:
```markdown
Change type: [Major/Minor/Patch/Hotfix]
Documentation [required/optional] per policy.
[Approve/Block] PR until docs complete.
```

## Escalation Process

When a conflict cannot be resolved with the hierarchy:

### Level 1: Direct Resolution
Agents involved attempt to resolve themselves using this document.

### Level 2: Escalate to Tech Lead
If no agreement, escalate with written context.

### Level 3: Tech Lead Decision
Tech Lead makes decision and documents in ADR if significant.

### Level 4: Product Involvement
If decision affects product direction, involve Product Manager.

## Escalation Template

When escalating a conflict, use this format:

```markdown
## Conflict Escalation

**Agents Involved**: [agent-1] vs [agent-2]
**Date**: YYYY-MM-DD

### Context
[Description of the situation]

### Position of [agent-1]
[What they want and why]

### Position of [agent-2]
[What they want and why]

### Applicable Hierarchy
[What priority each position has]

### Resolution Options
1. [Option A]: Pros/Cons
2. [Option B]: Pros/Cons

### Requested Decision
[What needs to be decided]
```

## Resolution Template

When arbitrating, use this format:

```markdown
## Conflict Resolution: [Agent A] vs [Agent B]

**Context**: [Description of conflict]

**Applying Priority Hierarchy**:
- [Priority of Agent A]: Position X
- [Priority of Agent B]: Position Y

**Decision**: [Who has priority and why]

**Technical Compromise**: [Solution that minimizes impact on the losing side]

**Actions**:
- [winning-agent]: Proceed with [X]
- [losing-agent]: Adjust proposal to [Y]
```

## Recording Decisions

Significant conflict resolutions should be recorded:

### When to Create ADR

| Situation | Create ADR? |
|-----------|-------------|
| One-time tradeoff | ❌ No |
| Recurring pattern | ✅ Yes |
| Affects architecture | ✅ Yes |
| Sets precedent | ✅ Yes |

### Decision Log Entry

```markdown
## Decision Log: [Date]

**Conflict**: [Brief description]
**Resolution**: [What was decided]
**Rationale**: [Why this decision]
**Precedent**: [Does this apply to future cases?]
```

---

> **Note**: This hierarchy is a guideline. Exceptional circumstances may require deviation, but deviations must be documented and approved by tech-lead.
