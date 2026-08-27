// Pastilles compactes : plus petites, mêmes informations.
const fs=require('fs');
const src=fs.readFileSync('index.html','utf8');
const sc=src.match(/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/i)[1];
const textes=[]; const boites=[];
const grad={addColorStop(){}};
const faux=()=>new Proxy({
  measureText:(t)=>({width:String(t).length*5}), createLinearGradient:()=>grad, createRadialGradient:()=>grad,
  fillText:(t)=>{ if(typeof t==='string' && t.trim()) textes.push(t); },
  fillRect:(x,y,w,h)=>boites.push({w,h})
},{get:(t,k)=>(k in t)?t[k]:(typeof k==='string'?()=>{}:undefined),set:(t,k,v)=>{t[k]=v;return true;}});
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
eval('var state;'+sc.replace('const state =','state =')+';global.__g=getInd;global.__draw=drawMMSignals;');
const tout=JSON.parse(fs.readFileSync('candles_ok.json','utf8')).slice(0,6000);
state.data=tout;state.symbol='BTCUSDT';state.tf=1;state.cache={};
global.ctx=faux();global.W=1400;global.H=900;global.AXIS_W=60;global.AXIS_H=24;
global.xOf=(i)=>i*0.2; global.labelHits=[];

let ko=0; const t=(n,ok,d)=>{ if(!ok) ko++; console.log((ok?'OK    ':'ECHEC ')+n+(d?'  -> '+d:'')); };
const mm=state.indicators.strat_mm;
const rendu=(taille)=>{
  mm.taillePastilles=taille; state.cache={};
  textes.length=0; boites.length=0;
  try{ __draw(__g('strat_mm'), 0, 5999, (p)=>500-(p-60000)/25, 4); }
  catch(e){ return {err:e.message.slice(0,70)}; }
  return {textes:textes.slice(), boites:boites.slice()};
};
const normal=rendu('normale'), compact=rendu('compacte'), mini=rendu('minimale');
t('le dessin passe dans les trois tailles', !normal.err && !compact.err && !mini.err, normal.err||compact.err||mini.err||'aucune exception');

t('reglage de taille present', /k:'taillePastilles'/.test(src));
t('   reglage d opacite present', /k:'opacitePastilles'/.test(src));
t('   la taille suit le facteur', /const bw = Math\.round\(\(is15m \? 154 : 148\) \* kT\)/.test(src));
t('   trois tailles proposees', /k:'taillePastilles'/.test(src) && /minimale/.test(src));
t('   compacte par defaut', /taillePastilles:'compacte'/.test(src));
t('   fond translucide', /opacitePastilles/.test(src) && /0\.78/.test(src));
t('   les polices aussi', /\(9 \* kT\)\.toFixed\(1\)/.test(src) && /\(14 \* kT\)\.toFixed\(1\)/.test(src));
t('   les positions aussi', /by \+ 18 \* kT/.test(src));
t('   les renforts sont plus petits', /cRenfort \? 0\.55 : 0\.65/.test(src));

// meme quantite d information
t('autant de textes dans les trois tailles',
  compact.textes.length===normal.textes.length && mini.textes.length===normal.textes.length,
  normal.textes.length+' / '+compact.textes.length+' / '+mini.textes.length);
t('   contenu identique',
  JSON.stringify(normal.textes)===JSON.stringify(compact.textes) &&
  JSON.stringify(normal.textes)===JSON.stringify(mini.textes));

console.log('\n== Facteurs ==');
for(const [nom,att] of [['consigne normale',1],['renfort normal',0.85],
  ['consigne compacte',0.65],['renfort compact',0.55],
  ['consigne minimale',0.50],['renfort minimal',0.42]])
  console.log('   '+nom.padEnd(20)+att+'  ->  largeur '+Math.round(148*att)+' px, hauteur '+Math.round(46*att)+' px');

console.log('\n'+(ko===0?'Les pastilles compactes gardent toute l information.':ko+' probleme(s).'));
