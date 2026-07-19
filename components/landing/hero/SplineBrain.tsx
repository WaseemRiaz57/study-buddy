"use client";

import dynamic from "next/dynamic";
import {
  Component,
  memo,
  useEffect,
  useRef,
  useState,
  type ErrorInfo,
  type ReactNode,
} from "react";
import { useInView, useReducedMotion } from "framer-motion";

function NeuralFallback({ status = "Loading neural model" }: { status?: string }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center" role="status" aria-label={status}>
      <div className="absolute h-[44%] w-[44%] rounded-full bg-violet-500/15 blur-3xl dark:bg-violet-400/15" />
      <div className="neural-loader relative grid aspect-square w-[42%] place-items-center rounded-[42%] border border-violet-400/20 bg-white/20 shadow-[inset_0_1px_0_rgba(255,255,255,.45),0_28px_90px_-34px_rgba(124,58,237,.55)] dark:border-white/10 dark:bg-white/[0.035]">
        <svg viewBox="0 0 220 180" className="h-[68%] w-[68%] text-violet-500/55 dark:text-violet-300/45" fill="none" aria-hidden="true">
          <path d="M109 153c-13 14-36 7-37-11-18 6-35-10-27-27-18-4-23-29-8-40-10-18 7-38 26-34 5-20 31-24 44-9 13-15 39-11 44 9 20-4 36 16 26 34 16 11 10 36-8 40 8 17-9 33-27 27-1 18-24 25-37 11Z" stroke="currentColor" strokeWidth="2" />
          <path d="M109 32v121M74 43c14 8 21 19 19 34M53 77c17-1 31 7 38 20M45 115c18-7 34-2 45 12M145 43c-14 8-21 19-19 34M166 77c-17-1-31 7-38 20M174 115c-18-7-34-2-45 12" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" opacity=".72" />
          {[[63,42],[91,78],[55,112],[82,137],[156,42],[128,78],[164,112],[137,137],[109,55],[109,111]].map(([cx, cy]) => (
            <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="4" fill="currentColor" />
          ))}
        </svg>
        <span className="sr-only">{status}</span>
      </div>
    </div>
  );
}

const Spline = dynamic(() => import("@splinetool/react-spline"), {
  ssr: false,
  loading: () => <NeuralFallback />,
});

const DEFAULT_BRAIN_SCENE =
  process.env.NEXT_PUBLIC_SPLINE_BRAIN_SCENE?.trim() || "";

class SplineErrorBoundary extends Component<
  { children: ReactNode; fallback: ReactNode; resetKey: string },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidUpdate(previousProps: Readonly<{ resetKey: string }>) {
    if (previousProps.resetKey !== this.props.resetKey && this.state.failed) {
      this.setState({ failed: false });
    }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("Spline scene failed; using the neural fallback.", error, info);
    }
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

interface SplineBrainProps {
  scene?: string;
  className?: string;
}

function SplineBrain({ scene = DEFAULT_BRAIN_SCENE, className = "" }: SplineBrainProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const shouldLoad = useInView(rootRef, { once: true, margin: "240px" });
  const prefersReducedMotion = useReducedMotion();
  const [loaded, setLoaded] = useState(false);
  const [supportsWebGL, setSupportsWebGL] = useState(true);
  const [sceneStatus, setSceneStatus] = useState<
    "disabled" | "checking" | "ready" | "failed"
  >(scene ? "checking" : "disabled");

  useEffect(() => {
    const canvas = document.createElement("canvas");
    setSupportsWebGL(Boolean(canvas.getContext("webgl2") || canvas.getContext("webgl")));
  }, []);

  useEffect(() => {
    setLoaded(false);

    if (!shouldLoad || !supportsWebGL || !scene) {
      setSceneStatus(scene ? "checking" : "disabled");
      return;
    }

    const controller = new AbortController();
    let active = true;
    setSceneStatus("checking");

    async function validateScene() {
      try {
        const response = await fetch(scene, {
          method: "HEAD",
          mode: "cors",
          signal: controller.signal,
        });
        const contentType = response.headers.get("content-type") || "";
        const isErrorDocument = /(?:xml|html|text\/plain)/i.test(contentType);

        if (active) {
          setSceneStatus(response.ok && !isErrorDocument ? "ready" : "failed");
        }
      } catch {
        if (active && !controller.signal.aborted) setSceneStatus("failed");
      }
    }

    void validateScene();
    return () => {
      active = false;
      controller.abort();
    };
  }, [scene, shouldLoad, supportsWebGL]);

  return (
    <div
      ref={rootRef}
      className={`relative flex items-center justify-center ${className}`}
      aria-label="Interactive 3D glass brain"
      role="img"
    >
      {(!loaded || !supportsWebGL || sceneStatus !== "ready") && (
        <NeuralFallback
          status={
            sceneStatus === "checking"
              ? "Loading neural model"
              : "Neural model preview"
          }
        />
      )}
      {shouldLoad && supportsWebGL && sceneStatus === "ready" && (
        <div
          className={`absolute inset-0 transition-opacity duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)] ${loaded ? "opacity-100" : "opacity-0"}`}
        >
          <SplineErrorBoundary
            resetKey={scene}
            fallback={<NeuralFallback status="Neural model preview" />}
          >
            <Spline
              scene={scene}
              renderOnDemand
              onLoad={() => setLoaded(true)}
              style={{ pointerEvents: prefersReducedMotion ? "none" : "auto" }}
            />
          </SplineErrorBoundary>
        </div>
      )}
    </div>
  );
}

export default memo(SplineBrain);
