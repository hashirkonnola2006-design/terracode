import React from 'react';
import { StaticPage } from './StaticPage';

export const Credits = () => {
  return (
    <StaticPage
      title="Credits"
      dateText="Checked 10 November 2026"
      metaDescription="Credits, asset attributions, and open-source licences for TerraHeal."
    >
      <ul className="space-y-6">
        <li>
          <div>
            - <span className="text-white font-medium">Earth Textures</span>: NASA Visible Earth (Blue Marble), Public Domain, NASA Goddard Space Flight Center.{' '}
            <a
              href="https://visibleearth.nasa.gov/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--brand)] hover:underline"
            >
              visibleearth.nasa.gov
            </a>
          </div>
        </li>

        <li>
          <div>
            - <span className="text-white font-medium">Three.js</span>: 3D graphics library by Ricardo Cabello (Mr.doob) and contributors, MIT Licence.{' '}
            <a
              href="https://threejs.org/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--brand)] hover:underline"
            >
              threejs.org
            </a>
          </div>
        </li>

        <li>
          <div>
            - <span className="text-white font-medium">React Three Fiber</span>: React renderer for Three.js by Poimandres, MIT Licence.{' '}
            <a
              href="https://github.com/pmndrs/react-three-fiber"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--brand)] hover:underline"
            >
              github.com/pmndrs/react-three-fiber
            </a>
          </div>
        </li>

        <li>
          <div>
            - <span className="text-white font-medium">Procedural Noise</span>: WebGL Simplex Noise by Ian McEwan and Ashima Arts, MIT Licence.{' '}
            <a
              href="https://github.com/stegu/webgl-noise"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--brand)] hover:underline"
            >
              github.com/stegu/webgl-noise
            </a>
          </div>
        </li>

        <li>
          <div>
            - <span className="text-white font-medium">Outfit Font</span>: Typeface by Rodrigo Fuenzalida, SIL Open Font License 1.1.{' '}
            <a
              href="https://fonts.google.com/specimen/Outfit"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--brand)] hover:underline"
            >
              fonts.google.com/specimen/Outfit
            </a>
          </div>
        </li>

        <li>
          <div>
            - <span className="text-white font-medium">Barlow Font</span>: Typeface by Jeremy Tribby, SIL Open Font License 1.1.{' '}
            <a
              href="https://fonts.google.com/specimen/Barlow"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--brand)] hover:underline"
            >
              fonts.google.com/specimen/Barlow
            </a>
          </div>
        </li>

        <li>
          <div>
            - <span className="text-white font-medium">JetBrains Mono Font</span>: Typeface by JetBrains, SIL Open Font License 1.1.{' '}
            <a
              href="https://www.jetbrains.com/lp/mono/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--brand)] hover:underline"
            >
              jetbrains.com/lp/mono
            </a>
          </div>
        </li>

        <li>
          <div>
            - <span className="text-white font-medium">Pixelify Sans Font</span>: Typeface by Stefie Justprince, SIL Open Font License 1.1.{' '}
            <a
              href="https://fonts.google.com/specimen/Pixelify+Sans"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--brand)] hover:underline"
            >
              fonts.google.com/specimen/Pixelify+Sans
            </a>
          </div>
        </li>

        <li>
          <div>
            - <span className="text-white font-medium">Playfair Display Font</span>: Typeface by Claus Eggers Sørensen, SIL Open Font License 1.1.{' '}
            <a
              href="https://fonts.google.com/specimen/Playfair+Display"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--brand)] hover:underline"
            >
              fonts.google.com/specimen/Playfair+Display
            </a>
          </div>
        </li>

        <li>
          <div>
            - <span className="text-white font-medium">Lucide Icons</span>: Icon set by Lucide Contributors, ISC Licence.{' '}
            <a
              href="https://lucide.dev/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--brand)] hover:underline"
            >
              lucide.dev
            </a>
          </div>
        </li>
      </ul>

      <p className="pt-8">
        Built for TerraCode 2026. Source code available on{' '}
        <a
          href="https://github.com/hashirkonnola2006-design/terracode"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[var(--brand)] hover:underline"
        >
          GitHub
        </a>
        .
      </p>
    </StaticPage>
  );
};

export default Credits;

