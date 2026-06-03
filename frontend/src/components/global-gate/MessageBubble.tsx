import { useEffect, useState } from "react";
import { Lock, ChevronDown, CheckCircle2, Volume2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ForceReportItem } from "@/lib/types";
import { isSpeechSynthesisSupported, speak, useSpeakingId } from "@/lib/voice";

interface Props {
  bubbleId: string;
  text: string;
  variant: "sender" | "receiver";
  side: "left" | "right";
  rtl?: boolean;
  forceReport?: ForceReportItem[];
  corrected?: boolean;
  /** when provided, this bubble is a translated/received bubble and can be spoken */
  ttsLang?: string;
  /** speak automatically once on mount */
  autoSpeak?: boolean;
}

export function MessageBubble({
  bubbleId,
  text,
  variant,
  side,
  rtl,
  forceReport,
  corrected,
  ttsLang,
  autoSpeak,
}: Props) {
  const [open, setOpen] = useState(false);
  const hasReport = !!forceReport && forceReport.length > 0;
  const speakingId = useSpeakingId();
  const isSpeaking = speakingId === bubbleId;
  const canSpeak = !!ttsLang && isSpeechSynthesisSupported();

  useEffect(() => {
    if (autoSpeak && canSpeak && ttsLang) {
      speak(bubbleId, text, ttsLang);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={cn("flex w-full", side === "right" ? "justify-end" : "justify-start")}>
      <div className={cn("flex max-w-[88%] flex-col gap-1", side === "right" ? "items-end" : "items-start")}>
        <div className="relative group">
          <div
            dir={rtl ? "rtl" : "ltr"}
            className={cn(
              "rounded-lg px-4 py-3 text-[15px] leading-relaxed shadow-sm",
              variant === "sender"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-foreground border border-border",
              canSpeak && "pr-10",
            )}
          >
            {text}
          </div>
          {canSpeak && (
            <button
              type="button"
              onClick={() => speak(bubbleId, text, ttsLang!)}
              className={cn(
                "absolute bottom-1.5 right-1.5 inline-flex h-7 w-7 items-center justify-center rounded-md text-foreground/60 transition-all hover:bg-background/60 hover:text-foreground",
                isSpeaking ? "opacity-100 text-primary" : "opacity-40 group-hover:opacity-100",
              )}
              aria-label="Sesli oynat"
            >
              <Volume2 className={cn("h-3.5 w-3.5", isSpeaking && "animate-pulse")} />
            </button>
          )}
        </div>

        {isSpeaking && (
          <div className={cn("flex w-full", side === "right" ? "justify-end" : "justify-start")}>
            <div className="flex h-1 w-24 items-center gap-0.5 overflow-hidden">
              <span className="h-1 flex-1 animate-pulse rounded-full bg-primary [animation-delay:-0.4s]" />
              <span className="h-1 flex-1 animate-pulse rounded-full bg-primary [animation-delay:-0.2s]" />
              <span className="h-1 flex-1 animate-pulse rounded-full bg-primary" />
              <span className="h-1 flex-1 animate-pulse rounded-full bg-primary [animation-delay:-0.3s]" />
            </div>
          </div>
        )}

        {(hasReport || corrected) && (
          <div className={cn("flex flex-wrap items-center gap-2", side === "right" ? "justify-end" : "justify-start")}>
            {hasReport && (
              <button
                onClick={() => setOpen((o) => !o)}
                className="inline-flex items-center gap-1.5 rounded-md border border-primary/30 bg-accent px-2 py-1 text-[11px] font-medium text-accent-foreground transition-colors hover:bg-primary/10"
              >
                <Lock className="h-3 w-3" />
                Doğrulandı
                <ChevronDown className={cn("h-3 w-3 transition-transform", open && "rotate-180")} />
              </button>
            )}
            {corrected && (
              <span className="text-[11px] italic text-muted-foreground">düzeltildi</span>
            )}
          </div>
        )}

        {hasReport && open && (
          <div className="mt-1 w-full rounded-md border border-border bg-card p-3 text-xs shadow-sm">
            <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Kilitli terimler
            </div>
            <ul className="space-y-2">
              {forceReport!.map((item, i) => (
                <li key={i} className="flex flex-col gap-0.5 border-l-2 border-primary/40 pl-2">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-foreground">{item.label}</span>
                    <span className="text-muted-foreground">→</span>
                    <span className="font-mono text-foreground">{item.expected}</span>
                    {item.fixed && <CheckCircle2 className="h-3 w-3 text-primary" />}
                  </div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    {item.kind} · {item.method}
                  </div>
                  {item.detail && (
                    <div className="text-[11px] text-muted-foreground">{item.detail}</div>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
