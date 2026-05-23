"use client";

import { useCallback, useEffect, useState } from "react";
import { Joyride, STATUS, type EventData, type Step } from "react-joyride";

const TOUR_STORAGE_KEY = "hasSeenTour";

type TourStepDefinition = Omit<Step, "target"> & {
  target: string;
};

const tourStepDefinitions: TourStepDefinition[] = [
  {
    target: "body",
    title: "Welcome to StudyBuddy!",
    content:
      "This quick tour highlights the core areas of your learning workspace: AI tools, focused study sessions, live collaboration, rewards, resources, and mentorship.",
    placement: "center",
  },
  {
    target: ".tour-ai-studio",
    title: "AI Studio",
    content:
      "Generate smart notes, summaries, quizzes, explanations, and reusable study material from a single prompt so you can move from confusion to clarity faster.",
    placement: "auto",
  },
  {
    target: ".tour-focus-rooms",
    title: "Focus Rooms",
    content:
      "Track your study time with Pomodoro-style sessions, keep your to-do list nearby, and build reliable focus streaks without leaving the dashboard.",
    placement: "auto",
  },
  {
    target: ".tour-study-rooms",
    title: "Live Study Rooms",
    content:
      "Collaborate with peers in real time through shared rooms, live chat, resources, and session tools built for group learning.",
    placement: "auto",
  },
  {
    target: ".tour-resource-hub",
    title: "Resource Hub",
    content:
      "Discover, upload, unlock, rate, and review study resources so useful material keeps flowing through the community.",
    placement: "auto",
  },
  {
    target: ".tour-gamification",
    title: "Rewards",
    content:
      "Earn XP and coins for every productive session, then use your progress to unlock streak tools, badges, and better study momentum.",
    placement: "auto",
  },
  {
    target: ".tour-mentorship",
    title: "Mentorship",
    content:
      "Connect with expert mentors, request sessions, prepare with shared materials, and get targeted help when self-study is not enough.",
    placement: "auto",
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
      floatingOptions={{
        flipOptions: { padding: 16 },
        shiftOptions: { padding: 16 },
      }}
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
        arrowColor: "#1e293b",
        backgroundColor: "#1e293b",
        closeButtonAction: "skip",
        buttons: ["back", "skip", "close", "primary"],
        overlayClickAction: false,
        overlayColor: "rgba(0, 0, 0, 0.7)",
        primaryColor: "#8b5cf6",
        scrollOffset: 100,
        showProgress: true,
        skipBeacon: true,
        spotlightPadding: 8,
        spotlightRadius: 16,
        textColor: "#f8fafc",
        width: 380,
        zIndex: 1000,
      }}
      run={run}
      scrollToFirstStep
      steps={steps}
      styles={{
        buttonBack: {
          color: "#cbd5e1",
          fontSize: 13,
          fontWeight: 700,
          marginRight: 10,
        },
        buttonClose: {
          color: "#cbd5e1",
          height: 12,
          marginTop: 4,
          padding: 0,
          width: 12,
        },
        buttonPrimary: {
          backgroundColor: "#8b5cf6",
          borderRadius: 8,
          boxShadow: "0 12px 28px rgba(139, 92, 246, 0.28)",
          color: "#ffffff",
          fontSize: 13,
          fontWeight: 800,
          padding: "8px 16px",
        },
        buttonSkip: {
          color: "#cbd5e1",
          fontSize: 13,
          fontWeight: 700,
        },
        floater: {
          transition: "none",
        },
        overlay: {
          backdropFilter: "blur(2px)",
        },
        spotlight: {
          stroke: "#8c30e8",
          strokeWidth: 2,
        },
        tooltip: {
          backgroundColor: "#1e293b",
          border: "1px solid rgba(139, 92, 246, 0.35)",
          borderRadius: 18,
          boxShadow: "0 24px 70px rgba(0, 0, 0, 0.45)",
          color: "#f8fafc",
          padding: 18,
        },
        tooltipContainer: {
          lineHeight: 1.5,
          textAlign: "left",
        },
        tooltipContent: {
          color: "#cbd5e1",
          fontSize: 14,
          padding: "10px 0 4px",
        },
        tooltipFooter: {
          alignItems: "center",
          marginTop: 14,
        },
        tooltipTitle: {
          color: "#f8fafc",
          fontSize: 18,
          fontWeight: 900,
          letterSpacing: 0,
          margin: 0,
        },
      }}
    />
  );
}
