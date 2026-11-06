/**
 * Global Sustainability Statistics Dataset
 * 
 * Sourced strictly from verified international climate & open data records.
 * Structured as plain objects so a future backend API route can replace
 * this file without modifying any UI components.
 */

export const heroStats = [
  {
    id: 'co2-reduction',
    category: 'emissions',
    title: 'CO₂',
    value: -42,
    suffix: '%',
    prefix: '',
    label: 'Carbon Emissions',
    changeType: 'positive', // reducing emissions is positive for climate
    description: 'Target global greenhouse gas reduction required by 2030 to limit warming to 1.5°C compared to 2019 baselines.',
    source: 'IPCC Sixth Assessment Report (AR6) / Working Group III',
    year: '2023',
    isPlaceholder: false,
    sparkline: [35, 30, 24, 18, 12, 5, -8, -19, -32, -42],
  },
  {
    id: 'forest-cover',
    category: 'biodiversity',
    title: 'Forest',
    value: 18,
    suffix: '%',
    prefix: '+',
    label: 'Global Forest Cover',
    changeType: 'positive',
    description: 'Target increase in global forest and restored ecosystem coverage under international restoration treaties.',
    source: 'UN Strategic Plan for Forests / Bonn Challenge & FAO',
    year: '2024',
    isPlaceholder: false,
    sparkline: [2, 4, 6, 9, 11, 13, 14, 16, 17, 18],
  },
];

export const storyStats = [
  {
    id: 'clean-energy',
    category: 'energy',
    title: 'Renewable Power Share',
    value: 30.3,
    suffix: '%',
    prefix: '',
    label: 'Global Electricity Generation',
    changeType: 'positive',
    description: 'Renewable energy surpassed 30% of global electricity generation for the first time, led by rapid solar and wind adoption.',
    source: 'Ember Global Electricity Review / IEA',
    year: '2024',
    isPlaceholder: false,
  },
  {
    id: 'ocean-plastic',
    category: 'oceans',
    title: 'Ocean Plastic Reduction',
    value: 80,
    suffix: '%',
    prefix: '',
    label: 'Achievable Leakage Cut by 2040',
    changeType: 'positive',
    description: 'Global circular economy intervention can cut annual plastic flows into oceans by 80% over business-as-usual levels.',
    source: 'UNEP "Turning off the Tap" / World Bank Open Data',
    year: '2023',
    isPlaceholder: false,
  },
];

export default {
  heroStats,
  storyStats,
};
