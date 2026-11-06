import React from 'react';

/**
 * SectionFade
 * Wrapper that animates a section in with fade + translate-up
 * when it enters the viewport.
 * Respects prefers-reduced-motion by skipping the animation.
 */
export const SectionFade: React.FC<{
  children: React.ReactNode;
  className?: string;
  delay?: number; // ms
}> = ({ children, className = '', delay = 0 }) => {
  const ref = React.useRef<HTMLDivElement>(null);
  const [visible, setVisible] = React.useState(false);

  const prefersReduced =
    typeof window !== 'undefined'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false;

  React.useEffect(() => {
    if (prefersReduced) { setVisible(true); return; }
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      entries => { if (entries[0].isIntersecting) setVisible(true); },
      { threshold: 0.15 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={className}
      style={{
        transition: prefersReduced
          ? 'none'
          : `opacity 0.7s ease ${delay}ms, transform 0.7s ease ${delay}ms`,
        opacity:   visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(28px)',
      }}
    >
      {children}
    </div>
  );
};

