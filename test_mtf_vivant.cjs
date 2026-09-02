// Un indicateur sur unite superieure doit suivre le prix sans rechargement.
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
  +';global.__g=getInd;global.__mtf=getMTFBars;global.__store=mtfStore;global.__setH=(w,h)=>{W=w;H=h;};');
const brut=JSON.parse(fs.readFileSync('candles_synth.json','utf8'));
state.symbol='BTCUSDT';state.market='futures';state.tf=1;
global.AXIS_W=60;global.AXIS_H=24;__setH(1400,900);

let ko=0; const t=(n,ok,d)=>{ if(!ok) ko++; console.log((ok?'OK    ':'ECHEC ')+n+(d?'  -> '+d:'')); };

// on simule le magasin charge une fois, fige a un instant T
const agr=(src2,k)=>{ const o=[]; let c=null; const pas=k*60000;
  for(const b of src2){ const cle=Math.floor(b.t/pas)*pas;
    if(!c||c.t!==cle){ c={t:cle,o:b.o,h:b.h,l:b.l,c:b.c,v:b.v||0}; o.push(c); }
    else { c.h=Math.max(c.h,b.h); c.l=Math.min(c.l,b.l); c.c=b.c; c.v+=(b.v||0); } }
  return o; };

state.data=brut.slice(0,3000);
__store.key=state.symbol+'|'+state.market;
__store.data[5]=agr(brut.slice(0,3000),5);      // instantane du demarrage
const fige=__store.data[5][__store.data[5].length-1].c;

console.log('== Le magasin ne se recharge pas ==');
t('il est fige apres le premier chargement', /if\(mtfStore\.data\[tf\]!==undefined\)return;/.test(src));

console.log('\n== Mais il est prolonge par les bougies vivantes ==');
state.data=brut.slice(0,3200);                   // 200 bougies de plus arrivent
const b5=__mtf(5);
const dernier=b5[b5.length-1];
t('la derniere bougie de 5 min a change', dernier.c!==fige,
  fige.toFixed(1)+'  ->  '+dernier.c.toFixed(1));
t('   elle colle au prix courant', Math.abs(dernier.c - state.data[state.data.length-1].c)<0.001,
  dernier.c.toFixed(1)+' contre '+state.data[state.data.length-1].c.toFixed(1));
t('   de nouvelles bougies sont apparues', b5.length > __store.data[5].length,
  __store.data[5].length+'  ->  '+b5.length);

console.log('\n== L indicateur suit ==');
state.indicators.fmc.on=true; state.indicators.fmc.tf='5';
state.data=brut.slice(0,3000); state.cache={};
const a=__g('fmc'); const av=a.core[a.core.length-1];
state.data=brut.slice(0,3300); state.cache={};
const b=__g('fmc'); const ap=b.core[b.core.length-1];
t('le noyau evolue avec le prix', Math.abs(av-ap)>0.01, av.toFixed(1)+'  ->  '+ap.toFixed(1));

console.log('\n== En unite du graphique, rien ne change ==');
state.indicators.fmc.tf='chart'; state.cache={};
const c1=__g('fmc');
t('toujours autant de valeurs', c1.core.length===state.data.length, c1.core.length+'/'+state.data.length);

console.log('\n'+(ko===0?'Les indicateurs multi-unites suivent le prix en direct.':ko+' probleme(s).'));
