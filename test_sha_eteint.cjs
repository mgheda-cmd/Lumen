// Le Heikin Ashi ne doit plus saturer le prix.
const fs=require('fs');
const src=fs.readFileSync('index.html','utf8');
const sc=src.match(/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/i)[1];
const grad={addColorStop(){}};
const faux=()=>new Proxy({measureText:()=>({width:30}),createLinearGradient:()=>grad,createRadialGradient:()=>grad},
 {get:(t,k)=>(k in t)?t[k]:(typeof k==='string'?()=>{}:undefined),set:()=>true});
const el=v=>({value:v,style:{},dataset:{},getContext:faux,classList:{add(){},remove(){},contains:()=>false,toggle(){}},width:1000,height:800,addEventListener(){},querySelectorAll:()=>[],querySelector:()=>null,closest:()=>null});
global.window=global;global.requestAnimationFrame=()=>{};global.addEventListener=()=>{};global.removeEventListener=()=>{};
global.document={documentElement:el(''),getElementById:()=>el(''),querySelector:()=>el(''),querySelectorAll:()=>[el('')],addEventListener(){},createElement:()=>el(''),body:{appendChild(){},classList:{add(){},remove(){}}}};
const store={};
global.localStorage={getItem:k=>store[k]??null,setItem:(k,v)=>{store[k]=v;},removeItem:k=>{delete store[k];}};
global.navigator={userAgent:'node'};
global.getComputedStyle=()=>({getPropertyValue:()=>''});global.fetch=async()=>({ok:true,json:async()=>({})});
eval('var state;'+sc.replace('const state =','state =')+';global.__load=(typeof loadConfig==="function")?loadConfig:null;');

let ko=0; const t=(n,ok,d)=>{ if(!ok) ko++; console.log((ok?'OK    ':'ECHEC ')+n+(d?'  -> '+d:'')); };

console.log('== Par defaut ==');
t('les trois sont eteints', ['sha','sha2','sha3'].every(k=>state.indicators[k].on===false));

console.log('\n== Une configuration enregistree qui l activait ==');
/* La bascule s'est deja jouee au demarrage du script : on efface sa trace
   pour simuler un utilisateur qui arrive avec l'ancienne configuration. */
delete store['lumen_sha_eteint_une_fois'];
state.indicators.sha.on=true; state.indicators.sha2.on=true;
if(__load) __load();
t('la bascule les eteint', state.indicators.sha.on===false && state.indicators.sha2.on===false);
t('   elle se note', store['lumen_sha_eteint_une_fois']==='1');

console.log('\n== Un choix volontaire est respecte ==');
state.indicators.sha.on=true;
if(__load) __load();
t('la bascule ne rejoue pas', state.indicators.sha.on===true);

console.log('\n== La fonction reste disponible ==');
t('le dessin existe toujours', /function drawSHA/.test(src));
t('   et son appel', /if\(vis\(kSha\)\) drawSHA\(kSha/.test(src));
t('   reglable au panneau', /k:'opacite'/.test(src));

console.log('\n'+(ko===0?'Le Heikin Ashi ne s affiche plus sans qu on le demande.':ko+' probleme(s).'));
