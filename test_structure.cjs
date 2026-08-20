const fs=require('fs');
const sc=fs.readFileSync('index.html','utf8').match(/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/i)[1];
const grad={addColorStop(){}};
const faux=()=>new Proxy({measureText:()=>({width:30}),createLinearGradient:()=>grad,createRadialGradient:()=>grad},
 {get:(t,k)=>(k in t)?t[k]:(typeof k==='string'?()=>{}:undefined),set:()=>true});
const vals={'bta-ent':'mm_base','bta-sens':'normal','bta-dir':'tout','bta-modeap':'chrono',
 'bta-sor':'oppose','bta-rang':'1','bta-marge':'0.02','bta-unite':'BASE','bta-lev':'200',
 'bta-tp':'0','bta-frais':'0.02','bta-jours':'7','bta-capital':'100','bta-mmode':'croise',
 'bta-mpct':'50','bta-mbonus':'20','bta-opp':'toujours'};
const c={};
const el=(v)=>({value:v,style:{},dataset:{},getContext:faux,textContent:'',innerHTML:'',
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
state.data=tout;state.symbol='BTCUSDT';state.tf=1;
window.chargerHistorique=async()=>{};
const mm=state.indicators.strat_mm;
(async()=>{
  for(const actif of [false,true]){
    mm.resetSurStructure=actif; state.cache={};
    const r0=__g('strat_mm');
    const base=(r0.signals||[]).filter(x=>x.optKey==='base');
    const apres=base.filter(x=>x.apresChoch).length;
    state.cache={};
    await window.__runBtInterne();
    const r=window.__btDernier;
    console.log((actif?'AVEC ':'SANS ')+'remise a zero : '+
      String(base.length).padStart(3)+' entrees Base'+
      (actif?' ('+apres+' apres un CHoCH)':'          ')+
      ' | '+String(r.trades).padStart(3)+' trades | PnL '+r.pnl.toFixed(2).padStart(8)+
      ' | reussite '+r.wr.toFixed(1)+'% | PF '+(isFinite(r.pf)?r.pf.toFixed(2):'inf'));
  }
})();
