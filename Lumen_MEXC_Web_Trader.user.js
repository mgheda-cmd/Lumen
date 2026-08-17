// ==UserScript==
// @name         Lumen Auto-Trader Web MEXC (Frais Réduits 0.02%)
// @namespace    https://mgheda-cmd.github.io/Lumen/
// @version      1.3.0
// @description  Exécute automatiquement les signaux de Lumen Charts sur l'interface Web officielle de MEXC Futures (Tarif Manuel 0.02% sans passer par les clés API)
// @author       Lumen Algo
// @match        *://*.mexc.com/*
// @match        *://futures.mexc.com/*
// @match        *://mexc.com/*
// @grant        none
// @run-at       document-start
// ==/UserScript==

(function() {
    'use strict';

    console.log('>>> [Lumen Web Trader] Script injecté avec succès sur MEXC !');

    let channel = null;
    try { channel = new BroadcastChannel('lumen_mexc_channel'); } catch(e){}

    function createHud() {
        if (document.getElementById('lumen-web-hud')) return;
        if (!document.body) return;

        const hud = document.createElement('div');
        hud.id = 'lumen-web-hud';
        hud.style.cssText = 'position:fixed;top:65px;right:20px;z-index:99999999;background:#0F172A;border:2.5px solid #10B981;border-radius:10px;padding:10px 16px;color:#FFFFFF;font-family:sans-serif;font-size:12px;font-weight:bold;box-shadow:0 0 25px rgba(16,185,129,0.7);display:flex;align-items:center;gap:10px;pointer-events:none;';
        hud.innerHTML = '🟢 <span style="color:#10B981;font-weight:900;font-size:13px">Lumen Connecté</span> <span style="background:#10B981;color:#0F172A;padding:2px 6px;border-radius:4px;font-size:10px;font-weight:900">0.02% FRAIS</span>';
        document.body.appendChild(hud);
    }

    setInterval(createHud, 800);

    function notifyHud(msg, color='#10B981') {
        const hud = document.getElementById('lumen-web-hud');
        if (!hud) return;
        hud.style.borderColor = color;
        hud.innerHTML = `⚡ <span style="color:${color};font-weight:900">${msg}</span>`;
        setTimeout(() => {
            if (hud) {
                hud.style.borderColor = '#10B981';
                hud.innerHTML = '🟢 <span style="color:#10B981;font-weight:900;font-size:13px">Lumen Connecté</span> <span style="background:#10B981;color:#0F172A;padding:2px 6px;border-radius:4px;font-size:10px;font-weight:900">0.02% FRAIS</span>';
            }
        }, 5000);
    }

    async function executeMarketOrder(signal) {
        try {
            console.log('[Lumen Web Trader] Signal reçu:', signal);
            notifyHud(`Signal : ${signal.side} ${signal.symbol}`, signal.side === 'BUY' ? '#10B981' : '#EF4444');

            const buttons = Array.from(document.querySelectorAll('button, div[role="tab"], span, div'));
            const marketBtn = buttons.find(el => el.textContent && (el.textContent.trim() === 'Market' || el.textContent.trim() === 'Marché' || el.textContent.trim() === '市价'));
            if (marketBtn) marketBtn.click();

            await new Promise(r => setTimeout(r, 200));

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
                notifyHud(`✅ Ordre ${signal.side} validé (0.02%) !`, isBuy ? '#10B981' : '#EF4444');
            } else {
                notifyHud('⚠️ Bouton non trouvé sur MEXC', '#F59E0B');
            }
        } catch (e) {
            console.error('[Lumen Web Trader] Erreur:', e);
            notifyHud('❌ Erreur ordre', '#EF4444');
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
})();
