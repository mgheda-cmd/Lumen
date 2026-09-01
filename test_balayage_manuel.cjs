// Balayage manuel et type explicite sur la pastille FMC.
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
state.data=tout;state.symbol='BTCUSDT';state.tf=1;state.cache={};

let ko=0; const t=(n,ok,d)=>{ if(!ok) ko++; console.log((ok?'OK    ':'ECHEC ')+n+(d?'  -> '+d:'')); };

console.log('== Balayage manuel ==');
t('plus de lancement automatique', !/__stratLancee/.test(src));
t('   le bouton existe', /id="btn-balayage"/.test(src));
t('   il appelle le balayage', /window\.lancerBalayageStrat && window\.lancerBalayageStrat\(true\)/.test(src));
t('   place a cote des alertes',
  src.indexOf('id="btn-balayage"') < src.indexOf('id="alerts-wrap"'));

console.log('\n== Pastille FMC : les deux sources ==');
t('les trois sources actives par defaut', /fmcSoloSource:'tout'/.test(src));
const solo=(__g('strat_mm').signals||[]).filter(x=>x.optKey==='fmc_solo');
t('   des signaux sont produits', solo.length>0, solo.length);
const types={};
for(const x of solo) types[x.reason]=(types[x.reason]||0)+1;
console.log('   repartition :', JSON.stringify(types));
t('   contrariens presents', solo.some(x=>/CONTRARIEN/.test(x.reason||'')));
t('   continuations presentes', solo.some(x=>/CONTINUATION/.test(x.reason||'')));
t('   divergences presentes', solo.some(x=>/DIVERGENCE/.test(x.reason||'')));

console.log('\n== Le type est lisible ==');
t('chaque pastille porte son type', solo.every(x=>/CONTRARIEN|CONTINUATION|DIVERGENCE/.test(x.reason||'')));
t('   et la ligne de detail l explique',
  solo.some(x=>/retournement/.test(x.sub||'')) && solo.some(x=>/continuation/.test(x.sub||'')));
const cyan=solo.filter(x=>x.color==='#22D3EE'||x.color==='#FB7185').length;
const violet=solo.filter(x=>x.color==='#A78BFA'||x.color==='#E879F9').length;
t('   les couleurs distinguent les familles', cyan>0 && violet>0, cyan+' contrariens, '+violet+' autres');

console.log('\n'+(ko===0?'Balayage a la demande, type visible sur chaque pastille.':ko+' probleme(s).'));
