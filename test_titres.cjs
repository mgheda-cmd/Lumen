// Les titres des sous-panneaux doivent nommer le bon indicateur.
// On intercepte le texte reellement ecrit sur le canevas.
const fs=require('fs');
const sc=fs.readFileSync('index.html','utf8').match(/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/i)[1];
const ecrits=[];
const grad={addColorStop(){}};
const faux=()=>new Proxy({
  measureText:()=>({width:30}),
  createLinearGradient:()=>grad, createRadialGradient:()=>grad,
  fillText:(t)=>{ if(typeof t==='string') ecrits.push(t); }
},{get:(t,k)=>(k in t)?t[k]:(typeof k==='string'?()=>{}:undefined),set:()=>true});
const el=(v)=>({value:v,style:{},dataset:{},getContext:faux,
 classList:{add(){},remove(){},contains:()=>false,toggle(){}},
 width:1000,height:800,addEventListener(){},querySelectorAll:()=>[],querySelector:()=>null,closest:()=>null});
global.window=global;global.requestAnimationFrame=()=>{};global.addEventListener=()=>{};global.removeEventListener=()=>{};
global.document={documentElement:el(''),getElementById:()=>el(''),querySelector:()=>el(''),
 querySelectorAll:()=>[el('')],addEventListener(){},createElement:()=>el(''),
 body:{appendChild(){},classList:{add(){},remove(){}}}};
global.localStorage={getItem:()=>null,setItem(){},removeItem(){}};
global.navigator={userAgent:'node'};
global.getComputedStyle=()=>({getPropertyValue:()=>''});global.fetch=async()=>({ok:true,json:async()=>({})});
eval('var state;'+sc.replace('const state =','state ='));

const tout=JSON.parse(fs.readFileSync('candles_ok.json','utf8')).slice(0,4000);
state.data=tout;state.symbol='BTCUSDT';state.tf=1;state.cache={};
global.ctx=faux();global.W=1000;global.H=800;global.AXIS_W=60;global.AXIS_H=24;

let ko=0; const t=(n,ok,d)=>{ if(!ok) ko++; console.log((ok?'OK    ':'ECHEC ')+n+(d?'  -> '+d:'')); };
const titre=(cle)=>{
  ecrits.length=0;
  try{ drawKKBisSub({key:cle,y:0,h:200},0,500,4,cle); }
  catch(e){ return 'EXCEPTION '+e.message.slice(0,70); }
  return ecrits.find(x=>/^kk bis/.test(x)) || 'aucun';
};

const t1=titre('kk_bis'), t2=titre('kk_bis2');
t('kk bis a un titre', !/^aucun|^EXCEPTION/.test(t1), t1);
t('kk bis 2 a un titre', !/^aucun|^EXCEPTION/.test(t2), t2);
t('les deux titres different', t1!==t2);
t('   kk bis annonce des seuils adaptatifs', /^kk bis \u00b7/.test(t1)&&/adaptatifs/.test(t1));
t('   kk bis 2 se nomme kk bis 2', /^kk bis 2 \u00b7/.test(t2));
t('   et annonce ses seuils fixes', /fixes 75 \/ -75/.test(t2));

state.indicators.kk_bis2.upper=40; state.indicators.kk_bis2.lower=-40; state.cache={};
const t3=titre('kk_bis2');
t('le titre suit les seuils reglés', /fixes 40 \/ -40/.test(t3), t3);
state.indicators.kk_bis2.upper=75; state.indicators.kk_bis2.lower=-75;

console.log('\n'+(ko===0?'Les titres nomment le bon indicateur.':ko+' probleme(s).'));
