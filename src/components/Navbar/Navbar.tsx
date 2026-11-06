import React, { useState, useEffect } from 'react';
import { Leaf, ChevronRight, Zap, ZapOff, Menu, X } from 'lucide-react';

interface NavbarProps {
  isLowPower: boolean;
  onToggleLowPower: () => void;
  onTakeActionClick?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  isLowPower,
  onToggleLowPower,
  onTakeActionClick,
}) => {
  const [activeTab, setActiveTab] = useState('Home');
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = ['Home', 'About', 'Impact', 'Get Involved'];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-[#040814]/80 backdrop-blur-md py-4 border-b border-white/5' : 'bg-transparent py-6'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 sm:px-8 flex items-center justify-between">
        
        {/* Brand / Logo (matching Target Image B: Leaf icon + EcoFuture) */}
        <a href="#" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30 group-hover:scale-105 transition-transform">
            <Leaf className="w-4 h-4 text-emerald-400 fill-emerald-400" />
          </div>
          <span className="font-display font-bold text-lg tracking-tight text-white">
            EcoFuture
          </span>
        </a>

        {/* Center Pill Navigation (matching Target Image B) */}
        <nav className="hidden md:flex items-center bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-full px-4 py-1.5 shadow-glass">
          {navLinks.map((link) => {
            const isActive = activeTab === link;
            return (
              <button
                key={link}
                onClick={() => setActiveTab(link)}
                className={`relative px-4 py-1.5 text-xs font-medium transition-colors duration-200 ${
                  isActive ? 'text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {link}
                {isActive && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-[2px] bg-emerald-400 rounded-full shadow-[0_0_8px_#4ade80]" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Right CTA & Controls (matching Target Image B) */}
        <div className="hidden md:flex items-center gap-3">
          {/* Subtle Eco / Low-Power toggle icon button */}
          <button
            onClick={onToggleLowPower}
            className={`p-2 rounded-full border transition-all ${
              isLowPower
                ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                : 'bg-slate-900/40 border-white/10 text-slate-400 hover:text-slate-200 hover:border-white/20'
            }`}
            title={isLowPower ? 'Eco Mode Active (Static 2D)' : 'High Performance 3D Globe'}
          >
            {isLowPower ? <ZapOff className="w-3.5 h-3.5" /> : <Zap className="w-3.5 h-3.5" />}
          </button>

          {/* Take Action Outline Button with Right Chevron */}
          <button
            onClick={onTakeActionClick || (() => {
              const el = document.getElementById('take-action');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            })}
            className="group flex items-center gap-1.5 px-5 py-2 rounded-full text-xs font-medium text-white border border-white/25 hover:border-emerald-400/60 bg-white/[0.03] hover:bg-emerald-500/10 transition-all duration-300"
          >
            <span>Take Action</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all" />
          </button>
        </div>

        {/* Mobile Hamburger Toggle */}
        <div className="flex md:hidden items-center gap-2">
          <button
            onClick={onToggleLowPower}
            className="p-2 rounded-full border border-white/10 text-slate-400"
            title="Toggle Eco Mode"
          >
            {isLowPower ? <ZapOff className="w-3.5 h-3.5 text-emerald-400" /> : <Zap className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg text-slate-300 hover:text-white"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden mt-3 mx-4 p-4 rounded-2xl bg-slate-900/95 backdrop-blur-xl border border-white/10 flex flex-col gap-3">
          {navLinks.map((link) => (
            <button
              key={link}
              onClick={() => {
                setActiveTab(link);
                setMobileMenuOpen(false);
              }}
              className="text-left px-3 py-2 text-sm text-slate-200 hover:text-emerald-400 rounded-lg"
            >
              {link}
            </button>
          ))}
          <button
            onClick={() => {
              setMobileMenuOpen(false);
              const el = document.getElementById('take-action');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            className="mt-2 w-full py-2.5 rounded-full text-xs font-semibold text-slate-950 bg-emerald-400 text-center"
          >
            Take Action
          </button>
        </div>
      )}
    </header>
  );
};
