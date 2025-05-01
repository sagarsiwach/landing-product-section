"use client";

import React, { useRef, useMemo, useState, useEffect } from "react";
import {
    motion,
    useScroll,
    useTransform,
    useSpring,
} from "framer-motion";

// --- Configuration ---
const ORIGINAL_PANELS_DATA = [
    { id: "panel-km3000", title: "KM3000", layers: { shadow: "/Vehicle Bottom Shadow.png", body: "/Vehicle Body.png", frontWheel: "/Vehicle Front Wheel.png", rearWheel: "/Vehicle Rear Wheel.png" }, description: "Desc 1", details: "Details 1" },
    { id: "panel-km4000", title: "KM4000", layers: { shadow: "/Vehicle Bottom Shadow.png", body: "/Vehicle Body.png", frontWheel: "/Vehicle Front Wheel.png", rearWheel: "/Vehicle Rear Wheel.png" }, description: "Desc 2", details: "Details 2" },
    { id: "panel-km5000", title: "KM5000", layers: { shadow: "/Vehicle Bottom Shadow.png", body: "/Vehicle Body.png", frontWheel: "/Vehicle Front Wheel.png", rearWheel: "/Vehicle Rear Wheel.png" }, description: "Desc 3", details: "Details 3" },
];

const SCROLL_VH_PER_PANEL = 200;
const PANEL_WIDTH_VW = 80;
const BUFFER_VH = 20;
const TRANSITION_START_FRACTION = BUFFER_VH / SCROLL_VH_PER_PANEL; // e.g., 0.1
const TRANSITION_END_FRACTION = 0.98; // End transition slightly before cycle ends

// --- Basic Style Object ---
const styles = {
    scrollSection: { position: "relative", width: "100%" },
    stickyContainer: {
        position: "sticky", top: 0, height: "100vh", width: "100%",
        overflow: "hidden", background: "#e0e0e0", // Lighter grey for contrast
        border: '2px dashed blue' // DEBUG: Border to see container bounds
    },
    horizontalTrack: {
        display: "flex", position: "relative", height: "100%",
        width: "fit-content", willChange: "transform",
        border: '2px dashed red' // DEBUG: Border to see track bounds
    },
    panel: {
        width: `${PANEL_WIDTH_VW}vw`, height: "100%", flexShrink: 0,
        display: "flex", flexDirection: "column", justifyContent: "center",
        alignItems: "center", boxSizing: "border-box",
        position: "relative",
        border: '1px solid green', // DEBUG: Border for each panel
        overflow: "hidden", // Clip content strictly within panel for now
    },
    // Very basic content styling for visibility
    panelContent: { padding: '20px', textAlign: 'center', background: 'rgba(255,255,255,0.7)' },
    title: { fontSize: '2rem', fontWeight: 'bold', margin: '0 0 10px 0'},
    vehiclePlaceholder: { width: '80%', height: '40%', background: 'grey', margin: '20px auto', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '1.5rem'},
    description: { margin: '10px 0' },
    // Layer container/images removed for simplicity in this step
    // ---
    // Progress indicator styles (unchanged but might be removed temporarily if debugging)
    progressIndicatorContainer: { position: "absolute", bottom: "3%", left: "50%", transform: "translateX(-50%)", display: "flex", gap: "10px", zIndex: 20 },
    progressDot: { width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "rgba(0, 0, 0, 0.2)", cursor: "pointer", transition: "background-color 0.3s ease, transform 0.3s ease" },
    activeDot: { backgroundColor: "rgba(0, 0, 0, 0.8)", transform: "scale(1.3)" },
};
// --- End Style Object ---

// --- Minimal Panel Sub-Component ---
// Displays basic info, NO animations, NO parallax
function Panel({ panel, index, originalNumPanels, scrollYProgress }) {
    const panelIndexLogical = (index - 1 + originalNumPanels) % originalNumPanels;
    const panelScrollStart = panelIndexLogical / originalNumPanels;
    const panelScrollEnd = (panelIndexLogical + 1) / originalNumPanels;
    const panelScrollRange = panelScrollEnd - panelScrollStart;

    // Minimal Wheel Rotation Logic (kept as it doesn't affect layout)
    const rotationStartProgress = panelScrollStart + panelScrollRange * TRANSITION_START_FRACTION;
    const rotationEndProgress = panelScrollStart + panelScrollRange * TRANSITION_END_FRACTION;
    const wheelRotation = useTransform(
        scrollYProgress,
        [rotationStartProgress, rotationEndProgress],
        [0, -360 * 1.5], { clamp: true }
    );

    if (!panel) return null;
    const uniqueKey = `${panel.id}-${index}`;

    return (
        // Use regular div
        <div key={uniqueKey} style={styles.panel}>
             {/* Basic Content Display */}
            <div style={styles.panelContent}>
                <h2 style={styles.title}>{panel.title} (Index: {index}, Logical: {panelIndexLogical})</h2>
                 {/* Placeholder for vehicle */}
                <motion.div style={{...styles.vehiclePlaceholder, rotate: wheelRotation}}>
                     Vehicle Area (Rotation: {wheelRotation.get().toFixed(0)}°)
                 </motion.div>
                <p style={styles.description}>{panel.description}</p>
                <p>{panel.details}</p>
             </div>
        </div>
    );
}
// --- End Panel Sub-Component ---

// --- Main Gallery Component (Focus on Scroll Mapping) ---
export default function HorizontalScrollGallery({ panels: originalPanels = ORIGINAL_PANELS_DATA }) {
    const targetRef = useRef(null);
    const originalNumPanels = originalPanels.length;

    // Create Extended Panels: [last, ...original, first]
    const extendedPanels = useMemo(() => {
        if (originalNumPanels < 2) return originalPanels;
        return [
            originalPanels[originalNumPanels - 1],
            ...originalPanels,
            originalPanels[0]
        ];
    }, [originalPanels, originalNumPanels]);

    // Height is based on ORIGINAL panels
    const calculatedHeight = `${originalNumPanels * SCROLL_VH_PER_PANEL}vh`;
    const [logicalActivePanel, setLogicalActivePanel] = useState(0);

    const { scrollYProgress } = useScroll({
        target: targetRef,
        offset: ["start start", "end end"],
    });

    // --- Simplified & Robust Horizontal Scroll Mapping ---
    const { inputRange, outputRange } = useMemo(() => {
        const input = [0];
        // Start centered on logical panel 0 (index 1 in extended)
        const initialX = -1 * PANEL_WIDTH_VW;
        const output = [`${initialX}%`];
        const epsilon = 0.00001; // Small value for float comparisons

        for (let i = 0; i < originalNumPanels; i++) {
            const cycleStart = i / originalNumPanels;
            const cycleEnd = (i + 1) / originalNumPanels;
            const cycleRange = cycleEnd - cycleStart;

            const transitionStart = cycleStart + cycleRange * TRANSITION_START_FRACTION;
            const transitionEnd = cycleStart + cycleRange * TRANSITION_END_FRACTION;

            // X position when logical panel 'i' is centered (extended index i+1)
            const pauseX = -(i + 1) * PANEL_WIDTH_VW;
            // X position when logical panel 'i+1' is centered (extended index i+2)
            const endX = -(i + 2) * PANEL_WIDTH_VW;

            // Add points ensuring they are distinct and ordered
            // 1. Point just before transition starts (holding pause position)
            const beforeTransitionStart = transitionStart - epsilon;
            if (beforeTransitionStart > input[input.length - 1]) {
                input.push(beforeTransitionStart);
                output.push(`${pauseX}%`);
            }

            // 2. Point at transition start (still holding pause position)
             if (transitionStart > input[input.length - 1] || input.length === 1) {
                  // Make sure it's truly after the previous point if not the first added
                 if (input.length === 1 || transitionStart > input[input.length - 1] + epsilon) {
                    input.push(transitionStart);
                    output.push(`${pauseX}%`);
                 } else {
                     // If too close, potentially adjust the previous point's output if needed,
                     // but usually just ensuring distinction is enough.
                     // console.warn("Skipping redundant transition start point at", transitionStart);
                 }
             }


            // 3. Point at transition end (reached end position)
            if (transitionEnd > input[input.length - 1] + epsilon) {
                input.push(transitionEnd);
                output.push(`${endX}%`);
            }

            // 4. Point at cycle end (holding end position if transition finished early)
             if (TRANSITION_END_FRACTION < 1.0 && cycleEnd > input[input.length - 1] + epsilon) {
                 // Only add if the cycle actually ends after the transition finish point
                 if (cycleEnd > transitionEnd + epsilon) {
                    input.push(cycleEnd);
                    output.push(`${endX}%`);
                 }
             }
        }

         // Ensure the final 1.0 progress point maps correctly to the wrapped panel's position
         const finalExpectedX = -(originalNumPanels + 1) * PANEL_WIDTH_VW;
         if (Math.abs(input[input.length - 1] - 1.0) > epsilon) {
             // If the loop didn't end exactly at 1.0, add it.
             input.push(1.0);
             output.push(`${finalExpectedX}%`);
         } else {
             // If the loop *did* end at 1.0, make sure the output value is correct.
             output[output.length - 1] = `${finalExpectedX}%`;
         }

        // console.log("Minimal Input:", input.map(n => n.toFixed(4)));
        // console.log("Minimal Output:", output);
        return { inputRange: input, outputRange: output };

    }, [originalNumPanels]);

    // Apply transform and spring
    const xRaw = useTransform(scrollYProgress, inputRange, outputRange);
    const x = useSpring(xRaw, { stiffness: 150, damping: 40, restDelta: 0.001 });

    // Active Panel Tracking (Logical)
    useEffect(() => {
        const unsubscribe = scrollYProgress.onChange((latestValue) => {
            const progress = Math.max(0, Math.min(1, latestValue));
            const currentLogicalPanel = Math.floor(progress * originalNumPanels);
            const clampedPanel = Math.min(currentLogicalPanel, originalNumPanels - 1);
            if (clampedPanel !== logicalActivePanel) {
                setLogicalActivePanel(clampedPanel);
            }
        });
        return () => unsubscribe();
    }, [scrollYProgress, originalNumPanels, logicalActivePanel]);

    // Dot Click Handler (Logical)
    const handleDotClick = (index) => {
        const targetElement = targetRef.current;
        if (!targetElement) return;
        const totalScrollableHeight = targetElement.scrollHeight - window.innerHeight;
        const targetProgress = index / originalNumPanels;
        const targetScrollY = targetElement.offsetTop + targetProgress * totalScrollableHeight;
        window.scrollTo({ top: targetScrollY, behavior: 'smooth' });
    };

    return (
        <section ref={targetRef} style={{ ...styles.scrollSection, height: calculatedHeight }}>
            <div style={styles.stickyContainer}>
                <motion.div style={{ ...styles.horizontalTrack, x }}>
                    {/* Render the extended panels */}
                    {extendedPanels.map((panel, index) => (
                        <Panel
                            key={`${panel.id}-${index}`} // Unique key
                            panel={panel}
                            index={index} // Index in extended array
                            originalNumPanels={originalNumPanels}
                            scrollYProgress={scrollYProgress}
                        />
                    ))}
                </motion.div>

                {/* Progress Indicator Dots */}
                <div style={styles.progressIndicatorContainer}>
                    {originalPanels.map((_, index) => (
                        <div
                            key={`dot-${index}`}
                            style={{ ...styles.progressDot, ...(logicalActivePanel === index ? styles.activeDot : {}) }}
                            onClick={() => handleDotClick(index)}
                            role="button" aria-label={`Go to panel ${index + 1}`} tabIndex={0}
                            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleDotClick(index); }}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
}
// --- End Main Gallery Component ---