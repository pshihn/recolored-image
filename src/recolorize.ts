export type Color = [number, number, number];

function rgbToLab(color: Color): Color {
  let [r, g, b] = color;
  r /= 255;
  g /= 255;
  b /= 255;

  r = (r > 0.04045) ? Math.pow((r + 0.055) / 1.055, 2.4) : r / 12.92;
  g = (g > 0.04045) ? Math.pow((g + 0.055) / 1.055, 2.4) : g / 12.92;
  b = (b > 0.04045) ? Math.pow((b + 0.055) / 1.055, 2.4) : b / 12.92;

  let x = (r * 0.4124 + g * 0.3576 + b * 0.1805) / 0.95047;
  let y = (r * 0.2126 + g * 0.7152 + b * 0.0722) / 1.00000;
  let z = (r * 0.0193 + g * 0.1192 + b * 0.9505) / 1.08883;

  x = (x > 0.008856) ? Math.pow(x, 1 / 3) : (7.787 * x) + 16 / 116;
  y = (y > 0.008856) ? Math.pow(y, 1 / 3) : (7.787 * y) + 16 / 116;
  z = (z > 0.008856) ? Math.pow(z, 1 / 3) : (7.787 * z) + 16 / 116;

  return [
    (116 * y) - 16,
    500 * (x - y),
    200 * (y - z)
  ];
}

function labToRgb(color: Color): Color {
  const [cl, ca, cb] = color;
  let y = (cl + 16) / 116;
  let x = ca / 500 + y;
  let z = y - cb / 200;
  let [r, g, b] = [0, 0, 0];

  x = 0.95047 * ((x * x * x > 0.008856) ? x * x * x : (x - 16 / 116) / 7.787);
  y = 1.00000 * ((y * y * y > 0.008856) ? y * y * y : (y - 16 / 116) / 7.787);
  z = 1.08883 * ((z * z * z > 0.008856) ? z * z * z : (z - 16 / 116) / 7.787);

  r = x * 3.2406 + y * -1.5372 + z * -0.4986;
  g = x * -0.9689 + y * 1.8758 + z * 0.0415;
  b = x * 0.0557 + y * -0.2040 + z * 1.0570;

  r = (r > 0.0031308) ? (1.055 * Math.pow(r, 1 / 2.4) - 0.055) : 12.92 * r;
  g = (g > 0.0031308) ? (1.055 * Math.pow(g, 1 / 2.4) - 0.055) : 12.92 * g;
  b = (b > 0.0031308) ? (1.055 * Math.pow(b, 1 / 2.4) - 0.055) : 12.92 * b;

  return [
    Math.round(Math.max(0, Math.min(1, r)) * 255),
    Math.round(Math.max(0, Math.min(1, g)) * 255),
    Math.round(Math.max(0, Math.min(1, b)) * 255)
  ];
}

function colorCorrection(selectedColor: Color, targetColor: Color): Color {
  const hslStart = rgbToLab(selectedColor);
  const hslEnd = rgbToLab(targetColor);
  return [
    hslEnd[0] - hslStart[0],
    hslEnd[1] - hslStart[1],
    hslEnd[2] - hslStart[2]
  ]
}

function applyCorrection(rgb: Color, correction: Color): Color {
  const color = rgbToLab(rgb);
  const corrected: Color = [
    color[0] + correction[0],
    color[1] + correction[1],
    color[2] + correction[2]
  ]
  return labToRgb(corrected);
}

function colorAt(i: number, rgba: Uint8ClampedArray): Color {
  const offset = i * 4;
  return [rgba[offset], rgba[offset + 1], rgba[offset + 2]];
}

function setColorAt(i: number, rgba: Uint8ClampedArray, color: Color) {
  const offset = i * 4;
  rgba[offset] = color[0];
  rgba[offset + 1] = color[1];
  rgba[offset + 2] = color[2];
}

function brightness(pixel: Color): number {
  return (0.299 * pixel[0] + 0.587 * pixel[2] + 0.114 * pixel[2]) / 255;
}

export function recolorize(imageDataBuffer: ArrayBuffer, width: number, height: number, srcColor: Color, targetColor: Color, ignoreWhites: boolean, ignoreBlacks: boolean) {
  const correction = colorCorrection(srcColor, targetColor);
  const rgba = new Uint8ClampedArray(imageDataBuffer);
  for (let y = 0; y < height; ++y) {
    for (let x = 0; x < width; ++x) {
      const n = y * width + x;
      const pixel = colorAt(n, rgba);

      // If full black or full white, probably background, leaving as is
      const gray = brightness(pixel);
      if (ignoreBlacks && gray < 0.075) {
        continue;
      }
      if (ignoreWhites && gray > 0.925) {
        continue;
      }

      const corrected = applyCorrection(pixel, correction)
      setColorAt(n, rgba, corrected);
    }
  }
}

export function dominantColor(imageDataBuffer: ArrayBuffer, width: number, height: number, ignoreWhites: boolean, ignoreBlacks: boolean) {
  const map = new Map<string, number>();
  let maxCount = 0;
  let maxColor: Color = [255, 255, 255];
  const rgba = new Uint8ClampedArray(imageDataBuffer);
  for (let y = 0; y < height; ++y) {
    for (let x = 0; x < width; ++x) {
      const n = y * width + x;
      const pixel = colorAt(n, rgba);

      const gray = brightness(pixel);
      if (ignoreBlacks && gray < 0.075) {
        continue;
      }
      if (ignoreWhites && gray > 0.925) {
        continue;
      }

      const key = pixel.join(',');
      const value = (map.get(key) || 0) + 1;
      map.set(key, value);
      if (value > maxCount) {
        maxColor = pixel;
        maxCount = value;
      }
    }
  }
  return maxColor;
}