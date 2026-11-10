import { useState, useEffect } from 'react';
import INTRO_CONFIG from '../../config/intro';

/**
 * Checks whether the intro loading screen is scheduled to play for this session.
 */
export function checkShouldPlayIntro() {
  if (typeof window === 'undefined') return false;
  if (!INTRO_CONFIG.enabled) return false;

  // Never play intro animation or mount canvas on static pages
  const pathname = window.location.pathname;
  if (['/terms', '/privacy', '/sources', '/credits'].includes(pathname)) {
    return false;
  }

  try {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get(INTRO_CONFIG.storage.urlOverrideParam) === '1') {
      return true;
    }
    if (INTRO_CONFIG.storage.sessionOnly) {
      const played = sessionStorage.getItem(INTRO_CONFIG.storage.key);
      if (played === 'true') return false;
    }
  } catch {
    // If sessionStorage is restricted
  }
  return true;
}

/**
 * Hook to coordinate hero entrance animations with the intro loader.
 * Ensures entrance timelines start right as the loader begins its exit dissolve (~1.45s).
 */
export function useIntroStatus() {
  const [status, setStatus] = useState(() => {
    const shouldPlay = checkShouldPlayIntro();
    return {
      isIntroActive: shouldPlay,
      isIntroExiting: !shouldPlay,
      isIntroComplete: !shouldPlay,
    };
  });

  useEffect(() => {
    if (!status.isIntroActive) return;

    const handleExit = () => {
      setStatus((prev) => ({ ...prev, isIntroExiting: true }));
    };

    const handleComplete = () => {
      setStatus({
        isIntroActive: false,
        isIntroExiting: true,
        isIntroComplete: true,
      });
    };

    window.addEventListener('terraheal:intro-exit', handleExit, { once: true });
    window.addEventListener('terraheal:intro-complete', handleComplete, { once: true });

    return () => {
      window.removeEventListener('terraheal:intro-exit', handleExit);
      window.removeEventListener('terraheal:intro-complete', handleComplete);
    };
  }, [status.isIntroActive]);

  return status;
}

export default useIntroStatus;

