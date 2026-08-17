// ==UserScript==
// @name         Lumen Auto-Trader Web MEXC (Frais Réduits 0.02%)
// @namespace    https://mgheda-cmd.github.io/Lumen/
// @version      1.1.0
// @description  Exécute automatiquement les signaux de Lumen Charts sur l'interface Web officielle de MEXC Futures (Tarif Manuel 0.02% sans passer par les clés API)
// @author       Lumen Algo
// @match        https://futures.mexc.com/*
// @match        https://*.mexc.com/futures*
// @match        https://*.mexc.com/*/futures*
// @match        https://*.mexc.com/exchange*
// @match        https://*.mexc.com/*/exchange*
// @grant        none
// @run-at       document-start
// ==/UserScript==

(function() {
    'use strict';

    console.log('[Lumen Web Trader] Initialisation du pont de trading automatique...');

    // Canal local de communication avec Lumen Charts
    let channel = null;
    try { channel = new BroadcastChannel('lumen_mexc_channel'); } catch(e){}

    // Mini-HUD visuel en haut à droite sur la page MEXC
    function createHud() {
        if (document.getElementById('lumen-web-hud')) return;
        if (!document.body) return;

        const hud = document.createElement('div');
        hud.id = 'lumen-web-hud';
        hud.style.cssText = 'position:fixed;top:70px;right:24px;z-index:9999999;background:rgba(15,23,42,0.96);border:2px solid #00E5FF;border-radius:10px;padding:10px 16px;color:#fff;font-family:system-ui,-apple-system,sans-serif;font-size:12px;font-weight:700;box-shadow:0 12px 40px rgba(0,229,255,0.45);backdrop-filter:blur(10px);display:flex;align-items:center;gap:10px;pointer-events:none;transition:all 0.3s';
        hud.innerHTML = '🟢 <span style="font-weight:900;color:#00E5FF;font-size:12.5px">Lumen Web Trader Connecté</span> <span style="font-size:10px;color:#10B981;background:rgba(16,185,129,0.18);border:1px solid #10B981;padding:2px 7px;border-radius:5px;font-weight:800">Frais 0.02%</span>';
        document.body.appendChild(hud);
    }

    // Tentatives d'insertion immédiate et répétée
    const initInterval = setInterval(() => {
        createHud();
        if (document.getElementById('lumen-web-hud')) clearInterval(initInterval);
    }, 500);

    function notifyHud(msg, color='#00E5FF') {
        const hud = document.getElementById('lumen-web-hud');
        if (!hud) return;
        hud.style.borderColor = color;
        hud.innerHTML = `⚡ <span style="font-weight:900;color:${color}">${msg}</span>`;
        setTimeout(() => {
            if (hud) {
                hud.style.borderColor = '#00E5FF';
                hud.innerHTML = '🟢 <span style="font-weight:900;color:#00E5FF;font-size:12.5px">Lumen Web Trader Connecté</span> <span style="font-size:10px;color:#10B981;background:rgba(16,185,129,0.18);border:1px solid #10B981;padding:2px 7px;border-radius:5px;font-weight:800">Frais 0.02%</span>';
            }
        }, 5000);
    }

    async function executeMarketOrder(signal) {
        try {
            console.log('[Lumen Web Trader] Signal reçu:', signal);
            notifyHud(`Signal reçu : ${signal.side} ${signal.symbol}`, signal.side === 'BUY' ? '#10B981' : '#EF4444');

            // 1. Trouver le bouton 'Market' (Marché)
            const buttons = Array.from(document.querySelectorAll('button, div[role="tab"], span, div'));
            const marketBtn = buttons.find(el => el.textContent && (el.textContent.trim() === 'Market' || el.textContent.trim() === 'Marché' || el.textContent.trim() === '市价'));
            if (marketBtn) {
                marketBtn.click();
            }

            await new Promise(r => setTimeout(r, 200));

            // 2. Trouver et cliquer sur le bouton Ouvrir Long / Ouvrir Short
            const isBuy = signal.side === 'BUY' || signal.side === 'LONG';
            const actionButtons = Array.from(document.querySelectorAll('button'));
            
            const targetBtn = actionButtons.find(b => {
                const txt = (b.textContent || '').trim().toLowerCase();
                if (isBuy) {
                    return txt.includes('open long') || txt.includes('ouvrir long') || txt.includes('buy / long') || txt.includes('acheter') || txt.includes('long');
                } else {
                    return txt.includes('open short') || txt.includes('ouvrir short') || txt.includes('sell / short') || txt.includes('vendre') || txt.includes('short');
                }
            });

            if (targetBtn && !targetBtn.disabled) {
                targetBtn.click();
                notifyHud(`✅ Ordre ${signal.side} exécuté sur Web MEXC (0.02%) !`, isBuy ? '#10B981' : '#EF4444');
                console.log('[Lumen Web Trader] Ordre validé avec succès sur la page Web MEXC !');
            } else {
                console.warn('[Lumen Web Trader] Bouton d\'action non trouvé ou désactivé.');
                notifyHud('⚠️ Bouton non trouvé sur la page MEXC', '#F59E0B');
            }
        } catch (e) {
            console.error('[Lumen Web Trader] Erreur exécution:', e);
            notifyHud('❌ Erreur exécution ordre', '#EF4444');
        }
    }

    if (channel) {
        channel.onmessage = (event) => {
            if (event.data && event.data.type === 'LUMEN_TRADE_SIGNAL') {
                executeMarketOrder(event.data);
            }
        };
    }

    window.addEventListener('storage', (e) => {
        if (e.key === 'lumen_mexc_web_signal' && e.newValue) {
            try {
                const signal = JSON.parse(e.newValue);
                if (signal && Date.now() - signal.timestamp < 3000) {
                    executeMarketOrder(signal);
                }
            } catch (err) {}
        }
    });

    console.log('[Lumen Web Trader] En écoute active des signaux de Lumen Charts...');
})();
