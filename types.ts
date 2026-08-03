export type Timeframe = '1m' | '3m' | '5m' | '15m' | '1H' | '1J';

export type Pair = 'BTC/USDT.P' | 'ETH/USDT.P' | 'SOL/USDT.P' | 'BNB/USDT.P' | 'XRP/USDT.P';

export interface Candle {
  time: number; // Unix timestamp in seconds
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface OrderBlock {
  id: string;
  type: 'buy' | 'sell'; // buy = demand block (cyan/blue), sell = supply block (red/pink)
  timeframe: string; // '5m', '15m', '1H'
  top: number;
  bottom: number;
  startIndex: number;
  endIndex: number;
  label: string; // e.g. "OB achat 5m" or "OB achat 1H"
  mitigated: boolean;
}

export interface FairValueGap {
  id: string;
  type: 'bullish' | 'bearish';
  timeframe: string;
  top: number;
  bottom: number;
  startIndex: number;
  label: string; // e.g. "FVG vente 5m · 20% ach / 80% vend"
  buyPct: number;
  sellPct: number;
  mitigated: boolean;
}

export interface StructureBreak {
  id: string;
  type: 'BOS' | 'ChoCH' | 'MSS';
  direction: 'bullish' | 'bearish';
  timeframe: string;
  price: number;
  index: number;
  label: string; // e.g. "BOS 5m", "ChoCH 15m"
}

export interface ImpulseMACDData {
  time: number;
  macd: number;
  signal: number;
  hist: number;
  rangeOsc: number;
  color: string;
}

export interface MACDSRData {
  time: number;
  macd5m: number;
  macd15m: number;
}

export interface IndicatorSettings {
  showBOS: boolean;
  showChoCH: boolean;
  showFVG: boolean;
  showOrderBlocks: boolean;
  showImpulseMACD: boolean;
  showMACDSR: boolean;
  showEMAs: boolean;
  showSessions: boolean;
  showVolume: boolean;
}

export interface SessionConfig {
  ny: boolean;  // New York
  ldn: boolean; // London
  tun: boolean; // Tunis / UTC+1
}

export interface ActivePosition {
  id: string;
  pair: Pair;
  type: 'BUY' | 'SELL';
  entryPrice: number;
  amount: number; // e.g. BTC size
  takeProfit?: number;
  stopLoss?: number;
  currentPnL: number;
  time: number;
}

export interface PendingOrder {
  id: string;
  pair: Pair;
  type: 'BUY_LIMIT' | 'SELL_LIMIT' | 'BUY_STOP' | 'SELL_STOP';
  targetPrice: number;
  amount: number;
  takeProfit?: number;
  stopLoss?: number;
  time: number;
}

export type DrawingToolType = 'select' | 'trendline' | 'horizontal' | 'rectangle' | 'fib' | 'text' | 'ruler';

export interface DrawingElement {
  id: string;
  type: DrawingToolType;
  p1: { time: number; price: number };
  p2?: { time: number; price: number };
  color?: string;
  text?: string;
}

export interface AccountInfo {
  equity: number;
  balance: number;
  isDemo: boolean;
}
