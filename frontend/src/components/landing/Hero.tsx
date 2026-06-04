import { Link } from "@tanstack/react-router";
import { ArrowRight, Languages, Lock, Layers } from "lucide-react";
import { Logo } from "@/components/global-gate/Logo";
import { Button } from "@/components/ui/button";
import { useLandingLang, t } from "@/lib/landing-i18n";
import { LanguageToggle } from "@/components/landing/LanguageToggle";

export function Hero() {
  const { lang } = useLandingLang();

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Ambient glow */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-40 left-1/2 h-[800px] w-[800px] -translate-x-1/2 rounded-full bg-[#0F4C5C]/[0.06] blur-[120px] dark:bg-[#5BC4D6]/[0.08]" />
      </div>

      {/* Top nav */}
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-8 py-5">
        <Link
          to="/"
          className="flex items-center gap-2.5 transition-opacity hover:opacity-80"
        >
          <Logo
            variant="mark"
            className="h-8 text-[#0F4C5C] dark:text-[#5BC4D6]"
          />
          <span className="text-xl font-semibold tracking-tight text-foreground">
            layover
          </span>
          <span className="ml-1 hidden rounded-md border border-border/60 bg-card/40 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground backdrop-blur sm:inline">
            {t.preview[lang]}
          </span>
        </Link>
        <div className="flex items-center gap-3">
          <LanguageToggle />
          <Button
            asChild
            size="sm"
            className="bg-[#0F4C5C] text-white shadow-sm hover:bg-[#0A3D4A] dark:bg-[#5BC4D6] dark:text-[#0A2D34] dark:hover:bg-[#7ED4E4]"
          >
            <Link to="/app">
              {t.openDemo[lang]}
              <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
      </nav>

      {/* Hero section */}
      <div className="mx-auto max-w-6xl px-8 pb-20 pt-6 lg:pt-12">
        <div className="grid items-center gap-12 lg:grid-cols-[1fr_1.1fr] lg:gap-16">
          {/* Left: content */}
          <div>
            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/40 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-muted-foreground backdrop-blur">
              <span className="relative flex size-1.5">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-[#0F4C5C] opacity-60 dark:bg-[#5BC4D6]" />
                <span className="relative inline-flex size-1.5 rounded-full bg-[#0F4C5C] dark:bg-[#5BC4D6]" />
              </span>
              {t.kicker[lang]}
            </div>

            <h1 className="mb-6 text-4xl font-semibold leading-[1.02] tracking-tight text-foreground sm:text-5xl lg:text-[3.5rem]">
              {t.headlineLine1[lang]}
              <br />
              <span className="text-[#0F4C5C] dark:text-[#5BC4D6]">
                {t.headlineLine2[lang]}
              </span>
            </h1>

            <p className="mb-10 max-w-lg text-base leading-relaxed text-muted-foreground lg:text-[17px]">
              {t.subtitle[lang]}
            </p>

            <div className="flex flex-wrap items-center gap-4">
              <Button
                asChild
                size="lg"
                className="group h-12 bg-[#0F4C5C] px-6 text-base text-white shadow-sm transition-all hover:bg-[#0A3D4A] hover:shadow-md dark:bg-[#5BC4D6] dark:text-[#0A2D34] dark:hover:bg-[#7ED4E4]"
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

          {/* Right: product visual */}
          <div className="relative">
            <div className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-2xl shadow-[#0F4C5C]/10 ring-1 ring-black/5 dark:shadow-black/50 dark:ring-white/5">
              <div className="flex items-center gap-1.5 border-b border-border bg-muted/30 px-4 py-3">
                <div className="size-2.5 rounded-full bg-red-400/60" />
                <div className="size-2.5 rounded-full bg-yellow-400/60" />
                <div className="size-2.5 rounded-full bg-green-400/60" />
                <div className="ml-3 font-mono text-[11px] tracking-wider text-muted-foreground">
                  BOARDING · TK1924 · GATE 22 · 18:45
                </div>
              </div>

              <div className="grid grid-cols-2 divide-x divide-border">
                <div className="space-y-3 p-5">
                  <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
                    <span className="size-1 rounded-full bg-[#0F4C5C] dark:bg-[#5BC4D6]" />
                    {t.mockStaff[lang]}
                  </div>
                  <div className="rounded-xl bg-[#0F4C5C]/10 px-3.5 py-2.5 text-sm leading-relaxed text-foreground dark:bg-[#5BC4D6]/10">
                    Uçağınız <span className="font-semibold">TK1924</span> saat{" "}
                    <span className="font-semibold">18:45</span>'te{" "}
                    <span className="font-semibold">22</span> numaralı kapıdan
                    kalkacak.
                  </div>
                  <div className="rounded-xl bg-muted/30 px-3.5 py-2.5 text-xs leading-relaxed text-muted-foreground">
                    Il suo volo <span className="font-semibold">TK1924</span>{" "}
                    partirà alle <span className="font-semibold">18:45</span> dal
                    gate <span className="font-semibold">22</span>.
                  </div>
                </div>

                <div className="space-y-3 p-5">
                  <div className="flex items-center justify-end gap-1.5 text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
                    {t.mockPassenger[lang]}
                    <span className="size-1 rounded-full bg-[#0F4C5C] dark:bg-[#5BC4D6]" />
                  </div>
                  <div className="rounded-xl bg-[#0F4C5C]/10 px-3.5 py-2.5 text-sm leading-relaxed text-foreground dark:bg-[#5BC4D6]/10">
                    Grazie, dov'è il gate{" "}
                    <span className="font-semibold">22</span>?
                  </div>
                  <div className="rounded-xl bg-muted/30 px-3.5 py-2.5 text-xs leading-relaxed text-muted-foreground">
                    Teşekkürler, <span className="font-semibold">22</span>{" "}
                    numaralı kapı nerede?
                  </div>
                </div>
              </div>

              <div className="border-t border-border bg-muted/20 px-5 py-3">
                <div className="flex items-center gap-2 font-mono text-[11px] tracking-wider text-muted-foreground">
                  <span className="relative flex size-2">
                    <span className="absolute inline-flex size-full animate-ping rounded-full bg-green-400 opacity-60" />
                    <span className="relative inline-flex size-2 rounded-full bg-green-500" />
                  </span>
                  <span>
                    <span className="font-semibold text-foreground">
                      TK1924
                    </span>
                    , <span className="font-semibold text-foreground">22</span>,{" "}
                    <span className="font-semibold text-foreground">18:45</span>{" "}
                    {t.forceLocked[lang]}
                  </span>
                </div>
              </div>
            </div>

            {/* Decorative gradient lines */}
            <div className="absolute -bottom-2 left-8 right-8 h-px bg-gradient-to-r from-transparent via-[#0F4C5C]/30 to-transparent dark:via-[#5BC4D6]/30" />
            <div className="absolute -bottom-4 left-16 right-16 h-px bg-gradient-to-r from-transparent via-[#0F4C5C]/15 to-transparent dark:via-[#5BC4D6]/15" />
            <div className="absolute -bottom-6 left-24 right-24 h-px bg-gradient-to-r from-transparent via-[#0F4C5C]/[0.07] to-transparent dark:via-[#5BC4D6]/[0.07]" />
          </div>
        </div>
      </div>

      {/* Numbered features strip */}
      <div className="mx-auto max-w-6xl border-t border-border/40 px-8 py-16">
        <div className="grid gap-12 sm:grid-cols-3 sm:gap-8 lg:gap-12">
          <div>
            <div className="mb-5 flex items-center gap-3">
              <div className="font-mono text-xs font-medium text-[#0F4C5C] dark:text-[#5BC4D6]">
                01
              </div>
              <div className="h-px flex-1 bg-border/40" />
              <Languages className="size-4 text-muted-foreground" />
            </div>
            <div className="mb-2 text-[15px] font-medium text-foreground">
              {t.feature01Title[lang]}
            </div>
            <div className="text-sm leading-relaxed text-muted-foreground">
              {t.feature01Desc[lang]}
            </div>
          </div>

          <div>
            <div className="mb-5 flex items-center gap-3">
              <div className="font-mono text-xs font-medium text-[#0F4C5C] dark:text-[#5BC4D6]">
                02
              </div>
              <div className="h-px flex-1 bg-border/40" />
              <Lock className="size-4 text-muted-foreground" />
            </div>
            <div className="mb-2 text-[15px] font-medium text-foreground">
              {t.feature02Title[lang]}
            </div>
            <div className="text-sm leading-relaxed text-muted-foreground">
              {t.feature02Desc[lang]}
            </div>
          </div>

          <div>
            <div className="mb-5 flex items-center gap-3">
              <div className="font-mono text-xs font-medium text-[#0F4C5C] dark:text-[#5BC4D6]">
                03
              </div>
              <div className="h-px flex-1 bg-border/40" />
              <Layers className="size-4 text-muted-foreground" />
            </div>
            <div className="mb-2 text-[15px] font-medium text-foreground">
              {t.feature03Title[lang]}
            </div>
            <div className="text-sm leading-relaxed text-muted-foreground">
              {t.feature03Desc[lang]}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}