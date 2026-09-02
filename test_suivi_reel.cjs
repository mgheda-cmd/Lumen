// Les indicateurs doivent suivre le prix sur les deux chemins du flux,
// sans saturer le navigateur.
const fs=require('fs');
const src=fs.readFileSync('index.html','utf8');
const sc=src.match(/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/i)[1];
const grad={addColorStop(){}};
const faux=()=>new Proxy({measureText:()=>({width:30}),createLinearGradient:()=>grad,createRadialGradient:()=>grad},
 {get:(t,k)=>(k in t)?t[k]:(typeof k==='string'?()=>{}:undefined),set:()=>true});
const el=v=>({value:v,style:{},dataset:{},getContext:faux,classList:{add(){},remove(){},contains:()=>false,toggle(){}},width:1400,height:900,addEventListener(){},querySelectorAll:()=>[],querySelector:()=>null,closest:()=>null});
global.window=global;global.requestAnimationFrame=()=>{};global.addEventListener=()=>{};global.removeEventListener=()=>{};
global.document={documentElement:el(''),getElementById:()=>el(''),querySelector:()=>el(''),querySelectorAll:()=>[el('')],addEventListener(){},createElement:()=>el(''),body:{appendChild(){},classList:{add(){},remove(){}}}};
global.localStorage={getItem:()=>null,setItem(){},removeItem(){}};global.navigator={userAgent:'node'};
global.getComputedStyle=()=>({getPropertyValue:()=>''});global.fetch=async()=>({ok:true,json:async()=>[]});
eval('var state;'+sc.replace('const state =','state =')
  +';global.__g=getInd;global.__kline=applyKline;global.__tick=applyTickPrice;global.__setH=(w,h)=>{W=w;H=h;};');
const brut=JSON.parse(fs.readFileSync('candles_synth.json','utf8'));
state.data=brut.slice(0,3000).map(b=>({...b}));
state.symbol='BTCUSDT';state.tf=1;state.cache={};
state.view={start:2700,count:300};
global.AXIS_W=60;global.AXIS_H=24;__setH(1400,900);
global.render=()=>{}; global.scheduleRender=()=>{}; global.updateHeader=()=>{};

let ko=0; const t=(n,ok,d)=>{ if(!ko&&!ok) {} if(!ok) ko++; console.log((ok?'OK    ':'ECHEC ')+n+(d?'  -> '+d:'')); };
const lire=()=>{ const o={};
  for(const k of ['fmc','kk_bis2','macd','imp']){
    try{ const r=__g(k); const a=Array.isArray(r)?r:(r&&(r.core||r.md||r.net||r.line));
      o[k]=(a&&a.length)?Number(a[a.length-1]).toFixed(4):'vide'; }catch(e){ o[k]='err'; } }
  return o; };
const compte=(a,b)=>Object.keys(a).filter(k=>a[k]!==b[k]).length;

console.log('== Chemin bougie ==');
let av=lire();
const s1=brut[3000];
__kline({t:s1.t,o:s1.o,h:s1.h,l:s1.l,c:s1.c,v:s1.v}, true);
t('les indicateurs suivent', compte(av,lire())>=3, compte(av,lire())+'/4');

console.log('\n== Chemin transaction ==');
window.__dernierRecalc = 0; window.__recalcEnCours = false;
av=lire();
__tick(state.data[state.data.length-1].c * 1.005);
t('les indicateurs suivent aussi', compte(av,lire())>=3, compte(av,lire())+'/4');

console.log('\n== Sans saturer ==');
window.__dernierRecalc = Date.now(); window.__recalcEnCours = false;
state.cache={garde:1};
__tick(state.data[state.data.length-1].c * 1.001);
t('un second tick immediat ne recalcule pas', state.cache.garde===1,
  Object.keys(state.cache).length+' entree(s) conservee(s)');
t('   cadence d une seconde et demie', /_now2 - \(window\.__dernierRecalc \|\| 0\) > 1500/.test(src));
t('   pas de recalcul si le precedent tourne', /!window\.__recalcEnCours/.test(src));

console.log('\n'+(ko===0?'Les indicateurs suivent le prix sur les deux chemins.':ko+' probleme(s).'));
