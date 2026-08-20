// Les panneaux existants doivent dessiner exactement comme avant.
const fs=require('fs');
const sc=fs.readFileSync('index.html','utf8').match(/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/i)[1];
const trace=[];
const grad={addColorStop(){}};
const faux=()=>new Proxy({
  measureText:()=>({width:30}), createLinearGradient:()=>grad, createRadialGradient:()=>grad,
  fillText:(t)=>trace.push('T:'+t),
  moveTo(x,y){trace.push('M:'+Math.round(x)+','+Math.round(y));},
  lineTo(x,y){trace.push('L:'+Math.round(x)+','+Math.round(y));},
  fillRect(x,y,w,h){trace.push('R:'+Math.round(x)+','+Math.round(y)+','+Math.round(w));}
},{get:(t,k)=>(k in t)?t[k]:(typeof k==='string'?()=>{}:undefined),set:()=>true});
const el=(v)=>({value:v,style:{},dataset:{},getContext:faux,textContent:'',innerHTML:'',
 classList:{add(){},remove(){},contains:()=>false,toggle(){}},width:1000,height:800,
 addEventListener(){},querySelectorAll:()=>[],querySelector:()=>null,closest:()=>null,
 appendChild(){},removeChild(){},setAttribute(){},getAttribute:()=>null});
global.window=global;global.requestAnimationFrame=()=>{};global.addEventListener=()=>{};global.removeEventListener=()=>{};
global.document={documentElement:el(''),getElementById:()=>el(''),querySelector:()=>el(''),
 querySelectorAll:()=>[el('')],addEventListener(){},createElement:()=>el(''),
 body:{appendChild(){},classList:{add(){},remove(){}}}};
global.localStorage={getItem:()=>null,setItem(){},removeItem(){}};
global.navigator={userAgent:'node'};
global.getComputedStyle=()=>({getPropertyValue:()=>''});global.fetch=async()=>({ok:true,json:async()=>({})});
eval('var state;'+sc.replace('const state =','state =')
  +';global.__DR={drawATR,drawMACD,drawStoch,drawVolDelta,drawTwoIndSub,drawRangeDetSub,drawRangeDet2Sub};');
const tout=JSON.parse(fs.readFileSync('candles_ok.json','utf8')).slice(0,3000);
state.data=tout;state.symbol='BTCUSDT';state.tf=1;
global.ctx=faux();global.W=1000;global.H=800;global.AXIS_W=60;global.AXIS_H=24;

const rendu=(fn,cle,passerCle)=>{
  state.cache={}; trace.length=0;
  const p={key:cle,y:0,h:150,lo:0,hi:100};
  try{ passerCle ? __DR[fn](p,0,2999,4,cle) : __DR[fn](p,0,2999,4); }
  catch(e){ return 'EXC:'+e.message.slice(0,50); }
  return trace.join('|');
};
let ko=0;
for(const [fn,cle] of [['drawATR','atr'],['drawMACD','macd'],['drawStoch','stoch'],
  ['drawVolDelta','vol_delta'],['drawTwoIndSub','two_ind'],
  ['drawRangeDetSub','rangeDet'],['drawRangeDet2Sub','rangeDet2']]){
  const avec=rendu(fn,cle,true);
  const sans=rendu(fn,cle,false);
  const id = (avec===sans);
  if(!id) ko++;
  console.log((id?'OK    ':'ECHEC ')+fn.padEnd(18)+
    ' avec cle = sans cle  ('+avec.length+' vs '+sans.length+' caracteres de trace)');
}
console.log('\n'+(ko===0
  ? 'Le repli donne exactement le meme dessin : aucune regression.'
  : ko+' fonction(s) dessinent differemment.'));
