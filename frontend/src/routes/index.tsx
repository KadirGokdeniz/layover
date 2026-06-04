import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { TopBar, PASSENGER_LANGS } from "@/components/global-gate/TopBar";
import { ContextTabs } from "@/components/global-gate/ContextTabs";
import { FlightStrip } from "@/components/global-gate/FlightStrip";
import { ChatColumn, type ChatColumnHandle } from "@/components/global-gate/ChatColumn";
import { MockIndicator } from "@/components/global-gate/MockIndicator";
import { ScenarioPlayer, type PlaybackState } from "@/components/global-gate/ScenarioPlayer";
import { fetchScenario, translate } from "@/lib/api";
import { cancelSpeech, LANG_LOCALE, speak, useSpeakingId } from "@/lib/voice";
import type { Context, Message, PassengerLang, ScenarioTurn } from "@/lib/types";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Layover · IST Ground Operations Console" },
      {
        name: "description",
        content:
          "Real-time multilingual translation console for airline ground staff at Istanbul Airport.",
      },
      { property: "og:title", content: "Layover · IST Ground Operations Console" },
      {
        property: "og:description",
        content:
          "Real-time multilingual translation console for airline ground staff at Istanbul Airport.",
      },
    ],
  }),
  component: GlobalGate,
});

const PLACEHOLDERS: Record<PassengerLang, string> = {
  en: "Type a message…",
  it: "Scrivi un messaggio…",
  ar: "اكتب رسالة…",
  ru: "Введите сообщение…",
};

const SEND_LABEL: Record<PassengerLang, string> = {
  en: "Send",
  it: "Invia",
  ar: "إرسال",
  ru: "Отправить",
};

const LISTENING_LABEL: Record<PassengerLang, string> = {
  en: "Listening…",
  it: "In ascolto…",
  ar: "جارٍ الاستماع…",
  ru: "Слушаю…",
};

const PROCESSING_PASSENGER: Record<PassengerLang, string> = {
  en: "Processing…",
  it: "Elaborazione…",
  ar: "جارٍ المعالجة…",
  ru: "Обработка…",
};

const AUTOSPEAK_KEY = "gg.autoSpeak";

// ===== Scenario playback timing =====
const TYPEWRITER_MS_PER_CHAR = 30;
const POST_TYPEWRITER_PAUSE_MS = 250;
const POST_TTS_BREATH_MS = 800;
const ORIGINAL_TO_TRANSLATION_PAUSE_MS = 350;
const TTS_WAIT_DELAY_MS = 200;
const TTS_MAX_WAIT_MS = 25000;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function GlobalGate() {
  // ===== Defaults =====
  const [passengerLang, setPassengerLang] = useState<PassengerLang>("it");
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [autoSpeak, setAutoSpeak] = useState<boolean>(true);
  // ====================
  const [context, setContext] = useState<Context>("boarding");
  const [messages, setMessages] = useState<Message[]>([]);
  const [pending, setPending] = useState(false);
  const lastSpokenId = useRef<string | null>(null);

  // Latest messages mirror — read inside async playback loop
  const messagesRef = useRef<Message[]>(messages);
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  // ===== Scenario playback state =====
  const [playbackState, setPlaybackState] = useState<PlaybackState>("idle");
  const [currentTurnIndex, setCurrentTurnIndex] = useState(0);
  const [totalTurns, setTotalTurns] = useState(0);
  const [scenarioTitle, setScenarioTitle] = useState<string | undefined>(undefined);
  const playbackRef = useRef<{ stopped: boolean; paused: boolean; active: boolean }>({
    stopped: false,
    paused: false,
    active: false,
  });
  const staffColumnRef = useRef<ChatColumnHandle>(null);
  const passengerColumnRef = useRef<ChatColumnHandle>(null);

  // Mirror speakingId state for async loop
  const speakingIdLive = useSpeakingId();
  const speakingIdRef = useRef<string | null>(speakingIdLive);
  useEffect(() => {
    speakingIdRef.current = speakingIdLive;
  }, [speakingIdLive]);

  useEffect(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem(AUTOSPEAK_KEY) : null;
    if (stored != null) setAutoSpeak(stored === "1");
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") localStorage.setItem(AUTOSPEAK_KEY, autoSpeak ? "1" : "0");
  }, [autoSpeak]);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") root.classList.add("dark");
    else root.classList.remove("dark");
  }, [theme]);

  const rtl = passengerLang === "ar";
  const passengerLabel = useMemo(
    () => PASSENGER_LANGS.find((l) => l.code === passengerLang)?.label ?? "",
    [passengerLang],
  );

  const visible = messages.filter((m) => m.context === context && m.langForeign === passengerLang);

  // Auto-speak (MANUAL mode only): speaks the TRANSLATION for the latest message.
  // Disabled during scenario playback so the playback engine controls speech order.
  useEffect(() => {
    if (!autoSpeak || messages.length === 0) return;
    if (playbackRef.current.active) return; // scenario engine handles it
    const last = messages[messages.length - 1];
    if (lastSpokenId.current === last.id) return;
    lastSpokenId.current = last.id;
    if (last.sender === "staff") {
      speak(last.id + "-passenger", last.foreign, LANG_LOCALE[last.langForeign]);
    } else {
      speak(last.id + "-staff", last.tr, LANG_LOCALE.tr);
    }
  }, [messages, autoSpeak]);

  const send = useCallback(
    async (
      sender: "staff" | "passenger",
      text: string,
      langOverride?: PassengerLang,
      contextOverride?: Context,
    ) => {
      const lang = langOverride ?? passengerLang;
      const ctx = contextOverride ?? context;
      setPending(true);
      try {
        if (sender === "staff") {
          const res = await translate({
            source_text: text,
            source_lang: "tr",
            target_lang: lang,
            context: ctx,
          });
          setMessages((prev) => [
            ...prev,
            {
              id: crypto.randomUUID(),
              sender: "staff",
              tr: text,
              foreign: res.translation,
              langForeign: lang,
              forceReport: res.force_report,
              corrected: res.raw_llm_output !== res.translation,
              context: ctx,
            },
          ]);
        } else {
          const res = await translate({
            source_text: text,
            source_lang: lang,
            target_lang: "tr",
            context: ctx,
          });
          setMessages((prev) => [
            ...prev,
            {
              id: crypto.randomUUID(),
              sender: "passenger",
              tr: res.translation,
              foreign: text,
              langForeign: lang,
              forceReport: res.force_report,
              corrected: res.raw_llm_output !== res.translation,
              context: ctx,
            },
          ]);
        }
      } finally {
        setPending(false);
      }
    },
    [context, passengerLang],
  );

  // ===== Playback helpers =====
  const typewriter = useCallback(
    async (colRef: React.RefObject<ChatColumnHandle | null>, text: string) => {
      colRef.current?.setDraft("");
      for (let i = 1; i <= text.length; i++) {
        if (playbackRef.current.stopped) return;
        while (playbackRef.current.paused && !playbackRef.current.stopped) {
          await sleep(120);
        }
        if (playbackRef.current.stopped) return;
        colRef.current?.setDraft(text.slice(0, i));
        await sleep(TYPEWRITER_MS_PER_CHAR);
      }
      await sleep(POST_TYPEWRITER_PAUSE_MS);
    },
    [],
  );

  /** Trigger speak() for a specific bubbleId and wait until its audio finishes. */
  const speakAndWait = useCallback(
    async (bubbleId: string, text: string, lang: string) => {
      if (playbackRef.current.stopped) return;
      speak(bubbleId, text, lang);
      await sleep(TTS_WAIT_DELAY_MS); // let setSpeaking propagate
      const startedAt = Date.now();
      // Wait until either the current speaker changes (audio ended) or we time out
      while (
        speakingIdRef.current === bubbleId &&
        !playbackRef.current.stopped &&
        Date.now() - startedAt < TTS_MAX_WAIT_MS
      ) {
        await sleep(100);
      }
    },
    [],
  );

  const startPlayback = useCallback(async () => {
    setPlaybackState("loading");
    const scenario = await fetchScenario(context);
    if (!scenario) {
      setPlaybackState("idle");
      console.warn("Scenario not loaded for context", context);
      return;
    }

    let activeLang: PassengerLang = passengerLang;
    if (!scenario.variants[activeLang]) {
      const fallback = (scenario.languages_demoed[0] as PassengerLang) ?? "en";
      activeLang = fallback;
      setPassengerLang(fallback);
    }
    const variant = scenario.variants[activeLang];
    if (!variant) {
      setPlaybackState("idle");
      return;
    }

    // Filter out "system" turns (those are pre-baked translations; we use real backend)
    const turns: ScenarioTurn[] = variant.turns.filter(
      (t) => t.speaker === "passenger" || t.speaker === "staff",
    );

    const ctx = context;
    setAutoSpeak(true);

    setScenarioTitle(scenario.title?.tr ?? scenario.id);
    setTotalTurns(turns.length);
    setCurrentTurnIndex(0);
    setMessages((prev) => prev.filter((m) => m.context !== ctx));
    playbackRef.current = { stopped: false, paused: false, active: true };
    setPlaybackState("playing");

    await sleep(120);

    for (let i = 0; i < turns.length; i++) {
      if (playbackRef.current.stopped) break;
      while (playbackRef.current.paused && !playbackRef.current.stopped) {
        await sleep(150);
      }
      if (playbackRef.current.stopped) break;

      setCurrentTurnIndex(i);
      const turn = turns[i];
      const colRef = turn.speaker === "staff" ? staffColumnRef : passengerColumnRef;

      // 1) Typewriter into the appropriate input
      await typewriter(colRef, turn.text);
      if (playbackRef.current.stopped) break;

      // 2) Submit through real backend → bubble + translation arrive
      await send(turn.speaker, turn.text, activeLang, ctx);
      colRef.current?.setDraft("");
      if (playbackRef.current.stopped) break;

      // Pause check after send
      while (playbackRef.current.paused && !playbackRef.current.stopped) {
        await sleep(150);
      }
      if (playbackRef.current.stopped) break;

      // 3) Read the latest message and speak ORIGINAL → then TRANSLATION
      await sleep(150); // let setMessages settle
      const msgs = messagesRef.current;
      const lastMsg = msgs[msgs.length - 1];
      if (!lastMsg) continue;

      // Bubble ids: original = speaker's column; translation = the other column
      let origBubbleId: string;
      let origText: string;
      let origLang: string;
      let transBubbleId: string;
      let transText: string;
      let transLang: string;

      if (turn.speaker === "passenger") {
        // Passenger spoke in their language; translation is TR
        origBubbleId = lastMsg.id + "-passenger";
        origText = lastMsg.foreign;
        origLang = LANG_LOCALE[lastMsg.langForeign];
        transBubbleId = lastMsg.id + "-staff";
        transText = lastMsg.tr;
        transLang = LANG_LOCALE.tr;
      } else {
        // Staff spoke in TR; translation is in passenger lang
        origBubbleId = lastMsg.id + "-staff";
        origText = lastMsg.tr;
        origLang = LANG_LOCALE.tr;
        transBubbleId = lastMsg.id + "-passenger";
        transText = lastMsg.foreign;
        transLang = LANG_LOCALE[lastMsg.langForeign];
      }

      // Speak ORIGINAL
      await speakAndWait(origBubbleId, origText, origLang);
      if (playbackRef.current.stopped) break;

      // Pause check between original and translation
      while (playbackRef.current.paused && !playbackRef.current.stopped) {
        await sleep(150);
      }
      if (playbackRef.current.stopped) break;

      // Small pause between original and interpreter
      await sleep(ORIGINAL_TO_TRANSLATION_PAUSE_MS);

      // Speak TRANSLATION
      await speakAndWait(transBubbleId, transText, transLang);
      if (playbackRef.current.stopped) break;

      // Breath before next turn
      await sleep(POST_TTS_BREATH_MS);
    }

    playbackRef.current.active = false;
    setPlaybackState("idle");
    setCurrentTurnIndex(0);
  }, [context, passengerLang, send, typewriter, speakAndWait]);

  const onPause = useCallback(() => {
    playbackRef.current.paused = true;
    setPlaybackState("paused");
  }, []);

  const onResume = useCallback(() => {
    playbackRef.current.paused = false;
    setPlaybackState("playing");
  }, []);

  const onStop = useCallback(() => {
    playbackRef.current.stopped = true;
    playbackRef.current.paused = false;
    playbackRef.current.active = false;
    cancelSpeech();
    staffColumnRef.current?.setDraft("");
    passengerColumnRef.current?.setDraft("");
    setPlaybackState("idle");
    setCurrentTurnIndex(0);
  }, []);

  const inputsLocked = playbackState === "playing" || playbackState === "paused";

  return (
    <div className="flex h-screen flex-col bg-background text-foreground">
      <TopBar
        passengerLang={passengerLang}
        onChange={setPassengerLang}
        theme={theme}
        onToggleTheme={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
        autoSpeak={autoSpeak}
        onAutoSpeakChange={setAutoSpeak}
      />
      <ContextTabs value={context} onChange={setContext} />
      <ScenarioPlayer
        state={playbackState}
        turnIndex={currentTurnIndex}
        totalTurns={totalTurns}
        scenarioTitle={scenarioTitle}
        onPlay={startPlayback}
        onPause={onPause}
        onResume={onResume}
        onStop={onStop}
      />
      <FlightStrip context={context} />

      <main className="grid flex-1 grid-cols-2 divide-x divide-border overflow-hidden">
        <ChatColumn
          ref={staffColumnRef}
          side="left"
          column="staff"
          title="Yer Hizmetleri"
          subtitle="Staff · Türkçe (TR)"
          placeholder="Mesaj yazın…"
          sendLabel="Gönder"
          messages={visible}
          pending={pending}
          onSend={(t) => send("staff", t)}
          sttLang="tr"
          bubbleTtsLang={LANG_LOCALE.tr}
          listeningLabel="Dinleniyor…"
          processingLabel="İşleniyor…"
          inputsLocked={inputsLocked}
        />
        <ChatColumn
          ref={passengerColumnRef}
          side="right"
          column="passenger"
          title={passengerLabel}
          subtitle={`Passenger · ${passengerLang.toUpperCase()}`}
          rtl={rtl}
          placeholder={PLACEHOLDERS[passengerLang]}
          sendLabel={SEND_LABEL[passengerLang]}
          messages={visible}
          pending={pending}
          onSend={(t) => send("passenger", t)}
          sttLang={passengerLang}
          bubbleTtsLang={LANG_LOCALE[passengerLang]}
          listeningLabel={LISTENING_LABEL[passengerLang]}
          processingLabel={PROCESSING_PASSENGER[passengerLang]}
          inputsLocked={inputsLocked}
        />
      </main>

      <MockIndicator />
    </div>
  );
}