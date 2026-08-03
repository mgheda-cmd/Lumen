import React, { useState } from 'react';
import { Pair, ActivePosition, AccountInfo } from '../types';
import { X, TrendingUp, TrendingDown, DollarSign, ShieldAlert, CheckCircle, AlertCircle, ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface TradingPanelProps {
  isOpen: boolean;
  onClose: () => void;
  currentPair: Pair;
  livePrice: number;
  positions: ActivePosition[];
  accountInfo: AccountInfo;
  onExecuteTrade: (type: 'BUY' | 'SELL', amount: number, tp?: number, sl?: number) => void;
  onClosePosition: (id: string) => void;
  isDarkMode: boolean;
}

export const TradingPanel: React.FC<TradingPanelProps> = ({
  isOpen,
  onClose,
  currentPair,
  livePrice,
  positions,
  accountInfo,
  onExecuteTrade,
  onClosePosition,
  isDarkMode,
}) => {
  const [tradeType, setTradeType] = useState<'BUY' | 'SELL'>('BUY');
  const [amount, setAmount] = useState<number>(0.1); // e.g. 0.1 BTC
  const [enableTP, setEnableTP] = useState<boolean>(true);
  const [enableSL, setEnableSL] = useState<boolean>(true);
  const [tpPrice, setTpPrice] = useState<number>(Math.round(livePrice * 1.015));
  const [slPrice, setSlPrice] = useState<number>(Math.round(livePrice * 0.992));

  if (!isOpen) return null;

  const totalValue = amount * livePrice;
  const estimatedRisk = enableSL ? Math.abs((livePrice - slPrice) * amount) : totalValue * 0.05;
  const estimatedReward = enableTP ? Math.abs((tpPrice - livePrice) * amount) : totalValue * 0.1;
  const riskRewardRatio = estimatedRisk > 0 ? (estimatedReward / estimatedRisk).toFixed(2) : '1.0';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onExecuteTrade(
      tradeType,
      amount,
      enableTP ? tpPrice : undefined,
      enableSL ? slPrice : undefined
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/50 backdrop-blur-xs p-4 animate-fade-in">
      <div 
        className={`w-full max-w-md h-full max-h-[92vh] rounded-2xl shadow-2xl border flex flex-col overflow-hidden ${
          isDarkMode ? 'bg-[#0f172a] border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-800'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <h3 className="font-extrabold text-base">Terminal de Trading DÉMO</h3>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1">
          {/* Account Summary Banner */}
          <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <div>
              <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Équité DÉMO</div>
              <div className="text-base font-mono font-bold text-emerald-400">
                {accountInfo.equity.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} $
              </div>
            </div>
            <div className="text-right">
              <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Positions Ouvertes</div>
              <div className="text-sm font-mono font-bold text-slate-200">
                {positions.length}
              </div>
            </div>
          </div>

          {/* Trade Type Switcher (ACHAT / VENTE) */}
          <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => {
                setTradeType('BUY');
                setTpPrice(Math.round(livePrice * 1.015));
                setSlPrice(Math.round(livePrice * 0.992));
              }}
              className={`py-2 rounded-lg font-bold text-sm flex items-center justify-center space-x-1.5 transition ${
                tradeType === 'BUY'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              <span>ACHETER / LONG</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setTradeType('SELL');
                setTpPrice(Math.round(livePrice * 0.985));
                setSlPrice(Math.round(livePrice * 1.008));
              }}
              className={`py-2 rounded-lg font-bold text-sm flex items-center justify-center space-x-1.5 transition ${
                tradeType === 'SELL'
                  ? 'bg-rose-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <TrendingDown className="w-4 h-4" />
              <span>VENDRE / SHORT</span>
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                Taille de la position (Titre / BTC)
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max="100"
                  value={amount}
                  onChange={(e) => setAmount(parseFloat(e.target.value) || 0.01)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-mono text-sm font-bold text-emerald-400 focus:outline-none focus:border-emerald-500"
                />
                <span className="absolute right-3 top-2.5 text-xs text-slate-500 font-bold">
                  {currentPair.split('/')[0]}
                </span>
              </div>
              <div className="text-[11px] text-slate-500 mt-1 flex justify-between">
                <span>Valeur estimée:</span>
                <span className="font-mono text-slate-300 font-semibold">{totalValue.toFixed(2)} $</span>
              </div>
            </div>

            {/* Take Profit Toggle & Input */}
            <div className="space-y-2 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-emerald-500 flex items-center space-x-1">
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  <span>Take Profit (TP)</span>
                </label>
                <input
                  type="checkbox"
                  checked={enableTP}
                  onChange={(e) => setEnableTP(e.target.checked)}
                  className="w-4 h-4 rounded accent-emerald-500 cursor-pointer"
                />
              </div>
              {enableTP && (
                <input
                  type="number"
                  step="1"
                  value={tpPrice}
                  onChange={(e) => setTpPrice(parseFloat(e.target.value) || livePrice)}
                  className="w-full px-3 py-1.5 rounded bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-mono text-xs text-slate-200"
                />
              )}
            </div>

            {/* Stop Loss Toggle & Input */}
            <div className="space-y-2 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-rose-500 flex items-center space-x-1">
                  <ArrowDownRight className="w-3.5 h-3.5" />
                  <span>Stop Loss (SL)</span>
                </label>
                <input
                  type="checkbox"
                  checked={enableSL}
                  onChange={(e) => setEnableSL(e.target.checked)}
                  className="w-4 h-4 rounded accent-rose-500 cursor-pointer"
                />
              </div>
              {enableSL && (
                <input
                  type="number"
                  step="1"
                  value={slPrice}
                  onChange={(e) => setSlPrice(parseFloat(e.target.value) || livePrice)}
                  className="w-full px-3 py-1.5 rounded bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-mono text-xs text-slate-200"
                />
              )}
            </div>

            {/* Risk / Reward Metrics */}
            <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/60 text-xs space-y-1">
              <div className="flex justify-between text-slate-400">
                <span>Ratio Risque / Récompense:</span>
                <span className="font-mono font-bold text-amber-400">{riskRewardRatio} R</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Risque Estimé:</span>
                <span className="font-mono text-rose-400">-{estimatedRisk.toFixed(2)} $</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Gain Estimé:</span>
                <span className="font-mono text-emerald-400">+{estimatedReward.toFixed(2)} $</span>
              </div>
            </div>

            <button
              type="submit"
              className={`w-full py-3 rounded-xl font-bold text-white text-base shadow-lg transition transform active:scale-98 ${
                tradeType === 'BUY'
                  ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/20'
                  : 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/20'
              }`}
            >
              Exécuter Ordre {tradeType === 'BUY' ? 'Achat' : 'Vente'}
            </button>
          </form>

          {/* Active Positions List */}
          <div className="space-y-2 pt-3 border-t border-slate-200 dark:border-slate-800">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Positions Actives ({positions.length})
            </h4>

            {positions.length === 0 ? (
              <p className="text-xs text-slate-500 italic py-2 text-center">Aucune position ouverte</p>
            ) : (
              positions.map((pos) => {
                const isPosBuy = pos.type === 'BUY';
                const pnl = pos.currentPnL;
                const isPnlPos = pnl >= 0;

                return (
                  <div
                    key={pos.id}
                    className="p-3 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="flex items-center space-x-1.5 font-bold">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                          isPosBuy ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                        }`}>
                          {pos.type}
                        </span>
                        <span>{pos.amount} {pos.pair.split('/')[0]}</span>
                      </div>
                      <div className="text-[10px] text-slate-500 mt-1 font-mono">
                        Entrée: {pos.entryPrice.toFixed(2)} $
                      </div>
                    </div>

                    <div className="text-right">
                      <div className={`font-mono font-bold ${isPnlPos ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {isPnlPos ? '+' : ''}{pnl.toFixed(2)} $
                      </div>
                      <button
                        onClick={() => onClosePosition(pos.id)}
                        className="mt-1 px-2 py-0.5 rounded text-[10px] bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition"
                      >
                        Fermer
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
