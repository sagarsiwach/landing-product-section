"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, useMotionValue } from "framer-motion";
// Removed CSS Module import

// --- Style Object for the Tool ---
const styles = {
  toolContainer: {
    padding: "20px",
    backgroundColor: "#f8f9fa",
    border: "1px solid #dee2e6",
    borderRadius: "8px",
    marginBottom: "30px",
  },
  toolHeader: {
    marginTop: 0,
    marginBottom: "10px",
    textAlign: "center",
  },
  toolDescription: {
    textAlign: "center",
    marginBottom: "20px",
    color: "#6c757d",
  },
  positioningCanvas: {
    position: "relative", // Needed for absolute children and drag constraints
    width: "100%", // Take up available width
    maxWidth: "960px", // Limit max width for better viewing, original is 1920px
    // aspect-ratio is set inline
    border: "1px dashed #adb5bd",
    margin: "0 auto 20px auto", // Center the canvas
    overflow: "hidden", // Ensure children don't visually escape bounds
    backgroundColor: "#e9ecef", // Light background for canvas
    backgroundImage:
      "linear-gradient(to right, #ced4da 1px, transparent 1px), linear-gradient(to bottom, #ced4da 1px, transparent 1px)",
    backgroundSize: "20px 20px", // Simple grid background
  },
  staticLayer: {
    position: "absolute",
    objectFit: "contain", // Ensure images fit
    pointerEvents: "none", // Static layers shouldn't interfere
    userSelect: "none", // Prevent text selection
    // width, height, top, left, zIndex set inline
  },
  draggableLayer: {
    position: "absolute",
    objectFit: "contain",
    userSelect: "none",
    pointerEvents: "auto", // Draggable layers need pointer events
    border: "1px dashed rgba(0, 123, 255, 0.5)", // Visual indicator
    // width, height, zIndex, top, left, cursor set inline via motion style
    top: 0, // Start position for transform origin
    left: 0,
  },
  cssOutputContainer: {
    display: "flex",
    gap: "20px",
    justifyContent: "center",
    flexWrap: "wrap",
  },
  cssOutput: {
    display: "flex",
    flexDirection: "column",
    gap: "5px",
  },
  cssOutputLabel: {
    fontWeight: "bold",
    fontSize: "0.9em",
  },
  cssOutputTextarea: {
    fontFamily: "monospace",
    fontSize: "0.85em",
    padding: "8px",
    border: "1px solid #ced4da",
    borderRadius: "4px",
    minWidth: "300px",
    minHeight: "60px", // Enough for a couple of lines
    resize: "none", // Don't allow user resize
    whiteSpace: "pre", // Keep whitespace
    overflowWrap: "break-word", // Wrap long lines
  },
};
// --- End Style Object ---

// Layer data including source and intrinsic pixel dimensions from spec
const layerData = {
  container: { width: 1920, height: 1080, bg: "#FFFFFF" },
  shadow: {
    src: "/Vehicle Bottom Shadow.png",
    width: 1922,
    height: 112,
    initialLeft: "calc(50% - 1922px/2)",
    initialTop: "calc(50% - 112px/2 + 485px)",
    zIndex: 1,
    id: "shadow",
  },
  body: {
    src: "/Vehicle Body.png",
    width: 1922,
    height: 1081,
    initialLeft: "calc(50% - 1922px/2)",
    initialTop: "calc(50% - 1081px/2 + 0.5px)",
    zIndex: 2,
    id: "body",
  },
  rearWheel: {
    src: "/Vehicle Rear Wheel.png",
    width: 442,
    height: 439,
    initialLeft: "calc(50% - 442px/2 + 498px)",
    initialTop: "calc(50% - 439px/2 + 220.5px)",
    zIndex: 3,
    id: "rearWheel",
  },
  frontWheel: {
    src: "/Vehicle Front Wheel.png",
    width: 419,
    height: 418,
    initialLeft: "calc(50% - 419px/2 - 522.5px)",
    initialTop: "calc(50% - 418px/2 + 230px)",
    zIndex: 3,
    id: "frontWheel",
  },
};

// Helper to calculate initial percentage offset based on calc() string (approximate)
const calculateInitialPercent = (calcString, dimension, containerDimension) => {
  try {
    const parts = calcString.match(
      /calc\(50%\s*-\s*(\d+(\.\d+)?)px\/2(?:\s*\+\s*(-?\d+(\.\d+)?))?px\)/
    );
    if (parts) {
      const offsetPx = parseFloat(parts[3] || "0");
      const centerOffset = containerDimension / 2 + offsetPx - dimension / 2;
      return (centerOffset / containerDimension) * 100;
    }
    const simpleParts = calcString.match(
      /calc\(50%\s*-\s*(\d+(\.\d+)?)px\/2\)/
    );
    if (simpleParts) {
      const centerOffset = containerDimension / 2 - dimension / 2;
      return (centerOffset / containerDimension) * 100;
    }
  } catch (e) {
    console.error("Calc parse error", e);
  }
  return 50;
};

export default function LayerPositioner() {
  const containerRef = useRef(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [cssOutputs, setCssOutputs] = useState({
    rearWheel: "Drag Rear Wheel",
    frontWheel: "Drag Front Wheel",
    // You could add outputs for shadow/body if you make them draggable
  });

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setContainerSize({ width: rect.width, height: rect.height });
      }
    };
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  // Function to create draggable layer components
  const createDraggableLayer = (layer) => {
    const initialPercentX = calculateInitialPercent(
      layer.initialLeft,
      layer.width,
      layerData.container.width
    );
    const initialPercentY = calculateInitialPercent(
      layer.initialTop,
      layer.height,
      layerData.container.height
    );
    const widthPercent = (layer.width / layerData.container.width) * 100;
    const heightPercent = (layer.height / layerData.container.height) * 100;

    const x = useMotionValue(
      containerSize.width > 0
        ? (initialPercentX / 100) * containerSize.width
        : 0
    );
    const y = useMotionValue(
      containerSize.height > 0
        ? (initialPercentY / 100) * containerSize.height
        : 0
    );

    useEffect(() => {
      const updateCssOutput = () => {
        if (containerSize.width > 0 && containerSize.height > 0) {
          const percentX = ((x.get() / containerSize.width) * 100).toFixed(2);
          const percentY = ((y.get() / containerSize.height) * 100).toFixed(2);
          setCssOutputs((prev) => ({
            ...prev,
            [layer.id]: `left: ${percentX}%; top: ${percentY}%; width: ${widthPercent.toFixed(
              2
            )}%; height: ${heightPercent.toFixed(2)}%;`,
          }));
        }
      };
      const unsubscribeX = x.onChange(updateCssOutput);
      const unsubscribeY = y.onChange(updateCssOutput);
      updateCssOutput(); // Initial calculation

      return () => {
        unsubscribeX();
        unsubscribeY();
      };
    }, [containerSize, layer.id, x, y, widthPercent, heightPercent]);

    return (
      <motion.img
        key={layer.id}
        src={layer.src}
        alt={`${layer.id} Layer`}
        // Apply base style + specific inline overrides
        style={{
          ...styles.draggableLayer, // Base draggable style
          x, // Bind motion value directly to x transform
          y, // Bind motion value directly to y transform
          width: `${widthPercent}%`,
          height: `${heightPercent}%`,
          zIndex: layer.zIndex,
          cursor: "grab",
        }}
        drag
        dragConstraints={containerRef}
        dragElastic={0}
        dragTransition={{ power: 0, timeConstant: 0 }}
        whileTap={{ cursor: "grabbing" }}
      />
    );
  };

  // --- Render the component ---
  return (
    <div style={styles.toolContainer}>
      <h2 style={styles.toolHeader}>Layer Positioning Tool</h2>
      <p style={styles.toolDescription}>
        Drag the wheels to position them. Copy the generated CSS.
      </p>

      <div
        ref={containerRef}
        style={{
          ...styles.positioningCanvas, // Base style
          aspectRatio: `${layerData.container.width} / ${layerData.container.height}`, // Dynamic aspect ratio
          backgroundColor: layerData.container.bg, // Background from spec
        }}
      >
        {/* Static Layers (positioned using calculated percentages) */}
        <img
          src={layerData.shadow.src}
          alt="Shadow Layer"
          style={{
            ...styles.staticLayer, // Base style
            width: `${
              (layerData.shadow.width / layerData.container.width) * 100
            }%`,
            height: `${
              (layerData.shadow.height / layerData.container.height) * 100
            }%`,
            left: `${calculateInitialPercent(
              layerData.shadow.initialLeft,
              layerData.shadow.width,
              layerData.container.width
            )}%`,
            top: `${calculateInitialPercent(
              layerData.shadow.initialTop,
              layerData.shadow.height,
              layerData.container.height
            )}%`,
            zIndex: layerData.shadow.zIndex,
          }}
        />
        <img
          src={layerData.body.src}
          alt="Body Layer"
          style={{
            ...styles.staticLayer, // Base style
            width: `${
              (layerData.body.width / layerData.container.width) * 100
            }%`,
            height: `${
              (layerData.body.height / layerData.container.height) * 100
            }%`,
            left: `${calculateInitialPercent(
              layerData.body.initialLeft,
              layerData.body.width,
              layerData.container.width
            )}%`,
            top: `${calculateInitialPercent(
              layerData.body.initialTop,
              layerData.body.height,
              layerData.container.height
            )}%`,
            zIndex: layerData.body.zIndex,
          }}
        />

        {/* Draggable Layers */}
        {createDraggableLayer(layerData.rearWheel)}
        {createDraggableLayer(layerData.frontWheel)}
      </div>

      {/* Display CSS Outputs */}
      <div style={styles.cssOutputContainer}>
        <div style={styles.cssOutput}>
          <label style={styles.cssOutputLabel}>Rear Wheel CSS:</label>
          <textarea
            style={styles.cssOutputTextarea}
            readOnly
            value={cssOutputs.rearWheel}
            onClick={(e) => e.target.select()}
          />
        </div>
        <div style={styles.cssOutput}>
          <label style={styles.cssOutputLabel}>Front Wheel CSS:</label>
          <textarea
            style={styles.cssOutputTextarea}
            readOnly
            value={cssOutputs.frontWheel}
            onClick={(e) => e.target.select()}
          />
        </div>
      </div>
    </div>
  );
}
