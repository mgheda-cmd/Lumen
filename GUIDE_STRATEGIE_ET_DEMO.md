# 📘 GUIDE COMPLET : STRATÉGIE DE TRADING, BACKTEST & COMPTE DÉMO

Ce document regroupe l'explication complète et le code prêt à l'emploi de la **Stratégie d'Entrée EMA 9 x Heikin Ashi 5m (Confluence MACD 3m)**, des **6 Modes de Sortie Backtest**, ainsi que de l'**Intégration sur le Compte Démo (Paper Trading)**.

---

## 1. 🎯 RÈGLES DE LA STRATÉGIE D'ENTRÉE

### **A. Indicateurs requis :**
1. **EMA 9 (Moyenne Mobile Exponentielle 9 périodes)** : Calculée sur les bougies 1 minute.
2. **Heikin Ashi 5m (HA)** : Calculé et projeté sur l'unité de temps 5 minutes.
3. **MACD S/R (3m)** : Histogramme MACD calculé sur l'unité de temps 3 minutes.

### **B. Conditions d'Entrée LONG (Achat) :**
- **Signal 1m** : La bougie 1m clôture au-dessus de l'EMA 9 (croisement haussier).
- **Confluence 5m** : La bougie Heikin Ashi 5m est **verte** (haussière).
- **Confluence 3m** : L'histogramme MACD 3m est **supérieur ou égal à 0** (vert).

### **C. Conditions d'Entrée SHORT (Vente) :**
- **Signal 1m** : La bougie 1m clôture au-dessous de l'EMA 9 (croisement baissier).
- **Confluence 5m** : La bougie Heikin Ashi 5m est **rouge** (baissière).
- **Confluence 3m** : L'histogramme MACD 3m est **inférieur ou égal à 0** (rouge).

---

## 2. 🛡️ LES 6 MODES DE SORTIE (BACKTEST)

1. **Multi-Signal (Combined)** *(Mode Recommandé)* :
   - **Stop-Loss (SL)** : Fixé à $1.5 \times ATR(14)$.
   - **Take-Profit (TP)** : Fixé avec un ratio Risk/Reward de $1.5$.
   - **Sortie anticipée** : HA Flip (changement de couleur Heikin Ashi) ou cassure MACD.
2. **HA Flip** : Sortie immédiate dès que la bougie Heikin Ashi change de couleur.
3. **ATR Trailing Stop** : Suivi de tendance dynamique basé sur $2.0 \times ATR(14)$.
4. **Cassure EMA 9** : Sortie dès que le prix clôture de l'autre côté de l'EMA 9.
5. **MACD 3m Reversal** : Sortie lorsque l'histogramme MACD 3m inverse sa polarité.
6. **Croisement EMA/HA** : Sortie lorsque le prix repasse sous l'EMA 9 et la bougie HA devient baissière.

---

## 3. 💼 COMPTE DÉMO & SUIVI DU SOLDE (CAPITAL RÉSIDUEL)

Le système de compte Démo simule l'exécution en temps réel ou en backtest avec :
- **Levier configurable** : $1x, 2x, 5x, 10x, 20x, 50x, 100x$.
- **Déduction des frais de courtage** (0.04% par défaut à l'entrée et à la sortie).
- **Affichage dynamique du solde** : Le capital disponible est recalculé après chaque trade clôturé :
  $$\text{Capital}_{\text{Nouveau}} = \text{Capital}_{\text{Précédent}} + \text{PNL Net (avec Levier et Frais)}$$
- **Rapport complet** :
  - **Win Rate (%)** : Pourcentage de trades gagnants.
  - **Max Drawdown (DD %)** : Perte maximale subie par le portefeuille à partir du sommet d'équité.
  - **Profit Factor (PF)** : Ratio Gains Bruts / Pertes Brutes.

---

## 4. 💻 CODE JAVASCRIPT PRÊT À L'EMPLOI (MODULE AUTONOME)

Le fichier `STRATEGY_AND_DEMO_MODULE.js` présent dans le projet contient l'implémentation JS complète.

```javascript
import { 
  computeStrategySignals, 
  runBacktestEngine, 
  activateStrategyOnDemo, 
  executeDemoTrade 
} from './STRATEGY_AND_DEMO_MODULE.js';

// Exécuter un backtest
const results = runBacktestEngine(candles, {
  initialCapital: 100,
  leverage: 10,
  feePct: 0.04 / 100,
  exitMode: 'combined',
  signals: signals
});

console.log("Win Rate:", results.winRate + "%");
console.log("Drawdown Max:", results.maxDDPct + "%");
console.log("Solde Final:", results.finalCapital + " $");

// Activer sur le Compte Démo
activateStrategyOnDemo({
  mode: 'combined',
  lev: 10,
  capital: 100,
  feePct: 0.04,
  winRate: results.winRate,
  maxDD: results.maxDD,
  maxDDPct: results.maxDDPct,
  profitFactor: results.profitFactor,
  netPnlTotal: results.netPnlTotal
});
```

---

## 5. 🚀 COMMENT RÉUTILISER CE FICHIER SUR UN AUTRE SUPPORT
1. Copiez le fichier `STRATEGY_AND_DEMO_MODULE.js` dans votre nouveau projet.
2. Importez les fonctions `computeStrategySignals` et `runBacktestEngine`.
3. Passez vos séries de bougies (Open, High, Low, Close, Volume, Timestamp).
4. Le moteur calcule automatiquement les entrées, les sorties, le Win Rate, le Drawdown et le solde du compte Démo !
