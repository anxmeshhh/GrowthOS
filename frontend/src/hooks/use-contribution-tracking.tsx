import { useEffect, useRef } from "react";
import { useToast } from "../components/toast-context";
import { apiFetch } from "../lib/api-client";

export function useContributionTracking(isEnabled: boolean = true) {
  const { showToast } = useToast();
  const lastAwardTime = useRef<number>(Date.now());
  const actionCount = useRef<number>(0);

  useEffect(() => {
    if (!isEnabled) return;

    const awardContribution = (actionType: string = "active_engagement", points: number = 1) => {
      apiFetch("/auth/add-contribution/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action_type: actionType, points }),
      })
        .then(async (res) => {
          if (res.ok) {
            const data = await res.json();
            if (data.new_badges && data.new_badges.length > 0) {
              data.new_badges.forEach((b: any) => {
                showToast(`${b.icon} Achievement Unlocked: ${b.title}!`, "xp");
              });
            } else {
              showToast(`${points} contri added`, "xp");
            }
          }
        })
        .catch(() => {
          // Silently fail if API is unreachable
        });
    };

    // 1. Explicit Action Listener (Screenshots, Notes, Quizzes, etc.)
    const handleMeaningfulAction = () => {
      awardContribution("task_completed", 1);
    };
    window.addEventListener("growthos_action_performed", handleMeaningfulAction);

    // 2. Continuous Activity Listener (Typing, clicking, time spent)
    const handleGeneralActivity = () => {
      const now = Date.now();
      actionCount.current += 1;

      // Award XP for every 50 small interactions (typing, clicking) or after 60 seconds of activity.
      if (actionCount.current >= 50 || now - lastAwardTime.current > 60000) {
        actionCount.current = 0;
        lastAwardTime.current = now;
        awardContribution("general_activity", 1);
      }
    };

    window.addEventListener("click", handleGeneralActivity, { passive: true });
    window.addEventListener("keydown", handleGeneralActivity, { passive: true });

    return () => {
      window.removeEventListener("growthos_action_performed", handleMeaningfulAction);
      window.removeEventListener("click", handleGeneralActivity);
      window.removeEventListener("keydown", handleGeneralActivity);
    };
  }, [showToast, isEnabled]);
}
