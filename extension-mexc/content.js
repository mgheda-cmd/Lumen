(function() {
    'use strict';

    console.log('[Lumen Extension] Extension MEXC Auto-Trader v1.4.0 active...');

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
        }, 5000);
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

    async function executeMarketOrder(signal) {
        try {
            console.log('[Lumen Extension] Signal complet reçu:', signal);
            const budgetStr = signal.budget ? `${signal.budget} ${signal.unit || 'USDT'}` : '';
            notifyHud(`Signal : ${signal.side} ${signal.symbol} (${budgetStr})`, signal.side === 'BUY' ? '#10B981' : '#EF4444');

            // 1. Sélectionner l'onglet 'Market' (Marché)
            const tabs = Array.from(document.querySelectorAll('button, div[role="tab"], span, div'));
            const marketBtn = tabs.find(el => {
                const txt = (el.textContent || '').trim();
                return txt === 'Market' || txt === 'Marché' || txt === '市价';
            });
            if (marketBtn) {
                marketBtn.click();
            }

            await new Promise(r => setTimeout(r, 150));

            // 2. Remplir le montant / quantité si transmis depuis Lumen
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
                    console.log('[Lumen Extension] Montant renseigné automatiquement:', signal.budget);
                }
            }

            await new Promise(r => setTimeout(r, 150));

            // 3. Cliquer sur le bouton Ouvrir Long / Ouvrir Short
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
                notifyHud(`✅ Ordre ${signal.side} (${budgetStr}) validé à 0.02% !`, isBuy ? '#10B981' : '#EF4444');
            } else {
                notifyHud('⚠️ Bouton d\'action non trouvé sur MEXC', '#F59E0B');
            }
        } catch (e) {
            console.error('[Lumen Extension] Erreur:', e);
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
