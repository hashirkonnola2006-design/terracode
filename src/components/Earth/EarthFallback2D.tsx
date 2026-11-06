import React from 'react';

interface EarthFallback2DProps {
  healProgress: number; // 0 to 1
}

/**
 * EarthFallback2D Component (Low-Power Eco Mode)
 * 
 * When Low-Power Mode is active, the 3D WebGL Canvas is unmounted to save
 * GPU battery and CPU cycles. This lightweight CSS + SVG vector representation
 * smoothly displays the transformation from polluted to healed using 0 GPU overhead.
 */
export const EarthFallback2D: React.FC<EarthFallback2DProps> = ({ healProgress }) => {
  // Interpolated colors for low power mode
  const bgPolluted = 'radial-gradient(circle at 35% 35%, #57534e 0%, #292524 60%, #0c0a09 100%)';
  const bgHealed = 'radial-gradient(circle at 35% 35%, #0284c7 0%, #0369a1 45%, #0f172a 100%)';

  const glowPolluted = '0 0 50px rgba(180, 83, 9, 0.35)';
  const glowHealed = '0 0 60px rgba(74, 222, 128, 0.55)';

  return (
    <div className="relative flex items-center justify-center w-[300px] h-[300px] md:w-[420px] md:h-[420px] mx-auto select-none">
      {/* Planetary Atmosphere Halo */}
      <div
        className="absolute inset-0 rounded-full transition-all duration-700 ease-out"
        style={{
          boxShadow: healProgress > 0.5 ? glowHealed : glowPolluted,
          opacity: 0.8 + healProgress * 0.2,
        }}
      />

      {/* Main 2D Earth Sphere */}
      <div
        className="relative w-full h-full rounded-full overflow-hidden border border-white/10 shadow-2xl transition-all duration-500"
        style={{
          background: healProgress > 0.5 ? bgHealed : bgPolluted,
        }}
      >
        {/* Continent Layer Polluted */}
        <div
          className="absolute inset-0 transition-opacity duration-700 pointer-events-none"
          style={{ opacity: 1 - healProgress }}
        >
          <svg viewBox="0 0 100 100" className="w-full h-full fill-stone-600/70">
            <path d="M20,35 Q30,20 50,30 T75,45 T60,80 T35,70 Z" />
            <path d="M65,15 Q80,25 85,45 T70,55 Z" />
            <circle cx="45" cy="60" r="12" fill="#78350f" opacity="0.4" />
          </svg>
          {/* Smog haze overlay */}
          <div className="absolute inset-0 bg-amber-950/30 mix-blend-multiply" />
        </div>

        {/* Continent Layer Healed */}
        <div
          className="absolute inset-0 transition-opacity duration-700 pointer-events-none"
          style={{ opacity: healProgress }}
        >
          <svg viewBox="0 0 100 100" className="w-full h-full fill-emerald-500/80">
            <path d="M20,35 Q30,20 50,30 T75,45 T60,80 T35,70 Z" />
            <path d="M65,15 Q80,25 85,45 T70,55 Z" />
            <circle cx="45" cy="60" r="10" fill="#22c55e" opacity="0.6" />
          </svg>
          {/* Pristine Polar Ice */}
          <div className="absolute top-0 left-1/4 right-1/4 h-5 bg-white/70 rounded-b-full filter blur-[1px]" />
          <div className="absolute bottom-0 left-1/3 right-1/3 h-4 bg-white/70 rounded-t-full filter blur-[1px]" />
        </div>

        {/* Dynamic Light Crescent / Shadow */}
        <div
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.3) 0%, rgba(0,0,0,0) 40%, rgba(0,0,0,0.85) 100%)',
          }}
        />

        {/* Glowing Healing Frontier Line when partially healed */}
        {healProgress > 0.05 && healProgress < 0.95 && (
          <div
            className="absolute inset-0 rounded-full border-2 border-emerald-400 animate-pulse pointer-events-none"
            style={{
              clipPath: `inset(0 ${(1 - healProgress) * 100}% 0 0)`,
              boxShadow: '0 0 20px #4ade80',
            }}
          />
        )}
      </div>

      {/* Sustainable badge indicator */}
      <div className="absolute -bottom-8 px-3 py-1 bg-emerald-950/80 border border-emerald-500/30 text-emerald-300 text-xs rounded-full backdrop-blur-sm flex items-center gap-1.5 shadow-lg">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
        Low-Power Eco Mode Active (0 GPU Watts)
      </div>
    </div>
  );
};

