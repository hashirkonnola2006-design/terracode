import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Landing } from './routes/Landing';
import { Solutions } from './routes/Solutions';
import { Clean } from './routes/Clean';
import { Quiz } from './routes/Quiz';
import { Game3 } from './routes/Game3';

/**
 * EcoFuture — Root Application Router
 *
 * Route 1 ("/")          : Landing Page ("Witness the damage")
 * Route 2 ("/solutions") : Solutions & Restoration Hub ("Learn & Choose Game")
 * Route 3 ("/clean")     : Game 1: Interactive Cleanup Mission
 * Route 4 ("/quiz")      : Game 2: Zero-Waste Knowledge Quiz
 * Route 5 ("/game-3")    : Game 3: Placeholder ("Coming Soon")
 */
export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/solutions" element={<Solutions />} />
        <Route path="/clean" element={<Clean />} />
        <Route path="/quiz" element={<Quiz />} />
        <Route path="/game-3" element={<Game3 />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
