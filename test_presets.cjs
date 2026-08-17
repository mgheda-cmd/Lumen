// Enregistrer et recharger les reglages d'un indicateur.
const fs=require('fs');
const src=fs.readFileSync('index.html','utf8');
const sc=src.match(/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/i)[1];
const grad={addColorStop(){}};
const faux=()=>new Proxy({measureText:()=>({width:30}),createLinearGradient:()=>grad,createRadialGradient:()=>grad},
 {get:(t,k)=>(k in t)?t[k]:(typeof k==='string'?()=>{}:undefined),set:()=>true});
const el=(v)=>({value:v,style:{},dataset:{},getContext:faux,textContent:'',innerHTML:'',
 classList:{add(){},remove(){},contains:()=>false,toggle(){}},width:1000,height:800,
 addEventListener(){},querySelectorAll:()=>[],querySelector:()=>null,closest:()=>null,
 appendChild(){},removeChild(){},insertBefore(){},remove(){},setAttribute(){},
 getAttribute:()=>null,children:[],childNodes:[],parentNode:null,focus(){},click(){},
 scrollIntoView(){},getBoundingClientRect:()=>({width:0,height:0,left:0,top:0})});
global.window=global;global.requestAnimationFrame=()=>{};global.addEventListener=()=>{};global.removeEventListener=()=>{};
global.document={documentElement:el(''),getElementById:()=>el(''),querySelector:()=>el(''),
 querySelectorAll:()=>[el('')],addEventListener(){},createElement:()=>el(''),
 body:{appendChild(){},classList:{add(){},remove(){}}}};
const store={};
global.localStorage={getItem:(k)=>store[k]??null,setItem:(k,v)=>{store[k]=v;},removeItem:(k)=>{delete store[k];}};
global.navigator={userAgent:'node'};
global.getComputedStyle=()=>({getPropertyValue:()=>''});global.fetch=async()=>({ok:true,json:async()=>({})});
let reponse=null; global.prompt=()=>reponse;
eval('var state;'+sc.replace('const state =','state =')+";global.__cfg=v=>{cfgInd=v;};");
global.toast=()=>{}; global.render=()=>{}; global.saveConfig=()=>{}; global.syncMenu=()=>{}; global.openCfg=()=>{};

let ko=0; const t=(n,ok,d)=>{ if(!ok) ko++; console.log((ok?'OK    ':'ECHEC ')+n+(d?'  -> '+d:'')); };

t('boutons dans le pied', /id="cfg-save"/.test(src) && /id="cfg-load"/.test(src));
t('fonctions disponibles',
  typeof window.enregistrerReglagesInd==='function' && typeof window.chargerReglagesInd==='function');

__cfg('kk_bis2');
state.indicators.kk_bis2.upper=88; state.indicators.kk_bis2.tf='5'; state.indicators.kk_bis2.on=true;
reponse='config A';
window.enregistrerReglagesInd();
const enr=JSON.parse(store['lumen_presets_ind']||'{}');
t('enregistrement effectue', !!(enr.kk_bis2 && enr.kk_bis2['config A']));
t('   sous le bon indicateur', Object.keys(enr)[0]==='kk_bis2');
t("   l'etat d'activation n'est pas enregistre", !('on' in enr.kk_bis2['config A'].reglages));
t('   les valeurs y sont', enr.kk_bis2['config A'].reglages.upper===88);

// on modifie, puis on recharge
state.indicators.kk_bis2.upper=30; state.indicators.kk_bis2.tf='30'; state.indicators.kk_bis2.on=false;
reponse='1';
window.chargerReglagesInd();
t('rechargement : valeurs restaurees',
  state.indicators.kk_bis2.upper===88 && state.indicators.kk_bis2.tf==='5',
  'upper='+state.indicators.kk_bis2.upper+' tf='+state.indicators.kk_bis2.tf);
t("   l'affichage reste votre choix", state.indicators.kk_bis2.on===false);

// deuxieme jeu, puis suppression
state.indicators.kk_bis2.upper=55; reponse='config B';
window.enregistrerReglagesInd();
let e2=JSON.parse(store['lumen_presets_ind']);
t('deux jeux coexistent', Object.keys(e2.kk_bis2).length===2, Object.keys(e2.kk_bis2).join(', '));
reponse='s2';
window.chargerReglagesInd();
e2=JSON.parse(store['lumen_presets_ind']);
t('suppression par « s » + numero', Object.keys(e2.kk_bis2).length===1, Object.keys(e2.kk_bis2).join(', '));

// cloisonnement par indicateur
__cfg('kk_bis'); reponse='autre';
window.enregistrerReglagesInd();
const e3=JSON.parse(store['lumen_presets_ind']);
t('cloisonne par indicateur', !!e3.kk_bis && !!e3.kk_bis2, Object.keys(e3).join(', '));

// aucun jeu : message, pas de plantage
__cfg('rsi'); reponse=null;
let survit=true; try{ window.chargerReglagesInd(); }catch(e){ survit=false; }
t('aucun jeu enregistre : pas de plantage', survit);

console.log('\n'+(ko===0?'Les reglages s enregistrent et se rechargent.':ko+' probleme(s).'));
