import { Color } from './recolorize.js';
import { WorkerMessage, WorkerMessageResponse } from './worker-api.js';

type PromiseResolve = (value?: ImageData | Color | PromiseLike<ImageData> | PromiseLike<Color> | undefined) => void;

const WORKER_URL = `/lib/worker.min.js`;

export class RemoteWorker {
  private worker: Worker;
  private map = new Map<string, PromiseResolve>();

  constructor() {
    this.worker = new Worker(WORKER_URL);
    this.worker.addEventListener('message', (event: MessageEvent) => {
      const response: WorkerMessageResponse = event.data;
      switch (response.type) {
        case 'colorize':
          const imageData = new ImageData(new Uint8ClampedArray(response.buffer!), response.width!, response.height!);
          this.map.get(response.id)!(imageData);
          break;
        case 'dominantColor':
          this.map.get(response.id)!(response.color!);
          break;
      }
    });
  }

  colorize(imageData: ImageData, sourceColor: Color, targetColor: Color, ignoreWhites: boolean, ignoreBlacks: boolean): Promise<ImageData> {
    const msg: WorkerMessage = {
      id: `${Date.now()}-${Math.floor(Math.random() * Number.MAX_SAFE_INTEGER)}`,
      type: 'colorize',
      ignoreBlacks,
      ignoreWhites,
      sourceColor,
      targetColor,
      width: imageData.width,
      height: imageData.height,
      buffer: imageData.data.buffer
    };
    return new Promise((resolve) => {
      this.map.set(msg.id, resolve as PromiseResolve);
      this.worker.postMessage(msg, [msg.buffer]);
    });
  }

  dominantColor(imageData: ImageData, ignoreWhites: boolean, ignoreBlacks: boolean): Promise<Color> {
    const msg: WorkerMessage = {
      id: `${Date.now()}-${Math.floor(Math.random() * Number.MAX_SAFE_INTEGER)}`,
      type: 'dominantColor',
      ignoreBlacks,
      ignoreWhites,
      width: imageData.width,
      height: imageData.height,
      buffer: imageData.data.buffer
    };
    return new Promise((resolve) => {
      this.map.set(msg.id, resolve as PromiseResolve);
      this.worker.postMessage(msg, [msg.buffer]);
    });
  }

  terminate() {
    try {
      this.worker.terminate();
    } catch (err) {
      console.log(err);
    }
  }
}