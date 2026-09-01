// L'Impulse MACD doit s'afficher, y compris sur une configuration deja enregistree.
const fs=require('fs');
const src=fs.readFileSync('index.html','utf8');
const sc=src.match(/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/i)[1];
const rects=[]; const traits=[];
const grad={addColorStop(){}};
const faux=()=>new Proxy({measureText:t=>({width:30}),createLinearGradient:()=>grad,createRadialGradient:()=>grad,
 fillRect:(x,y,w,h)=>rects.push({x,y,w,h}), moveTo:(x,y)=>traits.push({x,y})},
 {get:(t,k)=>(k in t)?t[k]:(typeof k==='string'?()=>{}:undefined),set:(t,k,v)=>{t[k]=v;return true;}});
const el=v=>({value:v,style:{},dataset:{},getContext:faux,classList:{add(){},remove(){},contains:()=>false,toggle(){}},width:1400,height:900,addEventListener(){},querySelectorAll:()=>[],querySelector:()=>null,closest:()=>null});
global.window=global;global.requestAnimationFrame=()=>{};global.addEventListener=()=>{};global.removeEventListener=()=>{};
global.document={documentElement:el(''),getElementById:()=>el(''),querySelector:()=>el(''),querySelectorAll:()=>[el('')],addEventListener(){},createElement:()=>el(''),body:{appendChild(){},classList:{add(){},remove(){}}}};
const store={};
global.localStorage={getItem:k=>store[k]??null,setItem:(k,v)=>{store[k]=v;},removeItem:k=>{delete store[k];}};
global.navigator={userAgent:'node'};
global.getComputedStyle=()=>({getPropertyValue:()=>''});global.fetch=async()=>({ok:true,json:async()=>({})});
eval('var state;'+sc.replace('const state =','state =')
  +';global.__g=getInd;global.__vis=vis;global.__cp=computePanes;global.__imp=drawImp;'
  +'global.__setH=(w,h)=>{W=w;H=h;};global.__load=(typeof loadConfig==="function")?loadConfig:null;');
const tout=JSON.parse(fs.readFileSync('candles_synth.json','utf8')).slice(0,3000);
state.data=tout;state.symbol='BTCUSDT';state.tf=1;state.cache={};
global.ctx=faux();global.AXIS_W=60;global.AXIS_H=24;global.xOf=i=>i*0.35;
__setH(1400,900);

let ko=0; const t=(n,ok,d)=>{ if(!ok) ko++; console.log((ok?'OK    ':'ECHEC ')+n+(d?'  -> '+d:'')); };

console.log('== Par defaut ==');
t('actif', state.indicators.imp.on===true);
t('   visible', __vis('imp')===true);

console.log('\n== Il obtient un panneau ==');
const p=__cp();
const sien=p.find(q=>(q.members||[]).includes('imp'));
t('un panneau lui est attribue', !!sien, sien? 'hauteur '+Math.round(sien.h)+' px' : 'aucun');
t('   de hauteur exploitable', sien && sien.h>25, sien? Math.round(sien.h)+' px' : '-');

console.log('\n== Il se calcule et se dessine ==');
const r=__g('imp');
t('le calcul repond', !!r && Array.isArray(r.md), r&&r.md? r.md.length+' valeurs' : 'rien');
rects.length=0; traits.length=0;
let exc=null;
try{ __imp(sien||{key:'imp',y:400,h:60,lo:0,hi:1}, 0, 2999, 4, 'imp'); }
catch(e){ exc=e.message.slice(0,80); }
t('le dessin passe', !exc, exc||'aucune exception');
t('   il trace quelque chose', rects.length+traits.length>100, (rects.length+traits.length)+' elements');

console.log('\n== Une configuration enregistree qui l eteignait ==');
delete store['lumen_imp_allume_une_fois'];
state.indicators.imp.on=false; state.indicators.imp.hidden=true;
if(__load) __load();
t('la bascule le rallume', state.indicators.imp.on===true && state.indicators.imp.hidden===false);
t('   elle se note', store['lumen_imp_allume_une_fois']==='1');
state.indicators.imp.on=false;
if(__load) __load();
t('   un choix volontaire est respecte ensuite', state.indicators.imp.on===false);

console.log('\n'+(ko===0?'L Impulse MACD s affiche par defaut.':ko+' probleme(s).'));
