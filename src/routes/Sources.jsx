import React from 'react';
import { StaticPage } from './StaticPage';

// VERIFY: FAO year, IUCN 14 Mt figure and year, 7.6 Gt attribution

export const Sources = () => {
  return (
    <StaticPage
      id="sources"
      title="Sources"
      dateText="Checked 10 November 2026"
      metaDescription="Scientific and environmental data sources cited across the TerraHeal platform and quiz."
    >
      <p>
        Every number shown in TerraHeal and the quiz comes from one of these.
      </p>

      <ul className="space-y-6 mt-8">
        <li>
          <div>
            - <span className="text-white font-medium">UNEP "Turning off the Tap"</span> (2023) —{' '}
            <a
              href="https://www.unep.org/resources/turning-off-tap"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--brand)] hover:underline"
            >
              UN Environment Programme
            </a>
          </div>
          <p className="text-sm text-[#8a8a8a] pl-4 mt-1">
            Used for: ocean plastic reduction target (80% preventable by 2040) and global plastic production figures.
          </p>
        </li>

        <li>
          <div>
            - <span className="text-white font-medium">Ember Global Electricity Review</span> (2024) —{' '}
            <a
              href="https://ember-climate.org/insights/research/global-electricity-review-2024/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--brand)] hover:underline"
            >
              Ember Climate
            </a>
          </div>
          <p className="text-sm text-[#8a8a8a] pl-4 mt-1">
            Used for: global renewable electricity milestone (30.3% share).
          </p>
        </li>

        <li>
          <div>
            - <span className="text-white font-medium">FAO Forest Resources Assessment</span> (2024) —{' '}
            <a
              href="https://www.fao.org/global-forest-resources-assessment/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--brand)] hover:underline"
            >
              Food and Agriculture Organization of the United Nations
            </a>
          </div>
          <p className="text-sm text-[#8a8a8a] pl-4 mt-1">
            Used for: global forest net carbon absorption (7.6 Gt CO2 per year) and restoration targets.
          </p>
        </li>

        <li>
          <div>
            - <span className="text-white font-medium">IPCC Climate and Land Special Report</span> (AR6 Working Group III) —{' '}
            <a
              href="https://www.ipcc.ch/report/ar6/wg3/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--brand)] hover:underline"
            >
              Intergovernmental Panel on Climate Change
            </a>
          </div>
          <p className="text-sm text-[#8a8a8a] pl-4 mt-1">
            Used for: 1.5 °C emission reduction pathways and land mitigation potential.
          </p>
        </li>

        <li>
          <div>
            - <span className="text-white font-medium">ESA Space Debris Office</span> (2024) —{' '}
            <a
              href="https://www.esa.int/Space_Safety/Space_Debris"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--brand)] hover:underline"
            >
              European Space Agency
            </a>
          </div>
          <p className="text-sm text-[#8a8a8a] pl-4 mt-1">
            Used for: orbital debris object count (over 36,000 fragments larger than 10 cm).
          </p>
        </li>

        <li>
          <div>
            - <span className="text-white font-medium">IRENA Renewable Capacity Statistics</span> (2024) —{' '}
            <a
              href="https://www.irena.org/Publications/2024/Mar/Renewable-capacity-statistics-2024"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--brand)] hover:underline"
            >
              International Renewable Energy Agency
            </a>
          </div>
          <p className="text-sm text-[#8a8a8a] pl-4 mt-1">
            Used for: renewable share in global power capacity additions (86% in 2023).
          </p>
        </li>

        <li>
          <div>
            - <span className="text-white font-medium">OECD Global Plastics Outlook</span> (2023) —{' '}
            <a
              href="https://www.oecd.org/environment/plastics/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--brand)] hover:underline"
            >
              OECD
            </a>
          </div>
          <p className="text-sm text-[#8a8a8a] pl-4 mt-1">
            Used for: lifetime plastic recycling rate benchmark (under 10%).
          </p>
        </li>

        <li>
          <div>
            - <span className="text-white font-medium">IUCN Marine Plastic Pollution Brief</span> (2024) —{' '}
            <a
              href="https://www.iucn.org/resources/issues-brief/marine-plastic-pollution"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--brand)] hover:underline"
            >
              International Union for Conservation of Nature
            </a>
          </div>
          <p className="text-sm text-[#8a8a8a] pl-4 mt-1">
            Used for: marine species affected by plastic entanglement and ingestion (over 800 species).
          </p>
        </li>
      </ul>

      <p className="pt-8">
        Spotted an error? [CONTACT EMAIL].
      </p>
    </StaticPage>
  );
};

export default Sources;
