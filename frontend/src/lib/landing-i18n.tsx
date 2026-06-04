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
    en: "Voice interpreter built for airline ground operations. Flight codes, gates, and operational data — preserved across every translation, every language.",
    tr: "Havalimanı yer hizmetleri için tasarlanmış sesli tercüman. Uçuş kodları, kapılar ve operasyonel veriler — her çeviride, her dilde korunur.",
  },
  ctaHelper1: { en: "No account needed", tr: "Hesap gerekmiyor" },
  ctaHelper2: { en: "Opens in browser", tr: "Tarayıcıda açılır" },

  // Mock chat labels
  mockStaff: { en: "Staff · TR", tr: "Personel · TR" },
  mockPassenger: { en: "Passenger · IT", tr: "Yolcu · IT" },
  forceLocked: { en: "force-locked", tr: "force-locked" },

  // Features strip — REORDERED: force-lock first, contexts second, voice third
  feature01Title: {
    en: "Force-locked operational data",
    tr: "Force-locked operasyonel veri",
  },
  feature01Desc: {
    en: "Operational data is preserved across every translation — in every condition.",
    tr: "Operasyonel veri her çeviride, her koşulda korunur.",
  },
  feature02Title: {
    en: "Context-aware translation",
    tr: "Bağlam-duyarlı çeviri",
  },
  feature02Desc: {
    en: "Context-aware translation. The scenario is preserved throughout.",
    tr: "Bağlama duyarlı çeviri. Senaryo başından sonuna korunur.",
  },
  feature03Title: {
    en: "Multilingual, voice-enabled",
    tr: "Çok dilli, sesli iletişim",
  },
  feature03Desc: {
    en: "Staff speaks Turkish, passengers hear their own language. Two-way, real-time, microphone-enabled.",
    tr: "Personel Türkçe konuşur, yolcu kendi dilinde duyar. Mikrofon ile çift yönlü, gerçek zamanlı.",
  },

  // ============== Problem section ==============
  problemKicker: { en: "The problem", tr: "Sorun" },
  problemHeading: {
    en: "Generic translation tools weren't built for operations.",
    tr: "Genel çeviri araçları operasyon için yapılmadı.",
  },
  problemBody: {
    en: "Ground operations staff at major airports handle passengers from 20+ nationalities each shift. Turkish and English alone are not enough. Yet generic AI translation tools may change flight codes, invent context that wasn't there, or mistranslate operational vocabulary. Ground operations cannot tolerate this.",
    tr: "Büyük havalimanlarında yer hizmetleri personeli her vardiya 20+ farklı milletten yolcu karşılar. Türkçe ve İngilizce yetmiyor. Üstelik genel yapay zeka çeviri araçları uçuş kodlarını değiştirebilir, olmayan bağlam ekleyebilir veya operasyonel terimleri yanlış çevirebilir. Yer hizmetleri bunu kaldıramaz.",
  },
  consequence1Title: { en: "Missed gates", tr: "Kaçırılan kapılar" },
  consequence1Desc: {
    en: "Passengers don't reach their boarding gate on time.",
    tr: "Yolcular biniş kapısına zamanında ulaşamıyor.",
  },
  consequence2Title: { en: "Wrong seat", tr: "Yanlış koltuk" },
  consequence2Desc: {
    en: "Misunderstandings lead to incorrect seating.",
    tr: "Yanlış anlamalar hatalı oturma düzenine yol açıyor.",
  },
  consequence3Title: {
    en: "Repeated explanations",
    tr: "Tekrarlanan açıklamalar",
  },
  consequence3Desc: {
    en: "Staff explain the same information three or four times.",
    tr: "Personel aynı bilgiyi üç-dört kez açıklıyor.",
  },
  consequence4Title: {
    en: "Declining satisfaction",
    tr: "Düşen memnuniyet",
  },
  consequence4Desc: {
    en: "Customer satisfaction scores trend downward.",
    tr: "Müşteri memnuniyeti skorları düşüyor.",
  },

  // ============== Solution section — REORDERED ==============
  solutionKicker: {
    en: "How Layover works",
    tr: "Layover nasıl çalışır",
  },
  solutionHeading: {
    en: "Built for operational accuracy.",
    tr: "Operasyonel doğruluk için tasarlandı.",
  },
  // Solution 01: Force-lock (was 02)
  solution01Title: {
    en: "Force-locked operational data",
    tr: "Force-locked operasyonel veri",
  },
  solution01Desc: {
    en: "Layover doesn't just translate — it verifies. Every output is checked against the source, and any drift in operational data is corrected automatically.",
    tr: "Layover sadece çevirmez, doğrular. Her çıktı kaynakla karşılaştırılır, operasyonel veride sapma varsa otomatik düzeltilir.",
  },
  // Solution 02: Context-aware (was 03)
  solution02Title: {
    en: "Context-aware translation",
    tr: "Bağlam-duyarlı çeviri",
  },
  solution02Desc: {
    en: "Each scenario carries its own context. Layover knows where the conversation is happening — and adapts the translation accordingly.",
    tr: "Her senaryonun kendi bağlamı vardır. Layover konuşmanın nerede geçtiğini bilir — ve çeviriyi ona göre uyarlar.",
  },
  // Solution 03: Voice + multilingual (was 01)
  solution03Title: {
    en: "Multilingual voice, both directions",
    tr: "Çift yönlü, çok dilli ses",
  },
  solution03Desc: {
    en: "Staff speak Turkish, passengers hear their native language through earpiece or speaker. Voice input is supported too — passengers speak into the microphone and the system translates to Turkish in real-time.",
    tr: "Personel Türkçe konuşur, yolcu kendi dilinde kulaklıktan veya hoparlörden duyar. Sesli giriş de destekleniyor — yolcu mikrofona konuşur, sistem Türkçeye gerçek zamanlı çevirir.",
  },
  solutionContextLabel: {
    en: "Purpose-trained",
    tr: "Özel eğitildi",
  },

  // ============== Final CTA ==============
  finalCtaKicker: {
    en: "Try it now",
    tr: "Hemen dene",
  },
  finalCtaHeadingLine1: {
    en: "See Layover",
    tr: "Layover'ı",
  },
  finalCtaHeadingLine2: {
    en: "at work.",
    tr: "çalışırken gör.",
  },
  finalCtaSubtitle: {
    en: "No account, no setup. The demo opens in your browser — try every scenario, every language.",
    tr: "Hesap yok, kurulum yok. Demo tarayıcıda açılır — her senaryoyu, her dili deneyebilirsin.",
  },

  // ============== Footer ==============
  footerCopy: {
    en: "© 2026 Layover · Built for THY Terminal Accelerator",
    tr: "© 2026 Layover · THY Terminal Accelerator için yapıldı",
  },
};