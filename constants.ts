import { BlendMode } from './types';

export const BLEND_MODES: { value: BlendMode; label: string }[] = [
  { value: BlendMode.NORMAL, label: 'Normal' },
  { value: BlendMode.AVERAGE, label: 'Average' },
  { value: BlendMode.MULTIPLY, label: 'Multiply' },
  { value: BlendMode.SCREEN, label: 'Screen' },
  { value: BlendMode.OVERLAY, label: 'Overlay' },
  { value: BlendMode.DARKEN, label: 'Darken' },
  { value: BlendMode.LIGHTEN, label: 'Lighten' },
  { value: BlendMode.SOFT_LIGHT, label: 'Soft Light' },
  { value: BlendMode.HARD_LIGHT, label: 'Hard Light' },
  { value: BlendMode.DIFFERENCE, label: 'Difference' },
  { value: BlendMode.EXCLUSION, label: 'Exclusion' },
  { value: BlendMode.COLOR_DODGE, label: 'Color Dodge' },
  { value: BlendMode.COLOR_BURN, label: 'Color Burn' },
  { value: BlendMode.HUE, label: 'Hue' },
  { value: BlendMode.SATURATION, label: 'Saturation' },
  { value: BlendMode.COLOR, label: 'Color' },
  { value: BlendMode.LUMINOSITY, label: 'Luminosity' },
];

export const INITIAL_LAYERS_COUNT = 4;
export const IMAGE_WIDTH = 1200;
export const IMAGE_HEIGHT = 1600; // Portrait orientation