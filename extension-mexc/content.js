(function() {
    'use strict';

    console.log('[Lumen Extension] Extension MEXC Auto-Trader active...');

    let channel = null;
    try { channel = new BroadcastChannel('lumen_mexc_channel'); } catch(e){}

    function createHud() {
        if (document.getElementById('lumen-web-hud')) return;
        if (!document.body) return;

        const hud = document.createElement('div');
        hud.id = 'lumen-web-hud';
        hud.style.cssText = 'position:fixed;top:70px;right:24px;z-index:9999999;background:rgba(15,23,42,0.96);border:2.5px solid #10B981;border-radius:12px;padding:12px 18px;color:#fff;font-family:system-ui,-apple-system,sans-serif;font-size:13px;font-weight:800;box-shadow:0 12px 40px rgba(16,185,129,0.5);backdrop-filter:blur(10px);display:flex;align-items:center;gap:10px;pointer-events:none;transition:all 0.3s;animation:pulse 2s infinite';
        hud.innerHTML = '🟢 <span style="font-weight:900;color:#10B981;font-size:13px">Lumen Extension Active</span> <span style="font-size:10px;color:#0F172A;background:#10B981;padding:3px 8px;border-radius:5px;font-weight:900">Frais 0.02%</span>';
        document.body.appendChild(hud);
    }

    // Boucle d'insertion pour s'assurer que le badge s'affiche toujours
    setInterval(createHud, 1000);

    function notifyHud(msg, color='#10B981') {
        const hud = document.getElementById('lumen-web-hud');
        if (!hud) return;
        hud.style.borderColor = color;
        hud.innerHTML = `⚡ <span style="font-weight:900;color:${color}">${msg}</span>`;
        setTimeout(() => {
            if (hud) {
                hud.style.borderColor = '#10B981';
                hud.innerHTML = '🟢 <span style="font-weight:900;color:#10B981;font-size:13px">Lumen Extension Active</span> <span style="font-size:10px;color:#0F172A;background:#10B981;padding:3px 8px;border-radius:5px;font-weight:900">Frais 0.02%</span>';
            }
        }, 5000);
    }

    async function executeMarketOrder(signal) {
        try {
            console.log('[Lumen Extension] Signal reçu:', signal);
            notifyHud(`Signal reçu : ${signal.side} ${signal.symbol}`, signal.side === 'BUY' ? '#10B981' : '#EF4444');

            // 1. Bouton Marché
            const buttons = Array.from(document.querySelectorAll('button, div[role="tab"], span, div'));
            const marketBtn = buttons.find(el => el.textContent && (el.textContent.trim() === 'Market' || el.textContent.trim() === 'Marché' || el.textContent.trim() === '市价'));
            if (marketBtn) marketBtn.click();

            await new Promise(r => setTimeout(r, 200));

            // 2. Bouton Achat / Vente
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
                notifyHud(`✅ Ordre ${signal.side} envoyé avec succès (0.02%) !`, isBuy ? '#10B981' : '#EF4444');
            } else {
                notifyHud('⚠️ Bouton non trouvé sur la page MEXC', '#F59E0B');
            }
        } catch (e) {
            console.error('[Lumen Extension] Erreur:', e);
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
})();
