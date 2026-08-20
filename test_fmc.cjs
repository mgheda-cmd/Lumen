// Flow Momentum Composite : moteur, branchement, dessin, reglages.
const fs=require('fs');
const src=fs.readFileSync('index.html','utf8');
const sc=src.match(/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/i)[1];
const grad={addColorStop(){}};
const dessins=[];
const faux=()=>new Proxy({measureText:()=>({width:30}),createLinearGradient:()=>grad,
 createRadialGradient:()=>grad,fillText:(t)=>{if(typeof t==='string')dessins.push(t);}},
 {get:(t,k)=>(k in t)?t[k]:(typeof k==='string'?()=>{}:undefined),set:()=>true});
const el=(v)=>({value:v,style:{},dataset:{},getContext:faux,textContent:'',innerHTML:'',
 classList:{add(){},remove(){},contains:()=>false,toggle(){}},width:1000,height:800,
 addEventListener(){},querySelectorAll:()=>[],querySelector:()=>null,closest:()=>null});
global.window=global;global.requestAnimationFrame=()=>{};global.addEventListener=()=>{};global.removeEventListener=()=>{};
global.document={documentElement:el(''),getElementById:()=>el(''),querySelector:()=>el(''),
 querySelectorAll:()=>[el('')],addEventListener(){},createElement:()=>el(''),
 body:{appendChild(){},classList:{add(){},remove(){}}}};
global.localStorage={getItem:()=>null,setItem(){},removeItem(){}};
global.navigator={userAgent:'node'};
global.getComputedStyle=()=>({getPropertyValue:()=>''});global.fetch=async()=>({ok:true,json:async()=>({})});
eval('var state;'+sc.replace('const state =','state =')
  +';global.__g=getInd;global.__calc=calc;global.__draw=drawFmcSub;');
const tout=JSON.parse(fs.readFileSync('candles_ok.json','utf8')).slice(0,6000);
state.data=tout;state.symbol='BTCUSDT';state.tf=1;state.cache={};
global.ctx=faux();global.W=1000;global.H=800;global.AXIS_W=60;global.AXIS_H=24;

let ko=0; const t=(n,ok,d)=>{ if(!ok) ko++; console.log((ok?'OK    ':'ECHEC ')+n+(d?'  -> '+d:'')); };

console.log('== Branchement ==');
t('reglages presents', !!state.indicators.fmc);
t('   eteint par defaut', state.indicators.fmc.on===false);
t('schema de reglages', /fmc:\{title:'Flow Momentum Composite'/.test(src));
t('entree de menu', /data-ind="fmc"/.test(src));
t('calcul branche', /if\(key==='fmc'\)/.test(src));
t('panneau branche', /vis\('fmc'\)/.test(src));
t('dessin dans la table', /fmc:\(p,s,e,cw\)=>drawFmcSub/.test(src));
t('dans la liste de recalcul', /'kk_bis2','fmc'\]/.test(src));

console.log('\n== Calcul ==');
const t0=Date.now(); const r=__g('fmc'); const ms=Date.now()-t0;
t('getInd repond', !!(r&&r.core&&r.core.length), ms+' ms');
t('   rapide', ms<400, ms+' ms');
t('   signaux produits', r.buys.length>0&&r.sells.length>0, r.buys.length+' achats, '+r.sells.length+' ventes');
t('   contrariens', r.contraLong.length>0&&r.contraShort.length>0,
  r.contraLong.length+' / '+r.contraShort.length);
t('   divergences', Array.isArray(r.divBull)&&Array.isArray(r.divBear),
  r.divBull.length+' / '+r.divBear.length);

console.log('\n== Les reglages agissent ==');
const n0=r.buys.length;
state.indicators.fmc.scoreThresh=100; state.cache={};
t('le seuil agit', __g('fmc').buys.length<n0, n0+' -> '+__g('fmc').buys.length);
state.indicators.fmc.scoreThresh=80;
/* Le seuil est un pourcentage du total des poids : retirer un seul module
   peut laisser le compte inchangé, les autres compensant. On isole donc un
   module à la fois pour vérifier que les poids sont bien lus. */
const parModule={};
for(const [nom,w] of [['momentum',{wMom:100,wFlow:0,wTrend:0,wKnn:0,wWave:0}],
                      ['flux',{wMom:0,wFlow:100,wTrend:0,wKnn:0,wWave:0}],
                      ['structure',{wMom:0,wFlow:0,wTrend:100,wKnn:0,wWave:0}],
                      ['knn',{wMom:0,wFlow:0,wTrend:0,wKnn:100,wWave:0}]]){
  parModule[nom]=__calc.fmc(tout,w).buys.length;
}
const valeurs=Object.values(parModule);
t('les poids agissent', new Set(valeurs).size>1,
  Object.entries(parModule).map(([k,v])=>k+' '+v).join(', '));

console.log('\n== Dessin ==');
dessins.length=0;
let exc=null;
try{ __draw({key:'fmc',y:0,h:200,lo:0,hi:100}, 0, 5999, 4, 'fmc'); }
catch(e){ exc=e.message.slice(0,70); }
t('le panneau se dessine', !exc, exc||'aucune exception');
const titre=dessins.find(x=>/^FMC/.test(x));
t('   titre informatif', !!titre, titre||'aucun');

console.log('\n'+(ko===0?'FMC est en place.':ko+' probleme(s).'));
