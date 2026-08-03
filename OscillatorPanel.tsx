import React, { useRef, useEffect } from 'react';
import { Candle, ImpulseMACDData, MACDSRData } from '../types';

interface OscillatorPanelProps {
  candles: Candle[];
  impulseData: ImpulseMACDData[];
  macdSRData: MACDSRData[];
  showImpulse: boolean;
  showMACDSR: boolean;
  visibleCount: number;
  offset: number;
  isDarkMode: boolean;
}

export const OscillatorPanel: React.FC<OscillatorPanelProps> = ({
  candles,
  impulseData,
  macdSRData,
  showImpulse,
  showMACDSR,
  visibleCount,
  offset,
  isDarkMode,
}) => {
  const impulseCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const macdSRCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Render Impulse MACD 34 & Range Oscillator 50
  useEffect(() => {
    if (!showImpulse || !impulseCanvasRef.current) return;
    const canvas = impulseCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, width, height);

    // Background & grid
    ctx.fillStyle = isDarkMode ? '#0b1120' : '#f8fafc';
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, height / 2);
    ctx.lineTo(width, height / 2);
    ctx.stroke();

    const startIdx = Math.max(0, candles.length - visibleCount - offset);
    const endIdx = Math.min(candles.length, startIdx + visibleCount);
    const slice = impulseData.slice(startIdx, endIdx);
    if (slice.length < 2) return;

    const slotWidth = width / visibleCount;
    const centerY = height / 2;

    // Draw Histogram / Area wave
    for (let i = 0; i < slice.length; i++) {
      const d = slice[i];
      const x = i * slotWidth + slotWidth / 2;
      const val = d.hist * 0.35;
      const barHeight = Math.abs(val);

      ctx.fillStyle = d.color;
      if (val >= 0) {
        ctx.fillRect(x - slotWidth * 0.35, centerY - barHeight, slotWidth * 0.7, barHeight);
      } else {
        ctx.fillRect(x - slotWidth * 0.35, centerY, slotWidth * 0.7, barHeight);
      }
    }

    // Draw Impulse Line Curve
    ctx.beginPath();
    ctx.strokeStyle = '#10b981'; // emerald green
    ctx.lineWidth = 1.5;
    for (let i = 0; i < slice.length; i++) {
      const d = slice[i];
      const x = i * slotWidth + slotWidth / 2;
      const y = centerY - d.macd * 0.25;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Draw Range Oscillator Curve
    ctx.beginPath();
    ctx.strokeStyle = '#f43f5e'; // rose pink
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 2]);
    for (let i = 0; i < slice.length; i++) {
      const d = slice[i];
      const x = i * slotWidth + slotWidth / 2;
      const y = centerY - d.rangeOsc * 0.25;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.setLineDash([]);
  }, [candles, impulseData, showImpulse, visibleCount, offset, isDarkMode]);

  // Render MACD S/R 12 26
  useEffect(() => {
    if (!showMACDSR || !macdSRCanvasRef.current) return;
    const canvas = macdSRCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, width, height);

    ctx.fillStyle = isDarkMode ? '#0b1120' : '#f8fafc';
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, height / 2);
    ctx.lineTo(width, height / 2);
    ctx.stroke();

    const startIdx = Math.max(0, candles.length - visibleCount - offset);
    const endIdx = Math.min(candles.length, startIdx + visibleCount);
    const slice = macdSRData.slice(startIdx, endIdx);
    if (slice.length < 2) return;

    const slotWidth = width / visibleCount;
    const centerY = height / 2;

    // 5m MACD curve (pink/magenta)
    ctx.beginPath();
    ctx.strokeStyle = '#ec4899';
    ctx.lineWidth = 1.5;
    for (let i = 0; i < slice.length; i++) {
      const d = slice[i];
      const x = i * slotWidth + slotWidth / 2;
      const y = centerY - d.macd5m * 0.2;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // 15m MACD curve (orange)
    ctx.beginPath();
    ctx.strokeStyle = '#f97316';
    ctx.lineWidth = 1.5;
    for (let i = 0; i < slice.length; i++) {
      const d = slice[i];
      const x = i * slotWidth + slotWidth / 2;
      const y = centerY - d.macd15m * 0.2;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }, [candles, macdSRData, showMACDSR, visibleCount, offset, isDarkMode]);

  const latestImpulse = impulseData[impulseData.length - 1];
  const latestSR = macdSRData[macdSRData.length - 1];

  return (
    <div className="flex flex-col select-none divide-y divide-slate-200 dark:divide-slate-800">
      {/* Impulse MACD Panel */}
      {showImpulse && (
        <div className="h-28 relative flex flex-col justify-between">
          {/* Header Legend */}
          <div className="absolute top-1 left-3 z-10 flex items-center space-x-3 text-[11px] font-mono">
            <div className="flex items-center space-x-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="font-semibold text-slate-300">Impulse MACD 34 · 15m</span>
              <span className="text-emerald-400 font-bold">{latestImpulse ? latestImpulse.macd.toFixed(2) : '0.00'}</span>
            </div>
            <div className="flex items-center space-x-1">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              <span className="text-slate-400">Range Oscillator 50 · 15m</span>
              <span className="text-rose-400 font-bold">{latestImpulse ? latestImpulse.rangeOsc.toFixed(1) : '-64.0'}</span>
            </div>
          </div>

          <canvas ref={impulseCanvasRef} className="w-full h-full block" />

          {/* Right Axis Threshold Tags matching screenshot */}
          <div className="absolute top-0 right-0 bottom-0 w-16 pointer-events-none flex flex-col justify-between items-end pr-1 text-[9px] font-mono text-slate-500 py-1">
            <span className="text-emerald-400">+171.5</span>
            <span className="text-emerald-500/80">+42.4</span>
            <span className="text-slate-500">0.0</span>
            <span className="text-rose-400/80">-86.7</span>
            <span className="text-rose-500">-284.7</span>
          </div>
        </div>
      )}

      {/* MACD S/R Panel */}
      {showMACDSR && (
        <div className="h-24 relative flex flex-col justify-between">
          {/* Header Legend */}
          <div className="absolute top-1 left-3 z-10 flex items-center space-x-3 text-[11px] font-mono">
            <div className="flex items-center space-x-1">
              <span className="w-2 h-2 rounded-full bg-pink-500" />
              <span className="font-semibold text-slate-300">MACD S/R 12 26 · 5m</span>
              <span className="text-pink-400 font-bold">{latestSR ? latestSR.macd5m.toFixed(1) : '-86.5'}</span>
            </div>
            <div className="flex items-center space-x-1">
              <span className="w-2 h-2 rounded-full bg-orange-500" />
              <span className="text-slate-400">MACD S/R 12 26 · 15m</span>
              <span className="text-orange-400 font-bold">{latestSR ? latestSR.macd15m.toFixed(1) : '-143.0'}</span>
            </div>
          </div>

          <canvas ref={macdSRCanvasRef} className="w-full h-full block" />

          {/* Right Axis Threshold Tags */}
          <div className="absolute top-0 right-0 bottom-0 w-16 pointer-events-none flex flex-col justify-between items-end pr-1 text-[9px] font-mono text-slate-500 py-1">
            <span className="text-pink-400">0.0</span>
            <span className="text-pink-500/80">-86.5</span>
            <span className="text-orange-500">-143.0</span>
          </div>
        </div>
      )}
    </div>
  );
};
