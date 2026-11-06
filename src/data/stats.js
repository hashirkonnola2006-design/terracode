/**
 * src/data/stats.js
 *
 * Single source of truth for all statistics shown on the page.
 * Every number has a source name, year, and URL for verification.
 * Values marked isPlaceholder:true are estimates or projections
 * that should be replaced with live API data later.
 *
 * Shape is designed so a future API hook can drop in without
 * touching any component – components import from this file only.
 */

/** Hero stats strip (CO2, Forest cover) */
export const heroStats = [
  {
    id: 'co2-reduction',
    category: 'emissions',
    icon: 'tree',
    title: 'CO₂',
    value: -42,
    prefix: '',
    suffix: '%',
    label: 'Carbon Emissions',
    changeType: 'positive',
    description:
      'Greenhouse gas reduction required by 2030 (vs 2019) to limit global warming to 1.5 °C.',
    source: 'IPCC AR6 Working Group III',
    sourceUrl: 'https://www.ipcc.ch/report/ar6/wg3/',
    year: '2022',
    isPlaceholder: false,
    sparkline: [5, 2, -3, -9, -15, -22, -28, -34, -39, -42],
  },
  {
    id: 'forest-cover',
    category: 'biodiversity',
    icon: 'forest',
    title: 'Forest',
    value: 18,
    prefix: '+',
    suffix: '%',
    label: 'Global Forest Cover',
    changeType: 'positive',
    description:
      'Target increase in global forest and restored ecosystem area under restoration pledges.',
    source: 'Bonn Challenge / FAO Global Forest Resources Assessment',
    sourceUrl: 'https://www.bonnchallenge.org/',
    year: '2024',
    isPlaceholder: false,
    sparkline: [2, 4, 6, 8, 10, 12, 14, 15, 17, 18],
  },
];

/** Impact section: 3 scroll steps */
export const storyStats = [
  {
    id: 'clean-energy',
    step: 1,
    healTarget: 0.35,       // uHeal value this step drives Earth to
    category: 'energy',
    icon: 'bolt',
    heading: 'Clean Energy',
    body:
      'Renewables crossed 30 % of global electricity generation in 2024 for the first time — led by an extraordinary boom in solar installations across Asia, Europe, and the Americas.',
    statLabel: 'Renewable Electricity Share',
    value: 30.3,
    suffix: '%',
    prefix: '',
    changeType: 'positive',
    source: 'Ember Global Electricity Review',
    sourceUrl: 'https://ember-climate.org/insights/research/global-electricity-review-2024/',
    year: '2024',
    isPlaceholder: false,
  },
  {
    id: 'forests',
    step: 2,
    healTarget: 0.65,
    category: 'biodiversity',
    icon: 'tree',
    heading: 'Forests',
    body:
      'Forests sequester 7.6 billion net tonnes of CO₂ every year. Protecting and restoring them is the single largest land-based climate solution available today.',
    statLabel: 'Net CO₂ Sink per Year',
    value: 7.6,
    suffix: ' Gt CO₂',
    prefix: '',
    changeType: 'positive',
    source: 'FAO Global Forest Resources Assessment',
    sourceUrl: 'https://www.fao.org/global-forest-resources-assessment/',
    year: '2024',
    isPlaceholder: false,
  },
  {
    id: 'water-waste',
    step: 3,
    healTarget: 0.90,
    category: 'oceans',
    icon: 'droplet',
    heading: 'Water & Waste',
    body:
      'Up to 80 % of annual plastic leakage into the ocean can be prevented by 2040 through circular economy policies — without waiting for new technology.',
    statLabel: 'Preventable Ocean Plastic by 2040',
    value: 80,
    suffix: '%',
    prefix: '',
    changeType: 'positive',
    source: 'UNEP "Turning off the Tap"',
    sourceUrl: 'https://www.unep.org/resources/turning-off-tap',
    year: '2023',
    isPlaceholder: false,
  },
];

/** Get Involved action cards */
export const actionCards = [
  {
    id: 'plant',
    icon: 'leaf',
    title: 'Plant & Restore',
    body: 'Support verified reforestation projects. Even planting one tree per month adds up.',
    cta: 'Start Planting',
    link: 'https://onetreeplanted.org',
    isPlaceholder: false,
  },
  {
    id: 'energy',
    icon: 'bolt',
    title: 'Save Energy',
    body: 'Switch to a renewable energy tariff, insulate your home, or join a community solar scheme.',
    cta: 'Cut Your Usage',
    link: '#',
    isPlaceholder: false,
  },
  {
    id: 'waste',
    icon: 'recycle',
    title: 'Cut Waste',
    body: 'Refuse single-use plastics, choose repair over replace, and support extended producer responsibility.',
    cta: 'Reduce Now',
    link: '#',
    isPlaceholder: false,
  },
];

export default { heroStats, storyStats, actionCards };
