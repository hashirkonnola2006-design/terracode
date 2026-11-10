import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Landing } from './routes/Landing';
import { Solutions } from './routes/Solutions';
import { Clean } from './routes/Clean';
import { Quiz } from './routes/Quiz';
import { Game3 } from './routes/Game3';
import { useGameStore } from './store/gameStore';
import { PixelIntroLoader } from './components/intro/PixelIntroLoader';

// Lazy-loaded static pages (zero extra WebGL overhead)
const Terms = lazy(() => import('./routes/Terms'));
const Privacy = lazy(() => import('./routes/Privacy'));
const Sources = lazy(() => import('./routes/Sources'));
const Credits = lazy(() => import('./routes/Credits'));

if (typeof window !== 'undefined') {
  (window as any).__ECO_STORE__ = useGameStore;
}

/**
 * Scrolls window to top whenever route changes unless navigating with hash
 */
function ScrollToTop() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (!hash) {
      window.scrollTo(0, 0);
    }
  }, [pathname, hash]);
  return null;
}

/**
 * TerraHeal — Root Application Router
 *
 * Route 1 ("/")          : Landing Page ("Witness the damage")
 * Route 2 ("/solutions") : Solutions & Restoration Hub ("Learn & Choose Game")
 * Route 3 ("/clean")     : Game 1: Interactive Cleanup Mission
 * Route 4 ("/quiz")      : Game 2: Zero-Waste Knowledge Quiz
 * Route 5 ("/game-3")    : Game 3: Placeholder ("Coming Soon")
 * Route 6 ("/terms")     : Static Page: Terms
 * Route 7 ("/privacy")   : Static Page: Privacy
 * Route 8 ("/sources")   : Static Page: Sources
 * Route 9 ("/credits")   : Static Page: Credits
 */
export function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <PixelIntroLoader />
      <Suspense fallback={<div className="min-h-screen bg-[#050505]" />}>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/solutions" element={<Solutions />} />
          <Route path="/clean" element={<Clean />} />
          <Route path="/quiz" element={<Quiz />} />
          <Route path="/game-3" element={<Game3 />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/sources" element={<Sources />} />
          <Route path="/credits" element={<Credits />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
