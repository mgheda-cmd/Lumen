// Classement global : une seule consigne par sens, les suivantes sont grises.
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
const sg=(__g('strat_mm').signals||[]).slice().sort((a,b)=>a.i-b.i);
const cons=sg.filter(x=>!(x.renfort>0)), renf=sg.filter(x=>x.renfort>0);
t('signaux classes', sg.length>0, sg.length+' au total : '+cons.length+' consignes, '+renf.length+' renforts');

// les consignes alternent, toutes options confondues
let alt=0,p=0;
for(const x of cons){ if(x.dir===p) alt++; p=x.dir; }
t('les consignes alternent, toutes options confondues', alt===0,
  alt+' consecutives de meme sens sur '+cons.length);

// chaque renfort suit une consigne du meme sens
let mauvais=0, dernier=null;
for(const x of sg){
  if(x.renfort>0){ if(!dernier || dernier.dir!==x.dir) mauvais++; }
  else dernier=x;
}
t('chaque renfort suit sa consigne', mauvais===0, mauvais+' ecart(s)');

// numerotation 1,2,3 puis remise a zero
let ok2=true, det='', attendu=0, sens=0;
for(const x of sg){
  if(x.dir!==sens){ sens=x.dir; attendu=0; if(x.renfort!==0){ ok2=false; det='premier du sens marque '+x.renfort; break; } }
  else { attendu++; if(x.renfort!==attendu){ ok2=false; det='attendu '+attendu+', obtenu '+x.renfort; break; } }
}
t('numerotation 1, 2, 3 et remise a zero', ok2, det||'conforme');

// le cas des deux pastilles 15 minutes
const q=sg.filter(x=>/^opt15m/.test(x.optKey));
const paires=[];
for(let i=1;i<q.length;i++) if(q[i].dir===q[i-1].dir && q[i].i-q[i-1].i<400) paires.push([q[i-1],q[i]]);
t('les paires 15 minutes sont bien departagees',
  paires.every(([a,b])=>!(a.renfort>0 && b.renfort>0) ? true : true) &&
  paires.every(([a,b])=>a.renfort!==b.renfort),
  paires.length+' paire(s), rangs : '+paires.map(([a,b])=>a.renfort+'/'+b.renfort).join(' '));

const parOpt={};
for(const x of cons) parOpt[x.optKey]=(parOpt[x.optKey]||0)+1;
t('les consignes viennent de plusieurs options', Object.keys(parOpt).length>1,
  Object.entries(parOpt).map(([k,v])=>k+' '+v).join(', '));

console.log('\n'+(ko===0?'Une seule consigne par sens, le reste est grise.':ko+' probleme(s).'));
