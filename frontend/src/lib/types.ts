export type Lang = "tr" | "en" | "it" | "ar" | "ru";
export type PassengerLang = Exclude<Lang, "tr">;
export type Context = "boarding" | "check-in" | "transfer" | "security" | "passport";

export interface ForceReportItem {
  kind: "term" | "entity";
  label: string;
  expected: string;
  fixed: boolean;
  method: string;
  detail: string;
}

export interface TranslateRequest {
  source_text: string;
  source_lang: Lang;
  target_lang: Lang;
  context: Context;
}

export interface TranslateResponse {
  translation: string;
  raw_llm_output: string;
  force_report: ForceReportItem[];
}

export interface Message {
  id: string;
  sender: "staff" | "passenger";
  tr: string;
  foreign: string;
  langForeign: PassengerLang;
  forceReport: ForceReportItem[];
  corrected: boolean;
  context: Context;
}

// ===== Scenarios =====

export interface ScenarioTurn {
  n: number;
  speaker: "passenger" | "staff" | "system";
  lang: Lang;
  text: string;
  direction?: string;
  forced?: string[];
  terms?: string[];
  data_refs?: string[];
}

export interface ScenarioVariant {
  rtl?: boolean;
  turns: ScenarioTurn[];
}

export interface Scenario {
  id: Context;
  tab: Context;
  mode: "full" | "quick_pattern";
  title: { tr: string; en?: string };
  flight_ref?: string | string[] | null;
  data_used?: string[];
  languages_demoed: string[];
  variants: Partial<Record<PassengerLang, ScenarioVariant>>;
  demo_note?: string;
}

// Operations / FlightStrip display data
export interface FieldDisplay {
  label: string;
  value: string;
  mono: boolean;
}

export interface StatusDisplay {
  label: string;
  tone: "green" | "amber" | "red";
}

export interface OpsResponse {
  context: Context;
  fields: FieldDisplay[];
  status: StatusDisplay;
}