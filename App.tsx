import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Timeframe, 
  Pair, 
  Candle, 
  IndicatorSettings, 
  SessionConfig, 
  ActivePosition, 
  DrawingElement, 
  DrawingToolType,
  AccountInfo
} from './types';
import { 
  generateInitialCandles, 
  detectOrderBlocks, 
  detectFairValueGaps, 
  detectStructureBreaks, 
  calculateImpulseMACD, 
  calculateMACDSR 
} from './utils/smc';
import { binanceService, LiveTickerData } from './utils/binance';

import { Header } from './components/Header';
import { DrawingToolbar } from './components/DrawingToolbar';
import { ChartCanvas } from './components/ChartCanvas';
import { OscillatorPanel } from './components/OscillatorPanel';
import { IndicatorsModal } from './components/IndicatorsModal';
import { TradingPanel } from './components/TradingPanel';
import { Footer } from './components/Footer';

export default function App() {
  const [currentPair, setCurrentPair] = useState<Pair>('BTC/USDT.P');
  const [currentTimeframe, setCurrentTimeframe] = useState<Timeframe>('1m');
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);

  // Candles state
  const [candles, setCandles] = useState<Candle[]>(() => generateInitialCandles(180, 63991));
  const [liveTicker, setLiveTicker] = useState<LiveTickerData>(() => binanceService.getLatestData());

  // Visible view range (zoom & pan)
  const [visibleCount, setVisibleCount] = useState<number>(85);
  const [offset, setOffset] = useState<number>(0);

  // Indicator settings state matching screenshot default overlays
  const [indicators, setIndicators] = useState<IndicatorSettings>({
    showBOS: true,
    showChoCH: true,
    showFVG: true,
    showOrderBlocks: true,
    showImpulseMACD: true,
    showMACDSR: true,
    showEMAs: true,
    showSessions: true,
    showVolume: true,
  });

  // Sessions state (NY, LDN, TUN)
  const [sessions, setSessions] = useState<SessionConfig>({
    ny: true,
    ldn: true,
    tun: true,
  });

  // Drawings state
  const [activeDrawingTool, setActiveDrawingTool] = useState<DrawingToolType>('select');
  const [drawings, setDrawings] = useState<DrawingElement[]>([]);

  // Modals state
  const [isIndicatorsModalOpen, setIsIndicatorsModalOpen] = useState(false);
  const [isTradingModalOpen, setIsTradingModalOpen] = useState(false);

  // Demo Account State (Matching screenshot Equity 102 060,80 $ and PnL -95,80 $)
  const [accountInfo, setAccountInfo] = useState<AccountInfo>({
    equity: 102060.80,
    balance: 102156.60,
    isDemo: true,
  });

  // Initial Demo Position matching screenshot PnL (-95.80 $)
  const [positions, setPositions] = useState<ActivePosition[]>([
    {
      id: 'pos-1',
      pair: 'BTC/USDT.P',
      type: 'BUY',
      entryPrice: 64095.0,
      amount: 1.0,
      takeProfit: 64400.0,
      stopLoss: 63750.0,
      currentPnL: -105.40,
      time: Date.now() - 3600000,
    },
    {
      id: 'pos-2',
      pair: 'BTC/USDT.P',
      type: 'BUY',
      entryPrice: 63981.4,
      amount: 1.0,
      takeProfit: 64200.0,
      stopLoss: 63800.0,
      currentPnL: 9.60,
      time: Date.now() - 1800000,
    }
  ]);

  // Candle timer countdown (00:27 format)
  const [candleSeconds, setCandleSeconds] = useState<number>(27);

  // Subscribe to live price ticks
  useEffect(() => {
    binanceService.setPair(currentPair);
    const unsubscribe = binanceService.subscribe((ticker) => {
      setLiveTicker(ticker);

      // Update latest candle in state dynamically
      setCandles((prev) => {
        if (prev.length === 0) return prev;
        const copy = [...prev];
        const last = { ...copy[copy.length - 1] };
        
        last.close = ticker.price;
        if (ticker.price > last.high) last.high = ticker.price;
        if (ticker.price < last.low) last.low = ticker.price;
        last.volume += 1;

        copy[copy.length - 1] = last;
        return copy;
      });

      // Update live positions unrealized PnL
      setPositions((prev) => 
        prev.map((pos) => {
          if (pos.pair === ticker.pair) {
            const diff = pos.type === 'BUY' 
              ? ticker.price - pos.entryPrice 
              : pos.entryPrice - ticker.price;
            return {
              ...pos,
              currentPnL: parseFloat((diff * pos.amount).toFixed(2)),
            };
          }
          return pos;
        })
      );
    });

    return () => unsubscribe();
  }, [currentPair]);

  // Timeframe change handler
  const handleTimeframeChange = (tf: Timeframe) => {
    setCurrentTimeframe(tf);
    // Regenerate candle set appropriate for timeframe
    const basePrices: Record<Pair, number> = {
      'BTC/USDT.P': 63991,
      'ETH/USDT.P': 3450,
      'SOL/USDT.P': 182,
      'BNB/USDT.P': 580,
      'XRP/USDT.P': 0.62,
    };
    setCandles(generateInitialCandles(180, basePrices[currentPair]));
  };

  // Pair change handler
  const handlePairChange = (pair: Pair) => {
    setCurrentPair(pair);
    const basePrices: Record<Pair, number> = {
      'BTC/USDT.P': 63991,
      'ETH/USDT.P': 3450,
      'SOL/USDT.P': 182,
      'BNB/USDT.P': 580,
      'XRP/USDT.P': 0.62,
    };
    setCandles(generateInitialCandles(180, basePrices[pair]));
  };

  // Candle timer interval
  useEffect(() => {
    const timer = setInterval(() => {
      setCandleSeconds((prev) => (prev <= 0 ? 59 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const candleTimerFormatted = `00:${candleSeconds < 10 ? '0' : ''}${candleSeconds}`;

  // Smart Money Concepts & Oscillator Calculations
  const orderBlocks = useMemo(() => detectOrderBlocks(candles), [candles]);
  const fvgs = useMemo(() => detectFairValueGaps(candles), [candles]);
  const structureBreaks = useMemo(() => detectStructureBreaks(candles), [candles]);
  const impulseData = useMemo(() => calculateImpulseMACD(candles), [candles]);
  const macdSRData = useMemo(() => calculateMACDSR(candles), [candles]);

  // Account total PnL
  const totalPnL = useMemo(() => {
    return positions.reduce((acc, pos) => acc + pos.currentPnL, 0);
  }, [positions]);

  // Update Equity with live PnL
  useEffect(() => {
    setAccountInfo((prev) => ({
      ...prev,
      equity: parseFloat((prev.balance + totalPnL).toFixed(2)),
    }));
  }, [totalPnL]);

  // Trade Execution Handler
  const handleExecuteTrade = (
    type: 'BUY' | 'SELL', 
    amount: number, 
    tp?: number, 
    sl?: number
  ) => {
    const newPos: ActivePosition = {
      id: 'pos-' + Date.now(),
      pair: currentPair,
      type,
      entryPrice: liveTicker.price,
      amount,
      takeProfit: tp,
      stopLoss: sl,
      currentPnL: 0,
      time: Date.now(),
    };
    setPositions((prev) => [newPos, ...prev]);
  };

  const handleClosePosition = (id: string) => {
    const target = positions.find((p) => p.id === id);
    if (target) {
      setAccountInfo((prev) => ({
        ...prev,
        balance: parseFloat((prev.balance + target.currentPnL).toFixed(2)),
      }));
    }
    setPositions((prev) => prev.filter((p) => p.id !== id));
  };

  return (
    <div className={`w-screen h-screen flex flex-col font-sans overflow-hidden transition-colors duration-200 ${
      isDarkMode ? 'bg-[#0b1120] text-slate-100 dark' : 'bg-slate-50 text-slate-900'
    }`}>
      {/* Top Navigation Bar */}
      <Header
        currentPair={currentPair}
        onPairChange={handlePairChange}
        currentTimeframe={currentTimeframe}
        onTimeframeChange={handleTimeframeChange}
        indicators={indicators}
        onOpenIndicatorsModal={() => setIsIndicatorsModalOpen(true)}
        sessions={sessions}
        onToggleSession={(k) => setSessions((prev) => ({ ...prev, [k]: !prev[k] }))}
        livePrice={liveTicker.price}
        priceChange={liveTicker.change24h}
        priceChangePct={liveTicker.change24hPct}
        candleTimer={candleTimerFormatted}
        isDarkMode={isDarkMode}
        onToggleTheme={() => setIsDarkMode(!isDarkMode)}
        onResetChart={() => {
          setVisibleCount(85);
          setOffset(0);
        }}
        onOpenTradingModal={() => setIsTradingModalOpen(true)}
      />

      {/* Main Body (Drawing Toolbar + Chart Canvas & Sub-Oscillators) */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Drawing Toolbar */}
        <DrawingToolbar
          activeTool={activeDrawingTool}
          onSelectTool={(t) => setActiveDrawingTool(t)}
          onClearDrawings={() => setDrawings([])}
          drawingsCount={drawings.length}
          isDarkMode={isDarkMode}
        />

        {/* Chart Container */}
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          {/* Upper Main Candlestick & SMC Canvas */}
          <div className="flex-1 relative min-h-[350px]">
            <ChartCanvas
              candles={candles}
              orderBlocks={orderBlocks}
              fvgs={fvgs}
              structureBreaks={structureBreaks}
              indicators={indicators}
              sessions={sessions}
              positions={positions}
              drawings={drawings}
              onAddDrawing={(d) => setDrawings((prev) => [...prev, d])}
              activeDrawingTool={activeDrawingTool}
              visibleCount={visibleCount}
              offset={offset}
              onVisibleCountChange={(c) => setVisibleCount(c)}
              onOffsetChange={(o) => setOffset(o)}
              isDarkMode={isDarkMode}
            />
          </div>

          {/* Lower Sub-Panels (Impulse MACD & MACD S/R) */}
          {(indicators.showImpulseMACD || indicators.showMACDSR) && (
            <OscillatorPanel
              candles={candles}
              impulseData={impulseData}
              macdSRData={macdSRData}
              showImpulse={indicators.showImpulseMACD}
              showMACDSR={indicators.showMACDSR}
              visibleCount={visibleCount}
              offset={offset}
              isDarkMode={isDarkMode}
            />
          )}
        </div>
      </div>

      {/* Bottom Status & Demo Trading Footer */}
      <Footer
        accountInfo={accountInfo}
        pnl={totalPnL}
        isDarkMode={isDarkMode}
        onResetZoom={() => {
          setVisibleCount(85);
          setOffset(0);
        }}
      />

      {/* Indicators Configuration Modal */}
      <IndicatorsModal
        isOpen={isIndicatorsModalOpen}
        onClose={() => setIsIndicatorsModalOpen(false)}
        indicators={indicators}
        onToggleIndicator={(k) => setIndicators((prev) => ({ ...prev, [k]: !prev[k] }))}
        isDarkMode={isDarkMode}
      />

      {/* Demo Trading Order Terminal Drawer */}
      <TradingPanel
        isOpen={isTradingModalOpen}
        onClose={() => setIsTradingModalOpen(false)}
        currentPair={currentPair}
        livePrice={liveTicker.price}
        positions={positions}
        accountInfo={accountInfo}
        onExecuteTrade={handleExecuteTrade}
        onClosePosition={handleClosePosition}
        isDarkMode={isDarkMode}
      />
    </div>
  );
}
