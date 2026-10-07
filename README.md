# AEGIS: Frontend and Demo

**Adaptive Engine for Graph-based Intelligence & Scam-interruption**
RAKSHAM – AI Cybersecurity Hackathon, IIT Delhi · Problem Statement 02: AI-Driven Scam Pattern Recognition

> Scammers don't steal money first. They steal the decision.

AEGIS doesn't just say "this is a scam". It shows how an attack is progressing, what the attacker will probably do next, and when to interrupt the user.

---

## Current status (read this first)

This repo is a **self-contained, browser-only demo**. There is no backend, ML model, or streaming service behind it yet.

| Part | Status |
|---|---|
| Scene 1: simulated bank-impersonation call (signals, stages, risk, Scam DNA %, ShadowPath) | **Scripted** timeline in `demo/bankScam.ts` |
| Privacy gate (PII redaction and counts) | **Real code**: regex redaction in `services/sanitize.ts`, counts computed from the actual text |
| Scene 2: cross-incident pattern engine (similarity %, predicted next step) | **Real computation** over demo incident data (`services/patterns.ts`), but the incidents themselves are made-up demo data |
| Attack graph, risk engine, Reality Pause UI | Real UI, driven by the event stream |

Be upfront about this when presenting: the call is simulated, the 71% / 87% Scam DNA values in Scene 1 are scripted, and redaction is regex-based (it will miss some PII; production would use a trained entity model).

---

## What's built

**Scene 1: `/` (live dashboard)**
- Simulated call with a redacted live transcript
- Semantic signals with evidence
- Attack graph that grows node by node (React Flow), with a dashed predicted node
- Manipulation stage bar (observable signals only, not the user's mind)
- Scam DNA match card
- ShadowPath: likely next step, confidence, evidence
- Risk engine: `NORMAL → WATCH → INTERVENE → CRITICAL`, always with "why" chips
- Privacy gate counters
- Reality Pause: full-screen calm interruption with Verify Safely / I'm Not Sure / Continue Anyway

**Scene 2: `/patterns` (pattern engine)**
- Three anonymized incidents (different brands and channels, same workflow)
- Structural similarity computed with longest-common-subsequence over step order
- A new in-progress incident is matched and the next step is predicted by voting across known incidents, before the money step

---

## Run it

```bash
npm install
npm run dev
```

Open http://localhost:3000 and click **Start demo**. Then open http://localhost:3000/patterns and click **Start**.

Tips: use the speed selector (1x / 1.5x / 2x) in the header, rehearse at full-screen (F11), and keep a recorded backup video.

**Stack:** Next.js (App Router), TypeScript, Tailwind CSS, Zustand, React Flow (`@xyflow/react`).

---

## Project structure

```text
app/
  page.tsx               Scene 1 dashboard
  patterns/page.tsx      Scene 2 pattern engine
components/
  AttackGraph/           React Flow graph
  RealityPause/          full-screen intervention overlay
  RiskEngine/            risk banner with drivers
  ManipulationState/     stage bar
  ScamDNA/               match card
  ShadowPath/            next-step prediction card
  PrivacyGate/           privacy counters
hooks/useAegis.ts        Zustand store + timeline player (single source of UI state)
services/
  sanitize.ts            regex PII redaction
  patterns.ts            similarity + next-step prediction
demo/
  bankScam.ts            scripted Scene 1 timeline
  incidents.ts           demo incidents for Scene 2
types/events.ts          event contract (see below)
```

---

## Integration guide for the other repos

The UI renders from **one event stream**. Anything that emits these events can drive the dashboard, so teammates should match this contract rather than invent their own formats. If a change is needed, agree on it here first.

### Event contract (`types/events.ts`)

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

`at` is milliseconds from the start of the interaction. `progress` and `confidence` are 0–1 for `progress` and 0–100 for `confidence`/`matchPct`, matching the current demo data.

### What each role plugs in

| Role | Provides | Maps to events |
|---|---|---|
| **#1 AI/ML** | Semantic extraction, manipulation stage, Scam DNA similarity, ShadowPath prediction, privacy measurement | `signal`, `stage`, `scam_dna`, `shadowpath`, `privacy` |
| **#2 Real-Time Systems** | Streaming transport (e.g. WebSocket) delivering events in order | all events |
| **#3 Backend/Graph** | Causal action graph, risk engine with drivers, cross-incident pattern data | `graph_node`, `risk`, `reality_pause`, plus incident data for `/patterns` |

Rules of thumb:
- `risk` events must carry `drivers` (why the level changed). No bare scores.
- Use only the four risk levels above.
- `transcript.text` should already be sanitized. Never send raw PII to the UI.
- Stage names describe observable communication signals, not the user's psychological state.

### Switching from the scripted demo to a live backend

The only swap point is the player in `hooks/useAegis.ts`. Anything that calls `apply(event)` drives the UI:

```ts
import { useAegis } from "@/hooks/useAegis";

export function connect(url: string) {
  const ws = new WebSocket(url);
  ws.onmessage = (m) => useAegis.getState().apply(JSON.parse(m.data));
  return () => ws.close();
}
```

Two things to fix when integrating:
1. `apply()` currently sanitizes `transcript` text and overwrites the `privacy` counts from its own redaction. When a real backend sends `privacy` events, remove or merge that logic so real counts aren't overwritten.
2. `/patterns` currently reads `demo/incidents.ts` and `services/patterns.ts`. Replace those with an API response of incidents shaped as `{ id, label, surface, steps[] }`, using the step vocabulary in `demo/incidents.ts` (or agree on a new one).

Keep the scripted demo available behind a flag. If the live pipeline fails on stage, flip back to it.

---

## Demo script (about 3 minutes)

1. **Scene 1** (`/`): Start demo. Point out, in order: redacted transcript → signals → stage → graph growing → Scam DNA → ShadowPath prediction → risk rising with reasons → **Reality Pause**.
2. **Scene 2** (`/patterns`): Start. Three incidents with different brands but the same workflow → computed similarity → new incident → AEGIS predicts the next step before the money step.
3. Closing line: *"AEGIS doesn't classify scams. It recognizes how they unfold, and interrupts at the right moment."*

## Known limitations

- Scene 1 is a scripted simulation, not live detection.
- Regex redaction misses some PII (e.g. unusual name formats).
- Demo incident library has 3 entries and is not real data.
- No authentication, persistence, or multi-language support.
