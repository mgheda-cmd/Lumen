/**
 * Script de vérification et de diagnostic complet MEXC Futures
 * Usage: node mexc_checker.js [API_KEY] [API_SECRET]
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

function loadEnv() {
  const envPath = path.join(__dirname, '.env');
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split('\n');
    for (const line of lines) {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        const key = match[1];
        let val = (match[2] || '').trim();
        if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
        if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1);
        process.env[key] = val;
      }
    }
  }
}
loadEnv();

const apiKey = process.argv[2] || process.env.MEXC_API_KEY || '';
const apiSecret = process.argv[3] || process.env.MEXC_API_SECRET || '';

async function testPublicMexc() {
  process.stdout.write('1. Test Connectivité Publique MEXC (Prix BTC & Marché)... ');
  try {
    const res = await fetch('https://contract.mexc.com/api/v1/contract/ticker?symbol=BTC_USDT');
    const data = await res.json();
    if (data && data.success && data.data) {
      console.log(`✅ SUCCÈS (Prix BTC: ${data.data.lastPrice} USDT)`);
      return true;
    } else {
      console.log(`❌ Échec réponse API:`, data);
      return false;
    }
  } catch (err) {
    console.log(`❌ Erreur réseau: ${err.message}`);
    return false;
  }
}

async function testPrivateMexc() {
  process.stdout.write('2. Test Accès Privé MEXC (Solde & Positions en temps réel)... ');
  if (!apiKey || !apiSecret) {
    console.log('⚠️ NON CONFIGURÉ (Aucune clé API MEXC trouvée dans .env ou en argument)');
    console.log('   -> Pour activer ce mode, ajoutez MEXC_API_KEY et MEXC_API_SECRET dans un fichier .env');
    return false;
  }

  try {
    const timestamp = Date.now();
    const signStr = apiKey + timestamp;
    const signature = crypto.createHmac('sha256', apiSecret).update(signStr).digest('hex');

    const res = await fetch('https://contract.mexc.com/api/v1/private/account/assets', {
      method: 'GET',
      headers: {
        'ApiKey': apiKey,
        'Request-Time': String(timestamp),
        'Signature': signature,
        'Content-Type': 'application/json'
      }
    });

    const data = await res.json();
    if (res.ok && data && (data.success || data.code === 0 || Array.isArray(data.data))) {
      console.log('✅ SUCCÈS (Clés API valides et fonctionnelles)');
      const assets = Array.isArray(data.data) ? data.data : [data.data];
      const usdt = assets.find(a => a && (a.currency === 'USDT' || a.symbol === 'USDT')) || assets[0];
      if (usdt) {
        console.log(`   💰 Capital disponible: ${usdt.availableBalance || usdt.equity || '0'} USDT`);
        console.log(`   📊 Équité totale: ${usdt.equity || usdt.cashBalance || '0'} USDT`);
      }
      return true;
    } else {
      console.log(`❌ Rejet MEXC: ${JSON.stringify(data)}`);
      return false;
    }
  } catch (err) {
    console.log(`❌ Erreur: ${err.message}`);
    return false;
  }
}

const lumenToken = process.argv[4] || process.env.LUMEN_ACCESS_TOKEN || '';

async function testVercelSigner() {
  process.stdout.write('3. Test Microservice Vercel (https://mexc-signer.vercel.app)... ');
  try {
    const headers = { 'Content-Type': 'application/json' };
    if (lumenToken) headers['X-Lumen-Token'] = lumenToken;

    const res = await fetch('https://mexc-signer.vercel.app/api/mexc', {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({ endpoint: '/api/v1/private/account/assets', method: 'GET', isFutures: true, params: {} })
    });

    const data = await res.json();
    if (res.status === 401) {
      console.log('🟡 EN LIGNE (En attente du jeton X-Lumen-Token valide)');
      console.log('   -> Le serveur Vercel est actif et protège l\'accès avec votre jeton.');
      return false;
    } else if (res.ok && data && (data.success || Array.isArray(data.data))) {
      console.log('✅ SUCCÈS (Authentification Vercel + MEXC validée !)');
      const resData = data.data?.data || data.data;
      const assets = Array.isArray(resData) ? resData : [resData];
      const usdt = assets.find(a => a && (a.currency === 'USDT' || a.symbol === 'USDT')) || assets[0];
      if (usdt) {
        console.log(`   💰 Solde récupéré via Vercel: ${usdt.availableBalance || usdt.equity || '0'} USDT (Clés 100% masquées)`);
      }
      return true;
    } else {
      console.log('❌ Réponse Vercel:', data);
      return false;
    }
  } catch (err) {
    console.log(`❌ Erreur connexion Vercel: ${err.message}`);
    return false;
  }
}

async function run() {
  console.log('\n=== AUDIT DE DIAGNOSTIC MEXC & VERCEL (LUMEN AUTONOMIE) ===');
  await testPublicMexc();
  await testPrivateMexc();
  await testVercelSigner();
  console.log('===========================================================\n');
}

run();
