// Fait tourner le VRAI moteur sur les VRAIS signaux, puis recalcule chaque
// trade indépendamment à partir des bougies et compare ligne à ligne.
const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');
const sc = html.match(/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/i)[1];
const script = "var state;\n" + sc.replace('const state =', 'state =');

const champs = {
  'bta-ent':'classique','bta-sens':'tel','bta-dir':'both','bta-app':'chrono',
  'bta-sortie':'toutes','bta-rang':'1','bta-marge':'0.02','bta-unite':'BASE',
  'bta-lev':'200','bta-tp':'0','bta-frais':'0.02','bta-jours':'7',
  'bta-capital':'100','bta-mmode':'croise','bta-mpct':'50','bta-mbonus':'20'
};
const el = (v) => ({ value:v, textContent:'', innerHTML:'', style:{}, dataset:{},
  classList:{add(){},remove(){},contains:()=>false,toggle(){}},
  getContext:()=>({measureText:()=>({width:10}),fillRect(){},clearRect(){},beginPath(){},
    moveTo(){},lineTo(){},stroke(){},fill(){},arc(){},save(){},restore(){},translate(){},
    rotate(){},scale(){}}),
  width:1000,height:600,addEventListener(){},querySelectorAll:()=>[],querySelector:()=>null,
  closest:()=>null,appendChild(){},removeChild(){},insertBefore(){},remove(){},
  setAttribute(){},getAttribute:()=>null,scrollIntoView(){},focus(){},click(){},
  children:[],childNodes:[],parentNode:null });
const cache = {}; for (const k in champs) cache[k] = el(champs[k]);

global.window = global;
global.requestAnimationFrame=()=>{}; global.cancelAnimationFrame=()=>{};
global.addEventListener=()=>{}; global.removeEventListener=()=>{};
global.document = { documentElement:el(''), getElementById:(id)=>cache[id]||el(''),
  querySelector:()=>el(''), querySelectorAll:()=>[el('')], addEventListener(){},
  createElement:()=>el(''), body:{appendChild(){},classList:{add(){},remove(){}}} };
global.localStorage = { getItem:()=>null, setItem(){}, removeItem(){} };
global.navigator = { userAgent:'node' };
global.confirm = () => true; global.alert = () => {};
global.getComputedStyle = () => ({ getPropertyValue: () => '' });
global.fetch = async () => ({ ok:true, status:200, json: async () => ({}) });

eval(script);

const bougies = JSON.parse(fs.readFileSync('candles_ok.json','utf8')).slice(0, 8000);
state.data = bougies; state.symbol = 'BTCUSDT'; state.tf = 1; state.cache = {};
window.chargerHistorique = async () => {};

(async () => {
  const scenarios = [
    { nom:'croisée, capital 100',  ch:{'bta-mmode':'croise','bta-capital':'100'} },
    { nom:'croisée, capital 1000', ch:{'bta-mmode':'croise','bta-capital':'1000'} },
    { nom:'isolée 50 %',           ch:{'bta-mmode':'isole','bta-capital':'100'} },
  ];
  let echecsTotal = 0;

  for (const s of scenarios) {
    for (const k in s.ch) cache[k].value = s.ch[k];
    state.cache = {};
    await window.__runBtInterne();
    const r = window.__btDernier;
    if (!r || !r.liste) { console.log('ECHEC ' + s.nom + ' : pas de résultat'); echecsTotal++; continue; }

    const lev = 200, taille = 0.02, fraisPct = 0.0002;
    const capital = Number(s.ch['bta-capital']);
    const mMode = s.ch['bta-mmode'];
    let cap = capital, dernierGain = 0, ecarts = [], sommeNet = 0;

    for (const t of r.liste) {
      const pe = bougies[t.iE].c;
      const notionnel = taille * pe;
      let marge = notionnel / lev;
      if (mMode === 'isole') {
        marge = cap * 0.5 + Math.max(0, dernierGain) * 0.2;
        if (marge > cap) marge = cap;
      }
      const adosse = mMode === 'croise' ? Math.max(0, cap) : marge;
      const seuil = 0.95 * adosse / notionnel;
      const pLiq = t.dir === 1 ? pe * (1 - seuil) : pe * (1 + seuil);

      // liquidation recalculée sur les mèches, entre entrée et sortie du moteur
      let liqAttendue = false;
      for (let k = t.iE + 1; k <= t.iS; k++) {
        const b = bougies[k];
        if (t.dir === 1 ? b.l <= pLiq : b.h >= pLiq) { liqAttendue = true; break; }
      }

      const brut = (t.ps - pe) / pe * notionnel * t.dir;
      let net = brut - notionnel * fraisPct * 2;
      const plancher = mMode === 'croise' ? Math.max(0, cap) : marge;
      if (net < -plancher) net = -plancher;

      if (Math.abs(t.pe - pe) > 0.01)            ecarts.push('prix entrée #' + t.num);
      if (Math.abs(t.notionnel - notionnel) > 0.01) ecarts.push('notionnel #' + t.num);
      if (Math.abs(t.marge - marge) > 0.01)      ecarts.push('marge #' + t.num);
      if (Math.abs(t.net - net) > 0.02)          ecarts.push('net #' + t.num);
      if (!!t.liquide !== liqAttendue)           ecarts.push('liquidation #' + t.num);
      if (t.iS < t.iE)                           ecarts.push('sortie avant entrée #' + t.num);

      dernierGain = net > 0 ? net : 0;
      cap += net; sommeNet += net;
    }

    const ecartPnl = Math.abs(r.pnl - sommeNet);
    if (ecartPnl > 0.05) ecarts.push('PnL total');
    const bon = ecarts.length === 0;
    if (!bon) echecsTotal++;
    console.log((bon ? 'OK    ' : 'ECHEC ') + s.nom.padEnd(22) +
      ' | ' + String(r.trades).padStart(3) + ' trades' +
      ' | liq ' + r.liq +
      ' | PnL ' + r.pnl.toFixed(2) + ' (contrôle ' + sommeNet.toFixed(2) + ')' +
      ' | non fin. ' + (r.nonFinances || 0) +
      (bon ? '' : '\n        écarts : ' + [...new Set(ecarts)].slice(0, 6).join(', ')));
  }
  console.log('\n' + (echecsTotal === 0
    ? 'Le moteur concorde avec le recalcul indépendant sur tous les scénarios.'
    : echecsTotal + ' scénario(s) en écart.'));
})();
