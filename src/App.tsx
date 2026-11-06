import { useState, useEffect, useCallback, useRef } from 'react';
import { Navbar }         from './components/Navbar/Navbar';
import { HeroSection }    from './components/Hero/HeroSection';
import { StatCard }       from './components/StatCard/StatCard';
import { AboutSection }   from './components/About/AboutSection';
import { ImpactSection }  from './components/Impact/ImpactSection';
import { HealedMoment }   from './components/HealedMoment/HealedMoment';
import { GetInvolved }    from './components/GetInvolved/GetInvolved';
import { Footer }         from './components/Footer/Footer';
import { heroStats, storyStats, actionCards } from './data/stats';

/**
 * App — Root component
 *
 * State:
 *   healProgress  – 0.0 (polluted) to 1.0 (healed), driven by scroll
 *   scrollRotation – extra Y-rotation passed to Earth (one full turn across page)
 *   isLowPower    – swaps 3-D canvas for static 2-D fallback
 *
 * Scroll binding:
 *   A single scroll listener maps window.scrollY / totalScrollableHeight
 *   to both healProgress and scrollRotation.
 *   This keeps the Earth synced without GSAP ScrollTrigger so we
 *   avoid adding yet another library for one feature.
 */
function App() {
  const [healProgress,   setHealProgress]   = useState(0.0);
  const [scrollRotation, setScrollRotation] = useState(0.0);
  const [isLowPower,     setIsLowPower]     = useState(false);

  /* Smooth heal value that lags behind the target (lerped in rAF) */
  const targetHealRef = useRef(0.0);

  // ── Respect prefers-reduced-motion ─────────────────────────
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mq.matches) setIsLowPower(true);
    const cb = (e: MediaQueryListEvent) => { if (e.matches) setIsLowPower(true); };
    mq.addEventListener('change', cb);
    return () => mq.removeEventListener('change', cb);
  }, []);

  // ── Scroll → healProgress + scrollRotation ─────────────────
  useEffect(() => {
    const onScroll = () => {
      const scrollY = window.scrollY;
      // Total scrollable distance
      const maxScroll = document.body.scrollHeight - window.innerHeight;
      if (maxScroll <= 0) return;

      const progress = Math.min(scrollY / maxScroll, 1);
      targetHealRef.current = progress;

      // One full sphere rotation across the whole page (~2π radians)
      setScrollRotation(progress * Math.PI * 2);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // ── rAF loop: lerp healProgress toward target ───────────────
  useEffect(() => {
    let rafId: number;
    const tick = () => {
      setHealProgress(prev => {
        const next = prev + (targetHealRef.current - prev) * 0.06;
        return Math.abs(next - targetHealRef.current) < 0.001
          ? targetHealRef.current
          : next;
      });
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, []);

  // ── Callback for Impact steps to advance heal manually ──────
  // (IntersectionObserver in ImpactSection calls this per step)
  const handleHealUpdate = useCallback((v: number) => {
    // Only advance, never go backwards via section triggers
    targetHealRef.current = Math.max(targetHealRef.current, v);
  }, []);

  // ── Icon helpers for heroStats ──────────────────────────────
  const heroIcon = (id: string) => {
    if (id === 'co2-reduction') return (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M17 8C8 10 5.9 16.17 3.82 21.34L5.71 22l1-3A4.5 4.5 0 0 0 10.5 20c2.49 0 4.5-2.01 4.5-4.5 0-1.44-.68-2.72-1.73-3.56C15.77 11.41 17 8 17 8z"
          strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    );
    return (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M17 12h-2l2-4h-3l3-5H3l3 5H3l2 4H3l3 5 2.11-3.5a4.97 4.97 0 0 0 1.17.42L10.72 17h2.56l1.44-3.08c.41-.09.8-.23 1.17-.42L18 17l3-5h-4z"
          strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    );
  };

  return (
    <div className="bg-[#030712] text-white min-h-screen overflow-x-hidden
      selection:bg-emerald-500 selection:text-black">

      {/* ── Fixed navigation ── */}
      <Navbar
        isLowPower={isLowPower}
        onToggleLowPower={() => setIsLowPower(p => !p)}
      />

      {/* ── HERO: full-screen Earth ── */}
      <HeroSection
        healProgress={healProgress}
        setHealProgress={(v) => { targetHealRef.current = v; }}
        isLowPower={isLowPower}
        scrollRotation={scrollRotation}
      />

      {/* ── STATS STRIP ── */}
      <section
        id="stats-section"
        className="relative bg-gradient-to-b from-[#030712] to-[#040a16] border-t border-white/5"
      >
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-32
          bg-emerald-900/15 rounded-full filter blur-[80px] pointer-events-none" />

        <div className="relative max-w-4xl mx-auto px-6 sm:px-8 py-16 sm:py-20">
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
            All figures from open international databases. Placeholders labelled.
          </p>
        </div>
      </section>

      {/* ── ABOUT ── */}
      <AboutSection />

      {/* ── IMPACT (3 scroll-driven steps) ── */}
      <ImpactSection
        steps={storyStats}
        onHealUpdate={handleHealUpdate}
      />

      {/* ── HEALED EARTH MOMENT ── */}
      <HealedMoment
        onEnter={() => { targetHealRef.current = 1.0; }}
      />

      {/* ── GET INVOLVED ── */}
      <GetInvolved cards={actionCards} />

      {/* ── FOOTER ── */}
      <Footer
        isLowPower={isLowPower}
        onToggleLowPower={() => setIsLowPower(p => !p)}
      />
    </div>
  );
}

export default App;
