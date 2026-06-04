import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { Send, Loader2, Mic } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { Message } from "@/lib/types";
import { MessageBubble } from "./MessageBubble";
import { LANG_LOCALE, useSpeechRecognition } from "@/lib/voice";

export interface ChatColumnHandle {
  /** Imperatively set the textarea draft (used by scenario playback typewriter). */
  setDraft: (text: string) => void;
}

interface Props {
  side: "left" | "right";
  title: string;
  subtitle: string;
  rtl?: boolean;
  placeholder: string;
  sendLabel: string;
  messages: Message[];
  /** which sender's column are we on */
  column: "staff" | "passenger";
  pending: boolean;
  onSend: (text: string) => void;
  /** locale used for STT/TTS on this column's input language */
  sttLang: keyof typeof LANG_LOCALE;
  /** locale used for TTS on translated bubbles in this column */
  bubbleTtsLang: string;
  listeningLabel: string;
  processingLabel?: string;
  /** when true, disables manual input (used during scenario playback) */
  inputsLocked?: boolean;
}

export const ChatColumn = forwardRef<ChatColumnHandle, Props>(function ChatColumn(
  {
    side,
    title,
    subtitle,
    rtl,
    placeholder,
    sendLabel,
    messages,
    column,
    pending,
    onSend,
    sttLang,
    bubbleTtsLang,
    listeningLabel,
    processingLabel,
    inputsLocked,
  },
  ref,
) {
  const [draft, setDraft] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useImperativeHandle(ref, () => ({ setDraft }), []);

  const { listening, processing, start, stop, supported } = useSpeechRecognition({
    lang: LANG_LOCALE[sttLang],
    onInterim: (t) => setDraft(t),
    onFinal: (t) => setDraft(t),
  });

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length, pending]);

  const submit = () => {
    const t = draft.trim();
    if (!t || pending || inputsLocked) return;
    if (listening) stop();
    onSend(t);
    setDraft("");
  };

  const onKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  const toggleMic = () => {
    if (processing || inputsLocked) return;
    if (listening) stop();
    else start(draft);
  };

  const inputsDisabled = pending || inputsLocked;
  const micDisabled = pending || processing || inputsLocked;

  // Filter: when this column is the TRANSLATION (destination) side of a message,
  // only render the bubble if the message's translation has been revealed.
  // For the ORIGIN side (m.sender === column), always render.
  const visibleMessages = messages.filter((m) => {
    if (m.sender === column) return true; // origin column: always visible
    return m.translationVisible !== false; // destination column: hide if explicitly false
  });

  return (
    <div className="flex h-full flex-col bg-background">
      <div className="flex items-center justify-between border-b border-border bg-card px-5 py-3">
        <div className="flex flex-col leading-tight" dir={rtl ? "rtl" : "ltr"}>
          <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            {subtitle}
          </span>
          <span className="text-base font-semibold text-foreground">{title}</span>
        </div>
        <span
          className={cn(
            "h-2 w-2 rounded-full",
            column === "staff" ? "bg-primary" : "bg-foreground/40",
          )}
        />
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-5">
        {visibleMessages.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            {column === "staff"
              ? "Konuşma henüz başlamadı"
              : rtl
                ? "لم تبدأ المحادثة بعد"
                : "Conversation not started"}
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {visibleMessages.map((m) => {
              const isMineColumn = m.sender === column;
              const text = column === "staff" ? m.tr : m.foreign;
              const isTranslated = m.sender !== column;
              return (
                <MessageBubble
                  key={m.id + "-" + column}
                  bubbleId={m.id + "-" + column}
                  text={text}
                  variant={isMineColumn ? "sender" : "receiver"}
                  side={isMineColumn ? (side === "left" ? "left" : "right") : (side === "left" ? "left" : "right")}
                  rtl={rtl}
                  forceReport={isTranslated ? m.forceReport : undefined}
                  corrected={isTranslated ? m.corrected : undefined}
                  ttsLang={isTranslated ? bubbleTtsLang : undefined}
                />
              );
            })}
            {pending && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" />
                {column === "staff" ? "çeviriliyor…" : "translating…"}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="border-t border-border bg-card p-4">
        <div className="flex items-end gap-2">
          <div className="relative flex-1">
            <Textarea
              dir={rtl ? "rtl" : "ltr"}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={onKey}
              placeholder={placeholder}
              disabled={inputsDisabled}
              rows={2}
              className="resize-none text-[15px]"
            />
            {listening && (
              <div
                className={cn(
                  "pointer-events-none absolute bottom-2 flex items-center gap-2 text-[11px] font-medium text-destructive",
                  rtl ? "left-3" : "right-3",
                )}
              >
                <span className="flex gap-0.5">
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-destructive [animation-delay:-0.3s]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-destructive [animation-delay:-0.15s]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-destructive" />
                </span>
                <span>{listeningLabel}</span>
              </div>
            )}
            {processing && !listening && (
              <div
                className={cn(
                  "pointer-events-none absolute bottom-2 flex items-center gap-2 text-[11px] font-medium text-muted-foreground",
                  rtl ? "left-3" : "right-3",
                )}
              >
                <Loader2 className="h-3 w-3 animate-spin" />
                <span>{processingLabel ?? "…"}</span>
              </div>
            )}
          </div>
          {supported && (
            <Button
              type="button"
              variant="outline"
              onClick={toggleMic}
              disabled={micDisabled}
              className={cn(
                "h-[60px] px-3",
                listening &&
                  "border-destructive bg-destructive text-destructive-foreground animate-pulse hover:bg-destructive/90",
              )}
              aria-label="Mikrofon"
            >
              {processing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Mic className="h-4 w-4" />
              )}
            </Button>
          )}
          <Button
            onClick={submit}
            disabled={inputsDisabled || !draft.trim()}
            className="h-[60px] px-4"
          >
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            <span className="ml-2 hidden sm:inline">{sendLabel}</span>
          </Button>
        </div>
      </div>
    </div>
  );
});