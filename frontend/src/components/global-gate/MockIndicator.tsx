import { useEffect, useState } from "react";
import { isMockActive, subscribeMock } from "@/lib/api";
import { WifiOff } from "lucide-react";

export function MockIndicator() {
  const [active, setActive] = useState(isMockActive());
  useEffect(() => {
    const unsub = subscribeMock(setActive);
    return () => {
      unsub();
    };
  }, []);
  if (!active) return null;
  return (
    <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-md border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground shadow-md">
      <WifiOff className="h-3 w-3" />
      mock mode
    </div>
  );
}
