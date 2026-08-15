// kk bis 2 doit produire des sorties differentes de kk bis, avec seuils fixes.
const fs=require('fs');
const sc=fs.readFileSync('index.html','utf8').match(/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/i)[1];
const el=(v)=>({value:v,style:{},textContent:'',innerHTML:'',dataset:{},checked:false,
 classList:{add(){},remove(){},contains:()=>false,toggle(){}},
 getContext:()=>({measureText:()=>({width:10}),fillRect(){},clearRect(){},beginPath(){},moveTo(){},
  lineTo(){},stroke(){},fill(){},arc(){},save(){},restore(){},translate(){},rotate(){},scale(){},
  setLineDash(){},closePath(){},strokeRect(){},fillText(){},roundRect(){}}),
 width:1000,height:600,addEventListener(){},querySelectorAll:()=>[],querySelector:()=>null,
 closest:()=>null,appendChild(){},removeChild(){},insertBefore(){},remove(){},setAttribute(){},
 getAttribute:()=>null,scrollIntoView(){},focus(){},click(){},children:[],childNodes:[],parentNode:null});
global.window=global; global.requestAnimationFrame=()=>{}; global.cancelAnimationFrame=()=>{};
global.addEventListener=()=>{}; global.removeEventListener=()=>{};
global.document={documentElement:el(''),getElementById:()=>el(''),querySelector:()=>el(''),
 querySelectorAll:()=>[el('')],addEventListener(){},createElement:()=>el(''),
 body:{appendChild(){},classList:{add(){},remove(){}}}};
global.localStorage={getItem:()=>null,setItem(){},removeItem(){}};
global.navigator={userAgent:'node'}; global.confirm=()=>true; global.alert=()=>{};
global.getComputedStyle=()=>({getPropertyValue:()=>''});
global.fetch=async()=>({ok:true,status:200,json:async()=>({})});
eval("var state;\n"+sc.replace('const state =','state ='));

const tout=JSON.parse(fs.readFileSync('candles_ok.json','utf8')).slice(0,8000);
state.data=tout; state.symbol='BTCUSDT'; state.tf=1; state.cache={};

let ko=0; const t=(n,ok,d)=>{ if(!ok) ko++; console.log((ok?'OK    ':'ECHEC ')+n+(d?'  -> '+d:'')); };

t('reglages kk_bis2 presents', !!state.indicators.kk_bis2);
if(state.indicators.kk_bis2){
  t('   seuil haut a 75', state.indicators.kk_bis2.upper===75, String(state.indicators.kk_bis2.upper));
  t('   seuil bas a -75', state.indicators.kk_bis2.lower===-75, String(state.indicators.kk_bis2.lower));
  t('   eteint par defaut', state.indicators.kk_bis2.on===false);
}

state.cache={};
const a=getInd('kk_bis');
state.cache={};
const b=getInd('kk_bis2');

t('kk bis calcule', !!(a&&a.exits), (a&&a.exits?a.exits.length:0)+' sorties');
t('kk bis 2 calcule', !!(b&&b.exits), (b&&b.exits?b.exits.length:0)+' sorties');
t('les deux different', a&&b&&a.exits.length!==b.exits.length,
  (a?a.exits.length:0)+' contre '+(b?b.exits.length:0));

if(b&&b.up){
  const uniques=[...new Set(b.up.filter(x=>x!=null))];
  t('seuil haut constant', uniques.length===1 && uniques[0]===75, uniques.slice(0,3).join(', '));
}
if(a&&a.up){
  const uniques=[...new Set(a.up.filter(x=>x!=null))];
  t('seuil de kk bis toujours adaptatif', uniques.length>10, uniques.length+' valeurs distinctes');
}

console.log('\n'+(ko===0?'kk bis 2 fonctionne avec les seuils d origine.':ko+' probleme(s).'));
