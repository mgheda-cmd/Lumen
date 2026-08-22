const fs=require('fs');
const src=fs.readFileSync('index.html','utf8');
const sc=src.match(/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/i)[1];
const envois=[];
const grad={addColorStop(){}};
const faux=()=>new Proxy({measureText:()=>({width:30}),createLinearGradient:()=>grad,createRadialGradient:()=>grad},
 {get:(t,k)=>(k in t)?t[k]:(typeof k==='string'?()=>{}:undefined),set:()=>true});
const el=(v)=>{ const o={value:v,style:{},dataset:{},getContext:faux,textContent:'',innerHTML:'',checked:true,
 classList:{add(){},remove(){},contains:()=>false,toggle(){}},width:1000,height:800,
 addEventListener(){},removeEventListener(){},appendChild(){},removeChild(){},remove(){},
 setAttribute(){},getAttribute:()=>null,focus(){},click(){},scrollIntoView(){},
 children:[],childNodes:[],parentNode:null,onclick:null,
 getBoundingClientRect:()=>({width:0,height:0,left:0,top:0})};
 o.querySelector=()=>el(''); o.querySelectorAll=()=>[el('')]; o.closest=()=>null; return o; };
global.window=global;global.requestAnimationFrame=()=>{};global.addEventListener=()=>{};global.removeEventListener=()=>{};
global.document={documentElement:el(''),getElementById:()=>el(''),querySelector:()=>el(''),
 querySelectorAll:()=>[el('')],addEventListener(){},createElement:()=>el(''),
 body:{appendChild(){},classList:{add(){},remove(){}}}};
const store={};
global.localStorage={getItem:(k)=>store[k]??null,setItem:(k,v)=>{store[k]=v;},removeItem:(k)=>{delete store[k];}};
global.navigator={userAgent:'node'};
global.getComputedStyle=()=>({getPropertyValue:()=>''});
global.fetch=async(u)=>{ envois.push(String(u).slice(0,60)); return {ok:true,status:200,json:async()=>({})}; };
global.Notification=function(t,o){ envois.push('Notification: '+t); };
global.Notification.permission='granted';
global.Notification.requestPermission=async()=>'granted';
eval('var state;'+sc.replace('const state =','state =')
  +';global.__g=getInd;global.__check=checkAllAlerts;global.__cfg=getPhoneNotifConfig;');
/* Les filtres d'age comparent l'horodatage des bougies a l'heure REELLE :
   des donnees de juillet sont rejetees d'office. On recale la serie pour
   que la derniere bougie tombe maintenant, comme en direct. */
const brut0=JSON.parse(fs.readFileSync('candles_ok.json','utf8'));
const decalage=Date.now()-brut0[brut0.length-1].t;
for(const b of brut0) b.t+=decalage;
fs.writeFileSync('/tmp/recale.json', JSON.stringify(brut0));
const t8=brut0.slice(0,8000).map(b=>({...b}));
const d8=Date.now()-t8[t8.length-1].t;
for(const b of t8) b.t+=d8;
const tout=t8;
state.data=tout;state.symbol='BTCUSDT';state.tf=1;state.cache={};
global.toast=()=>{};

let ko=0; const t=(n,ok,d)=>{ if(!ok) ko++; console.log((ok?'OK    ':'ECHEC ')+n+(d?'  -> '+d:'')); };
const cfg=__cfg();
t('les notifications sont activees', cfg.enabled!==false, 'enabled='+cfg.enabled);
t('   role emetteur', cfg.role!=='recepteur', 'role='+cfg.role);
t('   alertes MM Base', cfg.mmBaseAlerts!==false);

// premier passage : initialisation, rien ne doit partir
envois.length=0;
__check();
t('1er passage : silencieux (initialisation)', envois.length===0, envois.length+' envoi(s)');

// on ajoute des bougies pour creer de nouveaux signaux
for(const n of [8200, 8600, 9000]){
  /* Chaque tranche doit se terminer MAINTENANT, sinon les filtres d'age la
     rejettent : ils comparent l'horodatage a l'heure reelle. */
  const tr=brut0.slice(0,n).map(b=>({...b}));
  const dec=Date.now()-tr[tr.length-1].t;
  for(const b of tr) b.t+=dec;
  state.data=tr;
  window.__alertsInitialized=false;
  state.cache={};
  envois.length=0;
  __check();
  console.log('   apres '+n+' bougies : '+envois.length+' envoi(s)'+(envois.length?' -> '+envois[0]:''));
}
console.log();
t('des notifications partent', envois.length>0, envois.length+' au dernier passage');
