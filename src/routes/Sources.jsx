import React from 'react';
import { StaticPage } from './StaticPage';

export const Sources = () => {
  return (
    <StaticPage
      id="sources"
      title="Sources & Methodology"
      dateText="Verified November 2026"
      metaDescription="Comprehensive scientific bibliography and primary data sources cited across the TerraHeal platform, simulations, and awareness modules."
    >
      <p className="text-white/80 leading-relaxed font-body">
        Every metric, statistic, and environmental benchmark presented in TerraHeal is drawn
        directly from peer-reviewed scientific literature and international agency assessments.
        Below is the complete bibliography cited across The Damage, Six Pillars, Your Impact, and
        the interactive simulations.
      </p>

      <ul className="space-y-8 mt-10 divide-y divide-white/10">
        {/* Source 1 */}
        <li className="pt-6 first:pt-0">
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-xs text-[#14e6c0] font-bold">[1] & [5]</span>
            <span className="text-white font-medium">UN Environment Programme (UNEP)</span> —{' '}
            <a
              href="https://www.unep.org/resources/turning-off-tap"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#14e6c0] hover:underline"
            >
              "Turning off the Tap: How the world can end plastic pollution and create a circular economy" (2023)
            </a>
          </div>
          <p className="text-sm text-white/60 pl-6 mt-1 font-body">
            Used for: Annual marine plastic leakage (11–14 million tonnes into oceans each year), single-use packaging share (&gt;40% of plastic used once), and the 80% ocean leakage reduction pathway by 2040 through circular reduction.
          </p>
        </li>

        {/* Source 2 */}
        <li className="pt-6">
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-xs text-[#14e6c0] font-bold">[2]</span>
            <span className="text-white font-medium">OECD Environment Directorate</span> —{' '}
            <a
              href="https://www.oecd.org/environment/plastics/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#14e6c0] hover:underline"
            >
              "Global Plastics Outlook: Economic Drivers, Environmental Impacts and Policy Options" (2022)
            </a>
          </div>
          <p className="text-sm text-white/60 pl-6 mt-1 font-body">
            Used for: Global plastic recycling efficiency benchmark (only 9% of all plastic waste generated worldwide is successfully recycled, with 22% evading waste management systems).
          </p>
        </li>

        {/* Source 3 */}
        <li className="pt-6">
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-xs text-[#14e6c0] font-bold">[3]</span>
            <span className="text-white font-medium">Global Carbon Project & IEA</span> —{' '}
            <a
              href="https://globalcarbonbudget.org/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#14e6c0] hover:underline"
            >
              "Global Carbon Budget 2023" & Our World in Data (2023)
            </a>
          </div>
          <p className="text-sm text-white/60 pl-6 mt-1 font-body">
            Used for: Global average per capita greenhouse gas emissions (4.7 tonnes of CO₂ equivalent per human annually, compared against the sustainable 2.0-tonne stabilization ceiling).
          </p>
        </li>

        {/* Source 4 */}
        <li className="pt-6">
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-xs text-[#14e6c0] font-bold">[4]</span>
            <span className="text-white font-medium">Food and Agriculture Organization (FAO)</span> —{' '}
            <a
              href="https://www.fao.org/forest-resources-assessment/en/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#14e6c0] hover:underline"
            >
              "Global Forest Resources Assessment (FRA 2020)" & "The State of the World's Forests" (2024)
            </a>
          </div>
          <p className="text-sm text-white/60 pl-6 mt-1 font-body">
            Used for: Global annual gross deforestation rate (10 million hectares of forest canopy destroyed each year, equivalent to the landmass of Iceland annually).
          </p>
        </li>

        {/* Source 5 */}
        <li className="pt-6">
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-xs text-[#14e6c0] font-bold">[5] & [Drawdown]</span>
            <span className="text-white font-medium">Project Drawdown</span> —{' '}
            <a
              href="https://drawdown.org/solutions"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#14e6c0] hover:underline"
            >
              "The Drawdown Review: Climate Solutions for a New Decade" (2020 / 2023 Update)
            </a>
          </div>
          <p className="text-sm text-white/60 pl-6 mt-1 font-body">
            Used for: Aggregate mitigation potential of circular waste reduction, food waste prevention, clean energy deployment, and ecosystem restoration (&gt;400 gigatonnes CO₂e avoided by 2050).
          </p>
        </li>

        {/* Source 6 */}
        <li className="pt-6">
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-xs text-[#14e6c0] font-bold">[6]</span>
            <span className="text-white font-medium">Ellen MacArthur Foundation</span> —{' '}
            <a
              href="https://www.ellenmacarthurfoundation.org/reuse-rethinking-packaging"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#14e6c0] hover:underline"
            >
              "Reuse – Rethinking Packaging: Catalysing the Reuse Revolution" (2021)
            </a>
          </div>
          <p className="text-sm text-white/60 pl-6 mt-1 font-body">
            Used for: The systemic impact of reusable packaging models, which can displace up to 20% of plastic packaging entering oceans by 2040 and reduce packaging life-cycle GHG emissions by 70%.
          </p>
        </li>

        {/* Source 7 */}
        <li className="pt-6">
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-xs text-[#14e6c0] font-bold">[7]</span>
            <span className="text-white font-medium">US Environmental Protection Agency (EPA)</span> —{' '}
            <a
              href="https://www.epa.gov/recycle"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#14e6c0] hover:underline"
            >
              "Frequent Questions on Recycling & International Aluminium Institute LCA" (2023)
            </a>
          </div>
          <p className="text-sm text-white/60 pl-6 mt-1 font-body">
            Used for: Closed-loop secondary metal smelting metrics (recycling aluminium saves 95% of the electric energy and 97% of carbon emissions compared with refining virgin bauxite).
          </p>
        </li>

        {/* Source 8 */}
        <li className="pt-6">
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-xs text-[#14e6c0] font-bold">[8]</span>
            <span className="text-white font-medium">UN Environment Programme (UNEP) & IPCC</span> —{' '}
            <a
              href="https://www.unep.org/resources/publication/food-waste-index-report-2024"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#14e6c0] hover:underline"
            >
              "Food Waste Index Report 2024: Think Eat Save" (2024) & IPCC Climate and Land Special Report
            </a>
          </div>
          <p className="text-sm text-white/60 pl-6 mt-1 font-body">
            Used for: Landfill methane generation from uneaten organic food waste (accounting for 8–10% of total global greenhouse emissions, releasing methane with 28x the warming potential of CO₂).
          </p>
        </li>

        {/* Source 9 */}
        <li className="pt-6">
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-xs text-[#14e6c0] font-bold">[9]</span>
            <span className="text-white font-medium">Ember Climate</span> —{' '}
            <a
              href="https://ember-climate.org/insights/research/global-electricity-review-2024/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#14e6c0] hover:underline"
            >
              "Global Electricity Review 2024" (2024)
            </a>
          </div>
          <p className="text-sm text-white/60 pl-6 mt-1 font-body">
            Used for: Global clean electricity milestones (renewables supplied a record 30.3% of global electricity generation in 2023, driven by solar and wind).
          </p>
        </li>

        {/* Source 10 */}
        <li className="pt-6">
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-xs text-[#14e6c0] font-bold">[10]</span>
            <span className="text-white font-medium">Harris et al., Nature Climate Change</span> —{' '}
            <a
              href="https://www.nature.com/articles/s41558-020-00976-6"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#14e6c0] hover:underline"
            >
              "Global maps of twenty-first century forest carbon fluxes" (Nature Climate Change) & Global Forest Watch
            </a>
          </div>
          <p className="text-sm text-white/60 pl-6 mt-1 font-body">
            Used for: Global net forest carbon sequestration (world forests absorb 7.6 billion metric tonnes of net CO₂ each year, approximately 1.5 times the gross emissions of the United States).
          </p>
        </li>

        {/* Source 11 */}
        <li className="pt-6">
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-xs text-[#14e6c0] font-bold">[11]</span>
            <span className="text-white font-medium">European Space Agency (ESA)</span> —{' '}
            <a
              href="https://www.esa.int/Space_Safety/Space_Debris"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#14e6c0] hover:underline"
            >
              "ESA Space Debris Office Assessment" (2024)
            </a>
          </div>
          <p className="text-sm text-white/60 pl-6 mt-1 font-body">
            Used for: Low-Earth orbit space junk counts in Cleanup Mission (&gt;36,500 fragments larger than 10 cm currently tracked in orbit).
          </p>
        </li>
      </ul>

      <div className="pt-10 mt-10 border-t border-white/10 font-mono text-xs text-white/40">
        Found an updated dataset or have questions about methodology? Email us at contact@terraheal.org.
      </div>
    </StaticPage>
  );
};

export default Sources;
