import { useState, useEffect, useRef } from 'react';

// ═══════════════════════════════════════════════════════════════
// TWEAKABLE CONSTANTS (Scroll-Driven Healing Progress)
// ═══════════════════════════════════════════════════════════════
export const HEAL_SCROLL_END = 0.72;      // Scroll point where healing reaches 100%
export const HEAL_DAMPING = 0.065;        // Smooth damping factor (slow & heavy feel)

/**
 * useHealProgress
 * - Computes a smoothed progress value (0 to 1) driven by scroll
 * - Supports ?heal=0.5 URL parameter to override/force the value for inspection
 * - Fully reversible: scrolling back up re-pollutes the Earth
 */
export function useHealProgress(scrollProgress = 0) {
  const [forcedHeal, setForcedHeal] = useState(null);
  const currentHealRef = useRef(0);
  const targetHealRef = useRef(0);

  // Check URL param ?heal=0.5
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const healParam = params.get('heal');
      if (healParam !== null) {
        const val = parseFloat(healParam);
        if (!isNaN(val)) {
          const clamped = Math.max(0, Math.min(1, val));
          setForcedHeal(clamped);
          currentHealRef.current = clamped;
          targetHealRef.current = clamped;
        }
      }
    }
  }, []);

  // Map scroll progress (0 to HEAL_SCROLL_END) to heal target (0 to 1)
  useEffect(() => {
    if (forcedHeal !== null) return;
    const mapped = Math.min(1, Math.max(0, scrollProgress / HEAL_SCROLL_END));
    targetHealRef.current = mapped;
  }, [scrollProgress, forcedHeal]);

  return {
    currentHealRef,
    targetHealRef,
    forcedHeal,
    setForcedHeal,
  };
}

