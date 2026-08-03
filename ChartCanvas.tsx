import React, { useRef, useEffect, useState, useCallback } from 'react';
import { 
  Candle, 
  OrderBlock, 
  FairValueGap, 
  StructureBreak, 
  IndicatorSettings, 
  SessionConfig,
  ActivePosition,
  DrawingElement,
  DrawingToolType
} from '../types';

interface ChartCanvasProps {
  candles: Candle[];
  orderBlocks: OrderBlock[];
  fvgs: FairValueGap[];
  structureBreaks: StructureBreak[];
  indicators: IndicatorSettings;
  sessions: SessionConfig;
  positions: ActivePosition[];
  drawings: DrawingElement[];
  onAddDrawing: (drawing: DrawingElement) => void;
  activeDrawingTool: DrawingToolType;
  visibleCount: number;
  offset: number;
  onVisibleCountChange: (count: number) => void;
  onOffsetChange: (offset: number) => void;
  isDarkMode: boolean;
}

export const ChartCanvas: React.FC<ChartCanvasProps> = ({
  candles,
  orderBlocks,
  fvgs,
  structureBreaks,
  indicators,
  sessions,
  positions,
  drawings,
  onAddDrawing,
  activeDrawingTool,
  visibleCount,
  offset,
  onVisibleCountChange,
  onOffsetChange,
  isDarkMode,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; offset: number }>({ x: 0, offset: 0 });
  const [drawingStart, setDrawingStart] = useState<{ time: number; price: number } | null>(null);

  // Auto resize canvas
  const updateCanvasDimensions = useCallback(() => {
    if (!containerRef.current || !canvasRef.current) return;
    const container = containerRef.current;
    const canvas = canvasRef.current;
    const dpr = window.devicePixelRatio || 1;
    
    const width = container.clientWidth;
    const height = container.clientHeight;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
  }, []);

  useEffect(() => {
    updateCanvasDimensions();
    const handleResize = () => updateCanvasDimensions();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [updateCanvasDimensions]);

  // Main canvas render loop
  useEffect(() => {
    if (!canvasRef.current || candles.length === 0) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const width = canvas.width / dpr;
    const height = canvas.height / dpr;

    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);

    const priceScaleWidth = 65;
    const timeScaleHeight = 24;
    const chartWidth = width - priceScaleWidth;
    const chartHeight = height - timeScaleHeight;

    // Slice candles according to zoom (visibleCount) and pan (offset)
    const total = candles.length;
    const startIdx = Math.max(0, total - visibleCount - offset);
    const endIdx = Math.min(total, startIdx + visibleCount);
    const visibleCandles = candles.slice(startIdx, endIdx);

    if (visibleCandles.length === 0) {
      ctx.restore();
      return;
    }

    // Min / Max prices in view
    let minPrice = Infinity;
    let maxPrice = -Infinity;
    for (const c of visibleCandles) {
      if (c.low < minPrice) minPrice = c.low;
      if (c.high > maxPrice) maxPrice = c.high;
    }

    // Add padding to price range
    const pricePadding = (maxPrice - minPrice) * 0.08 || 10;
    minPrice -= pricePadding;
    maxPrice += pricePadding;
    const priceRange = maxPrice - minPrice;

    // Helper functions for coordinate conversion
    const slotWidth = chartWidth / visibleCount;
    
    const getX = (idxInCandles: number) => {
      const relIdx = idxInCandles - startIdx;
      return relIdx * slotWidth + slotWidth / 2;
    };

    const getY = (price: number) => {
      return chartHeight - ((price - minPrice) / priceRange) * chartHeight;
    };

    const getPriceFromY = (y: number) => {
      return maxPrice - (y / chartHeight) * priceRange;
    };

    const getTimeFromX = (x: number) => {
      const relIdx = Math.floor(x / slotWidth);
      const actualIdx = Math.min(candles.length - 1, Math.max(0, startIdx + relIdx));
      return candles[actualIdx]?.time || Date.now() / 1000;
    };

    // 1. Draw Background
    ctx.fillStyle = isDarkMode ? '#0b1120' : '#ffffff';
    ctx.fillRect(0, 0, width, height);

    // 2. Draw Grid
    ctx.strokeStyle = isDarkMode ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.04)';
    ctx.lineWidth = 1;

    // Horizontal Price Grid
    const priceStep = Math.pow(10, Math.floor(Math.log10(priceRange))) / 2;
    const startPriceGrid = Math.ceil(minPrice / priceStep) * priceStep;
    for (let p = startPriceGrid; p <= maxPrice; p += priceStep) {
      const y = getY(p);
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(chartWidth, y);
      ctx.stroke();
    }

    // Vertical Time Grid
    const gridStepCandles = Math.max(5, Math.floor(visibleCount / 8));
    for (let i = 0; i < visibleCandles.length; i += gridStepCandles) {
      const x = getX(startIdx + i);
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, chartHeight);
      ctx.stroke();
    }

    // 3. Draw Sessions Overlay (NY, LDN, TUN)
    if (indicators.showSessions) {
      if (sessions.ny) {
        ctx.fillStyle = 'rgba(245, 158, 11, 0.06)'; // NY warm amber
        ctx.fillRect(chartWidth * 0.45, 0, chartWidth * 0.35, chartHeight);
      }
      if (sessions.ldn) {
        ctx.fillStyle = 'rgba(59, 130, 246, 0.05)'; // LDN blue
        ctx.fillRect(chartWidth * 0.2, 0, chartWidth * 0.3, chartHeight);
      }
      if (sessions.tun) {
        ctx.fillStyle = 'rgba(6, 182, 212, 0.06)'; // TUN cyan
        ctx.fillRect(chartWidth * 0.65, 0, chartWidth * 0.3, chartHeight);
      }
    }

    // 4. Draw Order Blocks (OB)
    if (indicators.showOrderBlocks) {
      for (const ob of orderBlocks) {
        const topY = getY(ob.top);
        const bottomY = getY(ob.bottom);
        const rectHeight = Math.abs(bottomY - topY);

        const x1 = Math.max(0, getX(ob.startIndex));
        const x2 = chartWidth;

        if (ob.type === 'buy') {
          // Demand block (Cyan/Blue)
          ctx.fillStyle = isDarkMode ? 'rgba(14, 165, 233, 0.15)' : 'rgba(14, 165, 233, 0.12)';
          ctx.strokeStyle = '#0284c7';
        } else {
          // Supply block (Pink/Red)
          ctx.fillStyle = isDarkMode ? 'rgba(244, 63, 94, 0.15)' : 'rgba(244, 63, 94, 0.12)';
          ctx.strokeStyle = '#e11d48';
        }

        ctx.fillRect(x1, topY, x2 - x1, rectHeight);
        ctx.lineWidth = 1;
        ctx.strokeRect(x1, topY, x2 - x1, rectHeight);

        // Label on Right Edge inside block
        ctx.font = 'bold 10px sans-serif';
        ctx.fillStyle = ob.type === 'buy' ? '#38bdf8' : '#fb7185';
        ctx.textAlign = 'right';
        ctx.fillText(ob.label, chartWidth - 10, bottomY - 6);
      }
    }

    // 5. Draw Fair Value Gaps (FVG)
    if (indicators.showFVG) {
      for (const fvg of fvgs) {
        const topY = getY(fvg.top);
        const bottomY = getY(fvg.bottom);
        const rectHeight = Math.abs(bottomY - topY);

        const x1 = Math.max(0, getX(fvg.startIndex));
        const x2 = chartWidth;

        // Magenta / Purple fill
        ctx.fillStyle = 'rgba(168, 85, 247, 0.16)';
        ctx.strokeStyle = '#c084fc';
        ctx.fillRect(x1, topY, x2 - x1, rectHeight);
        ctx.lineWidth = 1;
        ctx.strokeRect(x1, topY, x2 - x1, rectHeight);

        // Label inside FVG rectangle
        ctx.font = 'bold 10px sans-serif';
        ctx.fillStyle = '#e9d5ff';
        ctx.textAlign = 'right';
        ctx.fillText(fvg.label, chartWidth - 10, bottomY - 6);
      }
    }

    // 6. Draw Volume Bars (Bottom 18% of main chart)
    if (indicators.showVolume) {
      let maxVol = 0;
      for (const c of visibleCandles) {
        if (c.volume > maxVol) maxVol = c.volume;
      }

      const maxVolHeight = chartHeight * 0.18;

      visibleCandles.forEach((c, idx) => {
        const actualIdx = startIdx + idx;
        const x = getX(actualIdx);
        const isGreen = c.close >= c.open;
        const volHeight = (c.volume / (maxVol || 1)) * maxVolHeight;

        ctx.fillStyle = isGreen 
          ? (isDarkMode ? 'rgba(16, 185, 129, 0.25)' : 'rgba(16, 185, 129, 0.2)') 
          : (isDarkMode ? 'rgba(244, 63, 94, 0.25)' : 'rgba(244, 63, 94, 0.2)');

        ctx.fillRect(x - slotWidth * 0.35, chartHeight - volHeight, slotWidth * 0.7, volHeight);
      });
    }

    // 7. Draw Candlesticks
    visibleCandles.forEach((c, idx) => {
      const actualIdx = startIdx + idx;
      const x = getX(actualIdx);
      const openY = getY(c.open);
      const closeY = getY(c.close);
      const highY = getY(c.high);
      const lowY = getY(c.low);

      const isGreen = c.close >= c.open;
      const candleColor = isGreen ? '#10b981' : '#f43f5e';

      // Wick
      ctx.strokeStyle = candleColor;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(x, highY);
      ctx.lineTo(x, lowY);
      ctx.stroke();

      // Body
      const bodyTop = Math.min(openY, closeY);
      const bodyHeight = Math.max(2, Math.abs(closeY - openY));
      const bodyWidth = Math.max(2, slotWidth * 0.7);

      ctx.fillStyle = candleColor;
      ctx.fillRect(x - bodyWidth / 2, bodyTop, bodyWidth, bodyHeight);
    });

    // 8. Draw Structure Breaks (BOS, ChoCH, MSS)
    if (indicators.showBOS || indicators.showChoCH) {
      for (const sb of structureBreaks) {
        if (!indicators.showBOS && sb.type === 'BOS') continue;
        if (!indicators.showChoCH && (sb.type === 'ChoCH' || sb.type === 'MSS')) continue;

        const y = getY(sb.price);
        const x1 = Math.max(0, getX(sb.index));
        const x2 = Math.min(chartWidth, x1 + 80);

        // Dashed line
        ctx.strokeStyle = sb.direction === 'bullish' ? '#10b981' : '#f43f5e';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 3]);
        ctx.beginPath();
        ctx.moveTo(x1, y);
        ctx.lineTo(x2, y);
        ctx.stroke();
        ctx.setLineDash([]);

        // Badge tag box
        ctx.font = 'bold 9px sans-serif';
        const textWidth = ctx.measureText(sb.label).width;
        const boxPadding = 4;
        const boxWidth = textWidth + boxPadding * 2;
        const boxHeight = 16;

        const badgeX = x1 + 10;
        const badgeY = y - boxHeight / 2;

        ctx.fillStyle = isDarkMode ? '#0f172a' : '#ffffff';
        ctx.strokeStyle = sb.direction === 'bullish' ? '#10b981' : '#f43f5e';
        ctx.lineWidth = 1;
        ctx.fillRect(badgeX, badgeY, boxWidth, boxHeight);
        ctx.strokeRect(badgeX, badgeY, boxWidth, boxHeight);

        ctx.fillStyle = sb.direction === 'bullish' ? '#34d399' : '#fb7185';
        ctx.textAlign = 'left';
        ctx.fillText(sb.label, badgeX + boxPadding, badgeY + 11);
      }
    }

    // 9. Draw Liquidity Dashed Price Lines matching screenshot (e.g. 5m · 64 131, 15m · 64 074, 5m · 63 828, etc.)
    const keyLiquidityLevels = [
      { label: '5m · 64 131', price: 64131, color: '#f43f5e' },
      { label: '15m · 64 074', price: 64074, color: '#f43f5e' },
      { label: '5m · 63 828', price: 63828, color: '#0284c7' },
      { label: '5m · 63 653', price: 63653, color: '#06b6d4' },
      { label: '15m · 63 579', price: 63579, color: '#06b6d4' },
      { label: '4H · 63 489', price: 63489, color: '#06b6d4' },
      { label: '5m · 63 313', price: 63313, color: '#3b82f6' },
    ];

    for (const lvl of keyLiquidityLevels) {
      if (lvl.price >= minPrice && lvl.price <= maxPrice) {
        const y = getY(lvl.price);

        ctx.strokeStyle = lvl.color;
        ctx.lineWidth = 1;
        ctx.setLineDash([2, 4]);
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(chartWidth, y);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.font = '10px monospace';
        ctx.fillStyle = lvl.color;
        ctx.textAlign = 'right';
        ctx.fillText(lvl.label, chartWidth - 10, y - 3);
      }
    }

    // 10. Draw Active Demo Trading Positions (Entry, TP, SL)
    for (const pos of positions) {
      const entryY = getY(pos.entryPrice);

      // Entry line
      ctx.strokeStyle = pos.type === 'BUY' ? '#10b981' : '#f43f5e';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([6, 3]);
      ctx.beginPath();
      ctx.moveTo(0, entryY);
      ctx.lineTo(chartWidth, entryY);
      ctx.stroke();
      ctx.setLineDash([]);

      // PnL Badge tag on line
      const isPnLPos = pos.currentPnL >= 0;
      const pnlText = `${isPnLPos ? '▲ +' : '▼ '}${pos.currentPnL.toFixed(2)} $`;

      ctx.font = 'bold 11px monospace';
      const pnlWidth = ctx.measureText(pnlText).width + 12;

      ctx.fillStyle = isPnLPos ? '#10b981' : '#f43f5e';
      ctx.fillRect(chartWidth - pnlWidth - 75, entryY - 10, pnlWidth, 20);

      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.fillText(pnlText, chartWidth - 75 - pnlWidth / 2, entryY + 4);
    }

    // 11. Draw User Drawings
    for (const dw of drawings) {
      if (dw.type === 'horizontal') {
        const y = getY(dw.p1.price);
        ctx.strokeStyle = dw.color || '#3b82f6';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(chartWidth, y);
        ctx.stroke();
      }
    }

    // 12. Draw Right Price Scale Bar
    ctx.fillStyle = isDarkMode ? '#0f172a' : '#f1f5f9';
    ctx.fillRect(chartWidth, 0, priceScaleWidth, height);

    ctx.strokeStyle = isDarkMode ? '#1e293b' : '#cbd5e1';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(chartWidth, 0);
    ctx.lineTo(chartWidth, height);
    ctx.stroke();

    // Price Labels on scale
    ctx.font = '10px monospace';
    ctx.fillStyle = isDarkMode ? '#94a3b8' : '#64748b';
    ctx.textAlign = 'left';

    for (let p = startPriceGrid; p <= maxPrice; p += priceStep) {
      const y = getY(p);
      ctx.fillText(p.toFixed(0), chartWidth + 6, y + 3);
    }

    // Current Price Badge on scale
    const lastCandle = candles[candles.length - 1];
    if (lastCandle) {
      const curY = getY(lastCandle.close);
      const isPos = lastCandle.close >= lastCandle.open;

      ctx.fillStyle = isPos ? '#10b981' : '#f43f5e';
      ctx.fillRect(chartWidth, curY - 11, priceScaleWidth, 22);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 11px monospace';
      ctx.fillText(lastCandle.close.toFixed(1), chartWidth + 4, curY + 4);
    }

    // 13. Draw Bottom Time Scale Bar
    ctx.fillStyle = isDarkMode ? '#0f172a' : '#f1f5f9';
    ctx.fillRect(0, chartHeight, chartWidth, timeScaleHeight);

    ctx.strokeStyle = isDarkMode ? '#1e293b' : '#cbd5e1';
    ctx.beginPath();
    ctx.moveTo(0, chartHeight);
    ctx.lineTo(chartWidth, chartHeight);
    ctx.stroke();

    ctx.font = '10px monospace';
    ctx.fillStyle = isDarkMode ? '#94a3b8' : '#64748b';
    ctx.textAlign = 'center';

    for (let i = 0; i < visibleCandles.length; i += gridStepCandles) {
      const x = getX(startIdx + i);
      const t = visibleCandles[i].time;
      const date = new Date(t * 1000);
      const timeStr = date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

      ctx.fillText(timeStr, x, chartHeight + 16);
    }

    // 14. Draw Crosshair & Pointer tool
    if (mousePos && mousePos.x <= chartWidth && mousePos.y <= chartHeight) {
      ctx.strokeStyle = isDarkMode ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.25)';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);

      // Vertical line
      ctx.beginPath();
      ctx.moveTo(mousePos.x, 0);
      ctx.lineTo(mousePos.x, chartHeight);
      ctx.stroke();

      // Horizontal line
      ctx.beginPath();
      ctx.moveTo(0, mousePos.y);
      ctx.lineTo(chartWidth, mousePos.y);
      ctx.stroke();

      ctx.setLineDash([]);

      // Crosshair Price Badge on Y axis
      const hoverPrice = getPriceFromY(mousePos.y);
      ctx.fillStyle = isDarkMode ? '#334155' : '#475569';
      ctx.fillRect(chartWidth, mousePos.y - 10, priceScaleWidth, 20);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(hoverPrice.toFixed(1), chartWidth + 4, mousePos.y + 3);

      // Crosshair Time Badge on X axis
      const hoverTime = getTimeFromX(mousePos.x);
      const hoverDateStr = new Date(hoverTime * 1000).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

      ctx.fillStyle = isDarkMode ? '#334155' : '#475569';
      ctx.fillRect(mousePos.x - 24, chartHeight, 48, timeScaleHeight);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(hoverDateStr, mousePos.x, chartHeight + 15);
    }

    ctx.restore();
  }, [
    candles,
    orderBlocks,
    fvgs,
    structureBreaks,
    indicators,
    sessions,
    positions,
    drawings,
    visibleCount,
    offset,
    mousePos,
    isDarkMode,
  ]);

  // Mouse event handlers for Drag/Pan & Zoom
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (activeDrawingTool === 'horizontal') {
      const priceRange = 1000;
      const chartHeight = rect.height - 24;
      const price = 64400 - (y / chartHeight) * priceRange;

      onAddDrawing({
        id: 'drawing-' + Date.now(),
        type: 'horizontal',
        p1: { time: Date.now() / 1000, price },
        color: '#3b82f6',
      });
      return;
    }

    setIsDragging(true);
    setDragStart({ x, offset });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setMousePos({ x, y });

    if (isDragging) {
      const deltaX = x - dragStart.x;
      const candlesMoved = Math.round(deltaX / 8);
      const newOffset = Math.max(0, dragStart.offset + candlesMoved);
      onOffsetChange(newOffset);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 5 : -5;
    const newCount = Math.min(250, Math.max(30, visibleCount + delta));
    onVisibleCountChange(newCount);
  };

  return (
    <div 
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={() => {
        setIsDragging(false);
        setMousePos(null);
      }}
      onWheel={handleWheel}
      className="w-full h-full relative cursor-crosshair select-none overflow-hidden"
    >
      <canvas ref={canvasRef} className="w-full h-full block" />
    </div>
  );
};
