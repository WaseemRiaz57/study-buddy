"use client";

import { useCallback, useEffect, useState } from "react";
import { Joyride, STATUS, type EventData, type Step } from "react-joyride";

const TOUR_STORAGE_KEY = "hasSeenTour";

type TourStepDefinition = Omit<Step, "target"> & {
  target: string;
};

const tourStepDefinitions: TourStepDefinition[] = [
  {
    target: ".tour-dashboard-overview",
    title: "Your study command center",
    content:
      "Start here to see your progress, recent activity, and the next best action for your study day.",
    placement: "bottom",
  },
  {
    target: ".tour-ai-studio",
    title: "Create faster with AI Studio",
    content:
      "Generate notes, summaries, quizzes, and reusable study material without leaving your workspace.",
    placement: "right",
  },
  {
    target: ".tour-focus-room",
    title: "Settle into Focus Rooms",
    content:
      "Use focus sessions and lightweight tasks to protect deep work time when you need it most.",
    placement: "right",
  },
  {
    target: ".tour-gamification",
    title: "Turn momentum into rewards",
    content:
      "Track XP, levels, streaks, challenges, and badges as you build consistent study habits.",
    placement: "bottom",
  },
];

function getVisibleTarget(selector: string) {
  const targets = Array.from(document.querySelectorAll<HTMLElement>(selector));

  return targets.find((target) => {
    const rect = target.getBoundingClientRect();
    const styles = window.getComputedStyle(target);

    return (
      rect.width > 0 &&
      rect.height > 0 &&
      styles.display !== "none" &&
      styles.visibility !== "hidden"
    );
  });
}

function getAvailableSteps(): Step[] {
  return tourStepDefinitions.flatMap((step) => {
    const target = getVisibleTarget(step.target);

    return target ? [{ ...step, target }] : [];
  });
}

export function ProductTour() {
  const [run, setRun] = useState(false);
  const [steps, setSteps] = useState<Step[]>([]);

  useEffect(() => {
    if (window.localStorage.getItem(TOUR_STORAGE_KEY) === "true") {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      const availableSteps = getAvailableSteps();

      if (availableSteps.length === 0) {
        return;
      }

      setSteps(availableSteps);
      setRun(true);
    }, 450);

    return () => window.clearTimeout(timeoutId);
  }, []);

  const handleTourEvent = useCallback((data: EventData) => {
    const completedStatuses = [STATUS.FINISHED, STATUS.SKIPPED] as string[];

    if (completedStatuses.includes(data.status)) {
      window.localStorage.setItem(TOUR_STORAGE_KEY, "true");
      setRun(false);
    }
  }, []);

  if (steps.length === 0) {
    return null;
  }

  return (
    <Joyride
      continuous
      locale={{
        back: "Back",
        close: "Close",
        last: "Finish",
        next: "Next",
        nextWithProgress: "Next ({current} of {total})",
        skip: "Skip",
      }}
      onEvent={handleTourEvent}
      options={{
        arrowColor: "var(--card)",
        backgroundColor: "var(--card)",
        closeButtonAction: "skip",
        overlayClickAction: false,
        overlayColor: "rgba(15, 10, 22, 0.68)",
        primaryColor: "#7C3AED",
        scrollOffset: 88,
        showProgress: true,
        skipBeacon: true,
        spotlightPadding: 10,
        spotlightRadius: 16,
        textColor: "var(--foreground)",
        width: 380,
        zIndex: 120,
      }}
      run={run}
      scrollToFirstStep
      steps={steps}
      styles={{
        buttonBack: {
          color: "#7C3AED",
          fontSize: 13,
          fontWeight: 700,
          marginRight: 8,
        },
        buttonClose: {
          color: "var(--muted-foreground)",
          height: 34,
          padding: 8,
          width: 34,
        },
        buttonPrimary: {
          backgroundColor: "#7C3AED",
          borderRadius: 10,
          boxShadow: "0 12px 28px rgba(124, 58, 237, 0.28)",
          color: "#ffffff",
          fontSize: 13,
          fontWeight: 800,
          minHeight: 40,
          padding: "10px 18px",
        },
        buttonSkip: {
          color: "var(--muted-foreground)",
          fontSize: 13,
          fontWeight: 700,
        },
        overlay: {
          backdropFilter: "blur(2px)",
        },
        spotlight: {
          stroke: "#8c30e8",
          strokeWidth: 2,
        },
        tooltip: {
          backgroundColor: "var(--card)",
          border: "1px solid rgba(140, 48, 232, 0.24)",
          borderRadius: 18,
          boxShadow: "0 24px 70px rgba(15, 10, 22, 0.34)",
          color: "var(--foreground)",
          padding: 18,
        },
        tooltipContainer: {
          lineHeight: 1.5,
          textAlign: "left",
        },
        tooltipContent: {
          color: "var(--muted-foreground)",
          fontSize: 14,
          padding: "10px 0 4px",
        },
        tooltipFooter: {
          alignItems: "center",
          marginTop: 14,
        },
        tooltipTitle: {
          color: "var(--foreground)",
          fontSize: 18,
          fontWeight: 900,
          letterSpacing: 0,
          margin: 0,
        },
      }}
    />
  );
}
