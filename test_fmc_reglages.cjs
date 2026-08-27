// FMC : tous les reglages du panneau TradingView, avec leurs valeurs.
const fs=require('fs');
const src=fs.readFileSync('index.html','utf8');
const sc=src.match(/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/i)[1];
const trace={textes:[],rects:0};
const grad={addColorStop(){}};
const faux=()=>new Proxy({measureText:(t)=>({width:String(t).length*5}),
 createLinearGradient:()=>grad,createRadialGradient:()=>grad,
 fillText:(t)=>{ if(typeof t==='string'&&t.trim()) trace.textes.push(t); },
 fillRect:()=>{trace.rects++;}},
 {get:(t,k)=>(k in t)?t[k]:(typeof k==='string'?()=>{}:undefined),set:(t,k,v)=>{t[k]=v;return true;}});
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
eval('var state;'+sc.replace('const state =','state =')+';global.__g=getInd;global.__draw=drawFmcSub;');
const tout=JSON.parse(fs.readFileSync('candles_ok.json','utf8')).slice(0,4000);
state.data=tout;state.symbol='BTCUSDT';state.tf=1;state.cache={};
global.ctx=faux();global.W=1200;global.H=900;global.AXIS_W=60;global.AXIS_H=24;
global.xOf=(i)=>i*0.28;

let ko=0; const t=(n,ok,d)=>{ if(!ok) ko++; console.log((ok?'OK    ':'ECHEC ')+n+(d?'  -> '+d:'')); };
const f=state.indicators.fmc;

console.log('== Valeurs par defaut, comparees au panneau TradingView ==');
for(const [k,att] of [['lenCore',14],['smoothCore',5],['maMethod','EMA'],['scaleCore',7],
  ['lenBal',14],['smoothBal',7],['lenFlow',25],['smoothFlow',10],['forceCandle',false],
  ['flowHeightScale',0.5],['flowExtremeLevel',15],['knnK',5],['knnWindow',400],
  ['trendLen',50],['trendMult',1.5],['wMom',20],['wFlow',20],['wTrend',20],['wKnn',20],['wWave',20],
  ['scoreThresh',80],['oneSignalPerWave',true],['waveBaseTransp',60],['obLevel',70],['osLevel',30],
  ['pivotLength',2],['flowWaveTransp',50],['useDynamicLevels',true],['obosCloseTransp',30],
  ['obosFarTransp',90],['levelLineWidth',4],['centerGradTransp',60],['coreBalTransp',30],
  ['divLineTransp',40],['showTable',true]])
  t('   '+k.padEnd(18)+String(att).padStart(6), f[k]===att, String(f[k]));

console.log('\n== Tous reglables au panneau ==');
let abs=[];
for(const k of ['srcCore','flowWaveTransp','obosCloseTransp','obosFarTransp','levelLineWidth',
                'divLineTransp','cNeutral','cZeroLine','cText','showTable','centerGradTransp','coreBalTransp'])
  if(!new RegExp("k:'"+k+"'").test(src)) abs.push(k);
t('aucun reglage manquant', abs.length===0, abs.join(', ')||'les 12 sont presents');

console.log('\n== Tableau recapitulatif ==');
trace.textes.length=0;
let exc=null;
try{ __draw({key:'fmc',y:0,h:220,lo:0,hi:100}, 0, 3999, 3, 'fmc'); }catch(e){ exc=e.message.slice(0,70); }
t('le panneau se dessine', !exc, exc||'aucune exception');
for(const lab of ['Noyau','Flux','Structure','KNN','Tension','Source','Score','Confluence','Baromètre'])
  t('   ligne '+lab, trace.textes.includes(lab));
t('   le barometre a ses dix blocs', trace.textes.some(x=>/^[\u2588\u2591]{10}$/.test(x)));

f.showTable=false; state.cache={}; trace.textes.length=0;
try{ __draw({key:'fmc',y:0,h:220,lo:0,hi:100}, 0, 3999, 3, 'fmc'); }catch(e){}
t('   masquable', !trace.textes.includes('Confluence'));
f.showTable=true;

console.log('\n'+(ko===0?'FMC est conforme au panneau TradingView.':ko+' probleme(s).'));
