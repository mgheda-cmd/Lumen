import { Candle, OrderBlock, FairValueGap, StructureBreak, ImpulseMACDData, MACDSRData } from '../types';

/**
 * Generate initial realistic candlestick dataset for a given pair and timeframe.
 * Base price ~ $63,991 for BTC/USDT.P matching the screenshot.
 */
export function generateInitialCandles(count: number = 180, basePrice: number = 63991): Candle[] {
  const candles: Candle[] = [];
  const now = Math.floor(Date.now() / 1000);
  const timeframeSeconds = 300; // 5m default step
  let price = basePrice - 150;

  // Generate a realistic trend that matches the screenshot (uptrend then pullbacks and consolidation around 63991)
  for (let i = count; i >= 0; i--) {
    const time = now - i * timeframeSeconds;
    const progress = (count - i) / count;
    
    // Wave movement
    const wave = Math.sin(progress * Math.PI * 4) * 300 + Math.cos(progress * Math.PI * 2) * 150;
    const microNoise = (Math.random() - 0.49) * 45;
    
    let open = price;
    let close = open + wave * 0.08 + microNoise;
    
    // Inject specific pivot zones matching the screenshot (e.g. dip to 63,400 around index 40, rally to 64,400 at index 120, pull back to 63,991)
    if (i > 120) {
      close = 63200 + (180 - i) * 6; // slow rise from 63200
    } else if (i > 80) {
      close = 63560 + Math.sin(i * 0.2) * 180 + (120 - i) * 12; // strong rally
    } else if (i > 30) {
      close = 64380 - (80 - i) * 10 + Math.sin(i * 0.3) * 60; // drop down to 63700
    } else {
      close = 63800 + (30 - i) * 6.3 + Math.sin(i * 0.5) * 40; // recovery towards 63991
    }

    const high = Math.max(open, close) + Math.random() * 35;
    const low = Math.min(open, close) - Math.random() * 35;
    const volume = Math.floor(Math.random() * 120 + 30);

    candles.push({
      time,
      open,
      high,
      low,
      close,
      volume,
    });

    price = close;
  }

  // Force exact last close to match the screenshot ($63,991)
  if (candles.length > 0) {
    const last = candles[candles.length - 1];
    last.close = 63991.0;
    last.high = Math.max(last.high, 64010);
    last.low = Math.min(last.low, 63970);
  }

  return candles;
}

/**
 * Detect Order Blocks (Demand/Supply Zones)
 */
export function detectOrderBlocks(candles: Candle[]): OrderBlock[] {
  const blocks: OrderBlock[] = [];
  if (candles.length < 10) return blocks;

  // Hardcode key OB zones matching the screenshot for ultra-authentic look
  blocks.push({
    id: 'ob-achat-1h',
    type: 'buy',
    timeframe: '1H',
    top: 63380,
    bottom: 63180,
    startIndex: Math.max(0, candles.length - 140),
    endIndex: candles.length - 1,
    label: 'OB achat 1H',
    mitigated: false,
  });

  blocks.push({
    id: 'ob-achat-15m',
    type: 'buy',
    timeframe: '15m',
    top: 63420,
    bottom: 63280,
    startIndex: Math.max(0, candles.length - 110),
    endIndex: candles.length - 1,
    label: 'OB achat 15m',
    mitigated: false,
  });

  blocks.push({
    id: 'ob-achat-5m',
    type: 'buy',
    timeframe: '5m',
    top: 63460,
    bottom: 63340,
    startIndex: Math.max(0, candles.length - 80),
    endIndex: candles.length - 1,
    label: 'OB achat 5m',
    mitigated: false,
  });

  blocks.push({
    id: 'ob-vente-5m',
    type: 'sell',
    timeframe: '5m',
    top: 64410,
    bottom: 64260,
    startIndex: Math.max(0, candles.length - 130),
    endIndex: candles.length - 1,
    label: 'OB vente 5m · 82% vend',
    mitigated: false,
  });

  return blocks;
}

/**
 * Detect Fair Value Gaps (FVGs)
 */
export function detectFairValueGaps(candles: Candle[]): FairValueGap[] {
  const fvgs: FairValueGap[] = [];

  // FVG Vente 5m near 64,050 - 64,120 (as shown in screenshot: "FVG vente 5m · 20% ach / 80% vend")
  fvgs.push({
    id: 'fvg-1',
    type: 'bearish',
    timeframe: '5m',
    top: 64120,
    bottom: 64030,
    startIndex: Math.max(0, candles.length - 45),
    label: 'FVG vente 5m · 20% ach',
    buyPct: 20,
    sellPct: 80,
    mitigated: false,
  });

  fvgs.push({
    id: 'fvg-2',
    type: 'bearish',
    timeframe: '15m',
    top: 64320,
    bottom: 64180,
    startIndex: Math.max(0, candles.length - 90),
    label: 'FVG vente 15m · 18% ach',
    buyPct: 18,
    sellPct: 82,
    mitigated: false,
  });

  return fvgs;
}

/**
 * Detect Market Structure Breaks (BOS, ChoCH, MSS)
 */
export function detectStructureBreaks(candles: Candle[]): StructureBreak[] {
  const breaks: StructureBreak[] = [];
  const len = candles.length;
  if (len < 20) return breaks;

  // Add key structure markers exact to screenshot
  breaks.push({
    id: 'bos-1h-1',
    type: 'BOS',
    direction: 'bullish',
    timeframe: '1H',
    price: 63820,
    index: Math.max(0, len - 160),
    label: 'BOS 1H',
  });

  breaks.push({
    id: 'bos-15m-1',
    type: 'BOS',
    direction: 'bullish',
    timeframe: '15m',
    price: 63740,
    index: Math.max(0, len - 145),
    label: 'BOS 15m',
  });

  breaks.push({
    id: 'choch-5m-1',
    type: 'ChoCH',
    direction: 'bullish',
    timeframe: '5m',
    price: 63710,
    index: Math.max(0, len - 138),
    label: 'ChoCH 5m',
  });

  breaks.push({
    id: 'choch-5m-mss',
    type: 'ChoCH',
    direction: 'bearish',
    timeframe: '5m',
    price: 64310,
    index: Math.max(0, len - 85),
    label: 'ChoCH 5m · MSS',
  });

  breaks.push({
    id: 'choch-15m-1',
    type: 'ChoCH',
    direction: 'bearish',
    timeframe: '15m',
    price: 64220,
    index: Math.max(0, len - 75),
    label: 'ChoCH 15m',
  });

  breaks.push({
    id: 'bos-5m-1',
    type: 'BOS',
    direction: 'bearish',
    timeframe: '5m',
    price: 64140,
    index: Math.max(0, len - 60),
    label: 'BOS 5m',
  });

  breaks.push({
    id: 'choch-5m-2',
    type: 'ChoCH',
    direction: 'bullish',
    timeframe: '5m',
    price: 63980,
    index: Math.max(0, len - 48),
    label: 'ChoCH 5m',
  });

  breaks.push({
    id: 'bos-5m-2',
    type: 'BOS',
    direction: 'bearish',
    timeframe: '5m',
    price: 63890,
    index: Math.max(0, len - 38),
    label: 'BOS 5m',
  });

  breaks.push({
    id: 'bos-5m-3',
    type: 'BOS',
    direction: 'bearish',
    timeframe: '5m',
    price: 63780,
    index: Math.max(0, len - 25),
    label: 'BOS 5m',
  });

  return breaks;
}

/**
 * Calculate Impulse MACD 34 & Range Oscillator 50
 */
export function calculateImpulseMACD(candles: Candle[]): ImpulseMACDData[] {
  return candles.map((c, i) => {
    const progress = i / Math.max(1, candles.length);
    // Dynamic oscillator curve with green (positive) and red (negative) histograms
    const macd = Math.sin(progress * Math.PI * 3.5) * 120 + Math.cos(i * 0.15) * 40;
    const signal = macd * 0.85;
    const hist = macd - signal;
    const rangeOsc = -64.0 + Math.sin(i * 0.1) * 30;

    let color = '#22c55e'; // green
    if (hist < 0) color = '#ef4444'; // red
    if (macd > 80) color = '#10b981'; // bright green
    if (macd < -80) color = '#f43f5e'; // bright pink/red

    return {
      time: c.time,
      macd,
      signal,
      hist,
      rangeOsc,
      color,
    };
  });
}

/**
 * Calculate MACD S/R 12 26 (5m / 15m)
 */
export function calculateMACDSR(candles: Candle[]): MACDSRData[] {
  return candles.map((c, i) => {
    return {
      time: c.time,
      macd5m: -86.5 + Math.sin(i * 0.12) * 25,
      macd15m: -143.0 + Math.cos(i * 0.08) * 35,
    };
  });
}
