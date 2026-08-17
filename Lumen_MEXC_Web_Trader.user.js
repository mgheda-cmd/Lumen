// ==UserScript==
// @name         Lumen Auto-Trader Web MEXC (Frais Réduits 0.02%)
// @namespace    https://mgheda-cmd.github.io/Lumen/
// @version      1.8.0
// @description  Gestion intelligente des sens de trade (Deux sens avec REVERSE natif, ou Achat seul / Vente seule sans interférence) (0.02% de frais)
// @author       Lumen Algo
// @match        *://*.mexc.com/*
// @match        *://futures.mexc.com/*
// @match        *://mexc.com/*
// @grant        none
// @run-at       document-start
// ==/UserScript==

(function() {
    'use strict';

    console.log('>>> [Lumen Web Trader] Script v1.8.0 actif (Support Multi-Stratégies & Filtre Sens de Trade)');

    let channel = null;
    try { channel = new BroadcastChannel('lumen_mexc_channel'); } catch(e){}

    function createHud() {
        if (document.getElementById('lumen-web-hud')) return;
        if (!document.body) return;

        const hud = document.createElement('div');
        hud.id = 'lumen-web-hud';
        hud.style.cssText = 'position:fixed;top:65px;right:20px;z-index:99999999;background:rgba(15,23,42,0.96);border:2.5px solid #10B981;border-radius:10px;padding:10px 16px;color:#FFFFFF;font-family:system-ui,-apple-system,sans-serif;font-size:12px;font-weight:bold;box-shadow:0 0 25px rgba(16,185,129,0.7);display:flex;align-items:center;gap:10px;pointer-events:none;';
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
        }, 6000);
    }

    function setNativeValue(element, value) {
        const valueSetter = Object.getOwnPropertyDescriptor(element, 'value')?.set;
        const prototype = Object.getPrototypeOf(element);
        const prototypeValueSetter = Object.getOwnPropertyDescriptor(prototype, 'value')?.set;
        if (prototypeValueSetter && valueSetter !== prototypeValueSetter) {
            prototypeValueSetter.call(element, value);
        } else if (valueSetter) {
            valueSetter.call(element, value);
        } else {
            element.value = value;
        }
        element.dispatchEvent(new Event('input', { bubbles: true }));
        element.dispatchEvent(new Event('change', { bubbles: true }));
    }

    // --- FERMETURE SIMPLE (FLASH CLOSE) ---
    async function executeCloseOrder(signal) {
        try {
            console.log('[Lumen Web Trader] Clôture simple de position...');
            notifyHud(`Clôture : ${signal?.reason || 'Sortie Trade'}`, '#EC4899');

            const allElements = Array.from(document.querySelectorAll('button, a, span, div'));
            const flashCloseBtn = allElements.find(el => {
                const txt = (el.textContent || '').trim().toLowerCase();
                return txt === 'flash close' || txt === 'market close' || txt === 'clôture éclair' || txt === 'fermer au marché' || txt === 'fermer tout';
            });

            if (flashCloseBtn) {
                flashCloseBtn.click();
                await new Promise(r => setTimeout(r, 150));

                const confirmBtn = Array.from(document.querySelectorAll('button')).find(b => {
                    const txt = (b.textContent || '').trim().toLowerCase();
                    return txt === 'confirm' || txt === 'confirmer' || txt === 'ok';
                });
                if (confirmBtn && !confirmBtn.disabled) confirmBtn.click();

                notifyHud(`✅ Position clôturée (Flash Close) !`, '#EC4899');
                return true;
            }

            const closeTab = Array.from(document.querySelectorAll('button, div[role="tab"], span')).find(el => {
                const txt = (el.textContent || '').trim();
                return txt === 'Close' || txt === 'Fermer' || txt === '平仓';
            });

            if (closeTab) {
                closeTab.click();
                await new Promise(r => setTimeout(r, 120));

                const marketBtn = Array.from(document.querySelectorAll('button, div, span')).find(el => (el.textContent || '').trim() === 'Market');
                if (marketBtn) marketBtn.click();

                await new Promise(r => setTimeout(r, 120));

                const isLongClose = (signal?.side === 'CLOSE_LONG' || signal?.side === 'SELL');
                const closeActionBtn = Array.from(document.querySelectorAll('button')).find(b => {
                    const txt = (b.textContent || '').trim().toLowerCase();
                    if (isLongClose) return txt.includes('close long') || txt.includes('fermer long');
                    return txt.includes('close short') || txt.includes('fermer short');
                });

                if (closeActionBtn && !closeActionBtn.disabled) {
                    closeActionBtn.click();
                    notifyHud(`✅ Trade clôturé avec succès !`, '#EC4899');
                    return true;
                }
            }
        } catch (e) {
            console.error('[Lumen Web Trader] Erreur fermeture:', e);
        }
        return false;
    }

    // --- ENTRÉE / RETOURNEMENT SELON CONFIGURATION DU SENS ---
    async function executeMarketOrder(signal) {
        if (signal.action === 'CLOSE' || signal.side === 'CLOSE_LONG' || signal.side === 'CLOSE_SHORT') {
            return executeCloseOrder(signal);
        }

        try {
            console.log('[Lumen Web Trader] Signal d\'action reçu:', signal);
            const isBuy = signal.side === 'BUY' || signal.side === 'LONG';
            const tradeDir = (signal.tradeDir || 'both').toLowerCase();
            const budgetStr = signal.budget ? `${signal.budget} ${signal.unit || 'USDT'}` : '';

            // 1. FILTRAGE STRICT DU SENS DU TRADE (Achat Seul / Vente Seule / Deux Sens)
            if (tradeDir === 'long' && !isBuy) {
                console.log('[Lumen Web Trader] Signal VENTE ignoré (Mode Achat / Long Seul activé dans Lumen)');
                notifyHud('🚫 Signal Vente ignoré (Mode Achat Seul)', '#94A3B8');
                return;
            }
            if (tradeDir === 'short' && isBuy) {
                console.log('[Lumen Web Trader] Signal ACHAT ignoré (Mode Vente / Short Seul activé dans Lumen)');
                notifyHud('🚫 Signal Achat ignoré (Mode Vente Seule)', '#94A3B8');
                return;
            }

            const allBtns = Array.from(document.querySelectorAll('button, a, span, div'));
            const nativeReverseBtn = allBtns.find(el => {
                const txt = (el.textContent || '').trim().toLowerCase();
                return txt === 'reverse' || txt === 'retourner' || txt === 'inverser' || txt === '⚡ reverse' || txt === '反手';
            });

            const hasActivePosition = allBtns.some(el => {
                const txt = (el.textContent || '').trim().toLowerCase();
                return txt === 'flash close' || txt === 'market close' || txt === 'clôture éclair';
            });

            // 2. UTILISATION DU BOUTON "REVERSE" UNIQUEMENT EN MODE DEUX SENS (both)
            const isBothDirs = (tradeDir === 'both');

            if (isBothDirs && hasActivePosition && nativeReverseBtn) {
                console.log('[Lumen Web Trader] Déclenchement du bouton natif REVERSE MEXC (Mode Deux Sens) !');
                notifyHud(`⚡ REVERSE NATIF MEXC (Deux Sens) : Inversion...`, '#F59E0B');

                nativeReverseBtn.click();
                await new Promise(r => setTimeout(r, 120));

                const confirmBtn = Array.from(document.querySelectorAll('button')).find(b => {
                    const txt = (b.textContent || '').trim().toLowerCase();
                    return txt === 'confirm' || txt === 'confirmer' || txt === 'ok' || txt === 'reverse';
                });
                if (confirmBtn && !confirmBtn.disabled) confirmBtn.click();

                notifyHud(`⚡ REVERSE RÉUSSI EN 1 CLIC : Inversion immédiate à 0.02% !`, isBuy ? '#10B981' : '#EF4444');
                return;
            }

            // 3. EN MODE UNIDIRECTIONNEL (Long Seul / Short Seul) : PAS de Reverse brutal, fermeture propre si demandée
            if (isBothDirs && hasActivePosition) {
                notifyHud(`🔄 RETOURNEMENT : Flash Close + Nouvel Ordre...`, '#F59E0B');
                await executeCloseOrder({ reason: 'Inversion de signal' });
                await new Promise(r => setTimeout(r, 300));
            }

            // 4. OUVERTURE NORMALE
            notifyHud(`🚀 Ouverture : ${signal.side} ${signal.symbol} (${budgetStr})`, isBuy ? '#10B981' : '#EF4444');

            // Onglet Open
            const openTab = Array.from(document.querySelectorAll('button, div[role="tab"], span')).find(el => {
                const txt = (el.textContent || '').trim();
                return txt === 'Open' || txt === 'Ouvrir' || txt === '开仓';
            });
            if (openTab) openTab.click();
            await new Promise(r => setTimeout(r, 100));

            // Onglet Market
            const marketBtn = Array.from(document.querySelectorAll('button, div[role="tab"], span, div')).find(el => {
                const txt = (el.textContent || '').trim();
                return txt === 'Market' || txt === 'Marché' || txt === '市价';
            });
            if (marketBtn) marketBtn.click();
            await new Promise(r => setTimeout(r, 120));

            // Montant automatique
            if (signal.budget && signal.budget > 0) {
                const inputs = Array.from(document.querySelectorAll('input'));
                const qtyInput = inputs.find(inp => {
                    const ph = (inp.placeholder || '').toLowerCase();
                    const aria = (inp.getAttribute('aria-label') || '').toLowerCase();
                    const name = (inp.name || '').toLowerCase();
                    return ph.includes('quantity') || ph.includes('amount') || ph.includes('montant') || ph.includes('usdt') || ph.includes('vol') || aria.includes('amount') || name.includes('amount') || name.includes('vol');
                }) || inputs[0];

                if (qtyInput) {
                    qtyInput.focus();
                    setNativeValue(qtyInput, String(signal.budget));
                }
            }
            await new Promise(r => setTimeout(r, 120));

            // Bouton Ouvrir Long / Short
            const actionButtons = Array.from(document.querySelectorAll('button'));
            const targetBtn = actionButtons.find(b => {
                const txt = (b.textContent || '').trim().toLowerCase();
                if (isBuy) return txt.includes('open long') || txt.includes('ouvrir long') || txt.includes('buy / long') || txt.includes('acheter') || txt.includes('long');
                return txt.includes('open short') || txt.includes('ouvrir short') || txt.includes('sell / short') || txt.includes('vendre') || txt.includes('short');
            });

            if (targetBtn && !targetBtn.disabled) {
                targetBtn.click();
                notifyHud(`✅ Ordre ${signal.side} (${budgetStr}) validé à 0.02% !`, isBuy ? '#10B981' : '#EF4444');
                console.log('[Lumen Web Trader] Ordre validé avec succès sur MEXC');
            } else {
                notifyHud('⚠️ Bouton d\'action non trouvé sur MEXC', '#F59E0B');
            }
        } catch (e) {
            console.error('[Lumen Web Trader] Erreur:', e);
            notifyHud('❌ Erreur exécution', '#EF4444');
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
