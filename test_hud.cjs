// Tableau de bord multi-unites : il calcule, et nos ajouts sont intacts.
const fs=require('fs');
const src=fs.readFileSync('index.html','utf8');
const sc=src.match(/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/i)[1];
const grad={addColorStop(){}};
const faux=()=>new Proxy({measureText:()=>({width:30}),createLinearGradient:()=>grad,createRadialGradient:()=>grad},
 {get:(t,k)=>(k in t)?t[k]:(typeof k==='string'?()=>{}:undefined),set:()=>true});
const el=(v)=>({value:v,style:{},textContent:'',innerHTML:'',dataset:{},getContext:faux,
 classList:{add(){},remove(){},contains:()=>false,toggle(){}},width:1000,height:800,
 addEventListener(){},querySelectorAll:()=>[],querySelector:()=>null,closest:()=>null,
 appendChild(){},removeChild(){},insertBefore(){},remove(){},setAttribute(){},getAttribute:()=>null});
global.window=global;global.requestAnimationFrame=()=>{};global.addEventListener=()=>{};global.removeEventListener=()=>{};
global.document={documentElement:el(''),getElementById:()=>el(''),querySelector:()=>el(''),
 querySelectorAll:()=>[el('')],addEventListener(){},createElement:()=>el(''),
 body:{appendChild(){},classList:{add(){},remove(){}}}};
global.localStorage={getItem:()=>null,setItem(){},removeItem(){}};
global.navigator={userAgent:'node'};global.confirm=()=>true;global.alert=()=>{};
global.getComputedStyle=()=>({getPropertyValue:()=>''});global.fetch=async()=>({ok:true,json:async()=>({})});
// on expose les fonctions internes : dans un eval de module, les declarations
// restent en portee locale et ne montent pas sur global
eval('var state;'+sc.replace('const state =','state =')+
  ";global.__f={computeMmsBoForTf,updateMmsBoTable,toggleMmsBoHud,closeMmsBoHud,"+
  "minimizeMmsBoHud,toggleMmsBoCollapse,applyMmsBoHudState,switchTimeFrameFromHud,"+
  "setStudioStatus,togglePriceLine,updatePriceLineToggleButtons,DASHBOARD_TFS};");
const tout=JSON.parse(fs.readFileSync('candles_ok.json','utf8')).slice(0,8000);
state.data=tout;state.symbol='BTCUSDT';state.tf=1;state.cache={};

let ko=0; const t=(n,ok,d)=>{ if(!ok) ko++; console.log((ok?'OK    ':'ECHEC ')+n+(d?'  -> '+d:'')); };

t('les 11 fonctions sont la',
  ['computeMmsBoForTf','updateMmsBoTable','toggleMmsBoHud','closeMmsBoHud','minimizeMmsBoHud',
   'toggleMmsBoCollapse','applyMmsBoHudState','switchTimeFrameFromHud','setStudioStatus',
   'togglePriceLine','updatePriceLineToggleButtons'].every(f=>typeof __f[f]==='function'));
const DASH=__f.DASHBOARD_TFS;
t('liste des unites de temps', Array.isArray(DASH), (DASH||[]).map(x=>x.label).join(' '));
t('panneau dans le HTML', /id="mms-bo-hud"/.test(src));
t('   corps du tableau', /id="mms-bo-tbody"/.test(src));
t('   ligne de consensus', /id="mms-bo-consensus"/.test(src));
t('feuille de style reprise', /\.mms-badge-bull/.test(src));
t('rafraichi a chaque rendu', /typeof updateMmsBoTable === 'function' && typeof mmsBoHudVisible/.test(src));

let calcules=0, vides=0;
for(const it of DASH){
  let r=null;
  try{ r=__f.computeMmsBoForTf(it.key); }catch(e){ t('  '+it.label+' : exception', false, e.message.slice(0,60)); continue; }
  if(r) calcules++; else vides++;
}
t('les unites se calculent', calcules>0, calcules+' calculees, '+vides+' en attente de donnees');
const r1=__f.computeMmsBoForTf(1);
if(r1){
  t('   colonnes attendues',
    ['mmsLabel','boLabel','obLabel'].some(c=>c in r1) || Object.keys(r1).length>=4,
    Object.keys(r1).slice(0,8).join(', '));
}

console.log();
for(const [nom,m] of [['veille Telegram','demarrerVeille'],['cases Z.Z. 2','__zz2Rejets'],
  ['kk bis 2','kk_bis2:{'],['strategie MM','computeMMSignals'],['balayage fusionne','balayerKKFusion'],
  ['trace backtest','drawMarquesBT'],['lignes verticales','__zzVerticales'],
  ['entrees sur creux','ENTREE_ACHAT'],['frais 0,02','BTC: 0.02'],['liquidations','liq: nbLiq'],
  ['titres des panneaux','const nomInd'],['lisibilite','color:var(--text)']])
  t('conserve : '+nom, src.includes(m));

console.log('\n'+(ko===0?'Le tableau de bord est greffe, rien de perdu.':ko+' probleme(s).'));
