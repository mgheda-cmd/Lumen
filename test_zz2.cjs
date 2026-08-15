// Z.Z. 2 doit produire les memes signaux que Z.Z. tant qu'aucune regle n'est posee,
// puis diverger des qu'on en ajoute une, sans jamais toucher a Z.Z.
const fs=require('fs');
const sc=fs.readFileSync('index.html','utf8').match(/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/i)[1];
const el=(v)=>({value:v,style:{},textContent:'',innerHTML:'',dataset:{},checked:false,
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
state.data=tout; state.symbol='BTCUSDT'; state.tf=1; state.cache={};

let ko=0; const t=(n,ok,d)=>{ if(!ok) ko++; console.log((ok?'OK    ':'ECHEC ')+n+(d?'  -> '+d:'')); };

t('reglages strat_zz2 presents', !!state.indicators.strat_zz2);
t('   eteint par defaut', state.indicators.strat_zz2 && state.indicators.strat_zz2.on===false);
t('fonction independante', typeof computeZZ2Signals==='function');
t('dessin independant', typeof drawZZ2Signals==='function');

state.cache={}; const a=getInd('strat_zz');
state.cache={}; const b=getInd('strat_zz2');
const nA=(a||[]).filter(x=>!x.isExit).length, nB=(b||[]).filter(x=>!x.isExit).length;
t('sans regle, Z.Z. 2 = Z.Z.', nA===nB, nA+' contre '+nB);

// une regle : ne garder que les achats
window.__zz2Regles=[ (sigs)=>sigs.filter(x=>x.isExit||x.dir===1) ];
state.cache={}; const c2=getInd('strat_zz2');
state.cache={}; const a2=getInd('strat_zz');
const nB2=(c2||[]).filter(x=>!x.isExit).length, nA2=(a2||[]).filter(x=>!x.isExit).length;
t('avec une regle, Z.Z. 2 change', nB2!==nB, nB+' -> '+nB2);
t('Z.Z. n a pas bouge', nA2===nA, nA+' contre '+nA2);
const shorts=(c2||[]).filter(x=>!x.isExit&&x.dir===-1).length;
t('la regle est bien appliquee', shorts===0, shorts+' short(s) restant(s)');
window.__zz2Regles=[];

console.log('\n'+(ko===0?'Z.Z. 2 est independant et extensible.':ko+' probleme(s).'));
