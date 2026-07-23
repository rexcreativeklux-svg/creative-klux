"use client";

import React, { useEffect, useRef } from "react";
import { proxiedSrc } from "@/(lib)/design/renderDesign";
import { radiusToCss } from "@/(lib)/design/radius";
import { warpPerspective } from "@/(lib)/design/perspective";

/**
 * PerspectiveImage — on-screen render for an image element with a perspective
 * warp. Draws the keystone-warped image into a <canvas> (the same warp the PNG
 * export uses, so stage == download). Adjust/filter/shadow come in as the CSS
 * `filter` string (drop-shadow follows the warped trapezoid's alpha); flip and
 * corner-radius stay CSS on the canvas, exactly like the <img> path.
 */
export default function PerspectiveImage({ el, filter, flip }) {
  const ref = useRef(null);
  const { h = 0, v = 0 } = el.perspective || {};

  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    let alive = true;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      if (!alive) return;
      const aspect = (el.width || 1) / (el.height || 1);
      const H = 700;
      const W = Math.max(1, Math.round(H * aspect));
      const warped = warpPerspective(img, W, H, h, v);
      cv.width = W;
      cv.height = H;
      const ctx = cv.getContext("2d");
      ctx.clearRect(0, 0, W, H);
      ctx.drawImage(warped, 0, 0);
    };
    img.src = proxiedSrc(el.src);
    return () => {
      alive = false;
    };
  }, [el.src, el.width, el.height, h, v]);

  return (
    <canvas
      ref={ref}
      style={{
        width: "100%",
        height: "100%",
        borderRadius: radiusToCss(el.borderRadius),
        transform: flip,
        filter,
        pointerEvents: "none",
      }}
    />
  );
}
