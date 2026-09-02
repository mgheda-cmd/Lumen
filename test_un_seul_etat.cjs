// Un indicateur « on » doit s'afficher. Point.
const fs=require('fs');
const src=fs.readFileSync('index.html','utf8');
const sc=src.match(/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/i)[1];
const grad={addColorStop(){}};
const faux=()=>new Proxy({measureText:()=>({width:30}),createLinearGradient:()=>grad,createRadialGradient:()=>grad},
 {get:(t,k)=>(k in t)?t[k]:(typeof k==='string'?()=>{}:undefined),set:()=>true});
const el=v=>({value:v,style:{},dataset:{},getContext:faux,classList:{add(){},remove(){},contains:()=>false,toggle(){}},width:1400,height:900,addEventListener(){},querySelectorAll:()=>[],querySelector:()=>null,closest:()=>null});
global.window=global;global.requestAnimationFrame=()=>{};global.addEventListener=()=>{};global.removeEventListener=()=>{};
global.document={documentElement:el(''),getElementById:()=>el(''),querySelector:()=>el(''),querySelectorAll:()=>[el('')],addEventListener(){},createElement:()=>el(''),body:{appendChild(){},classList:{add(){},remove(){}}}};
const store={};
global.localStorage={getItem:k=>store[k]??null,setItem:(k,v)=>{store[k]=v;},removeItem:k=>{delete store[k];}};
global.navigator={userAgent:'node'};
global.getComputedStyle=()=>({getPropertyValue:()=>''});global.fetch=async()=>({ok:true,json:async()=>[]});
eval('var state;'+sc.replace('const state =','state =')
  +';global.__vis=vis;global.__cp=computePanes;global.__setH=(w,h)=>{W=w;H=h;};'
  +'global.__load=(typeof loadConfig==="function")?loadConfig:null;'
  +'global.__ctrl=(typeof applyPaneCtrl==="function")?applyPaneCtrl:null;');
state.data=JSON.parse(fs.readFileSync('candles_synth.json','utf8')).slice(0,3000);
state.symbol='BTCUSDT';state.tf=1;state.cache={};
global.AXIS_W=60;global.AXIS_H=24;__setH(1400,900);

let ko=0; const t=(n,ok,d)=>{ if(!ok) ko++; console.log((ok?'OK    ':'ECHEC ')+n+(d?'  -> '+d:'')); };

console.log('== Un seul etat ==');
t('vis ne consulte plus hidden', !/state\.indicators\[k\]\.hidden/.test(
  src.slice(src.indexOf('function vis(k)'), src.indexOf('function vis(k)')+200)));
state.indicators.imp.on=true; state.indicators.imp.hidden=true;
t('   coche mais marque masque : il s affiche quand meme', __vis('imp')===true);
state.indicators.imp.on=false;
t('   decoche : il ne s affiche pas', __vis('imp')===false);
state.indicators.imp.on=true; state.indicators.imp.hidden=false;

console.log('\n== L oeil bascule l indicateur ==');
if(__ctrl){ __ctrl('imp','toggle_ind_eye'); }
t('un clic l eteint', state.indicators.imp.on===false);
if(__ctrl){ __ctrl('imp','toggle_ind_eye'); }
t('   un second le rallume', state.indicators.imp.on===true);
t('   et hidden reste faux', state.indicators.imp.hidden===false);
t('le clic sur la pastille fait pareil', /state\.indicators\[ek\]\.on = !state\.indicators\[ek\]\.on/.test(src));

console.log('\n== Nettoyage des configurations enregistrees ==');
state.indicators.rsi.hidden=true; state.indicators.macd.hidden=true;
if(__load) __load();
t('les hidden sont effaces', !state.indicators.rsi.hidden && !state.indicators.macd.hidden);

console.log('\n== Le panneau suit ==');
state.indicators.imp.on=true; state.indicators.imp.hidden=true;
const p=__cp();
t('un indicateur on obtient son panneau',
  p.some(q=>(q.members||[]).includes('imp')),
  p.filter(q=>q.key!=='price').length+' sous-panneaux');

console.log('\n'+(ko===0?'Un indicateur coche s affiche, sans exception.':ko+' probleme(s).'));
