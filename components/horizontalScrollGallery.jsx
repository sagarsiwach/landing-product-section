"use client";

import React, { useRef, useMemo, useState, useEffect } from "react";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";

// --- Style Object ---
const styles = {
  scrollSection: { position: "relative", width: "100%" },
  stickyContainer: {
    position: "sticky",
    top: 0,
    height: "100vh",
    width: "100%",
    overflow: "visible", // Allow peeking
    background: "#FFFFFF",
  },
  horizontalTrack: {
    display: "flex",
    position: "relative",
    height: "100%",
    willChange: "transform",
    cursor: "grab",
  },
  panel: {
    width: "80vw", // Show 20% of next panel
    height: "100%",
    flexShrink: 0,
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    padding: "20px 10px",
    boxSizing: "border-box",
    textAlign: "center",
    overflow: "visible", // Allow overflow
    position: "relative",
    background: "transparent",
  },
  parallaxTitleContainer: {
    position: "absolute",
    top: "5%",
    left: 0,
    width: "100%",
    height: "40%",
    display: "flex",
    justifyContent: "center",
    alignItems: "flex-start",
    zIndex: 1,
    overflow: "hidden",
    pointerEvents: "none",
  },
  parallaxTitle: {
    fontFamily: "'Geist', sans-serif",
    fontWeight: 700,
    fontSize: "clamp(96px, 25vw, 360px)",
    lineHeight: "100%",
    color: "#000000",
    textTransform: "uppercase",
    letterSpacing: "-8px",
    margin: 0,
    whiteSpace: "nowrap",
    position: "relative",
    opacity: 0, // Start invisible
    transition: "opacity 0.8s ease-in-out",
  },
  visibleTitle: {
    opacity: 1, // Fade in when visible
  },
  vehicleLayers: {
    position: "relative",
    width: "85%",
    maxWidth: "1920px",
    margin: "auto",
    overflow: "hidden",
    aspectRatio: "1920 / 1080",
    zIndex: 5,
    opacity: 0, // Start invisible
    transform: "translateY(40px)", // Start below final position
    transition: "opacity 1.2s ease-out, transform 1.2s ease-out",
  },
  visibleVehicle: {
    opacity: 1,
    transform: "translateY(0)", // Move to final position
  },
  layerImage: {
    position: "absolute",
    objectFit: "contain",
    pointerEvents: "none",
    willChange: "transform",
    top: 0,
    left: 0,
  },
  shadowLayer: {
    left: "-0.05%",
    top: "89.72%",
    width: "100.10%",
    height: "10.37%",
    zIndex: 3,
  },
  bodyLayer: {
    left: "-0.05%",
    top: "0.00%",
    width: "100.10%",
    height: "100.09%",
    zIndex: 2,
  },
  wheelLayer: { zIndex: 1 },
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
  panelContent: {
    position: "relative",
    zIndex: 10,
    marginTop: "30px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "10px",
    opacity: 0, // Start invisible
    transform: "translateY(20px)", // Start below final position
    transition: "opacity 1.5s ease-out, transform 1.5s ease-out",
    transitionDelay: "0.3s", // Delay to create sequence
  },
  visibleContent: {
    opacity: 1,
    transform: "translateY(0)", // Move to final position
  },
  panelDescription: {
    fontSize: "1.1rem",
    color: "#333",
    margin: 0,
    maxWidth: "500px",
  },
  panelDetails: { fontSize: "0.9rem", color: "#555", margin: 0 },
  buyButton: {
    marginTop: "20px",
    padding: "12px 30px",
    fontSize: "1rem",
    fontWeight: "bold",
    color: "#FFFFFF",
    backgroundColor: "#000000",
    border: "none",
    borderRadius: "50px",
    cursor: "pointer",
    transition: "background-color 0.3s ease, transform 0.2s ease",
  },
  buyButtonHover: {
    backgroundColor: "#333333",
    transform: "scale(1.05)",
  },
  progressIndicator: {
    position: "absolute",
    bottom: "5%",
    left: "50%",
    transform: "translateX(-50%)",
    display: "flex",
    gap: "10px",
    zIndex: 20,
  },
  progressDot: {
    width: "10px",
    height: "10px",
    borderRadius: "50%",
    backgroundColor: "rgba(0, 0, 0, 0.2)",
    transition: "background-color 0.3s ease, transform 0.3s ease",
  },
  activeDot: {
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    transform: "scale(1.3)",
  },
};
// --- End Style Object ---

// --- Component Logic ---
const vehicleLayersData = {
  shadow: "/Vehicle Bottom Shadow.png",
  body: "/Vehicle Body.png",
  frontWheel: "/Vehicle Front Wheel.png",
  rearWheel: "/Vehicle Rear Wheel.png",
};
const defaultPanels = [
  {
    id: "panel-r1s",
    title: "KM3000",
    bgColor: "transparent",
    layers: vehicleLayersData,
    description: "All-electric, 7-seat SUV built for making memories.",
    details: "From $75,900 · Est. $779/mo² | EPA est. range 410 mi³",
  },
  {
    id: "panel-r1t",
    title: "KM4000",
    bgColor: "transparent",
    layers: vehicleLayersData,
    description: "All-electric truck built for whatever you call a road.",
    details: "From $69,900 · Est. $739/mo² | EPA est. range 420 mi³",
  },
  {
    id: "panel-r1c",
    title: "KM5000",
    bgColor: "transparent",
    layers: vehicleLayersData,
    description: "Commercial Van. Built for efficiency and the long haul.",
    details: "Inquire for Pricing | Designed for Fleet Operations",
  },
];

// Increased for slower, more luxurious scroll
const VH_PER_PANEL = 250;

export default function HorizontalScrollGallery({
  panels = defaultPanels,
  height = `${panels.length * VH_PER_PANEL}vh`,
}) {
  const targetRef = useRef(null);
  const numPanels = panels.length;
  const [activePanel, setActivePanel] = useState(0);
  const [buttonHovered, setButtonHovered] = useState(false);
  const [visibleElements, setVisibleElements] = useState({
    title: false,
    vehicle: false,
    content: false,
  });

  const { scrollYProgress } = useScroll({
    target: targetRef,
    offset: ["start start", "end end"],
  });

  // Update active panel based on scroll position
  useEffect(() => {
    const unsubscribe = scrollYProgress.onChange((value) => {
      const newActivePanel = Math.min(
        Math.floor(value * numPanels),
        numPanels - 1
      );

      if (newActivePanel !== activePanel) {
        setActivePanel(newActivePanel);
        // Reset visibility states when panel changes
        setVisibleElements({
          title: false,
          vehicle: false,
          content: false,
        });

        // Sequence the animations
        setTimeout(
          () => setVisibleElements((prev) => ({ ...prev, title: true })),
          300
        );
        setTimeout(
          () => setVisibleElements((prev) => ({ ...prev, vehicle: true })),
          800
        );
        setTimeout(
          () => setVisibleElements((prev) => ({ ...prev, content: true })),
          1200
        );
      }
    });

    // Initial animation on component mount
    setTimeout(
      () => setVisibleElements({ title: true, vehicle: true, content: true }),
      500
    );

    return () => unsubscribe();
  }, [scrollYProgress, numPanels, activePanel]);

  // Generate complex ranges for delayed horizontal scroll
  // Start moving later (40% into panel's scroll)
  const horizontalMoveStartFraction = 150 / VH_PER_PANEL;
  const { inputRange, outputRange } = useMemo(() => {
    const input = [];
    const output = [];

    // Always start at 0 progress, 0% horizontal position
    input.push(0);
    output.push("0%");

    for (let i = 0; i < numPanels; i++) {
      const panelStartProgress = i / numPanels;
      const panelEndProgress = (i + 1) / numPanels;
      const moveStartProgress =
        panelStartProgress +
        (panelEndProgress - panelStartProgress) * horizontalMoveStartFraction;

      // Point just before movement starts
      const endPausePoint = moveStartProgress - 0.00001;
      // SAFE CHECK: Ensure input is always populated before accessing last element
      // Also ensure the new point is strictly greater than the last point
      if (input.length > 0 && endPausePoint > input[input.length - 1]) {
        input.push(endPausePoint);
        output.push(`-${i * 80}%`); // Adjusted for 80vw panels
      } else if (input.length === 0 && endPausePoint > 0) {
        // Handle edge case for the very first potential pause point if fraction > 0
        input.push(endPausePoint);
        output.push(`-${i * 80}%`); // Adjusted for 80vw panels
      }

      // Point where this panel's horizontal movement ENDS
      const moveEndProgress = i === numPanels - 1 ? 1.0 : panelEndProgress;
      // SAFE CHECK: Ensure input is populated and new point is strictly greater
      if (input.length > 0 && moveEndProgress > input[input.length - 1]) {
        input.push(moveEndProgress);
        output.push(`-${Math.min(i + 1, numPanels - 1) * 80}%`); // Adjusted for 80vw panels
      } else if (input.length === 0) {
        // Handle edge case for the very first end point
        input.push(moveEndProgress);
        output.push(`-${Math.min(i + 1, numPanels - 1) * 80}%`); // Adjusted for 80vw panels
      }
    }

    // Ensure the final point is exactly 1 if not already added
    if (input.length === 0 || input[input.length - 1] < 1.0) {
      input.push(1.0);
      output.push(`-${(numPanels - 1) * 80}%`); // Adjusted for 80vw panels
    }

    return { inputRange: input, outputRange: output };
  }, [numPanels, horizontalMoveStartFraction]);

  // Apply the delayed transform and add smoothness
  const xRaw = useTransform(scrollYProgress, inputRange, outputRange);
  // Slower, more luxurious spring animation
  const x = useSpring(xRaw, { stiffness: 80, damping: 30, restDelta: 0.001 });

  // Handle dot click to navigate to specific panel
  const handleDotClick = (index) => {
    if (targetRef.current) {
      const scrollHeight = targetRef.current.scrollHeight;
      const panelScrollPosition = (index / numPanels) * scrollHeight;
      window.scrollTo({
        top: targetRef.current.offsetTop + panelScrollPosition,
        behavior: "smooth",
      });
    }
  };

  return (
    <section ref={targetRef} style={{ ...styles.scrollSection, height }}>
      <div style={styles.stickyContainer}>
        <motion.div
          style={{
            ...styles.horizontalTrack,
            x,
            cursor: buttonHovered ? "auto" : "grab",
          }}
          drag="x"
          dragConstraints={{
            left:
              typeof window !== "undefined"
                ? -(((panels.length - 1) * 80 * window.innerWidth) / 100)
                : -1000,
            right: 0,
          }}
          dragElastic={0.05} // Reduced elasticity for more precise feel
          whileTap={{ cursor: "grabbing" }}
          onDrag={(e, info) => {
            const scrollContainer = targetRef.current;
            if (scrollContainer) {
              const scrollHeight =
                scrollContainer.scrollHeight - window.innerHeight;
              const scrollProgress =
                -info.point.x /
                ((panels.length * 80 * window.innerWidth) / 100);
              window.scrollTo(0, scrollProgress * scrollHeight);
            }
          }}
        >
          {panels.map((panel, index) => {
            const panelScrollStart = index / numPanels;
            const panelScrollEnd = (index + 1) / numPanels;

            // Title Parallax Transforms
            const panelTitleY = useTransform(
              scrollYProgress,
              [panelScrollStart, panelScrollEnd],
              ["-50%", "0%"],
              { clamp: true }
            ); // Vertical entry from top
            const panelTitleX = useTransform(
              scrollYProgress,
              [panelScrollStart, panelScrollEnd],
              ["-15%", "15%"],
              { clamp: true }
            ); // Faster horizontal

            // Wheel Rotation Transform - Negative for correct rotation direction
            const panelWheelRotation = useTransform(
              scrollYProgress,
              [panelScrollStart, panelScrollEnd],
              [0, -360 * 1.5], // Reduced speed for more realistic rotation
              { clamp: true }
            );

            // Faster Horizontal Parallax for Content
            const panelContentX = useTransform(
              scrollYProgress,
              [panelScrollStart, panelScrollEnd],
              ["25px", "-25px"], // Reduced for subtler effect
              { clamp: true }
            );

            if (!panel || !panel.layers) {
              /* ... error handling ... */
              return null;
            }

            const isActive = activePanel === index;

            return (
              <div key={panel.id || index} style={styles.panel}>
                <div style={styles.parallaxTitleContainer}>
                  <motion.h2
                    style={{
                      ...styles.parallaxTitle,
                      ...(isActive && visibleElements.title
                        ? styles.visibleTitle
                        : {}),
                      y: panelTitleY,
                      x: panelTitleX,
                    }}
                  >
                    {panel.title}
                  </motion.h2>
                </div>
                <div
                  style={{
                    ...styles.vehicleLayers,
                    ...(isActive && visibleElements.vehicle
                      ? styles.visibleVehicle
                      : {}),
                  }}
                >
                  {panel.layers.rearWheel && (
                    <motion.img
                      src={panel.layers.rearWheel}
                      alt="Rear Wheel"
                      style={{
                        ...styles.layerImage,
                        ...styles.wheelLayer,
                        ...styles.rearWheelPosition,
                        rotate: panelWheelRotation,
                      }}
                      loading="lazy"
                    />
                  )}
                  {panel.layers.frontWheel && (
                    <motion.img
                      src={panel.layers.frontWheel}
                      alt="Front Wheel"
                      style={{
                        ...styles.layerImage,
                        ...styles.wheelLayer,
                        ...styles.frontWheelPosition,
                        rotate: panelWheelRotation,
                      }}
                      loading="lazy"
                    />
                  )}
                  {panel.layers.body && (
                    <img
                      src={panel.layers.body}
                      alt="Vehicle Body"
                      style={{ ...styles.layerImage, ...styles.bodyLayer }}
                      loading="lazy"
                    />
                  )}
                  {panel.layers.shadow && (
                    <img
                      src={panel.layers.shadow}
                      alt="Vehicle Shadow"
                      style={{ ...styles.layerImage, ...styles.shadowLayer }}
                      loading="lazy"
                    />
                  )}
                </div>
                <motion.div
                  style={{
                    ...styles.panelContent,
                    ...(isActive && visibleElements.content
                      ? styles.visibleContent
                      : {}),
                    x: panelContentX,
                  }}
                >
                  <p style={styles.panelDescription}>{panel.description}</p>
                  <p style={styles.panelDetails}>{panel.details}</p>
                  <button
                    style={{
                      ...styles.buyButton,
                      ...(buttonHovered ? styles.buyButtonHover : {}),
                    }}
                    onMouseEnter={() => setButtonHovered(true)}
                    onMouseLeave={() => setButtonHovered(false)}
                  >
                    Buy
                  </button>
                </motion.div>
              </div>
            );
          })}
        </motion.div>

        {/* Progress indicator dots */}
        <div style={styles.progressIndicator}>
          {panels.map((_, index) => (
            <div
              key={`dot-${index}`}
              style={{
                ...styles.progressDot,
                ...(activePanel === index ? styles.activeDot : {}),
              }}
              onClick={() => handleDotClick(index)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
