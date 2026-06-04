import { useLandingLang, t } from "@/lib/landing-i18n";

const LANGUAGES = [
  { code: "EN", label: "English" },
  { code: "IT", label: "Italiano" },
  { code: "AR", label: "العربية" },
  { code: "RU", label: "Русский" },
];

const CONTEXTS = [
  "Boarding",
  "Check-in",
  "Transfer",
  "Security",
  "Passport",
];

export function SolutionSection() {
  const { lang } = useLandingLang();

  return (
    <section className="border-t border-border/40 bg-muted/[0.15]">
      <div className="mx-auto max-w-6xl px-8 py-24">
        {/* Section header */}
        <div className="mb-20 max-w-2xl">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/60 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-muted-foreground backdrop-blur">
            <span className="size-1.5 rounded-full bg-[#0F4C5C] dark:bg-[#5BC4D6]" />
            {t.solutionKicker[lang]}
          </div>
          <h2 className="text-3xl font-semibold leading-[1.1] tracking-tight text-foreground sm:text-4xl lg:text-[2.75rem]">
            {t.solutionHeading[lang]}
          </h2>
        </div>

        {/* Feature blocks */}
        <div className="space-y-24">
          {/* ============ Block 1: FORCE-LOCK — text left, force-lock visual right ============ */}
          <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
            <div>
              <div className="mb-3 font-mono text-xs font-medium text-[#0F4C5C] dark:text-[#5BC4D6]">
                01
              </div>
              <h3 className="mb-4 text-2xl font-semibold tracking-tight text-foreground lg:text-[1.75rem]">
                {t.solution01Title[lang]}
              </h3>
              <p className="text-base leading-relaxed text-muted-foreground">
                {t.solution01Desc[lang]}
              </p>
            </div>
            <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
              <div className="border-b border-border bg-muted/30 px-4 py-2.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                Source → Translation
              </div>
              <div className="space-y-3 p-5">
                <div className="rounded-lg bg-[#0F4C5C]/8 px-3.5 py-2.5 text-sm leading-relaxed text-foreground dark:bg-[#5BC4D6]/8">
                  <div className="mb-1 text-[10px] uppercase tracking-wider text-muted-foreground">
                    TR
                  </div>
                  Uçağınız{" "}
                  <span className="font-semibold text-[#0F4C5C] dark:text-[#5BC4D6]">
                    TK1924
                  </span>
                  , kapı{" "}
                  <span className="font-semibold text-[#0F4C5C] dark:text-[#5BC4D6]">
                    22
                  </span>
                  ,{" "}
                  <span className="font-semibold text-[#0F4C5C] dark:text-[#5BC4D6]">
                    18:45
                  </span>
                  'te biniş.
                </div>
                <div className="rounded-lg bg-muted/40 px-3.5 py-2.5 text-sm leading-relaxed text-muted-foreground">
                  <div className="mb-1 text-[10px] uppercase tracking-wider text-muted-foreground">
                    IT
                  </div>
                  Il suo volo{" "}
                  <span className="font-semibold text-[#0F4C5C] dark:text-[#5BC4D6]">
                    TK1924
                  </span>
                  , gate{" "}
                  <span className="font-semibold text-[#0F4C5C] dark:text-[#5BC4D6]">
                    22
                  </span>
                  , imbarco alle{" "}
                  <span className="font-semibold text-[#0F4C5C] dark:text-[#5BC4D6]">
                    18:45
                  </span>
                  .
                </div>
              </div>
              <div className="border-t border-border bg-[#0F4C5C]/[0.04] px-5 py-2.5 dark:bg-[#5BC4D6]/[0.06]">
                <div className="flex items-center gap-2 font-mono text-[11px] tracking-wider text-muted-foreground">
                  <span className="relative flex size-2">
                    <span className="absolute inline-flex size-full animate-ping rounded-full bg-green-400 opacity-60" />
                    <span className="relative inline-flex size-2 rounded-full bg-green-500" />
                  </span>
                  <span>
                    <span className="font-semibold text-foreground">TK1924</span>
                    ,{" "}
                    <span className="font-semibold text-foreground">22</span>,{" "}
                    <span className="font-semibold text-foreground">18:45</span>{" "}
                    {t.forceLocked[lang]}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ============ Block 2: CONTEXT — contexts visual left, text right (alternating) ============ */}
          <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
            <div className="lg:order-2">
              <div className="mb-3 font-mono text-xs font-medium text-[#0F4C5C] dark:text-[#5BC4D6]">
                02
              </div>
              <h3 className="mb-4 text-2xl font-semibold tracking-tight text-foreground lg:text-[1.75rem]">
                {t.solution02Title[lang]}
              </h3>
              <p className="text-base leading-relaxed text-muted-foreground">
                {t.solution02Desc[lang]}
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm lg:order-1">
              <div className="space-y-2.5">
                {CONTEXTS.map((ctx, i) => (
                  <div
                    key={ctx}
                    className="flex items-center justify-between rounded-lg border border-border/60 bg-background/60 px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="font-mono text-xs text-[#0F4C5C] dark:text-[#5BC4D6]">
                        {String(i + 1).padStart(2, "0")}
                      </div>
                      <div className="text-sm font-medium text-foreground">
                        {ctx}
                      </div>
                    </div>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      {t.solutionContextLabel[lang]}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ============ Block 3: VOICE + MULTILINGUAL — text left, languages grid right ============ */}
          <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
            <div>
              <div className="mb-3 font-mono text-xs font-medium text-[#0F4C5C] dark:text-[#5BC4D6]">
                03
              </div>
              <h3 className="mb-4 text-2xl font-semibold tracking-tight text-foreground lg:text-[1.75rem]">
                {t.solution03Title[lang]}
              </h3>
              <p className="text-base leading-relaxed text-muted-foreground">
                {t.solution03Desc[lang]}
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <div className="grid grid-cols-2 gap-3">
                {LANGUAGES.map((l) => (
                  <div
                    key={l.code}
                    className="flex items-center gap-3 rounded-lg border border-border/60 bg-background/60 p-3"
                  >
                    <div className="flex size-10 items-center justify-center rounded-md bg-[#0F4C5C]/10 font-mono text-xs font-semibold text-[#0F4C5C] dark:bg-[#5BC4D6]/10 dark:text-[#5BC4D6]">
                      {l.code}
                    </div>
                    <div className="text-sm font-medium text-foreground">
                      {l.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}