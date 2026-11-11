/**
 * ═══════════════════════════════════════════════════════════════
 * TERRAHEAL — ZERO-WASTE QUIZ DATA & GEOGRAPHIC HEALING REGIONS
 * ═══════════════════════════════════════════════════════════════
 * 10 verified environmental questions covering waste hierarchy,
 * circular materials, composting, sorting, and hazardous recovery.
 *
 * Each question is tied to a unique geographic region on Earth.
 * When answered correctly, that region visibly heals on the 3D globe.
 */

export const QUIZ_QUESTIONS = [
  {
    id: 1,
    question: 'In the waste hierarchy, which action comes first?',
    options: ['Recycle', 'Reduce', 'Reuse', 'Burn for energy'],
    correct: 'Reduce',
    explanation: 'The best waste is the waste never created, so prevention and reduction come before reuse and recycling.',
    region: { name: 'North Pacific Gyre', lat: 32.0, lon: -145.0, radius: 0.24 },
  },
  {
    id: 2,
    question: 'Which material can be recycled again and again without losing its quality?',
    options: ['Glass', 'Plastic bottles', 'Paper', 'Styrofoam'],
    correct: 'Glass',
    explanation: 'Glass can be melted and reshaped endlessly. Paper fibres shorten with each cycle and most plastics lose quality.',
    region: { name: 'European Rhine Basin', lat: 50.0, lon: 8.5, radius: 0.24 },
  },
  {
    id: 3,
    question: 'What do you get when kitchen scraps are composted properly?',
    options: ['Nutrient-rich soil', 'Recycled plastic', 'Clean water', 'Ash'],
    correct: 'Nutrient-rich soil',
    explanation: 'Composting lets microbes break organic waste down into humus that improves soil.',
    region: { name: 'Amazon Basin Canopy', lat: -8.5, lon: -55.0, radius: 0.24 },
  },
  {
    id: 4,
    question: 'Why are loose plastic bags a problem in many recycling systems?',
    options: [
      'They tangle and jam sorting machines',
      'They are too heavy',
      'They rust',
      'They dissolve in water',
    ],
    correct: 'They tangle and jam sorting machines',
    explanation: 'Thin bags wrap around machinery and are often removed or rejected, so reuse them or use a dedicated drop-off point.',
    region: { name: 'North American Rust Belt', lat: 41.5, lon: -85.0, radius: 0.24 },
  },
  {
    id: 5,
    question: 'Which habit best fits a zero-waste lifestyle?',
    options: [
      'Carrying a reusable bottle and bag',
      'Buying water bottles in bulk',
      'Using a new bag each trip',
      'Ordering extra packaging',
    ],
    correct: 'Carrying a reusable bottle and bag',
    explanation: 'Reusables replace many single-use items over their lifetime.',
    region: { name: 'Indo-Gangetic Basin', lat: 26.5, lon: 80.0, radius: 0.24 },
  },
  {
    id: 6,
    question: 'Which greenhouse gas do landfills release as organic waste decomposes without oxygen?',
    options: ['Helium', 'Methane', 'Oxygen', 'Nitrogen'],
    correct: 'Methane',
    explanation: 'Buried food and garden waste decays without oxygen and produces methane, a potent greenhouse gas, so composting and diverting food waste help the climate.',
    region: { name: 'East Asian Manufacturing Belt', lat: 31.5, lon: 118.0, radius: 0.24 },
  },
  {
    id: 7,
    question: 'What does the number inside the triangle on a plastic item tell you?',
    options: [
      'The type of plastic resin',
      'How many times it was recycled',
      'Its price',
      'Its weight',
    ],
    correct: 'The type of plastic resin',
    explanation: 'The code identifies the plastic type, which helps recyclers sort it. It does not guarantee the item will be accepted locally.',
    region: { name: 'North Atlantic Ocean Gyre', lat: 28.0, lon: -42.0, radius: 0.24 },
  },
  {
    id: 8,
    question: 'What is the right way to dispose of an old phone or used batteries?',
    options: [
      'Put it in the normal trash',
      'Burn it',
      'Take it to an authorised e-waste collection point',
      'Bury it',
    ],
    correct: 'Take it to an authorised e-waste collection point',
    explanation: 'E-waste contains toxic and valuable materials that need proper handling and recovery.',
    region: { name: 'Congo Rainforest Corridor', lat: -1.5, lon: 22.0, radius: 0.24 },
  },
  {
    id: 9,
    question: 'Vegetable peels and leftover food belong to which waste stream?',
    options: [
      'Wet (biodegradable) waste',
      'Hazardous waste',
      'E-waste',
      'Dry recyclables',
    ],
    correct: 'Wet (biodegradable) waste',
    explanation: 'Segregating wet waste at source lets it be composted instead of contaminating recyclables or filling landfills.',
    region: { name: 'Indian Ocean Garbage Gyre', lat: -15.0, lon: 80.0, radius: 0.24 },
  },
  {
    id: 10,
    question: 'Why should food containers be rinsed before recycling?',
    options: [
      'Food residue can contaminate other recyclables',
      'It makes them heavier',
      'Recycling plants need water droplets',
      'It changes the plastic colour',
    ],
    correct: 'Food residue can contaminate other recyclables',
    explanation: 'Greasy or dirty items can spoil a whole batch of paper and plastic, so a quick rinse keeps recyclables recyclable.',
    region: { name: 'South Pacific Ocean Gyre', lat: -25.0, lon: -110.0, radius: 0.24 },
  },
];

export default QUIZ_QUESTIONS;

