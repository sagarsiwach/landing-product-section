"use client";

import React, {
  useRef,
  useMemo,
  useState,
  useEffect,
  useCallback,
} from "react";
import {
  motion,
  useScroll,
  useTransform,
  useSpring,
  addScaleCorrection, // Utility for debug panel scaling if needed later
} from "framer-motion";

// --- Default Configuration (will be controlled by state) ---
const DEFAULT_BUFFER_VH = 50;
const DEFAULT_TRANSITION_VH = 400; // Increased for slower transition
const DEFAULT_STIFFNESS = 100; // Lowered for softer spring alongside snap
const DEFAULT_DAMPING = 30;

// --- Panels Data ---
const PANELS_DATA = [
  {
    id: "panel-km3000",
    title: "KM3000",
    layers: {
      shadow: "/Vehicle Bottom Shadow.png",
      body: "/Vehicle Body.png",
      frontWheel: "/Vehicle Front Wheel.png",
      rearWheel: "/Vehicle Rear Wheel.png",
    },
    description: "All-electric, 7-seat SUV built for making memories.",
    details: "From $75,900 · Est. $779/mo² | EPA est. range 410 mi³",
  },
  {
    id: "panel-km4000",
    title: "KM4000",
    layers: {
      shadow: "/Vehicle Bottom Shadow.png",
      body: "/Vehicle Body.png",
      frontWheel: "/Vehicle Front Wheel.png",
      rearWheel: "/Vehicle Rear Wheel.png",
    },
    description: "All-electric truck built for whatever you call a road.",
    details: "From $69,900 · Est. $739/mo² | EPA est. range 420 mi³",
  },
  {
    id: "panel-km5000",
    title: "KM5000",
    layers: {
      shadow: "/Vehicle Bottom Shadow.png",
      body: "/Vehicle Body.png",
      frontWheel: "/Vehicle Front Wheel.png",
      rearWheel: "/Vehicle Rear Wheel.png",
    },
    description: "Commercial Van. Built for efficiency and the long haul.",
    details: "Inquire for Pricing | Designed for Fleet Operations",
  },
];
const PANEL_WIDTH_VW = 80;

// --- Style Object ---
const styles = {
  // ... (ScrollSection, StickyContainer, HorizontalTrack styles remain the same)
  scrollSection: { position: "relative", width: "100%" },
  stickyContainer: {
    position: "sticky",
    top: 0,
    height: "100vh",
    width: "100%",
    overflow: "hidden",
    background: "#f2f2f2",
  },
  horizontalTrack: {
    display: "flex",
    position: "relative",
    height: "100%",
    width: "fit-content",
    willChange: "transform",
  },
  panel: {
    // Style for the panel wrapper
    width: `${PANEL_WIDTH_VW}vw`,
    height: "100%",
    flexShrink: 0,
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    padding: "0",
    boxSizing: "border-box",
    textAlign: "center",
    position: "relative",
    background: "transparent",
    overflow: "visible",
  },
  parallaxTitleContainer: {
    position: "absolute",
    top: "10%",
    left: 0,
    width: "100%",
    height: "auto",
    display: "flex",
    justifyContent: "center",
    alignItems: "flex-start",
    zIndex: 1,
    pointerEvents: "none",
    willChange: "transform", // Only transform for parallax
  },
  parallaxTitle: {
    fontFamily: "'Geist', sans-serif",
    fontWeight: 700,
    fontSize: "clamp(80px, 20vw, 200px)",
    lineHeight: "100%",
    color: "#000000",
    textTransform: "uppercase",
    letterSpacing: "-8px",
    margin: 0,
    whiteSpace: "nowrap",
  },
  vehicleAndContentContainer: {
    position: "relative",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "flex-end",
    width: "100%",
    height: "100%",
    paddingBottom: "5vh",
    boxSizing: "border-box",
    zIndex: 5,
  },
  vehicleLayersContainer: {
    position: "relative",
    width: "100%",
    maxWidth: "1200px",
    aspectRatio: "1920 / 1080",
    margin: "0 auto",
    zIndex: 5,
    overflow: "visible",
  },
  layerImage: {
    position: "absolute",
    objectFit: "contain",
    pointerEvents: "none",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    willChange: "transform",
  },
  shadowLayerPosition: {
    left: "-0.05%",
    top: "89.72%",
    width: "100.10%",
    height: "10.37%",
    zIndex: 1,
  },
  bodyLayerPosition: {
    left: "-0.05%",
    top: "0.00%",
    width: "100.10%",
    height: "100.09%",
    zIndex: 3,
  },
  wheelLayerPosition: { zIndex: 2 },
  rearWheelPosition: {
    left: "63.87%",
    top: "50.36%",
    width: "23.02%",
    height: "40.65%",
  },
  frontWheelPosition: {
    left: "12.24%",
    top: "51.53%",
    width: "21.82%",
    height: "38.70%",
  },
  panelContentContainer: {
    position: "relative",
    zIndex: 10,
    marginTop: "20px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "8px",
    textAlign: "center",
    maxWidth: "90%",
  },
  panelDescription: {
    fontSize: "clamp(1rem, 1.8vw, 1.2rem)",
    color: "#1a1a1a",
    margin: 0,
    fontWeight: 500,
  },
  panelDetails: {
    fontSize: "clamp(0.8rem, 1.5vw, 0.9rem)",
    color: "#595959",
    margin: 0,
    fontFamily: "'Adventure', sans-serif",
    letterSpacing: "normal",
  },
  buyButton: {
    marginTop: "15px",
    padding: "10px 25px",
    fontSize: "clamp(0.9rem, 1.6vw, 1rem)",
    fontWeight: 600,
    color: "#fff",
    backgroundColor: "#000",
    border: "none",
    borderRadius: "50px",
    cursor: "pointer",
  },
  progressIndicatorContainer: {
    position: "absolute",
    bottom: "3%",
    left: "50%",
    transform: "translateX(-50%)",
    display: "flex",
    gap: "10px",
    zIndex: 20,
  },
  progressDot: {
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    backgroundColor: "rgba(0, 0, 0, 0.2)",
    cursor: "pointer",
    transition: "background-color 0.3s ease, transform 0.3s ease",
  },
  activeDot: { backgroundColor: "rgba(0, 0, 0, 0.8)", transform: "scale(1.3)" },
  // Debug Panel Styles
  debugPanel: {
    position: "fixed",
    bottom: "10px",
    right: "10px",
    background: "rgba(0, 0, 0, 0.7)",
    color: "white",
    padding: "15px",
    borderRadius: "8px",
    zIndex: 9999,
    fontSize: "12px",
    fontFamily: "monospace",
    width: "250px",
  },
  debugLabel: { display: "block", marginBottom: "3px" },
  debugInput: { width: "90%", marginBottom: "8px", padding: "2px" },
};
// --- End Style Object ---

// --- Panel Component (Receives global wheel rotation) ---
function Panel({
  panelData,
  index,
  scrollYProgress,
  wheelRotation,
  timelinePoints,
}) {
  if (!panelData || !panelData.layers) return null;

  // Simplified Parallax Timing (adjust if needed)
  const parallaxStartProgress = timelinePoints[`p${index}Start`] ?? 0;
  const parallaxEndProgress = timelinePoints[`p${index + 1}Start`] ?? 1; // Visible until next panel starts its buffer

  const titleY = useTransform(
    scrollYProgress,
    [parallaxStartProgress, parallaxEndProgress],
    ["0%", "70%"],
    { clamp: true }
  );
  const titleX = useTransform(
    scrollYProgress,
    [parallaxStartProgress, parallaxEndProgress],
    ["-10%", "10%"],
    { clamp: true }
  );

  return (
    <div key={panelData.id} style={styles.panel}>
      <motion.div
        style={{ ...styles.parallaxTitleContainer, y: titleY, x: titleX }}
      >
        <h2 style={styles.parallaxTitle}>{panelData.title}</h2>
      </motion.div>
      <div style={styles.vehicleAndContentContainer}>
        <div style={styles.vehicleLayersContainer}>
          {/* Use the *global* wheelRotation value passed as prop */}
          {panelData.layers.shadow && (
            <motion.img
              src={panelData.layers.shadow}
              alt=""
              style={{ ...styles.layerImage, ...styles.shadowLayerPosition }}
              loading="lazy"
            />
          )}
          {panelData.layers.body && (
            <motion.img
              src={panelData.layers.body}
              alt={`${panelData.title} body`}
              style={{ ...styles.layerImage, ...styles.bodyLayerPosition }}
              loading="lazy"
            />
          )}
          {panelData.layers.rearWheel && (
            <motion.img
              src={panelData.layers.rearWheel}
              alt=""
              style={{
                ...styles.layerImage,
                ...styles.wheelLayerPosition,
                ...styles.rearWheelPosition,
                rotate: wheelRotation,
              }}
              loading="lazy"
            />
          )}
          {panelData.layers.frontWheel && (
            <motion.img
              src={panelData.layers.frontWheel}
              alt=""
              style={{
                ...styles.layerImage,
                ...styles.wheelLayerPosition,
                ...styles.frontWheelPosition,
                rotate: wheelRotation,
              }}
              loading="lazy"
            />
          )}
        </div>
        <div style={styles.panelContentContainer}>
          <p style={styles.panelDescription}>{panelData.description}</p>
          <p style={styles.panelDetails}>{panelData.details}</p>
          <motion.button
            style={styles.buyButton}
            whileHover={{ scale: 1.03, backgroundColor: "#333" }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: "spring", stiffness: 400, damping: 15 }}
          >
            Buy
          </motion.button>
        </div>
      </div>
    </div>
  );
}
// --- End Panel Sub-Component ---

// --- Main Gallery Component ---
export default function HorizontalScrollGallery({ panels = PANELS_DATA }) {
  const targetRef = useRef(null);
  const numPanels = panels.length; // 3

  // --- State for Debug Controls ---
  const [bufferVh, setBufferVh] = useState(DEFAULT_BUFFER_VH);
  const [transitionVh, setTransitionVh] = useState(DEFAULT_TRANSITION_VH);
  const [stiffness, setStiffness] = useState(DEFAULT_STIFFNESS);
  const [damping, setDamping] = useState(DEFAULT_DAMPING);
  const [debugScrollY, setDebugScrollY] = useState(0); // To display current progress

  // --- Calculate Total Height based on State ---
  const calculatedHeight = useMemo(() => {
    // Initial buffer + (transitions + buffers for intermediate panels) + final buffer
    const totalVh =
      bufferVh + (numPanels - 1) * (transitionVh + bufferVh) + bufferVh;
    // Minimum height to prevent division by zero or weirdness
    return `${Math.max(100, totalVh)}vh`;
  }, [numPanels, bufferVh, transitionVh]);

  // --- Calculate Timeline Progress Points based on State ---
  const timelinePoints = useMemo(() => {
    const totalVhCalc =
      bufferVh + (numPanels - 1) * (transitionVh + bufferVh) + bufferVh;
    if (totalVhCalc <= 0) return {}; // Prevent division by zero

    const points = {};
    let currentVh = 0;

    // Panel 0 Hold
    points.p0Start = currentVh / totalVhCalc; // 0
    currentVh += bufferVh;
    points.p0HoldEnd = currentVh / totalVhCalc;
    points.p0TransStart = points.p0HoldEnd; // Transition starts immediately after hold

    // Panel 1 Transition & Hold
    currentVh += transitionVh;
    points.p1Center = currentVh / totalVhCalc; // P1 finishes transition
    points.p1TransEnd = points.p1Center;
    points.p1BufferStart = points.p1Center;
    currentVh += bufferVh;
    points.p1HoldEnd = currentVh / totalVhCalc;
    points.p1TransStart = points.p1HoldEnd;

    // Panel 2 Transition & Hold
    currentVh += transitionVh;
    points.p2Center = currentVh / totalVhCalc; // P2 finishes transition
    points.p2TransEnd = points.p2Center;
    points.p2BufferStart = points.p2Center;
    currentVh += bufferVh;
    points.p2HoldEnd = currentVh / totalVhCalc;
    // No transition out for P2 in this fixed model

    // Add p3Start for parallax end calculation
    points.p3Start = points.p2BufferStart; // P3 starts appearing when P2 centers

    // Ensure last point is 1.0
    points.end = 1.0;
    if (points.p2HoldEnd < 1.0 && Math.abs(points.p2HoldEnd - 1.0) > 0.001) {
      // If calculation didn't reach 1.0 exactly add it
      console.warn("Timeline calculation slightly off, forcing end to 1.0");
      points.end = 1.0;
    } else {
      points.end = points.p2HoldEnd; // Use calculated end if close enough
    }

    return points;
  }, [numPanels, bufferVh, transitionVh]);

  const { scrollYProgress } = useScroll({
    target: targetRef,
    offset: ["start start", "end end"],
  });

  // Update debug display value
  useEffect(() => {
    return scrollYProgress.onChange((v) => setDebugScrollY(v));
  }, [scrollYProgress]);

  // --- Horizontal Scroll Mapping (Uses calculated timelinePoints) ---
  const { inputRange, outputRange } = useMemo(() => {
    // Ensure timelinePoints are calculated
    if (Object.keys(timelinePoints).length === 0) {
      return { inputRange: [0, 1], outputRange: ["0%", "0%"] }; // Default if calculation failed
    }

    // Build ranges based on the calculated points for the "snap" effect
    const input = [
      0, // Start
      timelinePoints.p0HoldEnd, // End P0 Hold (Start P0->P1 Trans)
      timelinePoints.p1Center, // End P0->P1 Trans (P1 Centered, Start P1 Hold)
      timelinePoints.p1HoldEnd, // End P1 Hold (Start P1->P2 Trans)
      timelinePoints.p2Center, // End P1->P2 Trans (P2 Centered, Start P2 Hold)
      timelinePoints.end, // End P2 Hold (End Scroll)
    ];

    const output = [
      `0%`, // P0 centered
      `0%`, // P0 centered (end hold)
      `-80%`, // P1 centered (end trans)
      `-80%`, // P1 centered (end hold)
      `-160%`, // P2 centered (end trans)
      `-160%`, // P2 centered (end hold)
    ];

    // Simple filtering of consecutive duplicate *input* points (useTransform handles duplicate outputs fine)
    const filteredInput = [input[0]];
    const filteredOutput = [output[0]];
    for (let i = 1; i < input.length; i++) {
      if (Math.abs(input[i] - input[i - 1]) > 0.0001) {
        // Only add if distinct
        filteredInput.push(input[i]);
        filteredOutput.push(output[i]);
      } else {
        // If input is duplicate, make sure output matches the LATER intended state
        filteredOutput[filteredOutput.length - 1] = output[i];
      }
    }

    // console.log("Dynamic Input:", filteredInput.map(n => n.toFixed(3)));
    // console.log("Dynamic Output:", filteredOutput);
    return { inputRange: filteredInput, outputRange: filteredOutput };
  }, [timelinePoints]); // Recalculate when timeline changes

  // Apply transform and spring using state values
  const xRaw = useTransform(scrollYProgress, inputRange, outputRange);
  const x = useSpring(xRaw, { stiffness, damping, restDelta: 0.001 });

  // --- Wheel Rotation (Global) ---
  const wheelRotation = useTransform(
    scrollYProgress,
    // Input ranges covering *all* transition periods
    [
      timelinePoints.p0TransStart ?? 0,
      timelinePoints.p1TransEnd ?? 0, // Transition 0 -> 1
      timelinePoints.p1TransStart ?? 0,
      timelinePoints.p2TransEnd ?? 0, // Transition 1 -> 2
    ],
    // Output corresponding rotation amounts
    [
      0,
      -360 * 1.5, // Rotate during first transition
      -360 * 1.5,
      -360 * 3.0, // Continue rotating during second transition
      // Adjust multiplier if you want rotation speed to reset
    ],
    { clamp: true }
  );

  // Active Panel Tracking (Based on timelinePoints)
  const [activePanel, setActivePanel] = useState(0);
  useEffect(() => {
    const unsubscribe = scrollYProgress.onChange((latestValue) => {
      let currentActive = 0;
      // Use the points where a panel *finishes* centering
      if (latestValue >= timelinePoints.p2Center) {
        currentActive = 2;
      } else if (latestValue >= timelinePoints.p1Center) {
        currentActive = 1;
      }

      if (currentActive !== activePanel) {
        setActivePanel(currentActive);
      }
    });
    return () => unsubscribe();
  }, [scrollYProgress, activePanel, timelinePoints]); // Add timelinePoints dependency

  // Dot Click Handler (Uses timelinePoints)
  const handleDotClick = (index) => {
    const targetElement = targetRef.current;
    if (!targetElement) return;

    // Target the progress point where the desired panel *finishes* centering
    let targetProgress = 0;
    if (index === 1) targetProgress = timelinePoints.p1Center ?? 0;
    else if (index === 2) targetProgress = timelinePoints.p2Center ?? 0;

    const totalScrollableHeight =
      targetElement.scrollHeight - window.innerHeight;
    // Clamp progress to avoid overshooting
    targetProgress = Math.max(0, Math.min(1, targetProgress));
    const targetScrollY =
      targetElement.offsetTop + targetProgress * totalScrollableHeight;
    window.scrollTo({ top: targetScrollY, behavior: "smooth" });
  };

  return (
    <>
      {" "}
      {/* Use Fragment to avoid extra div */}
      <section
        ref={targetRef}
        style={{ ...styles.scrollSection, height: calculatedHeight }}
      >
        <div style={styles.stickyContainer}>
          <motion.div style={{ ...styles.horizontalTrack, x }}>
            {/* Render the 3 panels */}
            {panels.map((panelData, index) => (
              <Panel
                key={panelData.id}
                panelData={panelData}
                index={index}
                scrollYProgress={scrollYProgress}
                wheelRotation={wheelRotation} // Pass global rotation
                timelinePoints={timelinePoints} // Pass timeline for parallax
              />
            ))}
          </motion.div>

          {/* Progress Indicator Dots */}
          <div style={styles.progressIndicatorContainer}>
            {panels.map((_, index) => (
              <div
                key={`dot-${index}`}
                style={{
                  ...styles.progressDot,
                  ...(activePanel === index ? styles.activeDot : {}),
                }}
                onClick={() => handleDotClick(index)}
                role="button"
                aria-label={`Go to panel ${index + 1}`}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") handleDotClick(index);
                }}
              />
            ))}
          </div>
        </div>
      </section>
      {/* Debug Panel */}
      <div style={styles.debugPanel}>
        <label style={styles.debugLabel}>Buffer VH: {bufferVh}</label>
        <input
          type="range"
          min="0"
          max="200"
          step="5"
          value={bufferVh}
          onChange={(e) => setBufferVh(parseInt(e.target.value))}
          style={styles.debugInput}
        />

        <label style={styles.debugLabel}>Transition VH: {transitionVh}</label>
        <input
          type="range"
          min="50"
          max="1000"
          step="10"
          value={transitionVh}
          onChange={(e) => setTransitionVh(parseInt(e.target.value))}
          style={styles.debugInput}
        />

        <label style={styles.debugLabel}>Stiffness: {stiffness}</label>
        <input
          type="range"
          min="10"
          max="500"
          step="10"
          value={stiffness}
          onChange={(e) => setStiffness(parseInt(e.target.value))}
          style={styles.debugInput}
        />

        <label style={styles.debugLabel}>Damping: {damping}</label>
        <input
          type="range"
          min="5"
          max="100"
          step="1"
          value={damping}
          onChange={(e) => setDamping(parseInt(e.target.value))}
          style={styles.debugInput}
        />

        <label style={styles.debugLabel}>
          Total Height: {calculatedHeight}
        </label>
        <label style={styles.debugLabel}>
          ScrollYProgress: {debugScrollY.toFixed(3)}
        </label>
        <label style={styles.debugLabel}>Active Panel: {activePanel}</label>
      </div>
    </>
  );
}
// --- End Main Gallery Component ---
