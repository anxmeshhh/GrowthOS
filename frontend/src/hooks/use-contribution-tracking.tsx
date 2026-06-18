import { useEffect, useRef } from "react";
import { useToast } from "../components/toast-context";
import { apiFetch } from "../lib/api-client";

export function useContributionTracking(isEnabled: boolean = true) {
  const { showToast } = useToast();

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
            // Only show a toast if a badge was actually unlocked! 
            // We do not show "1 contri added" for every minor action anymore to avoid spam.
            if (data.new_badges && data.new_badges.length > 0) {
              data.new_badges.forEach((b: any) => {
                showToast(`${b.icon} Achievement Unlocked: ${b.title}!`, "xp");
              });
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

    return () => {
      window.removeEventListener("growthos_action_performed", handleMeaningfulAction);
    };
  }, [showToast, isEnabled]);
}
