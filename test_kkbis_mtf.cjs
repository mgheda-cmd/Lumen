// kk bis doit renvoyer des valeurs valides sur toutes les unites de temps.
const fs=require('fs');
const sc=fs.readFileSync('index.html','utf8').match(/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/i)[1];
const el=(v)=>({value:v,style:{},textContent:'',innerHTML:'',dataset:{},
 classList:{add(){},remove(){},contains:()=>false,toggle(){}},
 getContext:()=>({measureText:()=>({width:10}),fillRect(){},clearRect(){},beginPath(){},moveTo(){},
  lineTo(){},stroke(){},fill(){},arc(){},save(){},restore(){},translate(){},rotate(){},scale(){},
  setLineDash(){},closePath(){},strokeRect(){},fillText(){},roundRect(){},rect(){}}),
 width:1000,height:600,addEventListener(){},querySelectorAll:()=>[],querySelector:()=>null,
 closest:()=>null,appendChild(){},removeChild(){},insertBefore(){},remove(){},setAttribute(){},
 getAttribute:()=>null,scrollIntoView(){},focus(){},click(){},children:[],childNodes:[],parentNode:null});
global.window=global;global.requestAnimationFrame=()=>{};global.cancelAnimationFrame=()=>{};
global.addEventListener=()=>{};global.removeEventListener=()=>{};
global.document={documentElement:el(''),getElementById:()=>el(''),querySelector:()=>el(''),
 querySelectorAll:()=>[el('')],addEventListener(){},createElement:()=>el(''),
 body:{appendChild(){},classList:{add(){},remove(){}}}};
global.localStorage={getItem:()=>null,setItem(){},removeItem(){}};
global.navigator={userAgent:'node'};global.confirm=()=>true;global.alert=()=>{};
global.getComputedStyle=()=>({getPropertyValue:()=>''});
global.fetch=async()=>({ok:true,status:200,json:async()=>({})});
eval("var state;\n"+sc.replace('const state =','state ='));

const tout=JSON.parse(fs.readFileSync('candles_ok.json','utf8')).slice(0,8000);
state.data=tout; state.symbol='BTCUSDT'; state.tf=1;

let ko=0; const t=(n,ok,d)=>{ if(!ok) ko++; console.log((ok?'OK    ':'ECHEC ')+n+(d?'  -> '+d:'')); };
const sain=(r)=>{
  if(!r||!r.net) return 'aucun resultat';
  const nan=r.net.filter(v=>typeof v==='number'&&Number.isNaN(v)).length;
  const def=r.net.filter(v=>v!=null&&!Number.isNaN(v)).length;
  return nan>0 ? nan+' NaN' : (def===0 ? 'tout vide' : def+' valeurs');
};

for(const cle of ['kk_bis','kk_bis2']){
  for(const tf of ['chart','5','15','60']){
    state.indicators[cle].tf=tf; state.cache={};
    const r=getInd(cle);
    const etat=sain(r);
    t(cle.padEnd(8)+' en '+String(tf).padEnd(6), /valeurs$/.test(etat), etat);
  }
}
state.indicators.kk_bis.tf='chart'; state.indicators.kk_bis2.tf='chart';
console.log('\n'+(ko===0?'kk bis fonctionne sur toutes les unites.':ko+' probleme(s).'));
