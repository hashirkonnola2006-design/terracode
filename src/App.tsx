import { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar/Navbar';
import { HeroSection } from './components/Hero/HeroSection';

export function App() {
  // Planetary heal progress: 0.0 (polluted wasteland) to 1.0 (lush living biosphere)
  const [healProgress, setHealProgress] = useState<number>(0.0);
  
  // Low-Power eco mode toggle (saves battery / GPU usage)
  const [isLowPower, setIsLowPower] = useState<boolean>(false);

  // Automatically check prefers-reduced-motion
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mediaQuery.matches) {
      setIsLowPower(true);
    }
  }, []);

  return (
    <div className="min-h-screen bg-[#040814] text-slate-100 selection:bg-emerald-500 selection:text-black">
      {/* Navigation */}
      <Navbar
        isLowPower={isLowPower}
        onToggleLowPower={() => setIsLowPower((prev) => !prev)}
      />

      {/* Hero Section with 3D Procedural Earth & uHeal Test Slider */}
      <main>
        <HeroSection
          healProgress={healProgress}
          setHealProgress={setHealProgress}
          isLowPower={isLowPower}
        />
      </main>

      {/* Temporary footer note for milestone check */}
      <footer className="border-t border-slate-800/80 bg-[#030611] py-6 px-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="font-mono">
            Milestone 1: 3D Procedural Earth &amp; GLSL uHeal Shader Scaffold
          </p>
          <p className="text-slate-400">
            Target: 60 FPS • Page Weight: &lt;100 KB • Zero Image Textures
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
