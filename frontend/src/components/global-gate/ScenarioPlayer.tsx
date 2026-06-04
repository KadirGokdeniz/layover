import { Play, Pause, Square, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type PlaybackState = "idle" | "loading" | "playing" | "paused";

interface Props {
  state: PlaybackState;
  turnIndex: number;
  totalTurns: number;
  scenarioTitle?: string;
  onPlay: () => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  disabled?: boolean;
}

export function ScenarioPlayer({
  state,
  turnIndex,
  totalTurns,
  scenarioTitle,
  onPlay,
  onPause,
  onResume,
  onStop,
  disabled,
}: Props) {
  return (
    <div className="flex items-center gap-3 border-b border-border bg-card px-5 py-2">
      <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        Demo Senaryosu
      </span>

      {state === "idle" && (
        <Button size="sm" onClick={onPlay} disabled={disabled} className="h-8">
          <Play className="h-3.5 w-3.5" />
          <span className="ml-1.5 text-xs font-medium">Senaryoyu Oynat</span>
        </Button>
      )}

      {state === "loading" && (
        <Button size="sm" disabled className="h-8">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          <span className="ml-1.5 text-xs font-medium">Yükleniyor…</span>
        </Button>
      )}

      {state === "playing" && (
        <>
          <Button size="sm" variant="outline" onClick={onPause} className="h-8">
            <Pause className="h-3.5 w-3.5" />
            <span className="ml-1.5 text-xs">Duraklat</span>
          </Button>
          <Button size="sm" variant="outline" onClick={onStop} className="h-8">
            <Square className="h-3.5 w-3.5" />
            <span className="ml-1.5 text-xs">Durdur</span>
          </Button>
        </>
      )}

      {state === "paused" && (
        <>
          <Button size="sm" onClick={onResume} className="h-8">
            <Play className="h-3.5 w-3.5" />
            <span className="ml-1.5 text-xs">Devam Et</span>
          </Button>
          <Button size="sm" variant="outline" onClick={onStop} className="h-8">
            <Square className="h-3.5 w-3.5" />
            <span className="ml-1.5 text-xs">Durdur</span>
          </Button>
        </>
      )}

      {state !== "idle" && state !== "loading" && totalTurns > 0 && (
        <span
          className={cn(
            "ml-auto font-mono text-[11px] font-medium",
            state === "paused" ? "text-amber-500" : "text-primary",
          )}
        >
          {state === "paused" ? "DURAKLATILDI · " : ""}
          Turn {turnIndex + 1}/{totalTurns}
        </span>
      )}

      {scenarioTitle && state !== "idle" && (
        <span className="text-xs italic text-muted-foreground">{scenarioTitle}</span>
      )}
    </div>
  );
}