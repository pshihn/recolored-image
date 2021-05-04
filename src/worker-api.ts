import { Color } from "./recolorize.js";

export interface WorkerMessage {
  id: string;
  type: 'colorize' | 'dominantColor';
  ignoreWhites: boolean;
  ignoreBlacks: boolean;
  width: number;
  height: number;
  sourceColor?: Color;
  targetColor?: Color;
  buffer: ArrayBuffer;
}

export interface WorkerMessageResponse {
  id: string;
  type: 'colorize' | 'dominantColor';
  color?: Color;
  buffer?: ArrayBuffer;
  width?: number;
  height?: number;
}