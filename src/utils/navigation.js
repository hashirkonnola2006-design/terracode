/**
 * TerraHeal — Seamless Page Transition Controller
 *
 * Coordinates route navigation with the PixelIntroLoader animation.
 * When called, triggers the pixel static wave, logo sharpening, and reverse dissolve
 * while swapping routes underneath at 100% teal cover.
 */

export function navigateWithTransition(to, fallbackNavigate) {
  if (typeof window === 'undefined') return;
  if (!to) return;

  // 1. Direct function call if PixelIntroLoader registered its trigger
  if (typeof window.__TERRAHEAL_TRIGGER_TRANSITION__ === 'function') {
    window.__TERRAHEAL_TRIGGER_TRANSITION__(to);
    return;
  }

  // 2. Event-based trigger
  let handled = false;
  const onHandled = () => {
    handled = true;
  };

  window.addEventListener('terraheal:transition-handled', onHandled, { once: true });
  window.dispatchEvent(
    new CustomEvent('terraheal:transition-to', {
      detail: { to },
    })
  );

  // 3. Fallback direct navigation if no loader is registered/active
  setTimeout(() => {
    window.removeEventListener('terraheal:transition-handled', onHandled);
    if (!handled && !window.__TERRAHEAL_LOADER_ACTIVE__ && typeof fallbackNavigate === 'function') {
      fallbackNavigate(to);
    }
  }, 50);
}

export default navigateWithTransition;

