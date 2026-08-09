import crypto from 'crypto';

// En mémoire Vercel pour anti-doublon, cache contractSize & logs
const recentOrderHashes = new Map();
const mexcOrderLogs = [];
const contractSizeCache = new Map();

async function getContractSize(symbol) {
  if (!symbol) return null;
  const sym = String(symbol).replace('/', '').replace('-', '').toUpperCase();
  const formattedSymbol = sym.endsWith('USDT') && !sym.includes('_') ? sym.replace('USDT', '_USDT') : sym;

  if (contractSizeCache.has(formattedSymbol)) {
    return contractSizeCache.get(formattedSymbol);
  }

  try {
    const res = await fetch(`https://contract.mexc.com/api/v1/contract/detail?symbol=${formattedSymbol}`);
    if (res.ok) {
      const json = await res.json();
      const data = json.data;
      const detail = Array.isArray(data) ? data.find(d => d.symbol === formattedSymbol) || data[0] : data;
      if (detail && detail.contractSize) {
        const size = parseFloat(detail.contractSize);
        if (size > 0) {
          contractSizeCache.set(formattedSymbol, size);
          return size;
        }
      }
    }
  } catch (err) {
    console.error(`[getContractSize] Erreur de récupération pour ${formattedSymbol}:`, err);
  }
  return null;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, ApiKey, Request-Time, Signature, X-Lumen-Token');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');

  if (req.method === 'OPTIONS') return res.status(200).end();

  // 1. VÉRIFICATION JETON X-LUMEN-TOKEN (FAIL-CLOSED)
  // Si LUMEN_ACCESS_TOKEN n'est pas configuré, le service refuse TOUTE requête.
  // Ne jamais laisser l'endpoint ouvert : il donne accès au passage d'ordres réels.
  const expectedToken = process.env.LUMEN_ACCESS_TOKEN ? String(process.env.LUMEN_ACCESS_TOKEN).trim().replace(/^['"]|['"]$/g, '') : null;
  const providedToken = (req.headers['x-lumen-token'] || req.headers['authorization'] || '').toString().trim().replace(/^['"]|['"]$/g, '');

  if (!expectedToken) {
    return res.status(500).json({
      success: false,
      error: 'Service verrouillé : la variable d\'environnement LUMEN_ACCESS_TOKEN n\'est pas configurée sur l\'hébergeur. Aucune requête n\'est acceptée tant qu\'elle n\'est pas définie.'
    });
  }

  // Comparaison à temps constant pour éviter les attaques temporelles
  const tokenMatch = (() => {
    const a = Buffer.from(expectedToken, 'utf8');
    const b = Buffer.from(providedToken, 'utf8');
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  })();

  if (!tokenMatch) {
    return res.status(401).json({ success: false, error: 'Accès refusé : Jeton X-Lumen-Token invalide ou manquant.' });
  }

  // 2. VÉRIFICATION DES CLÉS DEPUIS L'ENVIRONNEMENT DE VERCEL (AUCUN REPLI SUR REQ.BODY)
  const apiKey = process.env.MEXC_API_KEY;
  const apiSecret = process.env.MEXC_API_SECRET;

  if (!apiKey || !apiSecret) {
    return res.status(500).json({
      success: false,
      error: 'Variables d\'environnement MEXC_API_KEY et MEXC_API_SECRET non configurées dans Vercel.'
    });
  }

  const { endpoint = '/api/v1/private/account/assets', method = 'GET', params = {}, isFutures = true } = req.body || {};
  const timestamp = Date.now();
  const useFutures = isFutures || (endpoint && (endpoint.includes('/contract/') || endpoint.includes('/private/')));

  // 3. PROTECTIONS EN DUR : PASSAGE D'ORDRE FUTURES (Exclusif aux soumissions d'ordres réelles)
  const isOrderPlacement = Boolean(
    endpoint &&
    (endpoint.includes('/order/submit') || endpoint.includes('/order/create') || endpoint.includes('/order/place')) &&
    params &&
    params.symbol &&
    parseFloat(params.vol || params.amount || '0') > 0
  );

  if (isOrderPlacement) {
    const symbol = params.symbol || '';
    const contractSize = await getContractSize(symbol);
    if (!contractSize) {
      const err = `Ordre rejeté : Impossible de récupérer la taille du contrat (contractSize) pour ${symbol} depuis MEXC Futures.`;
      mexcOrderLogs.push({ timestamp, endpoint, params, status: 'REJECTED_PROTECTION', reason: err });
      return res.status(400).json({ success: false, error: err });
    }

    const price = parseFloat(params.price || '0');
    const vol = parseFloat(params.vol || params.amount || '0');
    const leverage = parseFloat(params.leverage || '200');

    // Calcul notionnel strict = vol * contractSize * price
    const notional = vol * contractSize * price;
    // Marge requise
    const margin = leverage > 0 ? notional / leverage : notional;

    // Plafond maximal de sécurité sur la marge.
    // Source de vérité = variable d'environnement serveur (500 USDT par défaut).
    // Le client peut demander un plafond PLUS BAS, jamais plus haut.
    const SERVER_MAX_MARGIN = (() => {
      const v = parseFloat(process.env.MEXC_MAX_MARGIN || '500');
      return Number.isFinite(v) && v > 0 ? v : 500;
    })();
    const clientRequested = parseFloat(params.maxUsdt || params.maxMargin || 'NaN');
    const MAX_MARGIN = (Number.isFinite(clientRequested) && clientRequested > 0)
      ? Math.min(clientRequested, SERVER_MAX_MARGIN)
      : SERVER_MAX_MARGIN;

    const isOpeningOrder = (params.side === 1 || params.side === 3 || String(params.side) === '1' || String(params.side) === '3');

    if (isOpeningOrder && margin > MAX_MARGIN) {
      const err = `Ordre rejeté : Marge requise (${margin.toFixed(2)} USDT) supérieure au plafond de sécurité maximal de ${MAX_MARGIN.toFixed(2)} USDT. (Notionnel: ${notional.toFixed(2)} USDT, Marge: ${margin.toFixed(2)} USDT, ContractSize: ${contractSize}, Levier: ${leverage}x)`;
      mexcOrderLogs.push({ timestamp, endpoint, params, status: 'REJECTED_PROTECTION', reason: err });
      return res.status(400).json({ success: false, error: err });
    }

    // Protection : vérification qu'aucune position n'est déjà ouverte sur MEXC Futures
    if (isOpeningOrder) {
      try {
        const posCheckTimestamp = Date.now();
        const posSignStr = apiKey + posCheckTimestamp;
        const posSig = crypto.createHmac('sha256', apiSecret).update(posSignStr).digest('hex');

        const posResp = await fetch('https://contract.mexc.com/api/v1/private/position/open_positions', {
          method: 'GET',
          headers: {
            'ApiKey': apiKey,
            'Request-Time': String(posCheckTimestamp),
            'Signature': posSig,
            'Content-Type': 'application/json'
          }
        });

        if (posResp.ok) {
          const posData = await posResp.json();
          const openPositions = Array.isArray(posData.data) ? posData.data : [];
          const activePos = openPositions.filter((p) => Number(p.holdVol || p.vol || p.positionSize || 0) > 0);
          if (activePos.length > 0) {
            const err = `Ordre rejeté : Une position (${activePos[0].symbol}) est déjà ouverte sur votre compte MEXC. Fermez la position active avant d'en ouvrir une nouvelle.`;
            mexcOrderLogs.push({ timestamp, endpoint, params, status: 'REJECTED_PROTECTION', reason: err });
            return res.status(400).json({ success: false, error: err });
          }
        }
      } catch (e) {
        console.warn('Erreur lors de la vérification des positions ouvertes:', e);
      }
    }

    // Anti-doublon (5s - réduit de 30s à 5s pour ne pas bloquer les réessais légitimes)
    if (params.symbol && params.side) {
      const orderHash = `${params.symbol}_${params.side}_${vol}_${price}`;
      const lastSent = recentOrderHashes.get(orderHash) || 0;
      if (timestamp - lastSent < 5000) {
        const err = 'Ordre rejeté : Signal en doublon détecté par le filtre anti-doublon (délai 5s).';
        mexcOrderLogs.push({ timestamp, endpoint, params, status: 'REJECTED_PROTECTION', reason: err });
        return res.status(429).json({ success: false, error: err });
      }
      recentOrderHashes.set(orderHash, timestamp);
    }
  }

  // 4. SIGNATURE ET EXECUTION DE LA REQUÊTE
  try {
    if (useFutures) {
      const baseUrl = 'https://contract.mexc.com';

      // Nettoyage des paramètres pour MEXC Futures (suppression des clés internes)
      const cleanParams = { ...params };
      if (endpoint.includes('/order/submit')) {
        delete cleanParams.actualPrice;
        delete cleanParams.tradeBudget;
        delete cleanParams.notional;
        delete cleanParams.margin;
        delete cleanParams.maxUsdt;
        delete cleanParams.maxMargin;
        delete cleanParams.tradeDir;
        delete cleanParams.contractSize;
      }

      const bodyStr = (method === 'POST' || method === 'PUT') ? JSON.stringify(cleanParams) : '';
      let queryStr = '';
      if (method === 'GET' && cleanParams && Object.keys(cleanParams).length > 0) {
        const sortedKeys = Object.keys(cleanParams).sort();
        queryStr = '?' + sortedKeys.map(k => `${encodeURIComponent(k)}=${encodeURIComponent(cleanParams[k])}`).join('&');
      }

      const signPayload = apiKey + timestamp + (bodyStr || (queryStr ? queryStr.substring(1) : ''));
      const signature = crypto.createHmac('sha256', apiSecret).update(signPayload).digest('hex');

      const headers = {
        'ApiKey': apiKey,
        'Request-Time': String(timestamp),
        'Signature': signature,
        'Content-Type': 'application/json'
      };

      const fullUrl = `${baseUrl}${endpoint}${queryStr}`;
      const fetchOptions = { method, headers, ...(bodyStr ? { body: bodyStr } : {}) };

      const response = await fetch(fullUrl, fetchOptions);
      const data = await response.json();

      if (isOrderPlacement) {
        mexcOrderLogs.push({ timestamp, endpoint, params, status: response.ok ? 'SUCCESS' : 'ERROR', response: data });
      }

      return res.status(response.status).json({ success: response.ok && (data.code === 200 || data.code === 0), data, fullUrl });

    } else {
      const baseUrl = 'https://api.mexc.com';
      const reqParams = { ...params, timestamp: String(timestamp) };
      const sortedKeys = Object.keys(reqParams).sort();
      const queryString = sortedKeys.map(k => `${encodeURIComponent(k)}=${encodeURIComponent(reqParams[k])}`).join('&');

      const signature = crypto.createHmac('sha256', apiSecret).update(queryString).digest('hex');
      const signedQuery = `${queryString}&signature=${signature}`;

      const fullUrl = `${baseUrl}${endpoint}?${signedQuery}`;
      const headers = { 'X-MEXC-APIKEY': apiKey, 'Content-Type': 'application/json' };

      const response = await fetch(fullUrl, { method, headers });
      const data = await response.json();
      return res.status(response.status).json({ success: response.ok && !data.code, data, fullUrl });
    }
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message || 'Erreur du serveur de signature' });
  }
};
