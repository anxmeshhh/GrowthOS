import { useEffect } from "react";
import { Sparkles, Trophy, Zap } from "lucide-react";
import { ACHIEVEMENTS, rankForLevel, xpProgressInLevel } from "@/lib/gamification";
import { useGrowthState } from "@/hooks/use-growth-state";

export function RewardToast() {
  const { state, dismissReward } = useGrowthState();
  const reward = state.gamification.lastReward;

  useEffect(() => {
    if (!reward) return;
    const t = window.setTimeout(() => dismissReward(), 4500);
    return () => window.clearTimeout(t);
  }, [reward, dismissReward]);

  if (!reward) return null;

  const isLevel = reward.type === "level";
  const isAchievement = reward.type === "achievement";
  const ach = reward.achievementId ? ACHIEVEMENTS[reward.achievementId] : null;
  const rank = isLevel && reward.amount ? rankForLevel(reward.amount) : null;

  return (
    <div className="fixed bottom-6 right-6 z-[100] animate-in slide-in-from-bottom-4 fade-in duration-300 max-w-sm">
      <div
        className={`rounded-xl border shadow-2xl backdrop-blur-md p-4 ${
          isLevel
            ? "border-amber-500/50 bg-gradient-to-br from-amber-950/95 to-zinc-900/95"
            : isAchievement
              ? "border-emerald-500/40 bg-gradient-to-br from-emerald-950/90 to-zinc-900/95"
              : "border-[var(--in-progress)]/40 bg-card/95"
        }`}
      >
        <div className="flex items-start gap-3">
          <div
            className={`shrink-0 w-10 h-10 rounded-lg grid place-items-center text-lg ${
              isLevel ? "bg-amber-500/20" : isAchievement ? "bg-emerald-500/20" : "bg-[var(--in-progress)]/20"
            }`}
          >
            {isLevel ? (
              <Trophy className="w-5 h-5 text-amber-400" />
            ) : isAchievement ? (
              <span>{ach?.icon ?? "🏆"}</span>
            ) : (
              <Zap className="w-5 h-5 text-[var(--in-progress)]" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            {isLevel && rank ? (
              <>
                <div className="text-[10px] uppercase tracking-widest text-amber-400/80 font-mono">
                  Level up
                </div>
                <div className="text-base font-bold text-amber-50">{rank.title}</div>
                <div className="text-xs text-amber-200/70 mt-0.5">{rank.tagline}</div>
              </>
            ) : isAchievement && ach ? (
              <>
                <div className="text-[10px] uppercase tracking-widest text-emerald-400/80 font-mono">
                  Achievement unlocked
                </div>
                <div className="text-base font-bold text-emerald-50">{ach.title}</div>
                <div className="text-xs text-emerald-200/70 mt-0.5">{ach.description}</div>
                {reward.amount ? (
                  <div className="text-xs text-emerald-400 mt-1 font-mono">+{reward.amount} XP</div>
                ) : null}
              </>
            ) : (
              <>
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> +{reward.amount} XP
                </div>
                <div className="text-sm font-semibold">{reward.message}</div>
              </>
            )}
          </div>
          <button
            type="button"
            onClick={dismissReward}
            className="text-muted-foreground hover:text-foreground text-xs shrink-0"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}

export function XpBar({ compact = false }: { compact?: boolean }) {
  const { state } = useGrowthState();
  const { level, current, max, pct } = xpProgressInLevel(state.gamification.xp);
  const rank = rankForLevel(level);
  const mult = state.streak >= 3 ? (state.streak >= 7 ? "2×" : "1.5×") : null;

  if (compact) {
    return (
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[10px] font-mono">
          <span className="text-amber-400/90">Lv.{level}</span>
          <span className="text-muted-foreground">
            {current}/{max} XP
          </span>
        </div>
        <div className="h-1.5 rounded-full bg-[var(--muted)] overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-amber-600 to-amber-400 transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border/80 bg-gradient-to-br from-zinc-900/80 to-zinc-950/80 p-3 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div>
          <div className="text-[10px] uppercase tracking-wider text-amber-400/80 font-mono">
            Level {level}
          </div>
          <div className="text-sm font-semibold">{rank.title}</div>
        </div>
        {mult && (
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30">
            {mult} XP
          </span>
        )}
      </div>
      <div className="h-2 rounded-full bg-[var(--muted)] overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-amber-600 via-amber-400 to-yellow-300 transition-all duration-700"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex justify-between text-[10px] font-mono text-muted-foreground">
        <span>{current} XP</span>
        <span>{max - current} to next</span>
      </div>
      {state.streak > 0 && (
        <div className="flex items-center gap-1.5 text-[11px] text-orange-400/90">
          <span>🔥</span>
          <span>{state.streak} day streak</span>
        </div>
      )}
    </div>
  );
}
