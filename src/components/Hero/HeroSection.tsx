import React from 'react';
import { ArrowDown } from 'lucide-react';

interface HeroSectionProps {
  onScrollToHeal?: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onScrollToHeal }) => {
  const scrollDown = () => {
    if (onScrollToHeal) {
      onScrollToHeal();
    } else {
      const el = document.getElementById('stats-section');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      } else {
        window.scrollBy({ top: window.innerHeight * 0.9, behavior: 'smooth' });
      }
    }
  };

  return (
    <section id="home" className="relative w-full h-screen min-h-[600px] overflow-hidden flex flex-col items-center justify-center bg-transparent">
      
      {/* Soft gradient scrim behind text for maximum legibility without masking the Earth */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 70% 55% at 50% 50%, rgba(3,7,18,0.38) 0%, rgba(3,7,18,0.15) 50%, transparent 85%)',
        }}
      />

      {/* Centered Hero Content */}
      <div className="relative z-10 flex flex-col items-center text-center px-6 select-none pointer-events-none">
        
        {/* Main Headline (Target Design: "Green Tomorrow Starts Here", with "Here" in vibrant green) */}
        <h1 className="font-display font-extrabold text-5xl sm:text-6xl md:text-7xl lg:text-8xl tracking-tight leading-[1.06] text-white drop-shadow-[0_4px_32px_rgba(0,0,0,0.95)] mb-5">
          Green Tomorrow<br />
          Starts{' '}
          <span
            className="text-[#4ADE80]"
            style={{ textShadow: '0 0 35px rgba(74,222,128,0.65), 0 0 70px rgba(74,222,128,0.30)' }}
          >
            Here
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-slate-200 text-base sm:text-lg max-w-sm sm:max-w-md font-medium leading-relaxed drop-shadow-[0_2px_14px_rgba(0,0,0,0.95)] mb-10">
          Together, let&apos;s build a cleaner, greener and healthier planet.
        </p>

        {/* Glowing Green Button + Scroll Indicator */}
        <div className="pointer-events-auto flex flex-col items-center gap-5">
          <button
            onClick={scrollDown}
            className="group inline-flex items-center gap-2 px-8 py-3.5 rounded-full font-semibold text-sm text-[#030712] bg-[#4ADE80] hover:bg-[#3bce74] shadow-[0_0_28px_rgba(74,222,128,0.55)] hover:shadow-[0_0_44px_rgba(74,222,128,0.80)] transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
          >
            <span>Scroll to Heal</span>
            <ArrowDown className="w-4 h-4 transition-transform group-hover:translate-y-0.5" />
          </button>

          {/* Mouse scroll indicator pill */}
          <div
            onClick={scrollDown}
            className="w-5 h-8 rounded-full border-2 border-white/30 hover:border-[#4ADE80]/70 flex items-start justify-center p-1 cursor-pointer transition-colors backdrop-blur-sm"
            title="Scroll down"
          >
            <span
              className="w-1.5 h-2 rounded-full bg-[#4ADE80] animate-bounce"
              style={{ boxShadow: '0 0 8px #4ade80' }}
            />
          </div>
        </div>

      </div>

    </section>
  );
};
