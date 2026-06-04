import { Clock, AlertTriangle, Repeat, TrendingDown } from "lucide-react";
import { useLandingLang, t } from "@/lib/landing-i18n";

export function ProblemSection() {
  const { lang } = useLandingLang();

  const consequences = [
    {
      icon: Clock,
      title: t.consequence1Title[lang],
      desc: t.consequence1Desc[lang],
    },
    {
      icon: AlertTriangle,
      title: t.consequence2Title[lang],
      desc: t.consequence2Desc[lang],
    },
    {
      icon: Repeat,
      title: t.consequence3Title[lang],
      desc: t.consequence3Desc[lang],
    },
    {
      icon: TrendingDown,
      title: t.consequence4Title[lang],
      desc: t.consequence4Desc[lang],
    },
  ];

  return (
    <section className="border-t border-border/40">
      <div className="mx-auto max-w-6xl px-8 py-24">
        {/* Section header */}
        <div className="mb-14 max-w-2xl">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/40 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-muted-foreground backdrop-blur">
            <span className="size-1.5 rounded-full bg-muted-foreground/60" />
            {t.problemKicker[lang]}
          </div>
          <h2 className="mb-6 text-3xl font-semibold leading-[1.1] tracking-tight text-foreground sm:text-4xl lg:text-[2.75rem]">
            {t.problemHeading[lang]}
          </h2>
          <p className="text-base leading-relaxed text-muted-foreground lg:text-[17px]">
            {t.problemBody[lang]}
          </p>
        </div>

        {/* Consequence cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {consequences.map(({ icon: Icon, title, desc }, i) => (
            <div
              key={i}
              className="rounded-xl border border-border/60 bg-card/30 p-5 backdrop-blur transition-colors hover:border-border"
            >
              <div className="mb-4 flex size-9 items-center justify-center rounded-lg bg-muted/50">
                <Icon className="size-4 text-muted-foreground" />
              </div>
              <div className="mb-1.5 text-[15px] font-medium text-foreground">
                {title}
              </div>
              <div className="text-sm leading-relaxed text-muted-foreground">
                {desc}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
