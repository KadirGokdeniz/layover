import type { Context, Scenario, TranslateRequest, TranslateResponse } from "./types";

// Edit this to point at your Global Gate backend.
export const API_BASE = "http://localhost:8000";

type Listener = (active: boolean) => void;
let mockActive = false;
const listeners = new Set<Listener>();

export function isMockActive() {
  return mockActive;
}

export function subscribeMock(fn: Listener) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function setMock(v: boolean) {
  if (mockActive === v) return;
  mockActive = v;
  listeners.forEach((l) => l(v));
}

export async function translate(req: TranslateRequest): Promise<TranslateResponse> {
  try {
    const res = await fetch(`${API_BASE}/translate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = (await res.json()) as TranslateResponse;
    setMock(false);
    return data;
  } catch {
    setMock(true);
    // Mock fallback: kaynak metni olduğu gibi döndürür. "[mock]" prefix'i artık yok —
    // sağ alttaki MockIndicator pill'i mock durumunu görsel olarak zaten gösteriyor.
    // Bu sayede TTS de "[mock]" kelimesini sesli okumuyor.
    return {
      translation: req.source_text,
      raw_llm_output: req.source_text,
      force_report: [],
    };
  }
}

export async function fetchScenario(context: Context): Promise<Scenario | null> {
  try {
    const res = await fetch(`${API_BASE}/scenarios/${context}`);
    if (!res.ok) return null;
    return (await res.json()) as Scenario;
  } catch {
    return null;
  }
}
import type { OpsResponse } from "./types";

export async function fetchOps(context: Context): Promise<OpsResponse | null> {
  try {
    const r = await fetch(`${API_BASE}/ops/${context}`);
    if (!r.ok) {
      console.warn(`fetchOps(${context}) failed: ${r.status}`);
      return null;
    }
    return await r.json();
  } catch (err) {
    console.warn(`fetchOps(${context}) error:`, err);
    return null;
  }
}