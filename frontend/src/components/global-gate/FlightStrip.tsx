import { useEffect, useState } from "react";

import { fetchOps } from "@/lib/api";
import type { Context, OpsResponse } from "@/lib/types";

interface FlightStripProps {
  context: Context;
}

const TONE_CLASSES: Record<string, string> = {
  green: "bg-emerald-100 text-emerald-700 ring-emerald-200",
  amber: "bg-amber-100 text-amber-700 ring-amber-200",
  red: "bg-rose-100 text-rose-700 ring-rose-200",
};

export function FlightStrip({ context }: FlightStripProps) {
  const [data, setData] = useState<OpsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [errored, setErrored] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setErrored(false);

    fetchOps(context)
      .then((res) => {
        if (cancelled) return;
        if (res === null) {
          setErrored(true);
        } else {
          setData(res);
        }
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setErrored(true);
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [context]);

  const toneClass =
    TONE_CLASSES[data?.status.tone ?? "green"] ?? TONE_CLASSES.green;

  return (
    <div className="flex items-center gap-6 px-4 py-2.5 border-b border-zinc-200 bg-white">
      {loading && !data ? (
        <div className="flex gap-5 flex-1">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="flex flex-col gap-1.5">
              <div className="h-2.5 w-14 bg-zinc-100 rounded animate-pulse" />
              <div className="h-4 w-20 bg-zinc-200 rounded animate-pulse" />
            </div>
          ))}
        </div>
      ) : errored ? (
        <span className="text-xs text-zinc-400">
          Uçuş verileri yüklenemedi
        </span>
      ) : data ? (
        <>
          <div className="flex items-center gap-5 flex-1 overflow-x-auto">
            {data.fields.map((field, i) => (
              <div key={i} className="flex flex-col shrink-0">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                  {field.label}
                </span>
                <span
                  className={`text-sm text-zinc-900 ${
                    field.mono ? "font-mono" : ""
                  }`}
                >
                  {field.value}
                </span>
              </div>
            ))}
          </div>
          <span
            className={`shrink-0 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ring-1 ${toneClass}`}
          >
            {data.status.label}
          </span>
        </>
      ) : null}
    </div>
  );
}