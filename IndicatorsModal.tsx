import React from 'react';
import { IndicatorSettings } from '../types';
import { X, Check, Eye, Sliders, Layers, Sparkles } from 'lucide-react';

interface IndicatorsModalProps {
  isOpen: boolean;
  onClose: () => void;
  indicators: IndicatorSettings;
  onToggleIndicator: (key: keyof IndicatorSettings) => void;
  isDarkMode: boolean;
}

export const IndicatorsModal: React.FC<IndicatorsModalProps> = ({
  isOpen,
  onClose,
  indicators,
  onToggleIndicator,
  isDarkMode,
}) => {
  if (!isOpen) return null;

  const items: { key: keyof IndicatorSettings; title: string; category: string; description: string; badge?: string }[] = [
    {
      key: 'showBOS',
      title: 'Break of Structure (BOS)',
      category: 'Smart Money Concepts',
      description: 'Affiche les cassures de structure de marché sur 5m, 15m, 1H.',
      badge: 'SMC',
    },
    {
      key: 'showChoCH',
      title: 'Change of Character (ChoCH / MSS)',
      category: 'Smart Money Concepts',
      description: 'Détecte le retournement de structure et le Market Structure Shift.',
      badge: 'SMC',
    },
    {
      key: 'showFVG',
      title: 'Fair Value Gaps (FVG)',
      category: 'Smart Money Concepts',
      description: 'Identifie les déséquilibres de liquidité (e.g. 20% acheteurs / 80% vendeurs).',
      badge: 'SMC',
    },
    {
      key: 'showOrderBlocks',
      title: 'Order Blocks (OB Achat / Vente)',
      category: 'Smart Money Concepts',
      description: 'Affiche les zones d’institutionnels (Demand & Supply) multi-timeframes.',
      badge: 'SMC',
    },
    {
      key: 'showImpulseMACD',
      title: 'Impulse MACD 34 & Range Oscillator 50',
      category: 'Oscillateurs',
      description: 'Module d’impulsion de tendance avec histogramme dynamique et support/résistance.',
      badge: 'Propriétaire',
    },
    {
      key: 'showMACDSR',
      title: 'MACD S/R 12 26 (5m / 15m)',
      category: 'Oscillateurs',
      description: 'Support/Résistance multi-période sur momentum.',
    },
    {
      key: 'showEMAs',
      title: 'Moyennes Mobiles (EMA 20, 50, 200)',
      category: 'Tendance',
      description: 'Courbes de moyenne mobile exponentielle.',
    },
    {
      key: 'showSessions',
      title: 'Overlay Sessions (NY, LDN, TUN)',
      category: 'Sessions',
      description: 'Grilles visuelles des heures d’ouverture de New York, Londres et Tunis.',
    },
    {
      key: 'showVolume',
      title: 'Histogramme de Volume',
      category: 'Volume',
      description: 'Affiche le volume de transaction par bougie au bas du graphique.',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div 
        className={`w-full max-w-lg rounded-xl shadow-2xl border flex flex-col overflow-hidden max-h-[85vh] ${
          isDarkMode ? 'bg-[#0f172a] border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-800'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center space-x-2">
            <Sliders className="w-5 h-5 text-emerald-500" />
            <h3 className="font-bold text-base">Configuration des Indicateurs</h3>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition text-slate-400 hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-3 divide-y divide-slate-100 dark:divide-slate-800/60">
          {items.map((item) => {
            const isActive = indicators[item.key];
            return (
              <div 
                key={item.key} 
                onClick={() => onToggleIndicator(item.key)}
                className="pt-3 first:pt-0 flex items-start justify-between cursor-pointer group"
              >
                <div className="pr-4 space-y-0.5">
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-sm group-hover:text-emerald-500 transition">
                      {item.title}
                    </span>
                    {item.badge && (
                      <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/30">
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {item.description}
                  </p>
                </div>

                {/* Toggle switch */}
                <div className={`w-11 h-6 rounded-full transition-colors p-0.5 flex items-center shrink-0 ${
                  isActive ? 'bg-emerald-500 justify-end' : 'bg-slate-300 dark:bg-slate-700 justify-start'
                }`}>
                  <div className="w-5 h-5 rounded-full bg-white shadow-md transform transition" />
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50 text-xs">
          <span className="text-slate-500">
            Lumen SMC Engine v2.4
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition shadow-sm"
          >
            Appliquer
          </button>
        </div>
      </div>
    </div>
  );
};
