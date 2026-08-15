// kk bis 2 doit etre reglable comme kk bis, seuils fixes en plus.
const fs=require('fs');
const src=fs.readFileSync('index.html','utf8');
const sc=src.match(/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/i)[1];
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
const tout=JSON.parse(fs.readFileSync('candles_ok.json','utf8')).slice(0,6000);
state.data=tout; state.symbol='BTCUSDT'; state.tf=1;

let ko=0; const t=(n,ok,d)=>{ if(!ok) ko++; console.log((ok?'OK    ':'ECHEC ')+n+(d?'  -> '+d:'')); };

t('kk bis 2 a un schema de reglages', /kk_bis2:\{title:/.test(src));

// on extrait le bloc exact plutot que de deviner sa longueur
const iS=src.indexOf('kk_bis2:{title');
let jS=src.indexOf('{',iS), pS=0, kS=jS;
while(kS<src.length){ if(src[kS]==='{')pS++; else if(src[kS]==='}'){pS--; if(pS===0)break;} kS++; }
const schema=src.slice(iS,kS+1);
t('   pas de bande adaptative', !/kMult|rmsWin/.test(schema));
t('   seuils haut et bas reglables', /k:'upper'/.test(schema) && /k:'lower'/.test(schema));
t('   unite de temps reglable', /k:'tf'/.test(schema));
t('   seconde unite reglable', /k:'tf2'/.test(schema));
t('boutons de seconde ligne ecoutes',
  /menu\.querySelectorAll\('\[data-kkbis2b\]'\)\.forEach\(function\(el\)\{[\s\S]{0,120}addEventListener/.test(src));
t('   ils ecrivent sur kk_bis2', /state\.indicators\.kk_bis2\.tf2 = v/.test(src));
t('   sans toucher kk bis', /state\.indicators\.kk_bis\.tf2 = v/.test(src));

// les seuils modifies changent-ils le resultat ?
const kk2=state.indicators.kk_bis2;
kk2.tf='chart'; kk2.upper=75; kk2.lower=-75; state.cache={};
const a=getInd('kk_bis2');
kk2.upper=30; kk2.lower=-30; state.cache={};
const b=getInd('kk_bis2');
t('changer le seuil change les sorties',
  a.exits.length!==b.exits.length, a.exits.length+' -> '+b.exits.length);
kk2.upper=75; kk2.lower=-75;

// la seconde unite agit-elle ?
kk2.fusionTf2='union'; kk2.tf='1';
kk2.tf2='5'; state.cache={}; const c=getInd('kk_bis2');
kk2.tf2='30'; state.cache={}; const e=getInd('kk_bis2');
t('la seconde unite agit en fusion', c.exits.length!==e.exits.length,
  c.exits.length+' contre '+e.exits.length);
kk2.fusionTf2='off';

console.log('\n'+(ko===0?'kk bis 2 est reglable.':ko+' probleme(s).'));
