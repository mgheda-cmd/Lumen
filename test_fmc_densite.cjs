// Les etiquettes de divergence ne doivent pas se recouvrir, quelle que soit l'UT.
const fs=require('fs');
const src=fs.readFileSync('index.html','utf8');
const sc=src.match(/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/i)[1];
const etiq=[];
let dernierTexte=null;
const grad={addColorStop(){}};
const faux=()=>new Proxy({measureText:(t)=>({width:String(t).length*5}),
 createLinearGradient:()=>grad,createRadialGradient:()=>grad,
 fillText:(t,x,y)=>{ if(typeof t==='string' && /^Div/.test(t)) etiq.push({t,x,y}); }},
 {get:(t,k)=>(k in t)?t[k]:(typeof k==='string'?()=>{}:undefined),set:(t,k,v)=>{t[k]=v;return true;}});
const el=(v)=>({value:v,style:{},dataset:{},getContext:faux,classList:{add(){},remove(){},contains:()=>false,toggle(){}},
 width:1000,height:800,addEventListener(){},querySelectorAll:()=>[],querySelector:()=>null,closest:()=>null});
global.window=global;global.requestAnimationFrame=()=>{};global.addEventListener=()=>{};global.removeEventListener=()=>{};
global.document={documentElement:el(''),getElementById:()=>el(''),querySelector:()=>el(''),querySelectorAll:()=>[el('')],addEventListener(){},createElement:()=>el(''),body:{appendChild(){},classList:{add(){},remove(){}}}};
global.localStorage={getItem:()=>null,setItem(){},removeItem(){}};global.navigator={userAgent:'node'};
global.getComputedStyle=()=>({getPropertyValue:()=>''});global.fetch=async()=>({ok:true,json:async()=>({})});
eval('var state;'+sc.replace('const state =','state =')+';global.__g=getInd;global.__d=drawFmcSub;');
const brut=JSON.parse(fs.readFileSync('candles_ok.json','utf8'));
global.ctx=faux();global.W=1300;global.H=900;global.AXIS_W=60;global.AXIS_H=24;

let ko=0; const t=(n,ok,d)=>{ if(!ok) ko++; console.log((ok?'OK    ':'ECHEC ')+n+(d?'  -> '+d:'')); };

// on simule deux unites : 1 minute et 5 minutes, meme nombre de bougies a l'ecran
const agreger=(src,k)=>{ const out=[];
  for(let i=0;i+k<=src.length;i+=k){ const g=src.slice(i,i+k);
    out.push({t:g[0].t,o:g[0].o,h:Math.max(...g.map(x=>x.h)),l:Math.min(...g.map(x=>x.l)),
              c:g[g.length-1].c,v:g.reduce((a,b)=>a+(b.v||0),0)}); }
  return out; };

const mesure=(bougies, tf, nom)=>{
  state.data=bougies; state.symbol='BTCUSDT'; state.tf=tf; state.cache={};
  etiq.length=0;
  const VIS=400;
  global.xOf=(i)=>(i-(bougies.length-VIS))*((W-AXIS_W)/VIS);
  try{ __d({key:'fmc',y:0,h:220,lo:0,hi:100}, bougies.length-VIS, bougies.length-1, 3, 'fmc'); }
  catch(e){ return {err:e.message.slice(0,60)}; }
  // combien se chevauchent ?
  let chev=0;
  for(let a=0;a<etiq.length;a++) for(let b=a+1;b<etiq.length;b++){
    if(Math.abs(etiq[a].x-etiq[b].x)<28 && Math.abs(etiq[a].y-etiq[b].y)<14) chev++;
  }
  console.log('   '+nom.padEnd(12)+etiq.length+' etiquettes, '+chev+' chevauchement(s)');
  return {n:etiq.length, chev};
};

console.log('Etiquettes de divergence sur 400 bougies visibles :');
const m1=mesure(brut.slice(0,6000), 1, '1 minute');
const m5=mesure(agreger(brut.slice(0,20000),5), 5, '5 minutes');
const m15=mesure(agreger(brut.slice(0,20000),15), 15, '15 minutes');

t('aucun chevauchement en 1 minute', m1.chev===0, m1.chev);
t('aucun chevauchement en 5 minutes', m5.chev===0, m5.chev);
t('aucun chevauchement en 15 minutes', m15.chev===0, m15.chev);
t('la densite reste comparable', Math.max(m1.n,m5.n,m15.n) - Math.min(m1.n,m5.n,m15.n) < 25,
  m1.n+' / '+m5.n+' / '+m15.n);
t('des etiquettes restent affichees', m1.n>0 && m5.n>0 && m15.n>0);
t('le garde-fou est en place', /const occupes = \[\]/.test(src) && /if \(!libre\(x, y, largeur\)\) continue;/.test(src));

console.log('\n'+(ko===0?'La lisibilite est la meme sur toutes les unites.':ko+' probleme(s).'));
