import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

export type LandingLang = "en" | "tr";

const STORAGE_KEY = "layover.landingLang";
const DEFAULT_LANG: LandingLang = "en";

type Ctx = {
  lang: LandingLang;
  setLang: (l: LandingLang) => void;
};

const LandingLangContext = createContext<Ctx>({
  lang: DEFAULT_LANG,
  setLang: () => {},
});

export function LandingLangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<LandingLang>(DEFAULT_LANG);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "en" || stored === "tr") {
      setLangState(stored);
    }
  }, []);

  const setLang = (l: LandingLang) => {
    setLangState(l);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, l);
    }
  };

  return (
    <LandingLangContext.Provider value={{ lang, setLang }}>
      {children}
    </LandingLangContext.Provider>
  );
}

export function useLandingLang() {
  return useContext(LandingLangContext);
}

// ============== Translations ==============

export const t = {
  // Nav
  preview: { en: "Preview", tr: "Preview" },
  openDemo: { en: "Open demo", tr: "Demo'yu aç" },

  // Hero
  kicker: {
    en: "Built for ground operations",
    tr: "Yer operasyonları için tasarlandı",
  },
  headlineLine1: {
    en: "Staff and passengers,",
    tr: "Personel ile yolcu,",
  },
  headlineLine2: {
    en: "speaking the same language.",
    tr: "aynı dili konuşur.",
  },
  subtitle: {
    en: "Multilingual voice interpreter for airline ground handling. Flight codes, gates, and seat numbers preserved in real-time translation.",
    tr: "Havalimanı yer hizmetleri için çok dilli sesli tercüman. Uçuş kodları, kapı ve koltuk bilgileri değişmeden, gerçek zamanlı.",
  },
  ctaHelper1: { en: "No account needed", tr: "Hesap gerekmiyor" },
  ctaHelper2: { en: "Opens in browser", tr: "Tarayıcıda açılır" },

  // Mock chat labels
  mockStaff: { en: "Staff · TR", tr: "Personel · TR" },
  mockPassenger: { en: "Passenger · IT", tr: "Yolcu · IT" },
  forceLocked: { en: "force-locked", tr: "force-locked" },

  // Features
  feature01Title: {
    en: "Multilingual, voice-enabled",
    tr: "Çok dilli, sesli iletişim",
  },
  feature01Desc: {
    en: "Staff speaks Turkish, passengers hear their own language. Two-way, real-time, microphone-enabled.",
    tr: "Personel Türkçe konuşur, yolcu kendi dilinde duyar. Mikrofon ile çift yönlü, gerçek zamanlı.",
  },
  feature02Title: {
    en: "Force-locked flight data",
    tr: "Force-locked uçuş bilgileri",
  },
  feature02Desc: {
    en: "Flight codes, gates, seat numbers, and boarding times never change in translation. Cannot make mistakes.",
    tr: "Uçuş kodları, kapı, koltuk ve biniş saatleri çeviride asla değişmez. Hata yapamaz.",
  },
  feature03Title: {
    en: "5 operational contexts",
    tr: "5 operasyonel bağlam",
  },
  feature03Desc: {
    en: "Boarding, check-in, transfer, security, passport — purpose-trained per scenario.",
    tr: "Boarding, check-in, transfer, security, passport — her senaryo için ayrı eğitilmiş.",
  },
};
