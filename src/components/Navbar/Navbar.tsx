import React, { useState, useEffect } from 'react';
import { Globe, Leaf, Menu, X } from 'lucide-react';
import { LowPowerToggle } from '../Common/LowPowerToggle';

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
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 30);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { label: 'Home', href: '#' },
    { label: 'About', href: '#about' },
    { label: 'Impact', href: '#impact' },
    { label: 'Get Involved', href: '#get-involved' },
  ];

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-[#050b1a]/85 backdrop-blur-md border-b border-white/10 shadow-lg py-3'
          : 'bg-transparent py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          
          {/* Logo & Brand */}
          <a href="#" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 shadow-glow-green group-hover:scale-105 transition-transform">
              <Globe className="w-5 h-5 text-slate-950" />
            </div>
            <div className="flex flex-col">
              <span className="font-display font-bold text-base tracking-tight text-white flex items-center gap-1">
                TerraCode <Leaf className="w-3.5 h-3.5 text-emerald-400 inline" />
              </span>
              <span className="text-[10px] text-emerald-400 font-mono tracking-widest uppercase">
                Green Tomorrow
              </span>
            </div>
          </a>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center space-x-1 lg:space-x-2 bg-slate-900/60 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/5">
            {navItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="px-3.5 py-1.5 text-xs lg:text-sm font-medium text-slate-300 hover:text-emerald-400 hover:bg-white/5 rounded-full transition-all"
              >
                {item.label}
              </a>
            ))}
          </div>

          {/* Right Action Buttons */}
          <div className="hidden md:flex items-center gap-3">
            {/* Low-Power Mode Toggle Button */}
            <LowPowerToggle
              isLowPower={isLowPower}
              onToggle={onToggleLowPower}
            />

            {/* Take Action Button */}
            <button
              onClick={onTakeActionClick || (() => {
                const el = document.getElementById('take-action');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              })}
              className="px-4 py-2 rounded-full text-xs font-semibold text-slate-950 bg-gradient-to-r from-emerald-400 to-teal-300 hover:from-emerald-300 hover:to-teal-200 transition-all duration-300 shadow-glow-green hover:shadow-glow-green-lg"
            >
              Take Action
            </button>
          </div>

          {/* Mobile Menu Hamburger */}
          <div className="flex md:hidden items-center gap-2">
            <LowPowerToggle
              isLowPower={isLowPower}
              onToggle={onToggleLowPower}
            />
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

        </div>

        {/* Mobile dropdown menu */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-3 p-4 rounded-2xl bg-slate-900/95 backdrop-blur-xl border border-white/10 flex flex-col gap-3">
            {navItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 text-sm font-medium text-slate-200 hover:text-emerald-400 hover:bg-white/5 rounded-lg transition-all"
              >
                {item.label}
              </a>
            ))}
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                const el = document.getElementById('take-action');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="w-full py-2.5 rounded-xl text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 transition-all text-center"
            >
              Take Action
            </button>
          </div>
        )}

      </div>
    </nav>
  );
};
