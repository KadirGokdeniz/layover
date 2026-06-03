import { cn } from "@/lib/utils";
import type { Context } from "@/lib/types";

export const CONTEXTS: { id: Context; label: string }[] = [
  { id: "boarding", label: "Boarding" },
  { id: "check-in", label: "Check-in" },
  { id: "transfer", label: "Transfer" },
  { id: "security", label: "Security" },
  { id: "passport", label: "Passport" },
];

interface Props {
  value: Context;
  onChange: (c: Context) => void;
}

export function ContextTabs({ value, onChange }: Props) {
  return (
    <div className="border-b border-border bg-card">
      <div className="flex gap-1 px-4">
        {CONTEXTS.map((c) => {
          const active = c.id === value;
          return (
            <button
              key={c.id}
              onClick={() => onChange(c.id)}
              className={cn(
                "relative px-5 py-3 text-sm font-medium uppercase tracking-wider transition-colors",
                active
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {c.label}
              {active && (
                <span className="absolute inset-x-2 bottom-0 h-[3px] bg-primary" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
