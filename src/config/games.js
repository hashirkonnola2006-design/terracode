/**
 * ═══════════════════════════════════════════════════════════════
 * ECOFUTURE — GAME CATALOG CONFIGURATION
 * ═══════════════════════════════════════════════════════════════
 * Data-driven registry of all available and upcoming mini-games.
 * Adding a future game requires adding an entry here plus its route.
 */

export const GAMES = [
  {
    id: 'cleanup',
    title: 'Cleanup Mission',
    description: 'Clear trash, restore forests, convert smog sources, sweep ocean plastic.',
    route: '/clean',
    enabled: true,
    icon: 'Sparkles',
    badge: 'Game 1',
    estTime: '~3 mins',
  },
  {
    id: 'quiz',
    title: 'Zero-Waste Quiz',
    description: '10 questions on recycling, zero waste and waste management. Every correct answer heals the Earth.',
    route: '/quiz',
    enabled: true,
    icon: 'HelpCircle',
    badge: 'Game 2',
    estTime: '~2 mins',
  },
  {
    id: 'game3',
    title: 'Climate Strategy',
    description: 'A new game is on the way. Deploy global policies and green technologies.',
    route: '/game-3',
    enabled: false,
    icon: 'Lock',
    badge: 'Coming Soon',
    estTime: 'In Development',
  },
];

export default GAMES;

