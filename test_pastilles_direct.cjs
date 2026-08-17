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
const brut=JSON.parse(fs.readFileSync('candles_ok.json','utf8'));
const A=3000, B=4200;
state.symbol='BTCUSDT';state.tf=1;
const pose=(n)=>{ state.data=brut.slice(A,n); state.cache={}; return __g('strat_mm'); };

// vues successives : quelles pastilles existent a chaque instant ?
const vues=[];
for(const n of [3600,3700,3800,3900,4000,4100,4200]){
  const r=pose(A+ (n-3000) );
  const ens=new Set((r.signals||[]).filter(x=>x.optKey==='base').map(x=>x.i));
  vues.push([n-3000, ens]);
}
const finale=vues[vues.length-1][1];
console.log('apparition puis persistance des pastilles MM Base :');
console.log();
let disparues=0, total=0;
for(let k=0;k<vues.length-1;k++){
  const [pos,ens]=vues[k];
  for(const i of ens){
    if(i>pos-40) continue;              // trop recente pour juger
    total++;
    if(!finale.has(i)) disparues++;
  }
}
console.log('pastilles vues en cours de route : '+total);
console.log('disparues dans la vue finale     : '+disparues);
console.log();
console.log(disparues===0
 ? "Aucune pastille ne disparait : ce qu'on voit en direct reste."
 : disparues+" pastilles s'effacent apres coup : l'affichage se redessine.");
