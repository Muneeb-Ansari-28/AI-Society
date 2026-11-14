# 🛠️ Tiny Society — Skills Reference Guide

_Which skill to use, when, and why — mapped to this project._

> [!NOTE]
> This guide maps **globally installed agent skills** to specific Tiny Society development tasks. Skills are grouped by project phase and activity type. Only skills that align with this project are listed — security audit, smart contract, fuzzing, and crypto-specific skills are excluded as irrelevant.

---

## 🗺️ Quick Lookup Table

| Skill | Use When... |
|-------|-------------|
| [brainstorming](#brainstorming) | Before designing any new feature (agent personality system, memory architecture, conversation flow) |
| [spec-driven-development](#spec-driven-development) | Before writing any code — create specs for the agent system, memory, and simulation engine |
| [interview-me](#interview-me) | When requirements are vague ("how should conversations work?", "what makes memory important?") |
| [idea-refine](#idea-refine) | Refining the decision loop, memory scoring algorithm, or relationship dynamics |
| [writing-plans](#writing-plans) | Creating the phased implementation plan or breaking a phase into tasks |
| [planning-and-task-breakdown](#planning-and-task-breakdown) | Breaking any phase into ordered, implementable tasks |
| [executing-plans](#executing-plans) | When you're ready to implement a plan as the coder yourself |
| [subagent-driven-development](#subagent-driven-development) | When multiple independent tasks within a phase can be parallelized |
| [dispatching-parallel-agents](#dispatching-parallel-agents) | Running independent Phase tasks in parallel (e.g., frontend + backend scaffolding) |
| [incremental-implementation](#incremental-implementation) | Every implementation session — deliver in thin, verifiable slices |
| [api-and-interface-design](#api-and-interface-design) | Designing the REST/WebSocket API and module boundaries |
| [frontend-ui-engineering](#frontend-ui-engineering) | Building the React dashboard, panels, dark theme, responsive layout |
| [diorama](#diorama) | Building a rotatable 3D pixel-art village miniature (Three.js), multi-layer character animation, and visual QA |
| [shadcn-ui](#shadcn-ui) | If using shadcn/ui for the React dashboard components |
| [modern-python](#modern-python) | Setting up the Python backend with modern tooling (uv, ruff, ty) |
| [source-driven-development](#source-driven-development) | When integrating Phaser 3, FastAPI, Ollama, ChromaDB — always check official docs |
| [test-driven-development](#test-driven-development) | Every implementation task — write tests before code |
| [performance-optimization](#performance-optimization) | Optimizing Ollama inference speed, WebSocket throughput, frontend rendering |
| [debugging-and-error-recovery](#debugging-and-error-recovery) | When anything breaks — systematic root-cause analysis |
| [systematic-debugging](#systematic-debugging) | Before proposing any fix — reproduce and understand the bug first |
| [code-review-and-quality](#code-review-and-quality) | Before merging any change to main |
| [code-simplification](#code-simplification) | When any module becomes hard to read or maintain |
| [documentation-and-adrs](#documentation-and-adrs) | Recording architecture decisions (why SQLite before ChromaDB, why not LangChain, etc.) |
| [git-workflow-and-versioning](#git-workflow-and-versioning) | Every commit, branch, and PR |
| [context-engineering](#context-engineering) | When agent output quality degrades or you're switching between phases |
| [verification-before-completion](#verification-before-completion) | Before claiming any phase or feature is "done" |
| [shipping-and-launch](#shipping-and-launch) | Preparing the final demo, README, and release |
| [observability-and-instrumentation](#observability-and-instrumentation) | Adding logging to the simulation engine, agent decisions, memory retrievals |
| [ci-cd-and-automation](#ci-cd-and-automation) | Setting up test/lint automation |
| [open-sourcing](#open-sourcing) | If you want to publish Tiny Society as open source |

---

## Phase 0 — Setup & Foundation

### brainstorming
**Path:** `C:\Users\Hp\.gemini\config\skills\brainstorming\SKILL.md`

> **Use before any creative work.** Before designing the agent personality system, the decision loop, the conversation mechanics, or the memory architecture — brainstorm alternatives first.

**Tiny Society examples:**
- "How should memory importance scoring work?"
- "What's the best way to stagger Ollama calls for 5 agents?"
- "Should conversations be turn-based or real-time?"

---

### spec-driven-development
**Path:** `C:\Users\Hp\.gemini\config\skills\spec-driven-development\SKILL.md`

> **Create specs before coding.** Write specifications for each major subsystem before implementation begins.

**Tiny Society specs to create:**
- Agent decision engine spec (input format, action schema, validation rules)
- Memory system spec (storage, retrieval, importance scoring)
- Conversation system spec (initiation, max turns, outcome extraction)
- REST + WebSocket API spec
- Simulation tick system spec

---

### interview-me
**Path:** `C:\Users\Hp\.gemini\config\skills\interview-me\SKILL.md`

> **Extracts what you actually want.** Use when the plan document is ambiguous or you need to decide between approaches.

**Tiny Society examples:**
- "How fast should simulation time pass relative to real time?"
- "What counts as a 'meaningful' event worth storing as long-term memory?"
- "Should the user be able to influence agent decisions or only observe?"

---

### modern-python
**Path:** `C:\Users\Hp\.gemini\config\skills\modern-python\SKILL.md`

> **Configure the Python backend with modern tooling.** Use `uv` for package management, `ruff` for linting, and proper project structure.

**Apply to:** Backend project initialization, `pyproject.toml`, dependency management.

---

### context-engineering
**Path:** `C:\Users\Hp\.gemini\config\skills\context-engineering\SKILL.md`

> **Optimize agent context setup.** Critical for this project because you're building an LLM-powered agent system — the prompts you feed to Ollama ARE context engineering.

**Apply to:**
- Crafting system prompts for each of the 5 agent personalities
- Designing the observation → prompt → decision pipeline
- Optimizing prompt length for Qwen3:1.7B's context window

---

## Phase 1 — The World (Frontend)

### frontend-ui-engineering
**Path:** `C:\Users\Hp\.gemini\config\skills\frontend-ui-engineering\SKILL.md`

> **Build production-quality, accessible, responsive UIs.** Use for the React dashboard shell, agent panels, event log, and all non-Phaser UI.

**Tiny Society components:**
- `App.tsx` layout with Phaser canvas + side panels
- `AgentPanel.tsx` — character profile, stats, inventory
- `EventLog.tsx` — scrolling activity feed
- `ConversationPanel.tsx` — live conversation display
- `WorldControls.tsx` — pause/speed/save buttons
- `RelationshipPanel.tsx` — trust/friendship visualization
- Dark theme styling

---

### diorama
**Path:** `C:\Users\Hp\.gemini\config\skills\diorama\SKILL.md`

> **Build detailed rotatable Three.js dioramas, 5-layer animation grammar, and deterministic visual QA.**
> Use if choosing a 3D rotatable pixel-art village miniature over a flat 2D tilemap, or to borrow its motion standards, clearance algorithms, and automated visual regression testing.

**How Diorama aligns with Tiny Society:**
1. **Visual Presentation Upgrade (3D Pixel-Art Diorama vs 2D Phaser 3):**
   - Tiny Society's selected aesthetic is **Pixel Art**. The base plan uses Phaser 3 (2D top-down RPG tilemap).
   - If desired, the `diorama` skill enables an aesthetic upgrade: building the village as a **rotatable 3D pixel miniature** on a floating ground slab using Three.js, a 64-color palette snap, ordered dither, ink contours, and low-res upscaling (`pixel` or `pixel-stroke` look).
   - Includes ready-to-use templates for orbit controls (`templates/orbit.js`), post-processing palettes (`templates/post.js`), lighting, water, and building blockouts.
2. **5-Layer Character Animation Model:**
   - Regardless of 2D or 3D rendering, Diorama defines a rigorous hierarchy for character animation: *Idle → Locomotion → Secondary motion (clothing, tools) → Glance/weight shifts → Scripted acting (conversing, trading, farming)*.
   - Prevents AI agents from looking stiff or frozen when standing or waiting for LLM decisions.
3. **Action & Spatial Clearance:**
   - Uses `action-clearance` rules to ensure agents never clip through buildings, sit inside chairs unnaturally, or overlap during conversations.
4. **Deterministic Visual QA (`templates/qa/`):**
   - Provides automated visual regression scripts (`shoot.mjs`, `frames.mjs`, `sweep.mjs`) with `freeze(t)`.
   - Automatically detects if an agent has frozen in place, teleported across the map due to a pathing glitch, or walked out of bounds.

---

### shadcn-ui
**Path:** `C:\Users\Hp\.gemini\config\skills\shadcn-ui\SKILL.md`

> **Component library for the React UI.** If you choose shadcn/ui for the dashboard, this skill guides component discovery, installation, and customization.

**Relevant components:** Button, Card, Slider (speed control), Dialog (agent interaction), Progress (energy/happiness bars), Badge (agent status), Tabs.

---

### source-driven-development
**Path:** `C:\Users\Hp\.gemini\config\skills\source-driven-development\SKILL.md`

> **Ground every decision in official docs.** When integrating Phaser 3, always check the official Phaser docs first — don't rely on outdated patterns.

**Apply to:**
- Phaser 3 tilemap loading and rendering
- Phaser sprite animation setup
- Phaser camera and collision systems
- FastAPI WebSocket implementation
- Ollama Python client API
- ChromaDB Python client API

---

## Phase 2 — Backend & AI Loop

### api-and-interface-design
**Path:** `C:\Users\Hp\.gemini\config\skills\api-and-interface-design\SKILL.md`

> **Design stable APIs and module boundaries.** Use for the REST API, WebSocket event protocol, and internal module interfaces.

**Tiny Society interfaces to design:**
- REST endpoints (`/agents`, `/simulation/start`, etc.)
- WebSocket event schema (`agent_action`, `agent_moved`, etc.)
- `DecisionEngine ↔ Ollama` interface
- `MemoryManager` public API
- `SimulationEngine ↔ Frontend` contract

---

### planning-and-task-breakdown
**Path:** `C:\Users\Hp\.gemini\config\skills\planning-and-task-breakdown\SKILL.md`

> **Break work into ordered tasks.** Use at the start of each phase to decompose it into implementable steps with dependency ordering.

**Example:** Phase 2 has 22 tasks — this skill helps sequence them so you never implement something before its dependency exists.

---

### incremental-implementation
**Path:** `C:\Users\Hp\.gemini\config\skills\incremental-implementation\SKILL.md`

> **Deliver changes in thin, verifiable slices.** Never write the entire decision engine in one pass. Build it module by module, testing each slice.

**Tiny Society slices:**
1. Ollama client → test with hardcoded prompt
2. Agent class → test state management
3. Decision engine → test with mock Ollama
4. Action executor → test validation rules
5. Wire them together → integration test

---

### idea-refine
**Path:** `C:\Users\Hp\.gemini\config\skills\idea-refine\SKILL.md`

> **Refine vague ideas into sharp concepts.** Use when designing the decision loop, memory scoring algorithm, or conflict resolution system.

**Tiny Society refinement targets:**
- Memory importance scoring formula
- How relationship scores should change after different event types
- Conversation outcome extraction (what did the conversation decide?)
- Promise tracking and fulfillment detection

---

## Phase 3 — Social System

### documentation-and-adrs
**Path:** `C:\Users\Hp\.gemini\config\skills\documentation-and-adrs\SKILL.md`

> **Record architecture decisions.** Document WHY you made certain choices — future-you will thank past-you.

**ADRs to record:**
- **ADR-001:** Why custom agent manager instead of LangChain/CrewAI
- **ADR-002:** Why SQLite before ChromaDB for initial memory
- **ADR-003:** Why event-driven decisions instead of continuous inference
- **ADR-004:** Why round-robin agent ticks instead of parallel
- **ADR-005:** Why structured JSON output instead of free-form text parsing
- **ADR-006:** Why directional relationships (Alex→Noah ≠ Noah→Alex)

---

### dispatching-parallel-agents
**Path:** `C:\Users\Hp\.gemini\config\skills\dispatching-parallel-agents\SKILL.md`

> **Run independent tasks in parallel.** When building Phase 3, conversation system and relationship manager are independent — build both simultaneously.

---

### subagent-driven-development
**Path:** `C:\Users\Hp\.gemini\config\skills\subagent-driven-development\SKILL.md`

> **Execute plans with independent tasks.** Delegate independent subsystems to separate development tracks.

**Parallelizable Phase 3 tasks:**
- Conversation engine (backend) ‖ Conversation UI (frontend)
- Relationship manager ‖ Trade action handler
- User interaction endpoint ‖ Activity indicators (Phaser)

---

## Phase 4 — Memory System

### performance-optimization
**Path:** `C:\Users\Hp\.gemini\config\skills\performance-optimization\SKILL.md`

> **Optimize performance across the stack.** Critical for Tiny Society because Ollama inference on a T550 GPU is the bottleneck.

**Optimization targets:**
- Ollama inference: reduce prompt token count, tune `num_ctx`, `temperature`
- ChromaDB queries: limit result count, optimize metadata filters
- WebSocket event throughput: batch events, avoid flooding frontend
- Phaser rendering: sprite pooling, minimize draw calls
- Memory retrieval: cache recent queries, pre-compute embeddings

---

### observability-and-instrumentation
**Path:** `C:\Users\Hp\.gemini\config\skills\observability-and-instrumentation\SKILL.md`

> **Add logging so you can see what's happening.** Essential for debugging agent behavior — you need to see what memories were retrieved, what prompt was sent, what decision came back.

**What to instrument:**
- Each agent decision: input observation, retrieved memories, Ollama prompt, returned action
- Memory operations: what was stored, what was retrieved, relevance scores
- Relationship changes: before/after scores, triggering event
- Simulation ticks: time, active agents, pending actions
- Ollama latency per call

---

## Phase 5 — UI & Persistence

### browser-testing-with-devtools
**Path:** `C:\Users\Hp\.gemini\config\skills\browser-testing-with-devtools\SKILL.md`

> **Test in real browsers.** Debug Phaser rendering, WebSocket connections, React component behavior, and performance using Chrome DevTools.

---

### using-git-worktrees
**Path:** `C:\Users\Hp\.gemini\config\skills\using-git-worktrees\SKILL.md`

> **Isolate feature work.** Use worktrees when working on the UI polish while keeping the main branch stable.

---

## Phase 6 — Testing & Polish

### test-driven-development
**Path:** `C:\Users\Hp\.gemini\config\skills\test-driven-development\SKILL.md`

> **Drive development with tests.** Write tests for every agent behavior, memory operation, and API endpoint.

**Tiny Society test categories:**
- **Unit tests:** Decision engine parsing, action validation, memory scoring, relationship math
- **Integration tests:** Full agent tick → Ollama → action → state update
- **Scenario tests:** The 20–30 controlled scenarios from the plan
- **Personality consistency tests:** Same input, different agent → different output
- **Persistence tests:** Save → load → verify all state matches

---

### debugging-and-error-recovery
**Path:** `C:\Users\Hp\.gemini\config\skills\debugging-and-error-recovery\SKILL.md`

> **Systematic root-cause debugging.** Use when Ollama returns invalid JSON, agent gets stuck in a loop, memory retrieval returns irrelevant results, or WebSocket disconnects.

---

### systematic-debugging
**Path:** `C:\Users\Hp\.gemini\config\skills\systematic-debugging\SKILL.md`

> **Before proposing any fix — reproduce and understand the bug.** Especially important when agent behavior seems "wrong" — is it the prompt, the memory, the validation, or the model?

---

### code-review-and-quality
**Path:** `C:\Users\Hp\.gemini\config\skills\code-review-and-quality\SKILL.md`

> **Multi-axis code review before merging.** Review backend Python code for correctness, readability, test coverage, and API consistency.

---

### code-simplification
**Path:** `C:\Users\Hp\.gemini\config\skills\code-simplification\SKILL.md`

> **Simplify code that accumulated complexity.** The decision engine and memory manager are likely to get complex — periodically simplify them.

---

### verification-before-completion
**Path:** `C:\Users\Hp\.gemini\config\skills\verification-before-completion\SKILL.md`

> **Run verification before claiming done.** Before each phase milestone, actually run the tests and verify the deliverables. Evidence before assertions.

---

### git-workflow-and-versioning
**Path:** `C:\Users\Hp\.gemini\config\skills\git-workflow-and-versioning\SKILL.md`

> **Structured git practices throughout.** Feature branches per phase, atomic commits, semantic versioning.

**Branch strategy:**
- `main` — always stable, demoable
- `phase/1-world` → merge when milestone passes
- `phase/2-backend-alex` → merge when Alex works
- `phase/3-social` → merge when 5 agents converse
- `phase/4-memory` → merge when memory influences behavior
- `phase/5-ui` → merge when dashboard is complete
- `phase/6-polish` → merge when tests pass

---

### finishing-a-development-branch
**Path:** `C:\Users\Hp\.gemini\config\skills\finishing-a-development-branch\SKILL.md`

> **When implementation is complete, decide how to integrate.** Use at the end of each phase branch before merging to main.

---

### requesting-code-review
**Path:** `C:\Users\Hp\.gemini\config\skills\requesting-code-review\SKILL.md`

> **Before merging phase branches.** Request review at each phase completion.

---

### receiving-code-review
**Path:** `C:\Users\Hp\.gemini\config\skills\receiving-code-review\SKILL.md`

> **Handle review feedback with technical rigor.** Don't blindly implement suggestions — verify they're correct.

---

## Release & Beyond

### shipping-and-launch
**Path:** `C:\Users\Hp\.gemini\config\skills\shipping-and-launch\SKILL.md`

> **Pre-launch checklist.** Use before the final demo or public release.

**Checklist items for Tiny Society:**
- README with screenshots and setup instructions
- Demo video (3–5 minutes)
- Error handling for Ollama connection failures
- Graceful degradation when GPU is busy
- Save file migration strategy

---

### open-sourcing
**Path:** `C:\Users\Hp\.gemini\config\skills\open-sourcing\SKILL.md`

> **If publishing Tiny Society publicly.** License, secrets hygiene, contribution guide, issue templates.

---

### ci-cd-and-automation
**Path:** `C:\Users\Hp\.gemini\config\skills\ci-cd-and-automation\SKILL.md`

> **Automate testing and linting.** Set up GitHub Actions to run pytest + ruff on backend, eslint + tsc on frontend for every PR.

---

### deprecation-and-migration
**Path:** `C:\Users\Hp\.gemini\config\skills\deprecation-and-migration\SKILL.md`

> **When evolving the save file format.** As you add features (Phase 4 adds ChromaDB), save files need migration from older formats.

---

## 🔑 Top 10 Most Important Skills for This Project

| Priority | Skill | Why |
|----------|-------|-----|
| 1 | **spec-driven-development** | Write specs before code for every subsystem |
| 2 | **incremental-implementation** | Never build everything at once — thin slices |
| 3 | **source-driven-development** | Phaser, FastAPI, Ollama, ChromaDB — always check docs |
| 4 | **test-driven-development** | Prove agent behavior works with tests |
| 5 | **api-and-interface-design** | REST + WebSocket + module boundaries need to be stable |
| 6 | **frontend-ui-engineering** | The React dashboard is half the user experience |
| 7 | **performance-optimization** | Ollama on a T550 GPU is the bottleneck |
| 8 | **debugging-and-error-recovery** | Agent behavior bugs are subtle and hard to trace |
| 9 | **documentation-and-adrs** | Record WHY you made each architecture decision |
| 10 | **verification-before-completion** | Actually verify milestones before moving on |

> [!TIP]
> **Workflow pattern:** For each task within a phase, follow this skill sequence:
> 1. `brainstorming` → explore alternatives
> 2. `spec-driven-development` → write the spec
> 3. `source-driven-development` → check official docs
> 4. `test-driven-development` → write failing tests
> 5. `incremental-implementation` → build in slices
> 6. `verification-before-completion` → prove it works
> 7. `code-review-and-quality` → review before merge
