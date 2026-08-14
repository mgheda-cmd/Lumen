const fs=require('fs');
const sc=fs.readFileSync('index.html','utf8').match(/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/i)[1];
const champs={'bta-ent':'classique','bta-sens':'tel','bta-dir':'both','bta-app':'chrono',
 'bta-sortie':'toutes','bta-rang':'1','bta-marge':'0.02','bta-unite':'BASE','bta-lev':'200',
 'bta-tp':'0','bta-frais':'0.02','bta-jours':'7','bta-capital':'100','bta-mmode':'croise',
 'bta-mpct':'50','bta-mbonus':'20','bta-opp':''};
const el=(v)=>({value:v,style:{},textContent:'',innerHTML:'',dataset:{},
 classList:{add(){},remove(){},contains:()=>false,toggle(){}},
 getContext:()=>({measureText:()=>({width:10}),fillRect(){},clearRect(){},beginPath(){},moveTo(){},
  lineTo(){},stroke(){},fill(){},arc(){},save(){},restore(){},translate(){},rotate(){},scale(){}}),
 width:1000,height:600,addEventListener(){},querySelectorAll:()=>[],querySelector:()=>null,
 closest:()=>null,appendChild(){},removeChild(){},insertBefore(){},remove(){},setAttribute(){},
 getAttribute:()=>null,scrollIntoView(){},focus(){},click(){},children:[],childNodes:[],parentNode:null});
const c={}; for(const k in champs) c[k]=el(champs[k]);
global.window=global; global.requestAnimationFrame=()=>{}; global.cancelAnimationFrame=()=>{};
global.addEventListener=()=>{}; global.removeEventListener=()=>{};
global.document={documentElement:el(''),getElementById:(i)=>c[i]||el(''),querySelector:()=>el(''),
 querySelectorAll:()=>[el('')],addEventListener(){},createElement:()=>el(''),
 body:{appendChild(){},classList:{add(){},remove(){}}}};
global.localStorage={getItem:()=>null,setItem(){},removeItem(){}};
global.navigator={userAgent:'node'}; global.confirm=()=>true; global.alert=()=>{};
global.getComputedStyle=()=>({getPropertyValue:()=>''});
global.fetch=async()=>({ok:true,status:200,json:async()=>({})});
eval("var state;\n"+sc.replace('const state =','state ='));
const bougies=JSON.parse(fs.readFileSync('candles_ok.json','utf8')).slice(0,10000);
state.data=bougies; state.symbol='BTCUSDT'; state.tf=1; state.cache={};
window.chargerHistorique=async()=>{};

function analyse(L){
  let chev=0,max=1;
  for(let i=0;i<L.length;i++){ let s=1;
    for(let j=0;j<L.length;j++){ if(i!==j && L[j].iE<L[i].iS && L[j].iS>L[i].iE) s++; }
    if(s>1){ chev++; if(s>max) max=s; } }
  return {chev,max};
}
(async()=>{
 for(const mode of ['','toujours','sans_sortie']){
  c['bta-opp'].value=mode; state.cache={};
  await window.__runBtInterne();
  const r=window.__btDernier;
  const L=r.liste.slice().sort((a,b)=>a.iE-b.iE);
  const a=analyse(L);
  const duree=Math.round(L.reduce((x,t)=>x+(t.iS-t.iE),0)/L.length);
  console.log((mode||'(défaut)').padEnd(13)+' | '+String(r.trades).padStart(3)+' trades | chevauchants '+
    String(a.chev).padStart(2)+' | max simult. '+a.max+' | durée moy. '+String(duree).padStart(4)+
    ' min | PnL '+r.pnl.toFixed(2)+' | liq '+r.liq+' | repli '+r.dd.toFixed(2));
 }
})();
