// La bascule doit enregistrer, sinon le Heikin Ashi revient a chaque fois.
const fs=require('fs');
const src=fs.readFileSync('index.html','utf8');
const sc=src.match(/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/i)[1];
const grad={addColorStop(){}};
const faux=()=>new Proxy({measureText:()=>({width:30}),createLinearGradient:()=>grad,createRadialGradient:()=>grad},
 {get:(t,k)=>(k in t)?t[k]:(typeof k==='string'?()=>{}:undefined),set:()=>true});
const el=v=>({value:v,style:{},dataset:{},getContext:faux,classList:{add(){},remove(){},contains:()=>false,toggle(){}},width:1400,height:900,addEventListener(){},querySelectorAll:()=>[],querySelector:()=>null,closest:()=>null});
global.window=global;global.requestAnimationFrame=()=>{};global.addEventListener=()=>{};global.removeEventListener=()=>{};
global.document={documentElement:el(''),getElementById:()=>el(''),querySelector:()=>el(''),querySelectorAll:()=>[el('')],addEventListener(){},createElement:()=>el(''),body:{appendChild(){},classList:{add(){},remove(){}}}};
const store={};
global.localStorage={getItem:k=>store[k]??null,setItem:(k,v)=>{store[k]=v;},removeItem:k=>{delete store[k];}};
global.navigator={userAgent:'node'};
global.getComputedStyle=()=>({getPropertyValue:()=>''});global.fetch=async()=>({ok:true,json:async()=>[]});
eval('var state;'+sc.replace('const state =','state =')
  +';global.__load=loadConfig;global.__save=saveConfig;global.__vis=vis;');
state.data=JSON.parse(fs.readFileSync('candles_synth.json','utf8')).slice(0,500);
state.symbol='BTCUSDT';state.tf=1;

let ko=0; const t=(n,ok,d)=>{ if(!ok) ko++; console.log((ok?'OK    ':'ECHEC ')+n+(d?'  -> '+d:'')); };

console.log('== L ancien drapeau ne bloque plus ==');
t('nouveau drapeau utilise', /lumen_sha_eteint_v2/.test(src));
t('   l ancien n est plus consulte', !/lumen_sha_eteint_une_fois'\) !== '1'/.test(src));

console.log('\n== La bascule enregistre ==');
t('elle appelle saveConfig', /if\(change && typeof saveConfig === 'function'\) setTimeout\(saveConfig, 0\)/.test(src));
t('   celle de l Impulse MACD aussi',
  /lumen_imp_allume_une_fois','1'\);[\s\S]{0,200}setTimeout\(saveConfig, 0\)/.test(src));

console.log('\n== Simulation d un utilisateur avec l ancien drapeau ==');
store['lumen_sha_eteint_une_fois']='1';          // il a deja vu l ancienne version
delete store['lumen_sha_eteint_v2'];
state.indicators.sha.on=true;                    // sa config le rallume
__load();
t('le Heikin Ashi est eteint malgre l ancien drapeau', state.indicators.sha.on===false);
t('   le nouveau drapeau est pose', store['lumen_sha_eteint_v2']==='1');
t('   il ne s affiche plus', __vis('sha')===false);

console.log('\n== Au rechargement suivant ==');
state.indicators.sha.on=true;                    // choix volontaire
__load();
t('un choix volontaire est respecte', state.indicators.sha.on===true);

console.log('\n'+(ko===0?'Le Heikin Ashi ne reviendra plus tout seul.':ko+' probleme(s).'));
