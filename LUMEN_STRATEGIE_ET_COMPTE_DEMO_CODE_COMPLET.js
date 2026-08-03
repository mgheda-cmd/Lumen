/**
 * =========================================================================================
 * LUMEN CHARTS - CODE COMPLET DE LA STRATÉGIE & MODULE COMPTE DÉMO (AUTO-TRADE + BANQUE)
 * =========================================================================================
 * 1. La Stratégie de Trading complète (Croisement EMA 9, Bougies Heikin Ashi 5m, Filtre MACD S/R 3m)
 * 2. Le Moteur de Backtest & Calcul des Métriques
 * 3. Le Moteur du Compte Démo & Exécution Auto-Trade
 * 4. Le Module Banque & Sécurisation des Retraits de Gains
 * =========================================================================================
 */

function calculateEMA(prices, period) {
  const ema = [];
  const k = 2 / (period + 1);
  let prevEma = prices[0];
  ema[0] = prevEma;
  for (let i = 1; i < prices.length; i++) {
    const curEma = (prices[i] * k) + (prevEma * (1 - k));
    ema.push(curEma);
    prevEma = curEma;
  }
  return ema;
}

function calculateMACD(closes, fastP = 12, slowP = 26, signalP = 9) {
  const emaFast = calculateEMA(closes, fastP);
  const emaSlow = calculateEMA(closes, slowP);
  const macdLine = emaFast.map((f, i) => f - emaSlow[i]);
  const signalLine = calculateEMA(macdLine, signalP);
  const histogram = macdLine.map((m, i) => m - signalLine[i]);
  return { macdLine, signalLine, histogram };
}

function calculateHeikinAshi(candles) {
  const ha = [];
  for (let i = 0; i < candles.length; i++) {
    const c = candles[i];
    const haClose = (c.o + c.h + c.l + c.c) / 4;
    let haOpen;
    if (i === 0) { haOpen = (c.o + c.c) / 2; }
    else { haOpen = (ha[i - 1].haOpen + ha[i - 1].haClose) / 2; }
    const haHigh = Math.max(c.h, haOpen, haClose);
    const haLow = Math.min(c.l, haOpen, haClose);
    ha.push({ ...c, haOpen, haHigh, haLow, haClose, isGreen: haClose >= haOpen });
  }
  return ha;
}

function computeEmaHaCrossSignals(candles1m, options = {}) {
  const emaPeriod = options.emaPeriod || 9;
  const exitMode = options.exitMode || 'macd';
  if (!candles1m || candles1m.length < 50) return [];
  const closes1m = candles1m.map(c => c.c);
  const ema1m = calculateEMA(closes1m, emaPeriod);
  const macd3m = calculateMACD(closes1m, 12, 26, 9);
  const haCandles = calculateHeikinAshi(candles1m);
  const signals = [];
  let currentPosition = null;
  for (let i = 1; i < candles1m.length; i++) {
    const prevC = candles1m[i - 1];
    const curC = candles1m[i];
    const curPrice = curC.c;
    const curEma = ema1m[i];
    const prevEma = ema1m[i - 1];
    const isHaGreen = haCandles[i].isGreen;
    const isMacdPositive = macd3m.histogram[i] > 0;
    const isMacdNegative = macd3m.histogram[i] < 0;
    const crossUpEMA = prevC.c <= prevEma && curC.c > curEma;
    const crossDownEMA = prevC.c >= prevEma && curC.c < curEma;
    const buyCondition = crossUpEMA && isHaGreen && isMacdPositive;
    const sellCondition = crossDownEMA && !isHaGreen && isMacdNegative;
    let shouldExit = false;
    if (currentPosition) {
      if (exitMode === 'macd') {
        if (currentPosition.type === 'long' && isMacdNegative) shouldExit = true;
        if (currentPosition.type === 'short' && isMacdPositive) shouldExit = true;
      } else if (exitMode === 'color') {
        if (currentPosition.type === 'long' && !isHaGreen) shouldExit = true;
        if (currentPosition.type === 'short' && isHaGreen) shouldExit = true;
      } else if (exitMode === 'ema_cross') {
        if (currentPosition.type === 'long' && crossDownEMA) shouldExit = true;
        if (currentPosition.type === 'short' && crossUpEMA) shouldExit = true;
      }
    }
    if (currentPosition && (shouldExit || (currentPosition.type === 'long' && sellCondition) || (currentPosition.type === 'short' && buyCondition))) {
      signals.push({ i, t: curC.t, type: 'SORTIE', dir: 0, price: curPrice,
        sourceName: 'Sortie ' + exitMode.toUpperCase(), exitReason: 'Inversion MACD / Tendance' });
      currentPosition = null;
    }
    if (!currentPosition) {
      if (buyCondition) {
        currentPosition = { type: 'long', entryPrice: curPrice, entryIndex: i, entryTime: curC.t };
        signals.push({ i, t: curC.t, type: 'ACHAT (LONG)', dir: 1, price: curPrice, sourceName: 'EMA 9 / HA 5m (ACHAT)' });
      } else if (sellCondition) {
        currentPosition = { type: 'short', entryPrice: curPrice, entryIndex: i, entryTime: curC.t };
        signals.push({ i, t: curC.t, type: 'VENTE (SHORT)', dir: -1, price: curPrice, sourceName: 'EMA 9 / HA 5m (VENTE)' });
      }
    }
  }
  return signals;
}

function runBacktestEngine(candles, options = {}) {
  const initialCapital = options.capital || 100;
  const leverage = options.leverage || 100;
  const feePct = options.feePct || 0.04;
  const exitMode = options.exitMode || 'macd';
  const signals = computeEmaHaCrossSignals(candles, { exitMode });
  let capital = initialCapital;
  let peakCapital = initialCapital;
  let maxDrawdown = 0;
  let maxDrawdownPct = 0;
  const tradesHistory = [];
  let activeTrade = null;
  for (const sig of signals) {
    if (sig.dir !== 0 && !activeTrade) {
      activeTrade = { side: sig.dir === 1 ? 'LONG' : 'SHORT', entryPrice: sig.price, entryTime: sig.t, margin: capital };
    } else if ((sig.dir === 0 || (activeTrade && ((activeTrade.side === 'LONG' && sig.dir === -1) || (activeTrade.side === 'SHORT' && sig.dir === 1)))) && activeTrade) {
      const exitPrice = sig.price;
      const rawReturn = activeTrade.side === 'LONG'
        ? (exitPrice - activeTrade.entryPrice) / activeTrade.entryPrice
        : (activeTrade.entryPrice - exitPrice) / activeTrade.entryPrice;
      const grossPnl = activeTrade.margin * rawReturn * leverage;
      const fees = (activeTrade.margin * leverage * (feePct / 100)) * 2;
      const netPnl = grossPnl - fees;
      capital += netPnl;
      if (capital <= 0) capital = 0.01;
      if (capital > peakCapital) peakCapital = capital;
      const dd = peakCapital - capital;
      const ddPct = (dd / peakCapital) * 100;
      if (dd > maxDrawdown) maxDrawdown = dd;
      if (ddPct > maxDrawdownPct) maxDrawdownPct = ddPct;
      tradesHistory.push({ entryTime: activeTrade.entryTime, exitTime: sig.t, side: activeTrade.side,
        entryPrice: activeTrade.entryPrice, exitPrice, netPnl, capitalAfter: capital, isWin: netPnl > 0 });
      activeTrade = null;
      if (sig.dir !== 0) {
        activeTrade = { side: sig.dir === 1 ? 'LONG' : 'SHORT', entryPrice: sig.price, entryTime: sig.t, margin: capital };
      }
    }
  }
  const wins = tradesHistory.filter(t => t.isWin);
  const losses = tradesHistory.filter(t => !t.isWin);
  const totalGrossWin = wins.reduce((acc, t) => acc + t.netPnl, 0);
  const totalGrossLoss = Math.abs(losses.reduce((acc, t) => acc + t.netPnl, 0));
  const winRate = tradesHistory.length > 0 ? (wins.length / tradesHistory.length) * 100 : 0;
  const profitFactor = totalGrossLoss > 0 ? (totalGrossWin / totalGrossLoss) : (totalGrossWin > 0 ? 99 : 0);
  const netPnlTotal = capital - initialCapital;
  const netPnlTotalPct = (netPnlTotal / initialCapital) * 100;
  return { initialCapital, finalCapital: capital, netPnlTotal, netPnlTotalPct, winRate,
    profitFactor, maxDrawdown, maxDrawdownPct, totalTrades: tradesHistory.length, tradesHistory };
}

const DemoAccount = {
  state: {
    cash: 100000.00,
    bank: 0.00,
    withdrawals: [],
    positions: [],
    history: [],
    autoTradeEnabled: false
  },
  init() {
    try {
      const saved = localStorage.getItem('lumen_paper_data');
      if (saved) { this.state = { ...this.state, ...JSON.parse(saved) }; }
    } catch(e) {}
  },
  save() {
    try { localStorage.setItem('lumen_paper_data', JSON.stringify(this.state)); } catch(e) {}
  },
  openPosition(side, symbol, price, amountUSDT, leverage = 100) {
    if (this.state.positions.length > 0) { this.closePosition(0, price); }
    const margin = amountUSDT;
    const qty = (margin * leverage) / price;
    const pos = { sym: symbol, side: side.toLowerCase(), price: price, qty: qty,
      margin: margin, lev: leverage, time: Date.now() };
    this.state.positions.push(pos);
    this.save();
    return pos;
  },
  closePosition(index, currentPrice) {
    if (index < 0 || index >= this.state.positions.length) return null;
    const pos = this.state.positions[index];
    const isLong = pos.side === 'long';
    const priceDiff = isLong ? (currentPrice - pos.price) : (pos.price - currentPrice);
    const grossPnl = priceDiff * pos.qty;
    const feePct = 0.04;
    const fees = (pos.margin * pos.lev * (feePct / 100)) * 2;
    const netPnl = grossPnl - fees;
    this.state.cash += netPnl;
    const closedTrade = { sym: pos.sym, side: pos.side, entryPrice: pos.price, exitPrice: currentPrice,
      qty: pos.qty, margin: pos.margin, lev: pos.lev, netPnl: netPnl,
      netPnlPct: (netPnl / pos.margin) * 100, closeTime: Date.now() };
    this.state.history.unshift(closedTrade);
    this.state.positions.splice(index, 1);
    this.save();
    return closedTrade;
  },
  withdrawToBank(amount) {
    if (amount <= 0 || amount > this.state.cash) return false;
    this.state.cash -= amount;
    this.state.bank += amount;
    this.state.withdrawals.unshift({ id: Date.now().toString(), amount: amount, date: new Date().toISOString() });
    this.save();
    return true;
  },
  restoreWithdrawal(withdrawalId) {
    const idx = this.state.withdrawals.findIndex(w => w.id === withdrawalId);
    if (idx === -1) return false;
    const item = this.state.withdrawals[idx];
    this.state.cash += item.amount;
    this.state.bank -= item.amount;
    this.state.withdrawals.splice(idx, 1);
    this.save();
    return true;
  }
};

let lastExecutedSignalId = null;

function processAutoTrade(currentCandles, currentSymbol, currentPrice) {
  if (!DemoAccount.state.autoTradeEnabled) return;
  const signals = computeEmaHaCrossSignals(currentCandles, { exitMode: 'macd' });
  if (!signals || !signals.length) return;
  const lastSignal = signals[signals.length - 1];
  const sigType = lastSignal.type;
  const sigId = currentSymbol + '|' + lastSignal.t + '|' + sigType + '|' + lastSignal.dir;
  if (lastExecutedSignalId === sigId) return;
  const currentPos = DemoAccount.state.positions[0];
  if (sigType.includes('SORTIE') || lastSignal.dir === 0) {
    if (currentPos) {
      lastExecutedSignalId = sigId;
      DemoAccount.closePosition(0, currentPrice);
      console.log('[Auto-Trade] Position fermée suite à un signal de sortie @ ' + currentPrice);
    }
    return;
  }
  const targetSide = (lastSignal.dir === 1 || sigType.includes('ACHAT')) ? 'long' : 'short';
  if (!currentPos) {
    lastExecutedSignalId = sigId;
    DemoAccount.openPosition(targetSide, currentSymbol, currentPrice, 100, 100);
    console.log('[Auto-Trade] Ordre ' + targetSide.toUpperCase() + ' exécuté @ ' + currentPrice);
  } else if (currentPos.side !== targetSide) {
    lastExecutedSignalId = sigId;
    DemoAccount.closePosition(0, currentPrice);
    DemoAccount.openPosition(targetSide, currentSymbol, currentPrice, 100, 100);
    console.log('[Auto-Trade] Inversion de Tendance : Nouvelle position ' + targetSide.toUpperCase() + ' @ ' + currentPrice);
  }
}
