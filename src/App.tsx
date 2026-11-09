import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Landing } from './routes/Landing';
import { Clean } from './routes/Clean';

/**
 * EcoFuture — Root Application Router
 *
 * Route 1 ("/")      : Landing Page ("Witness the damage")
 * Route 2 ("/clean") : Interactive Cleaning Game ("Heal it yourself")
 */
export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/clean" element={<Clean />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
