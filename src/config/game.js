/**
 * ═══════════════════════════════════════════════════════════════
 * TERRAHEAL — GAME CONFIGURATION & ENVIRONMENTAL BENCHMARKS
 * ═══════════════════════════════════════════════════════════════
 * Single source of truth for all game balancing, mission targets,
 * verified scientific facts, sources, and styling accents.
 */

export const GAME_CONFIG = {
  // Mission Target Thresholds (balanced for engaging, satisfying gameplay)
  MISSION_1_TARGET: 20,   // Floating orbit debris items to collect
  MISSION_2_TARGET: 6,    // Smog / industrial emission sources to convert (out of 8)
  MISSION_3_TARGET: 6,    // Continental forest patches to plant & restore (out of 10)
  MISSION_4_TARGET: 25,   // Percent of ocean plastic swept (25% = 1 full gyre sweeps to accessible, rewarding completion)

  // Mission Cleanliness Weights (Total = 100%)
  WEIGHT_MISSION_1: 25,   // Orbit Cleanup = 25%
  WEIGHT_MISSION_2: 25,   // Clean Energy  = 25%
  WEIGHT_MISSION_3: 25,   // Forests       = 25%
  WEIGHT_MISSION_4: 25,   // Water & Waste = 25%

  // Item Scoring & Values
  POINTS_BOTTLE: 1,
  POINTS_CAN: 1,
  POINTS_BAG: 1,
  POINTS_TIRE: 3,         // Requires hold or multi-tap
  POINTS_CRATE: 3,        // Requires hold or multi-tap
  CO2_PER_FOREST_KG: 760, // Estimated CO2 absorbed per patch (kg/year scale)

  // Timing & Interactivity
  COMBO_RESET_SECONDS: 2.2, // Combo decays after 2.2s idle
  IDLE_HINT_SECONDS: 8.0,   // Soft pulse hints appear after 8s of inactivity
  SWEEP_RADIUS_WORLD: 0.42, // Ocean plastic sweep net radius (generous tangential surface vacuum)

  // Verified Climate & Plastic Facts (shown every 3 items collected)
  COLLECTION_FACTS: [
    {
      milestone: 3,
      stat: "Over 400 million tonnes of plastic are produced globally every year.",
      source: "UN Environment Programme (UNEP)",
      year: "2024",
    },
    {
      milestone: 6,
      stat: "Less than 10% of all plastic ever manufactured has been recycled.",
      source: "OECD Global Plastics Outlook",
      year: "2023",
    },
    {
      milestone: 9,
      stat: "Clean renewables accounted for 86% of all global power capacity additions in 2023.",
      source: "IRENA Renewable Capacity Statistics",
      year: "2024",
    },
    {
      milestone: 12,
      stat: "Marine debris threatens more than 800 animal species through ingestion and entanglement.",
      source: "IUCN Marine Plastic Pollution Brief",
      year: "2024",
    },
  ],

  // Mission Complete Official Infographic Reveals
  MISSION_REVEALS: {
    1: {
      title: "Orbit & Stratosphere Clear",
      stat: "Over 36,000 fragments of debris (>10cm) currently orbit our planet.",
      detail: "Orbital cleaning protects vital weather, climate observation, and communication satellites.",
      source: "European Space Agency (ESA) Space Debris Office 2024",
      nextPrompt: "Next Mission: Convert Smog into Clean Energy",
    },
    2: {
      title: "Clean Energy Grids Online",
      stat: "Renewable Electricity Share Reached 30% Globally in 2023.",
      detail: "Solar and wind are now the fastest-growing power sources in human history, replacing fossil smog.",
      source: "Ember Global Electricity Review 2024",
      nextPrompt: "Next Mission: Reforest Degraded Continents",
    },
    3: {
      title: "Forest Canopy Restored",
      stat: "Global forests sequester 7.6 billion metric tonnes of CO2 net per year.",
      detail: "Intact forest biomes stabilize regional rainfall patterns, nurture biodiversity, and cool the soil.",
      source: "FAO Global Forest Resources Assessment 2024",
      nextPrompt: "Next Mission: Sweep Ocean Plastic Patches",
    },
    4: {
      title: "Oceans & Waterways Purified",
      stat: "Up to 80% of plastic leakage into oceans can be halted by 2040.",
      detail: "Circular economies, reuse infrastructure, and ocean barriers can end catastrophic oceanic drift.",
      source: "UNEP Turning off the Tap 2023",
      nextPrompt: "Planet Earth is Fully Restored!",
    },
  },

  // Ending Real-World Action Cards & Pledges
  PLEDGES: [
    {
      id: "pledge_trees",
      category: "Plant & Restore",
      action: "Start Planting",
      description: "Support community native reforestation projects or plant local trees in your neighborhood.",
      impact: "7.6 Gt global sequestration potential",
    },
    {
      id: "pledge_energy",
      category: "Save Energy",
      action: "Cut Your Usage",
      description: "Switch home appliances to high-efficiency ratings, opt into community solar, and reduce phantom load.",
      impact: "Up to 1.4 tonnes CO2 saved annually per household",
    },
    {
      id: "pledge_waste",
      category: "Cut Waste",
      action: "Reduce Single-Use Now",
      description: "Eliminate disposable bags, cups, and bottled water; choose bulk goods and durable reusables.",
      impact: "Cuts plastic footprint by up to 80%",
    },
  ],

  // Visual Theme Accents (TerraHeal Brand)
  COLORS: {
    brand: "#0becc2",
    accentGreen: "#0becc2",
    emeraldGlow: "#0ad0ab",
    pollutedHaze: "#887766",
    cleanAtmosphere: "#00b4ff",
    sunPolluted: "#ffcf9e",
    sunHealed: "#fff1dd",
    bgDark: "#050505",
  },
};

export default GAME_CONFIG;

