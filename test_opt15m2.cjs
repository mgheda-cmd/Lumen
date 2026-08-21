// Option 15M sortie de zone : declenche au franchissement du seuil.
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
const mm=state.indicators.strat_mm;

let ko=0; const t=(n,ok,d)=>{ if(!ok) ko++; console.log((ok?'OK    ':'ECHEC ')+n+(d?'  -> '+d:'')); };

const r=__g('strat_mm');
const a=(r.signals||[]).filter(x=>x.optKey==='opt15m');
const b=(r.signals||[]).filter(x=>x.optKey==='opt15m2');
t('la variante produit des signaux', b.length>0, b.length+' contre '+a.length+' pour l originale');
t('   les deux coexistent', a.length>0&&b.length>0);
t('   achats et ventes', b.some(x=>x.dir===1)&&b.some(x=>x.dir===-1),
  b.filter(x=>x.dir===1).length+' achats, '+b.filter(x=>x.dir===-1).length+' ventes');
t('   elles ne tombent pas aux memes bougies',
  new Set(b.map(x=>x.i)).size>0 && b.filter(x=>a.some(y=>y.i===x.i)).length<b.length,
  b.filter(x=>a.some(y=>y.i===x.i)).length+' coincidences');

const sH=state.indicators.kk_bis2.upper, sB=state.indicators.kk_bis2.lower;
let horsZone=0;
for(const x of b){
  const nv=x.triggerLevel;
  if(nv==null) continue;
  if(x.dir===1  && !(nv > sB)) horsZone++;
  if(x.dir===-1 && !(nv < sH)) horsZone++;
}
t('   achat au-dessus du seuil bas, vente sous le seuil haut', horsZone===0,
  horsZone+' ecart(s) sur '+b.length);

let alt=0,p=0;
for(const x of b.sort((u,v)=>u.i-v.i)){ if(x.dir===p) alt++; p=x.dir; }
t('   alternance respectee', alt===0, alt+' consecutifs de meme sens');
t('   la raison est portee', b.every(x=>/sortie de zone/.test(x.reason||'')));

mm.showOpt15mZone=false; state.cache={};
const sans=(__g('strat_mm').signals||[]).filter(x=>x.optKey==='opt15m2');
t('debrayable', sans.length===0, sans.length+' signaux une fois eteinte');
mm.showOpt15mZone=true; state.cache={};

t('choix dans le backtest', /value="mm_opt15m2"/.test(src));
t('   filtre du backtest', /mEnt === 'mm_opt15m2'/.test(src));
t('   l originale n attrape plus la variante',
  /optKey === 'opt15m'\);/.test(src));
t('reglage au panneau', /k:'showOpt15mZone'/.test(src));

console.log('\n'+(ko===0?'La variante sortie de zone fonctionne.':ko+' probleme(s).'));
