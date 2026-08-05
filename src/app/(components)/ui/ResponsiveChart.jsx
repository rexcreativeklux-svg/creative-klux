"use client";

// app/(components)/ui/ResponsiveChart.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Two small pieces for making the app's charts survive a phone:
//
//   <ChartFrame>       a fluid-height box to put a chart in
//   useChartDensity()  the numbers a chart needs to thin itself out
//
// ── WHAT WAS ACTUALLY WRONG WITH THE CHARTS ─────────────────────────────────
// Not the width. Recharts' own <ResponsiveContainer width="100%" height="100%">
// is already used in most chart code here, so the plot area fits fine. What
// breaks on a narrow screen is everything around it:
//
//   · the WRAPPER has a hardcoded pixel height, so a chart keeps its 320px
//     desktop height on a 360px phone and dominates the screen
//   · axis ticks keep desktop density, so ~12 date labels overlap into a grey
//     smear and the axis stops meaning anything
//   · the legend sits beside the plot and squeezes it to almost nothing
//
// None of that is fixable by a wrapper alone — the tick count and legend
// placement are props on the chart itself. So this file gives the frame AND
// the numbers, and each chart passes them through in Phase 3.
//
// ── USAGE ───────────────────────────────────────────────────────────────────
//   const d = useChartDensity();
//
//   <ChartFrame>
//     <ResponsiveContainer width="100%" height="100%">
//       <LineChart data={data} margin={d.margin}>
//         <XAxis
//           dataKey="date"
//           tick={{ fontSize: d.tickFontSize }}
//           interval={d.tickInterval}
//           minTickGap={d.minTickGap}
//         />
//         <YAxis tick={{ fontSize: d.tickFontSize }} width={d.yAxisWidth} />
//         {!d.compact && <Legend />}
//       </LineChart>
//     </ResponsiveContainer>
//   </ChartFrame>
//
//   {d.compact && <InlineLegend series={series} />}   ← legend BELOW the plot

import { useMediaQuery } from "@/utils/useMediaQuery";

/**
 * Chart-rendering values for the current viewport.
 *
 * Returned as plain numbers rather than applied automatically, because the
 * chart libraries take them as props — there is no CSS route to "draw fewer
 * ticks". Both recharts and apexcharts are in use here, so the shape is
 * library-neutral and each call site maps what it needs.
 *
 * @returns {{
 *   compact: boolean,          true below md — the "thin everything out" flag
 *   tickFontSize: number,      px for axis labels
 *   tickInterval: number|"preserveStartEnd",  recharts XAxis `interval`
 *   minTickGap: number,        px recharts must leave between X ticks
 *   yAxisWidth: number,        px reserved for the Y axis
 *   margin: {top:number,right:number,bottom:number,left:number},
 *   legendBelow: boolean,      true when the legend should stack under the plot
 *   strokeWidth: number,       thinner lines read better at small sizes
 *   dotRadius: number,         0 hides point markers, which merge into noise
 * }}
 */
export function useChartDensity() {
  const isMd = useMediaQuery("(min-width: 768px)", true);
  const isLg = useMediaQuery("(min-width: 1024px)", true);

  const compact = !isMd;

  return {
    compact,
    tickFontSize: compact ? 9 : isLg ? 12 : 11,
    // "preserveStartEnd" lets recharts drop as many intermediate X labels as
    // it needs while still anchoring both ends — the first and last dates are
    // what make a time series readable, so they must survive the thinning.
    tickInterval: compact ? "preserveStartEnd" : 0,
    minTickGap: compact ? 28 : 12,
    yAxisWidth: compact ? 28 : 40,
    margin: compact
      ? { top: 4, right: 4, bottom: 0, left: -28 }
      : { top: 4, right: 8, bottom: 0, left: -24 },
    legendBelow: compact,
    strokeWidth: compact ? 1.5 : 2,
    dotRadius: compact ? 0 : 3,
  };
}

/**
 * Height presets. A chart's height should shrink with the viewport for the
 * same reason its type does — a 320px plot on a 640px-tall phone leaves no
 * room for the page around it.
 *
 * Static classes, not interpolated: Tailwind cannot generate `h-[${n}px]`.
 */
const HEIGHT_CLASS = {
  sm: "h-40 sm:h-48 lg:h-56",
  md: "h-48 sm:h-60 lg:h-72",
  lg: "h-56 sm:h-72 lg:h-80",
  xl: "h-64 sm:h-80 lg:h-96",
};

/**
 * A fluid-height box for a chart, plus the min-width-0 that stops a chart
 * from forcing its flex or grid parent wider than the screen.
 *
 * That `min-w-0` is not decoration: a chart inside a flex row has an implicit
 * `min-width: auto`, so it refuses to shrink below its content and pushes the
 * page into horizontal scroll. It is the single most common cause of a
 * sideways-scrolling analytics page.
 *
 * @param {object} props
 * @param {React.ReactNode} props.children
 * @param {keyof typeof HEIGHT_CLASS} [props.size="md"]
 * @param {string} [props.className]
 */
export function ChartFrame({ children, size = "md", className = "" }) {
  return (
    <div className={`w-full min-w-0 ${HEIGHT_CLASS[size] || HEIGHT_CLASS.md} ${className}`}>
      {children}
    </div>
  );
}

export default ChartFrame;
