# AEGIS

**Adaptive Engine for Graph-based Intelligence & Scam-interruption**
RAKSHAM – AI Cybersecurity Hackathon, IIT Delhi · Problem Statement 02: AI-Driven Scam Pattern Recognition

> Scammers don't steal money first. They steal the decision.

AEGIS doesn't just say "this is a scam". It shows how an attack is progressing, what the attacker will probably do next, and when to interrupt the user.

---

## Repositories

| Repo | Purpose | Owner role |
|---|---|---|
| **aegis-core** | Detection logic: privacy filter, semantic extraction, manipulation state machine, Scam DNA, ShadowPath | #1 AI/ML |
| **aegis-realtime** | Streaming layer (for now, the backend's WebSocket plays this role) | #2 Real-Time Systems |
| **aegis-backend** | FastAPI service wrapping aegis-core: causal graph, risk engine, Reality Pause, incident library API, WebSocket stream | #3 Backend/Graph |
| **aegis-frontend** | Dashboard, Reality Pause, pattern-engine view, demo mode, live mode (this repo) | Frontend + Demo Lead |
| **aegis-data** | Demo scenarios, anonymized incident library, labeled test sets | shared |
| **aegis-docs** | Architecture notes, event schema, demo script, slides, setup guides | shared |

---

## How the pieces fit

```text
 aegis-data ──(scenarios, incidents, test sets)──┐
                                                 ▼
 Call / Chat / Message ─► aegis-realtime ─► aegis-core ─► aegis-backend
                           (stream)         (detect)       (graph, risk,
                                                            patterns)
                                                 │
                                                 ▼
                                   AegisEvent stream (see contract)
                                                 │
                                                 ▼
                                          aegis-frontend
                                   (dashboard, Reality Pause)
```

Pipeline in plain words: stream in → remove personal data → extract meaning → rebuild the attack workflow → track stage, match Scam DNA, predict next step → compute explainable risk → intervene with Reality Pause.

---

## Shared event contract

Every repo that produces data for the UI must emit these events. This is the single interface between the backend side and the frontend (`types/events.ts`). Change it only by agreement.

```ts
type Stage = "TRUST" | "AUTHORITY" | "URGENCY" | "ISOLATION" | "COMPLIANCE" | "MONEY_MOVEMENT";
type RiskLevel = "NORMAL" | "WATCH" | "INTERVENE" | "CRITICAL";

type AegisEvent =
  | { type: "transcript"; at: number; speaker: "caller" | "user"; text: string }
  | { type: "signal"; at: number; label: string; severity: "info" | "warn" | "critical"; evidence: string }
  | { type: "stage"; at: number; stage: Stage; progress: number; reason: string }
  | { type: "graph_node"; at: number; id: string; label: string; parent?: string; predicted?: boolean }
  | { type: "scam_dna"; at: number; matchPct: number; pattern: string; incidents: number }
  | { type: "shadowpath"; at: number; next: string; confidence: number; evidence: string[] }
  | { type: "risk"; at: number; level: RiskLevel; drivers: string[] }
  | { type: "privacy"; at: number; detected: number; removed: number; transmitted: number }
  | { type: "reality_pause"; at: number; reasons: string[] };
```

Conventions:
- `at` is milliseconds from the start of the interaction.
- `progress` is 0 to 1. `confidence` and `matchPct` are 0 to 100.
- `risk` events must include `drivers` (why the level changed). No bare scores.
- Use only the four risk levels.
- `transcript.text` must already be sanitized.
- Stage names describe observable communication signals, not the user's psychological state.
- Graph node ids: real nodes start with `n`, predicted nodes start with `p`. A real node replaces any predicted one.
- The backend may also send `{"type":"error","message":"..."}`. It is not an `AegisEvent`; the frontend shows it in a banner.

---

## aegis-frontend (this repo)

### What's built

**Scene 1: `/` (dashboard)**
- Redacted live transcript, semantic signals with evidence
- Attack graph that grows node by node (React Flow), with a dashed predicted node that resolves into a real one
- Manipulation stage bar, Scam DNA match card, ShadowPath prediction
- Risk engine `NORMAL → WATCH → INTERVENE → CRITICAL`, always with "why" chips
- Privacy gate counters
- Reality Pause: full-screen calm interruption (Verify Safely / I'm Not Sure / Continue Anyway)

**Three ways to drive Scene 1**
- **Start demo**: scripted timeline in `demo/bankScam.ts`. Works with no backend.
- **Live (replay)**: the backend replays a scenario over WebSocket and runs it through aegis-core.
- **Live (custom)**: type caller/user lines and watch the backend analyze them.

**Live view**
- Connection status in the header: connecting, live, reconnecting (n/5), unreachable.
- Backend `{"type":"error"}` messages appear in a dismissible banner.
- Auto-reconnect with backoff when the socket drops. A reconnect starts a new backend session, so the dashboard clears and says so.
- Typed text is redacted in the browser (`services/sanitize.ts`) before it is sent, and the screen shows a preview and a count. Replay text is read by the backend from its own file, so that claim covers typed text only.

**Scene 2: `/patterns` (pattern engine)**
- Fetches the incident library from the backend; falls back to built-in demo incidents if the backend is down.
- Structural similarity computed with longest-common-subsequence over step order.
- A new in-progress incident is matched and its next step predicted by voting across known incidents, before the money step.

### What is real and what is scripted

| Part | Nature |
|---|---|
| Start demo: signals, stages, risk levels, Scam DNA %, ShadowPath | **Scripted** timeline in `demo/bankScam.ts` |
| Live modes | **Real backend output** from aegis-backend / aegis-core |
| Browser-side redaction (typed text, scripted demo) | **Real code**: rule-based regex in `services/sanitize.ts`; can miss unusual names |
| Scene 2 similarity % and next-step prediction | **Real computation** in `services/patterns.ts` over the library (backend or demo data) |

### Run it

```bash
npm install
npm run dev
```

Open http://localhost:3000 and click **Start demo**, then open http://localhost:3000/patterns and click **Start**.

**Live backend mode (optional):** copy `.env.example` to `.env.local`, start `aegis-backend` on port 8000 (it needs `aegis-core` installed next to it), restart `npm run dev`, then use **Live (replay)** or **Live (custom)** on the dashboard. Without a backend, **Start demo** and `/patterns` still work from built-in demo data.

Environment variables (`.env.example`):

```text
NEXT_PUBLIC_BACKEND_WS=ws://localhost:8000/ws
NEXT_PUBLIC_BACKEND_HTTP=http://localhost:8000
```

Stack: Next.js (App Router), TypeScript, Tailwind CSS, Zustand, React Flow (`@xyflow/react`).

### Structure

```text
app/
  page.tsx               Scene 1 dashboard (demo + live modes)
  patterns/page.tsx      Scene 2 pattern engine
components/
  AttackGraph/  RealityPause/  RiskEngine/  ManipulationState/
  ScamDNA/  ShadowPath/  PrivacyGate/
hooks/useAegis.ts        Zustand store: event reducer, scripted player, WebSocket live mode
services/
  sanitize.ts            rule-based PII redaction
  patterns.ts            similarity + next-step prediction
demo/
  bankScam.ts            scripted Scene 1 timeline
  incidents.ts           demo incidents + step labels/colors
types/events.ts          event contract
```

---

## Current status

| Part | Status |
|---|---|
| **aegis-frontend** | Working. Scripted demo, live mode, pattern view |
| aegis-core | Used through aegis-backend |
| aegis-backend | Frontend live mode connects over WebSocket (`/ws`) and HTTP (`/library/incidents`) |
| aegis-realtime | Backend's WebSocket stands in for it for now |
| aegis-data | Demo incidents still live in `demo/incidents.ts` |
| aegis-docs | Update as repos land |

---

## Demo script (about 3 minutes)

1. **Scene 1** (`/`): Start demo (or Live replay). Point out, in order: redacted transcript → signals → stage → graph growing → Scam DNA → ShadowPath prediction → risk rising with reasons → **Reality Pause**.
2. **Scene 2** (`/patterns`): Start. Incidents with different brands but the same workflow → computed similarity → new incident → AEGIS predicts the next step before the money step.
3. Closing line: *"AEGIS doesn't classify scams. It recognizes how they unfold, and interrupts at the right moment."*

Tip: keep the scripted demo as the main judged run, and use live mode as the "it's real" moment. If the backend fails on stage, switch back.

## Known limitations

- Start demo is a scripted simulation, not live detection.
- Rule-based redaction misses some PII (for example, unusual name formats).
- Risk thresholds in the backend are hand-set placeholders; sessions live in memory; there is no authentication.
- No persistence or multi-language support in the frontend.
