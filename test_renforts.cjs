// Renforts : signaux du meme sens, grises, numerotes, hors backtest et alertes.
const fs=require('fs');
const src=fs.readFileSync('index.html','utf8');
const sc=src.match(/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/i)[1];
const grad={addColorStop(){}};
const faux=()=>new Proxy({measureText:()=>({width:30}),createLinearGradient:()=>grad,createRadialGradient:()=>grad},
 {get:(t,k)=>(k in t)?t[k]:(typeof k==='string'?()=>{}:undefined),set:()=>true});
const el=(v)=>({value:v,style:{},dataset:{},getContext:faux,textContent:'',innerHTML:'',
 classList:{add(){},remove(){},contains:()=>false,toggle(){}},width:1000,height:800,
 addEventListener(){},querySelectorAll:()=>[],querySelector:()=>null,closest:()=>null});
global.window=global;global.requestAnimationFrame=()=>{};global.addEventListener=()=>{};global.removeEventListener=()=>{};
global.document={documentElement:el(''),getElementById:()=>el(''),querySelector:()=>el(''),
 querySelectorAll:()=>[el('')],addEventListener(){},createElement:()=>el(''),
 body:{appendChild(){},classList:{add(){},remove(){}}}};
global.localStorage={getItem:()=>null,setItem(){},removeItem(){}};
global.navigator={userAgent:'node'};
global.getComputedStyle=()=>({getPropertyValue:()=>''});global.fetch=async()=>({ok:true,json:async()=>({})});
eval('var state;'+sc.replace('const state =','state =')+';global.__g=getInd;');
const tout=JSON.parse(fs.readFileSync('candles_ok.json','utf8')).slice(0,8000);
state.data=tout;state.symbol='BTCUSDT';state.tf=1;state.cache={};

let ko=0; const t=(n,ok,d)=>{ if(!ok) ko++; console.log((ok?'OK    ':'ECHEC ')+n+(d?'  -> '+d:'')); };

const r=__g('strat_mm');
const tous=r.signals||[];
const vrais=tous.filter(x=>!(x.renfort>0));
const renf=tous.filter(x=>x.renfort>0);
t('des renforts sont produits', renf.length>0, renf.length+' renforts, '+vrais.length+' consignes');
t('   ils portent un rang', renf.every(x=>Number.isInteger(x.renfort)&&x.renfort>=1));
t('   les consignes ont un rang nul', vrais.every(x=>!x.renfort));

// numerotation : repart a 1 apres chaque vraie entree de la meme option
let ok2=true, detail='';
for(const cle of [...new Set(tous.map(x=>x.optKey))]){
  const suite=tous.filter(x=>x.optKey===cle).sort((a,b)=>a.i-b.i);
  let attendu=0;
  for(const x of suite){
    if(!(x.renfort>0)){ attendu=0; continue; }
    attendu++;
    if(x.renfort!==attendu){ ok2=false; detail=cle+' : '+x.renfort+' au lieu de '+attendu; break; }
  }
  if(!ok2) break;
}
t('   numerotation 1, 2, 3 puis remise a zero', ok2, detail||'conforme');

const parOpt={};
for(const x of renf) parOpt[x.optKey]=(parOpt[x.optKey]||0)+1;
t('   toutes les options en produisent', Object.keys(parOpt).length>=4,
  Object.entries(parOpt).map(([k,v])=>k+' '+v).join(', '));

// un renfort suit toujours une entree du meme sens
let mauvais=0;
for(const cle of [...new Set(tous.map(x=>x.optKey))]){
  const suite=tous.filter(x=>x.optKey===cle).sort((a,b)=>a.i-b.i);
  let dernier=null;
  for(const x of suite){
    if(x.renfort>0){ if(!dernier||dernier.dir!==x.dir) mauvais++; }
    else dernier=x;
  }
}
t('   chaque renfort suit une entree du meme sens', mauvais===0, mauvais+' ecart(s)');

console.log();
t('grises au dessin', /const cRenfort = \(sig\.renfort \|\| 0\) > 0;/.test(src));
t('   nom suffixe du rang', /optName = optName \+ ' n' \+ sig\.renfort;/.test(src));
t('   masquables', /S\('strat_mm','showRenforts'\) === false\) continue;/.test(src));
t('   reglage au panneau', /k:'showRenforts'/.test(src));

console.log();
t('exclus du backtest', /mmData\.signals\.filter\(x => !\(x\.renfort > 0\)\)/.test(src));
t('exclus des alertes', /allSignals\[q\]\.renfort > 0\) allSignals\.splice/.test(src));

// l'alternance des consignes tient toujours
const base=vrais.filter(x=>x.optKey==='base').sort((a,b)=>a.i-b.i);
let alt=0,p=0;
for(const x of base){ if(x.dir===p) alt++; p=x.dir; }
t('les consignes alternent toujours', alt===0, alt+' consecutifs de meme sens sur '+base.length);

console.log('\n'+(ko===0?'Les renforts sont en place, sans polluer les consignes.':ko+' probleme(s).'));
