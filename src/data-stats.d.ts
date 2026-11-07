export interface HeroStat {
  id: string;
  category: string;
  icon: string;
  title: string;
  value: number;
  prefix: string;
  suffix: string;
  label: string;
  changeType: string;
  description: string;
  source: string;
  sourceUrl: string;
  year: string;
  isPlaceholder: boolean;
  sparkline: number[];
}

export interface StoryStat {
  id: string;
  step: number;
  healTarget: number;
  category: string;
  icon: string;
  heading: string;
  body: string;
  statLabel: string;
  value: number;
  suffix: string;
  prefix: string;
  changeType: string;
  source: string;
  sourceUrl: string;
  year: string;
  isPlaceholder: boolean;
}

export interface ActionCardItem {
  id: string;
  icon: string;
  title: string;
  body: string;
  cta: string;
  link: string;
  isPlaceholder: boolean;
}

declare module './data/stats.js' {
  export const heroStats: HeroStat[];
  export const storyStats: StoryStat[];
  export const actionCards: ActionCardItem[];
}

