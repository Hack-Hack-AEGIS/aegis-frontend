export type Step =
  | "AUTHORITY" | "URGENCY" | "CHANNEL_SHIFT" | "ISOLATION"
  | "REMOTE_ACCESS" | "CREDENTIALS" | "TRANSFER" | "LURE" | "TRUST";

export type Incident = { id: string; label: string; surface: string; steps: Step[] };

export const STEP_LABEL: Record<Step, string> = {
  AUTHORITY: "Authority claim",
  URGENCY: "Urgency",
  CHANNEL_SHIFT: "Channel shift",
  ISOLATION: "Isolation",
  REMOTE_ACCESS: "Remote access",
  CREDENTIALS: "Credential request",
  TRANSFER: "Money transfer",
  LURE: "Reward lure",
  TRUST: "Rapport building",
};

export const STEP_COLOR: Record<Step, string> = {
  AUTHORITY: "bg-violet-500/20 text-violet-200 border-violet-500/40",
  URGENCY: "bg-amber-500/20 text-amber-200 border-amber-500/40",
  CHANNEL_SHIFT: "bg-sky-500/20 text-sky-200 border-sky-500/40",
  ISOLATION: "bg-pink-500/20 text-pink-200 border-pink-500/40",
  REMOTE_ACCESS: "bg-red-500/20 text-red-200 border-red-500/40",
  CREDENTIALS: "bg-orange-500/20 text-orange-200 border-orange-500/40",
  TRANSFER: "bg-rose-600/30 text-rose-100 border-rose-500/50",
  LURE: "bg-teal-500/20 text-teal-200 border-teal-500/40",
  TRUST: "bg-lime-500/20 text-lime-200 border-lime-500/40",
};

// Safe lookups: never crash on a step name we don't know.
export const stepLabel = (s: string): string =>
  STEP_LABEL[s as Step] ??
  s.replace(/_/g, " ").toLowerCase().replace(/^\w/, (c) => c.toUpperCase());

export const stepColor = (s: string): string =>
  STEP_COLOR[s as Step] ?? "bg-slate-500/20 text-slate-200 border-slate-500/40";

export const incidents: Incident[] = [
  { id: "A", label: "Incident A", surface: "Bank · WhatsApp",
    steps: ["AUTHORITY", "URGENCY", "CHANNEL_SHIFT", "REMOTE_ACCESS", "CREDENTIALS", "TRANSFER"] },
  { id: "B", label: "Incident B", surface: "Courier · Telegram",
    steps: ["AUTHORITY", "URGENCY", "CHANNEL_SHIFT", "ISOLATION", "REMOTE_ACCESS", "TRANSFER"] },
  { id: "C", label: "Incident C", surface: "UPI support · WhatsApp",
    steps: ["AUTHORITY", "URGENCY", "CHANNEL_SHIFT", "REMOTE_ACCESS", "TRANSFER"] },
];

export const newIncident: Incident = {
  id: "D", label: "New incident", surface: "Telecom KYC · Telegram (in progress)",
  steps: ["AUTHORITY", "URGENCY", "CHANNEL_SHIFT"],
};