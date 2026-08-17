const fs=require('fs');
const sc=fs.readFileSync('index.html','utf8').match(/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/i)[1];
const grad={addColorStop(){}};
const faux=()=>new Proxy({measureText:()=>({width:30}),createLinearGradient:()=>grad,createRadialGradient:()=>grad},
 {get:(t,k)=>(k in t)?t[k]:(typeof k==='string'?()=>{}:undefined),set:()=>true});
const vals={'bta-ent':'mm_base','bta-sens':'normal','bta-dir':'tout','bta-modeap':'chrono',
 'bta-sor':'mm_opp','bta-rang':'1','bta-marge':'0.02','bta-unite':'BASE','bta-lev':'200',
 'bta-tp':'0','bta-frais':'0.02','bta-jours':'7','bta-capital':'100','bta-mmode':'croise',
 'bta-mpct':'50','bta-mbonus':'20','bta-opp':'toujours'};
const c={}; const el=(v)=>({value:v,style:{},dataset:{},getContext:faux,textContent:'',innerHTML:'',
 classList:{add(){},remove(){},contains:()=>false,toggle(){}},width:1000,height:800,
 addEventListener(){},querySelectorAll:()=>[],querySelector:()=>null,closest:()=>null,
 appendChild(){},removeChild(){},setAttribute(){},getAttribute:()=>null});
for(const k in vals) c[k]=el(vals[k]);
global.window=global;global.requestAnimationFrame=()=>{};global.addEventListener=()=>{};global.removeEventListener=()=>{};
global.document={documentElement:el(''),getElementById:(i)=>c[i]||el(''),querySelector:()=>el(''),
 querySelectorAll:()=>[el('')],addEventListener(){},createElement:()=>el(''),
 body:{appendChild(){},classList:{add(){},remove(){}}}};
global.localStorage={getItem:()=>null,setItem(){},removeItem(){}};
global.navigator={userAgent:'node'};global.confirm=()=>true;global.alert=()=>{};
global.getComputedStyle=()=>({getPropertyValue:()=>''});global.fetch=async()=>({ok:true,json:async()=>({})});
eval('var state;'+sc.replace('const state =','state =')+';global.__g=getInd;');
const tout=JSON.parse(fs.readFileSync('candles_ok.json','utf8')).slice(0,8000);
state.data=tout;state.symbol='BTCUSDT';state.tf=1;state.cache={};
window.chargerHistorique=async()=>{};
(async()=>{
  await window.__runBtInterne();
  const L=window.__btDernier.liste||[];
  const r=__g('strat_mm'); const net=r.net||[];
  const sH=(state.indicators.kk_bis2&&state.indicators.kk_bis2.upper)||75;
  const sB=(state.indicators.kk_bis2&&state.indicators.kk_bis2.lower)||-75;
  const fin=(i,h)=>{let j=i;while(j<net.length&&net[j]!=null&&(h?net[j]>=sH:net[j]<=sB))j++;return j;};
  const sig=new Map(); for(const x of (r.signals||[])) if(x.creuxIdx!=null) sig.set(x.i,x);
  let mauvais=0;
  for(const t of L){
    const s=sig.get(t.iE);
    if(!s) continue;
    if(t.iE < fin(s.creuxIdx, s.dir===-1)) mauvais++;
  }
  console.log('trades du backtest : '+L.length);
  console.log('entrees anticipant leur creux : '+mauvais);
  console.log(mauvais===0?'Aucune anticipation dans le backtest.':'Il en reste.');
})();
