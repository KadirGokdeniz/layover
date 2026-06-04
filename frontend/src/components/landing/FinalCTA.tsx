import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLandingLang, t } from "@/lib/landing-i18n";

export function FinalCTA() {
  const { lang } = useLandingLang();

  return (
    <section className="relative overflow-hidden border-t border-border/40">
      {/* Ambient glow */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-1/2 h-[500px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#0F4C5C]/[0.07] blur-[120px] dark:bg-[#5BC4D6]/[0.09]" />
      </div>

      <div className="mx-auto max-w-3xl px-8 py-28 text-center">
        {/* Kicker */}
        <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/40 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-muted-foreground backdrop-blur">
          <span className="relative flex size-1.5">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-[#0F4C5C] opacity-60 dark:bg-[#5BC4D6]" />
            <span className="relative inline-flex size-1.5 rounded-full bg-[#0F4C5C] dark:bg-[#5BC4D6]" />
          </span>
          {t.finalCtaKicker[lang]}
        </div>

        {/* Heading */}
        <h2 className="mb-6 text-3xl font-semibold leading-[1.05] tracking-tight text-foreground sm:text-4xl lg:text-[2.75rem]">
          {t.finalCtaHeadingLine1[lang]}{" "}
          <span className="text-[#0F4C5C] dark:text-[#5BC4D6]">
            {t.finalCtaHeadingLine2[lang]}
          </span>
        </h2>

        {/* Subtitle */}
        <p className="mb-10 text-base leading-relaxed text-muted-foreground lg:text-[17px]">
          {t.finalCtaSubtitle[lang]}
        </p>

        {/* CTA */}
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Button
            asChild
            size="lg"
            className="group h-12 bg-[#0F4C5C] px-7 text-base text-white shadow-sm transition-all hover:bg-[#0A3D4A] hover:shadow-md dark:bg-[#5BC4D6] dark:text-[#0A2D34] dark:hover:bg-[#7ED4E4]"
          >
            <Link to="/app">
              {t.openDemo[lang]}
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </Button>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>{t.ctaHelper1[lang]}</span>
            <span className="size-1 rounded-full bg-muted-foreground/30" />
            <span>{t.ctaHelper2[lang]}</span>
          </div>
        </div>
      </div>
    </section>
  );
}
