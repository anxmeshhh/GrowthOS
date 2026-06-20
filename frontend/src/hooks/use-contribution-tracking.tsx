import { useEffect, useRef } from "react";
import { useToast } from "../components/toast-context";
import { apiFetch } from "../lib/api-client";

export function useContributionTracking(isEnabled: boolean = true) {
  // Hook disabled to prevent client-side XP farming.
  // XP is now awarded securely on the backend.
}
