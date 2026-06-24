import { useEffect } from "react";
import { driver } from "driver.js";
import "driver.js/dist/driver.css";

/* Inject a dark + green theme for driver.js once (default driver.css is light). */
function ensureDriverTheme() {
  if (typeof document === "undefined") return;
  if (document.getElementById("growthos-driver-theme")) return;
  const style = document.createElement("style");
  style.id = "growthos-driver-theme";
  style.textContent = `
    .driver-popover {
      background-color: #0a0a0a !important;
      color: #e6e6e6 !important;
      border: 1px solid #1a1a1a !important;
      border-radius: 10px !important;
      box-shadow: 0 12px 40px rgba(0,0,0,0.6) !important;
    }
    .driver-popover-title { color: #ffffff !important; font-weight: 700 !important; }
    .driver-popover-description { color: #999 !important; }
    .driver-popover-progress-text { color: #666 !important; font-family: ui-monospace, monospace !important; }
    .driver-popover-arrow-side-left.driver-popover-arrow { border-left-color: #0a0a0a !important; }
    .driver-popover-arrow-side-right.driver-popover-arrow { border-right-color: #0a0a0a !important; }
    .driver-popover-arrow-side-top.driver-popover-arrow { border-top-color: #0a0a0a !important; }
    .driver-popover-arrow-side-bottom.driver-popover-arrow { border-bottom-color: #0a0a0a !important; }
    .driver-popover-next-btn {
      background: #00FF66 !important;
      color: #000 !important;
      text-shadow: none !important;
      border: none !important;
      border-radius: 6px !important;
      font-weight: 600 !important;
    }
    .driver-popover-prev-btn {
      background: #111 !important;
      color: #ccc !important;
      text-shadow: none !important;
      border: 1px solid #222 !important;
      border-radius: 6px !important;
    }
    .driver-popover-close-btn { color: #888 !important; }
    .driver-popover-close-btn:hover { color: #fff !important; }
    .growthos-tutorial-x {
      position: absolute;
      top: 8px;
      right: 8px;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 6px;
      border: none;
      background: transparent;
      color: #888;
      font-size: 16px;
      line-height: 1;
      cursor: pointer;
      z-index: 1;
    }
    .growthos-tutorial-x:hover { color: #fff; background: rgba(255,255,255,0.06); }
  `;
  document.head.appendChild(style);
}

export function useAppTutorial() {
  const startTutorial = () => {
    ensureDriverTheme();

    const driverObj = driver({
      showProgress: true,
      animate: true,
      // Allow dismissing by overlay click / Esc at any point.
      allowClose: true,
      overlayColor: "rgba(0, 0, 0, 0.8)",
      // Always render an explicit "X" so the user can terminate immediately.
      onPopoverRender: (popover) => {
        const x = document.createElement("button");
        x.className = "growthos-tutorial-x";
        x.setAttribute("type", "button");
        x.setAttribute("aria-label", "Close tutorial");
        x.innerHTML = "&#10005;";
        x.addEventListener("click", () => driverObj.destroy());
        popover.wrapper.appendChild(x);
      },
      steps: [
        {
          popover: {
            title: "Welcome to GrowthOS! 🚀",
            description:
              "Let's take a quick tour of your new Command Center. Click Next to continue, or X to skip.",
            side: "bottom",
            align: "start",
          },
        },
        {
          element: "#nav-dashboard",
          popover: {
            title: "Command Center",
            description:
              "This is your main dashboard. Here you can track your overall progress, daily streaks, and recent activity.",
            side: "right",
            align: "start",
          },
        },
        {
          element: "#nav-roadmap",
          popover: {
            title: "Learning Roadmap",
            description:
              "Here you can view and build learning paths. Custom paths let you set your own goals and timelines.",
            side: "right",
            align: "start",
          },
        },
        {
          element: "#nav-notes",
          popover: {
            title: "Your Library",
            description:
              "All your notes, screenshots, and documents are stored here. Everything is searchable and tagged by topic.",
            side: "right",
            align: "start",
          },
        },
        {
          element: "#nav-profile",
          popover: {
            title: "Profile & Settings",
            description:
              "View your achievements, customize your profile, and start this tutorial again anytime you want.",
            side: "right",
            align: "start",
          },
        },
        {
          popover: {
            title: "You're all set! 🎉",
            description: "Start exploring and building your skills. Happy learning!",
            side: "bottom",
            align: "center",
          },
        },
      ],
    });

    driverObj.drive();
    localStorage.setItem("hasSeenTutorial", "true");
  };

  useEffect(() => {
    // Automatic tutorial startup is disabled; only manual via startTutorial.
  }, []);

  return { startTutorial };
}
