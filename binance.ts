import { Pair } from '../types';

export interface LiveTickerData {
  pair: Pair;
  price: number;
  change24h: number;
  change24hPct: number;
  high24h: number;
  low24h: number;
  volume24h: number;
  timestamp: number;
}

type TickerCallback = (data: LiveTickerData) => void;

class BinanceService {
  private ws: WebSocket | null = null;
  private subscribers: Set<TickerCallback> = new Set();
  private currentPair: Pair = 'BTC/USDT.P';
  private currentPrice: number = 63991.0;
  private fallbackInterval: any = null;
  private isConnected: boolean = false;

  public subscribe(callback: TickerCallback) {
    this.subscribers.add(callback);
    // Send immediate state
    callback(this.getLatestData());
    if (this.subscribers.size === 1) {
      this.connect();
    }
    return () => {
      this.subscribers.delete(callback);
      if (this.subscribers.size === 0) {
        this.disconnect();
      }
    };
  }

  public setPair(pair: Pair) {
    this.currentPair = pair;
    if (pair.startsWith('BTC')) this.currentPrice = 63991.0;
    else if (pair.startsWith('ETH')) this.currentPrice = 3450.5;
    else if (pair.startsWith('SOL')) this.currentPrice = 182.4;
    else if (pair.startsWith('BNB')) this.currentPrice = 580.2;
    else if (pair.startsWith('XRP')) this.currentPrice = 0.625;

    this.reconnect();
  }

  private getSymbolForBinance(pair: Pair): string {
    return pair.replace('/USDT.P', 'usdt').toLowerCase();
  }

  private connect() {
    const symbol = this.getSymbolForBinance(this.currentPair);
    const streamUrl = `wss://fstream.binance.com/ws/${symbol}@ticker`;

    try {
      this.ws = new WebSocket(streamUrl);

      this.ws.onopen = () => {
        this.isConnected = true;
        this.stopFallback();
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data && data.c) {
            const price = parseFloat(data.c);
            const change24h = parseFloat(data.p || '0');
            const change24hPct = parseFloat(data.P || '0');
            const high24h = parseFloat(data.h || String(price * 1.02));
            const low24h = parseFloat(data.l || String(price * 0.98));
            const volume24h = parseFloat(data.v || '154000');

            this.currentPrice = price;

            const ticker: LiveTickerData = {
              pair: this.currentPair,
              price,
              change24h,
              change24hPct,
              high24h,
              low24h,
              volume24h,
              timestamp: Date.now(),
            };

            this.notifySubscribers(ticker);
          }
        } catch (err) {
          console.warn('Error parsing Binance websocket message:', err);
        }
      };

      this.ws.onerror = () => {
        this.startFallback();
      };

      this.ws.onclose = () => {
        this.isConnected = false;
        this.startFallback();
      };
    } catch (err) {
      this.startFallback();
    }
  }

  private disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.stopFallback();
  }

  private reconnect() {
    this.disconnect();
    if (this.subscribers.size > 0) {
      this.connect();
    }
  }

  private startFallback() {
    if (this.fallbackInterval) return;
    
    // Fallback simulated realistic crypto ticker ticking every 800ms
    this.fallbackInterval = setInterval(() => {
      const delta = (Math.random() - 0.485) * (this.currentPrice * 0.0003);
      this.currentPrice = parseFloat((this.currentPrice + delta).toFixed(2));

      const ticker: LiveTickerData = {
        pair: this.currentPair,
        price: this.currentPrice,
        change24h: 9.60,
        change24hPct: 0.015,
        high24h: this.currentPrice * 1.015,
        low24h: this.currentPrice * 0.985,
        volume24h: 234150,
        timestamp: Date.now(),
      };

      this.notifySubscribers(ticker);
    }, 800);
  }

  private stopFallback() {
    if (this.fallbackInterval) {
      clearInterval(this.fallbackInterval);
      this.fallbackInterval = null;
    }
  }

  private notifySubscribers(ticker: LiveTickerData) {
    this.subscribers.forEach((cb) => cb(ticker));
  }

  public getLatestData(): LiveTickerData {
    return {
      pair: this.currentPair,
      price: this.currentPrice,
      change24h: 9.60,
      change24hPct: 0.015,
      high24h: this.currentPrice * 1.015,
      low24h: this.currentPrice * 0.985,
      volume24h: 234150,
      timestamp: Date.now(),
    };
  }
}

export const binanceService = new BinanceService();
