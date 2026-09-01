// L'echelle du FMC doit rester 0-100, quoi qu'il arrive.
const fs=require('fs');
const src=fs.readFileSync('index.html','utf8');
const sc=src.match(/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/i)[1];
const grad={addColorStop(){}};
const faux=()=>new Proxy({measureText:(t)=>({width:String(t).length*5}),
 createLinearGradient:()=>grad,createRadialGradient:()=>grad},
 {get:(t,k)=>(k in t)?t[k]:(typeof k==='string'?()=>{}:undefined),set:(t,k,v)=>{t[k]=v;return true;}});
const el=(v)=>({value:v,style:{},dataset:{},getContext:faux,classList:{add(){},remove(){},contains:()=>false,toggle(){}},
 width:1000,height:800,addEventListener(){},querySelectorAll:()=>[],querySelector:()=>null,closest:()=>null});
global.window=global;global.requestAnimationFrame=()=>{};global.addEventListener=()=>{};global.removeEventListener=()=>{};
global.document={documentElement:el(''),getElementById:()=>el(''),querySelector:()=>el(''),querySelectorAll:()=>[el('')],addEventListener(){},createElement:()=>el(''),body:{appendChild(){},classList:{add(){},remove(){}}}};
global.localStorage={getItem:()=>null,setItem(){},removeItem(){}};global.navigator={userAgent:'node'};
global.getComputedStyle=()=>({getPropertyValue:()=>''});global.fetch=async()=>({ok:true,json:async()=>({})});
eval('var state;'+sc.replace('const state =','state =')+';global.__g=getInd;global.__d=drawFmcSub;');
const tout=JSON.parse(fs.readFileSync('candles_synth.json','utf8')).slice(0,3000);
state.data=tout;state.symbol='BTCUSDT';state.tf=1;state.cache={};
global.ctx=faux();global.W=1200;global.H=900;global.AXIS_W=60;global.AXIS_H=24;global.xOf=(i)=>i*0.35;

let ko=0; const t=(n,ok,d)=>{ if(!ok) ko++; console.log((ok?'OK    ':'ECHEC ')+n+(d?'  -> '+d:'')); };
const dessine=(p)=>{ try{ __d(p, 0, 2999, 4, 'fmc'); }catch(e){ return e.message.slice(0,60); } return null; };

console.log('== Echelle normale ==');
let p={key:'fmc',y:0,h:200,lo:0,hi:100};
t('pas d exception', !dessine(p));
t('   bornes 0 et 100', p.lo===0 && p.hi===100, p.lo+' a '+p.hi);

console.log('\n== Panneau partage avec un autre indicateur ==');
p={key:'fmc',y:0,h:200,_sameScale:true,_forceLo:-250,_forceHi:900,_groupKey:'macd'};
t('pas d exception', !dessine(p));
t('   bornes toujours 0 et 100', p.lo===0 && p.hi===100, p.lo+' a '+p.hi);

console.log('\n== Echelle reglee a la main ==');
/* Une echelle fixee par l'utilisateur doit etre respectee : c'est ce qui
   permet d'agrandir ou de reduire le panneau depuis la graduation. */
state.subScale={fmc:{auto:false,lo:35,hi:64}};
p={key:'fmc',y:0,h:200};
t('pas d exception', !dessine(p));
t('   la votre est respectee', p.lo===35 && p.hi===64, p.lo+' a '+p.hi);
state.subScale={fmc:{auto:true}};
p={key:'fmc',y:0,h:200};
dessine(p);
t('   retour a 0-100 en automatique', p.lo===0 && p.hi===100, p.lo+' a '+p.hi);
state.subScale={};

console.log('\n== Panneau partage ET echelle a la main ==');
state.subScale={fmc:{auto:false,lo:10,hi:20},macd:{auto:false,lo:-500,hi:500}};
p={key:'fmc',y:0,h:200,_sameScale:true,_forceLo:-500,_forceHi:500,_groupKey:'macd'};
t('pas d exception', !dessine(p));
t('   la votre l emporte sur le groupe', p.lo===10 && p.hi===20, p.lo+' a '+p.hi);
t('   le groupe est rendu intact apres', p._sameScale===true);
state.subScale={};

t('le groupe est neutralise le temps de l appel', /p\._sameScale = false;\s*const yOf = subYOf\(p, K, 0, 100, true\);\s*p\._sameScale = groupeSauve;/.test(src));

console.log('\n'+(ko===0?'L echelle du FMC ne bouge plus.':ko+' probleme(s).'));
