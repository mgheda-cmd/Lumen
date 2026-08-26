// Fidélité du portage FMC au Pine de Uncle_the_shooter.
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
eval('var state;'+sc.replace('const state =','state =')+';global.__calc=calc;');
const tout=JSON.parse(fs.readFileSync('candles_ok.json','utf8')).slice(0,6000);
let ko=0; const t=(n,ok,d)=>{ if(!ok) ko++; console.log((ok?'OK    ':'ECHEC ')+n+(d?'  -> '+d:'')); };
const r=__calc.fmc(tout,{});

console.log('== Modules du Pine, tous presents ==');
for(const k of ['core','bal','flow','trend','knn','score','tension','waveHist',
                'matchCount','baroPct','flowBull','flowBear','flowBullNorm','flowBearNorm','strengthening'])
  t('   '+k, Array.isArray(r[k]) && r[k].length===tout.length, r[k]?r[k].length:'absent');

console.log('\n== KNN : etiquetage decale d une bougie ==');
t('le decalage est en place', /étiquette = mouvement suivant/.test(src));
t('   file d attente d une bougie', /attMom = fM; attFlow = fF; attTrend = fT;/.test(src));
t('   abstention si trop loin', /sd\/knnK > 0\.6/.test(src));
t('   vote entre 0 et 100', r.knn.every(x=>x>=0&&x<=100));

console.log('\n== Bornes et coherences ==');
t('core borne 0-100', r.core.every(x=>x>=0&&x<=100));
t('waveHist borne 0-100', r.waveHist.every(x=>x>=0&&x<=100));
t('waveHist = 50 + tension x 2, borne', r.waveHist.every((v,i)=>{
  const att=Math.max(0,Math.min(100,50+r.tension[i]*2)); return Math.abs(v-att)<1e-9; }));
t('confluence entre 0 et 5', r.matchCount.every(x=>x>=0&&x<=5));
t('barometre = confluence / 5', r.baroPct.every((v,i)=>Math.abs(v-r.matchCount[i]/5*100)<1e-9));
t('flux haut positif, flux bas negatif',
  r.flowBull.every(x=>x>=0) && r.flowBear.every(x=>x<=0));
t('   la part normale ne depasse pas le seuil',
  r.flowBullNorm.every((v,i)=>v<=r.flowBull[i]+1e-9) && r.flowBearNorm.every((v,i)=>v>=r.flowBear[i]-1e-9));

console.log('\n== Reglages du Pine ==');
for(const k of ['srcCore','flowHeightScale','flowExtremeLevel','waveBaseTransp',
                'useDynamicLevels','levelLineWidth','showDivergence'])
  t('   '+k+' reglable', new RegExp("k:'"+k+"'").test(src));
const autreSrc=__calc.fmc(tout,{srcCore:'hlc3'});
t('la source agit', JSON.stringify(autreSrc.core)!==JSON.stringify(r.core));
const sansVol=__calc.fmc(tout,{forceCandle:true});
t('le mode bougies agit', sansVol.auVolume===false && JSON.stringify(sansVol.flow)!==JSON.stringify(r.flow));

console.log('\n'+(ko===0?'Le portage est fidele au Pine.':ko+' probleme(s).'));
