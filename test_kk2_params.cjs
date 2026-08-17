// Les parametres de kk bis 2 doivent etre ceux de Google-, sans rien perdre.
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
eval('var state;'+sc.replace('const state =','state ='));
const tout=JSON.parse(fs.readFileSync('candles_ok.json','utf8')).slice(0,5000);
state.data=tout;state.symbol='BTCUSDT';state.tf=1;state.cache={};

let ko=0; const t=(n,ok,d)=>{ if(!ok) ko++; console.log((ok?'OK    ':'ECHEC ')+n+(d?'  -> '+d:'')); };

const bloc=(cle)=>{ const i=src.indexOf(cle+":{title:"); if(i<0) return '';
  let j=src.indexOf('{',i),p=0,k=j;
  while(k<src.length){ if(src[k]==='{')p++; else if(src[k]==='}'){p--; if(p===0)break;} k++; }
  return src.slice(i,k+1); };
const s2=bloc('kk_bis2');
const champs=[...new Set([...s2.matchAll(/k:'(\w+)'/g)].map(m=>m[1]))];

t('schema present', s2.length>0);
t('   47 champs', champs.length===47, champs.length+' champs');
t('   titre de Google', /title:'kk bis 2 — seuils fixes'/.test(s2));
for(const c of ['upper','lower','src','filter','postFilter','sigFilter','trimUp','trimLo',
                'cLineUp','cLineDn','showVerticalLines','showOscillator','fillAlpha'])
  t('   champ '+c, champs.includes(c));

const d=state.indicators.kk_bis2;
t('reglages par defaut presents', !!d);
t('   chaque champ du schema a une valeur',
  champs.every(c=>c in d), champs.filter(c=>!(c in d)).join(', ')||'tous');
t('   seuils a 75 / -75', d.upper===75 && d.lower===-75);
t('   nos reglages propres conserves',
  ['kMult','rmsWin','noiseTf','rangeImpMin'].every(c=>c in d),
  ['kMult','rmsWin','noiseTf','rangeImpMin'].filter(c=>!(c in d)).join(', ')||'tous');

// l'indicateur tourne toujours
state.cache={};
const r=getInd('kk_bis2');
t('kk bis 2 calcule toujours', !!(r&&r.net&&r.net.length), (r&&r.exits?r.exits.length:0)+' sorties');
t('   seuils toujours fixes', new Set((r.up||[]).filter(v=>v!=null)).size===1);

console.log('\n'+(ko===0?'Les parametres sont ceux de Google-, rien de perdu.':ko+' probleme(s).'));
