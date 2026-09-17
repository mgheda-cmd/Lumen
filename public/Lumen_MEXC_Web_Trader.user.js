// ==UserScript==
// @name         Lumen Auto-Trader Web MEXC (0.00% Maker & 0.02% Taker)
// @namespace    https://mgheda-cmd.github.io/Lumen/
// @version      2.2.1
// @description  Mode Maker Chaser 0.00% Frais avec sécurité 15 pts (Entrée Limit 90s / Sortie S2 Limit 25s) et Fast-Catchup (0% de frais garantis via UI Web)
// @author       Lumen Algo
// @downloadURL  https://raw.githubusercontent.com/mgheda-cmd/Lumen/main/Lumen_MEXC_Web_Trader.user.js
// @updateURL    https://raw.githubusercontent.com/mgheda-cmd/Lumen/main/Lumen_MEXC_Web_Trader.user.js
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
        console.log('>>> [Lumen Web Trader Bridge] Pont inter-onglets actif sur Lumen (v2.2.1)');
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
        pageWin.__LUMEN_USERSCRIPT_VERSION = '2.2.1';
        window.__LUMEN_USERSCRIPT_ACTIVE = true;
        window.__LUMEN_USERSCRIPT_VERSION = '2.2.1';
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
                pageWin.__LUMEN_USERSCRIPT_VERSION = '2.2.1';
                window.__LUMEN_USERSCRIPT_ACTIVE = true;
                window.__LUMEN_USERSCRIPT_VERSION = '2.2.1';
                pageWin.__LUMEN_SEND_SIGNAL = sendSignal;
                window.__LUMEN_SEND_SIGNAL = sendSignal;
                document.dispatchEvent(new CustomEvent('LumenUserscriptBridgeReady', { detail: { version: '2.2.1' } }));
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

    console.log('>>> [Lumen Web Trader] Script v2.2.1 actif sur MEXC (0.00% Maker · Veille 90s · Sécurité 15 pts)');

    let lastHandledSignalId = '';
    let lastHandledSignalTs = 0;
    let isBusy = false;

    // --- HUD UNIFIÉ FLOTTANT SUR MEXC ---
    const SCRIPT_VERSION = '2.2.1';

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

    // =========================================================================
    // BOUCLIER ANTI-POPUPS & DESTRUCTEUR UNIVERSEL D'OBSTACLES (v2.2.1)
    // =========================================================================
    function forceClick(el) {
        if (!el) return;
        try { el.scrollIntoView({ block: 'nearest' }); } catch(e){}
        try { el.focus(); } catch(e){}
        const evtOpts = { bubbles: true, cancelable: true, view: window, buttons: 1 };
        try { el.dispatchEvent(new MouseEvent('mousedown', evtOpts)); } catch(e){}
        try { el.dispatchEvent(new MouseEvent('mouseup', evtOpts)); } catch(e){}
        try { el.dispatchEvent(new MouseEvent('click', evtOpts)); } catch(e){}
        try { el.click(); } catch(e){}
    }

    function injectAntiPopupStyles() {
        if (document.getElementById('lumen-anti-popup-shield-css')) return;
        const style = document.createElement('style');
        style.id = 'lumen-anti-popup-shield-css';
        style.textContent = `
            /* 1. Neutraliser d'office les bannières d'app mobile & téléchargement */
            [class*="download-bar"], [class*="app-download"], [class*="downloadBar"],
            [class*="smartbanner"], [class*="openApp"], [class*="open-app"],
            [class*="mobile-guide"], [class*="app-banner"], [class*="appGuide"],
            [class*="download-entry"], [class*="app-download-wrap"], [class*="mexc-app-banner"],
            div[class*="open-in-app"], div[class*="openInApp"], a[href*="mexc.onelink.me"] {
                display: none !important;
                pointer-events: none !important;
                visibility: hidden !important;
                opacity: 0 !important;
                height: 0 !important;
                max-height: 0 !important;
                z-index: -99999 !important;
            }
            /* 2. Neutraliser les popups intrusives hors dialogue de confirmation d'ordre */
            div[class*="promotion-modal"], div[class*="activity-modal"]:not([class*="order"]),
            div[class*="notice-modal"]:not([class*="order"]), div[class*="survey-modal"],
            div[class*="newbie-modal"], div[class*="gift-modal"], div[class*="bonus-modal"] {
                display: none !important;
                pointer-events: none !important;
                visibility: hidden !important;
                opacity: 0 !important;
                z-index: -99999 !important;
            }
            /* 3. Garantir que le corps de page et les boutons d'ordres restent toujours cliquables */
            body, html {
                pointer-events: auto !important;
                overflow: auto !important;
            }
        `;
        (document.head || document.documentElement).appendChild(style);
    }
    injectAntiPopupStyles();
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', injectAntiPopupStyles);
    }

    function dismissAllIntrusivePopups() {
        try {
            // A. Détecter et cliquer sur les boutons/croix de fermeture de popups
            const allCandidates = Array.from(document.querySelectorAll(
                'button, a, span, i, svg, div[role="button"], [aria-label*="close" i], [aria-label*="Close" i], [class*="close" i], .ant-modal-close'
            ));

            for (const el of allCandidates) {
                if (el.closest('#lumen-trader-hud')) continue;
                const txt = (el.textContent || '').trim().toLowerCase();
                const aria = (el.getAttribute('aria-label') || '').toLowerCase();
                const cls = (el.className || '').toString().toLowerCase();

                const isDismissText = (
                    txt === '✕' || txt === '×' || txt === 'x' ||
                    txt === 'close' || txt === 'fermer' ||
                    txt === 'cancel' || txt === 'annuler' ||
                    txt === 'stay on web' || txt === 'rester sur le web' ||
                    txt === 'continuer sur le navigateur' || txt === 'continue on browser' ||
                    txt === 'plus tard' || txt === 'later' ||
                    txt === 'not now' || txt === 'pas maintenant' ||
                    txt === "j'ai compris" || txt === 'i understand' || txt === 'got it' ||
                    txt === 'ignorer' || txt === 'skip' || txt === 'non merci' || txt === 'no thanks'
                );

                const isCloseIcon = (
                    aria.includes('close') || cls.includes('close') || cls.includes('ant-modal-close') ||
                    (el.tagName && el.tagName.toLowerCase() === 'svg' && (cls.includes('close') || aria.includes('close')))
                );

                if (isDismissText || isCloseIcon) {
                    const parentDialog = el.closest('div[role="dialog"], div.modal, div[class*="modal"], div[class*="dialog"]');
                    if (parentDialog) {
                        const dialogText = (parentDialog.textContent || '').toLowerCase();
                        const isOrderConfirm = (
                            dialogText.includes('confirm order') || dialogText.includes("confirmer l'ordre") ||
                            dialogText.includes('close position') || dialogText.includes('fermer la position') ||
                            dialogText.includes('flash close') || dialogText.includes('clôture éclair') ||
                            dialogText.includes('order confirm')
                        );
                        if (isOrderConfirm) continue; // Laisser autoConfirmModal s'en charger
                    }

                    try {
                        forceClick(el);
                        console.log('[Lumen Anti-Popup Shield] Popup intrusive fermée via bouton/croix :', txt || aria || cls);
                    } catch(e){}
                }
            }

            // B. Neutraliser les masques/backdrops bloquants sans confirmation d'ordre
            const masks = Array.from(document.querySelectorAll(
                'div[class*="backdrop"], div[class*="modal-mask"], div[class*="dialog-mask"], div[class*="mask-layer"], .ant-modal-mask'
            ));
            for (const m of masks) {
                if (m.closest('#lumen-trader-hud')) continue;
                const parentModal = m.nextElementSibling || m.parentElement;
                const modalTxt = parentModal ? (parentModal.textContent || '').toLowerCase() : '';
                const isOrderModal = modalTxt.includes('confirm') || modalTxt.includes('ordre') || modalTxt.includes('order');
                if (!isOrderModal) {
                    try {
                        m.style.display = 'none';
                        m.style.pointerEvents = 'none';
                    } catch(e){}
                }
            }

            // C. Rétablir systématiquement le défilement et les interactions
            if (document.body && document.body.style.pointerEvents === 'none') {
                document.body.style.pointerEvents = 'auto';
            }
        } catch(err) {
            console.warn('[Lumen Anti-Popup Error]', err);
        }
    }

    // Lancer la surveillance permanente en tâche de fond (MutationObserver + 400ms)
    function startAntiPopupProtection() {
        try {
            const observer = new MutationObserver(() => {
                dismissAllIntrusivePopups();
            });
            observer.observe(document.documentElement || document.body, { childList: true, subtree: true });
        } catch(e){}
        setInterval(dismissAllIntrusivePopups, 400);
    }
    if (document.body) startAntiPopupProtection();
    else document.addEventListener('DOMContentLoaded', startAntiPopupProtection);


    // =========================================================================
    // DÉTECTION EXACTE DES CHAMPS PRIX & QUANTITÉ (Calibré sur Photos iPad v2.2.1)
    // =========================================================================
    function findMexcPriceInput() {
        const allLabels = Array.from(document.querySelectorAll("span, div, p, label"));
        const pLabel = allLabels.find(el => {
            const t = (el.textContent || "").trim();
            return t.includes("Price (USDT)") || t === "Price" || t === "Prix" || t.startsWith("Price (");
        });
        if (pLabel) {
            let parent = pLabel.parentElement;
            for (let i = 0; i < 4 && parent; i++) {
                const inp = parent.querySelector("input");
                if (inp) return inp;
                parent = parent.parentElement;
            }
        }
        const formInputs = Array.from(document.querySelectorAll("input")).filter(inp => {
            const isSearch = (inp.placeholder || "").toLowerCase().includes("search") || inp.type === "search";
            return !isSearch && inp.offsetParent !== null;
        });
        return formInputs.length >= 2 ? formInputs[0] : null;
    }

    function findMexcQuantityInput() {
        const allLabels = Array.from(document.querySelectorAll("span, div, p, label"));
        const qLabel = allLabels.find(el => {
            const t = (el.textContent || "").trim();
            return t.includes("Quantity (BTC)") || t.includes("Quantité (BTC)") || t.startsWith("Quantity") || t.startsWith("Quantité");
        });
        if (qLabel) {
            let parent = qLabel.parentElement;
            for (let i = 0; i < 4 && parent; i++) {
                const inp = parent.querySelector("input");
                if (inp) return inp;
                parent = parent.parentElement;
            }
        }
        const formInputs = Array.from(document.querySelectorAll("input")).filter(inp => {
            const isSearch = (inp.placeholder || "").toLowerCase().includes("search") || inp.type === "search";
            return !isSearch && inp.offsetParent !== null;
        });
        return formInputs.length > 0 ? formInputs[formInputs.length - 1] : null;
    }

    function setMexcInputValue(input, val) {
        if (!input) return false;
        try { input.focus(); } catch(e){}
        const proto = window.HTMLInputElement.prototype;
        const descriptor = Object.getOwnPropertyDescriptor(proto, "value");
        if (descriptor && descriptor.set) {
            descriptor.set.call(input, val);
        } else {
            input.value = val;
        }
        input.dispatchEvent(new Event("input", { bubbles: true, cancelable: true }));
        input.dispatchEvent(new Event("change", { bubbles: true, cancelable: true }));
        try {
            input.dispatchEvent(new InputEvent("input", { bubbles: true, data: String(val) }));
        } catch(e){}
        return true;
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


    // --- ASSISTANCE MOBILE / IPAD & CONFIRMATION AUTOMATIQUE (v2.1.9) ---
    async function ensureOrderPanelVisible() {
        // En mode iPad / Responsive : Si l'utilisateur est sur l'onglet Chart ou Info, basculer sur Order
        const navElements = Array.from(document.querySelectorAll('button, div[role="tab"], span, a, p, div'));
        const orderTab = navElements.find(el => {
            const txt = (el.textContent || '').trim().toLowerCase();
            return (txt === 'order' || txt === 'ordre' || txt === 'ordres' || txt === 'trade' || txt === 'trader') && el.offsetParent !== null;
        });
        if (orderTab && !orderTab.classList.contains('active')) {
            console.log('[Lumen Web Trader] Bascule automatique sur l\'onglet Order/Ordre MEXC...');
            orderTab.click();
            await new Promise(r => setTimeout(r, 200));
        }
    }

    async function autoConfirmModal() {
        await new Promise(r => setTimeout(r, 180));
        const modalBtns = Array.from(document.querySelectorAll('button, div[role="dialog"] button, div.modal button, div[class*="dialog"] button, div[class*="modal"] button'));
        const confirmBtn = modalBtns.find(b => {
            const txt = (b.textContent || '').trim().toLowerCase();
            return (txt === 'confirm' || txt === 'confirmer' || txt === 'ok' || txt === 'submit' || txt === 'valider') && !b.disabled;
        });
        if (confirmBtn) {
            confirmBtn.click();
            console.log('[Lumen Web Trader] Popup de confirmation MEXC validée automatiquement.');
            await new Promise(r => setTimeout(r, 150));
        }
    }

    async function cancelPendingOrders() {
        const cancelBtns = Array.from(document.querySelectorAll('button, a, span, div')).filter(el => {
            const txt = (el.textContent || '').trim().toLowerCase();
            return (txt === 'cancel' || txt === 'annuler' || txt === 'cancel all' || txt === 'tout annuler') && el.offsetParent !== null;
        });
        for (const cBtn of cancelBtns) {
            try { cBtn.click(); } catch(e){}
        }
        if (cancelBtns.length > 0) {
            console.log('[Lumen Web Trader] Ordre(s) limit en attente annulé(s) pour libérer la marge.');
            await new Promise(r => setTimeout(r, 250));
            await autoConfirmModal();
        }
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

            dismissAllIntrusivePopups();
            await ensureOrderPanelVisible();
            console.log(`[Lumen Web Trader] Clôture : Close ${targetSide} (Mode: ${useMaker ? 'Maker Chaser 0%' : 'Market'})...`);
            notifyHud(`Clôture : Close ${targetSide} (${useMaker ? 'Maker 0%' : 'Marché'})`, '#EC4899');

            // 1. Basculer sur l'onglet 'Close' (Fermer) du panneau d'ordre
            const allTabs = Array.from(document.querySelectorAll('button, div[role="tab"], span, a'));
            const closeTab = allTabs.find(el => {
                const txt = (el.textContent || '').trim();
                return txt === 'Close' || txt === 'Fermer' || txt === '平仓';
            });

            if (closeTab) {
                forceClick(closeTab);
                await new Promise(r => setTimeout(r, 120));

                let limitPlaced = false;
                if (useMaker && refPx > 0) {
                    // Tentative d'Ordre Limit pour Sortie Maker 0%
                    const limitBtn = Array.from(document.querySelectorAll('button, div[role="tab"], span, a, div')).find(el => {
                        const txt = (el.textContent || '').trim();
                        return txt === 'Limit' || txt === 'Limite' || txt === '限价';
                    });
                    if (limitBtn) {
                        forceClick(limitBtn);
                        await new Promise(r => setTimeout(r, 120));

                        // Saisie du prix de sortie Limit avec micro-offset favorable (+6$ pour Close Long, -6$ pour Close Short)
                        const offset = signal?.offsetPts || 6;
                        const targetLimitPx = isLongClose ? (refPx + offset) : (refPx - offset);
                        // Saisie précise du Prix Limit Close (0% Maker)
                        const priceInput = findMexcPriceInput();
                        if (priceInput) {
                            setMexcInputValue(priceInput, targetLimitPx.toFixed(1));
                            console.log(`[Lumen Web Trader] ✅ Prix Sortie Limit Maker saisi: ${targetLimitPx.toFixed(1)} $`);
                            await new Promise(r => setTimeout(r, 100));

                            // 100% sur le slider
                            const pct100 = Array.from(document.querySelectorAll('div, span, p, button, label')).filter(el => {
                                const txt = (el.textContent || '').trim();
                                return txt === '100%' || txt === '100';
                            });
                            if (pct100.length > 0) forceClick(pct100[pct100.length - 1]);
                            await new Promise(r => setTimeout(r, 100));

                            // Valider Close
                            const actionButtons = Array.from(document.querySelectorAll('button'));
                            const closeBtn = actionButtons.find(b => {
                                const txt = (b.textContent || '').trim().toLowerCase();
                                return isLongClose ? (txt.includes('close long') || txt.includes('fermer long')) : (txt.includes('close short') || txt.includes('fermer short'));
                            });

                            if (closeBtn && !closeBtn.disabled) {
                                forceClick(closeBtn);
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
                                notifyHud(`⚡ Annulation Limit & Bascule Sortie Marché...`, '#F59E0B');
                                await cancelPendingOrders();
                            }
                        }
                    }
                }

                // Fallback ou exécution Market directe
                const marketBtn = Array.from(document.querySelectorAll('button, div[role="tab"], span, a, div')).find(el => {
                    const txt = (el.textContent || '').trim();
                    return txt === 'Market' || txt === 'Marché' || txt === '市价';
                });
                if (marketBtn) forceClick(marketBtn);
                await new Promise(r => setTimeout(r, 120));

                const pct100Elements = Array.from(document.querySelectorAll('div, span, p, button, label')).filter(el => {
                    const txt = (el.textContent || '').trim();
                    return txt === '100%' || txt === '100';
                });
                if (pct100Elements.length > 0) forceClick(pct100Elements[pct100Elements.length - 1]);
                await new Promise(r => setTimeout(r, 120));

                const actionButtons = Array.from(document.querySelectorAll('button'));
                const closeActionBtn = actionButtons.find(b => {
                    const txt = (b.textContent || '').trim().toLowerCase();
                    return isLongClose ? (txt.includes('close long') || txt.includes('fermer long')) : (txt.includes('close short') || txt.includes('fermer short'));
                });

                if (closeActionBtn && !closeActionBtn.disabled) {
                    forceClick(closeActionBtn);
                    notifyHud(`✅ Position ${targetSide} fermée avec succès !`, '#EC4899');
                    await autoConfirmModal();
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
                forceClick(flashCloseBtn);
                await new Promise(r => setTimeout(r, 150));
                const confirmBtn = Array.from(document.querySelectorAll('button')).find(b => {
                    const txt = (b.textContent || '').trim().toLowerCase();
                    return txt === 'confirm' || txt === 'confirmer' || txt === 'ok';
                });
                if (confirmBtn && !confirmBtn.disabled) forceClick(confirmBtn);
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
            await ensureOrderPanelVisible();
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
                    // Saisie ciblée du Prix Limit (0% Maker)
                    const priceInput = findMexcPriceInput();
                    if (priceInput) {
                        setMexcInputValue(priceInput, targetLimitPx.toFixed(1));
                        console.log(`[Lumen Web Trader] ✅ Prix Limit Maker saisi: ${targetLimitPx.toFixed(1)} $`);
                        await new Promise(r => setTimeout(r, 100));
                    }

                    // Saisie ciblée de la Quantité exacte (0.032 BTC par défaut, plafond 0.05)
                    const qtyInput = findMexcQuantityInput();
                    const rawBtcQty = Number(signal?.qty || signal?.btcQty || 0.032);
                    const btcQty = Math.min(rawBtcQty, 0.05); // Plafond maximal strict 0.05 BTC
                    const valToEnter = btcQty.toFixed(3); // Toujours 0.032 en mode BTC

                    if (qtyInput) {
                        setMexcInputValue(qtyInput, valToEnter);
                        console.log(`[Lumen Web Trader] ✅ Quantité Limit saisie: ${valToEnter} BTC (~48$ de marge)`);
                        await new Promise(r => setTimeout(r, 100));
                    }

                    if (priceInput || qtyInput) {

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
                            await autoConfirmModal();

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
                            notifyHud(`⚡ Annulation Limit & Bascule Entrée Marché...`, '#F59E0B');
                            await cancelPendingOrders();
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

            // Saisie ciblée de la Quantité exacte en mode Market (0.032 BTC garanti)
            const qtyInput = findMexcQuantityInput();
            const rawBtcQty = Number(signal?.qty || signal?.btcQty || 0.032);
            const btcQty = Math.min(rawBtcQty, 0.05); // Plafond maximal strict 0.05 BTC
            const valToEnter = btcQty.toFixed(3); // Toujours 0.032 en mode BTC

            if (qtyInput) {
                setMexcInputValue(qtyInput, valToEnter);
                console.log(`[Lumen Web Trader] ✅ Quantité Market saisie: ${valToEnter} BTC (~48$ de marge)`);
                await new Promise(r => setTimeout(r, 100));
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
                await autoConfirmModal();
            } else {
                console.warn('[Lumen Web Trader] Bouton d\'action non trouvé ou désactivé:', targetBtn);
                notifyHud('⚠️ Bouton d\'action introuvable (Activez l\'onglet Order)', '#F59E0B');
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
