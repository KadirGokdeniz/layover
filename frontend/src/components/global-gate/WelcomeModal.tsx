import { useEffect, useState } from "react";
import { Play, Languages, Layers, Mic, ArrowRight } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const WELCOME_KEY = "gg.welcomeSeen";
const LANDING_LANG_KEY = "layover.landingLang";

type Lang = "en" | "tr";

const COPY = {
  en: {
    title: "Welcome to Layover",
    subtitle: "A quick orientation.",
    steps: [
      {
        icon: Play,
        title: "Play a scenario",
        desc: "Watch a pre-built dialogue between staff and passenger play out automatically.",
      },
      {
        icon: Languages,
        title: "Choose the passenger's language",
        desc: "Switch from the top right.",
      },
      {
        icon: Layers,
        title: "Pick a context",
        desc: "Each operational scenario translates with its own behavior.",
      },
      {
        icon: Mic,
        title: "Use it yourself",
        desc: "Microphone or keyboard — translation works manually too.",
      },
    ],
    cta: "Get started",
  },
  tr: {
    title: "Layover'a hoş geldiniz",
    subtitle: "Hızlı bir tanıtım.",
    steps: [
      {
        icon: Play,
        title: "Senaryoyu oynatın",
        desc: "Hazır bir diyaloğun otomatik oynamasını izleyin.",
      },
      {
        icon: Languages,
        title: "Yolcu dilini seçin",
        desc: "Sağ üstten değiştirin.",
      },
      {
        icon: Layers,
        title: "Bağlam seçin",
        desc: "Her operasyonel senaryonun kendi çeviri davranışı var.",
      },
      {
        icon: Mic,
        title: "Kendiniz kullanın",
        desc: "Mikrofon veya klavye — çeviri manuel olarak da çalışır.",
      },
    ],
    cta: "Başlayalım",
  },
} as const;

export function WelcomeModal() {
  const [open, setOpen] = useState(false);
  const [lang, setLang] = useState<Lang>("en");

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Respect landing page language selection
    const storedLang = localStorage.getItem(LANDING_LANG_KEY);
    if (storedLang === "tr") setLang("tr");

    // Show modal on first visit
    const seen = localStorage.getItem(WELCOME_KEY);
    if (!seen) {
      const t = setTimeout(() => setOpen(true), 400);
      return () => clearTimeout(t);
    }
  }, []);

  const handleClose = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem(WELCOME_KEY, "1");
    }
    setOpen(false);
  };

  const copy = COPY[lang];

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold tracking-tight">
            {copy.title}
          </DialogTitle>
          <DialogDescription className="text-[15px]">
            {copy.subtitle}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {copy.steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <div key={i} className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-medium text-primary">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <div className="text-sm font-semibold text-foreground">
                      {step.title}
                    </div>
                  </div>
                  <div className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    {step.desc}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <DialogFooter>
          <Button onClick={handleClose} size="lg" className="group">
            {copy.cta}
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}