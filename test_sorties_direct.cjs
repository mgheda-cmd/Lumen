// Les sorties sur sommet/creux : apparaissent-elles en direct sur leur bougie,
// et restent-elles en place ensuite ?
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
const A=3000;
state.symbol='BTCUSDT';state.tf=1;
const pose=(fin)=>{ state.data=brut.slice(A,A+fin); state.cache={}; return __g('strat_mm'); };

const vues=[];
for(const p of [600,700,800,900,1000,1100,1200]){
  const r=pose(p);
  const som=new Set((r.sommetsList||[]).map(x=>x.i));
  const cre=new Set((r.creuxList||[]).map(x=>x.i));
  vues.push([p, som, cre]);
}
const [,somF,creF]=vues[vues.length-1];

let deplaces=0, stables=0;
for(let k=0;k<vues.length-1;k++){
  const [pos,som,cre]=vues[k];
  for(const i of som){ if(i>pos-40) continue; (somF.has(i)?stables++:deplaces++); }
  for(const i of cre){ if(i>pos-40) continue; (creF.has(i)?stables++:deplaces++); }
}
console.log('pivots suivis dans le temps : '+(stables+deplaces));
console.log('  restes en place           : '+stables);
console.log('  deplaces ou disparus      : '+deplaces);
console.log();

// a quelle bougie un pivot apparait-il pour la premiere fois ?
const cibles=[...somF].filter(i=>i>300&&i<1100).slice(-3);
console.log('  pivot sur bougie | premiere apparition | retard');
for(const c of cibles){
  let vu=null;
  for(let k=0;k<=25;k++){
    const r=pose(c+1+k);
    if((r.sommetsList||[]).some(x=>x.i===c)){ vu=c+k; break; }
  }
  console.log('        '+String(c).padStart(5)+'      |        '+
    (vu==null?'jamais':String(vu).padStart(5))+'        |  '+(vu==null?'-':'+'+(vu-c)));
}
