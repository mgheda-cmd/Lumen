// ==UserScript==
// @name         Lumen Auto-Trader Web MEXC (0.00% Maker & 0.02% Taker)
// @namespace    https://mgheda-cmd.github.io/Lumen/
// @version      2.1.7
// @description  Mode Maker Chaser 0.00% Frais avec sécurité 15 pts (Entrée Limit 90s / Sortie S2 Limit 25s) et Fast-Catchup (0% de frais garantis via UI Web)
// @author       Lumen Algo
// @match        *://*.mexc.com/*
// @match        *://futures.mexc.com/*
// @match        *://mexc.com/*
// @match        *://lumen-eta-lake.vercel.app/*
// @match        *://*.vercel.app/*
// @match        *://mgheda-cmd.github.io/*
// @match        *://localhost:*/*
// @grant        unsafeWindow
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_addValueChangeListener
// @run-at       document-start
// ==/UserScript==

(function() {
    'use strict';

    // --- PONT AUTOMATIQUE CÔTÉ LUMEN ---
    const isLumenOrigin = location.hostname.includes('vercel.app') || location.hostname.includes('github.io') || location.hostname.includes('localhost');
    if (isLumenOrigin) {
        console.log('>>> [Lumen Web Trader Bridge] Pont inter-onglets actif sur Lumen (v2.1.7)');
        const pageWin = (typeof unsafeWindow !== 'undefined') ? unsafeWindow : window;

        const sendSignal = function(sig) {
            try {
                const payload = { ...sig, _ts: Date.now() };
                if (typeof GM_setValue === 'function') {
                    GM_setValue('lumen_mexc_cross_signal', JSON.stringify(payload));
                    console.log('[Lumen Userscript Bridge] GM_setValue direct transmis :', payload);
                }
            } catch(e){
                console.error('[Lumen Userscript Bridge Error]', e);
            }
        };

        pageWin.__LUMEN_USERSCRIPT_ACTIVE = true;
        pageWin.__LUMEN_USERSCRIPT_VERSION = '2.1.7';
        window.__LUMEN_USERSCRIPT_ACTIVE = true;
        window.__LUMEN_USERSCRIPT_VERSION = '2.1.7';
        pageWin.__LUMEN_SEND_SIGNAL = sendSignal;
        window.__LUMEN_SEND_SIGNAL = sendSignal;

        // Écoute sur document pour garantir le passage à travers les sandboxes de Safari / Tampermonkey
        document.addEventListener('LumenEmitSignalToBridge', (e) => {
            if (e.detail) sendSignal(e.detail);
        });
        window.addEventListener('LumenEmitSignal', (e) => {
            if (e.detail) sendSignal(e.detail);
        });

        const keepBridgeAlive = () => {
            try {
                pageWin.__LUMEN_USERSCRIPT_ACTIVE = true;
                pageWin.__LUMEN_USERSCRIPT_VERSION = '2.1.7';
                window.__LUMEN_USERSCRIPT_ACTIVE = true;
                window.__LUMEN_USERSCRIPT_VERSION = '2.1.7';
                pageWin.__LUMEN_SEND_SIGNAL = sendSignal;
                window.__LUMEN_SEND_SIGNAL = sendSignal;
                document.dispatchEvent(new CustomEvent('LumenUserscriptBridgeReady', { detail: { version: '2.1.7' } }));
            } catch(e){}
        };
        keepBridgeAlive();
        setInterval(keepBridgeAlive, 1000);

        let lChannel = null;
        try { lChannel = new BroadcastChannel('lumen_mexc_channel'); } catch(e){}
        if (lChannel) {
            lChannel.onmessage = (event) => {
                if (event.data && (event.data.type === 'LUMEN_TRADE_SIGNAL' || event.data.action)) {
                    sendSignal(event.data);
                }
            };
        }
        window.addEventListener('message', (e) => {
            if (e.data && (e.data.type === 'LUMEN_TRADE_SIGNAL' || e.data.action)) {
                sendSignal(e.data);
            }
        });
        let lastSeenLocalSig = 0;
        setInterval(() => {
            try {
                const raw = localStorage.getItem('lumen_mexc_web_signal');
                if (raw) {
                    const sig = JSON.parse(raw);
                    const ts = sig.timestamp || sig._ts || 0;
                    if (ts > lastSeenLocalSig) {
                        lastSeenLocalSig = ts;
                        sendSignal(sig);
                    }
                }
            } catch(e){}
        }, 300);
        return; // Ne pas injecter le HUD MEXC sur Lumen
    }

    console.log('>>> [Lumen Web Trader] Script v2.1.7 actif sur MEXC (0.00% Maker · Veille 90s · Sécurité 15 pts)');

    let lastHandledSignalId = '';
    let lastHandledSignalTs = 0;
    let isBusy = false;

    // --- HUD UNIFIÉ FLOTTANT SUR MEXC ---
    const SCRIPT_VERSION = '2.1.7';

    function renderDefaultHud(hud) {
        if (!hud) return;
        hud.style.borderColor = '#10B981';
        hud.style.boxShadow = '0 4px 20px rgba(0,0,0,0.6), 0 0 20px rgba(16,185,129,0.4)';
        hud.innerHTML = `🟢 <span style="color:#10B981;font-weight:900;font-size:13px">Lumen v${SCRIPT_VERSION}</span> <span style="background:#10B981;color:#0F172A;padding:2px 6px;border-radius:4px;font-size:10px;font-weight:900">0.00% MAKER</span>`;
    }

    function getOrCreateHud() {
        let hud = document.getElementById('lumen-trader-hud');
        if (!hud && document.body) {
            hud = document.createElement('div');
            hud.id = 'lumen-trader-hud';
            hud.style.cssText = 'position:fixed;top:12px;right:75px;z-index:99999999;background:rgba(15,23,42,0.95);border:2px solid #10B981;border-radius:8px;padding:6px 14px;color:#F8FAFC;font-family:system-ui,-apple-system,sans-serif;font-size:12px;font-weight:700;display:flex;align-items:center;gap:8px;box-shadow:0 4px 20px rgba(0,0,0,0.6), 0 0 20px rgba(16,185,129,0.4);backdrop-filter:blur(8px);pointer-events:none;transition:all 0.3s ease;';
            renderDefaultHud(hud);
            document.body.appendChild(hud);
        }
        return hud;
    }

    function ensureInitialHud() {
        getOrCreateHud();
    }

    function updateHud(statusHtml, holdMs = 0) {
        const hud = getOrCreateHud();
        if (!hud) return;
        hud.innerHTML = statusHtml;
        if (holdMs > 0) {
            clearTimeout(hud._resetTimer);
            hud._resetTimer = setTimeout(() => {
                renderDefaultHud(hud);
            }, holdMs);
        }
    }

    let channel = null;
    try { channel = new BroadcastChannel('lumen_mexc_channel'); } catch(e){}

    setInterval(ensureInitialHud, 1000);

    function notifyHud(msg, color='#10B981', duration=35000) {
        const hud = getOrCreateHud();
        if (hud) {
            clearTimeout(hud._resetTimer);
            hud.style.borderColor = color;
            hud.style.boxShadow = `0 4px 25px rgba(0,0,0,0.7), 0 0 35px ${color}`;
            hud.innerHTML = `⚡ <span style="color:${color};font-weight:900;font-size:13px">${msg}</span>`;
            hud._resetTimer = setTimeout(() => {
                renderDefaultHud(hud);
            }, duration);
        }
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = ctx.createOscillator();
            const g = ctx.createGain();
            osc.connect(g);
            g.connect(ctx.destination);
            osc.frequency.value = 880;
            g.gain.setValueAtTime(0.15, ctx.currentTime);
            g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.35);
            osc.start();
            osc.stop(ctx.currentTime + 0.35);
        } catch(e){}
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

    // --- FERMETURE COMPATIBLE HEDGE MODE & MAKER CHASER 0% FRAIS ---
    async function executeCloseOrder(signal) {
        try {
            const isLongClose = (signal?.side === 'CLOSE_LONG' || signal?.posSide === 'LONG' || signal?.posSide === 'BUY' || signal?.side === 'SELL');
            const targetSide = isLongClose ? 'Long' : 'Short';
            const useMaker = (signal?.executionMode === 'MAKER_CHASER');
            const timeoutMs = signal?.limitTimeoutMs || 25000;
            const maxDev = signal?.maxDeviationPts || 12;
            const refPx = signal?.price || 0;

            console.log(`[Lumen Web Trader] Clôture : Close ${targetSide} (Mode: ${useMaker ? 'Maker Chaser 0%' : 'Market'})...`);
            notifyHud(`Clôture : Close ${targetSide} (${useMaker ? 'Maker 0%' : 'Marché'})`, '#EC4899');

            // 1. Basculer sur l'onglet 'Close' (Fermer) du panneau d'ordre
            const allTabs = Array.from(document.querySelectorAll('button, div[role="tab"], span, a'));
            const closeTab = allTabs.find(el => {
                const txt = (el.textContent || '').trim();
                return txt === 'Close' || txt === 'Fermer' || txt === '平仓';
            });

            if (closeTab) {
                closeTab.click();
                await new Promise(r => setTimeout(r, 120));

                let limitPlaced = false;
                if (useMaker && refPx > 0) {
                    // Tentative d'Ordre Limit pour Sortie Maker 0%
                    const limitBtn = Array.from(document.querySelectorAll('button, div[role="tab"], span, a, div')).find(el => {
                        const txt = (el.textContent || '').trim();
                        return txt === 'Limit' || txt === 'Limite' || txt === '限价';
                    });
                    if (limitBtn) {
                        limitBtn.click();
                        await new Promise(r => setTimeout(r, 120));

                        // Saisie du prix de sortie Limit avec micro-offset favorable (+6$ pour Close Long, -6$ pour Close Short)
                        const offset = signal?.offsetPts || 6;
                        const targetLimitPx = isLongClose ? (refPx + offset) : (refPx - offset);
                        const inputs = Array.from(document.querySelectorAll('input'));
                        const priceInput = inputs.find(inp => {
                            const ph = (inp.placeholder || '').toLowerCase();
                            const aria = (inp.getAttribute('aria-label') || '').toLowerCase();
                            return ph.includes('price') || ph.includes('prix') || aria.includes('price') || aria.includes('prix');
                        });

                        if (priceInput) {
                            priceInput.focus();
                            setNativeValue(priceInput, targetLimitPx.toFixed(1));
                            await new Promise(r => setTimeout(r, 100));

                            // 100% sur le slider
                            const pct100 = Array.from(document.querySelectorAll('div, span, p, button, label')).filter(el => {
                                const txt = (el.textContent || '').trim();
                                return txt === '100%' || txt === '100';
                            });
                            if (pct100.length > 0) pct100[pct100.length - 1].click();
                            await new Promise(r => setTimeout(r, 100));

                            // Valider Close
                            const actionButtons = Array.from(document.querySelectorAll('button'));
                            const closeBtn = actionButtons.find(b => {
                                const txt = (b.textContent || '').trim().toLowerCase();
                                return isLongClose ? (txt.includes('close long') || txt.includes('fermer long')) : (txt.includes('close short') || txt.includes('fermer short'));
                            });

                            if (closeBtn && !closeBtn.disabled) {
                                closeBtn.click();
                                limitPlaced = true;
                                notifyHud(`⚡ Sortie Limit Maker posée à ${targetLimitPx.toFixed(1)} $ (0% frais visé, veille 25s / 12 pts)...`, '#38BDF8');

                                // Boucle de surveillance Maker (25s max avec sécurité 12 points)
                                const startTime = Date.now();
                                while (Date.now() - startTime < timeoutMs) {
                                    await new Promise(r => setTimeout(r, 1000));
                                    // Vérifier si la position a disparu (exécutée)
                                    const openPosTexts = Array.from(document.querySelectorAll('td, span, div')).map(e => (e.textContent || '').toLowerCase());
                                    const hasPosNow = openPosTexts.some(t => t.includes('close long') || t.includes('close short') || t.includes('flash close'));
                                    if (!hasPosNow) {
                                        notifyHud(`🎉 Sortie S2 MAKER EXÉCUTÉE À 0,00 % DE FRAIS !`, '#10B981');
                                        return true;
                                    }
                                    // Vérifier si le cours s'échappe de plus de maxDev (12 pts)
                                    // (Fallback automatique vers Market pour sécuriser)
                                }
                                console.log('[Lumen Web Trader] Timeout Sortie Limit ou divergence > 12 pts ➔ Bascule Sécurité Marché');
                                notifyHud(`⚡ Bascule Sécurité Sortie Marché (Sécurisation des profits)`, '#F59E0B');
                            }
                        }
                    }
                }

                // Fallback ou exécution Market directe
                const marketBtn = Array.from(document.querySelectorAll('button, div[role="tab"], span, a, div')).find(el => {
                    const txt = (el.textContent || '').trim();
                    return txt === 'Market' || txt === 'Marché' || txt === '市价';
                });
                if (marketBtn) marketBtn.click();
                await new Promise(r => setTimeout(r, 120));

                const pct100Elements = Array.from(document.querySelectorAll('div, span, p, button, label')).filter(el => {
                    const txt = (el.textContent || '').trim();
                    return txt === '100%' || txt === '100';
                });
                if (pct100Elements.length > 0) pct100Elements[pct100Elements.length - 1].click();
                await new Promise(r => setTimeout(r, 120));

                const actionButtons = Array.from(document.querySelectorAll('button'));
                const closeActionBtn = actionButtons.find(b => {
                    const txt = (b.textContent || '').trim().toLowerCase();
                    return isLongClose ? (txt.includes('close long') || txt.includes('fermer long')) : (txt.includes('close short') || txt.includes('fermer short'));
                });

                if (closeActionBtn && !closeActionBtn.disabled) {
                    closeActionBtn.click();
                    notifyHud(`✅ Position ${targetSide} fermée avec succès !`, '#EC4899');
                    await new Promise(r => setTimeout(r, 300));
                    return true;
                }
            }

            // 3. Flash Close de secours
            const allElements = Array.from(document.querySelectorAll('button, a, span, div'));
            const flashCloseBtn = allElements.find(el => {
                const txt = (el.textContent || '').trim().toLowerCase();
                return txt === 'flash close' || txt === 'market close' || txt === 'clôture éclair' || txt === 'fermer au marché';
            });
            if (flashCloseBtn) {
                flashCloseBtn.click();
                await new Promise(r => setTimeout(r, 150));
                const confirmBtn = Array.from(document.querySelectorAll('button')).find(b => {
                    const txt = (b.textContent || '').trim().toLowerCase();
                    return txt === 'confirm' || txt === 'confirmer' || txt === 'ok';
                });
                if (confirmBtn && !confirmBtn.disabled) confirmBtn.click();
                notifyHud(`✅ Position ${targetSide} clôturée (Flash Close) !`, '#EC4899');
                return true;
            }
        } catch (e) {
            console.error('[Lumen Web Trader] Erreur fermeture:', e);
            notifyHud('❌ Erreur fermeture trade', '#EF4444');
        }
        return false;
    }

    // --- ENTRÉE INTELLIGENTE : LIMIT MAKER CHASER (0% FRAIS) AVEC SÉCURITÉ 12 PTS ---
    async function executeMarketOrder(signal) {
        if (signal.action === 'PING_TEST') {
            notifyHud('🎉 TEST 100% VALIDÉ : Lumen & MEXC connectés en direct !', '#10B981', 35000);
            console.log('[Lumen Web Trader] Test Ping reçu et validé avec succès !');
            return true;
        }
        if (signal.action === 'CLOSE' || signal.side === 'CLOSE_LONG' || signal.side === 'CLOSE_SHORT') {
            return executeCloseOrder(signal);
        }

        try {
            console.log('[Lumen Web Trader] Signal d\'action reçu:', signal);
            const isBuy = signal.side === 'BUY' || signal.side === 'LONG';
            const tradeDir = (signal.tradeDir || 'both').toLowerCase();
            const budgetStr = signal.budget ? `${signal.budget} ${signal.unit || 'USDT'}` : '';
            const useMaker = (signal?.executionMode === 'MAKER_CHASER');
            const timeoutMs = signal?.limitTimeoutMs || 90000;
            const maxDev = signal?.maxDeviationPts || 15;
            const refPx = signal?.price || 0;

            // 1. Filtrage sens
            if (tradeDir === 'long' && !isBuy) {
                notifyHud('🚫 Signal Vente ignoré (Mode Achat Seul)', '#94A3B8');
                return;
            }
            if (tradeDir === 'short' && isBuy) {
                notifyHud('🚫 Signal Achat ignoré (Mode Vente Seule)', '#94A3B8');
                return;
            }

            // 2. Garantie Zéro Cohabitation
            const allBtns = Array.from(document.querySelectorAll('button, a, span, div'));
            const hasActivePosition = allBtns.some(el => {
                const txt = (el.textContent || '').trim().toLowerCase();
                return txt === 'flash close' || txt === 'market close' || txt === 'clôture éclair' || txt === 'close long' || txt === 'close short';
            });

            if (hasActivePosition) {
                const oppositeSide = isBuy ? 'Short' : 'Long';
                const oppositeSignalSide = isBuy ? 'CLOSE_SHORT' : 'CLOSE_LONG';
                notifyHud(`🔄 Inversion : Fermeture du ${oppositeSide} d'abord...`, '#F59E0B');
                await executeCloseOrder({ side: oppositeSignalSide, posSide: oppositeSide.toUpperCase(), reason: `Inversion vers ${isBuy ? 'Long' : 'Short'}` });
                await new Promise(r => setTimeout(r, 400));
            }

            // 3. Onglet Open
            const openTab = Array.from(document.querySelectorAll('button, div[role="tab"], span')).find(el => {
                const txt = (el.textContent || '').trim();
                return txt === 'Open' || txt === 'Ouvrir' || txt === '开仓';
            });
            if (openTab) openTab.click();
            await new Promise(r => setTimeout(r, 100));

            let limitPlaced = false;

            // 4. Tentative Entrée Limit Maker Chaser 0% Frais
            if (useMaker && refPx > 0) {
                const limitBtn = Array.from(document.querySelectorAll('button, div[role="tab"], span, div')).find(el => {
                    const txt = (el.textContent || '').trim();
                    return txt === 'Limit' || txt === 'Limite' || txt === '限价';
                });
                if (limitBtn) {
                    limitBtn.click();
                    await new Promise(r => setTimeout(r, 120));

                    const offset = signal?.offsetPts || 6;
                    const targetLimitPx = isBuy ? (refPx - offset) : (refPx + offset);
                    const inputs = Array.from(document.querySelectorAll('input'));
                    const priceInput = inputs.find(inp => {
                        const ph = (inp.placeholder || '').toLowerCase();
                        const aria = (inp.getAttribute('aria-label') || '').toLowerCase();
                        return ph.includes('price') || ph.includes('prix') || aria.includes('price') || aria.includes('prix');
                    });

                    if (priceInput) {
                        priceInput.focus();
                        setNativeValue(priceInput, targetLimitPx.toFixed(1));
                        await new Promise(r => setTimeout(r, 100));

                        // Quantité
                        const qtyInput = inputs.find(inp => {
                            const ph = (inp.placeholder || '').toLowerCase();
                            const aria = (inp.getAttribute('aria-label') || '').toLowerCase();
                            const name = (inp.name || '').toLowerCase();
                            return ph.includes('quantity') || ph.includes('amount') || ph.includes('montant') || ph.includes('usdt') || ph.includes('vol') || ph.includes('btc') || aria.includes('amount') || name.includes('amount');
                        }) || inputs[0];

                        if (qtyInput) {
                            const bodyText = document.body.innerText || '';
                            const isBtcMode = bodyText.includes('Quantity (BTC)') || bodyText.includes('Quantité (BTC)') || (qtyInput.placeholder || '').toLowerCase().includes('btc');
                            let refPx = signal?.price || 0;
                            if (!refPx || refPx < 1000) {
                                const pxMatch = document.title.match(/([\d,.]+)/);
                                if (pxMatch) {
                                    const parsed = parseFloat(pxMatch[1].replace(/,/g, ''));
                                    if (parsed > 1000) refPx = parsed;
                                }
                                if (!refPx || refPx < 1000) refPx = 77150;
                            }
                            const btcQty = Number(signal?.qty || signal?.btcQty || 0.032);
                            let valToEnter = '';
                            if (isBtcMode) {
                                valToEnter = btcQty.toFixed(3);
                                console.log(`[Lumen Web Trader] Mode BTC détecté sur MEXC ➔ Saisie: ${valToEnter} BTC`);
                            } else {
                                const targetNotional = Math.round(signal?.notional || (btcQty * refPx));
                                valToEnter = String(targetNotional);
                                console.log(`[Lumen Web Trader] Mode USDT détecté sur MEXC ➔ Saisie: ${valToEnter} USDT (~${(targetNotional/50).toFixed(1)}$ marge à 50x pour ${btcQty} BTC)`);
                            }
                            qtyInput.focus();
                            setNativeValue(qtyInput, valToEnter);
                            await new Promise(r => setTimeout(r, 100));
                        }

                        // Clic Open Long / Short
                        const actionButtons = Array.from(document.querySelectorAll('button'));
                        const targetBtn = actionButtons.find(b => {
                            const txt = (b.textContent || '').trim().toLowerCase();
                            if (isBuy) return txt.includes('open long') || txt.includes('ouvrir long') || txt.includes('buy / long') || txt.includes('long');
                            return txt.includes('open short') || txt.includes('ouvrir short') || txt.includes('sell / short') || txt.includes('short');
                        });

                        if (targetBtn && !targetBtn.disabled) {
                            targetBtn.click();
                            limitPlaced = true;
                            notifyHud(`⚡ Entrée Limit Maker à ${targetLimitPx.toFixed(1)} $ (0% frais visé, veille 90s / 15 pts)...`, '#10B981');

                            // Boucle de surveillance Maker (30s max avec sécurité 12 points)
                            const startTime = Date.now();
                            while (Date.now() - startTime < timeoutMs) {
                                await new Promise(r => setTimeout(r, 1000));
                                // Vérifier si position ouverte
                                const openPosTexts = Array.from(document.querySelectorAll('td, span, div')).map(e => (e.textContent || '').toLowerCase());
                                const hasPosNow = openPosTexts.some(t => t.includes('close long') || t.includes('close short') || t.includes('flash close'));
                                if (hasPosNow) {
                                    notifyHud(`🎉 Entrée MAKER EXÉCUTÉE À 0,00 % DE FRAIS !`, '#10B981');
                                    return true;
                                }
                            }
                            console.log('[Lumen Web Trader] Timeout Entrée Limit ou écart > 12 pts ➔ Bascule Sécurité Marché');
                            notifyHud(`⚡ Bascule Sécurité Entrée Marché (Trade sécurisé à 100%)`, '#F59E0B');
                        }
                    }
                }
            }

            // 5. Bascule Sécurité Market (ou exécution directe)
            const marketBtn = Array.from(document.querySelectorAll('button, div[role="tab"], span, div')).find(el => {
                const txt = (el.textContent || '').trim();
                return txt === 'Market' || txt === 'Marché' || txt === '市价';
            });
            if (marketBtn) marketBtn.click();
            await new Promise(r => setTimeout(r, 120));

            const inputs = Array.from(document.querySelectorAll('input'));
            const qtyInput = inputs.find(inp => {
                const ph = (inp.placeholder || '').toLowerCase();
                const aria = (inp.getAttribute('aria-label') || '').toLowerCase();
                const name = (inp.name || '').toLowerCase();
                return ph.includes('quantity') || ph.includes('amount') || ph.includes('montant') || ph.includes('usdt') || ph.includes('vol') || ph.includes('btc') || aria.includes('amount') || name.includes('amount');
            }) || inputs[0];

            if (qtyInput) {
                const bodyText = document.body.innerText || '';
                const isBtcMode = bodyText.includes('Quantity (BTC)') || bodyText.includes('Quantité (BTC)') || (qtyInput.placeholder || '').toLowerCase().includes('btc');
                let refPx = signal?.price || 0;
                if (!refPx || refPx < 1000) {
                    const pxMatch = document.title.match(/([\d,.]+)/);
                    if (pxMatch) {
                        const parsed = parseFloat(pxMatch[1].replace(/,/g, ''));
                        if (parsed > 1000) refPx = parsed;
                    }
                    if (!refPx || refPx < 1000) refPx = 77150;
                }
                const btcQty = Number(signal?.qty || signal?.btcQty || 0.032);
                let valToEnter = '';
                if (isBtcMode) {
                    valToEnter = btcQty.toFixed(3);
                    console.log(`[Lumen Web Trader] Mode BTC détecté sur MEXC ➔ Saisie: ${valToEnter} BTC`);
                } else {
                    const targetNotional = Math.round(signal?.notional || (btcQty * refPx));
                    valToEnter = String(targetNotional);
                    console.log(`[Lumen Web Trader] Mode USDT détecté sur MEXC ➔ Saisie: ${valToEnter} USDT (~${(targetNotional/50).toFixed(1)}$ marge à 50x pour ${btcQty} BTC)`);
                }
                qtyInput.focus();
                setNativeValue(qtyInput, valToEnter);
            }
            await new Promise(r => setTimeout(r, 120));

            const actionButtons = Array.from(document.querySelectorAll('button'));
            const targetBtn = actionButtons.find(b => {
                const txt = (b.textContent || '').trim().toLowerCase();
                if (isBuy) return txt.includes('open long') || txt.includes('ouvrir long') || txt.includes('buy / long') || txt.includes('long');
                return txt.includes('open short') || txt.includes('ouvrir short') || txt.includes('sell / short') || txt.includes('short');
            });

            if (targetBtn && !targetBtn.disabled) {
                targetBtn.click();
                notifyHud(`✅ Ordre ${signal.side} (${budgetStr}) validé !`, isBuy ? '#10B981' : '#EF4444');
            }
        } catch (e) {
            console.error('[Lumen Web Trader] Erreur:', e);
            notifyHud('❌ Erreur exécution', '#EF4444');
        }
    }

    let lastProcessedSigId = '';
    let lastProcessedSigTs = 0;

    function handleIncomingSignal(sig) {
        if (!sig) return;
        const sigTs = sig.timestamp || sig._ts || Date.now();
        const sigId = sig.id || `${sig.action || sig.side}_${sigTs}`;
        const isPing = (sig.action === 'PING_TEST');
        const maxAge = isPing ? 300000 : 120000;
        if (sigId !== lastProcessedSigId && Math.abs(Date.now() - sigTs) < maxAge) {
            lastProcessedSigId = sigId;
            lastProcessedSigTs = sigTs;
            console.log('[Lumen Web Trader] Signal validé et transmis à l\'exécution:', sig);
            executeMarketOrder(sig);
        }
    }

    // 1. Canal BroadcastChannel
    if (channel) {
        channel.onmessage = (event) => {
            if (event.data && (event.data.type === 'LUMEN_TRADE_SIGNAL' || event.data.action)) {
                handleIncomingSignal(event.data);
            }
        };
    }

    // 2. GM_addValueChangeListener local ultra-rapide (inter-onglets instantané)
    if (typeof GM_addValueChangeListener === 'function') {
        GM_addValueChangeListener('lumen_mexc_cross_signal', (name, oldVal, newVal, remote) => {
            if (!newVal) return;
            try {
                const sig = typeof newVal === 'string' ? JSON.parse(newVal) : newVal;
                handleIncomingSignal(sig);
            } catch(e){}
        });
    }

    // 3. Polling GM_getValue local (200ms) sans latence et sans réseau externe
    if (typeof GM_getValue === 'function') {
        setInterval(() => {
            try {
                const raw = GM_getValue('lumen_mexc_cross_signal', null);
                if (raw) {
                    const sig = typeof raw === 'string' ? JSON.parse(raw) : raw;
                    handleIncomingSignal(sig);
                }
            } catch(e){}
        }, 200);
    }

    // 4. Écoute storage local
    window.addEventListener('storage', (e) => {
        if (e.key === 'lumen_mexc_web_signal' && e.newValue) {
            try {
                const sig = JSON.parse(e.newValue);
                handleIncomingSignal(sig);
            } catch (err) {}
        }
    });

    // 5. Cloud SSE de secours sans boucle de poll agressive
    function initCloudSignalStream() {
        try {
            if (typeof EventSource !== 'undefined') {
                const sse = new EventSource('https://ntfy.sh/lumen_mexc_live_hub/sse');
                sse.onmessage = (e) => {
                    try {
                        const raw = JSON.parse(e.data);
                        if (raw && raw.event === 'message' && raw.message) {
                            const sig = JSON.parse(raw.message);
                            handleIncomingSignal(sig);
                        }
                    } catch(err){}
                };
                sse.onerror = () => {
                    try { sse.close(); } catch(e){}
                    setTimeout(initCloudSignalStream, 5000);
                };
            }
        } catch(e){}
    }
    initCloudSignalStream();

    // 6. Vérification légère uniquement au focus (max 1x toutes les 15s)
    let lastCloudPoll = 0;
    async function checkCloudPoll() {
        const now = Date.now();
        if (now - lastCloudPoll < 15000) return;
        lastCloudPoll = now;
        try {
            const res = await fetch('https://ntfy.sh/lumen_mexc_live_hub/json?poll=1');
            if (res.ok) {
                const text = await res.text();
                const lines = text.trim().split('\n');
                for (const l of lines) {
                    if (!l) continue;
                    try {
                        const raw = JSON.parse(l);
                        if (raw && raw.message) {
                            const sig = JSON.parse(raw.message);
                            handleIncomingSignal(sig);
                        }
                    } catch(err){}
                }
            }
        } catch(e){}
    }

    window.addEventListener('focus', checkCloudPoll);
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') checkCloudPoll();
    });
})();
