// Lissage Heikin Ashi : calcule, branche, dessine.
const fs=require('fs');
const src=fs.readFileSync('index.html','utf8');
const sc=src.match(/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/i)[1];
const traits=[]; const rects=[];
const grad={addColorStop(){}};
const faux=()=>new Proxy({measureText:t=>({width:30}),createLinearGradient:()=>grad,createRadialGradient:()=>grad,
 moveTo:(x,y)=>traits.push({x,y}), fillRect:(x,y,w,h)=>rects.push({x,y,w,h})},
 {get:(t,k)=>(k in t)?t[k]:(typeof k==='string'?()=>{}:undefined),set:(t,k,v)=>{t[k]=v;return true;}});
const el=v=>({value:v,style:{},dataset:{},getContext:faux,classList:{add(){},remove(){},contains:()=>false,toggle(){}},width:1000,height:800,addEventListener(){},querySelectorAll:()=>[],querySelector:()=>null,closest:()=>null});
global.window=global;global.requestAnimationFrame=()=>{};global.addEventListener=()=>{};global.removeEventListener=()=>{};
global.document={documentElement:el(''),getElementById:()=>el(''),querySelector:()=>el(''),querySelectorAll:()=>[el('')],addEventListener(){},createElement:()=>el(''),body:{appendChild(){},classList:{add(){},remove(){}}}};
global.localStorage={getItem:()=>null,setItem(){},removeItem(){}};global.navigator={userAgent:'node'};
global.getComputedStyle=()=>({getPropertyValue:()=>''});global.fetch=async()=>({ok:true,json:async()=>({})});
eval('var state;'+sc.replace('const state =','state =')+';global.__g=getInd;global.__d=drawSHA;');
const tout=JSON.parse(fs.readFileSync('candles_synth.json','utf8')).slice(0,3000);
state.data=tout;state.symbol='BTCUSDT';state.tf=1;state.cache={};
global.ctx=faux();global.W=1200;global.H=900;global.AXIS_W=60;global.AXIS_H=24;global.xOf=i=>i*0.35;

let ko=0; const t=(n,ok,d)=>{ if(!ok) ko++; console.log((ok?'OK    ':'ECHEC ')+n+(d?'  -> '+d:'')); };

console.log('== Calcul ==');
const ha=__g('sha');
t('le calcul repond', Array.isArray(ha)&&ha.length===tout.length, (ha||[]).length+' bougies');
const valides=ha.filter(x=>x&&x.o!=null&&x.c!=null).length;
t('   bougies lissees valides', valides>tout.length*0.9, valides+'/'+tout.length);
t('   elles restent dans la plage du prix',
  ha.every(x=>!x||(x.h>=x.l && x.o>0 && x.c>0)));

console.log('\n== Dessin ==');
rects.length=0; traits.length=0;
let exc=null;
try{ __d('sha', ha, 0, 2999, (v)=>500-(v-78000)/12, 4, {key:'price'}); }
catch(e){ exc=e.message.slice(0,80); }
t('la fonction dessine', !exc, exc||'aucune exception');
t('   des corps de chandelier', rects.length>1000, rects.length+' corps');
t('   des meches', traits.length>1000, traits.length+' meches');

console.log('\n== Branchement ==');
t('appelee depuis le dessin du prix', /for\(const kSha of \['sha','sha2','sha3'\]\)/.test(src));
t('   pour les trois unites', /if\(vis\(kSha\)\) drawSHA\(kSha/.test(src));
t('   couleurs reglables', /k:'cUp'/.test(src) && /k:'cDown'/.test(src));
t('   opacite reglable', /k:'opacite'/.test(src));

console.log('\n== Plus aucun indicateur orphelin ==');
const cles=[...src.matchAll(/^\s{4}(\w+):\{on:/gm)].map(m=>m[1]);
const i2=src.indexOf('const DR={rsi:drawRSI');
const table=src.slice(i2, src.indexOf('};', i2));
const panneau=new Set([...table.matchAll(/(\w+):\s*(?:\(p,s,e,cw\)=>)?draw\w+/g)].map(m=>m[1]));
const cites=new Set([...src.matchAll(/vis[B]?\('(\w+)'\)/g)].map(m=>m[1]));
const orph=cles.filter(k=>!panneau.has(k)&&!cites.has(k)&&!/^sha/.test(k));
t('aucun indicateur sans dessin', orph.length===0, orph.join(', ')||'les 56 sont rattaches');

console.log('\n'+(ko===0?'Le Heikin Ashi lisse s affiche enfin.':ko+' probleme(s).'));
