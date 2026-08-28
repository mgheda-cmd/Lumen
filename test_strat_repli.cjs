// Le panneau « stratégie du moment » doit pouvoir se réduire.
const fs=require('fs');
const src=fs.readFileSync('index.html','utf8');
const sc=src.match(/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/i)[1];
const grad={addColorStop(){}};
const faux=()=>new Proxy({measureText:()=>({width:30}),createLinearGradient:()=>grad,createRadialGradient:()=>grad},
 {get:(t,k)=>(k in t)?t[k]:(typeof k==='string'?()=>{}:undefined),set:()=>true});
const zone={innerHTML:'',style:{}};
const boutons={};
const el=(v)=>({value:v,style:{},dataset:{},getContext:faux,textContent:'',innerHTML:'',onclick:null,
 classList:{add(){},remove(){},contains:()=>false,toggle(){}},width:1000,height:800,
 addEventListener(){},querySelectorAll:()=>[],querySelector:()=>null,closest:()=>null});
global.window=global;global.requestAnimationFrame=()=>{};global.addEventListener=()=>{};global.removeEventListener=()=>{};
global.document={documentElement:el(''),
 getElementById:(i)=> i==='panneau-strat' ? zone : (boutons[i] = boutons[i] || el('')),
 querySelector:()=>el(''),querySelectorAll:()=>[el('')],addEventListener(){},createElement:()=>el(''),
 body:{appendChild(){},classList:{add(){},remove(){}}}};
const store={};
global.localStorage={getItem:k=>store[k]??null,setItem:(k,v)=>{store[k]=v;},removeItem:k=>{delete store[k];}};
global.navigator={userAgent:'node'};
global.getComputedStyle=()=>({getPropertyValue:()=>''});global.fetch=async()=>({ok:true,json:async()=>({})});
eval('var state;'+sc.replace('const state =','state ='));

let ko=0; const t=(n,ok,d)=>{ if(!ok) ko++; console.log((ok?'OK    ':'ECHEC ')+n+(d?'  -> '+d:'')); };
window.__balayageMM=[{entNom:'MM Base',sorNom:'Signal opposé MM',note:7,pnl:161,pf:1.94,trades:68,wr:40,dd:47,liq:0}];

window.majPanneauStrat();
t('deploye au depart', /La plus sûre/.test(zone.innerHTML));
t('   bouton reduire present', /id="strat-reduire"/.test(zone.innerHTML));

boutons['strat-reduire'].onclick();
t('replie apres un clic', !/La plus sûre/.test(zone.innerHTML), zone.innerHTML.slice(0,70));
t('   ne reste qu une etoile', /strat-ouvrir/.test(zone.innerHTML) && /\u2605/.test(zone.innerHTML));
t('   le panneau retrecit', zone.style.padding==='3px 7px' && zone.style.minWidth==='auto',
  zone.style.minWidth+' / '+zone.style.padding);
t('   l etat est conserve', store['lumen_strat_reduit']==='1');

boutons['strat-ouvrir'].onclick();
t('rouvre au clic sur l etoile', /La plus sûre/.test(zone.innerHTML));
t('   taille rendue', zone.style.minWidth==='186px');
t('   l etat est conserve', store['lumen_strat_reduit']==='0');

// il doit rester replie apres un rechargement
store['lumen_strat_reduit']='1';
delete window.__stratReduit;
window.majPanneauStrat();
t('replie au rechargement si c etait le choix', /strat-ouvrir/.test(zone.innerHTML));

console.log('\n'+(ko===0?'Le panneau se replie et se souvient.':ko+' probleme(s).'));
