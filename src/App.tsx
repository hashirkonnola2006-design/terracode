import { useState, useEffect, useRef, useCallback } from 'react';
import { Navbar }         from './components/Navbar/Navbar';
import { HeroSection }    from './components/Hero/HeroSection';
import { StatCard }       from './components/StatCard/StatCard';
import { AboutSection }   from './components/About/AboutSection';
import { ImpactSection }  from './components/Impact/ImpactSection';
import { HealedMoment }   from './components/HealedMoment/HealedMoment';
import { GetInvolved }    from './components/GetInvolved/GetInvolved';
import { Footer }         from './components/Footer/Footer';
import { EarthCanvas }    from './components/Earth/EarthCanvas';
import { heroStats, storyStats, actionCards } from './data/stats';
import { Sliders, X }     from 'lucide-react';

interface TelemetryData {
  activeSection: string;
  scale:         number;
  brightness:    number;
  uHeal:         number;
  fps:           number;
}

/**
 * App — Root Component
 *
 * Architecture:
 * - EarthCanvas is pinned in a fixed, full-screen background layer (z-0).
 * - All content sections sit on top with transparent backgrounds and glassmorphism cards.
 * - Scroll position smoothly drives Earth translation, scale, velocity rotation, and uHeal progress.
 * - Features dev-only debug telemetry overlay (?debug=1).
 */
export function App() {
  const [scrollProgress, setScrollProgress] = useState(0.0);
  const [scrollVelocity, setScrollVelocity] = useState(0.0);
  const [isLowPower,     setIsLowPower]     = useState(false);

  // Debug panel state
  const [isDebug,   setIsDebug]   = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  const [telemetry, setTelemetry] = useState<TelemetryData>({
    activeSection: 'Hero',
    scale: 1.0,
    brightness: 1.0,
    uHeal: 0.0,
    fps: 60,
  });

  const lastScrollY    = useRef(0);
  const lastScrollTime = useRef(performance.now());
  const velocityRef    = useRef(0);

  // Check URL for ?debug=1
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search);
      if (p.get('debug') === '1') {
        setIsDebug(true);
        setShowDebug(true);
      }
    }
  }, []);

  // Respect prefers-reduced-motion
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mq.matches) setIsLowPower(true);
    const cb = (e: MediaQueryListEvent) => { if (e.matches) setIsLowPower(true); };
    mq.addEventListener('change', cb);
    return () => mq.removeEventListener('change', cb);
  }, []);

  // Unified scroll listener: calculates progress & velocity
  useEffect(() => {
    let timeoutId: number;

    const onScroll = () => {
      const currentY = window.scrollY;
      const now = performance.now();
      const dt = Math.max(now - lastScrollTime.current, 8);
      const dy = currentY - lastScrollY.current;

      // Scroll velocity in pixels per second
      velocityRef.current = (dy / dt) * 1000;
      setScrollVelocity(velocityRef.current);

      lastScrollY.current = currentY;
      lastScrollTime.current = now;

      clearTimeout(timeoutId);
      timeoutId = window.setTimeout(() => {
        velocityRef.current = 0;
        setScrollVelocity(0);
      }, 100);

      // Total scroll progress 0.0 to 1.0
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      if (maxScroll <= 0) return;
      const progress = Math.min(Math.max(currentY / maxScroll, 0), 1);
      setScrollProgress(progress);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    // Run once on mount to capture initial scroll position
    onScroll();

    return () => {
      window.removeEventListener('scroll', onScroll);
      clearTimeout(timeoutId);
    };
  }, []);

  const handleTelemetry = useCallback((t: TelemetryData) => {
    setTelemetry(t);
  }, []);

  const heroIcon = (id: string) => {
    if (id === 'co2-reduction') {
      return (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M17 8C8 10 5.9 16.17 3.82 21.34L5.71 22l1-3A4.5 4.5 0 0 0 10.5 20c2.49 0 4.5-2.01 4.5-4.5 0-1.44-.68-2.72-1.73-3.56C15.77 11.41 17 8 17 8z" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      );
    }
    return (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M17 12h-2l2-4h-3l3-5H3l3 5H3l2 4H3l3 5 2.11-3.5a4.97 4.97 0 0 0 1.17.42L10.72 17h2.56l1.44-3.08c.41-.09.8-.23 1.17-.42L18 17l3-5h-4z" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    );
  };

  return (
    <div className="relative bg-[#030712] text-white min-h-screen selection:bg-emerald-500 selection:text-black">
      
      {/* ── Fixed 3D Earth Canvas Layer (pinned across whole page) ── */}
      <EarthCanvas
        scrollProgress={scrollProgress}
        scrollVelocity={scrollVelocity}
        isLowPower={isLowPower}
        onTelemetry={handleTelemetry}
      />

      {/* ── Foreground Content Layer (transparent backgrounds, glass cards) ── */}
      <div className="relative z-10">
        
        {/* Navigation */}
        <Navbar
          isLowPower={isLowPower}
          onToggleLowPower={() => setIsLowPower(p => !p)}
        />

        {/* 1. Hero Section */}
        <HeroSection />

        {/* 2. Stats Strip */}
        <section
          id="stats-section"
          className="relative bg-transparent py-16 sm:py-20"
        >
          <div className="relative max-w-4xl mx-auto px-6 sm:px-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {heroStats.map(stat => (
                <StatCard
                  key={stat.id}
                  title={stat.title}
                  value={stat.value}
                  prefix={stat.prefix}
                  suffix={stat.suffix}
                  label={stat.label}
                  changeType={stat.changeType as 'positive' | 'negative'}
                  source={stat.source}
                  sourceUrl={stat.sourceUrl}
                  year={stat.year}
                  sparkline={stat.sparkline}
                  icon={heroIcon(stat.id)}
                />
              ))}
            </div>
            <p className="mt-7 text-center text-[11px] text-slate-500">
              Verified climate benchmarks sourced from open international databases.
            </p>
          </div>
        </section>

        {/* 3. About Section */}
        <AboutSection />

        {/* 4. Impact Section (3 Scroll-Driven Healing Steps) */}
        <ImpactSection
          steps={storyStats}
          onHealUpdate={() => {}}
        />

        {/* 5. Healed Earth Moment (Earth reaches 100% restoration) */}
        <HealedMoment />

        {/* 6. Get Involved Action Cards */}
        <GetInvolved cards={actionCards} />

        {/* 7. Footer */}
        <Footer
          isLowPower={isLowPower}
          onToggleLowPower={() => setIsLowPower(p => !p)}
        />

      </div>

      {/* ── Dev-Only Debug Readout (?debug=1) ── */}
      {isDebug && (
        <div className="fixed bottom-6 right-6 z-50 pointer-events-auto">
          {showDebug ? (
            <div className="p-4 rounded-2xl bg-slate-900/95 backdrop-blur-2xl border border-emerald-500/30 w-84 text-xs shadow-2xl">
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-emerald-400 flex items-center gap-1.5 font-semibold">
                  <Sliders className="w-3.5 h-3.5" /> Dev Mode: Telemetry
                </span>
                <button onClick={() => setShowDebug(false)} className="text-slate-400 hover:text-white">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-1.5 text-[11px] font-mono text-slate-300">
                <div className="flex justify-between">
                  <span>Scroll Progress:</span>
                  <span className="text-emerald-300 font-bold">{(scrollProgress * 100).toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Active Section:</span>
                  <span className="text-cyan-300 font-bold">{telemetry.activeSection}</span>
                </div>
                <div className="flex justify-between">
                  <span>Planet uHeal:</span>
                  <span className="text-emerald-300 font-bold">{telemetry.uHeal.toFixed(3)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Earth Scale:</span>
                  <span className="text-slate-200 font-bold">{telemetry.scale.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Brightness:</span>
                  <span className="text-slate-200 font-bold">{telemetry.brightness.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Scroll Velocity:</span>
                  <span className="text-cyan-300 font-bold">{Math.round(scrollVelocity)} px/s</span>
                </div>
                <div className="flex justify-between">
                  <span>FPS:</span>
                  <span className="text-emerald-400 font-bold">{telemetry.fps}</span>
                </div>
                {typeof window !== 'undefined' && window.__earth && (
                  <>
                    <div className="flex justify-between">
                      <span>DPR:</span>
                      <span className="text-slate-200 font-bold">{window.__earth.pixelRatio}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Draw Calls:</span>
                      <span className="text-slate-200 font-bold">{window.__earth.drawCalls}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Radius (px):</span>
                      <span className="text-slate-200 font-bold">{window.__earth.screenRadiusPx}</span>
                    </div>
                  </>
                )}
              </div>

              <div className="mt-3 pt-2 border-t border-slate-800">
                <label className="block text-[10px] text-slate-400 uppercase tracking-wider mb-1">
                  Manual Scroll Override
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={scrollProgress}
                  onChange={e => {
                    const val = parseFloat(e.target.value);
                    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
                    window.scrollTo({ top: val * maxScroll, behavior: 'auto' });
                  }}
                  className="w-full accent-emerald-400 h-2 rounded-lg cursor-pointer bg-slate-800"
                />
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowDebug(true)}
              className="p-2.5 rounded-full bg-slate-900/90 border border-emerald-500/40 text-emerald-400 shadow-lg hover:scale-110 transition-transform cursor-pointer"
              title="Open Dev Telemetry"
            >
              <Sliders className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

    </div>
  );
}

export default App;
