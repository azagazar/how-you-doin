"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import styles from "./ChemexLoader.module.css";

const CARAFE_TOP    = 16.9;  // SVG y of carafe opening
const CARAFE_BOTTOM = 33.8;  // SVG y of carafe floor
const CARAFE_HEIGHT = CARAFE_BOTTOM - CARAFE_TOP; // 16.9 SVG units

interface ChemexLoaderProps {
  /**
   * Controlled progress 0–100.
   * Omit to use the built-in simulation (eases to ~90%, waits for complete=true).
   */
  progress?: number;
  /** Moves fill to 100% and stops the drip. Works in both controlled and simulated mode. */
  complete?: boolean;
  label?: string;
  /** Display width of the SVG in px. Height scales at 30:38 ratio. */
  size?: number;
  className?: string;
}

export function ChemexLoader({
  progress: externalProgress,
  complete = false,
  label = "Brewing your day…",
  size = 210,
  className,
}: ChemexLoaderProps) {
  const fillRef = useRef<SVGRectElement>(null);
  const rafRef  = useRef<number>(0);
  const [isDone, setIsDone] = useState(false);

  /**
   * Set fill level directly via SVG y/height attributes — no CSS transform,
   * no px-vs-SVGunit ambiguity, works in every browser.
   */
  const applyProgress = useCallback((p: number) => {
    if (!fillRef.current) return;
    const clamped  = Math.min(Math.max(p, 0), 100);
    const level    = (clamped / 100) * CARAFE_HEIGHT;
    const fillTop  = CARAFE_BOTTOM - level;
    fillRef.current.setAttribute("y",      String(fillTop));
    fillRef.current.setAttribute("height", String(level + 0.05));
if (clamped >= 100) setIsDone(true);
  }, []);

  /* ── Controlled mode: mirror external progress ── */
  useEffect(() => {
    if (externalProgress !== undefined) applyProgress(externalProgress);
  }, [externalProgress, applyProgress]);

  /* ── complete signal: animate 90→100% over 0.8s ── */
  useEffect(() => {
    if (!complete) return;
    cancelAnimationFrame(rafRef.current);
    const startLevel = fillRef.current
      ? parseFloat(fillRef.current.getAttribute("height") ?? "0") - 0.05
      : 0;
    const startP = (startLevel / CARAFE_HEIGHT) * 100;
    const t0 = Date.now();
    const DUR = 800;
    const finish = () => {
      const t = Math.min((Date.now() - t0) / DUR, 1);
      applyProgress(startP + (100 - startP) * (1 - Math.pow(1 - t, 2)));
      if (t < 1) rafRef.current = requestAnimationFrame(finish);
    };
    rafRef.current = requestAnimationFrame(finish);
  }, [complete, applyProgress]);

  /* ── Simulated progress (uncontrolled, no external progress prop) ── */
  useEffect(() => {
    if (externalProgress !== undefined || complete) return;

    const MAX_SIM  = 90;   // never reaches 100% on its own
    const DURATION = 3500; // ms to reach ~90%
    const t0       = Date.now();

    const tick = () => {
      const elapsed = Date.now() - t0;
      const t       = Math.min(elapsed / DURATION, 1);
      // Ease-out: fast start, decelerates toward MAX_SIM
      const eased   = 1 - Math.pow(1 - t, 2.5);
      applyProgress(eased * MAX_SIM);
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [externalProgress, complete, applyProgress]);

  const height = Math.round(size / 0.789);

  return (
    <div className={className}>
      <div className={styles.wrapper}>
        <svg
          viewBox="-1 -0.5 30 38"
          width={size}
          height={height}
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          role="img"
          aria-label="Chemex coffee maker loading"
          aria-valuenow={isDone ? 100 : undefined}
        >
          <defs>
            <clipPath id="chemex-carafe-clip">
              <path d="M21.5,16.9 C24.2,20.1 26.1,24.2 27.3,28.7 C28,31.3 26.1,33.8 23.5,33.8 L6.3,33.8 C3.6,33.8 1.7,31.3 2.4,28.7 C3.6,24.6 5.5,20.5 8.4,16.9 Z" />
            </clipPath>
          </defs>

          {/* ── Coffee fill — progress controlled via ref (no re-render per frame) ── */}
          {/*
           * Rect starts at y=33.8 (carafe floor). JS sets:
           *   translateY(-(p/100 * 16.9)px)
           * 0% → rect at y=33.8 (empty)   100% → rect at y=16.9 (full)
           */}
          <g clipPath="url(#chemex-carafe-clip)">
            {/* y and height are set by JS; start empty (height=0) */}
            <rect
              ref={fillRef}
              x="-1" y="33.8"
              width="30" height="0"
              fill="#4A2E22"
              opacity="0.88"
              stroke="none"
            />
          </g>

          {/* ── Carafe (bottom flask) outline ── */}
          <path
            stroke="#6A4F79" strokeWidth="0.55"
            d="M21.5,16.9 C24.2,20.1 26.1,24.2 27.3,28.7 C28,31.3 26.1,33.8 23.5,33.8 L6.3,33.8 C3.6,33.8 1.7,31.3 2.4,28.7 C3.6,24.6 5.5,20.5 8.4,16.9"
          />

          {/* ── Top filter cone ── */}
          <path
            stroke="#6A4F79" strokeWidth="0.55"
            d="M8.4,8.4 C6.8,6.6 5.9,4.2 5.5,1.2 C5.4,0.6 5.9,0.1 6.5,0.1 C12.1,0.6 17.7,0.6 23.2,0.1 C23.8,0.1 24.3,0.7 24.2,1.3 C23.7,3.7 22.8,6 21.5,8.4"
          />

          {/* ── Filter paper fold lines ── */}
          <path stroke="#6A4F79" strokeWidth="0.35" opacity="0.6"
                d="M14.4,1.9 C15.8,1.9 17.3,1.9 18.7,1.9" />
          <path stroke="#6A4F79" strokeWidth="0.35" opacity="0.6"
                d="M8,4.7 C7.6,4 7.5,3.3 7.4,2.7 C7.3,2.1 7.8,1.6 8.4,1.6 C9.5,1.7 10.6,1.8 11.7,1.8" />

          {/* ── Wooden collar (yellow accent) ── */}
          <path
            stroke="#6A4F79" strokeWidth="0.45" fill="#FDE52F"
            d="M23.8,17 C18.2,16.6 12.3,16.6 6.1,17 C5.5,17 5.1,16.2 5.3,15.6 C6.1,13.6 6.1,11.7 5.3,9.7 C5,9 5.4,8.2 6,8.2 C13.3,8.9 18,8.9 23.7,8.2 C24.3,8.2 24.7,8.9 24.5,9.6 C23.7,11.6 23.7,13.6 24.5,15.6 C24.8,16.3 24.4,17 23.8,17 Z"
          />

          {/* Collar texture lines */}
          <path stroke="#6A4F79" strokeWidth="0.3" opacity="0.55"
                d="M17.5,11.1 C18.7,11.1 19.8,11 21,10.9" />
          <path stroke="#6A4F79" strokeWidth="0.3" opacity="0.55"
                d="M7.8,10.8 C10.7,11.1 13.2,11.2 15.6,11.2" />
          <path stroke="#6A4F79" strokeWidth="0.3" opacity="0.55"
                d="M9.6,14.8 C8.9,14.8 8.2,14.9 7.6,14.9" />
          <path stroke="#6A4F79" strokeWidth="0.3" opacity="0.55"
                d="M21,14.9 C18.4,14.8 15.8,14.7 13.2,14.8" />

          {/* ── Leather handle: circle + two strap arcs ── */}
          <path stroke="#6A4F79" strokeWidth="0.45"
                d="M3.86,14.64 C2.76,14.64 1.86,13.74 1.86,12.64 C1.86,11.54 2.76,10.64 3.86,10.64 C4.96,10.64 5.86,11.54 5.86,12.64 C5.86,13.74 4.96,14.64 3.86,14.64 Z" />
          <path stroke="#6A4F79" strokeWidth="0.4"
                d="M2.76,14.34 C1.46,15.34 0.56,17.94 1.76,19.94" />
          <path stroke="#6A4F79" strokeWidth="0.4"
                d="M2.76,14.34 C1.46,15.34 3.06,18.64 4.26,20.64" />

          {/*
           * ── Coffee drip ──
           * drop.svg outer path scaled to 70% of the pre-transformed version.
           * Formula applied: x_new = (x_orig − 15)×0.7 + 15, y_new = (y_orig − 17)×0.7 + 17
           * Tip stays at (15, 17). Solid fill (no inner cutout). Hidden when done.
           */}
        </svg>

        <p className={styles.label}>{label}</p>
      </div>
    </div>
  );
}

/** Fixed full-screen overlay — background #ECE8E2, centered. */
export function ChemexLoaderScreen({
  progress,
  complete,
  label,
  size,
}: Omit<ChemexLoaderProps, "className">) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "#ECE8E2",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 50,
      }}
    >
      <ChemexLoader
        progress={progress}
        complete={complete}
        label={label}
        size={size}
      />
    </div>
  );
}
