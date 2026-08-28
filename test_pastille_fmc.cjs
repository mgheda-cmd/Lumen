// Pastille FMC autonome : ses propres signaux, sans toucher aux autres.
const fs=require('fs');
const src=fs.readFileSync('index.html','utf8');
const sc=src.match(/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/i)[1];
const grad={addColorStop(){}};
const faux=()=>new Proxy({measureText:()=>({width:30}),createLinearGradient:()=>grad,createRadialGradient:()=>grad},
 {get:(t,k)=>(k in t)?t[k]:(typeof k==='string'?()=>{}:undefined),set:()=>true});
const el=v=>({value:v,style:{},dataset:{},getContext:faux,classList:{add(){},remove(){},contains:()=>false,toggle(){}},width:1000,height:800,addEventListener(){},querySelectorAll:()=>[],querySelector:()=>null,closest:()=>null});
global.window=global;global.requestAnimationFrame=()=>{};global.addEventListener=()=>{};global.removeEventListener=()=>{};
global.document={documentElement:el(''),getElementById:()=>el(''),querySelector:()=>el(''),querySelectorAll:()=>[el('')],addEventListener(){},createElement:()=>el(''),body:{appendChild(){},classList:{add(){},remove(){}}}};
global.localStorage={getItem:()=>null,setItem(){},removeItem(){}};global.navigator={userAgent:'node'};
global.getComputedStyle=()=>({getPropertyValue:()=>''});global.fetch=async()=>({ok:true,json:async()=>({})});
eval('var state;'+sc.replace('const state =','state =')+';global.__g=getInd;');
const tout=JSON.parse(fs.readFileSync('candles_synth.json','utf8'));
state.data=tout;state.symbol='BTCUSDT';state.tf=1;
const mm=state.indicators.strat_mm;

let ko=0; const t=(n,ok,d)=>{ if(!ok) ko++; console.log((ok?'OK    ':'ECHEC ')+n+(d?'  -> '+d:'')); };
const photo=()=>{ state.cache={}; const r=__g('strat_mm'); const s=r.signals||[];
  const p={}; for(const x of s) p[x.optKey]=(p[x.optKey]||0)+1;
  return {s,p, base:s.filter(x=>x.optKey==='base').map(x=>x.i+':'+x.dir).join(',')}; };

console.log('== Elle produit des signaux ==');
mm.showFmcSolo=false; const sans=photo();
mm.showFmcSolo=true;  const avec=photo();
t('la pastille FMC apparait', (avec.p.fmc_solo||0)>0, (avec.p.fmc_solo||0)+' signaux');
t('   achats et ventes', avec.s.some(x=>x.optKey==='fmc_solo'&&x.dir===1) && avec.s.some(x=>x.optKey==='fmc_solo'&&x.dir===-1));

console.log('\n== Elle ne touche a rien ==');
t('les entrees Base sont identiques', sans.base===avec.base);
const autres=Object.keys(sans.p).every(k=>sans.p[k]===avec.p[k]);
t('   toutes les autres options inchangees', autres,
  JSON.stringify(sans.p)===JSON.stringify(avec.p)?'identiques':'seul fmc_solo s ajoute');

console.log('\n== Les trois sources ==');
for(const s2 of ['score','contrarien','divergence','tout']){
  mm.fmcSoloSource=s2; const r=photo();
  console.log('   '+s2.padEnd(12)+(r.p.fmc_solo||0)+' signaux');
}
mm.fmcSoloSource='score';
const parSource={};
for(const s2 of ['score','contrarien','divergence']){ mm.fmcSoloSource=s2; parSource[s2]=(photo().p.fmc_solo||0); }
t('chaque source donne un compte different', new Set(Object.values(parSource)).size>1, JSON.stringify(parSource));
mm.fmcSoloSource='score';

console.log('\n== Alternance et branchement ==');
const solo=photo().s.filter(x=>x.optKey==='fmc_solo').sort((a,b)=>a.i-b.i);
let alt=0,p=0; for(const x of solo){ if(x.dir===p) alt++; p=x.dir; }
t('alternance respectee', alt===0, alt+' consecutifs sur '+solo.length);
t('la raison est portee', solo.every(x=>/score|contrarien|divergence/.test(x.reason||'')));
t('libelle de pastille', /fmc_solo: '\u{1F30A} Pastille FMC'/u.test(src));
t('   libelle du backtest', /mm_fmc_solo: '\u{1F30A} Pastille FMC'/u.test(src));
t('   choix dans le menu', /value="mm_fmc_solo"/.test(src));
t('   filtre correspondant', /mEnt === 'mm_fmc_solo'/.test(src));
t('   masquable', /sig\.optKey === 'fmc_solo' && ind\.showFmcSolo === false/.test(src));

mm.showFmcSolo=false;
t('eteinte : plus aucune pastille', (photo().p.fmc_solo||0)===0);
mm.showFmcSolo=true;

console.log('\n'+(ko===0?'La pastille FMC vit sa propre vie.':ko+' probleme(s).'));
