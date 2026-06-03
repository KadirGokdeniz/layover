import { useCallback, useEffect, useRef, useState } from "react";
import type { Lang } from "./types";
import { API_BASE } from "./api";

export const LANG_LOCALE: Record<Lang, string> = {
  tr: "tr-TR",
  en: "en-US",
  it: "it-IT",
  ar: "ar-SA",
  ru: "ru-RU",
};

export const PROCESSING_LABEL: Record<Lang, string> = {
  tr: "İşleniyor…",
  en: "Processing…",
  it: "Elaborazione…",
  ar: "جارٍ المعالجة…",
  ru: "Обработка…",
};

/** "tr-TR" -> "tr", or "tr" -> "tr" */
function langCode(lang: string): string {
  return lang.split("-")[0];
}

/** Anlık kontrol — SSR'da false döner. Hook içinden değil, ihtiyaç anında. */
export function isSpeechRecognitionSupported(): boolean {
  if (typeof window === "undefined") return false;
  return (
    typeof MediaRecorder !== "undefined" &&
    !!navigator.mediaDevices?.getUserMedia
  );
}

interface UseSpeechRecognitionOptions {
  lang: string;
  onInterim: (text: string) => void;
  onFinal: (text: string) => void;
}

export function useSpeechRecognition({
  lang,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onInterim,
  onFinal,
}: UseSpeechRecognitionOptions) {
  const [listening, setListening] = useState(false);
  const [processing, setProcessing] = useState(false);
  // SSR/CSR uyumlu: ilk render'da false (server ile uyumlu), mount sonrası gerçek değer
  const [supported, setSupported] = useState(false);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const baseTextRef = useRef<string>("");
  const abortRef = useRef<AbortController | null>(null);

  // Mount sonrası tarayıcı yeteneğini set et — hydration mismatch'i bu önler
  useEffect(() => {
    setSupported(isSpeechRecognitionSupported());
  }, []);

  const cleanupStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    recorderRef.current = null;
    chunksRef.current = [];
  }, []);

  const stop = useCallback(() => {
    const recorder = recorderRef.current;
    if (recorder && recorder.state !== "inactive") {
      try {
        recorder.stop();
      } catch {
        // ignore
      }
    }
    setListening(false);
  }, []);

  const start = useCallback(
    async (currentText: string) => {
      if (!isSpeechRecognitionSupported()) return;
      baseTextRef.current = currentText ? currentText.replace(/\s+$/, "") : "";

      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;
        const recorder = new MediaRecorder(stream);
        chunksRef.current = [];

        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) chunksRef.current.push(e.data);
        };

        recorder.onstop = async () => {
          const blob = new Blob(chunksRef.current, { type: "audio/webm" });
          cleanupStream();
          if (blob.size === 0) return;

          setProcessing(true);
          abortRef.current?.abort();
          const ac = new AbortController();
          abortRef.current = ac;

          try {
            const form = new FormData();
            form.append("audio", blob, "recording.webm");
            form.append("lang", langCode(lang));

            const res = await fetch(`${API_BASE}/stt`, {
              method: "POST",
              body: form,
              signal: ac.signal,
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = (await res.json()) as { text: string };
            const transcript = (data.text || "").trim();
            const combined = (baseTextRef.current + " " + transcript)
              .replace(/\s+/g, " ")
              .trim();
            onFinal(combined);
          } catch (err) {
            if ((err as Error).name !== "AbortError") {
              console.warn("STT failed:", err);
              onFinal(baseTextRef.current);
            }
          } finally {
            if (abortRef.current === ac) abortRef.current = null;
            setProcessing(false);
          }
        };

        recorder.onerror = () => {
          setListening(false);
          cleanupStream();
        };

        recorderRef.current = recorder;
        recorder.start();
        setListening(true);
      } catch (err) {
        console.warn("getUserMedia failed:", err);
        setListening(false);
        cleanupStream();
      }
    },
    [lang, onFinal, cleanupStream],
  );

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      cleanupStream();
    };
  }, [cleanupStream]);

  return {
    listening,
    processing,
    start,
    stop,
    supported,
  };
}

// ===== TTS =====

type TTSListener = (id: string | null) => void;
const ttsListeners = new Set<TTSListener>();
let currentSpeakingId: string | null = null;
let currentAudio: HTMLAudioElement | null = null;
let currentAudioUrl: string | null = null;
let currentTtsAbort: AbortController | null = null;

function setSpeaking(id: string | null) {
  currentSpeakingId = id;
  ttsListeners.forEach((l) => l(id));
}

function clearCurrentAudio() {
  if (currentAudio) {
    try {
      currentAudio.pause();
    } catch {
      // ignore
    }
    currentAudio = null;
  }
  if (currentAudioUrl) {
    URL.revokeObjectURL(currentAudioUrl);
    currentAudioUrl = null;
  }
}

function speakBrowserFallback(id: string, text: string, lang: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = lang;
  u.onend = () => {
    if (currentSpeakingId === id) setSpeaking(null);
  };
  u.onerror = () => {
    if (currentSpeakingId === id) setSpeaking(null);
  };
  window.speechSynthesis.speak(u);
}

export function speak(id: string, text: string, lang: string) {
  if (typeof window === "undefined") return;

  if (currentSpeakingId === id) {
    cancelSpeech();
    return;
  }

  cancelSpeech();

  const code = langCode(lang);
  const ac = new AbortController();
  currentTtsAbort = ac;

  setSpeaking(id);

  fetch(`${API_BASE}/tts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, lang: code }),
    signal: ac.signal,
  })
    .then(async (res) => {
      if (currentTtsAbort === ac) currentTtsAbort = null;
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      if (currentSpeakingId !== id) return;
      const url = URL.createObjectURL(blob);
      currentAudioUrl = url;
      const audio = new Audio(url);
      currentAudio = audio;
      const cleanup = () => {
        if (currentSpeakingId === id) {
          clearCurrentAudio();
          setSpeaking(null);
        }
      };
      audio.onended = cleanup;
      audio.onerror = cleanup;
      await audio.play();
    })
    .catch((err) => {
      if (currentTtsAbort === ac) currentTtsAbort = null;
      if ((err as Error).name === "AbortError") return;
      console.warn("TTS /tts failed, falling back to speechSynthesis:", err);
      if (currentSpeakingId === id) {
        speakBrowserFallback(id, text, lang);
      }
    });
}

export function cancelSpeech() {
  if (typeof window === "undefined") return;
  if (currentTtsAbort) {
    try {
      currentTtsAbort.abort();
    } catch {
      // ignore
    }
    currentTtsAbort = null;
  }
  clearCurrentAudio();
  if ("speechSynthesis" in window) {
    try {
      window.speechSynthesis.cancel();
    } catch {
      // ignore
    }
  }
  setSpeaking(null);
}

export function useSpeakingId(): string | null {
  const [id, setId] = useState<string | null>(currentSpeakingId);
  useEffect(() => {
    const l: TTSListener = (v) => setId(v);
    ttsListeners.add(l);
    return () => {
      ttsListeners.delete(l);
    };
  }, []);
  return id;
}

export function isSpeechSynthesisSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}