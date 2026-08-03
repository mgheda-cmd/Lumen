/**
 * ====================================================================================
 * 🚀 MODULE DE STRATÉGIE TRADING ET COMPTE DÉMO (EXPORTE & STANDALONE)
 * ====================================================================================
 * Ce fichier regroupe l'intégralité du moteur de stratégie, du backtest, du compte Démo 
 * (Paper Trading) et de l'Auto-Trade. Il est totalement autonome et peut être réutilisé 
 * sur n'importe quelle plateforme Web, Node.js ou interface de trading similaire.
 * ====================================================================================
 */

// ==========================================
// 1. CONFIGURATION INITIALE DU COMPTE DÉMO
// ==========================================
export const paperState = {
  cash: 100,             // Capital par défaut ($)
  bank: 0,               // Montant sécurisé en Banque ($)
  withdrawals: [],       // Historique des retraits effectués
  feePct: 0.04 / 100,    // Taux de frais (0.04% par défaut)
  leverage: 1,           // Levier par défaut (1x, 2x, 5x, 10x, 20x, 50x, 100x...)
  positions: [],         // Positions ouvertes
  history: [],           // Historique des 50 derniers trades
  autoTradeActive: false // Statut de l'Auto-Trade
};

export const activeDemoStrategy = {
  mode: 'combined',
  modeLabel: 'Multi-Signal (SL/TP/HA/MACD)',
  lev: 1,
  capital: 100,
  feePct: 0.04,
  winRate: null,
  maxDD: null,
  maxDDPct: null,
  profitFactor: null,
  netPnlTotal: null,
  active: false
};

// ==========================================
// 2. INDICATEURS TECHNIQUES & CALCULS
// ==========================================
export const Indicators = {
  // Moyenne Mobile Exponentielle (EMA)
  ema(candles, period = 9) {
    if (!candles || candles.length < period) return [];
    const k = 2 / (period + 1);
    let emaVal = candles[0].close;
    const res = [emaVal];
    for (let i = 1; i < candles.length; i++) {
      emaVal = (candles[i].close * k) + (emaVal * (1 - k));
      res.push(emaVal);
    }
    return res;
  },

  // Heikin Ashi Brut (HA)
  plainHA(candles) {
    if (!candles || !candles.length) return [];
    const ha = [];
    let prevOpen = candles[0].open;
    let prevClose = candles[0].close;

    for (let i = 0; i < candles.length; i++) {
      const c = candles[i];
      const haClose = (c.open + c.high + c.low + c.close) / 4;
      const haOpen = i === 0 ? (prevOpen + prevClose) / 2 : (prevOpen + prevClose) / 2;
      const haHigh = Math.max(c.high, haOpen, haClose);
      const haLow = Math.min(c.low, haOpen, haClose);
      
      ha.push({ open: haOpen, high: haHigh, low: haLow, close: haClose, t: c.t });
      prevOpen = haOpen;
      prevClose = haClose;
    }
    return ha;
  },

  // Average True Range (ATR)
  atr(candles, period = 14) {
    if (!candles || candles.length < period) return [];
    const tr = [];
    for (let i = 0; i < candles.length; i++) {
      if (i === 0) {
        tr.push(candles[i].high - candles[i].low);
      } else {
        const prevClose = candles[i - 1].close;
        const hl = candles[i].high - candles[i].low;
        const hpc = Math.abs(candles[i].high - prevClose);
        const lpc = Math.abs(candles[i].low - prevClose);
        tr.push(Math.max(hl, hpc, lpc));
      }
    }
    // Lissage
    let atrVal = tr.slice(0, period).reduce((a, b) => a + b, 0) / period;
    const res = new Array(period - 1).fill(atrVal);
    res.push(atrVal);
    for (let i = period; i < candles.length; i++) {
      atrVal = (atrVal * (period - 1) + tr[i]) / period;
      res.push(atrVal);
    }
    return res;
  },

  // MACD
  macd(candles, fast = 12, slow = 26, signal = 9) {
    if (!candles || candles.length < slow) return { macd: [], signal: [], hist: [] };
    const emaFast = this.ema(candles, fast);
    const emaSlow = this.ema(candles, slow);
    const macdLine = emaFast.map((f, i) => f - emaSlow[i]);
    
    // Signal line on MACD
    const signalLine = [];
    const k = 2 / (signal + 1);
    let sigVal = macdLine[0];
    for (let i = 0; i < macdLine.length; i++) {
      if (i === 0) {
        signalLine.push(sigVal);
      } else {
        sigVal = (macdLine[i] * k) + (sigVal * (1 - k));
        signalLine.push(sigVal);
      }
    }
    const hist = macdLine.map((m, i) => m - signalLine[i]);
    return { macd: macdLine, signal: signalLine, hist };
  }
};

// ==========================================
// 3. MOTEUR DE SIGNAUX D'ENTRÉE (EMA 9 x HA 5m)
// ==========================================
/**
 * Génère les signaux d'achat (LONG) et de vente (SHORT)
 * Basé sur l'interaction entre l'EMA 9 (1m) et les bougies Heikin Ashi (5m)
 * avec filtrage par confluence MACD S/R (3m).
 */
export function computeStrategySignals(candles1m, candles5m, candles3m) {
  if (!candles1m || candles1m.length < 2) return [];

  const ema1m = Indicators.ema(candles1m, 9);
  const ha5m = Indicators.plainHA(candles5m || candles1m);
  const macd3m = Indicators.macd(candles3m || candles1m, 12, 26, 9);

  const signals = [];

  for (let i = 1; i < candles1m.length; i++) {
    const prevCandle = candles1m[i - 1];
    const currCandle = candles1m[i];
    const prevEma = ema1m[i - 1];
    const currEma = ema1m[i];

    // Alignement temporel simple pour récupérer les bougies 5m et 3m correspondantes
    const haCandle = ha5m.find(h => h.t <= currCandle.t) || ha5m[ha5m.length - 1];
    const macdHist = macd3m.hist[i] || 0;

    const isHaBull = haCandle ? haCandle.close > haCandle.open : true;
    const isHaBear = haCandle ? haCandle.close < haCandle.open : false;

    // Condition d'Achat LONG : Cassure à la hausse de l'EMA 9 + Heikin Ashi Vert (5m) + MACD Positif (3m)
    const longCross = prevCandle.close <= prevEma && currCandle.close > currEma;
    if (longCross && isHaBull && macdHist >= 0) {
      signals.push({ type: 'LONG', candle: currCandle, index: i, price: currCandle.close, time: currCandle.t });
    }

    // Condition de Vente SHORT : Cassure à la baisse de l'EMA 9 + Heikin Ashi Rouge (5m) + MACD Négatif (3m)
    const shortCross = prevCandle.close >= prevEma && currCandle.close < currEma;
    if (shortCross && isHaBear && macdHist <= 0) {
      signals.push({ type: 'SHORT', candle: currCandle, index: i, price: currCandle.close, time: currCandle.t });
    }
  }

  return signals;
}

// ==========================================
// 4. MOTEUR DE BACKTEST MULTI-STRATÉGIES
// ==========================================
/**
 * Simule l'exécution complète des règles sur des données historiques.
 *
 * MODES DE SORTIE DISPONIBLES :
 * - 'combined'  : Multi-Signal (SL ATR + TP R:R 1.5 + HA Flip + Cassure MACD)
 * - 'ha_flip'   : Sortie dès retournement de couleur de la bougie Heikin Ashi
 * - 'atr_trail' : Trailing Stop dynamique basé sur ATR x 2
 * - 'ema_cross' : Sortie dès que le prix casse à l'opposé de l'EMA 9
 * - 'macd'      : Sortie dès que l'histogramme MACD 3m inverse son signe
 * - 'cross'     : Sortie sur croisement inverse Heikin Ashi / EMA
 */
export function runBacktestEngine(candles, options = {}) {
  const {
    initialCapital = 100,
    leverage = 1,
    feePct = 0.04 / 100,
    exitMode = 'combined',
    signals = []
  } = options;

  let currentCapital = initialCapital;
  let peakCapital = initialCapital;
  let maxDD = 0;
  let maxDDPct = 0;

  const trades = [];
  let openPosition = null;

  const atrSeries = Indicators.atr(candles, 14);
  const emaSeries = Indicators.ema(candles, 9);
  const macdSeries = Indicators.macd(candles, 12, 26, 9);

  for (let i = 0; i < candles.length; i++) {
    const c = candles[i];
    const atr = atrSeries[i] || (c.close * 0.01);
    const ema = emaSeries[i] || c.close;
    const macdHist = macdSeries.hist[i] || 0;

    // 1. Vérification de sortie si position ouverte
    if (openPosition) {
      let exitPrice = null;
      let exitReason = null;

      const p = openPosition;
      const isLong = p.side === 'LONG';

      if (exitMode === 'combined') {
        const slPrice = isLong ? p.entryPrice - (atr * 1.5) : p.entryPrice + (atr * 1.5);
        const tpPrice = isLong ? p.entryPrice + (atr * 1.5 * 1.5) : p.entryPrice - (atr * 1.5 * 1.5);

        if (isLong && c.low <= slPrice) { exitPrice = slPrice; exitReason = '🛑 SL ATR'; }
        else if (!isLong && c.high >= slPrice) { exitPrice = slPrice; exitReason = '🛑 SL ATR'; }
        else if (isLong && c.high >= tpPrice) { exitPrice = tpPrice; exitReason = '🎯 TP (R:R 1.5)'; }
        else if (!isLong && c.low <= tpPrice) { exitPrice = tpPrice; exitReason = '🎯 TP (R:R 1.5)'; }
      } else if (exitMode === 'ha_flip') {
        if (isLong && c.close < c.open) { exitPrice = c.close; exitReason = '🔄 HA Flip Rouge'; }
        else if (!isLong && c.close > c.open) { exitPrice = c.close; exitReason = '🔄 HA Flip Vert'; }
      } else if (exitMode === 'ema_cross') {
        if (isLong && c.close < ema) { exitPrice = c.close; exitReason = '📉 Cassure sous EMA9'; }
        else if (!isLong && c.close > ema) { exitPrice = c.close; exitReason = '📈 Cassure sur EMA9'; }
      } else if (exitMode === 'macd') {
        if (isLong && macdHist < 0) { exitPrice = c.close; exitReason = '📊 MACD Négatif'; }
        else if (!isLong && macdHist > 0) { exitPrice = c.close; exitReason = '📊 MACD Positif'; }
      }

      // Clôture du Trade
      if (exitPrice !== null) {
        const priceDiff = isLong ? (exitPrice - p.entryPrice) : (p.entryPrice - exitPrice);
        const grossReturnPct = (priceDiff / p.entryPrice) * leverage;
        const grossPnl = p.positionMargin * grossReturnPct;
        const totalFee = (p.positionMargin * leverage * feePct) * 2; // Entrée + Sortie
        const netPnlDollar = grossPnl - totalFee;

        currentCapital += netPnlDollar;
        if (currentCapital > peakCapital) peakCapital = currentCapital;

        const dd = peakCapital - currentCapital;
        const ddPct = (dd / peakCapital) * 100;
        if (dd > maxDD) maxDD = dd;
        if (ddPct > maxDDPct) maxDDPct = ddPct;

        trades.push({
          id: trades.length + 1,
          side: p.side,
          entryPrice: p.entryPrice,
          exitPrice: exitPrice,
          entryTime: p.entryTime,
          exitTime: c.t,
          reason: exitReason,
          pnlDollar: netPnlDollar,
          netReturnPct: (netPnlDollar / p.positionMargin) * 100,
          capitalAfter: currentCapital // 🟢 CAPITAL RÉSIDUEL APRÈS CHAQUE TRADE
        });

        openPosition = null;
      }
    }

    // 2. Vérification d'entrée
    if (!openPosition) {
      const sig = signals.find(s => s.index === i);
      if (sig) {
        const margin = currentCapital; // Engagement à 100% du solde
        openPosition = {
          side: sig.type,
          entryPrice: c.close,
          entryTime: c.t,
          positionMargin: margin
        };
      }
    }
  }

  // Calcul des métriques globales
  const winningTrades = trades.filter(t => t.pnlDollar > 0);
  const losingTrades = trades.filter(t => t.pnlDollar <= 0);
  const totalPnl = currentCapital - initialCapital;
  const winRate = trades.length ? (winningTrades.length / trades.length) * 100 : 0;

  const grossProfit = winningTrades.reduce((acc, t) => acc + t.pnlDollar, 0);
  const grossLoss = Math.abs(losingTrades.reduce((acc, t) => acc + t.pnlDollar, 0));
  const profitFactor = grossLoss === 0 ? (grossProfit > 0 ? Infinity : 0) : (grossProfit / grossLoss);

  return {
    initialCapital,
    finalCapital: currentCapital,
    netPnlTotal: totalPnl,
    netPnlTotalPct: (totalPnl / initialCapital) * 100,
    winRate,
    profitFactor,
    maxDD,
    maxDDPct,
    totalTrades: trades.length,
    trades // Contient t.capitalAfter pour afficher le solde au fur et à mesure
  };
}

// ==========================================
// 5. GESTION DU COMPTE DÉMO & AUTO-TRADE
// ==========================================
/**
 * Active la stratégie sélectionnée sur le compte Démo.
 */
export function activateStrategyOnDemo(options = {}) {
  const mode = options.mode || 'combined';
  const lev = options.lev || 1;
  const capital = options.capital || 100;
  const feePct = options.feePct || 0.04;

  paperState.cash = capital;
  paperState.leverage = lev;
  paperState.feePct = feePct / 100;
  paperState.autoTradeActive = true;

  activeDemoStrategy.mode = mode;
  activeDemoStrategy.lev = lev;
  activeDemoStrategy.capital = capital;
  activeDemoStrategy.feePct = feePct;
  activeDemoStrategy.winRate = options.winRate ?? null;
  activeDemoStrategy.maxDD = options.maxDD ?? null;
  activeDemoStrategy.maxDDPct = options.maxDDPct ?? null;
  activeDemoStrategy.profitFactor = options.profitFactor ?? null;
  activeDemoStrategy.netPnlTotal = options.netPnlTotal ?? null;
  activeDemoStrategy.active = true;

  console.log('🤖 STRATÉGIE ACTIVÉE EN DÉMO :', activeDemoStrategy);
  return activeDemoStrategy;
}

/**
 * Exécute un trade simulé et met à jour le solde et l'historique avec le Solde à jour.
 */
export function executeDemoTrade(symbol, side, entryPx, exitPx, qty, leverage) {
  const pnl = (side === 'LONG' ? (exitPx - entryPx) : (entryPx - exitPx)) * qty;
  const fee = qty * exitPx * paperState.feePct;
  const netPnl = pnl - fee;

  paperState.cash += netPnl;

  const tradeRecord = {
    symbol,
    side,
    entryPrice: entryPx,
    exitPrice: exitPx,
    netPnl,
    qty,
    timestamp: Date.now(),
    capitalAfter: paperState.cash // 🟢 SOLDE APRÈS LE TRADE
  };

  paperState.history.unshift(tradeRecord);
  if (paperState.history.length > 50) paperState.history.pop();

  return tradeRecord;
}

// ==========================================
// 6. NOTIFICATIONS TELEGRAM (ENTRÉES & SORTIES)
// ==========================================
/**
 * Envoie un message Telegram via l'API Bot Telegram.
 */
export async function sendTelegramMessage(botToken, chatId, htmlContent) {
  if (!botToken || !chatId) return { ok: false, description: 'Token ou Chat ID manquant' };
  const url = `https://api.telegram.org/bot${botToken.trim()}/sendMessage`;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId.trim(),
        text: htmlContent,
        parse_mode: 'HTML',
        disable_web_page_preview: true
      })
    });
    return await res.json();
  } catch (err) {
    return { ok: false, description: err.message };
  }
}

/**
 * Alerte Telegram d'Entrée de Trade pour la stratégie Démo.
 */
export function formatTelegramEntryAlert(trade) {
  const sideStr = trade.side === 'LONG' || trade.side === 'long' ? '🟢 ACHAT (LONG)' : '🔴 VENTE (SHORT)';
  const icon = trade.side === 'LONG' || trade.side === 'long' ? '🚀' : '📉';
  
  return `${icon} <b>ENTRÉE TRADE DÉMO (STRATÉGIE ACTIVÉE)</b>
──────────────────────────
<b>Paire :</b> #${trade.symbol || 'BTCUSDT'}
<b>Type :</b> ${sideStr}
<b>Prix d'entrée :</b> <code>$${trade.entryPrice}</code>
<b>Taille :</b> ${trade.qty} (Levier ${trade.leverage || 1}x)
──────────────────────────
💼 <b>Solde Démo disponible :</b> <code>$${trade.capitalAfter || paperState.cash}</code>`;
}

/**
 * Alerte Telegram de Sortie de Trade (avec PnL Net) pour la stratégie Démo.
 */
export function formatTelegramExitAlert(trade) {
  const isWin = trade.netPnl >= 0;
  const pnlIcon = isWin ? '✅' : '🛑';
  const pnlSign = isWin ? '+' : '';

  return `${isWin ? '🎉' : '🛑'} <b>SORTIE TRADE DÉMO (STRATÉGIE ACTIVÉE)</b>
──────────────────────────
<b>Paire :</b> #${trade.symbol || 'BTCUSDT'} (${trade.side})
<b>Motif :</b> ${trade.reason || 'Clôture de position'}
──────────────────────────
<b>Prix d'entrée :</b> <code>$${trade.entryPrice}</code>
<b>Prix de sortie :</b> <code>$${trade.exitPrice}</code>
──────────────────────────
<b>PnL Net :</b> <b>${pnlIcon} ${pnlSign}$${trade.netPnl.toFixed(2)}</b>
💼 <b>Nouveau Solde Démo :</b> <code>$${trade.capitalAfter || paperState.cash}</code>`;
}

