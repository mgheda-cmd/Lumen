import React from 'react';
import { DrawingToolType } from '../types';
import { 
  MousePointer, 
  TrendingUp, 
  Minus, 
  Square, 
  Layers, 
  Type, 
  Ruler, 
  Trash2,
  Crosshair
} from 'lucide-react';

interface DrawingToolbarProps {
  activeTool: DrawingToolType;
  onSelectTool: (tool: DrawingToolType) => void;
  onClearDrawings: () => void;
  drawingsCount: number;
  isDarkMode: boolean;
}

export const DrawingToolbar: React.FC<DrawingToolbarProps> = ({
  activeTool,
  onSelectTool,
  onClearDrawings,
  drawingsCount,
  isDarkMode,
}) => {
  const tools: { type: DrawingToolType; label: string; icon: React.ReactNode }[] = [
    { type: 'select', label: 'Curseur / Sélection', icon: <MousePointer className="w-4 h-4" /> },
    { type: 'trendline', label: 'Ligne de tendance', icon: <TrendingUp className="w-4 h-4" /> },
    { type: 'horizontal', label: 'Ligne horizontale', icon: <Minus className="w-4 h-4" /> },
    { type: 'rectangle', label: 'Zone / Rectangle OB/FVG', icon: <Square className="w-4 h-4" /> },
    { type: 'fib', label: 'Retracement de Fibonacci', icon: <Layers className="w-4 h-4" /> },
    { type: 'text', label: 'Texte d’annotation', icon: <Type className="w-4 h-4" /> },
    { type: 'ruler', label: 'Règle / Mesurer % & pips', icon: <Ruler className="w-4 h-4" /> },
  ];

  return (
    <div className={`w-11 border-r flex flex-col items-center py-2 space-y-1 select-none z-10 transition-colors duration-200 ${
      isDarkMode 
        ? 'bg-[#0f172a] border-[#1e293b] text-slate-400' 
        : 'bg-white border-slate-200 text-slate-600'
    }`}>
      {tools.map((t) => (
        <button
          key={t.type}
          onClick={() => onSelectTool(t.type)}
          title={t.label}
          className={`p-2 rounded-md transition-all relative group ${
            activeTool === t.type
              ? 'bg-blue-600 text-white shadow-md'
              : 'hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'
          }`}
        >
          {t.icon}
          {/* Tooltip on hover */}
          <span className="absolute left-full ml-2 px-2 py-1 text-[10px] font-medium bg-slate-900 text-white rounded shadow-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
            {t.label}
          </span>
        </button>
      ))}

      <div className="w-6 h-px bg-slate-300 dark:bg-slate-800 my-2" />

      {drawingsCount > 0 && (
        <button
          onClick={onClearDrawings}
          title="Effacer tous les dessins"
          className="p-2 rounded-md text-rose-500 hover:bg-rose-500/10 transition relative group"
        >
          <Trash2 className="w-4 h-4" />
          <span className="absolute left-full ml-2 px-2 py-1 text-[10px] font-medium bg-rose-900 text-white rounded shadow-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
            Effacer dessins ({drawingsCount})
          </span>
        </button>
      )}
    </div>
  );
};
