// Le tableau de bord ne doit plus figer la page.
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
eval('var state;'+sc.replace('const state =','state =')+
  ";global.__f={computeMmsBoForTf,DASHBOARD_TFS,__mmsBoMemo};");
const tout=JSON.parse(fs.readFileSync('candles_ok.json','utf8')).slice(0,6000);
state.data=tout;state.symbol='BTCUSDT';state.tf=1;

let ko=0; const t=(n,ok,d)=>{ if(!ok) ko++; console.log((ok?'OK    ':'ECHEC ')+n+(d?'  -> '+d:'')); };
const UT=__f.DASHBOARD_TFS.map(x=>x.key);
const ch=(f)=>{const t0=Date.now();f();return Date.now()-t0;};

const p=ch(()=>{for(const u of UT) __f.computeMmsBoForTf(u);});
t('premier calcul des 8 unites', p<3000, p+' ms');
const m=ch(()=>{for(const u of UT) __f.computeMmsBoForTf(u);});
t('deuxieme appel, en memoire', m<50, m+' ms');
const g=ch(()=>{for(let i=0;i<30;i++) for(const u of UT) __f.computeMmsBoForTf(u);});
t('30 deplacements', g<200, g+' ms au total, '+(g/30).toFixed(1)+' ms par geste');

state.data=tout.concat([{t:tout[tout.length-1].t+60000,o:1,h:2,l:0.5,c:1.5,v:1}]);
const nb=ch(()=>{for(const u of UT) __f.computeMmsBoForTf(u);});
t('nouvelle bougie, les 8 d un coup', nb<3000, nb+' ms');

t('fenetre de calcul limitee', /const FENETRE_HUD = 400/.test(src));
t('memoire par unite et par bougie', /__mmsBoMemo/.test(src));
t('calcul etale sur les rafraichissements', /__mmsBoTour/.test(src));
t('   valeur ancienne affichee en attendant', /function __mmsBoDejaCalcule/.test(src));
t('pas de recalcul pendant le glissement', /state\.dragging[\s\S]{0,120}__mmsBoDiffere/.test(src));

const r=__f.computeMmsBoForTf(1);
t('le tableau reste juste', !!(r&&r.mmsLabel&&r.boLabel), r? r.mmsLabel+' | '+r.boLabel : 'nul');

console.log('\n'+(ko===0?'Le tableau ne fige plus la page.':ko+' probleme(s).'));
