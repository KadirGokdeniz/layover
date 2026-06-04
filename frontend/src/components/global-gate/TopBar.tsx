import { Volume2 } from "lucide-react";
import type { PassengerLang } from "@/lib/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ThemeToggle } from "./ThemeToggle";
import { Logo } from "./Logo";

export const PASSENGER_LANGS: { code: PassengerLang; label: string }[] = [
  { code: "en", label: "English" },
  { code: "it", label: "Italiano" },
  { code: "ar", label: "العربية" },
  { code: "ru", label: "Русский" },
];

interface Props {
  passengerLang: PassengerLang;
  onChange: (l: PassengerLang) => void;
  theme: "light" | "dark";
  onToggleTheme: () => void;
  autoSpeak: boolean;
  onAutoSpeakChange: (v: boolean) => void;
}

export function TopBar({
  passengerLang,
  onChange,
  theme,
  onToggleTheme,
  autoSpeak,
  onAutoSpeakChange,
}: Props) {
  return (
    <header className="border-b border-border bg-card">
      <div className="flex h-16 items-center justify-between px-6">
        <div className="flex items-center gap-3">
        <Logo 
          variant="mark" 
          className="h-9 text-[#0F4C5C] dark:text-[#5BC4D6]" 
        />
        <div className="flex flex-col leading-tight">
          <span className="text-lg font-semibold tracking-tight text-foreground">
            Layover
          </span>
          <span className="text-[10px] text-muted-foreground tracking-[0.2em]">
            IST · GROUND OPERATIONS CONSOLE
          </span>
        </div>
      </div>
        <div className="flex items-center gap-4">
          <span className="text-xs uppercase tracking-wider text-muted-foreground">
            Yolcu dili
          </span>
          <Select value={passengerLang} onValueChange={(v) => onChange(v as PassengerLang)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PASSENGER_LANGS.map((l) => (
                <SelectItem key={l.code} value={l.code}>
                  {l.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <label className="flex cursor-pointer items-center gap-2 rounded-md border border-border bg-background/40 px-3 py-1.5">
            <Volume2 className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
              Otomatik seslendirme
            </span>
            <Switch checked={autoSpeak} onCheckedChange={onAutoSpeakChange} />
          </label>
          <ThemeToggle theme={theme} onToggle={onToggleTheme} />
        </div>
      </div>
    </header>
  );
}
