import React, { useState } from 'react';
import { ChevronRight, Zap, ZapOff, Menu, X } from 'lucide-react';
import { TerraHealLogo } from '../brand/TerraHealLogo';

interface NavbarProps {
  isLowPower: boolean;
  onToggleLowPower: () => void;
  onTakeActionClick?: () => void;
}

/**
 * Navbar — Sleek Glass Navigation (Bug 6 fix)
 * - Pure glass background: rgba(6, 11, 22, 0.45) with backdrop-filter blur.
 * - Never renders an opaque dark band.
 * - Zero green glow blobs behind the header on frame 1.
 */
export const Navbar: React.FC<NavbarProps> = ({
  isLowPower,
  onToggleLowPower,
  onTakeActionClick,
}) => {
  const [activeTab, setActiveTab] = useState('Home');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = ['Home', 'About', 'Impact', 'Get Involved'];

  return (
    <header
      id="main-navbar"
      className="fixed top-0 left-0 right-0 z-50 bg-[#060b16]/45 backdrop-blur-md border-b border-white/5 py-3.5 transition-all duration-300"
    >
      <div className="max-w-7xl mx-auto px-6 sm:px-8 flex items-center justify-between">
        
        {/* Brand / Logo: TerraHeal */}
        <TerraHealLogo markSize={28} textClass="text-lg font-bold" />

        {/* Center Pill Navigation (matching Target Image B) */}
        <nav className="hidden md:flex items-center bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-full px-4 py-1.5 shadow-glass">
          {navLinks.map((link) => {
            const isActive = activeTab === link;
            const targetId = link.toLowerCase().replace(/\s+/g, '-');
            return (
              <button
                key={link}
                onClick={() => {
                  setActiveTab(link);
                  if (link === 'Home') {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  } else {
                    const el = document.getElementById(targetId);
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
                className={`relative px-4 py-1.5 text-xs font-medium transition-colors duration-200 cursor-pointer ${
                  isActive ? 'text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {link}
                {isActive && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-[2px] bg-[#0becc2] rounded-full shadow-[0_0_8px_#0becc2]" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Right CTA & Controls (matching Target Image B) */}
        <div className="hidden md:flex items-center gap-3">
          {/* Eco / Low-Power toggle icon button */}
          <button
            onClick={onToggleLowPower}
            className={`p-2 rounded-full border transition-all cursor-pointer ${
              isLowPower
                ? 'bg-[#0becc2]/20 border-[#0becc2]/50 text-[#0becc2]'
                : 'bg-slate-900/40 border-white/10 text-slate-400 hover:text-slate-200 hover:border-white/20'
            }`}
            title={isLowPower ? 'Eco Mode Active (Static 2D)' : 'High Performance 3D Globe'}
          >
            {isLowPower ? <ZapOff className="w-3.5 h-3.5" /> : <Zap className="w-3.5 h-3.5" />}
          </button>

          {/* Take Action Outline Button with Right Chevron */}
          <button
            onClick={onTakeActionClick || (() => {
              const el = document.getElementById('get-involved');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            })}
            className="group flex items-center gap-1.5 px-5 py-2 rounded-full text-xs font-medium text-white border border-white/25 hover:border-[#0becc2]/60 bg-white/[0.03] hover:bg-[#0becc2]/10 transition-all duration-300 cursor-pointer"
          >
            <span>Take Action</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#0becc2] group-hover:translate-x-0.5 transition-all" />
          </button>
        </div>

        {/* Mobile Hamburger Toggle */}
        <div className="flex md:hidden items-center gap-2">
          <button
            onClick={onToggleLowPower}
            className="p-2 rounded-full border border-white/10 text-slate-400"
            title={isLowPower ? 'Eco Mode Active' : 'Switch to Eco Mode'}
          >
            {isLowPower ? <ZapOff className="w-4 h-4 text-emerald-400" /> : <Zap className="w-4 h-4" />}
          </button>

          <button
            onClick={() => setMobileMenuOpen(p => !p)}
            className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
            aria-label="Toggle Navigation"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-white/10 bg-[#040814]/95 backdrop-blur-2xl px-6 py-4 animate-in slide-in-from-top-2">
          <nav className="flex flex-col gap-2">
            {navLinks.map((link) => (
              <button
                key={link}
                onClick={() => {
                  setActiveTab(link);
                  setMobileMenuOpen(false);
                  if (link === 'Home') {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  } else {
                    const el = document.getElementById(link.toLowerCase().replace(/\s+/g, '-'));
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
                className={`text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === link
                    ? 'text-white bg-emerald-500/10 border-l-2 border-emerald-400'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {link}
              </button>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
};
