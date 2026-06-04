import { Logo } from "@/components/global-gate/Logo";
import { useLandingLang, t } from "@/lib/landing-i18n";

export function Footer() {
  const { lang } = useLandingLang();

  return (
    <footer className="border-t border-border/40">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-8 py-8 sm:flex-row">
        {/* Logo lockup */}
        <div className="flex items-center gap-2">
          <Logo
            variant="mark"
            className="h-6 text-[#0F4C5C] dark:text-[#5BC4D6]"
          />
          <span className="text-base font-semibold tracking-tight text-foreground">
            layover
          </span>
          <span className="ml-1 rounded-md border border-border/60 bg-card/40 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground backdrop-blur">
            {t.preview[lang]}
          </span>
        </div>

        {/* Copyright */}
        <div className="text-[12px] text-muted-foreground">
          {t.footerCopy[lang]}
        </div>
      </div>
    </footer>
  );
}
