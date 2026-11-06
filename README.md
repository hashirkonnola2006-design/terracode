# 🌱 EcoFuture (TerraCode) — Green Tomorrow: Building a Sustainable Future

An interactive 3D scroll-driven planetary healing experience built for the web development competition themed **"Green Tomorrow - Building a Sustainable Future"**.

---

## 🌍 The Concept & Visual Experience

The site features a cinematic, centered hero anchored by a full 3D Earth:
- **Polluted Initial State (`uHeal = 0.0`)**: Desaturated, parched gray-brown continents with procedural cellular cracks, toxic dark sludge oceans with oily sheen streaks, industrial soot speckles, and a dense rotating smog layer.
- **Organic Healing Wave (`0.0 < uHeal < 1.0`)**: 3D simplex and FBM noise organically spreads vitality outward in living ripples, highlighted by a radiant bio-luminescent emerald green wave front (`#4ADE80`).
- **Healed Paradise (`uHeal = 1.0`)**: Crisp, lush green continents, sparkling sapphire and coastal cyan oceans, dynamic drifting cloud systems, and a glowing cyan-green protective ozone layer.
- **Floating Leaf Particles**: Subtle bio-luminescent spores and leaves awaken and orbit the globe as planetary restoration takes root.

---

## 🍃 Sustainable Digital Architecture

- **Low Data Footprint**: Small, optimized 2K NASA Blue Marble textures (<1.2 MB total) combined with 100% procedural GLSL math for cracks, oil slicks, smog, wave fronts, and atmospheric scattering.
- **Eco / Low-Power Mode**: One-click toggle in the navbar swaps the 3D WebGL scene for a zero-GPU vector SVG/CSS representation, saving battery and cutting energy usage.
- **Hardware-Capped DPR**: Device Pixel Ratio is capped at `2` (reduced on mobile devices) to eliminate excess GPU rasterization work.
- **Reduced Motion Support**: Automatically adheres to `prefers-reduced-motion`.

---

## 📊 Data Layer (`src/data/stats.js`)

All statistical metrics are stored as structured plain objects in `src/data/stats.js` with documented sources, years, and baselines:
- **CO₂ Reduction Pathway**: `-42%` required global greenhouse gas reduction by 2030 (IPCC Sixth Assessment Report AR6 / Working Group III, 2023).
- **Global Forest Cover Target**: `+18%` global forest and ecosystem restoration target (UN Strategic Plan for Forests / Bonn Challenge & FAO, 2024).
- **Renewable Electricity Share**: `30.3%` record milestone (Ember Global Electricity Review / IEA, 2024).
- **Ocean Plastic Reduction**: `80%` achievable leakage cut by 2040 through circular economy systems (UNEP "Turning off the Tap" / World Bank Open Data, 2023).

---

## 🔬 Reference Repository & Shader Analysis (`eschota/SECS`)

**Evaluation of `eschota/SECS`:**
- **Architecture**: `eschota/SECS` is a Unity High Definition Render Pipeline (HDRP) project written in **C# and Unity ShaderLab/HLSL**.
- **Utility for Three.js/WebGL**: It is **not directly portable** to Three.js or WebGL due to Unity-specific matrix conventions, include libraries, and C# runtime scripts. Porting it blindly would introduce bloated boilerplate and breaking bugs.
- **Conceptual Insight**: The conceptual technique of multi-layered planetary rendering (sampling day/night diffuse maps, specular ocean masks for glint, a secondary offset cloud sphere, and Fresnel atmosphere limb shaders) is universal celestial graphics technique. We have written our own custom GLSL implementation in native Three.js / R3F without copying or porting any Unity C# code.

---

## 📜 Credits & Attributions

- **Three.js Earth Atmosphere & Clouds Example**:
  - Source: [Mr.doob / Three.js Examples](https://github.com/mrdoob/three.js/tree/master/examples)
  - Authors: Ricardo Cabello (Mr.doob) and Three.js contributors
  - License: MIT License
  - Assets Used: Compressed 2K Blue Marble Day, Specular, Normal, and Cloud textures.
- **Simplex Noise in GLSL**:
  - Authors: Stefan Gustavson and Ashima Arts
  - License: MIT License
- **Open Data Sources**:
  - Intergovernmental Panel on Climate Change (IPCC) AR6
  - United Nations Food and Agriculture Organization (FAO)
  - United Nations Environment Programme (UNEP)
  - Ember Climate / International Energy Agency (IEA)
  - Open-Meteo Air Quality Open Data API

---

## 🛠️ How to Run Locally

```bash
# Clone the repository
git clone https://github.com/terracode/green-tomorrow.git
cd terracode

# Install dependencies
npm install

# Run development server
npm run dev
```

Visit `http://localhost:5173/` in your browser.

> **Tip for Judges / Dev Mode**: Append `?debug=1` to the URL (e.g. `http://localhost:5173/?debug=1`) to access the real-time `uHeal` shader debugging slider.
