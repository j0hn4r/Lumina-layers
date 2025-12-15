export enum BlendMode {
  NORMAL = 'normal',
  AVERAGE = 'average',
  MULTIPLY = 'multiply',
  SCREEN = 'screen',
  OVERLAY = 'overlay',
  DARKEN = 'darken',
  LIGHTEN = 'lighten',
  COLOR_DODGE = 'color-dodge',
  COLOR_BURN = 'color-burn',
  HARD_LIGHT = 'hard-light',
  SOFT_LIGHT = 'soft-light',
  DIFFERENCE = 'difference',
  EXCLUSION = 'exclusion',
  HUE = 'hue',
  SATURATION = 'saturation',
  COLOR = 'color',
  LUMINOSITY = 'luminosity',
}

export interface Layer {
  id: string;
  url: string;
  blendMode: BlendMode;
  opacity: number;
  isVisible: boolean;
  name: string;
  isLoading: boolean;
}

export interface Preset {
  id: string;
  name: string;
  timestamp: number;
  layers: Layer[];
}