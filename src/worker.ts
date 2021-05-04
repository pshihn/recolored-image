import { recolorize, dominantColor } from './recolorize.js';
import { WorkerMessage, WorkerMessageResponse } from './worker-api.js';

self.onmessage = async (event: MessageEvent) => {
  const msg: WorkerMessage = event.data;
  switch (msg.type) {
    case 'colorize': {
      recolorize(msg.buffer, msg.width, msg.height, msg.sourceColor!, msg.targetColor!, msg.ignoreWhites, msg.ignoreBlacks);
      const response: WorkerMessageResponse = {
        id: msg.id,
        type: msg.type,
        buffer: msg.buffer,
        width: msg.width,
        height: msg.height
      };
      (self as any as Worker).postMessage(response, [msg.buffer]);
      break;
    }
    case 'dominantColor': {
      const color = dominantColor(msg.buffer, msg.width, msg.height, msg.ignoreWhites, msg.ignoreBlacks);
      const response: WorkerMessageResponse = {
        id: msg.id,
        type: msg.type,
        color
      };
      (self as any as Worker).postMessage(response);
      break;
    }
  }
};