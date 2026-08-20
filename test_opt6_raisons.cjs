const fs=require('fs');
const sc=fs.readFileSync('index.html','utf8').match(/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/i)[1];
const grad={addColorStop(){}};
const faux=()=>new Proxy({measureText:()=>({width:30}),createLinearGradient:()=>grad,createRadialGradient:()=>grad},
 {get:(t,k)=>(k in t)?t[k]:(typeof k==='string'?()=>{}:undefined),set:()=>true});
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
eval('var state;'+sc.replace('const state =','state =')+';global.__g=getInd;');
const tout=JSON.parse(fs.readFileSync('candles_ok.json','utf8')).slice(0,8000);
state.data=tout;state.symbol='BTCUSDT';state.tf=1;state.cache={};
const r=__g('strat_mm');
const o6=(r.signals||[]).filter(x=>x.optKey==='opt6');
const idx=new Map(tout.map((b,i)=>[b.t,i]));
const q=(l)=>{let s=0,n=0,g=0;for(const x of l){const i=idx.get(x.t);if(i==null||i+30>=tout.length)continue;
  const d=(tout[i+30].c-tout[i].c)*(x.dir===1?1:-1);s+=d;n++;if(d>0)g++;}
  return n?{n,moy:s/n,wr:100*g/n}:null;};
const raison=(x)=>{
  const l=(x.label||'')+(x.badge||'');
  if(/CHoCH/i.test(l)) return 'CHoCH';
  if(/DIV/i.test(l))   return 'DIV';
  if(/BOS/i.test(l))   return 'BOS';
  return 'autre';
};
const grp={};
for(const x of o6){ const k=raison(x); (grp[k]=grp[k]||[]).push(x); }
console.log('Option 6 : mouvement moyen 30 bougies apres, par raison');
console.log();
for(const k of Object.keys(grp).sort()){
  const z=q(grp[k]);
  console.log('   '+k.padEnd(7)+' '+(z? String(z.n).padStart(3)+' signaux | '+
    (z.moy>=0?'+':'')+z.moy.toFixed(1)+' $ | '+z.wr.toFixed(0)+'%' : 'aucun'));
}
// le drapeau mss est-il disponible sur les evenements ?
const ev=(typeof calc!=='undefined'&&calc.bosOne)?calc.bosOne(tout,'',1):[];
const nb=(f)=>ev.filter(f).length;
console.log();
console.log('Evenements de structure detectes sur la periode :');
console.log('   BOS   : '+nb(b=>b.kind==='BOS'));
console.log('   CHoCH : '+nb(b=>b.kind==='CHoCH'));
console.log('   dont marques MSS : '+nb(b=>b.mss));
