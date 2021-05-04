import { Color } from './recolorize.js';
import { RemoteWorker } from './service.js';

function hexToRgb(hex: string): Color {
  let rgb: Color = [0, 0, 0];
  if ((hex.length === 4) || hex.length > 6) {
    hex = hex.substring(1);
  }
  if (hex.length === 3) {
    rgb = [
      +`0x${hex[0]}${hex[0]}`,
      +`0x${hex[1]}${hex[1]}`,
      +`0x${hex[2]}${hex[2]}`
    ];
  } else if (hex.length >= 6) {
    rgb = [
      +`0x${hex[0]}${hex[1]}`,
      +`0x${hex[2]}${hex[3]}`,
      +`0x${hex[4]}${hex[5]}`
    ];
  }
  return rgb;
}

export class RecoloredImage extends HTMLElement {
  private root: ShadowRoot;
  private _canvas?: HTMLCanvasElement;
  private _src?: string;
  private _srcColor?: Color;
  private _dstColor?: Color;
  private _i?: HTMLImageElement;
  private ignoreWhites = true;
  private ignoreBlacks = false;

  private _remote?: RemoteWorker;

  constructor() {
    super();
    this.root = this.attachShadow({ mode: 'open' });
    this.root.innerHTML = `
    <style>
      :host {
        display: inline-block;
        overflow: hidden;
      }
      .hidden {
        display: none;
      }
      .rendering {
        opacity: 0;
      }
      canvas {
        display: block;
      }
    </style>
    <canvas class="hidden"></canvas>
    `;
  }

  static get observedAttributes() {
    return [
      'src',
      'color',
      'sourcecolor'
    ]
  }

  attributeChangedCallback(name: string, _: string, newValue: string) {
    (this as any)[name] = newValue;
  }

  connectedCallback() {
    this.render();
  }

  disconnectedCallback() {
    if (this._remote) {
      this._remote.terminate();
      this._remote = undefined;
    }
  }

  get remoteService(): RemoteWorker {
    if (!this._remote) {
      this._remote = new RemoteWorker();
    }
    return this._remote;
  }

  private get canvas(): HTMLCanvasElement {
    if (!this._canvas) {
      this._canvas = this.root.querySelector('canvas')!;
    }
    return this._canvas;
  }

  set src(value: string | undefined) {
    if (this._src !== value) {
      this._src = value;
      this.render();
    }
  }

  set color(value: string | undefined) {
    if (value) {
      this._dstColor = hexToRgb(value);
    } else {
      this._dstColor = undefined;
    }
    this.render();
  }

  set sourcecolor(value: string | undefined) {
    if (value) {
      this._srcColor = hexToRgb(value);
    } else {
      this._srcColor = undefined;
    }
    this.render();
  }

  private _rendering = false;
  private async render() {
    if (this._rendering) {
      return;
    }
    this._rendering = true;
    const canvas = this.canvas;
    if (canvas) {
      if (this._src) {
        this.canvas.classList.remove('hidden');
        this.canvas.classList.add('rendering');

        const image = this._i = await this.loadImage(this._src);
        const { width, height } = image;
        this.canvas.width = width;
        this.canvas.height = height;

        const ctx = this.canvas.getContext('2d')!;
        ctx.drawImage(image, 0, 0, image.width, image.height, 0, 0, width, height);
        if (this._dstColor) {
          const sourceColor = this._srcColor || (await this.loadDominantColor(image));
          const imageData = ctx.getImageData(0, 0, width, height);
          const resultData = await this.remoteService.colorize(imageData, sourceColor, this._dstColor, this.ignoreWhites, this.ignoreBlacks);
          ctx.putImageData(resultData, 0, 0);
        }
        this.canvas.classList.remove('rendering');
      } else {
        this.canvas.classList.add('hidden');
      }
    }
    this._rendering = false;
  }

  private async loadDominantColor(image: HTMLImageElement): Promise<Color> {
    let { width, height } = image;
    if (width && height) {
      const ratio = width / height;
      if (ratio >= 1) {
        if (width > 80) {
          width = 80;
          height = width / ratio;
        }
      } else {
        if (height > 80) {
          height = 80;
          width = ratio * height;
        }
      }
    }

    const canvas = ('OffscreenCanvas' in window) ? new OffscreenCanvas(width, height) : document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(image, 0, 0, image.width, image.height, 0, 0, width, height);
    const imageData = ctx.getImageData(0, 0, width, height);
    const result = await this.remoteService.dominantColor(imageData, this.ignoreWhites, this.ignoreBlacks);
    return result;
  }

  private async loadImage(url: string): Promise<HTMLImageElement> {
    if (this._i && this._i.src === url) {
      return this._i;
    }
    return new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.crossOrigin = 'anonymous';
      image.onload = () => resolve(image);
      image.onerror = () => reject();
      image.onabort = () => reject();
      image.src = url;
    });
  }
}

customElements.define('recolored-image', RecoloredImage);