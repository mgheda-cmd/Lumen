// Preavis : alerter quand le score entre en zone extreme.
const fs=require('fs');
const src=fs.readFileSync('index.html','utf8');
const sc=src.match(/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/i)[1];
const grad={addColorStop(){}};
const faux=()=>new Proxy({measureText:()=>({width:30}),createLinearGradient:()=>grad,createRadialGradient:()=>grad},
 {get:(t,k)=>(k in t)?t[k]:(typeof k==='string'?()=>{}:undefined),set:()=>true});
const el=(v)=>({value:v,style:{},dataset:{},getContext:faux,textContent:'',innerHTML:'',
 classList:{add(){},remove(){},contains:()=>false,toggle(){}},width:1000,height:800,
 addEventListener(){},querySelectorAll:()=>[],querySelector:()=>null,closest:()=>null,
 appendChild(){},removeChild(){},setAttribute(){},getAttribute:()=>null});
global.window=global;global.requestAnimationFrame=()=>{};global.addEventListener=()=>{};global.removeEventListener=()=>{};
global.document={documentElement:el(''),getElementById:()=>el(''),querySelector:()=>el(''),
 querySelectorAll:()=>[el('')],addEventListener(){},createElement:()=>el(''),
 body:{appendChild(){},classList:{add(){},remove(){}}}};
global.localStorage={getItem:()=>null,setItem(){},removeItem(){}};
global.navigator={userAgent:'node'};
global.getComputedStyle=()=>({getPropertyValue:()=>''});global.fetch=async()=>({ok:true,json:async()=>({})});
eval('var state;'+sc.replace('const state =','state =')+';global.__g=getInd;');
const tout=JSON.parse(fs.readFileSync('candles_ok.json','utf8')).slice(0,6000);
state.data=tout;state.symbol='BTCUSDT';state.tf=1;state.cache={};

let ko=0; const t=(n,ok,d)=>{ if(!ok) ko++; console.log((ok?'OK    ':'ECHEC ')+n+(d?'  -> '+d:'')); };

t('le reglage existe', /mmPreavisAlerts: true,/.test(src));
t('   sans ecraser les autres', /mmPivotsAlerts: true,/.test(src) && /exitAlerts: false,/.test(src));
t('la detection est branchee', /if\(phoneCfg\.mmPreavisAlerts !== false\)\{/.test(src));
t('   type PREAVIS', /type: 'PREAVIS'/.test(src));
t('   message dedie', /PR\\u00c9AVIS \$\{achat \? 'ACHAT' : 'VENTE'\}/.test(src));
t('   seuils lus sur kk bis 2', /state\.indicators\.kk_bis2 && state\.indicators\.kk_bis2\.lower/.test(src));

// on rejoue la regle sur les vraies donnees
const r=__g('strat_mm');
const net=r.net||[];
const sB=state.indicators.kk_bis2.lower, sH=state.indicators.kk_bis2.upper;
let bas=0, haut=0, maintien=0, dedans=false;
for(let q=1;q<net.length;q++){
  const a=net[q-1], b=net[q];
  if(a==null||b==null) continue;
  if(a>sB && b<=sB) bas++;
  if(a<sH && b>=sH) haut++;
  if(b<=sB){ if(dedans) maintien++; dedans=true; } else dedans=false;
}
t('preavis ACHAT detectes', bas>0, bas+' franchissements de zone basse');
t('preavis VENTE detectes', haut>0, haut+' franchissements de zone haute');
t('   pas une alerte par bougie', bas < maintien/2,
  bas+' alertes pour '+maintien+' bougies passees en zone');

// le preavis precede-t-il l entree ?
const entrees=(r.signals||[]).filter(x=>x.optKey==='base'&&x.dir===1).map(x=>x.i);
const zones=[]; for(let q=1;q<net.length;q++){ if(net[q-1]>sB&&net[q]<=sB) zones.push(q); }
let precede=0;
for(const e of entrees){ if(zones.some(z=>z<e && e-z<=60)) precede++; }
t('le preavis precede bien l entree', precede>entrees.length*0.5,
  precede+' entrees sur '+entrees.length+' precedees d un preavis');
const avances=[];
for(const e of entrees){ const z=zones.filter(x=>x<e&&e-x<=60).pop(); if(z!=null) avances.push(e-z); }
if(avances.length) console.log('       avance moyenne : '+
  (avances.reduce((a,b)=>a+b,0)/avances.length).toFixed(1)+' bougies');

console.log('\n'+(ko===0?'Les preavis fonctionnent.':ko+' probleme(s).'));
