const fs=require('fs');
const sc=fs.readFileSync('index.html','utf8').match(/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/i)[1];
const vals={'bta-ent':'classique','bta-sens':'tel','bta-dir':'both','bta-modeap':'chrono',
 'bta-sor':'toutes','bta-rang':'1','bta-marge':'0.02','bta-unite':'BASE','bta-lev':'200',
 'bta-tp':'0','bta-frais':'0.02','bta-jours':'7','bta-capital':'100','bta-mmode':'croise',
 'bta-mpct':'50','bta-mbonus':'20','bta-opp':'toujours'};
const el=(v)=>({value:v,style:{},textContent:'',innerHTML:'',dataset:{},
 classList:{add(){},remove(){},contains:()=>false,toggle(){}},
 getContext:()=>({measureText:()=>({width:10}),fillRect(){},clearRect(){},beginPath(){},moveTo(){},
  lineTo(){},stroke(){},fill(){},arc(){},save(){},restore(){},translate(){},rotate(){},scale(){}}),
 width:1000,height:600,addEventListener(){},querySelectorAll:()=>[],querySelector:()=>null,
 closest:()=>null,appendChild(){},removeChild(){},insertBefore(){},remove(){},setAttribute(){},
 getAttribute:()=>null,scrollIntoView(){},focus(){},click(){},children:[],childNodes:[],parentNode:null});
const c={}; for(const k in vals) c[k]=el(vals[k]);
const store={};
global.window=global; global.requestAnimationFrame=()=>{}; global.cancelAnimationFrame=()=>{};
global.addEventListener=()=>{}; global.removeEventListener=()=>{};
global.document={documentElement:el(''),getElementById:(i)=>c[i]||el(''),querySelector:()=>el(''),
 querySelectorAll:()=>[el('')],addEventListener(){},createElement:()=>el(''),
 body:{appendChild(){},classList:{add(){},remove(){}}}};
global.localStorage={getItem:(k)=>store[k]??null,setItem:(k,v)=>{store[k]=v;},removeItem:(k)=>{delete store[k];}};
global.navigator={userAgent:'node'};
let confirmations=0, invites=0;
global.confirm=()=>{confirmations++; return true;};
global.prompt=()=>{invites++; return 'Config test';};
global.alert=()=>{};
global.getComputedStyle=()=>({getPropertyValue:()=>''});
global.fetch=async()=>({ok:true,status:200,json:async()=>({})});
eval("var state;\n"+sc.replace('const state =','state ='));

let ko=0; const t=(n,ok)=>{ if(!ok) ko++; console.log((ok?'OK    ':'ECHEC ')+n); };

window.__btDernier={trades:42,wr:50,pf:1.2,pnl:10,dd:5};
window.enregistrerConfigBT();
t('enregistrement : invite affichée', invites===1);
const l=JSON.parse(store['lumen_bt_configs']||'[]');
t('enregistrement : 1 config en mémoire', l.length===1);

// On modifie les champs, puis on restaure
const avant={}; for(const k in vals) avant[k]=c[k].value;
c['bta-lev'].value='50'; c['bta-marge'].value='0.99'; c['bta-capital'].value='777';
c['bta-mmode'].value='isole'; c['bta-opp'].value='non';

try{ window.restaurerConfigBT(0); t('restauration : pas d exception', true); }
catch(e){ t('restauration : pas d exception ('+e.message+')', false); }
t('restauration : confirmation demandée', confirmations===1);

const champs=['bta-lev','bta-marge','bta-capital','bta-mmode','bta-opp'];
for(const k of champs)
  t('champ '+k.padEnd(12)+' restauré ('+avant[k]+')', c[k].value===avant[k]);

console.log('\n'+(ko===0?'La restauration fonctionne.':ko+' problème(s).'));
