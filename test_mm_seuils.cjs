// La strategie MM doit prendre ses seuils sur kk bis 2, haut ET bas.
const fs=require('fs');
const src=fs.readFileSync('index.html','utf8');
const sc=src.match(/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/i)[1];
const grad={addColorStop(){}};
const faux=()=>new Proxy({measureText:()=>({width:30}),createLinearGradient:()=>grad,createRadialGradient:()=>grad},
 {get:(t,k)=>(k in t)?t[k]:(typeof k==='string'?()=>{}:undefined),set:()=>true});
const el=(v)=>({value:v,style:{},dataset:{},getContext:faux,textContent:'',innerHTML:'',
 classList:{add(){},remove(){},contains:()=>false,toggle(){}},width:1000,height:800,
 addEventListener(){},querySelectorAll:()=>[],querySelector:()=>null,closest:()=>null,
 appendChild(){},removeChild(){},setAttribute(){},getAttribute:()=>null});
global.window=global;global.requestAnimationFrame=()=>{};global.addEventListener=()=>{};global.removeEventListener=()=>{};
global.document={documentElement:el(''),getElementById:()=>el(''),querySelector:()=>el(''),
 querySelectorAll:()=>[el('')],addEventListener(){},createElement:()=>el(''),
 body:{appendChild(){},classList:{add(){},remove(){}}}};
global.localStorage={getItem:()=>null,setItem(){},removeItem(){}};
global.navigator={userAgent:'node'};
global.getComputedStyle=()=>({getPropertyValue:()=>''});global.fetch=async()=>({ok:true,json:async()=>({})});
eval('var state;'+sc.replace('const state =','state =')+';global.__g=getInd;');
const tout=JSON.parse(fs.readFileSync('candles_ok.json','utf8')).slice(0,6000);
state.data=tout;state.symbol='BTCUSDT';state.tf=1;

let ko=0; const t=(n,ok,d)=>{ if(!ok) ko++; console.log((ok?'OK    ':'ECHEC ')+n+(d?'  -> '+d:'')); };
const k2=state.indicators.kk_bis2;
const nb=()=>{ state.cache={}; const r=__g('strat_mm');
  return {s:(r.signals||[]).length, so:(r.sommetsList||[]).length, cr:(r.creuxList||[]).length}; };

t('les seuils sont lus sur kk bis 2', /const lowerThreshold = \(indKK\.lower != null\)/.test(src));
t('   le seuil haut aussi', /const upperThreshold = \(indKK\.upper != null\)/.test(src));
t('   oscThreshold n est plus qu un repli', /ind\.oscThreshold != null\) \? -Math\.abs/.test(src));

k2.upper=75; k2.lower=-75; const a=nb();
k2.upper=50; k2.lower=-50; const b=nb();
t('baisser les deux seuils change tout', a.s!==b.s, a.s+' -> '+b.s+' signaux');

k2.upper=75; k2.lower=-75; const c=nb();
k2.upper=40;               const d2=nb();
t('le seuil HAUT agit seul', c.so!==d2.so, c.so+' -> '+d2.so+' sommets');
t('   et il ne touche pas les creux', c.cr===d2.cr, c.cr+' contre '+d2.cr);

k2.upper=75; k2.lower=-40; const e=nb();
t('le seuil BAS agit seul', c.cr!==e.cr, c.cr+' -> '+e.cr+' creux');

k2.upper=75; k2.lower=-75;
state.indicators.strat_mm.oscThreshold=-20; const f=nb();
t('oscThreshold n influence plus rien', f.s===c.s, c.s+' contre '+f.s);
state.indicators.strat_mm.oscThreshold=-75;

console.log('\n'+(ko===0?'MM ne lit plus que kk bis 2.':ko+' probleme(s).'));
