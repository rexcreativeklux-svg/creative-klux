"use client";
import React from "react";
import styles from "./PracticeLoader.module.css";

/**
 * PracticeLoader — Creative Klux Blue Edition
 * An animated splash loader built around a vibrant corporate electric blue gradient.
 *
 * Props:
 * label string — text under the mark (default "Loading your app")
 * fullScreen boolean — fixed overlay covering the viewport (default true)
 * size number — Klux logo mark diameter in px (default 96)
 */
export default function PracticeLoader({
  label = "Loading your app",
  fullScreen = true,
  size = 96,
}) {
  return (
    <div className={`${styles.loader} ${fullScreen ? styles.fixed : ""}`}>
      <div className={styles.stack}>
        {/* Blue sun mark with radiating pulse rings */}
        <div className={styles.sunWrap} style={{ width: size, height: size }}>
          <span className={styles.ring} />
          <span className={`${styles.ring} ${styles.ring2}`} />
          <span className={`${styles.ring} ${styles.ring3}`} />
          <div className={styles.sun}>
            {/* Klux brand mark (replaces the old sunset "sun"). */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logoblue.svg" alt="Creative Klux" className={styles.logo} />
          </div>
        </div>
        {/* Label with pulsing dots */}
        <p className={styles.label}>
          {label}
          <span className={styles.dot}>.</span>
          <span className={styles.dot}>.</span>
          <span className={styles.dot}>.</span>
        </p>
      </div>
    </div>
  );
}
