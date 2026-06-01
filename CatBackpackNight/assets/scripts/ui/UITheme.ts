import { Color } from 'cc';

export const DESIGN_WIDTH = 750;
export const DESIGN_HEIGHT = 1334;

export function colorFromHex(hex: string, alpha = 255): Color {
  const value = hex.replace('#', '');
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  return new Color(r, g, b, alpha);
}

export const UIColors = {
  buttonGold: colorFromHex('#F6B332'),
  highlightGold: colorFromHex('#FFE28A'),
  wood: colorFromHex('#5A331F'),
  woodStroke: colorFromHex('#2A160D'),
  woodLight: colorFromHex('#8A5430'),
  woodDark: colorFromHex('#3A2115'),
  parchment: colorFromHex('#F1D3A2'),
  parchmentLight: colorFromHex('#FFE5B6'),
  parchmentDark: colorFromHex('#C8955D'),
  darkPanel: colorFromHex('#171A18'),
  darkPanelSoft: colorFromHex('#26322D'),
  nightBlue: colorFromHex('#071A2C'),
  skyBlue: colorFromHex('#0D3561'),
  forestDark: colorFromHex('#052617'),
  successGreen: colorFromHex('#67A936'),
  successGreenDark: colorFromHex('#345F20'),
  actionBlue: colorFromHex('#3186B8'),
  warningRed: colorFromHex('#E33F2F'),
  purpleGem: colorFromHex('#A752FF'),
  blueGem: colorFromHex('#31A8FF'),
  campfireOrange: colorFromHex('#FF7A1A'),
  textBrown: colorFromHex('#4B2A19'),
  mutedText: colorFromHex('#BDA88C'),
  disabled: colorFromHex('#8A8174'),
  whiteText: colorFromHex('#FFF8E8'),
};

export function clamp01(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.max(0, Math.min(1, value));
}

export function formatCompactNumber(value: number): string {
  if (!Number.isFinite(value)) {
    return '0';
  }
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(value >= 10000000 ? 0 : 1)}M`;
  }
  if (value >= 10000) {
    return `${(value / 1000).toFixed(value >= 100000 ? 0 : 1)}K`;
  }
  return `${Math.floor(value)}`;
}

export function badgeLabel(count?: number | boolean): string {
  if (count === true) {
    return '!';
  }
  if (typeof count !== 'number' || count <= 0) {
    return '';
  }
  return count > 99 ? '99+' : `${count}`;
}
