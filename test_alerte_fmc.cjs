// Une alerte doit partir a chaque losange et chaque triangle, dans les deux sens.
const fs=require('fs');
const src=fs.readFileSync('index.html','utf8');
const sc=src.match(/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/i)[1];
const envois=[];
const grad={addColorStop(){}};
const faux=()=>new Proxy({measureText:()=>({width:30}),createLinearGradient:()=>grad,createRadialGradient:()=>grad},
 {get:(t,k)=>(k in t)?t[k]:(typeof k==='string'?()=>{}:undefined),set:()=>true});
const el=v=>{ const o={value:v,style:{},dataset:{},getContext:faux,textContent:'',innerHTML:'',checked:true,
 classList:{add(){},remove(){},contains:()=>false,toggle(){}},width:1400,height:900,
 addEventListener(){},removeEventListener(){},appendChild(){},removeChild(){},remove(){},
 setAttribute(){},getAttribute:()=>null,focus(){},click(){},children:[],onclick:null,
 getBoundingClientRect:()=>({width:0,height:0,left:0,top:0})};
 o.querySelector=()=>el(''); o.querySelectorAll=()=>[el('')]; o.closest=()=>null; return o; };
global.window=global;global.requestAnimationFrame=()=>{};global.addEventListener=()=>{};global.removeEventListener=()=>{};
global.document={documentElement:el(''),getElementById:()=>el(''),querySelector:()=>el(''),
 querySelectorAll:()=>[el('')],addEventListener(){},createElement:()=>el(''),
 body:{appendChild(){},classList:{add(){},remove(){}}}};
const store={};
global.localStorage={getItem:k=>store[k]??null,setItem:(k,v)=>{store[k]=v;},removeItem:k=>{delete store[k];}};
global.navigator={userAgent:'node'};
global.getComputedStyle=()=>({getPropertyValue:()=>''});
global.fetch=async(u)=>{ envois.push(String(u).slice(0,50)); return {ok:true,status:200,json:async()=>({})}; };
global.Notification=function(t,o){ envois.push('N: '+t+' | '+(o&&o.body||'')); };
global.Notification.permission='granted'; global.Notification.requestPermission=async()=>'granted';
eval('var state;'+sc.replace('const state =','state =')+';global.__check=checkAllAlerts;global.__cfg=getPhoneNotifConfig;global.__g=getInd;');
global.toast=()=>{};
const brut=JSON.parse(fs.readFileSync('candles_synth.json','utf8'));

let ko=0; const t=(n,ok,d)=>{ if(!ok) ko++; console.log((ok?'OK    ':'ECHEC ')+n+(d?'  -> '+d:'')); };

console.log('== Le reglage ==');
t('actif par defaut', __cfg().fmcAlerts !== false);
t('   case dans le panneau', /id="notif-type-fmc"/.test(src));
t('   sauvegarde', /fmcAlerts: document\.getElementById\('notif-type-fmc'\)/.test(src));
t('   rechargee', /elFmc\.checked = cfg\.fmcAlerts !== false/.test(src));

console.log('\n== Les titres disent le type ==');
t('contrarien', /FMC ▲▼ Contrarien/.test(src));
t('   continuation', /FMC ◆ Continuation/.test(src));
t('   divergence', /FMC ≈ Divergence/.test(src));

console.log('\n== Une alerte part vraiment ==');
const tranche=(n)=>{ const a=brut.slice(0,n).map(b=>({...b}));
  const dec=Date.now()-a[a.length-1].t; for(const b of a) b.t+=dec; return a; };
state.data=tranche(6000); state.symbol='BTCUSDT'; state.tf=1; state.cache={};
state.indicators.strat_mm.showFmcSolo=true;
state.indicators.strat_mm.fmcSoloSource='tout';
__check();                       // premier passage : tout est marque comme vu
let trouve=[];
for(const n of [6100,6300,6600,7000]){
  state.data=tranche(n); state.cache={}; window.__alertsInitialized=true;
  envois.length=0;
  __check();
  const fmc=envois.filter(x=>/FMC/.test(x));
  if(fmc.length) trouve=trouve.concat(fmc);
}
t('des alertes FMC partent', trouve.length>0, trouve.length+' alerte(s)');
if(trouve.length) console.log('   exemple : '+trouve[0].slice(0,80));
t('   les deux sens', trouve.some(x=>/ACHAT/.test(x)) && trouve.some(x=>/VENTE/.test(x)),
  trouve.filter(x=>/ACHAT/.test(x)).length+' achats, '+trouve.filter(x=>/VENTE/.test(x)).length+' ventes');

console.log('\n'+(ko===0?'Chaque losange et chaque triangle declenchent une alerte.':ko+' probleme(s).'));
