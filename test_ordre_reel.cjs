// Banc d'essai ciblé : vérifie que sendRealMexcFuturesOrder s'exécute sans ReferenceError
// et que le corps envoyé au signer est correct. Aucun appel réseau réel.
const fs = require('fs');

const html = fs.readFileSync('index.html', 'utf8');
const scriptMatch = html.match(/<script[^>]*>([\s\S]*?)<\/script>/i);
let scriptContent = "var state;\n" + scriptMatch[1].replace('const state =', 'state =');

const dummyElem = {
  getContext: () => ({ measureText: () => ({ width: 10 }), fillRect: () => {}, clearRect: () => {}, beginPath: () => {}, moveTo: () => {}, lineTo: () => {}, stroke: () => {}, fill: () => {}, arc: () => {}, save: () => {}, restore: () => {}, translate: () => {}, rotate: () => {}, scale: () => {} }),
  width: 1000, height: 600, style: {}, dataset: {}, value: '',
  classList: { add: () => {}, remove: () => {}, contains: () => false, toggle: () => {} },
  addEventListener: () => {}, querySelectorAll: () => [], querySelector: () => null, closest: () => null,
  appendChild: () => {}, removeChild: () => {}, insertBefore: () => {}, remove: () => {}, setAttribute: () => {}, getAttribute: () => null,
  innerHTML: '', textContent: '', scrollIntoView: () => {}, focus: () => {}, click: () => {}, children: [], childNodes: [], parentNode: null
};

global.window = global;
global.requestAnimationFrame = () => {};
global.cancelAnimationFrame = () => {};
global.addEventListener = () => {};
global.removeEventListener = () => {};
global.document = {
  documentElement: dummyElem, getElementById: () => dummyElem, querySelector: () => dummyElem,
  querySelectorAll: () => [dummyElem], addEventListener: () => {}, createElement: () => dummyElem,
  body: { appendChild: () => {}, classList: dummyElem.classList }
};
global.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
global.navigator = { userAgent: 'node' };

eval(scriptContent);
console.log('1. Chargement du script : OK');

// --- Scénario A : clés dans Vercel, champs du navigateur vides ---
let capturedBody = null;
global.fetch = async (url, opts) => {
  capturedBody = JSON.parse(opts.body);
  return { ok: true, status: 200, json: async () => ({ success: true, data: { orderId: 'TEST-123' } }) };
};

(async () => {
  let res;
  try {
    res = await window.sendRealMexcFuturesOrder({
      serviceUrl: 'https://exemple.vercel.app/api/mexc',
      lumenToken: 'jeton-test',
      symbol: 'BTC_USDT', side: 1, leverage: 200, vol: 5, price: 63419.2
    });
  } catch (e) {
    console.log('2. ÉCHEC — exception levée :', e.constructor.name, ':', e.message);
    process.exit(1);
  }

  if (!capturedBody) {
    console.log('2. ÉCHEC — aucune requête envoyée. Retour :', JSON.stringify(res));
    process.exit(1);
  }

  console.log('2. Exécution sans exception : OK');
  console.log('3. Champs du corps envoyé au signer :');
  Object.keys(capturedBody).forEach(k => {
    const v = capturedBody[k];
    console.log('     ' + k + ' = ' + (typeof v === 'object' ? JSON.stringify(v) : v));
  });
  console.log('4. Retour de la fonction :', JSON.stringify(res).slice(0, 200));
})();
