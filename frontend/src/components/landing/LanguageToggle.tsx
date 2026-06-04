import { useLandingLang } from "@/lib/landing-i18n";

export function LanguageToggle() {
  const { lang, setLang } = useLandingLang();

  return (
    <div className="flex items-center gap-0.5 rounded-md border border-border/60 bg-card/40 p-0.5 text-[11px] font-medium backdrop-blur">
      <button
        onClick={() => setLang("en")}
        className={`rounded px-2 py-1 transition-colors ${
          lang === "en"
            ? "bg-[#0F4C5C] text-white dark:bg-[#5BC4D6] dark:text-[#0A2D34]"
            : "text-muted-foreground hover:text-foreground"
        }`}
        aria-pressed={lang === "en"}
      >
        EN
      </button>
      <button
        onClick={() => setLang("tr")}
        className={`rounded px-2 py-1 transition-colors ${
          lang === "tr"
            ? "bg-[#0F4C5C] text-white dark:bg-[#5BC4D6] dark:text-[#0A2D34]"
            : "text-muted-foreground hover:text-foreground"
        }`}
        aria-pressed={lang === "tr"}
      >
        TR
      </button>
    </div>
  );
}
