import React, { useState } from 'react';
import { Timeframe, Pair, IndicatorSettings, SessionConfig } from '../types';
import { 
  ChevronDown, 
  Sun, 
  Moon, 
  Activity, 
  Sliders, 
  Eye, 
  Maximize2, 
  Zap, 
  Crosshair, 
  PenTool,
  RotateCcw
} from 'lucide-react';

interface HeaderProps {
  currentPair: Pair;
  onPairChange: (pair: Pair) => void;
  currentTimeframe: Timeframe;
  onTimeframeChange: (tf: Timeframe) => void;
  indicators: IndicatorSettings;
  onOpenIndicatorsModal: () => void;
  sessions: SessionConfig;
  onToggleSession: (sessionKey: keyof SessionConfig) => void;
  livePrice: number;
  priceChange: number;
  priceChangePct: number;
  candleTimer: string;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  onResetChart: () => void;
  onOpenTradingModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentPair,
  onPairChange,
  currentTimeframe,
  onTimeframeChange,
  indicators,
  onOpenIndicatorsModal,
  sessions,
  onToggleSession,
  livePrice,
  priceChange,
  priceChangePct,
  candleTimer,
  isDarkMode,
  onToggleTheme,
  onResetChart,
  onOpenTradingModal,
}) => {
  const [isPairDropdownOpen, setIsPairDropdownOpen] = useState(false);

  const pairs: Pair[] = [
    'BTC/USDT.P',
    'ETH/USDT.P',
    'SOL/USDT.P',
    'BNB/USDT.P',
    'XRP/USDT.P',
  ];

  const timeframes: Timeframe[] = ['1m', '3m', '5m', '15m', '1H', '1J'];

  const formattedPrice = livePrice.toLocaleString('fr-FR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const isPositive = priceChange >= 0;

  return (
    <header className={`h-12 border-b flex items-center justify-between px-3 select-none text-xs transition-colors duration-200 ${
      isDarkMode 
        ? 'bg-[#0f172a] border-[#1e293b] text-slate-200' 
        : 'bg-white border-slate-200 text-slate-800'
    }`}>
      {/* Left group: Logo, Live Badge, Pair Selector, Timeframes */}
      <div className="flex items-center space-x-2">
        {/* Logo */}
        <div className="flex items-center space-x-1.5 mr-1 font-bold text-sm tracking-tight text-emerald-500 dark:text-emerald-400">
          <Activity className="w-5 h-5 text-emerald-500 animate-pulse" />
          <span className="bg-gradient-to-r from-emerald-500 to-cyan-500 bg-clip-text text-transparent font-extrabold">
            Lumen Charts
          </span>
        </div>

        {/* Live Badge */}
        <div className="flex items-center space-x-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
          <span>EN DIRECT</span>
        </div>

        <div className="h-4 w-px bg-slate-300 dark:bg-slate-700 mx-1" />

        {/* Pair Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsPairDropdownOpen(!isPairDropdownOpen)}
            className={`flex items-center space-x-1 px-2.5 py-1 rounded font-semibold border transition ${
              isDarkMode 
                ? 'bg-slate-800/80 border-slate-700 hover:border-slate-600 text-slate-100' 
                : 'bg-slate-100 border-slate-200 hover:border-slate-300 text-slate-800'
            }`}
          >
            <span>{currentPair}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {isPairDropdownOpen && (
            <div className={`absolute top-full left-0 mt-1 w-36 rounded-md shadow-xl border z-50 py-1 ${
              isDarkMode ? 'bg-slate-900 border-slate-700 text-slate-200' : 'bg-white border-slate-200 text-slate-800'
            }`}>
              {pairs.map((p) => (
                <button
                  key={p}
                  onClick={() => {
                    onPairChange(p);
                    setIsPairDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3 py-1.5 text-xs flex items-center justify-between hover:bg-emerald-500/10 hover:text-emerald-400 ${
                    currentPair === p ? 'font-bold text-emerald-500' : ''
                  }`}
                >
                  <span>{p}</span>
                  {currentPair === p && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Timeframes */}
        <div className="flex items-center space-x-0.5 bg-slate-100 dark:bg-slate-800/60 p-0.5 rounded border border-slate-200 dark:border-slate-700/60">
          {timeframes.map((tf) => (
            <button
              key={tf}
              onClick={() => onTimeframeChange(tf)}
              className={`px-2 py-0.5 rounded text-xs font-medium transition-all ${
                currentTimeframe === tf
                  ? 'bg-blue-600 text-white shadow-sm font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              {tf}
            </button>
          ))}
        </div>

        <div className="h-4 w-px bg-slate-300 dark:bg-slate-700 mx-1" />

        {/* Indicators Trigger */}
        <button
          onClick={onOpenIndicatorsModal}
          className={`flex items-center space-x-1.5 px-2.5 py-1 rounded border font-medium transition ${
            isDarkMode
              ? 'bg-slate-800/80 border-slate-700 hover:bg-slate-800 text-slate-200'
              : 'bg-slate-100 border-slate-200 hover:bg-slate-200 text-slate-800'
          }`}
        >
          <span className="font-serif italic text-emerald-500 font-bold text-sm">fx</span>
          <span>Indicateurs</span>
        </button>

        {/* Quick chart actions */}
        <button
          onClick={onResetChart}
          title="Réinitialiser la vue du graphique"
          className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Middle/Right group: Sessions, Live Price, Controls */}
      <div className="flex items-center space-x-3">
        {/* Sessions (NY, LDN, TUN) */}
        <div className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-800/80 p-0.5 rounded border border-slate-200 dark:border-slate-700">
          <button
            onClick={() => onToggleSession('ny')}
            className={`px-2 py-0.5 rounded text-[11px] font-bold transition ${
              sessions.ny 
                ? 'bg-amber-500/20 text-amber-500 border border-amber-500/40' 
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            NY
          </button>
          <button
            onClick={() => onToggleSession('ldn')}
            className={`px-2 py-0.5 rounded text-[11px] font-bold transition ${
              sessions.ldn 
                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/40' 
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            LDN
          </button>
          <button
            onClick={() => onToggleSession('tun')}
            className={`px-2 py-0.5 rounded text-[11px] font-bold transition ${
              sessions.tun 
                ? 'bg-cyan-500 text-white shadow-sm font-extrabold' 
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            TUN
          </button>
        </div>

        {/* Trade Drawer button */}
        <button
          onClick={onOpenTradingModal}
          className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center space-x-1 shadow-sm transition"
        >
          <Zap className="w-3.5 h-3.5 fill-current" />
          <span>Trader</span>
        </button>

        {/* Theme Toggle */}
        <button
          onClick={onToggleTheme}
          className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition"
          title="Changer le thème"
        >
          {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
        </button>

        {/* Live Ticker Stats Header matching screenshot top-right */}
        <div className="flex items-center space-x-2 pl-2 border-l border-slate-300 dark:border-slate-700">
          <div className="text-right">
            <div className={`text-sm font-extrabold font-mono leading-none ${
              isPositive ? 'text-emerald-500' : 'text-rose-500'
            }`}>
              {formattedPrice}
            </div>
            <div className="text-[10px] text-slate-400 flex items-center justify-end space-x-1 mt-0.5">
              <span className={isPositive ? 'text-emerald-400' : 'text-rose-400'}>
                {isPositive ? '+' : ''}{priceChange.toFixed(2)} $ ({isPositive ? '+' : ''}{(priceChangePct * 100).toFixed(2)} %)
              </span>
            </div>
          </div>

          {/* Candle countdown timer (e.g. 00:27) */}
          <div className="px-2 py-1 rounded bg-slate-200 dark:bg-slate-800 text-[11px] font-mono text-slate-400 font-semibold border border-slate-300 dark:border-slate-700">
            {candleTimer}
          </div>
        </div>
      </div>
    </header>
  );
};
