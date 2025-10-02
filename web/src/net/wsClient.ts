export type ClientFrame =
  | { t: 'join'; matchId: string; role: 'player' | 'spectator' }
  | { t: 'action'; matchId: string; moduleId: string; a: any }
  | { t: 'ping' };

export type ServerFrame =
  | { t: 'state'; matchId: string; v: number; diff: any }
  | { t: 'event'; matchId: string; e: any }
  | { t: 'error'; code: string; msg: string }
  | { t: 'pong' };

export class WSClient {
  private ws?: WebSocket;
  private handlers: Array<(frame: ServerFrame) => void> = [];

  constructor(private url: string) {}

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        console.log('WebSocket connected');
        resolve();
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        reject(error);
      };

      this.ws.onmessage = (event) => {
        try {
          const frame: ServerFrame = JSON.parse(event.data);
          this.handlers.forEach((handler) => handler(frame));
        } catch (err) {
          console.error('Failed to parse message:', err);
        }
      };

      this.ws.onclose = () => {
        console.log('WebSocket closed');
      };
    });
  }

  send(frame: ClientFrame) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(frame));
    } else {
      console.warn('WebSocket not open, cannot send:', frame);
    }
  }

  onMessage(handler: (frame: ServerFrame) => void) {
    this.handlers.push(handler);
    return () => {
      this.handlers = this.handlers.filter((h) => h !== handler);
    };
  }

  close() {
    this.ws?.close();
  }
}
