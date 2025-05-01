"use client";

import React, {
  useRef,
  useMemo,
  useState,
  useEffect,
  useCallback,
} from "react";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";

// --- Default Configuration ---
const DEFAULT_BUFFER_VH = 50; // Initial pause duration for each panel
const DEFAULT_TRANSITION_VH = 400; // Initial transition duration between panels
const DEFAULT_STIFFNESS = 100;
const DEFAULT_DAMPING = 30;
const WHEEL_ROTATION_MULTIPLIER = 1.5; // How many turns per transition

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
    willChange: "transform",
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
  // --- Debug Panel Styles ---
  debugPanel: {
    position: "fixed",
    bottom: "10px",
    right: "10px",
    background: "rgba(0, 0, 0, 0.8)",
    color: "white",
    padding: "15px",
    borderRadius: "8px",
    zIndex: 9999,
    fontSize: "11px",
    fontFamily: "monospace",
    width: "280px", // Wider
    maxHeight: "90vh",
    overflowY: "auto", // Scrollable
  },
  debugGroup: {
    marginBottom: "12px",
    borderBottom: "1px solid #555",
    paddingBottom: "8px",
  },
  debugLabel: { display: "block", marginBottom: "3px", fontWeight: "bold" },
  debugInput: {
    width: "100%",
    boxSizing: "border-box",
    marginBottom: "5px",
    padding: "3px",
    background: "#555",
    border: "1px solid #777",
    color: "white",
  },
  debugValue: { marginLeft: "8px", fontStyle: "italic", color: "#aaa" },
  debugButton: {
    background: "#4CAF50",
    color: "white",
    border: "none",
    padding: "5px 10px",
    borderRadius: "4px",
    cursor: "pointer",
    marginTop: "10px",
    fontSize: "11px",
    transition: "background-color 0.3s",
    ":hover": { background: "#45a049" },
  },
  debugJsonArea: {
    width: "100%",
    height: "80px",
    background: "#222",
    color: "#eee",
    border: "1px solid #555",
    fontSize: "10px",
    marginTop: "5px",
    whiteSpace: "pre",
    overflowWrap: "break-word",
    resize: "none",
  },
};
// --- End Style Object ---

// --- Panel Component ---
function Panel({
  panelData,
  index,
  scrollYProgress,
  wheelRotation,
  timelinePoints,
}) {
  if (!panelData || !panelData.layers) return null;

  // Calculate parallax ranges based on timeline points passed from parent
  const parallaxStartProgress = timelinePoints[`p${index}Start`] ?? 0;
  const parallaxEndProgress = timelinePoints[`p${index + 1}Start`] ?? 1;

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
  const [debugScrollY, setDebugScrollY] = useState(0);
  const [activePanel, setActivePanel] = useState(0);
  const [copyButtonText, setCopyButtonText] = useState("Copy JSON");

  // --- Calculate Total Height & Timeline Points based on State ---
  const { calculatedHeight, timelinePoints, totalScrollVh } = useMemo(() => {
    const numTransitions = numPanels - 1;
    // Total VH: Initial Buffer + Transitions + Intermediate Buffers + Final Buffer
    const totalVh =
      bufferVh +
      numTransitions * transitionVh +
      numTransitions * bufferVh +
      bufferVh;
    const safeTotalVh = Math.max(100, totalVh); // Ensure minimum height

    const points = {};
    let currentVh = 0;
    const epsilon = 0.00001; // Prevent division by zero if totalVh is tiny

    // Panel 0 Hold (Start)
    points.p0Start = 0;
    currentVh += bufferVh;
    points.p0HoldEnd = currentVh / safeTotalVh;

    // Panel 1 Transition & Hold
    points.p0TransStart = points.p0HoldEnd; // Alias for clarity
    currentVh += transitionVh;
    points.p1Center = currentVh / safeTotalVh; // P1 finishes centering
    points.p1TransEnd = points.p1Center; // Alias
    points.p1BufferStart = points.p1Center; // Alias
    currentVh += bufferVh;
    points.p1HoldEnd = currentVh / safeTotalVh;

    // Panel 2 Transition & Hold
    points.p1TransStart = points.p1HoldEnd; // Alias
    currentVh += transitionVh;
    points.p2Center = currentVh / safeTotalVh; // P2 finishes centering
    points.p2TransEnd = points.p2Center; // Alias
    points.p2BufferStart = points.p2Center; // Alias
    currentVh += bufferVh;
    points.p2HoldEnd = currentVh / safeTotalVh;

    // Ensure last point is exactly 1.0
    points.end = Math.min(1.0, points.p2HoldEnd + epsilon); // Clamp near 1.0
    if (Math.abs(points.p2HoldEnd - 1.0) > epsilon) {
      console.warn(
        "Timeline calc end doesn't equal 1.0, was:",
        points.p2HoldEnd
      );
      // Adjust last point to be exactly 1.0 if significantly different
      points.p2HoldEnd = 1.0;
      points.end = 1.0;
    }

    // Add p3Start for Panel component parallax calculation consistency
    points.p3Start = points.p2BufferStart;

    return {
      calculatedHeight: `${safeTotalVh}vh`,
      timelinePoints: points,
      totalScrollVh: safeTotalVh, // Pass total VH for debug display
    };
  }, [numPanels, bufferVh, transitionVh]);

  const { scrollYProgress } = useScroll({
    target: targetRef,
    offset: ["start start", "end end"],
  });

  // Update debug display value
  useEffect(() => {
    return scrollYProgress.onChange((v) => setDebugScrollY(v));
  }, [scrollYProgress]);

  // --- Horizontal Scroll Mapping ---
  const { inputRange, outputRange } = useMemo(() => {
    if (Object.keys(timelinePoints).length < 3) {
      // Need at least start, p0HoldEnd, p1Center etc.
      return { inputRange: [0, 1], outputRange: ["0%", "0%"] };
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

    // Filter consecutive duplicate input points (more robust than epsilon check here)
    const filteredInput = [];
    const filteredOutput = [];
    if (input.length > 0) {
      filteredInput.push(input[0]);
      filteredOutput.push(output[0]);
    }
    for (let i = 1; i < input.length; i++) {
      // Only add point if its input value is different from the previous one
      if (
        Math.abs(input[i] - filteredInput[filteredInput.length - 1]) > 0.00001
      ) {
        filteredInput.push(input[i]);
        filteredOutput.push(output[i]);
      } else {
        // If input is duplicate, update the last output value just in case
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
    [
      timelinePoints.p0TransStart ?? 0,
      timelinePoints.p1TransEnd ?? 0,
      timelinePoints.p1TransStart ?? 0,
      timelinePoints.p2TransEnd ?? 0,
    ],
    [
      0,
      -360 * WHEEL_ROTATION_MULTIPLIER,
      -360 * WHEEL_ROTATION_MULTIPLIER,
      -360 * 2 * WHEEL_ROTATION_MULTIPLIER,
    ],
    { clamp: true }
  );

  // Active Panel Tracking
  useEffect(() => {
    const unsubscribe = scrollYProgress.onChange((latestValue) => {
      let currentActive = 0;
      // Check based on when panel *finishes* centering (end of transition)
      if (latestValue >= (timelinePoints.p2Center ?? 1)) {
        currentActive = 2;
      } else if (latestValue >= (timelinePoints.p1Center ?? 1)) {
        currentActive = 1;
      }

      if (currentActive !== activePanel) {
        setActivePanel(currentActive);
      }
    });
    return () => unsubscribe();
  }, [scrollYProgress, activePanel, timelinePoints]);

  // Dot Click Handler
  const handleDotClick = (index) => {
    const targetElement = targetRef.current;
    if (!targetElement || !timelinePoints) return;

    let targetProgress = 0;
    // Target the progress point where the panel *finishes* centering
    if (index === 1) targetProgress = timelinePoints.p1Center ?? 0;
    else if (index === 2) targetProgress = timelinePoints.p2Center ?? 0;

    const totalScrollableHeight =
      targetElement.scrollHeight - window.innerHeight;
    targetProgress = Math.max(0, Math.min(1, targetProgress)); // Clamp progress
    const targetScrollY =
      targetElement.offsetTop + targetProgress * totalScrollableHeight;
    window.scrollTo({ top: targetScrollY, behavior: "smooth" });
  };

  // --- JSON Copy Logic ---
  const getCurrentSettingsJson = useCallback(() => {
    const settings = { bufferVh, transitionVh, stiffness, damping };
    return JSON.stringify(settings, null, 2); // Pretty print
  }, [bufferVh, transitionVh, stiffness, damping]);

  const handleCopyJson = () => {
    const jsonString = getCurrentSettingsJson();
    navigator.clipboard
      .writeText(jsonString)
      .then(() => {
        setCopyButtonText("Copied!");
        setTimeout(() => setCopyButtonText("Copy JSON"), 1500); // Reset after 1.5s
      })
      .catch((err) => {
        console.error("Failed to copy JSON: ", err);
        setCopyButtonText("Error!");
        setTimeout(() => setCopyButtonText("Copy JSON"), 1500);
      });
  };

  return (
    <>
      {" "}
      {/* Use Fragment */}
      <section
        ref={targetRef}
        style={{ ...styles.scrollSection, height: calculatedHeight }}
      >
        <div style={styles.stickyContainer}>
          <motion.div style={{ ...styles.horizontalTrack, x }}>
            {panels.map((panelData, index) => (
              <Panel
                key={panelData.id}
                panelData={panelData}
                index={index}
                scrollYProgress={scrollYProgress}
                wheelRotation={wheelRotation}
                timelinePoints={timelinePoints}
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
        <div style={styles.debugGroup}>
          <label htmlFor="bufferInput" style={styles.debugLabel}>
            Buffer VH: <span style={styles.debugValue}>{bufferVh}</span>
          </label>
          <input
            id="bufferInput"
            type="range"
            min="0"
            max="200"
            step="5"
            value={bufferVh}
            onChange={(e) => setBufferVh(parseInt(e.target.value))}
            style={styles.debugInput}
          />
        </div>

        <div style={styles.debugGroup}>
          <label htmlFor="transitionInput" style={styles.debugLabel}>
            Transition VH: <span style={styles.debugValue}>{transitionVh}</span>
          </label>
          <input
            id="transitionInput"
            type="range"
            min="50"
            max="1000"
            step="10"
            value={transitionVh}
            onChange={(e) => setTransitionVh(parseInt(e.target.value))}
            style={styles.debugInput}
          />
        </div>

        <div style={styles.debugGroup}>
          <label htmlFor="stiffnessInput" style={styles.debugLabel}>
            Stiffness: <span style={styles.debugValue}>{stiffness}</span>
          </label>
          <input
            id="stiffnessInput"
            type="range"
            min="10"
            max="500"
            step="10"
            value={stiffness}
            onChange={(e) => setStiffness(parseInt(e.target.value))}
            style={styles.debugInput}
          />
        </div>

        <div style={styles.debugGroup}>
          <label htmlFor="dampingInput" style={styles.debugLabel}>
            Damping: <span style={styles.debugValue}>{damping}</span>
          </label>
          <input
            id="dampingInput"
            type="range"
            min="5"
            max="100"
            step="1"
            value={damping}
            onChange={(e) => setDamping(parseInt(e.target.value))}
            style={styles.debugInput}
          />
        </div>

        <div style={styles.debugGroup}>
          <span style={styles.debugLabel}>Readouts:</span>
          <span style={styles.debugValue}>
            Total Height: {calculatedHeight} ({totalScrollVh?.toFixed(0)}vh)
          </span>
          <br />
          <span style={styles.debugValue}>
            ScrollYProg: {debugScrollY.toFixed(3)}
          </span>
          <br />
          <span style={styles.debugValue}>Active Panel: {activePanel}</span>
        </div>

        <div style={styles.debugGroup}>
          <span style={styles.debugLabel}>Current Settings JSON:</span>
          <textarea
            style={styles.debugJsonArea}
            value={getCurrentSettingsJson()}
            readOnly
          />
          <button onClick={handleCopyJson} style={styles.debugButton}>
            {copyButtonText}
          </button>
        </div>
      </div>
    </>
  );
}
// --- End Main Gallery Component ---
