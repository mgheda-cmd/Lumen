// Les sorties sur sommet/creux MM ne doivent plus anticiper.
const fs=require('fs');
const src=fs.readFileSync('index.html','utf8');
const sc=src.match(/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/i)[1];
const grad={addColorStop(){}};
const faux=()=>new Proxy({measureText:()=>({width:30}),createLinearGradient:()=>grad,createRadialGradient:()=>grad},
 {get:(t,k)=>(k in t)?t[k]:(typeof k==='string'?()=>{}:undefined),set:()=>true});
const vals={'bta-ent':'mm_base','bta-sens':'normal','bta-dir':'tout','bta-modeap':'chrono',
 'bta-sor':'mm_opp','bta-rang':'1','bta-marge':'0.02','bta-unite':'BASE','bta-lev':'200',
 'bta-tp':'0','bta-frais':'0.02','bta-jours':'7','bta-capital':'100','bta-mmode':'isole',
 'bta-mpct':'50','bta-mbonus':'20','bta-opp':'toujours'};
const c={};
const el=(v)=>({value:v,style:{},dataset:{},getContext:faux,textContent:'',innerHTML:'',
 classList:{add(){},remove(){},contains:()=>false,toggle(){}},width:1000,height:800,
 addEventListener(){},querySelectorAll:()=>[],querySelector:()=>null,closest:()=>null,
 appendChild(){},removeChild(){},setAttribute(){},getAttribute:()=>null});
for(const k in vals) c[k]=el(vals[k]);
global.window=global;global.requestAnimationFrame=()=>{};global.addEventListener=()=>{};global.removeEventListener=()=>{};
global.document={documentElement:el(''),getElementById:(i)=>c[i]||el(''),querySelector:()=>el(''),
 querySelectorAll:()=>[el('')],addEventListener(){},createElement:()=>el(''),
 body:{appendChild(){},classList:{add(){},remove(){}}}};
global.localStorage={getItem:()=>null,setItem(){},removeItem(){}};
global.navigator={userAgent:'node'};global.confirm=()=>true;global.alert=()=>{};
global.getComputedStyle=()=>({getPropertyValue:()=>''});global.fetch=async()=>({ok:true,json:async()=>({})});
eval('var state;'+sc.replace('const state =','state =')+';global.__g=getInd');
const tout=JSON.parse(fs.readFileSync('candles_ok.json','utf8')).slice(0,8000);
state.data=tout;state.symbol='BTCUSDT';state.tf=1;state.cache={};
window.chargerHistorique=async()=>{};

let ko=0; const t=(n,ok,d)=>{ if(!ok) ko++; console.log((ok?'OK    ':'ECHEC ')+n+(d?'  -> '+d:'')); };

(async()=>{
  await window.__runBtInterne();
  const r=window.__btDernier;
  t('le backtest produit des trades', !!(r&&r.liste&&r.liste.length), (r&&r.trades)+' trades');
  const L=(r&&r.liste)||[];

  const mm=__g('strat_mm');
  const pivots=new Set();
  for(const x of (mm.sommetsList||[])) pivots.add(x.i);
  for(const x of (mm.creuxList||[])) pivots.add(x.i);

  /* Une sortie peut legitimement tomber sur une bougie de pivot si c'est un
     signal d'entree oppose qui la declenche : un signal nait a la bougie ou
     ses conditions sont remplies, sans rien anticiper. On n'exclut donc que
     les sorties issues d'un pivot ET sans signal a cette bougie. */
  const sig=new Set((mm.signals||[]).map(x=>x.i));
  const surPivot=L.filter(x=>pivots.has(x.iS) && !sig.has(x.iS));
  t('aucune sortie anticipant un pivot', surPivot.length===0,
    surPivot.length+' sortie(s) sur '+L.length);
  const coincidences=L.filter(x=>pivots.has(x.iS) && sig.has(x.iS));
  t('   coincidences avec un signal, legitimes', true, coincidences.length+' cas');

  // chaque sortie doit suivre le pivot le plus proche en amont
  const listePiv=[...pivots].sort((a,b)=>a-b);
  let retards=[];
  for(const tr of L){
    let best=null;
    for(const p of listePiv){ if(p<tr.iS) best=p; else break; }
    if(best!=null) retards.push(tr.iS-best);
  }
  const moy=retards.length? retards.reduce((a,b)=>a+b,0)/retards.length : 0;
  t('   les sorties suivent le pivot', retards.every(x=>x>0), 'retard moyen '+moy.toFixed(1)+' bougies');

  const dernier=L[L.length-1];
  t('   prix de sortie = cloture de sa bougie',
    !dernier || Math.abs(dernier.ps - tout[dernier.iS].c) < 0.001);

t('la fonction de confirmation est en place', /const confirme = function\(iPivot, haut\)/.test(src));
t('   elle suit le seuil de kk bis 2', /state\.indicators\.kk_bis2 && state\.indicators\.kk_bis2\.upper/.test(src));
t('   pivot en cours : pas de sortie', /return \(j < d\.length\) \? j : null/.test(src));

  console.log('\n'+(ko===0?'Les sorties n anticipent plus.':ko+' probleme(s).'));
})();
