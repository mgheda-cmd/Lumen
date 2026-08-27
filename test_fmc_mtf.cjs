// En multi-unites, TOUTES les series du FMC doivent couvrir les bougies affichees.
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
const tout=JSON.parse(fs.readFileSync('candles_ok.json','utf8')).slice(0,6000);
state.data=tout;state.symbol='BTCUSDT';state.tf=1;

let ko=0; const t=(n,ok,d)=>{ if(!ok) ko++; console.log((ok?'OK    ':'ECHEC ')+n+(d?'  -> '+d:'')); };
const SERIES=['core','bal','flow','trend','knn','score','dir','tension','waveHist',
              'strengthening','matchCount','baroPct','flowBull','flowBear','flowBullNorm','flowBearNorm'];

for(const tf of ['chart','5','15','60']){
  state.indicators.fmc.tf=tf; state.cache={};
  const r=__g('fmc');
  const courtes=[];
  for(const k of SERIES){
    const a=r[k]||[];
    let der=-1;
    for(let i=0;i<a.length;i++) if(a[i]!=null && isFinite(a[i])) der=i;
    if(der < tout.length-1) courtes.push(k+' s arrete a '+der);
  }
  t('tf='+String(tf).padEnd(6)+' : les 16 series vont au bout', courtes.length===0,
    courtes.slice(0,4).join(' | ') || 'jusqu a la bougie '+(tout.length-1));
}
state.indicators.fmc.tf='chart';
t('la correction est dans le code', /waveHist:M\(r\.waveHist\)/.test(src) && /baroPct:M\(r\.baroPct\)/.test(src));
console.log('\n'+(ko===0?'Plus aucune serie ne s arrete en cours de route.':ko+' probleme(s).'));
