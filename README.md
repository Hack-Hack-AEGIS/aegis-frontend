AEGIS

Adaptive Engine for Graph-based Intelligence & Scam-interruption

RAKSHAM – AI Cybersecurity Hackathon, IIT Delhi · Problem Statement 02: AI-Driven Scam Pattern Recognition

Scammers don't steal money first. They steal the decision.

AEGIS doesn't just say "this is a scam". It shows how an attack is progressing, what the attacker will probably do next, and when to interrupt the user.

Repositories
Repo	Purpose	Owner role
aegis-core	Detection logic: privacy filter, semantic extraction, manipulation state machine, Scam DNA, ShadowPath	#1 AI/ML
aegis-realtime	Streaming layer for ingesting call/chat streams and delivering ordered events; the backend WebSocket currently plays this role	#2 Real-Time Systems
aegis-backend	FastAPI service wrapping aegis-core: causal graph, risk engine, Reality Pause, incident library API, WebSocket stream	#3 Backend/Graph
aegis-frontend	Dashboard, Reality Pause, pattern-engine view, demo mode, live mode	Frontend + Demo Lead
aegis-data	Demo scenarios, anonymized incident library, labeled test sets for privacy and detection	shared
aegis-docs	Architecture notes, event schema, demo script, slides, setup guides	shared

Responsibilities are proposed based on repository names and team roles. Update them as the project architecture evolves.

How the pieces fit
aegis-data ──(scenarios, incidents, test sets)──┐
                                                ▼
Call / Chat / Message ─► aegis-realtime ─► aegis-core ─► aegis-backend
                         (stream)          (detect)       (graph, risk,
                                                           patterns)
                                                │
                                                ▼
                                  AegisEvent stream
                                                │
                                                ▼
                                         aegis-frontend
                                  (dashboard, Reality Pause)


Pipeline in plain words: stream in → remove personal data → extract meaning → rebuild the attack workflow → track stage, match Scam DNA, predict the next step → compute explainable risk → intervene with Reality Pause.

Population loop: many anonymized incidents → behavioral fingerprints → clustering → emerging scam workflow → better future detection.

Shared event contract

Every repo that produces data for the UI must follow the shared event contract in types/events.ts. This is the interface between the backend and frontend. Change it only by agreement and document changes in aegis-docs.

type Stage =
  | "TRUST"
  | "AUTHORITY"
  | "URGENCY"
  | "ISOLATION"
  | "COMPLIANCE"
  | "MONEY_MOVEMENT";

type RiskLevel =
  | "NORMAL"
  | "WATCH"
  | "INTERVENE"
  | "CRITICAL";

type AegisEvent =
  | {
      type: "transcript";
      at: number;
      speaker: "caller" | "user";
      text: string;
    }
  | {
      type: "signal";
      at: number;
      label: string;
      severity: "info" | "warn" | "critical";
      evidence: string;
    }
  | {
      type: "stage";
      at: number;
      stage: Stage;
      progress: number;
      reason: string;
    }
  | {
      type: "graph_node";
      at: number;
      id: string;
      label: string;
      parent?: string;
      predicted?: boolean;
    }
  | {
      type: "scam_dna";
      at: number;
      matchPct: number;
      pattern: string;
      incidents: number;
    }
  | {
      type: "shadowpath";
      at: number;
      next: string;
      confidence: number;
      evidence: string[];
    }
  | {
      type: "risk";
      at: number;
      level: RiskLevel;
      drivers: string[];
    }
  | {
      type: "privacy";
      at: number;
      detected: number;
      removed: number;
      transmitted: number;
    }
  | {
      type: "reality_pause";
      at: number;
      reasons: string[];
    };

Event conventions
at is milliseconds from the start of the interaction.
progress is between 0 and 1.
confidence and matchPct are between 0 and 100.
Risk events must include drivers explaining why the risk level was assigned or changed. Do not send bare risk scores.
Use only the four defined risk levels.
transcript.text must already be sanitized. Never send raw personally identifiable information (PII) to the UI.
Stage names describe observable communication signals, not the user's psychological state.
Real graph node IDs start with n; predicted node IDs start with p. A real node replaces its corresponding predicted node.
The backend may also send {"type":"error","message":"..."}. This is a transport/application error message, not an AegisEvent; the frontend displays it in a banner.
Expected event producers
Event	Expected producer
transcript, privacy	aegis-core (privacy filter)
signal, stage, scam_dna, shadowpath	aegis-core
graph_node, risk, reality_pause	aegis-backend
Event delivery, ordering, reconnects	aegis-realtime or the backend WebSocket layer
Current status
Part	Status
aegis-frontend	Working. Scripted demo, live mode, and pattern-engine view
aegis-core	Used through aegis-backend; integration details depend on the backend implementation
aegis-backend	Frontend live mode connects over WebSocket (/ws) and HTTP (/library/incidents)
aegis-realtime	Backend WebSocket currently provides the streaming role
aegis-data	Demo incidents currently live in aegis-frontend/demo/
aegis-docs	Update architecture and integration documentation as repositories evolve

The frontend runs standalone, so the demo can work without the backend. Update this table as integrations and capabilities change.

aegis-frontend (this repo)
What's built

Scene 1: / — Live dashboard

Simulated call with a redacted transcript.
Semantic signals with supporting evidence.
Attack graph that grows node by node using React Flow, including a dashed predicted node.
Manipulation stage bar.
Scam DNA match card.
ShadowPath prediction: likely next step, confidence, and evidence.
Risk engine: NORMAL → WATCH → INTERVENE → CRITICAL, with explanations.
Privacy gate counters.
Reality Pause: a full-screen, calm interruption with Verify Safely, I'm Not Sure, and Continue Anyway.

Scene 2: /patterns — Pattern engine

Three anonymized demo incidents with different brands and channels but similar workflows.
Structural similarity computed using longest-common-subsequence (LCS) over step order.
A new in-progress incident is matched against known incidents.
The next step is predicted by voting across known incidents, before the money step.
Three ways to drive Scene 1
Start demo: Runs the scripted timeline in demo/bankScam.ts. Works without a backend.
Live (replay): The backend replays a scenario over WebSocket and processes it through aegis-core.
Live (custom): Enter caller/user lines and watch the backend analyze them.
Live view
Connection status in the header: connecting, live, reconnecting (n/5), or unreachable.
Backend {"type":"error"} messages appear in a dismissible banner.
Automatic reconnection with backoff when the socket drops.
Reconnecting starts a new backend session, so the dashboard clears and indicates the new session.
Typed text is redacted in the browser using services/sanitize.ts before being sent. The UI displays a preview and redaction count.
Replay text is read by the backend from its own scenario file. Browser-side redaction claims apply to typed text, not backend-loaded replay data.
What is real and what is scripted?
Part	Nature
Start demo: signals, stages, risk levels, Scam DNA percentage, ShadowPath	Scripted timeline in demo/bankScam.ts
Live modes	Backend output from aegis-backend / aegis-core
Browser-side redaction for typed text	Rule-based regex in services/sanitize.ts; may miss unusual formats
Scene 2 similarity and next-step prediction	Real computation in services/patterns.ts over the available incident library or demo data
Incident library	Backend-provided data when available; built-in demo incidents otherwise

Live-mode capabilities depend on the backend implementation and its integration with aegis-core. A scripted demo should not be presented as live AI detection.

Getting started
Prerequisites
Node.js and npm.
The backend is optional for the scripted frontend demo.
Install and run
npm install
npm run dev


Open http://localhost:3000 and click Start demo.

To view the pattern engine, open http://localhost:3000/patterns and click Start.

Live backend mode (optional)
Copy .env.example to .env.local.
Start aegis-backend on port 8000. The backend requires aegis-core to be installed alongside it, according to the backend setup.
Restart the frontend development server.
Select Live (replay) or Live (custom) on the dashboard.

Without a running backend, Start demo and /patterns can use the built-in demo data.

Environment variables

The .env.example file contains:

NEXT_PUBLIC_BACKEND_WS=ws://localhost:8000/ws
NEXT_PUBLIC_BACKEND_HTTP=http://localhost:8000


These values are for local development. Update them for the appropriate backend environment when deploying.

Tech stack
Next.js (App Router)
TypeScript
Tailwind CSS
Zustand
React Flow (@xyflow/react)
Project structure
app/
  page.tsx               Scene 1 dashboard (demo + live modes)
  patterns/page.tsx      Scene 2 pattern engine

components/
  AttackGraph/
  RealityPause/
  RiskEngine/
  ManipulationState/
  ScamDNA/
  ShadowPath/
  PrivacyGate/

hooks/
  useAegis.ts            Zustand store, event reducer, scripted player,
                         WebSocket live mode

services/
  sanitize.ts            Rule-based PII redaction
  patterns.ts            Similarity and next-step prediction

demo/
  bankScam.ts            Scripted Scene 1 timeline
  incidents.ts            Demo incidents and step labels/colors

types/
  events.ts              Shared event contract

.env.example              Backend environment variable template

Integration guide
Connecting a live stream

The UI state is managed by hooks/useAegis.ts. Events applied through the store's apply() function drive the dashboard.

Example WebSocket integration:

import { useAegis } from "@/hooks/useAegis";

export function connect(url: string) {
  const ws = new WebSocket(url);

  ws.onmessage = (message) => {
    useAegis.getState().apply(JSON.parse(message.data));
  };

  return () => ws.close();
}


Use this as an integration example and keep it aligned with the actual event reducer and backend protocol.

Integration considerations
Privacy handling: If apply() sanitizes transcript text and recalculates privacy counts, ensure that these operations do not overwrite authoritative privacy events emitted by aegis-core. Agree on which component owns redaction and privacy metrics.
Pattern library: /patterns should use the backend incident API when available and fall back to demo/incidents.ts when the backend is unavailable. Keep the incident schema consistent, for example { id, label, surface, steps[] }.
Event ordering: The streaming layer must preserve event order and a consistent at timeline.
Predicted graph nodes: Ensure that predicted nodes are reconciled with real nodes when subsequent events arrive.
Demo fallback: Keep the scripted demo available so the project remains demonstrable when live integration fails.
What the other repositories should deliver
aegis-core: Given sanitized text, produce signals, manipulation stages, Scam DNA matches, and ShadowPath predictions using the agreed event shapes. Document the privacy evaluation methodology and use labeled test data from aegis-data.
aegis-realtime: Deliver events in order with a stable timeline. Support replay of recorded scenarios from aegis-data.
aegis-backend: Expose the causal graph through graph_node events, compute explainable risk with drivers, determine when to emit reality_pause, and serve the incident library for /patterns.
aegis-data: Maintain anonymized incident examples, demo scenarios, and labeled test sets. Do not store real personal data in demo fixtures.
aegis-docs: Maintain the event contract, demo script, architecture diagram, and integration instructions as the source of truth when repositories disagree.
Demo script (about 3 minutes)
Scene 1 (/): Start the demo or Live replay. Point out the redacted transcript → signals → manipulation stage → growing attack graph → Scam DNA → ShadowPath prediction → risk escalation with reasons → Reality Pause.
Scene 2 (/patterns): Start the pattern engine. Show incidents with different brands but similar workflows → computed similarity → a new incident → prediction of the next step before the money step.
Closing line: "AEGIS doesn't classify scams. It recognizes how they unfold, and interrupts at the right moment."

Presentation tip: Use the scripted demo as the primary judged run and live mode to demonstrate backend integration. If the backend fails during the demo, switch back to the scripted mode.

Known limitations
Start demo is a scripted simulation, not live scam detection.
Rule-based redaction can miss PII, including unusual names and formats.
The demo incident library is small and uses fabricated examples, not real incident data.
Backend risk thresholds may be manually configured placeholders.
Backend sessions may be stored in memory rather than persisted.
Authentication, persistent storage, and multilingual support are not currently implemented in the frontend.
Predictions depend on the quality and coverage of the available incident library.