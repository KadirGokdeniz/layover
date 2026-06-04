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

const STEPS = [
  {
    icon: Play,
    title: "Senaryoyu oynatın",
    desc: "Üstteki ▶ Senaryoyu Oynat butonu ile hazır bir konuşma senaryosunu otomatik canlandırın. Personel ve yolcu arasındaki diyalog adım adım oynanır.",
  },
  {
    icon: Languages,
    title: "Yolcu dilini seçin",
    desc: "Sağ üstten dili değiştirin: İtalyanca, İngilizce, Arapça veya Rusça. Senaryolar seçili dilde oynar.",
  },
  {
    icon: Layers,
    title: "Operasyonel bağlamı seçin",
    desc: "Boarding, Check-in, Transfer, Security, Passport — her bağlam kendi terminolojisi ve prompt mühendisliği ile çalışır.",
  },
  {
    icon: Mic,
    title: "Kendiniz konuşun",
    desc: "Mikrofonla veya yazıyla manuel mesaj gönderin. Force-lock ve bağlam koruması manuel kullanımda da aktiftir.",
  },
];

export function WelcomeModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const seen = localStorage.getItem(WELCOME_KEY);
    if (!seen) {
      // Slight delay so modal feels intentional rather than abrupt
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

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold tracking-tight">
            Layover'a hoş geldiniz
          </DialogTitle>
          <DialogDescription className="text-[15px]">
            Konsolu nasıl kullanacağınızı kısaca gösterelim.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {STEPS.map((step, i) => {
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
            Başlayalım
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
