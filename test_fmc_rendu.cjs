const fs=require('fs');
const src=fs.readFileSync('index.html','utf8');
const sc=src.match(/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/i)[1];
const trace={arcs:0,fills:0,rects:0,textes:[],alphas:[]};
const grad={addColorStop(){}};
const faux=()=>new Proxy({
  measureText:(t)=>({width:String(t).length*5}), createLinearGradient:()=>grad, createRadialGradient:()=>grad,
  arc:()=>{trace.arcs++;}, fill:function(){trace.fills++; if(this.fillStyle) trace.alphas.push(String(this.fillStyle));},
  fillRect:()=>{trace.rects++;}, fillText:(t)=>{ if(typeof t==='string'&&t.trim()) trace.textes.push(t); }
},{get:(t,k)=>(k in t)?t[k]:(typeof k==='string'?()=>{}:undefined),set:(t,k,v)=>{t[k]=v;return true;}});
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
let exc=null;
try{ __draw({key:'fmc',y:0,h:220,lo:0,hi:100}, 0, 3999, 3, 'fmc'); }
catch(e){ exc=e.message.slice(0,80); }
t('le panneau se dessine', !exc, exc||'aucune exception');
t('des points de pivot sont traces', trace.arcs>50, trace.arcs+' cercles');
t('des aplats sont remplis', trace.fills>5, trace.fills+' remplissages');
t('la vague de flux est dessinee', trace.rects>100, trace.rects+' rectangles');
const divs=trace.textes.filter(x=>/^Div/.test(x));
t('les etiquettes de divergence', divs.length>0, divs.length+' etiquettes');
const titre=trace.textes.find(x=>/^FMC/.test(x));
t('le titre porte le barometre', !!titre && /confluence \d\/5/.test(titre));
t('   et les blocs pleins/vides', !!titre && /[\u2588\u2591]{10}/.test(titre), titre? titre.slice(-40):'');

// les opacites doivent suivre les reglages
const forts=trace.alphas.filter(a=>/rgba\([^)]*0\.[4-9]/.test(a));
t('les remplissages sont francs', forts.length>0, forts.length+' aplats a 40 % ou plus');

console.log('\n'+(ko===0?'Le rendu suit le Pine.':ko+' probleme(s).'));
