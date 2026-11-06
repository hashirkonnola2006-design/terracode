# 🌱 TerraCode — Green Tomorrow: Building a Sustainable Future

An interactive 3D scroll-driven planetary healing experience built for the web development competition themed **"Green Tomorrow - Building a Sustainable Future"**.

---

## 🌍 The Concept

In the hero state, Earth is depicted in a state of severe environmental distress: parched cracked ground, dark toxic oceans with oily sheens, industrial blight, microplastic debris, and suffocating smog clouds.

As the user scrolls (or interacts with the healing controls), Earth undergoes an organic restoration process:
- **Simplex/FBM Noise Wave**: Rather than an artificial linear gradient or fade, healing spreads outward in organic fractal waves across continents and seas.
- **Bio-luminescent Energy Frontier**: A glowing emerald-green edge (`#4ADE80`) traces the active boundary between degraded and revitalized ecosystems.
- **Volumetric Smog Dissipation**: Toxic particulate haze gradually dissolves into crystal-clear clean atmosphere.
- **Atmospheric Transition**: The outer atmospheric corona shifts from an acidic reddish-brown smog aura to a radiant cyan-green ozone shield.
- **Ecological Revival**: Once healing crosses critical biomes, orbiting leaf and bio-luminescent spore particles emerge, celebrating planetary regeneration.

---

## 🍃 Sustainability Architecture (Digital Carbon Neutrality)

Web applications often consume significant energy due to massive asset transfers and unconstrained GPU rendering loops. TerraCode is engineered to embody the competition's sustainability theme in code:

1. **Zero Bitmap Image Textures**:
   - Standard 3D Earth applications download 20MB–50MB of high-resolution diffuse, specular, normal, and night-light texture maps.
   - TerraCode generates continents, oceans, coastlines, mountains, cracked soil, trash speckles, and clouds **100% procedurally in GLSL shaders**.
   - Result: Initial payload is under **100 KB** (over 99% reduction in data transfer carbon emissions).
2. **Eco / Low-Power Mode**:
   - An instant toggle completely unmounts the WebGL canvas, replacing it with a zero-GPU vector SVG/CSS representation.
   - Saves laptop/mobile battery and reduces peak electrical wattage.
3. **Hardware-Capped Device Pixel Ratio**:
   - DPR is strictly capped at `2` (or lower on mobile) to eliminate unnecessary rasterization overhead.
4. **Accessibility & Prefers-Reduced-Motion**:
   - Automatically detects user motion preferences and scales down particle counts and heavy camera transitions.

---

## 🛠️ Tech Stack (100% Open Source)

- **Core Framework**: [React 19](https://react.dev/) + [Vite](https://vitejs.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **3D Graphics & Shaders**: [Three.js](https://threejs.org/) + [@react-three/fiber](https://docs.pmnd.rs/react-three-fiber/) + [@react-three/drei](https://github.com/pmndrs/drei)
- **Animation & Scroll Mechanics**: [GSAP](https://gsap.com/) + ScrollTrigger
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Deployment**: Optimized for Vercel edge deployment

---

## 📊 Real Open Data Sources

TerraCode is committed to scientific accuracy: every metric is sourced from verified open climate databases:
- **Atmospheric CO₂ Concentrations**: NOAA Global Monitoring Laboratory / Mauna Loa Observatory
- **Global Renewable Electricity Generation**: Ember Global Electricity Review / IEA
- **Forest Cover & Tree Loss Trends**: Global Forest Watch / UN Food and Agriculture Organization (FAO)
- **Ocean Plastics & Waste Reduction**: United Nations Environment Programme (UNEP) / World Bank Open Data

---

## 🚀 Getting Started Locally

### Prerequisites
- Node.js 18+ (tested on Node v24)
- npm or pnpm

### Installation
```bash
# Clone the repository
git clone https://github.com/terracode/green-tomorrow.git
cd terracode

# Install dependencies
npm install

# Start local development server
npm run dev
```

Visit `http://localhost:5173` in your browser.

### Production Build
```bash
npm run build
npm run preview
```

---

## 📝 Commit Convention

Commit history follows Conventional Commits:
- `feat:` New interactive features or sections
- `style:` Design, typography, and visual polish
- `fix:` Bug fixes, shader math adjustments, and responsive fixes
- `docs:` Documentation and architecture explanations
