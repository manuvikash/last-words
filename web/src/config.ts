declare global {
  interface Window {
    __CONFIG__: {
      WS_URL: string;
      HTTP_URL: string;
    };
  }
}

export const config = {
  wsUrl: window.__CONFIG__?.WS_URL || 'wss://REPLACE',
  httpUrl: window.__CONFIG__?.HTTP_URL || 'https://REPLACE',
};
