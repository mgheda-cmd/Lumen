// kk bis et kk bis 2 doivent etre etanches l'un a l'autre.
const fs=require('fs');
const src=fs.readFileSync('index.html','utf8');
const sc=src.match(/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/i)[1];
const el=(v)=>({value:v,style:{},textContent:'',innerHTML:'',dataset:{},
 classList:{add(){},remove(){},contains:()=>false,toggle(){}},
 getContext:()=>({measureText:()=>({width:10}),fillRect(){},clearRect(){},beginPath(){},moveTo(){},
  lineTo(){},stroke(){},fill(){},arc(){},save(){},restore(){},translate(){},rotate(){},scale(){},
  setLineDash(){},closePath(){},strokeRect(){},fillText(){},roundRect(){},rect(){},clip(){}}),
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

// 1. Le dessin n'est plus cable en dur sur kk bis
const iD=src.indexOf('function drawKKBisSub');
let jD=src.indexOf('{',iD), pD=0, kD=jD;
while(kD<src.length){ if(src[kD]==='{')pD++; else if(src[kD]==='}'){pD--; if(pD===0)break;} kD++; }
const dessin=src.slice(iD,kD+1);
const enDur=(dessin.match(/'kk_bis'/g)||[]).length;
t('dessin generique', enDur<=1, enDur+" reference(s) en dur (1 attendue : le repli)");
t('   il recoit une cle', /function drawKKBisSub\(p, s, e, cw, cle\)/.test(src));
t('   les deux panneaux la transmettent',
  /kk_bis:\(p,s,e,cw\)=>drawKKBisSub\(p,s,e,cw,'kk_bis'\)/.test(src) &&
  /kk_bis2:\(p,s,e,cw\)=>drawKKBisSub\(p,s,e,cw,'kk_bis2'\)/.test(src));

// 2. Etancheite des donnees
const kk=state.indicators.kk_bis, kk2=state.indicators.kk_bis2;
kk.tf='chart'; kk2.tf='chart'; state.cache={};
const a=getInd('kk_bis'), b=getInd('kk_bis2');
t('seuils adaptatifs pour kk bis', new Set(a.up.filter(v=>v!=null)).size>10,
  new Set(a.up.filter(v=>v!=null)).size+' valeurs');
t('seuils fixes pour kk bis 2', new Set(b.up.filter(v=>v!=null)).size===1,
  [...new Set(b.up.filter(v=>v!=null))].slice(0,2).join(', '));

// 3. Changer kk bis 2 ne touche pas kk bis
const avant=a.exits.length;
kk2.tf='15'; state.cache={};
const b2=getInd('kk_bis2'), a2=getInd('kk_bis');
t('changer l unite de kk bis 2 agit sur lui', b2.exits.length!==b.exits.length,
  b.exits.length+' -> '+b2.exits.length);
t('   sans toucher kk bis', a2.exits.length===avant, avant+' contre '+a2.exits.length);

// 4. Divergences, sommets, creux presents
t('kk bis 2 produit des divergences', Array.isArray(b2.divs), (b2.divs||[]).length+' divergence(s)');
t('   des sommets et des creux',
  Array.isArray(b2.peaks)&&Array.isArray(b2.troughs),
  (b2.peaks||[]).length+' sommets, '+(b2.troughs||[]).length+' creux');
t('   des sorties', (b2.exits||[]).length>0, (b2.exits||[]).length+' sorties');
kk2.tf='chart';

console.log('\n'+(ko===0?'Les deux indicateurs sont etanches.':ko+' probleme(s).'));
