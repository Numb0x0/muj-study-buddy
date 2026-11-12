"use client";

import * as React from "react";
import { Bell, Pause, Play, RotateCcw, SkipForward, Timer } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { StatTile, ToolCard } from "./ToolCard";
import { usePersistedState } from "./usePersistedState";

type Phase = "focus" | "break";

const noopSubscribe = () => () => {};

export function StudyTimer() {
  const [config, setConfig] = usePersistedState("tools:pomodoro", { focus: 25, rest: 5 });
  const [phase, setPhase] = React.useState<Phase>("focus");
  /** Seconds left; null = the full length of the current phase (follows saved settings after reload). */
  const [remainingState, setRemaining] = React.useState<number | null>(null);
  const [running, setRunning] = React.useState(false);
  const [sessions, setSessions] = React.useState(0);
  const browserPermission = React.useSyncExternalStore(
    noopSubscribe,
    () => (typeof Notification === "undefined" ? "unsupported" : Notification.permission),
    () => "unsupported" as const,
  );
  const [requested, setRequested] = React.useState<NotificationPermission | null>(null);
  const notify = requested ?? browserPermission;
  const endAt = React.useRef<number | null>(null);
  const originalTitle = React.useRef<string>("");

  React.useEffect(() => {
    originalTitle.current = document.title;
    return () => {
      document.title = originalTitle.current;
    };
  }, []);

  const duration = (p: Phase) => (p === "focus" ? config.focus : config.rest) * 60;
  const remaining = remainingState ?? duration(phase);

  /** Move to the other phase. Side effects live here, not inside a state updater. */
  const switchPhase = React.useCallback(
    (completed: boolean) => {
      const next: Phase = phase === "focus" ? "break" : "focus";
      if (completed && phase === "focus") setSessions((n) => n + 1);
      if (completed && typeof Notification !== "undefined" && Notification.permission === "granted") {
        try {
          new Notification(phase === "focus" ? "Focus session done — take a break" : "Break over — back to work");
        } catch {
          /* ignore */
        }
      }
      endAt.current = null;
      setRemaining(null);
      setPhase(next);
    },
    [phase],
  );

  // Tick using wall-clock end time so background tabs stay accurate.
  React.useEffect(() => {
    if (!running) return;
    if (endAt.current === null) endAt.current = Date.now() + remaining * 1000;
    const id = window.setInterval(() => {
      const left = Math.max(0, Math.round((endAt.current! - Date.now()) / 1000));
      setRemaining(left);
      if (left === 0) {
        setRunning(false);
        switchPhase(true);
      }
    }, 250);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, switchPhase]);

  const mm = String(Math.floor(remaining / 60)).padStart(2, "0");
  const ss = String(remaining % 60).padStart(2, "0");

  React.useEffect(() => {
    if (!originalTitle.current) return;
    document.title = running ? `${mm}:${ss} · ${phase === "focus" ? "Focus" : "Break"}` : originalTitle.current;
  }, [mm, ss, running, phase]);

  const start = () => setRunning(true);
  const pause = () => {
    setRunning(false);
    endAt.current = null;
  };
  const reset = () => {
    pause();
    setRemaining(null);
  };
  const skip = () => {
    pause();
    switchPhase(false);
  };

  const askNotify = async () => {
    if (typeof Notification === "undefined") return;
    try {
      setRequested(await Notification.requestPermission());
    } catch {
      setRequested("denied");
    }
  };

  const progress = 1 - remaining / duration(phase);

  return (
    <ToolCard id="timer" icon={<Timer className="h-6 w-6" aria-hidden />} title="Study Timer" description="Pomodoro-style focus and break cycles.">
      <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center">
        <div className="relative h-44 w-44 shrink-0">
          <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90" aria-hidden>
            <circle cx="50" cy="50" r="44" fill="none" stroke="currentColor" strokeWidth="6" className="text-border" />
            <circle
              cx="50"
              cy="50"
              r="44"
              fill="none"
              stroke="currentColor"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 44}
              strokeDashoffset={2 * Math.PI * 44 * (1 - progress)}
              className={cn("transition-[stroke-dashoffset] duration-300", phase === "focus" ? "text-primary" : "text-success")}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-mono text-4xl font-bold tabular-nums text-text" role="timer" aria-live="off">
              {mm}:{ss}
            </span>
            <span className={cn("text-xs font-semibold uppercase tracking-widest", phase === "focus" ? "text-lavender" : "text-success")}>{phase}</span>
          </div>
        </div>

        <div className="w-full space-y-4">
          <div className="flex flex-wrap gap-2">
            {running ? (
              <Button onClick={pause} leftIcon={<Pause className="h-4 w-4" aria-hidden />}>
                Pause
              </Button>
            ) : (
              <Button onClick={start} leftIcon={<Play className="h-4 w-4" aria-hidden />}>
                Start
              </Button>
            )}
            <Button variant="secondary" onClick={reset} leftIcon={<RotateCcw className="h-4 w-4" aria-hidden />}>
              Reset
            </Button>
            <Button variant="ghost" onClick={skip} leftIcon={<SkipForward className="h-4 w-4" aria-hidden />}>
              Skip
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="text-sm text-text-2">
              Focus (min)
              <input
                type="number"
                min={1}
                max={120}
                value={config.focus}
                disabled={running}
                onChange={(e) => {
                  const v = Math.min(120, Math.max(1, Number(e.target.value) || 1));
                  setConfig((c) => ({ ...c, focus: v }));
                  if (phase === "focus") setRemaining(null);
                }}
                className="field mt-1"
              />
            </label>
            <label className="text-sm text-text-2">
              Break (min)
              <input
                type="number"
                min={1}
                max={60}
                value={config.rest}
                disabled={running}
                onChange={(e) => {
                  const v = Math.min(60, Math.max(1, Number(e.target.value) || 1));
                  setConfig((c) => ({ ...c, rest: v }));
                  if (phase === "break") setRemaining(null);
                }}
                className="field mt-1"
              />
            </label>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <StatTile tone="muted" label="Focus sessions" value={sessions} />
            {notify === "default" && (
              <Button variant="outline" size="sm" onClick={askNotify} leftIcon={<Bell className="h-4 w-4" aria-hidden />}>
                Enable notifications
              </Button>
            )}
            {notify === "denied" && <p className="text-xs text-muted">Notifications are blocked in this browser — the tab title still shows the countdown.</p>}
          </div>
        </div>
      </div>
    </ToolCard>
  );
}
