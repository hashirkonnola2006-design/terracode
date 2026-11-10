import React from 'react';

export interface TerraHealMarkProps {
  size?: number;
  className?: string;
}

export interface TerraHealLogoProps {
  markSize?: number;
  showText?: boolean;
  textClass?: string;
  className?: string;
  onClick?: (e?: React.MouseEvent) => void;
  to?: string;
}

export declare const TerraHealMark: React.FC<TerraHealMarkProps>;
export declare const TerraHealLogo: React.FC<TerraHealLogoProps>;

export default TerraHealLogo;
