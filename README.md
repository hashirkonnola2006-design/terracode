# 🌱 EcoFuture (TerraCode) — Green Tomorrow: Building a Sustainable Future

An interactive 3D scroll-driven planetary healing experience built for the web development competition themed **"Green Tomorrow - Building a Sustainable Future"**.

---

## 🌍 The Concept & Visual Experience

A single full 3D Earth stays anchored throughout the entire experience:
- **Hero State (`uHeal = 0.0`)**: Real NASA Blue Marble continents desaturated to dry parched gray-brown, cracked soil fissures, dark oily sludge oceans with subtle rainbow sheen, and a rotating smog cloud layer. A strong directional sun from the upper-left creates a soft terminator line falling into shadow.
- **Scroll-Driven Narrative**: As the user scrolls down, the Earth slowly spins with scroll-velocity-responsive momentum and transitions smoothly:
  - **Hero**: Centered, large, fully visible beneath the navbar.
  - **Stats & About**: Centered, slightly smaller.
  - **Impact Steps**: Slides gracefully to the right (Step 1), left (Step 2), and right (Step 3), positioning the planet opposite the glassmorphism narrative cards.
  - **Healed Moment**: Slides back to center, expanding with a radiant cyan-green ozone glow as `uHeal` reaches `1.0`.
  - **Get Involved & Footer**: Centered, calm, and fully restored.
- **Organic Healing Wave**: Multi-octave FBM noise sweeps across continents and seas, bounded by a thin glowing emerald green laser/energy wavefront (`#4ADE80`).
- **Healed State (`uHeal = 1.0`)**: Lush emerald vegetation, crystal sapphire-to-cyan oceans, clean white cumulus clouds, and orbiting bio-luminescent leaf particles.

---

## 🔬 Shader Diagnostics & Root Cause Analysis

1. **Surface Glitch (Black, White, and Gold Blobs)**:
   - **Root Cause**: `earth_clouds_1024.png` was an 8-bit indexed palette ('P' mode) image with a 255-entry transparency table. Sampling `.r` in WebGL returned raw color palette indices rather than clean alpha. Furthermore, three separate overlapping meshes (the base sphere with procedural noise, a standard material cloud sphere, and a redundant `SmogLayer` mesh with golden sulfur colors) were z-fighting and compounding the artifacts.
   - **Resolution**: Replaced with a clean 2K RGBA cloud texture (`earth_clouds.png`) with true transparency, unified cloud rendering into a single rotating sphere, and cleaned the base shader to sample pristine 2K cloudless Blue Marble albedo, normal/bump, and ocean specular maps.
2. **Solid Gray Ring (Atmosphere Shell)**:
   - **Root Cause**: On the `BackSide` atmosphere sphere, `viewDir` pointed toward the camera while surface normals on the far hemisphere pointed away from the camera, making `dot(wn, viewDir)` negative across the entire visible hemisphere. The calculation `pow(1.0 - max(dot, 0.0), 4.0)` evaluated to `pow(1.0 - 0.0, 4.0) = 1.0` everywhere, creating a solid opaque disk.
   - **Resolution**: Corrected the BackSide Fresnel formula: `float facing = dot(wn, -viewDir); float rim = pow(1.0 - clamp(facing, 0.0, 1.0), 3.8);`. The atmosphere is now completely transparent at the center (`alpha = 0`) and glows softly only along the outer limb/corona with `AdditiveBlending`.
3. **Earth Disappearing After Hero**:
   - **Root Cause**: The canvas was previously nested inside `HeroSection`, and lower sections used opaque CSS background gradients (`bg-[#030712]`, `bg-[#040a16]`) that covered the viewport when scrolling.
   - **Resolution**: Pinned `<EarthCanvas>` in a `fixed inset-0 z-0 pointer-events-none` container, and set all section containers to transparent backgrounds (`bg-transparent`) with glass cards on top.

---

## 🍃 Sustainable Digital Architecture

- **Low Data Footprint**: Small, optimized 2K textures (~1.4 MB total) combined with procedural GLSL math for wave propagation, parched cracks, and atmosphere scattering.
- **Eco / Low-Power Mode**: Instant toggle in the navbar swaps the 3D WebGL scene for a zero-GPU vector SVG/CSS representation, reducing CPU/GPU wattage.
- **Hardware-Capped DPR**: Device Pixel Ratio is capped at `2` (and reduced on mobile devices).
- **Reduced Motion Support**: Automatically adheres to `prefers-reduced-motion` (idle rotation only, no scroll spin).

---

## 📊 Data Layer (`src/data/stats.js`)

All statistical metrics are stored as plain objects with sources, years, and verification links:
- **CO₂ Reduction Pathway**: `-42%` required global greenhouse gas reduction by 2030 (IPCC Sixth Assessment Report AR6 / Working Group III, 2022).
- **Global Forest Cover Target**: `+18%` global forest and ecosystem restoration target (Bonn Challenge / UN FAO, 2024).
- **Renewable Electricity Share**: `30.3%` record milestone (Ember Global Electricity Review / IEA, 2024).
- **Ocean Plastic Reduction**: `80%` achievable leakage cut by 2040 through circular economy systems (UNEP "Turning off the Tap" / World Bank Open Data, 2023).

---

## 📜 Credits & Attributions

- **Three.js Earth Atmosphere & Clouds Example**:
  - Authors: Ricardo Cabello (Mr.doob) and Three.js contributors (MIT License).
  - Assets Used: Compressed 2K Blue Marble Day (`earth_day_2048.jpg`), Specular (`earth_specular_2048.jpg`), and Normal (`earth_normal_2048.jpg`) maps.
- **Simplex Noise in GLSL**:
  - Authors: Stefan Gustavson and Ashima Arts (MIT License).
- **Open Data Sources**:
  - Intergovernmental Panel on Climate Change (IPCC) AR6
  - United Nations Food and Agriculture Organization (FAO)
  - United Nations Environment Programme (UNEP)
  - Ember Climate / International Energy Agency (IEA)

---

## 🚀 How to Run Locally & Deploy

### Run Locally
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

> **Telemetry / Dev Slider**: Append `?debug=1` to the URL (e.g. `http://localhost:5173/?debug=1`) to open the live scroll progress readout, velocity tracker, and manual `uHeal` override slider.

### Deploy to Vercel
The repository includes a ready-to-deploy [`vercel.json`](file:///c:/Users/Lenovo/Documents/terracode/vercel.json) configuration:
```bash
# Deploy with Vercel CLI
npx vercel

# Or push to GitHub and import directly in the Vercel Dashboard
```
