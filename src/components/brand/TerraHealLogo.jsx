import React from 'react';
import { useNavigate } from 'react-router-dom';
import { navigateWithTransition } from '../../utils/navigation';

/**
 * TerraHeal — Official Brand Mark & Wordmark
 *
 * Mark: 18x17 pixel-art globe (crisp square <rect> pixels)
 * Wordmark: Live text in Pixelify Sans ("Terra" in #ffffff, "Heal" in #0becc2)
 */
export const TerraHealMark = ({ size = 28, className = '' }) => {
  return (
    <svg
      viewBox="0 0 18 17"
      width={size}
      height={Math.round(size * (17 / 18))}
      className={`shrink-0 select-none ${className}`}
      style={{ shapeRendering: 'crispEdges', imageRendering: 'pixelated' }}
      aria-hidden="true"
    >
      {/* Row 0 */}
      <rect x="6" y="0" width="5" height="1" fill="#ffffff" />
      <rect x="11" y="0" width="1" height="1" fill="#0becc2" />
      {/* Row 1 */}
      <rect x="4" y="1" width="3" height="1" fill="#ffffff" />
      <rect x="7" y="1" width="2" height="1" fill="#0becc2" />
      <rect x="9" y="1" width="2" height="1" fill="#ffffff" />
      <rect x="11" y="1" width="3" height="1" fill="#0becc2" />
      {/* Row 2 */}
      <rect x="3" y="2" width="2" height="1" fill="#ffffff" />
      <rect x="5" y="2" width="2" height="1" fill="#0becc2" />
      <rect x="7" y="2" width="1" height="1" fill="#ffffff" />
      <rect x="8" y="2" width="1" height="1" fill="#0becc2" />
      <rect x="9" y="2" width="1" height="1" fill="#ffffff" />
      <rect x="10" y="2" width="1" height="1" fill="#0becc2" />
      <rect x="11" y="2" width="1" height="1" fill="#ffffff" />
      <rect x="12" y="2" width="2" height="1" fill="#0becc2" />
      <rect x="14" y="2" width="1" height="1" fill="#ffffff" />
      {/* Row 3 */}
      <rect x="2" y="3" width="2" height="1" fill="#ffffff" />
      <rect x="4" y="3" width="2" height="1" fill="#0becc2" />
      <rect x="6" y="3" width="1" height="1" fill="#ffffff" />
      <rect x="7" y="3" width="6" height="1" fill="#0becc2" />
      <rect x="13" y="3" width="3" height="1" fill="#ffffff" />
      <rect x="16" y="3" width="1" height="1" fill="#0becc2" />
      {/* Row 4 */}
      <rect x="1" y="4" width="4" height="1" fill="#ffffff" />
      <rect x="5" y="4" width="1" height="1" fill="#0becc2" />
      <rect x="6" y="4" width="2" height="1" fill="#ffffff" />
      <rect x="8" y="4" width="4" height="1" fill="#0becc2" />
      <rect x="12" y="4" width="1" height="1" fill="#ffffff" />
      <rect x="13" y="4" width="1" height="1" fill="#0becc2" />
      <rect x="14" y="4" width="2" height="1" fill="#ffffff" />
      <rect x="16" y="4" width="1" height="1" fill="#0becc2" />
      {/* Row 5 */}
      <rect x="0" y="5" width="1" height="1" fill="#0becc2" />
      <rect x="1" y="5" width="6" height="1" fill="#ffffff" />
      <rect x="7" y="5" width="6" height="1" fill="#0becc2" />
      <rect x="13" y="5" width="4" height="1" fill="#ffffff" />
      <rect x="17" y="5" width="1" height="1" fill="#0becc2" />
      {/* Row 6 */}
      <rect x="0" y="6" width="1" height="1" fill="#0becc2" />
      <rect x="1" y="6" width="5" height="1" fill="#ffffff" />
      <rect x="6" y="6" width="10" height="1" fill="#0becc2" />
      <rect x="16" y="6" width="2" height="1" fill="#ffffff" />
      {/* Row 7 */}
      <rect x="0" y="7" width="2" height="1" fill="#0becc2" />
      <rect x="2" y="7" width="1" height="1" fill="#ffffff" />
      <rect x="3" y="7" width="1" height="1" fill="#0becc2" />
      <rect x="4" y="7" width="1" height="1" fill="#ffffff" />
      <rect x="5" y="7" width="7" height="1" fill="#0becc2" />
      <rect x="12" y="7" width="6" height="1" fill="#ffffff" />
      {/* Row 8 */}
      <rect x="0" y="8" width="2" height="1" fill="#0becc2" />
      <rect x="2" y="8" width="2" height="1" fill="#ffffff" />
      <rect x="4" y="8" width="1" height="1" fill="#0becc2" />
      <rect x="5" y="8" width="1" height="1" fill="#ffffff" />
      <rect x="6" y="8" width="5" height="1" fill="#0becc2" />
      <rect x="11" y="8" width="7" height="1" fill="#ffffff" />
      {/* Row 9 */}
      <rect x="0" y="9" width="3" height="1" fill="#0becc2" />
      <rect x="3" y="9" width="2" height="1" fill="#ffffff" />
      <rect x="5" y="9" width="6" height="1" fill="#0becc2" />
      <rect x="11" y="9" width="7" height="1" fill="#ffffff" />
      {/* Row 10 */}
      <rect x="0" y="10" width="4" height="1" fill="#0becc2" />
      <rect x="4" y="10" width="4" height="1" fill="#ffffff" />
      <rect x="8" y="10" width="6" height="1" fill="#0becc2" />
      <rect x="14" y="10" width="3" height="1" fill="#ffffff" />
      <rect x="17" y="10" width="1" height="1" fill="#0becc2" />
      {/* Row 11 */}
      <rect x="1" y="11" width="3" height="1" fill="#0becc2" />
      <rect x="4" y="11" width="5" height="1" fill="#ffffff" />
      <rect x="9" y="11" width="5" height="1" fill="#0becc2" />
      <rect x="14" y="11" width="3" height="1" fill="#ffffff" />
      {/* Row 12 */}
      <rect x="1" y="12" width="4" height="1" fill="#0becc2" />
      <rect x="5" y="12" width="4" height="1" fill="#ffffff" />
      <rect x="9" y="12" width="5" height="1" fill="#0becc2" />
      <rect x="14" y="12" width="3" height="1" fill="#ffffff" />
      {/* Row 13 */}
      <rect x="2" y="13" width="4" height="1" fill="#0becc2" />
      <rect x="6" y="13" width="2" height="1" fill="#ffffff" />
      <rect x="8" y="13" width="6" height="1" fill="#0becc2" />
      <rect x="14" y="13" width="2" height="1" fill="#ffffff" />
      {/* Row 14 */}
      <rect x="3" y="14" width="3" height="1" fill="#0becc2" />
      <rect x="6" y="14" width="1" height="1" fill="#ffffff" />
      <rect x="7" y="14" width="7" height="1" fill="#0becc2" />
      <rect x="14" y="14" width="1" height="1" fill="#ffffff" />
      {/* Row 15 */}
      <rect x="4" y="15" width="2" height="1" fill="#0becc2" />
      <rect x="6" y="15" width="1" height="1" fill="#ffffff" />
      <rect x="7" y="15" width="7" height="1" fill="#0becc2" />
      {/* Row 16 */}
      <rect x="6" y="16" width="6" height="1" fill="#0becc2" />
    </svg>
  );
};

export const TerraHealLogo = ({
  markSize = 28,
  showText = true,
  textClass = 'text-xl sm:text-2xl',
  className = '',
  onClick = undefined,
  to = '/',
}) => {
  const navigate = useNavigate();

  const handleClick = (e) => {
    if (onClick) {
      onClick(e);
    } else if (to) {
      navigateWithTransition(to, navigate);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label="TerraHeal Home"
      className={`group inline-flex items-center gap-2.5 bg-transparent border-0 p-0 text-left cursor-pointer transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98] ${className}`}
    >
      <TerraHealMark size={markSize} className="transition-transform group-hover:rotate-3" />
      {showText && (
        <span
          className={`font-display font-extrabold tracking-tight leading-none select-none ${textClass}`}
          style={{ fontFamily: "'Outfit', 'Montserrat', sans-serif", letterSpacing: '-0.03em' }}
        >
          <span className="text-white">Terra</span>
          <span className="text-[#14e6c0]">Heal</span>
        </span>
      )}
    </button>
  );
};

export default TerraHealLogo;
