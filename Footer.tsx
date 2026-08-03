import React from 'react';
import { AccountInfo } from '../types';
import { Briefcase, ArrowUpRight, ArrowDownRight, Compass, MousePointer } from 'lucide-react';

interface FooterProps {
  accountInfo: AccountInfo;
  pnl: number;
  isDarkMode: boolean;
  onResetZoom: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  accountInfo,
  pnl,
  isDarkMode,
  onResetZoom,
}) => {
  const isPnLPos = pnl >= 0;

  return (
    <footer className={`h-8 border-t flex items-center justify-between px-3 text-xs select-none font-mono transition-colors duration-200 ${
      isDarkMode 
        ? 'bg-[#0f172a] border-[#1e293b] text-slate-300' 
        : 'bg-white border-slate-200 text-slate-700'
    }`}>
      {/* Left Demo & Equity */}
      <div className="flex items-center space-x-3">
        {/* Demo Badge */}
        <div className="flex items-center space-x-1.5 px-2 py-0.5 rounded bg-amber-500/10 text-amber-500 border border-amber-500/20 text-[11px] font-bold">
          <Briefcase className="w-3.5 h-3.5" />
          <span>DÉMO</span>
        </div>

        {/* Equity */}
        <div className="flex items-center space-x-1">
          <span className="text-slate-400 font-sans">Équité</span>
          <span className="font-bold text-slate-100">
            {accountInfo.equity.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} $
          </span>
        </div>

        {/* Total PnL */}
        <div className="flex items-center space-x-1">
          <span className="text-slate-400 font-sans">PnL</span>
          <span className={`font-bold flex items-center ${isPnLPos ? 'text-emerald-400' : 'text-rose-400'}`}>
            {isPnLPos ? <ArrowUpRight className="w-3 h-3 mr-0.5" /> : <ArrowDownRight className="w-3 h-3 mr-0.5" />}
            {isPnLPos ? '+' : ''}{pnl.toFixed(2)} $
          </span>
        </div>
      </div>

      {/* Center / Right Shortcuts & Source matching screenshot bottom bar */}
      <div className="hidden md:flex items-center space-x-4 text-[11px] text-slate-400 font-sans">
        <button 
          onClick={onResetZoom}
          className="hover:text-emerald-400 transition cursor-pointer flex items-center space-x-1"
        >
          <MousePointer className="w-3 h-3" />
          <span>Molette : zoom</span>
        </button>

        <span>Glisser : déplacer</span>

        <div className="h-3 w-px bg-slate-700" />

        <span className="text-slate-500">
          Source : Binance — flux public temps réel
        </span>
      </div>
    </footer>
  );
};
